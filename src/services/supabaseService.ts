import { getSupabaseClient } from '../lib/supabaseClient';
import { 
  DemandItem, 
  Client, 
  Service, 
  Invoice, 
  BudgetProposal, 
  TeamMember,
  KanbanColumn 
} from '../types';

export interface FullSyncPayload {
  clients?: Client[];
  demands?: DemandItem[];
  services?: Service[];
  proposals?: BudgetProposal[];
  invoices?: Invoice[];
  teamMembers?: TeamMember[];
  kanbanColumns?: KanbanColumn[];
}

export interface SyncResult {
  clientsUploaded: number;
  demandsUploaded: number;
  servicesUploaded: number;
  proposalsUploaded: number;
  invoicesUploaded: number;
  teamMembersUploaded: number;
  kanbanColumnsUploaded: number;
  errors: string[];
}

/**
 * Script de migração rápida para quem já possui as tabelas criadas no Supabase
 * mas ainda não possui as novas colunas como 'address' ou 'approval_answered_at'.
 */
export const SUPABASE_MIGRATION_SQL = `-- ====================================================================
-- SCRIPT DE ATUALIZAÇÃO / MIGRAÇÃO INCREMENTAL DE COLUNAS NO SUPABASE
-- Cole no SQL Editor do Supabase e clique em RUN. Não apaga nenhum dado!
-- ====================================================================

-- 1. Novas colunas e auditoria na tabela de clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'juridica';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_role TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS emails JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cover_color TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS active_demands_count INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS joined_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lgpd_consent_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lgpd_consent_purpose TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS anonymized_at TEXT;

-- Atualiza a função de trigger para ser tolerante a falhas (impede quebrar caso updated_at falte em alguma tabela)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
    EXCEPTION WHEN undefined_column THEN
        -- Se a tabela não possuir a coluna updated_at, ignora sem quebrar a operação
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Novas colunas na tabela de demandas
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_answered_at TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_sent_at TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_feedback TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS client_portal_token TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS whatsapp_notified BOOLEAN DEFAULT false;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS client_project TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS service_category TEXT DEFAULT 'Social Media';

-- 3. Novas colunas na tabela de equipe (team_members)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS function_role TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 4. Novas colunas na tabela de colunas kanban
ALTER TABLE public.kanban_columns ADD COLUMN IF NOT EXISTS position_order INTEGER DEFAULT 0;

-- 5. Notificar o PostgREST para recarregar o cache de schema imediatamente
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- SCHEMA SQL PROFISSIONAL PARA O SUPABASE (POSTGRESQL) - HELP IDEIAS
-- Arquitetura relacional com RLS, Triggers de Auditoria e Índices B-Tree
-- Cole este script completo no menu "SQL Editor" do painel do Supabase
-- ====================================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. FUNÇÃO UTILITÁRIA PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
    EXCEPTION WHEN undefined_column THEN
        -- Se a tabela não possuir a coluna updated_at, ignora sem quebrar a operação
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 2. TABELA DE CLIENTES (CRM & LGPD)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    person_type TEXT DEFAULT 'juridica',
    name TEXT NOT NULL,
    cpf_cnpj TEXT,
    company_name TEXT NOT NULL,
    segment TEXT DEFAULT 'Geral',
    contact_name TEXT,
    contact_role TEXT,
    email TEXT,
    emails JSONB DEFAULT '[]'::jsonb,
    phone TEXT,
    phones JSONB DEFAULT '[]'::jsonb,
    birth_date TEXT,
    cover_color TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'Ativo',
    monthly_fee NUMERIC(10,2) DEFAULT 0.00,
    services JSONB DEFAULT '[]'::jsonb,
    active_demands_count INTEGER DEFAULT 0,
    joined_date TEXT,
    website TEXT,
    instagram TEXT,
    address TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    lgpd_consent_date TEXT,
    lgpd_consent_purpose TEXT,
    is_anonymized BOOLEAN DEFAULT false,
    anonymized_at TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assegura adição de colunas mesmo se a tabela já existia com versão antiga
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'juridica';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS emails JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cover_color TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS joined_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lgpd_consent_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lgpd_consent_purpose TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS anonymized_at TEXT;

-- Trigger de updated_at para clients
DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices de consulta para clients
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_name);

-- --------------------------------------------------------------------
-- 3. TABELA DE DEMANDAS (WORKFLOW KANBAN & PORTAL DO CLIENTE)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demands (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    client_project TEXT,
    description TEXT DEFAULT '',
    type TEXT DEFAULT 'Post',
    service_category TEXT DEFAULT 'Social Media',
    column_id TEXT NOT NULL DEFAULT 'ideias',
    priority TEXT NOT NULL DEFAULT 'media',
    priority_bars INTEGER DEFAULT 2,
    due_date TEXT,
    assignee JSONB DEFAULT '{"name": "Marcos Lancerotti", "avatar": ""}'::jsonb,
    thumbnail TEXT,
    status_label TEXT,
    checklist_total INTEGER DEFAULT 0,
    checklist_completed INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    attachments_count INTEGER DEFAULT 0,
    attachments JSONB DEFAULT '[]'::jsonb,
    approval_status TEXT,
    approval_feedback TEXT,
    approval_sent_at TEXT,
    approval_answered_at TEXT,
    client_portal_token TEXT,
    whatsapp_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assegura adição de colunas mesmo se a tabela já existia com versão antiga
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_answered_at TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_sent_at TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS approval_feedback TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS client_portal_token TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS whatsapp_notified BOOLEAN DEFAULT false;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS client_project TEXT;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS service_category TEXT DEFAULT 'Social Media';

-- Trigger de updated_at para demands
DROP TRIGGER IF EXISTS trg_demands_updated_at ON public.demands;
CREATE TRIGGER trg_demands_updated_at
BEFORE UPDATE ON public.demands
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices de consulta para demands
CREATE INDEX IF NOT EXISTS idx_demands_column ON public.demands(column_id);
CREATE INDEX IF NOT EXISTS idx_demands_client ON public.demands(client_name);
CREATE INDEX IF NOT EXISTS idx_demands_portal ON public.demands(client_portal_token);

-- --------------------------------------------------------------------
-- 4. TABELA DE SERVIÇOS DA AGÊNCIA (CATÁLOGO & PRECIFICAÇÃO)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Social Media',
    description TEXT DEFAULT '',
    base_price NUMERIC(10,2) DEFAULT 0.00,
    is_monthly BOOLEAN DEFAULT true,
    deliverables JSONB DEFAULT '[]'::jsonb,
    active_clients_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger de updated_at para services
DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------
-- 5. TABELA DE ORÇAMENTOS E PROPOSTAS COMERCIAIS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proposals (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    client_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    total_value NUMERIC(10,2) DEFAULT 0.00,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Rascunho',
    services_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger de updated_at para proposals
DROP TRIGGER IF EXISTS trg_proposals_updated_at ON public.proposals;
CREATE TRIGGER trg_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);

-- --------------------------------------------------------------------
-- 6. TABELA DE FATURAS E LANÇAMENTOS FINANCEIROS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    client_initial TEXT,
    service TEXT NOT NULL,
    value NUMERIC(10,2) DEFAULT 0.00,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente',
    category TEXT DEFAULT 'Mensalidade Recorrente',
    payment_method TEXT DEFAULT 'PIX',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger de updated_at para invoices
DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client);

-- --------------------------------------------------------------------
-- 7. TABELA DE COLUNAS PERSONALIZADAS DO KANBAN
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    color TEXT NOT NULL,
    button_bg TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    position_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 8. TABELA DE MEMBROS DA EQUIPE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    function_role TEXT,
    email TEXT NOT NULL,
    avatar TEXT,
    active_tasks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Disponível',
    specialties JSONB DEFAULT '[]'::jsonb,
    username TEXT,
    password TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assegura adição de novas colunas em team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS function_role TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS created_by TEXT;

-- --------------------------------------------------------------------
-- 9. CONFIGURAÇÃO DE SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para anon e authenticated (sistema de agência interno)
DROP POLICY IF EXISTS "Acesso total public clients" ON public.clients;
CREATE POLICY "Acesso total public clients" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total public demands" ON public.demands;
CREATE POLICY "Acesso total public demands" ON public.demands FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total public services" ON public.services;
CREATE POLICY "Acesso total public services" ON public.services FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total public proposals" ON public.proposals;
CREATE POLICY "Acesso total public proposals" ON public.proposals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total public invoices" ON public.invoices;
CREATE POLICY "Acesso total public invoices" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total public kanban_columns" ON public.kanban_columns;
CREATE POLICY "Acesso total public kanban_columns" ON public.kanban_columns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total public team_members" ON public.team_members;
CREATE POLICY "Acesso total public team_members" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Notificar PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
`;

