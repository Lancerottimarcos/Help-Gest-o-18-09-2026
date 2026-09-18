import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
    color: '#64748B', // slate
    bgBadge: 'bg-slate-100',
    textBadge: 'text-slate-700',
  },
  producao: {
    name: 'Em Produção',
    color: '#8B5CF6', // purple
    bgBadge: 'bg-purple-50',
    textBadge: 'text-purple-700',
  },
  aprovacao: {
    name: 'Aprovação',
    color: '#F59E0B', // amber
    bgBadge: 'bg-amber-50',
    textBadge: 'text-amber-800',
  },
  agendamento: {
    name: 'Agendamento',
    color: '#10B981', // emerald
    bgBadge: 'bg-emerald-50',
    textBadge: 'text-emerald-700',
  },
  concluidas: {
    name: 'Concluídas',
    color: '#3B82F6', // blue
    bgBadge: 'bg-blue-50',
    textBadge: 'text-blue-700',
  },
};

export const DemandsStatusDoughnutChart: React.FC<DemandsStatusDoughnutChartProps> = ({
  demands,
  onNavigate,
}) => {
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as StatusDistributionItem;
      const percent = totalActive > 0 ? ((item.value / totalActive) * 100).toFixed(0) : '0';
      return (
        <div className="bg-[#142142] text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-slate-700 z-30">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold">{item.name}</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            <strong className="text-white">{item.value}</strong> {item.value === 1 ? 'demanda' : 'demandas'} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="demands-status-chart-card"
      className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
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
              Distribuição atual das {totalActive} demandas ativas
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

      {/* Doughnut Chart & Center Metric */}
      {totalActive > 0 ? (
        <div className="relative w-full h-44 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Central Label inside the doughnut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-[#142142] dark:text-white leading-none">
              {totalActive}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
              Ativas
            </span>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">
          Nenhuma demanda ativa no momento.
        </div>
      )}

      {/* Legend & Breakdown */}
      {chartData.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {chartData.map((item) => {
            const percent = totalActive > 0 ? Math.round((item.value / totalActive) * 100) : 0;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate && onNavigate('demandas')}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-700 truncate text-xs">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-[#142142] text-xs">
                    {item.value}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.bgBadge} ${item.textBadge}`}>
                    {percent}%
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
