import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FileCode2,
  Check,
  Clock,
  Globe,
  Activity,
  Server,
  Database,
  FileText,
  Wifi,
  Compass,
} from 'lucide-react';
import { Client } from '../types';
import {
  formatCnpjMask,
  stripCnpjMask,
  validateCnpjCheckDigits,
} from '../utils/cnpjValidator';

interface ApisViewProps {
  clients: Client[];
  onAddClient?: (newClient: Client) => void;
  onNavigateToClients?: () => void;
}

interface CnpjResult {
  cnpj_raiz?: string;
  razao_social?: string;
  capital_social?: string;
  porte?: {
    id?: string;
    descricao?: string;
  };
  natureza_juridica?: {
    codigo?: string;
    descricao?: string;
  };
  estabelecimento?: {
    cnpj?: string;
    nome_fantasia?: string;
    situacao_cadastral?: string;
    data_situacao_cadastral?: string;
    data_inicio_atividade?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    ddd1?: string;
    telefone1?: string;
    email?: string;
    cidade?: {
      nome?: string;
    };
    estado?: {
      sigla?: string;
    };
    atividade_principal?: {
      id?: string;
      descricao?: string;
    };
    atividades_secundarias?: Array<{
      id?: string;
      descricao?: string;
    }>;
  };
  socios?: Array<{
    nome?: string;
    qualificacao_socio?: {
      descricao?: string;
    };
  }>;
}

interface RecentSearchItem {
  cnpj: string;
  name: string;
  timestamp: number;
}

