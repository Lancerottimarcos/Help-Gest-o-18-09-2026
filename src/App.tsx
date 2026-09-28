import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, EyeOff } from 'lucide-react';
import { PageId, DemandItem, Client, KanbanColumnId, ClientActivity, Service, TeamMember, KanbanColumn, BudgetProposal, Invoice, UserProfile, UserRole } from './types';
import { initialDemands, initialClients, initialRecentActivities, initialServices, initialTeamMembers, initialProposals, initialInvoices, currentUser, kanbanColumnsData } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AccessDeniedView } from './components/AccessDeniedView';
import { canAccessPage, getEffectivePermissions, MemberPermissions } from './utils/permissionUtils';
import { InicioView } from './views/InicioView';
import { DemandasView } from './views/DemandasView';
import { ClientesView } from './views/ClientesView';
import { ServicosView } from './views/ServicosView';
import { FinanceiroView, normalizeInvoice } from './views/FinanceiroView';
import { OrcamentosView } from './views/OrcamentosView';
import { EquipeView } from './views/EquipeView';
import { ConfiguracoesView } from './views/ConfiguracoesView';
import { PortalClienteView } from './views/PortalClienteView';
import { CalendarioView } from './views/CalendarioView';
import { NewDemandModal } from './components/NewDemandModal';
import { WhatsAppNotificationModal } from './components/WhatsAppNotificationModal';
import { ClientApprovalPortalModal } from './components/ClientApprovalPortalModal';
import { LoginPage } from './components/LoginPage';
import { ThemeProvider } from './context/ThemeContext';
import { TwoFactorProvider } from './context/TwoFactorContext';
import { getNotificationConfig } from './utils/notificationSettings';
import { BackupEnvelope } from './utils/backupManager';
import { BrowserNotificationToast } from './components/BrowserNotificationToast';
import { PublicClientApprovalView } from './components/PublicClientApprovalView';
import { PublicBudgetProposalView } from './components/PublicBudgetProposalView';
import { 
  recordSessionActivity, 
  checkSessionInactivityTimeout, 
  addSecurityLog,
  isOwnerOrMarcos,
  updateMasterPassword 
} from './utils/securityProtocols';
import {
  notifyDemandApproved,
  notifyDemandRejected,
  notifyDemandChangeRequested,
} from './utils/browserNotifications';
import { supabaseService } from './services/supabaseService';
import { syncSupabaseCredentialsWithServer } from './lib/supabaseClient';
import { serverDbService } from './services/serverDbService';
import { findRegisteredClient } from './components/DemandsStoriesSection';
import { extractPublicProposalId, extractPublicDemandId } from './utils/urlHelpers';

