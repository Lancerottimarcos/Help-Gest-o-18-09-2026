import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  CloudUpload, 
  Key, 
  Server,
  Sparkles,
  ArrowDownToLine,
  HelpCircle,
  Terminal,
  Trash2,
  Table,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  getSupabaseUrl, 
  getSupabaseAnonKey, 
  saveSupabaseCredentials, 
  getSupabaseConfigStatus,
  syncSupabaseCredentialsWithServer,
  validateSupabaseUrl,
  validateSupabaseAnonKey,
  runComprehensiveConnectionTest,
  ComprehensiveTestResult,
  ConnectionTestLog,
  SupabaseConfigStatus
} from '../lib/supabaseClient';
import { 
  supabaseService, 
  SUPABASE_SQL_SCHEMA, 
  SUPABASE_MIGRATION_SQL 
} from '../services/supabaseService';
import { DemandItem, Client, Service, BudgetProposal, Invoice, TeamMember, KanbanColumn } from '../types';

interface SupabaseConnectionTabProps {
  demands?: DemandItem[];
  clients?: Client[];
  services?: Service[];
  proposals?: BudgetProposal[];
  invoices?: Invoice[];
  teamMembers?: TeamMember[];
  kanbanColumns?: KanbanColumn[];
  onDataImported?: (
    demands: DemandItem[], 
    clients: Client[],
    services?: Service[],
    proposals?: BudgetProposal[],
    invoices?: Invoice[],
    teamMembers?: TeamMember[],
    kanbanColumns?: KanbanColumn[]
  ) => void;
}

interface SyncFeedbackState {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  action?: 'copy-sql' | 'copy-migration-sql' | 'none';
}

