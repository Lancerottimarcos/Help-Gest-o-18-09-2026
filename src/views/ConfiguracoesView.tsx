import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Type, 
  Shield, 
  Bell, 
  Check, 
  Save, 
  Sparkles, 
  Sliders, 
  Building2, 
  Mail, 
  Phone,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Database,
  ArrowRight,
  BellRing,
  Activity
} from 'lucide-react';
import { SecuritySettingsTab } from '../components/SecuritySettingsTab';
import { SecurityAuditView } from '../components/SecurityAuditView';
import { BackupRestoreTab } from '../components/BackupRestoreTab';
import { BrowserNotificationSettingsCard } from '../components/BrowserNotificationSettingsCard';
import { SupabaseConnectionTab } from '../components/SupabaseConnectionTab';
import { useTwoFactor } from '../context/TwoFactorContext';
import { BackupEnvelope } from '../utils/backupManager';
import { DemandItem, Client, Service, BudgetProposal, Invoice } from '../types';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseService';

export interface ConfiguracoesViewProps {
  onRestoreData?: (backup: BackupEnvelope) => void;
  demands?: DemandItem[];
  clients?: Client[];
  services?: Service[];
  proposals?: BudgetProposal[];
  invoices?: Invoice[];
  onSyncSupabaseData?: (demands: DemandItem[], clients: Client[]) => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ 
  onRestoreData,
  demands = [],
  clients = [],
  services = [],
  proposals = [],
  invoices = [],
  onSyncSupabaseData
}) => {
  const { request2Fa } = useTwoFactor();
  const [activeTab, setActiveTab] = useState<'geral' | 'supabase' | 'notificacoes' | 'backup' | 'seguranca' | 'auditoria'>('geral');
  
  // Load saved agency settings from localStorage if available
  const [agencyInfo, setAgencyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('agency_info_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Help Ideias Digitais',
      email: 'lancerottirmarcos@gmail.com',
      phone: '(11) 98765-4321',
      directApproval: true,
      deadlineAlerts: true,
      lockFinance: true,
      autoEmailReports: false,
    };
  });

  const [directApproval, setDirectApproval] = useState(agencyInfo.directApproval);
  const [deadlineAlerts, setDeadlineAlerts] = useState(agencyInfo.deadlineAlerts);
  const [lockFinance, setLockFinance] = useState(agencyInfo.lockFinance);
  const [autoEmailReports, setAutoEmailReports] = useState(agencyInfo.autoEmailReports);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedGlobalSql, setCopiedGlobalSql] = useState(false);

  // Agency info
  const [agencyName, setAgencyName] = useState(agencyInfo.name);
  const [agencyEmail, setAgencyEmail] = useState(agencyInfo.email);
  const [agencyPhone, setAgencyPhone] = useState(agencyInfo.phone);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleCopyGlobalSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedGlobalSql(true);
    setTimeout(() => setCopiedGlobalSql(false), 3000);
  };

  const handleSave = () => {
    request2Fa({
      actionTitle: 'Salvar Configurações Globais da Agência',
      actionDescription: `Confirmar alterações no perfil da agência "${agencyName}", diretrizes de fluxo e permissões do sistema.`,
      riskLevel: 'high',
      actionType: 'config_change',
      onVerified: () => {
        const updatedInfo = {
          name: agencyName,
          email: agencyEmail,
          phone: agencyPhone,
          directApproval,
          deadlineAlerts,
          lockFinance,
          autoEmailReports,
          updatedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem('agency_info_config', JSON.stringify(updatedInfo));
        } catch {}
        setAgencyInfo(updatedInfo);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Settings Intro Header */}
      <div className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[26px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#fab518] flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>Preferências & Identidade</span>
          </span>
          <h3 className="text-xl font-black text-[#142142] dark:text-white tracking-tight mt-0.5">
            Configurações do Sistema
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Personalize as informações da Help Ideias Digitais, regras de fluxo, protocolos de segurança e identidade visual.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 size={15} />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      {/* Quick Supabase Integration Banner */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#142142] via-[#1b2b54] to-emerald-950 text-white border border-emerald-500/30 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Database size={24} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">
                Banco de Dados em Nuvem (PostgreSQL)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold border border-emerald-400/40">
                Supabase
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
              Conexão & Sincronização com Supabase
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Crie suas tabelas SQL em segundos e sincronize todas as demandas do Kanban e clientes com o banco PostgreSQL.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          <button
            type="button"
            onClick={handleCopyGlobalSql}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            title="Copiar o código SQL completo das tabelas"
          >
            {copiedGlobalSql ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copiedGlobalSql ? 'Script SQL Copiado!' : 'Copiar Script SQL'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#142142] text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Database size={15} />
            <span>Configurar Conexão</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl w-full overflow-x-auto scrollbar-thin border border-slate-200/80 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'geral'
              ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
          }`}
        >
          <Palette size={15} />
          <span>Geral & Identidade</span>
        </button>

        {/* 2ª Aba em destaque imediato: Banco Supabase */}
        <button
          type="button"
          id="tab-supabase-db"
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'supabase'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#142142] shadow-sm font-black'
              : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <Database size={15} className={activeTab === 'supabase' ? 'text-white dark:text-[#142142]' : 'text-emerald-600 dark:text-emerald-400'} />
          <span>Banco Supabase</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            activeTab === 'supabase'
              ? 'bg-white/20 text-white dark:text-[#142142]'
              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
          }`}>
            PostgreSQL
          </span>
        </button>

        <button
          type="button"
          id="tab-browser-notifications"
          onClick={() => setActiveTab('notificacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'notificacoes'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
          }`}
        >
          <BellRing size={15} className={activeTab === 'notificacoes' ? 'text-[#fab518] dark:text-[#142142]' : 'text-amber-500'} />
          <span>Notificações</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black">
            Web API
          </span>
        </button>

        <button
          type="button"
          id="tab-backup-restore"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
          }`}
        >
          <Database size={15} className={activeTab === 'backup' ? 'text-[#fab518] dark:text-[#142142]' : 'text-cyan-600 dark:text-cyan-400'} />
          <span>Backup JSON</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-black">
            DR
          </span>
        </button>

        <button
          type="button"
          id="tab-security-settings"
          onClick={() => setActiveTab('seguranca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'seguranca'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
          }`}
        >
          <ShieldCheck size={15} className={activeTab === 'seguranca' ? 'text-emerald-400 dark:text-[#142142]' : 'text-emerald-600'} />
          <span>Segurança & Protocolos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black">
            Ativo
          </span>
        </button>

        <button
          type="button"
          id="tab-security-audit"
          onClick={() => setActiveTab('auditoria')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'auditoria'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
          }`}
        >
          <Activity size={15} className={activeTab === 'auditoria' ? 'text-[#fab518] dark:text-[#142142]' : 'text-red-500'} />
          <span>Auditoria</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-black">
            Logs
          </span>
        </button>
      </div>

      {activeTab === 'supabase' ? (
        <SupabaseConnectionTab
          demands={demands}
          clients={clients}
          services={services}
          proposals={proposals}
          invoices={invoices}
          onDataImported={onSyncSupabaseData}
        />
      ) : activeTab === 'auditoria' ? (
        <SecurityAuditView onBackToSettings={() => setActiveTab('seguranca')} />
      ) : activeTab === 'seguranca' ? (
        <SecuritySettingsTab onNavigateToAudit={() => setActiveTab('auditoria')} />
      ) : activeTab === 'backup' ? (
        <BackupRestoreTab onRestoreSuccess={onRestoreData} />
      ) : activeTab === 'notificacoes' ? (
        <div className="space-y-6">
          <BrowserNotificationSettingsCard />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Disaster Recovery & Backup Banner in General View */}
          <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-r from-slate-900 to-[#142142] text-white flex flex-wrap items-center justify-between gap-4 border border-white/10 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#fab518]/20 text-[#fab518] flex items-center justify-center font-bold shrink-0">
                <Database size={20} />
              </div>
              <div>
                <p className="text-xs font-black tracking-wide text-white">
                  Backup Manual & Salvaguarda Operacional
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Faça downloads periódicos em JSON de todas as demandas, faturas e clientes ou restaure arquivos anteriores com verificação 2FA.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className="px-4 py-2 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <span>Gerenciar Backups JSON</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branding & Visual Guidelines */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                <Palette size={18} />
              </div>
              <span>Identidade Visual & Paleta da Agência</span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#142142] dark:text-slate-200">
                Nome da Agência / Sistema
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm font-bold text-[#142142] dark:text-white p-3 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none"
              />
            </div>

            {/* Color swatches */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#142142] dark:text-slate-200">
                Cores Oficiais (Clique para copiar o HEX)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyColor('#142142')}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#fab518] dark:hover:border-[#fab518] bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center gap-2 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 rounded-xl shadow-xs border border-black/10" style={{ backgroundColor: '#142142' }} />
                  <span className="text-xs font-mono font-bold text-[#142142] dark:text-white group-hover:text-[#fab518]">
                    {copiedColor === '#142142' ? 'Copiado!' : '#142142'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Primária Navy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyColor('#fab518')}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#fab518] dark:hover:border-[#fab518] bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center gap-2 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 rounded-xl shadow-xs border border-black/10" style={{ backgroundColor: '#fab518' }} />
                  <span className="text-xs font-mono font-bold text-[#142142] dark:text-white group-hover:text-[#fab518]">
                    {copiedColor === '#fab518' ? 'Copiado!' : '#fab518'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Ouro / Âmbar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyColor('#ffffff')}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#fab518] dark:hover:border-[#fab518] bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center gap-2 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 rounded-xl shadow-xs border border-slate-300 dark:border-slate-600" style={{ backgroundColor: '#ffffff' }} />
                  <span className="text-xs font-mono font-bold text-[#142142] dark:text-white group-hover:text-[#fab518]">
                    {copiedColor === '#ffffff' ? 'Copiado!' : '#ffffff'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Cards Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyColor('#0f172a')}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#fab518] dark:hover:border-[#fab518] bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center gap-2 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 rounded-xl shadow-xs border border-slate-700" style={{ backgroundColor: '#0f172a' }} />
                  <span className="text-xs font-mono font-bold text-[#142142] dark:text-white group-hover:text-[#fab518]">
                    {copiedColor === '#0f172a' ? 'Copiado!' : '#0f172a'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Dark Surface</span>
                </button>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-[#142142] dark:text-white">
                <Type size={14} className="text-[#fab518]" />
                <span>Tipografia Cadastrada</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Família: <strong className="text-[#142142] dark:text-white">Sofia Pro</strong> (<span className="font-normal">Regular 400</span>, <span className="font-semibold">SemiBold 600</span> e <span className="font-bold">Bold 700</span>) aplicada globalmente em toda a interface do sistema.
              </p>
            </div>
          </div>

          {/* Agency Information & Flow Settings */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 text-[#142142] dark:text-white font-black text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <Shield size={18} />
                </div>
                <span>Regras do Kanban & Portal do Cliente</span>
              </div>

              <div className="space-y-3">
                <div 
                  onClick={() => setDirectApproval(!directApproval)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#142142] dark:text-white">Aprovação Direta por Link Seguro</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Permite que o cliente aprove posts sem necessidade de login</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={directApproval} 
                    onChange={(e) => setDirectApproval(e.target.checked)}
                    className="w-4 h-4 accent-[#fab518] rounded cursor-pointer" 
                  />
                </div>

                <div 
                  onClick={() => setDeadlineAlerts(!deadlineAlerts)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#142142] dark:text-white">Avisos de Prazos Críticos</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Notificar equipe 24h antes do prazo limite de postagem</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={deadlineAlerts} 
                    onChange={(e) => setDeadlineAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#fab518] rounded cursor-pointer" 
                  />
                </div>

                <div 
                  onClick={() => setLockFinance(!lockFinance)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#142142] dark:text-white">Travar Visualização Financeira para Equipe</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Apenas o perfil Proprietário visualiza lucros e faturamento</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={lockFinance} 
                    onChange={(e) => setLockFinance(e.target.checked)}
                    className="w-4 h-4 accent-[#fab518] rounded cursor-pointer" 
                  />
                </div>

                <div 
                  onClick={() => setAutoEmailReports(!autoEmailReports)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 hover:border-[#fab518]/50 transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#142142] dark:text-white">Relatórios Semanais Automáticos</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Disparo automático de resumo de demandas às segundas-feiras</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoEmailReports} 
                    onChange={(e) => setAutoEmailReports(e.target.checked)}
                    className="w-4 h-4 accent-[#fab518] rounded cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80">
                <Lock size={12} className="text-[#fab518]" />
                <span>Ação Crítica protegida por Verificação 2FA</span>
              </div>

              <button
                type="button"
                id="btn-save-settings"
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] text-xs font-black hover:bg-[#1c2c54] dark:hover:bg-[#fab518]/90 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Save size={15} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>

        {/* Web Notification API Settings Card */}
        <BrowserNotificationSettingsCard />
      </div>
    )}
    </div>
  );
};

