import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemType?: string; // e.g. 'demanda', 'cliente', 'serviço', 'membro da equipe', 'fatura'
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'item',
  description,
  confirmText = 'Sim, Excluir',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  const defaultTitle = title || `Excluir ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}?`;
  const defaultDescription =
    description ||
    'Esta ação é permanente e não poderá ser desfeita. Todos os dados associados serão removidos do sistema.';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#142142]/60 dark:bg-black/75 backdrop-blur-xs cursor-pointer"
            onClick={() => !isLoading && onClose()}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-[24px] sm:rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Icon */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/60">
                  <AlertTriangle size={24} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3
                    id="confirm-delete-modal-title"
                    className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight leading-snug"
                  >
                    {defaultTitle}
                  </h3>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mt-0.5">
                    Ação irreversível
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                id="btn-close-confirm-delete"
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-[#142142] dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Item Name Highlight */}
            {itemName && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    {itemType} selecionado(a)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#142142] dark:text-white truncate">
                    {itemName}
                  </p>
                </div>
              </div>
            )}

            {/* Description / Warning Message */}
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {typeof defaultDescription === 'string' ? (
                <p>{defaultDescription}</p>
              ) : (
                defaultDescription
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                id="btn-cancel-confirm-delete"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                id="btn-confirm-delete-action"
                onClick={onConfirm}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={15} />
                <span>{isLoading ? 'Excluindo...' : confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
