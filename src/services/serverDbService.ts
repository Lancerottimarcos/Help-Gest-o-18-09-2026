import { Client, DemandItem, Service, BudgetProposal, Invoice, ClientActivity, TeamMember, KanbanColumn } from '../types';

export interface AppDatabasePayload {
  clients?: Client[];
  demands?: DemandItem[];
  services?: Service[];
  proposals?: BudgetProposal[];
  invoices?: Invoice[];
  activities?: ClientActivity[];
  teamMembers?: TeamMember[];
  kanbanColumns?: KanbanColumn[];
  masterPasswordHash?: string;
  securityConfig?: any;
  newMemberDefaultPermissions?: any;
  collaboratorRules?: any;
  updatedAt?: number;
}

export interface DatabaseApiResponse {
  success: boolean;
  data: AppDatabasePayload | null;
  timestamp?: number;
  error?: string;
}

export type SyncErrorCategory = 
  | 'NETWORK' 
  | 'CREDENTIALS_MISSING' 
  | 'PERMISSION_DENIED' 
  | 'TABLE_NOT_FOUND' 
  | 'SCHEMA_MISMATCH' 
  | 'TIMEOUT' 
  | 'STORAGE_RESTRICTED' 
  | 'UNKNOWN';

export interface SupabaseSyncErrorEvent {
  id: string;
  timestamp: string; // ISO string
  operation: string; // e.g. 'FETCH_CLIENTS', 'FETCH_DEMANDS', 'SYNC_ALL'
  message: string;
  category: SyncErrorCategory;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  details?: any;
  incognitoContext: {
    isIncognitoSuspected: boolean;
    storageAvailable: boolean;
    hasSupabaseCredentials: boolean;
    storageReason: string;
  };
  recommendedAction: string;
}

// In-memory ring buffer of sync errors (latest 100)
const syncErrorHistory: SupabaseSyncErrorEvent[] = [];
const syncErrorListeners = new Set<(event: SupabaseSyncErrorEvent) => void>();

/**
 * Detecta se o ambiente atual está em navegação anônima / privada
 * ou com restrições severas de localStorage/IndexedDB.
 */