export const ApisView: React.FC<ApisViewProps> = ({
  clients = [],
  onAddClient,
  onNavigateToClients,
}) => {
  // Navegação em abas arquiteturais
  const [activeTab, setActiveTab] = useState<'cnpj' | 'status' | 'history'>('cnpj');

  // Input e Busca de CNPJ
  const [cnpjInput, setCnpjInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CnpjResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [filterSecondaryCnaes, setFilterSecondaryCnaes] = useState('');

  // Auto-preenchimento para onboarding de cliente
  const [autoMonthlyFee, setAutoMonthlyFee] = useState<string>('0');
  const [addedClientId, setAddedClientId] = useState<string | null>(null);

  // Histórico de buscas recentes (com persistência local)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const saved = localStorage.getItem('help_recent_cnpj_queries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Testes de latência de API para o painel de status
  const [apiLatencies, setApiLatencies] = useState<Record<string, number | null>>({});
  const [testingApis, setTestingApis] = useState(false);

  // Validação em tempo real dos dígitos do CNPJ
  const cleanInputDigits = stripCnpjMask(cnpjInput);
  const isInputComplete = cleanInputDigits.length === 14;
  const inputValidation = isInputComplete ? validateCnpjCheckDigits(cleanInputDigits) : null;

  // Exemplos rápidos para demonstração e homologação
  const exampleCnpjs = [
    { label: 'Nubank', cnpj: '18.236.120/0001-58' },
    { label: 'Petrobras', cnpj: '33.000.167/0001-01' },
    { label: 'Mercado Livre', cnpj: '03.361.252/0001-34' },
    { label: 'Magazine Luiza', cnpj: '47.960.950/0001-21' },
    { label: 'Ambev', cnpj: '07.526.557/0001-00' },
  ];

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCnpjMask(rawVal);
    setCnpjInput(formatted);
    setError(null);
  };

  const handleCnpjPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatCnpjMask(pastedText);
    setCnpjInput(formatted);
    setError(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Salva no histórico de buscas recentes
  const saveToRecent = (cnpj: string, companyName: string) => {
    try {
      const item: RecentSearchItem = {
        cnpj,
        name: companyName,
        timestamp: Date.now(),
      };
      setRecentSearches((prev) => {
        const filtered = prev.filter((p) => p.cnpj !== cnpj);
        const updated = [item, ...filtered].slice(0, 12);
        localStorage.setItem('help_recent_cnpj_queries', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn('Erro ao salvar busca recente:', e);
    }
  };

  // Executa a consulta
  const handleSearch = async (targetCnpj?: string) => {
    const raw = stripCnpjMask(targetCnpj || cnpjInput);

    const validation = validateCnpjCheckDigits(raw);
    if (!validation.isValid) {
      setError(
        validation.error ||
          'Por favor, informe um CNPJ válido com 14 dígitos numéricos e dígitos verificadores corretos.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAddedClientId(null);
    setFilterSecondaryCnaes('');

    try {
      const response = await fetch(`/api/cnpj/${raw}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível encontrar dados para este CNPJ.');
      }

      setResult(json.data);
      const name =
        json.data?.estabelecimento?.nome_fantasia ||
        json.data?.razao_social ||
        formatCnpjMask(raw);
      saveToRecent(formatCnpjMask(raw), name);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar à API pública de CNPJ. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Limpa histórico recente
  const handleClearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('help_recent_cnpj_queries');
  };

  // Verifica se o CNPJ consultado já existe na base de clientes da agência
  const cleanResultCnpj = result?.estabelecimento?.cnpj?.replace(/\D/g, '') || '';
  const existingClient = useMemo(() => {
    if (!cleanResultCnpj) return null;
    return clients.find((c) => {
      const cDoc = (c.cpfCnpj || '').replace(/\D/g, '');
      return cDoc.length === 14 && cDoc === cleanResultCnpj;
    });
  }, [clients, cleanResultCnpj]);

  // Tempo de atividade da empresa em anos e meses
  const companyAge = useMemo(() => {
    const dateStr = result?.estabelecimento?.data_inicio_atividade;
    if (!dateStr) return null;
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) return null;
    const now = new Date();
    const diffYears = now.getFullYear() - start.getFullYear();
    const diffMonths = now.getMonth() - start.getMonth();
    let totalYears = diffYears;
    let totalMonths = diffMonths;
    if (totalMonths < 0) {
      totalYears--;
      totalMonths += 12;
    }
    if (totalYears === 0) return `${totalMonths} meses de atividade`;
    if (totalMonths === 0) return `${totalYears} anos de atividade`;
    return `${totalYears} anos e ${totalMonths} meses`;
  }, [result]);

  // Endereço oficial formatado
  const fullAddress = useMemo(() => {
    if (!result?.estabelecimento) return '';
    const est = result.estabelecimento;
    const street = [est.tipo_logradouro, est.logradouro].filter(Boolean).join(' ');
    const num = est.numero || 'S/N';
    const comp = est.complemento ? ` (${est.complemento})` : '';
    const bcast = est.bairro ? `Bairro ${est.bairro}` : '';
    const city = est.cidade?.nome || '';
    const state = est.estado?.sigla || '';
    const cep = est.cep ? `CEP ${est.cep}` : '';

    return [
      street ? `${street}, ${num}${comp}` : '',
      bcast,
      city && state ? `${city} - ${state}` : city || state,
      cep,
    ]
      .filter(Boolean)
      .join(', ');
  }, [result]);

  // Ficha textual oficial para contratos / minutas / WhatsApp
  const contractDossierText = useMemo(() => {
    if (!result) return '';
    const est = result.estabelecimento;
    const sociosList =
      result.socios && result.socios.length > 0
        ? result.socios
            .map((s) => `${s.nome} (${s.qualificacao_socio?.descricao || 'Sócio'})`)
            .join('; ')
        : 'Não informado no QSA';

    return `FICHA CADASTRAL DA EMPRESA (RECEITA FEDERAL DO BRASIL)
Razão Social: ${result.razao_social || 'N/D'}
Nome Fantasia: ${est?.nome_fantasia || 'O mesmo'}
CNPJ: ${formatCnpjMask(est?.cnpj || cleanResultCnpj)}
Situação Cadastral: ${est?.situacao_cadastral || 'Ativa'} (desde ${est?.data_situacao_cadastral || 'N/D'})
Data de Abertura: ${est?.data_inicio_atividade || 'N/D'} (${companyAge || ''})
Capital Social: R$ ${
      result.capital_social
        ? Number(result.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '0,00'
    }
Porte: ${result.porte?.descricao || 'N/D'}
Natureza Jurídica: ${result.natureza_juridica?.descricao || 'N/D'}
Endereço: ${fullAddress}
Telefone: ${est?.ddd1 && est?.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : 'Não cadastrado'}
E-mail: ${est?.email || 'Não cadastrado'}
Atividade Principal (CNAE): [${est?.atividade_principal?.id || ''}] ${est?.atividade_principal?.descricao || ''}
Quadro Societário (QSA): ${sociosList}
Fonte: Base Pública Oficial da Receita Federal via API Help Ideias Digitais (${new Date().toLocaleDateString('pt-BR')})`;
  }, [result, cleanResultCnpj, companyAge, fullAddress]);

  // Ação de Auto-Preenchimento e Onboarding de Cliente
  const handleAutoFillAndRegister = () => {
    if (!result || !onAddClient) return;

    const est = result.estabelecimento;
    const razao = result.razao_social || 'Empresa Sem Razão Social';
    const fantasia = est?.nome_fantasia && est.nome_fantasia.trim() ? est.nome_fantasia : razao;
    const cnae = est?.atividade_principal?.descricao || 'Serviços Empresariais';
    const cleanCnpj = est?.cnpj?.replace(/\D/g, '') || cleanResultCnpj;
    const formattedCnpj = formatCnpjMask(cleanCnpj);

    const street = [est?.tipo_logradouro, est?.logradouro].filter(Boolean).join(' ');
    const num = est?.numero || 'S/N';
    const bcast = est?.bairro || '';
    const city = est?.cidade?.nome || '';
    const state = est?.estado?.sigla || '';
    const cep = est?.cep || '';

    const phoneStr = est?.ddd1 && est?.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : '';
    const emailStr = est?.email ? est.email.toLowerCase() : '';
    const mainPartner =
      result.socios && result.socios.length > 0 ? result.socios[0]?.nome : 'Responsável Legal';

    const numFee = parseFloat(autoMonthlyFee.replace(/\./g, '').replace(',', '.')) || 0;

    const newClientObj: Client = {
      id: `client-${Date.now()}`,
      personType: 'juridica',
      name: fantasia,
      companyName: razao,
      cpfCnpj: formattedCnpj,
      segment: cnae,
      contactName: mainPartner || 'Diretoria Executiva',
      contactRole: 'Sócio / Administrador',
      email: emailStr,
      phone: phoneStr,
      cep: cep,
      street: street,
      number: num,
      complement: est?.complemento || '',
      neighborhood: bcast,
      city: city,
      state: state,
      address: fullAddress,
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
      status: 'Em Onboarding',
      monthlyFee: numFee,
      services: [],
      activeDemandsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      notes: `Cliente cadastrado via API pública oficial de CNPJ em ${new Date().toLocaleDateString(
        'pt-BR'
      )}. Situação na Receita: ${est?.situacao_cadastral || 'Ativa'}.`,
    };

    onAddClient(newClientObj);
    setAddedClientId(newClientObj.id);
  };

  // Testador de latência de endpoints reais
  const handleTestApiLatencies = async () => {
    setTestingApis(true);
    const endpoints: Record<string, string> = {
      cnpj: '/api/cnpj/18236120000158',
      health: '/api/health',
      database: '/api/database',
    };

    const newLatencies: Record<string, number | null> = {};

    for (const [key, url] of Object.entries(endpoints)) {
      const start = performance.now();
      try {
        const res = await fetch(url);
        if (res.ok) {
          newLatencies[key] = Math.round(performance.now() - start);
        } else {
          newLatencies[key] = null;
        }
      } catch {
        newLatencies[key] = null;
      }
    }

    setApiLatencies(newLatencies);
    setTestingApis(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      
      {/* ==================================================================== */}
      {/* 1. TOP HEADER APP BAR: Architectural Breadcrumb & Quick Actions     */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Produção</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              APIs & Consultas Oficiais
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Central de APIs e Integrações
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px]">Receita Federal Online</span>
            </div>
          </div>
        </div>

        {/* Tab Segmented Control (Interactive Buttons) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('cnpj')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cnpj'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 size={14} className="text-[#fab518]" />
            <span>Consulta de CNPJ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity size={14} className="text-emerald-500" />
            <span>Status das APIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} className="text-amber-500" />
            <span>Histórico ({recentSearches.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TAB 1: CONSULTA DE CNPJ (Primary Interactive Tool)               */}
      {/* ==================================================================== */}
      {activeTab === 'cnpj' && (
        <div className="space-y-6">
          
          {/* Query Bar Box */}
          <div className="bg-white dark:bg-[#0c1424] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label
                  htmlFor="input-cnpj-consulta"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                >
                  Consultar CNPJ na Receita Federal
                </label>
                <span className="text-[11px] text-slate-400">
                  Formato padronizado: 00.000.000/0000-00 (Módulo 11)
                </span>
              </div>

              {/* Main Input Control */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2
                      className={`w-5 h-5 transition-colors ${
                        isInputComplete
                          ? inputValidation?.isValid
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                          : 'text-[#fab518]'
                      }`}
                    />
                  </div>

                  <input
                    id="input-cnpj-consulta"
                    type="text"
                    value={cnpjInput}
                    onChange={handleCnpjChange}
                    onPaste={handleCnpjPaste}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    inputMode="numeric"
                    autoFocus
                    className={`w-full pl-11 pr-28 py-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white font-mono text-base tracking-wider focus:outline-none transition-all ${
                      isInputComplete
                        ? inputValidation?.isValid
                          ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                          : 'border-rose-500 ring-2 ring-rose-500/10'
                        : 'border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-1 focus:ring-[#fab518]'
                    }`}
                  />

                  {/* Right Verification Status Inside Input */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isInputComplete && inputValidation?.isValid && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>Válido</span>
                      </span>
                    )}
                    {isInputComplete && !inputValidation?.isValid && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle size={13} className="text-rose-500" />
                        <span>Inválido</span>
                      </span>
                    )}
                    {!isInputComplete && cleanInputDigits.length > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 font-semibold">
                        {cleanInputDigits.length}/14
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || (isInputComplete && !inputValidation?.isValid)}
                  className="px-6 py-3 bg-[#fab518] hover:bg-[#e0a215] text-[#142142] font-black rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Consultando Receita...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Consultar CNPJ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Helper Message Below Input */}
              {isInputComplete && inputValidation?.isValid && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Dígitos verificadores validados matematicamente pelo algoritmo oficial.</span>
                </div>
              )}
              {isInputComplete && !inputValidation?.isValid && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{inputValidation?.error}</span>
                </div>
              )}
              {!isInputComplete && cleanInputDigits.length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha os {14 - cleanInputDigits.length} dígitos restantes para calcular a
                  validação.
                </div>
              )}

              {/* Quick Preset Example Buttons */}
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-slate-400 mr-1">Exemplos oficiais:</span>
                {exampleCnpjs.map((ex) => (
                  <button
                    key={ex.cnpj}
                    type="button"
                    onClick={() => {
                      setCnpjInput(ex.cnpj);
                      handleSearch(ex.cnpj);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer font-medium"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </form>

            {/* Error Feedback Alert */}
            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <p className="font-bold">Não foi possível consultar o CNPJ</p>
                  <p className="mt-0.5 text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* CORPORATE DOSSIER: Loaded Company Results                      */}
          {/* ============================================================== */}
          {result && (
            <div className="space-y-6">
              
              {/* 1-Click Client Onboarding Card */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-300 dark:border-amber-800/80 shadow-2xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Sparkles size={14} className="text-[#fab518]" />
                      <span>Integração com Carteira de Clientes</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {existingClient
                        ? 'Empresa já registrada na sua carteira de clientes'
                        : 'Deseja cadastrar esta empresa como cliente na agência?'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {existingClient ? (
                        <>
                          Localizada sob o nome <strong>"{existingClient.name}"</strong> (ID:{' '}
                          <span className="font-mono">{existingClient.id}</span>).
                        </>
                      ) : addedClientId ? (
                        'Empresa cadastrada com sucesso na base central de clientes!'
                      ) : (
                        'Importe automaticamente Razão Social, Nome Fantasia, CNAE, Endereço e Contatos com 1 clique.'
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    {existingClient ? (
                      <button
                        type="button"
                        onClick={onNavigateToClients}
                        className="px-4 py-2 bg-[#142142] hover:bg-[#1f3263] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Abrir na Carteira</span>
                        <ArrowRight size={13} className="text-[#fab518]" />
                      </button>
                    ) : addedClientId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Cliente Adicionado
                        </span>
                        <button
                          type="button"
                          onClick={onNavigateToClients}
                          className="px-3.5 py-1.5 bg-[#142142] text-white hover:bg-[#1f3263] font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Ir para Clientes
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-slate-500 font-medium">Mensalidade: R$</span>
                          <input
                            type="text"
                            value={autoMonthlyFee}
                            onChange={(e) => setAutoMonthlyFee(e.target.value)}
                            placeholder="0,00"
                            className="w-20 bg-transparent font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAutoFillAndRegister}
                          className="px-4 py-2.5 bg-[#fab518] hover:bg-[#e0a215] text-[#142142] font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sparkles size={14} />
                          <span>Cadastrar Cliente Agora</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Dossier Card */}
              <div className="bg-white dark:bg-[#0c1424] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
                
                {/* Dossier Header & Identification */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5 min-w-0">
                    {/* Zero-Pill Unboxed Status & Metadata */}
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {result.estabelecimento?.situacao_cadastral || 'Ativa'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-bold">
                        CNPJ {formatCnpjMask(result.estabelecimento?.cnpj || cleanResultCnpj)}
                      </span>
                      {result.porte?.descricao && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Porte: {result.porte.descricao}
                          </span>
                        </>
                      )}
                      {companyAge && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {companyAge}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {result.razao_social}
                    </h2>

                    {result.estabelecimento?.nome_fantasia && (
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Nome Fantasia: {result.estabelecimento.nome_fantasia}
                      </p>
                    )}
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(contractDossierText, 'full_dossier')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Copiar texto formatado para proposta, contrato ou WhatsApp"
                    >
                      {copiedKey === 'full_dossier' ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <FileText size={14} />
                      )}
                      <span>
                        {copiedKey === 'full_dossier' ? 'Copiado!' : 'Copiar Ficha Completa'}
                      </span>
                    </button>

                    <a
                      href={`https://publica.cnpj.ws/cnpj/${cleanResultCnpj}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Abrir no portal oficial da API Pública"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>

                {/* 4 Key Stat Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Capital Social */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <DollarSign size={13} className="text-emerald-500" />
                      <span>Capital Social</span>
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums">
                      {result.capital_social
                        ? `R$ ${Number(result.capital_social).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}`
                        : 'R$ 0,00'}
                    </p>
                  </div>

                  {/* Data de Fundação */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Calendar size={13} className="text-amber-500" />
                      <span>Início de Atividades</span>
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums">
                      {result.estabelecimento?.data_inicio_atividade
                        ? result.estabelecimento.data_inicio_atividade.split('-').reverse().join('/')
                        : 'Não informado'}
                    </p>
                  </div>

                  {/* Natureza Jurídica */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Briefcase size={13} className="text-blue-500" />
                      <span>Natureza Jurídica</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {result.natureza_juridica?.descricao || 'Não informado'}
                    </p>
                  </div>

                  {/* Situação Cadastral & Data */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <ShieldCheck size={13} className="text-purple-500" />
                      <span>Situação Cadastral</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {result.estabelecimento?.situacao_cadastral || 'Ativa'}{' '}
                      <span className="text-slate-400 font-mono tabular-nums">
                        (
                        {result.estabelecimento?.data_situacao_cadastral
                          ? result.estabelecimento.data_situacao_cadastral
                              .split('-')
                              .reverse()
                              .join('/')
                          : ''}
                        )
                      </span>
                    </p>
                  </div>
                </div>

                {/* Two-Column Details Grid: Address & Contacts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                  
                  {/* Endereço Oficial */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#fab518]" />
                        <span>Endereço Oficial Registrado</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            fullAddress
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-slate-500 hover:text-amber-500 flex items-center gap-1"
                          title="Ver localização no Google Maps"
                        >
                          <Compass size={12} />
                          <span>Maps</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(fullAddress, 'address')}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer ml-1"
                        >
                          {copiedKey === 'address' ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedKey === 'address' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {result.estabelecimento?.tipo_logradouro}{' '}
                        {result.estabelecimento?.logradouro}, {result.estabelecimento?.numero}
                        {result.estabelecimento?.complemento
                          ? ` (${result.estabelecimento.complemento})`
                          : ''}
                      </p>
                      <p>
                        Bairro: <strong>{result.estabelecimento?.bairro || 'Não informado'}</strong>
                      </p>
                      <p>
                        Município: <strong>{result.estabelecimento?.cidade?.nome || ''}</strong> / UF:{' '}
                        <strong>{result.estabelecimento?.estado?.sigla || ''}</strong>
                      </p>
                      <p className="font-mono tabular-nums">
                        CEP: <strong>{result.estabelecimento?.cep || 'Não informado'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Canais de Contato */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Phone size={14} className="text-emerald-500" />
                      <span>Canais de Contato Cadastrais</span>
                    </span>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" />
                          Telefone:
                        </span>
                        {result.estabelecimento?.ddd1 && result.estabelecimento?.telefone1 ? (
                          <a
                            href={`tel:${result.estabelecimento.ddd1}${result.estabelecimento.telefone1}`}
                            className="font-mono font-bold text-slate-900 dark:text-white hover:text-amber-500 underline underline-offset-2"
                          >
                            ({result.estabelecimento.ddd1}) {result.estabelecimento.telefone1}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono">Não cadastrado</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" />
                          E-mail Fiscal:
                        </span>
                        {result.estabelecimento?.email ? (
                          <a
                            href={`mailto:${result.estabelecimento.email}`}
                            className="font-medium text-slate-900 dark:text-white hover:text-amber-500 underline underline-offset-2 lowercase truncate max-w-[200px]"
                          >
                            {result.estabelecimento.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">Não cadastrado</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-500">Tipo de Unidade:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {result.estabelecimento?.cnpj?.endsWith('0001') ? 'Matriz' : 'Filial'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Atividade Econômica (CNAE Principal e Secundários) */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers size={14} className="text-[#fab518]" />
                    <span>Atividades Econômicas (CNAE)</span>
                  </span>

                  {/* CNAE Principal */}
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block mb-0.5">
                      Atividade Principal
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                        [{result.estabelecimento?.atividade_principal?.id || 'CNAE'}]
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {result.estabelecimento?.atividade_principal?.descricao || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {/* CNAEs Secundários */}
                  {result.estabelecimento?.atividades_secundarias &&
                    result.estabelecimento.atividades_secundarias.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Atividades Secundárias (
                            <span className="font-mono tabular-nums">
                              {result.estabelecimento.atividades_secundarias.length}
                            </span>
                            )
                          </span>
                          <input
                            type="text"
                            value={filterSecondaryCnaes}
                            onChange={(e) => setFilterSecondaryCnaes(e.target.value)}
                            placeholder="Filtrar CNAEs..."
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin text-xs">
                          {result.estabelecimento.atividades_secundarias
                            .filter(
                              (c) =>
                                !filterSecondaryCnaes ||
                                c.descricao?.toLowerCase().includes(filterSecondaryCnaes.toLowerCase()) ||
                                c.id?.includes(filterSecondaryCnaes)
                            )
                            .map((sec, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 py-1 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                              >
                                <span className="font-mono text-slate-400 font-semibold tabular-nums shrink-0">
                                  [{sec.id}]
                                </span>
                                <span className="text-slate-600 dark:text-slate-400">
                                  {sec.descricao}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Quadro de Sócios e Administradores (QSA) */}
                {result.socios && result.socios.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UserCheck size={14} className="text-blue-500" />
                      <span>
                        Quadro de Sócios e Administradores (QSA) (
                        <span className="font-mono tabular-nums">{result.socios.length}</span>)
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {result.socios.map((socio, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#142142] text-[#fab518] font-bold text-xs flex items-center justify-center shrink-0">
                            {socio.nome ? socio.nome.charAt(0) : 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {socio.nome}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {socio.qualificacao_socio?.descricao || 'Sócio / Administrador'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON Debugging Panel */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowJsonRaw(!showJsonRaw)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCode2 size={14} />
                    <span>
                      {showJsonRaw ? 'Ocultar JSON da API' : 'Inspecionar Resposta Bruta (JSON)'}
                    </span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Provider: publica.cnpj.ws
                  </span>
                </div>

                {showJsonRaw && (
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-80 scrollbar-thin">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. TAB 2: STATUS DAS APIS & INTEGRAÇÕES (Agency Tech Infrastructure) */}
      {/* ==================================================================== */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c1424] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Infraestrutura de APIs Conectadas
                </h2>
                <p className="text-xs text-slate-500">
                  Visão em tempo real dos serviços e integrações ativas no sistema Help Ideias Digitais
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestApiLatencies}
                disabled={testingApis}
                className="px-4 py-2 bg-[#142142] hover:bg-[#1f3263] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                <RefreshCw size={13} className={testingApis ? 'animate-spin' : ''} />
                <span>{testingApis ? 'Medindo Latência...' : 'Testar Latência (Ping)'}</span>
              </button>
            </div>

            {/* List of 5 Core APIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* API 1: CNPJ Oficial */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#fab518]" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Receita Federal & CNPJ
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operacional
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Consulta de dados cadastrais, QSA e atividades econômicas via publica.cnpj.ws com fallback BrasilAPI.
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span>GET /api/cnpj/:cnpj</span>
                  <span>{apiLatencies.cnpj !== undefined && apiLatencies.cnpj !== null ? `${apiLatencies.cnpj}ms` : '3 req/min'}</span>
                </div>
              </div>

              {/* API 2: Banco de Dados Central */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-blue-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Base Central da Agência
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Sincronizado
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Persistência centralizada de clientes, demandas e finanças com sincronização Supabase multi-dispositivo.
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span>GET/POST /api/database</span>
                  <span>{apiLatencies.database !== undefined && apiLatencies.database !== null ? `${apiLatencies.database}ms` : 'Zero delay'}</span>
                </div>
              </div>

              {/* API 3: WebSocket Realtime */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={16} className="text-purple-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      WebSocket Realtime Gateway
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ao Vivo
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Comunicação bidirecional e eventos de presença, chat e notificações em tempo real.
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span>wss:// (Porta 3000)</span>
                  <span>Sub-20ms</span>
                </div>
              </div>

              {/* API 4: Propostas Públicas */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Portal Público de Propostas
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Visualização pública de orçamentos e registro de assinatura/aprovação digital direta pelo cliente.
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span>GET/POST /api/public/proposal/:id</span>
                  <span>SSL / HTTPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. TAB 3: HISTÓRICO DE BUSCAS RECENTES                               */}
      {/* ==================================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#0c1424] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Histórico de Consultas Locais
              </h2>
              <p className="text-xs text-slate-500">
                Empresas pesquisadas recentemente salvas em cache local para acesso rápido sem custo de requisição
              </p>
            </div>

            {recentSearches.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Limpar Histórico
              </button>
            )}
          </div>

          {recentSearches.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Clock size={22} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum CNPJ consultado recentemente.</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Faça uma busca na aba "Consulta de CNPJ" para salvar registros aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentSearches.map((item) => (
                <div
                  key={item.cnpj}
                  onClick={() => {
                    setCnpjInput(item.cnpj);
                    setActiveTab('cnpj');
                    handleSearch(item.cnpj);
                  }}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer group"
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors truncate">
                    {item.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                    {item.cnpj}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono tabular-nums">
                    {new Date(item.timestamp).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