export const SupabaseConnectionTab: React.FC<SupabaseConnectionTabProps> = ({
  demands = [],
  clients = [],
  services = [],
  proposals = [],
  invoices = [],
  teamMembers = [],
  kanbanColumns = [],
  onDataImported
}) => {
  const [url, setUrl] = useState(() => getSupabaseUrl());
  const [anonKey, setAnonKey] = useState(() => getSupabaseAnonKey());
  const [status, setStatus] = useState<SupabaseConfigStatus>(() => getSupabaseConfigStatus());
  
  // Realtime immediate validation states
  const urlValidation = useMemo(() => validateSupabaseUrl(url), [url]);
  const keyValidation = useMemo(() => validateSupabaseAnonKey(anonKey), [anonKey]);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ComprehensiveTestResult | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedbackState | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Sincroniza credenciais com o servidor ao montar
  useEffect(() => {
    syncSupabaseCredentialsWithServer().then((synced) => {
      if (synced) {
        setUrl(getSupabaseUrl());
        setAnonKey(getSupabaseAnonKey());
        setStatus(getSupabaseConfigStatus());
      }
    });
  }, []);

  // Fallback para ler dados salvos no localStorage caso as props estejam vazias
  const effectiveClients = useMemo(() => {
    if (clients && clients.length > 0) return clients;
    try {
      const saved = localStorage.getItem('agency_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [clients]);

  const effectiveDemands = useMemo(() => {
    if (demands && demands.length > 0) return demands;
    try {
      const saved = localStorage.getItem('agency_demands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [demands]);

  const effectiveServices = useMemo(() => {
    if (services && services.length > 0) return services;
    try {
      const saved = localStorage.getItem('agency_services');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [services]);

  const effectiveProposals = useMemo(() => {
    if (proposals && proposals.length > 0) return proposals;
    try {
      const saved = localStorage.getItem('agency_proposals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [proposals]);

  const effectiveInvoices = useMemo(() => {
    if (invoices && invoices.length > 0) return invoices;
    try {
      const saved = localStorage.getItem('agency_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [invoices]);

  const effectiveTeamMembers = useMemo(() => {
    if (teamMembers && teamMembers.length > 0) return teamMembers;
    try {
      const saved = localStorage.getItem('agency_team_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [teamMembers]);

  const effectiveKanbanColumns = useMemo(() => {
    if (kanbanColumns && kanbanColumns.length > 0) return kanbanColumns;
    try {
      const saved = localStorage.getItem('agency_kanban_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, [kanbanColumns]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveSupabaseCredentials(url, anonKey);
    setStatus(getSupabaseConfigStatus());
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  /**
   * Teste de conexão completo com logs detalhados
   */
  const handleTestConnection = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSyncFeedback({
        type: 'error',
        title: 'Credenciais Incompletas',
        message: 'Por favor, preencha a Project URL e a Chave Anon antes de testar a conexão.',
      });
      return;
    }

    setIsTesting(true);
    saveSupabaseCredentials(cleanUrl, cleanKey);
    setStatus(getSupabaseConfigStatus());

    try {
      const result = await runComprehensiveConnectionTest(cleanUrl, cleanKey);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha crítica durante o teste: ${err.message}`,
        tablesStatus: { clients: false, demands: false, services: false, proposals: false, invoices: false },
        missingTables: ['clients', 'demands', 'services', 'proposals', 'invoices'],
        logs: [
          {
            id: `err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            stage: 'auth',
            status: 'error',
            message: `Erro na execução do teste: ${err.message}`,
          }
        ],
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleCopyMigrationSql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopiedMigrationSql(true);
    setTimeout(() => setCopiedMigrationSql(false), 3000);
  };

  const handleCopyLogs = () => {
    if (!testResult?.logs) return;
    const formattedLogs = testResult.logs
      .map((l) => `[${l.timestamp}] [${l.stage.toUpperCase()}] [${l.status.toUpperCase()}] ${l.message} ${l.latencyMs ? `(${l.latencyMs}ms)` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(formattedLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 3000);
  };

  const handleClearLogs = () => {
    setTestResult(null);
  };

  /**
   * Migração de todos os dados locais para o Supabase
   */
  const handleMigrateData = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSyncFeedback({
        type: 'error',
        title: 'Credenciais Incompletas',
        message: 'Por favor, preencha a Project URL e a Chave Anon antes de migrar os dados.',
      });
      return;
    }

    saveSupabaseCredentials(cleanUrl, cleanKey);
    setStatus(getSupabaseConfigStatus());

    setIsSyncing(true);
    setSyncFeedback({
      type: 'info',
      title: 'Migrando Dados para o PostgreSQL...',
      message: 'Conectando ao Supabase e enviando clientes, demandas, serviços e lançamentos...',
    });

    try {
      if (effectiveClients.length === 0 && effectiveDemands.length === 0) {
        const seedRes = await supabaseService.seedTestData(cleanUrl, cleanKey);
        if (seedRes.success) {
          setSyncFeedback({
            type: 'success',
            title: 'Tabelas Prontas & Registros de Validação Inseridos!',
            message: 'Como o banco local estava vazio, inserimos 1 cliente e 1 demanda de demonstração no seu Supabase. Acesse o "Table Editor" no painel para conferir.',
          });
        } else {
          setSyncFeedback({
            type: 'error',
            title: 'Falha na Validação do Banco',
            message: seedRes.message,
            action: seedRes.message.includes('não foi encontrada') ? 'copy-sql' : 'none',
          });
        }
        return;
      }

      const result = await supabaseService.syncAllLocalDataToSupabase(
        effectiveDemands,
        effectiveClients,
        cleanUrl,
        cleanKey,
        effectiveServices,
        effectiveProposals,
        effectiveInvoices,
        effectiveTeamMembers,
        effectiveKanbanColumns
      );

      if (result.errors.length > 0) {
        const isTableMissing = result.errors.some(e => e.includes('não existe') || e.includes('does not exist') || e.includes('42P01'));
        const isColumnMissing = result.errors.some(e => e.includes('column') || e.includes('schema cache'));
        setSyncFeedback({
          type: 'error',
          title: isTableMissing 
            ? 'Tabelas Não Criadas no Supabase' 
            : isColumnMissing 
              ? 'Colunas Pendentes de Atualização no Supabase' 
              : 'Avisos durante a Sincronização',
          message: result.errors.join(' | '),
          action: isTableMissing ? 'copy-sql' : isColumnMissing ? 'copy-migration-sql' : 'none',
        });
      } else {
        const totalItems = 
          result.clientsUploaded + 
          result.demandsUploaded + 
          result.servicesUploaded + 
          result.proposalsUploaded + 
          result.invoicesUploaded +
          result.teamMembersUploaded +
          result.kanbanColumnsUploaded;
        setSyncFeedback({
          type: 'success',
          title: 'Sincronização Completa Concluída com Sucesso!',
          message: `${totalItems} registros sincronizados no banco Supabase: ${result.clientsUploaded} clientes, ${result.demandsUploaded} demandas, ${result.teamMembersUploaded} colaboradores da equipe, ${result.servicesUploaded} serviços, ${result.proposalsUploaded} orçamentos e ${result.invoicesUploaded} faturas.`,
        });
      }
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        title: 'Erro Inesperado',
        message: `Falha na sincronização: ${e.message || 'Verifique as chaves e conexão.'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Baixar dados do Supabase para o navegador
   */
  const handlePullFromSupabase = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSyncFeedback({
        type: 'error',
        title: 'Credenciais Incompletas',
        message: 'Preencha a URL e a Chave do Supabase antes de puxar dados.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncFeedback({
      type: 'info',
      title: 'Consultando Supabase...',
      message: 'Lendo dados diretamente do banco de dados na nuvem...',
    });

    try {
      const [
        remoteDemands, 
        remoteClients,
        remoteServices,
        remoteProposals,
        remoteInvoices,
        remoteTeamMembers,
        remoteColumns
      ] = await Promise.all([
        supabaseService.fetchDemands(),
        supabaseService.fetchClients(),
        supabaseService.fetchServices(),
        supabaseService.fetchProposals(),
        supabaseService.fetchInvoices(),
        supabaseService.fetchTeamMembers(),
        supabaseService.fetchKanbanColumns(),
      ]);

      if (remoteDemands !== null || remoteClients !== null) {
        if (onDataImported) {
          onDataImported(
            remoteDemands || [], 
            remoteClients || [],
            remoteServices || undefined,
            remoteProposals || undefined,
            remoteInvoices || undefined,
            remoteTeamMembers || undefined,
            remoteColumns || undefined
          );
        }
        const totalItems = 
          (remoteClients?.length || 0) + 
          (remoteDemands?.length || 0) + 
          (remoteServices?.length || 0) + 
          (remoteProposals?.length || 0) + 
          (remoteInvoices?.length || 0) +
          (remoteTeamMembers?.length || 0) +
          (remoteColumns?.length || 0);

        setSyncFeedback({
          type: 'success',
          title: 'Download Realizado com Sucesso!',
          message: `${totalItems} registros carregados diretamente do Supabase: ${remoteClients?.length || 0} clientes, ${remoteDemands?.length || 0} demandas, ${remoteTeamMembers?.length || 0} colaboradores, ${remoteServices?.length || 0} serviços, ${remoteProposals?.length || 0} orçamentos e ${remoteInvoices?.length || 0} faturas.`,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          title: 'Falha na Consulta',
          message: 'Não foi possível ler as tabelas no Supabase. Verifique se o Script SQL foi executado no painel.',
          action: 'copy-sql',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        title: 'Erro de Conexão',
        message: `Erro ao buscar dados: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-[#142142] via-[#1a2d5a] to-emerald-950 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border border-emerald-500/30">
                <Database size={13} />
                Backend Principal em PostgreSQL
              </span>
              {status.isConfigured ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Ativo & Configurado
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                  <AlertCircle size={13} />
                  Aguardando Credenciais
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Arquitetura de Banco de Dados Supabase
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Configure o Supabase como o backend principal do Help Ideias. Garante sincronização em tempo real entre todos os colaboradores, persistência segura com Row Level Security (RLS) e escalabilidade para produção.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-copy-sql-header"
              onClick={handleCopySql}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSql ? 'Script SQL Copiado!' : 'Copiar Script SQL'}</span>
            </button>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e0a215] text-[#142142] font-black text-xs transition-all shadow-md flex items-center gap-2"
            >
              <span>Abrir Painel Supabase</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Migration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column with Immediate Realtime Validation */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142142] dark:text-white">
              <Key size={18} className="text-[#fab518]" />
              <span>Credenciais da API do Supabase</span>
            </div>
            {saveToast && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check size={14} />
                Salvo com sucesso!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Field 1: Project URL com feedback visual imediato */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Project URL (Endpoint do Banco)
                </label>
                {/* Feedback Visual Imediato da URL */}
                {url.trim() ? (
                  urlValidation.isValid ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      {urlValidation.message}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle size={13} />
                      {urlValidation.message}
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-400">Obrigatório</span>
                )}
              </div>

              <div className="relative">
                <input
                  id="supabase-project-url-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-xs font-mono transition-all focus:outline-hidden focus:ring-2 ${
                    !url.trim()
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-[#fab518]'
                      : urlValidation.isValid
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white focus:ring-emerald-500'
                      : 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-white focus:ring-rose-500'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {url.trim() && (
                    urlValidation.isValid ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-rose-500" />
                    )
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Encontrado em <strong>Project Settings &gt; API &gt; Project URL</strong>
              </p>
            </div>

            {/* Field 2: Anon Key com feedback visual imediato */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Anon / Public API Key
                </label>
                {/* Feedback Visual Imediato da Chave */}
                {anonKey.trim() ? (
                  keyValidation.isValid ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      {keyValidation.message}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle size={13} />
                      {keyValidation.message}
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-400">Obrigatório</span>
                )}
              </div>

              <div className="relative">
                <input
                  id="supabase-anon-key-input"
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-xs font-mono transition-all focus:outline-hidden focus:ring-2 ${
                    !anonKey.trim()
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-[#fab518]'
                      : keyValidation.isValid
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white focus:ring-emerald-500'
                      : 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-white focus:ring-rose-500'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {anonKey.trim() && (
                    keyValidation.isValid ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-rose-500" />
                    )
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Encontrado em <strong>Project Settings &gt; API &gt; Project API keys &gt; anon public</strong>
              </p>
            </div>

            {/* Ações do Formulário */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                id="btn-save-supabase-credentials"
                className="px-5 py-2.5 rounded-xl bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] font-black text-xs hover:opacity-90 transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Check size={15} />
                <span>Salvar Credenciais</span>
              </button>

              <button
                type="button"
                id="btn-test-supabase-connection"
                onClick={handleTestConnection}
                disabled={isTesting || !url.trim() || !anonKey.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <RefreshCw size={14} className={isTesting ? 'animate-spin text-[#fab518]' : ''} />
                <span>{isTesting ? 'Executando Teste Diagnóstico...' : 'Testar Conexão em Tempo Real'}</span>
              </button>
            </div>
          </form>

          {/* Terminal / Painel de Logs de Conexão Detalhado */}
          {testResult && (
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-slate-100 shadow-md">
              {/* Header do Terminal */}
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-[#fab518]" />
                  <span className="font-bold text-slate-200">Terminal de Diagnóstico Supabase</span>
                  {testResult.success ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 size={11} />
                      Conectado ({testResult.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-black text-[10px] flex items-center gap-1 border border-rose-500/30">
                      <XCircle size={11} />
                      Falha na Conexão
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLogs}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copiar logs completos"
                  >
                    {copiedLogs ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedLogs ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer ml-1"
                    title="Limpar logs"
                  >
                    <Trash2 size={12} />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>

              {/* Status das Tabelas Principais */}
              <div className="p-3 bg-slate-900/60 border-b border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Table size={12} className="text-[#fab518]" />
                  <span>Auditoria de Tabelas no PostgreSQL</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {Object.entries(testResult.tablesStatus).map(([table, exists]) => (
                    <div 
                      key={table}
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-[11px] font-mono ${
                        exists 
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                          : 'bg-rose-950/40 border-rose-800 text-rose-300'
                      }`}
                    >
                      <span className="font-bold">{table}</span>
                      {exists ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Console de Logs Passo a Passo */}
              <div className="p-3 max-h-56 overflow-y-auto font-mono text-[11px] space-y-1.5 leading-relaxed">
                {testResult.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                    <span 
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 uppercase select-none ${
                        log.stage === 'format' ? 'bg-blue-900/60 text-blue-300' :
                        log.stage === 'auth' ? 'bg-purple-900/60 text-purple-300' :
                        log.stage === 'rest' ? 'bg-amber-900/60 text-amber-300' :
                        log.stage === 'tables' ? 'bg-cyan-900/60 text-cyan-300' :
                        'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.stage}
                    </span>
                    <span 
                      className={
                        log.status === 'success' ? 'text-emerald-400' :
                        log.status === 'error' ? 'text-rose-400 font-bold' :
                        log.status === 'warning' ? 'text-amber-300' :
                        'text-slate-300'
                      }
                    >
                      {log.message}
                    </span>
                    {log.latencyMs !== undefined && (
                      <span className="text-slate-500 text-[10px] ml-auto shrink-0">
                        {log.latencyMs}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Ação se faltarem tabelas */}
              {testResult.missingTables.length > 0 && (
                <div className="p-3 bg-amber-950/40 border-t border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <span className="text-[11px]">
                      Tabelas pendentes no Supabase: <strong>{testResult.missingTables.join(', ')}</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg bg-[#fab518] hover:bg-amber-400 text-[#142142] font-black text-[11px] shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy size={12} />
                    <span>Copiar Script SQL</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync & Migration Column */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142142] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              <CloudUpload size={18} className="text-[#fab518]" />
              <span>Sincronização & Migração</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Registros Prontos para Nuvem:</span>
                <span className="text-[10px] text-slate-400 font-normal">Armazenamento Local</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveClients.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Clientes</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveDemands.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Demandas</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveTeamMembers.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Equipe (CEO)</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveServices.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Serviços</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveProposals.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Orçamentos</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveInvoices.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Faturas</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Clique no botão abaixo para sincronizar todo o ecossistema do Help Ideias (clientes, demandas, equipe com cargo de CEO, serviços, faturas e colunas) diretamente no PostgreSQL do Supabase.
            </p>
          </div>

          <div className="space-y-2.5 pt-3">
            {/* Botão Principal de Migração */}
            <button
              type="button"
              id="btn-migrate-supabase"
              onClick={handleMigrateData}
              disabled={isSyncing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fab518] via-amber-400 to-amber-500 hover:opacity-95 text-[#142142] font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              <CloudUpload size={18} className={isSyncing ? 'animate-bounce text-[#142142]' : ''} />
              <span>{isSyncing ? 'Gravando no Supabase...' : 'Sincronizar Todo o Sistema p/ Supabase'}</span>
            </button>

            {/* Puxar do Banco */}
            <button
              type="button"
              id="btn-pull-supabase-data"
              onClick={handlePullFromSupabase}
              disabled={isSyncing}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>Baixar Dados do Supabase p/ Navegador</span>
            </button>

            {/* Feedback Visual Estruturado */}
            {syncFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed animate-in fade-in space-y-2 ${
                  syncFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : syncFeedback.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200 border-red-300 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {syncFeedback.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                  {syncFeedback.type === 'error' && <AlertCircle size={16} className="text-red-600 shrink-0" />}
                  {syncFeedback.type === 'info' && <RefreshCw size={16} className="text-blue-600 animate-spin shrink-0" />}
                  <span>{syncFeedback.title}</span>
                </div>
                <p className="text-[11px] opacity-90">{syncFeedback.message}</p>

                {syncFeedback.action === 'copy-sql' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy size={12} />
                      <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL e Executar no Supabase'}</span>
                    </button>
                  </div>
                )}

                {syncFeedback.action === 'copy-migration-sql' && (
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMigrationSql}
                      className="px-3 py-1.5 rounded-lg bg-[#fab518] hover:bg-amber-400 text-[#142142] font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy size={12} />
                      <span>{copiedMigrationSql ? 'Script de Atualização Copiado!' : 'Copiar Script de Atualização de Colunas (ALTER TABLE)'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQL Script Generator Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-[#fab518]" />
            <div>
              <h3 className="text-sm font-bold text-[#142142] dark:text-white">
                Scripts SQL para o Banco no Supabase
              </h3>
              <p className="text-[11px] text-slate-400">
                Execute no <strong>SQL Editor</strong> do Supabase para criar tabelas ou atualizar colunas com 1 clique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMigrationSql}
              className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Adiciona as colunas novas sem recriar ou apagar tabelas"
            >
              {copiedMigrationSql ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedMigrationSql ? 'Copiado!' : 'Atualizar Colunas (ALTER TABLE)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-[#142142] dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSql ? 'SQL Completo Copiado!' : 'Copiar Script Completo'}</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed border border-slate-800 select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>

      {/* Step by step instructions */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#142142] dark:text-[#fab518] flex items-center gap-2">
          <HelpCircle size={15} />
          <span>Guia Rápido: Como Integrar o Supabase em 3 Passos</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] font-black text-xs flex items-center justify-center">
              1
            </div>
            <div className="font-bold text-[#142142] dark:text-white">Criar Tabelas no Supabase</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Clique em <strong>Copiar Script SQL</strong> acima. No painel do Supabase, acesse o <strong>SQL Editor</strong>, cole o código e clique em <strong>Run</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] font-black text-xs flex items-center justify-center">
              2
            </div>
            <div className="font-bold text-[#142142] dark:text-white">Colar as Chaves da API</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              No Supabase, vá em <strong>Project Settings &gt; API</strong>. Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong> e cole nos campos à esquerda. Veja o ícone de check verde imediato.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] font-black text-xs flex items-center justify-center">
              3
            </div>
            <div className="font-bold text-[#142142] dark:text-white">Testar e Migrar</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Clique em <strong>Testar Conexão em Tempo Real</strong> para ver os logs do handshake. Em seguida, clique em <strong>Migrar Dados Locais</strong> para sincronizar seu banco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
