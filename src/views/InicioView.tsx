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
  ChevronLeft,
  Layers,
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
  FileSpreadsheet
} from 'lucide-react';
import { Client, DemandItem, PageId, ClientActivity, InicioSectionId, InicioSectionMeta, Invoice } from '../types';
import { RecentClientActivityFeed } from '../components/RecentClientActivityFeed';
import { DemandsStatusDoughnutChart } from '../components/DemandsStatusDoughnutChart';
import { ClientLocationMap } from '../components/ClientLocationMap';
import { ClientBirthdaysSection } from '../components/ClientBirthdaysSection';
import { DashboardCustomizerModal, DASHBOARD_PRESETS, DashboardCustomizerPreset } from '../components/DashboardCustomizerModal';
import { initialRecentActivities, currentUser } from '../data/mockData';

const DEFAULT_SECTIONS: InicioSectionId[] = [
  'welcome',
  'indicadores',
  'prioridades',
  'aniversariantes',
  'atividades',
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
  atividades: {
    id: 'atividades',
    title: 'Feed de Atividades Recentes',
    shortLabel: 'Atividades',
    description: 'Últimas atualizações e histórico operacional de clientes',
    iconName: 'clock',
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

const STORAGE_ORDER_KEY = 'ideias_digitais_inicio_sections_order_v2';
const STORAGE_HIDDEN_KEY = 'ideias_digitais_inicio_sections_hidden_v2';

const loadSavedOrder = (): InicioSectionId[] => {
  try {
    const saved = localStorage.getItem(STORAGE_ORDER_KEY);
    if (!saved) return DEFAULT_SECTIONS;
    const parsed = JSON.parse(saved) as InicioSectionId[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validSections = parsed.filter((id) => DEFAULT_SECTIONS.includes(id));
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
  invoices = [],
  activities = initialRecentActivities,
  onOpenNewDemandModal,
  onSelectDemand,
  onSelectClient,
}) => {
  // Reordering & Visibility state with automatic persistence
  const [sectionsOrder, setSectionsOrder] = useState<InicioSectionId[]>(loadSavedOrder);
  const [hiddenSections, setHiddenSections] = useState<InicioSectionId[]>(loadSavedHidden);
  const [recentlyHiddenSection, setRecentlyHiddenSection] = useState<InicioSectionId | null>(null);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState('Personalização salva!');

  // Trigger feedback notification
  const triggerToast = (msg: string) => {
    setSaveToastMessage(msg);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Synchronize order with localStorage
  const saveOrder = (newOrder: InicioSectionId[]) => {
    setSectionsOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(newOrder));
      triggerToast('Ordem das seções salva!');
    } catch (err) {
      console.warn('Erro ao salvar ordem no localStorage:', err);
    }
  };

  // Synchronize hidden sections with localStorage
  const saveHidden = (newHidden: InicioSectionId[], toastMsg = 'Configurações salvas!') => {
    setHiddenSections(newHidden);
    try {
      localStorage.setItem(STORAGE_HIDDEN_KEY, JSON.stringify(newHidden));
      triggerToast(toastMsg);
    } catch (err) {
      console.warn('Erro ao salvar seções ocultas:', err);
    }
  };

  const handleToggleVisibility = (sectionId: InicioSectionId) => {
    const isHidden = hiddenSections.includes(sectionId);
    if (!isHidden) {
      // Trying to hide: prevent hiding if only 1 visible
      const visibleCount = sectionsOrder.length - hiddenSections.length;
      if (visibleCount <= 1) {
        triggerToast('Ao menos uma seção deve permanecer visível');
        return;
      }
      const newHidden = [...hiddenSections, sectionId];
      setRecentlyHiddenSection(sectionId);
      saveHidden(newHidden, `Seção "${SECTIONS_META[sectionId]?.shortLabel || sectionId}" ocultada`);
    } else {
      const newHidden = hiddenSections.filter((id) => id !== sectionId);
      if (recentlyHiddenSection === sectionId) {
        setRecentlyHiddenSection(null);
      }
      saveHidden(newHidden, `Seção "${SECTIONS_META[sectionId]?.shortLabel || sectionId}" reexibida`);
    }
  };

  const handleUnhideSection = (sectionId: InicioSectionId) => {
    const newHidden = hiddenSections.filter((id) => id !== sectionId);
    if (recentlyHiddenSection === sectionId) {
      setRecentlyHiddenSection(null);
    }
    saveHidden(newHidden, `Seção "${SECTIONS_META[sectionId]?.shortLabel || sectionId}" reexibida`);
  };

  const handleUndoHide = () => {
    if (!recentlyHiddenSection) return;
    handleUnhideSection(recentlyHiddenSection);
  };

  const handleShowAll = () => {
    setRecentlyHiddenSection(null);
    saveHidden([], 'Todas as seções estão visíveis!');
  };

  const handleApplyPreset = (preset: DashboardCustomizerPreset) => {
    setSectionsOrder(preset.order);
    setHiddenSections(preset.hidden);
    setRecentlyHiddenSection(null);
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(preset.order));
      localStorage.setItem(STORAGE_HIDDEN_KEY, JSON.stringify(preset.hidden));
      triggerToast(`Modelo "${preset.name}" ativado!`);
    } catch (err) {
      console.warn('Erro ao aplicar preset:', err);
    }
  };

  const handleResetDefault = () => {
    setSectionsOrder(DEFAULT_SECTIONS);
    setHiddenSections([]);
    setRecentlyHiddenSection(null);
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(DEFAULT_SECTIONS));
      localStorage.setItem(STORAGE_HIDDEN_KEY, JSON.stringify([]));
      triggerToast('Padrão original restaurado!');
    } catch (err) {
      console.warn('Erro ao resetar padrão:', err);
    }
  };

  // Visible sections list in order
  const visibleSections = sectionsOrder.filter((id) => !hiddenSections.includes(id));

  const handleMoveVisible = (visibleIndex: number, direction: 'up' | 'down') => {
    const targetVisibleIndex = direction === 'up' ? visibleIndex - 1 : visibleIndex + 1;
    if (targetVisibleIndex < 0 || targetVisibleIndex >= visibleSections.length) return;

    const currentId = visibleSections[visibleIndex];
    const targetId = visibleSections[targetVisibleIndex];

    const currentIndex = sectionsOrder.indexOf(currentId);
    const targetIndex = sectionsOrder.indexOf(targetId);

    const newOrder = [...sectionsOrder];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    saveOrder(newOrder);
  };

  // Drag and Drop handlers for visible sections
  const handleDragStart = (e: React.DragEvent, visibleIndex: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(visibleIndex));
    setDraggedSectionIndex(visibleIndex);
  };

  const handleDragEnd = () => {
    setDraggedSectionIndex(null);
    setDropIndicatorIndex(null);
  };

  const handleDropAtSlot = (targetVisibleIndex: number) => {
    if (draggedSectionIndex === null) return;
    
    const draggedId = visibleSections[draggedSectionIndex];
    if (!draggedId) return;

    const currentFullIndex = sectionsOrder.indexOf(draggedId);
    if (currentFullIndex === -1) return;

    let targetFullIndex: number;
    if (targetVisibleIndex >= visibleSections.length) {
      const lastVisibleId = visibleSections[visibleSections.length - 1];
      targetFullIndex = sectionsOrder.indexOf(lastVisibleId);
    } else {
      const targetVisibleId = visibleSections[targetVisibleIndex];
      targetFullIndex = sectionsOrder.indexOf(targetVisibleId);
    }

    const newOrder = [...sectionsOrder];
    const [moved] = newOrder.splice(currentFullIndex, 1);
    const insertionPoint = newOrder.indexOf(sectionsOrder[targetFullIndex]);
    newOrder.splice(insertionPoint >= 0 ? insertionPoint : 0, 0, moved);

    saveOrder(newOrder);
    setDraggedSectionIndex(null);
    setDropIndicatorIndex(null);
  };

  const activeDemands = demands.filter((d) => d.columnId !== 'concluidas');
  const pendingApprovals = demands.filter((d) => d.columnId === 'aprovacao');
  const inProduction = demands.filter((d) => d.columnId === 'producao');
  const scheduledDemands = demands.filter((d) => d.columnId === 'agendamento');
  
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

  // Filter for demands list inspired by the reference image
  const [demandsFilter, setDemandsFilter] = useState<'todas' | 'producao' | 'aprovacao' | 'agendamento'>('todas');

  // Mini calendar state for September 2026 (0-indexed month: 8 = September)
  const [miniCalMonth, setMiniCalMonth] = useState<number>(8);
  const [miniCalYear, setMiniCalYear] = useState<number>(2026);

  const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevCalMonth = () => {
    if (miniCalMonth === 0) {
      setMiniCalMonth(11);
      setMiniCalYear((prev) => prev - 1);
    } else {
      setMiniCalMonth((prev) => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (miniCalMonth === 11) {
      setMiniCalMonth(0);
      setMiniCalYear((prev) => prev + 1);
    } else {
      setMiniCalMonth((prev) => prev + 1);
    }
  };

  const calGridCells = useMemo(() => {
    const cells: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean; hasDemand: boolean }> = [];
    const firstDayOfWeek = new Date(miniCalYear, miniCalMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(miniCalYear, miniCalMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(miniCalYear, miniCalMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
        hasDemand: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === 18 && miniCalMonth === 8 && miniCalYear === 2026;
      const dayStr = String(day).padStart(2, '0');
      const hasDemand = demands.some((d) => d.dueDate && d.dueDate.includes(dayStr));
      cells.push({
        day,
        isCurrentMonth: true,
        isToday,
        hasDemand,
      });
    }

    // Next month leading days to complete grid (multiples of 7: 35 or 42)
    const targetLength = cells.length > 35 ? 42 : 35;
    const remaining = targetLength - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        hasDemand: false,
      });
    }

    return cells;
  }, [miniCalYear, miniCalMonth, demands]);

  const getProgressForDemand = (columnId: string): number => {
    switch (columnId) {
      case 'ideias': return 25;
      case 'producao': return 50;
      case 'aprovacao': return 75;
      case 'agendamento': return 90;
      case 'concluidas': return 100;
      default: return 35;
    }
  };

  const getProgressColor = (columnId: string): string => {
    switch (columnId) {
      case 'ideias': return '#64748B';
      case 'producao': return '#8B5CF6';
      case 'aprovacao': return '#fab518';
      case 'agendamento': return '#10B981';
      case 'concluidas': return '#3B82F6';
      default: return '#fab518';
    }
  };

  const renderCircularProgress = (percent: number, color: string) => {
    const radius = 13;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    return (
      <div className="relative flex items-center justify-center shrink-0 w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="2.75"
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={color}
            strokeWidth="2.75"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-[10px] font-black text-slate-700 dark:text-slate-200">
          {percent}%
        </span>
      </div>
    );
  };

  const filteredActiveDemands = activeDemands.filter((d) => {
    if (demandsFilter === 'todas') return true;
    return d.columnId === demandsFilter;
  });

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

            {!isReorderMode && (
              <button
                type="button"
                id="btn-toggle-reorder-mode"
                onClick={() => setIsReorderMode(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-[#142142] dark:hover:text-white hover:border-[#fab518] border border-slate-200/90 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs hover:shadow-sm shrink-0 self-start sm:self-center group"
                title="Personalizar e organizar os blocos do painel de início"
              >
                <Move size={13} className="text-[#fab518] group-hover:scale-110 transition-transform" />
                <span>Modo Organização</span>
              </button>
            )}
          </div>
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
              {/* 1. Total Active Demands */}
              <div 
                id="summary-card-active-demands"
                onClick={() => onNavigate('demandas')}
                className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#fab518] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-amber-200/60 dark:border-amber-900/40">
                      <Layers size={22} />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                      <Clock size={12} />
                      <span>Em andamento</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Total de Demandas Ativas
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#142142] dark:text-white mt-1.5 tracking-tight">
                    {activeDemands.length}
                    <span className="text-xs font-semibold text-slate-400 ml-2">peças em fluxo</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {inProduction.length} produção
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Aprovação</p>
                      <p className="font-semibold text-amber-600 dark:text-amber-400">
                        {pendingApprovals.length} pendentes
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-bold text-[#142142] dark:text-slate-200 group-hover:text-[#fab518] dark:group-hover:text-[#fab518] transition-colors">
                    <span>Visualizar no Kanban</span>
                    <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform text-[#fab518]" />
                  </div>
                </div>
              </div>

              {/* 2. Monthly Recurring Revenue (MRR) */}
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

      case 'atividades':
        return (
          <RecentClientActivityFeed 
            activities={activities}
            onNavigate={onNavigate}
            onSelectDemand={onSelectDemand}
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols on XL screens): Activity + Daily Schedule + Demands in Progress */}
            <div className="xl:col-span-8 space-y-6">
              {/* Row 1: Split 2 Cards side by side (Hours Activity & Daily Schedule from reference layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Card 1: Atividade de Produção & Status (Hours Activity style) */}
                <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                          <Kanban size={17} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#142142] dark:text-white tracking-tight">
                            Atividade de Produção
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Fluxo ativo no Kanban
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
                        <TrendingUp size={12} />
                        <span>+15% no mês</span>
                      </span>
                    </div>

                    <div className="pt-1">
                      <DemandsStatusDoughnutChart
                        demands={demands}
                        onNavigate={onNavigate}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Agenda & Prazos da Semana (Daily Schedule style from reference layout) */}
                <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center border border-amber-200/60 dark:border-amber-900/50">
                          <Calendar size={17} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#142142] dark:text-white tracking-tight">
                            Prazos da Semana
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Próximas entregas críticas
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('demandas')}
                        className="text-[11px] font-bold text-[#142142] dark:text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Ver Kanban</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {activeDemands.slice(0, 3).map((d, idx) => {
                        const bgColors = [
                          'bg-amber-50/80 dark:bg-amber-950/20 text-[#fab518] border-amber-200/60',
                          'bg-purple-50/80 dark:bg-purple-950/20 text-purple-600 border-purple-200/60',
                          'bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 border-blue-200/60',
                        ];
                        return (
                          <div
                            key={d.id}
                            onClick={() => {
                              if (onSelectDemand) onSelectDemand(d.id);
                              onNavigate('demandas');
                            }}
                            className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/90 dark:hover:bg-slate-800 transition-all border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-xs font-black shrink-0 ${bgColors[idx % bgColors.length]}`}>
                                {d.type.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors truncate">
                                  {d.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {d.client}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                                {d.dueDate || 'Esta semana'}
                              </span>
                              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Total em fila: <strong>{activeDemands.length} demandas</strong></span>
                    <button
                      type="button"
                      onClick={() => onNavigate('calendario')}
                      className="text-[#142142] dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Calendário 2026</span>
                      <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: "Demandas em Andamento" (Course You're Taking style from reference layout) */}
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs hover:shadow-sm transition-all space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
                        Demandas em Andamento
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {filteredActiveDemands.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Acompanhe o progresso das entregas prioritárias da sua agência
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Filter Pills like "Active v" */}
                    <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold">
                      {(['todas', 'producao', 'aprovacao', 'agendamento'] as const).map((filterKey) => {
                        const labels = {
                          todas: 'Todas',
                          producao: 'Produção',
                          aprovacao: 'Aprovação',
                          agendamento: 'Agendadas'
                        };
                        const isActive = demandsFilter === filterKey;
                        return (
                          <button
                            key={filterKey}
                            type="button"
                            onClick={() => setDemandsFilter(filterKey)}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs font-black'
                                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
                            }`}
                          >
                            {labels[filterKey]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Demand Button inspired by the + button */}
                    <button
                      type="button"
                      onClick={onOpenNewDemandModal}
                      className="px-3.5 py-1.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs shrink-0"
                      title="Criar nova demanda"
                    >
                      <Plus size={14} className="stroke-[3]" />
                      <span className="hidden sm:inline">Criar Demanda</span>
                    </button>
                  </div>
                </div>

                {/* List of Demands (Horizontal Cards with Circular Progress Ring) */}
                <div className="space-y-3">
                  {filteredActiveDemands.length === 0 ? (
                    <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nenhuma demanda encontrada neste filtro
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Crie novos posts, carrosséis ou campanhas para visualizar o progresso da equipe.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewDemandModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black transition-colors cursor-pointer mt-1"
                      >
                        <Plus size={13} className="stroke-[3]" />
                        <span>Criar Demanda</span>
                      </button>
                    </div>
                  ) : (
                    filteredActiveDemands.slice(0, 5).map((d) => {
                      const progress = getProgressForDemand(d.columnId);
                      const color = getProgressColor(d.columnId);
                      return (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/90 transition-all border border-slate-200/70 dark:border-slate-700/60 group cursor-pointer"
                          onClick={() => {
                            if (onSelectDemand) onSelectDemand(d.id);
                            onNavigate('demandas');
                          }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Thumbnail or Squircle Icon */}
                            {d.thumbnail?.trim() ? (
                              <img
                                src={d.thumbnail}
                                alt=""
                                className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-800 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-black text-sm shrink-0 border border-amber-300/40 dark:border-slate-700">
                                {d.type.charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Title + Client + Assignee */}
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors truncate">
                                {d.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{d.client}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 truncate">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-black flex items-center justify-center text-slate-600 dark:text-slate-300">
                                    {d.assignee.name.charAt(0)}
                                  </span>
                                  <span>{d.assignee.name.split(' ')[0]}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Due Date Pill + Circular Progress Ring */}
                          <div className="flex items-center gap-3.5 shrink-0 ml-3">
                            <div className="text-right hidden sm:block">
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                <Clock size={10} className="text-slate-400" />
                                <span>{d.dueDate || 'Pendente'}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                                {d.columnId}
                              </p>
                            </div>

                            {/* Circular Progress Ring matching the reference image */}
                            {renderCircularProgress(progress, color)}

                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Mostrando até 5 demandas em andamento
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('demandas')}
                    className="text-xs font-bold text-[#142142] dark:text-[#fab518] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver todas no Kanban</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols on XL screens): Go Premium Banner + Mini Calendar + Quick Assignments */}
            <div className="xl:col-span-4 space-y-6">
              {/* Card 1: Portal de Aprovação (Go Premium style from reference layout) */}
              <div className="bg-gradient-to-br from-[#142142] via-[#1a2b56] to-[#142142] text-white rounded-[26px] p-5 sm:p-6 shadow-sm border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#fab518]/10 blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fab518]/20 text-[#fab518] border border-[#fab518]/30">
                    <Sparkles size={11} />
                    <span>Portal do Cliente</span>
                  </span>
                  <span className="text-[10px] text-slate-300">Link Direto</span>
                </div>

                <div>
                  <h4 className="text-base font-black text-white">Aprovação Instantânea</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    Envie links diretos para seus clientes revisarem e aprovarem criativos sem necessidade de login.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('portal-cliente')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs group mt-1"
                >
                  <span>Acessar Portal do Cliente</span>
                  <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Card 2: Mini Calendário Interativo (Mini Calendar style from reference layout) */}
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all space-y-3.5">
                {/* Month Navigation Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevCalMonth}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Mês anterior"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-black text-[#142142] dark:text-white tracking-tight">
                      {MONTH_NAMES_PT[miniCalMonth]}, {miniCalYear}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextCalMonth}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Próximo mês"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Weekday Headers: D S T Q Q S S */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => (
                    <span key={i} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1">
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Days Grid with Today Highlighted in lime/amber circle */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calGridCells.map((cell, idx) => (
                    <div
                      key={idx}
                      onClick={() => onNavigate('calendario')}
                      className={`
                        h-8 w-8 mx-auto flex flex-col items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-all relative
                        ${cell.isToday 
                          ? 'bg-[#fab518] text-[#142142] font-black shadow-xs ring-2 ring-[#fab518]/30 scale-105' 
                          : cell.isCurrentMonth
                            ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : 'text-slate-300 dark:text-slate-600 opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }
                      `}
                      title={`${cell.day} de ${MONTH_NAMES_PT[miniCalMonth]}`}
                    >
                      <span>{cell.day}</span>
                      {cell.hasDemand && !cell.isToday && (
                        <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400 absolute bottom-1" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer link to full calendar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hoje: <strong>18/09/2026</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('calendario')}
                    className="text-[11px] font-bold text-[#142142] dark:text-[#fab518] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Calendário 2026</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Card 3: Acesso Rápido da Agência (Assignments style from reference layout) */}
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="text-sm font-black text-[#142142] dark:text-white tracking-tight">
                    Acesso Rápido
                  </h3>
                  <button
                    type="button"
                    onClick={onOpenNewDemandModal}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#fab518] hover:text-[#142142] flex items-center justify-center transition-colors cursor-pointer"
                    title="Criar Demanda Rápida"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onOpenNewDemandModal}
                    className="w-full text-left p-2.5 sm:p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between cursor-pointer group"
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
                    className="w-full text-left p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
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
                    className="w-full text-left p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <FileSpreadsheet size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#142142] dark:text-white truncate">Novo Orçamento</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Proposta e contrato comercial</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                      Comercial
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('clientes')}
                    className="w-full text-left p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <UserPlus size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#142142] dark:text-white truncate">Cadastrar Cliente</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Contatos, redes e acessos</p>
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Fallback button if the Welcome section is hidden by the user */}
      {!isReorderMode && !visibleSections.includes('welcome') && (
        <div className="flex justify-end animate-in fade-in">
          <button
            type="button"
            id="btn-toggle-reorder-mode-fallback"
            onClick={() => setIsReorderMode(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#142142] dark:hover:text-white hover:border-[#fab518] border border-slate-200/90 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs hover:shadow-sm group"
            title="Organizar e personalizar a ordem dos blocos do painel"
          >
            <Move size={13} className="text-[#fab518] group-hover:scale-110 transition-transform" />
            <span>Modo Organização</span>
          </button>
        </div>
      )}

      {/* Top Controls Toolbar: In Modo Organização, unlocks all customization tools */}
      {isReorderMode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-amber-50/70 dark:bg-slate-900/90 backdrop-blur-md p-3.5 sm:p-4.5 rounded-[24px] border-2 border-[#fab518] dark:border-[#fab518]/70 shadow-lg shadow-amber-500/5 ring-4 ring-[#fab518]/10 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 shadow-xs font-black">
              <Move size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#142142] dark:text-white tracking-tight flex items-center gap-1.5">
                  <span>Modo Organização Ativo</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#fab518] animate-ping" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-amber-300 dark:border-amber-800">
                  {visibleSections.length} de {sectionsOrder.length} visíveis
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Arraste os blocos, altere a ordem pelas setas, oculte seções ou aplique modelos prontos
              </p>
            </div>
          </div>

          {/* Customization actions unlocked in Modo Organização */}
          <div className="flex items-center gap-2 self-stretch sm:self-center justify-between sm:justify-end flex-wrap">
            {/* Main Customizer Modal Button */}
            <button
              type="button"
              id="btn-open-customizer-modal"
              onClick={() => setIsCustomizerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-[#142142] dark:text-white font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs"
              title="Abrir painel completo de personalização (ordem em lista, modelos prontos e visibilidade)"
            >
              <SlidersHorizontal size={13} className="text-[#fab518]" />
              <span>Personalizar Seções</span>
            </button>

            {/* Reset to Default Order */}
            {(hiddenSections.length > 0 || sectionsOrder.some((s, idx) => s !== DEFAULT_SECTIONS[idx])) && (
              <button
                type="button"
                id="btn-reset-sections-default"
                onClick={handleResetDefault}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Restaurar posições e visibilidade padrão"
              >
                <RotateCcw size={13} />
                <span className="hidden md:inline">Restaurar Padrão</span>
              </button>
            )}

            {/* Finish and Exit Modo Organização */}
            <button
              type="button"
              id="btn-toggle-reorder-mode"
              onClick={() => setIsReorderMode(false)}
              className="px-4 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
              title="Concluir e fechar o modo organização"
            >
              <Check size={14} className="stroke-[3]" />
              <span>Concluir Organização</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Save / Undo Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-40 bg-[#142142] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/70 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check size={14} className="stroke-[3]" />
          </div>
          <span className="text-xs font-semibold">{saveToastMessage}</span>
          {recentlyHiddenSection && (
            <button
              type="button"
              onClick={handleUndoHide}
              className="text-xs font-black text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer ml-1 pl-2 border-l border-slate-700"
            >
              <Undo2 size={12} />
              <span>Desfazer</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden Sections Quick-Restore Banner: ONLY visible in Modo Organização */}
      {isReorderMode && hiddenSections.length > 0 && (
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <EyeOff size={16} className="text-[#fab518] shrink-0" />
            <span>
              <strong>{hiddenSections.length} {hiddenSections.length === 1 ? 'seção oculta' : 'seções ocultas'}:</strong> Clique em um dos blocos para reativá-lo
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {hiddenSections.map((secId) => {
              const meta = SECTIONS_META[secId];
              return (
                <button
                  key={secId}
                  type="button"
                  onClick={() => handleUnhideSection(secId)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-amber-300/80 dark:border-amber-800/80 text-slate-700 dark:text-slate-200 hover:text-[#fab518] hover:border-[#fab518] font-bold text-[11px] transition-all cursor-pointer shadow-2xs group"
                >
                  <Plus size={12} className="text-[#fab518] group-hover:rotate-90 transition-transform" />
                  <span>{meta?.shortLabel || secId}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleShowAll}
              className="text-[11px] font-bold text-[#142142] dark:text-[#fab518] hover:underline ml-1 cursor-pointer"
            >
              Reexibir todas
            </button>
          </div>
        </div>
      )}

      {/* Visible Sections Loop with Drag-and-Drop, Quick Hide & Position Controls */}
      <div className="space-y-4">
        {visibleSections.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0f172a] rounded-[28px] border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <EyeOff size={32} className="mx-auto text-slate-400" />
            <h4 className="text-base font-black text-[#142142] dark:text-white">Nenhuma seção ativa no momento</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Todas as seções foram ocultadas. Clique no botão abaixo para restaurar o layout padrão.
            </p>
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-4 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Restaurar Seções Padrão</span>
            </button>
          </div>
        ) : (
          visibleSections.map((sectionId, index) => {
            const meta = SECTIONS_META[sectionId];
            const isDraggingThis = draggedSectionIndex === index;
            const isDropSlotActive = dropIndicatorIndex === index && draggedSectionIndex !== index;

            return (
              <React.Fragment key={sectionId}>
                {/* Visual Drop Target Indicator - Before this section (ONLY in Modo Organização when dragging) */}
                {isReorderMode && draggedSectionIndex !== null && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropIndicatorIndex(index);
                    }}
                    onDragLeave={() => {
                      if (dropIndicatorIndex === index) {
                        setDropIndicatorIndex(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropAtSlot(index);
                    }}
                    className={`
                      transition-all duration-150 rounded-2xl flex items-center justify-center
                      ${isDropSlotActive 
                        ? 'h-14 bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-[#fab518] shadow-sm my-2' 
                        : 'h-3 hover:h-6 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 border-2 border-transparent hover:border-dashed hover:border-slate-300 dark:hover:border-slate-700 -my-1.5'
                      }
                    `}
                  >
                    {isDropSlotActive && (
                      <div className="flex items-center gap-2 text-xs font-black text-[#142142] dark:text-[#fab518] animate-pulse">
                        <ArrowDown size={15} className="text-[#fab518]" />
                        <span>Soltar seção aqui • Posição {index + 1} de {visibleSections.length}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Section Container Card */}
                <div
                  id={`section-container-${sectionId}`}
                  onDragOver={isReorderMode ? (e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midPoint = rect.top + rect.height / 2;
                    if (e.clientY < midPoint) {
                      setDropIndicatorIndex(index);
                    } else {
                      setDropIndicatorIndex(index + 1);
                    }
                  } : undefined}
                  className={`
                    relative rounded-[28px] transition-all duration-200
                    ${isReorderMode && isDraggingThis ? 'opacity-30 scale-[0.985] ring-2 ring-dashed ring-[#fab518]' : ''}
                    ${isReorderMode ? 'ring-2 ring-amber-300/70 dark:ring-amber-500/40 p-2.5 sm:p-3 bg-amber-50/20 dark:bg-slate-900/30' : ''}
                  `}
                >
                  {/* Section Top Controls Bar (Grip, Position, Up/Down and Quick Hide) - ONLY in Modo Organização */}
                  {isReorderMode && (
                    <div className="flex items-center justify-between mb-2.5 px-1 animate-in fade-in duration-150">
                      {/* Grip Handle & Section Label */}
                      <div className="flex items-center gap-2">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          title="Arraste para reposicionar esta seção livremente"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs text-slate-600 dark:text-slate-300 text-xs font-bold cursor-grab active:cursor-grabbing hover:border-[#fab518] hover:text-[#fab518] transition-colors select-none"
                        >
                          <GripVertical size={13} className="text-slate-400 group-hover:text-[#fab518]" />
                          <span className="font-black text-[10px] text-slate-400 dark:text-slate-400">#{index + 1}</span>
                          <span className="truncate max-w-[140px] sm:max-w-none">{meta ? meta.title : sectionId}</span>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 hidden sm:inline">
                          {index + 1} de {visibleSections.length}
                        </span>
                      </div>

                      {/* Quick Move and Hide Controls */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveVisible(index, 'up')}
                          className={`p-1 rounded-lg transition-colors ${
                            index === 0
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                              : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                          }`}
                          title="Mover seção para cima"
                          aria-label={`Mover ${meta?.shortLabel || sectionId} para cima`}
                        >
                          <ArrowUp size={13} className="stroke-[2.5]" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === visibleSections.length - 1}
                          onClick={() => handleMoveVisible(index, 'down')}
                          className={`p-1 rounded-lg transition-colors ${
                            index === visibleSections.length - 1
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                              : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                          }`}
                          title="Mover seção para baixo"
                          aria-label={`Mover ${meta?.shortLabel || sectionId} para baixo`}
                        >
                          <ArrowDown size={13} className="stroke-[2.5]" />
                        </button>

                        {/* Quick Hide Button */}
                        <button
                          type="button"
                          disabled={visibleSections.length <= 1}
                          onClick={() => handleToggleVisibility(sectionId)}
                          className={`p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
                            visibleSections.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={visibleSections.length <= 1 ? 'Pelo menos uma seção deve permanecer visível' : 'Ocultar esta seção do painel'}
                          aria-label={`Ocultar seção ${meta?.shortLabel || sectionId}`}
                        >
                          <EyeOff size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section Content - 100% Preserved */}
                  <div>
                    {renderSectionContent(sectionId)}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Visual Drop Target Indicator - After the last visible section (ONLY in Modo Organização when dragging) */}
        {isReorderMode && draggedSectionIndex !== null && visibleSections.length > 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDropIndicatorIndex(visibleSections.length);
            }}
            onDragLeave={() => {
              if (dropIndicatorIndex === visibleSections.length) {
                setDropIndicatorIndex(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDropAtSlot(visibleSections.length);
            }}
            className={`
              transition-all duration-150 rounded-2xl flex items-center justify-center
              ${dropIndicatorIndex === visibleSections.length
                ? 'h-14 bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-[#fab518] shadow-sm my-2'
                : 'h-4 hover:h-6 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 border-2 border-transparent hover:border-dashed hover:border-slate-300 dark:hover:border-slate-700'
              }
            `}
          >
            {dropIndicatorIndex === visibleSections.length && (
              <div className="flex items-center gap-2 text-xs font-black text-[#142142] dark:text-[#fab518] animate-pulse">
                <ArrowDown size={15} className="text-[#fab518]" />
                <span>Posicionar no final do painel • Posição {visibleSections.length} de {visibleSections.length}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Customizer Modal for List, Presets & Visibility */}
      <DashboardCustomizerModal
        isOpen={isCustomizerModalOpen}
        onClose={() => setIsCustomizerModalOpen(false)}
        sectionsOrder={sectionsOrder}
        hiddenSections={hiddenSections}
        onReorder={saveOrder}
        onToggleVisibility={handleToggleVisibility}
        onApplyPreset={handleApplyPreset}
        onResetDefault={handleResetDefault}
        onShowAll={handleShowAll}
        sectionsMeta={SECTIONS_META}
      />
    </div>
  );
};
