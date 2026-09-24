import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  UserPlus,
  Kanban, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Calendar,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Move,
  CheckCircle,
  Eye,
  EyeOff,
  Undo2,
  Briefcase,
  FileSpreadsheet,
  AlertTriangle,
  CalendarX2,
  Building2,
  Flame,
  ArrowUpDown,
  ShieldAlert,
  RefreshCw,
  Search,
  Layers
} from 'lucide-react';
import { Client, DemandItem, KanbanColumn, PageId, ClientActivity, InicioSectionId, InicioSectionMeta, Invoice, TeamMember } from '../types';
import { ClientLocationMap } from '../components/ClientLocationMap';
import { ClientBirthdaysSection } from '../components/ClientBirthdaysSection';
import { DemandsStoriesSection } from '../components/DemandsStoriesSection';
import { DemandsStatusDoughnutChart } from '../components/DemandsStatusDoughnutChart';
import { initialRecentActivities, currentUser } from '../data/mockData';

const parseDemandDate = (dateStr?: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split(/[-T]/);
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }
  return null;
};

const formatDemandDateFull = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

interface DemandDueStatus {
  status: 'atrasada' | 'hoje' | 'amanha' | 'semana' | 'futuro' | 'sem_prazo' | 'concluida' | 'regular';
  label: string;
  isOverdue: boolean;
  daysDiff: number;
  badgeClass: string;
}

