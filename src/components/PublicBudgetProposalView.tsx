import React, { useState, useEffect } from 'react';
import { 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Printer, 
  Download, 
  MessageCircle, 
  Calendar, 
  Building2, 
  User, 
  FileSpreadsheet, 
  Lock, 
  ArrowRight, 
  CreditCard, 
  CheckSquare, 
  Phone, 
  Mail, 
  Briefcase,
  HelpCircle,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { BudgetProposal, Client, ProposalItem } from '../types';
import { detectAndSanitizeInput } from '../utils/securityProtocols';
import { HelpLogo } from './HelpLogo';
import { serverDbService } from '../services/serverDbService';

interface PublicBudgetProposalViewProps {
  proposalId: string;
  proposals: BudgetProposal[];
  clients?: Client[];
  onApprove: (proposalId: string, approvalData: {
    signerName: string;
    signerRole?: string;
    signerEmail?: string;
    signerPhone?: string;
    notes?: string;
  }) => void;
  onReject: (proposalId: string, reason: string) => void;
  onRequestChange: (proposalId: string, feedback: string) => void;
  onGoToAdminLogin: () => void;
  isPreviewMode?: boolean;
  onClosePreview?: () => void;
}

export const PublicBudgetProposalView: React.FC<PublicBudgetProposalViewProps> = ({
  proposalId,
  proposals,
  clients = [],
  onApprove,
  onReject,
  onRequestChange,
  onGoToAdminLogin,
  isPreviewMode = false,
  onClosePreview,
}) => {
  // Find proposal by id, code or shareToken in initial props
  const initialFound = proposals.find(
    (p) => 
      p.id.toLowerCase() === proposalId.toLowerCase() ||
      p.code.toLowerCase() === proposalId.toLowerCase() ||
      (p.shareToken && p.shareToken.toLowerCase() === proposalId.toLowerCase())
  );

  const [remoteProposal, setRemoteProposal] = useState<BudgetProposal | null>(null);
  const [remoteClient, setRemoteClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialFound);
  const [fetchAttempt, setFetchAttempt] = useState(0);

  // Active proposal resolves from either prop or remote fetch
  const proposal = initialFound || remoteProposal;

  const matchedClient = proposal
    ? (clients.find(
        (c) =>
          (proposal.clientId && c.id === proposal.clientId) ||
          c.companyName.toLowerCase() === proposal.clientName.toLowerCase() ||
          c.name.toLowerCase() === proposal.clientName.toLowerCase()
      ) || remoteClient)
    : null;

  // Asynchronous fetch from central database if not in memory
  useEffect(() => {
    if (initialFound) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchProposal = async () => {
      setIsLoading(true);

      // 1. Try dedicated public proposal endpoint
      const result = await serverDbService.fetchPublicProposal(proposalId);
      if (!isMounted) return;

      if (result?.proposal) {
        setRemoteProposal(result.proposal);
        if (result.client) setRemoteClient(result.client);
        setIsLoading(false);
        return;
      }

      // 2. Check localStorage in case of same browser/tab
      try {
        const saved = localStorage.getItem('agency_proposals');
        if (saved) {
          const list: BudgetProposal[] = JSON.parse(saved);
          const found = list.find(
            (p) =>
              p.id.toLowerCase() === proposalId.toLowerCase() ||
              p.code.toLowerCase() === proposalId.toLowerCase() ||
              (p.shareToken && p.shareToken.toLowerCase() === proposalId.toLowerCase())
          );
          if (found) {
            setRemoteProposal(found);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      if (isMounted) {
        setIsLoading(false);
      }
    };

    fetchProposal();
    return () => {
      isMounted = false;
    };
  }, [proposalId, initialFound, fetchAttempt]);

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [signerName, setSignerName] = useState(
    proposal?.contactName || matchedClient?.contactName || matchedClient?.name || ''
  );
  const [signerRole, setSignerRole] = useState(
    proposal?.contactRole || matchedClient?.contactRole || 'Diretor / Responsável'
  );
  const [signerEmail, setSignerEmail] = useState(
    proposal?.clientEmail || matchedClient?.email || ''
  );
  const [signerPhone, setSignerPhone] = useState(
    proposal?.clientPhone || matchedClient?.phone || ''
  );
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Sync signer form states when proposal or client resolves
  useEffect(() => {
    if (proposal) {
      setSignerName(prev => prev || proposal.contactName || matchedClient?.contactName || matchedClient?.name || '');
      setSignerRole(prev => prev || proposal.contactRole || matchedClient?.contactRole || 'Diretor / Responsável');
      setSignerEmail(prev => prev || proposal.clientEmail || matchedClient?.email || '');
      setSignerPhone(prev => prev || proposal.clientPhone || matchedClient?.phone || '');
    }
  }, [proposal, matchedClient]);

  // Rejection / Change Request Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'ajuste' | 'recusa'>('ajuste');
  const [feedbackText, setFeedbackText] = useState('');

  // Success Notification Banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Loading state while resolving proposal
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-8 space-y-4 shadow-xl flex flex-col items-center">
          <HelpLogo variant="full" size="md" className="mb-2" />
          <div className="w-12 h-12 rounded-2xl bg-[#fab518]/15 text-[#fab518] flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#142142]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#142142]">Carregando Orçamento</h3>
            <p className="text-xs text-slate-500">
              Conectando com o servidor seguro da proposta...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If proposal not found
  if (!proposal) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#fab518] border border-amber-200 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#142142]">Orçamento Não Localizado</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              O link de proposta com o identificador <span className="font-mono text-[#142142] font-bold">"{proposalId}"</span> não foi encontrado ou expirou.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setFetchAttempt(prev => prev + 1)}
              className="w-full py-3 rounded-xl bg-[#142142] hover:bg-[#1c2c56] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} />
              <span>Tentar Novamente</span>
            </button>
            <button
              type="button"
              onClick={onGoToAdminLogin}
              className="w-full py-3 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Lock size={15} />
              <span>Acessar Área Restrita da Agência</span>
            </button>
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Voltar ao Painel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Derive items or synthesize from services/total
  const items: ProposalItem[] = proposal.items && proposal.items.length > 0
    ? proposal.items
    : (proposal.services || ['Prestação de Serviços Estratégicos']).map((srv, idx) => ({
        id: `item-gen-${idx}`,
        description: srv,
        quantity: 1,
        unitPrice: Math.round(proposal.totalValue / (proposal.services?.length || 1)),
        total: Math.round(proposal.totalValue / (proposal.services?.length || 1)),
        category: 'Serviço',
        periodicity: 'mensal',
      }));

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !termsAccepted) return;

    const sanitizedSigner = detectAndSanitizeInput(signerName.trim(), 'Aprovação de Orçamento: Nome').sanitized;
    const sanitizedNotes = approvalNotes.trim()
      ? detectAndSanitizeInput(approvalNotes.trim(), 'Aprovação de Orçamento: Observações').sanitized
      : undefined;

    onApprove(proposal.id, {
      signerName: sanitizedSigner,
      signerRole: signerRole.trim() || undefined,
      signerEmail: signerEmail.trim() || undefined,
      signerPhone: signerPhone.trim() || undefined,
      notes: sanitizedNotes,
    });

    setIsApproveModalOpen(false);
    setActionSuccessMessage(
      `Parabéns! O orçamento ${proposal.code} foi aprovado com sucesso por ${sanitizedSigner}. Nossa equipe já recebeu a confirmação e entrará em contato para o início dos trabalhos!`
    );
  };

  const handleConfirmFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = feedbackText.trim();
    if (!rawText) return;

    const sanitized = detectAndSanitizeInput(rawText, `Feedback Orçamento: ${feedbackType}`).sanitized;

    if (feedbackType === 'ajuste') {
      onRequestChange(proposal.id, sanitized);
      setActionSuccessMessage(
        'Solicitação de ajuste enviada com sucesso! A equipe da Help Ideias Digitais revisará sua mensagem para readequar a proposta.'
      );
    } else {
      onReject(proposal.id, sanitized);
      setActionSuccessMessage(
        'Orçamento recusado. Agradecemos pelo seu tempo e consideração. Caso precise futuramente, estamos à disposição.'
      );
    }

    setIsFeedbackModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const clientPhoneFormatted = (proposal.clientPhone || matchedClient?.phone || '').replace(/\D/g, '');
  const contactWhatsAppUrl = clientPhoneFormatted
    ? `https://api.whatsapp.com/send?phone=55${clientPhoneFormatted.replace(/^55/, '')}&text=${encodeURIComponent(`Olá! Estou analisando o orçamento ${proposal.code} (${proposal.projectName}) e gostaria de tirar algumas dúvidas.`)}`
    : `https://api.whatsapp.com/send?phone=5511987654321&text=${encodeURIComponent(`Olá! Estou analisando o orçamento ${proposal.code} (${proposal.projectName}) e gostaria de falar com o consultor.`)}`;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-[#fab518] selection:text-[#142142] print:bg-white print:text-black">
      
      {/* Agency Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-[#fab518] text-[#142142] px-4 py-2 text-xs font-bold text-center flex items-center justify-between shadow-xs sticky top-0 z-50 print:hidden">
          <div className="flex items-center justify-center gap-2 mx-auto">
            <span className="w-2 h-2 rounded-full bg-[#142142] animate-ping" />
            <span>MODO DE PRÉ-VISUALIZAÇÃO • Esta é a exata experiência visual que seu cliente terá ao abrir o link</span>
          </div>
          {onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              className="px-3 py-1 rounded-lg bg-[#142142] text-white text-[11px] font-bold cursor-pointer hover:bg-black transition-colors shrink-0"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      )}

      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200/80 py-3.5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <HelpLogo variant="full" size="md" className="h-9" />
          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#fab518] flex items-center gap-1">
              <ShieldCheck size={13} className="text-[#fab518]" />
              <span>Portal de Aprovação Comercial</span>
            </span>
            <p className="text-xs font-bold text-[#142142]">Help Ideias Digitais</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#142142] text-xs font-semibold transition-all cursor-pointer border border-slate-200/80"
            title="Imprimir ou salvar PDF da proposta"
          >
            <Printer size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <a
            href={contactWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all border border-emerald-200"
            title="Tirar dúvidas com o consultor"
          >
            <MessageCircle size={14} className="text-emerald-600" />
            <span>Falar no WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onGoToAdminLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#142142] hover:bg-[#1d2e56] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Acesso exclusivo para a equipe da agência"
          >
            <Lock size={12} className="text-[#fab518]" />
            <span className="hidden sm:inline">Área da Agência</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 text-emerald-900 flex items-start gap-3 shadow-md animate-in fade-in print:hidden">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm leading-relaxed">
              <p className="font-bold text-emerald-950 mb-0.5">Operação Registrada com Sucesso</p>
              <p className="text-emerald-800">{actionSuccessMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 cursor-pointer text-lg font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Clean Paper Proposal Card */}
        <article className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/40 space-y-8 print:shadow-none print:border-none print:p-0">
          
          {/* Header Strip: Agency & Proposal Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-3">
              <HelpLogo variant="full" size="lg" className="h-10 sm:h-11" />
              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p className="font-bold text-[#142142]">Help Ideias Digitais</p>
                <p>Estratégia, Performance & Criação de Alto Impacto</p>
                <p className="text-[11px] text-slate-400">contato@helpideiasdigitais.com.br</p>
              </div>
            </div>

            {/* Proposal Code & Status Box */}
            <div className="flex flex-col items-start sm:items-end gap-2 text-left sm:text-right">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs sm:text-sm bg-slate-100 text-[#142142] px-3 py-1 rounded-lg border border-slate-200">
                  {proposal.code}
                </span>
                
                {/* Status Indicator */}
                {proposal.status === 'Aprovado' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-600 stroke-[2.5]" />
                    <span>Aprovado</span>
                  </span>
                )}
                {proposal.status === 'Recusado' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                    <XCircle size={13} className="text-rose-600 stroke-[2.5]" />
                    <span>Recusado</span>
                  </span>
                )}
                {(proposal.status === 'Enviado' || proposal.status === 'Rascunho') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    <Clock size={13} className="text-[#fab518] stroke-[2.5]" />
                    <span>Aguardando Aprovação</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>
                  <span className="text-slate-400">Emissão:</span>{' '}
                  <strong className="text-slate-700">{proposal.date}</strong>
                </p>
                <p>
                  <span className="text-slate-400">Validade:</span>{' '}
                  <strong className="text-slate-700">
                    {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '15 dias'}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Client Recipient & Project Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Project Headline (2 cols) */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#fab518] flex items-center gap-1.5">
                <Briefcase size={13} />
                <span>Proposta Comercial de Prestação de Serviços</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142142] leading-tight">
                {proposal.projectName}
              </h1>
              {proposal.title && proposal.title !== proposal.projectName && (
                <p className="text-sm font-semibold text-slate-600">
                  {proposal.title}
                </p>
              )}
            </div>

            {/* Client Info Card (1 col) */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Apresentada Para
              </span>
              <p className="text-base font-bold text-[#142142] leading-tight">
                {proposal.clientName}
              </p>
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                {(proposal.contactName || matchedClient?.contactName) && (
                  <p className="flex items-center gap-1.5">
                    <User size={13} className="text-[#fab518] shrink-0" />
                    <span>
                      {proposal.contactName || matchedClient?.contactName}
                      {(proposal.contactRole || matchedClient?.contactRole) && (
                        <span className="text-slate-400 text-[11px]"> • {proposal.contactRole || matchedClient?.contactRole}</span>
                      )}
                    </span>
                  </p>
                )}
                {(proposal.clientEmail || matchedClient?.email) && (
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{proposal.clientEmail || matchedClient?.email}</span>
                  </p>
                )}
                {(proposal.clientPhone || matchedClient?.phone) && (
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <span>{proposal.clientPhone || matchedClient?.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scope Narrative / Objective Box */}
          {proposal.scopeDescription && (
            <div className="bg-amber-50/40 border-l-4 border-[#fab518] rounded-r-2xl p-5 sm:p-6 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#142142] flex items-center gap-1.5">
                <Info size={13} className="text-[#fab518]" />
                <span>Objetivo Estratégico & Escopo</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                {proposal.scopeDescription}
              </p>
            </div>
          )}

          {/* Itemized Services Breakdown Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#142142] flex items-center justify-center font-bold">
                  <FileSpreadsheet size={15} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#142142]">
                    Discriminação dos Serviços & Entregáveis
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Detalhamento dos itens inclusos no investimento
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Clean Modern Table */}
            <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3.5 px-5">Descrição do Entregável</th>
                    <th className="py-3.5 px-4 text-center">Tipo</th>
                    <th className="py-3.5 px-4 text-center">Qtd.</th>
                    <th className="py-3.5 px-4 text-right">Valor Unitário</th>
                    <th className="py-3.5 px-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <p className="text-[#142142] font-bold text-xs sm:text-sm">
                          {item.description}
                        </p>
                        {item.category && (
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Categoria: {item.category}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                          {item.periodicity === 'mensal' ? 'Recorrente Mensal' : 'Investimento Único'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-slate-600">
                        {item.quantity || 1}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-600 tabular-nums">
                        R$ {item.unitPrice.toLocaleString('pt-BR')},00
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-[#142142] tabular-nums">
                        R$ {item.total.toLocaleString('pt-BR')},00
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Investment Summary Card */}
            <div className="bg-[#142142] text-white rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#fab518] tracking-wider">
                  Investimento Global Proposto
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[#fab518] font-mono">R$</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight tabular-nums">
                    {proposal.totalValue.toLocaleString('pt-BR')},00
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {proposal.paymentTerms || 'Faturamento mensal ou 50% de entrada + 50% na conclusão.'}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#fab518] shrink-0" />
                  <span>
                    <strong>Validade:</strong>{' '}
                    {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '15 dias a contar da emissão'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#fab518] shrink-0" />
                  <span>
                    <strong>Prazo de Entrega:</strong> {proposal.deliveryTime || 'Início imediato após aprovação formal.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Commercial Terms & Guarantees */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-[#142142] flex items-center gap-2">
              <CreditCard size={16} className="text-[#fab518]" />
              <span>Condições Comerciais, Faturamento & Garantias</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#142142] flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-emerald-600" />
                  <span>Faturamento PJ</span>
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Pix PJ corporativo ou Boleto bancário com emissão automática de Nota Fiscal Eletrônica (NFS-e).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#142142] flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-600" />
                  <span>Início Operacional</span>
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Kickoff da equipe de atendimento e início dos alinhamentos em até 48 horas úteis após a aprovação online.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#142142] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Propriedade Intelectual</span>
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Todos os criativos, materiais, copys e códigos tornam-se propriedade integral da empresa contratante.
                </p>
              </div>
            </div>
          </div>

          {/* DECISION ACTION SECTION: APPROVE / REJECT / ALREADY DECIDED */}
          <div className="pt-4 print:hidden">
            {proposal.status === 'Aprovado' ? (
              /* Approved State Card */
              <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={32} className="stroke-[2.5]" />
                </div>

                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg sm:text-xl font-extrabold text-emerald-950">
                    Proposta Comercial Aprovada!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                    Este orçamento foi formalmente validado. Nossa equipe de operações da Help Ideias Digitais já foi acionada para o kickoff.
                  </p>
                </div>

                {proposal.clientSignerName && (
                  <div className="inline-flex flex-col items-center bg-white border border-emerald-200 px-5 py-2.5 rounded-xl text-xs space-y-0.5 shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Assinado Digitalmente por
                    </span>
                    <span className="font-bold text-[#142142] text-sm">
                      {proposal.clientSignerName} {proposal.clientSignerRole ? `(${proposal.clientSignerRole})` : ''}
                    </span>
                    {proposal.approvedAt && (
                      <span className="text-[11px] font-mono text-emerald-700">
                        Data do aceite: {proposal.approvedAt}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#142142] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    <span>Salvar Cópia em PDF</span>
                  </button>

                  <a
                    href={contactWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Falar com a Equipe no WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : proposal.status === 'Recusado' ? (
              /* Rejected State Card */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <XCircle size={28} />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-[#142142]">
                    Proposta Marcada como Não Aprovada
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Esta proposta foi encerrada ou recusada. Caso deseje renegociar o escopo ou os valores, entre em contato conosco.
                  </p>
                  {proposal.clientDecisionNote && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 text-left">
                      <strong className="text-slate-700">Motivo informado:</strong> {proposal.clientDecisionNote}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <a
                    href={contactWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle size={14} className="text-[#fab518]" />
                    <span>Solicitar Reavaliação no WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Active Pending Decision Banner */
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#fab518] flex items-center gap-1">
                    <FileCheck2 size={13} className="text-[#fab518]" />
                    <span>Decisão Comercial Online</span>
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#142142] mt-0.5">
                    Deseja dar início a este projeto?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ao aprovar, você autoriza formalmente a Help Ideias Digitais a mobilizar a equipe.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackType('ajuste');
                      setIsFeedbackModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer text-center shadow-xs"
                  >
                    Solicitar Ajustes / Recusar
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsApproveModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    <Check size={16} className="stroke-[3]" />
                    <span>Aprovar Orçamento Online</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-400 space-y-1.5 mt-auto print:hidden">
        <div className="flex items-center justify-center gap-2">
          <HelpLogo variant="icon" className="w-5 h-5 opacity-70" />
          <span className="font-bold text-[#142142]">Help Ideias Digitais</span>
          <span>•</span>
          <span>Inovação, Performance & Design de Alto Impacto</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Documento digital seguro e confidencial. Todos os direitos reservados.
        </p>
      </footer>

      {/* MODAL: APROVAÇÃO COM ASSINATURA DIGITAL */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-[#0a1224]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-800 w-full max-w-lg rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
                  <CheckCircle2 size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#142142]">
                    Aprovar Orçamento Comercial
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {proposal.code} • R$ {proposal.totalValue.toLocaleString('pt-BR')},00
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#142142] mb-1">
                  Nome Completo do Responsável <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-[#142142] focus:outline-none focus:border-[#fab518]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#142142] mb-1">
                    Cargo / Função na Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Diretor Comercial, CEO, Sócio"
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#142142] focus:outline-none focus:border-[#fab518]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142142] mb-1">
                    WhatsApp para Contato
                  </label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={signerPhone}
                    onChange={(e) => setSignerPhone(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#142142] focus:outline-none focus:border-[#fab518]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#142142] mb-1">
                  E-mail para Envio do Contrato / NFS-e
                </label>
                <input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#142142] focus:outline-none focus:border-[#fab518]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142142] mb-1">
                  Observações ou Orientações Iniciais (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Podemos iniciar os alinhamentos a partir de segunda-feira..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-[#142142] focus:outline-none focus:border-[#fab518]"
                />
              </div>

              {/* Term of Agreement */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-[#fab518] focus:ring-[#fab518] cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-950 font-medium leading-relaxed">
                    Declaro que revisei o escopo, cronograma e valores propostos e autorizo o início dos serviços pela Help Ideias Digitais.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!signerName.trim() || !termsAccepted}
                  className="px-6 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] disabled:opacity-40 text-[#142142] font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Check size={15} className="stroke-[3]" />
                  <span>Confirmar Aprovação da Proposta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR AJUSTES OU RECUSAR */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-[#0a1224]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-800 w-full max-w-lg rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  feedbackType === 'ajuste' ? 'bg-amber-50 text-[#fab518] border border-amber-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}>
                  {feedbackType === 'ajuste' ? <HelpCircle size={17} /> : <XCircle size={17} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#142142]">
                    {feedbackType === 'ajuste' ? 'Solicitar Ajustes na Proposta' : 'Recusar Proposta Comercial'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Proposta {proposal.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Type selector toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFeedbackType('ajuste')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  feedbackType === 'ajuste'
                    ? 'bg-white text-[#142142] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Solicitar Ajuste no Escopo / Valor
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('recusa')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  feedbackType === 'recusa'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Recusar Proposta
              </button>
            </div>

            <form onSubmit={handleConfirmFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#142142] mb-1">
                  {feedbackType === 'ajuste'
                    ? 'O que você gostaria de readequar nesta proposta?'
                    : 'Qual o principal motivo da recusa?'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    feedbackType === 'ajuste'
                      ? 'Ex: Gostaríamos de incluir também a gestão do TikTok ou dividir o pagamento em 3 parcelas sem juros...'
                      : 'Ex: Projeto adiado para o próximo trimestre, valor acima do orçamento disponível no momento...'
                  }
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-[#142142] focus:outline-none focus:border-[#fab518] leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!feedbackText.trim()}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                    feedbackType === 'ajuste'
                      ? 'bg-[#142142] hover:bg-[#1d2e56] text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {feedbackType === 'ajuste' ? 'Enviar Solicitação de Ajuste' : 'Confirmar Recusa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
