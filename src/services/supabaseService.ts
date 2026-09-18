import { getSupabaseClient } from '../lib/supabaseClient';
import { DemandItem, Client } from '../types';

export interface SyncResult {
  clientsUploaded: number;
  demandsUploaded: number;
  errors: string[];
}

export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- SCHEMA SQL PARA O SUPABASE (POSTGRESQL) - HELP IDEIAS
-- Cole este script no menu "SQL Editor" do seu painel Supabase
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    segment TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Ativo',
    monthly_fee NUMERIC(10,2) DEFAULT 0.00,
    avatar TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    active_demands_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE DEMANDAS (KANBAN)
CREATE TABLE IF NOT EXISTS public.demands (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_project TEXT,
    description TEXT,
    type TEXT DEFAULT 'Post',
    service_category TEXT DEFAULT 'Social Media',
    column_id TEXT NOT NULL DEFAULT 'ideias',
    priority TEXT NOT NULL DEFAULT 'media',
    priority_bars INTEGER DEFAULT 2,
    due_date TEXT,
    assignee JSONB DEFAULT '{"name": "Marcos Lancerotti", "avatar": ""}'::jsonb,
    status_label TEXT,
    approval_status TEXT,
    approval_feedback TEXT,
    client_portal_token TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Permitir leitura/escrita)
