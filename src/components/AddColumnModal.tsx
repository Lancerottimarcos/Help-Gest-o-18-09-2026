import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Columns, Sparkles } from 'lucide-react';
import { KanbanColumn } from '../types';

export const COLUMN_COLOR_PRESETS = [
  { color: '#8B5CF6', buttonBg: 'bg-purple-600 hover:bg-purple-700', label: 'Roxo Violeta' },
  { color: '#3B82F6', buttonBg: 'bg-blue-600 hover:bg-blue-700', label: 'Azul Real' },
  { color: '#06B6D4', buttonBg: 'bg-cyan-600 hover:bg-cyan-700', label: 'Ciano Turquesa' },
  { color: '#10B981', buttonBg: 'bg-emerald-600 hover:bg-emerald-700', label: 'Verde Esmeralda' },
  { color: '#FAB518', buttonBg: 'bg-amber-500 hover:bg-amber-600', label: 'Âmbar Dourado' },
  { color: '#F97316', buttonBg: 'bg-orange-500 hover:bg-orange-600', label: 'Laranja Vibrante' },
  { color: '#EF4444', buttonBg: 'bg-red-500 hover:bg-red-600', label: 'Vermelho Coral' },
  { color: '#EC4899', buttonBg: 'bg-pink-600 hover:bg-pink-700', label: 'Rosa Magenta' },
  { color: '#64748B', buttonBg: 'bg-slate-500 hover:bg-slate-600', label: 'Cinza Grafite' },
  { color: '#142142', buttonBg: 'bg-[#142142] hover:bg-[#1e2f5b]', label: 'Azul Marinho' },
];

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveColumn: (column: KanbanColumn, insertBeforeConcluded?: boolean) => void;
  columnToEdit?: KanbanColumn | null;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  isOpen,
  onClose,
  onSaveColumn,
  columnToEdit,
}) => {
  const [title, setTitle] = useState(columnToEdit ? columnToEdit.title : '');
  const [selectedColorIndex, setSelectedColorIndex] = useState(() => {
    if (columnToEdit) {
      const idx = COLUMN_COLOR_PRESETS.findIndex((p) => p.color.toLowerCase() === columnToEdit.color.toLowerCase());
      return idx !== -1 ? idx : 0;
    }
    return 0; // Default Purple
  });
  const [position, setPosition] = useState<'before-concluded' | 'end'>('before-concluded');

  useEffect(() => {
    if (columnToEdit) {
      setTitle(columnToEdit.title);
      const idx = COLUMN_COLOR_PRESETS.findIndex((p) => p.color.toLowerCase() === columnToEdit.color.toLowerCase());
      setSelectedColorIndex(idx !== -1 ? idx : 0);
    } else {
      setTitle('');
      setSelectedColorIndex(0);
      setPosition('before-concluded');
    }
  }, [columnToEdit, isOpen]);

  const selectedPreset = COLUMN_COLOR_PRESETS[selectedColorIndex] || COLUMN_COLOR_PRESETS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const columnId = columnToEdit
      ? columnToEdit.id
      : `col-${title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newColumn: KanbanColumn = {
      id: columnId,
      title: title.trim(),
      count: columnToEdit ? columnToEdit.count : 0,
      color: selectedPreset.color,
      buttonBg: selectedPreset.buttonBg,
      isCustom: true,
    };

    onSaveColumn(newColumn, !columnToEdit && position === 'before-concluded');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="modal-add-column-card"
        className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center shadow-xs">
              <Columns size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
                {columnToEdit ? 'Editar Sessão' : 'Nova Sessão (Coluna)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {columnToEdit ? 'Altere o nome ou cor da etapa do fluxo' : 'Crie uma nova etapa personalizada para o quadro'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4.5">
          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1.5">
              Nome da Sessão *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Revisão Interna, Aguardando Fotos, Em Testes..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F8F9FA] dark:bg-slate-800/80 text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-2">
              Cor de Destaque
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {COLUMN_COLOR_PRESETS.map((preset, index) => {
                const isSelected = selectedColorIndex === index;
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setSelectedColorIndex(index)}
                    className={`
                      h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative
                      ${isSelected ? 'ring-2 ring-offset-2 ring-[#fab518] scale-105 shadow-xs' : 'hover:scale-102 opacity-85 hover:opacity-100'}
                    `}
                    style={{ backgroundColor: preset.color }}
                    title={preset.label}
                  >
                    {isSelected && (
                      <Check size={16} className="text-white stroke-[3] drop-shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Tom selecionado: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedPreset.label}</span>
            </p>
          </div>

          {/* Position option (only for new columns) */}
          {!columnToEdit && (
            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1.5">
                Posição no Fluxo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('before-concluded')}
                  className={`
                    p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer
                    ${
                      position === 'before-concluded'
                        ? 'border-[#fab518] bg-amber-50/70 dark:bg-amber-950/30 text-[#142142] dark:text-white font-bold ring-1 ring-[#fab518]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <span className="block font-bold">Antes de "Concluídas"</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Mantém Concluídas ao final</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('end')}
                  className={`
                    p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer
                    ${
                      position === 'end'
                        ? 'border-[#fab518] bg-amber-50/70 dark:bg-amber-950/30 text-[#142142] dark:text-white font-bold ring-1 ring-[#fab518]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <span className="block font-bold">No final do quadro</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Como última coluna</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Pré-visualização da Coluna
            </span>
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-900/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedPreset.color }}
                  />
                  <span className="text-xs font-black text-[#142142] dark:text-white">
                    {title.trim() || 'Nova Sessão'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    0
                  </span>
                </div>
              </div>

              <div
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center ${selectedPreset.buttonBg}`}
              >
                <span>+ Nova demanda</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black transition-all shadow-xs active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>{columnToEdit ? 'Salvar Alterações' : 'Criar Sessão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
