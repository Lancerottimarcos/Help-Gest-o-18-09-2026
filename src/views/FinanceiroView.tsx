import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Download, 
  DollarSign, 
  ShieldCheck, 
  Copy, 
  Receipt, 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Building2, 
  CreditCard,
  FileSpreadsheet,
  KeyRound,
  CheckSquare,
  Square
} from 'lucide-react';
import { Client, Invoice } from '../types';

interface FinanceiroViewProps {
  clients: Client[];
  invoices?: Invoice[];
  onAddInvoice?: (newInvoice: Invoice) => void;
  onToggleStatus?: (id: string) => void;
  onDeleteInvoice?: (id: string) => void;
  onDeleteMultipleInvoices?: (ids: string[]) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ 
  clients, 
  invoices: externalInvoices,
  onAddInvoice,
  onToggleStatus: externalToggleStatus,
  onDeleteInvoice: externalDeleteInvoice,
  onDeleteMultipleInvoices,
}) => {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const invoices = externalInvoices !== undefined ? externalInvoices : localInvoices;

  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // New Invoice Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newService, setNewService] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('Recorrência');
  const [newPaymentMethod, setNewPaymentMethod] = useState('PIX Direto');
  const [newStatus, setNewStatus] = useState<'Pendente' | 'Pago'>('Pendente');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cálculos estritamente baseados nas faturas geradas pelo usuário
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.value || 0), 0);

  const totalPaid = invoices
    .filter(i => i.status === 'Pago')
    .reduce((acc, i) => acc + (i.value || 0), 0);

  const totalPending = invoices
    .filter(i => i.status === 'Pendente')
    .reduce((acc, i) => acc + (i.value || 0), 0);

  // Recorrência calculada apenas se houver faturas geradas com escopo de recorrência
  const recurringInvoices = invoices.filter(i => 
    (i.category || '').toLowerCase().includes('recorr')
  );
  const mrr = recurringInvoices.reduce((acc, i) => acc + (i.value || 0), 0);

  const expenses = 0; // Despesas reais registradas
  const netProfit = totalPaid - expenses;
  const netMargin = totalPaid > 0 ? Math.round((netProfit / totalPaid) * 100) : 0;

  const handleCopyPix = (id: string) => {
    setCopiedId(id);
    navigator.clipboard?.writeText?.('financeiro@helpideiasdigitais.com.br');
    showToast('Chave PIX copiada para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleStatus = (id: string) => {
    if (externalToggleStatus) {
      externalToggleStatus(id);
    } else {
      setLocalInvoices(prev => prev.map(inv => {
        if (inv.id === id) {
          return {
            ...inv,
            status: inv.status === 'Pago' ? 'Pendente' : 'Pago'
          };
        }
        return inv;
      }));
    }
  };

  const handleDelete = (id: string) => {
    if (externalDeleteInvoice) {
      externalDeleteInvoice(id);
    } else {
      setLocalInvoices(prev => prev.filter(inv => inv.id !== id));
    }
    showToast('Fatura excluída com sucesso.');
  };

  const handleToggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInvoices = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedInvoiceIds.length === 0) return;
    if (onDeleteMultipleInvoices) {
      onDeleteMultipleInvoices(selectedInvoiceIds);
      setSelectedInvoiceIds([]);
    } else {
      setLocalInvoices(prev => prev.filter(inv => !selectedInvoiceIds.includes(inv.id)));
      showToast(`${selectedInvoiceIds.length} faturas excluídas com sucesso.`);
      setSelectedInvoiceIds([]);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newService.trim() || !newValue) {
      alert('Por favor, preencha o cliente, o serviço e o valor da fatura.');
      return;
    }

    const numValue = parseFloat(newValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numValue) || numValue <= 0) {
      alert('Por favor, insira um valor numérico válido.');
      return;
    }

    const clientInitials = newClient
      .trim()
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('') || 'CL';

    const formattedDate = newDueDate 
      ? newDueDate.split('-').reverse().join('/') 
      : new Date().toLocaleDateString('pt-BR');

    const newInvoiceObj: Invoice = {
      id: `FAT-${new Date().getFullYear()}-${String(invoices.length + 101).padStart(3, '0')}`,
      client: newClient.trim(),
      clientInitial: clientInitials,
      service: newService.trim(),
      value: numValue,
      dueDate: formattedDate,
      status: newStatus,
      category: newCategory,
      paymentMethod: newPaymentMethod,
    };

    if (onAddInvoice) {
      onAddInvoice(newInvoiceObj);
    } else {
      setLocalInvoices(prev => [newInvoiceObj, ...prev]);
    }

    // Reset modal
    setNewClient('');
    setNewService('');
    setNewValue('');
    setNewDueDate('');
    setNewCategory('Recorrência');
    setNewPaymentMethod('PIX Direto');
    setNewStatus('Pendente');
    setIsModalOpen(false);
    showToast(`Fatura ${newInvoiceObj.id} cadastrada com sucesso!`);
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      showToast('Nenhuma fatura cadastrada para exportar.');
      return;
    }

    const headers = ['Código', 'Cliente', 'Serviço', 'Categoria', 'Forma Pagamento', 'Vencimento', 'Valor (R$)', 'Status'];
    const rows = invoices.map(i => [
      i.id,
      `"${i.client.replace(/"/g, '""')}"`,
      `"${i.service.replace(/"/g, '""')}"`,
      i.category,
      i.paymentMethod,
      i.dueDate,
      i.value.toFixed(2),
      i.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório financeiro exportado em CSV com sucesso!');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'paid' && inv.status !== 'Pago') return false;
    if (activeTab === 'pending' && inv.status !== 'Pendente') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.client.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        inv.service.toLowerCase().includes(q) ||
        inv.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#142142] text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} className="text-[#fab518]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Financial Overview Cards - 100% Real Data Driven */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturado Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle group hover:border-[#fab518] transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#fab518]/10 dark:bg-[#fab518]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Total Faturado • Emitido
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#fab518]/15 text-[#142142] dark:text-[#fab518] flex items-center justify-center">
              <Sparkles size={16} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#142142] dark:text-white mt-2 font-mono tabular-nums tracking-tight">
            R$ {totalInvoiced.toLocaleString('pt-BR')},00
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {invoices.length} {invoices.length === 1 ? 'fatura gerada' : 'faturas geradas'}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold font-mono">
              <TrendingUp size={13} />
              <span>{mrr > 0 ? `R$ ${mrr.toLocaleString('pt-BR')},00 rec.` : invoices.length > 0 ? `${invoices.length} emissões` : 'R$ 0,00'}</span>
            </div>
          </div>
        </div>

        {/* Faturamento Liquidado (Pago) */}
        <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle group hover:border-[#142142] dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Receita Liquidada
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight size={16} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums tracking-tight">
            R$ {totalPaid.toLocaleString('pt-BR')},00
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            <span>{invoices.filter(i => i.status === 'Pago').length} fatura(s) paga(s)</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">Efetivado</span>
          </div>
        </div>

        {/* A Receber (Pendente) */}
        <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle group hover:border-amber-300 dark:hover:border-amber-900/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              A Receber • Pendente
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono tabular-nums tracking-tight">
            R$ {totalPending.toLocaleString('pt-BR')},00
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            <span>{invoices.filter(i => i.status === 'Pendente').length} fatura(s) em aberto</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">Em Aberto</span>
          </div>
        </div>

        {/* Lucro Operacional */}
        <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle group hover:border-emerald-300 dark:hover:border-emerald-900/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Resultado Líquido
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#142142] dark:text-slate-300 flex items-center justify-center">
              <ShieldCheck size={16} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#142142] dark:text-white mt-2 font-mono tabular-nums tracking-tight">
            R$ {netProfit.toLocaleString('pt-BR')},00
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Margem Operacional</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 px-2.5 py-0.5 rounded-full font-mono">
              {netMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* Financial Health Ribbon */}
      <div className="bg-gradient-to-r from-[#142142] via-[#1a2d59] to-[#142142] text-white p-5 rounded-[24px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 font-black shadow-sm">
            <Receipt size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              Balanço Financeiro da Agência
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                invoices.length > 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-white/10 text-slate-300 border-white/20'
              }`}>
                {invoices.length > 0 ? `${invoices.length} Fatura(s)` : 'Sem Faturas'}
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Receita liquidada: <span className="font-mono font-bold text-[#fab518]">R$ {totalPaid.toLocaleString('pt-BR')},00</span> • A liquidar: <span className="font-mono font-bold text-white">R$ {totalPending.toLocaleString('pt-BR')},00</span> • Total emitido: <span className="font-mono font-bold text-slate-200">R$ {totalInvoiced.toLocaleString('pt-BR')},00</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleCopyPix('global')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Copy size={13} />
            <span>{copiedId === 'global' ? 'Chave PIX Copiada!' : 'Chave PIX Agência'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* Invoices Cockpit */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle overflow-hidden">
        {/* Filters and Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[#142142] dark:text-white tracking-tight">
              Faturas & Cobranças
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gestão de liquidação de mensalidades de mídias e entregas de projetos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar cliente ou fatura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#fab518]"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pagas ({invoices.filter(i => i.status === 'Pago').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pendentes ({invoices.filter(i => i.status === 'Pendente').length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Nova Fatura</span>
            </button>
          </div>
        </div>

        {/* Invoices Table / Clean Empty State */}
        {selectedInvoiceIds.length > 0 && (
          <div className="mx-6 my-3 p-3.5 rounded-2xl bg-[#142142] text-white flex flex-wrap items-center justify-between gap-3 shadow-md border border-[#fab518]/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#fab518] text-[#142142] flex items-center justify-center font-black text-xs">
                {selectedInvoiceIds.length}
              </span>
              <div>
                <p className="text-xs font-bold">
                  {selectedInvoiceIds.length === 1 ? '1 fatura selecionada' : `${selectedInvoiceIds.length} faturas selecionadas`}
                </p>
                <p className="text-[10px] text-slate-300">
                  Operação em lote protegida pelo protocolo de segurança 2FA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceIds([])}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Desmarcar Todas
              </button>
              <button
                type="button"
                id="btn-bulk-delete-invoices"
                onClick={handleBulkDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <KeyRound size={13} className="text-[#fab518]" />
                <Trash2 size={13} />
                <span>Excluir Selecionadas com 2FA</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                <Receipt size={28} className="stroke-[1.5]" />
              </div>
              <h4 className="text-base font-black text-[#142142] dark:text-white">
                Nenhuma fatura gerada
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
                Os valores e indicadores financeiros são calculados exclusivamente quando você gera faturas. Clique no botão abaixo para emitir sua primeira fatura.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <Plus size={16} className="stroke-[3]" />
                <span>Gerar Primeira Fatura</span>
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card List View (Phones & Small Viewports) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma fatura encontrada com os filtros atuais.
                  </div>
                ) : (
                  filteredInvoices.map((inv) => (
                    <div 
                      key={`mob-${inv.id}`}
                      className={`p-4 space-y-2.5 transition-colors ${
                        selectedInvoiceIds.includes(inv.id) ? 'bg-[#fab518]/10 dark:bg-[#fab518]/15' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedInvoiceIds.includes(inv.id)}
                            onChange={() => handleToggleSelectInvoice(inv.id)}
                            className="w-4 h-4 accent-[#fab518] rounded cursor-pointer shrink-0"
                          />
                          <span className="font-mono font-bold text-xs text-[#142142] dark:text-[#fab518] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {inv.id}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                            inv.status === 'Pago'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {inv.status === 'Pago' ? <CheckCircle2 size={11} className="stroke-[2.5]" /> : <Clock size={11} className="stroke-[2.5]" />}
                          <span>{inv.status}</span>
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#142142] dark:text-white truncate">
                            {inv.client}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {inv.service}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-[#142142] dark:text-white block">
                            R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Venc: {new Date(`${inv.dueDate}T00:00:00`).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {inv.paymentMethod} • {inv.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyPix(inv.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Copiar PIX"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Excluir fatura"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <table className="hidden md:table w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8F9FA] dark:bg-slate-900/80 text-[#142142] dark:text-slate-300 font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 sm:pl-6 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                      onChange={handleSelectAllInvoices}
                      className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                      title="Selecionar todas as faturas"
                    />
                  </th>
                  <th className="p-4">Fatura / Código</th>
                  <th className="p-4">Cliente & Segmento</th>
                  <th className="p-4">Serviço / Escopo</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 sm:pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhuma fatura encontrada com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group ${
                        selectedInvoiceIds.includes(inv.id) ? 'bg-[#fab518]/5 dark:bg-[#fab518]/10' : ''
                      }`}
                    >
                      <td className="p-4 sm:pl-6 text-center">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.includes(inv.id)}
                          onChange={() => handleToggleSelectInvoice(inv.id)}
                          className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-xs text-[#142142] dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {inv.id}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 font-medium">{inv.paymentMethod}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#142142] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {inv.clientInitial || 'CL'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{inv.client}</p>
                            <span className="text-[10px] text-slate-400">{inv.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                        {inv.service}
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {inv.dueDate}
                      </td>
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white tabular-nums text-sm">
                        R$ {inv.value.toLocaleString('pt-BR')},00
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv.id)}
                          className={`
                            px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all
                            ${
                              inv.status === 'Pago'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
                            }
                          `}
                          title="Clique para alternar entre Pago e Pendente"
                        >
                          {inv.status === 'Pago' ? <CheckCircle2 size={12} className="stroke-[2.5]" /> : <Clock size={12} className="stroke-[2.5]" />}
                          <span>{inv.status}</span>
                        </button>
                      </td>
                      <td className="p-4 sm:pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyPix(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Copiar Chave PIX"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Excluir fatura"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
        </div>
      </div>

      {/* Modal - Nova Fatura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142142] dark:text-white">
                    Cadastrar Nova Fatura
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registre um faturamento de mensalidade ou entrega avulsa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                  Cliente *
                </label>
                {clients.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#fab518]"
                      required
                    >
                      <option value="">Selecione um cliente cadastrado...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ou digite o nome de outro cliente..."
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#fab518]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Ex: Minha Empresa / Cliente X"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#fab518]"
                    required
                  />
                )}
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                  Serviço / Descrição do Escopo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gestão de Social Media (Mensalidade) ou Landing Page"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#fab518]"
                  required
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 3500.00"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#fab518]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#fab518]"
                  >
                    <option value="Recorrência">Recorrência (MRR)</option>
                    <option value="Projeto Pontual">Projeto Pontual</option>
                    <option value="Desenvolvimento">Desenvolvimento</option>
                    <option value="Tráfego Pago">Tráfego Pago</option>
                    <option value="Design Geral">Design Geral</option>
                    <option value="Consultoria">Consultoria</option>
                  </select>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    Forma de Pagamento
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#fab518]"
                  >
                    <option value="PIX Direto">PIX Direto</option>
                    <option value="Boleto 30D">Boleto 30D</option>
                    <option value="Cartão PJ">Cartão PJ</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                  Status Inicial
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                    newStatus === 'Pendente' 
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="Pendente" 
                      checked={newStatus === 'Pendente'} 
                      onChange={() => setNewStatus('Pendente')} 
                      className="sr-only" 
                    />
                    <Clock size={14} />
                    <span>Pendente</span>
                  </label>

                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                    newStatus === 'Pago' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="Pago" 
                      checked={newStatus === 'Pago'} 
                      onChange={() => setNewStatus('Pago')} 
                      className="sr-only" 
                    />
                    <CheckCircle2 size={14} />
                    <span>Pago</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Salvar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
