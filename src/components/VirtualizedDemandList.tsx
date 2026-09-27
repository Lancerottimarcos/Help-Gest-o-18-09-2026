import React, { useMemo, useRef, useState, useEffect } from 'react';
import { List } from 'react-window';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Paperclip, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  CheckCircle2,
  Layers,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';
import { DemandItem, KanbanColumn, KanbanColumnId, Priority, Client } from '../types';

export interface VirtualizedDemandListProps {
  demands: DemandItem[];
  col: KanbanColumn;
  clients?: Client[];
  activeColumns: KanbanColumn[];
  draggedDemandId: string | null;
  dropTarget: {
    demandId: string;
    columnId: KanbanColumnId;
    position: 'before' | 'after';
  } | null;
  isDragOver: boolean;
  onCardClick: (demand: DemandItem) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, demandId: string) => void;
  onDragEnd: () => void;
  onCardDragOver: (e: React.DragEvent<HTMLDivElement>, demand: DemandItem, columnId: KanbanColumnId) => void;
  onCardDrop: (e: React.DragEvent<HTMLDivElement>, demand: DemandItem, columnId: KanbanColumnId) => void;
  onUpdateDemandColumn: (id: string, newColId: KanbanColumnId) => void;
  getPriorityBadgeStyle: (priority: Priority) => { label: string; classes: string };
  getPriorityColorBars: (priority?: Priority, barsCount?: number) => React.ReactNode;
  getAssigneeDisplay: (assignee?: { name?: string; avatar?: string }) => { name: string; avatar?: string };
  getDemandImageThumbnail: (demand: DemandItem) => string | undefined;
  formatDemandDate: (dateStr?: string) => string;
  formatDemandDateFull: (dateStr?: string) => string;
}

interface RowData {
  demands: DemandItem[];
  col: KanbanColumn;
  clients: Client[];
  activeColumns: KanbanColumn[];
  draggedDemandId: string | null;
  dropTarget: {
    demandId: string;
    columnId: KanbanColumnId;
    position: 'before' | 'after';
  } | null;
  onCardClick: (demand: DemandItem) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, demandId: string) => void;
  onDragEnd: () => void;
  onCardDragOver: (e: React.DragEvent<HTMLDivElement>, demand: DemandItem, columnId: KanbanColumnId) => void;
  onCardDrop: (e: React.DragEvent<HTMLDivElement>, demand: DemandItem, columnId: KanbanColumnId) => void;
  onUpdateDemandColumn: (id: string, newColId: KanbanColumnId) => void;
  getPriorityBadgeStyle: (priority: Priority) => { label: string; classes: string };
  getPriorityColorBars: (priority?: Priority, barsCount?: number) => React.ReactNode;
  getAssigneeDisplay: (assignee?: { name?: string; avatar?: string }) => { name: string; avatar?: string };
  getDemandImageThumbnail: (demand: DemandItem) => string | undefined;
  formatDemandDate: (dateStr?: string) => string;
  formatDemandDateFull: (dateStr?: string) => string;
}

// Threshold: Columns with more than this number of demands will use react-window virtualization
export const VIRTUALIZATION_THRESHOLD = 50;

