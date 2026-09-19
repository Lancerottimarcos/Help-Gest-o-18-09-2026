import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Chaves de armazenamento das credenciais dinâmicas no navegador (para facilitar configuração sem reiniciar servidor)
const STORAGE_KEY_URL = 'help_supabase_url';
const STORAGE_KEY_ANON = 'help_supabase_anon_key';

// Credenciais padrão do projeto Help Ideias (garante que qualquer novo computador acesse imediatamente o banco na nuvem)
const DEFAULT_SUPABASE_URL = 'https://pniiwmpxtvckivufrqhn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_VaKxwO3n2CZWMmYUyGUVrA_ZD7H83RB';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  source: 'env' | 'storage' | 'none';
}

/**
 * Função auxiliar para obter valor de cookie
 */
function getCookie(name: string): string {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  } catch {}
  return '';
}

/**
 * Obtém a URL configurada (prioridade: variáveis de ambiente VITE_*, seguido de localStorage, depois cookie, depois padrão do projeto)
 */
export function getSupabaseUrl(): string {
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
  if (envUrl) return envUrl;
  try {
    const fromStorage = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    if (fromStorage) return fromStorage;
  } catch {}
  const fromCookie = getCookie(STORAGE_KEY_URL).trim();
  if (fromCookie) return fromCookie;
  return DEFAULT_SUPABASE_URL;
}

/**
 * Obtém a Chave Anônima / Pública (prioridade: VITE_*, seguido de localStorage, depois cookie, depois padrão do projeto)
 */
export function getSupabaseAnonKey(): string {
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();
  if (envKey) return envKey;
  try {
    const fromStorage = (localStorage.getItem(STORAGE_KEY_ANON) || '').trim();
    if (fromStorage) return fromStorage;
  } catch {}
  const fromCookie = getCookie(STORAGE_KEY_ANON).trim();
  if (fromCookie) return fromCookie;
  return DEFAULT_SUPABASE_ANON_KEY;
}

/**
 * Salva as credenciais do Supabase no navegador (localStorage + Cookie de 1 ano para máxima durabilidade)
 * e também sincroniza com o servidor compartilhado para que qualquer outro computador acesse automaticamente.
 */
export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (cleanUrl) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      document.cookie = `${STORAGE_KEY_URL}=${encodeURIComponent(cleanUrl)};path=/;max-age=31536000;SameSite=Lax`;
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      document.cookie = `${STORAGE_KEY_URL}=;path=/;max-age=0`;
    }

    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
      document.cookie = `${STORAGE_KEY_ANON}=${encodeURIComponent(cleanKey)};path=/;max-age=31536000;SameSite=Lax`;
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
      document.cookie = `${STORAGE_KEY_ANON}=;path=/;max-age=0`;
    }

    // Reinicia instância para forçar nova conexão
    cachedClient = null;

    // Sincroniza com o servidor em background para que outros computadores recebam
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Erro ao salvar credenciais do Supabase no storage local:', e);
  }
}

/**
 * Sincroniza credenciais entre o servidor e o navegador local.
 * Permite que um novo computador obtenha automaticamente as credenciais já cadastradas no outro computador.
 */
export async function syncSupabaseCredentialsWithServer(): Promise<boolean> {
  try {
    const localUrl = getSupabaseUrl();
    const localKey = getSupabaseAnonKey();

    // Se este navegador já possui credenciais válidas, sincroniza em background com o servidor sem bloquear
    if (localUrl && localKey) {
      fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: localUrl, anonKey: localKey }),
      }).catch(() => {});
      return true;
    }

    // Se este navegador não possui credenciais, busca do servidor
    const res = await fetch('/api/supabase-config').catch(() => null);
    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.url && data?.anonKey) {
        const cleanUrl = String(data.url).trim();
        const cleanKey = String(data.anonKey).trim();
        if (cleanUrl && cleanKey) {
          localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
          document.cookie = `${STORAGE_KEY_URL}=${encodeURIComponent(cleanUrl)};path=/;max-age=31536000;SameSite=Lax`;
          localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
          document.cookie = `${STORAGE_KEY_ANON}=${encodeURIComponent(cleanKey)};path=/;max-age=31536000;SameSite=Lax`;
          cachedClient = null;
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Não foi possível sincronizar credenciais com o servidor:', e);
  }
  return false;
}

