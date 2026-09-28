import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Check, 
  RotateCcw, 
  Users, 
  Briefcase, 
  Wallet, 
  FileSpreadsheet, 
  UsersRound, 
  Settings, 
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  Plus
} from 'lucide-react';
import { MemberPermissions } from '../types';
import { 
  RESTRICTED_PAGES_CONFIG, 
  RestrictedPageKey,
  DEFAULT_NEW_COLLABORATOR_PERMISSIONS, 
  getDefaultNewMemberPermissions, 
  saveDefaultNewMemberPermissions,
  OPERATIONAL_LEADER_PERMISSIONS,
  FULL_ACCESS_PERMISSIONS,
  countBlockedPages
} from '../utils/permissionUtils';

interface RegraNovosColaboradoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleSaved?: (rule: MemberPermissions) => void;
  onApplyToAllMembers?: (rule: MemberPermissions) => void;
  onOpenAddMemberWithRule?: () => void;
  totalTeamMembersCount?: number;
}

export const RegraNovosColaboradoresModal: React.FC<RegraNovosColaboradoresModalProps> = ({
  isOpen,
  onClose,
  onRuleSaved,
  onApplyToAllMembers,
  onOpenAddMemberWithRule,
  totalTeamMembersCount = 0,
}) => {
  const [rulePermissions, setRulePermissions] = useState<MemberPermissions>(getDefaultNewMemberPermissions());
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [appliedAllFeedback, setAppliedAllFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRulePermissions(getDefaultNewMemberPermissions());
      setIsSavedFeedback(false);
      setAppliedAllFeedback(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const iconMap: Record<RestrictedPageKey, React.ComponentType<{ size?: number; className?: string }>> = {
    clientes: Users,
    servicos: Briefcase,
    financeiro: Wallet,
    orcamentos: FileSpreadsheet,
    equipe: UsersRound,
    configuracoes: Settings,
  };

  const handleToggle = (key: RestrictedPageKey) => {
    setRulePermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setIsSavedFeedback(false);
    setAppliedAllFeedback(false);
  };

  const handleSaveRule = () => {
    saveDefaultNewMemberPermissions(rulePermissions);
    setIsSavedFeedback(true);
    if (onRuleSaved) {
      onRuleSaved(rulePermissions);
    }
    setTimeout(() => setIsSavedFeedback(false), 3000);
  };

  const handleApplyToAll = () => {
    saveDefaultNewMemberPermissions(rulePermissions);
    setIsSavedFeedback(true);
    if (onApplyToAllMembers) {
      onApplyToAllMembers(rulePermissions);
    }
    setAppliedAllFeedback(true);
    setTimeout(() => setAppliedAllFeedback(false), 3500);
  };

  const handlePresetDefaultRequested = () => {
    setRulePermissions({ ...DEFAULT_NEW_COLLABORATOR_PERMISSIONS });
    setIsSavedFeedback(false);
    setAppliedAllFeedback(false);
  };

  const handlePresetLeader = () => {
    setRulePermissions({ ...OPERATIONAL_LEADER_PERMISSIONS });
    setIsSavedFeedback(false);
    setAppliedAllFeedback(false);
  };

  const handlePresetFull = () => {
    setRulePermissions({ ...FULL_ACCESS_PERMISSIONS });
    setIsSavedFeedback(false);
    setAppliedAllFeedback(false);
  };

  const blockedCount = countBlockedPages(rulePermissions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#0f172a] rounded-[28px] max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-rule-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-[#fab518]/5 to-transparent border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black shadow-xs ring-2 ring-[#fab518]/20 shrink-0">
              <ShieldCheck size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="modal-rule-title" className="text-base sm:text-lg font-black text-[#142142] dark:text-white">
                  Regra de Acesso para Novos Colaboradores
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Controle do Dono
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Defina exatamente o que os novos colaboradores adicionados podem ou não acessar no sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Status Alert Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 ${
                blockedCount === 6 
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                  : blockedCount > 0 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                <Lock size={15} />
              </div>
              <div>
                <p className="text-xs font-black text-[#142142] dark:text-white">
                  {blockedCount === 6 
                    ? 'Regra Recomendada Ativa: 6 Páginas Estratégicas Bloqueadas' 
                    : `${6 - blockedCount} Liberadas • ${blockedCount} Bloqueadas`}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Todo novo membro adicionado receberá automaticamente este perfil de segurança.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handlePresetDefaultRequested}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Bloquear todas as 6 páginas estratégicas"
              >
                Bloquear as 6 (Padrão Solicitado)
              </button>
              <button
                type="button"
                onClick={handlePresetLeader}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Líder Operacional
              </button>
            </div>
          </div>

          {/* List of 6 Restricted Pages */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Páginas Estratégicas & Regras de Acesso:
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Clique para alternar Bloqueado / Liberado
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {RESTRICTED_PAGES_CONFIG.map((pageConfig) => {
                const isAllowed = Boolean(rulePermissions[pageConfig.id]);
                const Icon = iconMap[pageConfig.id] || Lock;

                return (
                  <div
                    key={pageConfig.id}
                    onClick={() => handleToggle(pageConfig.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                      isAllowed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isAllowed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#142142] dark:text-white">
                            {pageConfig.label}
                          </h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isAllowed
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}>
                            {isAllowed ? 'Liberado' : 'Bloqueado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {pageConfig.shortDescription}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Switch Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${
                        isAllowed ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                      }`}>
                        <div className="w-4.5 h-4.5 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px]">
                          {isAllowed ? (
                            <Unlock size={10} className="text-emerald-600" />
                          ) : (
                            <Lock size={10} className="text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Pages Note */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#142142] dark:text-slate-200">
              <Info size={13} className="text-[#fab518]" />
              <span>Páginas de Trabalho Sempre Liberadas:</span>
            </div>
            <p>
              As páginas <strong>Início</strong>, <strong>Demandas (Quadro Kanban)</strong> e <strong>Datas Comemorativas (Calendário)</strong> permanecem sempre habilitadas para que os colaboradores executem e entreguem seus jobs.
            </p>
          </div>

          {/* Feedback messages */}
          {isSavedFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check size={16} className="text-emerald-600 stroke-[3]" />
              <span>Regra padrão salva com sucesso! Todos os novos colaboradores adicionados virão com esta regra.</span>
            </div>
          )}

          {appliedAllFeedback && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check size={16} className="text-blue-600 stroke-[3]" />
              <span>Regra aplicada a todos os colaboradores atuais da agência!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onApplyToAllMembers && (
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Sincronizar a regra também com colaboradores que já estão na equipe"
              >
                Aplicar a Todos os Membros Atuais
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleSaveRule}
              className="px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Check size={14} className="stroke-[3]" />
              <span>Salvar Regra Padrão</span>
            </button>

            {onOpenAddMemberWithRule && (
              <button
                type="button"
                onClick={() => {
                  handleSaveRule();
                  onClose();
                  onOpenAddMemberWithRule();
                }}
                className="px-4 py-2.5 rounded-xl bg-[#142142] hover:bg-[#1e3060] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} className="text-[#fab518]" />
                <span>+ Novo com esta Regra</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
