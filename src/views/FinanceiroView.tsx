import React, { useState, useMemo } from 'react';
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
  CreditCard,
  KeyRound,
  Check,
  AlertTriangle,
  ArrowUpDown,
  Wallet,
  Percent,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { Client, Invoice } from '../types';

export const normalizeInvoice = (raw: any): Invoice => {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `FAT-${Date.now()}`,
      client: 'Cliente',
      service: 'Serviço da Agência',
      value: 0,
      dueDate: new Date().toLocaleDateString('pt-BR'),
      status: 'Pendente',
      category: 'Recorrência Mensal',
      paymentMethod: 'PIX PJ Direto'
    };
  }

  const rawVal = raw.value !== undefined ? raw.value : raw.amount;
  const numVal = typeof rawVal === 'number' ? rawVal : (parseFloat(String(rawVal || 0).replace(/[^\d.-]/g, '')) || 0);

  const clientName = String(raw.client || raw.clientName || 'Cliente').trim();
  const serviceName = String(raw.service || raw.description || 'Serviço da Agência').trim();
  const categoryName = String(raw.category || 'Recorrência Mensal').trim();
  const method = String(raw.paymentMethod || 'PIX PJ Direto').trim();
  
  const rawStatus = String(raw.status || 'Pendente').trim().toLowerCase();
  const isPaid = rawStatus === 'pago' || rawStatus === 'paga' || rawStatus === 'paid';
  const status: 'Pago' | 'Pendente' = isPaid ? 'Pago' : 'Pendente';

  const clientInitials = raw.clientInitial || clientName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || '')
    .join('') || 'CL';

  let rawDate = String(raw.dueDate || raw.issueDate || '').trim();
  let formattedDate = rawDate;
  if (rawDate && rawDate.includes('-')) {
    const parts = rawDate.split('T')[0].split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  return {
    id: String(raw.id || raw.code || `FAT-${Date.now()}`),
    client: clientName,
    clientInitial: clientInitials,
    service: serviceName,
    value: numVal,
    dueDate: formattedDate || new Date().toLocaleDateString('pt-BR'),
    status,
    category: categoryName,
    paymentMethod: method,
  };
};