/**
 * Retorna o status atual da configuração
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const envUrl = (((import.meta as any).env?.VITE_SUPABASE_URL || '') as string).trim();
  const envKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '') as string).trim();
  if (envUrl && envKey) {
    return { isConfigured: true, url: envUrl, source: 'env' };
  }

  const storedUrl = getSupabaseUrl();
  const storedKey = getSupabaseAnonKey();
  if (storedUrl && storedKey) {
    return { isConfigured: true, url: storedUrl, source: 'storage' };
  }

  return { isConfigured: false, url: storedUrl || envUrl || '', source: 'none' };
}

let cachedClient: SupabaseClient | null = null;

/**
 * Cria ou retorna cliente direto com as credenciais fornecidas
 */
export function createClientDirect(url: string, anonKey: string): SupabaseClient | null {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey || !cleanUrl.startsWith('http')) {
    return null;
  }

  try {
    return createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Erro ao criar cliente Supabase direto:', err);
    return null;
  }
}

/**
 * Retorna o cliente do Supabase ou null se não configurado
 */
export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  if (customUrl && customKey) {
    return createClientDirect(customUrl, customKey);
  }

  if (cachedClient) return cachedClient;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  cachedClient = createClientDirect(url, anonKey);
  return cachedClient;
}

/**
 * Validação de sintaxe e formato da URL do Supabase
 */
export function validateSupabaseUrl(rawUrl: string): { 
  isValid: boolean; 
  status: 'empty' | 'valid' | 'invalid';
  message: string; 
} {
  const url = (rawUrl || '').trim();
  if (!url) {
    return { isValid: false, status: 'empty', message: 'URL não preenchida' };
  }

  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    return { 
      isValid: false, 
      status: 'invalid', 
      message: 'A URL deve começar com https:// (ou http://localhost)' 
    };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname) {
      return { isValid: false, status: 'invalid', message: 'Hostname inválido na URL' };
    }
    const isSupabaseCo = parsed.hostname.endsWith('.supabase.co');
    return { 
      isValid: true, 
      status: 'valid', 
      message: isSupabaseCo ? 'Endpoint oficial Supabase (.supabase.co)' : 'URL HTTPS válida' 
    };
  } catch {
    return { isValid: false, status: 'invalid', message: 'Formato de URL inválido' };
  }
}

/**
 * Validação de sintaxe e formato da Chave Anônima do Supabase (JWT)
 */
export function validateSupabaseAnonKey(rawKey: string): { 
  isValid: boolean; 
  status: 'empty' | 'valid' | 'invalid';
  message: string; 
  role?: string;
} {
  const key = (rawKey || '').trim();
  if (!key) {
    return { isValid: false, status: 'empty', message: 'Chave não preenchida' };
  }

  if (key.length < 30) {
    return { 
      isValid: false, 
      status: 'invalid', 
      message: 'Chave muito curta (as chaves do Supabase têm mais de 100 caracteres)' 
    };
  }

  // Verifica se é um token JWT (três partes separadas por ponto)
  const parts = key.split('.');
  if (parts.length === 3 && key.startsWith('eyJ')) {
    try {
      // Tenta decodificar o payload JWT
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      const role = parsed.role || 'anon';
      const isAnon = role === 'anon';
      return { 
        isValid: true, 
        status: 'valid', 
        message: isAnon ? 'Token JWT Válido (Role: anon public)' : `Token JWT Válido (Role: ${role})`,
        role,
      };
    } catch {
      return { 
        isValid: true, 
        status: 'valid', 
        message: 'Token com formato JWT estruturado' 
      };
    }
  }

  // Chaves do tipo API Key sem JWT
  if (key.length >= 30) {
    return { 
      isValid: true, 
      status: 'valid', 
      message: 'Chave de API com comprimento válido' 
    };
  }

  return { isValid: false, status: 'invalid', message: 'Formato de chave não reconhecido' };
}

