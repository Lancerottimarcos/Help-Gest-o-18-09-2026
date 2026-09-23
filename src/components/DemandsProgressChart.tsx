import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DemandItem, KanbanColumnId, PageId } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Sparkles,
  Layers,
  CalendarCheck2
} from 'lucide-react';

interface DemandsProgressChartProps {
  demands: DemandItem[];
  onNavigate?: (page: PageId) => void;
  onFilterStage?: (stageId: string | null) => void;
  selectedStage?: string | null;
}

interface StageProgressMeta {
  id: KanbanColumnId;
  name: string;
  shortName: string;
  color: string;
  twBg: string;
  twText: string;
  twBorder: string;
  count: number;
  percent: number;
}

const STAGE_CONFIG: Record<KanbanColumnId, { name: string; shortName: string; color: string; twBg: string; twText: string; twBorder: string }> = {
  ideias: {
    name: 'Ideias & Briefing',
    shortName: 'Briefing',
    color: '#94A3B8', // slate-400
    twBg: 'bg-slate-100 dark:bg-slate-800',
    twText: 'text-slate-700 dark:text-slate-300',
    twBorder: 'border-slate-200 dark:border-slate-700',
  },
  producao: {
    name: 'Em Produção',
    shortName: 'Produção',
    color: '#8B5CF6', // violet-500
    twBg: 'bg-purple-50 dark:bg-purple-950/40',
    twText: 'text-purple-700 dark:text-purple-300',
    twBorder: 'border-purple-200 dark:border-purple-800/60',
  },
  aprovacao: {
    name: 'Aguardando Aprovação',
    shortName: 'Aprovação',
    color: '#F59E0B', // amber-500
    twBg: 'bg-amber-50 dark:bg-amber-950/40',
    twText: 'text-amber-800 dark:text-amber-300',
    twBorder: 'border-amber-200 dark:border-amber-800/60',
  },
  agendamento: {
    name: 'Agendamento',
    shortName: 'Agendadas',
    color: '#10B981', // emerald-500
    twBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    twText: 'text-emerald-700 dark:text-emerald-300',
    twBorder: 'border-emerald-200 dark:border-emerald-800/60',
  },
  concluidas: {
    name: 'Concluídas',
    shortName: 'Concluídas',
    color: '#3B82F6', // blue-500
    twBg: 'bg-blue-50 dark:bg-blue-950/40',
    twText: 'text-blue-700 dark:text-blue-300',
    twBorder: 'border-blue-200 dark:border-blue-800/60',
  },
};

const STAGE_ORDER: KanbanColumnId[] = ['ideias', 'producao', 'aprovacao', 'agendamento', 'concluidas'];

