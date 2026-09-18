import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Shield,
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  BrowserNotificationPreferences,
  sendTestNotification,
  playNotificationSound
} from '../utils/browserNotifications';

export const BrowserNotificationSettingsCard: React.FC = () => {
  const [supported] = useState<boolean>(() => isNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermission()
  );
  const [prefs, setPrefs] = useState<BrowserNotificationPreferences>(() =>
    getNotificationPreferences()
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  const refreshStatus = () => {
    setPermission(getNotificationPermission());
    setPrefs(getNotificationPreferences());
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') {
        const updated = saveNotificationPreferences({ enabled: true });
        setPrefs(updated);
        // Play approval test chime to celebrate
        playNotificationSound('approval');
        setTestSentMessage('Permissão concedida com sucesso! Notificações do sistema ativadas.');
      } else if (result === 'denied') {
        setTestSentMessage('O navegador bloqueou as notificações. Você pode desbloquear clicando no ícone de cadeado na barra de endereços.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequesting(false);
      setTimeout(() => setTestSentMessage(null), 7000);
    }
  };

  const handleTogglePref = (key: keyof BrowserNotificationPreferences) => {
    const updated = saveNotificationPreferences({ [key]: !prefs[key] });
    setPrefs(updated);
  };

  const handleSendTest = (type: 'approval' | 'rejection') => {
    sendTestNotification(type);
    setTestSentMessage(
      type === 'approval'
        ? 'Notificação de teste de APROVAÇÃO enviada!'
        : 'Notificação de teste de REPROVAÇÃO enviada!'
    );
    setTimeout(() => setTestSentMessage(null), 5000);
  };

  const isPermissionGranted = permission === 'granted';
  const isPermissionDenied = permission === 'denied';

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold shrink-0">
            <BellRing size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-[#142142] dark:text-white">
                API de Notificações do Navegador (Web Notifications)
              </h4>
              {isPermissionGranted ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Ativo no Navegador
                </span>
              ) : isPermissionDenied ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <XCircle size={11} />
                  Bloqueado
                </span>
              ) : (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle size={11} />
                  Aguardando Permissão
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Receba alertas nativos no computador ou celular assim que um cliente aprovar ou reprovar qualquer material no portal.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshStatus}
          title="Verificar status atual"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Notice Message if test fired */}
      {testSentMessage && (
        <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
          <p className="font-semibold text-[11px] leading-snug">{testSentMessage}</p>
        </div>
      )}

      {/* Permission Status Box */}
      {!isPermissionGranted && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-3 ${
            isPermissionDenied
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {isPermissionDenied ? (
              <XCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {isPermissionDenied
                  ? 'Permissão de notificação negada pelo navegador'
                  : 'Autorize o Help Ideias Digitais a emitir notificações'}
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {isPermissionDenied
                  ? 'Para receber os alertas mesmo com o painel em segundo plano ou em outra aba, clique no ícone de ajustes/cadeado na barra de endereços do seu navegador e permita "Notificações".'
                  : 'Ao autorizar, você será avisado instantaneamente com som e pop-up do sistema operacional quando os clientes responderem.'}
              </p>
            </div>
          </div>

          {!isPermissionDenied && (
            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                id="btn-request-notification-perm"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-4 py-2 rounded-xl bg-[#142142] dark:bg-[#fab518] hover:bg-[#1c2c54] dark:hover:bg-[#fab518]/90 text-white dark:text-[#142142] text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Bell size={14} />
                <span>{isRequesting ? 'Solicitando...' : 'Conceder Permissão Agora'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toggles & Preferences */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Toggle: Aprovado */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142142] dark:text-white">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Alertar ao Aprovar</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Notifica com som alegre e move o card para Agendamento
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTogglePref('notifyOnApproval')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              prefs.notifyOnApproval ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                prefs.notifyOnApproval ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Toggle: Reprovado */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142142] dark:text-white">
              <XCircle size={14} className="text-rose-500" />
              <span>Alertar ao Reprovar</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Avisa imediatamente com motivo para rápida revisão
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTogglePref('notifyOnRejection')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              prefs.notifyOnRejection ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                prefs.notifyOnRejection ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Toggle: Alteração Solicitada */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142142] dark:text-white">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Alertar ao Pedir Ajustes</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Notifica com as instruções digitadas pelo cliente
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTogglePref('notifyOnChangeRequest')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              prefs.notifyOnChangeRequest ? 'bg-[#fab518]' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                prefs.notifyOnChangeRequest ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Toggle: Sound Chime */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142142] dark:text-white">
              {prefs.sound ? (
                <Volume2 size={14} className="text-cyan-500" />
              ) : (
                <VolumeX size={14} className="text-slate-400" />
              )}
              <span>Efeitos Sonoros (Sintetizador Web Audio)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Toca acorde harmônico suave sem carregar arquivos externos
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTogglePref('sound')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              prefs.sound ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                prefs.sound ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Test Buttons Row */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400 font-medium">
          Teste o alerta nativo e os acordes sonoros:
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-test-approval-notification"
            onClick={() => handleSendTest('approval')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-emerald-200 dark:border-emerald-800"
          >
            <Play size={12} className="fill-emerald-600 text-emerald-600" />
            <span>Testar Aprovação</span>
          </button>

          <button
            type="button"
            id="btn-test-rejection-notification"
            onClick={() => handleSendTest('rejection')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-rose-200 dark:border-rose-800"
          >
            <Play size={12} className="fill-rose-600 text-rose-600" />
            <span>Testar Reprovação</span>
          </button>
        </div>
      </div>
    </div>
  );
};
