import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Sparkles,
  Paperclip,
  CheckSquare,
  Kanban,
  Volume2,
  VolumeX,
  ArrowRight
} from 'lucide-react';
import { DemandItem, KanbanColumnId } from '../types';

export interface StoryClientData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  hasUpdates: boolean;
  updatesCount: number;
  demands: DemandItem[];
  domId?: string;
}

interface DemandStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyClients: StoryClientData[];
  initialClientIndex: number;
  onSelectDemand?: (demandId: string) => void;
  onMarkAsViewed?: (clientId: string) => void;
}

const getColumnColor = (columnId: KanbanColumnId) => {
  switch (columnId) {
    case 'ideias':
      return { label: 'Ideias / Briefing', bg: 'bg-red-500/20 text-red-300 border-red-500/30' };
    case 'producao':
      return { label: 'Em Produção', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'aprovacao':
      return { label: 'Aguardando Aprovação', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'agendamento':
      return { label: 'Agendamento', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'concluidas':
      return { label: 'Concluída', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    default:
      return { label: 'Em Andamento', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }
};

const getPriorityBadge = (priority: string) => {
  const p = (priority || '').toLowerCase();
  if (p === 'urgente') return { label: 'Urgente', color: 'bg-rose-500 text-white' };
  if (p === 'alta') return { label: 'Alta Prioridade', color: 'bg-amber-500 text-[#142142] font-black' };
  if (p === 'media' || p === 'média') return { label: 'Média', color: 'bg-blue-500 text-white' };
  return { label: 'Normal', color: 'bg-slate-600 text-slate-200' };
};

export const DemandStoryModal: React.FC<DemandStoryModalProps> = ({
  isOpen,
  onClose,
  storyClients,
  initialClientIndex,
  onSelectDemand,
  onMarkAsViewed,
}) => {
  const [clientIndex, setClientIndex] = useState(initialClientIndex);
  const [demandIndex, setDemandIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setClientIndex(initialClientIndex);
      setDemandIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialClientIndex]);

  const currentClient = storyClients[clientIndex];
  const clientDemands = currentClient?.demands || [];
  const currentDemand = clientDemands[demandIndex] || null;

  // Mark client as viewed when opened
  useEffect(() => {
    if (isOpen && currentClient && onMarkAsViewed) {
      onMarkAsViewed(currentClient.id);
    }
  }, [isOpen, currentClient, onMarkAsViewed]);

  const goToNextStory = useCallback(() => {
    if (!currentClient) return;

    if (demandIndex < clientDemands.length - 1) {
      setDemandIndex((prev) => prev + 1);
      setProgress(0);
    } else if (clientIndex < storyClients.length - 1) {
      setClientIndex((prev) => prev + 1);
      setDemandIndex(0);
      setProgress(0);
    } else {
      // Completed all stories
      onClose();
    }
  }, [currentClient, demandIndex, clientDemands.length, clientIndex, storyClients.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (demandIndex > 0) {
      setDemandIndex((prev) => prev - 1);
      setProgress(0);
    } else if (clientIndex > 0) {
      const prevClient = storyClients[clientIndex - 1];
      setClientIndex((prev) => prev - 1);
      setDemandIndex(Math.max(0, (prevClient?.demands.length || 1) - 1));
      setProgress(0);
    }
  }, [demandIndex, clientIndex, storyClients]);

  // Story Timer effect
  useEffect(() => {
    if (!isOpen || isPaused || !currentDemand) return;

    const DURATION = 6000; // 6 seconds per demand story
    const INTERVAL = 60; // 60ms steps
    const step = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + step;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentDemand, goToNextStory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNextStory();
      } else if (e.key === 'ArrowLeft') {
        goToPrevStory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNextStory, goToPrevStory, onClose]);

  if (!isOpen || !currentClient) return null;

  const colInfo = currentDemand ? getColumnColor(currentDemand.columnId) : { label: 'Sem demandas', bg: '' };
  const priorityBadge = currentDemand ? getPriorityBadge(currentDemand.priority) : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Outer navigation arrow left (desktop) */}
      {clientIndex > 0 || demandIndex > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevStory();
          }}
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all mr-4 cursor-pointer backdrop-blur-xs"
          title="História anterior"
        >
          <ChevronLeft size={24} />
        </button>
      ) : (
        <div className="hidden md:block w-11 mr-4" />
      )}

      {/* Main Story Phone / Card Container */}
      <div 
        className="relative w-full max-w-[420px] h-[92vh] max-h-[740px] bg-gradient-to-b from-slate-900 via-[#142142] to-slate-950 rounded-[32px] sm:rounded-[36px] overflow-hidden shadow-2xl border border-slate-700/60 flex flex-col justify-between text-white select-none"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Gradient & Progress Bar Bar */}
        <div className="p-4 sm:p-5 pb-2 relative z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Progress Bars for multiple demands of this client */}
          <div className="flex items-center gap-1.5 mb-3.5">
            {clientDemands.map((_, idx) => {
              let fillPercent = 0;
              if (idx < demandIndex) fillPercent = 100;
              else if (idx === demandIndex) fillPercent = progress;

              return (
                <div 
                  key={idx} 
                  className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
                >
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Header: Client Info & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Instagram-style Ring on Header */}
              <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
                <div className="p-0.5 bg-black rounded-full">
                  <img
                    src={currentClient.avatar}
                    alt={currentClient.name}
                    className="w-9 h-9 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white truncate max-w-[180px]" title={currentClient.name}>
                    {currentClient.name}
                  </h4>
                  {currentClient.handle && currentClient.handle !== currentClient.name && (
                    <span className="text-[10px] text-white/60 font-mono truncate max-w-[120px]">
                      @{currentClient.handle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Atualização de Demanda</span>
                  {clientDemands.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{demandIndex + 1} de {clientDemands.length}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Story Body: Clickable Left/Right Zones */}
        <div className="relative flex-1 px-5 py-3 flex flex-col justify-center overflow-y-auto">
          {/* Click zones for mobile / mouse touch */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
            onClick={goToPrevStory}
            title="Toque para voltar"
          />
          <div 
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
            onClick={goToNextStory}
            title="Toque para avançar"
          />

          {currentDemand ? (
            <div className="relative z-15 bg-white/10 backdrop-blur-md rounded-[24px] p-5 border border-white/15 shadow-xl space-y-4">
              {/* Status & Priority Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${colInfo.bg}`}>
                  {colInfo.label}
                </span>

                {priorityBadge && (
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${priorityBadge.color}`}>
                    {priorityBadge.label}
                  </span>
                )}
              </div>

              {/* Demand Title */}
              <div>
                <span className="text-xs font-bold text-[#fab518] uppercase tracking-wider block mb-1">
                  {currentDemand.serviceCategory || 'Marketing & Conteúdo'}
                </span>
                <h3 className="text-xl font-black text-white leading-snug">
                  {currentDemand.title}
                </h3>
              </div>

              {/* Description or Update Note */}
              <p className="text-xs text-white/80 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/10">
                {currentDemand.description || 'Demanda em andamento com atualizações de escopo, briefing aprovado e produção dos ativos em curso.'}
              </p>

              {/* Meta Grid: Assignee, Deadline & Deliverables */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Assignee */}
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                  <img
                    src={currentDemand.assignee?.avatar || currentClient.avatar}
                    alt={currentDemand.assignee?.name || 'Responsável'}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/50 block font-medium">Responsável</span>
                    <span className="text-xs font-bold text-white truncate block">
                      {currentDemand.assignee?.name || 'Equipe Help'}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#fab518]/20 text-[#fab518] flex items-center justify-center shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/50 block font-medium">Prazo</span>
                    <span className="text-xs font-bold text-white truncate block font-mono">
                      {currentDemand.dueDate || 'A definir'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges / Extras */}
              <div className="flex items-center gap-3 text-[11px] text-white/70 pt-1">
                {currentDemand.checklistTotal ? (
                  <div className="flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-emerald-400" />
                    <span>Checklist: {currentDemand.checklistCompleted || 0}/{currentDemand.checklistTotal}</span>
                  </div>
                ) : null}

                {currentDemand.attachmentsCount ? (
                  <div className="flex items-center gap-1.5">
                    <Paperclip size={13} className="text-[#fab518]" />
                    <span>{currentDemand.attachmentsCount} anexo(s)</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              Nenhuma demanda ativa no momento para esta conta.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 pt-2 relative z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-2">
          {currentDemand && onSelectDemand && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectDemand(currentDemand.id);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Kanban size={16} className="stroke-[2.5]" />
              <span>Ver Demanda no Kanban</span>
              <ArrowRight size={14} className="stroke-[3]" />
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-white/60 px-1 pt-1">
            <span>Toque nas laterais para navegar</span>
            <button
              type="button"
              onClick={goToNextStory}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Próxima ({clientIndex + 1}/{storyClients.length}) →
            </button>
          </div>
        </div>
      </div>

      {/* Outer navigation arrow right (desktop) */}
      {clientIndex < storyClients.length - 1 || demandIndex < clientDemands.length - 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNextStory();
          }}
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ml-4 cursor-pointer backdrop-blur-xs"
          title="Próxima história"
        >
          <ChevronRight size={24} />
        </button>
      ) : (
        <div className="hidden md:block w-11 ml-4" />
      )}
    </div>
  );
};
