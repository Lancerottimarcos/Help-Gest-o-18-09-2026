import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Database, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Shield,
  Layers
} from 'lucide-react';
import { Client } from '../types';
import { supabaseService } from '../services/supabaseService';

interface ClientPasswordManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onUpdateClient: (updatedClient: Client) => void;
  onLoginAsClient?: (client: Client) => void;
  onRefreshSupabase?: () => void;
  supabaseSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

interface ClientDraftState {
  username: string;
  password: string;
  enabled: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: string;
  showPassword?: boolean;
  copiedToast?: boolean;
}

export const ClientPasswordManagerModal: React.FC<ClientPasswordManagerModalProps> = ({
  isOpen,
  onClose,
  clients,
  onUpdateClient,
  onLoginAsClient,
  onRefreshSupabase,
  supabaseSyncStatus = 'idle',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSavedSuccess, setBulkSavedSuccess] = useState(false);

  // Local editable draft state for each client to make edits smooth and track changes
  const [drafts, setDrafts] = useState<Record<string, ClientDraftState>>(() => {
    const initial: Record<string, ClientDraftState> = {};
    clients.forEach((c) => {
      initial[c.id] = {
        username: c.portalUsername || c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        password: c.portalPassword || '123456',
        enabled: c.portalAccessEnabled !== false,
        isDirty: false,
        isSaving: false,
        showPassword: false,
        copiedToast: false,
      };
    });
    return initial;
  });

  // Keep draft map synced when clients prop changes for any clients not dirty
  React.useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      clients.forEach((c) => {
        if (!next[c.id] || !next[c.id].isDirty) {
          next[c.id] = {
            username: c.portalUsername || c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            password: c.portalPassword || '123456',
            enabled: c.portalAccessEnabled !== false,
            isDirty: false,
            isSaving: false,
            showPassword: next[c.id]?.showPassword || false,
            copiedToast: false,
          };
        }
      });
      return next;
    });
  }, [clients]);

  if (!isOpen) return null;

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const draft = drafts[c.id];
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (draft && draft.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (statusFilter === 'enabled') {
      return draft ? draft.enabled : c.portalAccessEnabled !== false;
    }
    if (statusFilter === 'disabled') {
      return draft ? !draft.enabled : c.portalAccessEnabled === false;
    }

    return true;
  });

  const totalEnabled = clients.filter((c) => (drafts[c.id]?.enabled ?? (c.portalAccessEnabled !== false))).length;
  const anyDirty = Object.values(drafts).some((d) => d.isDirty);

  // Helper to generate a friendly secure password
  const generateStrongPassword = (clientName: string): string => {
    const cleanPrefix = clientName.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Help';
    const capitalized = cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1).toLowerCase();
    const symbols = ['@', '#', '$', '!'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${capitalized}${randomSymbol}${randomNum}`;
  };

  const handleFieldChange = (clientId: string, field: 'username' | 'password' | 'enabled', value: any) => {
    setDrafts((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: value,
        isDirty: true,
      },
    }));
  };

  const handleGeneratePassword = (client: Client) => {
    const generated = generateStrongPassword(client.name);
    setDrafts((prev) => ({
      ...prev,
      [client.id]: {
        ...prev[client.id],
        password: generated,
        isDirty: true,
        showPassword: true,
      },
    }));
  };

  const handleSuggestUsername = (client: Client) => {
    const suggested = client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setDrafts((prev) => ({
      ...prev,
      [client.id]: {
        ...prev[client.id],
        username: suggested,
        isDirty: true,
      },
    }));
  };

  const handleToggleShowPassword = (clientId: string) => {
    setDrafts((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        showPassword: !prev[clientId].showPassword,
      },
    }));
  };

  const handleSaveIndividualClient = async (client: Client) => {
    const draft = drafts[client.id];
    if (!draft) return;

    setDrafts((prev) => ({
      ...prev,
      [client.id]: { ...prev[client.id], isSaving: true },
    }));

    const cleanUser = draft.username.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = draft.password.trim();

    const updatedClient: Client = {
      ...client,
      portalUsername: cleanUser,
      portalPassword: cleanPass,
      portalAccessEnabled: draft.enabled,
    };

    // 1. Update React state and local storage via onUpdateClient
    onUpdateClient(updatedClient);

    // 2. Direct Supabase save with error resilience
    try {
      if (supabaseService.isConfigured()) {
        await supabaseService.upsertClient(updatedClient);
      }
    } catch (err) {
      console.warn('Erro ao salvar no Supabase:', err);
    }

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setDrafts((prev) => ({
      ...prev,
      [client.id]: {
        ...prev[client.id],
        username: cleanUser,
        password: cleanPass,
        isSaving: false,
        isDirty: false,
        lastSavedAt: timeStr,
      },
    }));
  };

  const handleSaveAllDirty = async () => {
    setBulkSaving(true);
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    for (const client of clients) {
      const draft = drafts[client.id];
      if (draft && draft.isDirty) {
        const cleanUser = draft.username.trim().toLowerCase().replace(/^@/, '');
        const cleanPass = draft.password.trim();

        const updatedClient: Client = {
          ...client,
          portalUsername: cleanUser,
          portalPassword: cleanPass,
          portalAccessEnabled: draft.enabled,
        };

        onUpdateClient(updatedClient);

        try {
          if (supabaseService.isConfigured()) {
            await supabaseService.upsertClient(updatedClient);
          }
        } catch {}
      }
    }

    setDrafts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id].isDirty) {
          next[id] = {
            ...next[id],
            isDirty: false,
            isSaving: false,
            lastSavedAt: timeStr,
          };
        }
      });
      return next;
    });

    setBulkSaving(false);
    setBulkSavedSuccess(true);
    setTimeout(() => setBulkSavedSuccess(false), 3000);
  };

  const handleGenerateAllDefaultPasswords = () => {
    setDrafts((prev) => {
      const next = { ...prev };
      clients.forEach((c) => {
        const current = next[c.id];
        if (!current.password || current.password === '123456') {
          next[c.id] = {
            ...current,
            password: generateStrongPassword(c.name),
            isDirty: true,
            showPassword: true,
          };
        }
      });
      return next;
    });
  };

  const handleCopyCredentials = (client: Client) => {
    const draft = drafts[client.id];
    const username = draft?.username || client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const password = draft?.password || client.portalPassword || '123456';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/?login=cliente&user=${encodeURIComponent(username)}`;

    const text = `Olá, ${client.contactName || client.name}!\n\nSeguem seus dados de acesso exclusivo ao Portal do Cliente da Help Ideias:\n\n🌐 Tela de Login: ${loginUrl}\n👤 Usuário: ${username}\n🔑 Senha: ${password}\n\nAo clicar no link, abrirá a tela de login para inserir seus dados e ter acesso imediato às suas demandas e aprovações em tempo real!`;

    navigator.clipboard.writeText(text);

    setDrafts((prev) => ({
      ...prev,
      [client.id]: { ...prev[client.id], copiedToast: true },
    }));

    setTimeout(() => {
      setDrafts((prev) => ({
        ...prev,
        [client.id]: { ...prev[client.id], copiedToast: false },
      }));
    }, 2500);
  };

  const handleSendWhatsApp = (client: Client) => {
    const draft = drafts[client.id];
    const username = draft?.username || client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const password = draft?.password || client.portalPassword || '123456';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/?login=cliente&user=${encodeURIComponent(username)}`;

    const message = `Olá, ${client.contactName || client.name}!\n\nSeguem suas credenciais individuais do Portal do Cliente da Help Ideias:\n\n🌐 Link da Tela de Login: ${loginUrl}\n👤 Usuário: ${username}\n🔑 Senha: ${password}\n\nAo clicar no link, abrirá a tela de login para você inserir seus dados e ter acesso imediato às suas demandas e aprovações em tempo real!`;

    const cleanPhone = (client.phone || '').replace(/\D/g, '');
    const phoneWithDdi = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleTestClientLogin = (client: Client) => {
    const draft = drafts[client.id];
    const updatedClient: Client = {
      ...client,
      portalUsername: draft?.username || client.portalUsername,
      portalPassword: draft?.password || client.portalPassword,
      portalAccessEnabled: draft ? draft.enabled : client.portalAccessEnabled,
    };
    if (onLoginAsClient) {
      onLoginAsClient(updatedClient);
      onClose();
    }
  };

  const sqlMigrationCode = `-- ====================================================================
-- ADICIONAR COLUNAS DE ACESSO DO PORTAL NA TABELA 'clients' DO SUPABASE
-- Cole no SQL Editor do seu projeto Supabase e clique em 'Run'
-- ====================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_username TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_password TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT true;

-- Criar índice para busca rápida por nome de usuário do portal
CREATE INDEX IF NOT EXISTS idx_clients_portal_username ON public.clients (portal_username);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#142142]/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
      <div 
        id="modal-client-password-manager"
        className="bg-white dark:bg-[#0f172a] w-full max-w-5xl max-h-[94vh] flex flex-col rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#142142] to-[#fab518] text-white flex items-center justify-center shadow-md">
              <KeyRound size={22} className="text-[#fab518]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#142142] dark:text-white tracking-tight">
                  Gestão de Senhas do Portal do Cliente
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Database size={11} />
                  <span>Sincronizado Supabase</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Defina usuário e senha individuais para cada cliente. Os dados são persistidos no Supabase e no banco central.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {anyDirty && (
              <button
                type="button"
                id="btn-save-all-client-passwords"
                onClick={handleSaveAllDirty}
                disabled={bulkSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {bulkSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : bulkSavedSuccess ? (
                  <Check size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>{bulkSaving ? 'Salvando...' : bulkSavedSuccess ? 'Tudo Salvo!' : 'Salvar Alterações'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-close-password-manager"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="p-4 sm:px-8 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente, empresa ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/80 text-xs sm:text-sm text-[#142142] dark:text-white pl-9 pr-3.5 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('enabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'enabled'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Ativos ({totalEnabled})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Pausados ({clients.length - totalEnabled})
            </button>
          </div>

          {/* Quick Bulk Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-generate-all-passwords"
              onClick={handleGenerateAllDefaultPasswords}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#142142] dark:text-[#fab518] hover:bg-[#fab518] hover:text-[#142142] text-xs font-bold transition-colors cursor-pointer border border-amber-200/80 dark:border-amber-800"
              title="Gera senhas seguras para clientes com senha padrão ou vazia"
            >
              <Sparkles size={13} className="text-[#fab518]" />
              <span>Gerar Senhas Fortes</span>
            </button>

            <button
              type="button"
              id="btn-toggle-sql-guide"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              title="Ver instruções do banco de dados no Supabase"
            >
              <Database size={13} className="text-slate-500" />
              <span>SQL Supabase</span>
              {showSqlGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Collapsible Supabase SQL Script Helper */}
        {showSqlGuide && (
          <div className="bg-[#0b1329] text-white p-4 sm:px-8 border-b border-slate-800 space-y-2 shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#fab518]">
                <Shield size={14} />
                <span>Script SQL de Colunas no Supabase</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#fab518] hover:text-[#142142] text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Cole este comando no <strong>SQL Editor do seu projeto Supabase</strong> se você ainda não tiver as colunas criadas na tabela <code>clients</code>. O sistema salva automaticamente com fallback inteligente.
            </p>
            <pre className="text-[11px] font-mono bg-black/40 p-2.5 rounded-xl text-emerald-300 overflow-x-auto selection:bg-[#fab518] selection:text-[#142142]">
              {sqlMigrationCode}
            </pre>
          </div>
        )}

        {/* Client List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/50 dark:bg-[#0b1120]">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
              <KeyRound size={36} className="text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Nenhum cliente encontrado com os filtros atuais.
              </p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const draft = drafts[client.id] || {
                username: client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                password: client.portalPassword || '123456',
                enabled: client.portalAccessEnabled !== false,
                isDirty: false,
                isSaving: false,
                showPassword: false,
                copiedToast: false,
              };

              const isPassDefault = draft.password === '123456';
              const isPassStrong = draft.password.length >= 8 && /[A-Z]/.test(draft.password) && /[0-9]/.test(draft.password);

              return (
                <div
                  key={client.id}
                  id={`client-credential-card-${client.id}`}
                  className={`bg-white dark:bg-[#0f172a] rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                    draft.isDirty
                      ? 'border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-400/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Client Profile Info */}
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <div className="relative shrink-0">
                        {client.avatar ? (
                          <img
                            src={client.avatar}
                            alt={client.name}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#142142] text-[#fab518] text-base font-black flex items-center justify-center">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span 
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0f172a] ${
                            draft.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={draft.enabled ? 'Portal Ativo' : 'Portal Desativado'}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-[#142142] dark:text-white truncate">
                            {client.name}
                          </h4>
                          {draft.isDirty && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Não salvo
                            </span>
                          )}
                          {draft.lastSavedAt && !draft.isDirty && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                              <Check size={10} />
                              <span>{draft.lastSavedAt}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {client.companyName && client.companyName !== client.name ? `${client.companyName} • ` : ''}
                          {client.segment}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Username and Password Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[320px]">
                      {/* Username Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <span>Usuário</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSuggestUsername(client)}
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            title="Gerar nome de usuário sugerido a partir do nome"
                          >
                            Auto-sugerir
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs select-none">
                            @
                          </span>
                          <input
                            type="text"
                            value={draft.username}
                            onChange={(e) => handleFieldChange(client.id, 'username', e.target.value.toLowerCase())}
                            placeholder="usuario.empresa"
                            className="w-full bg-slate-50 dark:bg-slate-800/90 text-xs sm:text-sm font-mono font-medium text-[#142142] dark:text-white pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              Senha
                            </label>
                            {isPassDefault ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                                Padrão
                              </span>
                            ) : isPassStrong ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                Forte
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGeneratePassword(client)}
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                            title="Gerar senha forte e amigável"
                          >
                            <Sparkles size={10} />
                            <span>Gerar Forte</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={draft.showPassword ? 'text' : 'password'}
                            value={draft.password}
                            onChange={(e) => handleFieldChange(client.id, 'password', e.target.value)}
                            placeholder="Digite a senha"
                            className="w-full bg-slate-50 dark:bg-slate-800/90 text-xs sm:text-sm font-mono font-medium text-[#142142] dark:text-white pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleShowPassword(client.id)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                            title={draft.showPassword ? 'Ocultar senha' : 'Ver senha'}
                          >
                            {draft.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Toggle Access & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Access Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(e) => handleFieldChange(client.id, 'enabled', e.target.checked)}
                          className="w-3.5 h-3.5 accent-[#fab518] rounded cursor-pointer"
                        />
                        <span className={`text-[11px] font-bold ${draft.enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {draft.enabled ? 'Ativo' : 'Pausado'}
                        </span>
                      </label>

                      {/* Copy Access Message */}
                      <button
                        type="button"
                        id={`btn-copy-access-${client.id}`}
                        onClick={() => handleCopyCredentials(client)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                          draft.copiedToast
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title="Copiar dados formatados de login para enviar ao cliente"
                      >
                        {draft.copiedToast ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      {/* WhatsApp Share */}
                      <button
                        type="button"
                        id={`btn-whatsapp-access-${client.id}`}
                        onClick={() => handleSendWhatsApp(client)}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Enviar credenciais diretamente no WhatsApp do cliente"
                      >
                        <Send size={14} />
                      </button>

                      {/* Test Login as Client */}
                      {onLoginAsClient && (
                        <button
                          type="button"
                          id={`btn-test-login-${client.id}`}
                          onClick={() => handleTestClientLogin(client)}
                          className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Simular login como este cliente para testar visualização do portal"
                        >
                          <LogIn size={14} />
                        </button>
                      )}

                      {/* Save Individual */}
                      <button
                        type="button"
                        id={`btn-save-client-access-${client.id}`}
                        onClick={() => handleSaveIndividualClient(client)}
                        disabled={draft.isSaving}
                        className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                          draft.isDirty
                            ? 'bg-[#fab518] hover:bg-[#e29f11] text-[#142142]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Salvar credenciais deste cliente no Supabase"
                      >
                        {draft.isSaving ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Database size={13} />
                        )}
                        <span>{draft.isSaving ? 'Gravando...' : 'Salvar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0f172a] shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>Senhas criptografadas e protegidas contra injeções SQL e XSS</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {anyDirty && (
              <button
                type="button"
                onClick={handleSaveAllDirty}
                disabled={bulkSaving}
                className="px-6 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {bulkSaving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Salvar Todas no Supabase</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
