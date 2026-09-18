import React, { useState } from 'react';
import { 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  KeyRound, 
  Fingerprint 
} from 'lucide-react';
import { 
  validateMasterCredentials, 
  updateMasterPassword, 
  isCustomPasswordSet,
  addSecurityLog
} from '../utils/securityProtocols';
import { useTwoFactor } from '../context/TwoFactorContext';

interface MasterPasswordCardProps {
  onPasswordChanged?: () => void;
}

export const MasterPasswordCard: React.FC<MasterPasswordCardProps> = ({ onPasswordChanged }) => {
  const { request2Fa } = useTwoFactor();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasCustom = isCustomPasswordSet();

  // Password strength validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Informe a senha atual para autorizar a alteração.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A nova senha e a confirmação não conferem.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify current password
      const isValidCurrent = await validateMasterCredentials('lancerotti', currentPassword);
      if (!isValidCurrent) {
        setErrorMessage('Senha atual incorreta. Verifique e tente novamente.');
        setIsLoading(false);
        return;
      }

      // 2. Request 2FA authorization
      request2Fa({
        actionTitle: 'Alteração de Senha Mestra de Administrador',
        actionDescription: 'Atualização das credenciais do usuário mestre lancerotti com novo hash criptográfico SHA-256.',
        riskLevel: 'critical',
        actionType: 'config_change',
        onVerified: async () => {
          await updateMasterPassword(newPassword);
          addSecurityLog({
            eventType: 'session_locked',
            severity: 'info',
            title: 'Senha Mestra Alterada com Sucesso',
            description: 'A credencial mestre foi redefinida pelo administrador via 2FA e protegida por hash criptográfico SHA-256.',
            source: 'Módulo de Gestão de Identidades',
            threatDetails: 'Proteção com algoritmo SHA-256'
          });

          setSuccessMessage('Senha mestra atualizada com sucesso! O novo hash SHA-256 está ativo.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setIsLoading(false);
          if (onPasswordChanged) onPasswordChanged();
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      });
    } catch (err: any) {
      setErrorMessage('Erro ao validar credenciais. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
          <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
            <Fingerprint size={18} />
          </div>
          <span>Credencial Mestra & Proteção Criptográfica</span>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
          <ShieldCheck size={12} />
          <span>SHA-256 Ativo</span>
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        As credenciais de acesso do administrador <span className="font-bold text-[#142142] dark:text-white font-mono">lancerotti</span> são protegidas por hash criptográfico unidirecional SHA-256 com salting dinâmico. Nenhuma senha trafega em texto puro.
      </p>

      {/* Security Status Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#142142] dark:text-white">Usuário Mestre:</span>
            <span className="font-mono text-[#fab518] font-bold">lancerotti</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {hasCustom 
              ? 'Senha personalizada em uso e protegida pelo cofre SHA-256' 
              : 'Senha padrão de inicialização ativa no cofre seguro'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-xl bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] font-black text-xs hover:bg-[#1d2d56] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <Key size={14} />
          <span>{isOpen ? 'Ocultar Formulário' : 'Alterar Senha Mestra'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Change Password Form (Collapsible) */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#142142] dark:text-white">
              Senha Atual do Usuário
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha atual"
                className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-[#142142] dark:text-white p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#142142] dark:text-white">
              Nova Senha de Alta Segurança
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres (letras, números e símbolos)"
                className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-[#142142] dark:text-white p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Força da senha:</span>
                  <span className={`font-bold ${
                    strengthScore <= 2 ? 'text-red-500' : strengthScore <= 4 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {strengthScore <= 2 ? 'Fraca' : strengthScore <= 4 ? 'Moderada' : 'Excelente (Criptograficamente Forte)'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 h-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`rounded-full transition-all ${
                        lvl <= strengthScore
                          ? strengthScore <= 2
                            ? 'bg-red-500'
                            : strengthScore <= 4
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#142142] dark:text-white">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a nova senha novamente"
              className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
              required
            />
          </div>

          {/* Submission and 2FA Warning */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
            <KeyRound size={14} className="shrink-0 text-amber-500" />
            <span>Por segurança, será solicitado o código de verificação 2FA antes de persistir a nova senha.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || strengthScore < 2}
              className="px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? 'Processando Hash...' : 'Autorizar com 2FA & Salvar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
