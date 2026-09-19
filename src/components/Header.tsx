import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  LogOut, 
  CheckCheck, 
  Trash2, 
  CheckCircle2, 
  CalendarDays, 
  Kanban, 
  Users, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ExternalLink, 
  X,
  ShieldCheck,
  KeyRound,
  Database,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, AgencyNotification } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { 
  getNotificationPermission, 
  requestNotificationPermission,
  playNotificationSound
} from '../utils/browserNotifications';

interface HeaderProps {
  currentPage: PageId;
  onOpenMobileSidebar: () => void;
  onOpenNewDemandModal?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onLogout?: () => void;
  onNavigate?: (page: PageId) => void;
  isSupabaseOnline?: boolean;
  supabaseSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  onRefreshSupabase?: () => void;
  clientsCount?: number;
}

const STORAGE_KEY = 'help_agency_notifications_v2';

const DEFAULT_NOTIFICATIONS: AgencyNotification[] = [
  {
    id: 'notif-sec-1',
    title: 'Autenticação 2FA & Protocolo Antifraude',
    message: 'Ações sensíveis como exclusão de múltiplos clientes ou faturas e alterações globais agora exigem verificação 2FA temporária.',
    timestamp: 'Agora mesmo',
    type: 'security',
    read: false,
    targetPage: 'configuracoes',
    actionLabel: 'Ver Segurança',
  },
  {
    id: 'notif-sec-2',
    title: 'Varredura Antivírus & Sandbox Ativa',
    message: 'Módulo de quarentena operacional para proteger arquivos e sanitizar anexos contra malwares e injeções.',
    timestamp: 'Hoje, 10:15',
    type: 'security',
    read: false,
    targetPage: 'configuracoes',
    actionLabel: 'Ver Logs',
  },
  {
    id: 'notif-1',
    title: 'Sistema Pronto para Operação',
    message: 'A base de clientes foi inicializada limpa. Você já pode cadastrar seus clientes reais e iniciar as operações da agência.',
    timestamp: 'Hoje, 09:00',
    type: 'system',
    read: false,
    targetPage: 'clientes',
    actionLabel: 'Cadastrar Cliente',
  },
  {
    id: 'notif-2',
    title: 'Calendário Editorial 2026 Ativo',
    message: 'Mais de 100 datas comemorativas, feriados e ganchos prontos para criar demandas e posts para seus clientes.',
    timestamp: 'Hoje, 08:30',
    type: 'calendar',
    read: false,
    targetPage: 'calendario',
    actionLabel: 'Ver Calendário',
  },
  {
    id: 'notif-3',
    title: 'Portal do Cliente & Aprovações',
    message: 'Links exclusivos prontos para envio via WhatsApp ou link direto para aprovação ágil de artes e cópias.',
    timestamp: 'Ontem, 17:00',
    type: 'approval',
    read: true,
    targetPage: 'portal-cliente',
    actionLabel: 'Abrir Portal',
  },
  {
    id: 'notif-4',
    title: 'Quadro Kanban de Demandas',
    message: 'Acompanhe todo o pipeline: Ideias, Produção, Revisão Interna, Em Aprovação e Agendados.',
    timestamp: 'Ontem, 14:15',
    type: 'demand',
    read: true,
    targetPage: 'demandas',
    actionLabel: 'Ver Kanban',
  },
];

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  inicio: {
    title: 'Visão Geral',
    subtitle: 'Acompanhe as métricas de produção e financeiro da Help Ideias Digitais',
  },
  clientes: {
    title: 'Carteira de Clientes',
    subtitle: 'Gestão de contas, contratos vigentes e contatos dos clientes',
  },
  servicos: {
    title: 'Catálogo de Serviços',
    subtitle: 'Serviços de Redes Sociais, Tráfego Pago e Criação de Sites',
  },
  demandas: {
    title: 'Quadro de Demandas',
    subtitle: 'Gerencie o fluxo de produção, aprovações e agendamentos da agência',
  },
  calendario: {
    title: 'Datas Comemorativas 2026',
    subtitle: 'Planejamento editorial, campanhas comerciais, feriados e aniversários de clientes',
  },
  financeiro: {
    title: 'Gestão Financeira',
    subtitle: 'Fluxo de caixa, mensalidades recorrentes e faturamento da agência',
  },
  orcamentos: {
    title: 'Propostas & Orçamentos',
    subtitle: 'Crie orçamentos comerciais e converta propostas em clientes',
  },
  equipe: {
    title: 'Equipe da Agência',
    subtitle: 'Distribuição de tarefas, capacidade de produção e colaboradores',
  },
  configuracoes: {
    title: 'Configurações do Sistema',
    subtitle: 'Preferências da Help Ideias Digitais, tags e integrações',
  },
  'portal-cliente': {
    title: 'Portal do Cliente & Aprovações',
    subtitle: 'Gerencie envios de materiais, links exclusivos e aprovações em tempo real',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  onOpenNewDemandModal,
  searchQuery,
  onSearchChange,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onLogout,
  onNavigate,
  isSupabaseOnline = false,
  supabaseSyncStatus = 'idle',
  onRefreshSupabase,
  clientsCount,
}) => {
  const pageInfo = PAGE_TITLES[currentPage] || PAGE_TITLES.inicio;

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'security'>('all');
  const [notifications, setNotifications] = useState<AgencyNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });

  const notificationsRef = useRef<HTMLDivElement>(null);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Support broadcasting notifications from anywhere in the app
  useEffect(() => {
    const handleCustomNotification = (e: Event) => {
      const customEvent = e as CustomEvent<AgencyNotification>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev]);
      }
    };
    window.addEventListener('help_agency_notification', handleCustomNotification);
    return () => {
      window.removeEventListener('help_agency_notification', handleCustomNotification);
    };
  }, []);

  // Click outside and Esc key listener
  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const securityCount = notifications.filter((n) => n.type === 'security').length;

  const [browserNotifPermission, setBrowserNotifPermission] = useState<string>(() => getNotificationPermission());

  const handleRequestBrowserNotif = async () => {
    const perm = await requestNotificationPermission();
    setBrowserNotifPermission(perm);
    if (perm === 'granted') {
      playNotificationSound('approval');
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notif: AgencyNotification) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.targetPage && onNavigate) {
      onNavigate(notif.targetPage);
      setIsNotificationsOpen(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'security') return n.type === 'security';
    return true;
  });

  const getTypeIcon = (type: AgencyNotification['type']) => {
    switch (type) {
      case 'security':
        return <ShieldCheck size={16} className="text-emerald-500 dark:text-emerald-400" />;
      case 'calendar':
        return <CalendarDays size={16} className="text-amber-500" />;
      case 'demand':
        return <Kanban size={16} className="text-blue-500" />;
      case 'client':
        return <Users size={16} className="text-emerald-500" />;
      case 'financial':
        return <AlertCircle size={16} className="text-purple-500" />;
      case 'approval':
        return <Sparkles size={16} className="text-[#fab518]" />;
      default:
        return <CheckCircle2 size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-16 sm:h-20 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-[calc(1780px-2rem)] mx-auto bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-[28px] my-2 sm:my-3 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-2 sm:top-3 z-40 shadow-sm shadow-slate-200/40 dark:shadow-black/30 transition-all duration-300 ease-in-out">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile menu open */}
        <button
          id="btn-open-sidebar"
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Abrir menu lateral"
        >
          <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-xl md:text-2xl font-black text-[#142142] dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
            {pageInfo.title}
          </h2>
          <p className="hidden md:block text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search + Theme Toggle + Notifications + Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen((prev) => !prev)}
          className={`sm:hidden p-2 rounded-xl transition-colors cursor-pointer ${
            isMobileSearchOpen
              ? 'bg-[#fab518] text-[#142142]'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Buscar no sistema"
          aria-label="Abrir busca"
        >
          <Search size={18} />
        </button>

        {/* Universal Search (Desktop / Tablet) */}
        <div className="relative hidden sm:block w-40 md:w-56 lg:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            id="global-search-input"
            type="text"
            placeholder="Buscar no sistema..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F2F2F2] dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm font-medium text-[#142142] dark:text-slate-100 pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <ThemeToggle variant="icon" />

        {/* Notifications Button & Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            id="btn-notifications"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsNotificationsOpen((prev) => !prev);
            }}
            className={`relative p-2.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
              isNotificationsOpen
                ? 'bg-[#142142] text-[#fab518] dark:bg-slate-800 dark:text-[#fab518] ring-2 ring-[#fab518]/50 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
            }`}
            title={unreadCount > 0 ? `${unreadCount} notificações pendentes` : 'Central de Notificações'}
            aria-label="Abrir central de notificações"
            aria-expanded={isNotificationsOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#fab518] text-[#142142] text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0f172a] shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Mobile Backdrop to dim screen and close on tap outside */}
          {isNotificationsOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden"
              onClick={() => setIsNotificationsOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Notifications Popover Dropdown */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="fixed inset-x-2 sm:inset-x-auto top-14 sm:top-full sm:mt-3 sm:right-0 bottom-3 sm:bottom-auto w-auto sm:w-[420px] max-w-full sm:max-w-[calc(100vw-2rem)] sm:max-h-[540px] bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-[24px] border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/20 z-50 overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-3.5 sm:p-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#fab518]/15 text-[#fab518] flex items-center justify-center shrink-0">
                      <Bell size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#142142] dark:text-white tracking-tight truncate">
                        Central de Notificações
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {unreadCount === 0 ? 'Nenhuma pendência não lida' : `${unreadCount} ${unreadCount === 1 ? 'notificação pendente' : 'notificações pendentes'}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Fechar"
                    aria-label="Fechar notificações"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Controls: Filter Tabs & Quick Actions */}
                <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs bg-slate-50/20 dark:bg-slate-900/20 gap-1.5 sm:gap-2 shrink-0">
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        activeFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Todas ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('unread')}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        activeFilter === 'unread'
                          ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Não lidas ({unreadCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('security')}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                        activeFilter === 'security'
                          ? 'bg-emerald-500 text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <ShieldCheck size={11} />
                      <span>Segurança ({securityCount})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="p-1 sm:px-1.5 sm:py-0.5 text-[10px] sm:text-[11px] font-bold text-[#fab518] hover:text-[#d89707] flex items-center gap-1 cursor-pointer transition-colors rounded-md hover:bg-[#fab518]/10"
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck size={13} />
                        <span className="hidden sm:inline">Marcar lidas</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="p-1 sm:px-1.5 sm:py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer transition-colors rounded-md hover:bg-red-500/10"
                        title="Limpar todas as notificações"
                      >
                        <Trash2 size={12} />
                        <span className="hidden sm:inline">Limpar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Browser Web Notifications Status Banner */}
                <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                      Alertas no Navegador:
                    </span>
                    {browserNotifPermission === 'granted' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={12} />
                        Ativo
                      </span>
                    ) : browserNotifPermission === 'denied' ? (
                      <span className="text-rose-500 font-bold shrink-0">Bloqueado</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">Não ativado</span>
                    )}
                  </div>

                  {browserNotifPermission !== 'granted' && browserNotifPermission !== 'denied' && (
                    <button
                      type="button"
                      onClick={handleRequestBrowserNotif}
                      className="px-2 sm:px-2.5 py-1 rounded-lg bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] font-black text-[10px] hover:opacity-90 transition-all cursor-pointer shrink-0"
                    >
                      Ativar Alertas
                    </button>
                  )}
                  {browserNotifPermission === 'granted' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (onNavigate) onNavigate('configuracoes');
                      }}
                      className="text-[10px] font-bold text-[#fab518] hover:underline cursor-pointer shrink-0"
                    >
                      Ajustar
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 overscroll-contain">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-10 px-6 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {activeFilter === 'unread' ? 'Tudo lido por aqui!' : activeFilter === 'security' ? 'Nenhum alerta de segurança registrado' : 'Nenhuma notificação no momento'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Novos avisos da equipe, aprovações de clientes, 2FA e prazos de campanhas aparecerão aqui automaticamente.
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`
                          p-3 sm:p-4 transition-colors cursor-pointer group flex items-start gap-2.5 sm:gap-3
                          ${!n.read 
                            ? 'bg-[#fab518]/[0.05] dark:bg-[#fab518]/[0.08] hover:bg-[#fab518]/[0.1]' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-700/60">
                          {getTypeIcon(n.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h4 className={`text-xs font-bold truncate ${!n.read ? 'text-[#142142] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                              {n.title}
                            </h4>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-[#fab518] shrink-0" />
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-1.5 sm:mb-2 line-clamp-2">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              <span>{n.timestamp}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {n.actionLabel && (
                                <span className="font-bold text-[#142142] dark:text-[#fab518] hover:underline flex items-center gap-0.5">
                                  <span>{n.actionLabel}</span>
                                  <ExternalLink size={10} />
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                className="opacity-70 sm:opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5"
                                title="Remover"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 text-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('configuracoes');
                      setIsNotificationsOpen(false);
                    }}
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Configurações de Alertas e Protocolos →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute inset-x-2 top-full mt-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 shadow-xl sm:hidden z-50 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                autoFocus
                placeholder="Buscar clientes, demandas, propostas..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-medium text-[#142142] dark:text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#fab518]"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Fechar busca"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
