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
  ShieldAlert,
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

interface AgencyLoginPageProps {
  onLoginSuccess: (user: { 
    username: string; 
    name: string;
    email?: string;
    role?: string;
    roleLabel?: string;
    avatarUrl?: string;
    isMaster?: boolean;
    permissions?: any;
  }) => void;
  onSwitchToClientLogin: () => void;
}

export const AgencyLoginPage: React.FC<AgencyLoginPageProps> = ({ 
  onLoginSuccess,
  onSwitchToClientLogin 
}) => {
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
        title: 'Solicitação de Nova Senha Recebida (Agência)',
        description: `O colaborador com email/identificador "${cleanInput}" solicitou redefinição de senha ao administrador.`,
        source: 'Recuperação de Senha da Agência',
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

    const userCheck = detectAndSanitizeInput(username, 'Login Agência - Usuário');
    const passCheck = detectAndSanitizeInput(password, 'Login Agência - Senha');
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
        const failReason = !validation.usernameMatched ? 'usuario_inexistente' : 'senha_incorreta';
        const failText = !validation.usernameMatched
          ? 'Usuário informado não consta na equipe autorizada.'
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
            setErrorMessage(`Usuário da agência não encontrado. (${remainingAttempts} ${remainingAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'}).`);
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#f99616]/6 via-[#fef3e7]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#faf5ed]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#ede6db]/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      {currentView === 'login' ? (
        <div className="w-full max-w-[460px] bg-white rounded-[32px] p-8 sm:p-11 shadow-[0_25px_60px_-15px_rgba(20,33,66,0.08),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-white/90 relative z-10 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Top Circular Badge with Agency Icon */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#142142] text-[#fab518] flex items-center justify-center shadow-md">
                <Building2 size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Agência
                </span>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Help Ideias Digitais</p>
              </div>
            </div>
            
            <button
              type="button"
              id="btn-goto-client-portal"
              onClick={onSwitchToClientLogin}
              className="text-[11px] font-black text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Ir para o Portal de Acesso do Cliente"
            >
              <span>Portal do Cliente</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-[#142142] tracking-tight">
              Acesso da Agência
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Painel operacional restrito para gestores, equipe e proprietário.
            </p>
          </div>

          {/* Lockout or Error Alerts */}
          {lockStatus.isLocked ? (
            <div 
              id="agency-login-lockout-alert"
              className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-800">Terminal Temporariamente Bloqueado</p>
                <p className="text-red-600 text-[11px] leading-relaxed">
                  Múltiplas tentativas incorretas foram detectadas pelo firewall da agência.
                </p>
                <div className="flex items-center gap-1.5 font-mono font-bold text-red-700 text-[11px] pt-0.5">
                  <Clock size={13} />
                  <span>Desbloqueio em: {lockStatus.remainingSeconds}s</span>
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div 
              id="agency-login-error-alert"
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

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 mt-5">
            {/* Email / Username field */}
            <div>
              <label 
                htmlFor="agency-username"
                className="block text-xs font-bold text-slate-700 mb-2"
              >
                E-mail ou Usuário da Agência
              </label>
              <input
                id="agency-username"
                type="text"
                required
                disabled={lockStatus.isLocked}
                autoComplete="username"
                placeholder="lancerotti ou seu email corporativo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyActivity}
                onKeyUp={handleKeyActivity}
                className="w-full h-12 bg-white rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fab518] focus:border-transparent transition-all shadow-xs"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="agency-password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={handleGoToForgot}
                  className="text-xs font-bold text-[#f99616] hover:text-[#d87d0c] hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div className="relative">
                <input
                  id="agency-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockStatus.isLocked}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyActivity}
                  onKeyUp={handleKeyActivity}
                  className="w-full h-12 bg-white rounded-2xl border border-slate-200 pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fab518] focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#fab518] focus:ring-[#fab518] accent-[#fab518] cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">
                  Lembrar login neste terminal
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-agency-login-submit"
              disabled={isLoading || lockStatus.isLocked}
              className="w-full h-12 mt-2 bg-[#142142] hover:bg-[#1a2b56] active:bg-[#0f172a] text-[#fab518] font-black rounded-2xl text-sm transition-all shadow-md shadow-[#142142]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#fab518] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Entrar no Painel da Agência</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Card: Switch to Client Login */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Você é um cliente cadastrado da Help Ideias?
            </p>
            <button
              type="button"
              id="btn-switch-to-client-login"
              onClick={onSwitchToClientLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#142142] font-black text-xs border border-amber-200/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Acessar o Portal do Cliente</span>
              <ArrowRight size={14} className="text-[#fab518]" />
            </button>
          </div>
        </div>
      ) : (
        /* Forgot Password View */
        <div className="w-full max-w-[460px] bg-white rounded-[32px] p-8 sm:p-11 shadow-[0_25px_60px_-15px_rgba(20,33,66,0.08)] border border-white/90 relative z-10 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Voltar ao login</span>
            </button>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Recuperação
            </div>
          </div>

          <div className="space-y-1.5 mb-6">
            <h1 className="text-2xl font-black text-[#142142] tracking-tight">
              Recuperar Acesso da Agência
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Informe seu e-mail corporativo cadastrado para receber instruções.
            </p>
          </div>

          {forgotSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Solicitação Registrada com Sucesso</span>
                </p>
                <p className="text-[11px] text-emerald-700">
                  {detectedUser 
                    ? `Identificamos sua conta como ${detectedUser.name} (${detectedUser.roleLabel}). Você pode redefinir sua senha diretamente abaixo:`
                    : 'A solicitação de recuperação foi encaminhada ao administrador Marcos Lancerotti.'}
                </p>
              </div>

              {detectedUser && !directResetSuccess && (
                <form onSubmit={handleDirectReset} className="space-y-3.5 pt-2">
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
                        className="w-full h-11 bg-white rounded-xl border border-slate-200 px-3 text-sm"
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
                      placeholder="Repita a senha"
                      className="w-full h-11 bg-white rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </div>

                  {forgotError && (
                    <p className="text-xs text-red-600 font-bold">{forgotError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-11 bg-[#142142] text-[#fab518] font-black rounded-xl text-xs"
                  >
                    {forgotLoading ? 'Atualizando...' : 'Definir Nova Senha e Entrar'}
                  </button>
                </form>
              )}

              {directResetSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
                  Senha atualizada! Clique em "Voltar ao login" para entrar.
                </div>
              )}

              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Voltar à tela de login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  E-mail do Colaborador
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@agencia.com"
                  className="w-full h-12 bg-white rounded-2xl border border-slate-200 px-4 text-sm"
                />
              </div>

              {forgotError && (
                <p className="text-xs text-red-600 font-bold">{forgotError}</p>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-12 bg-[#142142] text-[#fab518] font-black rounded-2xl text-sm"
              >
                {forgotLoading ? 'Verificando...' : 'Enviar Solicitação'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
