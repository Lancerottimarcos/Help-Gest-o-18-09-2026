import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  MessageSquare, 
  Sparkles, 
  Search, 
  Eye, 
  Download, 
  Check, 
  Copy, 
  ArrowRight, 
  ExternalLink, 
  Send, 
  ImageIcon, 
  Film, 
  ChevronRight,
  Maximize2,
  Calendar,
  Layers,
  Building2,
  HelpCircle,
  ThumbsUp,
  MessageCircle,
  X
} from 'lucide-react';
import { DemandItem, Client, UserProfile, DemandAttachment } from '../types';

interface ClientApprovalsViewProps {
  demands: DemandItem[];
  clients: Client[];
  currentUser: UserProfile;
  onClientApprovalAction: (
    demandId: string, 
    action: 'aprovado' | 'reprovado' | 'alteracao_solicitada', 
    feedback?: string
  ) => void;
  onOpenClientApprovalPortal: (demand: DemandItem) => void;
  onNavigateToPortal: () => void;
  onOpenWhatsAppNotification?: (demand: DemandItem) => void;
}

type FilterTab = 'pendentes' | 'todos' | 'aprovados' | 'alteracoes' | 'reprovados';

export const ClientApprovalsView: React.FC<ClientApprovalsViewProps> = ({
  demands,
  clients,
  currentUser,
  onClientApprovalAction,
  onOpenClientApprovalPortal,
  onNavigateToPortal,
  onOpenWhatsAppNotification,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('pendentes');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackDemandId, setFeedbackDemandId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectionDemandId, setRejectionDemandId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<{ id: string; message: string; type: 'success' | 'warn' } | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; type?: string } | null>(null);
  const [copiedDemandId, setCopiedDemandId] = useState<string | null>(null);

  // Client name scope
  const clientScopeName = (currentUser.clientName || currentUser.name || '').trim().toLowerCase();
  const clientObj = useMemo(() => {
    return clients.find(
      (c) => c.id === currentUser.clientId || 
             c.name.trim().toLowerCase() === clientScopeName ||
             (c.companyName && c.companyName.trim().toLowerCase() === clientScopeName)
    );
  }, [clients, currentUser.clientId, clientScopeName]);

  // Filter demands strictly for this client
  const clientDemands = useMemo(() => {
    return demands.filter((d) => {
      if (currentUser.clientId && d.clientId === currentUser.clientId) return true;
      const dClient = (d.client || '').trim().toLowerCase();
      const dProject = (d.clientProject || '').trim().toLowerCase();
      return (
        dClient === clientScopeName || 
        dProject.includes(clientScopeName) ||
        (clientObj && (dClient === clientObj.name.toLowerCase() || dClient === (clientObj.companyName || '').toLowerCase()))
      );
    });
  }, [demands, currentUser.clientId, clientScopeName, clientObj]);

  // Metrics
  const pendingDemands = useMemo(() => {
    return clientDemands.filter((d) => {
      return (
        d.columnId === 'aprovacao' || 
        d.approvalStatus === 'pendente' ||
        (!d.approvalStatus && d.columnId === 'aprovacao')
      );
    });
  }, [clientDemands]);

  const approvedDemands = useMemo(() => {
    return clientDemands.filter((d) => d.approvalStatus === 'aprovado' || d.columnId === 'agendamento' || d.columnId === 'concluidas');
  }, [clientDemands]);

  const changesRequestedDemands = useMemo(() => {
    return clientDemands.filter((d) => d.approvalStatus === 'alteracao_solicitada');
  }, [clientDemands]);

  const rejectedDemands = useMemo(() => {
    return clientDemands.filter((d) => d.approvalStatus === 'reprovado');
  }, [clientDemands]);

  // Filtered demands based on active tab and search
  const filteredDemands = useMemo(() => {
    return clientDemands.filter((d) => {
      // Tab filter
      if (activeTab === 'pendentes') {
        const isPending = d.columnId === 'aprovacao' || d.approvalStatus === 'pendente' || (!d.approvalStatus && d.columnId === 'aprovacao');
        if (!isPending) return false;
      } else if (activeTab === 'aprovados') {
        const isApproved = d.approvalStatus === 'aprovado' || d.columnId === 'agendamento' || d.columnId === 'concluidas';
        if (!isApproved) return false;
      } else if (activeTab === 'alteracoes') {
        if (d.approvalStatus !== 'alteracao_solicitada') return false;
      } else if (activeTab === 'reprovados') {
        if (d.approvalStatus !== 'reprovado') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (d.title || '').toLowerCase().includes(q);
        const matchesDesc = (d.description || '').toLowerCase().includes(q);
        const matchesType = (d.type || '').toLowerCase().includes(q);
        const matchesCat = (d.serviceCategory || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesType && !matchesCat) return false;
      }

      return true;
    });
  }, [clientDemands, activeTab, searchQuery]);

  const handleApprove = (demand: DemandItem) => {
    onClientApprovalAction(demand.id, 'aprovado');
    setActionSuccessNotice({
      id: demand.id,
      message: `"${demand.title}" foi aprovada com sucesso! Movida para agendamento.`,
      type: 'success',
    });
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const handleSendFeedback = (demand: DemandItem) => {
    if (!feedbackText.trim()) return;
    onClientApprovalAction(demand.id, 'alteracao_solicitada', feedbackText.trim());
    setActionSuccessNotice({
      id: demand.id,
      message: `Solicitação de alteração enviada para a equipe de criação.`,
      type: 'warn',
    });
    setFeedbackDemandId(null);
    setFeedbackText('');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const handleSendRejection = (demand: DemandItem) => {
    onClientApprovalAction(demand.id, 'reprovado', rejectionReason.trim() || undefined);
    setActionSuccessNotice({
      id: demand.id,
      message: `Demanda reprovada. Retornada para produção da agência.`,
      type: 'warn',
    });
    setRejectionDemandId(null);
    setRejectionReason('');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const handleCopyText = (demand: DemandItem) => {
    const textToCopy = demand.description || demand.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDemandId(demand.id);
    setTimeout(() => setCopiedDemandId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner / Client Welcome */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#142142] via-[#1a2d59] to-[#0f172a] text-white p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#fab518]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fab518]/20 border border-[#fab518]/40 text-[#fab518] text-xs font-black uppercase tracking-wider">
              <Sparkles size={13} className="animate-spin-slow" />
              <span>Portal de Aprovação Exclusivo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Central de Aprovações • {currentUser.clientName || currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Aqui você revisa todos os criativos, vídeos e materiais criados pela equipe da <strong>Help Ideias Digitais</strong>. 
              Aprove em 1 clique ou solicite ajustes para que os materiais fiquem perfeitos antes da publicação!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToPortal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15 cursor-pointer backdrop-blur-xs"
            >
              <Layers size={15} />
              <span>Ver Todos os Materiais (Kanban)</span>
            </button>
            {clientObj?.phone && (
              <a
                href={`https://wa.me/55${clientObj.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Falar com a Agência</span>
              </a>
            )}
          </div>
        </div>

        {/* Global Toast Notification */}
        {actionSuccessNotice && (
          <div className={`mt-6 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in slide-in-from-top-2 duration-200 ${
            actionSuccessNotice.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200' 
              : 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionSuccessNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{actionSuccessNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessNotice(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Card */}
        <button
          type="button"
          onClick={() => setActiveTab('pendentes')}
          className={`text-left p-4.5 rounded-[22px] border transition-all cursor-pointer ${
            activeTab === 'pendentes'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-[#fab518] shadow-sm'
              : 'bg-white dark:bg-[#0f172a] border-slate-200/90 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Aguardando Aprovação
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#142142] dark:text-white mt-2 tabular-nums">
            {pendingDemands.length}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            {pendingDemands.length === 1 ? '1 material pendente' : `${pendingDemands.length} materiais pendentes`}
          </span>
        </button>

        {/* Changes Requested Card */}
        <button
          type="button"
          onClick={() => setActiveTab('alteracoes')}
          className={`text-left p-4.5 rounded-[22px] border transition-all cursor-pointer ${
            activeTab === 'alteracoes'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500 shadow-sm'
              : 'bg-white dark:bg-[#0f172a] border-slate-200/90 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ajustes em Produção
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#142142] dark:text-white mt-2 tabular-nums">
            {changesRequestedDemands.length}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            Com a equipe de criação
          </span>
        </button>

        {/* Approved Card */}
        <button
          type="button"
          onClick={() => setActiveTab('aprovados')}
          className={`text-left p-4.5 rounded-[22px] border transition-all cursor-pointer ${
            activeTab === 'aprovados'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0f172a] border-slate-200/90 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Aprovados & Prontos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#142142] dark:text-white mt-2 tabular-nums">
            {approvedDemands.length}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            Prontos para publicação
          </span>
        </button>

        {/* Total Deliverables */}
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`text-left p-4.5 rounded-[22px] border transition-all cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 ring-2 ring-slate-400 shadow-sm'
              : 'bg-white dark:bg-[#0f172a] border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Entregáveis
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#142142] dark:text-white mt-2 tabular-nums">
            {clientDemands.length}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
            Materiais no histórico
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F7FA] dark:bg-slate-800/80 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pendentes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'pendentes'
                ? 'bg-[#142142] text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>Aguardando Aprovação ({pendingDemands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alteracoes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'alteracoes'
                ? 'bg-[#142142] text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={13} />
            <span>Ajustes Solicitados ({changesRequestedDemands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aprovados')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'aprovados'
                ? 'bg-[#142142] text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Aprovados ({approvedDemands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'todos'
                ? 'bg-[#142142] text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Todos ({clientDemands.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar material por nome..."
            className="w-full bg-[#F5F7FA] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-white pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* List of Approval Demands */}
      {filteredDemands.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-[28px] p-12 text-center border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-[#fab518] flex items-center justify-center mx-auto">
            {activeTab === 'pendentes' ? <CheckCircle2 size={32} /> : <Search size={32} />}
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-black text-[#142142] dark:text-white">
              {activeTab === 'pendentes' 
                ? 'Tudo em dia! Nenhum material aguardando aprovação.' 
                : 'Nenhum material encontrado com os filtros atuais.'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'pendentes'
                ? 'Você revisou e aprovou todas as demandas pendentes. Quando a agência enviar novos criativos, eles aparecerão aqui para sua validação.'
                : 'Tente alterar os termos da busca ou selecionar outra aba.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToPortal}
              className="px-5 py-2.5 bg-[#142142] text-[#fab518] rounded-xl text-xs font-black shadow-md hover:bg-[#1a2d59] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Ver todos os materiais no Portal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemands.map((demand) => {
            const isPending = demand.columnId === 'aprovacao' || demand.approvalStatus === 'pendente' || (!demand.approvalStatus && demand.columnId === 'aprovacao');
            const isApproved = demand.approvalStatus === 'aprovado' || demand.columnId === 'agendamento' || demand.columnId === 'concluidas';
            const isChange = demand.approvalStatus === 'alteracao_solicitada';
            const isRejected = demand.approvalStatus === 'reprovado';

            const attachments = demand.attachments || [];
            const mediaList = attachments.filter((a) => a.type === 'image' || a.type === 'video');
            const mainMedia = mediaList[0];

            return (
              <div
                key={demand.id}
                className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Media Preview Header */}
                <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {mainMedia ? (
                    mainMedia.type === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-900 group-hover:scale-105 transition-transform duration-300">
                        {mainMedia.thumbnailUrl ? (
                          <img 
                            src={mainMedia.thumbnailUrl} 
                            alt={demand.title} 
                            className="w-full h-full object-cover opacity-80"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                            <Film size={22} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={mainMedia.thumbnailUrl || mainMedia.url}
                        alt={demand.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setPreviewMedia({ url: mainMedia.url, title: demand.title, type: mainMedia.type })}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                      <ImageIcon size={32} className="opacity-40" />
                      <span className="text-[11px] font-bold">Arquivo de Criação Anexo</span>
                    </div>
                  )}

                  {/* Badges on Media */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-[#142142]/90 backdrop-blur-xs text-white shadow-xs">
                      {demand.serviceCategory || demand.type || 'Criativo'}
                    </span>
                    {mediaList.length > 1 && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-black/70 backdrop-blur-xs text-white">
                        {mediaList.length} arquivos
                      </span>
                    )}
                  </div>

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 right-3">
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md flex items-center gap-1 animate-pulse">
                        <Clock size={11} />
                        <span>Aguardando Você</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md flex items-center gap-1">
                        <Check size={11} />
                        <span>Aprovado</span>
                      </span>
                    )}
                    {isChange && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-md flex items-center gap-1">
                        <MessageSquare size={11} />
                        <span>Ajuste em Andamento</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md flex items-center gap-1">
                        <XCircle size={11} />
                        <span>Reprovado</span>
                      </span>
                    )}
                  </div>

                  {/* Click to Zoom Overlay */}
                  {mainMedia && (
                    <button
                      type="button"
                      onClick={() => setPreviewMedia({ url: mainMedia.url, title: demand.title, type: mainMedia.type })}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] backdrop-blur-xs transition-colors cursor-pointer"
                      title="Ampliar visualização"
                    >
                      <Maximize2 size={13} />
                    </button>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>ID: {demand.id}</span>
                      {demand.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Prazo: {demand.dueDate}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-[#142142] dark:text-white leading-snug line-clamp-2">
                      {demand.title}
                    </h4>

                    {demand.description && (
                      <div className="p-3 bg-[#F8F9FA] dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 relative group/copy">
                        <p className="whitespace-pre-line">{demand.description}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(demand)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover/copy:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                          title="Copiar texto/legenda"
                        >
                          {copiedDemandId === demand.id ? (
                            <>
                              <Check size={11} className="text-emerald-500" />
                              <span className="text-emerald-500">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copiar Legenda</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Previous Feedback Note if in alteration */}
                    {demand.approvalFeedback && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block">
                          Sua Solicitação de Ajuste:
                        </span>
                        <p className="italic">"{demand.approvalFeedback}"</p>
                      </div>
                    )}
                  </div>

                  {/* Feedback Inline Input Form */}
                  {feedbackDemandId === demand.id && (
                    <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          O que precisa ser alterado?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackDemandId(null);
                            setFeedbackText('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Ex: Ajustar o número de telefone no rodapé, clarear a foto de fundo..."
                        rows={3}
                        className="w-full bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setFeedbackDemandId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendFeedback(demand)}
                          disabled={!feedbackText.trim()}
                          className="px-4 py-1.5 bg-[#142142] text-[#fab518] text-xs font-black rounded-xl hover:bg-[#1a2d59] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          Enviar Ajuste
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rejection Inline Form */}
                  {rejectionDemandId === demand.id && (
                    <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
                          Motivo da Reprovação
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectionDemandId(null);
                            setRejectionReason('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Informe à equipe o motivo pelo qual esta demanda foi reprovada..."
                        rows={2}
                        className="w-full bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectionDemandId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendRejection(demand)}
                          className="px-4 py-1.5 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                        >
                          Confirmar Reprovação
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Primary Decision Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {isPending ? (
                      <div className="flex flex-col gap-2">
                        {/* Direct 1-Click Approve */}
                        <button
                          type="button"
                          onClick={() => handleApprove(demand)}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                        >
                          <CheckCircle2 size={16} />
                          <span>Aprovar Este Material</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Request Revisions */}
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackDemandId(demand.id);
                              setRejectionDemandId(null);
                            }}
                            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare size={13} />
                            <span>Pedir Ajustes</span>
                          </button>

                          {/* Full Screen Interactive Portal */}
                          <button
                            type="button"
                            onClick={() => onOpenClientApprovalPortal(demand)}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Ver Detalhes</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenClientApprovalPortal(demand)}
                          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#142142] dark:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Revisar Material Completo</span>
                        </button>

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackDemandId(demand.id);
                              setRejectionDemandId(null);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                            title="Solicitar alteração adicional"
                          >
                            <MessageSquare size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Fullscreen Image Zoom Modal */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={previewMedia.url}
              alt={previewMedia.title}
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-center text-white text-xs font-bold">
              {previewMedia.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
