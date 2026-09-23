import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  Paperclip, 
  MessageSquare, 
  CheckSquare, 
  MoreVertical, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  LayoutGrid, 
  List, 
  Calendar, 
  GanttChartSquare, 
  Sparkles, 
  ArrowRight,
  X,
  Building2,
  Layers,
  Globe,
  Target,
  Smartphone,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  MessageCircle,
  XCircle,
  Edit3,
  ExternalLink,
  BellRing,
  Copy,
  Check,
  Trash2,
  Edit,
  Columns,
  AlertTriangle
} from 'lucide-react';
import { DemandItem, KanbanColumnId, Priority, Client, KanbanColumn, TeamMember } from '../types';
import { kanbanColumnsData } from '../data/mockData';
import { DemandDetailModal } from '../components/DemandDetailModal';
import { ApprovalNotificationConfigModal } from '../components/ApprovalNotificationConfigModal';
import { AddColumnModal, COLUMN_COLOR_PRESETS } from '../components/AddColumnModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface DemandasViewProps {
  demands: DemandItem[];
  clients?: Client[];
  teamMembers?: TeamMember[];
  columns?: KanbanColumn[];
  onAddColumn?: (column: KanbanColumn, insertBeforeConcluded?: boolean) => void;
  onUpdateColumn?: (column: KanbanColumn) => void;
  onDeleteColumn?: (columnId: string) => void;
  initialClientFilter?: string;
  onUpdateDemandColumn: (id: string, newColumn: KanbanColumnId) => void;
  onMoveDemand?: (
    demandId: string,
    targetColumn: KanbanColumnId,
    targetDemandId?: string,
    position?: 'before' | 'after'
  ) => void;
  onOpenNewDemandModal: () => void;
  onSaveDemand?: (demand: DemandItem) => void;
  onDeleteDemand?: (demandId: string) => void;
  onOpenWhatsAppNotification?: (demand: DemandItem) => void;
  onOpenClientApprovalPortal?: (demand: DemandItem) => void;
  initialSelectedDemandId?: string | null;
  onClearInitialSelectedDemand?: () => void;
}

