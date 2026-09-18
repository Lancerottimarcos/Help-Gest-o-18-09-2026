import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Trash2,
  Sliders,
  Bug,
  Upload,
  Cpu,
  Terminal,
  Activity,
  Key,
  Unlock,
  Eye,
  Info,
  KeyRound,
  Mail,
  Smartphone,
  Globe,
  LockKeyhole,
  ExternalLink
} from 'lucide-react';
import {
  SecurityConfig,
  SecurityLogEntry,
  FileScanResult,
  getSecurityConfig,
  saveSecurityConfig,
  getSecurityLogs,
  clearSecurityLogs,
  scanFileForMalware,
  exportSecurityLogs,
  resetBruteForceLock,
  addSecurityLog,
  DEFAULT_SECURITY_CONFIG,
  checkHttpsAndHstsStatus,
  simulateHttpsRedirectTest
} from '../utils/securityProtocols';
import { useTwoFactor } from '../context/TwoFactorContext';
import { MasterPasswordCard } from './MasterPasswordCard';
import { DomainPublicationGuideCard } from './DomainPublicationGuideCard';

export interface SecuritySettingsTabProps {
  onNavigateToAudit?: () => void;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ onNavigateToAudit }) => {
  const { request2Fa } = useTwoFactor();
  const [config, setConfig] = useState<SecurityConfig>(() => getSecurityConfig());
  const [logs, setLogs] = useState<SecurityLogEntry[]>(() => getSecurityLogs());
  const [logFilter, setLogFilter] = useState<'all' | 'failed_login' | 'malware' | 'brute_force' | '2fa' | 'https' | 'clean'>('all');
  const [saveToast, setSaveToast] = useState(false);
  const [isTestingScan, setIsTestingScan] = useState(false);
  const [testResult, setTestResult] = useState<FileScanResult | null>(null);
  const [unlockedNotice, setUnlockedNotice] = useState(false);
  const [httpsSimulationResult, setHttpsSimulationResult] = useState<{ success: boolean; message: string; details: string } | null>(null);
  const [isSimulatingHttps, setIsSimulatingHttps] = useState(false);

  const httpsStatus = checkHttpsAndHstsStatus();

  // Refresh logs periodically or when action occurs
  const refreshLogs = () => {
    setLogs(getSecurityLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleUpdateConfig = <K extends keyof SecurityConfig>(key: K, value: SecurityConfig[K]) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    saveSecurityConfig(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleResetDefaults = () => {
    request2Fa({
      actionTitle: 'Restaurar Parâmetros Padrão de Cibersegurança',
      actionDescription: 'Esta ação redefinirá todas as diretrizes de bloqueio, regras de extensão e políticas antivírus para o padrão de fábrica.',
      riskLevel: 'high',
      actionType: 'security_wipe',
      onVerified: () => {
        setConfig(DEFAULT_SECURITY_CONFIG);
        saveSecurityConfig(DEFAULT_SECURITY_CONFIG);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2000);
        refreshLogs();
      }
    });
  };

  const handleClearLogs = () => {
    request2Fa({
      actionTitle: 'Limpeza Permanente do Log de Auditoria',
      actionDescription: 'Todos os registros de incidentes, tentativas de intrusão e eventos de segurança serão excluídos em definitivo.',
      riskLevel: 'critical',
      actionType: 'security_wipe',
      onVerified: () => {
        clearSecurityLogs();
        refreshLogs();
      }
    });
  };

  const handleTest2FaFlow = () => {
    request2Fa({
      actionTitle: 'Simulação de Autenticação em Dois Fatores (2FA)',
      actionDescription: 'Validação em tempo real do canal de segurança, OTP de 6 dígitos e temporizador de expiração da agência.',
      riskLevel: 'medium',
      actionType: 'custom',
      onVerified: () => {
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2000);
        refreshLogs();
      }
    });
  };

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportSecurityLogs(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-seguranca-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleManualScanTest = async (file: File) => {
    setIsTestingScan(true);
    setTestResult(null);
    try {
      const result = await scanFileForMalware(file);
      setTestResult(result);
      refreshLogs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingScan(false);
    }
  };

  // Run simulated malware test (EICAR standard test string)
  const handleTestEicarVirus = async () => {
    const eicarPayload = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const fakeFile = new File([eicarPayload], 'eicar_test_virus_sample.com', { type: 'text/plain' });
    await handleManualScanTest(fakeFile);
  };

  // Run simulated trojan test (disguised .bat or .exe)
  const handleTestDisguisedExecutable = async () => {
    const buffer = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ PE executable header
    const fakeFile = new File([buffer], 'foto_da_campanha.jpg.exe', { type: 'image/jpeg' });
    await handleManualScanTest(fakeFile);
  };

  // Run clean file test
  const handleTestCleanImage = async () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
    const fakeFile = new File([buffer], 'banner_seguro_aprovado.png', { type: 'image/png' });
    await handleManualScanTest(fakeFile);
  };

  const handleResetLockout = () => {
    request2Fa({
      actionTitle: 'Desbloquear Proteção Anti-Força Bruta',
      actionDescription: 'Libera o bloqueio de tentativas de login redefinindo os contadores de segurança.',
      riskLevel: 'medium',
      actionType: 'config_change',
      onVerified: () => {
        resetBruteForceLock();
        setUnlockedNotice(true);
        setTimeout(() => setUnlockedNotice(false), 2500);
        addSecurityLog({
          eventType: 'login_success',
          severity: 'info',
          title: 'Bloqueio de Força Bruta Redefinido',
          description: 'Administrador limpou o bloqueio temporário de tentativas de login via 2FA.',
          source: 'Painel do Administrador',
        });
        refreshLogs();
      }
    });
  };

  const handleSimulateHttpsTest = () => {
    setIsSimulatingHttps(true);
    setTimeout(() => {
      const res = simulateHttpsRedirectTest();
      setHttpsSimulationResult(res);
      setIsSimulatingHttps(false);
      refreshLogs();
      setTimeout(() => setHttpsSimulationResult(null), 7000);
    }, 600);
  };

  const handleToggleHttps = (enable: boolean) => {
    request2Fa({
      actionTitle: enable ? 'Habilitar HTTPS Obrigatório' : 'Desativar HTTPS Obrigatório',
      actionDescription: 'A alteração na política de criptografia de trânsito afeta a segurança e integridade de conexões de todos os operadores.',
      riskLevel: 'high',
      actionType: 'config_change',
      onVerified: () => {
        handleUpdateConfig('enforceHttps', enable);
      }
    });
  };

  const handleToggleHsts = (enable: boolean) => {
    request2Fa({
      actionTitle: enable ? 'Ativar Política HSTS (Strict-Transport-Security)' : 'Desativar Política HSTS',
      actionDescription: 'HSTS instrui os navegadores a recusarem conexões inseguras HTTP. Desativar remove a proteção contra ataques de downgrade e spoofing.',
      riskLevel: 'high',
      actionType: 'config_change',
      onVerified: () => {
        handleUpdateConfig('enableHsts', enable);
      }
    });
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'failed_login') return l.eventType === 'login_failed' || l.eventType === 'brute_force_blocked';
    if (logFilter === 'malware') return l.eventType === 'malware_blocked';
    if (logFilter === 'brute_force') return l.eventType === 'brute_force_blocked' || l.eventType === 'injection_blocked';
    if (logFilter === '2fa') return l.eventType.startsWith('two_factor');
    if (logFilter === 'https') return l.eventType === 'https_redirect' || l.eventType === 'hsts_enforced';
    if (logFilter === 'clean') return l.eventType === 'file_scanned_clean' || l.eventType === 'login_success';
    return true;
  });

  const failedLoginCount = logs.filter(l => l.eventType === 'login_failed').length;
  const malwareCount = logs.filter(l => l.eventType === 'malware_blocked').length;
  const injectionCount = logs.filter(l => l.eventType === 'injection_blocked').length;
  const bruteForceCount = logs.filter(l => l.eventType === 'brute_force_blocked').length;
  const twoFaCount = logs.filter(l => l.eventType.startsWith('two_factor')).length;
  const httpsCount = logs.filter(l => l.eventType === 'https_redirect' || l.eventType === 'hsts_enforced').length;

  return (
    <div className="space-y-6">
      {/* Active Defense Status Hero */}
      <div className="bg-gradient-to-br from-[#142142] via-[#162750] to-[#0d162d] text-white p-6 sm:p-7 rounded-[26px] border border-[#1d2e56] shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fab518]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ESCUDO ATIVO EM TEMPO REAL</span>
            </div>
            <h4 className="text-2xl font-black tracking-tight text-white">
              Central de Defesa & Protocolos de Segurança
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema possui camadas ativas de proteção com HTTPS obrigatório, HSTS habilitado (RFC 6797), escudo antivírus para anexos, defesa anti-força bruta, WAF contra injeções e verificação 2FA para ações sensíveis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetLockout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
              title="Zerar contadores de tentativas de login e remover bloqueios"
            >
              <Unlock size={15} className="text-[#fab518]" />
              <span>Desbloquear Tentativas</span>
            </button>

            <button
              type="button"
              onClick={refreshLogs}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] text-xs font-black transition-all cursor-pointer shadow-md shadow-[#fab518]/20"
            >
              <RefreshCw size={15} />
              <span>Atualizar Status</span>
            </button>
          </div>
        </div>

        {/* 5 Active Security Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white">Antivírus & Malware</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Inspeção binária e bloqueio de executáveis MZ/ELF</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400">Proteção Ativa</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fab518]/20 text-[#fab518] flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white">Anti-Força Bruta</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Suspensão de acesso após falhas consecutivas</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-[#fab518]">Limite {config.maxLoginAttempts} tentativas</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Terminal size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white">Firewall WAF</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Desarme de SQL Injection e scripts XSS</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-blue-300">Sanitização Ativa</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white">HTTPS & HSTS</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Redirect automático e HSTS max-age 1 ano</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-cyan-300">
                {config.enforceHttps ? 'HTTPS Obrigatório' : 'Desativado'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <KeyRound size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white">2FA & Sessão</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Código temporário em ações críticas</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-purple-300">
                {config.require2FaForSensitiveActions ? '2FA Ativo' : 'Opcional'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {unlockedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Tentativas de login redefinidas com sucesso! O acesso está liberado.</span>
        </div>
      )}

      {saveToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Configurações de segurança atualizadas com sucesso!</span>
        </div>
      )}

      {/* Guide & Domain Publication Roadmap */}
      <DomainPublicationGuideCard config={config} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Live Antivirus Sandbox & Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Antivirus Sandbox & Tester */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FileSearch size={18} />
                </div>
                <span>Simulador & Verificador de Arquivos Antivírus</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Motor Heurístico</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Arraste qualquer arquivo ou utilize os botões de simulação abaixo para testar a detecção em tempo real de vírus, assinaturas executáveis camufladas e scripts maliciosos.
            </p>

            {/* Test action triggers */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestEicarVirus}
                className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Bug size={14} />
                <span>Testar Vírus Padrão (EICAR)</span>
              </button>

              <button
                type="button"
                onClick={handleTestDisguisedExecutable}
                className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle size={14} />
                <span>Testar Executável Camuflado (.exe)</span>
              </button>

              <button
                type="button"
                onClick={handleTestCleanImage}
                className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Testar Arquivo Seguro (.png)</span>
              </button>
            </div>

            {/* Manual Upload Drop Area */}
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#fab518] rounded-2xl p-5 text-center transition-all bg-slate-50/50 dark:bg-slate-800/40">
              <input
                type="file"
                id="security-test-file-input"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleManualScanTest(e.target.files[0]);
                  }
                }}
              />
              <div className="space-y-1.5 pointer-events-none">
                <Upload size={22} className="mx-auto text-slate-400" />
                <p className="text-xs font-bold text-[#142142] dark:text-white">
                  Selecione ou solte um arquivo para escanear
                </p>
                <p className="text-[11px] text-slate-400">
                  O scanner lerá o cabeçalho binário (Magic Bytes) e inspecionará o payload.
                </p>
              </div>
            </div>

            {/* Scan Result Output */}
            {isTestingScan && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3 animate-pulse">
                <RefreshCw size={18} className="animate-spin text-amber-600" />
                <span>Analisando cabeçalho binário e executando regras heurísticas...</span>
              </div>
            )}

            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2.5 animate-in fade-in ${
                testResult.safe 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm">
                    {testResult.safe ? (
                      <>
                        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <span>ARQUIVO LIMPO & SEGURO</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
                        <span>AMEAÇA DETECTADA E BLOQUEADA</span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/10">
                    {(testResult.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="space-y-1 font-sans">
                  <p><strong>Arquivo:</strong> <span className="font-mono">{testResult.fileName}</span></p>
                  {testResult.threatName && (
                    <p><strong>Classificação:</strong> <span className="font-bold text-red-600 dark:text-red-400">{testResult.threatName}</span></p>
                  )}
                  <p><strong>Cabeçalho Binário (Magic Bytes):</strong> <code className="font-mono text-[11px] bg-black/10 px-1 py-0.5 rounded">{testResult.magicBytesHex || 'Vazio/Texto'}</code></p>
                  <p className="leading-relaxed opacity-90">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Security Protocols Configuration Form */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <Sliders size={18} />
                </div>
                <span>Diretrizes e Parâmetros dos Protocolos</span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] font-bold text-slate-500 hover:text-[#fab518] transition-colors cursor-pointer"
              >
                Restaurar Padrões
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Toggle 1: Block Dangerous Extensions */}
              <div 
                onClick={() => handleUpdateConfig('blockDangerousExtensions', !config.blockDangerousExtensions)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">Bloqueio Rigoroso de Extensões Executáveis</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Rejeita .exe, .bat, .cmd, .sh, .vbs, .js, .php, .cgi e outras 30 extensões executáveis</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.blockDangerousExtensions}
                  onChange={(e) => handleUpdateConfig('blockDangerousExtensions', e.target.checked)}
                  className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                />
              </div>

              {/* Toggle 2: Deep Binary Inspection */}
              <div 
                onClick={() => handleUpdateConfig('deepBinaryInspection', !config.deepBinaryInspection)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">Inspeção Profunda de Assinaturas Binárias (Magic Bytes)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Identifica executáveis PE/MZ ou ELF renomeados maliciosamente para .jpg ou .pdf</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.deepBinaryInspection}
                  onChange={(e) => handleUpdateConfig('deepBinaryInspection', e.target.checked)}
                  className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                />
              </div>

              {/* Toggle 3: WAF Sanitization */}
              <div 
                onClick={() => handleUpdateConfig('sanitizeHtmlInputs', !config.sanitizeHtmlInputs)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">Firewall WAF de Sanitização Anti-Injeção</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Desarma e neutraliza padrões de SQL Injection e Cross-Site Scripting (XSS)</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.sanitizeHtmlInputs}
                  onChange={(e) => handleUpdateConfig('sanitizeHtmlInputs', e.target.checked)}
                  className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                />
              </div>

              {/* Selects Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-white block">
                    Tentativas de Login
                  </label>
                  <select
                    value={config.maxLoginAttempts}
                    onChange={(e) => handleUpdateConfig('maxLoginAttempts', Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 text-xs font-bold text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                  >
                    <option value={3}>3 tentativas (Rigoroso)</option>
                    <option value={5}>5 tentativas (Padrão)</option>
                    <option value={10}>10 tentativas (Tolerante)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-white block">
                    Tempo de Bloqueio
                  </label>
                  <select
                    value={config.lockoutDurationMinutes}
                    onChange={(e) => handleUpdateConfig('lockoutDurationMinutes', Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 text-xs font-bold text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                  >
                    <option value={1}>1 minuto</option>
                    <option value={3}>3 minutos (Recomendado)</option>
                    <option value={5}>5 minutos</option>
                    <option value={15}>15 minutos</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-white block">
                    Timeout de Inatividade
                  </label>
                  <select
                    value={config.sessionTimeoutMinutes || 30}
                    onChange={(e) => handleUpdateConfig('sessionTimeoutMinutes', Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 text-xs font-bold text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                  >
                    <option value={15}>15 minutos (Alta Proteção)</option>
                    <option value={30}>30 minutos (Recomendado)</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Master Password Management with SHA-256 and 2FA */}
          <MasterPasswordCard onPasswordChanged={refreshLogs} />

          {/* Autenticação em Dois Fatores (2FA) Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <span>Autenticação em Dois Fatores (2FA) para Ações Sensíveis</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                config.require2FaForSensitiveActions 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}>
                {config.require2FaForSensitiveActions ? 'Ativo & Protegido' : 'Desativado'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Exige validação obrigatória por código temporário (OTP numérico de 6 dígitos) antes de autorizar operações de alto risco, como exclusão de múltiplos registros ou alterações nas configurações globais da agência.
            </p>

            <div className="space-y-3.5">
              {/* Master 2FA Toggle */}
              <div 
                onClick={() => handleUpdateConfig('require2FaForSensitiveActions', !config.require2FaForSensitiveActions)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">Ativar Camada 2FA para Ações Sensíveis</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Interrompe e exige o código de 6 dígitos para qualquer operação crítica no sistema</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.require2FaForSensitiveActions}
                  onChange={(e) => handleUpdateConfig('require2FaForSensitiveActions', e.target.checked)}
                  className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                />
              </div>

              {/* Sub-toggle 1: Config changes */}
              <div 
                onClick={() => handleUpdateConfig('require2FaForConfigChanges', !config.require2FaForConfigChanges)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">2FA em Alterações de Configurações Globais da Agência</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Solicita confirmação ao salvar nome da agência, e-mail de contato, fluxos ou políticas</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.require2FaForConfigChanges}
                  onChange={(e) => handleUpdateConfig('require2FaForConfigChanges', e.target.checked)}
                  className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                />
              </div>

              {/* Sub-toggle 2: Bulk Deletes */}
              <div 
                onClick={() => handleUpdateConfig('require2FaForBulkDeletes', !config.require2FaForBulkDeletes)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">2FA na Exclusão de Múltiplos Registros (Em Lote)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Exige autorização para deletar múltiplos clientes ou múltiplas faturas de uma vez</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.require2FaForBulkDeletes}
                  onChange={(e) => handleUpdateConfig('require2FaForBulkDeletes', e.target.checked)}
                  className="w-4 h-4 accent-[#fab518] rounded cursor-pointer"
                />
              </div>

              {/* Delivery method and email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
                    <Mail size={13} className="text-[#fab518]" />
                    <span>Canal de Entrega do OTP</span>
                  </label>
                  <select
                    value={config.twoFactorMethod || 'email'}
                    onChange={(e) => handleUpdateConfig('twoFactorMethod', e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 text-xs font-bold text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                  >
                    <option value="email">E-mail Seguro do Administrador</option>
                    <option value="totp">Aplicativo Autenticador TOTP (Google / Authy)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
                    <Smartphone size={13} className="text-[#fab518]" />
                    <span>E-mail Corporativo Autorizado</span>
                  </label>
                  <input
                    type="email"
                    value={config.twoFactorEmail || 'lancerottirmarcos@gmail.com'}
                    onChange={(e) => handleUpdateConfig('twoFactorEmail', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-xs font-semibold text-[#142142] dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#fab518]"
                  />
                </div>
              </div>

              {/* Live Test Trigger */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deseja testar a verificação de código temporário agora?
                </span>
                <button
                  type="button"
                  id="btn-test-2fa"
                  onClick={handleTest2FaFlow}
                  className="px-4 py-2 rounded-xl bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] text-xs font-black hover:bg-[#1d2d56] transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
                >
                  <KeyRound size={14} />
                  <span>Testar Verificação 2FA Agora</span>
                </button>
              </div>
            </div>
          </div>

          {/* HTTPS Obrigatório & HSTS Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                  <Globe size={18} />
                </div>
                <span>Criptografia em Trânsito: HTTPS Obrigatório & HSTS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  config.enforceHttps
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}>
                  {config.enforceHttps ? 'HTTPS Forçado (301)' : 'HTTPS Opcional'}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  config.enableHsts
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}>
                  {config.enableHsts ? 'HSTS 1 Ano Ativo' : 'HSTS Inativo'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O protocolo intercepta qualquer requisição HTTP insegura e força o redirecionamento imediato para HTTPS com código 301. O cabeçalho HSTS (HTTP Strict Transport Security - RFC 6797) instrui os navegadores a recusarem conexões inseguras, impedindo ataques de downgrade (SSL Stripping) e espionagem de rede.
            </p>

            {/* Diagnostic Matrix / Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Protocolo em Execução</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {httpsStatus.protocol.toUpperCase().replace(':', '')} / TLS 1.3
                  </span>
                </div>
                <p className="text-xs font-bold text-[#142142] dark:text-white">
                  {httpsStatus.isHttps ? 'Conexão Criptografada Homologada' : 'Ambiente Local (Simulação Ativa)'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Política HSTS (RFC 6797)</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    max-age=31536000
                  </span>
                </div>
                <p className="text-xs font-bold text-[#142142] dark:text-white truncate" title={httpsStatus.hstsHeader}>
                  {httpsStatus.hstsHeader}
                </p>
              </div>
            </div>

            {/* Direct Toggles */}
            <div className="space-y-3.5 pt-1">
              {/* Toggle 1: Enforce HTTPS Redirect */}
              <div
                onClick={() => handleToggleHttps(!config.enforceHttps)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">Redirecionamento Automático para HTTPS (301 Permanent)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Qualquer link ou chamada http:// é reescrito e redirecionado para https:// sem intervenção do usuário</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enforceHttps}
                  onChange={(e) => handleToggleHttps(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              {/* Toggle 2: HSTS Header */}
              <div
                onClick={() => handleToggleHsts(!config.enableHsts)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#142142] dark:text-white">HSTS Habilitado (HTTP Strict Transport Security)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Força o navegador a memorizar a conexão estrita por 31.536.000s (1 ano) e rejeitar conexões inseguras</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableHsts}
                  onChange={(e) => handleToggleHsts(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              {/* Sub-directives: includeSubDomains & preload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleUpdateConfig('hstsIncludeSubDomains', !config.hstsIncludeSubDomains)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#142142] dark:text-white">includeSubDomains</p>
                    <p className="text-[10px] text-slate-400">Protege todos os subdomínios</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.hstsIncludeSubDomains}
                    onChange={(e) => handleUpdateConfig('hstsIncludeSubDomains', e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <div
                  onClick={() => handleUpdateConfig('hstsPreload', !config.hstsPreload)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#142142] dark:text-white">Preload Directive</p>
                    <p className="text-[10px] text-slate-400">Elegível para listas HSTS dos navegadores</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.hstsPreload}
                    onChange={(e) => handleUpdateConfig('hstsPreload', e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Simulator Output */}
            {httpsSimulationResult && (
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-cyan-800 dark:text-cyan-300">
                  <CheckCircle2 size={16} className="text-cyan-600 dark:text-cyan-400" />
                  <span>{httpsSimulationResult.message}</span>
                </div>
                <p className="text-[11px] font-mono bg-cyan-900/10 dark:bg-black/30 p-2 rounded-lg break-all">
                  {httpsSimulationResult.details}
                </p>
              </div>
            )}

            {/* Test Trigger Button */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Deseja testar a interceptação e geração dos cabeçalhos HSTS agora?
              </span>
              <button
                type="button"
                id="btn-test-https"
                onClick={handleSimulateHttpsTest}
                disabled={isSimulatingHttps}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSimulatingHttps ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
                <span>{isSimulatingHttps ? 'Testando Redirect...' : 'Simular Interceptação HTTP → HTTPS'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Security Audit Logs & Incident Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#142142] dark:text-white font-black text-sm">
                <Activity size={18} className="text-[#fab518]" />
                <span>Registro de Auditoria de Segurança</span>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToAudit && (
                  <button
                    type="button"
                    onClick={onNavigateToAudit}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#fab518] text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-amber-500/20"
                    title="Abrir painel forense completo com métricas e exportação"
                  >
                    <span>Painel Forense</span>
                    <ExternalLink size={11} />
                  </button>
                )}
                <span className="text-[11px] font-bold text-slate-400">
                  {logs.length} eventos
                </span>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setLogFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logFilter === 'all'
                    ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('failed_login')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logFilter === 'failed_login'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600'
                }`}
              >
                Falhas de Login ({failedLoginCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('https')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logFilter === 'https'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600'
                }`}
              >
                HTTPS ({httpsCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('2fa')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logFilter === '2fa'
                    ? 'bg-[#fab518] text-[#142142]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#fab518]'
                }`}
              >
                2FA ({twoFaCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('malware')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logFilter === 'malware'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500'
                }`}
              >
                Malware ({malwareCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('brute_force')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  logFilter === 'brute_force'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500'
                }`}
              >
                Intrusões ({bruteForceCount + injectionCount})
              </button>
            </div>

            {/* Logs Stream List */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum evento registrado nesta categoria.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                      log.severity === 'critical'
                        ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                        : log.severity === 'warning'
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {log.eventType === 'https_redirect' || log.eventType === 'hsts_enforced' ? (
                          <Globe size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                        ) : log.eventType.startsWith('two_factor') ? (
                          <KeyRound size={14} className="text-[#fab518] shrink-0" />
                        ) : log.eventType === 'login_failed' ? (
                          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : log.severity === 'critical' ? (
                          <ShieldAlert size={14} className="text-red-600 dark:text-red-400 shrink-0" />
                        ) : log.severity === 'warning' ? (
                          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        <span className={`text-xs ${
                          log.eventType === 'https_redirect' || log.eventType === 'hsts_enforced'
                            ? 'text-cyan-900 dark:text-cyan-300 font-black'
                            : log.eventType.startsWith('two_factor')
                            ? 'text-[#142142] dark:text-[#fab518]'
                            : log.severity === 'critical' 
                            ? 'text-red-800 dark:text-red-300' 
                            : log.severity === 'warning'
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-[#142142] dark:text-slate-200'
                        }`}>
                          {log.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {log.description}
                    </p>

                    {/* Forensic context pills */}
                    {(log.attemptedUsername || log.failureReason || log.ipAddress) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {log.attemptedUsername && (
                          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] text-[#142142] dark:text-amber-300 font-bold">
                            Usuário: {log.attemptedUsername}
                          </span>
                        )}
                        {log.ipAddress && (
                          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            IP: {log.ipAddress}
                          </span>
                        )}
                        {log.failureReason && (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold truncate max-w-full">
                            {log.failureReason}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-black/5 dark:border-white/5 text-slate-400">
                      <span>Origem: {log.source}</span>
                      {log.threatDetails && (
                        <span className="font-mono text-slate-500 truncate max-w-[180px]" title={log.threatDetails}>
                          {log.threatDetails}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions: Export and Clear */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Exportar registros em formato CSV para análise"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Exportar registros em formato JSON"
                >
                  <Download size={12} />
                  <span>JSON</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearLogs}
                className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Limpar Histórico</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
