import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  X,
  ExternalLink,
  Volume2,
  Sparkles
} from 'lucide-react';
import {
  InAppNotificationPayload,
  getNotificationPermission,
  requestNotificationPermission
} from '../utils/browserNotifications';

interface ToastItem extends InAppNotificationPayload {
  timeoutId: number;
}

interface BrowserNotificationToastProps {
  onSelectDemand?: (demandId: string) => void;
}

export const BrowserNotificationToast: React.FC<BrowserNotificationToastProps> = ({ onSelectDemand }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [permission, setPermission] = useState<string>(() => getNotificationPermission());

  useEffect(() => {
    const handleNotification = (e: any) => {
      const payload: InAppNotificationPayload = e.detail;
      if (!payload) return;

      const timeoutId = window.setTimeout(() => {
        removeToast(payload.id);
      }, 7000);

      setToasts((prev) => [
        { ...payload, timeoutId },
        ...prev.slice(0, 3), // keep max 4 toasts simultaneously
      ]);
    };

    window.addEventListener('help_manager_notification', handleNotification);
    return () => window.removeEventListener('help_manager_notification', handleNotification);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) {
        clearTimeout(target.timeoutId);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleActionClick = (toast: ToastItem) => {
    if (toast.demandId && onSelectDemand) {
      onSelectDemand(toast.demandId);
    }
    removeToast(toast.id);
  };

  const handleEnableBrowserNotifications = async () => {
    const newPerm = await requestNotificationPermission();
    setPermission(newPerm);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col gap-3 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Alertas do Navegador"
    >
      {toasts.map((toast) => {
        const isApproval = toast.type === 'approval';
        const isRejection = toast.type === 'rejection';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 transform animate-in slide-in-from-top-3 ${
              isApproval
                ? 'bg-white/95 dark:bg-[#0f172a]/95 border-emerald-500/40 text-slate-800 dark:text-slate-100 shadow-emerald-500/10'
                : isRejection
                ? 'bg-white/95 dark:bg-[#0f172a]/95 border-rose-500/40 text-slate-800 dark:text-slate-100 shadow-rose-500/10'
                : 'bg-white/95 dark:bg-[#0f172a]/95 border-amber-500/40 text-slate-800 dark:text-slate-100 shadow-amber-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon badge */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                  isApproval
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isRejection
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isApproval ? (
                  <CheckCircle2 size={22} />
                ) : isRejection ? (
                  <XCircle size={22} />
                ) : (
                  <AlertCircle size={22} />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isApproval
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : isRejection
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isApproval
                      ? 'Aprovado pelo Cliente'
                      : isRejection
                      ? 'Reprovado pelo Cliente'
                      : 'Ajuste Solicitado'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
                </div>

                <h4 className="text-xs sm:text-sm font-black text-[#142142] dark:text-white mt-1 leading-snug">
                  {toast.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {toast.body}
                </p>

                {/* Action button if demandId is present */}
                {toast.demandId && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleActionClick(toast)}
                      className={`text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        isApproval
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : isRejection
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <span>Visualizar Demanda</span>
                      <ExternalLink size={12} />
                    </button>

                    {permission !== 'granted' && (
                      <button
                        type="button"
                        onClick={handleEnableBrowserNotifications}
                        className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline font-medium cursor-pointer"
                        title="Ativar no navegador para receber com o app minimizado"
                      >
                        Ativar no Navegador
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Fechar notificação"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
