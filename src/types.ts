export type PageId = 
  | 'inicio'
  | 'clientes'
  | 'servicos'
  | 'demandas'
  | 'calendario'
  | 'financeiro'
  | 'orcamentos'
  | 'equipe'
  | 'configuracoes'
  | 'portal-cliente';

export type UserRole = 'proprietario' | 'colaborador' | 'cliente';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  roleLabel: string;
  avatarUrl: string;
}

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

export type KanbanColumnId = 'ideias' | 'producao' | 'aprovacao' | 'agendamento' | 'concluidas' | string;

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  count: number;
  color: string;
  buttonBg: string;
  isCustom?: boolean;
}

export interface DemandAttachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // mime or file type: 'image' | 'video' | 'document' | 'other'
  url: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  verifiedClean?: boolean;
  threatScanStatus?: 'clean' | 'scanned';
}

export interface DemandItem {
  id: string;
  title: string;
  clientId?: string;
  client: string;
  clientProject?: string;
  description?: string;
  type: 'Post' | 'Meta Ads' | 'Des. de Site' | 'Logotipo' | 'Outros' | string;
  serviceCategory: 'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Design Geral';
  columnId: KanbanColumnId;
  priority: Priority;
  priorityBars: number; // 1 to 3
  dueDate: string;
  assignee: {
    name: string;
    avatar: string;
  };
  thumbnail?: string;
  statusLabel?: string;
  checklistTotal?: number;
  checklistCompleted?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  attachments?: DemandAttachment[];
  // Approval workflow fields
  approvalStatus?: 'pendente' | 'aprovado' | 'reprovado' | 'alteracao_solicitada';
  approvalFeedback?: string;
  approvalSentAt?: string;
  approvalAnsweredAt?: string;
  clientPortalToken?: string;
  whatsappNotified?: boolean;
  history?: {
    id: string;
    text: string;
    timestamp: string;
    author: string;
  }[];
  assigneeName?: string;
}

export interface ClientHistoryEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'contract' | 'delivery' | 'meeting' | 'note';
  author?: string;
}

export interface Client {
  id: string;
  personType?: 'fisica' | 'juridica';
  name: string; // Nome completo (PF) ou Razão Social / Nome Fantasia (PJ)
  cpfCnpj?: string;
  companyName: string;
  segment: string;
  contactName: string;
  contactRole?: string;
  email: string;
  emails?: string[];
  phone: string;
  phones?: string[];
  birthDate?: string;
  coverColor?: string;
  avatar: string;
  status: 'Ativo' | 'Pausado' | 'Cancelado' | 'Em Onboarding';
  monthlyFee: number;
  services: string[];
  activeDemandsCount: number;
  joinedDate?: string;
  website?: string;
  instagram?: string;
  address?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
  history?: ClientHistoryEvent[];
  // Protocolos de Segurança e Privacidade (LGPD)
  lgpdConsentDate?: string;
  lgpdConsentPurpose?: string;
  isAnonymized?: boolean;
  anonymizedAt?: string;
}

export interface Service {
  id: string;
  title: string;
  category: 'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Consultoria';
  description: string;
  basePrice: number;
  isMonthly: boolean;
  deliverables: string[];
  activeClientsCount: number;
}

export interface Invoice {
  id: string;
  client: string;
  clientInitial?: string;
  service: string;
  value: number;
  dueDate: string;
  status: 'Pago' | 'Pendente';
  category: string;
  paymentMethod: string;
}

export interface FinancialMetric {
  totalRevenue: number;
  recurringRevenue: number;
  expenses: number;
  netProfit: number;
  pendingInvoicesCount: number;
  pendingInvoicesValue: number;
}

export interface BudgetProposal {
  id: string;
  code: string;
  clientName: string;
  projectName: string;
  title?: string;
  totalValue: number;
  date: string;
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado';
  servicesCount: number;
  services?: string[];
}

export type TeamMemberRole = 
  | 'CEO'
  | 'Gestor de tráfego'
  | 'Social media'
  | 'Design'
  | 'Contador'
  | 'Vendedor'
  | 'Desenvolvedor web'
  | string;

export const TEAM_FUNCTION_OPTIONS = [
  'CEO',
  'Gestor de tráfego',
  'Social media',
  'Design',
  'Contador',
  'Vendedor',
  'Desenvolvedor web',
] as const;

export type TeamFunctionOption = typeof TEAM_FUNCTION_OPTIONS[number];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  functionRole?: TeamFunctionOption | string;
  email: string;
  avatar: string;
  activeTasks: number;
  status: 'Disponível' | 'Ocupado' | 'Férias';
  specialties: string[];
  username?: string;
  password?: string;
  createdAt?: string;
  createdBy?: string;
}

export type ActivityType = 
  | 'demand_created'
  | 'status_changed'
  | 'client_approval'
  | 'comment_feedback'
  | 'campaign_update'
  | 'deliverable_uploaded';

export interface ClientActivity {
  id: string;
  clientId?: string;
  clientName: string;
  clientAvatar?: string;
  demandId?: string;
  demandTitle: string;
  projectOrCampaign?: string;
  type: ActivityType;
  description: string;
  actor: {
    name: string;
    avatar: string;
    role?: string;
  };
  timestamp: string;
  relativeTime: string;
  badge: {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  };
}

export type NotificationTemplateId = 'friendly' | 'direct' | 'formal' | 'urgent' | 'custom';

export interface ApprovalNotificationConfig {
  autoOpenModalOnMove: boolean;
  defaultChannel: 'whatsapp' | 'email' | 'both';
  defaultTemplateId: NotificationTemplateId;
  customMessageTemplate?: string;
  agencySignature: string;
  autoSavePhoneToClient: boolean;
}

export type InicioSectionId = 
  | 'welcome' 
  | 'demandas_stories'
  | 'indicadores' 
  | 'prioridades'
  | 'aniversariantes' 
  | 'mapa';

export interface InicioSectionMeta {
  id: InicioSectionId;
  title: string;
  shortLabel: string;
  description: string;
  iconName: string;
}

export type CommemorativeDateCategory = 
  | 'todos'
  | 'comercial' 
  | 'feriado' 
  | 'redes_sociais' 
  | 'profissao_nicho' 
  | 'aniversario_cliente' 
  | 'personalizada';

export interface CommemorativeDate {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  day: number;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  category: 'comercial' | 'feriado' | 'redes_sociais' | 'profissao_nicho' | 'aniversario_cliente' | 'personalizada';
  categoryLabel: string;
  description: string;
  targetSegments?: string[];
  contentHook?: string;
  suggestedFormats?: ('Post' | 'Carrossel' | 'Reels / Vídeo' | 'Stories' | 'Campanha Tráfego')[];
  isHoliday?: boolean;
  isCustom?: boolean;
  clientRefId?: string;
}

export type NotificationType = 'system' | 'demand' | 'client' | 'calendar' | 'financial' | 'approval' | 'security';

export interface AgencyNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  targetPage?: PageId;
  actionLabel?: string;
}

