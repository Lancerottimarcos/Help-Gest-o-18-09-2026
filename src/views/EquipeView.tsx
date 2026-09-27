import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Mail, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  UsersRound,
  ShieldCheck,
  Lock,
  KeyRound,
  Target,
  Share2,
  Palette,
  Receipt,
  BadgeDollarSign,
  Code2,
  Copy,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Info,
  Sparkles,
  ArrowUpDown,
  Crown,
  ShieldAlert
} from 'lucide-react';
import { TeamMember, UserProfile, TeamFunctionOption } from '../types';
import { initialTeamMembers } from '../data/mockData';
import { ColaboradorModal, PREDEFINED_ROLES } from '../components/ColaboradorModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { isOwnerOrMarcos } from '../utils/securityProtocols';
import { getAccessLevelLabel, countBlockedPages } from '../utils/permissionUtils';

interface EquipeViewProps {
  teamMembers?: TeamMember[];
  onAddTeamMember?: (member: TeamMember) => void;
  onUpdateTeamMember?: (member: TeamMember) => void;
  onDeleteTeamMember?: (memberId: string) => void;
  currentUser?: UserProfile;
  onSimulateMember?: (member: TeamMember) => void;
  simulatedMemberId?: string;
}

export const EquipeView: React.FC<EquipeViewProps> = ({
  teamMembers: externalTeamMembers,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  currentUser,
  onSimulateMember,
  simulatedMemberId,
}) => {
  // Local fallback if props are not provided
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const currentMembers = externalTeamMembers || localTeamMembers;

  // Search, Filters & View Options
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [functionFilter, setFunctionFilter] = useState<string>('todas');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'tasks' | 'function'>('name');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [ownerDeleteBlockedModal, setOwnerDeleteBlockedModal] = useState(false);

  // Quick Credential Peek Drawer for Marcos
  const [credentialPeekMember, setCredentialPeekMember] = useState<TeamMember | null>(null);
  const [showPeekPassword, setShowPeekPassword] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Verificação de permissão: Marcos Lancerotti ou Proprietário
  const isMarcosLancerotti = Boolean(
    !currentUser ||
    currentUser.role === 'proprietario' ||
    (currentUser as any).isMaster === true ||
    (currentUser.name?.toLowerCase().includes('marcos') && currentUser.name?.toLowerCase().includes('lancerotti')) ||
    currentUser.email?.toLowerCase() === 'lancerottirmarcos@gmail.com' ||
    (currentUser as any).username?.toLowerCase() === 'lancerotti'
  );

  const showNotification = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const handleOpenAddModal = () => {
    if (!isMarcosLancerotti) {
      setShowRestrictedModal(true);
      return;
    }
    setMemberToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    if (!isMarcosLancerotti) {
      setShowRestrictedModal(true);
      return;
    }
    setMemberToEdit(member);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (member: TeamMember) => {
    if (isOwnerOrMarcos(member)) {
      setOwnerDeleteBlockedModal(true);
      showNotification('Operação Bloqueada: Marcos Lancerotti é o Dono da Agência e não pode ser excluído.');
      return;
    }
    setMemberToDelete(member);
  };

  const handleSaveMember = (member: TeamMember) => {
    if (!isMarcosLancerotti) return;

    if (memberToEdit) {
      if (onUpdateTeamMember) {
        onUpdateTeamMember(member);
      } else {
        setLocalTeamMembers((prev) =>
          prev.map((m) => (m.id === member.id ? member : m))
        );
      }
      showNotification(`Colaborador ${member.name} atualizado com sucesso!`);
    } else {
      if (onAddTeamMember) {
        onAddTeamMember(member);
      } else {
        setLocalTeamMembers((prev) => [member, ...prev]);
      }
      showNotification(`Colaborador ${member.name} cadastrado com sucesso!`);
    }
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete || !isMarcosLancerotti) return;

    // Proteção Absoluta: Não permite excluir o Marcos Lancerotti (Dono da Agência)
    if (isOwnerOrMarcos(memberToDelete)) {
      setOwnerDeleteBlockedModal(true);
      showNotification('Ação Bloqueada: Marcos Lancerotti é o Dono da Agência e não pode ser excluído.');
      setMemberToDelete(null);
      return;
    }

    if (onDeleteTeamMember) {
      onDeleteTeamMember(memberToDelete.id);
    } else {
      setLocalTeamMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
    }

    showNotification(`Colaborador removido da equipe.`);
    setMemberToDelete(null);
  };

  // Helper para identificar a função principal de um membro
  const getMemberFunctionRole = (member: TeamMember): TeamFunctionOption | string => {
    if (member.functionRole) return member.functionRole;
    const lowerRole = (member.role || '').toLowerCase();
    if (lowerRole.includes('ceo') || lowerRole.includes('diretor executiv') || lowerRole.includes('proprietár')) return 'CEO';
    if (lowerRole.includes('tráfego') || lowerRole.includes('trafego')) return 'Gestor de tráfego';
    if (lowerRole.includes('social') || lowerRole.includes('redes') || lowerRole.includes('copy')) return 'Social media';
    if (lowerRole.includes('design') || lowerRole.includes('arte') || lowerRole.includes('ui')) return 'Design';
    if (lowerRole.includes('contad') || lowerRole.includes('fiscal') || lowerRole.includes('financeir')) return 'Contador';
    if (lowerRole.includes('vendedor') || lowerRole.includes('vendas') || lowerRole.includes('comercial') || lowerRole.includes('closer')) return 'Vendedor';
    if (lowerRole.includes('desenvolvedor') || lowerRole.includes('web') || lowerRole.includes('full-stack') || lowerRole.includes('dev')) return 'Desenvolvedor web';
    return member.role || 'Geral';
  };

  // Helper de badge e ícones das funções
  const getFunctionBadge = (func: string) => {
    switch (func) {
      case 'CEO':
        return {
          icon: Crown,
          label: 'CEO',
          tagClass: 'bg-amber-100/90 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80',
          dotColor: 'bg-[#fab518]',
        };
      case 'Gestor de tráfego':
        return {
          icon: Target,
          label: 'Gestor de tráfego',
          tagClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
          dotColor: 'bg-amber-500',
        };
      case 'Social media':
        return {
          icon: Share2,
          label: 'Social media',
          tagClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
          dotColor: 'bg-rose-500',
        };
      case 'Design':
        return {
          icon: Palette,
          label: 'Design',
          tagClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
          dotColor: 'bg-purple-500',
        };
      case 'Contador':
        return {
          icon: Receipt,
          label: 'Contador',
          tagClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
          dotColor: 'bg-emerald-500',
        };
      case 'Vendedor':
        return {
          icon: BadgeDollarSign,
          label: 'Vendedor',
          tagClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
          dotColor: 'bg-blue-500',
        };
      case 'Desenvolvedor web':
        return {
          icon: Code2,
          label: 'Desenvolvedor web',
          tagClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
          dotColor: 'bg-sky-500',
        };
      default:
        return {
          icon: UsersRound,
          label: func,
          tagClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotColor: 'bg-slate-500',
        };
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = currentMembers.length;
    const disponiveis = currentMembers.filter((m) => m.status === 'Disponível').length;
    const ocupados = currentMembers.filter((m) => m.status === 'Ocupado').length;
    const ferias = currentMembers.filter((m) => m.status === 'Férias').length;
    const totalTarefas = currentMembers.reduce((acc, m) => acc + (m.activeTasks || 0), 0);
    const taxaDisponibilidade = total > 0 ? Math.round((disponiveis / total) * 100) : 100;

    return {
      total,
      disponiveis,
      ocupados,
      ferias,
      totalTarefas,
      taxaDisponibilidade,
    };
  }, [currentMembers]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    return currentMembers
      .filter((m) => {
        const memberFunc = getMemberFunctionRole(m);
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.username && m.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
          memberFunc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === 'todos' || m.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesFunction =
          functionFilter === 'todas' || memberFunc.toLowerCase() === functionFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesFunction;
      })
      .sort((a, b) => {
        if (sortBy === 'tasks') {
          return (b.activeTasks || 0) - (a.activeTasks || 0);
        }
        if (sortBy === 'function') {
          return getMemberFunctionRole(a).localeCompare(getMemberFunctionRole(b));
        }
        return a.name.localeCompare(b.name);
      });
  }, [currentMembers, searchQuery, statusFilter, functionFilter, sortBy]);

  // Copy credentials handler
  const handleCopyCredentials = (member: TeamMember) => {
    const userLogin = member.username || member.name.toLowerCase().replace(/\s+/g, '.');
    const userPass = member.password || '123456';
    const text = `*Credenciais de Acesso - Help Agência*\n\nColaborador: ${member.name}\nFunção: ${getMemberFunctionRole(member)}\nUsuário: @${userLogin}\nSenha Inicial: ${userPass}\n\nAcesse: https://agencia-ideiasdigitais.com.br`;

    navigator.clipboard.writeText(text);
    showNotification(`Credenciais de @${userLogin} copiadas!`);
  };

  return (
    <div className="space-y-6 w-full pb-8">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#142142] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check size={16} className="text-[#fab518] stroke-[3]" />
          <span className="text-xs font-bold">{copyToast}</span>
        </div>
      )}

      {/* KPI Overview Strip (Operational Health) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UsersRound size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Equipe Total</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[#142142] dark:text-white">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">membros</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={20} className="stroke-[3]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Disponibilidade</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.disponiveis}</span>
              <span className="text-[11px] text-slate-400 font-medium">({stats.taxaDisponibilidade}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Target size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Carga Ativa</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[#142142] dark:text-white">{stats.totalTarefas}</span>
              <span className="text-[11px] text-slate-400 font-medium">demandas</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Logins Ativos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[#142142] dark:text-white">{stats.total}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">100% habilitados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Function Filter Navigation (CEO & Funções Oficiais da Agência) */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {/* Todas as Funções */}
          <button
            type="button"
            onClick={() => setFunctionFilter('todas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              functionFilter === 'todas'
                ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-xs'
                : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Todas as Funções</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              functionFilter === 'todas' ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {stats.total}
            </span>
          </button>

          {/* As 6 funções solicitadas */}
          {PREDEFINED_ROLES.map((roleDef) => {
            const Icon = roleDef.icon;
            const isSelected = functionFilter.toLowerCase() === roleDef.id.toLowerCase();
            const count = currentMembers.filter(
              (m) => getMemberFunctionRole(m).toLowerCase() === roleDef.id.toLowerCase()
            ).length;

            return (
              <button
                key={roleDef.id}
                type="button"
                onClick={() => setFunctionFilter(roleDef.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#142142] text-white border-[#142142] dark:bg-[#fab518] dark:text-[#142142] dark:border-[#fab518] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{roleDef.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Toolbar: Search, Status Pills, Sort & View Mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0f172a] p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Search input with keyboard hint */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por colaborador, @login ou especialidade..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filters & View Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Status selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'disponível', label: 'Disponível' },
              { id: 'ocupado', label: 'Ocupado' },
              { id: 'férias', label: 'Férias' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="name">Nome (A-Z)</option>
              <option value="tasks">Mais Demandas</option>
              <option value="function">Função</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visualização em Tabela"
            >
              <List size={15} />
            </button>
          </div>

          {/* Primary Action: Novo Colaborador */}
          <div className="pl-1 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 shrink-0">
            {isMarcosLancerotti ? (
              <button
                type="button"
                id="btn-novo-colaborador"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                title="Cadastrar novo colaborador na agência"
              >
                <Plus size={15} className="stroke-[3]" />
                <span>Novo Colaborador</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-novo-colaborador-locked"
                onClick={() => setShowRestrictedModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer whitespace-nowrap"
                title="Somente Marcos Lancerotti pode adicionar colaboradores"
              >
                <Lock size={13} className="text-amber-500" />
                <span>Novo Colaborador</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security & Access Rule Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:to-slate-900/40 border border-amber-300/70 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black shrink-0 shadow-xs ring-2 ring-[#fab518]/20">
            <ShieldCheck size={20} className="stroke-[2.2]" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-[#142142] dark:text-white sm:text-sm">
                Regra de Acesso de Novos Colaboradores Ativa
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                6 Páginas Bloqueadas por Padrão
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Por segurança, novos membros adicionados não têm acesso a <strong>Clientes, Serviços, Financeiro, Orçamento, Equipe e Configurações</strong> até liberação explícita pelo administrador.
            </p>
          </div>
        </div>

        {isMarcosLancerotti && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#142142] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={13} className="text-[#fab518]" />
              <span>Novo com Regra Padrão</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {filteredMembers.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <UsersRound size={24} />
          </div>
          <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
            Nenhum colaborador encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Não encontramos colaboradores com os filtros selecionados. Tente ajustar os termos de pesquisa ou a função.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setFunctionFilter('todas');
                setStatusFilter('todos');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Limpar Filtros
            </button>
            {isMarcosLancerotti && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-[#fab518] text-[#142142] text-xs font-black hover:bg-[#e29f11] cursor-pointer"
              >
                + Adicionar Colaborador
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Modern Card Layout) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredMembers.map((member) => {
            const memberFunc = getMemberFunctionRole(member);
            const badgeInfo = getFunctionBadge(memberFunc);
            const FuncIcon = badgeInfo.icon;
            const username = member.username || member.name.toLowerCase().replace(/\s+/g, '.');

            // Workload calculation
            const tasksCount = member.activeTasks || 0;
            const loadLevel = tasksCount <= 2 ? 'Leve' : tasksCount <= 5 ? 'Ideal' : 'Intensa';
            const loadColor = tasksCount <= 2 ? 'bg-emerald-500' : tasksCount <= 5 ? 'bg-blue-500' : 'bg-amber-500';

            const isOwner = isOwnerOrMarcos(member);

            return (
              <div
                key={member.id}
                className={`relative overflow-hidden rounded-[24px] p-5 sm:p-5.5 flex flex-col justify-between group transition-all duration-300 ${
                  isOwner
                    ? 'bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-[#0f172a] dark:to-[#0f172a] border-t-4 border-t-[#fab518] border-x border-b border-amber-300/80 dark:border-amber-500/40 shadow-[0_4px_20px_-4px_rgba(250,181,24,0.15)] hover:shadow-[0_14px_34px_-6px_rgba(250,181,24,0.22)]'
                    : 'bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_2px_12px_-4px_rgba(20,33,66,0.06)] hover:shadow-[0_14px_30px_-6px_rgba(20,33,66,0.12),0_4px_10px_-2px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_14px_30px_-6px_rgba(0,0,0,0.5)] hover:border-slate-300 dark:hover:border-slate-700'
                } hover:-translate-y-1`}
              >
                {/* Tier 1: Header & Identity Section (Avatar, Name, Role, Status & Department) */}
                <div className="space-y-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {member.avatar?.trim() ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs group-hover:ring-[#fab518]/50 transition-all"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#142142] to-[#1e3060] text-[#fab518] font-black text-base flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Status dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0f172a] shadow-2xs ${
                            member.status === 'Disponível'
                              ? 'bg-emerald-500'
                              : member.status === 'Ocupado'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          title={`Status: ${member.status}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-[15px] font-black text-[#142142] dark:text-white tracking-tight truncate group-hover:text-[#fab518] transition-colors">
                            {member.name}
                          </h3>
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                              <Crown size={10} className="text-amber-600 dark:text-amber-400" />
                              Dono
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {member.role || memberFunc}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5 ${
                        member.status === 'Disponível'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : member.status === 'Ocupado'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Disponível'
                            ? 'bg-emerald-500'
                            : member.status === 'Ocupado'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span>{member.status}</span>
                    </span>
                  </div>

                  {/* Function & Role Pill and Permissions Badge */}
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${badgeInfo.tagClass}`}>
                      <FuncIcon size={13} />
                      <span>{memberFunc}</span>
                    </span>

                    {/* Permissions Status Badge */}
                    {(() => {
                      const accessInfo = getAccessLevelLabel(member.permissions, isOwner);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-xl border shadow-2xs ${accessInfo.badgeClass}`}
                          title={isOwner ? 'Acesso Total Irrestrito' : `${6 - accessInfo.blockedCount} páginas liberadas, ${accessInfo.blockedCount} bloqueadas`}
                        >
                          <Lock size={10} className={isOwner ? 'text-amber-500' : accessInfo.blockedCount > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                          <span>{accessInfo.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Tier 2: Operational Capacity & Agency Access Panel (Workload, Credentials, Specialties) */}
                <div className="space-y-3.5 py-3.5 flex-1 flex flex-col justify-between">
                  {/* Login Credentials Strip (High-value agency access feature) */}
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#fab518]/15 text-[#142142] dark:text-[#fab518] flex items-center justify-center shrink-0">
                        <KeyRound size={12} className="stroke-[2.5]" />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#142142] dark:text-slate-100 truncate">
                        @{username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isMarcosLancerotti && (
                        <button
                          type="button"
                          onClick={() => {
                            setCredentialPeekMember(member);
                            setShowPeekPassword(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-[#fab518] hover:text-[#142142] dark:hover:bg-[#fab518] dark:hover:text-[#142142] border border-slate-200 dark:border-slate-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title="Ver senha e credenciais completas"
                        >
                          <Eye size={11} />
                          <span>Ver Senha</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(member)}
                        className="p-1.5 text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer"
                        title="Copiar credenciais de acesso para enviar"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Workload & Tasks Capacity Bar */}
                  <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Carga Operacional</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {tasksCount} demandas • <span className={`font-semibold ${
                          tasksCount <= 2 ? 'text-emerald-600 dark:text-emerald-400' : tasksCount <= 5 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>{loadLevel}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${loadColor}`}
                        style={{ width: `${Math.min(100, Math.max(10, tasksCount * 18))}%` }}
                      />
                    </div>
                  </div>

                  {/* Specialties Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialties.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                      >
                        {spec}
                      </span>
                    ))}
                    {member.specialties.length > 3 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-slate-400 bg-slate-50 dark:bg-slate-800">
                        +{member.specialties.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tier 3: Communication & Actions Footer */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-2 text-xs">
                  {/* Email contact link */}
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#142142] dark:text-slate-400 dark:hover:text-[#fab518] transition-colors truncate max-w-[140px]"
                    title={member.email}
                  >
                    <Mail size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate text-[11px] font-medium">{member.email}</span>
                  </a>

                  {/* Action buttons (Restricted to Marcos) */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {isMarcosLancerotti ? (
                      <>
                        {/* Permissões Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#142142] dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                          title={`Gerenciar regras de acesso e permissões de ${member.name}`}
                        >
                          <ShieldCheck size={12} className="text-[#fab518]" />
                          <span className="hidden sm:inline">Permissões</span>
                        </button>

                        {/* Testar Visão Button */}
                        {!isOwner && onSimulateMember && (
                          <button
                            type="button"
                            onClick={() => onSimulateMember(member)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border ${
                              simulatedMemberId === member.id
                                ? 'bg-amber-500 text-[#142142] border-amber-600 font-black'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                            title={`Testar o sistema com as permissões de ${member.name}`}
                          >
                            <Eye size={11} className="text-[#fab518]" />
                            <span>{simulatedMemberId === member.id ? 'Simulando' : 'Testar'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 text-slate-500 hover:text-[#142142] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={`Editar dados de ${member.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        {isOwner ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs select-none cursor-default"
                            title="Marcos Lancerotti é o Dono da Agência e não pode ser excluído."
                          >
                            <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                            <span>Dono Protegido</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(member)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title={`Excluir colaborador ${member.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Ativo</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / LIST VIEW (High-density managerial scan) */
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Função Oficial</th>
                  <th className="py-3 px-4">Usuário / Acesso</th>
                  <th className="py-3 px-4">Disponibilidade</th>
                  <th className="py-3 px-4">Permissões</th>
                  <th className="py-3 px-4">Carga de Trabalho</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((member) => {
                  const memberFunc = getMemberFunctionRole(member);
                  const badgeInfo = getFunctionBadge(memberFunc);
                  const FuncIcon = badgeInfo.icon;
                  const username = member.username || member.name.toLowerCase().replace(/\s+/g, '.');

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {member.avatar?.trim() ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#142142] text-[#fab518] font-bold flex items-center justify-center text-xs shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-[#142142] dark:text-white block">
                                {member.name}
                              </span>
                              {isOwnerOrMarcos(member) && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  <Crown size={10} className="text-amber-600 dark:text-amber-400" />
                                  Dono
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {member.role || memberFunc}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Function Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${badgeInfo.tagClass}`}>
                          <FuncIcon size={12} />
                          <span>{memberFunc}</span>
                        </span>
                      </td>

                      {/* Login Credentials */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            @{username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(member)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copiar credenciais de login"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            member.status === 'Disponível'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : member.status === 'Ocupado'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>

                      {/* Permissões */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const accessInfo = getAccessLevelLabel(member.permissions, isOwnerOrMarcos(member));
                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${accessInfo.badgeClass}`}>
                              <Lock size={10} className={isOwnerOrMarcos(member) ? 'text-amber-500' : accessInfo.blockedCount > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                              <span>{accessInfo.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Active Tasks */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#142142] dark:text-[#fab518] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                          {member.activeTasks || 0} ativas
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {member.email}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isMarcosLancerotti ? (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Permissões */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(member)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#142142] dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-md transition-colors cursor-pointer"
                              title="Gerenciar permissões"
                            >
                              <ShieldCheck size={11} className="text-[#fab518]" />
                              <span>Permissões</span>
                            </button>

                            {/* Simular */}
                            {!isOwnerOrMarcos(member) && onSimulateMember && (
                              <button
                                type="button"
                                onClick={() => onSimulateMember(member)}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer border ${
                                  simulatedMemberId === member.id
                                    ? 'bg-amber-500 text-[#142142] border-amber-600 font-black'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                                title={`Simular visão de ${member.name}`}
                              >
                                <Eye size={10} className="text-[#fab518]" />
                                <span>{simulatedMemberId === member.id ? 'Simulando' : 'Testar'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setCredentialPeekMember(member);
                                setShowPeekPassword(false);
                              }}
                              className="p-1.5 text-slate-500 hover:text-[#142142] dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Ver credenciais"
                            >
                              <KeyRound size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(member)}
                              className="p-1.5 text-slate-500 hover:text-[#142142] dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            {isOwnerOrMarcos(member) ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 select-none cursor-default"
                                title="Marcos Lancerotti é o Dono da Agência e não pode ser excluído."
                              >
                                <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                                <span>Dono Protegido</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRequestDelete(member)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Visualização</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Credential Peek Modal for Marcos Lancerotti */}
      {credentialPeekMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#fab518]/20 text-[#fab518] flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#142142] dark:text-white">Credenciais de Acesso</h3>
                  <p className="text-[11px] text-slate-500">{credentialPeekMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialPeekMember(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Usuário de Login:
                </span>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-[#142142] dark:text-white">
                  <span>@{credentialPeekMember.username || credentialPeekMember.name.toLowerCase().replace(/\s+/g, '.')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`@${credentialPeekMember.username || credentialPeekMember.name.toLowerCase().replace(/\s+/g, '.')}`);
                      showNotification('Usuário copiado!');
                    }}
                    className="text-slate-400 hover:text-[#fab518] cursor-pointer"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Senha Cadastrada:
                </span>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-[#142142] dark:text-white">
                  <span>{showPeekPassword ? (credentialPeekMember.password || '123456') : '••••••••'}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPeekPassword(!showPeekPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPeekPassword ? 'Ocultar' : 'Exibir'}
                    >
                      {showPeekPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialPeekMember.password || '123456');
                        showNotification('Senha copiada!');
                      }}
                      className="text-slate-400 hover:text-[#fab518] cursor-pointer"
                      title="Copiar senha"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Função atribuída: <strong>{getMemberFunctionRole(credentialPeekMember)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleCopyCredentials(credentialPeekMember);
                  setCredentialPeekMember(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#fab518] text-[#142142] font-black text-xs hover:bg-[#e29f11] transition-colors cursor-pointer"
              >
                Copiar Mensagem com Acesso
              </button>
              <button
                type="button"
                onClick={() => setCredentialPeekMember(null)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add / Edit Colaborador */}
      {isModalOpen && (
        <ColaboradorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setMemberToEdit(null);
          }}
          onSave={handleSaveMember}
          memberToEdit={memberToEdit}
          isMarcosLancerotti={isMarcosLancerotti}
        />
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDeleteModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemType="membro da equipe"
        itemName={memberToDelete ? `${memberToDelete.name} • ${memberToDelete.role}` : undefined}
        description={
          memberToDelete ? (
            <p>
              Tem certeza que deseja excluir <strong>{memberToDelete.name}</strong>? Suas credenciais de login serão revogadas e suas tarefas continuarão salvas no sistema.
            </p>
          ) : undefined
        }
      />

      {/* Modal avisando que Marcos Lancerotti é o Dono da Agência e não pode ser excluído */}
      {ownerDeleteBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-md w-full border border-amber-300 dark:border-amber-700/80 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#142142] dark:text-[#fab518] flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-700">
              <Crown size={24} className="stroke-[2.2]" />
            </div>
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                Ação Bloqueada pelo Sistema
              </span>
              <h3 className="text-base font-black text-[#142142] dark:text-white">
                Marcos Lancerotti é o Dono da Agência
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Esta conta pertence ao <strong>Fundador e Proprietário da Agência</strong>. Por razões de governança e conformidade institucional, ela é <strong>permanentemente protegida contra exclusão</strong>.
              </p>
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 text-left border border-amber-200/80 dark:border-amber-800/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck size={14} className="text-[#fab518]" />
                  Privilégios de Administrador Mestre
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Você pode editar o perfil, avatar, usuário e senha de Marcos a qualquer momento, mas a titularidade principal é vitalícia.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setOwnerDeleteBlockedModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#142142] text-white font-bold text-xs hover:bg-[#1e3060] transition-colors cursor-pointer shadow-xs"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restricted Access Modal for Non-Marcos Users */}
      {showRestrictedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-[#142142] dark:text-white">
                Permissão Exclusiva de Administrador
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Somente o <strong>Marcos Lancerotti</strong> tem permissão para cadastrar colaboradores e definir senhas de login para acesso à plataforma.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 text-left border border-slate-200/80 dark:border-slate-800 mt-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <Info size={13} className="text-[#fab518]" />
                  Acesso Restrito
                </div>
                Conecte-se com o e-mail ou usuário de <strong>Marcos Lancerotti</strong> para desbloquear a gestão de equipe.
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowRestrictedModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#142142] text-white font-bold text-xs hover:bg-[#1e3060] transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
