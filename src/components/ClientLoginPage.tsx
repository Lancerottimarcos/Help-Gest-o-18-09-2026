import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Clock,
  KeyRound,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Building2,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';
import { 
  checkBruteForceStatus, 
  recordFailedLoginAttempt, 
  recordSuccessfulLogin, 
  detectAndSanitizeInput,
  validateMasterCredentials,
  recordSessionActivity,
  addSecurityLog
} from '../utils/securityProtocols';

interface ClientLoginPageProps {
  onLoginSuccess: (user: { 
    username: string; 
    name: string;
    email?: string;
    role?: string;
    roleLabel?: string;
    avatarUrl?: string;
    isMaster?: boolean;
    permissions?: any;
    clientId?: string;
    clientName?: string;
  }) => void;
  onSwitchToAgencyLogin: () => void;
  initialUsername?: string;
}

export const ClientLoginPage: React.FC<ClientLoginPageProps> = ({ 
  onLoginSuccess,
  onSwitchToAgencyLogin,
  initialUsername = ''
}) => {
  // Login form state
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Security brute-force state
  const [lockStatus, setLockStatus] = useState(() => checkBruteForceStatus());

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  useEffect(() => {
    const timer = setInterval(() => {
      const status = checkBruteForceStatus();
      setLockStatus(status);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const currentLock = checkBruteForceStatus();
    if (currentLock.isLocked) {
      recordFailedLoginAttempt({
        username: username.trim().toLowerCase() || 'desconhecido',
        reason: 'bloqueio_ativo',
        reasonText: `Tentativa de login no portal do cliente rejeitada: terminal temporariamente bloqueado (${currentLock.remainingSeconds}s restantes).`
      });
      setErrorMessage(`Bloqueio de Segurança: Muitas tentativas incorretas. Aguarde ${currentLock.remainingSeconds} segundos.`);
      return;
    }

    const userCheck = detectAndSanitizeInput(username, 'Login Cliente - Usuário');
    const passCheck = detectAndSanitizeInput(password, 'Login Cliente - Senha');
    if (!userCheck.isClean || !passCheck.isClean) {
      recordFailedLoginAttempt({
        username: username.trim().slice(0, 40) || 'payload_malicioso',
        reason: 'tentativa_injecao',
        reasonText: 'Tentativa de injeção de payload no portal do cliente interceptada pelo WAF.'
      });
      setErrorMessage('Caracteres inválidos detectados pelo sistema de segurança.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
      const validation = await validateMasterCredentials(cleanUser, password);

      if (validation.isValid) {
        recordSuccessfulLogin(cleanUser);
        recordSessionActivity();

        const authUser = validation.authenticatedUser;
        if (!authUser) {
          setIsLoading(false);
          setErrorMessage('Erro ao carregar dados do cliente.');
          return;
        }

        if (authUser.role !== 'cliente') {
          setIsLoading(false);
          setErrorMessage('Estas credenciais pertencem à equipe da agência. Por favor, acesse pelo Login da Agência.');
          return;
        }

        recordSuccessfulLogin(cleanUser);
        recordSessionActivity();

        try {
          localStorage.setItem('help_agency_auth', 'true');
          localStorage.setItem('help_agency_user', JSON.stringify(authUser));
          if (rememberMe) {
            localStorage.setItem('help_agency_remember', 'true');
          } else {
            localStorage.removeItem('help_agency_remember');
          }
        } catch {}
        setIsLoading(false);
        onLoginSuccess(authUser);
      } else {
        setIsLoading(false);
        if (validation.accountDisabled) {
          setErrorMessage('O acesso deste cliente ao portal está desativado pela agência. Entre em contato com o suporte.');
          return;
        }
        const failReason = !validation.usernameMatched ? 'usuario_inexistente' : 'senha_incorreta';
        const failText = !validation.usernameMatched
          ? 'Usuário do cliente não encontrado no cadastro.'
          : 'Senha de acesso incorreta.';

        const failStatus = recordFailedLoginAttempt({
          username: cleanUser || 'desconhecido',
          reason: failReason,
          reasonText: failText,
        });
        setLockStatus(failStatus);

        if (failStatus.isLocked) {
          setErrorMessage(`Sistema bloqueado temporariamente por ${Math.ceil(failStatus.remainingSeconds / 60)} min devido a múltiplas tentativas incorretas.`);
        } else {
          const remainingAttempts = 5 - failStatus.attempts;
          if (!validation.usernameMatched) {
            setErrorMessage(`Usuário ou empresa não encontrados. Verifique se digitou corretamente ou solicite seu usuário à agência (${remainingAttempts} tentativas restantes).`);
          } else {
            setErrorMessage(`Senha de acesso incorreta (${remainingAttempts} tentativas restantes).`);
          }
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao autenticar no portal. Tente novamente.');
    }
  };

  const handleOpenWhatsAppSupport = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const message = `Olá, equipe Help Ideias!\n\nPreciso de suporte para acessar o Portal do Cliente (${origin}). Poderiam me auxiliar com meus dados de acesso?`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#fab518] selection:text-[#142142]"
      style={{
        background: 'radial-gradient(130% 130% at 50% 45%, #142142 0%, #101a35 40%, #0a1124 100%)'
      }}
    >
      {/* Golden ambient diffusion glow for Client Portal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#fab518]/10 via-[#fab518]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#fab518]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#1a2b56]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Client Login Card */}
      <div className="w-full max-w-[460px] bg-white dark:bg-[#0f172a] rounded-[32px] p-8 sm:p-11 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_10px_25px_-5px_rgba(0,0,0,0.2)] border border-white/20 relative z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#fab518] to-[#ffd066] text-[#142142] flex items-center justify-center shadow-lg shadow-[#fab518]/20 font-black">
              <User size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#142142] bg-[#fab518] px-2.5 py-0.5 rounded-full shadow-xs">
                Portal do Cliente
              </span>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Help Ideias Digitais</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-goto-agency-login"
            onClick={onSwitchToAgencyLogin}
            className="text-[11px] font-black text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Acesso Administrativo da Agência"
          >
            <span>Área da Agência</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-[#142142] dark:text-white tracking-tight">
            Área do Cliente
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Acompanhe entregáveis, aprove materiais e visualize as demandas da sua marca em tempo real.
          </p>
        </div>

        {/* Quick Demo Test for Registered Clients */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Testar com clientes cadastrados:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              id="btn-demo-client-bellavita"
              onClick={() => {
                setUsername('bellavita');
                setPassword('123456');
                setErrorMessage('');
              }}
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-left transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold truncate">✨ Bella Vita</p>
              <p className="text-[9px] text-amber-700 dark:text-amber-400 font-mono">123456</p>
            </button>
            <button
              type="button"
              id="btn-demo-client-solaris"
              onClick={() => {
                setUsername('solaris');
                setPassword('123456');
                setErrorMessage('');
              }}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold truncate">⚡ Solaris</p>
              <p className="text-[9px] text-slate-500 font-mono">123456</p>
            </button>
            <button
              type="button"
              id="btn-demo-client-inovare"
              onClick={() => {
                setUsername('inovare');
                setPassword('123456');
                setErrorMessage('');
              }}
              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-left transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold truncate">🦷 Inovare</p>
              <p className="text-[9px] text-emerald-700 dark:text-emerald-400 font-mono">123456</p>
            </button>
          </div>
        </div>

        {/* Lockout or Error Alerts */}
        {lockStatus.isLocked ? (
          <div 
            id="client-login-lockout-alert"
            className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-800">Terminal Temporariamente Bloqueado</p>
              <p className="text-red-600 text-[11px] leading-relaxed">
                Múltiplas tentativas com senha incorreta foram detectadas.
              </p>
              <div className="flex items-center gap-1.5 font-mono font-bold text-red-700 text-[11px] pt-0.5">
                <Clock size={13} />
                <span>Desbloqueio em: {lockStatus.remainingSeconds}s</span>
              </div>
            </div>
          </div>
        ) : errorMessage ? (
          <div 
            id="client-login-error-alert"
            className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn"
          >
            <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        ) : null}

        {/* Caps Lock Alert */}
        {isCapsLockOn && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-amber-600" />
            <span className="text-[11px]">Aviso: <b>Caps Lock</b> ativado.</span>
          </div>
        )}

        {/* Client Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 mt-5">
          {/* Client Username or Email */}
          <div>
            <label 
              htmlFor="client-username"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2"
            >
              Usuário ou E-mail da sua Empresa
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm select-none">
                @
              </span>
              <input
                id="client-username"
                type="text"
                required
                disabled={lockStatus.isLocked}
                autoComplete="username"
                placeholder="usuario.empresa ou seu email"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onKeyDown={handleKeyActivity}
                onKeyUp={handleKeyActivity}
                className="w-full h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 pl-8 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fab518] focus:border-transparent transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Client Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                htmlFor="client-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Senha de Acesso
              </label>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="text-xs font-bold text-[#f99616] hover:text-[#d87d0c] hover:underline cursor-pointer"
              >
                Esqueceu ou precisa de ajuda?
              </button>
            </div>

            <div className="relative">
              <input
                id="client-password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={lockStatus.isLocked}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyActivity}
                onKeyUp={handleKeyActivity}
                className="w-full h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 pl-4 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fab518] focus:border-transparent transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & Security indicator */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#fab518] focus:ring-[#fab518] accent-[#fab518] cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Lembrar meu acesso
              </span>
            </label>

            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Ambiente Seguro</span>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-client-login-submit"
            disabled={isLoading || lockStatus.isLocked}
            className="w-full h-12 mt-2 bg-[#fab518] hover:bg-[#e29f11] active:bg-[#c88907] text-[#142142] font-black rounded-2xl text-sm transition-all shadow-md shadow-[#fab518]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#142142] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>Entrar no Portal do Cliente</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Agency Login Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
            Faz parte da equipe interna da agência Help Ideias?
          </p>
          <button
            type="button"
            id="btn-switch-to-agency-login"
            onClick={onSwitchToAgencyLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#142142] dark:text-white font-black text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Acesso Administrativo da Agência</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Support / Help Modal for Clients */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#fab518] flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <h3 className="text-base font-black text-[#142142] dark:text-white">
                  Ajuda de Acesso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O nome de usuário e a senha do Portal são gerados exclusivamente pelo gestor da sua conta na agência Help Ideias.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-[#142142] dark:text-white">Contato Direto do Suporte:</p>
              <p>Fale diretamente com Marcos Lancerotti ou a equipe de atendimento via WhatsApp para receber sua senha atualizada.</p>
            </div>

            <button
              type="button"
              onClick={handleOpenWhatsAppSupport}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <MessageCircle size={16} />
              <span>Falar no WhatsApp da Agência</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
