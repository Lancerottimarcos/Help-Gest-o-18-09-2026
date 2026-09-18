import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  XCircle, 
  ExternalLink, 
  MessageCircle, 
  Copy, 
  Check, 
  Filter, 
  Search, 
  Eye, 
  Share2, 
  Film, 
  ImageIcon, 
  Calendar, 
  User, 
  Send, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Monitor,
  Maximize2,
  X
} from 'lucide-react';
import { DemandItem, Client, DemandAttachment } from '../types';

interface PortalClienteViewProps {
  demands: DemandItem[];
  clients: Client[];
  onClientApprovalAction: (
    demandId: string, 
    action: 'aprovado' | 'reprovado' | 'alteracao_solicitada', 
    feedback?: string
  ) => void;
  onOpenWhatsAppNotification: (demand: DemandItem) => void;
  onOpenDemandModal?: (demand: DemandItem) => void;
}

export const PortalClienteView: React.FC<PortalClienteViewProps> = ({
  demands,
  clients,
  onClientApprovalAction,
  onOpenWhatsAppNotification,
  onOpenDemandModal,
}) => {
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'gestao' | 'simulador' | 'configuracoes'>('gestao');
  
  // Selected demand for preview or simulation
  const [simulatedDemandId, setSimulatedDemandId] = useState<string>(() => {
    const inApproval = demands.find((d) => d.columnId === 'aprovacao' || d.approvalStatus);
    return inApproval ? inApproval.id : (demands[0]?.id || '');
  });

  // Client feedback simulation state
  const [feedbackInput, setFeedbackInput] = useState('');
  const [showFeedbackField, setShowFeedbackField] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<DemandAttachment | null>(null);

  // Filter demands that are relevant to client portal (either currently in approval or previously evaluated)
  const approvalDemands = demands.filter((d) => {
    // If in aprovacao or has approval status or was marked
    return d.columnId === 'aprovacao' || d.approvalStatus || d.statusLabel?.toLowerCase().includes('aprov') || d.statusLabel?.toLowerCase().includes('ajuste');
  });

  // All demands for selection
  const displayDemands = (approvalDemands.length > 0 ? approvalDemands : demands).filter((d) => {
    const matchesClient = selectedClientFilter === 'todos' || d.client.toLowerCase() === selectedClientFilter.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesStatus = true;
    if (selectedStatusFilter === 'pendente') {
      matchesStatus = d.columnId === 'aprovacao' && (!d.approvalStatus || d.approvalStatus === 'pendente');
    } else if (selectedStatusFilter === 'aprovado') {
      matchesStatus = d.approvalStatus === 'aprovado';
    } else if (selectedStatusFilter === 'alteracao') {
      matchesStatus = d.approvalStatus === 'alteracao_solicitada';
    } else if (selectedStatusFilter === 'reprovado') {
      matchesStatus = d.approvalStatus === 'reprovado';
    }

    return matchesClient && matchesSearch && matchesStatus;
  });

  // Statistics
  const totalInReview = demands.filter((d) => d.columnId === 'aprovacao').length;
  const totalApproved = demands.filter((d) => d.approvalStatus === 'aprovado').length;
  const totalChangesRequested = demands.filter((d) => d.approvalStatus === 'alteracao_solicitada').length;

  const currentSimulatedDemand = demands.find((d) => d.id === simulatedDemandId) || demands[0];

  const handleCopyLink = (demand: DemandItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = origin ? `${origin}/?portal=aprovacao&demandId=${demand.id}` : `https://portal.helpideias.com.br/aprovacao/${demand.clientPortalToken || demand.id}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(demand.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSimulatorAction = (action: 'aprovado' | 'reprovado' | 'alteracao_solicitada') => {
    if (!currentSimulatedDemand) return;
    onClientApprovalAction(currentSimulatedDemand.id, action, feedbackInput.trim() || undefined);
    setFeedbackInput('');
    setShowFeedbackField(false);
  };

  // Helper for media preview
  const getMediaAttachments = (demand?: DemandItem): DemandAttachment[] => {
    if (!demand || !demand.attachments) return [];
    return demand.attachments.filter((a) => a.type === 'image' || a.type === 'video');
  };

  const simulatedMedia = getMediaAttachments(currentSimulatedDemand);

  return (
    <div className="space-y-5 pb-12">
      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#0f172a] p-1.5 rounded-full self-start md:self-auto shrink-0 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('gestao')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gestao'
                ? 'bg-[#142142] text-white shadow-xs dark:bg-[#fab518] dark:text-[#142142]'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <Monitor size={14} />
            <span>Gestão de Envios</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'simulador'
                ? 'bg-[#142142] text-white shadow-xs dark:bg-[#fab518] dark:text-[#142142]'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Visão do Cliente (Preview)</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aguardando Aprovação
            </span>
            <div className="text-2xl font-black text-[#142142] dark:text-white mt-0.5 flex items-center gap-2">
              <span>{totalInReview}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Pendente
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aprovados Recentemente
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-2">
              <span>{totalApproved}</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                100% OK
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ajustes Solicitados
            </span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-2">
              <span>{totalChangesRequested}</span>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Em Produção
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-100/70 dark:bg-orange-950/60 text-orange-800 dark:text-orange-400 flex items-center justify-center">
            <Edit3 size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'gestao' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por demanda, cliente ou escopo..."
                  className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-medium text-[#142142] dark:text-white pl-9 pr-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all"
                />
              </div>

              {/* Client Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={selectedClientFilter}
                  onChange={(e) => setSelectedClientFilter(e.target.value)}
                  className="bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="todos">Todos os Clientes</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-all cursor-pointer shrink-0"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Aguardando Aprovação</option>
                <option value="aprovado">Aprovado pelo Cliente</option>
                <option value="alteracao">Ajuste Solicitado</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 self-end md:self-auto">
              Exibindo <span className="text-[#142142] dark:text-white font-black">{displayDemands.length}</span> demandas
            </div>
          </div>

          {/* Demands List Table / Grid */}
          <div className="space-y-3.5">
            {displayDemands.length === 0 ? (
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-10 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} />
                </div>
                <h3 className="text-base font-bold text-[#142142] dark:text-white">Nenhuma demanda encontrada</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Mova um card para a coluna "Aprovação" no Kanban para que ele apareça automaticamente na central de aprovações do cliente.
                </p>
              </div>
            ) : (
              displayDemands.map((demand) => {
                const media = getMediaAttachments(demand);
                const firstMedia = media[0];
                const isCopied = copiedToken === demand.id;

                return (
                  <div 
                    key={demand.id}
                    className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Media Thumbnail + Demand Information */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Media Thumbnail */}
                      <div 
                        className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center group cursor-pointer"
                        onClick={() => {
                          if (firstMedia) setLightboxMedia(firstMedia);
                        }}
                      >
                        {firstMedia ? (
                          firstMedia.type === 'video' ? (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[#fab518]">
                              <Film size={22} />
                            </div>
                          ) : firstMedia.url?.trim() ? (
                            <img 
                              src={firstMedia.url} 
                              alt={firstMedia.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-slate-400 flex flex-col items-center justify-center text-[10px]">
                              <ImageIcon size={20} className="mb-0.5" />
                              <span>Sem mídia</span>
                            </div>
                          )
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center justify-center text-[10px]">
                            <ImageIcon size={20} className="mb-0.5" />
                            <span>Sem mídia</span>
                          </div>
                        )}

                        {firstMedia && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={16} />
                          </div>
                        )}
                      </div>

                      {/* Demand details */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-[#fab518] text-[#142142]">
                            #{demand.id.replace('dem-', '')}
                          </span>
                          <h3 
                            className="text-sm sm:text-base font-bold text-[#142142] dark:text-white hover:text-[#fab518] cursor-pointer truncate transition-colors"
                            onClick={() => onOpenDemandModal && onOpenDemandModal(demand)}
                          >
                            {demand.title}
                          </h3>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {demand.client}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {demand.description || 'Sem briefing adicional cadastrado.'}
                        </p>

                        {/* Status Pills and Feedback */}
                        <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                          {demand.approvalStatus === 'aprovado' ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                              Aprovado pelo Cliente
                            </span>
                          ) : demand.approvalStatus === 'alteracao_solicitada' ? (
                            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Edit3 size={12} className="text-amber-700 dark:text-amber-400" />
                              Ajuste Solicitado
                            </span>
                          ) : demand.approvalStatus === 'reprovado' ? (
                            <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <XCircle size={12} className="text-rose-600 dark:text-rose-400" />
                              Reprovado pelo Cliente
                            </span>
                          ) : (
                            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={12} className="text-amber-700 dark:text-amber-400" />
                              Aguardando Validação
                            </span>
                          )}

                          <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar size={12} />
                            Prazo: {demand.dueDate}
                          </span>

                          <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <User size={12} />
                            {demand.assigneeName}
                          </span>
                        </div>

                        {/* If feedback was given by the client */}
                        {demand.approvalFeedback && (
                          <div className="mt-1.5 p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                            <span className="font-bold">Solicitação de Ajuste do Cliente: </span>
                            <span>"{demand.approvalFeedback}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on this demand */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Open Simulator */}
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedDemandId(demand.id);
                          setActiveTab('simulador');
                        }}
                        className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#142142] dark:text-white border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        title="Abrir como o cliente visualiza no portal"
                      >
                        <ExternalLink size={13} />
                        <span>Abrir Portal</span>
                      </button>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(demand)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#142142] dark:text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Copiar link exclusivo do portal"
                      >
                        {isCopied ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                        <span>{isCopied ? 'Copiado!' : 'Copiar Link'}</span>
                      </button>

                      {/* Send via WhatsApp */}
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppNotification(demand)}
                        className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Disparar notificação e link por WhatsApp"
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Simulator Tab: Exactly what the client sees in the browser */}
      {activeTab === 'simulador' && (
        <div className="space-y-4">
          {/* Selector of which demand to simulate */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#142142] dark:text-white">Visualizando Demanda:</span>
              <select
                value={simulatedDemandId}
                onChange={(e) => setSimulatedDemandId(e.target.value)}
                className="bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-white px-3.5 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-all cursor-pointer"
              >
                {demands.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.client} — {d.title} ({d.columnId})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Link do Portal:</span>
              <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md truncate max-w-xs">
                https://portal.helpideias.com.br/aprovacao/{currentSimulatedDemand?.clientPortalToken || currentSimulatedDemand?.id}
              </span>
              <button
                type="button"
                onClick={() => currentSimulatedDemand && handleCopyLink(currentSimulatedDemand)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Copiar link"
              >
                {copiedToken === currentSimulatedDemand?.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Real Simulated Client Portal Shell */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#0f172a] rounded-[28px] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Top Bar of Client Portal */}
            <div className="bg-[#142142] text-white px-5 sm:px-7 py-4.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black">
                  H
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    Help Ideias • Portal do Cliente
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Ambiente Seguro de Aprovação de Materiais
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fab518] bg-[#fab518]/15 px-3 py-1 rounded-full border border-[#fab518]/30">
                  {currentSimulatedDemand?.client}
                </span>
              </div>
            </div>

            {/* Client Portal Content */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Header of the piece */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      {currentSimulatedDemand?.type || 'Post Social Media'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Prazo: {currentSimulatedDemand?.dueDate}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white mt-1">
                    {currentSimulatedDemand?.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {currentSimulatedDemand?.description || 'Nenhuma observação ou orientação adicional informada para esta peça.'}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="self-start sm:self-auto">
                  {currentSimulatedDemand?.approvalStatus === 'aprovado' ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Aprovado por você</span>
                      </div>
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Liberado para agendamento e postagem</p>
                    </div>
                  ) : currentSimulatedDemand?.approvalStatus === 'alteracao_solicitada' ? (
                    <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-3 py-2 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                        <Edit3 size={16} className="text-amber-700 dark:text-amber-400" />
                        <span>Ajuste Solicitado</span>
                      </div>
                      <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">Nossa equipe já está ajustando</p>
                    </div>
                  ) : currentSimulatedDemand?.approvalStatus === 'reprovado' ? (
                    <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 px-3 py-2 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                        <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                        <span>Reprovado</span>
                      </div>
                      <p className="text-[10px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">A equipe recriará o material</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-3 py-2 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                        <Clock size={16} className="text-amber-700 dark:text-amber-400" />
                        <span>Aguardando sua decisão</span>
                      </div>
                      <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">Analise a prévia e selecione abaixo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Preview Stage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#142142] dark:text-white flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#fab518]" />
                    <span>Prévia do Material para Aprovação</span>
                  </h4>
                  {simulatedMedia.length > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {simulatedMedia.length} arquivo(s) disponível(is)
                    </span>
                  )}
                </div>

                {simulatedMedia.length > 0 ? (
                  <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[320px] max-h-[480px] p-2 relative group">
                    {simulatedMedia[0].type === 'video' ? (
                      <video
                        src={simulatedMedia[0].url}
                        controls
                        className="max-h-[460px] w-auto rounded-xl object-contain"
                        poster={simulatedMedia[0].thumbnailUrl}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                        onClick={() => setLightboxMedia(simulatedMedia[0])}
                      >
                        {simulatedMedia[0].url?.trim() ? (
                          <img
                            src={simulatedMedia[0].url}
                            alt={simulatedMedia[0].name}
                            className="max-h-[460px] w-auto object-contain rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-[300px] flex items-center justify-center text-slate-400">
                            <ImageIcon size={32} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLightboxMedia(simulatedMedia[0])}
                        className="px-3.5 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Maximize2 size={13} />
                        <span>Ver em Tela Cheia</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
                    <ImageIcon size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum arquivo ou prévia anexada ainda</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">A equipe adicionará a imagem/vídeo nos detalhes da demanda.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for the Client: Aprovar, Solicitar Alteração, Reprovar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Selecione uma ação para enviar sua validação imediatamente para a agência:
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSimulatorAction('aprovado')}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-full transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 size={16} />
                      <span>Aprovar Material</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFeedbackField((prev) => !prev)}
                      className={`flex-1 sm:flex-none px-4 py-2.5 font-bold text-xs sm:text-sm rounded-full transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        showFeedbackField
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                      }`}
                    >
                      <Edit3 size={15} />
                      <span>Fazer Alteração</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulatorAction('reprovado')}
                      className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold text-xs sm:text-sm rounded-full border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                    >
                      <XCircle size={15} />
                      <span>Reprovar</span>
                    </button>
                  </div>
                </div>

                {/* Input field for changes requested */}
                {showFeedbackField && (
                  <div className="p-4.5 bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-2.5 animate-in fade-in">
                    <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Edit3 size={13} className="text-amber-700 dark:text-amber-400" />
                      <span>O que você gostaria de alterar nesta arte/vídeo?</span>
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Descreva detalhadamente: ex: trocar a cor do botão para amarelo, aumentar a logo no topo e ajustar o texto da chamada..."
                      className="w-full bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-amber-300 dark:border-amber-700/60 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/30 focus:outline-none resize-none placeholder:text-slate-400 leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFeedbackField(false)}
                        className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulatorAction('alteracao_solicitada')}
                        disabled={!feedbackInput.trim()}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <Send size={13} />
                        <span>Enviar Ajustes para a Agência</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer of Client Portal */}
            <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Help Ideias • Sistema de Gestão e Aprovação</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                Conexão Criptografada
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#142142] text-white flex items-center justify-between border-b border-white/10">
              <span className="text-xs font-bold truncate">{lightboxMedia.name}</span>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex items-center justify-center bg-black/50 overflow-auto max-h-[calc(90vh-52px)]">
              {lightboxMedia.type === 'video' ? (
                <video 
                  src={lightboxMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[78vh] max-w-full rounded-xl bg-black" 
                />
              ) : lightboxMedia.url?.trim() ? (
                <img 
                  src={lightboxMedia.url} 
                  alt={lightboxMedia.name} 
                  className="max-h-[78vh] max-w-full object-contain rounded-xl" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="text-white text-sm">Mídia não disponível</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
