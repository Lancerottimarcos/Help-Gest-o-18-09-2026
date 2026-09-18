import { addSecurityLog } from './securityProtocols';

export interface BackupStats {
  demandsCount: number;
  clientsCount: number;
  servicesCount: number;
  proposalsCount: number;
  invoicesCount: number;
  logsCount: number;
  totalKeysCount: number;
  approximateSizeKb: number;
}

export interface BackupEnvelope {
  app: string;
  systemName: string;
  version: string;
  exportDate: string;
  exportTimestamp: number;
  exportedBy: string;
  environment: string;
  stats: BackupStats;
  data: Record<string, any>;
  checksum: string;
}

export const BACKUP_STORAGE_KEYS = [
  'agency_demands',
  'agency_clients',
  'agency_services',
  'agency_proposals',
  'agency_invoices',
  'agency_kanban_columns',
  'agency_custom_commemorative_dates',
  'agency_info_config',
  'help_agency_notification_config',
  'help_agency_notifications_v2',
  'help_agency_security_config',
  'help_agency_security_logs',
  'help_agency_dashboard_card_order',
  'help_agency_theme',
] as const;

/**
 * Computes a simple fast checksum for payload integrity verification
 */
function computeChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'chk_' + Math.abs(hash).toString(16);
}

/**
 * Collects current live data from localStorage and returns a complete structured backup envelope
 */
export function generateSystemBackup(exportedBy = 'lancerottirmarcos@gmail.com'): BackupEnvelope {
  const data: Record<string, any> = {};
  let totalKeys = 0;

  BACKUP_STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
        totalKeys++;
      }
    } catch (e) {
      console.warn(`Erro ao exportar chave ${key}:`, e);
    }
  });

  const demands = Array.isArray(data.agency_demands) ? data.agency_demands : [];
  const clients = Array.isArray(data.agency_clients) ? data.agency_clients : [];
  const services = Array.isArray(data.agency_services) ? data.agency_services : [];
  const proposals = Array.isArray(data.agency_proposals) ? data.agency_proposals : [];
  const invoices = Array.isArray(data.agency_invoices) ? data.agency_invoices : [];
  const logs = Array.isArray(data.help_agency_security_logs) ? data.help_agency_security_logs : [];

  const serializedData = JSON.stringify(data);
  const approximateSizeKb = Math.round((new Blob([serializedData]).size / 1024) * 10) / 10;

  const stats: BackupStats = {
    demandsCount: demands.length,
    clientsCount: clients.length,
    servicesCount: services.length,
    proposalsCount: proposals.length,
    invoicesCount: invoices.length,
    logsCount: logs.length,
    totalKeysCount: totalKeys,
    approximateSizeKb,
  };

  const now = new Date();
  const envelope: BackupEnvelope = {
    app: 'Help Ideias Digitais',
    systemName: 'Help Ideias Digitais - Agency OS',
    version: '2.5.0',
    exportDate: now.toISOString(),
    exportTimestamp: now.getTime(),
    exportedBy,
    environment: 'production-cloud-run',
    stats,
    data,
    checksum: computeChecksum(serializedData),
  };

  // Record audit log for security
  try {
    addSecurityLog({
      eventType: 'two_factor_verified',
      severity: 'info',
      title: 'Backup Manual do Sistema Gerado (JSON)',
      description: `Arquivo de backup gerado com sucesso contendo ${stats.demandsCount} demandas, ${stats.clientsCount} clientes, ${stats.invoicesCount} faturas e ${stats.totalKeysCount} chaves de armazenamento.`,
      source: 'Módulo de Backup & Recuperação de Desastres (DR)',
      threatDetails: `Integridade: ${envelope.checksum} | Tamanho: ~${approximateSizeKb} KB`,
    });
  } catch {}

  return envelope;
}

/**
 * Triggers a browser download of the backup JSON file
 */