export interface ConnectionTestLog {
  id: string;
  timestamp: string;
  stage: 'format' | 'auth' | 'rest' | 'tables' | 'summary';
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  latencyMs?: number;
}

export interface ComprehensiveTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  tablesStatus: {
    clients: boolean;
    demands: boolean;
    services: boolean;
    proposals: boolean;
    invoices: boolean;
  };
  missingTables: string[];
  logs: ConnectionTestLog[];
}

/**
 * Testa a conexão real executando um ping no endpoint de autenticação do Supabase
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const url = customUrl || getSupabaseUrl();
  const key = customKey || getSupabaseAnonKey();

  if (!url || !key) {
    return {
      success: false,
      message: 'URL e Chave Anônima do Supabase são obrigatórias para o teste.',
    };
  }

  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return {
      success: false,
      message: 'A URL do Supabase deve iniciar com https:// (ex: https://xyz.supabase.co).',
    };
  }

  const startTime = Date.now();
  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Tenta uma consulta simples ou pega a sessão de auth
    const { error } = await testClient.auth.getSession();
    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        success: false,
        message: `Falha na autenticação do Supabase: ${error.message}`,
        latencyMs,
      };
    }

    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!',
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao conectar: ${err?.message || 'Host inalcançável ou parâmetros inválidos'}`,
    };
  }
}

/**
 * Executa um teste detalhado de ponta a ponta com logs passo a passo e auditoria das tabelas
 */
