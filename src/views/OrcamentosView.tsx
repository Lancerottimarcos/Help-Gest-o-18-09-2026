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
  Search
} from 'lucide-react';
import { initialProposals } from '../data/mockData';
import { BudgetProposal } from '../types';

interface OrcamentosViewProps {
  proposals?: BudgetProposal[];
  onAddProposal?: (newProposal: BudgetProposal) => void;
  onUpdateStatus?: (id: string, newStatus: 'Enviado' | 'Aprovado' | 'Recusado') => void;
}

export const OrcamentosView: React.FC<OrcamentosViewProps> = ({
  proposals: externalProposals,
  onAddProposal,
  onUpdateStatus: externalUpdateStatus,
}) => {
  const [localProposals, setLocalProposals] = useState<BudgetProposal[]>(initialProposals);
  const proposals = externalProposals !== undefined ? externalProposals : localProposals;

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<BudgetProposal | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Enviado' | 'Aprovado' | 'Recusado'>('Todos');

  // Form states
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [status, setStatus] = useState<'Enviado' | 'Aprovado' | 'Recusado'>('Enviado');

  const totalValueSum = proposals.reduce((acc, p) => acc + p.totalValue, 0);
  const approvedSum = proposals.filter(p => p.status === 'Aprovado').reduce((acc, p) => acc + p.totalValue, 0);
  const pendingCount = proposals.filter(p => p.status === 'Enviado').length;

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectName.trim() || !totalValue) return;

    const numericValue = parseFloat(totalValue.replace(/\./g, '').replace(',', '.')) || 0;
    const newProposal: BudgetProposal = {
      id: `prop-${Date.now()}`,
      code: `ORC-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      totalValue: numericValue,
      status,
      date: new Date().toLocaleDateString('pt-BR'),
      servicesCount: 1,
    };

    if (onAddProposal) {
      onAddProposal(newProposal);
    } else {
      setLocalProposals([newProposal, ...localProposals]);
    }

    setClientName('');
    setProjectName('');
    setTotalValue('');
    setStatus('Enviado');
    setShowAddModal(false);
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
  };

  const handleExportPdf = (code: string) => {
    setDownloadSuccessToast(`Proposta ${code} gerada com sucesso.`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        (p.projectName && p.projectName.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.services && p.services.some(s => s.toLowerCase().includes(q)));

      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* Toast feedback */}
      {downloadSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#142142] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#fab518]/40 flex items-center gap-3 animate-fade-in">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
            <Check size={14} className="stroke-[3]" />
          </div>
          <p className="text-xs font-bold">{downloadSuccessToast}</p>
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
                { id: 'Enviado', label: 'Enviados', count: proposals.filter(p => p.status === 'Enviado').length, dotColor: 'bg-blue-500' },
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Novo orçamento</span>
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
              Pipeline Total
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
              Propostas Convertidas
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono tabular-nums">
              R$ {approvedSum.toLocaleString('pt-BR')},00
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Negociação em Aberto
            </span>
            <p className="text-2xl font-black text-[#142142] dark:text-white mt-0.5 font-mono tabular-nums">
              {pendingCount} {pendingCount === 1 ? 'proposta ativa' : 'propostas ativas'}
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                  : statusFilter === 'Todos'
                  ? 'Crie propostas comerciais e orçamentos para enviar aos seus clientes e acompanhar conversões e faturamento.'
                  : `Não há propostas cadastradas com o status "${statusFilter}".`}
              </p>
            </div>
            {searchQuery.trim() !== '' ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Limpar busca</span>
              </button>
            ) : statusFilter === 'Todos' ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>Gerar Primeiro Orçamento</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatusFilter('Todos')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Ver Todos os Orçamentos</span>
              </button>
            )}
          </div>
        ) : (
          filteredProposals.map((prop) => (
          <div
            key={prop.id}
            id={`proposal-card-${prop.id}`}
            onClick={() => setSelectedProposal(prop)}
            className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 card-elevation-subtle hover:border-[#fab518] dark:hover:border-[#fab518] flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
                  {prop.code}
                </span>
                <span
                  className={`
                    px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5
                    ${
                      prop.status === 'Aprovado'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : prop.status === 'Enviado'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }
                  `}
                >
                  {prop.status === 'Aprovado' && <CheckCircle2 size={12} className="stroke-[2.5]" />}
                  {prop.status === 'Enviado' && <Clock size={12} className="stroke-[2.5]" />}
                  {prop.status === 'Recusado' && <XCircle size={12} className="stroke-[2.5]" />}
                  <span>{prop.status}</span>
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-[#142142] dark:text-white group-hover:text-[#fab518] transition-colors leading-snug line-clamp-1">
                  {prop.clientName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-1">
                  {prop.projectName}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                  Valor Negociado
                </span>
                <p className="text-base font-black text-[#142142] dark:text-white font-mono tabular-nums">
                  R$ {prop.totalValue.toLocaleString('pt-BR')},00
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                  <Calendar size={12} />
                  <span>{prop.date}</span>
                </span>
              </div>
            </div>
          </div>
        ))
      )}
      </div>

      {/* Modal: Criar Novo Orçamento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
                    Novo Orçamento Comercial
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cadastre uma nova proposta de serviços para envio ao cliente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Nome do Cliente / Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AutoPrime Peças & Serviços"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Título do Projeto / Escopo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gestão de Redes Sociais + Tráfego de Alta Conversão"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Valor Total (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500 font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                      className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#F4F5F8] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium"
                  >
                    <option value="Enviado">Enviado (Aguardando)</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Recusado">Recusado</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs shadow-xs transition-all cursor-pointer"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes da Proposta */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                  {selectedProposal.code}
                </span>
                <h3 className="text-base font-extrabold text-[#142142] dark:text-white mt-0.5">
                  {selectedProposal.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                  Projeto / Descrição
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedProposal.projectName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Valor
                  </span>
                  <p className="font-black text-base text-[#142142] dark:text-white mt-0.5 font-mono tabular-nums">
                    R$ {selectedProposal.totalValue.toLocaleString('pt-BR')},00
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Status
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedProposal.id, 'Aprovado')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedProposal.status === 'Aprovado' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Aprovado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedProposal.id, 'Enviado')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedProposal.status === 'Enviado' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Pendente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
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
                <span>Exportar Proposta PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


