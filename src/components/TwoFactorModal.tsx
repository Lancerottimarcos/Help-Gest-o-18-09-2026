import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Mail,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  X,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  TwoFactorChallenge,
  verify2FaCode,
  resend2FaCode,
  cancel2FaChallenge
} from '../utils/twoFactorAuth';

interface TwoFactorModalProps {
  isOpen: boolean;
  challenge: TwoFactorChallenge | null;
  onVerified: () => void;
  onCancel: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  challenge: initialChallenge,
  onVerified,
  onCancel,
}) => {
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(initialChallenge);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update challenge when prop changes
  useEffect(() => {
    if (initialChallenge) {
      setChallenge(initialChallenge);
      setDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setAttemptsLeft(null);
      const remaining = Math.max(0, Math.ceil((initialChallenge.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    }
  }, [initialChallenge]);

  // Focus the first input box when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer interval
  useEffect(() => {
    if (!isOpen || !challenge) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        setErrorMessage('O código temporário expirou. Clique em "Reenviar código" para gerar um novo.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, challenge]);

  if (!isOpen || !challenge) return null;

  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage(null);

    // Accept only digits
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Handle single character
    const char = cleaned.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Advance to next input
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    // Focus on the next available box or the last box
    const nextFocusIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();

    // If all 6 digits pasted, trigger auto validation
    if (pasted.length === 6) {
      submitCode(pasted);
    }
  };

  const submitCode = (codeToVerify: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result = verify2FaCode(codeToVerify);
      setIsVerifying(false);

      if (result.success) {
        onVerified();
      } else {
        setErrorMessage(result.message);
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        // Trigger shake effect
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (result.attemptsLeft === 0 || result.expired) {
          setDigits(['', '', '', '', '', '']);
        }
      }
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Por favor, preencha todos os 6 dígitos do código.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    submitCode(fullCode);
  };

  const handleResend = () => {
    const fresh = resend2FaCode();
    if (fresh) {
      setChallenge(fresh);
      setDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setAttemptsLeft(null);
      setSecondsRemaining(60);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  };

  const handleAutoFillSimulation = () => {
    if (!challenge) return;
    const split = challenge.code.split('');
    setDigits(split);
    setErrorMessage(null);
    submitCode(challenge.code);
  };

  const handleCopyCode = () => {
    if (!challenge) return;
    navigator.clipboard?.writeText?.(challenge.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClose = () => {
    cancel2FaChallenge();
    onCancel();
  };

  const isExpired = secondsRemaining <= 0;
  const isFilled = digits.join('').length === 6;

  // Percentage for progress bar
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div 
      id="modal-2fa-verification"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className={`bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden transition-transform duration-200 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#142142] via-[#1a2b56] to-[#142142] text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black shadow-lg shadow-[#fab518]/20 shrink-0">
                <KeyRound size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  <Lock size={10} />
                  <span>Autenticação em Dois Fatores (2FA)</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Confirmação de Ação Sensível
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Context banner for what is being protected */}
          <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <AlertTriangle size={14} className="text-[#fab518] shrink-0" />
              <span>{challenge.actionTitle}</span>
            </div>
            <p className="text-[11px] text-slate-300/90 leading-relaxed pl-5">
              {challenge.actionDescription}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Dispatch Notice */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              {challenge.method === 'email' ? (
                <Mail size={16} className="text-[#fab518]" />
              ) : (
                <Smartphone size={16} className="text-[#fab518]" />
              )}
              <span>
                Código temporário enviado para: <strong className="text-[#142142] dark:text-white">{challenge.recipient}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
              <Clock size={12} className={isExpired ? 'text-red-500' : 'text-amber-500'} />
              <span className={isExpired ? 'text-red-600 font-bold' : ''}>
                {isExpired ? 'Expirado' : `${secondsRemaining}s`}
              </span>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                secondsRemaining > 20 
                  ? 'bg-[#fab518]' 
                  : secondsRemaining > 10 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 6 Digit Input Boxes Form */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-center text-xs font-bold text-[#142142] dark:text-white">
                Digite o código de 6 dígitos:
              </label>

              <div 
                className="flex items-center justify-center gap-2 sm:gap-2.5"
                onPaste={handlePaste}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={isVerifying || isExpired}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border-2 transition-all shadow-xs ${
                      digit 
                        ? 'border-[#142142] dark:border-[#fab518] bg-white dark:bg-slate-900 text-[#142142] dark:text-white' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                    } focus:border-[#fab518] dark:focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none disabled:opacity-50`}
                  />
                ))}
              </div>
            </div>

            {/* Error or Attempts Left Banner */}
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <ShieldAlert size={16} className="text-red-600 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isVerifying}
                className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                id="btn-confirm-2fa"
                disabled={!isFilled || isVerifying || isExpired}
                className="w-full sm:w-2/3 py-2.5 px-4 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black transition-all cursor-pointer shadow-md shadow-[#fab518]/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Validando Código...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Confirmar Ação Sensível</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Resend Link */}
          <div className="flex items-center justify-center gap-2 text-xs pt-1">
            <span className="text-slate-400">Não recebeu o código ou expirou?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isVerifying}
              className="text-[#142142] dark:text-[#fab518] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} />
              <span>Reenviar novo código</span>
            </button>
          </div>

          {/* Simulation Sandbox Card */}
          <div className="mt-2 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles size={14} className="text-[#fab518]" />
                <span>Simulação Ativa de Despacho 2FA</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                Ambiente de Teste
              </span>
            </div>

            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              O código temporário gerado para esta operação é: <strong className="font-mono text-sm tracking-widest text-[#142142] dark:text-white bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">{challenge.code}</strong>
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-slate-700 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedCode ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                type="button"
                onClick={handleAutoFillSimulation}
                className="px-2.5 py-1 rounded-lg bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <ArrowRight size={12} />
                <span>Preencher Automaticamente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
