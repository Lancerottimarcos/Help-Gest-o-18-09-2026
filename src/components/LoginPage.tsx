import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Clock,
  ShieldAlert,
  Building2,
  User,
  ArrowLeft,
  Check,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { 
  checkBruteForceStatus, 
  recordFailedLoginAttempt, 
  recordSuccessfulLogin, 
  detectAndSanitizeInput,
  validateMasterCredentials,
  recordSessionActivity,
  findUserForPasswordRecovery,
  executePasswordReset,
  addSecurityLog,
  PasswordRecoveryUserInfo
} from '../utils/securityProtocols';

export interface LoginPageProps {
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
  defaultMode?: 'agency' | 'client';
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  defaultMode
}) => {
  // Profile Selection: 'agency' vs 'client'
  const [profile, setProfile] = useState<'agency' | 'client'>(() => {
    if (defaultMode) return defaultMode;
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal') || params.get('login') || params.get('area');
      if (portalParam === 'cliente' || search.includes('portal=cliente') || search.includes('login=cliente')) {
        return 'client';
      }
      if (portalParam === 'agencia' || search.includes('portal=agencia') || search.includes('login=agencia')) {
        return 'agency';
      }
    }
    return 'agency';
  });

  // View mode: 'login' | 'forgot'
  const [currentView, setCurrentView] = useState<'login' | 'forgot'>('login');

  // Form states
  const [username, setUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('user') || params.get('usuario') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [detectedUser, setDetectedUser] = useState<PasswordRecoveryUserInfo | null>(null);
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [confirmDirectPassword, setConfirmDirectPassword] = useState('');
  const [showDirectPass, setShowDirectPass] = useState(false);
  const [directResetSuccess, setDirectResetSuccess] = useState(false);

  // Security brute-force state
  const [lockStatus, setLockStatus] = useState(() => checkBruteForceStatus());

  // Listen to interval for lock timer
  useEffect(() => {
    const timer = setInterval(() => {
      const status = checkBruteForceStatus();
      setLockStatus(status);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to URL changes
  useEffect(() => {
    const handleUrl = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal') || params.get('login') || params.get('area');
      if (portalParam === 'cliente') {
        setProfile('client');
      } else if (portalParam === 'agencia') {
        setProfile('agency');
      }
      const userParam = params.get('user') || params.get('usuario');
      if (userParam) setUsername(userParam);
    };

    window.addEventListener('popstate', handleUrl);
    window.addEventListener('hashchange', handleUrl);
    return () => {
      window.removeEventListener('popstate', handleUrl);
      window.removeEventListener('hashchange', handleUrl);
    };
  }, []);

  const handleSelectProfile = (newProfile: 'agency' | 'client') => {
    setProfile(newProfile);
    setErrorMessage('');
    setCurrentView('login');
    try {
      const url = new URL(window.location.href);
      if (newProfile === 'client') {
        url.searchParams.set('portal', 'cliente');
      } else {
        url.searchParams.delete('portal');
        url.searchParams.delete('user');
        url.searchParams.delete('usuario');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleGoToForgot = () => {
    setForgotEmail(username.trim() || '');
    setForgotError('');
    setForgotSuccess(false);
    setDetectedUser(null);
    setDirectResetSuccess(false);
    setCurrentView('forgot');
  };

  const handleGoToLogin = () => {
    setErrorMessage('');
    setCurrentView('login');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const cleanInput = forgotEmail.trim();
    if (!cleanInput) {
      setForgotError('Por favor, informe seu email.');
      return;
    }

    setForgotLoading(true);

    try {
      const matched = findUserForPasswordRecovery(cleanInput);

      addSecurityLog({
        eventType: 'login_failed',
        severity: 'info',
        title: `Solicitação de Nova Senha (${profile === 'agency' ? 'Agência' : 'Cliente'})`,
        description: `O usuário com email/identificador "${cleanInput}" solicitou redefinição de senha.`,
        source: 'Recuperação de Senha',
        threatDetails: matched ? `Identificado como: ${matched.name} (${matched.roleLabel})` : 'Usuário externo',
      });

      setForgotLoading(false);
      setForgotSuccess(true);
      if (matched) {
        setDetectedUser(matched);
      }
    } catch {
      setForgotLoading(false);
      setForgotError('Erro ao enviar solicitação. Tente novamente.');
    }
  };

  const handleDirectReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!newDirectPassword || newDirectPassword.length < 4) {
      setForgotError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newDirectPassword !== confirmDirectPassword) {
      setForgotError('As senhas digitadas não coincidem.');
      return;
    }

    if (!detectedUser) return;

    setForgotLoading(true);
    const res = await executePasswordReset(detectedUser, newDirectPassword);
    setForgotLoading(false);

    if (res.success) {
      setDirectResetSuccess(true);
      setUsername(detectedUser.username || detectedUser.email);
      setPassword(newDirectPassword);
    } else {
      setForgotError(res.message);
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
        reasonText: `Tentativa de login rejeitada: terminal temporariamente bloqueado (${currentLock.remainingSeconds}s restantes).`
      });
      setErrorMessage(`Bloqueio de Segurança: Muitas tentativas incorretas. Aguarde ${currentLock.remainingSeconds} segundos.`);
      return;
    }

    const userCheck = detectAndSanitizeInput(username, 'Login - Usuário');
    const passCheck = detectAndSanitizeInput(password, 'Login - Senha');
    if (!userCheck.isClean || !passCheck.isClean) {
      recordFailedLoginAttempt({
        username: username.trim().slice(0, 40) || 'payload_malicioso',
        reason: 'tentativa_injecao',
        reasonText: 'Tentativa de injeção de payload interceptada pelo WAF.'
      });
      setErrorMessage('Caracteres inválidos detectados pelo sistema de segurança.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
      const validation = await validateMasterCredentials(cleanUser, password);

      if (validation.isValid) {
        const authUser = validation.authenticatedUser || {
          username: 'lancerotti',
          name: 'Marcos Lancerotti',
          email: 'lancerottirmarcos@gmail.com',
          role: 'proprietario',
          roleLabel: 'Proprietário da Agência',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isMaster: true,
        };

        // Verificação estrita de perfil: agência vs cliente
        if (profile === 'client' && authUser.role !== 'cliente') {
          setIsLoading(false);
          setErrorMessage('Estas credenciais pertencem à equipe da agência. Por favor, selecione "Agência" no topo para entrar.');
          return;
        }

        if (profile === 'agency' && authUser.role === 'cliente') {
          setIsLoading(false);
          setErrorMessage('Estas credenciais pertencem ao Portal do Cliente. Por favor, selecione "Cliente" no topo para entrar.');
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
          setErrorMessage('O acesso deste cliente ao portal está suspenso ou desativado. Entre em contato com a agência.');
          return;
        }

        const failReason = !validation.usernameMatched ? 'usuario_inexistente' : 'senha_incorreta';
        const failText = !validation.usernameMatched
          ? (profile === 'client' ? 'Usuário do cliente não encontrado.' : 'Usuário informado não consta na equipe da agência.')
          : 'Senha informada não confere com o cadastro.';

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
            setErrorMessage(
              profile === 'client' 
                ? `Usuário ou empresa não encontrados (${remainingAttempts} tentativas restantes).`
                : `Usuário da agência não encontrado (${remainingAttempts} tentativas restantes).`
            );
          } else {
            setErrorMessage(`Senha incorreta (${remainingAttempts} tentativas restantes).`);
          }
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao autenticar. Tente novamente.');
    }
  };

  const handleWhatsAppHelp = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const message = `Olá, equipe Help Ideias!\n\nPreciso de suporte para acessar o Portal do Cliente (${origin}). Poderiam me auxiliar com meus dados de acesso?`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Distinct theme tokens based on selected profile
  const isAgency = profile === 'agency';

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#f99616] selection:text-white"
      style={{
        background: 'radial-gradient(130% 130% at 50% 45%, #ffffff 0%, #faf8f5 28%, #f3efe8 60%, #e6e0d5 100%)'
      }}
    >
      {/* Subtle background glow */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isAgency 
            ? 'bg-gradient-to-tr from-[#f99616]/10 via-[#fef3e7]/40 to-transparent' 
            : 'bg-gradient-to-tr from-[#142142]/10 via-[#1e293b]/20 to-transparent'
        }`} 
      />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#faf5ed]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#ede6db]/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container - faithfully styled based on image.png */}
      <div className="w-full max-w-[420px] sm:max-w-[430px] bg-white rounded-[32px] sm:rounded-[36px] p-7 sm:p-9 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.03)] border border-slate-100/90 relative z-10 transition-all duration-300">
        
        {/* Top Bar: Circular Icon + Profile Selector */}
        <div className="flex items-center justify-between mb-5">
          {/* Circular top icon matching image.png */}
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isAgency 
                ? 'bg-[#fef5ea] text-[#f99616]' 
                : 'bg-[#142142]/10 text-[#142142]'
            }`}
          >
            <LogIn size={20} className="stroke-[1.8]" />
          </div>

          {/* Visual Profile Selector (Agência vs Cliente) */}
          <div 
            id="login-profile-selector"
            className="flex items-center p-1 bg-[#f3f4f6] rounded-full border border-slate-200/80 transition-colors"
          >
            <button
              type="button"
              id="btn-select-profile-agency"
              onClick={() => handleSelectProfile('agency')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAgency
                  ? 'bg-[#f99616] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={13} className="shrink-0" />
              <span>Agência</span>
            </button>
            <button
              type="button"
              id="btn-select-profile-client"
              onClick={() => handleSelectProfile('client')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                !isAgency
                  ? 'bg-[#142142] text-[#fab518] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User size={13} className="shrink-0" />
              <span>Cliente</span>
            </button>
          </div>
        </div>

        {currentView === 'login' ? (
          <>
            {/* Title & Subtitle matching image.png */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-[30px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">
                  Entrar
                </h1>
                {!isAgency && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#142142] text-[#fab518] border border-[#fab518]/30 shadow-2xs">
                    Portal do Cliente
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-normal leading-normal transition-all">
                {isAgency 
                  ? 'Acesse o painel completo da sua agência' 
                  : 'Acesso exclusivo para acompanhamento de demandas e aprovação de materiais'}
              </p>
            </div>

            {/* Dotted horizontal divider line matching image.png */}
            <div className="border-b border-dotted border-slate-200 my-4" />

            {/* Dedicated Client Access Banner */}
            {!isAgency && (
              <div className="mb-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
                <Sparkles size={16} className="text-[#f99616] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px] text-amber-900">
                  <strong className="text-amber-950">Ambiente Seguro do Cliente:</strong> Seu acesso é dedicado exclusivamente ao seu <strong>Portal do Cliente</strong> e à <strong>Central de Aprovações</strong>.
                </p>
              </div>
            )}

            {/* Security Alerts if locked */}
            {lockStatus.isLocked ? (
              <div 
                id="login-lockout-alert"
                className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-800">Terminal Temporariamente Bloqueado</p>
                  <p className="text-red-600 text-[11px] leading-relaxed">
                    Múltiplas tentativas incorretas foram detectadas.
                  </p>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-red-700 text-[11px] pt-0.5">
                    <Clock size={13} />
                    <span>Desbloqueio em: {lockStatus.remainingSeconds}s</span>
                  </div>
                </div>
              </div>
            ) : errorMessage ? (
              <div 
                id="login-error-alert"
                className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn"
              >
                <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            ) : null}

            {/* Caps Lock Alert */}
            {isCapsLockOn && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-amber-600" />
                <span className="text-[11px]">Aviso: <b>Caps Lock</b> ativado.</span>
              </div>
            )}

            {/* Login Form matching image.png */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Field 1: Email / Username */}
              <div>
                <label 
                  htmlFor="input-login-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  {isAgency ? 'Email' : 'Usuário ou Email do Cliente'}
                </label>
                <div className="relative">
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    disabled={lockStatus.isLocked}
                    autoComplete="username"
                    placeholder={isAgency ? 'voce@agencia.com' : 'usuario.empresa ou seu email'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyActivity}
                    onKeyUp={handleKeyActivity}
                    className={`w-full h-[52px] bg-[#f4f5f7] rounded-[18px] px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                      isAgency
                        ? 'border border-[#f99616] ring-4 ring-[#f99616]/20 bg-[#f4f5f7]'
                        : 'border border-[#142142] ring-4 ring-[#142142]/15 bg-[#f4f5f7]'
                    }`}
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label 
                  htmlFor="input-login-password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={lockStatus.isLocked}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyActivity}
                    onKeyUp={handleKeyActivity}
                    className={`w-full h-[52px] bg-[#edf0f4] rounded-[18px] border border-transparent pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-[#f4f5f7] transition-all ${
                      isAgency
                        ? 'focus:border-[#f99616] focus:ring-4 focus:ring-[#f99616]/20'
                        : 'focus:border-[#142142] focus:ring-4 focus:ring-[#142142]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Row: Checkbox "Manter-me conectado" + "Esqueci minha senha" */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-colors cursor-pointer ${
                      rememberMe
                        ? isAgency
                          ? 'bg-[#f99616] text-white'
                          : 'bg-[#142142] text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {rememberMe && <Check size={13} className="stroke-[3]" />}
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    Manter-me conectado
                  </span>
                </label>

                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={handleGoToForgot}
                  className="text-sm text-slate-500 hover:text-slate-800 font-normal transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Submit CTA Button matching image.png */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading || lockStatus.isLocked}
                  className={`w-full h-[52px] rounded-[20px] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                    isAgency
                      ? 'bg-[#f99616] hover:bg-[#ea8707] active:bg-[#d97c06] text-white'
                      : 'bg-[#142142] hover:bg-[#1a2b56] active:bg-[#0f172a] text-white'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} className="stroke-[2.2]" />
                      <span>{isAgency ? 'Entrar' : 'Acessar Portal do Cliente'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Forgot Password View matching the same clean design */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleGoToLogin}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Voltar ao login</span>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Recuperação
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-normal text-slate-900 tracking-tight">
                {isAgency ? 'Recuperar Acesso da Agência' : 'Ajuda com Acesso do Cliente'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {isAgency 
                  ? 'Informe seu email cadastrado para redefinir sua senha.' 
                  : 'As senhas dos clientes são geradas com segurança pela agência.'}
              </p>
            </div>

            <div className="border-b border-dotted border-slate-200 my-4" />

            {isAgency ? (
              forgotSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <Check size={16} className="text-emerald-600" />
                      <span>Solicitação Registrada</span>
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {detectedUser 
                        ? `Identificamos sua conta (${detectedUser.name}). Defina a nova senha abaixo:`
                        : 'A solicitação foi encaminhada ao administrador Marcos Lancerotti.'}
                    </p>
                  </div>

                  {detectedUser && !directResetSuccess && (
                    <form onSubmit={handleDirectReset} className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nova Senha
                        </label>
                        <div className="relative">
                          <input
                            type={showDirectPass ? 'text' : 'password'}
                            required
                            value={newDirectPassword}
                            onChange={(e) => setNewDirectPassword(e.target.value)}
                            placeholder="Mínimo 4 caracteres"
                            className="w-full h-11 bg-[#f4f5f7] rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDirectPass(!showDirectPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showDirectPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirmar Nova Senha
                        </label>
                        <input
                          type={showDirectPass ? 'text' : 'password'}
                          required
                          value={confirmDirectPassword}
                          onChange={(e) => setConfirmDirectPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full h-11 bg-[#f4f5f7] rounded-xl border border-slate-200 px-3 text-sm"
                        />
                      </div>

                      {forgotError && (
                        <p className="text-xs text-red-600 font-bold">{forgotError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full h-11 bg-[#f99616] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        {forgotLoading ? 'Atualizando...' : 'Definir Nova Senha'}
                      </button>
                    </form>
                  )}

                  {directResetSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
                      Senha alterada com sucesso! Clique em "Voltar ao login" para acessar.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGoToLogin}
                    className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Voltar ao Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      E-mail Cadastrado
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu.email@agencia.com"
                      className="w-full h-[52px] bg-[#f4f5f7] rounded-[18px] border border-slate-200 px-4 text-sm focus:outline-none focus:border-[#f99616] focus:ring-4 focus:ring-[#f99616]/20 transition-all"
                    />
                  </div>

                  {forgotError && (
                    <p className="text-xs text-red-600 font-bold">{forgotError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-[52px] bg-[#f99616] hover:bg-[#ea8707] text-white font-semibold rounded-[20px] text-sm transition-all cursor-pointer"
                  >
                    {forgotLoading ? 'Verificando...' : 'Enviar Solicitação'}
                  </button>
                </form>
              )
            ) : (
              /* Client Support info */
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">Suporte ao Cliente:</p>
                  <p className="leading-relaxed">
                    Seu usuário e senha de acesso são definidos e gerenciados pela equipe da Help Ideias.
                  </p>
                  <p className="leading-relaxed text-slate-500">
                    Clique abaixo para solicitar seus dados de acesso diretamente pelo WhatsApp do atendimento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleWhatsAppHelp}
                  className="w-full h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-[20px] text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle size={18} />
                  <span>Falar com o Atendimento no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
