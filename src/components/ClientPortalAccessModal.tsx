import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Sparkles, 
  MessageCircle, 
  ShieldCheck, 
  LogIn, 
  Save, 
  RefreshCw,
  Building2,
  Lock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Client } from '../types';

interface ClientPortalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (updatedClient: Client) => void;
  onLoginAsClient?: (client: Client) => void;
}

export const ClientPortalAccessModal: React.FC<ClientPortalAccessModalProps> = ({
  isOpen,
  onClose,
  client,
  onSave,
  onLoginAsClient,
}) => {
  if (!isOpen || !client) return null;

  // Generate suggested username based on client name
  const generateSuggestedUsername = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
  };

  // Generate secure readable password
  const generateRandomPassword = (): string => {
    const prefixes = ['Help', 'Agencia', 'Sucesso', 'Foco', 'Ideia', 'Criativo'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const symbols = ['#', '!', '*', '$'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    return `${prefix}${num}${symbol}`;
  };

  const defaultUser = client.portalUsername || generateSuggestedUsername(client.name);
  const defaultPass = client.portalPassword || '123456';

  const [username, setUsername] = useState(defaultUser);
  const [password, setPassword] = useState(defaultPass);
  const [isAccessEnabled, setIsAccessEnabled] = useState(client.portalAccessEnabled !== false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    setUsername(client.portalUsername || generateSuggestedUsername(client.name));
    setPassword(client.portalPassword || '123456');
    setIsAccessEnabled(client.portalAccessEnabled !== false);
    setShowPassword(false);
    setIsCopied(false);
    setSaveSuccessNotice(false);
  }, [client]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    const updated: Client = {
      ...client,
      portalUsername: username.trim().toLowerCase(),
      portalPassword: password.trim(),
      portalAccessEnabled: isAccessEnabled,
    };

    onSave(updated);

    // Save in agency_clients localStorage
    try {
      const stored = localStorage.getItem('agency_clients');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const next = list.map((c: Client) => (c.id === client.id ? updated : c));
          localStorage.setItem('agency_clients', JSON.stringify(next));
        }
      }
    } catch {}

    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      onClose();
    }, 1200);
  };

  const handleCopyAccessMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.helpideias.com.br';
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const message = `Olá, equipe da *${client.name}*! 👋\n\n` +
      `Seu acesso exclusivo ao Portal de Demandas e Materiais da *Help Ideias Digitais* está configurado:\n\n` +
      `🌐 *Link de Acesso:* ${origin}\n` +
      `👤 *Usuário:* ${cleanUser}\n` +
      `🔑 *Senha:* ${cleanPass}\n\n` +
      `Após fazer o login com seu usuário e senha, na página *Demandas*, você terá acesso a todos os materiais, campanhas e criativos produzidos exclusivamente para a sua marca.`;

    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.helpideias.com.br';
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const message = `Olá, equipe da *${client.name}*! 👋\n\n` +
      `Seu acesso exclusivo ao Portal de Demandas da *Help Ideias Digitais* está pronto:\n\n` +
      `🌐 *Link de Acesso:* ${origin}\n` +
      `👤 *Usuário:* ${cleanUser}\n` +
      `🔑 *Senha:* ${cleanPass}\n\n` +
      `Acesse para visualizar os materiais e aprovar seus entregáveis em tempo real!`;

    const cleanPhone = (client.phone || '').replace(/\D/g, '');
    const phoneWithDdi = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleTestLogin = () => {
    if (onLoginAsClient) {
      onLoginAsClient({
        ...client,
        portalUsername: username.trim().toLowerCase(),
        portalPassword: password.trim(),
        portalAccessEnabled: isAccessEnabled,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-[#142142]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div 
        className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0f172a] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#142142] dark:bg-slate-800 text-[#fab518] flex items-center justify-center font-black shrink-0 shadow-xs border border-slate-200/60 dark:border-slate-700">
              <KeyRound size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Portal do Cliente
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white truncate">
                Acesso Individual: {client.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Success Banner */}
          {saveSuccessNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Credenciais salvas com sucesso! O cliente já pode fazer login.</span>
            </div>
          )}

          {/* Client Info Banner */}
          <div className="p-4 rounded-2xl bg-[#F8F9FB] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={client.avatar || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&auto=format&fit=crop&q=80'}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-[#142142] dark:text-white truncate">
                  {client.name}
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {client.email || 'Email não cadastrado'} · {client.phone || 'Sem telefone'}
                </span>
              </div>
            </div>

            {/* Toggle Status */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                {isAccessEnabled ? 'Acesso Ativo' : 'Bloqueado'}
              </label>
              <button
                type="button"
                onClick={() => setIsAccessEnabled(!isAccessEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isAccessEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform block absolute top-1 ${
                    isAccessEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#142142] dark:text-white">
                Nome de Usuário (Login) *
              </label>
              <button
                type="button"
                onClick={() => setUsername(generateSuggestedUsername(client.name))}
                className="text-[11px] font-bold text-amber-700 dark:text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={11} />
                <span>Sugerir Usuário</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="ex: bellavita ou solaris"
                className="w-full bg-[#F5F7FA] dark:bg-slate-900 text-xs sm:text-sm font-mono font-bold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              O cliente usará este usuário ou o seu e-mail para entrar no sistema.
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#142142] dark:text-white">
                Senha de Acesso *
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateRandomPassword())}
                className="text-[11px] font-bold text-amber-700 dark:text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Gerar Senha Segura</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="w-full bg-[#F5F7FA] dark:bg-slate-900 text-xs sm:text-sm font-mono font-bold text-[#142142] dark:text-white pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Scope Explanation Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-black flex items-center gap-1.5 text-amber-950 dark:text-amber-300">
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Isolamento Seguro de Conteúdo:</span>
            </span>
            <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-300/90">
              Ao efetuar o login, este cliente será direcionado exclusivamente para a página <strong>Demandas</strong>, visualizando apenas os materiais, vídeos e campanhas da <strong>{client.name}</strong>, sem acesso a dados internos ou de outros clientes.
            </p>
          </div>

          {/* Quick Sharing & Test Tools */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Compartilhamento Rápido
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyAccessMessage}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-[#142142] dark:text-white rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{isCopied ? 'Mensagem Copiada!' : 'Copiar Convite'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <MessageCircle size={15} />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>

            {onLoginAsClient && (
              <button
                type="button"
                onClick={handleTestLogin}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogIn size={13} className="text-[#fab518]" />
                <span>Simular / Testar Login como este Cliente</span>
              </button>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Save size={14} />
              <span>Salvar Credenciais</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