/**
 * Utilitário de auto-cura para upserts no Supabase.
 * Se o PostgREST rejeitar com "Could not find the 'xyz' column of 'table' in the schema cache",
 * remove a coluna não existente e tenta novamente de forma transparente.
 * Se ocorrer erro de trigger PL/pgSQL (ex: record "new" has no field "updated_at", código 42703),
 * executa auto-recuperação atômica via delete + insert para contornar o trigger de BEFORE UPDATE.
 */
async function resilientSupabaseUpsert(
  supabase: any,
  tableName: string,
  payload: any | any[],
  maxRetries = 15
): Promise<{ data: any; error: any }> {
  let currentPayload = Array.isArray(payload)
    ? payload.map(item => ({ ...item }))
    : { ...payload };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await supabase.from(tableName).upsert(currentPayload);

    if (!error) {
      return { data, error: null };
    }

    // 1. Identifica mensagens de coluna ausente do PostgREST
    // Exemplo: Could not find the 'address' column of 'clients' in the schema cache
    const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/i);

    if (missingColMatch && missingColMatch[1]) {
      const missingCol = missingColMatch[1];
      console.warn(`[Supabase Auto-Heal] Removendo coluna ausente "${missingCol}" da tabela "${tableName}" para garantir sincronização imediata.`);

      if (Array.isArray(currentPayload)) {
        currentPayload = currentPayload.map(item => {
          const clone = { ...item };
          delete clone[missingCol];
          return clone;
        });
      } else {
        delete currentPayload[missingCol];
      }
      continue;
    }

    // 2. Identifica erro de trigger PL/pgSQL com campo inexistente no registro "new" (ex: record "new" has no field "updated_at")
    // Este erro ocorre em UPDATE / UPSERT quando um trigger BEFORE UPDATE no PostgreSQL tenta ler/gravar uma coluna que
    // não existe na tabela. Como INSERT não dispara triggers BEFORE UPDATE, auto-curamos via delete + insert atômico.
    const triggerFieldMatch = error.message?.match(/record "(?:new|old)" has no field "([^"]+)"/i);
    const isUndefinedColumn = error.code === '42703' || (error.message && error.message.includes('has no field'));

    if (triggerFieldMatch || isUndefinedColumn) {
      const badField = triggerFieldMatch ? triggerFieldMatch[1] : 'updated_at';
      console.warn(`[Supabase Auto-Heal] Trigger no PostgreSQL falhou por coluna ausente "${badField}" na tabela "${tableName}". Executando auto-recuperação...`);

      // Remove a coluna ofensiva do payload
      if (Array.isArray(currentPayload)) {
        currentPayload = currentPayload.map(item => {
          const clone = { ...item };
          delete clone[badField];
          return clone;
        });
      } else {
        delete currentPayload[badField];
      }

      // Se for um item individual com ID, deleta o registro antigo e reinsere com dados atualizados
      if (!Array.isArray(currentPayload) && currentPayload.id) {
        const targetId = currentPayload.id;
        const { error: delError } = await supabase.from(tableName).delete().eq('id', targetId);
        if (!delError) {
          const { data: insData, error: insError } = await supabase.from(tableName).insert(currentPayload);
          if (!insError) {
            console.log(`[Supabase Auto-Heal] Registro ${targetId} salvo com sucesso na tabela "${tableName}" após auto-recuperação.`);
            return { data: insData, error: null };
          }
          console.warn(`[Supabase Auto-Heal] Falha no insert após delete para ${targetId}:`, insError);
        } else {
          console.warn(`[Supabase Auto-Heal] Falha no delete para ${targetId}:`, delError);
        }
      } else if (Array.isArray(currentPayload) && currentPayload.length > 0) {
        let allSuccess = true;
        for (const item of currentPayload) {
          if (item.id) {
            await supabase.from(tableName).delete().eq('id', item.id);
            const { error: insError } = await supabase.from(tableName).insert(item);
            if (insError) {
              allSuccess = false;
              console.warn(`[Supabase Auto-Heal] Erro ao reinserir item em lote ${item.id}:`, insError);
            }
          }
        }
        if (allSuccess) {
          return { data: currentPayload, error: null };
        }
      }
    }

    return { data, error };
  }

  return { data: null, error: new Error(`Não foi possível ajustar o payload para a tabela ${tableName}`) };
}

