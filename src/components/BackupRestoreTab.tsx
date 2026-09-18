import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  FileDown,
  Copy,
  RefreshCw,
  Lock,
  HardDrive,
  ShieldCheck,
  Calendar,
  Layers,
  Users,
  DollarSign,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  generateSystemBackup,
  downloadBackupJsonFile,
  validateBackupJson,
  restoreBackupToLocalStorage,
  BackupEnvelope,
  BackupStats
} from '../utils/backupManager';
import { useTwoFactor } from '../context/TwoFactorContext';

interface BackupRestoreTabProps {
  onRestoreSuccess?: (backup: BackupEnvelope) => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({ onRestoreSuccess }) => {
  const { request2Fa } = useTwoFactor();

  // Current storage telemetry
  const [currentBackup, setCurrentBackup] = useState<BackupEnvelope>(() => generateSystemBackup());
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    backup?: BackupEnvelope;
    stats?: BackupStats;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessNotice, setRestoreSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh current system data stats
  const refreshCurrentStats = () => {
    setCurrentBackup(generateSystemBackup());
  };

  useEffect(() => {
    refreshCurrentStats();
  }, []);

  // Handle Export to JSON
  const handleExportJson = () => {
    setIsExporting(true);
    setTimeout(() => {
      const backup = generateSystemBackup();
      downloadBackupJsonFile(backup);
      setCurrentBackup(backup);
      setIsExporting(false);
      setExportSuccessMessage(`Backup gerado com sucesso! Arquivo salvo com ${backup.stats.demandsCount} demandas e ${backup.stats.clientsCount} clientes.`);
      setTimeout(() => setExportSuccessMessage(null), 6000);
    }, 400);
  };

  // Handle Copy JSON payload to clipboard
  const handleCopyJson = () => {
    const backup = generateSystemBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // Process selected file
  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setValidationResult({
        isValid: false,
        error: 'Formato inválido. Por favor selecione um arquivo com extensão .json.',
      });
      setSelectedFile(file);
      setFileContent(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      const validation = validateBackupJson(content);
      setValidationResult(validation);
    };
    reader.onerror = () => {
      setValidationResult({
        isValid: false,
        error: 'Erro ao ler o arquivo selecionado no navegador.',
      });
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Handle Restore with 2FA protection
  const handleExecuteRestore = () => {
    if (!validationResult?.isValid || !validationResult.backup) return;

    const backup = validationResult.backup;
    const countSummary = `${backup.stats?.demandsCount || 0} demandas, ${backup.stats?.clientsCount || 0} clientes e ${backup.stats?.invoicesCount || 0} faturas`;

    request2Fa({
      actionTitle: 'Restaurar Dados do Sistema via Backup JSON',
      actionDescription: `Atenção: Esta ação substituirá os registros atuais do sistema pelo conteúdo do backup (${countSummary}).`,
      riskLevel: 'critical',
      actionType: 'bulk_delete',
      onVerified: () => {
        setIsRestoring(true);
        setTimeout(() => {
          const result = restoreBackupToLocalStorage(backup);
          setIsRestoring(false);

          if (result.success) {
            setRestoreSuccessNotice(`Restauração concluída com sucesso! ${result.restoredKeys.length} conjuntos de dados foram importados.`);
            refreshCurrentStats();
            if (onRestoreSuccess) {
              onRestoreSuccess(backup);
            }
            setSelectedFile(null);
            setFileContent(null);
            setValidationResult(null);
          } else {
            setValidationResult({
              isValid: false,
              error: result.error || 'Falha ao gravar os dados restaurados no navegador.',
            });
          }
        }, 500);
      },
    });
  };

  const currentStats = currentBackup.stats;

  return (
    <div className="space-y-6">
      {/* Top Banner with Storage Telemetry */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold shrink-0">
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-[#142142] dark:text-white">
                Gestão de Backups & Recuperação de Desastres (DR)
              </h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                JSON LocalStorage
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Exporte todos os dados cadastrais da agência para um arquivo JSON estruturado e faça restaurações rápidas e auditadas com proteção biométrica/2FA.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshCurrentStats}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      {/* Notices */}
      {exportSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">{exportSuccessMessage}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              O arquivo foi baixado no seu dispositivo. Guarde-o em uma pasta segura ou nuvem da agência.
            </p>
          </div>
        </div>
      )}

      {restoreSuccessNotice && (
        <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">{restoreSuccessNotice}</p>
            <p className="text-[11px] text-cyan-700 dark:text-cyan-300 mt-0.5">
              Todos os módulos (Demandas, Clientes, Financeiro e Configurações) foram sincronizados com os dados importados.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Export (Left) & Import (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ==================== EXPORT CARD ==================== */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <FileDown size={18} />
                </div>
                <span>Exportar Dados do Sistema (Backup JSON)</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                ~{currentStats.approximateSizeKb} KB
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Gera um snapshot completo e autocontido de todo o estado operacional da agência, pronto para arquivamento ou migração segura de dispositivo.
            </p>

            {/* Live Data Summary Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Layers size={13} className="text-[#fab518]" />
                  <span>Demandas</span>
                </div>
                <p className="text-base font-black text-[#142142] dark:text-white mt-1">
                  {currentStats.demandsCount} <span className="text-[10px] font-normal text-slate-400">cards</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Users size={13} className="text-blue-500" />
                  <span>Clientes</span>
                </div>
                <p className="text-base font-black text-[#142142] dark:text-white mt-1">
                  {currentStats.clientsCount} <span className="text-[10px] font-normal text-slate-400">contas</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <DollarSign size={13} className="text-emerald-500" />
                  <span>Financeiro</span>
                </div>
                <p className="text-base font-black text-[#142142] dark:text-white mt-1">
                  {currentStats.invoicesCount} <span className="text-[10px] font-normal text-slate-400">faturas</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <FileText size={13} className="text-purple-500" />
                  <span>Orçamentos</span>
                </div>
                <p className="text-base font-black text-[#142142] dark:text-white mt-1">
                  {currentStats.proposalsCount} <span className="text-[10px] font-normal text-slate-400">propostas</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <ShieldCheck size={13} className="text-cyan-500" />
                  <span>Logs Auditoria</span>
                </div>
                <p className="text-base font-black text-[#142142] dark:text-white mt-1">
                  {currentStats.logsCount} <span className="text-[10px] font-normal text-slate-400">eventos</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <HardDrive size={13} className="text-amber-500" />
                  <span>Chaves Totais</span>
                </div>
                <p className="text-base font-black text-[#142142] dark:text-white mt-1">
                  {currentStats.totalKeysCount} <span className="text-[10px] font-normal text-slate-400">tabelas</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#fab518]" />
                <span>Arquivo Criptograficamente Íntegro</span>
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                O arquivo gerado inclui assinatura de integridade (checksum), carimbo de data/hora ISO e metadados de auditoria compatíveis com a política de retenção de dados da agência.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              id="btn-copy-json"
              onClick={handleCopyJson}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Copy size={14} />
              <span>{copiedJson ? 'Copiado para Clipboard!' : 'Copiar JSON'}</span>
            </button>

            <button
              type="button"
              id="btn-export-backup-json"
              onClick={handleExportJson}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#142142] dark:bg-[#fab518] hover:bg-[#1c2c54] dark:hover:bg-[#fab518]/90 text-white dark:text-[#142142] text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{isExporting ? 'Processando Arquivo...' : 'Baixar Backup (.json)'}</span>
            </button>
          </div>
        </div>

        {/* ==================== IMPORT CARD ==================== */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold">
                  <FileUp size={18} />
                </div>
                <span>Importar & Restaurar Sistema (JSON)</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Protegido por 2FA
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Carregue um arquivo de backup (.json) previamente gerado para restaurar demandas, clientes, faturas e parâmetros da agência.
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
                id="input-backup-file"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                <Upload size={22} />
              </div>
              <p className="text-xs font-bold text-[#142142] dark:text-white">
                {selectedFile ? selectedFile.name : 'Arraste seu arquivo .json aqui'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedFile
                  ? `${Math.round(selectedFile.size / 1024)} KB selecionados - Clique para trocar de arquivo`
                  : 'Ou clique para navegar pelos arquivos do seu computador'}
              </p>
            </div>

            {/* Validation Outcome / Backup Preview */}
            {validationResult && (
              <div className="animate-in fade-in space-y-3">
                {validationResult.isValid && validationResult.backup ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Arquivo de Backup Válido e Seguro</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                      <div>
                        <span className="text-slate-400">Data do Backup:</span>{' '}
                        <strong>
                          {new Date(validationResult.backup.exportTimestamp).toLocaleString('pt-BR')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Versão:</span>{' '}
                        <strong>{validationResult.backup.version || '2.x'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Exportado por:</span>{' '}
                        <strong className="truncate block" title={validationResult.backup.exportedBy}>
                          {validationResult.backup.exportedBy || 'Gestor'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Integridade:</span>{' '}
                        <strong className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                          {validationResult.backup.checksum || 'OK'}
                        </strong>
                      </div>
                    </div>

                    {/* Counts to be restored */}
                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px] font-bold text-[#142142] dark:text-slate-200">
                      <span>Registros a restaurar:</span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {validationResult.stats?.demandsCount} demandas • {validationResult.stats?.clientsCount} clientes • {validationResult.stats?.invoicesCount} faturas
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs space-y-1 text-red-800 dark:text-red-300">
                    <div className="flex items-center gap-2 font-bold text-red-900 dark:text-red-200">
                      <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                      <span>Falha de Validação do Backup</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {validationResult.error || 'O arquivo fornecido não é compatível com o formato do sistema.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80">
              <Lock size={12} className="text-[#fab518]" />
              <span>Restauração protegida por 2FA</span>
            </div>

            <button
              type="button"
              id="btn-confirm-restore"
              onClick={handleExecuteRestore}
              disabled={!validationResult?.isValid || isRestoring}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRestoring ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
              <span>{isRestoring ? 'Restaurando...' : 'Restaurar Dados do Sistema'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Disaster Recovery Guidance Card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Diretrizes de Segurança & Política de Retenção de Dados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <p className="font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
              <Clock size={14} className="text-[#fab518]" />
              <span>Frequência Recomendada</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Realize o download do backup JSON semanalmente ou obrigatoriamente antes de realizar exclusões em lote ou formatações de ambiente.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <p className="font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
              <Lock size={14} className="text-blue-500" />
              <span>Privacidade & LGPD</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              O arquivo exportado contém nomes de clientes e dados financeiros. Armazene exclusivamente em locais autorizados pela agência com controle de acesso.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <p className="font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
              <HardDrive size={14} className="text-purple-500" />
              <span>Independência Tecnológica</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Os dados são gravados em JSON universal padronizado, permitindo migração para qualquer banco relacional ou planilha sem lock-in proprietário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
