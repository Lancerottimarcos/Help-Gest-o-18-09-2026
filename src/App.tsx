import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, DemandItem, Client, KanbanColumnId, ClientActivity, Service, TeamMember, KanbanColumn, BudgetProposal, Invoice, UserProfile, UserRole } from './types';
import { initialDemands, initialClients, initialRecentActivities, initialServices, initialTeamMembers, initialProposals, initialInvoices, currentUser, kanbanColumnsData } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InicioView } from './views/InicioView';
import { DemandasView } from './views/DemandasView';
import { ClientesView } from './views/ClientesView';
import { ServicosView } from './views/ServicosView';
import { FinanceiroView } from './views/FinanceiroView';
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
import { 
  recordSessionActivity, 
  checkSessionInactivityTimeout, 
  addSecurityLog 
} from './utils/securityProtocols';
import {
  notifyDemandApproved,
  notifyDemandRejected,
  notifyDemandChangeRequested,
} from './utils/browserNotifications';
import { supabaseService } from './services/supabaseService';
import { syncSupabaseCredentialsWithServer } from './lib/supabaseClient';
import { serverDbService } from './services/serverDbService';

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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialInvoices;
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

  useEffect(() => {
    try {
      localStorage.setItem('agency_team_members', JSON.stringify(teamMembers));
    } catch {}
  }, [teamMembers]);
  const [activities, setActivities] = useState<ClientActivity[]>(initialRecentActivities);
  const [selectedClientForKanban, setSelectedClientForKanban] = useState<string>('todos');

  const isServerDbLoadedRef = useRef(false);

  // Sincronização robusta contínua com o Supabase (PostgreSQL Nuvem Principal)
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(true);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const handleSyncWithSupabase = useCallback(async (isSilent = false) => {
    if (!supabaseService.isConfigured()) return;
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
        setDemands(remoteDemands);
        try {
          localStorage.setItem('agency_demands', JSON.stringify(remoteDemands));
        } catch {}
        serverDbService.saveDatabase({ demands: remoteDemands });
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
        setTeamMembers(remoteTeamMembers);
        try {
          localStorage.setItem('agency_team_members', JSON.stringify(remoteTeamMembers));
        } catch {}
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
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
      setSupabaseSyncStatus('error');
    }
  }, []);

  // 1. Carrega dados persistentes do servidor central e do Supabase na montagem inicial
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      // Inicia sincronização direta com a nuvem Supabase
      handleSyncWithSupabase(false);

      // Também busca do servidor de banco compartilhado (fallback redundante)
      try {
        const remoteData = await serverDbService.fetchDatabase();
        if (!isMounted) return;

        if (remoteData) {
          if (remoteData.clients && Array.isArray(remoteData.clients) && remoteData.clients.length > 0) {
            setClients((prev) => (prev.length === 0 ? remoteData.clients! : prev));
          }
          if (remoteData.demands && Array.isArray(remoteData.demands) && remoteData.demands.length > 0) {
            setDemands((prev) => (prev.length === 0 ? remoteData.demands! : prev));
          }
        }
      } catch {}

      if (isMounted) {
        isServerDbLoadedRef.current = true;
      }
    };

    initData();

    // Sincronização periódica a cada 20 segundos para manter múltiplos computadores alinhados
    const pollInterval = setInterval(() => {
      handleSyncWithSupabase(true);
    }, 20000);

    // Sincroniza imediatamente quando a janela / aba do navegador ganha foco
    const handleFocus = () => {
      handleSyncWithSupabase(true);
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
    setProposals((prev) => [newProposal, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.upsertProposal(newProposal);
    }
  };

  const handleUpdateProposalStatus = (id: string, newStatus: 'Enviado' | 'Aprovado' | 'Recusado') => {
    setProposals((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
      const target = updated.find(p => p.id === id);
      if (target && supabaseService.isConfigured()) {
        supabaseService.upsertProposal(target);
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
        inv.id === id ? { ...inv, status: inv.status === 'Pago' ? 'Pendente' : 'Pago' } : inv
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

    if (isMovingToApproval) {
      const config = getNotificationConfig();
      if (config.autoOpenModalOnMove) {
        setWhatsAppDemand(updatedDemand);
      }
    }

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
          ? `Demanda enviada ao Portal do Cliente e notificação WhatsApp gerada.`
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
    setDemands((prev) => [newDemand, ...prev]);

    // Sincroniza em background com o Supabase PostgreSQL
    supabaseService.upsertDemand(newDemand);

    if (newDemand.columnId === 'aprovacao') {
      const config = getNotificationConfig();
      if (config.autoOpenModalOnMove) {
        setWhatsAppDemand(newDemand);
      }
    }

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

    const finalDemand: DemandItem = {
      ...updatedDemand,
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

    setDemands((prev) =>
      prev.map((item) => (item.id === finalDemand.id ? finalDemand : item))
    );

    // Sincroniza em background com o Supabase PostgreSQL
    supabaseService.upsertDemand(finalDemand);

    if (wasJustMovedToApproval) {
      const config = getNotificationConfig();
      if (config.autoOpenModalOnMove) {
        setWhatsAppDemand(finalDemand);
      }
    }

    const newActivity: ClientActivity = {
      id: `act-${Date.now()}`,
      clientName: finalDemand.client,
      demandId: finalDemand.id,
      demandTitle: finalDemand.title,
      projectOrCampaign: finalDemand.clientProject,
      type: wasJustMovedToApproval ? 'client_approval' : 'status_changed',
      description: wasJustMovedToApproval
        ? `Demanda enviada para aprovação do cliente via Portal e WhatsApp.`
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
    setDemands((prev) => prev.filter((item) => item.id !== demandId));
    supabaseService.deleteDemand(demandId);
  };

  const handleAddClient = (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    supabaseService.upsertClient(newClient);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    supabaseService.upsertClient(updatedClient);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    supabaseService.deleteClient(clientId);
  };

  const handleDeleteMultipleClients = (clientIds: string[]) => {
    setClients((prev) => prev.filter((c) => !clientIds.includes(c.id)));
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
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.upsertTeamMember(updatedMember);
    }
  };

  const handleDeleteTeamMember = (memberId: string) => {
    setTeamMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      try {
        localStorage.setItem('agency_team_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (supabaseService.isConfigured()) {
      supabaseService.deleteTeamMember(memberId);
    }
  };

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'inicio':
        return (
          <InicioView
            onNavigate={setCurrentPage}
            demands={demands}
            clients={clients}
            invoices={invoices}
            activities={activities}
            onOpenNewDemandModal={() => setIsNewDemandModalOpen(true)}
            onSelectDemand={(demandId) => {
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
            columns={kanbanColumns}
            onAddColumn={handleAddColumn}
            onUpdateColumn={handleUpdateColumn}
            onDeleteColumn={handleDeleteColumn}
            initialClientFilter={selectedClientForKanban}
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
            clients={clients}
            invoices={invoices}
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
            onAddProposal={handleAddProposal}
            onUpdateStatus={handleUpdateProposalStatus}
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
          <PortalClienteView
            demands={demands}
            clients={clients}
            onClientApprovalAction={handleClientApprovalAction}
            onOpenWhatsAppNotification={(demand) => setWhatsAppDemand(demand)}
            onOpenDemandModal={(demand) => {
              // Open demand in portal modal or go to demandas
              setClientPortalDemand(demand);
            }}
          />
        );
      default:
        return (
          <InicioView
            onNavigate={setCurrentPage}
            demands={demands}
            clients={clients}
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
        currentUser={currentUserProfile}
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
  const [publicPortalDemandId, setPublicPortalDemandId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'aprovacao' && params.get('demandId')) {
        return params.get('demandId');
      }
    } catch {}
    return null;
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

  const [portalClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('agency_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialClients;
  });

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

  // 1. If public client portal URL is being accessed, show isolated client view
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

  // 2. Standard authenticated workspace vs login
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

