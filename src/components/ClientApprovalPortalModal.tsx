import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  Send, 
  Building2, 
  Calendar, 
  Clock, 
  Layers, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Sparkles,
  MessageSquare,
  Maximize2,
  Film,
  Image as ImageIcon,
  Share2,
  Download
} from 'lucide-react';
import { DemandItem, Client } from '../types';
import { detectAndSanitizeInput } from '../utils/securityProtocols';

interface ClientApprovalPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  demand: DemandItem | null;
  client?: Client | null;
  onApprove: (demandId: string) => void;
  onReject: (demandId: string, reason?: string) => void;
  onRequestChange: (demandId: string, feedback: string) => void;
}

export const ClientApprovalPortalModal: React.FC<ClientApprovalPortalModalProps> = ({
  isOpen,
  onClose,
  demand,
  client,
  onApprove,
  onReject,
  onRequestChange,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isChangeFormOpen, setIsChangeFormOpen] = useState(false);
  const [changeText, setChangeText] = useState('');
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!isOpen || !demand) return null;

  const contactName = client?.contactName || client?.name || 'Cliente';
  const clientCompany = client?.companyName || demand.client;

  // Gather media attachments
  const mediaItems = (demand.attachments || []).filter(
    (a) => a.type === 'image' || a.type === 'video'
  );

  // Fallback to thumbnail if no attachments array
  const effectiveMedia = mediaItems.length > 0 
    ? mediaItems 
    : (demand.thumbnail ? [{
        id: 'thumb-1',
        name: `${demand.title}.jpg`,
        size: 1024 * 1024,
        type: 'image',
        url: demand.thumbnail,
        uploadedAt: 'Versão para aprovação',
      }] : []);

  const currentMedia = effectiveMedia[activeMediaIndex] || effectiveMedia[0] || null;

  const handleApproveClick = () => {
    onApprove(demand.id);
    setActionSuccessMessage('Material Aprovado com sucesso! A equipe da agência já foi notificada para prosseguir com o agendamento e publicação.');
    setIsChangeFormOpen(false);
    setIsRejectConfirmOpen(false);
  };

  const handleRejectClick = () => {
    const rawReason = rejectReason.trim();
    const sanitizedReason = rawReason ? detectAndSanitizeInput(rawReason, 'Modal de Aprovação: Motivo Reprovação').sanitized : undefined;
    onReject(demand.id, sanitizedReason);
    setActionSuccessMessage('Demanda marcada como Reprovada. A equipe criativa foi notificada para revisar a proposta.');
    setIsRejectConfirmOpen(false);
  };

  const handleSubmitChange = (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = changeText.trim();
    if (!rawText) return;

    const sanitizedFeedback = detectAndSanitizeInput(rawText, 'Modal de Aprovação: Solicitação de Ajuste').sanitized;
    onRequestChange(demand.id, sanitizedFeedback);
    setActionSuccessMessage('Sua solicitação de alteração foi enviada para a equipe da agência! A demanda retornou para a etapa de produção com as suas instruções.');
    setIsChangeFormOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] my-auto animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Client Portal Brand Bar */}
        <div className="bg-[#142142] text-white px-5 sm:px-7 py-4 flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
              <Building2 size={20} className="stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#fab518] uppercase tracking-wider">
                  Portal do Cliente
                </span>
                <span className="text-white/30 text-xs">•</span>
                <span className="text-xs text-slate-300 font-semibold truncate">
                  {clientCompany}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                Aprovação de Conteúdo & Mídia
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-300 hidden md:inline-block">
              Olá, <strong className="text-white">{contactName}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 w-8.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar portal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Notification / Feedback Bar if already decided */}
        {actionSuccessMessage ? (
          <div className="bg-emerald-600 text-white px-5 sm:px-7 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-inner shrink-0">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-[#fab518] shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-white/80 hover:text-white text-xs underline cursor-pointer"
            >
              Fechar aviso
            </button>
          </div>
        ) : demand.approvalStatus === 'aprovado' ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 px-5 sm:px-7 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 shrink-0">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Esta demanda já foi APROVADA por você. Ela está na etapa de agendamento/publicação.</span>
          </div>
        ) : demand.approvalStatus === 'alteracao_solicitada' ? (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-5 sm:px-7 py-2.5 flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 shrink-0">
            <Edit3 size={16} className="text-amber-600 shrink-0" />
            <span>Alteração solicitada anteriormente: "{demand.approvalFeedback}"</span>
          </div>
        ) : demand.approvalStatus === 'reprovado' ? (
          <div className="bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 px-5 sm:px-7 py-2.5 flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-300 shrink-0">
            <XCircle size={16} className="text-rose-600 shrink-0" />
            <span>Esta demanda foi marcada como reprovada e está em revisão criativa pela agência.</span>
          </div>
        ) : null}

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* Demand Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#142142] text-[#fab518]">
                  {demand.type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {demand.serviceCategory}
                </span>
                <span className="text-xs text-slate-400">ID: #{demand.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white tracking-tight">
                {demand.title}
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
              <div className="flex items-center gap-1.5 bg-[#F4F5F7] dark:bg-slate-800 px-3.5 py-1.5 rounded-full">
                <Calendar size={14} className="text-[#fab518]" />
                <span>Prazo de Publicação: <strong>{demand.dueDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Visual Presentation Stage: Image or Video */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#142142] dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#fab518]" />
                <span>Material para sua Validação (Imagem ou Vídeo)</span>
              </h3>
              {effectiveMedia.length > 1 && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Mídia {activeMediaIndex + 1} de {effectiveMedia.length}
                </span>
              )}
            </div>

            {currentMedia ? (
              <div className="relative rounded-[26px] overflow-hidden bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[260px] sm:min-h-[380px] max-h-[520px]">
                {currentMedia.type === 'video' ? (
                  <video
                    src={currentMedia.url}
                    controls
                    autoPlay={false}
                    className="w-full max-h-[500px] object-contain rounded-[26px] bg-black"
                  />
                ) : (
                  <div 
                    className="relative w-full h-full flex items-center justify-center cursor-pointer group"
                    onClick={() => currentMedia.url?.trim() && setLightboxUrl(currentMedia.url)}
                  >
                    {currentMedia.url?.trim() ? (
                      <img
                        src={currentMedia.url}
                        alt={demand.title}
                        className="w-full max-h-[500px] object-contain rounded-[26px] transition-transform duration-300 group-hover:scale-[1.01]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-[260px] flex items-center justify-center text-slate-400">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[26px]">
                      <span className="px-4 py-2 bg-white/95 text-[#142142] text-xs font-bold rounded-full shadow-lg flex items-center gap-2">
                        <Eye size={15} />
                        Clique para Ampliar a Imagem
                      </span>
                    </div>
                  </div>
                )}

                {/* Badges on preview */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-[#142142]/90 text-white backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                    {currentMedia.type === 'video' ? <Film size={13} className="text-[#fab518]" /> : <ImageIcon size={13} className="text-[#fab518]" />}
                    {currentMedia.type === 'video' ? 'Vídeo Final' : 'Arte Final'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white/90 backdrop-blur-xs max-w-[200px] truncate">
                    {currentMedia.name}
                  </span>
                </div>

                {/* Top right zoom button */}
                {currentMedia.type === 'image' && (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(currentMedia.url)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    title="Ver em tela cheia"
                  >
                    <Maximize2 size={15} />
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-[26px] border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-8 text-center text-slate-500 dark:text-slate-400">
                <ImageIcon size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="font-bold text-sm text-[#142142] dark:text-white">Material em renderização final</p>
                <p className="text-xs mt-1">Consulte o descritivo abaixo enquanto a mídia é carregada.</p>
              </div>
            )}

            {/* Media strip if multiple files */}
            {effectiveMedia.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {effectiveMedia.map((media, idx) => (
                  <button
                    key={media.id || idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative h-14 w-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeMediaIndex === idx 
                        ? 'border-[#fab518] ring-2 ring-[#fab518]/30 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white">
                        <Film size={16} className="text-[#fab518]" />
                      </div>
                    ) : media.url?.trim() ? (
                      <img src={media.url} alt={media.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Campaign Briefing */}
          <div className="bg-[#F8F9FA] dark:bg-slate-800/60 rounded-[26px] border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-2">
            <h4 className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider">
              Orientações & Descrição do Conteúdo
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
              {demand.description || 'Peça desenvolvida conforme o planejamento editorial aprovado para a marca.'}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* THE 3 REQUIRED APPROVAL ACTIONS: Aprovado, Reprovado e Fazer Alteração   */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/80 rounded-[26px] border-2 border-slate-200/90 dark:border-slate-700 p-4 sm:p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#142142] dark:text-white tracking-tight">
                Qual a sua avaliação sobre este material?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selecione uma das opções abaixo para registrar a sua decisão diretamente no sistema da agência:
              </p>
            </div>

            {/* 3 Main Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Aprovado */}
              <button
                type="button"
                onClick={handleApproveClick}
                className={`py-3.5 px-4 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer border ${
                  demand.approvalStatus === 'aprovado'
                    ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border-emerald-600 hover:shadow-md'
                }`}
              >
                <CheckCircle2 size={18} />
                <span>Aprovado</span>
              </button>

              {/* Option 2: Reprovado */}
              <button
                type="button"
                onClick={() => {
                  setIsRejectConfirmOpen(!isRejectConfirmOpen);
                  setIsChangeFormOpen(false);
                }}
                className={`py-3.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  demand.approvalStatus === 'reprovado'
                    ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                <XCircle size={18} />
                <span>Reprovado</span>
              </button>

              {/* Option 3: Fazer Alteração */}
              <button
                type="button"
                onClick={() => {
                  setIsChangeFormOpen(!isChangeFormOpen);
                  setIsRejectConfirmOpen(false);
                }}
                className={`py-3.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isChangeFormOpen || demand.approvalStatus === 'alteracao_solicitada'
                    ? 'bg-[#fab518] text-[#142142] border-[#fab518] ring-2 ring-[#fab518]/40 shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-95 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                <Edit3 size={18} />
                <span>Fazer Alteração</span>
              </button>
            </div>

            {/* EXPANDABLE FORM: Reprovação confirmation */}
            {isRejectConfirmOpen && (
              <div className="bg-rose-50/80 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-800 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Confirmar Reprovação do Conteúdo
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                      Ao reprovar, a demanda voltará imediatamente para a fila de produção da agência para reestruturação total.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                    Motivo da Reprovação (opcional):
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ex: Fora do posicionamento da marca, conceito desalinhado com o evento..."
                    className="w-full bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRejectConfirmOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectClick}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Confirmar Reprovação
                  </button>
                </div>
              </div>
            )}

            {/* EXPANDABLE FORM: CAMPO PARA DIGITAR A ALTERAÇÃO (Required by user!) */}
            {isChangeFormOpen && (
              <form onSubmit={handleSubmitChange} className="bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800 space-y-3.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <Edit3 size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Instruções de Alteração para a Equipe Criativa
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Descreva o que deve ser modificado na arte, texto ou formato. A demanda retornará para produção com suas notas.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1.5">
                    O que você gostaria de alterar? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={changeText}
                    onChange={(e) => setChangeText(e.target.value)}
                    placeholder="Ex: 
- Trocar a foto principal pela foto do produto na cor preta
- Ajustar a data no rodapé para 'Sexta-feira, 20h'
- Deixar o logotipo um pouco menor no canto superior direito..."
                    className="w-full bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-[#142142] dark:text-slate-100 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/30 focus:outline-none transition-all leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>💡 Seja o mais específico possível para acelerar a entrega da nova versão.</span>
                    <span>{changeText.length} caracteres</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChangeFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!changeText.trim()}
                    className="px-5 py-2.5 bg-[#142142] dark:bg-[#fab518] hover:bg-[#142142]/90 dark:hover:bg-[#fab518]/90 disabled:opacity-40 text-white dark:text-[#142142] text-xs font-extrabold rounded-full flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Enviar Alterações para a Equipe</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/70 px-5 sm:px-7 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ambiente seguro do Portal do Cliente • Validação em tempo real</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#142142] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Fechar Portal
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom Preview for Images */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            {lightboxUrl?.trim() ? (
              <img 
                src={lightboxUrl} 
                alt="Ampliação" 
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-white text-sm">Mídia não disponível</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
