import React from 'react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Kanban, 
  LayoutDashboard, 
  Lock, 
  Crown,
  Users,
  Briefcase,
  Wallet,
  FileSpreadsheet,
  UsersRound,
  Settings
} from 'lucide-react';
import { PageId } from '../types';

interface BlockedPageGuardProps {
  pageId: PageId;
  onNavigate: (page: PageId) => void;
  collaboratorName?: string;
  isSimulated?: boolean;
  onExitSimulation?: () => void;
}

const PAGE_DETAILS: Record<string, { title: string; desc: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  clientes: {
    title: 'Página de Clientes',
    desc: 'A visualização da carteira de clientes, empresas cadastradas e histórico comercial é restrita a administradores.',
    icon: Users,
  },
  servicos: {
    title: 'Página de Serviços',
    desc: 'O catálogo de serviços, precificação e pacotes da agência é de acesso restrito à diretoria e atendimento sênior.',
    icon: Briefcase,
  },
  financeiro: {
    title: 'Página de Financeiro',
    desc: 'O fluxo de caixa, relatórios de faturamento, faturas e métricas financeiras são estritamente confidenciais.',
    icon: Wallet,
  },
  orcamentos: {
    title: 'Página de Orçamentos',
    desc: 'A criação, negociação e aprovação de propostas orçamentárias são reservadas à equipe comercial autorizada.',
    icon: FileSpreadsheet,
  },
  equipe: {
    title: 'Página de Equipe',
    desc: 'O gerenciamento de colaboradores, credenciais de login, senhas e permissões é restrito a Marcos Lancerotti.',
    icon: UsersRound,
  },
  configuracoes: {
    title: 'Página de Configurações',
    desc: 'Parâmetros de sistema, segurança cibernética, integrações e banco de dados são restritos ao administrador.',
    icon: Settings,
  },
};

export const BlockedPageGuard: React.FC<BlockedPageGuardProps> = ({
  pageId,
  onNavigate,
  collaboratorName,
  isSimulated,
  onExitSimulation,
}) => {
  const details = PAGE_DETAILS[pageId] || {
    title: 'Página Restrita',
    desc: 'O acesso a este módulo foi bloqueado pela política de permissões da agência.',
    icon: ShieldAlert,
  };
  const Icon = details.icon;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Shield and Lock Icon badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
            <Icon size={36} className="stroke-[2.2]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#142142] dark:bg-slate-800 text-rose-400 flex items-center justify-center ring-4 ring-white dark:ring-[#0f172a] shadow-xs">
            <Lock size={15} />
          </span>
        </div>

        {/* Text Details */}
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            <Lock size={12} />
            <span>Módulo Bloqueado</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white tracking-tight">
            Acesso Restrito: {details.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {details.desc}
          </p>

          {collaboratorName && (
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 pt-1">
              Perfil ativo: <span className="text-[#142142] dark:text-white font-bold">{collaboratorName}</span> (Colaborador)
            </p>
          )}
        </div>

        {/* Informative card about default rules */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
            <ShieldAlert size={15} className="text-[#fab518]" />
            <span>Regra de Acesso de Novos Colaboradores</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            Por padrão de segurança, novos colaboradores têm acesso restrito aos módulos estratégicos da agência (Clientes, Serviços, Financeiro, Orçamento, Equipe e Configurações). Caso necessite de liberação, solicite ao <strong>Marcos Lancerotti (Administrador)</strong> para habilitar seu perfil na página de Equipe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('inicio')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#142142] dark:bg-[#fab518] hover:opacity-90 text-white dark:text-[#142142] text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <LayoutDashboard size={15} />
            <span>Ir para Início</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('demandas')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-[#142142] dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Kanban size={15} />
            <span>Ver Minhas Demandas</span>
          </button>

          {isSimulated && onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-extrabold transition-all cursor-pointer"
            >
              <Crown size={14} className="text-[#fab518]" />
              <span>Sair da Simulação (Voltar para Marcos)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