export const DemandasView: React.FC<DemandasViewProps> = ({
  demands,
  clients = [],
  teamMembers = [],
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  initialClientFilter = 'todos',
  onUpdateDemandColumn,
  onMoveDemand,
  onOpenNewDemandModal,
  onSaveDemand,
  onDeleteDemand,
  onOpenWhatsAppNotification,
  onOpenClientApprovalPortal,
  initialSelectedDemandId,
  onClearInitialSelectedDemand,
}) => {
  // Date formatting helpers
  const formatDemandDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = months[monthIndex] || month;
      return `${parseInt(day, 10)} ${monthName}`;
    }
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${day} ${months[d.getMonth()]}`;
      }
    }
    return dateStr;
  };

  const formatDemandDateFull = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Retorna a URL da imagem anexada para exibir como miniatura única no card da demanda
  const getDemandImageThumbnail = (demand: DemandItem): string | undefined => {
    if (demand.thumbnail && demand.thumbnail.trim()) {
      return demand.thumbnail;
    }
    if (demand.attachments && demand.attachments.length > 0) {
      const firstImage = demand.attachments.find((att) => {
        if (att.type === 'image') return true;
        if (typeof att.url === 'string' && (att.url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.url))) return true;
        if (typeof att.name === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.name)) return true;
        return false;
      });
      if (firstImage) {
        return firstImage.thumbnailUrl || firstImage.url;
      }
    }
    return undefined;
  };

  const [activeTab, setActiveTab] = useState<'quadro' | 'lista' | 'calendario' | 'gantt'>('quadro');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(initialClientFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  // Fallback local columns if not supplied from parent
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>(() => {
    try {
      const saved = localStorage.getItem('agency_kanban_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: KanbanColumn) => ({ ...c, count: 0 }));
        }
      }
    } catch {}
    return kanbanColumnsData;
  });

  const activeColumns = columns || localColumns;

  // Add/Edit column states
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState<KanbanColumn | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<KanbanColumn | null>(null);
  const [columnMenuOpenId, setColumnMenuOpenId] = useState<string | null>(null);

  // Quick inline creation state inside the Kanban board
  const [isInlineAdding, setIsInlineAdding] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineColorIndex, setInlineColorIndex] = useState(0);

  // Horizontal scroll handling and drag-to-scroll for Kanban board
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingBoardRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < maxScroll - 10);
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState, activeColumns]);

  const handleBoardScroll = () => {
    updateScrollState();
  };

  const scrollBoardBy = (amount: number) => {
    if (boardContainerRef.current) {
      boardContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const scrollToColumn = (columnId: string) => {
    const colElement = document.getElementById(`kanban-column-${columnId}`);
    if (colElement && boardContainerRef.current) {
      colElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleBoardWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isInsideScrollableColumn = target.closest('.kanban-column-scrollbar');
    if (!isInsideScrollableColumn && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (boardContainerRef.current) {
        boardContainerRef.current.scrollLeft += e.deltaY;
        updateScrollState();
      }
    }
  };

  const handleBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[id^="demand-card-"]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('.column-menu-container')
    ) {
      return;
    }
    isDraggingBoardRef.current = true;
    dragStartXRef.current = e.pageX - (boardContainerRef.current?.offsetLeft || 0);
    dragScrollLeftRef.current = boardContainerRef.current?.scrollLeft || 0;
  };

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingBoardRef.current || !boardContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (boardContainerRef.current.offsetLeft || 0);
    const walk = (x - dragStartXRef.current) * 1.5;
    boardContainerRef.current.scrollLeft = dragScrollLeftRef.current - walk;
    updateScrollState();
  };

  const handleBoardMouseUp = () => {
    isDraggingBoardRef.current = false;
  };

  // Handle outside click for column context menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuOpenId) {
        const target = e.target as HTMLElement;
        if (!target.closest('.column-menu-container')) {
          setColumnMenuOpenId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnMenuOpenId]);

  const handleSaveColumn = (newCol: KanbanColumn, insertBeforeConcluded = false) => {
    if (columnToEdit) {
      if (onUpdateColumn) {
        onUpdateColumn(newCol);
      } else {
        setLocalColumns((prev) => {
          const updated = prev.map((c) => (c.id === newCol.id ? newCol : c));
          try { localStorage.setItem('agency_kanban_columns', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    } else {
      if (onAddColumn) {
        onAddColumn(newCol, insertBeforeConcluded);
      } else {
        setLocalColumns((prev) => {
          let updated: KanbanColumn[];
          if (insertBeforeConcluded) {
            const concludedIdx = prev.findIndex((c) => c.id === 'concluidas');
            if (concludedIdx !== -1) {
              const copy = [...prev];
              copy.splice(concludedIdx, 0, newCol);
              updated = copy;
            } else {
              updated = [...prev, newCol];
            }
          } else {
            updated = [...prev, newCol];
          }
          try { localStorage.setItem('agency_kanban_columns', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    }
  };

  const handleDeleteColumn = (colId: string) => {
    if (onDeleteColumn) {
      onDeleteColumn(colId);
    }
    setLocalColumns((prev) => {
      const updated = prev.filter((c) => c.id !== colId);
      try { localStorage.setItem('agency_kanban_columns', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setColumnMenuOpenId(null);
  };

  const handleQuickInlineAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    const preset = COLUMN_COLOR_PRESETS[inlineColorIndex] || COLUMN_COLOR_PRESETS[0];
    const newCol: KanbanColumn = {
      id: `col-${inlineTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      title: inlineTitle.trim(),
      count: 0,
      color: preset.color,
      buttonBg: preset.buttonBg,
      isCustom: true,
    };
    handleSaveColumn(newCol, true);
    setInlineTitle('');
    setIsInlineAdding(false);
  };

  // Modal for editing/viewing selected demand
  const [editingDemand, setEditingDemand] = useState<DemandItem | null>(null);

  // Automatically open demand if initialSelectedDemandId was passed
  useEffect(() => {
    if (initialSelectedDemandId) {
      const found = demands.find((d) => d.id === initialSelectedDemandId);
      if (found) {
        setEditingDemand(found);
      }
      if (onClearInitialSelectedDemand) {
        onClearInitialSelectedDemand();
      }
    }
  }, [initialSelectedDemandId, demands, onClearInitialSelectedDemand]);

  // Approval notification configuration modal
  const [isNotificationConfigOpen, setIsNotificationConfigOpen] = useState(false);

  // Drag and Drop state (cross-column and vertical reordering)
  const [draggedDemandId, setDraggedDemandId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<KanbanColumnId | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    demandId: string;
    columnId: KanbanColumnId;
    position: 'before' | 'after';
  } | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, demandId: string) => {
    e.dataTransfer.setData('text/plain', demandId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDemandId(demandId);
  };

  const handleDragEnd = () => {
    setDraggedDemandId(null);
    setDragOverColumnId(null);
    setDropTarget(null);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => {
    // Only reset if we're truly leaving the column container
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      if (dragOverColumnId === columnId) {
        setDragOverColumnId(null);
      }
    }
  };

  const handleCardDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetDemand: DemandItem,
    columnId: KanbanColumnId
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedDemandId || draggedDemandId === targetDemand.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position: 'before' | 'after' = offsetY < rect.height / 2 ? 'before' : 'after';

    setDropTarget({
      demandId: targetDemand.id,
      columnId,
      position,
    });
    setDragOverColumnId(columnId);
  };

  const handleCardDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetDemand: DemandItem,
    columnId: KanbanColumnId
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain') || draggedDemandId;
    if (!sourceId || sourceId === targetDemand.id) {
      setDraggedDemandId(null);
      setDragOverColumnId(null);
      setDropTarget(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position: 'before' | 'after' = offsetY < rect.height / 2 ? 'before' : 'after';

    if (onMoveDemand) {
      onMoveDemand(sourceId, columnId, targetDemand.id, position);
    } else {
      onUpdateDemandColumn(sourceId, columnId);
    }

    setDraggedDemandId(null);
    setDragOverColumnId(null);
    setDropTarget(null);
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => {
    e.preventDefault();
    const droppedDemandId = e.dataTransfer.getData('text/plain') || draggedDemandId;
    if (droppedDemandId) {
      if (dropTarget && dropTarget.columnId === columnId) {
        if (onMoveDemand) {
          onMoveDemand(droppedDemandId, columnId, dropTarget.demandId, dropTarget.position);
        } else {
          onUpdateDemandColumn(droppedDemandId, columnId);
        }
      } else {
        if (onMoveDemand) {
          onMoveDemand(droppedDemandId, columnId);
        } else {
          onUpdateDemandColumn(droppedDemandId, columnId);
        }
      }
    }
    setDraggedDemandId(null);
    setDragOverColumnId(null);
    setDropTarget(null);
  };

  // Sync initial client filter if prop changes
  useEffect(() => {
    if (initialClientFilter) {
      setSelectedClientFilter(initialClientFilter);
    }
  }, [initialClientFilter]);

  // Helper to match demand type / category
  const matchesDemandType = (item: DemandItem, filter: string): boolean => {
    if (filter === 'todos') return true;
    const cat = (item.serviceCategory || '').toLowerCase();
    const typ = (item.type || '').trim().toLowerCase();
    const filt = filter.trim().toLowerCase();

    if (filt === 'post' || filt === 'redes-sociais') {
      return (
        typ === 'post' ||
        cat.includes('social') ||
        typ.includes('post') ||
        typ.includes('carrossel') ||
        typ.includes('vídeo') ||
        typ.includes('video') ||
        typ.includes('reels') ||
        typ.includes('feed')
      );
    }

    if (filt === 'meta ads' || filt === 'trafego-pago') {
      return (
        typ === 'meta ads' ||
        cat.includes('tráfego') ||
        cat.includes('trafego') ||
        typ.includes('meta') ||
        typ.includes('tráfego') ||
        typ.includes('trafego') ||
        typ.includes('ads') ||
        typ.includes('pixel') ||
        typ.includes('campanha')
      );
    }

    if (filt === 'des. de site' || filt === 'site') {
      return (
        typ === 'des. de site' ||
        cat.includes('site') ||
        typ.includes('site') ||
        typ.includes('landing') ||
        typ.includes('web')
      );
    }

    if (filt === 'logotipo') {
      return (
        typ === 'logotipo' ||
        typ.includes('logo') ||
        typ.includes('identidade') ||
        typ.includes('branding') ||
        cat.includes('design')
      );
    }

    if (filt === 'outros') {
      return typ === 'outros' || (!['post', 'meta ads', 'des. de site', 'logotipo'].includes(typ));
    }

    return typ === filt;
  };

  // Distinct clients list sorted alphabetically (A-Z)
  const allClientNames = useMemo(() => {
    return Array.from(
      new Set([
        ...(clients ? clients.map((c) => c.name) : []),
        ...demands.map((d) => d.client),
      ])
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base', numeric: true }));
  }, [clients, demands]);

  // Demand counts for type filters
  const countByType = {
    todos: demands.length,
    Post: demands.filter((d) => matchesDemandType(d, 'Post')).length,
    'Meta Ads': demands.filter((d) => matchesDemandType(d, 'Meta Ads')).length,
    'Des. de Site': demands.filter((d) => matchesDemandType(d, 'Des. de Site')).length,
    Logotipo: demands.filter((d) => matchesDemandType(d, 'Logotipo')).length,
    Outros: demands.filter((d) => matchesDemandType(d, 'Outros')).length,
  };

  // Demand counts per client
  const countByClient: Record<string, number> = {};
  demands.forEach((d) => {
    countByClient[d.client] = (countByClient[d.client] || 0) + 1;
  });

  // Filtering
  const filteredDemands = demands.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.clientProject && item.clientProject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.assignee && item.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClient = 
      selectedClientFilter === 'todos' || 
      item.client.toLowerCase() === selectedClientFilter.toLowerCase() ||
      (item.clientProject && item.clientProject.toLowerCase() === selectedClientFilter.toLowerCase());

    const matchesPriority = 
      priorityFilter === 'todas' || item.priority === priorityFilter;

    const matchesType = matchesDemandType(item, typeFilter);

    return matchesSearch && matchesClient && matchesPriority && matchesType;
  });

  const hasActiveFilters = 
    selectedClientFilter !== 'todos' || 
    typeFilter !== 'todos' || 
    priorityFilter !== 'todas' || 
    searchQuery.trim() !== '';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClientFilter('todos');
    setPriorityFilter('todas');
    setTypeFilter('todos');
  };

  const getPriorityColorBars = (priority?: Priority | string, count?: number) => {
    const p = (priority || '').toLowerCase();

    // Sincronizar quantidade de barras ativas diretamente com o campo de prioridade
    let activeBars = 2;
    if (p === 'urgente' || p === 'alta') {
      activeBars = 3;
    } else if (p === 'media' || p === 'média') {
      activeBars = 2;
    } else if (p === 'baixa') {
      activeBars = 1;
    } else if (typeof count === 'number' && count >= 1 && count <= 3) {
      activeBars = count;
    }

    // Configuração de cores e rótulos sincronizados
    let bar1Color = 'bg-amber-400';
    let bar2Color = 'bg-amber-500';
    let bar3Color = 'bg-red-500';
    let label = 'Média';

    if (p === 'urgente') {
      bar1Color = 'bg-rose-500';
      bar2Color = 'bg-rose-500';
      bar3Color = 'bg-rose-600 animate-pulse';
      label = 'Urgente';
    } else if (p === 'alta') {
      bar1Color = 'bg-amber-400';
      bar2Color = 'bg-orange-500';
      bar3Color = 'bg-red-500';
      label = 'Alta';
    } else if (p === 'baixa') {
      bar1Color = 'bg-sky-500';
      bar2Color = 'bg-sky-500';
      bar3Color = 'bg-sky-500';
      label = 'Baixa';
    }

    const inactiveClass = 'bg-slate-200 dark:bg-slate-700/60';

    return (
      <div 
        className="flex items-center gap-1"
        title={`Prioridade: ${label} (${activeBars} de 3 barras)`}
        aria-label={`Prioridade: ${label}`}
      >
        <span className={`h-1.5 w-5 rounded-full transition-all duration-200 ${activeBars >= 1 ? bar1Color : inactiveClass}`} />
        <span className={`h-1.5 w-5 rounded-full transition-all duration-200 ${activeBars >= 2 ? bar2Color : inactiveClass}`} />
        <span className={`h-1.5 w-5 rounded-full transition-all duration-200 ${activeBars >= 3 ? bar3Color : inactiveClass}`} />
      </div>
    );
  };

  const getPriorityBadgeStyle = (priority?: Priority | string) => {
    const p = (priority || 'media').toLowerCase();
    switch (p) {
      case 'urgente':
        return {
          label: 'Urgente',
          classes: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/70',
        };
      case 'alta':
        return {
          label: 'Alta',
          classes: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/70 dark:border-orange-800/70',
        };
      case 'baixa':
        return {
          label: 'Baixa',
          classes: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/70',
        };
      case 'media':
      case 'média':
      default:
        return {
          label: 'Média',
          classes: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/70',
        };
    }
  };

  const getTypeFilterLabel = (key: string) => {
    switch (key) {
      case 'Post':
      case 'redes-sociais':
        return 'Post';
      case 'Meta Ads':
      case 'trafego-pago':
        return 'Meta Ads';
      case 'Des. de Site':
      case 'site':
        return 'Des. de Site';
      case 'Logotipo':
        return 'Logotipo';
      case 'Outros':
        return 'Outros';
      default:
        return key;
    }
  };

  // Resolve dinamicamente os dados do responsável atualizados a partir de teamMembers
  const getAssigneeDisplay = (assignee?: { name?: string; avatar?: string }) => {
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

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* Top Filter and Controls Bar */}
      <div 
        id="demandas-filter-bar"
        className="bg-white dark:bg-[#0f172a] p-4 sm:p-4.5 rounded-[22px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3"
      >
        {/* Tier 1: Search & Primary Action Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              id="filter-search-input"
              placeholder="Buscar por demanda, projeto, cliente, responsável ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FA] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm font-medium text-[#142142] dark:text-white pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 rounded-md"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* View Modes Switcher + New Demand CTA Button */}
          <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* View switcher tabs: Quadro, Lista, Calendário, Gantt */}
            <div className="flex items-center gap-1 bg-[#F2F2F2] dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                id="tab-view-quadro"
                onClick={() => setActiveTab('quadro')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                  ${
                    activeTab === 'quadro'
                      ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-600'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white'
                  }
                `}
                title="Visualização em Quadro Kanban"
              >
                <LayoutGrid size={14} className={activeTab === 'quadro' ? 'text-[#fab518]' : 'text-slate-400'} />
                <span>Quadro</span>
              </button>

              <button
                type="button"
                id="tab-view-lista"
                onClick={() => setActiveTab('lista')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                  ${
                    activeTab === 'lista'
                      ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-600'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white'
                  }
                `}
                title="Visualização em Tabela/Lista"
              >
                <List size={14} className={activeTab === 'lista' ? 'text-[#fab518]' : 'text-slate-400'} />
                <span>Lista</span>
              </button>

              <button
                type="button"
                id="tab-view-calendario"
                onClick={() => setActiveTab('calendario')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                  ${
                    activeTab === 'calendario'
                      ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-600'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white'
                  }
                `}
                title="Calendário Editorial"
              >
                <Calendar size={14} className={activeTab === 'calendario' ? 'text-[#fab518]' : 'text-slate-400'} />
                <span className="hidden sm:inline">Calendário</span>
              </button>

              <button
                type="button"
                id="tab-view-gantt"
                onClick={() => setActiveTab('gantt')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                  ${
                    activeTab === 'gantt'
                      ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-600'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white'
                  }
                `}
                title="Cronograma Gantt"
              >
                <GanttChartSquare size={14} className={activeTab === 'gantt' ? 'text-[#fab518]' : 'text-slate-400'} />
                <span>Gantt</span>
              </button>
            </div>

            {/* Quick Column Navigation buttons in Quadro mode */}
            {activeTab === 'quadro' && (
              <div 
                id="kanban-toolbar-scroll-controls"
                className="flex items-center gap-1 bg-[#F2F2F2] dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0"
              >
                <button
                  type="button"
                  id="btn-scroll-columns-left"
                  onClick={() => scrollBoardBy(-340)}
                  disabled={!canScrollLeft}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                  title="Rolar para a coluna anterior (esquerda)"
                  aria-label="Rolar para coluna anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1 select-none whitespace-nowrap">
                  Colunas ({activeColumns.length})
                </span>
                <button
                  type="button"
                  id="btn-scroll-columns-right"
                  onClick={() => scrollBoardBy(340)}
                  disabled={!canScrollRight}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                  title="Rolar para a próxima coluna (direita)"
                  aria-label="Rolar para próxima coluna"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: Granular Select Filters (Cliente, Categoria, Prioridade) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          {/* Client filter dropdown */}
          <div className="relative">
            <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
            <select
              id="filter-client-select"
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="w-full appearance-none bg-[#F8F9FA] dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-700/80 text-xs font-semibold text-[#142142] dark:text-white pl-9 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all cursor-pointer"
            >
              <option value="todos">Todos os Clientes ({demands.length})</option>
              {allClientNames.map((clientName) => {
                const count = countByClient[clientName] || 0;
                return (
                  <option key={clientName} value={clientName}>
                    {clientName} ({count})
                  </option>
                );
              })}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400" />
          </div>

          {/* Type filter dropdown */}
          <div className="relative">
            <Layers size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
            <select
              id="filter-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full appearance-none bg-[#F8F9FA] dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-700/80 text-xs font-semibold text-[#142142] dark:text-white pl-9 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all cursor-pointer"
            >
              <option value="todos">Todo tipo de peça ({countByType.todos})</option>
              <option value="Post">Post ({countByType.Post})</option>
              <option value="Meta Ads">Meta Ads ({countByType['Meta Ads']})</option>
              <option value="Des. de Site">Des. de Site ({countByType['Des. de Site']})</option>
              <option value="Logotipo">Logotipo ({countByType.Logotipo})</option>
              <option value="Outros">Outros ({countByType.Outros})</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400" />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <AlertCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
            <select
              id="filter-priority-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full appearance-none bg-[#F8F9FA] dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-700/80 text-xs font-semibold text-[#142142] dark:text-white pl-9 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all cursor-pointer"
            >
              <option value="todas">Todas as prioridades</option>
              <option value="baixa">Baixa prioridade</option>
              <option value="media">Média prioridade</option>
              <option value="alta">Alta prioridade</option>
              <option value="urgente">Urgente</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400" />
          </div>

          {/* Demand Counter / Reset Actions Container */}
          <div className="flex items-center justify-between gap-2 bg-[#F8F9FA] dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Demandas: <strong className="text-[#142142] dark:text-white font-extrabold">{filteredDemands.length}</strong> de {demands.length}
            </span>

            {hasActiveFilters ? (
              <button
                type="button"
                id="btn-clear-filters"
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Limpar todos os filtros"
              >
                <RotateCcw size={12} />
                <span>Limpar</span>
              </button>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                Tudo visível
              </span>
            )}
          </div>
        </div>

        {/* Active Filter Chips bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Filtros ativos:</span>
            </span>

            {typeFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#142142] dark:text-white text-xs font-bold shadow-2xs">
                <span>Tipo: {getTypeFilterLabel(typeFilter)}</span>
                <button
                  type="button"
                  onClick={() => setTypeFilter('todos')}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded cursor-pointer"
                  title="Remover filtro de tipo"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedClientFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#142142] dark:text-white text-xs font-bold shadow-2xs">
                <span>Cliente: {selectedClientFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedClientFilter('todos')}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded cursor-pointer"
                  title="Remover filtro de cliente"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {priorityFilter !== 'todas' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#142142] dark:text-white text-xs font-bold shadow-2xs">
                <span>Prioridade: {priorityFilter}</span>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('todas')}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded cursor-pointer"
                  title="Remover filtro de prioridade"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#142142] dark:text-white text-xs font-bold shadow-2xs">
                <span>Busca: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded cursor-pointer"
                  title="Remover busca"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer ml-auto flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Redefinir filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State when no demands in system */}
      {demands.length === 0 && (
        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#fab518] flex items-center justify-center mx-auto shadow-xs">
            <Sparkles size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#142142] dark:text-white">Quadro Pronto para Novos Projetos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma demanda cadastrada no sistema. Comece cadastrando sua primeira demanda para movimentar o fluxo no Kanban!
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewDemandModal}
            className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Criar Primeira Demanda</span>
          </button>
        </div>
      )}

      {/* Zero Results Banner when filtered */}
      {demands.length > 0 && filteredDemands.length === 0 && (
        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Filter size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#142142] dark:text-white">Nenhuma demanda encontrada</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Não encontramos nenhuma demanda para os filtros aplicados (Tipo: {getTypeFilterLabel(typeFilter)}, Cliente: {selectedClientFilter}).
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-[#142142] dark:bg-slate-800 hover:bg-[#142142]/90 dark:hover:bg-slate-700 text-[#fab518] font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw size={13} />
            <span>Limpar Filtros e Ver Todas</span>
          </button>
        </div>
      )}

      {/* Kanban Board Container with horizontal navigation and scrollbar */}
      {activeTab === 'quadro' && (
        <div className="relative group/kanban w-full">
          {/* Floating Left Navigation Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              id="btn-floating-scroll-left"
              onClick={() => scrollBoardBy(-340)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-[#0f172a]/95 text-[#142142] dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#fab518] hover:text-[#142142] hover:border-[#fab518] hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
              title="Rolar colunas para a esquerda"
              aria-label="Rolar colunas para a esquerda"
            >
              <ChevronLeft size={22} className="stroke-[2.5]" />
            </button>
          )}

          {/* Floating Right Navigation Arrow Button */}
          {canScrollRight && (
            <button
              type="button"
              id="btn-floating-scroll-right"
              onClick={() => scrollBoardBy(340)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-[#0f172a]/95 text-[#142142] dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#fab518] hover:text-[#142142] hover:border-[#fab518] hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
              title="Rolar colunas para a direita"
              aria-label="Rolar colunas para a direita"
            >
              <ChevronRight size={22} className="stroke-[2.5]" />
            </button>
          )}

          {/* Mobile Column Quick Jump Bar */}
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 mb-2.5 shrink-0">
            {activeColumns.map((col) => {
              const colCount = filteredDemands.filter((d) => d.columnId === col.id).length;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`kanban-column-${col.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#142142] dark:text-white whitespace-nowrap shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  <span>{col.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                    {colCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div 
            ref={boardContainerRef}
            onScroll={handleBoardScroll}
            onWheel={handleBoardWheel}
            onMouseDown={handleBoardMouseDown}
            onMouseMove={handleBoardMouseMove}
            onMouseUp={handleBoardMouseUp}
            onMouseLeave={handleBoardMouseUp}
            className="flex items-start gap-3 sm:gap-4.5 overflow-x-auto pb-4 pt-1 kanban-scrollbar-x scroll-smooth min-w-full snap-x snap-mandatory sm:snap-none cursor-grab active:cursor-grabbing select-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {activeColumns.map((col) => {
              const columnDemands = filteredDemands.filter((d) => d.columnId === col.id);
              const isDragOver = dragOverColumnId === col.id;

              return (
                <div
                  key={col.id}
                  id={`kanban-column-${col.id}`}
                  onDragOver={(e) => handleColumnDragOver(e, col.id)}
                  onDragLeave={(e) => handleColumnDragLeave(e, col.id)}
                  onDrop={(e) => handleColumnDrop(e, col.id)}
                  className={`
                    rounded-2xl sm:rounded-[26px] p-3.5 sm:p-4.5 border flex flex-col w-[84vw] sm:w-[320px] min-w-[270px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-center transition-colors
                    min-h-[580px] sm:min-h-[700px] lg:min-h-[780px] xl:min-h-[860px] max-h-[88vh] lg:max-h-[calc(100vh-140px)] overflow-y-auto kanban-column-scrollbar
                    ${isDragOver 
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-[#fab518] ring-2 ring-[#fab518]/30' 
                      : 'bg-[#F8F9FA] dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                    }
                  `}
                >
                {/* Sticky Header & Action Bar */}
                <div 
                  className={`sticky -top-4.5 z-10 -mt-4.5 -mx-4.5 px-4.5 pt-4.5 pb-2.5 mb-1 backdrop-blur-md rounded-t-[26px] transition-colors ${
                    isDragOver 
                      ? 'bg-amber-50/95 dark:bg-amber-950/95' 
                      : 'bg-[#F8F9FA]/95 dark:bg-slate-900/95'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      <h3 className="text-sm font-black text-[#142142] dark:text-white tracking-tight">
                        {col.title}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {columnDemands.length}
                      </span>
                    </div>

                    <div className="relative column-menu-container">
                      <button
                        type="button"
                        onClick={() => setColumnMenuOpenId(columnMenuOpenId === col.id ? null : col.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-md cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                        title="Opções da sessão"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {columnMenuOpenId === col.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setColumnToEdit(col);
                              setIsAddColumnModalOpen(true);
                              setColumnMenuOpenId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Edit size={13} className="text-slate-400" />
                            <span>Editar Sessão</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setColumnToDelete(col);
                              setColumnMenuOpenId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-700"
                          >
                            <Trash2 size={13} className="text-red-500" />
                            <span>Excluir Sessão</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* "+ Nova demanda" pill button matching screenshot */}
                  <button
                    type="button"
                    onClick={onOpenNewDemandModal}
                    className={`
                      w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white shadow-xs
                      flex items-center justify-center transition-transform active:scale-98 cursor-pointer
                      ${col.buttonBg}
                    `}
                  >
                    <span>+ Nova demanda</span>
                  </button>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 min-h-[80px] pb-1">
                  {columnDemands.map((demand, index) => {
                    const isDragging = draggedDemandId === demand.id;
                    const isTargetBefore = dropTarget?.demandId === demand.id && dropTarget?.position === 'before';
                    const isTargetAfter = dropTarget?.demandId === demand.id && dropTarget?.position === 'after';

                    return (
                      <React.Fragment key={demand.id}>
                        {/* Visual Drop Target Indicator - Before */}
                        {isTargetBefore && (
                          <div 
                            className="h-1.5 bg-[#fab518] rounded-full shadow-xs mx-1 -my-1 animate-pulse transition-all"
                            aria-label="Posicionar aqui"
                          />
                        )}

                        <div
                          id={`demand-card-${demand.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, demand.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleCardDragOver(e, demand, col.id)}
                          onDrop={(e) => handleCardDrop(e, demand, col.id)}
                          onClick={() => setEditingDemand(demand)}
                          className={`
                            bg-white dark:bg-[#0f172a] rounded-[20px] p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md 
                            hover:border-[#fab518]/70 dark:hover:border-[#fab518]/70 transition-all group relative cursor-pointer select-none
                            ${isDragging ? 'opacity-35 scale-98 border-dashed border-[#fab518] shadow-none cursor-grabbing' : ''}
                          `}
                        >
                          {/* Priority bars indicator on top */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getPriorityColorBars(demand.priority, demand.priorityBars)}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {(demand.attachmentsCount || (demand.attachments && demand.attachments.length > 0)) && (
                                <span 
                                  className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 px-1.5 py-0.2 rounded"
                                  title={`${demand.attachmentsCount || demand.attachments?.length} anexo(s)`}
                                >
                                  <Paperclip size={10} />
                                  <span>{demand.attachmentsCount || demand.attachments?.length}</span>
                                </span>
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-[#142142] dark:group-hover:text-white transition-colors">
                                {demand.id}
                              </span>
                            </div>
                          </div>

                        {/* Content Row: Thumbnail + Title */}
                        <div className="flex items-start gap-3 mb-3">
                          {(() => {
                            const cardThumbnail = getDemandImageThumbnail(demand);
                            if (!cardThumbnail) return null;
                            return (
                              <img
                                src={cardThumbnail}
                                alt={demand.title}
                                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 pointer-events-none group-hover:ring-[#fab518] transition-all"
                              />
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#142142] dark:text-white leading-tight group-hover:underline line-clamp-2">
                              {demand.title}
                            </h4>
                            {(demand.client || demand.clientProject) && (
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {demand.client || demand.clientProject}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {(() => {
                            const pBadge = getPriorityBadgeStyle(demand.priority);
                            return (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${pBadge.classes}`}>
                                • {pBadge.label}
                              </span>
                            );
                          })()}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                            • {demand.type}
                          </span>
                          {demand.dueDate && (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/70 flex items-center gap-1 shrink-0"
                              title={`Data da demanda / Prazo: ${formatDemandDateFull(demand.dueDate)}`}
                            >
                              <CalendarIcon size={11} className="text-sky-600 dark:text-sky-400" />
                              <span>{formatDemandDate(demand.dueDate)}</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Card Footer: Assignee & Move Action */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400 text-xs">
                          {(() => {
                            const assigneeDisplay = getAssigneeDisplay(demand.assignee);
                            return (
                              <div className="flex items-center gap-2 min-w-0">
                                {assigneeDisplay.avatar?.trim() ? (
                                  <img
                                    src={assigneeDisplay.avatar}
                                    alt={assigneeDisplay.name}
                                    title={`Responsável: ${assigneeDisplay.name}`}
                                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 pointer-events-none shrink-0"
                                  />
                                ) : (
                                  <div
                                    title={`Responsável: ${assigneeDisplay.name}`}
                                    className="w-6 h-6 rounded-full bg-[#142142] text-[#fab518] text-[10px] font-bold flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                                  >
                                    {assigneeDisplay.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hidden sm:inline truncate max-w-[80px]">
                                  {assigneeDisplay.name.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Quick Column Advancement */}
                          <div className="flex items-center gap-1">
                            {(() => {
                              const currentColIdx = activeColumns.findIndex((c) => c.id === col.id);
                              const hasNextCol = currentColIdx !== -1 && currentColIdx < activeColumns.length - 1;
                              const nextCol = hasNextCol ? activeColumns[currentColIdx + 1] : null;

                              if (hasNextCol && nextCol) {
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateDemandColumn(demand.id, nextCol.id);
                                    }}
                                    className="px-2 py-1 bg-[#F2F2F2] dark:bg-slate-800 hover:bg-[#fab518] hover:text-[#142142] text-slate-600 dark:text-slate-300 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title={`Avançar para: ${nextCol.title}`}
                                  >
                                    <span>Avançar</span>
                                    <ArrowRight size={11} />
                                  </button>
                                );
                              }

                              return (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                                  <CheckCircle2 size={13} />
                                  <span>Pronto</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Visual Drop Target Indicator - After */}
                      {isTargetAfter && (
                        <div 
                          className="h-1.5 bg-[#fab518] rounded-full shadow-xs mx-1 -my-1 animate-pulse transition-all"
                          aria-label="Posicionar aqui"
                        />
                      )}
                    </React.Fragment>
                    );
                  })}

                  {columnDemands.length === 0 && (
                    <div 
                      className={`
                        py-10 px-3 text-center border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-1.5
                        ${isDragOver 
                          ? 'border-[#fab518] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-bold scale-[1.01]' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-medium'
                        }
                      `}
                    >
                      <p className="text-xs">
                        {isDragOver ? 'Solte a demanda aqui nesta coluna' : 'Nenhuma demanda nesta etapa'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New Session / Column Card in Kanban Board */}
          {isInlineAdding ? (
            <div 
              id="kanban-inline-new-column-card"
              className="rounded-[26px] p-4.5 border-2 border-[#fab518] bg-white dark:bg-slate-900 w-[320px] min-w-[320px] shrink-0 shadow-lg flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} className="text-[#fab518] stroke-[3]" />
                  Nova Sessão
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsInlineAdding(false);
                    setInlineTitle('');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleQuickInlineAdd} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nome da Sessão *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ex: Revisão Interna, Aguardando Fotos..."
                    value={inlineTitle}
                    onChange={(e) => setInlineTitle(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Cor de Destaque
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLUMN_COLOR_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setInlineColorIndex(idx)}
                        className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          inlineColorIndex === idx ? 'ring-2 ring-offset-1 ring-[#fab518] scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                      >
                        {inlineColorIndex === idx && (
                          <Check size={12} className="text-white stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInlineAdding(false);
                      setInlineTitle('');
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-xs font-black text-[#142142] bg-[#fab518] hover:bg-[#e29f11] transition-all cursor-pointer shadow-xs"
                  >
                    Criar Sessão
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              type="button"
              id="btn-kanban-add-column-card"
              onClick={() => {
                setColumnToEdit(null);
                setIsAddColumnModalOpen(true);
              }}
              className="w-[300px] min-w-[300px] shrink-0 p-6 rounded-[26px] border-2 border-dashed border-slate-300/90 dark:border-slate-800 hover:border-[#fab518] hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 hover:text-[#fab518] group cursor-pointer min-h-[480px] lg:min-h-[580px] shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 group-hover:bg-[#fab518]/20 group-hover:text-[#fab518] flex items-center justify-center transition-colors shadow-xs">
                <Plus size={22} className="stroke-[2.5] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-sm font-black text-[#142142] dark:text-white group-hover:text-[#fab518] block tracking-tight">
                  + Adicionar Sessão
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 block">
                  Criar nova coluna no fluxo
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
      )}

      {/* Alternative View: Lista */}
      {activeTab === 'lista' && (
        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-[#142142] dark:text-white font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Demanda</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Etapa</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">Prazo</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDemands.map((demand) => (
                <tr 
                  key={demand.id} 
                  onClick={() => setEditingDemand(demand)}
                  className="hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-bold text-[#142142] dark:text-white">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const listThumbnail = getDemandImageThumbnail(demand);
                        if (!listThumbnail) return null;
                        return (
                          <img src={listThumbnail} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-[#fab518]" />
                        );
                      })()}
                      <div>
                        <div className="group-hover:text-[#fab518] group-hover:underline">{demand.title}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{demand.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{demand.client}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {demand.type}
                    </span>
                  </td>
                  <td className="p-4">
                    {(() => {
                      const colObj = activeColumns.find((c) => c.id === demand.columnId);
                      return (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: colObj ? `${colObj.color}18` : undefined,
                            color: colObj ? colObj.color : undefined,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colObj?.color || '#94a3b8' }} />
                          <span>{colObj?.title || demand.columnId}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    {(() => {
                      const assigneeDisplay = getAssigneeDisplay(demand.assignee);
                      return (
                        <div className="flex items-center gap-2">
                          {assigneeDisplay.avatar?.trim() ? (
                            <img src={assigneeDisplay.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#142142] text-[#fab518] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {assigneeDisplay.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{assigneeDisplay.name}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon size={12} className="text-slate-400 shrink-0" />
                      <span>{formatDemandDateFull(demand.dueDate)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentIndex = activeColumns.findIndex((c) => c.id === demand.columnId);
                        const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % activeColumns.length : 0;
                        const nextColumn = activeColumns[nextIndex];
                        if (nextColumn) {
                          onUpdateDemandColumn(demand.id, nextColumn.id);
                        }
                      }}
                      className="text-xs font-bold text-[#142142] dark:text-[#fab518] hover:underline cursor-pointer"
                    >
                      Alterar Etapa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alternative View: Calendário */}
      {activeTab === 'calendario' && (
        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-[26px] border border-slate-200/80 dark:border-slate-800 text-center py-12 space-y-3 shadow-sm">
          <CalendarIcon size={40} className="mx-auto text-[#fab518]" />
          <h4 className="text-base font-bold text-[#142142] dark:text-white">Calendário Editorial de Publicações</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Visualização das postagens programadas para Facebook, Instagram e campanhas de tráfego pago da Help Ideias Digitais para a semana atual.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 rounded-lg">
              2 Publicações Agendadas p/ Hoje
            </span>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 rounded-lg">
              3 Peças em Aprovação com Cliente
            </span>
          </div>
        </div>
      )}

      {/* Alternative View: Gantt */}
      {activeTab === 'gantt' && (
        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-[26px] border border-slate-200/80 dark:border-slate-800 text-center py-12 space-y-3 shadow-sm">
          <GanttChartSquare size={40} className="mx-auto text-[#fab518]" />
          <h4 className="text-base font-bold text-[#142142] dark:text-white">Cronograma de Criação de Sites & Lançamentos</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Acompanhamento de entregas de longo prazo, como Landing Pages, Setup de Conversões e Planejamentos Trimestrais.
          </p>
        </div>
      )}

      {/* Demand Detail & Editing Modal */}
      {editingDemand && (
        <DemandDetailModal
          demand={editingDemand}
          clients={clients}
          teamMembers={teamMembers}
          columns={activeColumns}
          isOpen={Boolean(editingDemand)}
          onClose={() => setEditingDemand(null)}
          onOpenWhatsAppNotification={onOpenWhatsAppNotification}
          onOpenClientApprovalPortal={onOpenClientApprovalPortal}
          onSave={(updatedDemand) => {
            if (onSaveDemand) {
              onSaveDemand(updatedDemand);
            }
            setEditingDemand(null);
          }}
          onDelete={(demandId) => {
            if (onDeleteDemand) {
              onDeleteDemand(demandId);
            }
            setEditingDemand(null);
          }}
        />
      )}

      {/* Modal to Add / Edit Column */}
      {isAddColumnModalOpen && (
        <AddColumnModal
          isOpen={isAddColumnModalOpen}
          onClose={() => {
            setIsAddColumnModalOpen(false);
            setColumnToEdit(null);
          }}
          onSaveColumn={handleSaveColumn}
          columnToEdit={columnToEdit}
        />
      )}

      {/* Approval Notification Configuration Modal */}
      {isNotificationConfigOpen && (
        <ApprovalNotificationConfigModal
          isOpen={isNotificationConfigOpen}
          onClose={() => setIsNotificationConfigOpen(false)}
        />
      )}

      {/* Confirmation Dialog for Delete Column */}
      <ConfirmDeleteModal
        isOpen={!!columnToDelete}
        onClose={() => setColumnToDelete(null)}
        onConfirm={() => {
          if (columnToDelete) {
            handleDeleteColumn(columnToDelete.id);
            setColumnToDelete(null);
          }
        }}
        itemType="coluna / sessão"
        itemName={columnToDelete?.title}
        description={
          columnToDelete ? (
            <p>
              Tem certeza que deseja excluir a sessão <strong>"{columnToDelete.title}"</strong>? Quaisquer demandas nesta etapa serão movidas automaticamente para a primeira coluna do fluxo.
            </p>
          ) : undefined
        }
      />
    </div>
  );
};
