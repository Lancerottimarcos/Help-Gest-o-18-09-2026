import { PageId, UserProfile, TeamMember } from '../types';
import { isOwnerOrMarcos } from './securityProtocols';

export interface MemberPermissions {
  clientes: boolean;
  servicos: boolean;
  financeiro: boolean;
  orcamentos: boolean;
  equipe: boolean;
  configuracoes: boolean;
  inicio?: boolean;
  demandas?: boolean;
  calendario?: boolean;
}

export type RestrictedPageKey = 'clientes' | 'servicos' | 'financeiro' | 'orcamentos' | 'equipe' | 'configuracoes';

export interface RestrictedPageConfig {
  id: RestrictedPageKey;
  label: string;
  shortDescription: string;
}

export const RESTRICTED_PAGES_CONFIG: RestrictedPageConfig[] = [
  {
    id: 'clientes',
    label: 'Página de Clientes',
    shortDescription: 'Visualizar carteira, cadastros, histórico e contatos de clientes',
  },
  {
    id: 'servicos',
    label: 'Página de Serviços',
    shortDescription: 'Catálogo de produtos da agência, preços tabelados e entregáveis',
  },
  {
    id: 'financeiro',
    label: 'Página de Financeiro',
    shortDescription: 'Faturamento, contas, gráficos de receita, fluxo de caixa e exportação',
  },
  {
    id: 'orcamentos',
    label: 'Página de Orçamento',
    shortDescription: 'Propostas comerciais, precificação, envio e aprovações de orçamentos',
  },
  {
    id: 'equipe',
    label: 'Página de Equipe',
    shortDescription: 'Gestão de colaboradores, cargos, senhas de login e permissões',
  },
  {
    id: 'configuracoes',
    label: 'Página de Configurações',
    shortDescription: 'Segurança, integrações, chaves de API, banco de dados e dados da agência',
  },
];

/**
 * Regra padrão para novos colaboradores adicionados:
 * Todas as páginas sensíveis/estratégicas vêm bloqueadas por padrão.
 */
export const DEFAULT_NEW_COLLABORATOR_PERMISSIONS: MemberPermissions = {
  clientes: false,
  servicos: false,
  financeiro: false,
  orcamentos: false,
  equipe: false,
  configuracoes: false,
  inicio: true,
  demandas: true,
  calendario: true,
};

export const STORAGE_DEFAULT_NEW_MEMBER_PERMISSIONS_KEY = 'agency_default_new_member_permissions';

/**
 * Obtém a regra padrão configurada pelo administrador para novos colaboradores.
 * Se nenhuma estiver salva, retorna a regra solicitada com as 6 páginas bloqueadas.
 */
export function getDefaultNewMemberPermissions(): MemberPermissions {
  try {
    const saved = localStorage.getItem(STORAGE_DEFAULT_NEW_MEMBER_PERMISSIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        clientes: parsed.clientes ?? false,
        servicos: parsed.servicos ?? false,
        financeiro: parsed.financeiro ?? false,
        orcamentos: parsed.orcamentos ?? false,
        equipe: parsed.equipe ?? false,
        configuracoes: parsed.configuracoes ?? false,
        inicio: parsed.inicio ?? true,
        demandas: parsed.demandas ?? true,
        calendario: parsed.calendario ?? true,
      };
    }
  } catch {}
  return { ...DEFAULT_NEW_COLLABORATOR_PERMISSIONS };
}

/**
 * Salva a nova regra padrão para novos colaboradores que forem adicionados.
 */
export function saveDefaultNewMemberPermissions(perms: MemberPermissions): void {
  try {
    localStorage.setItem(
      STORAGE_DEFAULT_NEW_MEMBER_PERMISSIONS_KEY,
      JSON.stringify(perms)
    );
  } catch {}
}

export function getRestrictedPageName(key: string): string {
  switch (key) {
    case 'clientes':
      return 'Página de Clientes';
    case 'servicos':
      return 'Página de Serviços';
    case 'financeiro':
      return 'Página de Financeiro';
    case 'orcamentos':
      return 'Página de Orçamento';
    case 'equipe':
      return 'Página de Equipe';
    case 'configuracoes':
      return 'Página de Configurações';
    case 'inicio':
      return 'Página de Início';
    case 'demandas':
      return 'Página de Demandas (Kanban)';
    case 'calendario':
      return 'Página de Datas Comemorativas';
    default:
      return key;
  }
}

