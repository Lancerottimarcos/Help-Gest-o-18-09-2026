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
  Activity,
  Globe,
  Landmark,
  FileText,
  MapPin,
  CheckCircle,
  ExternalLink,
  Smartphone,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Zap,
  Info
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
  const [activeTab, setActiveTab] = useState<'geral' | 'fluxo' | 'supabase' | 'notificacoes' | 'seguranca' | 'backup' | 'auditoria'>('geral');
  
  // Load saved agency settings from localStorage if available
  const [agencyInfo, setAgencyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('agency_info_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Help Ideias Digitais',
      email: 'contato@helpideiasdigitais.com.br',
      phone: '(11) 98765-4321',
      website: 'https://app.helpideiasdigitais.com.br',
      pixKey: 'financeiro@helpideiasdigitais.com.br',
      cnpj: '45.892.102/0001-90',
      address: 'São Paulo - SP, Brasil',
      directApproval: true,
      deadlineAlerts: true,
      lockFinance: true,
      autoEmailReports: false,
      whatsappAutoNotify: true,
      autoArchiveDays: 30,
    };
  });

  // Agency info form fields
  const [agencyName, setAgencyName] = useState(agencyInfo.name || 'Help Ideias Digitais');
  const [agencyEmail, setAgencyEmail] = useState(agencyInfo.email || 'contato@helpideiasdigitais.com.br');
  const [agencyPhone, setAgencyPhone] = useState(agencyInfo.phone || '(11) 98765-4321');
  const [agencyWebsite, setAgencyWebsite] = useState(agencyInfo.website || 'https://app.helpideiasdigitais.com.br');
  const [agencyPixKey, setAgencyPixKey] = useState(agencyInfo.pixKey || 'financeiro@helpideiasdigitais.com.br');
  const [agencyCnpj, setAgencyCnpj] = useState(agencyInfo.cnpj || '45.892.102/0001-90');
  const [agencyAddress, setAgencyAddress] = useState(agencyInfo.address || 'São Paulo - SP, Brasil');

  // Flow rules
  const [directApproval, setDirectApproval] = useState(agencyInfo.directApproval ?? true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(agencyInfo.deadlineAlerts ?? true);
  const [lockFinance, setLockFinance] = useState(agencyInfo.lockFinance ?? true);
  const [autoEmailReports, setAutoEmailReports] = useState(agencyInfo.autoEmailReports ?? false);
  const [whatsappAutoNotify, setWhatsappAutoNotify] = useState(agencyInfo.whatsappAutoNotify ?? true);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedGlobalSql, setCopiedGlobalSql] = useState(false);

  const officialColors = [
    {
      hex: '#142142',
      name: 'Azul Navy Profundo',
      role: 'Primária Corporativa',
      description: 'Sidebars, botões principais e cabeçalhos'
    },
    {
      hex: '#fab518',
      name: 'Dourado Âmbar',
      role: 'Destaque & Ação (Accent)',
      description: 'Badges ativas, botões de ação e alertas'
    },
    {
      hex: '#10B981',
      name: 'Verde Esmeralda',
      role: 'Sucesso & Aprovações',
      description: 'Status concluído, sincronização e faturas pagas'
    },
    {
      hex: '#F4F5F8',
      name: 'Cinza Platina Light',
      role: 'Fundo do Canvas',
      description: 'Área de trabalho clara e descanso visual'
    },
    {
      hex: '#0f172a',
      name: 'Slate Escuro',
      role: 'Dark Mode Surface',
      description: 'Superfícies de cartões e modais no modo escuro'
    },
  ];

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
      actionDescription: `Confirmar alterações no perfil da agência "${agencyName}", regras de fluxo e diretrizes operacionais.`,
      riskLevel: 'medium',
      actionType: 'config_change',
      onVerified: () => {
        const updatedInfo = {
          name: agencyName,
          email: agencyEmail,
          phone: agencyPhone,
          website: agencyWebsite,
          pixKey: agencyPixKey,
          cnpj: agencyCnpj,
          address: agencyAddress,
          directApproval,
          deadlineAlerts,
          lockFinance,
          autoEmailReports,
          whatsappAutoNotify,
          updatedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem('agency_info_config', JSON.stringify(updatedInfo));
        } catch {}
        setAgencyInfo(updatedInfo);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1700px] mx-auto">
      {/* Settings Cockpit Header */}
      <div className="bg-white dark:bg-[#0f172a] p-6 sm:p-7 rounded-[26px] border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#fab518]/10 via-[#142142]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#142142] to-[#1e3264] text-[#fab518] flex items-center justify-center font-black shadow-md border border-slate-700/50 shrink-0">
              <Settings size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#fab518] flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Painel de Controle Enterprise</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  v2.5 Online
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white tracking-tight mt-1">
                Configurações & Governança
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Gerencie o perfil institucional da <strong>Help Ideias Digitais</strong>, conexão Supabase em nuvem, diretrizes do Kanban e políticas de segurança.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            {savedSuccess && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 size={15} />
                <span>Salvo com sucesso!</span>
              </div>
            )}

            <button
              type="button"
              id="btn-save-settings-header"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#142142] hover:bg-[#1c2c54] dark:bg-[#fab518] dark:hover:bg-[#e29f11] text-white dark:text-[#142142] text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Save size={15} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Telemetry & System Health Quick Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Banco PostgreSQL</span>
              <span className="text-xs font-bold text-[#142142] dark:text-white truncate block">Supabase Sincronizado</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Proteção 2FA</span>
              <span className="text-xs font-bold text-[#142142] dark:text-white truncate block">Zero-Trust Ativo</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Globe size={14} className="text-[#fab518] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Domínio da Aplicação</span>
              <span className="text-xs font-bold text-[#142142] dark:text-white truncate block">helpideiasdigitais.com.br</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Database size={14} className="text-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Demandas & Clientes</span>
              <span className="text-xs font-bold text-[#142142] dark:text-white truncate block">{demands.length} cards • {clients.length} contas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          id="tab-config-geral"
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'geral'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Building2 size={15} />
          <span>Perfil & Identidade</span>
        </button>

        <button
          type="button"
          id="tab-config-fluxo"
          onClick={() => setActiveTab('fluxo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'fluxo'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Regras & Kanban</span>
        </button>

        <button
          type="button"
          id="tab-supabase-db"
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'supabase'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          <Database size={15} />
          <span>Banco Supabase</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            activeTab === 'supabase' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          }`}>
            SQL
          </span>
        </button>

        <button
          type="button"
          id="tab-browser-notifications"
          onClick={() => setActiveTab('notificacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'notificacoes'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <BellRing size={15} />
          <span>Notificações</span>
        </button>

        <button
          type="button"
          id="tab-security-settings"
          onClick={() => setActiveTab('seguranca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'seguranca'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Segurança & 2FA</span>
        </button>

        <button
          type="button"
          id="tab-backup-restore"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Database size={15} />
          <span>Backup JSON</span>
        </button>

        <button
          type="button"
          id="tab-security-audit"
          onClick={() => setActiveTab('auditoria')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'auditoria'
              ? 'bg-[#142142] dark:bg-[#fab518] text-white dark:text-[#142142] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity size={15} />
          <span>Logs & Auditoria</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
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
      ) : activeTab === 'fluxo' ? (
        /* Regras Operacionais & Kanban Flow */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Portal do Cliente & Aprovação */}
            <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142142] dark:text-white">
                    Portal do Cliente & Aprovação Externa
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Controle de links públicos, dispensas de login e automação de feedback
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Toggle 1: Aprovação Direta */}
                <div 
                  onClick={() => setDirectApproval(!directApproval)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#fab518] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <p className="text-xs font-black text-[#142142] dark:text-white">
                      Aprovação Direta por Link Seguro
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Gera um link seguro para o cliente aprovar, reprovar ou pedir ajustes sem necessidade de criar conta ou senha.
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${directApproval ? 'bg-[#fab518] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                {/* Toggle 2: Notificação WhatsApp */}
                <div 
                  onClick={() => setWhatsappAutoNotify(!whatsappAutoNotify)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#fab518] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <p className="text-xs font-black text-[#142142] dark:text-white">
                      Disparo Facilitado via WhatsApp Web
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abre modal com mensagem formatada e botão direto para enviar a peça ao WhatsApp do cliente ao mover para "Em Aprovação".
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${whatsappAutoNotify ? 'bg-[#fab518] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                {/* Toggle 3: Relatórios Automáticos */}
                <div 
                  onClick={() => setAutoEmailReports(!autoEmailReports)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#fab518] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <p className="text-xs font-black text-[#142142] dark:text-white">
                      Relatórios Semanais de Produção
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Prepara um resumo executivo com todas as entregas concluídas às segundas-feiras.
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${autoEmailReports ? 'bg-[#fab518] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Permissões de Equipe & Prazos Críticos */}
            <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142142] dark:text-white">
                    Permissões da Equipe & Monitoramento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Regras de sigilo de faturamento e alertas proativos de prazos
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Toggle: Alerta de Prazos */}
                <div 
                  onClick={() => setDeadlineAlerts(!deadlineAlerts)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#fab518] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <p className="text-xs font-black text-[#142142] dark:text-white">
                      Alertas Proativos de Prazos (24h de antecedência)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Destaque em vermelho e badges urgentes nas demandas que vencem nas próximas 24 horas no Kanban.
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${deadlineAlerts ? 'bg-[#fab518] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                {/* Toggle: Trava Financeira */}
                <div 
                  onClick={() => setLockFinance(!lockFinance)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#fab518] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <p className="text-xs font-black text-[#142142] dark:text-white">
                      Sigilo Financeiro para Membros Operacionais
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Apenas perfis "Administrador" e "Proprietário" visualizam valores em faturas, métricas de MRR e propostas orçamentárias.
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${lockFinance ? 'bg-[#fab518] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <Lock size={13} className="text-[#fab518] shrink-0" />
                  <span>Configurações persistidas no armazenamento seguro do navegador e sincronizadas localmente.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Geral: Perfil & Identidade da Agência */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Agency Official Profile & Contact */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#142142] text-[#fab518] flex items-center justify-center font-black text-lg shadow-sm border border-slate-700">
                    HI
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#142142] dark:text-white">
                      Perfil Institucional da Agência
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Informações usadas em orçamentos, faturas, portal do cliente e cabeçalhos
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  ID: help-ideias-01
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome da Agência */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#fab518]" />
                    <span>Nome Comercial / Marca</span>
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Ex: Help Ideias Digitais"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-bold text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* E-mail de Envio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <Mail size={13} className="text-[#fab518]" />
                    <span>E-mail Institucional</span>
                  </label>
                  <input
                    type="email"
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                    placeholder="contato@helpideiasdigitais.com.br"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Telefone / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#fab518]" />
                    <span>WhatsApp / Telefone</span>
                  </label>
                  <input
                    type="text"
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Website Oficial */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <Globe size={13} className="text-[#fab518]" />
                    <span>Domínio / URL Personalizada</span>
                  </label>
                  <input
                    type="text"
                    value={agencyWebsite}
                    onChange={(e) => setAgencyWebsite(e.target.value)}
                    placeholder="https://app.helpideiasdigitais.com.br"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Chave PIX Padrão */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <Landmark size={13} className="text-[#fab518]" />
                    <span>Chave PIX para Cobranças</span>
                  </label>
                  <input
                    type="text"
                    value={agencyPixKey}
                    onChange={(e) => setAgencyPixKey(e.target.value)}
                    placeholder="financeiro@helpideiasdigitais.com.br"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* CNPJ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#fab518]" />
                    <span>CNPJ / Registro Cadastral</span>
                  </label>
                  <input
                    type="text"
                    value={agencyCnpj}
                    onChange={(e) => setAgencyCnpj(e.target.value)}
                    placeholder="45.892.102/0001-90"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Localização / Cidade */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#fab518]" />
                    <span>Sede / Cidade</span>
                  </label>
                  <input
                    type="text"
                    value={agencyAddress}
                    onChange={(e) => setAgencyAddress(e.target.value)}
                    placeholder="São Paulo - SP, Brasil"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-[#142142] dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <Lock size={12} className="text-[#fab518]" />
                  <span>As alterações são verificadas pelo protocolo 2FA antes de serem salvas.</span>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#142142] hover:bg-[#1c2c54] dark:bg-[#fab518] dark:hover:bg-[#e29f11] text-white dark:text-[#142142] text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Save size={15} />
                  <span>Salvar Dados da Agência</span>
                </button>
              </div>
            </div>

            {/* Right Column (5 cols): Design System & Visual Guidelines */}
            <div className="lg:col-span-5 space-y-6">
              {/* Brand Colors Card */}
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#fab518] flex items-center justify-center font-bold">
                      <Palette size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#142142] dark:text-white">
                        Design System & Cores
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Paleta oficial da Help Ideias Digitais
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                    5 Tons
                  </span>
                </div>

                <div className="space-y-2.5">
                  {officialColors.map((color) => (
                    <div
                      key={color.hex}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-[#fab518]/50 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl shadow-xs border border-black/10 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#142142] dark:text-white truncate">
                              {color.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {color.hex}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {color.role}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyColor(color.hex)}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#142142] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                        title="Copiar código HEX"
                      >
                        {copiedColor === color.hex ? (
                          <Check size={15} className="text-emerald-500" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography Preview Card */}
              <div className="bg-white dark:bg-[#0f172a] rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Type size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#142142] dark:text-white">
                        Tipografia Corporativa
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Família Sofia Pro & Plus Jakarta Sans
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400">Display / Títulos</span>
                    <span className="text-[10px] font-mono text-[#fab518] font-bold">Weight 900 • Black</span>
                  </div>
                  <p className="text-lg font-black text-[#142142] dark:text-white tracking-tight">
                    Help Ideias Digitais • 2026
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    Design tipográfico de alto contraste geométrico, otimizado para leitura dinâmica em painéis Kanban, relatórios executivos e faturamento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