function probeIncognitoEnvironment(): {
  isIncognitoSuspected: boolean;
  storageAvailable: boolean;
  hasSupabaseCredentials: boolean;
  storageReason: string;
} {
  let storageAvailable = false;
  let isIncognitoSuspected = false;
  let storageReason = 'Acesso normal a storage';

  if (typeof window === 'undefined') {
    return {
      isIncognitoSuspected: false,
      storageAvailable: false,
      hasSupabaseCredentials: false,
      storageReason: 'SSR/Servidor',
    };
  }

  try {
    const probeKey = `__incognito_probe_${Date.now()}`;
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    storageAvailable = true;
  } catch (err: any) {
    storageAvailable = false;
    isIncognitoSuspected = true;
    storageReason = 'LocalStorage bloqueado ou inacessível por política restritiva de privacidade';
  }

  // Verificação de credenciais do Supabase
  let hasSupabaseCredentials = false;
  try {
    const url = window.localStorage?.getItem('supabase_url') || (import.meta as any).env?.VITE_SUPABASE_URL;
    const key = window.localStorage?.getItem('supabase_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    hasSupabaseCredentials = Boolean(url && key && !url.includes('SEU_PROJETO_AQUI'));
  } catch {
    hasSupabaseCredentials = false;
  }

  // Em guia anônima sem credenciais no localStorage, não há cache persistente
  if (!isIncognitoSuspected && storageAvailable) {
    const hasCachedClients = Boolean(window.localStorage?.getItem('agency_clients'));
    const hasCachedUser = Boolean(window.localStorage?.getItem('help_agency_user'));
    if (!hasCachedClients && !hasCachedUser && !hasSupabaseCredentials) {
      isIncognitoSuspected = true;
      storageReason = 'Guia anônima ou nova sessão limpa sem cache prévio';
    }
  }

  return {
    isIncognitoSuspected,
    storageAvailable,
    hasSupabaseCredentials,
    storageReason,
  };
}

/**
 * Classifica a categoria do erro e gera recomendação técnica inteligente
 */
function classifySyncError(
  operation: string,
  error: any,
  isIncognito: boolean,
  hasCredentials: boolean
): { category: SyncErrorCategory; recommendedAction: string } {
  const errMsg = String(error?.message || error?.error_description || error || '').toLowerCase();
  const errCode = String(error?.code || '').toLowerCase();

  if (!hasCredentials || errMsg.includes('missing supabase credentials') || errMsg.includes('não configurado')) {
    return {
      category: 'CREDENTIALS_MISSING',
      recommendedAction: isIncognito
        ? 'Na guia anônima, as credenciais não foram herdadas do localStorage normal. Sincronize com a base central do servidor (/api/database) ou informe a chave do Supabase nas configurações.'
        : 'Configure a URL e chave anônima do Supabase nas configurações ou configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    };
  }

  if (errMsg.includes('failed to fetch') || errMsg.includes('network') || errMsg.includes('load failed') || errMsg.includes('cors')) {
    return {
      category: 'NETWORK',
      recommendedAction: isIncognito
        ? 'Falha de rede ou bloqueador de rastreadores da guia anônima bloqueou a conexão com o Supabase. O fallback automático para /api/database deve ser acionado.'
        : 'Verifique sua conexão com a internet ou se extensões com bloqueio de scripts/firewall estão impedindo requisições ao domínio do Supabase.',
    };
  }

  if (errMsg.includes('permission denied') || errMsg.includes('jwt') || errCode === '42501' || errMsg.includes('row-level security')) {
    return {
      category: 'PERMISSION_DENIED',
      recommendedAction: 'Acesso recusado pelas políticas RLS (Row Level Security) do Supabase. Verifique se as policies de leitura/escrita permitem acesso anônimo ou execute o script de migração SQL.',
    };
  }

  if (errMsg.includes('relation') && (errMsg.includes('does not exist') || errMsg.includes('not found')) || errCode === '42p01') {
    return {
      category: 'TABLE_NOT_FOUND',
      recommendedAction: 'Tabela ausente no banco de dados Supabase. Execute o script SUPABASE_MIGRATION_SQL no Editor SQL do console Supabase para criar as tabelas necessárias.',
    };
  }

  if (errMsg.includes('timeout') || errMsg.includes('abort')) {
    return {
      category: 'TIMEOUT',
      recommendedAction: 'A requisição demorou muito para responder. Em guia anônima, proxies ou limites de concorrência podem aumentar a latência. Usando fallback local.',
    };
  }

  return {
    category: 'UNKNOWN',
    recommendedAction: 'Analise o objeto de erro detalhado impresso no console ou execute "window.__SUPABASE_SYNC_MONITOR__.printReport()" para mais detalhes.',
  };
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingPayload: Partial<AppDatabasePayload> = {};

export const serverDbService = {
  /**
   * Monitor em tempo real: registra falhas de sincronização do Supabase
   * com saída formatada de alto contraste no console do navegador e histórico.
   */
  recordSupabaseSyncError(params: {
    operation: string;
    error: any;
    details?: any;
    severity?: 'WARNING' | 'ERROR' | 'CRITICAL';
  }): SupabaseSyncErrorEvent {
    const { operation, error, details, severity = 'ERROR' } = params;
    const envContext = probeIncognitoEnvironment();
    const { category, recommendedAction } = classifySyncError(
      operation,
      error,
      envContext.isIncognitoSuspected,
      envContext.hasSupabaseCredentials
    );

    const errorMessage = typeof error === 'string'
      ? error
      : (error?.message || error?.statusText || JSON.stringify(error) || 'Erro desconhecido');

    const event: SupabaseSyncErrorEvent = {
      id: `sync-err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      operation,
      message: errorMessage,
      category,
      severity,
      details: details || error,
      incognitoContext: envContext,
      recommendedAction,
    };

    // Mantém limite de histórico no buffer em memória
    syncErrorHistory.unshift(event);
    if (syncErrorHistory.length > 100) {
      syncErrorHistory.pop();
    }

    // Saída em tempo real no console com formatação e cores para diagnóstico imediato
    try {
      const modeLabel = envContext.isIncognitoSuspected ? '🕵️ GUIA ANÔNIMA DETECTADA' : '🌐 NAVEGAÇÃO PADRÃO';
      const badgeBg = severity === 'CRITICAL' ? '#991b1b' : severity === 'ERROR' ? '#b91c1c' : '#b45309';
      
      console.groupCollapsed(
        `%c[SUPABASE SYNC MONITOR]%c %c${severity}%c ${operation} - ${errorMessage.slice(0, 60)}${errorMessage.length > 60 ? '...' : ''} (${modeLabel})`,
        'background: #142142; color: #fab518; font-weight: 800; padding: 2px 6px; border-radius: 4px;',
        '',
        `background: ${badgeBg}; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;`,
        'color: #e2e8f0; font-weight: 600;'
      );

      console.info('%c🕒 Horário:', 'font-weight: bold; color: #94a3b8;', event.timestamp);
      console.info('%c📍 Operação:', 'font-weight: bold; color: #38bdf8;', operation);
      console.info('%c🏷️ Categoria:', 'font-weight: bold; color: #a855f7;', category);
      console.info('%c⚠️ Mensagem de Erro:', 'font-weight: bold; color: #f87171;', errorMessage);
      console.info('%c🕵️ Diagnóstico de Ambiente:', 'font-weight: bold; color: #fbbf24;', {
        guiaAnonimaSuspeita: envContext.isIncognitoSuspected,
        localStorageDisponivel: envContext.storageAvailable,
        temCredenciaisSupabase: envContext.hasSupabaseCredentials,
        motivoStorage: envContext.storageReason,
      });
      console.info('%c💡 Ação Recomendada:', 'font-weight: bold; color: #4ade80;', recommendedAction);

      if (details) {
        console.info('%c📦 Detalhes Técnicos / Payload:', 'font-weight: bold; color: #cbd5e1;', details);
      }
      if (error && typeof error === 'object' && error.stack) {
        console.info('%c📑 Stack Trace:', 'font-weight: bold; color: #64748b;', error.stack);
      }
      
      console.info(
        '%c🔍 Dica de Depuração: Digite "window.__SUPABASE_SYNC_MONITOR__.printReport()" no console para relatório completo.',
        'color: #94a3b8; font-style: italic;'
      );
      console.groupEnd();
    } catch {
      // Falhas no console logging nunca devem quebrar a aplicação
    }

    // Notifica subscribers (listeners)
    syncErrorListeners.forEach((fn) => {
      try {
        fn(event);
      } catch (subErr) {
        console.warn('Erro em listener do sync monitor:', subErr);
      }
    });

    return event;
  },

  /**
   * Retorna todo o histórico de falhas de sincronização capturadas
   */
  getSupabaseSyncErrors(): SupabaseSyncErrorEvent[] {
    return [...syncErrorHistory];
  },

  /**
   * Limpa o histórico de erros
   */
  clearSupabaseSyncErrors(): void {
    syncErrorHistory.length = 0;
  },

  /**
   * Permite componentes assinarem eventos de erro de sincronização em tempo real
   */
  subscribeSupabaseSyncError(callback: (event: SupabaseSyncErrorEvent) => void): () => void {
    syncErrorListeners.add(callback);
    return () => {
      syncErrorListeners.delete(callback);
    };
  },

  /**
   * Imprime uma tabela consolidada de diagnóstico no console
   */
  printSupabaseDiagnosticReport(): void {
    const env = probeIncognitoEnvironment();
    console.log(
      '%c==================== RELATÓRIO DO MONITOR DE SINCRONIZAÇÃO SUPABASE ====================',
      'background: #142142; color: #fab518; font-weight: bold; padding: 4px 8px; font-size: 13px;'
    );
    console.log('Ambiente:', env.isIncognitoSuspected ? '🕵️ GUIA ANÔNIMA / PRIVADA' : '🌐 NAVEGADOR NORMAL');
    console.log('Storage Disponível:', env.storageAvailable ? '✅ SIM' : '❌ NÃO');
    console.log('Credenciais Supabase Detectadas:', env.hasSupabaseCredentials ? '✅ SIM' : '❌ NÃO');
    console.log('Total de Falhas Registradas:', syncErrorHistory.length);

    if (syncErrorHistory.length === 0) {
      console.log('%cNenhuma falha de sincronização registrada nesta sessão.', 'color: #4ade80; font-weight: bold;');
    } else {
      console.table(
        syncErrorHistory.map((e) => ({
          Horário: e.timestamp.split('T')[1]?.slice(0, 8),
          Operação: e.operation,
          Categoria: e.category,
          Severidade: e.severity,
          Erro: e.message.slice(0, 50),
          Ação: e.recommendedAction.slice(0, 60) + '...',
        }))
      );
    }
    console.log('%c=========================================================================================', 'color: #64748b;');
  },

  /**
   * Retorna o status atual do ambiente (detecta guia anônima)
   */
  getIncognitoStatus() {
    return probeIncognitoEnvironment();
  },

  /**
   * Busca os dados compartilhados do servidor da aplicação
   */
  async fetchDatabase(): Promise<AppDatabasePayload | null> {
    try {
      const res = await fetch('/api/database');
      if (!res.ok) return null;
      const json: DatabaseApiResponse = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('Servidor central não respondeu ao fetchDatabase:', err);
    }
    return null;
  },

  /**
   * Salva os dados no servidor da aplicação de forma persistente (compartilhada entre navegadores e computadores)
   * Utiliza debounce para evitar requisições em cascata.
   */
  saveDatabase(payload: Partial<AppDatabasePayload>, immediate = false): Promise<boolean> {
    return new Promise((resolve) => {
      pendingPayload = { ...pendingPayload, ...payload };

      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }

      const executeSave = async () => {
        try {
          const bodyToSend = {
            ...pendingPayload,
            updatedAt: Date.now(),
          };
          pendingPayload = {};

          const res = await fetch('/api/database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyToSend),
          });

          if (res.ok) {
            resolve(true);
            return;
          }
        } catch (err) {
          console.warn('Erro ao salvar no servidor central:', err);
        }
        resolve(false);
      };

      if (immediate) {
        executeSave();
      } else {
        saveTimeout = setTimeout(executeSave, 400);
      }
    });
  },

  /**
   * Busca um orçamento público específico para o cliente visualizar (com suporte a fallback para base central)
   */
  async fetchPublicProposal(proposalId: string): Promise<{ proposal: BudgetProposal; client?: Client } | null> {
    if (!proposalId) return null;
    const cleanId = encodeURIComponent(proposalId.trim());

    // 1. Tenta endpoint direto dedicado
    try {
      const res = await fetch(`/api/public/proposal/${cleanId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.proposal) {
          return { proposal: json.proposal, client: json.client };
        }
      }
    } catch {}

    // 2. Fallback: busca da base geral
    try {
      const db = await this.fetchDatabase();
      if (db && Array.isArray(db.proposals)) {
        const targetId = proposalId.trim().toLowerCase();
        const found = db.proposals.find(
          (p) =>
            p.id.toLowerCase() === targetId ||
            p.code.toLowerCase() === targetId ||
            (p.shareToken && p.shareToken.toLowerCase() === targetId)
        );

        if (found) {
          const client = db.clients?.find(
            (c) =>
              (found.clientId && c.id === found.clientId) ||
              c.companyName.toLowerCase() === found.clientName.toLowerCase() ||
              c.name.toLowerCase() === found.clientName.toLowerCase()
          );
          return { proposal: found, client };
        }
      }
    } catch {}

    return null;
  },

  /**
   * Registra a decisão do cliente em um orçamento público
   */
  async submitPublicProposalDecision(
    proposalId: string,
    decisionData: {
      action: 'Aprovado' | 'Recusado' | 'Ajuste';
      signerName?: string;
      signerRole?: string;
      signerEmail?: string;
      signerPhone?: string;
      notes?: string;
      reason?: string;
      feedback?: string;
    }
  ): Promise<BudgetProposal | null> {
    try {
      const cleanId = encodeURIComponent(proposalId.trim());
      const res = await fetch(`/api/public/proposal/${cleanId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionData),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.proposal) {
          return json.proposal;
        }
      }
    } catch (err) {
      console.warn('Erro ao enviar decisão para o servidor:', err);
    }
    return null;
  },
};

// Disponibiliza no objeto window para diagnóstico rápido via DevTools Console na guia anônima
if (typeof window !== 'undefined') {
  (window as any).__SUPABASE_SYNC_MONITOR__ = {
    getHistory: () => serverDbService.getSupabaseSyncErrors(),
    printReport: () => serverDbService.printSupabaseDiagnosticReport(),
    clear: () => serverDbService.clearSupabaseSyncErrors(),
    getStatus: () => serverDbService.getIncognitoStatus(),
  };
  (window as any).serverDbService = serverDbService;
}
