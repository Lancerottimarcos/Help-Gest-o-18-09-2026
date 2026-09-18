import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  UserX,
  UserCheck,
  Globe,
  Terminal,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Laptop,
  Fingerprint,
  Info,
  ExternalLink,
  Activity,
  KeyRound,
  FileCode,
  Flame,
  ChevronRight,
  X
} from 'lucide-react';
import {
  SecurityLogEntry,
  getSecurityLogs,
  clearSecurityLogs,
  checkBruteForceStatus,
  resetBruteForceLock,
  simulateFailedLoginAttempt,
  getSecurityConfig
} from '../utils/securityProtocols';
import { useTwoFactor } from '../context/TwoFactorContext';

interface SecurityAuditViewProps {
  onBackToSettings?: () => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ onBackToSettings }) => {
  const { request2Fa } = useTwoFactor();
  const [logs, setLogs] = useState<SecurityLogEntry[]>(() => getSecurityLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'failed_logins' | 'brute_force' | 'success_logins' | 'two_fa' | 'antivirus' | 'https'>('failed_logins');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedLog, setSelectedLog] = useState<SecurityLogEntry | null>(null);
  const [lockStatus, setLockStatus] = useState(() => checkBruteForceStatus());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const config = getSecurityConfig();

  const refreshLogs = () => {
    setLogs(getSecurityLogs());
    setLockStatus(checkBruteForceStatus());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLockStatus(checkBruteForceStatus());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateFailure = (reason: 'usuario_inexistente' | 'senha_incorreta' | 'tentativa_injecao') => {
    setIsSimulating(true);
    setTimeout(() => {
      const mockUsers = ['admin_master', 'root', 'suporte_help', 'financeiro', 'lancerotti'];
      const targetUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      simulateFailedLoginAttempt(targetUser, reason);
      refreshLogs();
      setIsSimulating(false);
      setActionFeedback(`Tentativa mal-sucedida simulada com sucesso para o usuário "${targetUser}". Log forense gerado!`);
      setTimeout(() => setActionFeedback(null), 4000);
    }, 400);
  };

  const handleResetLock = () => {
    resetBruteForceLock();
    refreshLogs();
    setActionFeedback('Bloqueio temporário do terminal desativado com sucesso.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleClearLogs = () => {
    request2Fa({
      actionTitle: 'Limpeza de Logs de Auditoria Forense',
      actionDescription: 'Excluir permanentemente todos os registros de tentativas de acesso, intrusões e eventos de segurança.',
      riskLevel: 'critical',
      actionType: 'bulk_delete',
      onVerified: () => {
        clearSecurityLogs();
        refreshLogs();
        setActionFeedback('Todos os registros de auditoria foram excluídos com autorização 2FA.');
        setTimeout(() => setActionFeedback(null), 3000);
      }
    });
  };

  const handleExport = (format: 'json' | 'csv') => {
    const currentLogs = getSecurityLogs();
    if (format === 'json') {
      const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonContent);
      downloadAnchor.setAttribute('download', `auditoria-seguranca-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['ID', 'Data/Hora', 'Tipo de Evento', 'Severidade', 'Título', 'Usuário Alvo', 'Motivo da Falha', 'IP de Origem', 'Dispositivo/Browser', 'Descrição'];
      const rows = currentLogs.map(l => [
        l.id,
        l.timestamp,
        l.eventType,
        l.severity,
        `"${(l.title || '').replace(/"/g, '""')}"`,
        `"${(l.attemptedUsername || '-').replace(/"/g, '""')}"`,
        `"${(l.failureReason || '-').replace(/"/g, '""')}"`,
        `"${(l.ipAddress || '-').replace(/"/g, '""')}"`,
        `"${(l.deviceInfo || '-').replace(/"/g, '""')}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodeURI(csvContent));
      downloadAnchor.setAttribute('download', `auditoria-acessos-forense-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // Counts for metrics
  const totalLogs = logs.length;
  const failedLogins = logs.filter(l => l.eventType === 'login_failed');
  const bruteForceBlocks = logs.filter(l => l.eventType === 'brute_force_blocked');
  const successfulLogins = logs.filter(l => l.eventType === 'login_success');
  const injectionAttempts = logs.filter(l => l.eventType === 'injection_blocked');

  // Filtered list
  const filteredLogs = logs.filter(log => {
    // Category match
    if (categoryFilter === 'failed_logins' && log.eventType !== 'login_failed' && log.eventType !== 'brute_force_blocked') {
      return false;
    }
    if (categoryFilter === 'brute_force' && log.eventType !== 'brute_force_blocked' && log.eventType !== 'injection_blocked') {
      return false;
    }
    if (categoryFilter === 'success_logins' && log.eventType !== 'login_success') {
      return false;
    }
    if (categoryFilter === 'two_fa' && !log.eventType.startsWith('two_factor')) {
      return false;
    }
    if (categoryFilter === 'antivirus' && log.eventType !== 'malware_blocked' && log.eventType !== 'file_scanned_clean') {
      return false;
    }
    if (categoryFilter === 'https' && log.eventType !== 'https_redirect' && log.eventType !== 'hsts_enforced') {
      return false;
    }

    // Severity match
    if (severityFilter !== 'all' && log.severity !== severityFilter) {
      return false;
    }

    // Search query match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText = [
        log.title,
        log.description,
        log.attemptedUsername,
        log.failureReason,
        log.ipAddress,
        log.deviceInfo,
        log.threatDetails,
        log.source
      ].filter(Boolean).join(' ').toLowerCase();

      return matchText.includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Overview */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-[#fab518] flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-[#142142] dark:text-white tracking-tight">
                  Auditoria de Segurança
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Logs em Memória · Pré-Publicação
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Logs de acesso salvos na memória para monitoramento detalhado antes da publicação: acompanhe tentativas de autenticação autorizadas e mal-sucedidas, motivos de falha, IPs, dispositivos e bloqueios anti-força bruta em tempo real.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {lockStatus.isLocked && (
              <button
                type="button"
                onClick={handleResetLock}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Desbloquear terminal do operador"
              >
                <Lock size={14} />
                <span>Desbloquear Terminal ({lockStatus.remainingSeconds}s)</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleSimulateFailure('usuario_inexistente')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-[#142142] dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                title="Simular tentativa com usuário inexistente para testar geração de logs"
              >
                <Terminal size={13} className="text-amber-500" />
                <span>{isSimulating ? 'Simulando...' : 'Simular Falha'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                title="Exportar registros em CSV"
              >
                <Download size={15} />
              </button>

              <button
                type="button"
                onClick={refreshLogs}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                title="Atualizar lista de eventos"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Acessos Monitorados</span>
              <Activity size={16} className="text-cyan-500" />
            </div>
            <p className="text-2xl font-black text-[#142142] dark:text-white">
              {successfulLogins.length + failedLogins.length + bruteForceBlocks.length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {successfulLogins.length} autorizados · {failedLogins.length} mal-sucedidos
            </p>
          </div>

          {/* Metric 2 */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-1">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tentativas Falhas</span>
              <UserX size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-300">
              {failedLogins.length}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Senhas incorretas e usuários não cadastrados
            </p>
          </div>

          {/* Metric 3 */}
          <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 space-y-1">
            <div className="flex items-center justify-between text-red-700 dark:text-red-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Bloqueios por Força Bruta</span>
              <ShieldAlert size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-black text-red-900 dark:text-red-300">
              {bruteForceBlocks.length + injectionAttempts.length}
            </p>
            <p className="text-[11px] text-red-700 dark:text-red-400">
              Disparos do limite ({config.maxLoginAttempts} tentativas / {config.lockoutDurationMinutes}m)
            </p>
          </div>

          {/* Metric 4 */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Terminal do Operador</span>
              {lockStatus.isLocked ? <Lock size={16} className="text-amber-500" /> : <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />}
            </div>
            <p className="text-lg font-black text-emerald-900 dark:text-emerald-300">
              {lockStatus.isLocked ? `Suspenso (${lockStatus.remainingSeconds}s)` : 'Liberado & Protegido'}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {lockStatus.attempts > 0 ? `${lockStatus.attempts}/${config.maxLoginAttempts} tentativas acumuladas` : 'Nenhuma infração ativa'}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por usuário (ex: admin), IP, motivo da falha ou browser..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-[#142142] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#fab518]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Severity Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">Severidade:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#142142] dark:text-white p-2 rounded-xl focus:outline-none focus:border-[#fab518]"
              >
                <option value="all">Todas as Severidades</option>
                <option value="critical">Crítico (Bloqueios / Invasões)</option>
                <option value="warning">Aviso (Falhas de Login)</option>
                <option value="info">Informativo (Autorizados)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('failed_logins')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'failed_logins'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <UserX size={14} />
              <span>Falhas de Login ({failedLogins.length + bruteForceBlocks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('brute_force')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'brute_force'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Força Bruta & WAF ({bruteForceBlocks.length + injectionAttempts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('success_logins')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'success_logins'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <UserCheck size={14} />
              <span>Acessos Autorizados ({successfulLogins.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('two_fa')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'two_fa'
                  ? 'bg-[#fab518] text-[#142142] shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <KeyRound size={14} />
              <span>2FA & Sessões ({logs.filter(l => l.eventType.startsWith('two_factor')).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('antivirus')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'antivirus'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <FileCode size={14} />
              <span>Antivírus ({logs.filter(l => l.eventType.includes('scanned') || l.eventType.includes('malware')).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('https')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'https'
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <Globe size={14} />
              <span>HTTPS & HSTS ({logs.filter(l => l.eventType.includes('https') || l.eventType.includes('hsts')).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-[#142142] dark:bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <span>Todos ({totalLogs})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Forensic Incident Feed */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#fab518]" />
            <h4 className="text-sm font-black text-[#142142] dark:text-white">
              Histórico Forense Detalhado ({filteredLogs.length} incidentes exibidos)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearLogs}
              className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer flex items-center gap-1 p-1"
              title="Exigirá código 2FA"
            >
              <Trash2 size={13} />
              <span>Limpar Registros</span>
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <ShieldCheck size={36} className="mx-auto text-emerald-500/60" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              Nenhum incidente localizado com os filtros selecionados.
            </p>
            <p className="text-[11px] max-w-sm mx-auto">
              Seu sistema não registrou tentativas suspeitas nessa categoria ou a busca não encontrou correspondências.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isLoginFailure = log.eventType === 'login_failed' || log.eventType === 'brute_force_blocked';
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-xs ${
                    log.severity === 'critical'
                      ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 hover:border-red-400'
                      : log.severity === 'warning'
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        log.severity === 'critical'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                          : log.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {log.eventType === 'brute_force_blocked' ? (
                          <ShieldAlert size={16} />
                        ) : log.eventType === 'login_failed' ? (
                          <UserX size={16} />
                        ) : log.eventType === 'login_success' ? (
                          <UserCheck size={16} />
                        ) : log.eventType.startsWith('two_factor') ? (
                          <KeyRound size={16} />
                        ) : log.eventType.includes('https') ? (
                          <Globe size={16} />
                        ) : (
                          <Activity size={16} />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-black text-[#142142] dark:text-white">
                            {log.title}
                          </p>

                          {log.attemptedUsername && (
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-[#142142] dark:text-amber-400">
                              Alvo: {log.attemptedUsername}
                            </span>
                          )}

                          {log.attemptCount && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                              Tentativa {log.attemptCount} de {log.maxAttempts || 5}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          {log.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        <span>{log.timestamp}</span>
                      </span>
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 hover:underline">
                        <span>Ver Dossiê</span>
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>

                  {/* Forensic Metadata Strip */}
                  <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      {log.ipAddress && (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Terminal size={11} className="text-slate-400" />
                          <span>IP: {log.ipAddress}</span>
                        </span>
                      )}

                      {log.deviceInfo && (
                        <span className="flex items-center gap-1 text-[10px]">
                          <Laptop size={11} className="text-slate-400" />
                          <span>{log.deviceInfo}</span>
                        </span>
                      )}

                      {log.failureReason && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold truncate max-w-xs" title={log.failureReason}>
                          Motivo: {log.failureReason}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400">
                      Origem: {log.source}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Best Practices & Pre-Launch Hardening Checklist */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-black text-[#142142] dark:text-white">
            Garantias de Cibersegurança Verificadas antes da Publicação no Domínio Próprio
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <p className="font-black text-[#142142] dark:text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Anti-Enumeração de Contas</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              O módulo de login aplica rate limiting e tempos de resposta uniformes para neutralizar robôs de descoberta de usuários.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <p className="font-black text-[#142142] dark:text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Mitigação de Credential Stuffing</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bloqueia automaticamente o terminal após {config.maxLoginAttempts} falhas consecutivas, impedindo dicionários automatizados de senhas.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <p className="font-black text-[#142142] dark:text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Trilha Forense Imutável</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Todos os cabeçalhos, IPs, tentativas e ações administrativas são preservados em registros auditáveis exportáveis para conformidade.
            </p>
          </div>
        </div>
      </div>

      {/* Forensic Incident Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  selectedLog.severity === 'critical'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                    : selectedLog.severity === 'warning'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#142142] dark:text-white">
                    Dossiê Forense do Incidente
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              selectedLog.severity === 'critical'
                ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                : selectedLog.severity === 'warning'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-[#142142] dark:text-white">
                  {selectedLog.title}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                  Severidade: {selectedLog.severity}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {/* Key-Value Forensic Attributes */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Parâmetros e Metadados do Terminal
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Data & Hora Exata:</span>
                  <span className="font-mono text-xs font-bold text-[#142142] dark:text-white">
                    {selectedLog.timestamp}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Usuário / Alvo Tentado:</span>
                  <span className="font-mono text-xs font-bold text-[#fab518]">
                    {selectedLog.attemptedUsername || 'Não informado / Genérico'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Endereço IP & Geolocalização:</span>
                  <span className="font-mono text-xs font-bold text-[#142142] dark:text-white">
                    {selectedLog.ipAddress || 'Terminal Local'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Módulo de Detecção:</span>
                  <span className="text-xs font-bold text-[#142142] dark:text-white">
                    {selectedLog.source}
                  </span>
                </div>
              </div>

              {selectedLog.failureReason && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Diagnóstico da Falha:</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    {selectedLog.failureReason}
                  </span>
                </div>
              )}

              {selectedLog.deviceInfo && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Dispositivo e Plataforma:</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedLog.deviceInfo}
                  </span>
                </div>
              )}

              {selectedLog.userAgent && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">User-Agent Header:</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all">
                    {selectedLog.userAgent}
                  </span>
                </div>
              )}

              {selectedLog.threatDetails && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-bold">Detalhes Técnicos:</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {selectedLog.threatDetails}
                  </span>
                </div>
              )}
            </div>

            {/* Recommendations before deployment */}
            <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs flex items-start gap-2.5">
              <Info size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Recomendação Pré-Publicação (OWASP):</p>
                <p className="text-[11px] mt-0.5 text-cyan-800 dark:text-cyan-300">
                  Mantenha a autenticação em dois fatores (2FA) habilitada e garanta que o Nginx no seu servidor possua o bloco de redirecionamento HTTPS permanente ativado.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] font-black text-xs transition-all cursor-pointer shadow-xs"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
