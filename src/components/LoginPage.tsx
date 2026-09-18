import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  AlertCircle,
  Check,
  ShieldAlert,
  Clock
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
  onLoginSuccess: (user: { username: string; name: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        reasonText: 'Tentativa de injeção de payload malicioso ou script interceptada pelo WAF no formulário de login.'
      });
      setErrorMessage('Tentativa de inserção de caracteres suspeitos bloqueada pelo firewall de segurança.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const validation = await validateMasterCredentials(cleanUser, password);

      if (validation.isValid) {
        // Record successful login (clears brute force counters and logs event)
        recordSuccessfulLogin(cleanUser);
        recordSessionActivity();

        if (rememberMe) {
          try {
            localStorage.setItem('help_agency_auth', 'true');
            localStorage.setItem('help_agency_user', JSON.stringify({
              username: 'lancerotti',
              name: 'Marcos Lancerotti'
            }));
          } catch {
            // ignore localStorage quota/privacy error
          }
        }
        setIsLoading(false);
        onLoginSuccess({
          username: 'lancerotti',
          name: 'Marcos Lancerotti'
        });
      } else {
        setIsLoading(false);
        // Record failed attempt in security protocol with detailed reason
        const failReason = !validation.usernameMatched ? 'usuario_inexistente' : 'senha_incorreta';
        const failText = !validation.usernameMatched
          ? 'Usuário informado não consta no cofre de credenciais autorizadas.'
          : 'Senha informada não corresponde ao hash SHA-256 da credencial mestra.';

        const failStatus = recordFailedLoginAttempt({
          username: cleanUser || 'desconhecido',
          reason: failReason,
          reasonText: failText,
        });
        setLockStatus(failStatus);

        if (failStatus.isLocked) {
          setErrorMessage(`Múltiplas falhas detectadas! Sistema bloqueado temporariamente por ${Math.ceil(failStatus.remainingSeconds / 60)} minutos para proteger contra invasão.`);
        } else {
          const remainingAttempts = 5 - failStatus.attempts;
          if (!validation.usernameMatched) {
            setErrorMessage(`Usuário não encontrado. (${remainingAttempts} ${remainingAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'} antes do bloqueio temporário).`);
          } else {
            setErrorMessage(`Senha incorreta. (${remainingAttempts} ${remainingAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'} antes do bloqueio temporário).`);
          }
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao validar credenciais. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a1224] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans selection:bg-[#fab518] selection:text-[#142142]">
      {/* Brand background glowing gradients matching internal system palette */}
      <div className="absolute -top-32 right-[-10%] w-[620px] h-[620px] bg-gradient-to-b from-[#fab518]/15 via-[#1d2e56]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 w-[550px] h-[550px] bg-gradient-to-tr from-[#142142] via-[#1d2e56]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle architectural background grid */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fab518 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Container - Login Card */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <div className="w-full bg-[#142142]/95 backdrop-blur-xl rounded-3xl border border-[#1d2e56] p-7 sm:p-9 shadow-2xl shadow-black/50 space-y-6 relative">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <img
              id="login-brand-logo"
              src="/icone-help.png"
              alt="Help Ideias Digitais"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-md mb-1"
              referrerPolicy="no-referrer"
            />

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Entrar
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Digite suas credenciais para acessar o painel
              </p>
            </div>
          </div>

            {/* Lockout Notification when Brute Force is detected */}
            {lockStatus.isLocked ? (
              <div 
                id="login-lockout-alert"
                className="p-4 rounded-2xl bg-red-950/80 border border-red-500/80 text-red-100 text-xs flex items-start gap-3 shadow-lg shadow-red-950/50 animate-in fade-in"
              >
                <ShieldAlert size={20} className="shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-sm text-white">Bloqueio de Segurança Ativado</p>
                  <p className="text-red-200/90 leading-relaxed">
                    Múltiplas tentativas incorretas foram neutralizadas. O acesso foi suspenso temporariamente para proteger o sistema contra ataques de força bruta.
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 font-mono font-bold text-amber-300">
                    <Clock size={14} />
                    <span>Desbloqueio em: {lockStatus.remainingSeconds}s</span>
                  </div>
                </div>
              </div>
            ) : errorMessage ? (
              <div 
                id="login-error-alert"
                className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
                <span className="leading-snug font-medium">{errorMessage}</span>
              </div>
            ) : null}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email field with inner icon */}
              <div>
                <label 
                  htmlFor="login-username"
                  className="block text-xs font-bold text-slate-200 mb-1.5"
                >
                  Email ou Usuário
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={17} />
                  </div>
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
                    className="w-full bg-[#0a1224] hover:bg-[#0d172e] focus:bg-[#0a1224] text-sm text-white pl-10 pr-4 py-3.5 rounded-xl border border-[#1d2e56] focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 focus:outline-none transition-all placeholder:text-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password field with inner icon & toggle visibility */}
              <div>
                <label 
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-200 mb-1.5"
                >
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock size={17} />
                  </div>
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
                    className="w-full bg-[#0a1224] hover:bg-[#0d172e] focus:bg-[#0a1224] text-sm text-white pl-10 pr-11 py-3.5 rounded-xl border border-[#1d2e56] focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 focus:outline-none transition-all placeholder:text-slate-500 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                  <input
                    id="login-remember-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    rememberMe 
                      ? 'bg-[#fab518] border-[#fab518] text-[#142142]' 
                      : 'border-slate-600 bg-[#0a1224]'
                  }`}>
                    {rememberMe && <Check size={12} className="stroke-[3.5]" />}
                  </div>
                  <span className="font-semibold text-[11px] sm:text-xs">Manter-me conectado</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setShowForgotPasswordModal(true);
                  }}
                  className="text-[11px] sm:text-xs font-bold text-slate-300 hover:text-[#fab518] transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Submit Button with Internal Brand Gold Gradient */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading || lockStatus.isLocked}
                className="w-full mt-3 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#fab518] via-[#e29f11] to-[#fab518] hover:brightness-105 active:scale-[0.99] text-[#142142] font-black text-sm tracking-wide shadow-lg shadow-[#fab518]/20 hover:shadow-[#fab518]/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#142142] border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </div>
                ) : lockStatus.isLocked ? (
                  <div className="flex items-center gap-2">
                    <Lock size={16} />
                    <span>Acesso Temporariamente Suspenso</span>
                  </div>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight size={17} className="stroke-[3]" />
                  </>
                )}
              </button>

              {/* Brand Copyright Footer */}
              <div className="pt-3 text-center text-xs text-slate-400 font-medium border-t border-slate-800/80">
                Help Ideias Digitais • 2026
              </div>
            </form>
          </div>
        </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-[#0a1224]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#142142] border border-[#1d2e56] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Recuperar Senha
            </h3>
            {forgotSent ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs leading-relaxed">
                  As instruções para redefinição foram enviadas para <b>{forgotEmail || 'seu e-mail'}</b>.
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-full py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs rounded-xl transition-colors cursor-pointer"
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
                className="space-y-3"
              >
                <p className="text-xs text-slate-300">
                  Informe o seu e-mail ou nome de usuário cadastrado para receber o link de recuperação.
                </p>
                <input
                  type="text"
                  required
                  placeholder="voce@agencia.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#0a1224] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#1d2e56] focus:border-[#fab518] focus:ring-1 focus:ring-[#fab518] focus:outline-none placeholder:text-slate-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
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
