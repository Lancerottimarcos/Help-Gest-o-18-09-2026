import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  ExternalLink, 
  MessageCircle, 
  Smartphone, 
  Building2, 
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Settings,
  Mail,
  RotateCcw,
  Sparkles,
  Share2,
  Clock
} from 'lucide-react';
import { DemandItem, Client, NotificationTemplateId } from '../types';
import { 
  getNotificationConfig, 
  saveNotificationConfig,
  buildNotificationMessage, 
  formatWhatsAppCleanDigits,
  NOTIFICATION_TEMPLATES 
} from '../utils/notificationSettings';
import { ApprovalNotificationConfigModal } from './ApprovalNotificationConfigModal';

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  demand: DemandItem | null;
  client?: Client | null;
  onOpenPortal: (demandId: string) => void;
  onNotificationSent?: (demandId: string) => void;
  onUpdateClientPhone?: (clientId: string, newPhone: string) => void;
}

export const WhatsAppNotificationModal: React.FC<WhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  demand,
  client,
  onOpenPortal,
  onNotificationSent,
  onUpdateClientPhone,
}) => {
  const [config, setConfig] = useState(() => getNotificationConfig());
  const [selectedTemplateId, setSelectedTemplateId] = useState<NotificationTemplateId>(config.defaultTemplateId);
  const [customPhone, setCustomPhone] = useState('');
  const [customContactName, setCustomContactName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedMessage, setIsCopiedMessage] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoOpenPreference, setAutoOpenPreference] = useState(config.autoOpenModalOnMove);

  // Initialize data whenever demand or client changes
  useEffect(() => {
    if (demand) {
      const currentConfig = getNotificationConfig();
      setConfig(currentConfig);
      setAutoOpenPreference(currentConfig.autoOpenModalOnMove);
      setSelectedTemplateId(currentConfig.defaultTemplateId);

      const resolvedPhone = client?.phone || '';
      setCustomPhone(resolvedPhone);

      const resolvedContact = client?.contactName || client?.name || demand.client;
      setCustomContactName(resolvedContact);

      const origin = window.location.origin;
      const portalUrl = `${origin}/?portal=aprovacao&demandId=${demand.id}`;

      const generated = buildNotificationMessage({
        templateId: currentConfig.defaultTemplateId,
        customTemplateText: currentConfig.customMessageTemplate,
        contactName: resolvedContact,
        clientName: client?.companyName || demand.client,
        demandTitle: demand.title,
        demandType: demand.type,
        dueDate: demand.dueDate,
        portalUrl,
        agencySignature: currentConfig.agencySignature,
      });

      setMessageText(generated);
      setIsSent(Boolean(demand.whatsappNotified));
    }
  }, [demand, client, isOpen]);

  if (!isOpen || !demand) return null;

  const origin = window.location.origin;
  const portalUrl = `${origin}/?portal=aprovacao&demandId=${demand.id}`;
  const clientName = client?.companyName || demand.client;
  const clientEmail = client?.email;

  const handleSwitchTemplate = (templateId: NotificationTemplateId) => {
    setSelectedTemplateId(templateId);
    const updated = buildNotificationMessage({
      templateId,
      customTemplateText: config.customMessageTemplate,
      contactName: customContactName,
      clientName,
      demandTitle: demand.title,
      demandType: demand.type,
      dueDate: demand.dueDate,
      portalUrl,
      agencySignature: config.agencySignature,
    });
    setMessageText(updated);
  };

  const handleResetMessage = () => {
    handleSwitchTemplate(selectedTemplateId);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setIsCopiedMessage(true);
    setTimeout(() => setIsCopiedMessage(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const cleanDigits = formatWhatsAppCleanDigits(customPhone);
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    setIsSent(true);

    // Save phone to client if configured and client exists
    if (client && customPhone && customPhone !== client.phone && onUpdateClientPhone) {
      onUpdateClientPhone(client.id, customPhone);
    }

    if (onNotificationSent) {
      onNotificationSent(demand.id);
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Demanda Pronta para Validação: ${demand.title} (${clientName})`);
    const body = encodeURIComponent(messageText);
    const mailtoUrl = `mailto:${clientEmail || ''}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleToggleAutoOpen = (checked: boolean) => {
    setAutoOpenPreference(checked);
    const updated = { ...config, autoOpenModalOnMove: checked };
    setConfig(updated);
    saveNotificationConfig(updated);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#128C7E] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white text-[#128C7E] flex items-center justify-center shadow-xs shrink-0">
                <MessageCircle size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                    Notificar Cliente no WhatsApp
                  </h3>
                  <span className="bg-[#25D366] text-[#142142] text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                    Portal de Aprovação
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 font-medium">
                  Disparo imediato da notificação com link direto para validação da demanda
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Configurações gerais de notificação"
              >
                <Settings size={17} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* Status Notification Banner */}
            {isSent ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Notificação já enviada ao cliente!</span>
                    <span className="block text-[11px] text-emerald-700 dark:text-emerald-300">
                      Você pode reenviar ou atualizar o texto a qualquer momento.
                    </span>
                  </div>
                </div>
                <span className="bg-emerald-200/60 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                  Ativa no Portal
                </span>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex items-start gap-2.5 text-amber-950 dark:text-amber-200 text-xs">
                <AlertCircle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Demanda posicionada na coluna de Aprovação.</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    Revise os dados de contato do cliente, escolha o modelo e clique em <b>Disparar no WhatsApp</b> para enviar o link direto.
                  </p>
                </div>
              </div>
            )}

            {/* Recipient & Client Card */}
            <div className="bg-[#F8F9FA] dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#fab518]" />
                  {clientName}
                </span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  {demand.type} • {demand.serviceCategory}
                </span>
              </div>

              {/* Demand Summary Row */}
              <div className="flex items-center gap-3">
                {demand.thumbnail?.trim() ? (
                  <img
                    src={demand.thumbnail}
                    alt={demand.title}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#142142] dark:text-white truncate">
                    {demand.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      Prazo: <b>{demand.dueDate}</b>
                    </span>
                    <span>•</span>
                    <span>ID: {demand.id}</span>
                  </div>
                </div>
              </div>

              {/* Contact and Phone Number Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-700">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nome do Contato / Cliente:
                  </label>
                  <input
                    type="text"
                    value={customContactName}
                    onChange={(e) => {
                      setCustomContactName(e.target.value);
                      const updated = buildNotificationMessage({
                        templateId: selectedTemplateId,
                        customTemplateText: config.customMessageTemplate,
                        contactName: e.target.value,
                        clientName,
                        demandTitle: demand.title,
                        demandType: demand.type,
                        dueDate: demand.dueDate,
                        portalUrl,
                        agencySignature: config.agencySignature,
                      });
                      setMessageText(updated);
                    }}
                    placeholder="Nome do cliente"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-normal font-sofia-regular text-[#142142] dark:text-white focus:outline-none focus:border-[#128C7E]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Telefone WhatsApp:</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+55 Brasil</span>
                  </label>
                  <div className="relative">
                    <Smartphone size={13} className="absolute left-2.5 top-2.5 text-[#128C7E]" />
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-normal font-sofia-regular text-[#142142] dark:text-white focus:outline-none focus:border-[#128C7E]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Portal Link Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#142142] dark:text-white flex items-center justify-between">
                <span>Link Direto de Validação no Portal:</span>
                <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Pronto para uso
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={portalUrl}
                  className="flex-1 bg-[#F4F5F7] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono px-3 py-2 rounded-xl focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCopiedLink
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-[#142142] dark:bg-[#fab518] hover:bg-[#142142]/90 dark:hover:bg-[#fab518]/90 text-white dark:text-[#142142]'
                  }`}
                  title="Copiar link do portal"
                >
                  {isCopiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{isCopiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            {/* Message Template Selector & Live Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#fab518]" />
                  <span>Escolha o Modelo de Mensagem:</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetMessage}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Restaurar texto padrão do modelo"
                >
                  <RotateCcw size={11} />
                  <span>Restaurar texto</span>
                </button>
              </div>

              {/* Template Pills */}
              <div className="flex flex-wrap gap-1.5">
                {NOTIFICATION_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSwitchTemplate(tpl.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#128C7E] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{tpl.label}</span>
                      <span className="text-[9px] opacity-75 uppercase font-normal">
                        ({tpl.badge})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* WhatsApp Message Preview / Editor */}
              <div className="bg-[#EFEAE2] dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-300/80 dark:border-slate-700 shadow-inner space-y-2 font-sans">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1 font-bold text-[#128C7E]">
                    <MessageCircle size={13} />
                    Prévia Editável do WhatsApp:
                  </span>
                  <span>{messageText.length} caracteres</span>
                </div>

                <textarea
                  rows={7}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs text-xs font-normal font-sofia-regular text-[#111B21] dark:text-slate-100 leading-relaxed border-l-4 border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#128C7E] resize-y"
                  placeholder="Mensagem para o WhatsApp..."
                />

                <div className="flex items-center justify-between pt-1 text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Você pode editar e adicionar observações personalizadas antes de enviar.</span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[#128C7E] dark:text-[#25D366] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopiedMessage ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isCopiedMessage ? 'Texto Copiado!' : 'Copiar Texto Completo'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Automation Setting Toggle */}
            <div className="bg-[#F8F9FA] dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Abrir esta tela automaticamente ao mover demandas para a coluna "Aprovação"
              </span>
              <input
                type="checkbox"
                checked={autoOpenPreference}
                onChange={(e) => handleToggleAutoOpen(e.target.checked)}
                className="w-4 h-4 rounded text-[#fab518] focus:ring-[#fab518] cursor-pointer accent-[#fab518]"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="bg-slate-50 dark:bg-slate-900/70 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortal(demand.id);
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Abrir o Portal como se fosse o cliente"
              >
                <ExternalLink size={13} className="text-[#142142] dark:text-white" />
                <span>Ver Portal do Cliente</span>
              </button>

              {clientEmail && (
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Enviar por E-mail"
                >
                  <Mail size={13} className="text-blue-500" />
                  <span className="hidden md:inline">E-mail</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>{isSent ? 'Reenviar no WhatsApp' : 'Disparar no WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Configuration Modal */}
      <ApprovalNotificationConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={(newCfg) => {
          setConfig(newCfg);
          setAutoOpenPreference(newCfg.autoOpenModalOnMove);
        }}
      />
    </>
  );
};
