import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Plus, 
  Search, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Layers,
  ChevronRight,
  ArrowUpRight,
  Info,
  Calendar,
  Check,
  Palette,
  Pencil,
  Trash2,
  MapPin,
  User,
  Hash,
  KeyRound,
  CheckSquare,
  Square,
  RefreshCw,
  Database
} from 'lucide-react';
import { Client, DemandItem } from '../types';
import { ClientDetailDrawer } from '../components/ClientDetailDrawer';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const CLIENT_COVER_COLORS = [
  { hex: '#142142', name: 'Azul Marinho', textClass: 'text-white' },
  { hex: '#fab518', name: 'Amarelo Dourado', textClass: 'text-[#142142]' },
  { hex: '#fb2c36', name: 'Vermelho', textClass: 'text-white' },
  { hex: '#9810fa', name: 'Roxo', textClass: 'text-white' },
  { hex: '#009966', name: 'Verde', textClass: 'text-white' },
];

interface ClientesViewProps {
  clients: Client[];
  demands?: DemandItem[];
  onAddClient: (client: Client) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onDeleteMultipleClients?: (clientIds: string[]) => void;
  onSelectClientDemands?: (clientName: string) => void;
  onOpenNewDemandForClient?: (clientName: string) => void;
  supabaseSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  onRefreshSupabase?: () => void;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clients,
  demands = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onDeleteMultipleClients,
  onSelectClientDemands,
  onOpenNewDemandForClient,
  supabaseSyncStatus = 'idle',
  onRefreshSupabase,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  // New Client States (Full field matching user images)
  const [newPersonType, setNewPersonType] = useState<'fisica' | 'juridica'>('juridica');
  const [newClientName, setNewClientName] = useState('');
  const [newClientCpfCnpj, setNewClientCpfCnpj] = useState('');
  const [newClientEmails, setNewClientEmails] = useState<string[]>(['']);
  const [newClientPhones, setNewClientPhones] = useState<string[]>(['']);
  const [newClientSegment, setNewClientSegment] = useState('');
  
