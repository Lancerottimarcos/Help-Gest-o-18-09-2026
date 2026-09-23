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
  ShieldAlert
} from 'lucide-react';
import { Client, DemandItem, PageId, ClientActivity, InicioSectionId, InicioSectionMeta, Invoice, TeamMember } from '../types';
import { ClientLocationMap } from '../components/ClientLocationMap';
import { ClientBirthdaysSection } from '../components/ClientBirthdaysSection';
import { DashboardCustomizerModal, DASHBOARD_PRESETS, DashboardCustomizerPreset } from '../components/DashboardCustomizerModal';
import { DemandsStoriesSection } from '../components/DemandsStoriesSection';
import { DemandsProgressChart } from '../components/DemandsProgressChart';
import { initialRecentActivities, currentUser } from '../data/mockData';

const DEFAULT_SECTIONS: InicioSectionId[] = [
  'welcome',
  'demandas_stories',
  'demandas_atrasadas',
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
  demandas_atrasadas: {
    id: 'demandas_atrasadas',
    title: 'Minhas demandas',
    shortLabel: 'Minhas demandas',
    description: 'Demandas atrasadas e cronograma de próximas entregas com foco em prioridades e SLA',
    iconName: 'kanban',
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

const STORAGE_ORDER_KEY = 'ideias_digitais_inicio_sections_order_v4';
const STORAGE_HIDDEN_KEY = 'ideias_digitais_inicio_sections_hidden_v4';

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

interface DemandTimelineInfo {
  demand: DemandItem;
  status: 'atrasada' | 'hoje' | 'proxima';
  daysDiff: number; // < 0: atrasada (dias decorridos), 0: hoje, > 0: proxima (dias restantes)
  daysLate: number;
  daysRemaining: number;
  dueDateFormatted: string;
}

const getDemandTimelineInfo = (demand: DemandItem): DemandTimelineInfo | null => {
  if (!demand.dueDate || demand.columnId === 'concluidas') {
    return null;
  }

  const raw = demand.dueDate.trim();
  if (!raw || raw.toLowerCase() === 'sem prazo' || raw.toLowerCase() === 'a definir' || raw.toLowerCase() === 'pendente') {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let targetDate: Date | null = null;
  const rawLower = raw.toLowerCase();

  // Pattern 1: YYYY-MM-DD
  const ymdMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    targetDate = new Date(y, m, d);
  } else {
    // Pattern 2: DD/MM/YYYY or DD/MM
    const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10) - 1;
      const y = dmyMatch[3] ? parseInt(dmyMatch[3], 10) : today.getFullYear();
      targetDate = new Date(y, m, d);
    } else if (rawLower === 'ontem') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      targetDate = d;
    } else if (rawLower === 'hoje') {
      targetDate = new Date(today);
    } else if (rawLower === 'amanhã' || rawLower === 'amanha') {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      targetDate = d;
    } else if (rawLower.includes('próxima semana') || rawLower.includes('proxima semana')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 7);
      targetDate = d;
    } else if (rawLower.includes('esta semana')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 3);
      targetDate = d;
    } else {
      const parsed = Date.parse(raw);
      if (!isNaN(parsed)) {
        const pd = new Date(parsed);
        targetDate = new Date(pd.getFullYear(), pd.getMonth(), pd.getDate());
      }
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    return null;
  }

  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const dayStr = String(targetDate.getDate()).padStart(2, '0');
  const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
  const yearStr = targetDate.getFullYear();
  const dueDateFormatted = `${dayStr}/${monthStr}/${yearStr}`;

  if (diffDays < 0) {
    return {
      demand,
      status: 'atrasada',
      daysDiff: diffDays,
      daysLate: Math.abs(diffDays),
      daysRemaining: 0,
      dueDateFormatted,
    };
  } else if (diffDays === 0) {
    return {
      demand,
      status: 'hoje',
      daysDiff: 0,
      daysLate: 0,
      daysRemaining: 0,
      dueDateFormatted,
    };
  } else {
    return {
      demand,
      status: 'proxima',
      daysDiff: diffDays,
      daysLate: 0,
      daysRemaining: diffDays,
      dueDateFormatted,
    };
  }
};