export const FULL_ACCESS_PERMISSIONS: MemberPermissions = {
  clientes: true,
  servicos: true,
  financeiro: true,
  orcamentos: true,
  equipe: true,
  configuracoes: true,
  inicio: true,
  demandas: true,
  calendario: true,
};

export const OPERATIONAL_LEADER_PERMISSIONS: MemberPermissions = {
  clientes: true,
  servicos: true,
  financeiro: false,
  orcamentos: false,
  equipe: false,
  configuracoes: false,
  inicio: true,
  demandas: true,
  calendario: true,
};

/**
 * Obtém as permissões efetivas de um usuário ou colaborador.
 * Proprietário (Marcos Lancerotti) possui sempre acesso total.
 */
export function getEffectivePermissions(
  userOrMember?: UserProfile | TeamMember | null
): MemberPermissions {
  if (!userOrMember) {
    return { ...DEFAULT_NEW_COLLABORATOR_PERMISSIONS };
  }

  // Se for o dono ou Marcos Lancerotti, tem acesso irrestrito
  if (
    isOwnerOrMarcos(userOrMember) ||
    (userOrMember as UserProfile).role === 'proprietario' ||
    (userOrMember as any).isMaster
  ) {
    return { ...FULL_ACCESS_PERMISSIONS };
  }

  // Se tiver permissões customizadas salvas
  if (userOrMember.permissions) {
    return {
      clientes: userOrMember.permissions.clientes ?? false,
      servicos: userOrMember.permissions.servicos ?? false,
      financeiro: userOrMember.permissions.financeiro ?? false,
      orcamentos: userOrMember.permissions.orcamentos ?? false,
      equipe: userOrMember.permissions.equipe ?? false,
      configuracoes: userOrMember.permissions.configuracoes ?? false,
      inicio: userOrMember.permissions.inicio ?? true,
      demandas: userOrMember.permissions.demandas ?? true,
      calendario: userOrMember.permissions.calendario ?? true,
    };
  }

  // Padrão seguro para qualquer colaborador sem permissão explícita
  return { ...DEFAULT_NEW_COLLABORATOR_PERMISSIONS };
}

/**
 * Verifica se um usuário possui autorização para abrir determinada página.
 */
export function canAccessPage(page: PageId, userOrMember?: UserProfile | TeamMember | null): boolean {
  if (!userOrMember) return false;

  // Início, demandas operacionais, datas comemorativas, APIs, Produção, Comunicação, Agenda e Gestão são sempre acessíveis
  if (page === 'inicio' || page === 'demandas' || page === 'calendario' || page === 'apis' || page === 'producao' || page === 'comunicacao' || page === 'agenda' || page === 'gestao') {
    return true;
  }

  if (page === 'portal-cliente') {
    return false; // Desabilitado em breve
  }

  // Dono da agência
  if (
    isOwnerOrMarcos(userOrMember) ||
    (userOrMember as UserProfile).role === 'proprietario' ||
    (userOrMember as any).isMaster
  ) {
    return true;
  }

  const perms = getEffectivePermissions(userOrMember);
  const key = page as RestrictedPageKey;
  return Boolean(perms[key]);
}

/**
 * Conta quantas páginas das 6 principais estão bloqueadas
 */
export function countBlockedPages(permissions?: MemberPermissions | null): number {
  if (!permissions) return 6;
  const keys: RestrictedPageKey[] = ['clientes', 'servicos', 'financeiro', 'orcamentos', 'equipe', 'configuracoes'];
  return keys.filter((k) => !permissions[k]).length;
}

/**
 * Retorna rótulo amigável do status de acesso
 */
export function getAccessLevelLabel(permissions?: MemberPermissions | null, isOwner = false): {
  label: string;
  badgeClass: string;
  blockedCount: number;
} {
  if (isOwner) {
    return {
      label: 'Acesso Irrestrito (Dono)',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      blockedCount: 0,
    };
  }

  const blockedCount = countBlockedPages(permissions);

  if (blockedCount === 6) {
    return {
      label: 'Regra Padrão (6 Bloqueios)',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      blockedCount: 6,
    };
  }

  if (blockedCount === 0) {
    return {
      label: 'Acesso Total Liberado',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      blockedCount: 0,
    };
  }

  return {
    label: `${6 - blockedCount} Liberadas • ${blockedCount} Bloqueadas`,
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    blockedCount,
  };
}
