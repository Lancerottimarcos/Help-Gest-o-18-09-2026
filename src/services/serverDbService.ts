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
};
