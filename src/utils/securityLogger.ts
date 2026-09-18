/**
 * Protocolos de Segurança e Privacidade de Dados (LGPD / Art. 7º e 18)
 * 
 * 1. Minimização de Dados: Coleta estrita de CPF/Endereço somente quando necessário (ex: nota fiscal/contrato).
 * 2. Prevenção de Vazamento em Logs: Bloqueio e sanitização ativa de dados sensíveis em logs de console e telemetria.
 * 3. Gestão dos Direitos do Titular: Exportação completa do dossiê (portabilidade) e exclusão/anonimização (direito ao esquecimento).
 */

import { Client, DemandItem, Invoice } from '../types';

// Regex patterns para detecção de dados sensíveis
const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_PATTERN = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const CEP_PATTERN = /\b\d{5}-?\d{3}\b/g;

const SENSITIVE_KEYS = new Set([
  'cpf',
  'cpfcnpj',
  'cnpj',
  'rg',
  'address',
  'endereco',
  'street',
  'rua',
  'number',
  'numero',
  'complement',
  'complemento',
  'cep',
  'birthdate',
  'datanascimento',
]);

/**
 * Sanitiza valores de texto substituindo padrões de CPF/CNPJ/CEP por máscaras de segurança
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(CPF_PATTERN, '[CPF_PROTEGIDO_LGPD]')
    .replace(CNPJ_PATTERN, '[CNPJ_PROTEGIDO_LGPD]')
    .replace(CEP_PATTERN, '[CEP_PROTEGIDO_LGPD]');
}

/**
 * Sanitiza recursivamente objetos removendo ou mascarando chaves e valores sensíveis para logs
 */
export function sanitizeForLog(data: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH_REACHED]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLog(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitizedObj[key] = '[DADO_SENSIVEL_OMITIDO_EM_LOG]';
      } else {
        sanitizedObj[key] = sanitizeForLog(val, depth + 1);
      }
    }
    return sanitizedObj;
  }

  return data;
}

/**
 * Logger seguro que garante a sanitização total de dados sensíveis
 */
export const secureLogger = {
  info: (message: string, ...args: unknown[]) => {
    const sanitized = args.map((a) => sanitizeForLog(a));
    console.info(`[SEGURANÇA-LGPD] ${sanitizeString(message)}`, ...sanitized);
  },
  warn: (message: string, ...args: unknown[]) => {
    const sanitized = args.map((a) => sanitizeForLog(a));
    console.warn(`[SEGURANÇA-LGPD] ${sanitizeString(message)}`, ...sanitized);
  },
  error: (message: string, ...args: unknown[]) => {
    const sanitized = args.map((a) => sanitizeForLog(a));
    console.error(`[SEGURANÇA-LGPD] ${sanitizeString(message)}`, ...sanitized);
  },
};

/**
 * Instala filtro interceptor no console global do navegador para impedir
 * vazamento inadvertido de dados sensíveis de CPF e endereço em runtime
 */
let isSecurityFilterInstalled = false;
export function installConsoleSecurityFilter(): void {
  if (isSecurityFilterInstalled || typeof window === 'undefined') return;
  isSecurityFilterInstalled = true;

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    const sanitized = args.map((arg) => sanitizeForLog(arg));
    originalLog.apply(console, sanitized);
  };

  console.info = (...args: unknown[]) => {
    const sanitized = args.map((arg) => sanitizeForLog(arg));
    originalInfo.apply(console, sanitized);
  };

  console.warn = (...args: unknown[]) => {
    const sanitized = args.map((arg) => sanitizeForLog(arg));
    originalWarn.apply(console, sanitized);
  };

  console.error = (...args: unknown[]) => {
    const sanitized = args.map((arg) => sanitizeForLog(arg));
    originalError.apply(console, sanitized);
  };
}

/**
 * Máscara visual para exibição de CPF em tela (prevenção contra visualização indevida / shoulder surfing)
 */
export function maskCpf(cpf?: string): string {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    // Retorna no formato 123.***.***-01
    return `${clean.slice(0, 3)}.***.***-${clean.slice(-2)}`;
  }
  if (clean.length === 14) {
    // CNPJ: 12.***.***/0001-34
    return `${clean.slice(0, 2)}.***.***/${clean.slice(8, 12)}-${clean.slice(-2)}`;
  }
  return '***.***.***-**';
}

/**
 * Máscara visual para exibição de endereço em tela
 */
export function maskAddress(address?: string): string {
  if (!address) return '';
  // Oculta número e dados detalhados para visualização rápida
  return address.replace(/,\s*\d+[^,]*/, ', [Nº Protegido]');
}

/**
 * Exportação de Dossiê Completo do Titular (LGPD Art. 18, II e V - Portabilidade e Acesso)
 * Gera download de arquivo estruturado em JSON com todos os dados registrados
 */