export interface LayoutProps {
  children?: React.ReactNode;
  onLogout?: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const [currentPage, setCurrentPage] = useState<PageId>('inicio');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isNewDemandModalOpen, setIsNewDemandModalOpen] = useState(false);
  const [newDemandInitialData, setNewDemandInitialData] = useState<{
    title?: string;
    client?: string;
    dueDate?: string;
    description?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Main state data with local persistence for production readiness
  const [demands, setDemands] = useState<DemandItem[]>(() => {
    try {
      const saved = localStorage.getItem('agency_demands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialDemands;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('agency_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(c => c.id === 'client-piloto-3405' ? { ...c, monthlyFee: 0 } : c);
        }
      }
    } catch {}
    return initialClients.map(c => c.id === 'client-piloto-3405' ? { ...c, monthlyFee: 0 } : c);
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem('agency_services');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialServices;
  });

  const [proposals, setProposals] = useState<BudgetProposal[]>(() => {
    try {
      const saved = localStorage.getItem('agency_proposals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialProposals;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('agency_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeInvoice);
      }
    } catch {}
    return initialInvoices.map(normalizeInvoice);
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('agency_team_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialTeamMembers;
  });

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('help_agency_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) {
          const isMarcos =
            (parsed.name.toLowerCase().includes('marcos') && parsed.name.toLowerCase().includes('lancerotti')) ||
            parsed.email?.toLowerCase() === 'lancerottirmarcos@gmail.com' ||
            parsed.username === 'lancerotti';
          return {
            id: parsed.id || (isMarcos ? 'usr-1' : `usr-${parsed.username || Date.now()}`),
            name: parsed.name,
            email: parsed.email || (isMarcos ? 'lancerottirmarcos@gmail.com' : `${parsed.username || 'usuario'}@ideiasdigitais.com.br`),
            role: (parsed.role as UserRole) || (isMarcos ? 'proprietario' : 'colaborador'),
            roleLabel: parsed.roleLabel || (isMarcos ? 'Proprietário da Agência' : 'Colaborador'),
            avatarUrl: parsed.avatarUrl || currentUser.avatarUrl,
          };
        }
      }
    } catch {}
    return currentUser;
  });

  // Modo de simulação para testar visão dos colaboradores
  const [simulatedMember, setSimulatedMember] = useState<TeamMember | null>(null);

  const effectiveUser: UserProfile = useMemo(() => {
    if (simulatedMember) {
      return {
        id: simulatedMember.id,
        name: simulatedMember.name,
        email: simulatedMember.email || `${simulatedMember.username || 'colaborador'}@ideiasdigitais.com.br`,
        role: 'colaborador' as UserRole,
        roleLabel: simulatedMember.role || 'Colaborador',
        avatarUrl: simulatedMember.avatar,
        permissions: getEffectivePermissions(simulatedMember),
      };
    }
    return currentUserProfile;
  }, [simulatedMember, currentUserProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('agency_team_members', JSON.stringify(teamMembers));
    } catch {}
  }, [teamMembers]);

  // Sincroniza continuamente a foto de perfil (avatar) e dados do usuário ativo com a Equipe
  useEffect(() => {
    if (!teamMembers || teamMembers.length === 0) return;
    const isOwner =
      currentUserProfile?.role === 'proprietario' ||
      (currentUserProfile as any)?.isMaster ||
      isOwnerOrMarcos(currentUserProfile);

    const matchedMember = teamMembers.find((m) => {
      if (isOwner && isOwnerOrMarcos(m)) return true;
      if (currentUserProfile.id && (m.id === currentUserProfile.id || m.id === `tm-${currentUserProfile.id}`)) return true;
      if (currentUserProfile.email && m.email?.toLowerCase() === currentUserProfile.email.toLowerCase()) return true;
      if ((currentUserProfile as any).username && m.username?.toLowerCase() === (currentUserProfile as any).username.toLowerCase()) return true;
      return false;
    });

    if (matchedMember && matchedMember.avatar) {
      if (
        currentUserProfile.avatarUrl !== matchedMember.avatar ||
        currentUserProfile.name !== matchedMember.name
      ) {
        setCurrentUserProfile((prev) => ({
          ...prev,
          name: matchedMember.name || prev.name,
          email: matchedMember.email || prev.email,
          avatarUrl: matchedMember.avatar,
        }));

        try {
          const savedAuth = localStorage.getItem('help_agency_user');
          if (savedAuth) {
            const parsed = JSON.parse(savedAuth);
            localStorage.setItem('help_agency_user', JSON.stringify({
              ...parsed,
              name: matchedMember.name || parsed.name,
              email: matchedMember.email || parsed.email,
              avatarUrl: matchedMember.avatar,
            }));
          }
        } catch {}
      }
    }
  }, [teamMembers, currentUserProfile.id, currentUserProfile.email, currentUserProfile.role, currentUserProfile.name, currentUserProfile.avatarUrl]);
  const [activities, setActivities] = useState<ClientActivity[]>(initialRecentActivities);
  const [selectedClientForKanban, setSelectedClientForKanban] = useState<string>('todos');
  const [selectedDemandIdForKanban, setSelectedDemandIdForKanban] = useState<string | null>(null);

  const isServerDbLoadedRef = useRef(false);

  // Sincronização robusta contínua com o Supabase (PostgreSQL Nuvem Principal)
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(true);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const handleSyncWithSupabase = useCallback(async (isSilent = false) => {
    if (!supabaseService.isConfigured()) {
      serverDbService.recordSupabaseSyncError({
        operation: 'SUPABASE_SYNC_CHECK',
        error: 'Sincronização com Supabase pausada: credenciais não configuradas ou ausentes nesta sessão (guia anônima sem credenciais no localStorage)',
        severity: 'WARNING',
      });
      return;
    }
    if (!isSilent) setSupabaseSyncStatus('syncing');

    try {
      const [
        remoteDemands, 
        remoteClients, 
        remoteServices, 
        remoteProposals, 
        remoteInvoices,
        remoteTeamMembers,
        remoteColumns
      ] = await Promise.all([
        supabaseService.fetchDemands(),
        supabaseService.fetchClients(),
        supabaseService.fetchServices(),
        supabaseService.fetchProposals(),
        supabaseService.fetchInvoices(),
        supabaseService.fetchTeamMembers(),
        supabaseService.fetchKanbanColumns(),
      ]);

      // Se o Supabase tiver clientes cadastrados na nuvem, atualiza imediatamente a visualização
      if (remoteClients && Array.isArray(remoteClients) && remoteClients.length > 0) {
        const sanitizedClients = remoteClients.map(c => c.id === 'client-piloto-3405' ? { ...c, monthlyFee: 0 } : c);
        setClients(sanitizedClients);
        try {
          localStorage.setItem('agency_clients', JSON.stringify(sanitizedClients));
        } catch {}
        serverDbService.saveDatabase({ clients: sanitizedClients });
      }

      // Se o Supabase tiver demandas gravadas
      if (remoteDemands && Array.isArray(remoteDemands) && remoteDemands.length > 0) {
        setDemands((prevLocal) => {
          const remoteMap = new Map(remoteDemands.map((d) => [d.id, d]));
          const merged = prevLocal.map((loc) => {
            const rem = remoteMap.get(loc.id);
            if (!rem) return loc;
            return {
              ...rem,
              clientId: rem.clientId || loc.clientId,
              client: rem.client || loc.client,
              clientProject: rem.clientProject || loc.clientProject,
            };
          });
          remoteDemands.forEach((rem) => {
            if (!prevLocal.some((loc) => loc.id === rem.id)) {
              merged.push(rem);
            }
          });
          try {
            localStorage.setItem('agency_demands', JSON.stringify(merged));
          } catch {}
          serverDbService.saveDatabase({ demands: merged });
          return merged;
        });
      }

      // Se o Supabase tiver serviços cadastrados
      if (remoteServices && Array.isArray(remoteServices) && remoteServices.length > 0) {
        setServices(remoteServices);
        try {
          localStorage.setItem('agency_services', JSON.stringify(remoteServices));
        } catch {}
      }

      // Se o Supabase tiver propostas orçamentárias
      if (remoteProposals && Array.isArray(remoteProposals) && remoteProposals.length > 0) {
        setProposals(remoteProposals);
        try {
          localStorage.setItem('agency_proposals', JSON.stringify(remoteProposals));
        } catch {}
      }

      // Se o Supabase tiver faturas registradas
      if (remoteInvoices && Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
        setInvoices(remoteInvoices);
        try {
          localStorage.setItem('agency_invoices', JSON.stringify(remoteInvoices));
        } catch {}
      }

      // Se o Supabase tiver membros da equipe (CEO, colaboradores)
      if (remoteTeamMembers && Array.isArray(remoteTeamMembers) && remoteTeamMembers.length > 0) {
        setTeamMembers((prevLocal) => {
          const merged = remoteTeamMembers.map((rm) => {
            const local = prevLocal.find((lm) => lm.id === rm.id);
            const isOwner = isOwnerOrMarcos(rm);
            return {
              ...rm,
              username: rm.username || local?.username || (isOwner ? 'lancerotti' : undefined),
              password: rm.password || local?.password || (isOwner ? '521Spide#*' : '123456'),
            };
          });
          try {
            localStorage.setItem('agency_team_members', JSON.stringify(merged));
          } catch {}
          serverDbService.saveDatabase({ teamMembers: merged });
          return merged;
        });
      }

      // Se o Supabase tiver colunas do kanban personalizadas
      if (remoteColumns && Array.isArray(remoteColumns) && remoteColumns.length > 0) {
        setKanbanColumns(remoteColumns);
        try {
          localStorage.setItem('agency_kanban_columns', JSON.stringify(remoteColumns));
        } catch {}
      }

      setIsSupabaseOnline(true);
      setSupabaseSyncStatus('synced');
    } catch (err: any) {
      serverDbService.recordSupabaseSyncError({
        operation: 'FULL_SYNC_ALL_COLLECTIONS',
        error: err?.message || err,
        details: err,
        severity: 'ERROR',
      });
      console.warn('Erro ao sincronizar com Supabase:', err);
      setSupabaseSyncStatus('error');
    }
  }, []);

  // 1. Carrega dados persistentes do servidor central e do Supabase na montagem inicial
  useEffect(() => {
    let isMounted = true;

    const syncWithServerDb = async (_isSilent = true) => {
      try {
        const remoteData = await serverDbService.fetchDatabase();
        if (!isMounted || !remoteData) return;

        if (remoteData.clients && Array.isArray(remoteData.clients) && remoteData.clients.length > 0) {
          setClients((prev) => {
            if (
              prev.length === remoteData.clients!.length &&
              prev.every((p, idx) => p.id === remoteData.clients![idx]?.id && p.name === remoteData.clients![idx]?.name)
            ) {
              return prev;
            }
            try {
              localStorage.setItem('agency_clients', JSON.stringify(remoteData.clients));
            } catch {}
            return remoteData.clients!;
          });
        }

        if (remoteData.demands && Array.isArray(remoteData.demands) && remoteData.demands.length > 0) {
          setDemands((prev) => {
            if (
              prev.length === remoteData.demands!.length &&
              prev.every((p, idx) => p.id === remoteData.demands![idx]?.id && p.columnId === remoteData.demands![idx]?.columnId)
            ) {
              return prev;
            }
            try {
              localStorage.setItem('agency_demands', JSON.stringify(remoteData.demands));
            } catch {}
            return remoteData.demands!;
          });
        }
      } catch {}
    };

    const initData = async () => {
      // Inicia sincronização direta com a nuvem Supabase
      handleSyncWithSupabase(false);

      // Também busca do servidor de banco central compartilhado
      try {
        const remoteData = await serverDbService.fetchDatabase();
        if (!isMounted) return;

        // Recupera dados gravados no localStorage deste navegador
        let localClients: Client[] = [];
        try {
          const raw = localStorage.getItem('agency_clients');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localClients = parsed;
          }
        } catch {}

        let localDemands: DemandItem[] = [];
        try {
          const raw = localStorage.getItem('agency_demands');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localDemands = parsed;
          }
        } catch {}

        let localServices: Service[] = [];
        try {
          const raw = localStorage.getItem('agency_services');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localServices = parsed;
          }
        } catch {}

        let localProposals: BudgetProposal[] = [];
        try {
          const raw = localStorage.getItem('agency_proposals');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localProposals = parsed;
          }
        } catch {}

        let localInvoices: Invoice[] = [];
        try {
          const raw = localStorage.getItem('agency_invoices');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localInvoices = parsed;
          }
        } catch {}

        let localTeam: TeamMember[] = [];
        try {
          const raw = localStorage.getItem('agency_team_members');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localTeam = parsed;
          }
        } catch {}

        let localColumns: KanbanColumn[] = [];
        try {
          const raw = localStorage.getItem('agency_kanban_columns');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localColumns = parsed;
          }
        } catch {}

        let needsServerPush = false;
        const pushPayload: any = {};

        if (remoteData) {
          // 1. CLIENTES (Mescla e aplica dados reais)
          if (remoteData.clients && Array.isArray(remoteData.clients) && remoteData.clients.length > 0) {
            const remoteMap = new Map(remoteData.clients.map((c) => [c.id, c]));
            const mergedClients = [...remoteData.clients];
            let hasNewLocal = false;

            if (localClients.length > 0) {
              for (const loc of localClients) {
                if (!remoteMap.has(loc.id)) {
                  mergedClients.push(loc);
                  hasNewLocal = true;
                }
              }
            }

            const sanitizedClients = mergedClients.map((c) => (c.id === 'client-piloto-3405' ? { ...c, monthlyFee: 0 } : c));
            setClients(sanitizedClients);
            try {
              localStorage.setItem('agency_clients', JSON.stringify(sanitizedClients));
            } catch {}

            if (hasNewLocal) {
              needsServerPush = true;
              pushPayload.clients = sanitizedClients;
            }
          } else if (localClients.length > 0) {
            setClients(localClients);
            needsServerPush = true;
            pushPayload.clients = localClients;
          }

          // 2. DEMANDAS (Mescla e aplica dados reais)
          if (remoteData.demands && Array.isArray(remoteData.demands) && remoteData.demands.length > 0) {
            const remoteDemandMap = new Map(remoteData.demands.map((d) => [d.id, d]));
            const mergedDemands = [...remoteData.demands];
            let hasNewLocalDemand = false;

            if (localDemands.length > 0) {
              for (const loc of localDemands) {
                if (!remoteDemandMap.has(loc.id)) {
                  mergedDemands.push(loc);
                  hasNewLocalDemand = true;
                }
              }
            }

            setDemands(mergedDemands);
            try {
              localStorage.setItem('agency_demands', JSON.stringify(mergedDemands));
            } catch {}

            if (hasNewLocalDemand) {
              needsServerPush = true;
              pushPayload.demands = mergedDemands;
            }
          } else if (localDemands.length > 0) {
            setDemands(localDemands);
            needsServerPush = true;
            pushPayload.demands = localDemands;
          }

          // 3. EQUIPE (TEAM MEMBERS)
          if (remoteData.teamMembers && Array.isArray(remoteData.teamMembers) && remoteData.teamMembers.length > 0) {
            setTeamMembers((prevLocal) => {
              const merged = remoteData.teamMembers!.map((rm) => {
                const local = prevLocal.find((lm) => lm.id === rm.id);
                const isOwner = isOwnerOrMarcos(rm);
                return {
                  ...rm,
                  username: rm.username || local?.username || (isOwner ? 'lancerotti' : undefined),
                  password: rm.password || local?.password || (isOwner ? '521Spide#*' : '123456'),
                };
              });
              try {
                localStorage.setItem('agency_team_members', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }

          // 4. COLUNAS KANBAN
          if (remoteData.kanbanColumns && Array.isArray(remoteData.kanbanColumns) && remoteData.kanbanColumns.length > 0) {
            setKanbanColumns(remoteData.kanbanColumns);
            try {
              localStorage.setItem('agency_kanban_columns', JSON.stringify(remoteData.kanbanColumns));
            } catch {}
          }

          // 5. ORÇAMENTOS (PROPOSALS)
          if (remoteData.proposals && Array.isArray(remoteData.proposals) && remoteData.proposals.length > 0) {
            setProposals(remoteData.proposals);
            try {
              localStorage.setItem('agency_proposals', JSON.stringify(remoteData.proposals));
            } catch {}
          } else if (localProposals.length > 0) {
            setProposals(localProposals);
            needsServerPush = true;
            pushPayload.proposals = localProposals;
          }

          // 6. SERVIÇOS
          if (remoteData.services && Array.isArray(remoteData.services) && remoteData.services.length > 0) {
            setServices(remoteData.services);
            try {
              localStorage.setItem('agency_services', JSON.stringify(remoteData.services));
            } catch {}
          } else if (localServices.length > 0) {
            setServices(localServices);
            needsServerPush = true;
            pushPayload.services = localServices;
          }

          // 7. FATURAS (INVOICES)
          if (remoteData.invoices && Array.isArray(remoteData.invoices) && remoteData.invoices.length > 0) {
            const normalizedInvoices = remoteData.invoices.map(normalizeInvoice);
            setInvoices(normalizedInvoices);
            try {
              localStorage.setItem('agency_invoices', JSON.stringify(normalizedInvoices));
            } catch {}
          } else if (localInvoices.length > 0) {
            const normalizedInvoices = localInvoices.map(normalizeInvoice);
            setInvoices(normalizedInvoices);
            needsServerPush = true;
            pushPayload.invoices = normalizedInvoices;
          }

          if (needsServerPush && Object.keys(pushPayload).length > 0) {
            serverDbService.saveDatabase(pushPayload, true);
          }
        } else {
          // Servidor ainda sem dados: envia o estado deste navegador para popular a base central
          serverDbService.saveDatabase(
            {
              clients: localClients.length > 0 ? localClients : undefined,
              demands: localDemands.length > 0 ? localDemands : undefined,
              services: localServices.length > 0 ? localServices : undefined,
              proposals: localProposals.length > 0 ? localProposals : undefined,
              invoices: localInvoices.length > 0 ? localInvoices : undefined,
              teamMembers: localTeam.length > 0 ? localTeam : undefined,
              kanbanColumns: localColumns.length > 0 ? localColumns : undefined,
            },
            true
          );
        }
      } catch (err) {
        console.warn('Erro ao inicializar base de dados centralizada:', err);
      }

      if (isMounted) {
        isServerDbLoadedRef.current = true;
      }
    };

    initData();

    // Sincronização periódica a cada 15 segundos para manter abas anônimas e múltiplos dispositivos alinhados
    const pollInterval = setInterval(() => {
      handleSyncWithSupabase(true);
      syncWithServerDb(true);
    }, 15000);

    // Sincroniza imediatamente quando a janela / aba do navegador ganha foco (ao alternar para guia anônima)
    const handleFocus = () => {
      handleSyncWithSupabase(true);
      syncWithServerDb(true);
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [handleSyncWithSupabase]);

  // Automatically save state updates to localStorage and central server
  useEffect(() => {
    if (clients && clients.length > 0) {
      try {
        localStorage.setItem('agency_clients', JSON.stringify(clients));
      } catch {}
      if (isServerDbLoadedRef.current) {
        serverDbService.saveDatabase({ clients });
      }
    }
  }, [clients]);

  useEffect(() => {
    if (demands && demands.length > 0) {
      try {
        localStorage.setItem('agency_demands', JSON.stringify(demands));
      } catch {}
      if (isServerDbLoadedRef.current) {
        serverDbService.saveDatabase({ demands });
      }
    }
  }, [demands]);

  useEffect(() => {
    try {
      localStorage.setItem('agency_services', JSON.stringify(services));
    } catch {}
    if (isServerDbLoadedRef.current) {
      serverDbService.saveDatabase({ services });
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem('agency_proposals', JSON.stringify(proposals));
    } catch {}
    if (isServerDbLoadedRef.current) {
      serverDbService.saveDatabase({ proposals });
    }
  }, [proposals]);

  useEffect(() => {
    try {
      localStorage.setItem('agency_invoices', JSON.stringify(invoices));
    } catch {}
    if (isServerDbLoadedRef.current) {
      serverDbService.saveDatabase({ invoices });
    }
  }, [invoices]);

  const handleAddProposal = (newProposal: BudgetProposal) => {
    setProposals((prev) => {
      const updated = [newProposal, ...prev.filter(p => p.id !== newProposal.id)];
      try {
        localStorage.setItem('agency_proposals', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ proposals: updated }, true);
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.upsertProposal(newProposal);
    }
  };

  const handleUpdateProposalStatus = (id: string, newStatus: 'Enviado' | 'Aprovado' | 'Recusado') => {
    setProposals((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
      const target = updated.find(p => p.id === id);
      try {
        localStorage.setItem('agency_proposals', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ proposals: updated }, true);
      if (target && supabaseService.isConfigured()) {
        supabaseService.upsertProposal(target);
      }
      return updated;
    });
  };

  const handleDeleteProposal = (id: string) => {
    setProposals((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('agency_proposals', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ proposals: updated }, true);
      if (supabaseService.isConfigured()) {
        supabaseService.deleteProposal(id);
      }
      return updated;
    });
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.upsertInvoice(newInvoice);
    }
  };

  const handleToggleInvoiceStatus = (id: string) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === id ? { ...inv, status: (inv.status === 'Pago' ? 'Pendente' : 'Pago') as 'Pago' | 'Pendente' } : inv
      );
      const target = updated.find(i => i.id === id);
      if (target && supabaseService.isConfigured()) {
        supabaseService.upsertInvoice(target);
      }
      return updated;
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (supabaseService.isConfigured()) {
      supabaseService.deleteInvoice(id);
    }
  };

  const handleDeleteMultipleInvoices = (invoiceIds: string[]) => {
    setInvoices((prev) => prev.filter((inv) => !invoiceIds.includes(inv.id)));
    if (supabaseService.isConfigured()) {
      invoiceIds.forEach(id => supabaseService.deleteInvoice(id));
    }
  };

  // Kanban columns state with persistence
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(() => {
    try {
      const saved = localStorage.getItem('agency_kanban_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: KanbanColumn) => ({ ...c, count: 0 }));
        }
      }
    } catch {
      // ignore
    }
    return kanbanColumnsData;
  });

  const handleAddColumn = (newCol: KanbanColumn, insertBeforeConcluded = false) => {
    setKanbanColumns((prev) => {
      let updated: KanbanColumn[];
      if (insertBeforeConcluded) {
        const concludedIdx = prev.findIndex((c) => c.id === 'concluidas');
        if (concludedIdx !== -1) {
          const copy = [...prev];
          copy.splice(concludedIdx, 0, newCol);
          updated = copy;
        } else {
          updated = [...prev, newCol];
        }
      } else {
        updated = [...prev, newCol];
      }
      try {
        localStorage.setItem('agency_kanban_columns', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.upsertKanbanColumn(newCol);
    }
  };

  const handleUpdateColumn = (updatedCol: KanbanColumn) => {
    setKanbanColumns((prev) => {
      const updated = prev.map((c) => (c.id === updatedCol.id ? updatedCol : c));
      try {
        localStorage.setItem('agency_kanban_columns', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.upsertKanbanColumn(updatedCol);
    }
  };

  const handleDeleteColumn = (colId: string) => {
    setKanbanColumns((prev) => {
      const updated = prev.filter((c) => c.id !== colId);
      try {
        localStorage.setItem('agency_kanban_columns', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.deleteKanbanColumn(colId);
    }
    // Move any demands in this deleted column to 'ideias'
    setDemands((prev) =>
      prev.map((d) => (d.columnId === colId ? { ...d, columnId: 'ideias' } : d))
    );
  };

  // Client Approval & WhatsApp Notification Modal States
  const [whatsAppDemand, setWhatsAppDemand] = useState<DemandItem | null>(null);
  const [clientPortalDemand, setClientPortalDemand] = useState<DemandItem | null>(null);

  // Check URL parameters for direct client portal access (e.g. ?portal=aprovacao&demandId=DEM-105)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal');
      const demandIdParam = params.get('demandId');
      if (portalParam === 'aprovacao' && demandIdParam) {
        const found = demands.find(
          (d) => d.id.toLowerCase() === demandIdParam.toLowerCase()
        );
        if (found) {
          setClientPortalDemand(found);
        }
      }
    } catch {
      // Safe fallback if searchParams parsing fails
    }
  }, []);

  // Handler for restoring complete data from JSON backup
  const handleRestoreBackupData = (backup: BackupEnvelope) => {
    if (backup?.data) {
      if (Array.isArray(backup.data.agency_demands)) {
        setDemands(backup.data.agency_demands);
      }
      if (Array.isArray(backup.data.agency_clients)) {
        setClients(backup.data.agency_clients);
      }
      if (Array.isArray(backup.data.agency_services)) {
        setServices(backup.data.agency_services);
      }
      if (Array.isArray(backup.data.agency_proposals)) {
        setProposals(backup.data.agency_proposals);
      }
      if (Array.isArray(backup.data.agency_invoices)) {
        setInvoices(backup.data.agency_invoices);
      }
      if (Array.isArray(backup.data.agency_kanban_columns)) {
        setKanbanColumns(backup.data.agency_kanban_columns);
      }
    }
  };

  useEffect(() => {
    const handleRestoreEvent = (e: any) => {
      if (e.detail?.backup) {
        handleRestoreBackupData(e.detail.backup);
      }
    };
    window.addEventListener('help_agency_backup_restored', handleRestoreEvent);
    return () => window.removeEventListener('help_agency_backup_restored', handleRestoreEvent);
  }, []);

  const handleMoveDemand = (
    demandId: string,
    targetColumn: KanbanColumnId,
    targetDemandId?: string,
    position: 'before' | 'after' = 'after'
  ) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    const isMovingToApproval = targetColumn === 'aprovacao' && demand.columnId !== 'aprovacao';

    const updatedDemand: DemandItem = {
      ...demand,
      columnId: targetColumn,
      ...(isMovingToApproval
        ? {
            approvalStatus: 'pendente',
            approvalSentAt: demand.approvalSentAt || undefined,
            statusLabel: 'Aguardando Cliente',
            clientPortalToken: demand.clientPortalToken || demand.id.toLowerCase(),
            whatsappNotified: demand.whatsappNotified || false,
          }
        : {}),
    };

    // Notificação de WhatsApp ao mover desabilitada temporariamente (implementação futura)
    // if (isMovingToApproval) {
    //   const config = getNotificationConfig();
    //   if (config.autoOpenModalOnMove) {
    //     setWhatsAppDemand(updatedDemand);
    //   }
    // }

    if (demand.columnId !== targetColumn) {
      const columnLabels: Record<KanbanColumnId, string> = {
        ideias: 'Ideias',
        producao: 'Em Produção',
        aprovacao: 'Aprovação',
        agendamento: 'Agendamento',
        concluidas: 'Concluída',
      };
      const label = columnLabels[targetColumn] || targetColumn;
      const isApproved = targetColumn === 'aprovacao' || targetColumn === 'agendamento';
      const newActivity: ClientActivity = {
        id: `act-${Date.now()}`,
        clientName: demand.client,
        demandId: demand.id,
        demandTitle: demand.title,
        projectOrCampaign: demand.clientProject,
        type: targetColumn === 'aprovacao' ? 'client_approval' : 'status_changed',
        description: isMovingToApproval
          ? `Demanda enviada para a etapa de Aprovação.`
          : `Demanda avançou para a etapa de "${label}".`,
        actor: {
          name: currentUser.name,
          avatar: currentUser.avatarUrl,
          role: currentUser.roleLabel,
        },
        timestamp: 'Agora mesmo',
        relativeTime: 'Agora mesmo',
        badge: {
          label: isMovingToApproval ? 'Enviado p/ Aprovação' : `Status: ${label}`,
          bgClass: isApproved ? 'bg-emerald-50' : 'bg-blue-50',
          textClass: isApproved ? 'text-emerald-700' : 'text-blue-700',
          borderClass: isApproved ? 'border-emerald-200' : 'border-blue-200',
        },
      };
      setActivities((prev) => [newActivity, ...prev]);
    }

    setDemands((prev) => {
      // Remove the dragged/moved item
      const withoutItem = prev.filter((d) => d.id !== demandId);

      if (targetDemandId && targetDemandId !== demandId) {
        const targetIndex = withoutItem.findIndex((d) => d.id === targetDemandId);
        if (targetIndex !== -1) {
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          const result = [...withoutItem];
          result.splice(insertIndex, 0, updatedDemand);
          return result;
        }
      }

      // If no targetDemandId, find the last item of targetColumn to append after it
      let lastColIndex = -1;
      for (let i = withoutItem.length - 1; i >= 0; i--) {
        if (withoutItem[i].columnId === targetColumn) {
          lastColIndex = i;
          break;
        }
      }

      if (lastColIndex !== -1) {
        const result = [...withoutItem];
        result.splice(lastColIndex + 1, 0, updatedDemand);
        return result;
      } else {
        return [...withoutItem, updatedDemand];
      }
    });

    // Sincroniza em background com o Supabase PostgreSQL
    supabaseService.upsertDemand(updatedDemand);
  };

  const handleUpdateDemandColumn = (demandId: string, newColumn: KanbanColumnId) => {
    handleMoveDemand(demandId, newColumn);
  };

  const handleAddDemand = (newDemand: DemandItem) => {
    setDemands((prev) => {
      const updated = [newDemand, ...prev];
      try {
        localStorage.setItem('agency_demands', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ demands: updated }, true);
      return updated;
    });

    // Sincroniza em background com o Supabase PostgreSQL
    supabaseService.upsertDemand(newDemand);

    // Notificação de WhatsApp ao criar em aprovação desabilitada temporariamente (recurso futuro)
    // if (newDemand.columnId === 'aprovacao') {
    //   const config = getNotificationConfig();
    //   if (config.autoOpenModalOnMove) {
    //     setWhatsAppDemand(newDemand);
    //   }
    // }

    const newActivity: ClientActivity = {
      id: `act-${Date.now()}`,
      clientName: newDemand.client,
      demandId: newDemand.id,
      demandTitle: newDemand.title,
      projectOrCampaign: newDemand.clientProject,
      type: 'demand_created',
      description: `Nova demanda cadastrada: ${newDemand.title} (${newDemand.type}).`,
      actor: {
        name: currentUser.name,
        avatar: currentUser.avatarUrl,
        role: currentUser.roleLabel,
      },
      timestamp: 'Agora mesmo',
      relativeTime: 'Agora mesmo',
      badge: {
        label: 'Nova Demanda',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200',
      },
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleSaveDemand = (updatedDemand: DemandItem) => {
    const existingDemand = demands.find((d) => d.id === updatedDemand.id);
    const wasJustMovedToApproval = 
      updatedDemand.columnId === 'aprovacao' && 
      (!existingDemand || existingDemand.columnId !== 'aprovacao');

    const matchedClient = clients.find(
      (c) => (updatedDemand.clientId && c.id === updatedDemand.clientId) ||
             c.name.trim().toLowerCase() === (updatedDemand.client || '').trim().toLowerCase() ||
             (c.companyName && c.companyName.trim().toLowerCase() === (updatedDemand.client || '').trim().toLowerCase())
    );

    const resolvedClientName = matchedClient ? matchedClient.name : updatedDemand.client;

    const finalDemand: DemandItem = {
      ...updatedDemand,
      clientId: matchedClient?.id || updatedDemand.clientId,
      client: resolvedClientName,
      clientProject: resolvedClientName,
      ...(wasJustMovedToApproval
        ? {
            approvalStatus: 'pendente',
            approvalSentAt: updatedDemand.approvalSentAt || undefined,
            statusLabel: 'Aguardando Cliente',
            clientPortalToken: updatedDemand.clientPortalToken || updatedDemand.id.toLowerCase(),
            whatsappNotified: updatedDemand.whatsappNotified || false,
          }
        : {}),
    };

    setDemands((prev) => {
      const updated = prev.map((item) => (item.id === finalDemand.id ? finalDemand : item));
      try {
        localStorage.setItem('agency_demands', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ demands: updated }, true);
      return updated;
    });

    // Atualiza contagem de demandas ativas nos clientes
    setClients((prevClients) => {
      const updatedClients = prevClients.map((c) => {
        const count = demands.filter(d => {
          const isThisDemand = d.id === finalDemand.id;
          const target = isThisDemand ? finalDemand : d;
          return (target.clientId === c.id || target.client.toLowerCase() === c.name.toLowerCase()) && target.columnId !== 'concluidas';
        }).length;
        return { ...c, activeDemandsCount: count };
      });
      try {
        localStorage.setItem('agency_clients', JSON.stringify(updatedClients));
      } catch {}
      serverDbService.saveDatabase({ clients: updatedClients });
      return updatedClients;
    });

    // Sincroniza em background com o Supabase PostgreSQL
    supabaseService.upsertDemand(finalDemand);

    // Notificação de WhatsApp ao mover/salvar para aprovação desabilitada temporariamente (recurso futuro)
    // if (wasJustMovedToApproval) {
    //   const config = getNotificationConfig();
    //   if (config.autoOpenModalOnMove) {
    //     setWhatsAppDemand(finalDemand);
    //   }
    // }

    const newActivity: ClientActivity = {
      id: `act-${Date.now()}`,
      clientName: finalDemand.client,
      demandId: finalDemand.id,
      demandTitle: finalDemand.title,
      projectOrCampaign: finalDemand.clientProject,
      type: wasJustMovedToApproval ? 'client_approval' : 'status_changed',
      description: wasJustMovedToApproval
        ? `Demanda enviada para a etapa de Aprovação.`
        : `Demanda "${finalDemand.title}" atualizada com sucesso.`,
      actor: {
        name: currentUser.name,
        avatar: currentUser.avatarUrl,
        role: currentUser.roleLabel,
      },
      timestamp: 'Agora mesmo',
      relativeTime: 'Agora mesmo',
      badge: {
        label: wasJustMovedToApproval ? 'Aprovação' : 'Atualizada',
        bgClass: wasJustMovedToApproval ? 'bg-amber-50' : 'bg-blue-50',
        textClass: wasJustMovedToApproval ? 'text-amber-700' : 'text-blue-700',
        borderClass: wasJustMovedToApproval ? 'border-amber-200' : 'border-blue-200',
      },
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleClientApprovalAction = (
    demandId: string, 
    action: 'aprovado' | 'reprovado' | 'alteracao_solicitada', 
    feedback?: string
  ) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    if (action === 'aprovado') {
      const approvedDemand: DemandItem = {
        ...demand,
        approvalStatus: 'aprovado',
        approvalAnsweredAt: 'Agora mesmo',
        columnId: 'agendamento',
        statusLabel: 'Aprovado pelo Cliente',
      };

      setDemands((prev) =>
        prev.map((item) => (item.id === demandId ? approvedDemand : item))
      );
      supabaseService.upsertDemand(approvedDemand);

      const newActivity: ClientActivity = {
        id: `act-${Date.now()}`,
        clientName: demand.client,
        demandId: demand.id,
        demandTitle: demand.title,
        projectOrCampaign: demand.clientProject,
        type: 'client_approval',
        description: `O cliente APROVOU o material da demanda "${demand.title}" via Portal. Movido para Agendamento.`,
        actor: {
          name: demand.client,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'Cliente',
        },
        timestamp: 'Agora mesmo',
        relativeTime: 'Agora mesmo',
        badge: {
          label: 'Aprovado pelo Cliente',
          bgClass: 'bg-emerald-50',
          textClass: 'text-emerald-700',
          borderClass: 'border-emerald-200',
        },
      };
      setActivities((prev) => [newActivity, ...prev]);

      // Trigger Web Notifications API for Agency Manager
      notifyDemandApproved({
        id: demand.id,
        title: demand.title,
        client: demand.client,
        clientProject: demand.clientProject,
      });
    } else if (action === 'reprovado') {
      const rejectedDemand: DemandItem = {
        ...demand,
        approvalStatus: 'reprovado',
        approvalAnsweredAt: 'Agora mesmo',
        columnId: 'producao',
        statusLabel: 'Reprovado pelo Cliente',
        approvalFeedback: feedback,
      };

      setDemands((prev) =>
        prev.map((item) => (item.id === demandId ? rejectedDemand : item))
      );
      supabaseService.upsertDemand(rejectedDemand);

      const newActivity: ClientActivity = {
        id: `act-${Date.now()}`,
        clientName: demand.client,
        demandId: demand.id,
        demandTitle: demand.title,
        projectOrCampaign: demand.clientProject,
        type: 'status_changed',
        description: `Cliente reprovou a proposta da demanda "${demand.title}". Retornada para Produção.`,
        actor: {
          name: demand.client,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'Cliente',
        },
        timestamp: 'Agora mesmo',
        relativeTime: 'Agora mesmo',
        badge: {
          label: 'Reprovado',
          bgClass: 'bg-rose-50',
          textClass: 'text-rose-700',
          borderClass: 'border-rose-200',
        },
      };
      setActivities((prev) => [newActivity, ...prev]);

      // Trigger Web Notifications API for Agency Manager
      notifyDemandRejected({
        id: demand.id,
        title: demand.title,
        client: demand.client,
        clientProject: demand.clientProject,
        reason: feedback,
      });
    } else if (action === 'alteracao_solicitada') {
      const changeDemand: DemandItem = {
        ...demand,
        approvalStatus: 'alteracao_solicitada',
        approvalFeedback: feedback,
        approvalAnsweredAt: 'Agora mesmo',
        columnId: 'producao',
        statusLabel: 'Ajuste Solicitado',
        commentsCount: (demand.commentsCount || 0) + 1,
      };

      setDemands((prev) =>
        prev.map((item) => (item.id === demandId ? changeDemand : item))
      );
      supabaseService.upsertDemand(changeDemand);

      const newActivity: ClientActivity = {
        id: `act-${Date.now()}`,
        clientName: demand.client,
        demandId: demand.id,
        demandTitle: demand.title,
        projectOrCampaign: demand.clientProject,
        type: 'comment_feedback',
        description: `Cliente solicitou alteração na demanda "${demand.title}": "${feedback}"`,
        actor: {
          name: demand.client,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'Cliente',
        },
        timestamp: 'Agora mesmo',
        relativeTime: 'Agora mesmo',
        badge: {
          label: 'Ajuste Solicitado',
          bgClass: 'bg-amber-50',
          textClass: 'text-amber-700',
          borderClass: 'border-amber-200',
        },
      };
      setActivities((prev) => [newActivity, ...prev]);

      // Trigger Web Notifications API for Agency Manager
      notifyDemandChangeRequested({
        id: demand.id,
        title: demand.title,
        client: demand.client,
        clientProject: demand.clientProject,
        feedback,
      });
    }
  };

  const handleDeleteDemand = (demandId: string) => {
    setDemands((prev) => {
      const updated = prev.filter((item) => item.id !== demandId);
      try {
        localStorage.setItem('agency_demands', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ demands: updated }, true);
      return updated;
    });
    supabaseService.deleteDemand(demandId);
  };

  const handleAddClient = (newClient: Client) => {
    setClients((prev) => {
      const updated = [newClient, ...prev];
      try {
        localStorage.setItem('agency_clients', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ clients: updated }, true);
      return updated;
    });
    supabaseService.upsertClient(newClient);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const prevClient = clients.find((c) => c.id === updatedClient.id);
    const oldName = prevClient?.name?.trim();
    const oldCompanyName = prevClient?.companyName?.trim();
    const newDisplayName = (updatedClient.name || updatedClient.companyName || '').trim();

    // 1. Update clients list
    const newClients = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    setClients(newClients);
    try {
      localStorage.setItem('agency_clients', JSON.stringify(newClients));
    } catch {}
    if (isServerDbLoadedRef.current) {
      serverDbService.saveDatabase({ clients: newClients });
    }

    // 2. Cascade update all associated demands
    setDemands((prevDemands) => {
      let changed = false;
      const updatedDemands = prevDemands.map((demand) => {
        const matchesById = demand.clientId && demand.clientId === updatedClient.id;
        const demandClientTrimmed = (demand.client || '').trim().toLowerCase();
        const matchesByOldName = Boolean(oldName && demandClientTrimmed === oldName.toLowerCase());
        const matchesByOldCompany = Boolean(oldCompanyName && demandClientTrimmed === oldCompanyName.toLowerCase());

        const clientCandidates = prevClient ? [prevClient, updatedClient] : [updatedClient];
        const matchesByFuzzy = Boolean(findRegisteredClient(demand.client, clientCandidates));

        if (matchesById || matchesByOldName || matchesByOldCompany || matchesByFuzzy) {
          changed = true;
          return {
            ...demand,
            clientId: updatedClient.id,
            client: newDisplayName,
            clientProject: demand.clientProject && (
              (oldName && demand.clientProject.toLowerCase().includes(oldName.toLowerCase())) ||
              (oldCompanyName && demand.clientProject.toLowerCase().includes(oldCompanyName.toLowerCase())) ||
              (prevClient?.name && demand.clientProject.toLowerCase().includes(prevClient.name.toLowerCase()))
            )
              ? newDisplayName
              : demand.clientProject,
          };
        }
        return demand;
      });

      if (changed) {
        try {
          localStorage.setItem('agency_demands', JSON.stringify(updatedDemands));
        } catch {}
        if (isServerDbLoadedRef.current) {
          serverDbService.saveDatabase({ demands: updatedDemands });
        }
      }
      return changed ? updatedDemands : prevDemands;
    });

    // 3. Cascade update proposals & invoices
    setProposals((prevProposals) => {
      let changed = false;
      const updated = prevProposals.map((prop) => {
        const propClientTrimmed = (prop.clientName || '').trim().toLowerCase();
        if ((oldName && propClientTrimmed === oldName.toLowerCase()) || (oldCompanyName && propClientTrimmed === oldCompanyName.toLowerCase())) {
          changed = true;
          return { ...prop, clientName: newDisplayName };
        }
        return prop;
      });
      return changed ? updated : prevProposals;
    });

    setInvoices((prevInvoices) => {
      let changed = false;
      const updated = prevInvoices.map((inv) => {
        const invClientTrimmed = (inv.client || '').trim().toLowerCase();
        if ((oldName && invClientTrimmed === oldName.toLowerCase()) || (oldCompanyName && invClientTrimmed === oldCompanyName.toLowerCase())) {
          changed = true;
          return { ...inv, client: newDisplayName };
        }
        return inv;
      });
      return changed ? updated : prevInvoices;
    });

    supabaseService.upsertClient(updatedClient);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== clientId);
      try {
        localStorage.setItem('agency_clients', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ clients: updated }, true);
      return updated;
    });
    supabaseService.deleteClient(clientId);
  };

  const handleDeleteMultipleClients = (clientIds: string[]) => {
    setClients((prev) => {
      const updated = prev.filter((c) => !clientIds.includes(c.id));
      try {
        localStorage.setItem('agency_clients', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ clients: updated }, true);
      return updated;
    });
    clientIds.forEach(id => supabaseService.deleteClient(id));
  };

  const handleAddService = (newService: Service) => {
    setServices((prev) => [newService, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.upsertService(newService);
    }
  };

  const handleUpdateService = (updatedService: Service) => {
    setServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s))
    );
    if (supabaseService.isConfigured()) {
      supabaseService.upsertService(updatedService);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    if (supabaseService.isConfigured()) {
      supabaseService.deleteService(serviceId);
    }
  };

  const handleAddTeamMember = (newMember: TeamMember) => {
    setTeamMembers((prev) => {
      const updated = [newMember, ...prev];
      try {
        localStorage.setItem('agency_team_members', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ teamMembers: updated }, true);
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.upsertTeamMember(newMember);
    }
  };

  const handleUpdateTeamMember = (updatedMember: TeamMember) => {
    setTeamMembers((prev) => {
      const updated = prev.map((m) => (m.id === updatedMember.id ? updatedMember : m));
      try {
        localStorage.setItem('agency_team_members', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ teamMembers: updated }, true);
      return updated;
    });

    // Sincroniza as demandas atribuídas a este colaborador para atualizar foto e nome
    if (updatedMember.avatar || updatedMember.name) {
      setDemands((prevDemands) => {
        let hasChanges = false;
        const updatedDemands = prevDemands.map((d) => {
          const isAssigned =
            d.assignee?.name?.trim().toLowerCase() === updatedMember.name?.trim().toLowerCase() ||
            d.assignee?.name?.split(' ')[0]?.toLowerCase() === updatedMember.name?.split(' ')[0]?.toLowerCase() ||
            (updatedMember.username && d.assignee?.name?.toLowerCase() === updatedMember.username.toLowerCase());

          if (isAssigned && (d.assignee.avatar !== updatedMember.avatar || d.assignee.name !== updatedMember.name)) {
            hasChanges = true;
            return {
              ...d,
              assignee: {
                ...d.assignee,
                name: updatedMember.name || d.assignee.name,
                avatar: updatedMember.avatar || d.assignee.avatar,
              },
            };
          }
          return d;
        });

        if (hasChanges) {
          try {
            localStorage.setItem('agency_demands_v2', JSON.stringify(updatedDemands));
          } catch {}
          serverDbService.saveDatabase({ demands: updatedDemands }, true);
        }
        return updatedDemands;
      });
    }

    // Se o membro atualizado for Marcos Lancerotti (Dono da Agência), sincroniza a Senha Mestra e o Perfil Atual
    if (isOwnerOrMarcos(updatedMember)) {
      if (updatedMember.password) {
        updateMasterPassword(updatedMember.password);
      }
      if (updatedMember.username) {
        try {
          localStorage.setItem('help_agency_master_user', updatedMember.username);
        } catch {}
      }

      setCurrentUserProfile((prev) => ({
        ...prev,
        name: updatedMember.name,
        email: updatedMember.email,
        username: updatedMember.username || prev.username,
        avatarUrl: updatedMember.avatar || prev.avatarUrl,
      }));

      try {
        const savedAuth = localStorage.getItem('help_agency_user');
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          if (parsed.isMaster || parsed.role === 'proprietario' || parsed.id === 'usr-1' || isOwnerOrMarcos(parsed)) {
            localStorage.setItem('help_agency_user', JSON.stringify({
              ...parsed,
              name: updatedMember.name,
              email: updatedMember.email,
              username: updatedMember.username || parsed.username,
              avatarUrl: updatedMember.avatar || parsed.avatarUrl,
            }));
          }
        }
      } catch {}
    }

    if (supabaseService.isConfigured()) {
      supabaseService.upsertTeamMember(updatedMember);
    }
  };

  const handleDeleteTeamMember = (memberId: string) => {
    // Proteção Absoluta: Não permite excluir o Marcos Lancerotti (Dono da Agência)
    const targetMember = teamMembers.find((m) => m.id === memberId);
    if (memberId === 'tm-1' || isOwnerOrMarcos(targetMember)) {
      console.warn('Ação bloqueada: Marcos Lancerotti é o Dono da Agência e não pode ser excluído.');
      return;
    }

    setTeamMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      try {
        localStorage.setItem('agency_team_members', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ teamMembers: updated }, true);
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.deleteTeamMember(memberId);
    }
  };

  const handleBulkUpdatePermissions = (newPermissions: MemberPermissions) => {
    setTeamMembers((prev) => {
      const updated = prev.map((m) => {
        if (isOwnerOrMarcos(m)) return m;
        return {
          ...m,
          permissions: { ...newPermissions },
        };
      });
      try {
        localStorage.setItem('agency_team_members', JSON.stringify(updated));
      } catch {}
      serverDbService.saveDatabase({ teamMembers: updated }, true);
      return updated;
    });
  };

  const renderCurrentView = () => {
    // Verificação de regras de acesso do sistema
    if (!canAccessPage(currentPage, effectiveUser)) {
      return (
        <AccessDeniedView
          page={currentPage}
          user={effectiveUser}
          onNavigate={setCurrentPage}
          onExitSimulation={() => setSimulatedMember(null)}
          isSimulating={Boolean(simulatedMember)}
        />
      );
    }

    switch (currentPage) {
      case 'inicio':
        return (
          <InicioView
            onNavigate={setCurrentPage}
            demands={demands}
            clients={clients}
            columns={kanbanColumns}
            teamMembers={teamMembers}
            invoices={invoices}
            activities={activities}
            onOpenNewDemandModal={() => setIsNewDemandModalOpen(true)}
            onSelectDemand={(demandId) => {
              setSelectedDemandIdForKanban(demandId);
              setCurrentPage('demandas');
            }}
            onSelectClient={(client) => {
              setCurrentPage('clientes');
            }}
          />
        );
      case 'demandas':
        return (
          <DemandasView
            demands={demands}
            clients={clients}
            teamMembers={teamMembers}
            columns={kanbanColumns}
            onAddColumn={handleAddColumn}
            onUpdateColumn={handleUpdateColumn}
            onDeleteColumn={handleDeleteColumn}
            initialClientFilter={selectedClientForKanban}
            initialSelectedDemandId={selectedDemandIdForKanban}
            onClearInitialSelectedDemand={() => setSelectedDemandIdForKanban(null)}
            onUpdateDemandColumn={handleUpdateDemandColumn}
            onMoveDemand={handleMoveDemand}
            onOpenNewDemandModal={() => setIsNewDemandModalOpen(true)}
            onSaveDemand={handleSaveDemand}
            onDeleteDemand={handleDeleteDemand}
            onOpenWhatsAppNotification={(demand) => setWhatsAppDemand(demand)}
            onOpenClientApprovalPortal={(demand) => setClientPortalDemand(demand)}
          />
        );
      case 'calendario':
        return (
          <CalendarioView
            clients={clients}
            onOpenNewDemandModal={(initialData) => {
              setNewDemandInitialData(initialData || null);
              setIsNewDemandModalOpen(true);
            }}
            onSelectClient={(client) => {
              setSelectedClientForKanban(client.name);
              setCurrentPage('demandas');
            }}
          />
        );
      case 'clientes':
        return (
          <ClientesView
            clients={clients}
            demands={demands}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onDeleteMultipleClients={handleDeleteMultipleClients}
            supabaseSyncStatus={supabaseSyncStatus}
            onRefreshSupabase={() => handleSyncWithSupabase(false)}
            onSelectClientDemands={(clientName) => {
              setSelectedClientForKanban(clientName);
              setCurrentPage('demandas');
            }}
            onOpenNewDemandForClient={(clientName) => {
              setIsNewDemandModalOpen(true);
            }}
          />
        );
      case 'servicos':
        return (
          <ServicosView
            services={services}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
          />
        );
      case 'financeiro':
        return (
          <FinanceiroView
            clients={clients || []}
            invoices={invoices || []}
            onAddInvoice={handleAddInvoice}
            onToggleStatus={handleToggleInvoiceStatus}
            onDeleteInvoice={handleDeleteInvoice}
            onDeleteMultipleInvoices={handleDeleteMultipleInvoices}
          />
        );
      case 'orcamentos':
        return (
          <OrcamentosView
            proposals={proposals}
            clients={clients}
            onAddProposal={handleAddProposal}
            onUpdateStatus={handleUpdateProposalStatus}
            onDeleteProposal={handleDeleteProposal}
            onUpdateProposal={(updated) => {
              setProposals((prev) => {
                const list = prev.map((p) => (p.id === updated.id ? updated : p));
                try {
                  localStorage.setItem('agency_proposals', JSON.stringify(list));
                } catch {}
                if (supabaseService.isConfigured()) {
                  supabaseService.upsertProposal(updated);
                }
                return list;
              });
            }}
          />
        );
      case 'equipe':
        return (
          <EquipeView
            teamMembers={teamMembers}
            onAddTeamMember={handleAddTeamMember}
            onUpdateTeamMember={handleUpdateTeamMember}
            onDeleteTeamMember={handleDeleteTeamMember}
            currentUser={currentUserProfile}
            onSimulateMember={(member) => setSimulatedMember(member)}
            simulatedMemberId={simulatedMember?.id}
            onBulkUpdatePermissions={handleBulkUpdatePermissions}
          />
        );
      case 'configuracoes':
        return (
          <ConfiguracoesView
            onRestoreData={handleRestoreBackupData}
            demands={demands}
            clients={clients}
            services={services}
            proposals={proposals}
            invoices={invoices}
            teamMembers={teamMembers}
            kanbanColumns={kanbanColumns}
            onSyncSupabaseData={(
              newDemands, 
              newClients, 
              newServices, 
              newProposals, 
              newInvoices, 
              newTeamMembers, 
              newColumns
            ) => {
              if (newDemands && newDemands.length > 0) setDemands(newDemands);
              if (newClients && newClients.length > 0) setClients(newClients);
              if (newServices && newServices.length > 0) setServices(newServices);
              if (newProposals && newProposals.length > 0) setProposals(newProposals);
              if (newInvoices && newInvoices.length > 0) setInvoices(newInvoices);
              if (newTeamMembers && newTeamMembers.length > 0) setTeamMembers(newTeamMembers);
              if (newColumns && newColumns.length > 0) setKanbanColumns(newColumns);
            }}
          />
        );
      case 'portal-cliente':
        return (
          <div className="flex-1 p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles size={28} />
              </div>
              <h2 className="text-lg font-bold text-[#142142] dark:text-white mb-2">
                Portal do Cliente (Em Breve)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Esta funcionalidade está temporariamente desativada e será disponibilizada no futuro.
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage('inicio')}
                className="px-4 py-2 bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        );
      default:
        return (
          <InicioView
            onNavigate={setCurrentPage}
            demands={demands}
            clients={clients}
            columns={kanbanColumns}
            activities={activities}
            onOpenNewDemandModal={() => setIsNewDemandModalOpen(true)}
            onSelectDemand={() => setCurrentPage('demandas')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#080d1a] app-texture-canvas flex flex-col lg:flex-row text-[#142142] dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Sidebar Navigation with 8 requested links */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalActiveDemands={demands.length}
        totalClients={clients.length}
        totalProposals={proposals.length}
        isCollapsed={isDesktopSidebarCollapsed}
        onToggleCollapse={() => setIsDesktopSidebarCollapsed((prev) => !prev)}
        onLogout={onLogout}
        currentUser={effectiveUser}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewDemandModal={() => setIsNewDemandModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsDesktopSidebarCollapsed((prev) => !prev)}
          onLogout={onLogout}
          onNavigate={(page) => setCurrentPage(page)}
          isSupabaseOnline={isSupabaseOnline}
          supabaseSyncStatus={supabaseSyncStatus}
          onRefreshSupabase={() => handleSyncWithSupabase(false)}
          clientsCount={clients.length}
        />

        {/* Simulation Banner Notice if active */}
        {simulatedMember && (
          <div className="mx-3 sm:mx-4 mt-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-[#fab518] text-[#142142] border border-amber-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#142142] text-[#fab518] flex items-center justify-center font-black shrink-0 shadow-xs">
                <EyeOff size={16} />
              </div>
              <div className="text-xs">
                <p className="font-black text-sm">
                  Modo de Teste de Visão: {simulatedMember.name} ({simulatedMember.role})
                </p>
                <p className="text-[11px] text-[#142142]/90 font-medium">
                  Você está visualizando a agência como este colaborador. As 6 páginas bloqueadas (Clientes, Serviços, Financeiro, Orçamento, Equipe, Configurações) exibirão a tela de acesso negado.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSimulatedMember(null)}
              className="px-4 py-2 rounded-xl bg-[#142142] hover:bg-[#1e3060] text-white text-xs font-black transition-all cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              Encerrar Teste de Visão
            </button>
          </div>
        )}

        {/* Page Content Container */}
        <main
          className="flex-1 w-full mx-auto px-3 pb-8 sm:px-4 lg:px-4 max-w-[1780px] transition-all duration-300 ease-in-out"
        >
          {children || (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full"
              >
                {renderCurrentView()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Modal for adding demands */}
      {isNewDemandModalOpen && (
        <NewDemandModal
          isOpen={isNewDemandModalOpen}
          onClose={() => {
            setIsNewDemandModalOpen(false);
            setNewDemandInitialData(null);
          }}
          onAddDemand={(newDemand) => {
            handleAddDemand(newDemand);
            setNewDemandInitialData(null);
          }}
          clients={clients}
          teamMembers={teamMembers}
          columns={kanbanColumns}
          initialData={newDemandInitialData}
        />
      )}

      {/* Modal for WhatsApp notification dispatch */}
      <WhatsAppNotificationModal
        isOpen={Boolean(whatsAppDemand)}
        onClose={() => setWhatsAppDemand(null)}
        demand={whatsAppDemand}
        client={clients.find((c) => c.companyName === whatsAppDemand?.client || c.name === whatsAppDemand?.client)}
        onOpenPortal={(demandId) => {
          const target = demands.find((d) => d.id === demandId);
          if (target) {
            setClientPortalDemand(target);
          }
        }}
        onNotificationSent={(demandId) => {
          const sentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setDemands((prev) =>
            prev.map((d) =>
              d.id === demandId
                ? {
                    ...d,
                    whatsappNotified: true,
                    approvalSentAt: sentTime,
                  }
                : d
            )
          );
        }}
        onUpdateClientPhone={(clientId, newPhone) => {
          setClients((prev) =>
            prev.map((c) => (c.id === clientId ? { ...c, phone: newPhone } : c))
          );
        }}
      />

      {/* Modal for Client Approval Portal */}
      <ClientApprovalPortalModal
        isOpen={Boolean(clientPortalDemand)}
        onClose={() => setClientPortalDemand(null)}
        demand={clientPortalDemand}
        client={clients.find((c) => c.companyName === clientPortalDemand?.client || c.name === clientPortalDemand?.client)}
        onApprove={(demandId) => handleClientApprovalAction(demandId, 'aprovado')}
        onReject={(demandId, reason) => handleClientApprovalAction(demandId, 'reprovado', reason)}
        onRequestChange={(demandId, feedback) => handleClientApprovalAction(demandId, 'alteracao_solicitada', feedback)}
      />
      {/* In-app Browser Notification Toast Feedback */}
      <BrowserNotificationToast
        onSelectDemand={(demandId) => {
          setCurrentPage('demandas');
        }}
      />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('help_agency_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Client public approval portal direct access via URL (e.g. ?portal=aprovacao&demandId=DEM-105)
  const [publicPortalDemandId, setPublicPortalDemandId] = useState<string | null>(extractPublicDemandId);

  // Client public budget proposal direct access via URL (e.g. ?portal=orcamento&proposalId=prop-2 or ?orcamentoId=prop-2)
  const [publicPortalProposalId, setPublicPortalProposalId] = useState<string | null>(extractPublicProposalId);

  const [portalProposals, setPortalProposals] = useState<BudgetProposal[]>(() => {
    try {
      const saved = localStorage.getItem('agency_proposals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialProposals;
  });

  const [portalDemands, setPortalDemands] = useState<DemandItem[]>(() => {
    try {
      const saved = localStorage.getItem('agency_demands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialDemands;
  });

  const [portalClients, setPortalClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('agency_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialClients;
  });

  // Listener para sincronização automática quando a URL mudar no navegador
  useEffect(() => {
    const handleUrlChange = () => {
      const pId = extractPublicProposalId();
      setPublicPortalProposalId(pId);

      const dId = extractPublicDemandId();
      setPublicPortalDemandId(dId);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Busca e sincroniza dados do banco central do servidor para o portal público do cliente
  useEffect(() => {
    let isMounted = true;
    const fetchPortalData = async () => {
      try {
        const remoteData = await serverDbService.fetchDatabase();
        if (!isMounted || !remoteData) return;

        if (remoteData.proposals && Array.isArray(remoteData.proposals) && remoteData.proposals.length > 0) {
          setPortalProposals(remoteData.proposals);
          try {
            localStorage.setItem('agency_proposals', JSON.stringify(remoteData.proposals));
          } catch {}
        }
        if (remoteData.clients && Array.isArray(remoteData.clients) && remoteData.clients.length > 0) {
          setPortalClients(remoteData.clients);
          try {
            localStorage.setItem('agency_clients', JSON.stringify(remoteData.clients));
          } catch {}
        }
        if (remoteData.demands && Array.isArray(remoteData.demands) && remoteData.demands.length > 0) {
          setPortalDemands(remoteData.demands);
          try {
            localStorage.setItem('agency_demands', JSON.stringify(remoteData.demands));
          } catch {}
        }
      } catch (err) {
        console.warn('Falha na sincronização do portal com o banco central:', err);
      }
    };

    fetchPortalData();
    return () => {
      isMounted = false;
    };
  }, [publicPortalProposalId, publicPortalDemandId]);

  // Session Inactivity Monitoring (OWASP / Zero-Trust Defense)
  useEffect(() => {
    if (!isAuthenticated) return;

    const recordUserActivity = () => {
      recordSessionActivity();
    };

    window.addEventListener('mousemove', recordUserActivity);
    window.addEventListener('keydown', recordUserActivity);
    window.addEventListener('click', recordUserActivity);
    window.addEventListener('scroll', recordUserActivity);
    window.addEventListener('touchstart', recordUserActivity);

    // Initial ping
    recordSessionActivity();

    // Check timeout every 15 seconds
    const interval = setInterval(() => {
      const { isExpired, timeoutMinutes } = checkSessionInactivityTimeout();
      if (isExpired) {
        addSecurityLog({
          eventType: 'session_locked',
          severity: 'warning',
          title: 'Sessão Bloqueada por Inatividade',
          description: `O posto de trabalho foi suspenso automaticamente após ${timeoutMinutes} minutos sem interação do usuário para mitigar riscos de roubo de dados.`,
          source: 'Guardião Anti-Intrusão de Sessão',
          threatDetails: 'Bloqueio preventivo contra invasão física e sequestro de sessão'
        });
        handleLogout();
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', recordUserActivity);
      window.removeEventListener('keydown', recordUserActivity);
      window.removeEventListener('click', recordUserActivity);
      window.removeEventListener('scroll', recordUserActivity);
      window.removeEventListener('touchstart', recordUserActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setPublicPortalDemandId(null);
    setPublicPortalProposalId(null);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('help_agency_auth');
      localStorage.removeItem('help_agency_user');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  const handlePublicProposalAction = (
    proposalId: string,
    action: 'Aprovado' | 'Recusado' | 'Ajuste',
    data?: {
      signerName?: string;
      signerRole?: string;
      signerEmail?: string;
      signerPhone?: string;
      notes?: string;
      reason?: string;
      feedback?: string;
    }
  ) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateNow = new Date().toLocaleDateString('pt-BR');
    const dateTime = `${dateNow} ${timeNow}`;

    const updated = portalProposals.map((p) => {
      if (
        p.id.toLowerCase() === proposalId.toLowerCase() ||
        p.code.toLowerCase() === proposalId.toLowerCase() ||
        (p.shareToken && p.shareToken.toLowerCase() === proposalId.toLowerCase())
      ) {
        if (action === 'Aprovado') {
          return {
            ...p,
            status: 'Aprovado' as const,
            approvedAt: dateTime,
            clientSignerName: data?.signerName || p.contactName || 'Cliente',
            clientSignerRole: data?.signerRole || 'Responsável',
            clientSignerEmail: data?.signerEmail || p.clientEmail,
            clientSignerPhone: data?.signerPhone || p.clientPhone,
            clientDecisionNote: data?.notes,
          };
        } else if (action === 'Recusado') {
          return {
            ...p,
            status: 'Recusado' as const,
            rejectedAt: dateTime,
            clientDecisionNote: data?.reason || 'Proposta recusada pelo cliente.',
          };
        } else {
          return {
            ...p,
            clientDecisionNote: data?.feedback || 'Cliente solicitou readequação de escopo.',
          };
        }
      }
      return p;
    });

    setPortalProposals(updated);
    try {
      localStorage.setItem('agency_proposals', JSON.stringify(updated));
    } catch {}

    // Salva imediatamente no banco central do servidor
    serverDbService.saveDatabase({ proposals: updated }, true);

    // Registra via endpoint dedicado de decisão
    serverDbService.submitPublicProposalDecision(proposalId, {
      action,
      ...data,
    });

    const target = updated.find(
      (p) =>
        p.id.toLowerCase() === proposalId.toLowerCase() ||
        p.code.toLowerCase() === proposalId.toLowerCase() ||
        (p.shareToken && p.shareToken.toLowerCase() === proposalId.toLowerCase())
    );

    if (target && supabaseService.isConfigured()) {
      supabaseService.upsertProposal(target);
    }
  };

  const handlePublicApprovalAction = (
    demandId: string,
    action: 'aprovado' | 'reprovado' | 'alteracao_solicitada',
    feedback?: string
  ) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = portalDemands.find((d) => d.id === demandId);

    const updated = portalDemands.map((d) => {
      if (d.id === demandId) {
        if (action === 'aprovado') {
          return {
            ...d,
            columnId: 'concluidas' as KanbanColumnId,
            statusLabel: 'Aprovado pelo Cliente',
            approvalStatus: 'aprovado' as const,
            approvalAnsweredAt: timeNow,
            history: [
              ...(d.history || []),
              {
                id: `hist-${Date.now()}`,
                text: `Material aprovado diretamente pelo cliente via Portal Seguro às ${timeNow}.`,
                timestamp: timeNow,
                author: 'Cliente (Portal Web)',
              },
            ],
          };
        } else if (action === 'reprovado') {
          return {
            ...d,
            statusLabel: 'Reprovado pelo Cliente',
            approvalStatus: 'reprovado' as const,
            approvalAnsweredAt: timeNow,
            approvalFeedback: feedback || 'Peça reprovada pelo cliente.',
            history: [
              ...(d.history || []),
              {
                id: `hist-${Date.now()}`,
                text: `Material reprovado pelo cliente: "${feedback || 'Sem justificativa detalhada'}".`,
                timestamp: timeNow,
                author: 'Cliente (Portal Web)',
              },
            ],
          };
        } else {
          return {
            ...d,
            columnId: 'producao' as KanbanColumnId,
            statusLabel: 'Ajuste Solicitado',
            approvalStatus: 'alteracao_solicitada' as const,
            approvalAnsweredAt: timeNow,
            approvalFeedback: feedback,
            history: [
              ...(d.history || []),
              {
                id: `hist-${Date.now()}`,
                text: `Cliente solicitou alterações: "${feedback}". Peça retornou para Produção.`,
                timestamp: timeNow,
                author: 'Cliente (Portal Web)',
              },
            ],
          };
        }
      }
      return d;
    });

    setPortalDemands(updated);
    try {
      localStorage.setItem('agency_demands', JSON.stringify(updated));
    } catch {}

    if (target) {
      if (action === 'aprovado') {
        notifyDemandApproved({
          id: target.id,
          title: target.title,
          client: target.client,
        });
      } else if (action === 'reprovado') {
        notifyDemandRejected({
          id: target.id,
          title: target.title,
          client: target.client,
          reason: feedback,
        });
      } else {
        notifyDemandChangeRequested({
          id: target.id,
          title: target.title,
          client: target.client,
          feedback: feedback || '',
        });
      }
    }
  };

  // 1. If public client demand portal URL is being accessed, show isolated demand approval view
  if (publicPortalDemandId) {
    return (
      <ThemeProvider>
        <PublicClientApprovalView
          demandId={publicPortalDemandId}
          demands={portalDemands}
          clients={portalClients}
          onApprove={(dId) => handlePublicApprovalAction(dId, 'aprovado')}
          onReject={(dId, reason) => handlePublicApprovalAction(dId, 'reprovado', reason)}
          onRequestChange={(dId, feedback) => handlePublicApprovalAction(dId, 'alteracao_solicitada', feedback)}
          onGoToAdminLogin={() => {
            // Remove query params to show standard login
            try {
              window.history.replaceState({}, '', window.location.pathname);
            } catch {}
            setPublicPortalDemandId(null);
          }}
        />
      </ThemeProvider>
    );
  }

  // 2. If public client budget proposal URL is being accessed, show isolated budget approval view
  if (publicPortalProposalId) {
    return (
      <ThemeProvider>
        <PublicBudgetProposalView
          proposalId={publicPortalProposalId}
          proposals={portalProposals}
          clients={portalClients}
          onApprove={(pId, data) => handlePublicProposalAction(pId, 'Aprovado', data)}
          onReject={(pId, reason) => handlePublicProposalAction(pId, 'Recusado', { reason })}
          onRequestChange={(pId, feedback) => handlePublicProposalAction(pId, 'Ajuste', { feedback })}
          onGoToAdminLogin={() => {
            try {
              window.history.replaceState({}, '', window.location.pathname);
            } catch {}
            setPublicPortalProposalId(null);
          }}
        />
      </ThemeProvider>
    );
  }

  // 3. Standard authenticated workspace vs login
  return (
    <ThemeProvider>
      <TwoFactorProvider>
        {isAuthenticated ? (
          <Layout onLogout={handleLogout} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )}
      </TwoFactorProvider>
    </ThemeProvider>
  );
}

