import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Check,
  ShieldAlert,
  Clock,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft
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

interface LoginPageProps {
  onLoginSuccess: (user: { 
    username: string; 
    name: string;
    email?: string;
    role?: string;
    roleLabel?: string;
    avatarUrl?: string;
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // View mode: 'login' | 'forgot'
  const [currentView, setCurrentView] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Optional direct reset state for detected user
  const [detectedUser, setDetectedUser] = useState<PasswordRecoveryUserInfo | null>(null);
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [confirmDirectPassword, setConfirmDirectPassword] = useState('');
  const [showDirectPass, setShowDirectPass] = useState(false);
  const [directResetSuccess, setDirectResetSuccess] = useState(false);

  // Security brute-force state
  const [lockStatus, setLockStatus] = useState(() => checkBruteForceStatus());

  // Interval to update countdown if locked
  useEffect(() => {
    const timer = setInterval(() => {
      const status = checkBruteForceStatus();
      setLockStatus(status);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect Caps Lock state on key events
  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Switch to Forgot Password view
  const handleGoToForgot = () => {
    setForgotEmail(username.trim() || '');
    setForgotError('');
    setForgotSuccess(false);
    setDetectedUser(null);
    setDirectResetSuccess(false);
    setCurrentView('forgot');
  };

  // Switch back to Login view
  const handleGoToLogin = () => {
    setErrorMessage('');
    setCurrentView('login');
  };

  // Handle forgot password request submission
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
      // Look up user to see if it matches any admin/collaborator
      const matched = findUserForPasswordRecovery(cleanInput);

      // Log the recovery request
      addSecurityLog({
        eventType: 'login_failed',
        severity: 'info',
        title: 'Solicitação de Nova Senha Recebida',
        description: `O usuário com email/identificador "${cleanInput}" solicitou redefinição de senha ao administrador.`,
        source: 'Recuperação de Senha',
        threatDetails: matched ? `Identificado como: ${matched.name} (${matched.roleLabel})` : 'Usuário externo / solicitante',
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

  // Handle direct reset when user is authorized
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

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Check if locked out
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

    // 2. WAF Injection defense screening
    const userCheck = detectAndSanitizeInput(username, 'Login - Usuário');
    const passCheck = detectAndSanitizeInput(password, 'Login - Senha');
    if (!userCheck.isClean || !passCheck.isClean) {
      recordFailedLoginAttempt({
        username: username.trim().slice(0, 40) || 'payload_malicioso',
        reason: 'tentativa_injecao',
        reasonText: 'Tentativa de injeção de payload malicioso interceptada pelo WAF.'
      });
      setErrorMessage('Caracteres inválidos detectados pelo sistema de segurança.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const validation = await validateMasterCredentials(cleanUser, password);

      if (validation.isValid) {
        recordSuccessfulLogin(cleanUser);
        recordSessionActivity();

        const authUser = validation.authenticatedUser || {
          username: 'lancerotti',
          name: 'Marcos Lancerotti',
          email: 'lancerottirmarcos@gmail.com',
          role: 'proprietario',
          roleLabel: 'Proprietário da Agência',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isMaster: true,
        };

        if (rememberMe) {
          try {
            localStorage.setItem('help_agency_auth', 'true');
            localStorage.setItem('help_agency_user', JSON.stringify(authUser));
          } catch {}
        }
        setIsLoading(false);
        onLoginSuccess(authUser);
      } else {
        setIsLoading(false);
        const failReason = !validation.usernameMatched ? 'usuario_inexistente' : 'senha_incorreta';
        const failText = !validation.usernameMatched
          ? 'Usuário informado não consta no cofre de credenciais autorizadas.'
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
            setErrorMessage(`Usuário não encontrado. (${remainingAttempts} ${remainingAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'}).`);
          } else {
            setErrorMessage(`Senha incorreta. (${remainingAttempts} ${remainingAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'}).`);
          }
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao autenticar. Tente novamente.');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#f99616] selection:text-white"
      style={{
        background: 'radial-gradient(130% 130% at 50% 45%, #ffffff 0%, #faf8f5 28%, #f3efe8 60%, #e6e0d5 100%)'
      }}
    >
      {/* Subtle studio ambient diffusion glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#f99616]/4 via-[#fef3e7]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#faf5ed]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#ede6db]/60 rounded-full blur-3xl pointer-events-none" />

      {/* ======================================================== */}
      {/* VIEW 1: LOGIN CARD                                       */}
      {/* ======================================================== */}
      {currentView === 'login' && (
        <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 sm:p-11 shadow-[0_25px_60px_-15px_rgba(20,33,66,0.08),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-white/90 relative z-10 animate-fadeIn">
          
          {/* Top Circular Badge with Door/Login Icon */}
          <div className="w-12 h-12 rounded-full bg-[#fef3e7] flex items-center justify-center mb-6">
            <LogIn size={20} className="text-[#f99616] stroke-[2.2]" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-normal text-[#1e293b] tracking-tight">
              Entrar
            </h1>
            <p className="text-sm text-slate-500 font-normal">
              Acesse o painel da sua agência
            </p>
          </div>

          {/* Dotted Divider */}
          <div className="my-6 border-b border-dotted border-slate-200" />

          {/* Lockout or Error Alerts */}
          {lockStatus.isLocked ? (
            <div 
              id="login-lockout-alert"
              className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-800">Acesso Temporariamente Bloqueado</p>
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
              <span className="text-[11px]">Aviso: <b>Caps Lock</b> está ativado.</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email / Username field */}
            <div>
              <label 
                htmlFor="login-username"
                className="block text-xs font-medium text-slate-500 mb-2"
              >
                Email
              </label>
              <input
                id="login-username"
                type="text"
                required
                disabled={lockStatus.isLocked}
                autoComplete="username"
                placeholder="voce@agencia.com"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                onKeyDown={handleKeyActivity}
                onKeyUp={handleKeyActivity}
                className="w-full bg-[#f1f3f7] hover:bg-[#ebedf2] focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-4 py-3 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-hidden transition-all font-normal disabled:opacity-50"
              />
            </div>

            {/* Password field */}
            <div>
              <label 
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-500 mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockStatus.isLocked}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={handleKeyActivity}
                  onKeyUp={handleKeyActivity}
                  className="w-full bg-[#f1f3f7] hover:bg-[#ebedf2] focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-4 pr-11 py-3 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-hidden transition-all font-normal tracking-wider disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
            </div>

            {/* Options: Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="login-remember-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div 
                  className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${
                    rememberMe 
                      ? 'bg-[#f99616] text-white' 
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {rememberMe && <Check size={11} className="stroke-[3.5]" />}
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Manter-me conectado
                </span>
              </label>

              <button
                type="button"
                onClick={handleGoToForgot}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Primary Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading || lockStatus.isLocked}
              className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-[#f99616] hover:bg-[#e88708] active:scale-[0.99] text-black font-bold text-sm shadow-[0_4px_14px_rgba(249,150,22,0.25)] hover:shadow-[0_6px_20px_rgba(249,150,22,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : lockStatus.isLocked ? (
                <span>Acesso Suspenso</span>
              ) : (
                <>
                  <LogIn size={17} className="stroke-[2.5]" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: ESQUECI MINHA SENHA (Matching reference image)    */}
      {/* ======================================================== */}
      {currentView === 'forgot' && (
        <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 sm:p-11 shadow-[0_25px_60px_-15px_rgba(20,33,66,0.08),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-white/90 relative z-10 animate-fadeIn">
          
          {/* Top Circular Badge with Key Icon */}
          <div className="w-12 h-12 rounded-full bg-[#fef3e7] flex items-center justify-center mb-6">
            <KeyRound size={20} className="text-[#f99616] stroke-[2.2]" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-normal text-[#1e293b] tracking-tight">
              Esqueci minha senha
            </h1>
            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Informe seu email, o administrador vai receber o pedido e gerar uma nova senha para você.
            </p>
          </div>

          {/* Dotted Divider */}
          <div className="my-6 border-b border-dotted border-slate-200" />

          {/* Error Alert */}
          {forgotError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
              <span className="leading-snug">{forgotError}</span>
            </div>
          )}

          {/* Direct Reset Success Screen */}
          {directResetSuccess ? (
            <div className="space-y-4 pt-1 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  Nova Senha Definida com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sua nova senha foi salva e sincronizada com segurança. Você já pode acessar a sua conta.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-[#f99616] hover:bg-[#e88708] active:scale-[0.99] text-black font-bold text-sm shadow-[0_4px_14px_rgba(249,150,22,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Acessar Painel</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : forgotSuccess ? (
            /* Request Confirmation Screen */
            <div className="space-y-4 pt-1 animate-fadeIn">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <CheckCircle2 size={16} className="text-[#f99616]" />
                  <span>Pedido registrado com sucesso!</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  O administrador da agência recebeu sua solicitação para o e-mail: <b className="font-semibold text-amber-950">{forgotEmail}</b>.
                </p>
              </div>

              {/* If user was recognized, offer immediate password setup */}
              {detectedUser && (
                <form onSubmit={handleDirectReset} className="pt-2 space-y-3 border-t border-slate-100 animate-fadeIn">
                  <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-slate-500" />
                      <span className="font-semibold text-slate-800">{detectedUser.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={11} />
                      Autorizado
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      Definir Nova Senha Imediatamente
                    </label>
                    <div className="relative">
                      <input
                        type={showDirectPass ? 'text' : 'password'}
                        required
                        placeholder="Digite a nova senha"
                        value={newDirectPassword}
                        onChange={(e) => setNewDirectPassword(e.target.value)}
                        className="w-full bg-[#f1f3f7] focus:bg-white text-sm text-slate-800 pl-4 pr-11 py-2.5 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-hidden transition-all placeholder:text-slate-400 font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDirectPass(!showDirectPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showDirectPass ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type={showDirectPass ? 'text' : 'password'}
                      required
                      placeholder="Confirme a nova senha"
                      value={confirmDirectPassword}
                      onChange={(e) => setConfirmDirectPassword(e.target.value)}
                      className="w-full bg-[#f1f3f7] focus:bg-white text-sm text-slate-800 px-4 py-2.5 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-hidden transition-all placeholder:text-slate-400 font-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-[#f99616] hover:bg-[#e88708] text-black font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Salvar e Atualizar Senha</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}

              {/* Back to login button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Voltar para o login</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main Form - Exactly matching user image */
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="forgot-email"
                  className="block text-xs font-medium text-slate-500 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="text"
                    required
                    autoFocus
                    placeholder="voce@agencia.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    className="w-full bg-[#f1f3f7] focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-4 py-3 rounded-2xl border border-[#f99616] ring-4 ring-[#f99616]/15 outline-hidden transition-all font-normal"
                  />
                </div>
              </div>

              {/* Primary Submit Button: Solicitar nova senha */}
              <button
                id="btn-forgot-submit"
                type="submit"
                disabled={forgotLoading}
                className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-[#f99616] hover:bg-[#e88708] active:scale-[0.99] text-black font-bold text-sm shadow-[0_4px_14px_rgba(249,150,22,0.25)] hover:shadow-[0_6px_20px_rgba(249,150,22,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <>
                    <KeyRound size={17} className="stroke-[2.5]" />
                    <span>Solicitar nova senha</span>
                  </>
                )}
              </button>

              {/* Link: Voltar para o login */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Voltar para o login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