export function exportClientDossierJSON(
  client: Client,
  demands: DemandItem[] = [],
  invoices: Invoice[] = []
): void {
  const clientDemands = demands.filter(
    (d) =>
      d.client?.toLowerCase() === client.name?.toLowerCase() ||
      d.clientProject?.toLowerCase() === client.name?.toLowerCase()
  );

  const clientInvoices = invoices.filter(
    (inv) => inv.client?.toLowerCase() === client.name?.toLowerCase()
  );

  const dossier = {
    _relatorio: 'Dossiê de Dados do Titular (LGPD - Lei 13.709/2018)',
    _data_extracao: new Date().toISOString(),
    _responsavel_tratamento: 'Help Ideias Digitais',
    _base_legal: 'Art. 7º, V - Execução de Contrato e Procedimentos Preliminares',
    identificacao_titular: {
      id: client.id,
      tipo_pessoa: client.personType === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica',
      nome_razao_social: client.name,
      cpf_cnpj: client.cpfCnpj || 'Não coletado (Princípio da Minimização)',
      status_cadastro: client.status,
      data_cadastro: client.joinedDate || 'Não informado',
      anonimizado: !!client.isAnonymized,
      data_anonimizacao: client.anonymizedAt || null,
    },
    dados_contato: {
      email_principal: client.email,
      emails_secundarios: client.emails || [],
      telefone_principal: client.phone,
      telefones_secundarios: client.phones || [],
    },
    dados_localizacao_e_endereco: {
      cep: client.cep || 'Não coletado',
      logradouro: client.street || 'Não coletado',
      numero: client.number || 'Não coletado',
      complemento: client.complement || 'Não coletado',
      bairro: client.neighborhood || 'Não coletado',
      cidade: client.city || 'Não informado',
      estado: client.state || 'Não informado',
      endereco_formatado: client.address || 'Não coletado',
    },
    relacionamento_e_servicos: {
      segmento: client.segment,
      servicos_contratados: client.services || [],
      valor_mensalidade_mrr: client.monthlyFee || 0,
      notas_internas: client.notes || null,
      historico_eventos: client.history || [],
    },
    demandas_vinculadas: clientDemands.map((d) => ({
      id: d.id,
      titulo: d.title,
      categoria: d.serviceCategory,
      coluna_kanban: d.columnId,
      prazo: d.dueDate,
      status_aprovacao: d.approvalStatus || 'concluido',
    })),
    registros_financeiros: clientInvoices.map((inv) => ({
      id: inv.id,
      servico: inv.service,
      valor: inv.value,
      vencimento: inv.dueDate,
      status: inv.status,
    })),
    direitos_do_titular_lgpd: {
      artigo_18: [
        'I - Confirmação da existência de tratamento',
        'II - Acesso aos dados',
        'III - Correção de dados incompletos, inexatos ou desatualizados',
        'IV - Anonimização, bloqueio ou eliminação de dados desnecessários',
        'V - Portabilidade dos dados a outro fornecedor',
        'VI - Eliminação dos dados pessoais tratados com consentimento',
      ],
    },
  };

  const jsonStr = JSON.stringify(dossier, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = client.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.href = url;
  link.setAttribute('download', `dossie_titular_lgpd_${safeName}_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exportação em CSV resumido do Titular para auditoria
 */
export function exportClientDossierCSV(client: Client): void {
  const rows = [
    ['CAMPO', 'VALOR'],
    ['ID do Titular', client.id],
    ['Nome / Razão Social', client.name],
    ['Tipo de Pessoa', client.personType === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'],
    ['CPF/CNPJ', client.cpfCnpj || 'Não Coletado'],
    ['E-mail', client.email || ''],
    ['Telefone', client.phone || ''],
    ['CEP', client.cep || 'Não Coletado'],
    ['Endereço Completo', client.address || 'Não Coletado'],
    ['Cidade/UF', `${client.city || ''}/${client.state || ''}`],
    ['Segmento', client.segment || ''],
    ['Status', client.status],
    ['Data Cadastro', client.joinedDate || ''],
    ['Anonimizado', client.isAnonymized ? 'SIM' : 'NÃO'],
    ['Data da Extração', new Date().toLocaleString('pt-BR')],
  ];

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const safeName = client.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `relatorio_titular_lgpd_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Anonimização de Dados do Titular (LGPD Art. 18, IV e Art. 16)
 * Mantém identificadores de agregação operacional mas expurga irreversivelmente dados sensíveis
 */
export function anonymizeClient(client: Client): Client {
  const shortId = client.id.slice(-6);
  return {
    ...client,
    name: `Titular Anonimizado #${shortId}`,
    companyName: `Empresa Anonimizada #${shortId}`,
    contactName: `Contato Anonimizado #${shortId}`,
    cpfCnpj: undefined, // Expurgo do dado sensível
    email: `anonimizado-${shortId}@protegido-lgpd.local`,
    emails: [],
    phone: '(00) 00000-0000',
    phones: [],
    address: undefined, // Expurgo de endereço
    street: undefined,
    number: undefined,
    complement: undefined,
    neighborhood: undefined,
    cep: undefined,
    city: 'Região Anonimizada',
    state: 'BR',
    birthDate: undefined,
    notes: 'Dados sensíveis expurgados a pedido do titular conforme Art. 18 da LGPD.',
    isAnonymized: true,
    anonymizedAt: new Date().toISOString().split('T')[0],
  };
}
