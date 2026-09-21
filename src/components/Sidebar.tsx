import React, { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import { PageId, UserProfile } from '../types';
import { currentUser } from '../data/mockData';
import { HelpLogo } from './HelpLogo';
import { ThemeToggle } from './ThemeToggle';

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
}) => {
  const activeUser = externalCurrentUser || currentUser;
  const [avatarImgError, setAvatarImgError] = useState(false);

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
      id: 'servicos',
      label: 'Serviços',
      icon: Briefcase,
    },
    {
      id: 'demandas',
      label: 'Demandas',
      icon: Kanban,
    },
    {
      id: 'calendario',
      label: 'Datas Comemorativas',
      icon: CalendarDays,
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
      id: 'financeiro',
      label: 'Financeiro',
      icon: Wallet,
    },
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      icon: FileSpreadsheet,
      badge: totalProposals > 0 ? totalProposals : undefined,
    },
    {
      id: 'equipe',
      label: 'Equipe',
      icon: UsersRound,
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
              const isActive = currentPage === item.id;
              const isDisabled = Boolean(item.disabled);

              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  type="button"
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onSelectPage(item.id);
                    onCloseMobile();
                  }}
                  title={
                    isDisabled
                      ? `${item.label} (Funcionalidade desativada)`
                      : isCollapsed
                      ? item.label
                      : undefined
                  }
                  className={`
                    w-full flex items-center rounded-2xl text-left
                    text-sm font-semibold transition-all duration-200 group relative
                    ${isCollapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'justify-between px-3.5 py-2.5'}
                    ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500 bg-transparent select-none'
                        : isActive
                        ? 'bg-[#142142] text-white shadow-md shadow-[#142142]/20 dark:bg-[#fab518] dark:text-[#142142] cursor-pointer'
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
                            : isActive
                            ? 'bg-white/10 dark:bg-[#142142]/10 text-[#fab518] dark:text-[#142142]'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-[#142142] dark:group-hover:text-white group-hover:bg-white dark:group-hover:bg-slate-700'
                        }
                      `}
                    >
                      <Icon size={18} />
                    </div>
                    {!isCollapsed && <span className="tracking-wide text-left truncate">{item.label}</span>}
                  </div>

                  {isCollapsed ? (
                    item.badge && !isDisabled ? (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fab518] ring-2 ring-white" />
                    ) : null
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`
                            text-xs px-2 py-0.5 rounded-full font-bold
                            ${
                              item.badgeColor
                                ? item.badgeColor
                                : isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }
                          `}
                        >
                          {item.badge}
                        </span>
                      )}

                      {!isDisabled && (
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
                      )}
                    </div>
                  )}
                </button>
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
    </>
  );
};
