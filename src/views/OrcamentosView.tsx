import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Download, 
  TrendingUp, 
  Calendar,
  X,
  FileCheck,
  Building,
  Check,
  ArrowRight,
  Filter,
  Search,
  Share2,
  Eye,
  MessageCircle,
  Copy,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { initialProposals } from '../data/mockData';
import { BudgetProposal, Client, ProposalItem } from '../types';
import { ShareProposalModal } from '../components/ShareProposalModal';
import { PublicBudgetProposalView } from '../components/PublicBudgetProposalView';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface OrcamentosViewProps {
  proposals?: BudgetProposal[];
  clients?: Client[];
  onAddProposal?: (newProposal: BudgetProposal) => void;
  onUpdateStatus?: (id: string, newStatus: 'Enviado' | 'Aprovado' | 'Recusado') => void;
  onUpdateProposal?: (updated: BudgetProposal) => void;
  onDeleteProposal?: (id: string) => void;
}

export const OrcamentosView: React.FC<OrcamentosViewProps> = ({
  proposals: externalProposals,
  clients = [],
  onAddProposal,
  onUpdateStatus: externalUpdateStatus,
  onUpdateProposal,
  onDeleteProposal,
}) => {
  const [localProposals, setLocalProposals] = useState<BudgetProposal[]>(initialProposals);
  const proposals = externalProposals !== undefined ? externalProposals : localProposals;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<BudgetProposal | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<BudgetProposal | null>(null);
  const [sharingProposal, setSharingProposal] = useState<BudgetProposal | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<BudgetProposal | null>(null);
  const [previewProposalId, setPreviewProposalId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Enviado' | 'Aprovado' | 'Recusado'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for creating or editing a proposal
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactName, setContactName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectName, setProjectName] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const [proposalStatus, setProposalStatus] = useState<'Enviado' | 'Aprovado' | 'Recusado' | 'Rascunho'>('Enviado');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('50% de entrada + 50% na conclusão (Boleto ou Pix PJ)');
  const [deliveryTime, setDeliveryTime] = useState('Início em até 48h após aprovação formal');
  
  // Dynamic line items for proposal
  const [formItems, setFormItems] = useState<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    category: string;
    periodicity: 'mensal' | 'unico';
  }>>([
    {
      id: 'item-1',
      description: 'Gestão Estratégica de Redes Sociais & Criativos',
      quantity: 1,
      unitPrice: '2400',
      category: 'Social Media',
      periodicity: 'mensal',
    }
  ]);

  const handleOpenCreateModal = () => {
    setEditingProposal(null);
    setSelectedClientId('');
    setClientName('');
    setContactName('');
    setClientEmail('');
    setClientPhone('');
    setProjectName('');
    setScopeDescription('');
    setProposalStatus('Enviado');
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setValidUntil(d.toISOString().split('T')[0]);
    setPaymentTerms('50% de entrada + 50% na conclusão (Boleto ou Pix PJ)');
    setDeliveryTime('Início em até 48h após aprovação formal');
    setFormItems([
      {
        id: 'item-1',
        description: 'Gestão Estratégica de Redes Sociais & Criativos',
        quantity: 1,
        unitPrice: '2400',
        category: 'Social Media',
        periodicity: 'mensal',
      }
    ]);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (prop: BudgetProposal) => {
    setEditingProposal(prop);
    setSelectedClientId(prop.clientId || '');
    setClientName(prop.clientName || '');
    setContactName(prop.contactName || '');
    setClientEmail(prop.clientEmail || '');
    setClientPhone(prop.clientPhone || '');
    setProjectName(prop.projectName || '');
    setScopeDescription(prop.scopeDescription || '');
    setProposalStatus(prop.status || 'Enviado');
    setValidUntil(prop.validUntil || new Date().toISOString().split('T')[0]);
    setPaymentTerms(prop.paymentTerms || '50% de entrada + 50% na conclusão (Boleto ou Pix PJ)');
    setDeliveryTime(prop.deliveryTime || 'Início em até 48h após aprovação formal');

    if (prop.items && prop.items.length > 0) {
      setFormItems(
        prop.items.map((it, idx) => ({
          id: it.id || `item-${idx}`,
          description: it.description,
          quantity: it.quantity || 1,
          unitPrice: String(it.unitPrice || 0),
          category: it.category || 'Serviço',
          periodicity: (it.periodicity as any) || 'mensal',
        }))
      );
    } else if (prop.services && prop.services.length > 0) {
      const unit = Math.round(prop.totalValue / prop.services.length);
      setFormItems(
        prop.services.map((srv, idx) => ({
          id: `item-${idx}`,
          description: srv,
          quantity: 1,
          unitPrice: String(unit),
          category: 'Serviço',
          periodicity: 'mensal',
        }))
      );
    } else {
      setFormItems([
        {
          id: 'item-1',
          description: prop.projectName || 'Serviço Personalizado',
          quantity: 1,
          unitPrice: String(prop.totalValue || 0),
          category: 'Geral',
          periodicity: 'mensal',
        }
      ]);
    }

    setShowAddModal(true);
  };

  // Handle client select change in modal
  const handleClientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setSelectedClientId(cId);
    if (!cId) return;

    const matched = clients.find(c => c.id === cId);
    if (matched) {
      setClientName(matched.companyName || matched.name);
      setContactName(matched.contactName || matched.name);
      setClientEmail(matched.email || '');
      setClientPhone(matched.phone || '');
    }
  };

  const handleAddItemRow = () => {
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: '',
        quantity: 1,
        unitPrice: '1000',
        category: 'Tráfego Pago',
        periodicity: 'mensal',
      }
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (formItems.length <= 1) return;
    setFormItems(prev => prev.filter(i => i.id !== id));
  };

  const calculateFormTotal = () => {
    return formItems.reduce((acc, item) => {
      const price = parseFloat(item.unitPrice.replace(/\./g, '').replace(',', '.')) || 0;
      return acc + (price * (item.quantity || 1));
    }, 0);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectName.trim()) return;

    const totalVal = calculateFormTotal();
    const items: ProposalItem[] = formItems.map(fi => {
      const price = parseFloat(fi.unitPrice.replace(/\./g, '').replace(',', '.')) || 0;
      return {
        id: fi.id,
        description: fi.description.trim() || 'Serviço Personalizado',
        quantity: fi.quantity || 1,
        unitPrice: price,
        total: price * (fi.quantity || 1),
        category: fi.category,
        periodicity: fi.periodicity,
      };
    });

    if (editingProposal) {
      const updated: BudgetProposal = {
        ...editingProposal,
        clientName: clientName.trim(),
        clientId: selectedClientId || undefined,
        contactName: contactName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        projectName: projectName.trim(),
        scopeDescription: scopeDescription.trim() || undefined,
        totalValue: totalVal,
        validUntil,
        paymentTerms,
        deliveryTime,
        status: proposalStatus,
        servicesCount: items.length,
        services: items.map(i => i.description),
        items,
      };

      if (onUpdateProposal) {
        onUpdateProposal(updated);
      } else {
        setLocalProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
      }

      if (selectedProposal && selectedProposal.id === updated.id) {
        setSelectedProposal(updated);
      }

      setShowAddModal(false);
      setEditingProposal(null);
      showToast(`Orçamento ${updated.code} atualizado com sucesso!`);
      return;
    }

    const newProposal: BudgetProposal = {
      id: `prop-${Date.now()}`,
      code: `PROP-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
      clientName: clientName.trim(),
      clientId: selectedClientId || undefined,
      contactName: contactName.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      projectName: projectName.trim(),
      scopeDescription: scopeDescription.trim() || undefined,
      totalValue: totalVal,
      date: new Date().toLocaleDateString('pt-BR'),
      validUntil,
      paymentTerms,
      deliveryTime,
      status: proposalStatus,
      servicesCount: items.length,
      services: items.map(i => i.description),
      items,
      shareToken: `tok-prop-${Date.now().toString(36)}`,
      sentAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      viewsCount: 0,
    };

    if (onAddProposal) {
      onAddProposal(newProposal);
    } else {
      setLocalProposals([newProposal, ...localProposals]);
    }

    setShowAddModal(false);
    showToast(`Orçamento ${newProposal.code} criado com sucesso! Link pronto para envio.`);

    // Reset form
    setClientName('');
    setSelectedClientId('');
    setContactName('');
    setClientEmail('');
    setClientPhone('');
    setProjectName('');
    setScopeDescription('');

    // Open share modal automatically for high conversion
    setSharingProposal(newProposal);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Enviado' | 'Aprovado' | 'Recusado') => {
    if (externalUpdateStatus) {
      externalUpdateStatus(id, newStatus);
    } else {
      setLocalProposals(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
    if (selectedProposal && selectedProposal.id === id) {
      setSelectedProposal(prev => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`Status atualizado para "${newStatus}".`);
  };

  const handleExportPdf = (code: string) => {
    showToast(`Proposta comercial ${code} formatada para download em PDF.`);
    setTimeout(() => window.print(), 300);
  };

  const handleExecuteDelete = () => {
    if (!proposalToDelete) return;
    const targetId = proposalToDelete.id;
    const targetCode = proposalToDelete.code;

    if (onDeleteProposal) {
      onDeleteProposal(targetId);
    } else {
      setLocalProposals(prev => prev.filter(p => p.id !== targetId));
    }

    if (selectedProposal && selectedProposal.id === targetId) {
      setSelectedProposal(null);
    }

    setProposalToDelete(null);
    showToast(`Orçamento ${targetCode} excluído com sucesso.`);
  };

  const totalValueSum = proposals.reduce((acc, p) => acc + p.totalValue, 0);
  const approvedSum = proposals.filter(p => p.status === 'Aprovado').reduce((acc, p) => acc + p.totalValue, 0);
  const pendingCount = proposals.filter(p => p.status === 'Enviado').length;

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        (p.projectName && p.projectName.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.contactName && p.contactName.toLowerCase().includes(q)) ||
        (p.services && p.services.some(s => s.toLowerCase().includes(q)));

      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  // If in client preview mode inside the agency app
  if (previewProposalId) {
    return (
      <PublicBudgetProposalView
        proposalId={previewProposalId}
        proposals={proposals}
        clients={clients}
        isPreviewMode={true}
        onClosePreview={() => setPreviewProposalId(null)}
        onApprove={(pId, data) => {
          handleUpdateStatus(pId, 'Aprovado');
          if (onUpdateProposal) {
            const target = proposals.find(p => p.id === pId);
            if (target) {
              onUpdateProposal({
                ...target,
                status: 'Aprovado',
                approvedAt: new Date().toLocaleString('pt-BR'),
                clientSignerName: data.signerName,
                clientSignerRole: data.signerRole,
                clientDecisionNote: data.notes,
              });
            }
          }
          showToast(`Proposta aprovada com sucesso no modo de teste!`);
        }}
        onReject={(pId, reason) => {
          handleUpdateStatus(pId, 'Recusado');
          showToast(`Proposta recusada no modo de teste.`);
        }}
        onRequestChange={(pId, feedback) => {
          showToast(`Ajuste solicitado registrado com sucesso!`);
        }}
        onGoToAdminLogin={() => setPreviewProposalId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#142142] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#fab518]/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
            <Check size={14} className="stroke-[3]" />
          </div>
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      {/* Commercial Header & Filter Toolbar */}
      <div className="bg-white dark:bg-[#0f172a] p-3.5 sm:p-4 rounded-2xl sm:rounded-[24px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Search Bar & Status Filters */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              id="search-proposals-input"
              type="text"
              placeholder="Buscar por cliente, título ou serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 pl-9 pr-8 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#fab518] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                title="Limpar busca"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {(
              [
                { id: 'Todos', label: 'Todos', count: proposals.length, dotColor: 'bg-slate-400' },
                { id: 'Enviado', label: 'Enviados / Em Aberto', count: proposals.filter(p => p.status === 'Enviado').length, dotColor: 'bg-[#fab518]' },
                { id: 'Aprovado', label: 'Aprovados', count: proposals.filter(p => p.status === 'Aprovado').length, dotColor: 'bg-emerald-500' },
                { id: 'Recusado', label: 'Recusados', count: proposals.filter(p => p.status === 'Recusado').length, dotColor: 'bg-rose-500' },
              ] as const
            ).map((item) => {
              const isActive = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} ${isActive ? 'ring-2 ring-white/30 dark:ring-black/20' : ''}`} />
                  <span>{item.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/15 text-white dark:text-[#142142]'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: New Budget Button */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            id="btn-create-proposal-open"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* Financial Snapshot Capsules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#fab518] flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pipeline Total Negociado
            </span>
            <p className="text-2xl font-black text-[#142142] dark:text-white mt-0.5 font-mono tabular-nums">
              R$ {totalValueSum.toLocaleString('pt-BR')},00
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Orçamentos Aprovados
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono tabular-nums">
              R$ {approvedSum.toLocaleString('pt-BR')},00
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fab518]/20 text-[#fab518] flex items-center justify-center font-bold shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aguardando Decisão do Cliente
            </span>
            <p className="text-2xl font-black text-[#142142] dark:text-white mt-0.5 font-mono tabular-nums">
              {pendingCount} {pendingCount === 1 ? 'proposta aberta' : 'propostas abertas'}
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProposals.length === 0 ? (
          <div className="col-span-full py-12 px-6 text-center bg-white dark:bg-[#0f172a] rounded-[26px] border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#fab518] flex items-center justify-center mx-auto shadow-xs">
              <FileSpreadsheet size={24} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-[#142142] dark:text-white">
                {searchQuery.trim() !== ''
                  ? 'Nenhum orçamento encontrado'
                  : statusFilter === 'Todos'
                  ? 'Nenhum orçamento cadastrado ainda'
                  : `Nenhum orçamento com status "${statusFilter}"`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery.trim() !== ''
                  ? `Nenhum orçamento corresponde à pesquisa "${searchQuery}".`
                  : 'Crie propostas comerciais completas e envie o link direto para o cliente aprovar online via WhatsApp ou e-mail.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Gerar Novo Orçamento</span>
            </button>
          </div>
        ) : (
          filteredProposals.map((prop) => {
            const isApproved = prop.status === 'Aprovado';
            const isRejected = prop.status === 'Recusado';
            const isPending = prop.status === 'Enviado';

            return (
              <div
                key={prop.id}
                id={`proposal-card-${prop.id}`}
                className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 card-elevation-subtle hover:border-[#fab518] dark:hover:border-[#fab518] flex flex-col justify-between space-y-4 group transition-all"
              >
                {/* Card Top: Code, Edit Icon & Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
                        {prop.code}
                      </span>
                      
                      {/* Ícone de Editar no Topo do Card */}
                      <button
                        type="button"
                        id={`btn-edit-proposal-${prop.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(prop);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#142142] dark:hover:text-[#fab518] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar este orçamento"
                        aria-label="Editar orçamento"
                      >
                        <Edit2 size={13} className="stroke-[2.5]" />
                      </button>

                      {/* Ícone de Excluir no Topo do Card */}
                      <button
                        type="button"
                        id={`btn-delete-proposal-${prop.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProposalToDelete(prop);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Excluir este orçamento"
                        aria-label="Excluir orçamento"
                      >
                        <Trash2 size={13} className="stroke-[2.5]" />
                      </button>
                    </div>

                    <span
                      className={`
                        px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5
                        ${
                          isApproved
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : isPending
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : isRejected
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }
                      `}
                    >
                      {isApproved && <CheckCircle2 size={12} className="stroke-[2.5]" />}
                      {isPending && <Clock size={12} className="stroke-[2.5]" />}
                      {isRejected && <XCircle size={12} className="stroke-[2.5]" />}
                      <span>{isPending ? 'Enviado (Aguardando)' : prop.status}</span>
                    </span>
                  </div>

                  {/* Client & Project Details */}
                  <div 
                    onClick={() => setSelectedProposal(prop)} 
                    className="cursor-pointer"
                  >
                    <h4 className="text-base font-extrabold text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors leading-snug line-clamp-1">
                      {prop.clientName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-1">
                      {prop.projectName}
                    </p>
                  </div>

                  {/* Decision Tag / Approval details */}
                  {isApproved && prop.clientSignerName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60">
                      <UserCheck size={12} />
                      <span className="truncate">Aprovado por: {prop.clientSignerName}</span>
                    </div>
                  )}

                  {isRejected && prop.clientDecisionNote && (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50/70 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-900/60 line-clamp-1">
                      <XCircle size={12} />
                      <span className="truncate">Motivo: {prop.clientDecisionNote}</span>
                    </div>
                  )}

                  {/* Scope / Item Count & Validity */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Layers size={11} />
                      <span>{prop.servicesCount || (prop.items?.length || 1)} {(prop.servicesCount || (prop.items?.length || 1)) === 1 ? 'entregável' : 'entregáveis'}</span>
                    </span>

                    {prop.validUntil && (
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={11} />
                        <span>Validade: {new Date(prop.validUntil).toLocaleDateString('pt-BR')}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Value & Quick Action Buttons */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                        Investimento Total
                      </span>
                      <p className="text-base font-black text-[#142142] dark:text-white font-mono tabular-nums">
                        R$ {prop.totalValue.toLocaleString('pt-BR')},00
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewProposalId(prop.id)}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-[#fab518] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Pré-visualizar como o cliente vê a proposta"
                    >
                      <Eye size={13} />
                      <span>Ver como Cliente</span>
                    </button>
                  </div>

                  {/* Action Buttons: Editar, Ver Detalhes, Enviar Link, Excluir */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(prop);
                      }}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="Fazer alterações neste orçamento"
                      aria-label="Editar orçamento"
                    >
                      <Edit2 size={13} className="stroke-[2.5]" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProposal(prop)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center cursor-pointer truncate"
                    >
                      Ver Detalhes
                    </button>

                    <button
                      type="button"
                      onClick={() => setSharingProposal(prop)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Share2 size={13} className="stroke-[2.5]" />
                      <span>Enviar Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProposalToDelete(prop);
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0"
                      title="Excluir este orçamento"
                      aria-label="Excluir orçamento"
                    >
                      <Trash2 size={13} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Detalhes da Proposta Comercial */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-[#0a1224]/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                  {selectedProposal.code}
                </span>
                <h3 className="text-lg font-extrabold text-[#142142] dark:text-white mt-0.5">
                  {selectedProposal.clientName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`
                    px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1
                    ${
                      selectedProposal.status === 'Aprovado'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : selectedProposal.status === 'Recusado'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-[#fab518]'
                    }
                  `}
                >
                  {selectedProposal.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Share Action Highlight */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-bold shrink-0">
                  <Share2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#142142] dark:text-white">
                    Link de Aprovação Online do Cliente
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    O cliente visualiza o escopo e aprova com 1 clique.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSharingProposal(selectedProposal);
                  setSelectedProposal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>Enviar Link</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                  Projeto / Descrição
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedProposal.projectName}
                </p>
                {selectedProposal.scopeDescription && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed whitespace-pre-line">
                    {selectedProposal.scopeDescription}
                  </p>
                )}
              </div>

              {/* Items Breakdown if available */}
              {selectedProposal.items && selectedProposal.items.length > 0 && (
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-100/70 dark:bg-slate-800/80 px-3.5 py-2 font-bold text-[11px] text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Entregáveis / Serviços Inclusos</span>
                    <span>Subtotal</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedProposal.items.map((item, i) => (
                      <div key={item.id || i} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Qtd: {item.quantity} • Unit: R$ {item.unitPrice.toLocaleString('pt-BR')},00
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#142142] dark:text-white">
                          R$ {item.total.toLocaleString('pt-BR')},00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Investimento Total
                  </span>
                  <p className="font-black text-base text-[#142142] dark:text-white mt-0.5 font-mono tabular-nums">
                    R$ {selectedProposal.totalValue.toLocaleString('pt-BR')},00
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Alterar Status
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedProposal.id, 'Aprovado')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedProposal.status === 'Aprovado'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Aprovado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedProposal.id, 'Enviado')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedProposal.status === 'Enviado'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Enviado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedProposal.id, 'Recusado')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedProposal.status === 'Recusado'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Recusado
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewProposalId(selectedProposal.id);
                  setSelectedProposal(null);
                }}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-[#fab518] flex items-center gap-1 cursor-pointer"
              >
                <Eye size={13} />
                <span>Visualizar como Cliente</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedProposal;
                    setSelectedProposal(null);
                    setProposalToDelete(target);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Excluir este orçamento"
                >
                  <Trash2 size={13} />
                  <span>Excluir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = selectedProposal;
                    setSelectedProposal(null);
                    handleOpenEditModal(target);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf(selectedProposal.code)}
                  className="px-4 py-2 rounded-full bg-[#142142] hover:bg-[#1d2e56] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Novo Orçamento Comercial Completo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a1224]/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  {editingProposal ? <Edit2 size={18} /> : <FileSpreadsheet size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
                    {editingProposal ? `Editar Orçamento: ${editingProposal.code}` : 'Novo Orçamento Comercial'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingProposal
                      ? 'Faça alterações nos serviços, valores, escopo e condições deste orçamento'
                      : 'Cadastre uma nova proposta de serviços com itens detalhados e link de aprovação'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProposal(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              {/* Select Client or Type Custom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Selecionar Cliente Cadastrado (opcional)
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={handleClientSelectChange}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  >
                    <option value="">-- Selecione ou digite manualmente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name} ({c.segment || 'Cliente'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Nome da Empresa / Cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ótica Bella Vista"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Contact info for proposal communication */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. Roberto Meireles"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    WhatsApp para Envio
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    placeholder="contato@cliente.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Project title */}
              <div>
                <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Título do Projeto / Escopo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gestão de Redes Sociais + Tráfego de Alta Conversão"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                />
              </div>

              {/* Items Breakdown list in modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#142142] dark:text-slate-200">
                    Itens e Entregáveis do Orçamento
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-bold text-[#142142] dark:text-[#fab518] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    <span>Adicionar Serviço</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Descrição do serviço"
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormItems(prev => prev.map(i => i.id === item.id ? { ...i, description: val } : i));
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white p-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                      />

                      <div className="flex items-center gap-2">
                        <select
                          value={item.periodicity}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setFormItems(prev => prev.map(i => i.id === item.id ? { ...i, periodicity: val } : i));
                          }}
                          className="bg-white dark:bg-slate-900 text-[11px] text-[#142142] dark:text-white p-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                        >
                          <option value="mensal">Mensal</option>
                          <option value="unico">Único</option>
                        </select>

                        <div className="relative w-28">
                          <span className="absolute left-2 top-2 text-[10px] font-bold text-slate-400">R$</span>
                          <input
                            type="text"
                            required
                            placeholder="Valor"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormItems(prev => prev.map(i => i.id === item.id ? { ...i, unitPrice: val } : i));
                            }}
                            className="w-full bg-white dark:bg-slate-900 text-xs font-mono font-bold text-[#142142] dark:text-white p-2 pl-7 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                          />
                        </div>

                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  Total Consolidado da Proposta:
                </span>
                <span className="text-base font-black font-mono text-[#142142] dark:text-white">
                  R$ {calculateFormTotal().toLocaleString('pt-BR')},00
                </span>
              </div>

              {/* Validity, Terms and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Validade da Proposta
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Condição de Pagamento
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Status da Proposta
                  </label>
                  <select
                    value={proposalStatus}
                    onChange={(e) => setProposalStatus(e.target.value as any)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  >
                    <option value="Enviado">Enviado (Aguardando Decisão)</option>
                    <option value="Aprovado">Aprovado pelo Cliente</option>
                    <option value="Recusado">Recusado</option>
                    <option value="Rascunho">Rascunho Interno</option>
                  </select>
                </div>
              </div>

              {/* Scope description text area */}
              <div>
                <label className="block font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Detalhamento do Escopo e Objetivos (opcional)
                </label>
                <textarea
                  rows={2}
                  value={scopeDescription}
                  onChange={(e) => setScopeDescription(e.target.value)}
                  placeholder="Ex: Gestão de anúncios no Google e Meta focada em agendamentos de consulta, com relatórios quinzenais e reuniões de alinhamento..."
                  className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProposal(null);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {editingProposal ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>Salvar Alterações</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="stroke-[2.5]" />
                      <span>Gerar Orçamento & Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sharing Modal for Proposal Link */}
      {sharingProposal && (
        <ShareProposalModal
          isOpen={!!sharingProposal}
          onClose={() => setSharingProposal(null)}
          proposal={sharingProposal}
          client={clients.find(c => c.companyName === sharingProposal.clientName || c.id === sharingProposal.clientId)}
          onPreviewAsClient={(pId) => {
            setSharingProposal(null);
            setPreviewProposalId(pId);
          }}
        />
      )}

      {/* Confirmation Modal for Delete Proposal */}
      <ConfirmDeleteModal
        isOpen={!!proposalToDelete}
        onClose={() => setProposalToDelete(null)}
        onConfirm={handleExecuteDelete}
        itemType="orçamento"
        itemName={proposalToDelete ? `${proposalToDelete.code} - ${proposalToDelete.clientName}` : ''}
        title={proposalToDelete ? `Excluir Orçamento ${proposalToDelete.code}?` : 'Excluir Orçamento?'}
        description={
          proposalToDelete ? (
            <span>
              Tem certeza que deseja excluir o orçamento para{' '}
              <strong className="text-slate-900 dark:text-white font-bold">"{proposalToDelete.clientName}"</strong>{' '}
              referente ao projeto <em>"{proposalToDelete.projectName}"</em> no valor de{' '}
              <strong className="font-mono text-[#fab518] font-bold">
                R$ {proposalToDelete.totalValue.toLocaleString('pt-BR')},00
              </strong>? Esta ação é irreversível e o link público de aprovação deixará de funcionar.
            </span>
          ) : ''
        }
        confirmText="Sim, Excluir Orçamento"
        cancelText="Cancelar"
      />
    </div>
  );
};