// Individual Card Component
const DemandCard: React.FC<{
  demand: DemandItem;
  col: KanbanColumn;
  clients: Client[];
  activeColumns: KanbanColumn[];
  draggedDemandId: string | null;
  dropTarget: {
    demandId: string;
    columnId: KanbanColumnId;
    position: 'before' | 'after';
  } | null;
  onCardClick: (demand: DemandItem) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, demandId: string) => void;
  onDragEnd: () => void;
  onCardDragOver: (e: React.DragEvent<HTMLDivElement>, demand: DemandItem, columnId: KanbanColumnId) => void;
  onCardDrop: (e: React.DragEvent<HTMLDivElement>, demand: DemandItem, columnId: KanbanColumnId) => void;
  onUpdateDemandColumn: (id: string, newColId: KanbanColumnId) => void;
  getPriorityBadgeStyle: (priority: Priority) => { label: string; classes: string };
  getPriorityColorBars: (priority?: Priority, barsCount?: number) => React.ReactNode;
  getAssigneeDisplay: (assignee?: { name?: string; avatar?: string }) => { name: string; avatar?: string };
  getDemandImageThumbnail: (demand: DemandItem) => string | undefined;
  formatDemandDate: (dateStr?: string) => string;
  formatDemandDateFull: (dateStr?: string) => string;
  isVirtualized?: boolean;
}> = ({
  demand,
  col,
  clients,
  activeColumns,
  draggedDemandId,
  dropTarget,
  onCardClick,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onCardDrop,
  onUpdateDemandColumn,
  getPriorityBadgeStyle,
  getPriorityColorBars,
  getAssigneeDisplay,
  getDemandImageThumbnail,
  formatDemandDate,
  formatDemandDateFull,
  isVirtualized = false,
}) => {
  const isDragging = draggedDemandId === demand.id;
  const isTargetBefore = dropTarget?.demandId === demand.id && dropTarget?.position === 'before';
  const isTargetAfter = dropTarget?.demandId === demand.id && dropTarget?.position === 'after';

  const cardThumbnail = getDemandImageThumbnail(demand);
  const pBadge = getPriorityBadgeStyle(demand.priority);
  const assigneeDisplay = getAssigneeDisplay(demand.assignee);

  const matchedClient = (clients || []).find((c) =>
    (demand.clientId && c.id === demand.clientId) ||
    (demand.client && (
      c.name.trim().toLowerCase() === demand.client.trim().toLowerCase() ||
      (c.companyName && c.companyName.trim().toLowerCase() === demand.client.trim().toLowerCase())
    ))
  );
  const displayClient = matchedClient ? (matchedClient.name || matchedClient.companyName) : (demand.client || demand.clientProject || '');

  const currentColIdx = activeColumns.findIndex((c) => c.id === col.id);
  const hasNextCol = currentColIdx !== -1 && currentColIdx < activeColumns.length - 1;
  const nextCol = hasNextCol ? activeColumns[currentColIdx + 1] : null;

  return (
    <motion.div
      layout={!isVirtualized ? 'position' : undefined}
      layoutId={!isVirtualized ? `kanban-card-${demand.id}` : undefined}
      initial={!isVirtualized ? { opacity: 0, scale: 0.95, y: 8 } : undefined}
      animate={
        !isVirtualized
          ? {
              opacity: isDragging ? 0.35 : 1,
              scale: isDragging ? 0.96 : 1,
              y: 0,
            }
          : undefined
      }
      exit={
        !isVirtualized
          ? { opacity: 0, scale: 0.92, transition: { duration: 0.15 } }
          : undefined
      }
      transition={{
        layout: {
          type: 'spring',
          stiffness: 350,
          damping: 28,
        },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className="relative"
    >
      {/* Visual Drop Target Indicator - Before */}
      {isTargetBefore && (
        <motion.div 
          layout
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          className="h-1.5 bg-[#fab518] rounded-full shadow-xs mx-1 mb-1.5 animate-pulse transition-all"
          aria-label="Posicionar aqui"
        />
      )}

      <div
        id={`demand-card-${demand.id}`}
        draggable
        onDragStart={(e) => onDragStart(e, demand.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onCardDragOver(e, demand, col.id)}
        onDrop={(e) => onCardDrop(e, demand, col.id)}
        onClick={() => onCardClick(demand)}
        className={`
          bg-white dark:bg-[#0f172a] rounded-[18px] p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md 
          hover:border-[#fab518]/80 dark:hover:border-[#fab518]/80 hover:-translate-y-0.5 transition-all duration-150 group relative cursor-pointer select-none
          ${isDragging ? 'opacity-30 scale-95 border-dashed border-[#fab518] shadow-none cursor-grabbing' : ''}
        `}
      >
        {/* Top Bar: Priority Bars + Demand ID + Attachments */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {getPriorityColorBars(demand.priority, demand.priorityBars)}
          </div>

          <div className="flex items-center gap-2">
            {(demand.attachmentsCount || (demand.attachments && demand.attachments.length > 0)) && (
              <span 
                className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 px-1.5 py-0.2 rounded"
                title={`${demand.attachmentsCount || demand.attachments?.length} anexo(s)`}
              >
                <Paperclip size={10} />
                <span>{demand.attachmentsCount || demand.attachments?.length}</span>
              </span>
            )}
            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
              {demand.id}
            </span>
          </div>
        </div>

        {/* Content Row: Thumbnail + Title + Client */}
        <div className="flex items-start gap-2.5 mb-2.5">
          {cardThumbnail && (
            <img
              src={cardThumbnail}
              alt={demand.title}
              className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200/80 dark:ring-slate-700/80 shrink-0 pointer-events-none group-hover:ring-[#fab518] transition-all"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-[13px] font-bold text-[#142142] dark:text-slate-100 leading-snug group-hover:text-amber-600 dark:group-hover:text-[#fab518] transition-colors line-clamp-2">
              {demand.title}
            </h4>
            {displayClient && (
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={displayClient}>
                {displayClient}
              </p>
            )}
          </div>
        </div>

        {/* Clean Metadata Line (Anti-Slop Zero-Pill) */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.2 rounded border ${pBadge.classes}`}>
            {pBadge.label}
          </span>
          <span className="text-slate-300 dark:text-slate-600 font-bold">·</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px]">
            {demand.type}
          </span>
          {demand.dueDate && (
            <>
              <span className="text-slate-300 dark:text-slate-600 font-bold">·</span>
              <span 
                className={`inline-flex items-center gap-1 font-semibold text-[10px] sm:text-[11px] ${
                  demand.dueDate.toLowerCase().includes('atrasad') || demand.dueDate.toLowerCase().includes('ontem')
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : demand.dueDate.toLowerCase().includes('hoje')
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title={`Data da demanda / Prazo: ${formatDemandDateFull(demand.dueDate)}`}
              >
                <CalendarIcon size={11} className="shrink-0" />
                <span>{formatDemandDate(demand.dueDate)}</span>
              </span>
            </>
          )}
        </div>

        {/* Bottom Card Footer: Assignee & Move Action */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {assigneeDisplay.avatar?.trim() ? (
              <img
                src={assigneeDisplay.avatar}
                alt={assigneeDisplay.name}
                title={`Responsável: ${assigneeDisplay.name}`}
                className="w-5.5 h-5.5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 pointer-events-none shrink-0"
              />
            ) : (
              <div
                title={`Responsável: ${assigneeDisplay.name}`}
                className="w-5.5 h-5.5 rounded-full bg-[#142142] text-[#fab518] text-[9px] font-black flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
              >
                {assigneeDisplay.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[85px]">
              {assigneeDisplay.name.split(' ')[0]}
            </span>
          </div>

          {/* Quick Column Advancement */}
          <div className="flex items-center gap-1">
            {hasNextCol && nextCol ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateDemandColumn(demand.id, nextCol.id);
                }}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#142142] hover:text-white dark:hover:bg-[#fab518] dark:hover:text-[#142142] text-slate-600 dark:text-slate-300 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title={`Avançar para: ${nextCol.title}`}
              >
                <span>Avançar</span>
                <ArrowRight size={10} />
              </button>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold">
                <CheckCircle2 size={12} />
                <span>Concluída</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Drop Target Indicator - After */}
      {isTargetAfter && (
        <motion.div 
          layout
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          className="h-1.5 bg-[#fab518] rounded-full shadow-xs mx-1 mt-1.5 animate-pulse transition-all"
          aria-label="Posicionar aqui"
        />
      )}
    </motion.div>
  );
};

// Row component for react-window List
const VirtualizedRow = (props: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
} & RowData) => {
  const demand = props.demands[props.index];
  if (!demand) return null;

  return (
    <div 
      {...props.ariaAttributes}
      style={{ 
        ...props.style, 
        paddingBottom: '12px',
        paddingLeft: '2px',
        paddingRight: '2px',
        boxSizing: 'border-box'
      }}
    >
      <DemandCard
        demand={demand}
        col={props.col}
        clients={props.clients}
        activeColumns={props.activeColumns}
        draggedDemandId={props.draggedDemandId}
        dropTarget={props.dropTarget}
        onCardClick={props.onCardClick}
        onDragStart={props.onDragStart}
        onDragEnd={props.onDragEnd}
        onCardDragOver={props.onCardDragOver}
        onCardDrop={props.onCardDrop}
        onUpdateDemandColumn={props.onUpdateDemandColumn}
        getPriorityBadgeStyle={props.getPriorityBadgeStyle}
        getPriorityColorBars={props.getPriorityColorBars}
        getAssigneeDisplay={props.getAssigneeDisplay}
        getDemandImageThumbnail={props.getDemandImageThumbnail}
        formatDemandDate={props.formatDemandDate}
        formatDemandDateFull={props.formatDemandDateFull}
        isVirtualized={true}
      />
    </div>
  );
};

export const VirtualizedDemandList: React.FC<VirtualizedDemandListProps> = ({
  demands,
  col,
  clients = [],
  activeColumns,
  draggedDemandId,
  dropTarget,
  isDragOver,
  onCardClick,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onCardDrop,
  onUpdateDemandColumn,
  getPriorityBadgeStyle,
  getPriorityColorBars,
  getAssigneeDisplay,
  getDemandImageThumbnail,
  formatDemandDate,
  formatDemandDateFull,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number>(560);

  // Dynamically observe available container height for the column cards area
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parentCol = containerRef.current.closest(`#kanban-column-${col.id}`) as HTMLElement | null;
        if (parentCol) {
          const colHeight = parentCol.clientHeight;
          // Available height minus header (~110px) and bottom padding (~25px)
          const computed = Math.max(380, colHeight - 135);
          setAvailableHeight(computed);
          return;
        }
      }
      // Fallback: 80% of window height minus navbar/header space
      const fallback = Math.max(420, Math.min(window.innerHeight * 0.82 - 140, 780));
      setAvailableHeight(fallback);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const parentCol = containerRef.current.closest(`#kanban-column-${col.id}`);
      if (parentCol) {
        ro = new ResizeObserver(updateSize);
        ro.observe(parentCol);
      }
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      if (ro) ro.disconnect();
    };
  }, [col.id]);

  // Height estimation for each card
  const getItemSize = (index: number) => {
    const demand = demands[index];
    if (!demand) return 205;
    const hasThumb = Boolean(getDemandImageThumbnail(demand));
    // 205px base card + 12px gap = 217px (without thumbnail) or 228px (with thumbnail)
    return hasThumb ? 228 : 217;
  };

  const totalCalculatedHeight = useMemo(() => {
    return demands.reduce((acc, d) => {
      const hasThumb = Boolean(getDemandImageThumbnail(d));
      return acc + (hasThumb ? 228 : 217);
    }, 0);
  }, [demands, getDemandImageThumbnail]);

  const rowData: RowData = useMemo(() => ({
    demands,
    col,
    clients,
    activeColumns,
    draggedDemandId,
    dropTarget,
    onCardClick,
    onDragStart,
    onDragEnd,
    onCardDragOver,
    onCardDrop,
    onUpdateDemandColumn,
    getPriorityBadgeStyle,
    getPriorityColorBars,
    getAssigneeDisplay,
    getDemandImageThumbnail,
    formatDemandDate,
    formatDemandDateFull,
  }), [
    demands,
    col,
    clients,
    activeColumns,
    draggedDemandId,
    dropTarget,
    onCardClick,
    onDragStart,
    onDragEnd,
    onCardDragOver,
    onCardDrop,
    onUpdateDemandColumn,
    getPriorityBadgeStyle,
    getPriorityColorBars,
    getAssigneeDisplay,
    getDemandImageThumbnail,
    formatDemandDate,
    formatDemandDateFull,
  ]);

  // 1. Empty state
  if (demands.length === 0) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`
          py-10 px-3 text-center border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-1.5 my-auto
          ${isDragOver 
            ? 'border-[#fab518] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-bold scale-[1.01]' 
            : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-medium'
          }
        `}
      >
        <p className="text-xs">
          {isDragOver ? 'Solte a demanda aqui nesta coluna' : 'Nenhuma demanda nesta etapa'}
        </p>
      </motion.div>
    );
  }

  // 2. Standard list (<= threshold): render standard stack with Framer Motion layout animations
  if (demands.length <= VIRTUALIZATION_THRESHOLD) {
    return (
      <div className="space-y-3 flex-1 min-h-[80px] pb-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {demands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              col={col}
              clients={clients}
              activeColumns={activeColumns}
              draggedDemandId={draggedDemandId}
              dropTarget={dropTarget}
              onCardClick={onCardClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onCardDragOver={onCardDragOver}
              onCardDrop={onCardDrop}
              onUpdateDemandColumn={onUpdateDemandColumn}
              getPriorityBadgeStyle={getPriorityBadgeStyle}
              getPriorityColorBars={getPriorityColorBars}
              getAssigneeDisplay={getAssigneeDisplay}
              getDemandImageThumbnail={getDemandImageThumbnail}
              formatDemandDate={formatDemandDate}
              formatDemandDateFull={formatDemandDateFull}
              isVirtualized={false}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // 3. Large list (> threshold): render virtualized with react-window List
  // Height dynamically fills available column space, capped at total content height
  const renderListHeight = Math.max(340, Math.min(totalCalculatedHeight + 24, availableHeight));
  const listInnerHeight = Math.max(280, renderListHeight - 26);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 w-full min-h-[340px] flex flex-col relative"
      style={{ height: renderListHeight }}
    >
      {/* Mini Performance Badge for Virtualized Mode */}
      <div className="flex items-center justify-between pb-1 px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 select-none shrink-0">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Zap size={10} className="fill-emerald-500 text-emerald-500" />
          <span>Virtualizada ({demands.length} cards)</span>
        </span>
        <span>Renderização Otimizada</span>
      </div>

      <List<RowData>
        rowCount={demands.length}
        rowHeight={getItemSize}
        rowComponent={VirtualizedRow}
        rowProps={rowData}
        rowKey={(index) => demands[index]?.id || index}
        overscanCount={3}
        className="kanban-column-scrollbar"
        style={{
          height: listInnerHeight,
          width: '100%',
        }}
      />
    </div>
  );
};