const getColumnDisplayLabel = (colId: string): string => {
  switch (colId) {
    case 'ideias': return 'Ideias / Briefing';
    case 'producao': return 'Em Produção';
    case 'aprovacao': return 'Aguardando Aprovação';
    case 'agendamento': return 'Agendamento';
    case 'concluidas': return 'Concluída';
    default: return colId;
  }
};

const getDemandPriorityBadge = (priority: string) => {
  const p = (priority || '').toLowerCase();
  if (p === 'urgente') {
    return { 
      label: 'Urgente', 
      bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80', 
      dot: 'bg-rose-500' 
    };
  }
  if (p === 'alta') {
    return { 
      label: 'Alta', 
      bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80', 
      dot: 'bg-amber-500' 
    };
  }
  if (p === 'media' || p === 'média') {
    return { 
      label: 'Média', 
      bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80', 
      dot: 'bg-blue-500' 
    };
  }
  return { 
    label: 'Baixa', 
    bg: 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80', 
    dot: 'bg-slate-400' 
  };
};

interface InicioViewProps {
  onNavigate: (page: PageId) => void;
  demands: DemandItem[];
  clients: Client[];
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
  
  // Lista unificada de todas as demandas com prazo (atrasadas, hoje e próximas)
  const timelineDemandsList = useMemo(() => {
    const list: DemandTimelineInfo[] = [];
    for (const d of demands) {
      const info = getDemandTimelineInfo(d);
      if (info) {
        list.push(info);
      }
    }
    // Ordenação padrão inteligente por criticidade:
    // 1. Atrasadas (da mais atrasada para a menos atrasada)
    // 2. Vencendo hoje
    // 3. Próximas (da mais iminente para a mais distante)
    return list.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [demands]);

  const overdueDemandsList = useMemo(() => {
    return timelineDemandsList.filter((item) => item.status === 'atrasada');
  }, [timelineDemandsList]);

  const todayDemandsList = useMemo(() => {
    return timelineDemandsList.filter((item) => item.status === 'hoje');
  }, [timelineDemandsList]);

  const upcomingDemandsList = useMemo(() => {
    return timelineDemandsList.filter((item) => item.status === 'proxima');
  }, [timelineDemandsList]);

  // Estados para filtro e ordenação da seção de prazos e entregas
  const [timelineFilter, setTimelineFilter] = useState<'todas' | 'atrasadas' | 'hoje' | 'proximas' | 'criticas'>('todas');
  const [timelineSort, setTimelineSort] = useState<'prazo' | 'prioridade'>('prazo');
  const [timelineStageFilter, setTimelineStageFilter] = useState<string | null>(null);

  const timelineMetrics = useMemo(() => {
    const total = timelineDemandsList.length;
    const overdueCount = overdueDemandsList.length;
    const todayCount = todayDemandsList.length;
    const upcomingCount = upcomingDemandsList.length;
    const criticalOverdue = overdueDemandsList.filter((o) => o.daysLate >= 3).length;
    const maxOverdueDays = overdueCount > 0 ? Math.max(...overdueDemandsList.map((o) => o.daysLate)) : 0;
    const avgOverdueDays = overdueCount > 0 
      ? Math.round(overdueDemandsList.reduce((acc, o) => acc + o.daysLate, 0) / overdueCount) 
      : 0;
    
    const nextUpcoming = upcomingDemandsList.length > 0 ? upcomingDemandsList[0] : null;

    const urgentCount = timelineDemandsList.filter((o) => {
      const p = (o.demand.priority || '').toLowerCase();
      return p === 'urgente' || p === 'alta';
    }).length;

    const inProduction = timelineDemandsList.filter((o) => o.demand.columnId === 'producao').length;
    const inApproval = timelineDemandsList.filter((o) => o.demand.columnId === 'aprovacao').length;

    return {
      total,
      overdueCount,
      todayCount,
      upcomingCount,
      criticalOverdue,
      maxOverdueDays,
      avgOverdueDays,
      nextUpcoming,
      urgentCount,
      inProduction,
      inApproval,
    };
  }, [timelineDemandsList, overdueDemandsList, todayDemandsList, upcomingDemandsList]);

  const filteredAndSortedTimelineList = useMemo(() => {
    let result = [...timelineDemandsList];

    if (timelineFilter === 'atrasadas') {
      result = result.filter((item) => item.status === 'atrasada');
    } else if (timelineFilter === 'hoje') {
      result = result.filter((item) => item.status === 'hoje');
    } else if (timelineFilter === 'proximas') {
      result = result.filter((item) => item.status === 'proxima');
    } else if (timelineFilter === 'criticas') {
      result = result.filter((item) => {
        const isLate = item.status === 'atrasada';
        const p = (item.demand.priority || '').toLowerCase();
        return isLate || p === 'urgente' || p === 'alta';
      });
    }

    if (timelineSort === 'prioridade') {
      const priorityWeights: Record<string, number> = {
        urgente: 4,
        alta: 3,
        media: 2,
        média: 2,
        baixa: 1,
      };
      result.sort((a, b) => {
        const weightA = priorityWeights[(a.demand.priority || '').toLowerCase()] || 0;
        const weightB = priorityWeights[(b.demand.priority || '').toLowerCase()] || 0;
        if (weightB !== weightA) return weightB - weightA;
        return a.daysDiff - b.daysDiff;
      });
    } else {
      // Ordenação cronológica por prazo: atrasadas (mais graves primeiro), hoje, depois próximas (mais cedo primeiro)
      result.sort((a, b) => a.daysDiff - b.daysDiff);
    }

    if (timelineStageFilter) {
      result = result.filter((item) => item.demand.columnId === timelineStageFilter);
    }

    return result;
  }, [timelineDemandsList, timelineFilter, timelineSort, timelineStageFilter]);
  
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

      case 'demandas_stories':
        return (
          <DemandsStoriesSection
            clients={clients}
            demands={demands}
            onSelectDemand={onSelectDemand}
            onOpenNewDemandModal={onOpenNewDemandModal}
          />
        );

      case 'demandas_atrasadas': {
        if (demands.length === 0) {
          if (isReorderMode) {
            return (
              <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 sm:p-6 border border-dashed border-emerald-300 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-[#142142] dark:text-white">
                        Minhas demandas
                      </h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Nenhum prazo pendente
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Todas as demandas estão em dia ou sem prazos estipulados. Novas demandas com data de entrega aparecerão aqui automaticamente.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic shrink-0">
                  Posição reservada no painel
                </div>
              </div>
            );
          }
          return null;
        }

        return (
          <section aria-label="Seção de Prazos e Próximas Demandas" className="space-y-3">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-all space-y-5">
              {/* Header da Seção */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    timelineMetrics.overdueCount > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/50 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Kanban size={20} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        Minhas demandas
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRÁFICO VISUAL DE ANDAMENTO DAS DEMANDAS */}
              <DemandsProgressChart
                demands={demands}
                onNavigate={onNavigate}
                onFilterStage={setTimelineStageFilter}
                selectedStage={timelineStageFilter}
              />

              {/* Filtros de Triagem (Pills Clean) */}
              <div className="flex items-center justify-between gap-3 pt-1 pb-3 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineFilter('todas');
                      setTimelineStageFilter(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      timelineFilter === 'todas' && !timelineStageFilter
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Todas ({timelineMetrics.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimelineFilter('atrasadas')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      timelineFilter === 'atrasadas'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Atrasadas ({timelineMetrics.overdueCount})
                  </button>

                  {timelineMetrics.todayCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('hoje')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        timelineFilter === 'hoje'
                          ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Vencem Hoje ({timelineMetrics.todayCount})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTimelineFilter('proximas')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      timelineFilter === 'proximas'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Próximas ({timelineMetrics.upcomingCount})
                  </button>

                  {timelineStageFilter && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-300 dark:border-amber-800/80">
                      <span>Etapa: {getColumnDisplayLabel(timelineStageFilter)}</span>
                      <button
                        type="button"
                        onClick={() => setTimelineStageFilter(null)}
                        className="hover:text-amber-700 dark:hover:text-white cursor-pointer ml-1 font-black"
                        title="Limpar filtro de etapa"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {filteredAndSortedTimelineList.length} de {timelineMetrics.total}
                </div>
              </div>

              {/* Grid de Cards de Demandas (Atrasadas + Próximas) */}
              {filteredAndSortedTimelineList.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 my-3">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nenhuma demanda encontrada para este filtro selecionado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTimelineFilter('todas')}
                    className="mt-2 text-xs font-bold text-[#fab518] hover:underline cursor-pointer"
                  >
                    Mostrar todas as demandas monitoradas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pt-1">
                  {filteredAndSortedTimelineList.map(({ demand: d, status, daysLate, daysRemaining, dueDateFormatted }) => {
                    const priorityMeta = getDemandPriorityBadge(d.priority);
                    const isCritical = status === 'atrasada' && daysLate >= 3;

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (onSelectDemand) onSelectDemand(d.id);
                          onNavigate('demandas');
                        }}
                        className="group bg-white dark:bg-slate-900/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 rounded-2xl p-4.5 border border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 relative"
                      >
                        <div>
                          {/* Header do Card: Status do Prazo + Prioridade + Coluna */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            {status === 'atrasada' ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                                  isCritical
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60'
                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60'
                                }`}
                              >
                                <Clock
                                  size={11}
                                  className={isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}
                                />
                                {daysLate === 1 ? '1 dia de atraso' : `${daysLate} dias de atraso`}
                              </span>
                            ) : status === 'hoje' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60">
                                <Flame size={11} className="text-amber-600 dark:text-amber-400" />
                                Vence hoje
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                                daysRemaining === 1
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                              }`}>
                                <Calendar
                                  size={11}
                                  className={daysRemaining === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}
                                />
                                {daysRemaining === 1 ? 'Vence amanhã' : `Vence em ${daysRemaining} dias`}
                              </span>
                            )}

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityMeta.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                                {priorityMeta.label}
                              </span>
                            </div>
                          </div>

                          {/* Título da Demanda */}
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#142142] dark:group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                            {d.title}
                          </h4>

                          {/* Cliente */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                              {d.client}
                            </span>
                          </div>

                          {/* Prazo */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium mt-2.5">
                            {status === 'atrasada' ? (
                              <>
                                <CalendarX2 size={12} className="shrink-0 text-rose-500" />
                                <span className="text-rose-600 dark:text-rose-400">Prazo acordado: {dueDateFormatted}</span>
                              </>
                            ) : status === 'hoje' ? (
                              <>
                                <Flame size={12} className="shrink-0 text-amber-500" />
                                <span className="text-amber-700 dark:text-amber-300">Entrega hoje: {dueDateFormatted}</span>
                              </>
                            ) : (
                              <>
                                <Calendar size={12} className="shrink-0 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">Prazo de entrega: {dueDateFormatted}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Linha inferior: Responsável + Link */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                          {(() => {
                            const assigneeInfo = getAssigneeInfo(d.assignee);
                            return (
                              <div className="flex items-center gap-2 min-w-0">
                                {assigneeInfo.avatar ? (
                                  <img
                                    src={assigneeInfo.avatar}
                                    alt={assigneeInfo.name}
                                    className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
                                    {(assigneeInfo.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                                  {assigneeInfo.name}
                                </span>
                              </div>
                            );
                          })()}

                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#142142] dark:group-hover:text-blue-400 transition-colors">
                            <span>Ver demanda</span>
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rodapé Informativo */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  {timelineMetrics.overdueCount > 0 ? (
                    <>
                      <AlertCircle size={13} className="text-rose-500 shrink-0" />
                      <span>
                        Atenção prioritária: <strong>{overdueDemandsList[0].daysLate} dias em atraso</strong> ({overdueDemandsList[0].demand.title})
                      </span>
                    </>
                  ) : timelineMetrics.nextUpcoming ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>
                        Cronograma em dia! Próxima entrega: <strong>{timelineMetrics.nextUpcoming.dueDateFormatted}</strong> ({timelineMetrics.nextUpcoming.demand.title})
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>Todas as entregas monitoradas estão dentro do prazo previsto.</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('demandas')}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
                >
                  <span>Reorganizar prazos no Kanban</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </section>
        );
      }

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            // Se for a seção de prazos e demandas e não houver nenhuma demanda monitorada, não renderiza nada no modo normal
            if (sectionId === 'demandas_atrasadas' && demands.length === 0 && !isReorderMode) {
              return null;
            }

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
