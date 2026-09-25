import { Client, DemandItem, Service, BudgetProposal, Invoice, ClientActivity, TeamMember, KanbanColumn } from '../types';

export interface AppDatabasePayload {
  clients?: Client[];
  demands?: DemandItem[];
  services?: Service[];
  proposals?: BudgetProposal[];
  invoices?: Invoice[];
  activities?: ClientActivity[];
  teamMembers?: TeamMember[];
  kanbanColumns?: KanbanColumn[];
  updatedAt?: number;
}

export interface DatabaseApiResponse {
  success: boolean;
  data: AppDatabasePayload | null;
  timestamp?: number;
  error?: string;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingPayload: Partial<AppDatabasePayload> = {};

export const serverDbService = {
  /**
   * Busca os dados compartilhados do servidor da aplicação
   */
  async fetchDatabase(): Promise<AppDatabasePayload | null> {
    try {
      const res = await fetch('/api/database');
      if (!res.ok) return null;
      const json: DatabaseApiResponse = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('Servidor central não respondeu ao fetchDatabase:', err);
    }
    return null;
  },

  /**
   * Salva os dados no servidor da aplicação de forma persistente (compartilhada entre navegadores e computadores)
   * Utiliza debounce para evitar requisições em cascata.
   */
  saveDatabase(payload: Partial<AppDatabasePayload>, immediate = false): Promise<boolean> {
    return new Promise((resolve) => {
      pendingPayload = { ...pendingPayload, ...payload };

      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }

      const executeSave = async () => {
        try {
          const bodyToSend = {
            ...pendingPayload,
            updatedAt: Date.now(),
          };
          pendingPayload = {};

          const res = await fetch('/api/database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyToSend),
          });

          if (res.ok) {
            resolve(true);
            return;
          }
        } catch (err) {
          console.warn('Erro ao salvar no servidor central:', err);
        }
        resolve(false);
      };

      if (immediate) {
        executeSave();
      } else {
        saveTimeout = setTimeout(executeSave, 400);
      }
    });
  },

  /**
   * Busca um orçamento público específico para o cliente visualizar (com suporte a fallback para base central)
   */
  async fetchPublicProposal(proposalId: string): Promise<{ proposal: BudgetProposal; client?: Client } | null> {
    if (!proposalId) return null;
    const cleanId = encodeURIComponent(proposalId.trim());

    // 1. Tenta endpoint direto dedicado
    try {
      const res = await fetch(`/api/public/proposal/${cleanId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.proposal) {
          return { proposal: json.proposal, client: json.client };
        }
      }
    } catch {}

    // 2. Fallback: busca da base geral
    try {
      const db = await this.fetchDatabase();
      if (db && Array.isArray(db.proposals)) {
        const targetId = proposalId.trim().toLowerCase();
        const found = db.proposals.find(
          (p) =>
            p.id.toLowerCase() === targetId ||
            p.code.toLowerCase() === targetId ||
            (p.shareToken && p.shareToken.toLowerCase() === targetId)
        );

        if (found) {
          const client = db.clients?.find(
            (c) =>
              (found.clientId && c.id === found.clientId) ||
              c.companyName.toLowerCase() === found.clientName.toLowerCase() ||
              c.name.toLowerCase() === found.clientName.toLowerCase()
          );
          return { proposal: found, client };
        }
      }
    } catch {}

    return null;
  },

  /**
   * Registra a decisão do cliente em um orçamento público
   */
  async submitPublicProposalDecision(
    proposalId: string,
    decisionData: {
      action: 'Aprovado' | 'Recusado' | 'Ajuste';
      signerName?: string;
      signerRole?: string;
      signerEmail?: string;
      signerPhone?: string;
      notes?: string;
      reason?: string;
      feedback?: string;
    }
  ): Promise<BudgetProposal | null> {
    try {
      const cleanId = encodeURIComponent(proposalId.trim());
      const res = await fetch(`/api/public/proposal/${cleanId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionData),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.proposal) {
          return json.proposal;
        }
      }
    } catch (err) {
      console.warn('Erro ao enviar decisão para o servidor:', err);
    }
    return null;
  },
};
