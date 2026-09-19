import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Instagram, 
  Calendar, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Send, 
  Plus, 
  FileText, 
  MessageSquare, 
  History, 
  User, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Pencil,
  Shield,
  Download,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Client, DemandItem, PageId, ClientHistoryEvent, Invoice } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  exportClientDossierJSON, 
  exportClientDossierCSV, 
  anonymizeClient, 
  maskCpf, 
  maskAddress 
} from '../utils/securityLogger';

interface ClientDetailDrawerProps {
  client: Client;
  demands: DemandItem[];
  invoices?: Invoice[];
  onClose: () => void;
  onEditClient?: () => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onNavigateToDemands?: (clientName: string) => void;
  onOpenNewDemandForClient?: (clientName: string) => void;
}

type TabType = 'overview' | 'services' | 'history' | 'privacy';

export const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({
  client,
  demands,
  invoices = [],
  onClose,
  onEditClient,
  onUpdateClient,
  onDeleteClient,
  onNavigateToDemands,
  onOpenNewDemandForClient,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [maskSensitive, setMaskSensitive] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<'delete' | 'anonymize' | null>(null);
  const [historyList, setHistoryList] = useState<ClientHistoryEvent[]>(
    client.history || [
      {
        id: `h-init-1`,
        date: client.joinedDate || '2026-09-01',
        title: 'Início de Parceria & Contrato',
        description: 'Cliente cadastrado e onboarding inicial iniciado na agência Help Ideias.',
        type: 'contract',
        author: 'Marcos Lancerotti',
      },
    ]
  );

  // Filter demands associated with this client
  const clientDemands = demands.filter(
    (d) => d.client.toLowerCase() === client.name.toLowerCase() || 
           d.clientProject?.toLowerCase() === client.name.toLowerCase()
  );

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newEvent: ClientHistoryEvent = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: 'Nota da Equipe',
      description: newNoteText.trim(),
      type: 'note',
      author: 'Marcos Lancerotti',
    };

    setHistoryList([newEvent, ...historyList]);
    setNewNoteText('');
  };

  const getEventIcon = (type: ClientHistoryEvent['type']) => {
    switch (type) {
      case 'contract':
        return <DollarSign size={14} className="text-emerald-600" />;
      case 'delivery':
        return <CheckCircle2 size={14} className="text-blue-600" />;
      case 'meeting':
        return <User size={14} className="text-purple-600" />;
      case 'milestone':
        return <Sparkles size={14} className="text-amber-500" />;
      case 'note':
      default:
        return <MessageSquare size={14} className="text-slate-600" />;
    }
  };

  const getEventBadge = (type: ClientHistoryEvent['type']) => {
    switch (type) {
      case 'contract':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'delivery':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'meeting':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'milestone':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'note':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden" 
      aria-labelledby="client-drawer-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div 
          id="client-side-panel"
          className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200/80 transform transition-transform duration-300 ease-in-out overflow-hidden"
        >
          {/* Cover Color Top Stripe */}
          <div 
            className="h-2 w-full shrink-0" 
            style={{ backgroundColor: client.coverColor || '#142142' }}
            title={`Cor da capa: ${client.coverColor || '#142142'}`}
          />

          {/* Top Panel Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 
                      id="client-drawer-title"
                      className="text-lg sm:text-xl font-black text-[#142142] tracking-tight truncate"
                    >
                      {client.name}
                    </h2>
                    <span
                      className={`
                        text-[11px] font-bold px-2.5 py-0.5 rounded-full border
                        ${
                          client.status === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                            : client.status === 'Pausado'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                        }
                      `}
                    >
                      {client.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {client.companyName} • {client.segment}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onEditClient && (
                  <button
                    type="button"
                    id="btn-edit-client-drawer"
                    onClick={onEditClient}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#142142] bg-[#F2F2F2] hover:bg-[#fab518] hover:text-[#142142] transition-colors cursor-pointer"
                    title="Editar informações do cliente"
                  >
                    <Pencil size={13} />
                    <span>Editar</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  id="btn-close-client-panel"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-[#142142] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  aria-label="Fechar painel do cliente"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Demandas Ativas</span>
                <p className="text-xs sm:text-sm font-black text-[#142142]">
                  {clientDemands.length} no Kanban
                </p>
              </div>

              <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cliente Desde</span>
                <p className="text-xs sm:text-sm font-bold text-[#142142]">
                  {client.joinedDate ? new Date(client.joinedDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '2026'}
                </p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-100 pt-1 -mb-4 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                type="button"
                id="tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-[#fab518] text-[#142142]'
                    : 'border-transparent text-slate-500 hover:text-[#142142]'
                }`}
              >
                Visão Geral & Contato
              </button>
              <button
                type="button"
                id="tab-services"
                onClick={() => setActiveTab('services')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'services'
                    ? 'border-[#fab518] text-[#142142]'
                    : 'border-transparent text-slate-500 hover:text-[#142142]'
                }`}
              >
                <span>Serviços & Projetos</span>
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold">
                  {clientDemands.length}
                </span>
              </button>
              <button
                type="button"
                id="tab-history"
                onClick={() => setActiveTab('history')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'history'
                    ? 'border-[#fab518] text-[#142142]'
                    : 'border-transparent text-slate-500 hover:text-[#142142]'
                }`}
              >
                <span>Histórico & Linha do Tempo</span>
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold">
                  {historyList.length}
                </span>
              </button>
              <button
                type="button"
                id="tab-privacy"
                onClick={() => setActiveTab('privacy')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'privacy'
                    ? 'border-[#fab518] text-[#142142]'
                    : 'border-transparent text-slate-500 hover:text-[#142142]'
                }`}
              >
                <Shield size={13} className="text-[#fab518]" />
                <span>Privacidade & LGPD</span>
                {client.isAnonymized && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Titular anonimizado" />
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: OVERVIEW & CONTACT INFORMATION */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contact Information Card */}
                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <User size={14} className="text-[#fab518]" />
                      <span>Informações de Contato & Responsável</span>
                    </h3>
                    <span className="text-[11px] font-bold text-[#142142]">
                      {client.contactRole || 'Contato Principal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {client.personType === 'fisica' ? 'Nome Completo' : 'Razão Social / Nome Fantasia'}
                      </span>
                      <p className="font-bold text-[#142142] text-sm mt-0.5">{client.name}</p>
                      {client.cpfCnpj && (
                        <p className="text-[11px] font-mono font-medium text-slate-500 mt-0.5">
                          {client.personType === 'fisica' ? 'CPF: ' : 'CNPJ: '}
                          {client.cpfCnpj}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Pessoa</span>
                      <p className="font-bold text-[#142142] text-sm mt-0.5">
                        {client.personType === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </p>
                    </div>

                    {/* E-mails de Contato */}
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">E-mail(s) de Contato</span>
                      <div className="space-y-1 mt-1">
                        {(client.emails && client.emails.length > 0 ? client.emails : [client.email]).filter(Boolean).map((em, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <a 
                              href={`mailto:${em}`}
                              className="font-bold text-[#142142] hover:text-[#fab518] truncate underline decoration-slate-300"
                            >
                              {em}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Telefones / WhatsApp */}
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Telefone(s) / WhatsApp</span>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {(client.phones && client.phones.length > 0 ? client.phones : [client.phone]).filter(Boolean).map((ph, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                            <Phone size={13} className="text-emerald-600 shrink-0" />
                            <a 
                              href={`https://wa.me/55${ph.replace(/\D/g, '')}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="font-bold text-[#142142] hover:text-emerald-600 font-mono"
                            >
                              {ph}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {client.birthDate && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Data de Nascimento</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar size={13} className="text-[#fab518] shrink-0" />
                          <span className="font-bold text-[#142142]">
                            {new Date(`${client.birthDate}T00:00:00`).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}

                    {client.segment && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nicho / Segmento</span>
                        <p className="font-bold text-[#142142] text-sm mt-0.5">{client.segment}</p>
                      </div>
                    )}
                  </div>

                  {/* Endereço Completo */}
                  {(client.address || client.street || client.cep) && (
                    <div className="pt-3 border-t border-slate-200/60 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
                        <MapPin size={12} className="text-[#fab518]" />
                        <span>Endereço Cadastrado</span>
                      </span>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                        <p className="font-bold text-[#142142]">
                          {client.street || client.address}
                          {client.number ? `, nº ${client.number}` : ''}
                          {client.complement ? ` - ${client.complement}` : ''}
                        </p>
                        <p className="text-slate-500 font-medium">
                          {[client.neighborhood, client.city, client.state].filter(Boolean).join(' • ')}
                          {client.cep ? ` | CEP: ${client.cep}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Notes */}
                {client.notes && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-1.5">
                    <span className="font-bold uppercase text-[10px] text-amber-800 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-600" />
                      <span>Preferências & Notas da Conta</span>
                    </span>
                    <p className="text-amber-900 leading-relaxed font-medium">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SERVICES & PROJECTS ASSOCIATED */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Associated Contracted Services */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Serviços Contratados no Pacote
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {client.services.length} serviços
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {client.services.map((srv, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#F8F9FA] border border-slate-200/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#142142] text-[#fab518] flex items-center justify-center shrink-0">
                            <Layers size={16} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-[#142142]">{srv}</p>
                            <span className="text-[11px] text-slate-500">Serviço ativo e recorrente</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Ativo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associated Demands / Projects */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Projetos & Demandas em Andamento
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Itens sincronizados com o quadro de produção Kanban
                      </p>
                    </div>
                    {onNavigateToDemands && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToDemands(client.name);
                        }}
                        className="text-xs font-bold text-[#142142] hover:text-[#fab518] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Abrir Kanban</span>
                        <ArrowUpRight size={13} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {clientDemands.map((demand) => (
                      <div
                        key={demand.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-[#fab518] shadow-2xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {demand.thumbnail?.trim() ? (
                            <img
                              src={demand.thumbnail}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                              {demand.type.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#142142] truncate">
                              {demand.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {demand.serviceCategory} • Entrega: {demand.dueDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize">
                            {demand.columnId}
                          </span>
                          {demand.assignee.avatar?.trim() ? (
                            <img
                              src={demand.assignee.avatar}
                              alt={demand.assignee.name}
                              title={demand.assignee.name}
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div
                              title={demand.assignee.name}
                              className="w-6 h-6 rounded-full bg-[#142142] text-[#fab518] text-[9px] font-bold flex items-center justify-center ring-1 ring-slate-200"
                            >
                              {demand.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {clientDemands.length === 0 && (
                      <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        Nenhuma demanda ativa no momento para este cliente.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DETAILED HISTORY TIMELINE */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Add a Quick Note to Timeline */}
                <form onSubmit={handleAddNote} className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <label className="block text-xs font-bold text-[#142142]">
                    Adicionar Registro ou Nota ao Histórico
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Reunião realizada com cliente; alinhadas pautas de final de ano..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-white text-xs text-[#142142] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#fab518] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#142142] hover:bg-[#142142]/90 text-[#fab518] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Send size={13} />
                      <span>Registrar</span>
                    </button>
                  </div>
                </form>

                {/* Timeline Feed */}
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200/70">
                  {historyList.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-4 pl-1">
                      {/* Timeline Dot with Icon */}
                      <div className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 z-10">
                        {getEventIcon(event.type)}
                      </div>

                      {/* Event Details Card */}
                      <div className="flex-1 bg-[#F8F9FA] hover:bg-slate-50 transition-colors p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[#142142]">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getEventBadge(event.type)}`}>
                              {event.type}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {event.date}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {event.description}
                        </p>

                        {event.author && (
                          <p className="text-[10px] font-semibold text-slate-400 pt-1">
                            Registrado por: {event.author}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PRIVACIDADE & LGPD */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Privacy & LGPD Compliance Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl p-5 border border-blue-200/80 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-[#142142] text-[#fab518]">
                        <Shield size={18} />
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#142142] dark:text-white">
                          Protocolo de Privacidade & LGPD
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Protegido</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Dados pessoais sensíveis (como CPF e endereço físico) são coletados <strong>estritamente sob necessidade legal ou operacional</strong> (emissão de NFe e cumprimento de obrigações contratuais - Art. 7º, V da LGPD). O sistema aplica <strong>sanitização ativa de logs</strong>, impedindo que esses dados sejam expostos em saídas de log do console ou telemetria.
                  </p>
                </div>

                {exportNotice && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>{exportNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExportNotice(null)}
                      className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {/* Data Subject Rights (Direitos do Titular - Art. 18) */}
                <div className="bg-[#F8F9FA] dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <div className="border-b border-slate-200/60 dark:border-slate-700 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Lock size={14} className="text-[#fab518]" />
                      <span>Direitos do Titular de Dados (Artigo 18 da LGPD)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Garantia de portabilidade, consulta facilitada e eliminação a pedido do titular
                    </p>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#142142] dark:text-slate-200 block">
                      1. Exportação e Portabilidade (Art. 18, V)
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gera e transfere ao titular o conjunto completo de suas informações cadastrais, demandas e histórico financeiro em formato interoperável.
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        id="btn-export-client-json"
                        onClick={() => {
                          exportClientDossierJSON(client, demands, invoices);
                          setExportNotice(`Dossiê completo de ${client.name} exportado em formato JSON.`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#142142] dark:text-white transition-colors cursor-pointer shadow-xs"
                      >
                        <Download size={13} className="text-[#fab518]" />
                        <span>Exportar Dossiê Completo (.JSON)</span>
                      </button>

                      <button
                        type="button"
                        id="btn-export-client-csv"
                        onClick={() => {
                          exportClientDossierCSV(client);
                          setExportNotice(`Resumo cadastral de ${client.name} exportado em formato CSV.`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#142142] dark:text-white transition-colors cursor-pointer shadow-xs"
                      >
                        <Download size={13} className="text-emerald-600" />
                        <span>Exportar Dados em Tabela (.CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Deletion & Anonymization Options */}
                  <div className="space-y-2 pt-4 border-t border-slate-200/60 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-[#142142] dark:text-slate-200 block">
                      2. Eliminação ou Anonimização (Art. 18, IV e VI)
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Quando o titular solicita o direito ao esquecimento, você pode anonimizar os dados sensíveis (mantendo registros financeiros para conformidade fiscal) ou excluir o registro de forma permanente.
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        id="btn-anonymize-client"
                        onClick={() => setConfirmModal('anonymize')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                      >
                        <Shield size={13} className="text-amber-600" />
                        <span>Anonimizar Dados Pessoais</span>
                      </button>

                      <button
                        type="button"
                        id="btn-delete-client-lgpd"
                        onClick={() => setConfirmModal('delete')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} className="text-red-600" />
                        <span>Excluir Permanentemente</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit & Legal Base Card */}
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Registro de Tratamento & Finalidade
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Base Legal Aplicada</span>
                      <p className="font-bold text-[#142142] dark:text-white mt-0.5">
                        Art. 7º, Inciso V (Execução de Contrato)
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Proteção de Logs</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Sanitização Ativa em Console</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Status do Registro</span>
                      <p className="font-bold text-[#142142] dark:text-white mt-0.5">
                        {client.isAnonymized 
                          ? `Anonimizado em ${client.anonymizedAt ? new Date(client.anonymizedAt).toLocaleDateString('pt-BR') : 'Data recente'}`
                          : 'Titular ativo com dados cadastrais vigentes'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generic Confirmation Modal for Delete */}
          <ConfirmDeleteModal
            isOpen={confirmModal === 'delete'}
            onClose={() => setConfirmModal(null)}
            onConfirm={() => {
              if (onDeleteClient) {
                onDeleteClient(client.id);
              }
              setConfirmModal(null);
              onClose();
            }}
            itemType="cliente"
            itemName={client.name}
            description="A exclusão é permanente e removerá completamente o registro do cliente, suas métricas e vínculos do sistema. Certifique-se de ter exportado o dossiê previamente caso necessite comprovação fiscal."
          />

          {/* Confirmation Modal for Anonymize (LGPD specific) */}
          {confirmModal === 'anonymize' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
                      Confirmar Anonimização LGPD
                    </h3>
                    <p className="text-xs text-slate-500">
                      {client.name}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ao anonimizar, todos os dados sensíveis (CPF, endereço completo, e-mails e telefones pessoais) serão removidos e substituídos por identificadores neutros irreversíveis. Registros de demandas e métricas financeiras serão preservados para fins de auditoria contábil e fiscal.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const anon = anonymizeClient(client);
                      if (onUpdateClient) {
                        onUpdateClient(anon);
                      }
                      setConfirmModal(null);
                      setExportNotice('Dados do titular foram anonimizados conforme Art. 18, IV da LGPD.');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-xs bg-amber-600 hover:bg-amber-700"
                  >
                    Confirmar Anonimização
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Drawer Actions Bar */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar Painel
            </button>

            <div className="flex items-center gap-2.5">
              {onOpenNewDemandForClient && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewDemandForClient(client.name);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#142142] text-white hover:bg-[#142142]/90 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} className="text-[#fab518]" />
                  <span>Nova Demanda</span>
                </button>
              )}

              {onNavigateToDemands && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDemands(client.name);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <span>Ver Demandas</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