export const supabaseService = {
  isAvailable(): boolean {
    return getSupabaseClient() !== null;
  },

  isConfigured(): boolean {
    const supabase = getSupabaseClient();
    return !!supabase;
  },

  // ==================================================================
  // DEMANDAS (KANBAN)
  // ==================================================================
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
        thumbnail: row.thumbnail || undefined,
        statusLabel: row.status_label || undefined,
        checklistTotal: row.checklist_total ?? 0,
        checklistCompleted: row.checklist_completed ?? 0,
        commentsCount: row.comments_count ?? 0,
        attachmentsCount: row.attachments_count ?? 0,
        approvalStatus: row.approval_status || undefined,
        approvalFeedback: row.approval_feedback || undefined,
        approvalSentAt: row.approval_sent_at || undefined,
        approvalAnsweredAt: row.approval_answered_at || undefined,
        clientPortalToken: row.client_portal_token || undefined,
        whatsappNotified: Boolean(row.whatsapp_notified),
        attachments: row.attachments || [],
      }));
    } catch (e) {
      console.error('Exceção ao buscar demandas no Supabase:', e);
      return null;
    }
  },

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
        thumbnail: demand.thumbnail || null,
        status_label: demand.statusLabel || null,
        checklist_total: demand.checklistTotal ?? 0,
        checklist_completed: demand.checklistCompleted ?? 0,
        comments_count: demand.commentsCount ?? 0,
        attachments_count: demand.attachmentsCount ?? (demand.attachments?.length || 0),
        approval_status: demand.approvalStatus || null,
        approval_feedback: demand.approvalFeedback || null,
        approval_sent_at: demand.approvalSentAt || null,
        approval_answered_at: demand.approvalAnsweredAt || null,
        client_portal_token: demand.clientPortalToken || null,
        whatsapp_notified: Boolean(demand.whatsappNotified),
        attachments: demand.attachments || [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await resilientSupabaseUpsert(supabase, 'demands', payload);
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

  // ==================================================================
  // CLIENTES (CRM)
  // ==================================================================
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
        personType: row.person_type || 'juridica',
        name: row.name,
        cpfCnpj: row.cpf_cnpj || undefined,
        companyName: row.company_name || row.name,
        segment: row.segment || 'Geral',
        contactName: row.contact_name || row.name,
        contactRole: row.contact_role || undefined,
        email: row.email || '',
        emails: Array.isArray(row.emails) ? row.emails : [],
        phone: row.phone || '',
        phones: Array.isArray(row.phones) ? row.phones : [],
        birthDate: row.birth_date || undefined,
        coverColor: row.cover_color || undefined,
        avatar: row.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        status: (row.status as any) || 'Ativo',
        monthlyFee: Number(row.monthly_fee) || 0,
        services: Array.isArray(row.services) ? row.services : ['Social Media'],
        activeDemandsCount: Number(row.active_demands_count) || 0,
        joinedDate: row.joined_date || undefined,
        website: row.website || undefined,
        instagram: row.instagram || undefined,
        address: row.address || undefined,
        cep: row.cep || undefined,
        street: row.street || undefined,
        number: row.number || undefined,
        complement: row.complement || undefined,
        neighborhood: row.neighborhood || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        notes: row.notes || undefined,
        history: Array.isArray(row.history) ? row.history : [],
        lgpdConsentDate: row.lgpd_consent_date || undefined,
        lgpdConsentPurpose: row.lgpd_consent_purpose || undefined,
        isAnonymized: Boolean(row.is_anonymized),
        anonymizedAt: row.anonymized_at || undefined,
      }));
    } catch (e) {
      console.error('Exceção ao buscar clientes no Supabase:', e);
      return null;
    }
  },

  async upsertClient(client: Client): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: client.id,
        person_type: client.personType || 'juridica',
        name: client.name,
        cpf_cnpj: client.cpfCnpj || null,
        company_name: client.companyName || client.name,
        segment: client.segment || 'Geral',
        contact_name: client.contactName || client.name,
        contact_role: client.contactRole || null,
        email: client.email || null,
        emails: client.emails || [],
        phone: client.phone || null,
        phones: client.phones || [],
        birth_date: client.birthDate || null,
        cover_color: client.coverColor || null,
        avatar: client.avatar || null,
        status: client.status || 'Ativo',
        monthly_fee: client.monthlyFee || 0,
        services: client.services || [],
        active_demands_count: client.activeDemandsCount || 0,
        joined_date: client.joinedDate || null,
        website: client.website || null,
        instagram: client.instagram || null,
        address: client.address || null,
        cep: client.cep || null,
        street: client.street || null,
        number: client.number || null,
        complement: client.complement || null,
        neighborhood: client.neighborhood || null,
        city: client.city || null,
        state: client.state || null,
        notes: client.notes || null,
        history: client.history || [],
        lgpd_consent_date: client.lgpdConsentDate || null,
        lgpd_consent_purpose: client.lgpdConsentPurpose || null,
        is_anonymized: Boolean(client.isAnonymized),
        anonymized_at: client.anonymizedAt || null,
      };

      const { error } = await resilientSupabaseUpsert(supabase, 'clients', payload);
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

  // ==================================================================
  // SERVIÇOS
  // ==================================================================
  async fetchServices(): Promise<Service[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return null;

      return (data || []).map((row: any): Service => ({
        id: row.id,
        title: row.title,
        category: row.category || 'Social Media',
        description: row.description || '',
        basePrice: Number(row.base_price) || 0,
        isMonthly: Boolean(row.is_monthly),
        deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
        activeClientsCount: Number(row.active_clients_count) || 0,
      }));
    } catch {
      return null;
    }
  },

  async upsertService(service: Service): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: service.id,
        title: service.title,
        category: service.category,
        description: service.description || '',
        base_price: service.basePrice || 0,
        is_monthly: service.isMonthly,
        deliverables: service.deliverables || [],
        active_clients_count: service.activeClientsCount || 0,
        updated_at: new Date().toISOString(),
      };
      const { error } = await resilientSupabaseUpsert(supabase, 'services', payload);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteService(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ==================================================================
  // ORÇAMENTOS E PROPOSTAS
  // ==================================================================
  async fetchProposals(): Promise<BudgetProposal[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return null;

      return (data || []).map((row: any): BudgetProposal => ({
        id: row.id,
        code: row.code,
        clientName: row.client_name,
        projectName: row.project_name,
        totalValue: Number(row.total_value) || 0,
        date: row.date,
        status: (row.status as any) || 'Rascunho',
        servicesCount: Number(row.services_count) || 0,
      }));
    } catch {
      return null;
    }
  },

  async upsertProposal(proposal: BudgetProposal): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: proposal.id,
        code: proposal.code,
        client_name: proposal.clientName,
        project_name: proposal.projectName,
        total_value: proposal.totalValue || 0,
        date: proposal.date,
        status: proposal.status || 'Rascunho',
        services_count: proposal.servicesCount || 0,
        updated_at: new Date().toISOString(),
      };
      const { error } = await resilientSupabaseUpsert(supabase, 'proposals', payload);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteProposal(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ==================================================================
  // FATURAS / FINANCEIRO
  // ==================================================================
  async fetchInvoices(): Promise<Invoice[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return null;

      return (data || []).map((row: any): Invoice => ({
        id: row.id,
        client: row.client,
        clientInitial: row.client_initial || undefined,
        service: row.service,
        value: Number(row.value) || 0,
        dueDate: row.due_date,
        status: (row.status as any) || 'Pendente',
        category: row.category || 'Geral',
        paymentMethod: row.payment_method || 'PIX',
      }));
    } catch {
      return null;
    }
  },

  async upsertInvoice(invoice: Invoice): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: invoice.id,
        client: invoice.client,
        client_initial: invoice.clientInitial || null,
        service: invoice.service,
        value: invoice.value || 0,
        due_date: invoice.dueDate,
        status: invoice.status || 'Pendente',
        category: invoice.category || 'Geral',
        payment_method: invoice.paymentMethod || 'PIX',
        updated_at: new Date().toISOString(),
      };
      const { error } = await resilientSupabaseUpsert(supabase, 'invoices', payload);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteInvoice(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ==================================================================
  // MEMBROS DA EQUIPE
  // ==================================================================
  async fetchTeamMembers(): Promise<TeamMember[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Erro ao buscar membros no Supabase:', error);
        return null;
      }

      // Recupera cache local para proteger senhas e usuários caso o banco ainda não tenha as colunas
      let localMembers: TeamMember[] = [];
      try {
        const saved = localStorage.getItem('agency_team_members');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localMembers = parsed;
        }
      } catch {}

      return (data || []).map((row: any): TeamMember => {
        const localMatch = localMembers.find((l) => l.id === row.id);
        const isOwner = row.id === 'tm-1' || String(row.name || '').toLowerCase().includes('marcos lancerotti');

        return {
          id: row.id,
          name: row.name,
          role: row.role,
          functionRole: row.function_role || row.role,
          email: row.email,
          avatar: row.avatar || '',
          activeTasks: Number(row.active_tasks) || 0,
          status: (row.status as any) || 'Disponível',
          specialties: Array.isArray(row.specialties) ? row.specialties : [],
          username: row.username || localMatch?.username || (isOwner ? 'lancerotti' : undefined),
          password: row.password || localMatch?.password || (isOwner ? '521Spide#*' : '123456'),
          createdBy: row.created_by || undefined,
          createdAt: row.created_at || undefined,
        };
      });
    } catch {
      return null;
    }
  },

  async upsertTeamMember(member: TeamMember): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: member.id,
        name: member.name,
        role: member.role,
        function_role: member.functionRole || member.role,
        email: member.email,
        avatar: member.avatar || '',
        active_tasks: member.activeTasks || 0,
        status: member.status || 'Disponível',
        specialties: member.specialties || [],
        username: member.username || null,
        password: member.password || null,
        created_by: member.createdBy || null,
      };
      const { error } = await resilientSupabaseUpsert(supabase, 'team_members', payload);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteTeamMember(id: string): Promise<boolean> {
    // Proteção absoluta: Marcos Lancerotti (Dono da Agência) nunca pode ser excluído
    if (id === 'tm-1') {
      console.warn('Ação bloqueada no Supabase: Marcos Lancerotti é o Dono da Agência e não pode ser excluído.');
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ==================================================================
  // COLUNAS DO KANBAN
  // ==================================================================
  async fetchKanbanColumns(): Promise<KanbanColumn[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position_order', { ascending: true });

      if (error) return null;

      return (data || []).map((row: any): KanbanColumn => ({
        id: row.id,
        title: row.title,
        count: 0,
        color: row.color,
        buttonBg: row.button_bg,
        isCustom: Boolean(row.is_custom),
      }));
    } catch {
      return null;
    }
  },

  async upsertKanbanColumn(column: KanbanColumn, positionOrder = 0): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload = {
        id: column.id,
        title: column.title,
        color: column.color,
        button_bg: column.buttonBg,
        is_custom: Boolean(column.isCustom),
        position_order: positionOrder,
      };
      const { error } = await resilientSupabaseUpsert(supabase, 'kanban_columns', payload);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteKanbanColumn(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ==================================================================
  // MIGRAÇÃO E SINCRONIZAÇÃO COMPLETA DE TODO O SISTEMA
  // ==================================================================
  async syncAllLocalDataToSupabase(
    demands: DemandItem[], 
    clients: Client[],
    customUrl?: string,
    customKey?: string,
    services?: Service[],
    proposals?: BudgetProposal[],
    invoices?: Invoice[],
    teamMembers?: TeamMember[],
    kanbanColumns?: KanbanColumn[]
  ): Promise<SyncResult> {
    const supabase = getSupabaseClient(customUrl, customKey);
    const result: SyncResult = { 
      clientsUploaded: 0, 
      demandsUploaded: 0, 
      servicesUploaded: 0, 
      proposalsUploaded: 0, 
      invoicesUploaded: 0, 
      teamMembersUploaded: 0,
      kanbanColumnsUploaded: 0,
      errors: [] 
    };

    if (!supabase) {
      result.errors.push('Cliente Supabase não configurado. Preencha URL e Chave.');
      return result;
    }

    // 1. Clientes com auto-cura para colunas antigas
    if (clients && clients.length > 0) {
      try {
        const clientPayloads = clients.map(c => ({
          id: c.id,
          person_type: c.personType || 'juridica',
          name: c.name,
          cpf_cnpj: c.cpfCnpj || null,
          company_name: c.companyName || c.name,
          segment: c.segment || 'Geral',
          contact_name: c.contactName || c.name,
          contact_role: c.contactRole || null,
          email: c.email || null,
          emails: c.emails || [],
          phone: c.phone || null,
          phones: c.phones || [],
          birth_date: c.birthDate || null,
          cover_color: c.coverColor || null,
          avatar: c.avatar || null,
          status: c.status || 'Ativo',
          monthly_fee: c.monthlyFee || 0,
          services: c.services || [],
          active_demands_count: c.activeDemandsCount || 0,
          joined_date: c.joinedDate || null,
          website: c.website || null,
          instagram: c.instagram || null,
          address: c.address || null,
          cep: c.cep || null,
          street: c.street || null,
          number: c.number || null,
          complement: c.complement || null,
          neighborhood: c.neighborhood || null,
          city: c.city || null,
          state: c.state || null,
          notes: c.notes || null,
          history: c.history || [],
          lgpd_consent_date: c.lgpdConsentDate || null,
          lgpd_consent_purpose: c.lgpdConsentPurpose || null,
          is_anonymized: Boolean(c.isAnonymized),
          anonymized_at: c.anonymizedAt || null,
        }));

        const { error } = await resilientSupabaseUpsert(supabase, 'clients', clientPayloads);
        if (error) {
          result.errors.push(`Erro na tabela clients: ${error.message}`);
        } else {
          result.clientsUploaded = clients.length;
        }
      } catch (err: any) {
        result.errors.push(`Falha no upload de clientes: ${err.message}`);
      }
    }

    // 2. Demandas com auto-cura para colunas antigas
    if (demands && demands.length > 0) {
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
          thumbnail: d.thumbnail || null,
          status_label: d.statusLabel || null,
          checklist_total: d.checklistTotal ?? 0,
          checklist_completed: d.checklistCompleted ?? 0,
          comments_count: d.commentsCount ?? 0,
          attachments_count: d.attachmentsCount ?? (d.attachments?.length || 0),
          approval_status: d.approvalStatus || null,
          approval_feedback: d.approvalFeedback || null,
          approval_sent_at: d.approvalSentAt || null,
          approval_answered_at: d.approvalAnsweredAt || null,
          client_portal_token: d.clientPortalToken || null,
          whatsapp_notified: Boolean(d.whatsappNotified),
          attachments: d.attachments || [],
          updated_at: new Date().toISOString(),
        }));

        const { error } = await resilientSupabaseUpsert(supabase, 'demands', demandPayloads);
        if (error) {
          result.errors.push(`Erro na tabela demands: ${error.message}`);
        } else {
          result.demandsUploaded = demands.length;
        }
      } catch (err: any) {
        result.errors.push(`Falha no upload de demandas: ${err.message}`);
      }
    }

    // 3. Serviços (catálogo)
    if (services && services.length > 0) {
      try {
        const servicePayloads = services.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category,
          description: s.description || '',
          base_price: s.basePrice || 0,
          is_monthly: s.isMonthly,
          deliverables: s.deliverables || [],
          active_clients_count: s.activeClientsCount || 0,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await resilientSupabaseUpsert(supabase, 'services', servicePayloads);
        if (!error) result.servicesUploaded = services.length;
      } catch {}
    }

    // 4. Propostas e Orçamentos
    if (proposals && proposals.length > 0) {
      try {
        const proposalPayloads = proposals.map(p => ({
          id: p.id,
          code: p.code,
          client_name: p.clientName,
          project_name: p.projectName,
          total_value: p.totalValue || 0,
          date: p.date,
          status: p.status || 'Rascunho',
          services_count: p.servicesCount || 0,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await resilientSupabaseUpsert(supabase, 'proposals', proposalPayloads);
        if (!error) result.proposalsUploaded = proposals.length;
      } catch {}
    }

    // 5. Faturas (Financeiro)
    if (invoices && invoices.length > 0) {
      try {
        const invoicePayloads = invoices.map(i => ({
          id: i.id,
          client: i.client,
          client_initial: i.clientInitial || null,
          service: i.service,
          value: i.value || 0,
          due_date: i.dueDate,
          status: i.status || 'Pendente',
          category: i.category || 'Geral',
          payment_method: i.paymentMethod || 'PIX',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await resilientSupabaseUpsert(supabase, 'invoices', invoicePayloads);
        if (!error) result.invoicesUploaded = invoices.length;
      } catch {}
    }

    // 6. Membros da Equipe (incluindo CEO e colaboradores)
    if (teamMembers && teamMembers.length > 0) {
      try {
        const teamPayloads = teamMembers.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          function_role: m.functionRole || m.role,
          email: m.email,
          avatar: m.avatar || '',
          active_tasks: m.activeTasks || 0,
          status: m.status || 'Disponível',
          specialties: m.specialties || [],
          username: m.username || null,
          password: m.password || null,
          created_by: m.createdBy || null,
        }));
        const { error } = await resilientSupabaseUpsert(supabase, 'team_members', teamPayloads);
        if (error) {
          result.errors.push(`Erro na tabela team_members: ${error.message}`);
        } else {
          result.teamMembersUploaded = teamMembers.length;
        }
      } catch (err: any) {
        result.errors.push(`Falha no upload de equipe: ${err.message}`);
      }
    }

    // 7. Colunas do Kanban
    if (kanbanColumns && kanbanColumns.length > 0) {
      try {
        const columnPayloads = kanbanColumns.map((col, idx) => ({
          id: col.id,
          title: col.title,
          color: col.color,
          button_bg: col.buttonBg,
          is_custom: Boolean(col.isCustom),
          position_order: idx + 1,
        }));
        const { error } = await resilientSupabaseUpsert(supabase, 'kanban_columns', columnPayloads);
        if (!error) result.kanbanColumnsUploaded = kanbanColumns.length;
      } catch {}
    }

    return result;
  },

  async syncCompleteSystem(payload: FullSyncPayload, customUrl?: string, customKey?: string): Promise<SyncResult> {
    return this.syncAllLocalDataToSupabase(
      payload.demands || [],
      payload.clients || [],
      customUrl,
      customKey,
      payload.services || [],
      payload.proposals || [],
      payload.invoices || [],
      payload.teamMembers || [],
      payload.kanbanColumns || []
    );
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

      const clientPayload = {
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
      };

      const { error: clientErr } = await resilientSupabaseUpsert(supabase, 'clients', clientPayload);

      if (clientErr) {
        if (clientErr.message?.includes('relation "public.clients" does not exist') || clientErr.code === '42P01') {
          return { success: false, message: 'A tabela "clients" não foi encontrada. Lembre-se de rodar o Script SQL no menu SQL Editor do Supabase.' };
        }
        return { success: false, message: `Erro ao gravar cliente de teste: ${clientErr.message}` };
      }

      const demandPayload = {
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
      };

      const { error: demandErr } = await resilientSupabaseUpsert(supabase, 'demands', demandPayload);

      if (demandErr) {
        if (demandErr.message?.includes('relation "public.demands" does not exist') || demandErr.code === '42P01') {
          return { success: false, message: 'A tabela "demands" não foi encontrada. Lembre-se de rodar o Script SQL no menu SQL Editor do Supabase.' };
        }
        return { success: false, message: `Erro ao gravar demanda de teste: ${demandErr.message}` };
      }

      return { 
        success: true, 
        message: 'Registros de teste inseridos com sucesso! Você já pode ver as linhas em "Table Editor" no painel do Supabase.' 
      };
    } catch (e: any) {
      return { success: false, message: `Exceção ao inserir teste: ${e.message}` };
    }
  }
};