  // Endereço
  const [newClientCep, setNewClientCep] = useState('');
  const [newClientStreet, setNewClientStreet] = useState('');
  const [newClientNumber, setNewClientNumber] = useState('');
  const [newClientComplement, setNewClientComplement] = useState('');
  const [newClientNeighborhood, setNewClientNeighborhood] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientState, setNewClientState] = useState('');

  // Mantidos
  const [newClientBirthDate, setNewClientBirthDate] = useState('');
  const [newClientCoverColor, setNewClientCoverColor] = useState('#142142');

  // Edit Client States
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editPersonType, setEditPersonType] = useState<'fisica' | 'juridica'>('juridica');
  const [editName, setEditName] = useState('');
  const [editCpfCnpj, setEditCpfCnpj] = useState('');
  const [editEmails, setEditEmails] = useState<string[]>(['']);
  const [editPhones, setEditPhones] = useState<string[]>(['']);
  const [editSegment, setEditSegment] = useState('');
  const [editCep, setEditCep] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editCoverColor, setEditCoverColor] = useState('#142142');
  const [editStatus, setEditStatus] = useState<'Ativo' | 'Pausado' | 'Cancelado' | 'Em Onboarding'>('Ativo');
  const [editMonthlyFee, setEditMonthlyFee] = useState(0);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.segment.toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
    (c.cpfCnpj && c.cpfCnpj.includes(search)) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenEdit = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClient(client);
    setShowDeleteConfirm(false);
    setEditPersonType(client.personType || 'juridica');
    setEditName(client.name);
    setEditCpfCnpj(client.cpfCnpj || '');
    setEditEmails(client.emails && client.emails.length > 0 ? [...client.emails] : [client.email || '']);
    setEditPhones(client.phones && client.phones.length > 0 ? [...client.phones] : [client.phone || '']);
    setEditSegment(client.segment);
    setEditCep(client.cep || '');
    setEditStreet(client.street || '');
    setEditNumber(client.number || '');
    setEditComplement(client.complement || '');
    setEditNeighborhood(client.neighborhood || '');
    setEditCity(client.city || '');
    setEditState(client.state || '');
    setEditBirthDate(client.birthDate || '');
    setEditCoverColor(client.coverColor || '#142142');
    setEditStatus(client.status);
    setEditMonthlyFee(client.monthlyFee || 0);
  };

  const handleDeleteClient = (clientId: string) => {
    if (onDeleteClient) {
      onDeleteClient(clientId);
    }
    if (selectedClient && selectedClient.id === clientId) {
      setSelectedClient(null);
    }
    setEditingClient(null);
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName.trim()) return;

    const cleanedEmails = editEmails.map(e => e.trim()).filter(Boolean);
    const primaryEmail = cleanedEmails[0] || editingClient.email;
    const cleanedPhones = editPhones.map(p => p.trim()).filter(Boolean);
    const primaryPhone = cleanedPhones[0] || editingClient.phone;

    const formattedAddress = editStreet 
      ? `${editStreet}${editNumber ? `, ${editNumber}` : ''}${editComplement ? ` - ${editComplement}` : ''}${editNeighborhood ? `, ${editNeighborhood}` : ''}${editCity ? ` - ${editCity}/${editState}` : ''}${editCep ? ` (CEP: ${editCep})` : ''}`
      : editingClient.address;

    const updated: Client = {
      ...editingClient,
      personType: editPersonType,
      name: editName.trim(),
      companyName: editPersonType === 'juridica' ? editName.trim() : (editingClient.companyName || editName.trim()),
      cpfCnpj: editCpfCnpj.trim() || undefined,
      segment: editSegment.trim() || 'Geral',
      phone: primaryPhone,
      phones: cleanedPhones,
      email: primaryEmail,
      emails: cleanedEmails,
      cep: editCep.trim() || undefined,
      street: editStreet.trim() || undefined,
      number: editNumber.trim() || undefined,
      complement: editComplement.trim() || undefined,
      neighborhood: editNeighborhood.trim() || undefined,
      city: editCity.trim() || undefined,
      state: editState.trim() || undefined,
      address: formattedAddress,
      birthDate: editBirthDate || undefined,
      coverColor: editCoverColor,
      status: editStatus,
      monthlyFee: editingClient.monthlyFee || 0,
    };

    if (onUpdateClient) {
      onUpdateClient(updated);
    }
    if (selectedClient && selectedClient.id === updated.id) {
      setSelectedClient(updated);
    }
    setEditingClient(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const cleanedEmails = newClientEmails.map(em => em.trim()).filter(Boolean);
    const primaryEmail = cleanedEmails[0] || `contato@${newClientName.toLowerCase().replace(/\s+/g, '')}.com.br`;
    const cleanedPhones = newClientPhones.map(p => p.trim()).filter(Boolean);
    const primaryPhone = cleanedPhones[0] || '(11) 99999-0000';

    const formattedAddress = newClientStreet 
      ? `${newClientStreet}${newClientNumber ? `, ${newClientNumber}` : ''}${newClientComplement ? ` - ${newClientComplement}` : ''}${newClientNeighborhood ? `, ${newClientNeighborhood}` : ''}${newClientCity ? ` - ${newClientCity}/${newClientState}` : ''}${newClientCep ? ` (CEP: ${newClientCep})` : ''}`
      : undefined;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      personType: newPersonType,
      name: newClientName.trim(),
      companyName: newClientName.trim(),
      cpfCnpj: newClientCpfCnpj.trim() || undefined,
      segment: newClientSegment.trim() || 'Geral',
      contactName: newClientName.trim(),
      email: primaryEmail,
      emails: cleanedEmails,
      phone: primaryPhone,
      phones: cleanedPhones,
      cep: newClientCep.trim() || undefined,
      street: newClientStreet.trim() || undefined,
      number: newClientNumber.trim() || undefined,
      complement: newClientComplement.trim() || undefined,
      neighborhood: newClientNeighborhood.trim() || undefined,
      city: newClientCity.trim() || undefined,
      state: newClientState.trim() || undefined,
      address: formattedAddress,
      birthDate: newClientBirthDate || undefined,
      coverColor: newClientCoverColor,
      avatar: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&auto=format&fit=crop&q=80',
      status: 'Ativo',
      monthlyFee: 0,
      services: ['Gestão de Redes Sociais', 'Tráfego Pago'],
      activeDemandsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    onAddClient(newClient);
    setShowModal(false);

    // Reset Form
    setNewPersonType('juridica');
    setNewClientName('');
    setNewClientCpfCnpj('');
    setNewClientEmails(['']);
    setNewClientPhones(['']);
    setNewClientSegment('');
    setNewClientCep('');
    setNewClientStreet('');
    setNewClientNumber('');
    setNewClientComplement('');
    setNewClientNeighborhood('');
    setNewClientCity('');
    setNewClientState('');
    setNewClientBirthDate('');
    setNewClientCoverColor('#142142');
  };

  const handleToggleSelectClient = (clientId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedClientIds(prev => 
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === filteredClients.length && filteredClients.length > 0) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const handleBulkDeleteClients = () => {
    if (selectedClientIds.length === 0) return;
    if (onDeleteMultipleClients) {
      onDeleteMultipleClients(selectedClientIds);
      setSelectedClientIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action & search bar */}
      <div className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[28px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          {filteredClients.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none shrink-0 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#fab518]">
              <input
                type="checkbox"
                checked={selectedClientIds.length === filteredClients.length && filteredClients.length > 0}
                onChange={handleSelectAllClients}
                className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
              />
              <span className="hidden sm:inline">Selecionar Todos</span>
            </label>
          )}

          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome do cliente, empresa ou segmento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F4F5F8] dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm font-medium text-[#142142] dark:text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 focus:border-[#fab518] focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshSupabase && (
            <button
              type="button"
              id="btn-refresh-clients-supabase"
              onClick={onRefreshSupabase}
              disabled={supabaseSyncStatus === 'syncing'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Sincronizar clientes com o banco PostgreSQL Supabase na nuvem"
            >
              <RefreshCw size={13} className={supabaseSyncStatus === 'syncing' ? 'animate-spin text-amber-500' : 'text-slate-500'} />
              <span className="hidden sm:inline">
                {supabaseSyncStatus === 'syncing' ? 'Sincronizando...' : `Nuvem (${clients.length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            id="btn-new-client"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Novo cliente</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar for Clients */}
      {selectedClientIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#142142] text-white flex flex-wrap items-center justify-between gap-3 shadow-md border border-[#fab518]/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#fab518] text-[#142142] flex items-center justify-center font-black text-xs">
              {selectedClientIds.length}
            </span>
            <div>
              <p className="text-xs font-bold">
                {selectedClientIds.length === 1 ? '1 cliente selecionado' : `${selectedClientIds.length} clientes selecionados`}
              </p>
              <p className="text-[10px] text-slate-300">
                Operação de exclusão múltipla protegida pelo protocolo 2FA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedClientIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Desmarcar Todos
            </button>
            <button
              type="button"
              id="btn-bulk-delete-clients"
              onClick={handleBulkDeleteClients}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <KeyRound size={13} className="text-[#fab518]" />
              <Trash2 size={13} />
              <span>Excluir Selecionados com 2FA</span>
            </button>
          </div>
        </div>
      )}

    {/* Clients Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredClients.length === 0 ? (
        <div className="col-span-full py-12 px-6 text-center bg-white dark:bg-[#0f172a] rounded-[28px] border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#fab518] flex items-center justify-center mx-auto shadow-xs">
            <Building2 size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#142142] dark:text-white">
              {search ? 'Nenhum cliente encontrado para a busca' : 'Nenhum cliente cadastrado ainda'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {search 
                ? `Não encontramos nenhum cliente com o termo "${search}". Verifique a digitação ou limpe o filtro.`
                : 'Cadastre seus clientes para gerenciar contratos, demandas, faturas e localização geográfica no mapa.'}
            </p>
          </div>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Limpar busca</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>Cadastrar Primeiro Cliente</span>
              </button>
              {onRefreshSupabase && (
                <button
                  type="button"
                  onClick={onRefreshSupabase}
                  disabled={supabaseSyncStatus === 'syncing'}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <RefreshCw size={13} className={supabaseSyncStatus === 'syncing' ? 'animate-spin text-amber-500' : ''} />
                  <span>{supabaseSyncStatus === 'syncing' ? 'Buscando do Supabase...' : 'Sincronizar do Supabase'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        filteredClients.map((client) => {
          const clientCoverColor = client.coverColor || '#142142';
          const isSelected = selectedClientIds.includes(client.id);

          return (
            <div
              key={client.id}
              id={`client-card-${client.id}`}
              onClick={() => setSelectedClient(client)}
              className={`bg-white dark:bg-[#0f172a] rounded-[28px] border card-elevation-subtle flex flex-col justify-between cursor-pointer group overflow-hidden transition-all ${
                isSelected
                  ? 'border-[#fab518] ring-2 ring-[#fab518]/30 bg-[#fab518]/5 dark:bg-[#fab518]/10'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-[#fab518] dark:hover:border-[#fab518]'
              }`}
            >
              {/* Cover Color Bar */}
              <div 
                className="h-2 w-full transition-all group-hover:h-2.5"
                style={{ backgroundColor: clientCoverColor }}
                title={`Capa: ${clientCoverColor}`}
              />

              <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        onClick={(e) => handleToggleSelectClient(client.id, e)}
                        className="p-1 -ml-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title={isSelected ? "Desmarcar cliente" : "Selecionar cliente"}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 accent-[#fab518] rounded cursor-pointer pointer-events-none"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: clientCoverColor }}
                            title={`Cor da capa: ${clientCoverColor}`}
                          />
                          <h3 className="text-base font-extrabold text-[#142142] dark:text-white group-hover:text-[#fab518] dark:group-hover:text-[#fab518] transition-colors leading-tight truncate">
                            {client.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{client.segment}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        id={`btn-edit-client-${client.id}`}
                        onClick={(e) => handleOpenEdit(client, e)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={`Editar dados de ${client.name}`}
                        aria-label={`Editar ${client.name}`}
                      >
                        <Pencil size={13} />
                      </button>

                      {onDeleteClient && (
                        <button
                          type="button"
                          id={`btn-delete-client-${client.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={`Excluir cliente ${client.name}`}
                          aria-label={`Excluir ${client.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <span
                        className={`
                          text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0
                          ${
                            client.status === 'Ativo'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : client.status === 'Pausado'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }
                        `}
                      >
                        {client.status}
                      </span>
                    </div>
                  </div>

              {/* Company Info */}
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-1 font-medium">
                Razão Social: {client.companyName}
              </p>

              {/* Contact info */}
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 bg-[#F4F5F8] dark:bg-slate-800/60 group-hover:bg-slate-100/70 dark:group-hover:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 mb-4 transition-colors">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-mono">{client.phone}</span>
                </div>
                {client.birthDate && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <Calendar size={13} className="text-[#fab518] shrink-0" />
                    <span>Nasc: <strong className="font-mono font-semibold">{new Date(`${client.birthDate}T00:00:00`).toLocaleDateString('pt-BR')}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Ver detalhes
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-[#fab518]/20 dark:bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] rounded-xl font-mono">
                  {client.activeDemandsCount} demandas
                </span>
                <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-[#142142] dark:group-hover:bg-[#fab518] group-hover:text-[#fab518] dark:group-hover:text-[#142142] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                  <ChevronRight size={15} />
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    })
  )}
  </div>

      {/* Client Detail Side Panel / Drawer */}
      {selectedClient && (
        <ClientDetailDrawer
          client={selectedClient}
          demands={demands}
          onClose={() => setSelectedClient(null)}
          onEditClient={() => handleOpenEdit(selectedClient)}
          onNavigateToDemands={(clientName) => {
            if (onSelectClientDemands) {
              onSelectClientDemands(clientName);
            }
          }}
          onOpenNewDemandForClient={(clientName) => {
            if (onOpenNewDemandForClient) {
              onOpenNewDemandForClient(clientName);
            }
          }}
        />
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0f172a] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
                  Cadastrar Novo Cliente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Preencha os dados do cliente, informações de contato e endereço.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleCreate} className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Seção: Tipo de Pessoa */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-2">
                  Tipo de Pessoa
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="newPersonType"
                      value="juridica"
                      checked={newPersonType === 'juridica'}
                      onChange={() => setNewPersonType('juridica')}
                      className="w-4 h-4 text-[#fab518] focus:ring-[#fab518] accent-[#fab518] cursor-pointer"
                    />
                    <span>Pessoa Jurídica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="newPersonType"
                      value="fisica"
                      checked={newPersonType === 'fisica'}
                      onChange={() => setNewPersonType('fisica')}
                      className="w-4 h-4 text-[#fab518] focus:ring-[#fab518] accent-[#fab518] cursor-pointer"
                    />
                    <span>Pessoa Física</span>
                  </label>
                </div>
              </div>

              {/* Seção: Dados Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    {newPersonType === 'juridica' ? 'Razão Social ou Nome Fantasia *' : 'Nome Completo *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newPersonType === 'juridica' ? 'Ex: Ótica Bella Vista Ltda' : 'Ex: Carlos Silva'}
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    {newPersonType === 'juridica' ? 'CNPJ' : 'CPF'}
                  </label>
                  <input
                    type="text"
                    placeholder={newPersonType === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                    value={newClientCpfCnpj}
                    onChange={(e) => setNewClientCpfCnpj(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Seção: Nicho de Atuação */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                  Nicho de Atuação / Segmento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Varejo Ótico, Moda, Odontologia..."
                  value={newClientSegment}
                  onChange={(e) => setNewClientSegment(e.target.value)}
                  className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                />
              </div>

              {/* Seção: E-mails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200">
                    E-mail(s) de Contato
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewClientEmails([...newClientEmails, ''])}
                    className="text-xs font-bold text-[#fab518] hover:text-[#fab518]/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Adicionar outro e-mail</span>
                  </button>
                </div>

                {newClientEmails.map((emailVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="contato@empresa.com.br"
                        value={emailVal}
                        onChange={(e) => {
                          const updated = [...newClientEmails];
                          updated[idx] = e.target.value;
                          setNewClientEmails(updated);
                        }}
                        className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white pl-9 pr-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                      />
                    </div>
                    {newClientEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newClientEmails.filter((_, i) => i !== idx);
                          setNewClientEmails(updated.length > 0 ? updated : ['']);
                        }}
                        className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Remover este e-mail"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Seção: Telefones / WhatsApp */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200">
                    Telefone(s) / WhatsApp
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewClientPhones([...newClientPhones, ''])}
                    className="text-xs font-bold text-[#fab518] hover:text-[#fab518]/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Adicionar outro telefone</span>
                  </button>
                </div>

                {newClientPhones.map((phoneVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="(11) 99999-8888"
                        value={phoneVal}
                        onChange={(e) => {
                          const updated = [...newClientPhones];
                          updated[idx] = e.target.value;
                          setNewClientPhones(updated);
                        }}
                        className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white pl-9 pr-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                      />
                    </div>
                    {newClientPhones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newClientPhones.filter((_, i) => i !== idx);
                          setNewClientPhones(updated.length > 0 ? updated : ['']);
                        }}
                        className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Remover este telefone"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Seção: Endereço Completo */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-[#142142] dark:text-slate-200 uppercase tracking-wider">
                  <MapPin size={14} className="text-[#fab518]" />
                  <span>Endereço</span>
                </div>

                {/* CEP com busca automática */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={newClientCep}
                      onChange={async (e) => {
                        const raw = e.target.value;
                        setNewClientCep(raw);
                        const cleanCep = raw.replace(/\D/g, '');
                        if (cleanCep.length === 8) {
                          try {
                            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                            const data = await res.json();
                            if (!data.erro) {
                              if (data.logradouro) setNewClientStreet(data.logradouro);
                              if (data.bairro) setNewClientNeighborhood(data.bairro);
                              if (data.localidade) setNewClientCity(data.localidade);
                              if (data.uf) setNewClientState(data.uf);
                            }
                          } catch {
                            // Silencioso em caso de erro na rede
                          }
                        }
                      }}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Rua / Logradouro
                    </label>
                    <input
                      type="text"
                      placeholder="Av. Paulista, Rua das Flores..."
                      value={newClientStreet}
                      onChange={(e) => setNewClientStreet(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={newClientNumber}
                      onChange={(e) => setNewClientNumber(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      placeholder="Sala 402, Bloco B..."
                      value={newClientComplement}
                      onChange={(e) => setNewClientComplement(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      placeholder="Centro, Jardins..."
                      value={newClientNeighborhood}
                      onChange={(e) => setNewClientNeighborhood(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={newClientCity}
                      onChange={(e) => setNewClientCity(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      placeholder="SP"
                      value={newClientState}
                      onChange={(e) => setNewClientState(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Data de Nascimento (Mantido) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#fab518]" />
                  <span>Data de Nascimento</span>
                </label>
                <input
                  type="date"
                  value={newClientBirthDate}
                  onChange={(e) => setNewClientBirthDate(e.target.value)}
                  className="w-full sm:w-1/2 bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
              </div>

              {/* Seção: Cor da Capa do Cliente (Mantido) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette size={13} className="text-[#fab518]" />
                    <span>Cor da Capa do Cliente</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {newClientCoverColor}
                  </span>
                </label>

                <div className="grid grid-cols-5 gap-2.5">
                  {CLIENT_COVER_COLORS.map((c) => {
                    const isSelected = newClientCoverColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewClientCoverColor(c.hex)}
                        title={`${c.name} (${c.hex})`}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer border-2 ${
                          isSelected
                            ? 'border-[#142142] ring-2 ring-[#fab518] scale-102 shadow-xs'
                            : 'border-transparent hover:scale-101 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <Check size={16} className={`stroke-[3] ${c.textClass}`} />
                        )}
                        <span className="sr-only">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  A cor selecionada identificará a capa do cliente nos cards e no painel lateral.
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#fab518] text-[#142142] font-bold text-xs hover:bg-[#fab518]/90 cursor-pointer shadow-xs transition-all"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0f172a] shrink-0">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: editCoverColor }}
                />
                <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
                  Editar Cliente: {editingClient.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Tipo de Pessoa */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-2">
                  Tipo de Pessoa
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="editPersonType"
                      value="juridica"
                      checked={editPersonType === 'juridica'}
                      onChange={() => setEditPersonType('juridica')}
                      className="w-4 h-4 text-[#fab518] focus:ring-[#fab518] accent-[#fab518] cursor-pointer"
                    />
                    <span>Pessoa Jurídica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="editPersonType"
                      value="fisica"
                      checked={editPersonType === 'fisica'}
                      onChange={() => setEditPersonType('fisica')}
                      className="w-4 h-4 text-[#fab518] focus:ring-[#fab518] accent-[#fab518] cursor-pointer"
                    />
                    <span>Pessoa Física</span>
                  </label>
                </div>
              </div>

              {/* Dados Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    {editPersonType === 'juridica' ? 'Razão Social ou Nome Fantasia *' : 'Nome Completo *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    {editPersonType === 'juridica' ? 'CNPJ' : 'CPF'}
                  </label>
                  <input
                    type="text"
                    placeholder={editPersonType === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                    value={editCpfCnpj}
                    onChange={(e) => setEditCpfCnpj(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none font-mono transition-all"
                  />
                </div>
              </div>

              {/* Nicho e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    Nicho de Atuação
                  </label>
                  <input
                    type="text"
                    value={editSegment}
                    onChange={(e) => setEditSegment(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5">
                    Status
                  </label>
                  <select
                    id="select-edit-client-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* E-mails de Contato */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200">
                    E-mail(s) de Contato
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditEmails([...editEmails, ''])}
                    className="text-xs font-bold text-[#fab518] hover:text-[#fab518]/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Adicionar outro e-mail</span>
                  </button>
                </div>

                {editEmails.map((emailVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={emailVal}
                        onChange={(e) => {
                          const updated = [...editEmails];
                          updated[idx] = e.target.value;
                          setEditEmails(updated);
                        }}
                        className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white pl-9 pr-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                      />
                    </div>
                    {editEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editEmails.filter((_, i) => i !== idx);
                          setEditEmails(updated.length > 0 ? updated : ['']);
                        }}
                        className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Remover este e-mail"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Telefones / WhatsApp */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#142142] dark:text-slate-200">
                    Telefone(s) / WhatsApp
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPhones([...editPhones, ''])}
                    className="text-xs font-bold text-[#fab518] hover:text-[#fab518]/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Adicionar outro telefone</span>
                  </button>
                </div>

                {editPhones.map((phoneVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={phoneVal}
                        onChange={(e) => {
                          const updated = [...editPhones];
                          updated[idx] = e.target.value;
                          setEditPhones(updated);
                        }}
                        className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white pl-9 pr-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                      />
                    </div>
                    {editPhones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editPhones.filter((_, i) => i !== idx);
                          setEditPhones(updated.length > 0 ? updated : ['']);
                        }}
                        className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Remover este telefone"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Endereço Completo */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-[#142142] dark:text-slate-200 uppercase tracking-wider">
                  <MapPin size={14} className="text-[#fab518]" />
                  <span>Endereço</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={editCep}
                      onChange={async (e) => {
                        const raw = e.target.value;
                        setEditCep(raw);
                        const cleanCep = raw.replace(/\D/g, '');
                        if (cleanCep.length === 8) {
                          try {
                            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                            const data = await res.json();
                            if (!data.erro) {
                              if (data.logradouro) setEditStreet(data.logradouro);
                              if (data.bairro) setEditNeighborhood(data.bairro);
                              if (data.localidade) setEditCity(data.localidade);
                              if (data.uf) setEditState(data.uf);
                            }
                          } catch {
                            // Silencioso
                          }
                        }
                      }}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-mono transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Rua / Logradouro
                    </label>
                    <input
                      type="text"
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={editComplement}
                      onChange={(e) => setEditComplement(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      placeholder="SP"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Data de Nascimento (Mantido) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#fab518]" />
                  <span>Data de Nascimento</span>
                </label>
                <input
                  type="date"
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="w-full sm:w-1/2 bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-all"
                />
              </div>

              {/* Cor da Capa do Cliente (Mantido) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette size={13} className="text-[#fab518]" />
                    <span>Cor da Capa do Cliente</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {editCoverColor}
                  </span>
                </label>

                <div className="grid grid-cols-5 gap-2.5">
                  {CLIENT_COVER_COLORS.map((c) => {
                    const isSelected = editCoverColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditCoverColor(c.hex)}
                        title={`${c.name} (${c.hex})`}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer border-2 ${
                          isSelected
                            ? 'border-[#142142] ring-2 ring-[#fab518] scale-102 shadow-xs'
                            : 'border-transparent hover:scale-101 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <Check size={16} className={`stroke-[3] ${c.textClass}`} />
                        )}
                        <span className="sr-only">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div 
                id="edit-client-modal-actions"
                className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0"
              >
                {onDeleteClient ? (
                  <button
                    type="button"
                    id="btn-delete-client-trigger"
                    onClick={() => {
                      if (editingClient) {
                        setClientToDelete(editingClient);
                      }
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    title="Excluir este cliente do sistema"
                  >
                    <Trash2 size={15} />
                    <span>Excluir Cliente</span>
                  </button>
                ) : <div />}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    id="btn-cancel-edit-client"
                    onClick={() => {
                      setEditingClient(null);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="btn-save-edit-client"
                    className="px-6 py-2.5 rounded-xl bg-[#fab518] text-[#142142] font-bold text-xs hover:bg-[#fab518]/90 transition-all shadow-xs cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal for Client Deletion */}
      <ConfirmDeleteModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) {
            handleDeleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        itemType="cliente"
        itemName={clientToDelete?.name}
        description={
          clientToDelete ? (
            <p>
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete.name}</strong>? Esta ação é irreversível e removerá o cadastro do cliente e seus vínculos no sistema.
            </p>
          ) : undefined
        }
      />
    </div>
  );
};