const getDemandDueStatus = (demand: DemandItem): DemandDueStatus => {
  if (demand.columnId === 'concluidas') {
    return {
      status: 'concluida',
      label: 'Concluída',
      isOverdue: false,
      daysDiff: 0,
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    };
  }

  if (!demand.dueDate) {
    return {
      status: 'sem_prazo',
      label: 'Sem prazo',
      isOverdue: false,
      daysDiff: 0,
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    };
  }

  const parsed = parseDemandDate(demand.dueDate);
  if (!parsed) {
    const lower = demand.dueDate.toLowerCase();
    if (lower.includes('ontem') || lower.includes('atrasad')) {
      return {
        status: 'atrasada',
        label: 'Prazo vencido',
        isOverdue: true,
        daysDiff: -1,
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/80 dark:border-rose-800'
      };
    }
    return {
      status: 'regular',
      label: demand.dueDate,
      isOverdue: false,
      daysDiff: 0,
      badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/70'
    };
  }

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  const diffDays = Math.round((dueMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      status: 'atrasada',
      label: daysAgo === 1 ? '1d atrasado' : `${daysAgo}d atrasado`,
      isOverdue: true,
      daysDiff: diffDays,
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/80 dark:border-rose-800 font-bold'
    };
  }

  if (diffDays === 0) {
    return {
      status: 'hoje',
      label: 'Vence hoje!',
      isOverdue: false,
      daysDiff: 0,
      badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/80 dark:border-amber-800 font-bold'
    };
  }

  if (diffDays === 1) {
    return {
      status: 'amanha',
      label: 'Vence amanhã',
      isOverdue: false,
      daysDiff: 1,
      badgeClass: 'bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'semana',
      label: `Em ${diffDays} dias`,
      isOverdue: false,
      daysDiff: diffDays,
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    };
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const formatted = `${parsed.getDate()} ${months[parsed.getMonth()]}`;
  return {
    status: 'futuro',
    label: formatted,
    isOverdue: false,
    daysDiff: diffDays,
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };
};

const COLUMN_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  ideias: { label: 'Ideias / Briefing', color: '#EF4444', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60' },
  producao: { label: 'Em Produção', color: '#8B5CF6', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/60' },
  aprovacao: { label: 'Aprovação', color: '#FAB518', badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60' },
  agendamento: { label: 'Agendamento', color: '#10B981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60' },
  concluidas: { label: 'Concluídas', color: '#64748B', badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

const DEFAULT_SECTIONS: InicioSectionId[] = [
  'welcome',
  'demandas_stories',
  'indicadores',
  'prioridades',
  'aniversariantes',
  'mapa',
];

const SECTIONS_META: Record<InicioSectionId, InicioSectionMeta> = {
  welcome: {
    id: 'welcome',
    title: 'Boas-vindas & Saudação',
    shortLabel: 'Boas-vindas',
    description: 'Data do dia, saudação personalizada e status',
    iconName: 'calendar',
  },
  demandas_stories: {
    id: 'demandas_stories',
    title: 'Atualizações das Demandas (Stories)',
    shortLabel: 'Stories das Contas',
    description: 'Carrossel estilo Stories do Instagram com novidades e movimentações das contas',
    iconName: 'sparkles',
  },
  indicadores: {
    id: 'indicadores',
    title: 'Indicadores Principais do Mês',
    shortLabel: 'Indicadores',
    description: 'Demandas ativas, receita recorrente (MRR) e novos clientes',
    iconName: 'layers',
  },
  aniversariantes: {
    id: 'aniversariantes',
    title: 'Aniversariantes de Clientes',
    shortLabel: 'Aniversariantes',
    description: 'Alertas de aniversários de hoje, semana e mês com felicitações',
    iconName: 'cake',
  },
  mapa: {
    id: 'mapa',
    title: 'Distribuição Geográfica de Clientes',
    shortLabel: 'Mapa de Clientes',
    description: 'Localização e presença das contas atendidas pelo Brasil',
    iconName: 'map-pin',
  },
  prioridades: {
    id: 'prioridades',
    title: 'Demandas Prioritárias & Acesso Rápido',
    shortLabel: 'Prioridades & Status',
    description: 'Prazos críticos da semana, gráfico de status e atalhos rápidos',
    iconName: 'kanban',
  },
};

const STORAGE_ORDER_KEY = 'ideias_digitais_inicio_sections_order_v5';
const STORAGE_HIDDEN_KEY = 'ideias_digitais_inicio_sections_hidden_v5';

const loadSavedOrder = (): InicioSectionId[] => {
  try {
    const saved = localStorage.getItem(STORAGE_ORDER_KEY);
    if (!saved) return DEFAULT_SECTIONS;
    const parsed = JSON.parse(saved) as InicioSectionId[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validSections = parsed.filter((id) => DEFAULT_SECTIONS.includes(id));
      if (!validSections.includes('demandas_stories')) {
        const welcomeIndex = validSections.indexOf('welcome');
        if (welcomeIndex !== -1) {
          validSections.splice(welcomeIndex + 1, 0, 'demandas_stories');
        } else {
          validSections.unshift('demandas_stories');
        }
      }
      const missingSections = DEFAULT_SECTIONS.filter((id) => !validSections.includes(id));
      return [...validSections, ...missingSections];
    }
  } catch (err) {
    console.warn('Erro ao carregar ordem das seções:', err);
  }
  return DEFAULT_SECTIONS;
};

const loadSavedHidden = (): InicioSectionId[] => {
  try {
    const saved = localStorage.getItem(STORAGE_HIDDEN_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as InicioSectionId[];
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => DEFAULT_SECTIONS.includes(id));
    }
  } catch (err) {
    console.warn('Erro ao carregar seções ocultas:', err);
  }
  return [];
};

interface InicioViewProps {
  onNavigate: (page: PageId) => void;
  demands: DemandItem[];
  clients: Client[];
  columns?: KanbanColumn[];
  teamMembers?: TeamMember[];
  invoices?: Invoice[];
  activities?: ClientActivity[];
  onOpenNewDemandModal: () => void;
  onSelectDemand?: (demandId: string) => void;
  onSelectClient?: (client: Client) => void;
}

export const InicioView: React.FC<InicioViewProps> = ({
  onNavigate,
  demands,
  clients,
  columns = [],
  teamMembers = [],
  invoices = [],
  activities = initialRecentActivities,
  onOpenNewDemandModal,
  onSelectDemand,
  onSelectClient,
}) => {
  // Sincronização dinâmica de responsável com a Equipe
  const getAssigneeInfo = (assignee?: { name?: string; avatar?: string }) => {
    const rawName = assignee?.name || '';
    const rawAvatar = assignee?.avatar || '';
    if (!rawName) {
      return { name: 'Não atribuído', avatar: '' };
    }
    const matched = teamMembers.find(
      (m) =>
        m.name?.trim().toLowerCase() === rawName.trim().toLowerCase() ||
        m.name?.split(' ')[0]?.toLowerCase() === rawName.split(' ')[0]?.toLowerCase() ||
        (m.username && m.username.toLowerCase() === rawName.toLowerCase())
    );
    return {
      name: matched?.name || rawName,
      avatar: matched?.avatar || rawAvatar,
    };
  };
  // Seções exibidas no Painel de Início
  const visibleSections = DEFAULT_SECTIONS;

  const [demandTab, setDemandTab] = useState<'todas' | 'atrasadas' | 'semana' | 'producao' | 'aprovacao'>('todas');
  const [demandSearch, setDemandSearch] = useState('');

  const activeDemands = useMemo(() => demands.filter((d) => d.columnId !== 'concluidas'), [demands]);
  const pendingApprovals = useMemo(() => demands.filter((d) => d.columnId === 'aprovacao'), [demands]);
  const inProduction = useMemo(() => demands.filter((d) => d.columnId === 'producao'), [demands]);
  const scheduledDemands = useMemo(() => demands.filter((d) => d.columnId === 'agendamento'), [demands]);

  const demandDueStatusMap = useMemo(() => {
    const map = new Map<string, DemandDueStatus>();
    demands.forEach((d) => {
      map.set(d.id, getDemandDueStatus(d));
    });
    return map;
  }, [demands]);

  const overdueDemands = useMemo(() => {
    return activeDemands.filter((d) => demandDueStatusMap.get(d.id)?.isOverdue);
  }, [activeDemands, demandDueStatusMap]);

  const dueThisWeekDemands = useMemo(() => {
    return activeDemands.filter((d) => {
      const st = demandDueStatusMap.get(d.id);
      return st && !st.isOverdue && (st.status === 'hoje' || st.status === 'amanha' || st.status === 'semana');
    });
  }, [activeDemands, demandDueStatusMap]);

  // Lista de demandas filtradas pela aba e campo de busca
  const filteredDemandsList = useMemo(() => {
    let list = activeDemands;
    if (demandTab === 'atrasadas') {
      list = overdueDemands;
    } else if (demandTab === 'semana') {
      list = dueThisWeekDemands;
    } else if (demandTab === 'producao') {
      list = inProduction;
    } else if (demandTab === 'aprovacao') {
      list = pendingApprovals;
    }

    if (demandSearch.trim()) {
      const q = demandSearch.toLowerCase().trim();
      list = list.filter((d) => 
        d.title.toLowerCase().includes(q) ||
        d.client.toLowerCase().includes(q) ||
        (d.clientProject && d.clientProject.toLowerCase().includes(q)) ||
        (d.type && d.type.toLowerCase().includes(q))
      );
    }

    // Ordenação: demandas atrasadas sempre primeiro, depois por proximidade de prazo
    return [...list].sort((a, b) => {
      const stA = demandDueStatusMap.get(a.id);
      const stB = demandDueStatusMap.get(b.id);
      if (stA?.isOverdue && !stB?.isOverdue) return -1;
      if (!stA?.isOverdue && stB?.isOverdue) return 1;
      if (stA?.isOverdue && stB?.isOverdue) {
        return (stA.daysDiff || 0) - (stB.daysDiff || 0); // mais atrasadas no topo
      }
      return 0;
    });
  }, [activeDemands, overdueDemands, dueThisWeekDemands, inProduction, pendingApprovals, demandTab, demandSearch, demandDueStatusMap]);
  
  const activeClients = clients.filter((c) => c.status === 'Ativo');
  
  // Cálculos financeiros estritamente baseados nas faturas geradas
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.value || 0), 0);
  const totalPaidInvoices = invoices.filter(i => i.status === 'Pago').reduce((acc, i) => acc + (i.value || 0), 0);
  const recurringInvoices = invoices.filter(i => (i.category || '').toLowerCase().includes('recorr'));
  const totalMRR = recurringInvoices.reduce((acc, i) => acc + (i.value || 0), 0);

  const lastClient = clients.length > 0 ? clients[clients.length - 1] : null;

  // New clients added this month (September 2026 or currently in onboarding)
  const currentMonthYear = '2026-09';
  const newClientsThisMonthList = clients.filter((c) => {
    if (c.joinedDate) {
      return c.joinedDate.startsWith(currentMonthYear) || c.status === 'Em Onboarding';
    }
    return c.status === 'Em Onboarding';
  });
  const newClientsThisMonth = newClientsThisMonthList.length;

  // Format current date in Portuguese
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const formattedDateCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Dynamic greeting based on current hour
  const currentHour = new Date().getHours();
  let greeting = 'Bom dia';

  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
  }

  // Render individual sections based on ID
  const renderSectionContent = (sectionId: InicioSectionId) => {
    switch (sectionId) {
      case 'welcome':
        return (
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              {/* Data do dia */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <Calendar size={13} className="text-[#fab518]" />
                <span>{formattedDateCapitalized}</span>
              </div>

              {/* Saudação dinâmica com horário e nome do usuário */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#142142] dark:text-white tracking-tight">
                {greeting}, <span className="text-[#142142] dark:text-[#fab518]">{currentUser.name}</span>! 👋
              </h2>
            </div>
          </div>
        );

      case 'demandas_stories':
        return (
          <DemandsStoriesSection
            clients={clients}
            demands={demands}
            onSelectDemand={onSelectDemand}
            onOpenNewDemandModal={onOpenNewDemandModal}
          />
        );

      case 'indicadores':
        return (
          <section aria-label="Resumo Executivo da Agência" className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#fab518]" />
                <span>Indicadores Principais do Mês</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                Setembro de 2026
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {/* 1. Monthly Recurring Revenue (MRR) */}
              <div 
                id="summary-card-mrr"
                onClick={() => onNavigate('financeiro')}
                className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-emerald-100 dark:border-emerald-900/50">
                      <TrendingUp size={22} />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
                      <ArrowUpRight size={12} />
                      <span>{invoices.length > 0 ? `${invoices.length} fatura(s)` : 'R$ 0,00 base'}</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Faturamento Gerado
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#142142] dark:text-white mt-1.5 tracking-tight">
                    R$ {totalInvoiced.toLocaleString('pt-BR')}
                    <span className="text-sm font-normal text-slate-400 dark:text-slate-400 ml-1">
                      {totalMRR > 0 ? `(R$ ${totalMRR.toLocaleString('pt-BR')} rec.)` : 'emitido'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Faturas</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {invoices.length} {invoices.length === 1 ? 'emitida' : 'emitidas'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Liquidado</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        R$ {totalPaidInvoices.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-bold text-[#142142] dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <span>Ver fluxo financeiro</span>
                    <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* 2. Demandas Ativas & Status de Prazos */}
              <div 
                id="summary-card-demands"
                onClick={() => onNavigate('demandas')}
                className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#fab518] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-amber-100 dark:border-amber-900/50">
                      <Kanban size={22} />
                    </div>
                    {overdueDemands.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 animate-pulse">
                        <AlertTriangle size={12} />
                        <span>{overdueDemands.length} {overdueDemands.length === 1 ? 'atrasada' : 'atrasadas'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
                        <CheckCircle2 size={12} />
                        <span>100% no prazo</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Demandas em Andamento
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#142142] dark:text-white mt-1.5 tracking-tight flex items-baseline gap-2">
                    {activeDemands.length}
                    <span className="text-sm font-normal text-slate-400 dark:text-slate-400">
                      ativas ({demands.length} {demands.length === 1 ? 'total' : 'totais'})
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Produção</p>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        {inProduction.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Aprovação</p>
                      <p className="font-semibold text-amber-600 dark:text-amber-400">
                        {pendingApprovals.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Atraso</p>
                      <p className={`font-semibold ${overdueDemands.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {overdueDemands.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-bold text-[#142142] dark:text-slate-200 group-hover:text-[#fab518] transition-colors">
                    <span>Ver quadro Kanban</span>
                    <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform text-[#fab518]" />
                  </div>
                </div>
              </div>

              {/* 3. Number of New Clients Added This Month */}
              <div 
                id="summary-card-new-clients"
                onClick={() => onNavigate('clientes')}
                className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#142142] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-blue-100 dark:border-blue-900/50">
                      <UserPlus size={22} />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50">
                      <Sparkles size={12} />
                      <span>Meta: 3 clientes</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Novos Clientes Este Mês
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#142142] dark:text-white mt-1.5 tracking-tight">
                    +{newClientsThisMonth}
                    <span className="text-sm font-normal text-slate-400 dark:text-slate-400 ml-1">adicionados</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Carteira</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {clients.length} contas totais
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Último</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                        {lastClient ? lastClient.name.split(' ')[0] : 'Nenhum'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-bold text-[#142142] dark:text-slate-200 group-hover:text-[#fab518] transition-colors">
                    <span>Gerenciar carteira</span>
                    <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform text-[#fab518]" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'aniversariantes':
        return (
          <ClientBirthdaysSection
            clients={clients}
            onNavigate={onNavigate}
            onSelectClient={onSelectClient}
          />
        );

      case 'mapa':
        return (
          <ClientLocationMap
            clients={clients}
            onNavigate={onNavigate}
          />
        );

      case 'prioridades':
        return (
          <section aria-label="Demandas Prioritárias & Acesso Rápido" className="space-y-4">
            {/* Header com título e ações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fab518]" />
                  <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
                    Demandas em Andamento & Prazos
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acompanhe prazos críticos, gargalos de produção e atalhos rápidos da agência
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => onNavigate('demandas')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-bold text-[#142142] dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Kanban size={14} className="text-[#fab518]" />
                  <span>Quadro Kanban</span>
                  <ArrowUpRight size={13} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Grid Principal: 2 Colunas (Lista de Demandas + Coluna Lateral com Gráfico e Acesso Rápido) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Coluna 1 & 2: Painel de Todas as Demandas com Abas e Filtro de Atrasadas */}
              <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  {/* Topo do Card com Abas de Filtro */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5 mb-4">
                    {/* Abas Segmentadas Executive Style */}
                    <div className="inline-flex items-center p-1.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 gap-1.5 overflow-x-auto scrollbar-none max-w-full shadow-xs backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setDemandTab('todas')}
                        title="Ver todas as demandas ativas"
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 ${
                          demandTab === 'todas'
                            ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-slate-700 font-black'
                            : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Layers size={14} className={demandTab === 'todas' ? 'text-[#fab518]' : 'text-slate-400'} />
                        <span>Todas</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                          demandTab === 'todas'
                            ? 'bg-slate-100 dark:bg-slate-800 text-[#142142] dark:text-slate-200'
                            : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                        }`}>
                          {activeDemands.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemandTab('atrasadas')}
                        title={`${overdueDemands.length} demandas atrasadas`}
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 ${
                          demandTab === 'atrasadas'
                            ? 'bg-rose-600 text-white shadow-xs font-black'
                            : overdueDemands.length > 0
                            ? 'font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100/90 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/70'
                            : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <AlertTriangle 
                          size={14} 
                          className={demandTab === 'atrasadas' ? 'text-white' : overdueDemands.length > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-400'} 
                        />
                        <span>Atrasadas</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold transition-colors ${
                          demandTab === 'atrasadas'
                            ? 'bg-white/25 text-white'
                            : overdueDemands.length > 0
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                        }`}>
                          {overdueDemands.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemandTab('semana')}
                        title="Demandas que vencem nesta semana"
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 ${
                          demandTab === 'semana'
                            ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-slate-700 font-black'
                            : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Clock size={14} className={demandTab === 'semana' ? 'text-blue-500' : 'text-slate-400'} />
                        <span>Esta Semana</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                          demandTab === 'semana'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                        }`}>
                          {dueThisWeekDemands.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemandTab('producao')}
                        title="Demandas em produção no momento"
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 ${
                          demandTab === 'producao'
                            ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-slate-700 font-black'
                            : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Sparkles size={14} className={demandTab === 'producao' ? 'text-purple-500' : 'text-slate-400'} />
                        <span>Produção</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                          demandTab === 'producao'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                        }`}>
                          {inProduction.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemandTab('aprovacao')}
                        title="Demandas aguardando aprovação do cliente"
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 ${
                          demandTab === 'aprovacao'
                            ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-slate-700 font-black'
                            : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <CheckCircle2 size={14} className={demandTab === 'aprovacao' ? 'text-amber-500' : 'text-slate-400'} />
                        <span>Aprovação</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                          demandTab === 'aprovacao'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                        }`}>
                          {pendingApprovals.length}
                        </span>
                      </button>
                    </div>

                    {/* Busca Rápida de Demandas */}
                    <div className="relative min-w-[200px] w-full sm:w-auto">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={demandSearch}
                        onChange={(e) => setDemandSearch(e.target.value)}
                        placeholder="Buscar demanda ou cliente..."
                        className="w-full text-xs pl-8 pr-7 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
                      />
                      {demandSearch && (
                        <button
                          type="button"
                          onClick={() => setDemandSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Demandas */}
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredDemandsList.length > 0 ? (
                      filteredDemandsList.map((demand) => {
                        const dueStatus = demandDueStatusMap.get(demand.id) || getDemandDueStatus(demand);
                        const colConfig = COLUMN_CONFIG[demand.columnId] || {
                          label: demand.columnId,
                          color: '#64748B',
                          badge: 'bg-slate-100 text-slate-700 border-slate-200'
                        };
                        const assignee = getAssigneeInfo(demand.assignee);

                        return (
                          <div
                            key={demand.id}
                            onClick={() => onSelectDemand ? onSelectDemand(demand.id) : onNavigate('demandas')}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                              dueStatus.isOverdue
                                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-900/60 hover:border-rose-400 hover:shadow-xs'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                            }`}
                          >
                            {/* Lado Esquerdo: Info da Demanda */}
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${colConfig.badge}`}>
                                  {colConfig.label}
                                </span>
                                {demand.type && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                    {demand.type}
                                  </span>
                                )}
                                {demand.priority === 'urgente' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-2xs">
                                    <Flame size={11} />
                                    <span>URGENTE</span>
                                  </span>
                                )}
                                {demand.priority === 'alta' && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                                    ALTA
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors truncate">
                                  {demand.title}
                                </h4>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1 font-semibold text-[#142142] dark:text-slate-200 truncate">
                                  <Building2 size={13} className="text-slate-400 shrink-0" />
                                  <span>{demand.client}</span>
                                </span>
                                {demand.clientProject && (
                                  <span className="text-slate-400 truncate">
                                    • {demand.clientProject}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Lado Direito: Prazo, Responsável & Botão */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60 shrink-0">
                              {/* Prazo */}
                              <div className="text-right">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border ${dueStatus.badgeClass}`}>
                                  {dueStatus.isOverdue ? (
                                    <>
                                      <CalendarX2 size={13} className="text-rose-600 dark:text-rose-400 animate-pulse" />
                                      <span>{dueStatus.label}</span>
                                    </>
                                  ) : dueStatus.status === 'hoje' ? (
                                    <>
                                      <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                                      <span>{dueStatus.label}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Calendar size={13} className="text-slate-400" />
                                      <span>{dueStatus.label}</span>
                                    </>
                                  )}
                                </div>
                                {demand.dueDate && dueStatus.isOverdue && (
                                  <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                                    Venceu: {formatDemandDateFull(demand.dueDate)}
                                  </p>
                                )}
                              </div>

                              {/* Responsável */}
                              <div className="flex items-center gap-2" title={`Responsável: ${assignee.name}`}>
                                {assignee.avatar ? (
                                  <img
                                    src={assignee.avatar}
                                    alt={assignee.name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                                    {assignee.name.charAt(0)}
                                  </div>
                                )}
                              </div>

                              {/* Botão de abrir detalhes */}
                              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 group-hover:bg-[#fab518] group-hover:text-[#142142] text-slate-400 flex items-center justify-center transition-colors border border-slate-200/80 dark:border-slate-700 shrink-0">
                                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm font-bold text-[#142142] dark:text-white">
                          {demandTab === 'atrasadas'
                            ? 'Nenhuma demanda atrasada!'
                            : demandSearch
                            ? 'Nenhuma demanda encontrada com o termo buscado'
                            : 'Nenhuma demanda ativa nesta categoria'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                          {demandTab === 'atrasadas'
                            ? 'Excelente! Todas as entregas e cronogramas da equipe estão no prazo.'
                            : 'Crie uma nova demanda ou confira o quadro completo no Kanban.'}
                        </p>
                        {demandTab === 'atrasadas' && (
                          <button
                            type="button"
                            onClick={() => setDemandTab('todas')}
                            className="mt-2 text-xs font-bold text-[#fab518] hover:underline cursor-pointer"
                          >
                            Ver todas as demandas ativas →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card de Demandas com Atalho Rápido para Kanban */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Mostrando {filteredDemandsList.length} de {activeDemands.length} demandas ativas
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('demandas')}
                    className="font-bold text-[#142142] dark:text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver quadro completo</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Coluna 3: Gráfico de Rosca de Status & Acesso Rápido */}
              <div className="space-y-5">
                {/* Gráfico de Status */}
                <DemandsStatusDoughnutChart demands={demands} onNavigate={onNavigate} />

                {/* Acesso Rápido */}
                <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <h3 className="text-sm font-black text-[#142142] dark:text-white tracking-tight flex items-center gap-2">
                      <Sparkles size={15} className="text-[#fab518]" />
                      <span>Acesso Rápido</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={onOpenNewDemandModal}
                      className="w-full text-left p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          <Plus size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#142142] dark:text-white truncate">Criar Nova Demanda</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Post, Carrossel ou Campanha</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800 shrink-0">
                        Atalho
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('calendario')}
                      className="w-full text-left p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                          <Calendar size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#142142] dark:text-white truncate">Datas Comemorativas</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Feriados e ideias de posts</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                        2026
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('orcamentos')}
                      className="w-full text-left p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <FileSpreadsheet size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#142142] dark:text-white truncate">Novo Orçamento</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Proposta comercial</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                        Comercial
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('clientes')}
                      className="w-full text-left p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          <UserPlus size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#142142] dark:text-white truncate">Cadastrar Cliente</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Contatos e acessos</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Base
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Seções do Painel de Início */}
      <div className="space-y-4">
        {visibleSections.map((sectionId) => (
          <div key={sectionId} id={`section-container-${sectionId}`}>
            {renderSectionContent(sectionId)}
          </div>
        ))}
      </div>
    </div>
  );
};
