import React from 'react';
import { AlertTriangle, Calendar, Clock, Trash2, X } from 'lucide-react';
import { AgencyAppointment } from '../types';

interface AgendaDeleteConfirmModalProps {
  isOpen: boolean;
  appointment: AgencyAppointment | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const AgendaDeleteConfirmModal: React.FC<AgendaDeleteConfirmModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !appointment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142142]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 id="delete-modal-title" className="text-base font-bold text-[#142142] dark:text-white">
                Excluir Compromisso da Agenda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta ação removerá o agendamento permanentemente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Appointment Details Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <p className="text-sm font-bold text-[#142142] dark:text-white line-clamp-1">
            {appointment.title}
          </p>

          {appointment.clientName && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-400">Cliente:</span> {appointment.clientName}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#fab518]" />
              {appointment.startDate.split('-').reverse().join('/')}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#fab518]" />
              {appointment.startTime} - {appointment.endTime}
            </span>
          </div>

          {appointment.syncedWithGoogle && (
            <div className="text-[11px] text-amber-700 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
              ⚠️ O evento também será cancelado e excluído do seu <strong>Google Calendar</strong> oficial.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Excluir do Google Calendar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
