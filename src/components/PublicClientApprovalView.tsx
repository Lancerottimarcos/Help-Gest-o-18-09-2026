import React, { useState } from 'react';
import { 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  Building2, 
  Calendar, 
  Clock, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Sparkles,
  MessageSquare,
  Maximize2,
  Film,
  Image as ImageIcon,
  ShieldCheck,
  ArrowRight,
  Lock,
  ExternalLink
} from 'lucide-react';
import { DemandItem, Client, DemandAttachment } from '../types';
import { detectAndSanitizeInput } from '../utils/securityProtocols';

interface PublicClientApprovalViewProps {
  demandId: string;
  demands: DemandItem[];
  clients: Client[];
  onApprove: (demandId: string) => void;
  onReject: (demandId: string, reason?: string) => void;
  onRequestChange: (demandId: string, feedback: string) => void;
  onGoToAdminLogin: () => void;
}

export const PublicClientApprovalView: React.FC<PublicClientApprovalViewProps> = ({
  demandId,
  demands,
  clients,
  onApprove,
  onReject,
  onRequestChange,
  onGoToAdminLogin,
}) => {
  const demand = demands.find((d) => d.id.toLowerCase() === demandId.toLowerCase());
  const client = demand ? clients.find((c) => c.companyName === demand.client || c.name === demand.client) : null;

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isChangeFormOpen, setIsChangeFormOpen] = useState(false);
  const [changeText, setChangeText] = useState('');
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!demand) {
    return (
      <div className="min-h-screen bg-[#0a1224] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-full max-w-md bg-[#142142] border border-[#1d2e56] rounded-3xl p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Demanda Não Encontrada</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            O link de aprovação com o identificador <span className="font-mono text-amber-400 font-bold">"{demandId}"</span> não foi localizado ou foi concluído e arquivado pela equipe da agência.
          </p>
          <button
            type="button"
            onClick={onGoToAdminLogin}
            className="w-full py-3 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Lock size={15} />
            <span>Acessar Painel da Agência</span>
          </button>
        </div>
      </div>
    );
  }

  const clientCompany = client?.companyName || demand.client;
  const contactName = client?.contactName || client?.name || 'Cliente';

  // Attachments or fallback thumbnail
  const mediaItems = (demand.attachments || []).filter(
    (a) => a.type === 'image' || a.type === 'video'
  );

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
    setActionSuccessMessage('Material Aprovado com sucesso! A equipe da Help Ideias Digitais já foi notificada para prosseguir com o agendamento e veiculação.');
    setIsChangeFormOpen(false);
    setIsRejectConfirmOpen(false);
  };

  const handleRejectClick = () => {
    const rawReason = rejectReason.trim();
    const sanitizedReason = rawReason ? detectAndSanitizeInput(rawReason, 'Portal do Cliente: Motivo Reprovação').sanitized : undefined;
    onReject(demand.id, sanitizedReason);
    setActionSuccessMessage('Demanda marcada como Reprovada. A equipe criativa foi notificada para elaborar uma nova proposta.');
    setIsRejectConfirmOpen(false);
  };

  const handleSubmitChange = (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = changeText.trim();
    if (!rawText) return;

    const sanitizedFeedback = detectAndSanitizeInput(rawText, 'Portal do Cliente: Solicitação de Ajuste').sanitized;
    onRequestChange(demand.id, sanitizedFeedback);
    setActionSuccessMessage('Sua solicitação de alteração foi registrada! O material retornou para os designers com seus apontamentos.');
    setIsChangeFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a1224] text-slate-100 flex flex-col font-sans selection:bg-[#fab518] selection:text-[#142142]">
      {/* Top Client Navbar */}
      <header className="w-full bg-[#142142]/90 backdrop-blur-md border-b border-[#1d2e56] py-3.5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/icone-help.png"
            alt="Help Ideias Digitais"
            className="h-9 w-auto object-contain"
          />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#fab518] flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Portal Seguro do Cliente</span>
            </span>
            <p className="text-xs font-bold text-white">Help Ideias Digitais</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToAdminLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Lock size={12} className="text-[#fab518]" />
          <span>Área Administrativa</span>
        </button>
      </header>

      {/* Main Approval Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Success Banner */}
        {actionSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in shadow-lg">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <p className="font-semibold">{actionSuccessMessage}</p>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-[#142142] border border-[#1d2e56] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#fab518]/20 text-[#fab518] text-[10px] font-black tracking-wide uppercase">
                {demand.id}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 size={13} className="text-[#fab518]" />
                {clientCompany}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {demand.title}
            </h1>
            {demand.description && (
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {demand.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {demand.approvalStatus === 'aprovado' && (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Aprovado</span>
              </span>
            )}
            {demand.approvalStatus === 'alteracao_solicitada' && (
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5">
                <Edit3 size={15} />
                <span>Ajuste Solicitado</span>
              </span>
            )}
            {demand.approvalStatus === 'reprovado' && (
              <span className="px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-black flex items-center gap-1.5">
                <XCircle size={15} />
                <span>Reprovado</span>
              </span>
            )}
            {(!demand.approvalStatus || demand.approvalStatus === 'pendente') && (
              <span className="px-3.5 py-1.5 rounded-full bg-[#fab518]/20 text-[#fab518] border border-[#fab518]/40 text-xs font-black flex items-center gap-1.5">
                <Clock size={15} />
                <span>Aguardando sua Validação</span>
              </span>
            )}
          </div>
        </div>

        {/* Media Player / Viewer */}
        <div className="bg-[#142142] border border-[#1d2e56] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Eye size={15} className="text-[#fab518]" />
              <span>Peça Criativa para Avaliação</span>
            </span>
            {effectiveMedia.length > 1 && (
              <span className="text-xs text-slate-400">
                {activeMediaIndex + 1} de {effectiveMedia.length} arquivos
              </span>
            )}
          </div>

          {currentMedia ? (
            <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center min-h-[360px] max-h-[540px]">
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  className="max-h-[520px] w-auto max-w-full rounded-xl"
                />
              ) : currentMedia.url?.trim() ? (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.name}
                  className="max-h-[520px] w-auto max-w-full object-contain rounded-xl cursor-zoom-in"
                  onClick={() => setLightboxUrl(currentMedia.url)}
                />
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-slate-400">
                  <ImageIcon size={32} />
                </div>
              )}

              {currentMedia.type === 'image' && (
                <button
                  type="button"
                  onClick={() => setLightboxUrl(currentMedia.url)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer"
                  title="Expandir Imagem"
                >
                  <Maximize2 size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ImageIcon size={36} className="mx-auto text-slate-500" />
              <p className="text-xs">Nenhum anexo visual carregado nesta versão.</p>
            </div>
          )}

          {/* Thumbnails if multiple */}
          {effectiveMedia.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {effectiveMedia.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeMediaIndex === idx
                      ? 'border-[#fab518] scale-105'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {m.type === 'video' ? (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white">
                      <Film size={20} />
                    </div>
                  ) : m.url?.trim() ? (
                    <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <ImageIcon size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Change Request Form */}
        {isChangeFormOpen && (
          <form onSubmit={handleSubmitChange} className="bg-[#142142] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Edit3 size={16} />
              <span>Quais alterações você gostaria de solicitar?</span>
            </div>
            <p className="text-xs text-slate-300">
              Descreva em detalhes o que deve ser ajustado no texto, cores, elementos visuais ou formato.
            </p>
            <textarea
              rows={3}
              value={changeText}
              onChange={(e) => setChangeText(e.target.value)}
              placeholder="Ex: Por favor trocar a foto do fundo, ajustar o telefone no rodapé e alterar a chamada principal para..."
              className="w-full bg-[#0a1224] text-xs text-white p-3.5 rounded-2xl border border-slate-700 focus:outline-none focus:border-[#fab518]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsChangeFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all cursor-pointer shadow-md"
              >
                Enviar Solicitação de Ajustes
              </button>
            </div>
          </form>
        )}

        {/* Rejection Form */}
        {isRejectConfirmOpen && (
          <div className="bg-[#142142] border border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <XCircle size={16} />
              <span>Confirmar Reprovação da Peça</span>
            </div>
            <p className="text-xs text-slate-300">
              Ao reprovar, a agência criará uma proposta completamente diferente. Informe o motivo principal:
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: O conceito visual não está de acordo com o briefing inicial"
              className="w-full bg-[#0a1224] text-xs text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRejectConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleRejectClick}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Confirmar Reprovação
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isChangeFormOpen && !isRejectConfirmOpen && (
          <div className="bg-[#142142] border border-[#1d2e56] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Sua Decisão para Esta Peça</p>
              <p className="text-[11px] text-slate-400">
                Olá <span className="text-[#fab518] font-semibold">{contactName}</span>, selecione abaixo como deseja proceder.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRejectConfirmOpen(true);
                  setIsChangeFormOpen(false);
                }}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ThumbsDown size={15} />
                <span>Reprovar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsChangeFormOpen(true);
                  setIsRejectConfirmOpen(false);
                }}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 size={15} />
                <span>Solicitar Ajustes</span>
              </button>

              <button
                type="button"
                onClick={handleApproveClick}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#fab518]/20"
              >
                <ThumbsUp size={16} />
                <span>Aprovar Material</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxUrl?.trim() && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Preview Ampliado"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-5 px-4 text-center text-[11px] text-slate-500 border-t border-white/5 mt-auto">
        <p>© {new Date().getFullYear()} Help Ideias Digitais - Sistema de Gestão & Aprovação Segura</p>
      </footer>
    </div>
  );
};
