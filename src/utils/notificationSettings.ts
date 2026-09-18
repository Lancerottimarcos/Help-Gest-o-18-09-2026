import { ApprovalNotificationConfig, Client, DemandItem, NotificationTemplateId } from '../types';

export const DEFAULT_NOTIFICATION_CONFIG: ApprovalNotificationConfig = {
  autoOpenModalOnMove: true,
  defaultChannel: 'whatsapp',
  defaultTemplateId: 'friendly',
  agencySignature: 'Help Agência Digital',
  autoSavePhoneToClient: true,
  customMessageTemplate: `Olá, *{contato}*! 👋

A sua demanda *"{demanda}"* ({cliente}) está pronta e disponível para sua validação no *Portal do Cliente*.

Para aprovar ou solicitar ajustes com 1 clique, acesse o link:
👉 {link_portal}

Atenciosamente,
_{agencia}_`,
};

export interface TemplatePreset {
  id: NotificationTemplateId;
  label: string;
  description: string;
  badge: string;
  template: string;
}

export const NOTIFICATION_TEMPLATES: TemplatePreset[] = [
  {
    id: 'friendly',
    label: 'Padrão Amigável',
    description: 'Tom cordial e acolhedor, com instruções de aprovação e suporte.',
    badge: 'Recomendado',
    template: `Olá, *{contato}*! 👋

A sua demanda *"{demanda}"* ({cliente}) foi finalizada pela nossa equipe e já está disponível para a sua validação no *Portal do Cliente*.

Para visualizar a arte ou vídeo e registrar sua resposta com segurança, acesse o link direto abaixo:
👉 {link_portal}

No portal você pode escolher entre:
✅ *Aprovado* (libera para publicação/agendamento)
❌ *Reprovado*
✏️ *Fazer Alteração* (com campo direto para descrever o ajuste)

Qualquer dúvida, nossa equipe está à disposição!
_{agencia}_`,
  },
  {
    id: 'direct',
    label: 'Direto & Ágil',
    description: 'Mensagem curta e objetiva para clientes com comunicação dinâmica.',
    badge: 'Rápido',
    template: `Oi, *{contato}*! Tudo bem? 🚀

A demanda *"{demanda}"* de {cliente} está pronta para aprovação!

Por favor, valide no link direto:
👉 {link_portal}

Se precisar de qualquer alteração, é só registrar por lá.
_{agencia}_`,
  },
  {
    id: 'formal',
    label: 'Formal & Corporativo',
    description: 'Linguagem formal voltada para contas corporativas e diretoria.',
    badge: 'Corporativo',
    template: `Prezado(a) *{contato}*,

Informamos que a demanda *"{demanda}"* da empresa {cliente} concluiu a etapa de produção e encontra-se disponível para validação formal.

Acesse o portal institucional de aprovação no link abaixo:
{link_portal}

Prazo de validação sugerido: {prazo}

Atenciosamente,
_{agencia}_`,
  },
  {
    id: 'urgent',
    label: 'Alerta de Prazo / Urgência',
    description: 'Destaque prioritário quando a veiculação depende de aprovação imediata.',
    badge: 'Urgente',
    template: `⚠️ *ATENÇÃO: Demanda aguardando validação prioritária*

Olá, *{contato}*! A demanda *"{demanda}"* ({cliente}) precisa da sua aprovação hoje para mantermos o cronograma programado de publicação.

Acesse agora para aprovar com 1 clique:
👉 {link_portal}

Agradecemos a agilidade!
_{agencia}_`,
  },
  {
    id: 'custom',
    label: 'Personalizado',
    description: 'Seu modelo exclusivo configurado nas preferências da agência.',
    badge: 'Custom',
    template: DEFAULT_NOTIFICATION_CONFIG.customMessageTemplate || '',
  },
];

const STORAGE_KEY = 'help_agency_notification_config';

export function getNotificationConfig(): ApprovalNotificationConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(saved) };
    }
  } catch {
    // ignore parse error
  }
  return DEFAULT_NOTIFICATION_CONFIG;
}

export function saveNotificationConfig(config: ApprovalNotificationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage error
  }
}

export interface BuildMessageParams {
  templateId: NotificationTemplateId;
  customTemplateText?: string;
  contactName: string;
  clientName: string;
  demandTitle: string;
  demandType: string;
  dueDate: string;
  portalUrl: string;
  agencySignature?: string;
}

export function buildNotificationMessage(params: BuildMessageParams): string {
  const {
    templateId,
    customTemplateText,
    contactName,
    clientName,
    demandTitle,
    demandType,
    dueDate,
    portalUrl,
    agencySignature = 'Help Agência Digital',
  } = params;

  let rawTemplate: string;

  if (templateId === 'custom' && customTemplateText) {
    rawTemplate = customTemplateText;
  } else {
    const preset = NOTIFICATION_TEMPLATES.find((p) => p.id === templateId);
    rawTemplate = preset ? preset.template : NOTIFICATION_TEMPLATES[0].template;
  }

  return rawTemplate
    .replace(/{contato}/g, contactName || 'Cliente')
    .replace(/{cliente}/g, clientName || 'sua empresa')
    .replace(/{demanda}/g, demandTitle || 'Nova Demanda')
    .replace(/{tipo}/g, demandType || 'Material')
    .replace(/{prazo}/g, dueDate || 'A definir')
    .replace(/{link_portal}/g, portalUrl)
    .replace(/{agencia}/g, agencySignature);
}

export function formatWhatsAppCleanDigits(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits;
}
