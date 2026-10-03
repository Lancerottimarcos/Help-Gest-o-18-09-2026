import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  KeyRound,
  Lock,
  EyeOff,
  Building2,
  Share2,
  ChevronRight,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  SendHorizontal
} from 'lucide-react';
import { DemandItem, Client, DemandAttachment } from '../types';
import { supabaseService } from '../services/supabaseService';
import { ClientPasswordManagerModal } from '../components/ClientPasswordManagerModal';

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
  onUpdateClient?: (client: Client) => void;
  onSelectClientDemands?: (clientName: string) => void;
}

type TabType = 'gestao' | 'simulador' | 'acessos';
type DeviceMode = 'desktop' | 'mobile';

export const PortalClienteView: React.FC<PortalClienteViewProps> = ({
  demands,
  clients,
  onClientApprovalAction,
  onOpenWhatsAppNotification,
  onOpenDemandModal,
  onUpdateClient,
  onSelectClientDemands,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('gestao');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  
  // Filters for approval management
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Demand for preview / simulation
  const [simulatedDemandId, setSimulatedDemandId] = useState<string>(() => {
    const inApproval = demands.find((d) => d.columnId === 'aprovacao' || d.approvalStatus);
    return inApproval ? inApproval.id : (demands[0]?.id || '');
  });

  // Simulator state
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [showFeedbackField, setShowFeedbackField] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // General UI states
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedAccessClientId, setCopiedAccessClientId] = useState<string | null>(null);
  const [copiedDirectLinkClientId, setCopiedDirectLinkClientId] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<DemandAttachment | null>(null);

  // Client credentials editing state
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [showPasswordsMap, setShowPasswordsMap] = useState<Record<string, boolean>>({});
  const [isPasswordManagerModalOpen, setIsPasswordManagerModalOpen] = useState(false);

  // Reset media index when simulated demand changes
  useEffect(() => {
    setActiveMediaIndex(0);
    setShowFeedbackField(false);
    setFeedbackInput('');
  }, [simulatedDemandId]);

  // Approval demands filter
  const approvalDemands = useMemo(() => {
    return demands.filter((d) => {
      return (
        d.columnId === 'aprovacao' || 
        d.approvalStatus || 
        (d.statusLabel && (d.statusLabel.toLowerCase().includes('aprov') || d.statusLabel.toLowerCase().includes('ajuste')))
      );
    });
  }, [demands]);

  // Filtered list of demands
  const displayDemands = useMemo(() => {
    const baseList = approvalDemands.length > 0 ? approvalDemands : demands;
    return baseList.filter((d) => {
      const matchesClient = 
        selectedClientFilter === 'todos' || 
        d.client.toLowerCase() === selectedClientFilter.toLowerCase() ||
        (d.clientProject && d.clientProject.toLowerCase() === selectedClientFilter.toLowerCase());

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        query === '' || 
        d.title.toLowerCase().includes(query) || 
        d.client.toLowerCase().includes(query) ||
        (d.id && d.id.toLowerCase().includes(query)) ||
        (d.description && d.description.toLowerCase().includes(query));
      
      let matchesStatus = true;
      if (selectedStatusFilter === 'pendente') {
        matchesStatus = d.columnId === 'aprovacao' && (!d.approvalStatus || d.approvalStatus === 'pendente');
      } else if (selectedStatusFilter === 'aprovado') {
        matchesStatus = d.approvalStatus === 'aprovado' || d.columnId === 'concluidas';
      } else if (selectedStatusFilter === 'alteracao') {
        matchesStatus = d.approvalStatus === 'alteracao_solicitada';
      } else if (selectedStatusFilter === 'reprovado') {
        matchesStatus = d.approvalStatus === 'reprovado';
      }

      return matchesClient && matchesSearch && matchesStatus;
    });
  }, [approvalDemands, demands, selectedClientFilter, selectedStatusFilter, searchQuery]);

  // Operational metrics
  const totalInReview = useMemo(() => demands.filter((d) => d.columnId === 'aprovacao').length, [demands]);
  const totalApproved = useMemo(() => demands.filter((d) => d.approvalStatus === 'aprovado' || d.columnId === 'concluidas').length, [demands]);
  const totalChangesRequested = useMemo(() => demands.filter((d) => d.approvalStatus === 'alteracao_solicitada').length, [demands]);
  const totalActiveClientsWithPortal = useMemo(() => clients.filter((c) => c.portalAccessEnabled !== false).length, [clients]);

  // Currently simulated demand
  const currentSimulatedDemand = useMemo(() => {
    return demands.find((d) => d.id === simulatedDemandId) || demands[0];
  }, [demands, simulatedDemandId]);

  // Extract visual attachments (images and videos)
  const getMediaAttachments = (demand?: DemandItem): DemandAttachment[] => {
    if (!demand || !demand.attachments) return [];
    return demand.attachments.filter((a) => a.type === 'image' || a.type === 'video');
  };

  const simulatedMediaList = useMemo(() => {
    return getMediaAttachments(currentSimulatedDemand);
  }, [currentSimulatedDemand]);

  // Copiar link de acesso para o cliente - abre a tela de login para inserir usuário e senha
  const handleCopyLink = (demand: DemandItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.helpideias.com.br';
    const clientObj = clients.find(
      (c) => c.name.toLowerCase().trim() === (demand.client || '').toLowerCase().trim() ||
             c.id === demand.clientId
    );
    const username = clientObj?.portalUsername || clientObj?.name.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const url = username
      ? `${origin}/?login=cliente&user=${encodeURIComponent(username)}&demandId=${encodeURIComponent(demand.id)}`
      : `${origin}/?login=cliente&demandId=${encodeURIComponent(demand.id)}`;
    
    navigator.clipboard.writeText(url);
    setCopiedToken(demand.id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Copy full client welcome and access message for WhatsApp
  const handleCopyClientAccessCredentials = (client: Client) => {
    const username = client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const password = client.portalPassword || '123456';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.helpideias.com.br';
    const loginUrl = `${origin}/?login=cliente&user=${encodeURIComponent(username)}`;

    const message = `Olá, equipe da *${client.name}*! 👋\n\n` +
      `Seu acesso exclusivo ao Portal do Cliente da *Help Ideias Digitais* está ativo para você acompanhar todos os seus materiais e aprovar suas demandas em tempo real:\n\n` +
      `🔗 *Acesse a tela de login aqui:* ${loginUrl}\n` +
      `👤 *Usuário:* ${username}\n` +
      `🔑 *Senha:* ${password}\n\n` +
      `Ao clicar no link, abrirá a tela de login para você inserir seu usuário e senha e ter acesso direto ao seu portal e aprovação de demandas!`;

    navigator.clipboard.writeText(message);
    setCopiedAccessClientId(client.id);
    setTimeout(() => setCopiedAccessClientId(null), 2500);
  };

  // Copy direct login page URL for the client
  const handleCopyDirectLoginLink = (client: Client) => {
    const username = client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.helpideias.com.br';
    const loginUrl = `${origin}/?login=cliente&user=${encodeURIComponent(username)}`;

    navigator.clipboard.writeText(loginUrl);
    setCopiedDirectLinkClientId(client.id);
    setTimeout(() => setCopiedDirectLinkClientId(null), 2500);
  };

  // Handle client decision in simulator
  const handleSimulatorAction = (action: 'aprovado' | 'reprovado' | 'alteracao_solicitada') => {
    if (!currentSimulatedDemand) return;
    onClientApprovalAction(currentSimulatedDemand.id, action, feedbackInput.trim() || undefined);
    
    const labels = {
      aprovado: 'Material aprovado com sucesso! Movido para agendamento.',
      reprovado: 'Demanda reprovada. Retornada para produção da agência.',
      alteracao_solicitada: 'Solicitação de alteração enviada para a equipe de criação.',
    };

    setActionSuccessNotice(labels[action]);
    setTimeout(() => setActionSuccessNotice(null), 4000);
    setFeedbackInput('');
    setShowFeedbackField(false);
  };

  // Toggle client portal access status
  const handleToggleClientPortalAccess = (client: Client) => {
    if (!onUpdateClient) return;
    const isCurrentlyEnabled = client.portalAccessEnabled !== false;
    const updated: Client = {
      ...client,
      portalAccessEnabled: !isCurrentlyEnabled,
    };
    onUpdateClient(updated);
  };

  // Save client portal credentials inline
  const handleStartEditingClient = (client: Client) => {
    setEditingClientId(client.id);
    setEditingUsername(client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    setEditingPassword(client.portalPassword || '123456');
  };

  const handleSaveClientCredentials = (client: Client) => {
    if (!onUpdateClient) return;
    const updated: Client = {
      ...client,
      portalUsername: editingUsername.trim().toLowerCase(),
      portalPassword: editingPassword.trim() || '123456',
      portalAccessEnabled: client.portalAccessEnabled !== false,
    };
    onUpdateClient(updated);
    if (supabaseService.isConfigured()) {
      supabaseService.upsertClient(updated);
    }
    setEditingClientId(null);
  };

  const toggleShowPassword = (clientId: string) => {
    setShowPasswordsMap((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Preset feedback chips
  const feedbackChips = [
    'Ajustar o texto da chamada',
    'Aumentar o logotipo da marca',
    'Trocar a imagem de fundo',
    'Corrigir a data/horário informado',
    'Adequar às cores da identidade visual',
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[28px] p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#fab518] text-[#142142]">
              Hub Operacional
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Aprovações & Acessos dos Clientes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142142] dark:text-white tracking-tight">
            Portal do Cliente
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Central de envio de links de validação rápida para WhatsApp, acompanhamento de feedbacks em tempo real e administração de acessos individuais.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F2F4F8] dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gestao')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gestao'
                ? 'bg-white dark:bg-slate-900 text-[#142142] dark:text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <Monitor size={15} />
            <span>Fila de Aprovação ({approvalDemands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'simulador'
                ? 'bg-white dark:bg-slate-900 text-[#142142] dark:text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <Smartphone size={15} />
            <span>Simulador do Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('acessos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'acessos'
                ? 'bg-white dark:bg-slate-900 text-[#142142] dark:text-[#fab518] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <KeyRound size={15} />
            <span>Acessos & Senhas ({clients.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Aguardando Aprovação
            </span>
            <div className="text-2xl font-black text-[#142142] dark:text-white mt-1 tabular-nums">
              {totalInReview}
            </div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Demandas na coluna de validação
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Materiais Aprovados
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {totalApproved}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Prontos para postagem e entrega
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Ajustes Solicitados
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
              {totalChangesRequested}
            </div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Retornados para equipe de design
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Edit3 size={22} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Portais Ativos
            </span>
            <div className="text-2xl font-black text-[#142142] dark:text-white mt-1 tabular-nums">
              {totalActiveClientsWithPortal}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              De {clients.length} clientes cadastrados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* TAB 1: GESTÃO DA FILA DE APROVAÇÃO */}
      {activeTab === 'gestao' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por demanda, cliente, projeto..."
                  className="w-full bg-[#F5F7FA] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-white pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
              </div>

              {/* Client Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Building2 size={14} className="text-slate-400" />
                <select
                  value={selectedClientFilter}
                  onChange={(e) => setSelectedClientFilter(e.target.value)}
                  className="bg-[#F5F7FA] dark:bg-slate-800 text-xs font-bold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:outline-none transition-all cursor-pointer"
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
                className="bg-[#F5F7FA] dark:bg-slate-800 text-xs font-bold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:outline-none transition-all cursor-pointer shrink-0"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Aguardando Aprovação</option>
                <option value="aprovado">Aprovado pelo Cliente</option>
                <option value="alteracao">Ajuste Solicitado</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 self-end md:self-auto shrink-0">
              Exibindo <span className="text-[#142142] dark:text-white font-black">{displayDemands.length}</span> demandas
            </div>
          </div>

          {/* Demands List */}
          <div className="space-y-3.5">
            {displayDemands.length === 0 ? (
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Clock size={26} />
                </div>
                <h3 className="text-base font-black text-[#142142] dark:text-white">
                  Nenhuma demanda encontrada
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Para que um material apareça nesta lista, mova o card para a coluna "Aprovação" no Quadro Kanban ou limpe os filtros de busca acima.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientFilter('todos');
                    setSelectedStatusFilter('todos');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-[#142142] dark:text-white rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Limpar Filtros</span>
                </button>
              </div>
            ) : (
              displayDemands.map((demand) => {
                const media = getMediaAttachments(demand);
                const firstMedia = media[0];
                const isCopied = copiedToken === demand.id;

                return (
                  <div 
                    key={demand.id}
                    className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 hover:border-[#fab518]/70 dark:hover:border-[#fab518]/40 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Media Thumbnail + Metadata */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Media Thumbnail */}
                      <div 
                        className="relative w-20 h-20 rounded-2xl bg-slate-950 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center group cursor-pointer"
                        onClick={() => {
                          if (firstMedia) setLightboxMedia(firstMedia);
                        }}
                        title={firstMedia ? 'Clique para ampliar mídia' : 'Sem arquivo anexado'}
                      >
                        {firstMedia ? (
                          firstMedia.type === 'video' ? (
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-[#fab518]">
                              <Film size={24} />
                              <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Vídeo</span>
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
                              <ImageIcon size={22} className="mb-0.5" />
                              <span>Sem mídia</span>
                            </div>
                          )
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center justify-center text-[10px]">
                            <ImageIcon size={22} className="mb-0.5" />
                            <span>Sem mídia</span>
                          </div>
                        )}

                        {firstMedia && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={18} />
                          </div>
                        )}
                      </div>

                      {/* Demand details */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-[#fab518] text-[#142142]">
                            #{demand.id.replace('dem-', '')}
                          </span>
                          <h3 
                            className="text-base font-black text-[#142142] dark:text-white hover:text-[#fab518] cursor-pointer truncate transition-colors"
                            onClick={() => onOpenDemandModal && onOpenDemandModal(demand)}
                            title="Clique para abrir detalhes da demanda"
                          >
                            {demand.title}
                          </h3>
                        </div>

                        {/* Quiet Metadata with Typographic Separators */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-bold text-[#142142] dark:text-slate-200">
                            {demand.client}
                          </span>
                          {demand.clientProject && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{demand.clientProject}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Prazo: {demand.dueDate || 'A definir'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Resp: {demand.assignee?.name || 'Equipe Help'}</span>
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {demand.approvalStatus === 'aprovado' || demand.columnId === 'concluidas' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                              Aprovado pelo Cliente
                            </span>
                          ) : demand.approvalStatus === 'alteracao_solicitada' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                              <Edit3 size={14} className="text-amber-600 dark:text-amber-400" />
                              Ajuste Solicitado pelo Cliente
                            </span>
                          ) : demand.approvalStatus === 'reprovado' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                              <XCircle size={14} className="text-rose-600 dark:text-rose-400" />
                              Reprovado pelo Cliente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                              <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                              Aguardando Decisão do Cliente
                            </span>
                          )}
                        </div>

                        {/* If feedback was given by the client */}
                        {demand.approvalFeedback && (
                          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200">
                            <span className="font-black text-amber-900 dark:text-amber-300">Ajuste Solicitado pelo Cliente: </span>
                            <span className="italic">"{demand.approvalFeedback}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Operational Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 flex-wrap sm:flex-nowrap">
                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(demand)}
                        className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#142142] dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Copiar link direto de validação deste material"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
                        <span>{isCopied ? 'Link Copiado!' : 'Copiar Link'}</span>
                      </button>

                      {/* WhatsApp Share */}
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppNotification(demand)}
                        className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Enviar link e notificação formatada para o cliente no WhatsApp"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </button>

                      {/* Open in Simulator */}
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedDemandId(demand.id);
                          setActiveTab('simulador');
                        }}
                        className="px-3.5 py-2.5 bg-[#142142] dark:bg-[#fab518] hover:opacity-90 text-white dark:text-[#142142] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Simular visualização como o cliente verá no navegador"
                      >
                        <ExternalLink size={14} />
                        <span>Simular</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SIMULADOR DA VISÃO DO CLIENTE */}
      {activeTab === 'simulador' && (
        <div className="space-y-5">
          {/* Simulator Toolbar */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-black text-[#142142] dark:text-white shrink-0">
                Visualizando Demanda:
              </span>
              <select
                value={simulatedDemandId}
                onChange={(e) => setSimulatedDemandId(e.target.value)}
                className="bg-[#F5F7FA] dark:bg-slate-800 text-xs font-bold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none transition-all cursor-pointer flex-1 md:w-80"
              >
                {demands.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.client} — {d.title} ({d.columnId})
                  </option>
                ))}
              </select>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center gap-1 bg-[#F2F4F8] dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'desktop'
                      ? 'bg-white dark:bg-slate-900 text-[#142142] dark:text-[#fab518] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#142142]'
                  }`}
                  title="Visualização em Desktop / Notebook"
                >
                  <Monitor size={14} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'mobile'
                      ? 'bg-white dark:bg-slate-900 text-[#142142] dark:text-[#fab518] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#142142]'
                  }`}
                  title="Visualização em Smartphone / Celular"
                >
                  <Smartphone size={14} />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Copy link */}
              {currentSimulatedDemand && (
                <button
                  type="button"
                  onClick={() => handleCopyLink(currentSimulatedDemand)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-[#142142] dark:text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar link real do cliente"
                >
                  {copiedToken === currentSimulatedDemand.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedToken === currentSimulatedDemand.id ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Success Toast if simulated action dispatched */}
          {actionSuccessNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{actionSuccessNotice}</span>
            </div>
          )}

          {/* SIMULATED SHELL CONTAINER */}
          <div className="flex justify-center transition-all duration-300">
            <div 
              className={`
                bg-white dark:bg-[#0c1322] shadow-2xl transition-all duration-300 overflow-hidden
                ${deviceMode === 'mobile' 
                  ? 'w-[390px] rounded-[48px] border-8 border-slate-800 dark:border-slate-700 shadow-slate-950/40 relative' 
                  : 'w-full max-w-4xl rounded-[32px] border border-slate-200 dark:border-slate-800'
                }
              `}
            >
              {/* Mobile Device Notch if in mobile mode */}
              {deviceMode === 'mobile' && (
                <div className="bg-slate-800 dark:bg-slate-700 pt-2 pb-1 flex justify-center items-center">
                  <div className="w-24 h-4 rounded-full bg-black/40 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  </div>
                </div>
              )}

              {/* Portal Header */}
              <div className="bg-[#142142] text-white px-5 sm:px-7 py-4.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black text-sm shadow-xs">
                    H
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                      Help Ideias • Portal do Cliente
                    </h2>
                    <p className="text-[10px] text-slate-300">
                      Ambiente de Validação e Aprovação
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#fab518] bg-[#fab518]/15 px-3 py-1 rounded-full border border-[#fab518]/30">
                    {currentSimulatedDemand?.client || 'Cliente'}
                  </span>
                </div>
              </div>

              {/* Portal Content Area */}
              <div className="p-5 sm:p-7 space-y-6">
                {/* Header Information */}
                <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-black uppercase text-[#142142] dark:text-[#fab518]">
                      {currentSimulatedDemand?.type || 'Material Publicitário'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Prazo: {currentSimulatedDemand?.dueDate || 'A combinar'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white tracking-tight">
                    {currentSimulatedDemand?.title}
                  </h3>
                  {currentSimulatedDemand?.description && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                      {currentSimulatedDemand.description}
                    </p>
                  )}
                </div>

                {/* Status Notice if already reviewed */}
                {currentSimulatedDemand?.approvalStatus && (
                  <div>
                    {currentSimulatedDemand.approvalStatus === 'aprovado' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                            Material Aprovado
                          </p>
                          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                            Liberado para postagem e envio pela equipe da agência.
                          </p>
                        </div>
                      </div>
                    )}
                    {currentSimulatedDemand.approvalStatus === 'alteracao_solicitada' && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
                        <Edit3 size={18} className="text-amber-700 dark:text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-amber-950 dark:text-amber-200">
                            Ajuste Solicitado
                          </p>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                            {currentSimulatedDemand.approvalFeedback ? `"${currentSimulatedDemand.approvalFeedback}"` : 'Em revisão pela equipe de criação.'}
                          </p>
                        </div>
                      </div>
                    )}
                    {currentSimulatedDemand.approvalStatus === 'reprovado' && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                        <XCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-rose-950 dark:text-rose-200">
                            Material Reprovado
                          </p>
                          <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                            A equipe recriará a proposta com novas orientações.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Stage */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider">
                      Arquivos para Aprovação
                    </span>
                    {simulatedMediaList.length > 1 && (
                      <span className="text-xs font-semibold text-slate-500">
                        {activeMediaIndex + 1} de {simulatedMediaList.length}
                      </span>
                    )}
                  </div>

                  {simulatedMediaList.length > 0 ? (
                    <div className="space-y-2.5">
                      <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[260px] max-h-[480px] p-2 relative group shadow-inner">
                        {simulatedMediaList[activeMediaIndex].type === 'video' ? (
                          <video
                            src={simulatedMediaList[activeMediaIndex].url}
                            controls
                            className="max-h-[440px] w-auto rounded-xl object-contain"
                            poster={simulatedMediaList[activeMediaIndex].thumbnailUrl}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center cursor-pointer"
                            onClick={() => setLightboxMedia(simulatedMediaList[activeMediaIndex])}
                            title="Clique para abrir em tela cheia"
                          >
                            {simulatedMediaList[activeMediaIndex].url?.trim() ? (
                              <img
                                src={simulatedMediaList[activeMediaIndex].url}
                                alt={simulatedMediaList[activeMediaIndex].name}
                                className="max-h-[440px] w-auto object-contain rounded-xl"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-[260px] flex items-center justify-center text-slate-400">
                                <ImageIcon size={32} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fullscreen Button */}
                        <button
                          type="button"
                          onClick={() => setLightboxMedia(simulatedMediaList[activeMediaIndex])}
                          className="absolute bottom-3 right-3 px-3.5 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-xl text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Maximize2 size={13} />
                          <span>Tela Cheia</span>
                        </button>
                      </div>

                      {/* Thumbnail strip if multiple assets */}
                      {simulatedMediaList.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {simulatedMediaList.map((m, idx) => (
                            <button
                              key={m.id || idx}
                              type="button"
                              onClick={() => setActiveMediaIndex(idx)}
                              className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                activeMediaIndex === idx 
                                  ? 'border-[#fab518] ring-2 ring-[#fab518]/30 scale-105' 
                                  : 'border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img 
                                src={m.thumbnailUrl || m.url} 
                                alt={m.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                      <ImageIcon size={28} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum arquivo anexado a esta demanda</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Adicione artes ou vídeos nos detalhes da demanda no Kanban.</p>
                    </div>
                  )}
                </div>

                {/* Client Decision Action Panel */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Selecione uma ação para enviar sua decisão imediatamente:
                    </span>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Approve button */}
                      <button
                        type="button"
                        onClick={() => handleSimulatorAction('aprovado')}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 size={16} />
                        <span>Aprovar</span>
                      </button>

                      {/* Request changes */}
                      <button
                        type="button"
                        onClick={() => setShowFeedbackField((prev) => !prev)}
                        className={`flex-1 sm:flex-none px-4 py-2.5 font-bold text-xs rounded-xl transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          showFeedbackField
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 shadow-2xs hover:bg-amber-50'
                        }`}
                      >
                        <Edit3 size={15} />
                        <span>Pedir Ajuste</span>
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        onClick={() => handleSimulatorAction('reprovado')}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                      >
                        <XCircle size={15} />
                        <span>Reprovar</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback field with presets */}
                  {showFeedbackField && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                          <Edit3 size={13} className="text-amber-700" />
                          <span>O que você gostaria de alterar nesta peça?</span>
                        </label>
                        <span className="text-[10px] text-amber-800/80 font-medium">Sugestões rápidas abaixo:</span>
                      </div>

                      {/* Preset Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {feedbackChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setFeedbackInput((prev) => prev ? `${prev} · ${chip}` : chip)}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Descreva as alterações detalhadas para a agência..."
                        className="w-full bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-amber-300 dark:border-amber-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 focus:outline-none resize-none placeholder:text-slate-400"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFeedbackField(false)}
                          className="px-3.5 py-1.5 text-xs text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulatorAction('alteracao_solicitada')}
                          disabled={!feedbackInput.trim()}
                          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Send size={13} />
                          <span>Enviar Ajuste para a Agência</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Portal Footer */}
              <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Help Ideias • Sistema de Aprovação Segura</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={13} />
                  Criptografia de Ponta a Ponta
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACESSOS E CREDENCIAIS DOS CLIENTES */}
      {activeTab === 'acessos' && (
        <div className="space-y-4">
          {/* Header Description */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-[#142142] dark:text-white">
                Diretório de Acessos Individuais
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aqui você visualiza, edita senhas e compartilha os dados de login de cada cliente para que eles acessem a página de Demandas.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPasswordManagerModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#142142] text-[#fab518] hover:bg-[#1a2d59] text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound size={14} />
                <span>Gerenciador de Senhas em Massa</span>
              </button>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Total de Contas: <span className="text-[#142142] dark:text-white font-black">{clients.length}</span>
              </div>
            </div>
          </div>

          {/* Clients Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => {
              const username = client.portalUsername || client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const password = client.portalPassword || '123456';
              const isEnabled = client.portalAccessEnabled !== false;
              const isCopied = copiedAccessClientId === client.id;
              const isDirectLinkCopied = copiedDirectLinkClientId === client.id;
              const isEditing = editingClientId === client.id;
              const showPass = Boolean(showPasswordsMap[client.id]);

              return (
                <div
                  key={client.id}
                  className="bg-white dark:bg-[#0f172a] rounded-[24px] p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#fab518]/60 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Client Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#142142] text-[#fab518] flex items-center justify-center font-black text-sm shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-[#142142] dark:text-white truncate">
                            {client.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                            {client.email || 'Sem email cadastrado'}
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleClientPortalAccess(client)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer border ${
                          isEnabled
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isEnabled ? 'Clique para desativar acesso' : 'Clique para ativar acesso'}
                      >
                        {isEnabled ? '● Ativo' : '○ Pausado'}
                      </button>
                    </div>

                    {/* Credentials Box */}
                    <div className="p-3.5 bg-[#F8F9FA] dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Usuário:</span>
                            <input
                              type="text"
                              value={editingUsername}
                              onChange={(e) => setEditingUsername(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-[#fab518] text-xs font-bold text-[#142142] dark:text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Senha:</span>
                            <input
                              type="text"
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-[#fab518] text-xs font-bold text-[#142142] dark:text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingClientId(null)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveClientCredentials(client)}
                              className="px-3 py-1 bg-[#142142] text-[#fab518] text-[11px] font-black rounded-lg cursor-pointer shadow-xs"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Usuário:</span>
                            <span className="font-mono font-bold text-[#142142] dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {username}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Senha:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#142142] dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {showPass ? password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPassword(client.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                title={showPass ? 'Ocultar senha' : 'Ver senha'}
                              >
                                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEditingClient(client)}
                        className="text-[11px] font-bold text-slate-500 hover:text-[#142142] dark:hover:text-[#fab518] cursor-pointer"
                      >
                        Editar Acesso
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                      {/* View demands */}
                      {onSelectClientDemands && (
                        <button
                          type="button"
                          onClick={() => onSelectClientDemands(client.name)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#142142] dark:text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                          title="Abrir demandas deste cliente"
                        >
                          Materiais ({client.activeDemandsCount || 0})
                        </button>
                      )}

                      {/* Copy direct login page link */}
                      <button
                        type="button"
                        onClick={() => handleCopyDirectLoginLink(client)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                          isDirectLinkCopied
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                        title="Copiar link que abre a tela de login para o cliente inserir usuário e senha"
                      >
                        {isDirectLinkCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{isDirectLinkCopied ? 'Link Copiado!' : 'Copiar Link Login'}</span>
                      </button>

                      {/* Copy WhatsApp Invitation with direct login link */}
                      <button
                        type="button"
                        onClick={() => handleCopyClientAccessCredentials(client)}
                        className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-black rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Copiar mensagem pronta para enviar no WhatsApp com o link da tela de login e credenciais"
                      >
                        {isCopied ? <Check size={13} /> : <MessageCircle size={13} />}
                        <span>{isCopied ? 'Copiado!' : 'Enviar Acesso'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="px-5 py-4 bg-[#142142] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon size={18} className="text-[#fab518] shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">{lightboxMedia.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {lightboxMedia.url && (
                  <a
                    href={lightboxMedia.url}
                    download={lightboxMedia.name}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Baixar arquivo original"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Baixar</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxMedia(null)}
                  className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Fechar prévia"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lightbox Body */}
            <div className="p-4 flex items-center justify-center bg-black/60 overflow-auto max-h-[calc(92vh-64px)]">
              {lightboxMedia.type === 'video' ? (
                <video 
                  src={lightboxMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[80vh] max-w-full rounded-2xl bg-black shadow-lg" 
                />
              ) : lightboxMedia.url?.trim() ? (
                <img 
                  src={lightboxMedia.url} 
                  alt={lightboxMedia.name} 
                  className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-lg" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="text-white text-sm py-16">Mídia não disponível</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Client Password Manager Modal */}
      {isPasswordManagerModalOpen && onUpdateClient && (
        <ClientPasswordManagerModal
          isOpen={isPasswordManagerModalOpen}
          onClose={() => setIsPasswordManagerModalOpen(false)}
          clients={clients}
          onUpdateClient={onUpdateClient}
        />
      )}
    </div>
  );
};
