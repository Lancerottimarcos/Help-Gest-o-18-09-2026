import React from 'react';
import { 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  Check, 
  X, 
  Kanban, 
  LayoutDashboard, 
  EyeOff,
  Users,
  Briefcase,
  Wallet,
  FileSpreadsheet,
  UsersRound,
  Settings
} from 'lucide-react';
import { PageId, UserProfile } from '../types';
import { RESTRICTED_PAGES_CONFIG, getRestrictedPageName, getEffectivePermissions } from '../utils/permissionUtils';

interface AccessDeniedViewProps {
  page: PageId;
  user?: UserProfile | null;
  onNavigate: (page: PageId) => void;
  onExitSimulation?: () => void;
  isSimulating?: boolean;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  page,
  user,
  onNavigate,
  onExitSimulation,
  isSimulating = false,
}) => {
  const pageName = getRestrictedPageName(page);
  const permissions = getEffectivePermissions(user);

  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    clientes: Users,
    servicos: Briefcase,
    financeiro: Wallet,
    orcamentos: FileSpreadsheet,
    equipe: UsersRound,
    configuracoes: Settings,
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-3 sm:px-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Simulation Banner Notice if active */}
      {isSimulating && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-[#142142] flex items-center justify-center font-black shrink-0">
              <EyeOff size={16} />
            </div>
            <div className="text-xs">
              <p className="font-bold">Modo de Simulação Ativo: {user?.name || 'Colaborador'}</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Você está vendo o sistema exatamente como este colaborador visualiza, com as regras de bloqueio ativas.
              </p>
            </div>
          </div>
          {onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="px-3 py-1.5 rounded-xl bg-[#142142] text-white dark:bg-white dark:text-[#142142] text-xs font-black hover:opacity-90 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Encerrar Teste de Visão
            </button>
          )}
        </div>
      )}

      {/* Main Blocked Card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-xl text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-sm">
            <Lock size={38} className="stroke-[2.2]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#142142] text-[#fab518] flex items-center justify-center border-2 border-white dark:border-[#0f172a] shadow-xs">
            <ShieldAlert size={14} />
          </span>
        </div>

        <div className="max-w-xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Lock size={12} />
            <span>Página Bloqueada por Regra da Agência</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white tracking-tight">
            {user?.role === 'cliente'
              ? 'Área restrita à equipe interna da agência'
              : `Você não tem permissão para acessar a ${pageName}`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {user?.role === 'cliente'
              ? 'Como cliente, seu acesso é focado exclusivamente no Portal do Cliente e na Central de Aprovações para você acompanhar, aprovar ou solicitar ajustes em seus materiais e entregáveis.'
              : 'O administrador da agência (Marcos Lancerotti) definiu regras de segurança onde novos colaboradores têm o acesso bloqueado a esta seção estratégica.'}
          </p>
        </div>

        {/* Rule Status Grid */}
        {user?.role !== 'cliente' && (
          <div className="max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider">
                  Status das Regras de Acesso do seu Perfil:
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {user?.name || 'Colaborador'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESTRICTED_PAGES_CONFIG.map((item) => {
                  const isAllowed = Boolean(permissions[item.id]);
                  const IconComponent = iconMap[item.id] || Lock;
                  const isCurrent = item.id === page;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isCurrent
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 font-bold ring-2 ring-rose-400/30'
                          : isAllowed
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComponent size={14} className={isAllowed ? 'text-emerald-600' : 'text-rose-500'} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isAllowed
                          ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                      }`}>
                        {isAllowed ? <Check size={11} /> : <X size={11} />}
                        {isAllowed ? 'Liberado' : 'Bloqueado'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Check size={13} className="text-emerald-500 shrink-0" />
                <span>
                  Páginas operacionais liberadas para trabalho: <strong>Início, Demandas (Kanban) e Datas Comemorativas</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          {user?.role === 'cliente' ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('demandas')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#142142] hover:bg-[#1a2d59] text-[#fab518] text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Kanban size={14} />
                <span>Ir para Portal do Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('aprovacoes')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Check size={14} />
                <span>Central de Aprovações</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('inicio')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>Voltar ao Início</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('demandas')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Kanban size={14} />
                <span>Ir para Quadro de Demandas</span>
              </button>
            </>
          )}

          {isSimulating && onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Sair da Simulação</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
