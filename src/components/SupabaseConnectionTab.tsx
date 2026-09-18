import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  CloudUpload, 
  Key, 
  Server,
  Sparkles,
  ArrowDownToLine,
  HelpCircle,
  FileCode2
} from 'lucide-react';
import { 
  getSupabaseUrl, 
  getSupabaseAnonKey, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  getSupabaseConfigStatus,
  syncSupabaseCredentialsWithServer,
  SupabaseConfigStatus
} from '../lib/supabaseClient';
import { supabaseService, SUPABASE_SQL_SCHEMA } from '../services/supabaseService';
import { DemandItem, Client } from '../types';

interface SupabaseConnectionTabProps {
  demands?: DemandItem[];
  clients?: Client[];
  onDataImported?: (demands: DemandItem[], clients: Client[]) => void;
}

interface SyncFeedbackState {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  action?: 'copy-sql' | 'none';
}

export const SupabaseConnectionTab: React.FC<SupabaseConnectionTabProps> = ({
  demands = [],
  clients = [],
  onDataImported
}) => {
  const [url, setUrl] = useState(() => getSupabaseUrl());
  const [anonKey, setAnonKey] = useState(() => getSupabaseAnonKey());
  const [status, setStatus] = useState<SupabaseConfigStatus>(() => getSupabaseConfigStatus());
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedbackState | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Sincroniza credenciais com o servidor ao montar o componente (para detectar credenciais salvas em outro computador)
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
  const effectiveClients = React.useMemo(() => {
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

  const effectiveDemands = React.useMemo(() => {
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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveSupabaseCredentials(url, anonKey);
    setStatus(getSupabaseConfigStatus());
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleTestConnection = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Por favor, preencha a Project URL e a Chave Anon antes de testar.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    saveSupabaseCredentials(cleanUrl, cleanKey);
    const res = await testSupabaseConnection(cleanUrl, cleanKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  /**
   * Opção 6: Migrar Dados Locais para o Supabase (sem depender de window.confirm ou window.alert)
   */
  const handleMigrateData = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSyncFeedback({
        type: 'error',
        title: 'Credenciais Incompletas',
        message: 'Por favor, preencha a Project URL e a Chave Anon nos campos ao lado antes de migrar os dados.',
      });
      return;
    }

    // Salva automaticamente as credenciais para garantir persistência
    saveSupabaseCredentials(cleanUrl, cleanKey);
    setStatus(getSupabaseConfigStatus());

    setIsSyncing(true);
    setSyncFeedback({
      type: 'info',
      title: 'Migrando Dados...',
      message: 'Conectando ao PostgreSQL do Supabase e sincronizando tabelas...',
    });

    try {
      // Se não há dados locais cadastrados, vamos inserir dados piloto para demonstrar o funcionamento
      if (effectiveClients.length === 0 && effectiveDemands.length === 0) {
        const seedRes = await supabaseService.seedTestData(cleanUrl, cleanKey);
        if (seedRes.success) {
          setSyncFeedback({
            type: 'success',
            title: 'Tabelas Criadas & Dados Piloto Inseridos!',
            message: 'Como você ainda não tinha clientes cadastrados no navegador, inserimos 1 cliente e 1 demanda de validação no seu banco Supabase. Acesse o "Table Editor" no painel do Supabase para conferir!',
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

      // Migra os dados existentes
      const result = await supabaseService.syncAllLocalDataToSupabase(
        effectiveDemands,
        effectiveClients,
        cleanUrl,
        cleanKey
      );

      if (result.errors.length > 0) {
        const isTableMissing = result.errors.some(e => e.includes('não existe'));
        setSyncFeedback({
          type: 'error',
          title: isTableMissing ? 'Tabelas Não Encontradas no Supabase' : 'Atenção durante a Migração',
          message: result.errors.join(' | '),
          action: isTableMissing ? 'copy-sql' : 'none',
        });
      } else {
        setSyncFeedback({
          type: 'success',
          title: 'Migração Concluída com Sucesso!',
          message: `${result.clientsUploaded} clientes e ${result.demandsUploaded} demandas foram gravados no banco PostgreSQL Supabase. Seus dados estão persistidos na nuvem!`,
        });
      }
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        title: 'Erro Inesperado',
        message: `Falha na conexão: ${e.message || 'Verifique a rede ou suas credenciais.'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Inserir dados de teste diretamente para comprovar o funcionamento
   */
  const handleInsertTestData = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setSyncFeedback({
        type: 'error',
        title: 'Credenciais Incompletas',
        message: 'Preencha a Project URL e a Chave Anon antes de rodar o teste.',
      });
      return;
    }

    saveSupabaseCredentials(cleanUrl, cleanKey);
    setIsSyncing(true);
    try {
      const res = await supabaseService.seedTestData(cleanUrl, cleanKey);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          title: 'Dados de Teste Inseridos no PostgreSQL!',
          message: res.message,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          title: 'Erro ao Inserir Registro de Teste',
          message: res.message,
          action: res.message.includes('não foi encontrada') ? 'copy-sql' : 'none',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        title: 'Falha no Teste',
        message: err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

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
      title: 'Buscando Dados...',
      message: 'Consultando tabelas "demands" e "clients" no Supabase...',
    });

    try {
      const [remoteDemands, remoteClients] = await Promise.all([
        supabaseService.fetchDemands(),
        supabaseService.fetchClients(),
      ]);

      if (remoteDemands !== null && remoteClients !== null) {
        if (onDataImported) {
          onDataImported(remoteDemands, remoteClients);
        }
        setSyncFeedback({
          type: 'success',
          title: 'Download Concluído!',
          message: `Carregadas ${remoteDemands.length} demandas e ${remoteClients.length} clientes diretamente do banco PostgreSQL.`,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          title: 'Falha na Leitura',
          message: 'Não foi possível ler as tabelas. Verifique se o Script SQL foi executado no painel do Supabase.',
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
                PostgreSQL em Nuvem
              </span>
              {status.isConfigured ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Configurado
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                  <AlertCircle size={13} />
                  Aguardando Chaves
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Conexão com o Supabase (PostgreSQL)
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Substitua o armazenamento local do navegador por um banco relacional gerenciado no Supabase. Habilite acesso simultâneo para sua equipe e persistência duradoura de todas as demandas e clientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
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
              <span>Acessar Painel Supabase</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Migration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142142] dark:text-white">
              <Key size={18} className="text-[#fab518]" />
              <span>Credenciais da API do Supabase</span>
            </div>
            {saveToast && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in flex items-center gap-1">
                <Check size={14} />
                Salvo com sucesso!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Project URL (Endpoint do Banco)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#fab518]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Encontrado em <strong>Project Settings &gt; API &gt; Project URL</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Anon / Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#fab518]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Encontrado em <strong>Project Settings &gt; API &gt; Project API keys &gt; anon public</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] font-black text-xs hover:opacity-90 transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Check size={15} />
                <span>Salvar Configuração</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url.trim() || !anonKey.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isTesting ? 'animate-spin text-[#fab518]' : ''} />
                <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão em Tempo Real'}</span>
              </button>
            </div>
          </form>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs font-medium transition-all ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
              {testResult.latencyMs !== undefined && (
                <div className="mt-1 text-[11px] opacity-80">
                  Latência do servidor: {testResult.latencyMs}ms
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync & Migration Column (OPÇÃO 6) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#142142] dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              <CloudUpload size={18} className="text-[#fab518]" />
              <span>Sincronização & Migração (Opção 6)</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Registros Prontos para Envio:</span>
                <span className="text-[10px] text-slate-400 font-normal">Navegador Local</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveClients.length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Clientes</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-black text-[#142142] dark:text-[#fab518]">
                    {effectiveDemands.length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Demandas</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Clique no botão abaixo para enviar os registros para as tabelas do seu Supabase PostgreSQL.
            </p>
          </div>

          <div className="space-y-2.5 pt-3">
            {/* BOTÃO PRINCIPAL OPÇÃO 6 */}
            <button
              type="button"
              id="btn-migrate-supabase"
              onClick={handleMigrateData}
              disabled={isSyncing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fab518] via-amber-400 to-amber-500 hover:opacity-95 text-[#142142] font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              <CloudUpload size={18} className={isSyncing ? 'animate-bounce text-[#142142]' : ''} />
              <span>{isSyncing ? 'Gravando no Supabase...' : 'Migrar Dados Locais p/ Supabase'}</span>
            </button>

            {/* Inserir Registro Piloto (Para validar mesmo com 0 clientes) */}
            <button
              type="button"
              onClick={handleInsertTestData}
              disabled={isSyncing}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              title="Cria 1 cliente e 1 demanda de teste diretamente no Supabase para validar as tabelas"
            >
              <Sparkles size={13} className="text-emerald-500" />
              <span>Inserir Linhas de Teste no Supabase</span>
            </button>

            {/* Puxar do Banco */}
            <button
              type="button"
              onClick={handlePullFromSupabase}
              disabled={isSyncing}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
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
                Script SQL de Criação das Tabelas
              </h3>
              <p className="text-[11px] text-slate-400">
                Execute este código no <strong>SQL Editor</strong> do painel do Supabase para criar as tabelas com um clique.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="px-4 py-2 rounded-xl bg-[#142142] dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedSql ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>

      {/* Step by step instructions */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#142142] dark:text-[#fab518] flex items-center gap-2">
          <HelpCircle size={15} />
          <span>Guia Rápido: Como Integrar em 3 Minutos</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] font-black text-xs flex items-center justify-center">
              1
            </div>
            <div className="font-bold text-[#142142] dark:text-white">Criar Tabelas</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Clique em <strong>Copiar Script SQL</strong> acima. No painel do Supabase, abra o <strong>SQL Editor</strong>, cole e clique em <strong>Run</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] font-black text-xs flex items-center justify-center">
              2
            </div>
            <div className="font-bold text-[#142142] dark:text-white">Copiar Chaves da API</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              No Supabase, vá em <strong>Project Settings &gt; API</strong>. Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong> e cole nos campos à esquerda.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] font-black text-xs flex items-center justify-center">
              3
            </div>
            <div className="font-bold text-[#142142] dark:text-white">Testar & Migrar</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Clique em <strong>Testar Conexão</strong>. Com o status verde, clique em <strong>Migrar Dados Locais</strong> para sincronizar seu banco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
