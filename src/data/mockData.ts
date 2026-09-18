import { Client, DemandItem, KanbanColumn, Service, BudgetProposal, TeamMember, UserProfile, ClientActivity, Invoice } from '../types';

export const currentUser: UserProfile = {
  id: 'usr-1',
  name: 'Marcos Lancerotti',
  email: 'lancerottirmarcos@gmail.com',
  role: 'proprietario',
  roleLabel: 'Proprietário da Agência',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const kanbanColumnsData: KanbanColumn[] = [
  { id: 'ideias', title: 'Ideias', count: 0, color: '#EF4444', buttonBg: 'bg-red-500 hover:bg-red-600' },
  { id: 'producao', title: 'Em Produção', count: 0, color: '#8B5CF6', buttonBg: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'aprovacao', title: 'Aprovação', count: 0, color: '#FAB518', buttonBg: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'agendamento', title: 'Agendamento', count: 0, color: '#10B981', buttonBg: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'concluidas', title: 'Concluídas', count: 0, color: '#64748B', buttonBg: 'bg-slate-500 hover:bg-slate-600' },
];

export const initialDemands: DemandItem[] = [];

export const initialClients: Client[] = [];

export const initialServices: Service[] = [];

export const initialProposals: BudgetProposal[] = [];
 
export const initialInvoices: Invoice[] = [];

export const initialTeamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Marcos Lancerotti',
    role: 'Diretor / Estrategista Chefe',
    email: 'marcos@ideiasdigitais.com.br',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    activeTasks: 0,
    status: 'Disponível',
    specialties: ['Estratégia Digital', 'Comercial', 'Gestão'],
  },
  {
    id: 'tm-2',
    name: 'Beatriz Lima',
    role: 'Diretora de Arte / UI Designer',
    email: 'beatriz@ideiasdigitais.com.br',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    activeTasks: 0,
    status: 'Disponível',
    specialties: ['Social Media Design', 'Figma', 'Identidade Visual'],
  },
  {
    id: 'tm-3',
    name: 'Thiago Nogueira',
    role: 'Gestor de Tráfego / Growth Hacker',
    email: 'thiago@ideiasdigitais.com.br',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    activeTasks: 0,
    status: 'Disponível',
    specialties: ['Meta Ads', 'Google Ads', 'Analytics & Pixel'],
  },
  {
    id: 'tm-4',
    name: 'Lucas Rocha',
    role: 'Redator & Copywriter Publicitário',
    email: 'lucas@ideiasdigitais.com.br',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    activeTasks: 0,
    status: 'Disponível',
    specialties: ['Copywriting', 'Roteiros de Vídeo', 'Pautas'],
  },
  {
    id: 'tm-5',
    name: 'Matheus Costa',
    role: 'Desenvolvedor Full-Stack / Web',
    email: 'matheus@ideiasdigitais.com.br',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    activeTasks: 0,
    status: 'Disponível',
    specialties: ['React / Vite', 'Landing Pages', 'Integrações'],
  },
];

export const initialRecentActivities: ClientActivity[] = [];
