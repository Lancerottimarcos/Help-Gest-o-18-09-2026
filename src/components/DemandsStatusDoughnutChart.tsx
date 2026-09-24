import React, { useState } from 'react';
import { DemandItem, KanbanColumnId, PageId } from '../types';
import { PieChart as PieIcon, ArrowUpRight } from 'lucide-react';

interface DemandsStatusDoughnutChartProps {
  demands: DemandItem[];
  onNavigate?: (page: PageId) => void;
}

interface StatusDistributionItem {
  id: KanbanColumnId;
  name: string;
  value: number;
  color: string;
  bgBadge: string;
  textBadge: string;
}

const STATUS_CONFIG: Record<KanbanColumnId, { name: string; color: string; bgBadge: string; textBadge: string }> = {
  ideias: {
    name: 'Ideias / Briefing',
    color: '#EF4444', // Red/Coral
    bgBadge: 'bg-red-50 dark:bg-red-950/50',
    textBadge: 'text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60',
  },
  producao: {
    name: 'Em Produção',
    color: '#8B5CF6', // Purple
    bgBadge: 'bg-purple-50 dark:bg-purple-950/50',
    textBadge: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60',
  },
  aprovacao: {
    name: 'Aprovação',
    color: '#FAB518', // Gold / Amber
    bgBadge: 'bg-amber-50 dark:bg-amber-950/50',
    textBadge: 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
  },
  agendamento: {
    name: 'Agendamento',
    color: '#10B981', // Emerald
    bgBadge: 'bg-emerald-50 dark:bg-emerald-950/50',
    textBadge: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
  },
  concluidas: {
    name: 'Concluídas',
    color: '#64748B', // Slate
    bgBadge: 'bg-slate-50 dark:bg-slate-800',
    textBadge: 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

export const DemandsStatusDoughnutChart: React.FC<DemandsStatusDoughnutChartProps> = ({
  demands,
  onNavigate,
}) => {
  const [hoveredId, setHoveredId] = useState<KanbanColumnId | null>(null);

  // Focus on active demands (non-concluded) for the primary distribution overview
  const activeDemands = demands.filter((d) => d.columnId !== 'concluidas');
  const totalActive = activeDemands.length;

  // Calculate distribution by active status
  const statuses: KanbanColumnId[] = ['ideias', 'producao', 'aprovacao', 'agendamento'];
  
  const chartData: StatusDistributionItem[] = statuses
    .map((statusKey) => {
      const count = activeDemands.filter((d) => d.columnId === statusKey).length;
      const config = STATUS_CONFIG[statusKey];
      return {
        id: statusKey,
        name: config.name,
        value: count,
        color: config.color,
        bgBadge: config.bgBadge,
        textBadge: config.textBadge,
      };
    })
    .filter((item) => item.value > 0);

  // Pure SVG Donut Math
  const radius = 62;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius; // ≈ 389.557

  let accumulatedLength = 0;
  const segments = chartData.map((item) => {
    const fraction = totalActive > 0 ? item.value / totalActive : 0;
    const segmentLength = fraction * circumference;
    const gap = chartData.length > 1 ? 3.5 : 0;
    const strokeDash = Math.max(0, segmentLength - gap);
    const strokeDasharray = `${strokeDash} ${circumference - strokeDash}`;
    const strokeDashoffset = -accumulatedLength;
    accumulatedLength += segmentLength;

    return {
      ...item,
      fraction,
      percent: Math.round(fraction * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeHoveredItem = hoveredId ? segments.find((s) => s.id === hoveredId) : null;

  return (
    <div 
      id="demands-status-chart-card"
      className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#142142] dark:bg-slate-800 text-[#fab518] flex items-center justify-center shadow-xs border border-slate-200/40 dark:border-slate-700">
            <PieIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#142142] dark:text-white tracking-tight">
              Status das Demandas
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Distribuição das {totalActive} demandas ativas
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('demandas')}
            className="text-[11px] font-bold text-[#142142] dark:text-[#fab518] hover:text-[#fab518] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Quadro</span>
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>

      {/* Pure SVG Doughnut Chart */}
      {totalActive > 0 ? (
        <div className="relative w-full h-44 flex items-center justify-center">
          <svg
            viewBox="0 0 160 160"
            className="w-40 h-40 transform -rotate-90 drop-shadow-xs"
            aria-label="Gráfico de distribuição de status"
          >
            {/* Background Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth - 2}
            />

            {/* Slices */}
            {segments.map((segment) => {
              const isHovered = hoveredId === segment.id;
              return (
                <circle
                  key={segment.id}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none',
                    opacity: hoveredId && !isHovered ? 0.45 : 1,
                  }}
                  onMouseEnter={() => setHoveredId(segment.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onNavigate && onNavigate('demandas')}
                />
              );
            })}
          </svg>

          {/* Central Label inside the doughnut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {activeHoveredItem ? (
              <div className="animate-fade-in">
                <span className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white leading-none block">
                  {activeHoveredItem.value}
                </span>
                <span 
                  className="text-[10px] font-bold truncate max-w-[80px] block mt-0.5"
                  style={{ color: activeHoveredItem.color }}
                >
                  {activeHoveredItem.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-black text-[#142142] dark:text-white leading-none">
                  {totalActive}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  Ativas
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">
          Nenhuma demanda ativa no momento.
        </div>
      )}

      {/* Legend & Breakdown */}
      {segments.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {segments.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onNavigate && onNavigate('demandas')}
                className={`flex items-center justify-between text-xs p-1.5 rounded-xl transition-all cursor-pointer ${
                  isHovered 
                    ? 'bg-slate-100/80 dark:bg-slate-800 scale-[1.01]' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform"
                    style={{ 
                      backgroundColor: item.color,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)'
                    }}
                  />
                  <span className={`truncate text-xs ${isHovered ? 'font-black text-[#142142] dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-[#142142] dark:text-white text-xs">
                    {item.value}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.bgBadge} ${item.textBadge}`}>
                    {item.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
