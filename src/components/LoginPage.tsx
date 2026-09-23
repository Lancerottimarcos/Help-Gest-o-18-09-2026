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
  X
} from 'lucide-react';
import { 
  checkBruteForceStatus, 
  recordFailedLoginAttempt, 
  recordSuccessfulLogin, 
  detectAndSanitizeInput,
  validateMasterCredentials,
  recordSessionActivity
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

      {/* Login Card matching exact reference image */}
      <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 sm:p-11 shadow-[0_25px_60px_-15px_rgba(20,33,66,0.08),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-white/90 relative z-10">
        
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
        <form onSubmit={handleSubmit} className="space-y-4">
          
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
              className="w-full bg-[#f1f3f7] hover:bg-[#ebedf2] focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-4 py-3 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-none transition-all font-normal disabled:opacity-50"
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
                className="w-full bg-[#f1f3f7] hover:bg-[#ebedf2] focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-4 pr-11 py-3 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-none transition-all font-normal tracking-wider disabled:opacity-50"
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
              onClick={() => {
                setForgotSent(false);
                setShowForgotPasswordModal(true);
              }}
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

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-7 w-full max-w-sm shadow-2xl space-y-4 border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Recuperar Senha
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Digite o e-mail cadastrado da sua conta
              </p>
            </div>

            {forgotSent ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Instruções de redefinição foram enviadas para <b>{forgotEmail || 'seu e-mail'}</b>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-full py-3 bg-[#f99616] hover:bg-[#e88708] text-black font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                }} 
                className="space-y-4 pt-1"
              >
                <input
                  type="email"
                  required
                  placeholder="voce@agencia.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#f1f3f7] focus:bg-white text-sm text-slate-800 px-4 py-3 rounded-2xl border border-transparent focus:border-[#f99616] focus:ring-2 focus:ring-[#f99616]/20 outline-none transition-all placeholder:text-slate-400 font-normal"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#f99616] hover:bg-[#e88708] text-black font-bold text-xs rounded-2xl shadow-sm transition-colors cursor-pointer"
                  >
                    Enviar Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