export const DemandsProgressChart: React.FC<DemandsProgressChartProps> = ({
  demands,
  onNavigate,
  onFilterStage,
  selectedStage,
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const totalDemands = demands.length;

  // Calculate statistics per stage
  const stagesData: StageProgressMeta[] = STAGE_ORDER.map((stageId) => {
    const count = demands.filter((d) => d.columnId === stageId).length;
    const percent = totalDemands > 0 ? Math.round((count / totalDemands) * 100) : 0;
    const cfg = STAGE_CONFIG[stageId];
    return {
      id: stageId,
      name: cfg.name,
      shortName: cfg.shortName,
      color: cfg.color,
      twBg: cfg.twBg,
      twText: cfg.twText,
      twBorder: cfg.twBorder,
      count,
      percent,
    };
  });

  // Chart data for Pie/Donut (only stages with count > 0)
  const chartPieData = stagesData.filter((s) => s.count > 0);

  // Demands completed and active
  const completedCount = demands.filter((d) => d.columnId === 'concluidas').length;
  const activeCount = totalDemands - completedCount;
  const completionPercentage = totalDemands > 0 ? Math.round((completedCount / totalDemands) * 100) : 0;

  // Weighted workflow progression rate
  // Ideias: 10%, Producao: 40%, Aprovacao: 70%, Agendamento: 90%, Concluidas: 100%
  const workflowProgressScore = totalDemands > 0
    ? Math.round(
        demands.reduce((acc, d) => {
          if (d.columnId === 'concluidas') return acc + 100;
          if (d.columnId === 'agendamento') return acc + 90;
          if (d.columnId === 'aprovacao') return acc + 70;
          if (d.columnId === 'producao') return acc + 40;
          if (d.columnId === 'ideias') return acc + 15;
          return acc;
        }, 0) / totalDemands
      )
    : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as StageProgressMeta;
      return (
        <div className="bg-[#142142] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700 z-50 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-slate-100">{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
            <span>Volume: <strong className="text-white font-mono">{data.count}</strong></span>
            <span>Participação: <strong className="text-[#fab518] font-mono">{data.percent}%</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (totalDemands === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-400">
        Nenhuma demanda registrada para monitorar o andamento.
      </div>
    );
  }

  return (
    <div className="bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 p-4 sm:p-5 transition-all">
      {/* Header do Gráfico de Andamento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <TrendingUp size={16} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-[#142142] dark:text-white uppercase tracking-wider">
              Andamento Geral das Demandas
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeCount} ativas em produção · {completedCount} concluídas de {totalDemands} no total
            </p>
          </div>
        </div>

        {/* Global Progress Indicator & Action */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] uppercase font-bold text-slate-400">Taxa de Conclusão:</span>
              <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                {completionPercentage}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Evolução da esteira: <strong className="text-slate-700 dark:text-slate-300 font-mono">{workflowProgressScore}%</strong>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('demandas')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#142142] dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-xs border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              title="Abrir quadro Kanban completo"
            >
              <span>Ver Kanban</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Layout: Donut Chart on the Left + Multi-stage Breakdown on the Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-4">
        {/* Left Column: Compact Donut Chart */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="none"
                  onMouseEnter={(_, index) => setHoveredStage(chartPieData[index]?.id || null)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {chartPieData.map((entry) => (
                    <Cell 
                      key={`cell-${entry.id}`} 
                      fill={entry.color} 
                      className="cursor-pointer transition-opacity duration-150"
                      opacity={hoveredStage === null || hoveredStage === entry.id ? 1 : 0.4}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white font-mono leading-none">
                {totalDemands}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Demandas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              {activeCount} em fluxo
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {completedCount} finalizadas
            </span>
          </div>
        </div>

        {/* Right Column: Continuous Flow Bar & Stage Cards */}
        <div className="md:col-span-8 space-y-3.5">
          {/* Continuous Multi-segment Pipeline Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Esteira de Produção & Entregas</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {completedCount}/{totalDemands} Concluídas ({completionPercentage}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              {stagesData.map((stage) => {
                if (stage.count === 0) return null;
                return (
                  <div
                    key={`bar-${stage.id}`}
                    style={{ 
                      width: `${(stage.count / totalDemands) * 100}%`,
                      backgroundColor: stage.color,
                    }}
                    title={`${stage.name}: ${stage.count} (${stage.percent}%)`}
                    className={`h-full transition-all duration-300 cursor-pointer ${
                      hoveredStage === stage.id ? 'brightness-110 ring-1 ring-white/50' : ''
                    }`}
                    onMouseEnter={() => setHoveredStage(stage.id)}
                    onMouseLeave={() => setHoveredStage(null)}
                    onClick={() => onFilterStage && onFilterStage(selectedStage === stage.id ? null : stage.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Individual Stage Step Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
            {stagesData.map((stage) => {
              const isSelected = selectedStage === stage.id;
              const isHovered = hoveredStage === stage.id;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onFilterStage && onFilterStage(isSelected ? null : stage.id)}
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-[#fab518] shadow-xs ring-1 ring-[#fab518]/50'
                      : isHovered
                      ? 'bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs'
                      : 'bg-white/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {stage.shortName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-base font-black font-mono text-[#142142] dark:text-white">
                      {stage.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                      {stage.percent}%
                    </span>
                  </div>

                  {/* Micro Progress Track */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stage.percent}%`,
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
