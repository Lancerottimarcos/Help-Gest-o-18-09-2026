import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  MessageSquare, 
  Layers, 
  TrendingUp, 
  UploadCloud, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  Zap,
  ChevronRight,
  Building2,
  UserCheck
} from 'lucide-react';
import { ClientActivity, PageId } from '../types';

interface RecentClientActivityFeedProps {
  activities: ClientActivity[];
  onNavigate: (page: PageId) => void;
  onSelectDemand?: (demandId: string) => void;
}

export const RecentClientActivityFeed: React.FC<RecentClientActivityFeedProps> = ({
  activities,
  onNavigate,
  onSelectDemand,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Limit to recent updates (max 5)
  const recentActivities = activities.slice(0, 6);

  const filteredActivities = filterType === 'all'
    ? recentActivities
    : recentActivities.filter((a) => {
        if (filterType === 'client_approval') return a.type === 'client_approval';
        if (filterType === 'status_changed') return a.type === 'status_changed' || a.type === 'demand_created';
        if (filterType === 'campaign_update') return a.type === 'campaign_update';
        if (filterType === 'comment_feedback') return a.type === 'comment_feedback' || a.type === 'deliverable_uploaded';
        return true;
      });

  const getActivityConfig = (type: ClientActivity['type']) => {
    switch (type) {
      case 'client_approval':
        return {
          icon: <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />,
          nodeBg: 'bg-emerald-500',
          ringColor: 'ring-emerald-200 dark:ring-emerald-900/60',
          haloBg: 'bg-emerald-50 dark:bg-emerald-950/50',
          label: 'Aprovação de Arte',
        };
      case 'campaign_update':
        return {
          icon: <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />,
          nodeBg: 'bg-blue-500',
          ringColor: 'ring-blue-200 dark:ring-blue-900/60',
          haloBg: 'bg-blue-50 dark:bg-blue-950/50',
          label: 'Otimização de Tráfego',
        };
      case 'status_changed':
        return {
          icon: <Layers size={16} className="text-amber-600 dark:text-[#fab518]" />,
          nodeBg: 'bg-[#fab518]',
          ringColor: 'ring-amber-200 dark:ring-amber-900/60',
          haloBg: 'bg-amber-50 dark:bg-amber-950/50',
          label: 'Etapa do Kanban',
        };
      case 'comment_feedback':
        return {
          icon: <MessageSquare size={16} className="text-purple-600 dark:text-purple-400" />,
          nodeBg: 'bg-purple-500',
          ringColor: 'ring-purple-200 dark:ring-purple-900/60',
          haloBg: 'bg-purple-50 dark:bg-purple-950/50',
          label: 'Feedback do Cliente',
        };
      case 'deliverable_uploaded':
        return {
          icon: <UploadCloud size={16} className="text-indigo-600 dark:text-indigo-400" />,
          nodeBg: 'bg-indigo-500',
          ringColor: 'ring-indigo-200 dark:ring-indigo-900/60',
          haloBg: 'bg-indigo-50 dark:bg-indigo-950/50',
          label: 'Entrega de Arquivo',
        };
      default:
        return {
          icon: <Activity size={16} className="text-slate-600 dark:text-slate-400" />,
          nodeBg: 'bg-slate-500',
          ringColor: 'ring-slate-200 dark:ring-slate-800',
          haloBg: 'bg-slate-50 dark:bg-slate-800/50',
          label: 'Atualização',
        };
    }
  };

  return (
    <section 
      id="recent-client-activity-section" 
      aria-label="Ritmo das Atividades Recentes"
      className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5"
    >
      {/* Header Section with Live Pulse & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#142142] text-[#fab518] flex items-center justify-center shadow-xs border border-slate-200/40 dark:border-slate-700 shrink-0">
            <Zap size={20} className="fill-[#fab518]/30" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
                Ritmo das Atividades
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Fluxo em Tempo Real</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Linha do tempo contínua de aprovações de clientes, entregas e movimentações no Kanban.
            </p>
          </div>
        </div>

        {/* Quick actions button to Kanban */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('demandas')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-[#142142] dark:text-white hover:bg-[#fab518] hover:text-[#142142] dark:hover:bg-[#fab518] dark:hover:text-[#142142] transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <span>Ver Quadro Kanban</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Rhythmic Micro-Metrics & Cadence Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 bg-[#F8F9FA] dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Aprovações</span>
            <span className="text-xs font-extrabold text-[#142142] dark:text-white">100% sem ressalvas</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-[#fab518]" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Tempo Médio</span>
            <span className="text-xs font-extrabold text-[#142142] dark:text-white">~38 minutos</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Campanhas</span>
            <span className="text-xs font-extrabold text-[#142142] dark:text-white">Tráfego Ativo</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Ritmo</span>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Em Alta Produção</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Todas as Atividades', count: recentActivities.length },
          { id: 'client_approval', label: 'Aprovações', count: recentActivities.filter(a => a.type === 'client_approval').length },
          { id: 'status_changed', label: 'Kanban & Produção', count: recentActivities.filter(a => a.type === 'status_changed' || a.type === 'demand_created').length },
          { id: 'campaign_update', label: 'Tráfego & Campanhas', count: recentActivities.filter(a => a.type === 'campaign_update').length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === tab.id
                ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                filterType === tab.id
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#142142]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Timeline Stream with Connecting Rail */}
      {filteredActivities.length === 0 ? (
        <div className="py-10 px-6 text-center bg-[#FBFBFC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#fab518] flex items-center justify-center mx-auto">
            <Zap size={20} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-[#142142] dark:text-white">
              Nenhuma atividade recente registrada
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conforme você cadastrar clientes, criar demandas e movimentar tarefas no Kanban, as atualizações aparecerão aqui em tempo real.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#fab518] before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
          {filteredActivities.map((activity, index) => {
          const config = getActivityConfig(activity.type);

          return (
            <div
              key={activity.id}
              id={`activity-item-${activity.id}`}
              onClick={() => {
                if (activity.demandId && onSelectDemand) {
                  onSelectDemand(activity.demandId);
                } else {
                  onNavigate('demandas');
                }
              }}
              className="relative group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
            >
              {/* Timeline Indicator Node */}
              <div className="absolute -left-6 sm:-left-8 top-4 flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full ${config.haloBg} ring-2 ${config.ringColor} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform bg-white dark:bg-[#0f172a]`}>
                  {config.icon}
                </div>
              </div>

              {/* Activity Card */}
              <div className="bg-[#FBFBFC] dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#fab518]/70 dark:hover:border-[#fab518]/70 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3">
                {/* Top Row: Client Badge, Demand Link, Status Badge, Relative Time */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {/* Client Chip */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      {activity.clientAvatar?.trim() ? (
                        <img
                          src={activity.clientAvatar}
                          alt={activity.clientName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 size={12} className="text-[#fab518]" />
                      )}
                      <span className="text-xs font-black text-[#142142] dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
                        {activity.clientName}
                      </span>
                    </div>

                    {/* Context / Project Tag */}
                    {activity.projectOrCampaign && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden md:inline truncate max-w-[200px]">
                        • {activity.projectOrCampaign}
                      </span>
                    )}

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        activity.badge.bgClass
                      } ${activity.badge.textClass} ${activity.badge.borderClass || 'border-transparent'} shadow-2xs`}
                    >
                      {activity.badge.label}
                    </span>
                  </div>

                  {/* Relative Timestamp */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 bg-white/70 dark:bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                    <Clock size={12} className="text-slate-400" />
                    <span>{activity.relativeTime}</span>
                  </div>
                </div>

                {/* Middle Row: Demand Title */}
                <div>
                  <h4 className="text-sm font-extrabold text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors flex items-center gap-1.5">
                    <span>{activity.demandTitle}</span>
                    <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#fab518]" />
                  </h4>

                  {/* Description Box */}
                  <div className="mt-2 p-3 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {activity.description}
                  </div>
                </div>

                {/* Bottom Row: Actor & Action Affordance */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  {/* Actor details */}
                  <div className="flex items-center gap-2 min-w-0">
                    {activity.actor.avatar?.trim() ? (
                      <img
                        src={activity.actor.avatar}
                        alt={activity.actor.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#142142] text-[#fab518] text-[9px] font-bold flex items-center justify-center shrink-0">
                        {activity.actor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#142142] dark:text-slate-200 truncate block">
                        {activity.actor.name}
                      </span>
                      {activity.actor.role && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block -mt-0.5">
                          {activity.actor.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick CTA */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#142142] dark:text-[#fab518] group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>Ver no Kanban</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Footer Navigation Strip */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#fab518]" />
          <span>Ritmo operacional calibrado para alta velocidade de entrega</span>
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('clientes')}
            className="font-bold text-[#142142] dark:text-white hover:text-[#fab518] dark:hover:text-[#fab518] transition-colors cursor-pointer"
          >
            Carteira de Clientes
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={() => onNavigate('demandas')}
            className="font-bold text-[#fab518] hover:underline transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Gerenciar no Kanban</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
};