interface FinanceiroViewProps {
  clients?: Client[];
  invoices?: Invoice[];
  onAddInvoice?: (newInvoice: Invoice) => void;
  onToggleStatus?: (id: string) => void;
  onDeleteInvoice?: (id: string) => void;
  onDeleteMultipleInvoices?: (ids: string[]) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ 
  clients = [], 
  invoices: externalInvoices,
  onAddInvoice,
  onToggleStatus: externalToggleStatus,
  onDeleteInvoice: externalDeleteInvoice,
  onDeleteMultipleInvoices,
}) => {
  const safeClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return clients.filter((c): c is Client => Boolean(c && typeof c === 'object' && c.name));
  }, [clients]);

  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  
  const invoices = useMemo(() => {
    const list = externalInvoices !== undefined ? externalInvoices : localInvoices;
    if (!Array.isArray(list)) return [];
    return list.filter(Boolean).map(normalizeInvoice);
  }, [externalInvoices, localInvoices]);

  // Filtros & Controles de Ledger
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'value_desc' | 'value_asc' | 'client_asc'>('date_desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Modal Nova Fatura
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newService, setNewService] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('Recorrência Mensal');
  const [newPaymentMethod, setNewPaymentMethod] = useState('PIX PJ Direto');
  const [newStatus, setNewStatus] = useState<'Pendente' | 'Pago'>('Pendente');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Verificador se fatura está atrasada em relação à data atual
  const isInvoiceOverdue = (inv: Invoice): boolean => {
    if (inv.status === 'Pago') return false;
    if (!inv.dueDate) return false;
    const parts = inv.dueDate.split('/');
    if (parts.length === 3) {
      const due = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due < today;
    }
    return false;
  };

  // Categorias disponíveis a partir das faturas existentes
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [invoices]);

  // Cálculos do Motor Financeiro
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((acc, i) => acc + (i.value || 0), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices
      .filter(i => i.status === 'Pago')
      .reduce((acc, i) => acc + (i.value || 0), 0);
  }, [invoices]);

  const totalPending = useMemo(() => {
    return invoices
      .filter(i => i.status === 'Pendente')
      .reduce((acc, i) => acc + (i.value || 0), 0);
  }, [invoices]);

  const totalOverdue = useMemo(() => {
    return invoices
      .filter(i => isInvoiceOverdue(i))
      .reduce((acc, i) => acc + (i.value || 0), 0);
  }, [invoices]);

  const overdueCount = useMemo(() => {
    return invoices.filter(i => isInvoiceOverdue(i)).length;
  }, [invoices]);

  // MRR: Recorrência Mensal
  const mrr = useMemo(() => {
    return invoices
      .filter(i => (i.category || '').toLowerCase().includes('recorr'))
      .reduce((acc, i) => acc + (i.value || 0), 0);
  }, [invoices]);

  // Ticket Médio
  const averageTicket = useMemo(() => {
    return invoices.length > 0 ? totalInvoiced / invoices.length : 0;
  }, [invoices.length, totalInvoiced]);

  // Taxa de Liquidação Efetivada (%)
  const realizationRate = useMemo(() => {
    return totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
  }, [totalPaid, totalInvoiced]);

  // Faturas Filtradas e Ordenadas
  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(inv => {
      if (activeTab === 'paid' && inv.status !== 'Pago') return false;
      if (activeTab === 'pending' && inv.status !== 'Pendente') return false;
      if (activeTab === 'overdue' && !isInvoiceOverdue(inv)) return false;

      if (selectedCategory !== 'all' && inv.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (inv.client || '').toLowerCase().includes(q) ||
          (inv.id || '').toLowerCase().includes(q) ||
          (inv.service || '').toLowerCase().includes(q) ||
          (inv.category || '').toLowerCase().includes(q) ||
          (inv.paymentMethod || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'value_desc') return (b.value || 0) - (a.value || 0);
      if (sortBy === 'value_asc') return (a.value || 0) - (b.value || 0);
      if (sortBy === 'client_asc') return (a.client || '').localeCompare(b.client || '');
      
      // Ordenação por data (padrão)
      const parseDate = (d?: string) => {
        if (!d) return 0;
        const p = d.split('/');
        if (p.length === 3) return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
        return 0;
      };
      const dateA = parseDate(a.dueDate);
      const dateB = parseDate(b.dueDate);
      if (sortBy === 'date_asc') return dateA - dateB;
      return dateB - dateA;
    });

    return result;
  }, [invoices, activeTab, selectedCategory, searchQuery, sortBy]);

  const handleCopyPix = (id: string) => {
    setCopiedId(id);
    navigator.clipboard?.writeText?.('financeiro@helpideiasdigitais.com.br');
    showToast('Chave PIX (CNPJ/E-mail) copiada com sucesso!');
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
    showToast('Fatura excluída do sistema.');
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

  // Marcar selecionadas como pagas em lote
  const handleBulkMarkAsPaid = () => {
    if (selectedInvoiceIds.length === 0) return;
    selectedInvoiceIds.forEach(id => {
      const inv = invoices.find(i => i.id === id);
      if (inv && inv.status === 'Pendente') {
        handleToggleStatus(id);
      }
    });
    showToast(`${selectedInvoiceIds.length} fatura(s) atualizadas como Pagas!`);
    setSelectedInvoiceIds([]);
  };

  // Exclusão em lote
  const handleBulkDelete = () => {
    if (selectedInvoiceIds.length === 0) return;
    if (onDeleteMultipleInvoices) {
      onDeleteMultipleInvoices(selectedInvoiceIds);
      setSelectedInvoiceIds([]);
    } else {
      setLocalInvoices(prev => prev.filter(inv => !selectedInvoiceIds.includes(inv.id)));
      showToast(`${selectedInvoiceIds.length} faturas excluídas.`);
      setSelectedInvoiceIds([]);
    }
  };

  // Seleção automática ao selecionar um cliente no modal
  const handleSelectClientInModal = (clientName: string) => {
    setNewClient(clientName);
    const found = safeClients.find(c => c.name === clientName);
    if (found) {
      if (found.monthlyFee && found.monthlyFee > 0 && !newValue) {
        setNewValue(String(found.monthlyFee));
      }
      if (found.segment && !newService) {
        setNewService(`Gestão Mensal (${found.segment})`);
      }
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newService.trim() || !newValue) {
      showToast('Por favor, informe o cliente, o serviço e o valor.');
      return;
    }

    const numValue = parseFloat(newValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numValue) || numValue <= 0) {
      showToast('Por favor, insira um valor numérico válido.');
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
    setNewCategory('Recorrência Mensal');
    setNewPaymentMethod('PIX PJ Direto');
    setNewStatus('Pendente');
    setIsModalOpen(false);
    showToast(`Fatura ${newInvoiceObj.id} emitida com sucesso!`);
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      showToast('Nenhuma fatura cadastrada para exportar.');
      return;
    }

    const headers = ['Código', 'Cliente', 'Serviço', 'Categoria', 'Forma de Pagamento', 'Vencimento', 'Valor (R$)', 'Status'];
    const rows = invoices.map(i => [
      i.id,
      `"${(i.client || '').replace(/"/g, '""')}"`,
      `"${(i.service || '').replace(/"/g, '""')}"`,
      `"${(i.category || 'Recorrência').replace(/"/g, '""')}"`,
      `"${(i.paymentMethod || 'PIX PJ Direto').replace(/"/g, '""')}"`,
      i.dueDate || '',
      (i.value || 0).toFixed(2),
      i.status || 'Pendente'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financeiro_help_ideias_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório exportado em CSV com sucesso.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#142142] text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={15} className="text-[#fab518]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP HEADER APP BAR: Architectural Breadcrumb & Quick Actions     */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Operações</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Gestão Financeira & Cobranças
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Painel Financeiro da Agência
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-[11px] font-mono tabular-nums">
                {invoices.length} faturas
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleCopyPix('header')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copiar Chave PIX oficial da Help Ideias Digitais"
          >
            {copiedId === 'header' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedId === 'header' ? 'Chave Copiada' : 'Chave PIX'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Exportar planilha completa em CSV"
          >
            <Download size={13} />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-[#fab518] hover:bg-[#e0a215] text-[#142142] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FINANCIAL OVERVIEW CARDS: Single-Elevation Depth, Tabular Figures */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Total Faturado */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Faturamento Emitido
            </span>
            <Sparkles size={14} className="text-[#fab518]" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
            R$ {totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Ticket Médio:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* KPI 2: Receita Liquidada (Pago) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Receita Liquidada (Paga)
            </span>
            <ArrowUpRight size={14} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Taxa de Liquidação:</span>
            <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {realizationRate}%
            </span>
          </div>
        </div>

        {/* KPI 3: Previsão a Receber (Pendente) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              A Receber (Em Aberto)
            </span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums tracking-tight">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Status da Cobrança:</span>
            {overdueCount > 0 ? (
              <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono tabular-nums flex items-center gap-1">
                <AlertTriangle size={11} /> {overdueCount} vencida(s)
              </span>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                Em dia
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: MRR (Recorrência Mensal) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              MRR (Recorrência Fixa)
            </span>
            <Wallet size={14} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[#142142] dark:text-[#fab518] font-mono tabular-nums tracking-tight">
            R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Previsibilidade:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {totalInvoiced > 0 ? `${Math.round((mrr / totalInvoiced) * 100)}% do volume` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. CASHFLOW REALIZATION BAR & METRICS STRIP                          */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">
              Realização do Fluxo de Caixa
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              {realizationRate}% liquidado
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">
                Liquidado: R$ {totalPaid.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span className="text-slate-600 dark:text-slate-300">
                A Receber: R$ {totalPending.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Proportional Realization Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div 
            style={{ width: `${realizationRate}%` }} 
            className="h-full bg-emerald-500 transition-all duration-300"
            title={`Liquidado: ${realizationRate}%`}
          />
          <div 
            style={{ width: `${100 - realizationRate}%` }} 
            className="h-full bg-amber-400 transition-all duration-300"
            title={`Pendente: ${100 - realizationRate}%`}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. INVOICES LEDGER & CONTROLS (High-Density Tabular Grid)           */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0c1424] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        {/* Controls Toolbar: Search, Status Tabs, Category Filter, and Sorting */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Status Tabs (Segmented Buttons) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paid')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'paid'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pagas ({invoices.filter(i => i.status === 'Pago').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pendentes ({invoices.filter(i => i.status === 'Pendente').length})
            </button>
            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('overdue')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'overdue'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                    : 'text-rose-600/80 hover:text-rose-600'
                }`}
              >
                Vencidas ({overdueCount})
              </button>
            )}
          </div>

          {/* Search, Category Selector & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar cliente, código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            {availableCategories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as Categorias</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="date_desc">Vencimento (Mais novo)</option>
                <option value="date_asc">Vencimento (Mais antigo)</option>
                <option value="value_desc">Valor (Maior)</option>
                <option value="value_asc">Valor (Menor)</option>
                <option value="client_asc">Cliente (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Strip (appears when 1 or more invoices are selected) */}
        {selectedInvoiceIds.length > 0 && (
          <div className="mx-4 my-2.5 p-3 rounded-xl bg-[#142142] text-white flex flex-wrap items-center justify-between gap-3 shadow-sm border border-[#fab518]/40 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#fab518] text-[#142142] flex items-center justify-center font-black text-xs font-mono">
                {selectedInvoiceIds.length}
              </span>
              <span className="text-xs font-semibold">
                {selectedInvoiceIds.length === 1 ? '1 fatura selecionada' : `${selectedInvoiceIds.length} faturas selecionadas`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkMarkAsPaid}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                <span>Marcar como Pagas</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Excluir Selecionadas</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoiceIds([])}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
              >
                Desmarcar
              </button>
            </div>
          </div>
        )}

        {/* Ledger Table Container */}
        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <Receipt size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhuma fatura cadastrada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
                Emita sua primeira fatura para calcular métricas de liquidação e previsão de faturamento.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fab518] hover:bg-[#e0a215] text-[#142142] text-xs font-black shadow-2xs transition-all cursor-pointer"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>Emitir Primeira Fatura</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop High-Density Table */}
              <table className="hidden md:table w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                        onChange={handleSelectAllInvoices}
                        className="w-3.5 h-3.5 accent-[#fab518] rounded cursor-pointer"
                        title="Selecionar todas as faturas visíveis"
                      />
                    </th>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Serviço / Escopo</th>
                    <th className="py-3 px-3">Vencimento</th>
                    <th className="py-3 px-3">Forma</th>
                    <th className="py-3 px-3 text-right">Valor (R$)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Nenhuma fatura encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const overdue = isInvoiceOverdue(inv);
                      const isSelected = selectedInvoiceIds.includes(inv.id);

                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${
                            isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectInvoice(inv.id)}
                              className="w-3.5 h-3.5 accent-[#fab518] rounded cursor-pointer"
                            />
                          </td>

                          {/* Code */}
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {inv.id}
                          </td>

                          {/* Client */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#142142] text-[#fab518] flex items-center justify-center font-bold text-[10px] shrink-0">
                                {inv.clientInitial || 'CL'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {inv.client}
                                </p>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {inv.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                            {inv.service}
                          </td>

                          {/* Due Date */}
                          <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                                {inv.dueDate}
                              </span>
                              {overdue && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  Vencida
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {inv.paymentMethod}
                          </td>

                          {/* Value */}
                          <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-white tabular-nums text-right text-sm">
                            R$ {(inv.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Status Toggle Button */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(inv.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                                inv.status === 'Pago'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                              }`}
                              title="Clique para alternar entre Pago e Pendente"
                            >
                              {inv.status === 'Pago' ? (
                                <CheckCircle2 size={12} className="stroke-[2.5]" />
                              ) : (
                                <Clock size={12} className="stroke-[2.5]" />
                              )}
                              <span>{inv.status}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyPix(inv.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Copiar Chave PIX"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(inv.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Excluir fatura"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Mobile Card List (Phones & Small Viewports) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Nenhuma fatura encontrada.
                  </div>
                ) : (
                  filteredInvoices.map((inv) => {
                    const overdue = isInvoiceOverdue(inv);
                    const isSelected = selectedInvoiceIds.includes(inv.id);

                    return (
                      <div 
                        key={`mob-${inv.id}`}
                        className={`p-4 space-y-2.5 transition-colors ${
                          isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectInvoice(inv.id)}
                              className="w-4 h-4 accent-[#fab518] rounded cursor-pointer shrink-0"
                            />
                            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                              {inv.id}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(inv.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer border ${
                              inv.status === 'Pago'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {inv.status === 'Pago' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            <span>{inv.status}</span>
                          </button>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {inv.client}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {inv.service}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums block">
                              R$ {(inv.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] font-mono tabular-nums ${overdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                              Venc: {inv.dueDate} {overdue ? '(Vencida)' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                          <span>{inv.paymentMethod} · {inv.category}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyPix(inv.id)}
                              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                              title="Copiar PIX"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(inv.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL: EMISSÃO DE NOVA FATURA                                     */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0c1424] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center font-bold border border-amber-300/80 dark:border-amber-700/60">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cadastrar Nova Fatura
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registre cobranças de mensalidades fixas ou entregas avulsas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-3.5">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente da Agência *
                </label>
                {safeClients.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={newClient}
                      onChange={(e) => handleSelectClientInModal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                      required
                    >
                      <option value="">Selecione um cliente cadastrado...</option>
                      {safeClients.map(c => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ou digite o nome de outro cliente..."
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Nome da empresa cliente"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                    required
                  />
                )}
              </div>

              {/* Serviço / Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Serviço / Escopo Faturado *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gestão de Tráfego Pago & Meta Ads (Mensalidade)"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                  required
                />
              </div>

              {/* Valor & Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 3500.00"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                  />
                </div>
              </div>

              {/* Categoria & Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Recorrência Mensal">Recorrência Mensal (MRR)</option>
                    <option value="Tráfego Pago">Tráfego Pago</option>
                    <option value="Desenvolvimento Web">Desenvolvimento Web</option>
                    <option value="Criação & Design">Criação & Design</option>
                    <option value="Projeto Pontual">Projeto Pontual</option>
                    <option value="Consultoria">Consultoria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="PIX PJ Direto">PIX PJ Direto</option>
                    <option value="Boleto 30D">Boleto 30D</option>
                    <option value="Cartão PJ">Cartão PJ</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              {/* Status Inicial */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Inicial
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                    newStatus === 'Pendente' 
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold' 
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
                    <Clock size={13} />
                    <span>Pendente</span>
                  </label>

                  <label className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                    newStatus === 'Pago' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold' 
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
                    <CheckCircle2 size={13} />
                    <span>Pago</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#fab518] hover:bg-[#e0a215] text-[#142142] text-xs font-bold shadow-2xs transition-all cursor-pointer"
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
