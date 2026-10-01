import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Kanban, 
  Wallet, 
  FileSpreadsheet, 
  UsersRound, 
  Settings,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  X,
  LogOut,
  Lock,
  Building2,
  Layers,
  MessageSquare,
  CalendarClock,
  BarChart3
} from 'lucide-react';
import { PageId, UserProfile, Client, DemandItem } from '../types';
import { currentUser } from '../data/mockData';
import { HelpLogo } from './HelpLogo';
import { ThemeToggle } from './ThemeToggle';
import { canAccessPage } from '../utils/permissionUtils';
import { SidebarClientsSubBar } from './SidebarClientsSubBar';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalActiveDemands?: number;
  totalClients?: number;
  totalProposals?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  currentUser?: UserProfile;
  clients?: Client[];
  demands?: DemandItem[];
  selectedClientFilter?: string;
  onSelectClientDemands?: (clientName: string) => void;
}

interface NavItemConfig {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
  totalActiveDemands = 0,
  totalClients = 0,
  totalProposals = 0,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
  currentUser: externalCurrentUser,
  clients = [],
  demands = [],
  selectedClientFilter = 'todos',
  onSelectClientDemands,
}) => {
  const activeUser = externalCurrentUser || currentUser;
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isClientsSubBarOpen, setIsClientsSubBarOpen] = useState(false);
  const subBarCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Submenu de Produção (Serviços, Datas Comemorativas, APIs)
  const [isProducaoFlyoutOpen, setIsProducaoFlyoutOpen] = useState(false);
  const [isProducaoMobileExpanded, setIsProducaoMobileExpanded] = useState(false);
  const [producaoMenuTop, setProducaoMenuTop] = useState<number>(200);
  const producaoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const producaoBtnRef = useRef<HTMLButtonElement | null>(null);

  const producaoSubItems = [
    {
      id: 'servicos' as PageId,
      label: 'Serviços',
      description: 'Catálogo de serviços e escopos',
      icon: Briefcase,
    },
    {
      id: 'calendario' as PageId,
      label: 'Datas Comemorativas',
      description: 'Calendário editorial 2026',
      icon: CalendarDays,
    },
    {
      id: 'apis' as PageId,
      label: 'APIs',
      description: 'Consultas de CNPJ e dados cadastrais',
      icon: Building2,
    },
  ];

  // Submenu de Gestão (Financeiro, Orçamentos, Equipe)
  const [isGestaoFlyoutOpen, setIsGestaoFlyoutOpen] = useState(false);
  const [isGestaoExpanded, setIsGestaoExpanded] = useState(false);
  const [isGestaoMobileExpanded, setIsGestaoMobileExpanded] = useState(false);
  const [gestaoMenuTop, setGestaoMenuTop] = useState<number>(300);
  const gestaoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gestaoBtnRef = useRef<HTMLButtonElement | null>(null);

  const gestaoSubItems = [
    {
      id: 'financeiro' as PageId,
      label: 'Financeiro',
      description: 'Faturamento, métricas e fluxo de caixa',
      icon: Wallet,
    },
    {
      id: 'orcamentos' as PageId,
      label: 'Orçamentos',
      description: 'Propostas comerciais e contratos',
      icon: FileSpreadsheet,
    },
    {
      id: 'equipe' as PageId,
      label: 'Equipe',
      description: 'Colaboradores, cargos e permissões',
      icon: UsersRound,
    },
  ];

  const handleMouseEnterDemandas = () => {
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
      subBarCloseTimeoutRef.current = null;
    }
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
      producaoTimeoutRef.current = null;
    }
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
      gestaoTimeoutRef.current = null;
    }
    setIsProducaoFlyoutOpen(false);
    setIsGestaoFlyoutOpen(false);
    setIsClientsSubBarOpen(true);
  };

  const handleMouseLeaveDemandas = () => {
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
    }
    subBarCloseTimeoutRef.current = setTimeout(() => {
      setIsClientsSubBarOpen(false);
    }, 280);
  };

  const handleMouseEnterProducao = () => {
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
      producaoTimeoutRef.current = null;
    }
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
      subBarCloseTimeoutRef.current = null;
    }
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
      gestaoTimeoutRef.current = null;
    }
    setIsClientsSubBarOpen(false);
    setIsGestaoFlyoutOpen(false);
    if (producaoBtnRef.current) {
      const rect = producaoBtnRef.current.getBoundingClientRect();
      setProducaoMenuTop(rect.top);
    }
    setIsProducaoFlyoutOpen(true);
  };

  const handleMouseLeaveProducao = () => {
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
    }
    producaoTimeoutRef.current = setTimeout(() => {
      setIsProducaoFlyoutOpen(false);
    }, 280);
  };

  const handleMouseEnterProducaoFlyout = () => {
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
      producaoTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveProducaoFlyout = () => {
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
    }
    producaoTimeoutRef.current = setTimeout(() => {
      setIsProducaoFlyoutOpen(false);
    }, 280);
  };

  const handleMouseEnterGestao = () => {
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
      gestaoTimeoutRef.current = null;
    }
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
      subBarCloseTimeoutRef.current = null;
    }
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
      producaoTimeoutRef.current = null;
    }
    setIsClientsSubBarOpen(false);
    setIsProducaoFlyoutOpen(false);
    if (gestaoBtnRef.current) {
      const rect = gestaoBtnRef.current.getBoundingClientRect();
      setGestaoMenuTop(rect.top);
    }
    setIsGestaoFlyoutOpen(true);
  };

  const handleMouseLeaveGestao = () => {
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
    }
    gestaoTimeoutRef.current = setTimeout(() => {
      setIsGestaoFlyoutOpen(false);
    }, 280);
  };

  const handleMouseEnterGestaoFlyout = () => {
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
      gestaoTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveGestaoFlyout = () => {
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
    }
    gestaoTimeoutRef.current = setTimeout(() => {
      setIsGestaoFlyoutOpen(false);
    }, 280);
  };

  const handleCloseAllSubBars = () => {
    handleCloseSubBarImmediately();
    if (producaoTimeoutRef.current) {
      clearTimeout(producaoTimeoutRef.current);
      producaoTimeoutRef.current = null;
    }
    if (gestaoTimeoutRef.current) {
      clearTimeout(gestaoTimeoutRef.current);
      gestaoTimeoutRef.current = null;
    }
    setIsProducaoFlyoutOpen(false);
    setIsGestaoFlyoutOpen(false);
  };

  const handleMouseEnterSubBar = () => {
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
      subBarCloseTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveSubBar = () => {
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
    }
    subBarCloseTimeoutRef.current = setTimeout(() => {
      setIsClientsSubBarOpen(false);
    }, 280);
  };

  const handleCloseSubBarImmediately = () => {
    if (subBarCloseTimeoutRef.current) {
      clearTimeout(subBarCloseTimeoutRef.current);
      subBarCloseTimeoutRef.current = null;
    }
    setIsClientsSubBarOpen(false);
  };

  useEffect(() => {
    return () => {
      if (subBarCloseTimeoutRef.current) {
        clearTimeout(subBarCloseTimeoutRef.current);
      }
      if (producaoTimeoutRef.current) {
        clearTimeout(producaoTimeoutRef.current);
      }
      if (gestaoTimeoutRef.current) {
        clearTimeout(gestaoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setAvatarImgError(false);
  }, [activeUser.avatarUrl]);

  const navItems: NavItemConfig[] = [
    {
      id: 'inicio',
      label: 'Início',
      icon: LayoutDashboard,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'demandas',
      label: 'Demandas',
      icon: Kanban,
    },
    {
      id: 'producao',
      label: 'Produção',
      icon: Layers,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: CalendarClock,
    },
    {
      id: 'gestao' as PageId,
      label: 'Gestão',
      icon: BarChart3,
    },
    {
      id: 'comunicacao',
      label: 'Comunicação',
      icon: MessageSquare,
    },
    {
      id: 'portal-cliente',
      label: 'Portal do Cliente',
      icon: Sparkles,
      disabled: true,
      badge: 'Em breve',
      badgeColor: 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-[10px]',
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="sidebar-navigation"
        className={`
          fixed top-0 bottom-0 left-0 z-50
          bg-white dark:bg-[#0f172a]
          flex flex-col justify-between
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)]
          lg:rounded-[32px] lg:border lg:border-slate-200/90 lg:dark:border-slate-800
          lg:shadow-xl lg:shadow-slate-300/30 lg:dark:shadow-black/50
          ${isOpenMobile ? 'translate-x-0 m-3 h-[calc(100vh-1.5rem)] rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-2xl' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-20 w-72' : 'lg:w-72 w-72'}
          overflow-hidden
        `}
      >
        {/* Top Branding Section */}
        <div className="overflow-y-auto flex-1 min-h-0 scrollbar-none">
          <div className={`h-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'px-3 justify-center' : 'px-6'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3 min-w-0'}`} id="sidebar-logo-container">
              {isCollapsed ? (
                <div className="w-12 h-12 rounded-full bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center shadow-xs border border-slate-200/60 dark:border-slate-700/60 transition-transform hover:scale-105">
                  <HelpLogo 
                    variant="icon" 
                    onClick={() => onSelectPage('inicio')} 
                  />
                </div>
              ) : (
                <HelpLogo 
                  variant="full" 
                  size="lg" 
                  onClick={() => onSelectPage('inicio')} 
                  className="py-1"
                />
              )}
            </div>

            {/* Controls on header */}
            <div className="flex items-center gap-1">
              {/* Desktop toggle collapse button */}
              {onToggleCollapse && !isCollapsed && (
                <button
                  type="button"
                  id="btn-collapse-sidebar"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-2 text-slate-400 hover:text-[#142142] hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
                  title="Diminuir / Fechar barra lateral"
                  aria-label="Diminuir / Fechar barra lateral"
                >
                  <PanelLeftClose size={19} />
                </button>
              )}

              {/* Mobile close button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                aria-label="Fechar navegação"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Collapsed expand action button */}
          {onToggleCollapse && isCollapsed && (
            <div className="hidden lg:flex justify-center pt-3 pb-1">
              <button
                type="button"
                id="btn-expand-sidebar"
                onClick={onToggleCollapse}
                className="p-2.5 bg-amber-50 hover:bg-[#fab518] text-[#142142] rounded-2xl transition-all cursor-pointer shadow-2xs border border-amber-200/80 group"
                title="Abrir / Expandir barra lateral"
                aria-label="Abrir / Expandir barra lateral"
              >
                <PanelLeftOpen size={19} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}



          {/* Navigation Links List */}
          <nav className={`py-2 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`} aria-label="Menu Principal">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Menu Principal
                </span>
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isDemandas = item.id === 'demandas';
              const isProducao = item.id === 'producao';
              const isGestao = item.id === 'gestao';

              const isProducaoActive = isProducao && (
                currentPage === 'producao' ||
                currentPage === 'servicos' ||
                currentPage === 'calendario' ||
                currentPage === 'apis'
              );

              const isGestaoActive = isGestao && (
                currentPage === 'gestao' ||
                currentPage === 'financeiro' ||
                currentPage === 'orcamentos' ||
                currentPage === 'equipe'
              );

              const isActive = currentPage === item.id || isProducaoActive || isGestaoActive;
              const isDisabled = Boolean(item.disabled);
              const isAccessBlocked = !canAccessPage(item.id, activeUser);

              const badgeContent = isAccessBlocked ? 'Bloqueado' : item.badge;
              const badgeClass = isAccessBlocked
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px]'
                : item.badgeColor;

              const isSubBarActive = 
                (isDemandas && isClientsSubBarOpen) || 
                (isProducao && isProducaoFlyoutOpen) ||
                (isGestao && isGestaoFlyoutOpen);

              const showGestaoInline = !isCollapsed && (isGestaoExpanded || isGestaoMobileExpanded || isGestaoActive);

              return (
                <React.Fragment key={item.id}>
                  <button
                    ref={isProducao ? producaoBtnRef : isGestao ? gestaoBtnRef : undefined}
                    id={`nav-link-${item.id}`}
                    type="button"
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    aria-haspopup={isDemandas || isProducao || isGestao ? 'true' : undefined}
                    aria-expanded={
                      isDemandas 
                        ? isClientsSubBarOpen 
                        : isProducao 
                        ? isProducaoFlyoutOpen 
                        : isGestao
                        ? (isGestaoFlyoutOpen || showGestaoInline)
                        : undefined
                    }
                    onMouseEnter={
                      isDemandas 
                        ? handleMouseEnterDemandas 
                        : isProducao 
                        ? handleMouseEnterProducao 
                        : isGestao
                        ? handleMouseEnterGestao
                        : handleCloseAllSubBars
                    }
                    onMouseLeave={
                      isDemandas 
                        ? handleMouseLeaveDemandas 
                        : isProducao 
                        ? handleMouseLeaveProducao 
                        : isGestao
                        ? handleMouseLeaveGestao
                        : undefined
                    }
                    onClick={() => {
                      if (isDisabled) return;
                      if (isProducao) {
                        if (producaoBtnRef.current) {
                          const rect = producaoBtnRef.current.getBoundingClientRect();
                          setProducaoMenuTop(rect.top);
                        }
                        setIsProducaoMobileExpanded(!isProducaoMobileExpanded);
                        setIsProducaoFlyoutOpen(!isProducaoFlyoutOpen);
                        return;
                      }
                      if (isGestao) {
                        if (gestaoBtnRef.current) {
                          const rect = gestaoBtnRef.current.getBoundingClientRect();
                          setGestaoMenuTop(rect.top);
                        }
                        setIsGestaoExpanded((prev) => !prev);
                        setIsGestaoMobileExpanded((prev) => !prev);
                        if (isCollapsed) {
                          setIsGestaoFlyoutOpen((prev) => !prev);
                        }
                        return;
                      }
                      onSelectPage(item.id);
                      onCloseMobile();
                    }}
                    title={
                      isDisabled
                        ? `${item.label} (Funcionalidade desativada)`
                        : isAccessBlocked
                        ? `${item.label} (Acesso restrito pelo administrador)`
                        : isCollapsed
                        ? isDemandas
                          ? `${item.label} (Passe o mouse para ver clientes)`
                          : isProducao
                          ? `${item.label} (Passe o mouse para ver Serviços, Datas e APIs)`
                          : isGestao
                          ? `${item.label} (Passe o mouse para ver Financeiro, Orçamentos e Equipe)`
                          : item.label
                        : undefined
                    }
                    className={`
                      w-full flex items-center rounded-2xl text-left
                      text-sm font-semibold transition-all duration-200 group relative
                      ${isCollapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'justify-between px-3.5 py-2.5'}
                      ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500 bg-transparent select-none'
                          : isAccessBlocked
                          ? isActive
                            ? 'bg-rose-900/20 text-rose-300 border border-rose-500/30 cursor-pointer'
                            : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 cursor-pointer'
                          : isActive
                          ? 'bg-[#142142] text-white shadow-md shadow-[#142142]/20 dark:bg-[#fab518] dark:text-[#142142] cursor-pointer'
                          : isSubBarActive
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 text-[#142142] dark:text-white border border-amber-300/80 dark:border-amber-600/60 shadow-xs cursor-pointer'
                          : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80 cursor-pointer'
                      }
                    `}
                  >
                    <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3 justify-start text-left'}`}>
                      <div
                        className={`
                          p-1.5 rounded-xl transition-colors shrink-0
                          ${
                            isDisabled
                              ? 'text-slate-400 dark:text-slate-600 bg-transparent'
                              : isAccessBlocked
                              ? 'text-rose-400 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                              : isActive
                              ? 'bg-white/10 dark:bg-[#142142]/10 text-[#fab518] dark:text-[#142142]'
                              : isSubBarActive
                              ? 'bg-[#fab518]/20 text-[#142142] dark:text-[#fab518]'
                              : 'text-slate-400 dark:text-slate-400 group-hover:text-[#142142] dark:group-hover:text-white group-hover:bg-white dark:group-hover:bg-slate-700'
                          }
                        `}
                      >
                        <Icon size={18} />
                      </div>
                      {!isCollapsed && (
                        <span className={`tracking-wide text-left truncate ${isAccessBlocked ? 'text-slate-500 dark:text-slate-400' : ''}`}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {isCollapsed ? (
                      isAccessBlocked ? (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0f172a]" />
                      ) : badgeContent && !isDisabled ? (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fab518] ring-2 ring-white" />
                      ) : (isDemandas && isClientsSubBarOpen) || (isProducao && isProducaoFlyoutOpen) ? (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-white dark:ring-[#0f172a]" />
                      ) : null
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {badgeContent && (
                          <span
                            className={`
                              text-xs px-2 py-0.5 rounded-full font-bold
                              ${
                                badgeClass
                                  ? badgeClass
                                  : isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }
                            `}
                          >
                            {badgeContent}
                          </span>
                        )}

                        {!isDisabled && (
                          isAccessBlocked ? (
                            <Lock size={13} className="text-rose-400 dark:text-rose-400 shrink-0" />
                          ) : isProducao ? (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsProducaoMobileExpanded(!isProducaoMobileExpanded);
                                setIsProducaoFlyoutOpen(!isProducaoFlyoutOpen);
                              }}
                              className="p-1 -mr-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center cursor-pointer"
                              title="Ver módulos de produção"
                              aria-label="Ver módulos de produção"
                            >
                              <ChevronRight
                                size={14}
                                className={`
                                  transition-all duration-200
                                  ${
                                    isProducaoFlyoutOpen || isProducaoMobileExpanded
                                      ? 'text-[#fab518] rotate-90 opacity-100'
                                      : isSubBarActive
                                      ? 'text-[#fab518] translate-x-1 opacity-100'
                                      : isActive
                                      ? 'text-[#fab518] translate-x-0.5 opacity-100'
                                      : 'text-slate-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                                  }
                                `}
                              />
                            </span>
                          ) : isGestao ? (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsGestaoExpanded((prev) => !prev);
                                setIsGestaoMobileExpanded((prev) => !prev);
                                if (isCollapsed) {
                                  setIsGestaoFlyoutOpen((prev) => !prev);
                                }
                              }}
                              className="p-1 -mr-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center cursor-pointer"
                              title="Ver módulos de gestão (Financeiro, Orçamentos, Equipe)"
                              aria-label="Ver módulos de gestão"
                            >
                              <ChevronRight
                                size={14}
                                className={`
                                  transition-all duration-200
                                  ${
                                    showGestaoInline || isGestaoFlyoutOpen
                                      ? 'text-[#fab518] rotate-90 opacity-100'
                                      : isSubBarActive
                                      ? 'text-[#fab518] translate-x-1 opacity-100'
                                      : isActive
                                      ? 'text-[#fab518] translate-x-0.5 opacity-100'
                                      : 'text-slate-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                                  }
                                `}
                              />
                            </span>
                          ) : isDemandas ? (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsClientsSubBarOpen(!isClientsSubBarOpen);
                              }}
                              className="p-1 -mr-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center cursor-pointer"
                              title="Ver demandas por clientes"
                              aria-label="Abrir demandas por clientes"
                            >
                              <ChevronRight
                                size={14}
                                className={`
                                  transition-all duration-200
                                  ${
                                    isClientsSubBarOpen
                                      ? 'text-[#fab518] rotate-90 opacity-100'
                                      : isSubBarActive
                                      ? 'text-[#fab518] translate-x-1 opacity-100'
                                      : isActive
                                      ? 'text-[#fab518] translate-x-0.5 opacity-100'
                                      : 'text-slate-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                                }
                              `}
                            />
                          </span>
                        ) : (
                          <ChevronRight
                            size={14}
                            className={`
                              transition-transform duration-200
                              ${
                                isActive
                                  ? 'text-[#fab518] translate-x-0.5'
                                  : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                              }
                            `}
                          />
                        )
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu inline para mobile quando Produção está expandida ou ativa */}
                {isProducao && !isCollapsed && (isProducaoMobileExpanded || isProducaoActive) && (
                  <div className="pl-4 pr-1 py-1 space-y-1 lg:hidden animate-in fade-in slide-in-from-top-1 duration-150 border-l-2 border-[#fab518]/50 ml-5 my-1">
                    {producaoSubItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentPage === sub.id;

                      return (
                        <button
                          key={`mobile-sub-${sub.id}`}
                          type="button"
                          onClick={() => {
                            onSelectPage(sub.id);
                            onCloseMobile();
                          }}
                          className={`
                            w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer
                            ${
                              isSubActive
                                ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] font-black shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }
                          `}
                        >
                          <SubIcon size={14} className={isSubActive ? 'text-[#fab518] dark:text-[#142142]' : 'text-slate-400'} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Submenu inline para Gestão (Financeiro, Orçamentos, Equipe) */}
                {isGestao && !isCollapsed && showGestaoInline && (
                  <div className="pl-4 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 border-l-2 border-[#fab518]/50 ml-5 my-1">
                    {gestaoSubItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentPage === sub.id;
                      const isSubBlocked = !canAccessPage(sub.id, activeUser);

                      return (
                        <button
                          key={`inline-gestao-${sub.id}`}
                          id={`nav-link-${sub.id}`}
                          type="button"
                          disabled={isSubBlocked}
                          onClick={() => {
                            if (isSubBlocked) return;
                            onSelectPage(sub.id);
                            onCloseMobile();
                          }}
                          title={isSubBlocked ? `${sub.label} (Acesso restrito)` : sub.description}
                          className={`
                            w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer group
                            ${
                              isSubBlocked
                                ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500 bg-transparent'
                                : isSubActive
                                ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] font-black shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SubIcon 
                              size={15} 
                              className={
                                isSubBlocked
                                  ? 'text-rose-400'
                                  : isSubActive 
                                  ? 'text-[#fab518] dark:text-[#142142]' 
                                  : 'text-slate-400 group-hover:text-[#142142] dark:group-hover:text-white'
                              } 
                            />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {isSubBlocked ? (
                            <Lock size={12} className="text-rose-400 shrink-0" />
                          ) : (
                            <ChevronRight 
                              size={12} 
                              className={`
                                transition-all duration-200 shrink-0
                                ${
                                  isSubActive 
                                    ? 'text-[#fab518] dark:text-[#142142] opacity-100 translate-x-0.5' 
                                    : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                                }
                              `} 
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
          </nav>
        </div>

        {/* Bottom Profile & Footer Card */}
        <div className={`border-t border-slate-100 dark:border-slate-800 shrink-0 ${isCollapsed ? 'p-2 space-y-2' : 'p-4 space-y-3'}`}>
          {/* Theme Mode Toggle (Light / Dark) */}
          <div className={isCollapsed ? 'flex justify-center' : 'w-full'}>
            <ThemeToggle variant={isCollapsed ? 'icon' : 'sidebar'} />
          </div>

          {/* Current User Card */}
          <div 
            onClick={() => onSelectPage('equipe')}
            className={`flex items-center justify-between rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group/user ${isCollapsed ? 'justify-center p-1.5' : 'p-2'}`}
            title={isCollapsed ? `${activeUser.name} - ${activeUser.roleLabel} (Clique para ver perfil na Equipe)` : 'Clique para ver o perfil na Equipe'}
          >
            <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
              {activeUser.avatarUrl?.trim() && !avatarImgError ? (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarImgError(true)}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#fab518] shrink-0 group-hover/user:scale-105 transition-transform"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-[#142142] text-[#fab518] text-sm font-black flex items-center justify-center ring-2 ring-[#fab518] shrink-0 group-hover/user:scale-105 transition-transform">
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#142142] dark:text-white truncate leading-snug group-hover/user:text-[#fab518] transition-colors">
                    {activeUser.name}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    <ShieldCheck size={12} className="text-[#fab518] shrink-0" />
                    <span className="truncate">{activeUser.roleLabel}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            {onLogout && !isCollapsed && (
              <button
                type="button"
                id="btn-sidebar-logout"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer shrink-0 ml-1"
                title="Sair do sistema (Logout)"
                aria-label="Sair do sistema"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* Bottom expand toggle button on collapsed mode */}
          {onToggleCollapse && isCollapsed && (
            <button
              type="button"
              id="btn-expand-sidebar-bottom"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-full items-center justify-center py-2 text-slate-500 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
              title="Expandir barra lateral"
              aria-label="Expandir barra lateral"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Secondary Sub-Bar showing registered clients on hover of Demandas */}
      <SidebarClientsSubBar
        isOpen={isClientsSubBarOpen}
        onClose={() => setIsClientsSubBarOpen(false)}
        onMouseEnter={handleMouseEnterSubBar}
        onMouseLeave={handleMouseLeaveSubBar}
        clients={clients}
        demands={demands}
        selectedClientFilter={selectedClientFilter}
        onSelectClientDemands={(clientName) => {
          setIsClientsSubBarOpen(false);
          if (onSelectClientDemands) {
            onSelectClientDemands(clientName);
          } else {
            onSelectPage('demandas');
          }
          onCloseMobile();
        }}
        onSelectAllDemands={() => {
          setIsClientsSubBarOpen(false);
          if (onSelectClientDemands) {
            onSelectClientDemands('todos');
          } else {
            onSelectPage('demandas');
          }
          onCloseMobile();
        }}
        isSidebarCollapsed={isCollapsed}
        onNavigateToClients={() => {
          setIsClientsSubBarOpen(false);
          onSelectPage('clientes');
          onCloseMobile();
        }}
      />

      {/* Menu Flutuante de Produção ao passar o mouse (Desktop) */}
      {isProducaoFlyoutOpen && (
        <div
          id="sidebar-producao-flyout"
          onMouseEnter={handleMouseEnterProducaoFlyout}
          onMouseLeave={handleMouseLeaveProducaoFlyout}
          style={{
            top: `${Math.max(16, Math.min(producaoMenuTop - 6, (typeof window !== 'undefined' ? window.innerHeight : 800) - 290))}px`,
          }}
          className={`
            fixed z-[70] hidden lg:flex flex-col
            ${isCollapsed ? 'left-[92px]' : 'left-[304px]'}
            w-80 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md
            rounded-[26px] border border-slate-200/90 dark:border-slate-800
            shadow-2xl shadow-slate-900/25 dark:shadow-black/70
            p-2.5 space-y-1.5
            transition-all duration-150 ease-out
            animate-in fade-in-0 zoom-in-95
            before:absolute before:-left-6 before:top-0 before:bottom-0 before:w-7 before:content-['']
          `}
          role="menu"
          aria-label="Módulos de Produção"
        >
          {/* Cabeçalho do menu */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold text-xs">
                <Layers size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider block">
                  Produção
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Serviços, Datas e APIs
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              3 Módulos
            </span>
          </div>

          {/* Sub-itens: Serviços, Datas Comemorativas, APIs */}
          <div className="space-y-1">
            {producaoSubItems.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = currentPage === sub.id;

              return (
                <button
                  key={`desktop-sub-${sub.id}`}
                  id={`producao-subitem-${sub.id}`}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProducaoFlyoutOpen(false);
                    onSelectPage(sub.id);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer group
                    ${
                      isSubActive
                        ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-md shadow-[#142142]/20 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-[#142142] dark:hover:text-white'
                    }
                  `}
                >
                  <div
                    className={`
                      w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                      ${
                        isSubActive
                          ? 'bg-white/10 dark:bg-[#142142]/15 text-[#fab518] dark:text-[#142142]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#fab518]/20 group-hover:text-[#142142] dark:group-hover:text-[#fab518]'
                      }
                    `}
                  >
                    <SubIcon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">
                        {sub.label}
                      </span>
                      <ChevronRight
                        size={13}
                        className={`
                          transition-transform duration-200 shrink-0
                          ${
                            isSubActive
                              ? 'text-[#fab518] dark:text-[#142142] translate-x-0.5'
                              : 'text-slate-400 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'
                          }
                        `}
                      />
                    </div>
                    <p
                      className={`
                        text-[10px] truncate leading-tight mt-0.5
                        ${
                          isSubActive
                            ? 'text-slate-300 dark:text-[#142142]/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }
                      `}
                    >
                      {sub.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu Flutuante de Gestão ao passar o mouse (Desktop) */}
      {isGestaoFlyoutOpen && (
        <div
          id="sidebar-gestao-flyout"
          onMouseEnter={handleMouseEnterGestaoFlyout}
          onMouseLeave={handleMouseLeaveGestaoFlyout}
          style={{
            top: `${Math.max(16, Math.min(gestaoMenuTop - 6, (typeof window !== 'undefined' ? window.innerHeight : 800) - 290))}px`,
          }}
          className={`
            fixed z-[70] hidden lg:flex flex-col
            ${isCollapsed ? 'left-[92px]' : 'left-[304px]'}
            w-80 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md
            rounded-[26px] border border-slate-200/90 dark:border-slate-800
            shadow-2xl shadow-slate-900/25 dark:shadow-black/70
            p-2.5 space-y-1.5
            transition-all duration-150 ease-out
            animate-in fade-in-0 zoom-in-95
            before:absolute before:-left-6 before:top-0 before:bottom-0 before:w-7 before:content-['']
          `}
          role="menu"
          aria-label="Módulos de Gestão"
        >
          {/* Cabeçalho do menu */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold text-xs">
                <BarChart3 size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider block">
                  Gestão
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Financeiro, Orçamentos e Equipe
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              3 Módulos
            </span>
          </div>

          {/* Sub-itens: Financeiro, Orçamentos, Equipe */}
          <div className="space-y-1">
            {gestaoSubItems.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = currentPage === sub.id;
              const isSubBlocked = !canAccessPage(sub.id, activeUser);

              return (
                <button
                  key={`desktop-gestao-sub-${sub.id}`}
                  id={`gestao-subitem-${sub.id}`}
                  type="button"
                  role="menuitem"
                  disabled={isSubBlocked}
                  onClick={() => {
                    if (isSubBlocked) return;
                    setIsGestaoFlyoutOpen(false);
                    onSelectPage(sub.id);
                  }}
                  title={isSubBlocked ? `${sub.label} (Acesso restrito)` : undefined}
                  className={`
                    w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer group
                    ${
                      isSubBlocked
                        ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                        : isSubActive
                        ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-md shadow-[#142142]/20 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-[#142142] dark:hover:text-white'
                    }
                  `}
                >
                  <div
                    className={`
                      w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                      ${
                        isSubBlocked
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-400'
                          : isSubActive
                          ? 'bg-white/10 dark:bg-[#142142]/15 text-[#fab518] dark:text-[#142142]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#fab518]/20 group-hover:text-[#142142] dark:group-hover:text-[#fab518]'
                      }
                    `}
                  >
                    <SubIcon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">
                        {sub.label}
                      </span>
                      {isSubBlocked ? (
                        <Lock size={12} className="text-rose-400 shrink-0" />
                      ) : (
                        <ChevronRight
                          size={13}
                          className={`
                            transition-transform duration-200 shrink-0
                            ${
                              isSubActive
                                ? 'text-[#fab518] dark:text-[#142142] translate-x-0.5'
                                : 'text-slate-400 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'
                            }
                          `}
                        />
                      )}
                    </div>
                    <p
                      className={`
                        text-[10px] truncate leading-tight mt-0.5
                        ${
                          isSubActive
                            ? 'text-slate-300 dark:text-[#142142]/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }
                      `}
                    >
                      {sub.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