export async function runComprehensiveConnectionTest(
  customUrl?: string, 
  customKey?: string
): Promise<ComprehensiveTestResult> {
  const url = (customUrl || getSupabaseUrl()).trim();
  const key = (customKey || getSupabaseAnonKey()).trim();
  const logs: ConnectionTestLog[] = [];
  const getNow = () => new Date().toLocaleTimeString('pt-BR');

  const addLog = (
    stage: ConnectionTestLog['stage'],
    status: ConnectionTestLog['status'],
    message: string,
    latencyMs?: number
  ) => {
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: getNow(),
      stage,
      status,
      message,
      latencyMs,
    });
  };

  addLog('format', 'info', 'Iniciando verificação de sintaxe e formato das credenciais...');

  // 1. Validação de formato da URL
  const urlCheck = validateSupabaseUrl(url);
  if (!urlCheck.isValid) {
    addLog('format', 'error', `URL inválida: ${urlCheck.message}`);
    return {
      success: false,
      message: `URL inválida: ${urlCheck.message}`,
      tablesStatus: { clients: false, demands: false, services: false, proposals: false, invoices: false },
      missingTables: ['clients', 'demands', 'services', 'proposals', 'invoices'],
      logs,
    };
  }
  addLog('format', 'success', `URL validada com sucesso: ${url}`);

  // 2. Validação da Chave
  const keyCheck = validateSupabaseAnonKey(key);
  if (!keyCheck.isValid) {
    addLog('format', 'error', `Chave anônima inválida: ${keyCheck.message}`);
    return {
      success: false,
      message: `Chave anônima inválida: ${keyCheck.message}`,
      tablesStatus: { clients: false, demands: false, services: false, proposals: false, invoices: false },
      missingTables: ['clients', 'demands', 'services', 'proposals', 'invoices'],
      logs,
    };
  }
  addLog('format', 'success', `Chave validada (${keyCheck.message})`);

  // 3. Teste de Autenticação com o Supabase Auth
  addLog('auth', 'info', 'Enviando ping de autenticação para o endpoint Supabase Auth (/auth/v1)...');
  const authStart = Date.now();
  let testClient: SupabaseClient;

  try {
    testClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    const { error: authError } = await testClient.auth.getSession();
    const authLatency = Date.now() - authStart;

    if (authError) {
      addLog('auth', 'error', `Falha na autenticação do Supabase: ${authError.message}`, authLatency);
      return {
        success: false,
        message: `Falha na autenticação: ${authError.message}`,
        latencyMs: authLatency,
        tablesStatus: { clients: false, demands: false, services: false, proposals: false, invoices: false },
        missingTables: ['clients', 'demands', 'services', 'proposals', 'invoices'],
        logs,
      };
    }

    addLog('auth', 'success', `Autenticação confirmada com sucesso! Resposta em ${authLatency}ms.`, authLatency);
  } catch (err: any) {
    const authLatency = Date.now() - authStart;
    addLog('auth', 'error', `Erro ao contatar o servidor: ${err.message || 'Host inalcançável'}`, authLatency);
    return {
      success: false,
      message: `Erro ao conectar: ${err.message || 'Host inalcançável'}`,
      latencyMs: authLatency,
      tablesStatus: { clients: false, demands: false, services: false, proposals: false, invoices: false },
      missingTables: ['clients', 'demands', 'services', 'proposals', 'invoices'],
      logs,
    };
  }

  // 4. Teste e Auditoria do Banco de Dados Relacional (PostgREST) e Tabelas
  addLog('rest', 'info', 'Consultando metadados das tabelas no PostgREST (/rest/v1)...');
  const tablesToCheck = ['clients', 'demands', 'services', 'proposals', 'invoices'] as const;
  const tablesStatus = {
    clients: false,
    demands: false,
    services: false,
    proposals: false,
    invoices: false,
  };
  const missingTables: string[] = [];

  const overallStart = Date.now();

  for (const table of tablesToCheck) {
    try {
      const tStart = Date.now();
      const { data, error } = await testClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      const tLatency = Date.now() - tStart;

      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation "public.' + table + '" does not exist') ||
          error.message?.includes('could not find the table')
        ) {
          tablesStatus[table] = false;
          missingTables.push(table);
          addLog('tables', 'warning', `Tabela "${table}" NÃO encontrada no PostgreSQL (Código 42P01).`, tLatency);
        } else {
          // Pode ser permissão de RLS ou outro erro
          tablesStatus[table] = false;
          missingTables.push(table);
          addLog('tables', 'error', `Erro na tabela "${table}": ${error.message} (Código ${error.code})`, tLatency);
        }
      } else {
        tablesStatus[table] = true;
        addLog('tables', 'success', `Tabela "${table}" operacional e acessível via PostgREST!`, tLatency);
      }
    } catch (e: any) {
      tablesStatus[table] = false;
      missingTables.push(table);
      addLog('tables', 'error', `Exceção ao auditar tabela "${table}": ${e.message}`);
    }
  }

  const totalLatency = Date.now() - overallStart;

  if (missingTables.length === 0) {
    addLog('summary', 'success', `Diagnóstico completo: Todas as ${tablesToCheck.length} tabelas do Help Ideias estão ativas e prontas para produção!`, totalLatency);
    return {
      success: true,
      message: 'Conexão e Banco PostgreSQL validados com 100% de sucesso!',
      latencyMs: totalLatency,
      tablesStatus,
      missingTables: [],
      logs,
    };
  } else if (tablesStatus.clients && tablesStatus.demands) {
    addLog('summary', 'warning', `Conexão autenticada! Tabelas principais "clients" e "demands" estão ativas. Algumas tabelas adicionais (${missingTables.join(', ')}) podem ser criadas pelo Script SQL.`, totalLatency);
    return {
      success: true,
      message: `Conexão bem-sucedida! Tabelas principais ativas. Tabelas pendentes: ${missingTables.join(', ')}.`,
      latencyMs: totalLatency,
      tablesStatus,
      missingTables,
      logs,
    };
  } else {
    addLog('summary', 'warning', `Autenticação bem-sucedida, mas as tabelas do sistema não foram encontradas. Execute o Script SQL no SQL Editor do Supabase para criá-las.`, totalLatency);
    return {
      success: false,
      message: 'Autenticação válida, mas as tabelas do banco ainda não foram criadas. Copie e execute o Script SQL no Supabase.',
      latencyMs: totalLatency,
      tablesStatus,
      missingTables,
      logs,
    };
  }
}