export function downloadBackupJsonFile(backup: BackupEnvelope): void {
  const jsonContent = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date(backup.exportTimestamp)
    .toISOString()
    .slice(0, 16)
    .replace('T', '_')
    .replace(':', 'h');

  const filename = `help_ideias_digitais_backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  backup?: BackupEnvelope;
  stats?: BackupStats;
}

/**
 * Validates and inspects an uploaded JSON file before applying it to the system
 */
export function validateBackupJson(jsonString: string): BackupValidationResult {
  if (!jsonString || typeof jsonString !== 'string') {
    return { isValid: false, error: 'O arquivo está vazio ou inválido.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return { isValid: false, error: `Arquivo JSON mal formatado ou corrompido: ${err?.message || 'Erro de sintaxe'}` };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { isValid: false, error: 'Estrutura de dados do backup inválida (esperado um objeto JSON).' };
  }

  // Check if it's our envelope format or a raw key-value map
  let envelope: BackupEnvelope;

  if (parsed.data && typeof parsed.data === 'object') {
    // Standard Help Agency envelope
    envelope = parsed as BackupEnvelope;
  } else {
    // Raw localStorage dump compatibility
    const data = parsed;
    const demands = Array.isArray(data.agency_demands) ? data.agency_demands : [];
    const clients = Array.isArray(data.agency_clients) ? data.agency_clients : [];
    const services = Array.isArray(data.agency_services) ? data.agency_services : [];
    const proposals = Array.isArray(data.agency_proposals) ? data.agency_proposals : [];
    const invoices = Array.isArray(data.agency_invoices) ? data.agency_invoices : [];
    const logs = Array.isArray(data.help_agency_security_logs) ? data.help_agency_security_logs : [];

    const now = new Date();
    envelope = {
      app: 'Help Ideias Digitais',
      systemName: 'Help Ideias Digitais - Agency OS',
      version: 'Compatibilidade Direta',
      exportDate: now.toISOString(),
      exportTimestamp: now.getTime(),
      exportedBy: 'Importação Manual',
      environment: 'imported',
      stats: {
        demandsCount: demands.length,
        clientsCount: clients.length,
        servicesCount: services.length,
        proposalsCount: proposals.length,
        invoicesCount: invoices.length,
        logsCount: logs.length,
        totalKeysCount: Object.keys(data).length,
        approximateSizeKb: Math.round((new Blob([jsonString]).size / 1024) * 10) / 10,
      },
      data,
      checksum: computeChecksum(jsonString),
    };
  }

  // Ensure at least one core agency dataset exists
  const hasAgencyData =
    envelope.data.agency_demands ||
    envelope.data.agency_clients ||
    envelope.data.agency_services ||
    envelope.data.agency_invoices ||
    envelope.data.agency_proposals;

  if (!hasAgencyData) {
    return {
      isValid: false,
      error: 'O arquivo JSON não contém coleções reconhecidas da agência (demandas, clientes ou financeiro).',
    };
  }

  return {
    isValid: true,
    backup: envelope,
    stats: envelope.stats,
  };
}

/**
 * Restores the validated backup data directly into localStorage and dispatches sync events
 */
export function restoreBackupToLocalStorage(backup: BackupEnvelope): {
  success: boolean;
  restoredKeys: string[];
  error?: string;
} {
  if (!backup || !backup.data || typeof backup.data !== 'object') {
    return { success: false, restoredKeys: [], error: 'Objeto de backup sem dados para restaurar.' };
  }

  const restoredKeys: string[] = [];

  try {
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
        restoredKeys.push(key);
      }
    });

    // Record audit event in security logs
    addSecurityLog({
      eventType: 'two_factor_verified',
      severity: 'warning',
      title: 'Restauração Completa de Dados Executada (Backup JSON)',
      description: `Restauração manual aplicada ao sistema. ${restoredKeys.length} chaves restauradas com sucesso a partir de backup criado em ${new Date(backup.exportTimestamp).toLocaleString('pt-BR')}.`,
      source: 'Módulo de Backup & Recuperação de Desastres (DR)',
      threatDetails: `Autorizado via 2FA | Checksum: ${backup.checksum}`,
    });

    // Dispatch custom event so App.tsx and views can re-read data without page reload
    window.dispatchEvent(
      new CustomEvent('help_agency_backup_restored', {
        detail: {
          backup,
          restoredKeys,
          timestamp: Date.now(),
        },
      })
    );

    // Also dispatch notification to in-app notification center
    window.dispatchEvent(
      new CustomEvent('help_agency_notification', {
        detail: {
          id: `notif-backup-restore-${Date.now()}`,
          title: 'Restauração de Backup Concluída',
          message: `O sistema restaurou com sucesso ${backup.stats?.demandsCount || 0} demandas, ${backup.stats?.clientsCount || 0} clientes e registros financeiros.`,
          timestamp: 'Agora mesmo',
          type: 'security',
          read: false,
          targetPage: 'configuracoes',
          actionLabel: 'Ver Status',
        },
      })
    );

    return { success: true, restoredKeys };
  } catch (err: any) {
    console.error('Falha ao restaurar backup no localStorage:', err);
    return { success: false, restoredKeys, error: err?.message || 'Erro ao gravar no localStorage.' };
  }
}