DROP POLICY IF EXISTS "Acesso completo clients" ON public.clients;
CREATE POLICY "Acesso completo clients" ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso completo demands" ON public.demands;
CREATE POLICY "Acesso completo demands" ON public.demands FOR ALL USING (true);
`;

export const supabaseService = {
  /**
   * Verifica se o cliente do Supabase está operacional
   */
  isAvailable(): boolean {
    return getSupabaseClient() !== null;
  },

  /**
   * Busca todas as demandas do Supabase
   */
  async fetchDemands(): Promise<DemandItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar demandas no Supabase:', error);
        return null;
      }

      return (data || []).map((row: any): DemandItem => ({
        id: row.id,
        title: row.title,
        client: row.client_name,
        clientProject: row.client_project || undefined,
        description: row.description || '',
        type: row.type || 'Post',
        serviceCategory: row.service_category || 'Social Media',
        columnId: row.column_id || 'ideias',
        priority: row.priority || 'media',
        priorityBars: row.priority_bars ?? 2,
        dueDate: row.due_date || 'Sem prazo',
        assignee: row.assignee || {
          name: 'Marcos Lancerotti',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        statusLabel: row.status_label || undefined,
        approvalStatus: row.approval_status || undefined,
        approvalFeedback: row.approval_feedback || undefined,
        clientPortalToken: row.client_portal_token || undefined,
        attachments: row.attachments || [],
      }));
    } catch (e) {
      console.error('Exceção ao buscar demandas no Supabase:', e);
      return null;
    }
  },

  /**
   * Salva ou atualiza uma demanda no Supabase
   */
  async upsertDemand(demand: DemandItem): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: demand.id,
        title: demand.title,
        client_name: demand.client,
        client_project: demand.clientProject || null,
        description: demand.description || '',
        type: demand.type || 'Post',
        service_category: demand.serviceCategory || 'Social Media',
        column_id: demand.columnId || 'ideias',
        priority: demand.priority || 'media',
        priority_bars: demand.priorityBars ?? 2,
        due_date: demand.dueDate || null,
        assignee: demand.assignee,
        status_label: demand.statusLabel || null,
        approval_status: demand.approvalStatus || null,
        approval_feedback: demand.approvalFeedback || null,
        client_portal_token: demand.clientPortalToken || null,
        attachments: demand.attachments || [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('demands').upsert(payload);
      if (error) {
        console.error('Erro ao fazer upsert da demanda no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Exceção ao sincronizar demanda:', e);
      return false;
    }
  },

  /**
   * Deleta uma demanda do Supabase
   */
  async deleteDemand(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('demands').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Busca todos os clientes do Supabase
   */
  async fetchClients(): Promise<Client[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes no Supabase:', error);
        return null;
      }

      return (data || []).map((row: any): Client => ({
        id: row.id,
        name: row.name,
        companyName: row.company_name || row.name,
        segment: row.segment || 'Geral',
        contactName: row.contact_name || row.name,
        email: row.email || '',
        phone: row.phone || '',
        avatar: row.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        status: (row.status as any) || 'Ativo',
        monthlyFee: Number(row.monthly_fee) || 0,
        services: Array.isArray(row.services) ? row.services : ['Social Media'],
        activeDemandsCount: Number(row.active_demands_count) || 0,
      }));
    } catch (e) {
      console.error('Exceção ao buscar clientes no Supabase:', e);
      return null;
    }
  },

  /**
   * Salva ou atualiza um cliente individual no Supabase
   */
  async upsertClient(client: Client): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: client.id,
        name: client.name,
        company_name: client.companyName || client.name,
        segment: client.segment || 'Geral',
        contact_name: client.contactName || client.name,
        email: client.email || null,
        phone: client.phone || null,
        status: client.status || 'Ativo',
        monthly_fee: client.monthlyFee || 0,
        avatar: client.avatar || null,
        services: client.services || [],
        active_demands_count: client.activeDemandsCount || 0,
      };

      const { error } = await supabase.from('clients').upsert(payload);
      if (error) {
        console.error('Erro ao fazer upsert do cliente no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Exceção ao sincronizar cliente:', e);
      return false;
    }
  },

  /**
   * Deleta um cliente do Supabase
   */
  async deleteClient(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Verifica se o Supabase está devidamente configurado com URL e AnonKey
   */
  isConfigured(): boolean {
    const supabase = getSupabaseClient();
    return !!supabase;
  },

  /**
   * Migração em Massa: Envia todos os dados locais para o Supabase
   */
  async syncAllLocalDataToSupabase(
    demands: DemandItem[], 
    clients: Client[],
    customUrl?: string,
    customKey?: string
  ): Promise<SyncResult> {
    const supabase = getSupabaseClient(customUrl, customKey);
    const result: SyncResult = { clientsUploaded: 0, demandsUploaded: 0, errors: [] };

    if (!supabase) {
      result.errors.push('Cliente Supabase não está configurado. Verifique se a URL e a Chave estão preenchidas.');
      return result;
    }

    // 1. Upload de Clientes
    if (clients.length > 0) {
      try {
        const clientPayloads = clients.map(c => ({
          id: c.id,
          name: c.name,
          company_name: c.companyName || c.name,
          segment: c.segment || 'Geral',
          contact_name: c.contactName || c.name,
          email: c.email || null,
          phone: c.phone || null,
          status: c.status || 'Ativo',
          monthly_fee: c.monthlyFee || 0,
          avatar: c.avatar || null,
          services: c.services || [],
          active_demands_count: c.activeDemandsCount || 0,
        }));

        const { error } = await supabase.from('clients').upsert(clientPayloads);
        if (error) {
          if (error.message?.includes('relation "public.clients" does not exist') || error.code === '42P01') {
            result.errors.push('A tabela "clients" não existe no Supabase. Execute o script SQL no SQL Editor.');
          } else {
            result.errors.push(`Erro na tabela clients: ${error.message}`);
          }
        } else {
          result.clientsUploaded = clients.length;
        }
      } catch (err: any) {
        result.errors.push(`Falha no upload de clientes: ${err.message}`);
      }
    }

    // 2. Upload de Demandas
    if (demands.length > 0) {
      try {
        const demandPayloads = demands.map(d => ({
          id: d.id,
          title: d.title,
          client_name: d.client,
          client_project: d.clientProject || null,
          description: d.description || '',
          type: d.type || 'Post',
          service_category: d.serviceCategory || 'Social Media',
          column_id: d.columnId || 'ideias',
          priority: d.priority || 'media',
          priority_bars: d.priorityBars ?? 2,
          due_date: d.dueDate || null,
          assignee: d.assignee,
          status_label: d.statusLabel || null,
          approval_status: d.approvalStatus || null,
          approval_feedback: d.approvalFeedback || null,
          client_portal_token: d.clientPortalToken || null,
          attachments: d.attachments || [],
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('demands').upsert(demandPayloads);
        if (error) {
          if (error.message?.includes('relation "public.demands" does not exist') || error.code === '42P01') {
            result.errors.push('A tabela "demands" não existe no Supabase. Execute o script SQL no SQL Editor.');
          } else {
            result.errors.push(`Erro na tabela demands: ${error.message}`);
          }
        } else {
          result.demandsUploaded = demands.length;
        }
      } catch (err: any) {
        result.errors.push(`Falha no upload de demandas: ${err.message}`);
      }
    }

    return result;
  },

  /**
   * Insere dados piloto de teste diretamente para verificar o funcionamento imediato das tabelas
   */
  async seedTestData(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient(customUrl, customKey);
    if (!supabase) {
      return { success: false, message: 'Supabase não conectado. Preencha e salve a URL e a Chave primeiro.' };
    }

    try {
      const testClientId = 'client-piloto-' + Math.floor(Math.random() * 10000);
      const testDemandId = 'demand-piloto-' + Math.floor(Math.random() * 10000);

      const { error: clientErr } = await supabase.from('clients').upsert({
        id: testClientId,
        name: 'Help Ideias - Cliente Demonstração',
        company_name: 'Help Ideias Digitais',
        segment: 'Marketing Digital',
        contact_name: 'Marcos Lancerotti',
        email: 'lancerottirmarcos@gmail.com',
        phone: '(11) 98765-4321',
        status: 'Ativo',
        monthly_fee: 4500.00,
        services: ['Gestão de Tráfego', 'Social Media', 'Branding'],
        active_demands_count: 1,
      });

      if (clientErr) {
        if (clientErr.message?.includes('relation "public.clients" does not exist') || clientErr.code === '42P01') {
          return { success: false, message: 'A tabela "clients" não foi encontrada. Lembre-se de rodar o Script SQL no menu SQL Editor do Supabase.' };
        }
        return { success: false, message: `Erro ao gravar cliente de teste: ${clientErr.message}` };
      }

      const { error: demandErr } = await supabase.from('demands').upsert({
        id: testDemandId,
        title: 'Campanha Inaugural - Presença Digital',
        client_name: 'Help Ideias - Cliente Demonstração',
        client_project: 'Lançamento Institucional',
        description: 'Demanda de validação conectada com sucesso ao banco PostgreSQL Supabase.',
        type: 'Campanha',
        service_category: 'Social Media',
        column_id: 'producao',
        priority: 'alta',
        priority_bars: 3,
        due_date: 'Próxima semana',
        assignee: { name: 'Marcos Lancerotti', avatar: '' },
        status_label: 'Em Produção',
        attachments: [],
      });

      if (demandErr) {
        if (demandErr.message?.includes('relation "public.demands" does not exist') || demandErr.code === '42P01') {
          return { success: false, message: 'A tabela "demands" não foi encontrada. Lembre-se de rodar o Script SQL no menu SQL Editor do Supabase.' };
        }
        return { success: false, message: `Erro ao gravar demanda de teste: ${demandErr.message}` };
      }

      return { 
        success: true, 
        message: 'Registro de teste inserido com sucesso! Você já pode ver as linhas em "Table Editor" no painel do Supabase.' 
      };
    } catch (e: any) {
      return { success: false, message: `Exceção ao inserir teste: ${e.message}` };
    }
  }
};
