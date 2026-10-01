import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Plus,
  Video,
  MapPin,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  LogOut,
  CalendarCheck,
  Building2,
  Link2,
  CalendarClock,
  Layers,
} from 'lucide-react';
import { AgencyAppointment, AppointmentCategory, Client, UserProfile } from '../types';
import {
  initGoogleCalendarAuth,
  signInWithGoogleCalendar,
  signOutGoogleCalendar,
  getGoogleCalendarUser,
  isGoogleCalendarConnected,
  subscribeGoogleCalendarAuth,
} from '../services/googleCalendarAuth';
import {
  getLocalAppointments,
  saveLocalAppointments,
  getDeletedAppointmentIds,
  fetchGoogleCalendarEvents,
  createGoogleCalendarAppointment,
  updateGoogleCalendarAppointment,
  deleteGoogleCalendarAppointment,
  CreateAppointmentInput,
} from '../services/googleCalendarService';
import { AgendaAppointmentModal } from '../components/AgendaAppointmentModal';
import { AgendaDeleteConfirmModal } from '../components/AgendaDeleteConfirmModal';

interface AgendaViewProps {
  currentUser: UserProfile;
  clients: Client[];
}

type ViewMode = 'mes' | 'semana' | 'lista';

const CATEGORY_MAP: Record<AppointmentCategory, { label: string; bg: string; text: string; dot: string }> = {
  briefing: {
    label: 'Briefing & Onboarding',
    bg: 'bg-purple-500/10 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  apresentacao: {
    label: 'Apresentação de Métricas',
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  trafego: {
    label: 'Tráfego Pago',
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  design_web: {
    label: 'Design & Web',
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  comercial: {
    label: 'Comercial & Proposta',
    bg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  sprint_interna: {
    label: 'Sprint & Equipe',
    bg: 'bg-slate-500/10 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
  outro: {
    label: 'Outro',
    bg: 'bg-slate-200 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const AgendaView: React.FC<AgendaViewProps> = ({ currentUser, clients }) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('mes');

  // Appointments State
  const [appointments, setAppointments] = useState<AgencyAppointment[]>(() => getLocalAppointments());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Google Auth State
  const [isGoogleConnectedState, setIsGoogleConnectedState] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // Modals State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AgencyAppointment | null>(null);
  const [appointmentInitialDate, setAppointmentInitialDate] = useState<string | undefined>(undefined);
  const [deletingAppointment, setDeletingAppointment] = useState<AgencyAppointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to Google Auth changes
  useEffect(() => {
    const unsubscribe = subscribeGoogleCalendarAuth((user, token) => {
      setGoogleUser(user);
      setIsGoogleConnectedState(Boolean(token && user));
    });

    initGoogleCalendarAuth(
      (user, _token) => {
        setGoogleUser(user);
        setIsGoogleConnectedState(true);
      },
      () => {
        setIsGoogleConnectedState(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync with Google Calendar
  const handleSyncWithGoogle = useCallback(async (showFeedback = true) => {
    if (!isGoogleCalendarConnected()) return;

    setIsSyncing(true);
    try {
      const result = await fetchGoogleCalendarEvents(clients);
      if (result.success) {
        const deletedIds = getDeletedAppointmentIds();
        setAppointments((prev) => {
          // Filter out any remote items that were deleted or cancelled
          const cleanRemote = result.events.filter((e) => {
            if (e.status === 'cancelled') return false;
            if (e.id && deletedIds.has(e.id)) return false;
            if (e.googleEventId && deletedIds.has(e.googleEventId)) return false;
            return true;
          });

          // Merge with local items that are not yet on Google, also ignoring deleted/cancelled
          const googleIds = new Set(cleanRemote.map((e) => e.googleEventId).filter(Boolean));
          const unsyncedLocals = prev.filter((p) => {
            if (p.status === 'cancelled') return false;
            if (p.id && deletedIds.has(p.id)) return false;
            if (p.googleEventId && deletedIds.has(p.googleEventId)) return false;
            return !p.googleEventId || !googleIds.has(p.googleEventId);
          });

          const merged = [...cleanRemote, ...unsyncedLocals];
          saveLocalAppointments(merged);
          return merged;
        });

        const nowFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowFormatted);

        if (showFeedback) {
          setStatusFeedback({
            type: 'success',
            message: `Agenda sincronizada com sucesso com o Google Calendar às ${nowFormatted}.`,
          });
        }
      } else if (result.isUnauthorized) {
        setIsGoogleConnectedState(false);
        setStatusFeedback({
          type: 'error',
          message: 'Sessão com o Google expirada. Clique em Reconectar para sincronizar novamente.',
        });
      } else {
        setStatusFeedback({
          type: 'error',
          message: result.error || 'Falha ao sincronizar com Google Calendar.',
        });
      }
    } catch (err: any) {
      console.error('Error syncing calendar:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [clients]);

  // Initial sync once connected
  useEffect(() => {
    if (isGoogleConnectedState) {
      handleSyncWithGoogle(false);
    }
  }, [isGoogleConnectedState, handleSyncWithGoogle]);

  // Auto-dismiss status feedback after 6 seconds
  useEffect(() => {
    if (statusFeedback) {
      const timer = setTimeout(() => setStatusFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusFeedback]);

  // Connect Google Calendar handler
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setStatusFeedback(null);
    try {
      const res = await signInWithGoogleCalendar();
      if (res) {
        setIsGoogleConnectedState(true);
        setGoogleUser(res.user);
        setStatusFeedback({
          type: 'success',
          message: `Conectado com sucesso à conta Google (${res.user.email}). Sincronizando eventos...`,
        });
        await handleSyncWithGoogle(true);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or dismissed the popup; no action or error banner needed
        return;
      }
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Não foi possível conectar com o Google Calendar.',
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Disconnect Google Calendar handler
  const handleDisconnectGoogle = async () => {
    try {
      await signOutGoogleCalendar();
      setIsGoogleConnectedState(false);
      setGoogleUser(null);
      setStatusFeedback({
        type: 'info',
        message: 'Google Calendar desconectado. A agenda continuará disponível em modo local.',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Save (Create or Update) Appointment
  const handleSaveAppointment = async (
    input: CreateAppointmentInput,
    editingId?: string,
    googleEventId?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (editingId) {
        // Update existing
        const res = await updateGoogleCalendarAppointment(editingId, googleEventId, input);
        if (res.success && res.appointment) {
          setAppointments((prev) =>
            prev.map((a) => (a.id === editingId ? res.appointment! : a))
          );
          setStatusFeedback({
            type: 'success',
            message: 'Compromisso atualizado com sucesso na agenda!',
          });
          return true;
        } else {
          setStatusFeedback({
            type: 'error',
            message: res.error || 'Falha ao atualizar agendamento.',
          });
          return false;
        }
      } else {
        // Create new
        const res = await createGoogleCalendarAppointment(input);
        if (res.success && res.appointment) {
          setAppointments((prev) => [res.appointment!, ...prev]);
          setStatusFeedback({
            type: 'success',
            message: res.appointment.meetLink
              ? 'Compromisso agendado com link do Google Meet gerado automaticamente!'
              : 'Compromisso agendado com sucesso na agenda!',
          });
          return true;
        } else {
          setStatusFeedback({
            type: 'error',
            message: res.error || 'Falha ao criar agendamento.',
          });
          return false;
        }
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Erro inesperado ao salvar compromisso.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Appointment (Confirmed in modal)
  const handleConfirmDelete = async () => {
    if (!deletingAppointment) return;

    const targetId = deletingAppointment.id;
    const targetGoogleId = deletingAppointment.googleEventId;

    setIsDeleting(true);
    try {
      const res = await deleteGoogleCalendarAppointment(
        targetId,
        targetGoogleId
      );

      if (res.success) {
        setAppointments((prev) => {
          const updated = prev.filter((a) => {
            if (a.id === targetId) return false;
            if (targetGoogleId && a.googleEventId === targetGoogleId) return false;
            if (targetId && a.googleEventId === targetId) return false;
            return true;
          });
          saveLocalAppointments(updated);
          return updated;
        });

        setStatusFeedback({
          type: 'success',
          message: 'Compromisso excluído da agenda e do Google Calendar.',
        });
        setDeletingAppointment(null);
      } else {
        setStatusFeedback({
          type: 'error',
          message: res.error || 'Erro ao excluir compromisso.',
        });
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Erro inesperado ao excluir compromisso.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Date Navigation
  const handlePrevPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'mes') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'semana') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setMonth(d.getMonth() - 1);
      }
      return d;
    });
  };

  const handleNextPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'mes') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'semana') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (!apt || apt.status === 'cancelled') return false;

      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = apt.title.toLowerCase().includes(query);
        const matchesClient = apt.clientName?.toLowerCase().includes(query);
        const matchesDesc = apt.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesClient && !matchesDesc) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && apt.category !== selectedCategory) {
        return false;
      }

      // Client filter
      if (selectedClientId !== 'all' && apt.clientId !== selectedClientId) {
        return false;
      }

      return true;
    });
  }, [appointments, searchQuery, selectedCategory, selectedClientId]);

  // Next Upcoming Appointment (for hero card)
  const nextAppointment = useMemo(() => {
    const nowIso = new Date().toISOString();
    const sorted = [...appointments]
      .filter((a) => `${a.startDate}T${a.startTime}` >= nowIso.substring(0, 16))
      .sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));
    return sorted[0] || null;
  }, [appointments]);

  // Current Month Statistics
  const monthStats = useMemo(() => {
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth() + 1;
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;

    const thisMonthEvents = appointments.filter((a) => a.startDate.startsWith(curMonthStr));

    const totalHours = thisMonthEvents.reduce((acc, curr) => {
      const [startH, startM] = curr.startTime.split(':').map(Number);
      const [endH, endM] = curr.endTime.split(':').map(Number);
      const durationHours = Math.max(0.5, (endH + endM / 60) - (startH + startM / 60));
      return acc + durationHours;
    }, 0);

    const clientMeetings = thisMonthEvents.filter((a) => a.clientId || a.clientName).length;
    const internalMeetings = thisMonthEvents.filter((a) => a.category === 'sprint_interna').length;

    return {
      totalEvents: thisMonthEvents.length,
      totalHours: Math.round(totalHours * 10) / 10,
      clientMeetings,
      internalMeetings,
    };
  }, [appointments, currentDate]);

  // Calendar Days Grid Calculation for Month View
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: AgencyAppointment[];
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: filteredAppointments.filter((a) => a.startDate === dateStr),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: filteredAppointments.filter((a) => a.startDate === dateStr),
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: filteredAppointments.filter((a) => a.startDate === dateStr),
      });
    }

    return days;
  }, [currentDate, filteredAppointments]);

  // Grouped Appointments for List / Timeline View
  const groupedAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const groups: {
      hoje: AgencyAppointment[];
      amanha: AgencyAppointment[];
      proximos: AgencyAppointment[];
      passados: AgencyAppointment[];
    } = {
      hoje: [],
      amanha: [],
      proximos: [],
      passados: [],
    };

    filteredAppointments
      .sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`))
      .forEach((apt) => {
        if (apt.startDate === today) {
          groups.hoje.push(apt);
        } else if (apt.startDate === tomorrow) {
          groups.amanha.push(apt);
        } else if (apt.startDate > tomorrow) {
          groups.proximos.push(apt);
        } else {
          groups.passados.push(apt);
        }
      });

    return groups;
  }, [filteredAppointments]);

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium border shadow-xs animate-in fade-in duration-200 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : statusFeedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : statusFeedback.type === 'error' ? (
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CalendarClock size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Contract & Google Calendar Connection Hub */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and breadcrumbs */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              <span>Início</span>
              <span>/</span>
              <span className="text-[#fab518] font-bold">Agenda Corporativa</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white tracking-tight flex items-center gap-2.5">
              Agenda & Google Calendar
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#fab518]/15 text-[#142142] dark:text-[#fab518] border border-[#fab518]/30 font-bold">
                Workspace 2026
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sincronize reuniões, briefings de clientes e videoconferências diretamente com o seu Google Calendar oficial.
            </p>
          </div>

          {/* Action buttons & Google Connection Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isGoogleConnectedState ? (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 pr-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                {googleUser?.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google User'}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] font-bold text-[#142142] dark:text-white line-clamp-1">
                      {googleUser?.displayName || 'Google Calendar'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                    {lastSyncTime ? `Sinc.: ${lastSyncTime}` : 'Conectado'}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSyncWithGoogle(true)}
                    disabled={isSyncing}
                    title="Sincronizar agora com Google Calendar"
                    className="p-1.5 text-slate-500 hover:text-[#142142] dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#fab518]' : ''} />
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    title="Desconectar do Google Calendar"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Official Styled Sign in with Google Button */
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-800 text-xs font-bold text-[#142142] dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isConnectingGoogle ? 'Conectando...' : 'Conectar com Google Calendar'}</span>
              </button>
            )}

            {/* Open Google Calendar in new tab */}
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Google Calendar</span>
            </a>

            {/* Schedule New Appointment Button */}
            <button
              type="button"
              onClick={() => {
                setEditingAppointment(null);
                setAppointmentInitialDate(undefined);
                setIsAppointmentModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Reuniões no Mês
            </span>
            <div className="text-xl font-black text-[#142142] dark:text-white font-mono tabular-nums">
              {monthStats.totalEvents}
            </div>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
              {MONTH_NAMES[currentDate.getMonth()]} de {currentDate.getFullYear()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Tempo em Reuniões
            </span>
            <div className="text-xl font-black text-[#142142] dark:text-white font-mono tabular-nums">
              {monthStats.totalHours}h
            </div>
            <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Dedicação estimada
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Reuniões com Clientes
            </span>
            <div className="text-xl font-black text-[#142142] dark:text-white font-mono tabular-nums">
              {monthStats.clientMeetings}
            </div>
            <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
              Briefing & Alinhamentos
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Status da Integração
            </span>
            <div className="text-base font-bold text-[#142142] dark:text-white flex items-center gap-1.5 mt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isGoogleConnectedState ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span>{isGoogleConnectedState ? 'Google Workspace' : 'Modo Local'}</span>
            </div>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
              {isGoogleConnectedState ? 'API v3 Sincronizada' : 'Conexão opcional'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls, Views, and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Views and Calendar Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Navigation Controls Bar */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPeriod}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Período anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-bold text-[#142142] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={handleNextPeriod}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Próximo período"
              >
                <ChevronRight size={16} />
              </button>

              <span className="text-base font-bold text-[#142142] dark:text-white ml-2">
                {MONTH_NAMES[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('mes')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'mes'
                    ? 'bg-white dark:bg-[#0f172a] text-[#142142] dark:text-[#fab518] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
                }`}
              >
                Mês
              </button>

              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'lista'
                    ? 'bg-white dark:bg-[#0f172a] text-[#142142] dark:text-[#fab518] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
                }`}
              >
                Linha do Tempo
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar compromisso, cliente ou pauta..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
            >
              <option value="all">Todas as Categorias</option>
              {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>

            {/* Client Filter */}
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* VIEW: MONTH GRID */}
          {viewMode === 'mes' && (
            <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                {WEEK_DAYS.map((wd, index) => (
                  <div
                    key={wd}
                    className={`py-2.5 text-[11px] font-bold ${
                      index === 0 || index === 6
                        ? 'text-slate-400 dark:text-slate-500'
                        : 'text-[#142142] dark:text-slate-300'
                    }`}
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                {calendarDays.map((cell, idx) => (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => {
                      setEditingAppointment(null);
                      setAppointmentInitialDate(cell.dateStr);
                      setIsAppointmentModalOpen(true);
                    }}
                    className={`min-h-[96px] sm:min-h-[115px] p-1.5 sm:p-2 transition-colors relative flex flex-col justify-between group cursor-pointer ${
                      cell.isCurrentMonth
                        ? 'bg-white dark:bg-[#0f172a] hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                        : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-[#fab518] text-[#142142] shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-700 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Quick add plus button on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAppointment(null);
                          setAppointmentInitialDate(cell.dateStr);
                          setIsAppointmentModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#fab518] p-1 transition-opacity"
                        title="Agendar neste dia"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Day events chips */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {cell.events.slice(0, 3).map((event) => {
                        const cat = CATEGORY_MAP[event.category] || CATEGORY_MAP.outro;
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAppointment(event);
                              setIsAppointmentModalOpen(true);
                            }}
                            className={`group/chip px-1.5 py-0.5 rounded-md text-[10.5px] font-medium flex items-center justify-between gap-1 border border-black/5 dark:border-white/5 transition-transform hover:scale-[1.01] ${cat.bg} ${cat.text}`}
                            title={`${event.startTime} - ${event.title}`}
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current"></span>
                              <span className="font-mono text-[9.5px] opacity-80 shrink-0">{event.startTime}</span>
                              <span className="truncate">{event.title}</span>
                            </div>

                            {/* Delete appointment trash icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingAppointment(event);
                              }}
                              className="opacity-0 group-hover/chip:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-opacity shrink-0 cursor-pointer"
                              title="Excluir agendamento"
                              aria-label={`Excluir compromisso ${event.title}`}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        );
                      })}

                      {cell.events.length > 3 && (
                        <div className="text-[10px] font-bold text-slate-400 px-1">
                          +{cell.events.length - 3} mais
                        </div>
                      )}
                    </div>

                    {/* Bottom indicator for today */}
                    {cell.isToday && (
                      <div className="text-[9px] text-[#fab518] font-bold tracking-tight uppercase">
                        Hoje
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TIMELINE / LIST VIEW */}
          {viewMode === 'lista' && (
            <div className="space-y-4">
              {/* Group: Hoje */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fab518]"></span>
                    Compromissos de Hoje ({groupedAppointments.hoje.length})
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                </div>

                {groupedAppointments.hoje.length > 0 ? (
                  <div className="space-y-2.5">
                    {groupedAppointments.hoje.map((apt) => renderAppointmentCard(apt))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Nenhum compromisso agendado para hoje. Aproveite para focar na produção de demandas!
                  </div>
                )}
              </div>

              {/* Group: Amanhã */}
              {groupedAppointments.amanha.length > 0 && (
                <div className="space-y-2 pt-3">
                  <h3 className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Amanhã ({groupedAppointments.amanha.length})
                  </h3>
                  <div className="space-y-2.5">
                    {groupedAppointments.amanha.map((apt) => renderAppointmentCard(apt))}
                  </div>
                </div>
              )}

              {/* Group: Próximos Dias */}
              {groupedAppointments.proximos.length > 0 && (
                <div className="space-y-2 pt-3">
                  <h3 className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    Próximos Compromissos ({groupedAppointments.proximos.length})
                  </h3>
                  <div className="space-y-2.5">
                    {groupedAppointments.proximos.map((apt) => renderAppointmentCard(apt))}
                  </div>
                </div>
              )}

              {/* Group: Concluídos / Passados */}
              {groupedAppointments.passados.length > 0 && (
                <details className="pt-4 group">
                  <summary className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer list-none flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span>Compromissos Anteriores ({groupedAppointments.passados.length})</span>
                    <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="space-y-2 pt-2 opacity-75">
                    {groupedAppointments.passados.map((apt) => renderAppointmentCard(apt))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Sidebar Hub & Quick Details (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Hero Widget: Próxima Reunião */}
          {nextAppointment ? (
            <div className="p-5 rounded-[24px] bg-gradient-to-br from-[#142142] to-[#1c2e5c] text-white shadow-lg space-y-4 relative overflow-hidden border border-slate-700/50">
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#fab518]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#fab518] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#fab518] animate-ping"></span>
                  Próxima Reunião
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                  {nextAppointment.startDate.split('-').reverse().join('/')}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white tracking-tight line-clamp-1">
                  {nextAppointment.title}
                </h4>
                {nextAppointment.clientName && (
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                    <Building2 size={13} className="text-[#fab518]" />
                    <span>{nextAppointment.clientName}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-1">
                  <Clock size={13} className="text-[#fab518]" />
                  <span>{nextAppointment.startTime} - {nextAppointment.endTime}</span>
                </div>
              </div>

              {/* Direct Meet / Join button */}
              {nextAppointment.meetLink ? (
                <a
                  href={nextAppointment.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video size={15} />
                  <span>Entrar no Google Meet</span>
                </a>
              ) : (
                <div className="text-[11px] text-slate-300 bg-white/10 p-2 rounded-xl text-center">
                  Reunião Presencial: {nextAppointment.location || 'Help Agência'}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-[24px] bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fab518]/15 text-[#142142] dark:text-[#fab518] flex items-center justify-center mx-auto">
                <CalendarCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#142142] dark:text-white">
                  Nenhuma reunião agendada
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Agende alinhamentos de tráfego, design e apresentações com seus clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAppointment(null);
                  setIsAppointmentModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#142142] dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                + Agendar agora
              </button>
            </div>
          )}

          {/* Categories Legend Box */}
          <div className="p-5 rounded-[24px] bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#142142] dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Categorias da Agência</span>
              <span className="text-[10px] text-slate-400 font-mono">Cores</span>
            </h4>

            <div className="space-y-2">
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                <div
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === key
                      ? 'bg-[#fab518]/15 font-bold text-[#142142] dark:text-white border border-[#fab518]/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`}></span>
                    <span>{cat.label}</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-400">
                    {appointments.filter((a) => a.category === key).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Google Workspace Info Box */}
          <div className="p-5 rounded-[24px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#142142] dark:text-white">
                  Sincronização Bidirecional
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compatível com aplicativo Google Calendar no celular e web.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Todos os agendamentos criados com a opção <strong>Google Meet</strong> ativada geram links permanentes para você e seus clientes acessarem a videoconferência.
            </p>
          </div>
        </div>
      </div>

      {/* Appointment Create/Edit Modal */}
      <AgendaAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={(apt) => setDeletingAppointment(apt)}
        editingAppointment={editingAppointment}
        clients={clients}
        isGoogleConnected={isGoogleConnectedState}
        initialDate={appointmentInitialDate}
      />

      {/* Delete Confirmation Modal (Workspace skill mandatory requirement) */}
      <AgendaDeleteConfirmModal
        isOpen={Boolean(deletingAppointment)}
        appointment={deletingAppointment}
        onClose={() => setDeletingAppointment(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );

  // Helper renderer for each row in List / Timeline view
  function renderAppointmentCard(apt: AgencyAppointment) {
    const cat = CATEGORY_MAP[apt.category] || CATEGORY_MAP.outro;

    return (
      <div
        key={apt.id}
        className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#fab518]/50 dark:hover:border-[#fab518]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
      >
        <div className="flex items-start gap-3.5">
          {/* Time Badge */}
          <div className="text-center shrink-0 min-w-[70px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {apt.startDate.split('-').slice(1).reverse().join('/')}
            </span>
            <span className="text-xs font-bold text-[#142142] dark:text-white font-mono tabular-nums block">
              {apt.startTime}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {apt.endTime}
            </span>
          </div>

          {/* Main Info */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cat.bg} ${cat.text}`}>
                {cat.label}
              </span>

              {apt.clientName && (
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building2 size={12} className="text-[#fab518]" />
                  {apt.clientName}
                </span>
              )}

              {apt.syncedWithGoogle && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold" title="Sincronizado no Google Calendar">
                  <CheckCircle2 size={11} />
                  Google Calendar
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-[#142142] dark:text-white">
              {apt.title}
            </h4>

            {apt.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl">
                {apt.description}
              </p>
            )}

            {/* Attendees and location details */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              {apt.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  {apt.location}
                </span>
              )}

              {apt.attendees && apt.attendees.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-slate-400" />
                  {apt.attendees.length} participante(s)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {apt.meetLink && (
            <a
              href={apt.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Video size={13} />
              <span>Google Meet</span>
            </a>
          )}

          {apt.htmlLink && (
            <a
              href={apt.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Abrir no Google Calendar"
            >
              <ExternalLink size={15} />
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingAppointment(apt);
              setIsAppointmentModalOpen(true);
            }}
            className="p-2 text-slate-400 hover:text-[#142142] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Editar agendamento"
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            onClick={() => setDeletingAppointment(apt)}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Excluir agendamento"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  }
};
