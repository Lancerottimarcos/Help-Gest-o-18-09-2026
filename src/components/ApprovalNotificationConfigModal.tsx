import React, { useState } from 'react';
import {
  X,
  Settings,
  BellRing,
  MessageCircle,
  Mail,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { ApprovalNotificationConfig, NotificationTemplateId } from '../types';
import {
  DEFAULT_NOTIFICATION_CONFIG,
  NOTIFICATION_TEMPLATES,
  getNotificationConfig,
  saveNotificationConfig,
} from '../utils/notificationSettings';

interface ApprovalNotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (newConfig: ApprovalNotificationConfig) => void;
}

export const ApprovalNotificationConfigModal: React.FC<ApprovalNotificationConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<ApprovalNotificationConfig>(() => getNotificationConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    saveNotificationConfig(config);
    if (onConfigSaved) {
      onConfigSaved(config);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_NOTIFICATION_CONFIG });
  };

  const insertVariableTag = (tag: string) => {
    const current = config.customMessageTemplate || '';
    setConfig((prev) => ({
      ...prev,
      customMessageTemplate: `${current} ${tag}`,
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#142142] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center shadow-xs shrink-0">
              <BellRing size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Configurar Notificação de Aprovação
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                  Portal & WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Defina o comportamento ao mover demandas para a coluna de Aprovação do Cliente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Success Banner */}
          {savedSuccess && (
            <div className="bg-emerald-500 text-white p-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-md animate-in slide-in-from-top-2">
              <Check size={16} className="stroke-[3]" />
              <span>Configurações salvas com sucesso! As preferências foram atualizadas.</span>
            </div>
          )}

          {/* Section 1: Automação ao Mover Demanda */}
          <div className="bg-[#F8F9FA] dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#fab518]" />
              <span>Gatilho de Disparo Automático</span>
            </h4>

            <div className="space-y-3">
              <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#142142] dark:text-white block">
                    Abrir janela de notificação ao mover demanda para "Aprovação"
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Ao arrastar ou clicar em "Avançar" para a coluna de aprovação, abre imediatamente a tela com link do portal e mensagem pronta para o cliente.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoOpenModalOnMove}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, autoOpenModalOnMove: e.target.checked }))
                  }
                  className="w-5 h-5 mt-0.5 rounded text-[#fab518] focus:ring-[#fab518] cursor-pointer accent-[#fab518]"
                />
              </label>

              <label className="flex items-start justify-between gap-4 cursor-pointer select-none pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#142142] dark:text-white block">
                    Salvar número de WhatsApp editado no perfil do cliente
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Se você corrigir ou preencher o telefone no momento do envio, o cadastro da empresa é atualizado automaticamente.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoSavePhoneToClient}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, autoSavePhoneToClient: e.target.checked }))
                  }
                  className="w-5 h-5 mt-0.5 rounded text-[#fab518] focus:ring-[#fab518] cursor-pointer accent-[#fab518]"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Canal de Envio Preferencial */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#142142] dark:text-white">
              Canal de Envio Preferencial:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, defaultChannel: 'whatsapp' }))}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  config.defaultChannel === 'whatsapp'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#25D366] text-emerald-950 dark:text-emerald-200 ring-2 ring-[#25D366]/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <MessageCircle size={18} className="text-[#25D366]" />
                  {config.defaultChannel === 'whatsapp' && <Check size={14} className="text-[#25D366] stroke-[3]" />}
                </div>
                <span className="text-xs font-bold block">WhatsApp</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Direto via API Web</span>
              </button>

              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, defaultChannel: 'email' }))}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  config.defaultChannel === 'email'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Mail size={18} className="text-blue-500" />
                  {config.defaultChannel === 'email' && <Check size={14} className="text-blue-500 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold block">E-mail</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Notificação formal</span>
              </button>

              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, defaultChannel: 'both' }))}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  config.defaultChannel === 'both'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-[#fab518] text-amber-950 dark:text-amber-200 ring-2 ring-[#fab518]/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center -space-x-1">
                    <MessageCircle size={15} className="text-[#25D366]" />
                    <Mail size={15} className="text-blue-500" />
                  </div>
                  {config.defaultChannel === 'both' && <Check size={14} className="text-[#fab518] stroke-[3]" />}
                </div>
                <span className="text-xs font-bold block">Ambos</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">WhatsApp + E-mail</span>
              </button>
            </div>
          </div>

          {/* Section 3: Modelos de Mensagem (Templates) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#142142] dark:text-white">
                Modelo Padrão de Mensagem:
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Pode ser personalizado na hora do envio
              </span>
            </div>

            {/* Template Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {NOTIFICATION_TEMPLATES.map((preset) => {
                const isSelected = config.defaultTemplateId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        defaultTemplateId: preset.id,
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] border-[#142142] dark:border-[#fab518] shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold truncate">{preset.label}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#142142]'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {preset.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] line-clamp-2 ${
                        isSelected ? 'text-slate-200 dark:text-[#142142]/80' : 'text-slate-400'
                      }`}
                    >
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Template Editor if 'custom' is selected */}
            {config.defaultTemplateId === 'custom' && (
              <div className="space-y-2 bg-[#F8F9FA] dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#142142] dark:text-white">
                    Editor de Mensagem Personalizada:
                  </span>
                  <span className="text-[10px] text-slate-400">Clique para inserir variáveis</span>
                </div>

                {/* Variable tags */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{contato}',
                    '{cliente}',
                    '{demanda}',
                    '{tipo}',
                    '{link_portal}',
                    '{prazo}',
                    '{agencia}',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariableTag(tag)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-[#fab518]/20 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10.5px] font-mono rounded-lg transition-colors cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={5}
                  value={config.customMessageTemplate || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      customMessageTemplate: e.target.value,
                    }))
                  }
                  placeholder="Escreva seu modelo customizado com as tags acima..."
                  className="w-full bg-white dark:bg-slate-900 text-xs font-normal font-sofia-regular text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none"
                />
              </div>
            )}

            {/* Template Preview Box for built-in templates */}
            {config.defaultTemplateId !== 'custom' && (
              <div className="bg-[#EFEAE2] dark:bg-slate-900/80 rounded-2xl p-3 sm:p-4 border border-slate-300/80 dark:border-slate-700">
                <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Prévia da Estrutura do Texto:
                </span>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-2xs text-xs text-[#111B21] dark:text-slate-100 whitespace-pre-wrap leading-relaxed border-l-4 border-[#25D366] font-normal font-sofia-regular">
                  {NOTIFICATION_TEMPLATES.find((p) => p.id === config.defaultTemplateId)?.template}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Assinatura da Agência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
                Assinatura da Agência na Mensagem:
              </label>
              <input
                type="text"
                value={config.agencySignature}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, agencySignature: e.target.value }))
                }
                placeholder="Ex: Equipe Help Agência Digital"
                className="w-full bg-[#F4F5F7] dark:bg-slate-800 text-xs font-normal font-sofia-regular text-[#142142] dark:text-white px-3 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
              <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                O link do Portal do Cliente gerado não exige cadastro prévio nem senha complicada. O cliente pode aprovar ou solicitar ajustes direto do celular.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/80 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Restaurar Padrões</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] rounded-full text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check size={14} className="stroke-[3]" />
              <span>Salvar Preferências</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
