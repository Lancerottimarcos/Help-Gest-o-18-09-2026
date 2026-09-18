import React, { useState, useMemo } from 'react';
import { 
  Cake, 
  Gift, 
  PartyPopper, 
  Calendar, 
  MessageCircle, 
  Mail, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronRight, 
  Phone, 
  ArrowUpRight, 
  Users, 
  Search, 
  Send, 
  Heart,
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { Client, PageId } from '../types';

interface ClientBirthdaysSectionProps {
  clients: Client[];
  onNavigate: (page: PageId) => void;
  onSelectClient?: (client: Client) => void;
}

interface ParsedBirthday {
  client: Client;
  birthYear?: number;
  birthMonth: number; // 1-12
  birthDay: number; // 1-31
  formattedDate: string; // e.g. "17 de Setembro"
  shortDate: string; // e.g. "17/09"
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean; // within next 7 days
  isThisMonth: boolean;
  hasPassedThisMonth: boolean;
  daysRemaining: number;
  turningAge?: number;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const ClientBirthdaysSection: React.FC<ClientBirthdaysSectionProps> = ({
  clients,
  onNavigate,
  onSelectClient,
}) => {
  const [activeFilter, setActiveFilter] = useState<'mes' | 'hoje' | 'semana' | 'proximos' | 'sem_data'>('mes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForMessage, setSelectedClientForMessage] = useState<Client | null>(null);
  const [messageTemplate, setMessageTemplate] = useState<'festivo' | 'corporativo' | 'bonus'>('festivo');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  // Reference date: Current date in PT-BR
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // Current month name
  const currentMonthName = MONTH_NAMES_PT[currentMonth - 1];

  // Parse and calculate all birthdays
  const { birthdayList, clientsWithoutBirthDate, todayCount, thisWeekCount, thisMonthCount } = useMemo(() => {
    const list: ParsedBirthday[] = [];
    const withoutDate: Client[] = [];
    let tCount = 0;
    let wCount = 0;
    let mCount = 0;

    // Midnight timestamp of today for accurate delta calculation
    const todayMidnight = new Date(currentYear, today.getMonth(), currentDay).getTime();

    clients.forEach((client) => {
      if (!client.birthDate) {
        withoutDate.push(client);
        return;
      }

      const parts = client.birthDate.split(/[-/]/);
      if (parts.length < 3) {
        withoutDate.push(client);
        return;
      }

      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        withoutDate.push(client);
        return;
      }

      const isToday = month === currentMonth && day === currentDay;
      const isThisMonth = month === currentMonth;
      const hasPassedThisMonth = isThisMonth && day < currentDay;

      // Next birthday date calculation
      let nextBirthdayDate = new Date(currentYear, month - 1, day);
      if (nextBirthdayDate.getTime() < todayMidnight && !isToday) {
        // Already passed this year, next one is next year
        nextBirthdayDate = new Date(currentYear + 1, month - 1, day);
      }

      const diffMs = nextBirthdayDate.getTime() - todayMidnight;
      const daysRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const isTomorrow = daysRemaining === 1;
      const isThisWeek = daysRemaining >= 0 && daysRemaining <= 7;
      const turningAge = year && year > 1900 && year <= currentYear ? (currentYear - year) : undefined;

      if (isToday) tCount++;
      if (isThisWeek) wCount++;
      if (isThisMonth) mCount++;

      list.push({
        client,
        birthYear: year > 1900 ? year : undefined,
        birthMonth: month,
        birthDay: day,
        formattedDate: `${day} de ${MONTH_NAMES_PT[month - 1]}`,
        shortDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
        isToday,
        isTomorrow,
        isThisWeek,
        isThisMonth,
        hasPassedThisMonth,
        daysRemaining,
        turningAge,
      });
    });

    // Default sorting:
    // 1. Is Today first
    // 2. Soonest days remaining
    list.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysRemaining - b.daysRemaining;
    });

    return {
      birthdayList: list,
      clientsWithoutBirthDate: withoutDate,
      todayCount: tCount,
      thisWeekCount: wCount,
      thisMonthCount: mCount,
    };
  }, [clients, currentYear, currentMonth, currentDay, today]);

  // Filter based on active tab
  const filteredBirthdays = useMemo(() => {
    let result = birthdayList;

    if (activeFilter === 'hoje') {
      result = birthdayList.filter((b) => b.isToday);
    } else if (activeFilter === 'semana') {
      result = birthdayList.filter((b) => b.isThisWeek);
    } else if (activeFilter === 'mes') {
      result = birthdayList.filter((b) => b.isThisMonth);
    } else if (activeFilter === 'proximos') {
      result = [...birthdayList].sort((a, b) => a.daysRemaining - b.daysRemaining);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.client.name.toLowerCase().includes(q) ||
          b.client.companyName.toLowerCase().includes(q) ||
          (b.client.contactName && b.client.contactName.toLowerCase().includes(q)) ||
          (b.client.segment && b.client.segment.toLowerCase().includes(q)) ||
          b.formattedDate.toLowerCase().includes(q)
      );
    }

    return result;
  }, [birthdayList, activeFilter, searchQuery]);

  // Filtered clients without birth date for the 'sem_data' tab
  const filteredClientsWithoutBirthDate = useMemo(() => {
    if (activeFilter !== 'sem_data') return [];
    if (!searchQuery.trim()) return clientsWithoutBirthDate;
    const q = searchQuery.toLowerCase().trim();
    return clientsWithoutBirthDate.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        (c.contactName && c.contactName.toLowerCase().includes(q)) ||
        (c.segment && c.segment.toLowerCase().includes(q))
    );
  }, [clientsWithoutBirthDate, activeFilter, searchQuery]);

  // Generates birthday message based on template
  const generateMessage = (client: Client, template: 'festivo' | 'corporativo' | 'bonus') => {
    const contact = client.contactName || client.name.split(' ')[0];
    const company = client.companyName || client.name;
    const agencyName = 'Ideias Digitais';

    if (template === 'festivo') {
      return `Olá, ${contact}! 🎂🎉\n\nToda a equipe da ${agencyName} passa por aqui com muito carinho para te desejar um Feliz Aniversário!\n\nQue este novo ciclo traga ainda mais saúde, realizações e conquistas incríveis para você e para a ${company}. Parabéns pelo seu dia! ✨🎈`;
    }

    if (template === 'corporativo') {
      return `Prezado(a) ${contact},\n\nEm nome de toda a equipe da ${agencyName}, gostaríamos de parabenizá-lo(a) por mais um ano de vida! 🥂\n\nÉ um privilégio caminhar ao lado de vocês da ${company}. Agradecemos pela confiança em nossa parceria e desejamos constante prosperidade, saúde e sucesso.\n\nUm forte abraço!`;
    }

    return `Parabéns pelo seu dia, ${contact}! 🎁✨\n\nA equipe da ${agencyName} preparou uma surpresa especial para comemorar seu aniversário: disponibilizamos um bônus especial na próxima entrega de criativos/campanhas da ${company}!\n\nEsperamos que seu dia seja maravilhoso e repleto de motivos para comemorar. Feliz Aniversário! 🎂🚀`;
  };

  // Open Message Modal
  const handleOpenMessageModal = (client: Client) => {
    setSelectedClientForMessage(client);
    setMessageTemplate('festivo');
    setCustomMessage(generateMessage(client, 'festivo'));
    setCopiedSuccess(false);
  };

  // Switch template inside modal
  const handleSelectTemplate = (template: 'festivo' | 'corporativo' | 'bonus') => {
    if (!selectedClientForMessage) return;
    setMessageTemplate(template);
    setCustomMessage(generateMessage(selectedClientForMessage, template));
    setCopiedSuccess(false);
  };

  // Copy message to clipboard
  const handleCopyMessage = async (text: string, cardId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (cardId) {
        setCopiedCardId(cardId);
        setTimeout(() => setCopiedCardId(null), 2500);
      } else {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  // Send WhatsApp message
  const handleSendWhatsApp = (client: Client, text?: string) => {
    const messageToSend = text || generateMessage(client, 'festivo');
    let phone = client.phone ? client.phone.replace(/\D/g, '') : '';
    
    // Add Brazilian country code 55 if missing and valid DDD
    if (phone.length === 10 || phone.length === 11) {
      phone = `55${phone}`;
    }

    const whatsappUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageToSend)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageToSend)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Send Email
  const handleSendEmail = (client: Client) => {
    const contact = client.contactName || client.name.split(' ')[0];
    const subject = encodeURIComponent(`Feliz Aniversário, ${contact}! 🎉🎂`);
    const body = encodeURIComponent(generateMessage(client, 'corporativo'));
    window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
  };

  // Find if there is any client having birthday today for the highlight banner
  const todayBirthdays = useMemo(() => birthdayList.filter((b) => b.isToday), [birthdayList]);

  return (
    <section 
      id="section-client-birthdays"
      aria-label="Aniversariantes de Clientes" 
      className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 transition-all"
    >
      {/* Header with Title, Period Info, and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center shadow-xs border border-amber-200/60 dark:border-amber-900/40 shrink-0">
            <Cake size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
                Aniversariantes de Clientes
              </h3>
              {todayCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] border border-amber-300 dark:border-[#fab518]/40 animate-pulse">
                  <Sparkles size={12} className="text-[#fab518]" />
                  <span>{todayCount} Aniversariante{todayCount > 1 ? 's' : ''} Hoje!</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estreite laços e fidelize enviando felicitações personalizadas nas datas especiais dos clientes.
            </p>
          </div>
        </div>

        {/* Month indicator badge & Action to Clients View */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <Calendar size={13} className="text-[#fab518]" />
            <span>{currentMonthName} de {currentYear}</span>
          </span>

          <button
            type="button"
            id="btn-navigate-all-clients-birthdays"
            onClick={() => onNavigate('clientes')}
            className="text-xs font-bold text-[#142142] dark:text-[#fab518] hover:text-[#fab518] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Ver carteira completa de clientes"
          >
            <span>Ver Clientes</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Hero Banner when someone has a birthday TODAY */}
      {todayBirthdays.length > 0 && (
        <div 
          id="banner-birthday-today-highlight"
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#fab518]/10 to-amber-500/5 dark:from-amber-950/40 dark:via-[#0f172a] dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 shadow-sm font-black text-xl">
              🎉
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#fab518] text-[#142142]">
                  Destaque do Dia
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {todayBirthdays[0].formattedDate}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-[#142142] dark:text-white truncate mt-1">
                {todayBirthdays.map((b) => b.client.name).join(', ')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                {todayBirthdays.length === 1 
                  ? `Comemorando hoje! ${todayBirthdays[0].turningAge ? `Completando ${todayBirthdays[0].turningAge} anos.` : ''} Não deixe de enviar os parabéns da agência.`
                  : `${todayBirthdays.length} clientes comemorando aniversário hoje! Fortaleça sua parceria.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              id="btn-today-hero-whatsapp"
              onClick={() => handleSendWhatsApp(todayBirthdays[0].client)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <MessageCircle size={14} className="stroke-[2.5]" />
              <span>Felicitar no WhatsApp</span>
            </button>

            <button
              type="button"
              id="btn-today-hero-customize"
              onClick={() => handleOpenMessageModal(todayBirthdays[0].client)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-[#142142] dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-[#fab518]" />
              <span>Ver Modelos</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Period Filter Tabs */}
        <div 
          id="tabs-birthdays-period"
          className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto"
        >
          <button
            type="button"
            id="tab-birthdays-mes"
            onClick={() => setActiveFilter('mes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'mes'
                ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <span>Neste Mês</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              activeFilter === 'mes'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {thisMonthCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-birthdays-hoje"
            onClick={() => setActiveFilter('hoje')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'hoje'
                ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <span>Hoje</span>
            {todayCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#fab518] text-[#142142] font-black">
                {todayCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-birthdays-semana"
            onClick={() => setActiveFilter('semana')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'semana'
                ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <span>Nesta Semana</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              activeFilter === 'semana'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {thisWeekCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-birthdays-proximos"
            onClick={() => setActiveFilter('proximos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'proximos'
                ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
            }`}
          >
            <span>Todos os Próximos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {birthdayList.length}
            </span>
          </button>

          {clientsWithoutBirthDate.length > 0 && (
            <button
              type="button"
              id="tab-birthdays-sem-data"
              onClick={() => setActiveFilter('sem_data')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'sem_data'
                  ? 'bg-white dark:bg-slate-700 text-[#142142] dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white'
              }`}
              title="Clientes sem data de aniversário cadastrada"
            >
              <span>Sem Data</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold">
                {clientsWithoutBirthDate.length}
              </span>
            </button>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="input-search-birthdays"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente ou empresa..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content: List of Birthdays */}
      {activeFilter !== 'sem_data' ? (
        filteredBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBirthdays.map((item) => {
              const { client, formattedDate, shortDate, isToday, isTomorrow, daysRemaining, turningAge, hasPassedThisMonth } = item;
              const isCopied = copiedCardId === client.id;

              return (
                <div
                  key={client.id}
                  id={`card-birthday-client-${client.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group relative ${
                    isToday
                      ? 'bg-amber-50/40 dark:bg-[#fab518]/5 border-[#fab518] shadow-sm'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    {/* Top: Avatar, Name and Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {client.avatar?.trim() ? (
                            <img
                              src={client.avatar}
                              alt={client.name}
                              className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-[#142142] font-black text-sm flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isToday && (
                            <span 
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center text-[10px] shadow-xs"
                              title="Aniversário Hoje!"
                            >
                              🎂
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 
                            onClick={() => {
                              if (onSelectClient) {
                                onSelectClient(client);
                              } else {
                                onNavigate('clientes');
                              }
                            }}
                            className="text-xs sm:text-sm font-bold text-[#142142] dark:text-white truncate hover:text-[#fab518] cursor-pointer transition-colors"
                            title={client.name}
                          >
                            {client.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {client.companyName !== client.name ? client.companyName : client.segment}
                          </p>
                        </div>
                      </div>

                      {/* Birthday Timing Badge */}
                      <span className={`shrink-0 text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1 ${
                        isToday
                          ? 'bg-[#fab518] text-[#142142] border-amber-400'
                          : isTomorrow
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                          : daysRemaining <= 7 && daysRemaining > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                          : hasPassedThisMonth
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                          : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                      }`}>
                        {isToday ? (
                          <>
                            <span>Hoje!</span>
                            <Sparkles size={11} />
                          </>
                        ) : isTomorrow ? (
                          'Amanhã'
                        ) : daysRemaining <= 7 && daysRemaining > 0 ? (
                          `Em ${daysRemaining} dias`
                        ) : hasPassedThisMonth ? (
                          'Passou neste mês'
                        ) : (
                          `Em ${daysRemaining} dias`
                        )}
                      </span>
                    </div>

                    {/* Date Details & Age Info */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                        <Calendar size={13} className="text-[#fab518] shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {turningAge && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {hasPassedThisMonth ? `Completou ${turningAge} anos` : `Completará ${turningAge} anos`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate">
                        {client.contactName ? `Contato: ${client.contactName}` : client.city ? `${client.city}/${client.state || ''}` : client.email}
                      </span>
                      {client.phone && (
                        <span className="font-mono text-slate-600 dark:text-slate-300 shrink-0">
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: WhatsApp, Customize Message, Copy, Email */}
                  <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-1.5">
                    {/* Direct WhatsApp Button */}
                    <button
                      type="button"
                      id={`btn-whatsapp-client-${client.id}`}
                      onClick={() => handleSendWhatsApp(client)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title={`Enviar mensagem de aniversário no WhatsApp para ${client.name}`}
                    >
                      <MessageCircle size={13} className="stroke-[2.5]" />
                      <span>WhatsApp</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Customize Message Modal */}
                      <button
                        type="button"
                        id={`btn-customize-msg-${client.id}`}
                        onClick={() => handleOpenMessageModal(client)}
                        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Ver e personalizar modelo de mensagem de parabéns"
                        aria-label="Ver modelos de mensagem"
                      >
                        <Sparkles size={14} className="text-[#fab518]" />
                      </button>

                      {/* Fast Copy Message */}
                      <button
                        type="button"
                        id={`btn-copy-msg-${client.id}`}
                        onClick={() => handleCopyMessage(generateMessage(client, 'festivo'), client.id)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                        }`}
                        title={isCopied ? 'Mensagem copiada!' : 'Copiar texto de parabéns'}
                        aria-label="Copiar mensagem"
                      >
                        {isCopied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                      </button>

                      {/* Send Email */}
                      {client.email && (
                        <button
                          type="button"
                          id={`btn-email-client-${client.id}`}
                          onClick={() => handleSendEmail(client)}
                          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title={`Enviar e-mail de felicitações para ${client.email}`}
                          aria-label="Enviar e-mail"
                        >
                          <Mail size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State for Birthday Filter */
          <div 
            id="empty-state-birthdays"
            className="py-10 px-4 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center mx-auto shadow-2xs">
              <Cake size={24} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-[#142142] dark:text-white">
                {activeFilter === 'hoje'
                  ? 'Nenhum cliente fazendo aniversário hoje'
                  : activeFilter === 'semana'
                  ? 'Nenhum aniversário nos próximos 7 dias'
                  : activeFilter === 'mes'
                  ? `Nenhum aniversário cadastrado para ${currentMonthName}`
                  : 'Nenhum cliente encontrado com estes critérios'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeFilter === 'hoje'
                  ? 'Confira os aniversariantes do mês para antecipar o contato ou planejar ações de relacionamento.'
                  : 'Você pode cadastrar a data de nascimento nas configurações de cada cliente para ser notificado automaticamente.'}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              {activeFilter !== 'mes' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('mes');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Ver Todos de {currentMonthName}
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('clientes')}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#142142] dark:text-white font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Gerenciar Clientes
              </button>
            </div>
          </div>
        )
      ) : (
        /* Tab 'Sem Data': Lists clients who do not have birthDate defined */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
            <Info size={16} className="shrink-0 text-[#fab518]" />
            <span>
              Estes <strong>{clientsWithoutBirthDate.length}</strong> clientes ainda não possuem data de nascimento/aniversário registrada. Clique em um cliente para abrir seu cadastro e preencher o campo de data.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredClientsWithoutBirthDate.map((client) => (
              <div
                key={client.id}
                onClick={() => onNavigate('clientes')}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#fab518] hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {client.avatar?.trim() ? (
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 text-[#142142] dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-[#142142] dark:text-white truncate group-hover:text-[#fab518] transition-colors">
                      {client.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {client.companyName || client.segment}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-[#fab518] transition-colors">
                  <span>Definir</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Customizing Birthday Message */}
      {selectedClientForMessage && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white dark:bg-[#0f172a] rounded-[28px] max-w-lg w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#fab518] flex items-center justify-center shrink-0">
                  <PartyPopper size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142142] dark:text-white">
                    Mensagem de Felicitações
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedClientForMessage.name} • {selectedClientForMessage.companyName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-birthday-message-modal"
                onClick={() => setSelectedClientForMessage(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Escolha o Modelo de Mensagem:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('festivo')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    messageTemplate === 'festivo'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-[#fab518] text-[#142142] dark:text-white font-bold shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1">
                    <span>🎉 Festivo</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Acolhedor e caloroso
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('corporativo')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    messageTemplate === 'corporativo'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-[#fab518] text-[#142142] dark:text-white font-bold shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1">
                    <span>🤝 Parceria</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Elegante e formal
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('bonus')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    messageTemplate === 'bonus'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-[#fab518] text-[#142142] dark:text-white font-bold shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1">
                    <span>🎁 Com Bônus</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Com mimo da agência
                  </p>
                </button>
              </div>
            </div>

            {/* Editable Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Texto da Mensagem:
                </label>
                <span className="text-[11px] text-slate-400">Você pode editar livremente</span>
              </div>
              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#fab518] leading-relaxed resize-none"
              />
            </div>

            {/* Recipient info & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Phone size={13} className="text-[#fab518]" />
                <span>{selectedClientForMessage.phone || 'Sem telefone registrado'}</span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  id="btn-modal-copy-message"
                  onClick={() => handleCopyMessage(customMessage)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    copiedSuccess
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {copiedSuccess ? (
                    <>
                      <Check size={14} className="stroke-[3] text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-modal-send-whatsapp"
                  onClick={() => {
                    handleSendWhatsApp(selectedClientForMessage, customMessage);
                    setSelectedClientForMessage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <MessageCircle size={14} className="stroke-[2.5]" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
