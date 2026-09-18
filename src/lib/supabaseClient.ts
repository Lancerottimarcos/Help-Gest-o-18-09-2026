import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Chaves de armazenamento das credenciais dinâmicas no navegador (para facilitar configuração sem reiniciar servidor)
const STORAGE_KEY_URL = 'help_supabase_url';
const STORAGE_KEY_ANON = 'help_supabase_anon_key';

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
 * Obtém a URL configurada (prioridade: variáveis de ambiente VITE_*, seguido de localStorage, depois cookie)
 */
export function getSupabaseUrl(): string {
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
  if (envUrl) return envUrl;
  try {
    const fromStorage = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    if (fromStorage) return fromStorage;
  } catch {}
  return getCookie(STORAGE_KEY_URL).trim();
}

/**
 * Obtém a Chave Anônima / Pública (prioridade: VITE_*, seguido de localStorage, depois cookie)
 */
export function getSupabaseAnonKey(): string {
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();
  if (envKey) return envKey;
  try {
    const fromStorage = (localStorage.getItem(STORAGE_KEY_ANON) || '').trim();
    if (fromStorage) return fromStorage;
  } catch {}
  return getCookie(STORAGE_KEY_ANON).trim();
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

    // Se este navegador já possui credenciais, garante que o servidor as tenha
    if (localUrl && localKey) {
      try {
        await fetch('/api/supabase-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: localUrl, anonKey: localKey }),
        });
      } catch {}
      return true;
    }

    // Se este navegador não possui credenciais, busca do servidor
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
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
