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
  Crown
} from 'lucide-react';
import { TeamMember, UserProfile, TeamFunctionOption } from '../types';
import { initialTeamMembers } from '../data/mockData';
import { ColaboradorModal, PREDEFINED_ROLES } from '../components/ColaboradorModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface EquipeViewProps {
  teamMembers?: TeamMember[];
  onAddTeamMember?: (member: TeamMember) => void;
  onUpdateTeamMember?: (member: TeamMember) => void;
  onDeleteTeamMember?: (memberId: string) => void;
  currentUser?: UserProfile;
}

export const EquipeView: React.FC<EquipeViewProps> = ({
  teamMembers: externalTeamMembers,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  currentUser,
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

  // Quick Credential Peek Drawer for Marcos
  const [credentialPeekMember, setCredentialPeekMember] = useState<TeamMember | null>(null);
  const [showPeekPassword, setShowPeekPassword] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Verificação de permissão: Somente o Marcos Lancerotti consegue adicionar colaboradores
  const isMarcosLancerotti = Boolean(
    currentUser && (
      (currentUser.name?.toLowerCase().includes('marcos') && currentUser.name?.toLowerCase().includes('lancerotti')) ||
      currentUser.email?.toLowerCase() === 'lancerottirmarcos@gmail.com' ||
      (currentUser as any).username?.toLowerCase() === 'lancerotti'
    )
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
    <div className="space-y-6 max-w-7xl mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredMembers.map((member) => {
            const memberFunc = getMemberFunctionRole(member);
            const badgeInfo = getFunctionBadge(memberFunc);
            const FuncIcon = badgeInfo.icon;
            const username = member.username || member.name.toLowerCase().replace(/\s+/g, '.');

            // Workload calculation
            const tasksCount = member.activeTasks || 0;
            const loadLevel = tasksCount <= 2 ? 'Leve' : tasksCount <= 5 ? 'Ideal' : 'Intensa';
            const loadColor = tasksCount <= 2 ? 'bg-emerald-500' : tasksCount <= 5 ? 'bg-blue-500' : 'bg-amber-500';

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Bar: Avatar, Online Dot, Name and Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {member.avatar?.trim() ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#142142] to-[#1e3060] text-[#fab518] font-black text-sm flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Status dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0f172a] ${
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
                        <h3 className="text-sm font-extrabold text-[#142142] dark:text-white truncate group-hover:text-[#fab518] transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                          {member.role || memberFunc}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        member.status === 'Disponível'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : member.status === 'Ocupado'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  {/* Function & Role Pill */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeInfo.tagClass}`}>
                      <FuncIcon size={13} />
                      <span>{memberFunc}</span>
                    </span>
                  </div>

                  {/* Login Credentials Strip (High-value agency feature) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound size={13} className="text-[#fab518] shrink-0" />
                      <span className="font-mono text-xs font-bold text-[#142142] dark:text-white truncate">
                        @{username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isMarcosLancerotti && (
                        <button
                          type="button"
                          onClick={() => {
                            setCredentialPeekMember(member);
                            setShowPeekPassword(false);
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 cursor-pointer"
                          title="Ver senha e credenciais completas"
                        >
                          Ver Senha
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(member)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Copiar credenciais de acesso para enviar"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Workload & Tasks Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Carga Operacional</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {tasksCount} demandas • <span className="font-normal text-slate-500">{loadLevel}</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${loadColor}`}
                        style={{ width: `${Math.min(100, Math.max(10, tasksCount * 18))}%` }}
                      />
                    </div>
                  </div>

                  {/* Specialties Chips */}
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50"
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

                {/* Card Action Footer */}
                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  {/* Email contact link */}
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#142142] dark:text-slate-400 dark:hover:text-white transition-colors truncate max-w-[140px]"
                    title={member.email}
                  >
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate text-[11px]">{member.email}</span>
                  </a>

                  {/* Action buttons (Restricted to Marcos) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isMarcosLancerotti ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 text-slate-500 hover:text-[#142142] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={`Editar dados de ${member.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title={`Excluir colaborador ${member.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400">Ativo</span>
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
                            <span className="font-extrabold text-[#142142] dark:text-white block">
                              {member.name}
                            </span>
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
                          <div className="flex items-center justify-end gap-1.5">
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
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(member)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
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
