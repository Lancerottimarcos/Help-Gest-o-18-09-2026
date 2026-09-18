import React, { useState } from 'react';
import { 
  X, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpToLine,
  RotateCcw, 
  Check, 
  Sparkles, 
  SlidersHorizontal,
  Calendar,
  Layers,
  Cake,
  Clock,
  MapPin,
  Kanban,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
  HelpCircle
} from 'lucide-react';
import { InicioSectionId, InicioSectionMeta } from '../types';

export interface DashboardCustomizerPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  order: InicioSectionId[];
  hidden: InicioSectionId[];
}

export const DASHBOARD_PRESETS: DashboardCustomizerPreset[] = [
  {
    id: 'padrao',
    name: 'Completo (Padrão)',
    badge: '6 seções',
    description: 'Todas as seções visíveis no fluxo balanceado',
    order: ['welcome', 'indicadores', 'aniversariantes', 'atividades', 'mapa', 'prioridades'],
    hidden: [],
  },
  {
    id: 'operacional',
    name: 'Foco Operacional',
    badge: '4 seções',
    description: 'Prioriza indicadores, prazos de kanban e atividades de produção',
    order: ['indicadores', 'prioridades', 'atividades', 'welcome', 'aniversariantes', 'mapa'],
    hidden: ['aniversariantes', 'mapa'],
  },
  {
    id: 'crm',
    name: 'Gestão & Clientes',
    badge: '5 seções',
    description: 'Foco em relacionamento, aniversariantes e mapa de clientes',
    order: ['welcome', 'indicadores', 'aniversariantes', 'mapa', 'atividades', 'prioridades'],
    hidden: ['prioridades'],
  },
  {
    id: 'essencial',
    name: 'Visão Compacta',
    badge: '3 seções',
    description: 'Apenas boas-vindas, KPIs e status prioritários',
    order: ['welcome', 'indicadores', 'prioridades', 'atividades', 'aniversariantes', 'mapa'],
    hidden: ['atividades', 'aniversariantes', 'mapa'],
  },
];

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionsOrder: InicioSectionId[];
  hiddenSections: InicioSectionId[];
  onReorder: (newOrder: InicioSectionId[]) => void;
  onToggleVisibility: (sectionId: InicioSectionId) => void;
  onApplyPreset: (preset: DashboardCustomizerPreset) => void;
  onResetDefault: () => void;
  onShowAll: () => void;
  sectionsMeta: Record<InicioSectionId, InicioSectionMeta>;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  sectionsOrder,
  hiddenSections,
  onReorder,
  onToggleVisibility,
  onApplyPreset,
  onResetDefault,
  onShowAll,
  sectionsMeta,
}) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'presets'>('sections');

  if (!isOpen) return null;

  const visibleCount = sectionsOrder.length - hiddenSections.length;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionsOrder.length) return;

    const newOrder = [...sectionsOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    onReorder(newOrder);
  };

  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    const newOrder = [...sectionsOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.unshift(moved);
    onReorder(newOrder);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...sectionsOrder];
    const [draggedItem] = newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    onReorder(newOrder);

    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const isPresetActive = (preset: DashboardCustomizerPreset) => {
    if (preset.hidden.length !== hiddenSections.length) return false;
    const allHiddenMatch = preset.hidden.every(id => hiddenSections.includes(id));
    if (!allHiddenMatch) return false;
    // Check first 3 visible items order
    const currentVisible = sectionsOrder.filter(id => !hiddenSections.includes(id));
    const presetVisible = preset.order.filter(id => !preset.hidden.includes(id));
    return currentVisible.join(',') === presetVisible.join(',');
  };

  const renderIcon = (id: InicioSectionId) => {
    switch (id) {
      case 'welcome':
        return <Calendar size={18} className="text-[#fab518]" />;
      case 'indicadores':
        return <Layers size={18} className="text-blue-500" />;
      case 'aniversariantes':
        return <Cake size={18} className="text-amber-500" />;
      case 'atividades':
        return <Clock size={18} className="text-emerald-500" />;
      case 'mapa':
        return <MapPin size={18} className="text-purple-500" />;
      case 'prioridades':
        return <Kanban size={18} className="text-[#142142] dark:text-[#fab518]" />;
      default:
        return <Sparkles size={18} className="text-slate-400" />;
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-[28px] max-w-xl w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#fab518] flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-900/40">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#142142] dark:text-white">
                  Personalizar Painel Início
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#fab518]/15 text-[#fab518] border border-[#fab518]/30">
                  {visibleCount} de {sectionsOrder.length} visíveis
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alterne a visibilidade, reordene ou selecione um modelo pronto
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-dashboard-customizer"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/20 dark:bg-slate-900/20 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sections'
                  ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Organização Livre ({sectionsOrder.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <Zap size={13} className="text-amber-500" />
              <span>Modelos Prontos</span>
            </button>
          </div>

          {hiddenSections.length > 0 && activeTab === 'sections' && (
            <button
              type="button"
              onClick={onShowAll}
              className="text-[11px] font-bold text-slate-500 hover:text-[#fab518] flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[#fab518]/10"
              title="Exibir todas as seções"
            >
              <Eye size={12} />
              <span>Exibir todas ({hiddenSections.length} ocultas)</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {activeTab === 'presets' ? (
            /* Presets Grid */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                <Sparkles size={16} className="text-[#fab518] shrink-0 mt-0.5" />
                <span>
                  Escolha um perfil para reconfigurar automaticamente a ordem e a visibilidade das seções com apenas um clique.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DASHBOARD_PRESETS.map((preset) => {
                  const isActive = isPresetActive(preset);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => onApplyPreset(preset)}
                      className={`
                        p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group text-left
                        ${isActive
                          ? 'border-[#fab518] bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-[#fab518]/30 shadow-xs'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
                        }
                      `}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-black text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors">
                            {preset.name}
                          </h4>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} />
                              Ativo
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 text-[10px]">
                          {preset.hidden.length === 0 ? 'Sem seções ocultas' : `${preset.hidden.length} ${preset.hidden.length === 1 ? 'seção oculta' : 'seções ocultas'}`}
                        </span>
                        <span className="font-bold text-[#142142] dark:text-[#fab518] group-hover:underline">
                          Aplicar modelo →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Sections Reordering & Visibility List */
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Info size={16} className="text-[#fab518] shrink-0 mt-0.5" />
                <span>
                  Arraste pelo ícone de grade, use as setas para posicionar, ou clique no ícone do olho para <strong>ocultar/exibir</strong> seções.
                </span>
              </div>

              <div className="space-y-2">
                {sectionsOrder.map((sectionId, index) => {
                  const meta = sectionsMeta[sectionId];
                  const isHidden = hiddenSections.includes(sectionId);
                  const isDragging = draggedItemIndex === index;
                  const isDropTarget = dragOverIndex === index && draggedItemIndex !== index;

                  return (
                    <div
                      key={sectionId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 sm:gap-3 group select-none
                        ${isDragging ? 'opacity-30 scale-[0.98] border-dashed border-[#fab518] bg-amber-50/20' : ''}
                        ${isDropTarget ? 'border-[#fab518] ring-2 ring-[#fab518]/40 bg-[#fab518]/5' : ''}
                        ${isHidden 
                          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60' 
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                        }
                      `}
                    >
                      {/* Left: Drag Handle, Icon, Title, Description */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div 
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0"
                          title="Arraste para mover"
                        >
                          <GripVertical size={16} />
                        </div>

                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isHidden ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-slate-100 dark:bg-slate-700/70'
                        }`}>
                          {renderIcon(sectionId)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded shrink-0 ${
                              isHidden 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {isHidden ? 'Oculta' : `#${index + 1}`}
                            </span>
                            <h4 className={`text-xs font-bold truncate ${
                              isHidden ? 'text-slate-400 line-through' : 'text-[#142142] dark:text-white'
                            }`}>
                              {meta ? meta.title : sectionId}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {meta ? meta.description : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Visibility Toggle & Order Controls */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Visibility Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onToggleVisibility(sectionId)}
                          disabled={!isHidden && visibleCount <= 1}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                            isHidden
                              ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#fab518] hover:border-[#fab518]/50 bg-slate-100/60 dark:bg-slate-800'
                              : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60'
                          } ${!isHidden && visibleCount <= 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                          title={
                            !isHidden && visibleCount <= 1 
                              ? 'Pelo menos uma seção deve permanecer visível' 
                              : isHidden ? 'Exibir no painel' : 'Ocultar do painel'
                          }
                          aria-label={isHidden ? 'Exibir seção' : 'Ocultar seção'}
                        >
                          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>

                        {/* Move To Top Button */}
                        <button
                          type="button"
                          disabled={index === 0 || isHidden}
                          onClick={() => handleMoveToTop(index)}
                          className={`hidden sm:flex p-1.5 rounded-xl border transition-colors ${
                            index === 0 || isHidden
                              ? 'opacity-25 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[#142142] cursor-pointer'
                          }`}
                          title="Mover para o início (topo)"
                          aria-label="Mover para o topo"
                        >
                          <ArrowUpToLine size={13} />
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            index === 0
                              ? 'opacity-25 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                          }`}
                          title="Mover para cima"
                          aria-label="Mover para cima"
                        >
                          <ArrowUp size={13} />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === sectionsOrder.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            index === sectionsOrder.length - 1
                              ? 'opacity-25 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                          }`}
                          title="Mover para baixo"
                          aria-label="Mover para baixo"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            id="btn-reset-dashboard-order-modal"
            onClick={onResetDefault}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Restaurar Padrão</span>
            <span className="sm:hidden">Restaurar</span>
          </button>

          <button
            type="button"
            id="btn-confirm-dashboard-customizer"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1.5"
          >
            <Check size={14} className="stroke-[3]" />
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
