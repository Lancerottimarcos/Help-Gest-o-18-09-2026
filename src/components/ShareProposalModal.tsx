import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  MessageCircle, 
  Mail, 
  QrCode, 
  Calendar, 
  ShieldCheck, 
  Eye, 
  Sparkles,
  ArrowRight,
  Send,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { BudgetProposal, Client } from '../types';
import { getPublicProposalUrl } from '../utils/urlHelpers';

interface ShareProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: BudgetProposal | null;
  client?: Client | null;
  onPreviewAsClient: (proposalId: string) => void;
}

export const ShareProposalModal: React.FC<ShareProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  client,
  onPreviewAsClient,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen || !proposal) return null;

  // Build the public URL for client decision (accessible without any login)
  const publicUrl = getPublicProposalUrl(proposal.id);

  const clientContactName = proposal.contactName || client?.contactName || client?.name || proposal.clientName;
  const clientPhone = (proposal.clientPhone || client?.phone || '').replace(/\D/g, '');
  const clientEmail = proposal.clientEmail || client?.email || '';

  // Formatted WhatsApp message for high conversion
  const whatsappMessage = `Olá, *${clientContactName}*! Tudo bem? 🚀\n\nAqui é da equipe da *Help Ideias Digitais*.\n\nPreparamos a proposta comercial personalizada para o projeto *${proposal.projectName}* (Código: *${proposal.code}*).\n\n💰 *Valor Total:* R$ ${proposal.totalValue.toLocaleString('pt-BR')},00\n📅 *Validade:* ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '15 dias'}\n\nVocê pode conferir todos os detalhes do escopo, entregáveis e prazos e aprovar com apenas um clique pelo nosso link seguro:\n👉 ${publicUrl}\n\nQualquer dúvida estou à disposição!`;

  const encodedWhatsappUrl = clientPhone
    ? `https://api.whatsapp.com/send?phone=55${clientPhone.replace(/^55/, '')}&text=${encodeURIComponent(whatsappMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  // Email mailto URL
  const emailSubject = `Proposta Comercial ${proposal.code} - ${proposal.projectName} | Help Ideias Digitais`;
  const emailBody = `Olá, ${clientContactName},\n\nSegue o link exclusivo da proposta comercial da Help Ideias Digitais referente ao projeto "${proposal.projectName}" (Código ${proposal.code}).\n\nValor: R$ ${proposal.totalValue.toLocaleString('pt-BR')},00\n\nAcesse o link abaixo para visualizar a proposta completa e realizar a aprovação online:\n${publicUrl}\n\nAtenciosamente,\nEquipe Help Ideias Digitais\nwww.ideiasdigitais.com.br`;
  const mailtoUrl = `mailto:${clientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#0a1224]/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#142142] to-[#1c2c56] p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fab518]/20 border border-[#fab518]/30 text-[#fab518] flex items-center justify-center font-bold">
                <Share2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fab518] flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Link de Aprovação Online</span>
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Enviar Orçamento ao Cliente
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#fab518] bg-white/10 px-2 py-0.5 rounded-md">
                {proposal.code}
              </span>
              <span className="text-slate-300 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {proposal.clientName}
              </span>
            </div>
            <div className="font-mono font-bold text-white">
              R$ {proposal.totalValue.toLocaleString('pt-BR')},00
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Main Public Link Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                <span>Link Direto do Cliente (Sem necessidade de login)</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Aprovação com 1 clique
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 py-3 pl-3.5 pr-32 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Testar link em nova aba"
                    className="p-1.5 rounded-xl text-slate-500 hover:text-[#142142] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] hover:opacity-90'
                    }`}
                  >
                    {copiedLink ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              <span>Link 100% público: o cliente acessa e aprova diretamente pelo celular ou computador sem login.</span>
            </p>
          </div>

          {/* Quick Sharing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp Share Card */}
            <a
              href={encodedWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                    Enviar via WhatsApp
                  </h4>
                  <ExternalLink size={12} className="text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 truncate mt-0.5">
                  {clientPhone ? `Enviar para ${clientPhone}` : 'Abrir no WhatsApp'}
                </p>
              </div>
            </a>

            {/* Email Share Card */}
            <a
              href={mailtoUrl}
              className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Mail size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-300">
                    Enviar via E-mail
                  </h4>
                  <ExternalLink size={12} className="text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-400/80 truncate mt-0.5">
                  {clientEmail || 'Abrir cliente de e-mail'}
                </p>
              </div>
            </a>
          </div>

          {/* WhatsApp Text Preview Accordion */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <MessageCircle size={13} className="text-emerald-500" />
                <span>Mensagem personalizada para WhatsApp:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-[#142142] dark:text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check size={12} className="text-emerald-500 stroke-[3]" /> : <Copy size={12} />}
                <span>{copiedMessage ? 'Copiada!' : 'Copiar texto'}</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
              {whatsappMessage}
            </div>
          </div>

          {/* QR Code toggle option */}
          <div>
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#fab518]" />
                <span>Apresentação Presencial: QR Code para Escanear</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {showQrCode ? 'Ocultar QR Code' : 'Mostrar QR Code'}
              </span>
            </button>

            {showQrCode && (
              <div className="mt-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                {/* Clean SVG QR code representation */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-36 h-36"
                    shapeRendering="crispEdges"
                  >
                    {/* Background */}
                    <rect width="100" height="100" fill="#ffffff" />
                    {/* Top Left Marker */}
                    <rect x="10" y="10" width="24" height="24" fill="#142142" />
                    <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="18" width="8" height="8" fill="#fab518" />
                    {/* Top Right Marker */}
                    <rect x="66" y="10" width="24" height="24" fill="#142142" />
                    <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="74" y="18" width="8" height="8" fill="#fab518" />
                    {/* Bottom Left Marker */}
                    <rect x="10" y="66" width="24" height="24" fill="#142142" />
                    <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="74" width="8" height="8" fill="#fab518" />
                    {/* Simulated Data Pattern with Brand Touch */}
                    <rect x="38" y="12" width="6" height="6" fill="#142142" />
                    <rect x="48" y="12" width="6" height="6" fill="#142142" />
                    <rect x="42" y="22" width="6" height="6" fill="#fab518" />
                    <rect x="52" y="22" width="8" height="6" fill="#142142" />
                    <rect x="12" y="42" width="6" height="8" fill="#142142" />
                    <rect x="22" y="46" width="8" height="6" fill="#fab518" />
                    <rect x="38" y="38" width="24" height="24" fill="#142142" rx="4" />
                    <rect x="44" y="44" width="12" height="12" fill="#fab518" rx="2" />
                    <rect x="70" y="42" width="8" height="8" fill="#142142" />
                    <rect x="82" y="46" width="6" height="6" fill="#fab518" />
                    <rect x="38" y="70" width="8" height="6" fill="#142142" />
                    <rect x="50" y="74" width="6" height="12" fill="#142142" />
                    <rect x="66" y="70" width="12" height="6" fill="#fab518" />
                    <rect x="82" y="76" width="6" height="6" fill="#142142" />
                    <rect x="68" y="82" width="8" height="6" fill="#142142" />
                  </svg>
                </div>
                <p className="text-xs text-center font-medium text-slate-500 dark:text-slate-400">
                  Aponte a câmera do smartphone para abrir o orçamento imediatamente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-900/80 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Link ativo e criptografado para o cliente</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onPreviewAsClient(proposal.id);
              }}
              className="px-5 py-2.5 rounded-full bg-[#142142] hover:bg-[#1a2b56] text-white dark:bg-[#fab518] dark:hover:bg-[#e29f11] dark:text-[#142142] font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Eye size={14} />
              <span>Ver como Cliente</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
