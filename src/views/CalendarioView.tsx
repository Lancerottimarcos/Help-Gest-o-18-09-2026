import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  Sparkles, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Copy, 
  Check, 
  Cake, 
  Flame, 
  ShoppingBag, 
  Flag, 
  Globe, 
  Briefcase, 
  Clock, 
  ArrowRight, 
  X, 
  Layers, 
  Grid, 
  List, 
  Lightbulb, 
  CheckCircle2, 
  Trash2,
  Share2
} from 'lucide-react';
import { CommemorativeDate, CommemorativeDateCategory, Client, DemandItem } from '../types';
import { initialCommemorativeDates, MONTH_NAMES_PT, CATEGORY_FILTERS } from '../data/commemorativeDatesData';

interface CalendarioViewProps {
  clients: Client[];
  onOpenNewDemandModal?: (initialData?: { title?: string; client?: string; dueDate?: string; description?: string }) => void;
  onSelectClient?: (client: Client) => void;
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({
  clients,
  onOpenNewDemandModal,
}) => {
  // Current date anchor (September 2026 as per app metadata)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 1-12 (September is 9)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommemorativeDateCategory>('todos');
  const [selectedSegment, setSelectedSegment] = useState<string>('todos');

  // Custom user-created commemorative dates saved in localStorage
  const [customDates, setCustomDates] = useState<CommemorativeDate[]>(() => {
    try {
      const saved = localStorage.getItem('agency_custom_commemorative_dates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const saveCustomDates = (dates: CommemorativeDate[]) => {
    setCustomDates(dates);
    try {
      localStorage.setItem('agency_custom_commemorative_dates', JSON.stringify(dates));
    } catch {
      // ignore
    }
  };

  // Modal / Drawer state for date inspection & creation
  const [activeDateModal, setActiveDateModal] = useState<CommemorativeDate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const showCopiedToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2500);
  };

  // Transform client birthdays into commemorative dates
  const clientBirthdays: CommemorativeDate[] = useMemo(() => {
    return clients
      .filter((c) => c.birthDate)
      .map((c) => {
        const parts = c.birthDate.split('-');
        let m = 0;
        let d = 0;
        if (parts.length === 3) {
          m = parseInt(parts[1], 10);
          d = parseInt(parts[2], 10);
        } else if (parts.length === 2) {
          m = parseInt(parts[0], 10);
          d = parseInt(parts[1], 10);
        }

        const dateStr = `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        return {
          id: `bday-${c.id}`,
          title: `Aniversário de ${c.contactName || c.name}`,
          date: dateStr,
          day: d,
          month: m,
          year: 2026,
          category: 'aniversario_cliente',
          categoryLabel: 'Aniversário de Cliente',
          description: `Aniversário de ${c.name} (${c.companyName || c.segment}). Excelente oportunidade para enviar mimo personalizado, mensagem especial do proprietário e post colaborativo.`,
          targetSegments: [c.segment || 'Geral'],
          contentHook: `Hoje é dia de celebrar a vida de quem faz nossa parceria ser incrível! Desejamos muitas realizações, saúde e sucesso a ${c.contactName || c.name}!`,
          suggestedFormats: ['Stories', 'Post'],
          clientRefId: c.id,
        };
      });
  }, [clients]);

  // Combine all dates: Initial catalogue + Custom agency dates + Client birthdays
  const allDates: CommemorativeDate[] = useMemo(() => {
    return [...initialCommemorativeDates, ...customDates, ...clientBirthdays];
  }, [customDates, clientBirthdays]);

  // Distinct available segments for filtering
  const availableSegments = useMemo(() => {
    const set = new Set<string>();
    allDates.forEach((d) => {
      d.targetSegments?.forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [allDates]);

  // Filter dates based on current criteria
  const filteredMonthDates = useMemo(() => {
    return allDates.filter((d) => {
      // Month match (for month-filtered views)
      if (d.month !== selectedMonth) return false;

      // Category filter
      if (selectedCategory !== 'todos' && d.category !== selectedCategory) {
        return false;
      }

      // Segment filter
      if (selectedSegment !== 'todos') {
        const matches = d.targetSegments?.some(
          (s) => s.toLowerCase().includes(selectedSegment.toLowerCase()) || s === 'Geral'
        );
        if (!matches) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesDesc = d.description.toLowerCase().includes(q);
        const matchesHook = d.contentHook?.toLowerCase().includes(q) || false;
        const matchesSegment = d.targetSegments?.some((s) => s.toLowerCase().includes(q)) || false;
        if (!matchesTitle && !matchesDesc && !matchesHook && !matchesSegment) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => a.day - b.day);
  }, [allDates, selectedMonth, selectedCategory, selectedSegment, searchQuery]);

  // All dates matching search/filter regardless of month (for global search)
  const globalFilteredDates = useMemo(() => {
    if (!searchQuery.trim() && selectedCategory === 'todos' && selectedSegment === 'todos') {
      return null;
    }
    return allDates.filter((d) => {
      if (selectedCategory !== 'todos' && d.category !== selectedCategory) {
        return false;
      }
      if (selectedSegment !== 'todos') {
        const matches = d.targetSegments?.some(
          (s) => s.toLowerCase().includes(selectedSegment.toLowerCase()) || s === 'Geral'
        );
        if (!matches) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.contentHook && d.contentHook.toLowerCase().includes(q)) ||
          (d.targetSegments && d.targetSegments.some((s) => s.toLowerCase().includes(q)))
        );
      }
      return true;
    }).sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [allDates, searchQuery, selectedCategory, selectedSegment]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleGoToCurrentMonth = () => {
    setSelectedYear(2026);
    setSelectedMonth(9);
  };

  // Calendar calculations for grid
  const daysInCurrentMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const firstDayWeekday = useMemo(() => {
    // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return new Date(selectedYear, selectedMonth - 1, 1).getDay();
  }, [selectedYear, selectedMonth]);

  // Helper to map category to color styles
  const getCategoryTheme = (category: CommemorativeDateCategory) => {
    switch (category) {
      case 'comercial':
        return {
          badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
          badgeText: 'text-amber-900 dark:text-amber-200',
          badgeBorder: 'border-amber-300 dark:border-amber-700/60',
          dotColor: 'bg-amber-500',
          icon: ShoppingBag,
        };
      case 'feriado':
        return {
          badgeBg: 'bg-rose-100 dark:bg-rose-950/70',
          badgeText: 'text-rose-800 dark:text-rose-200',
          badgeBorder: 'border-rose-300 dark:border-rose-700/60',
          dotColor: 'bg-rose-500',
          icon: Flag,
        };
      case 'redes_sociais':
        return {
          badgeBg: 'bg-indigo-100 dark:bg-indigo-950/70',
          badgeText: 'text-indigo-900 dark:text-indigo-200',
          badgeBorder: 'border-indigo-300 dark:border-indigo-700/60',
          dotColor: 'bg-indigo-500',
          icon: Globe,
        };
      case 'profissao_nicho':
        return {
          badgeBg: 'bg-sky-100 dark:bg-sky-950/70',
          badgeText: 'text-sky-900 dark:text-sky-200',
          badgeBorder: 'border-sky-300 dark:border-sky-700/60',
          dotColor: 'bg-sky-500',
          icon: Briefcase,
        };
      case 'aniversario_cliente':
        return {
          badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
          badgeText: 'text-emerald-900 dark:text-emerald-200',
          badgeBorder: 'border-emerald-300 dark:border-emerald-700/60',
          dotColor: 'bg-emerald-500',
          icon: Cake,
        };
      case 'personalizada':
      default:
        return {
          badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
          badgeText: 'text-purple-900 dark:text-purple-200',
          badgeBorder: 'border-purple-300 dark:border-purple-700/60',
          dotColor: 'bg-purple-500',
          icon: Sparkles,
        };
    }
  };

  // Copy full month briefing to clipboard
  const handleCopyMonthPauta = () => {
    const lines = [
      `📅 PAUTA DE DATAS COMEMORATIVAS - ${MONTH_NAMES_PT[selectedMonth - 1].toUpperCase()} ${selectedYear}`,
      `Help Ideias Digitais • Planejamento Estratégico`,
      `--------------------------------------------------`,
      '',
    ];

    filteredMonthDates.forEach((d) => {
      lines.push(`• ${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}: ${d.title} [${d.categoryLabel}]`);
      if (d.targetSegments && d.targetSegments.length > 0) {
        lines.push(`  Segmentos: ${d.targetSegments.join(', ')}`);
      }
      if (d.contentHook) {
        lines.push(`  Ideia de Post: "${d.contentHook}"`);
      }
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    showCopiedToast('Pauta do mês copiada para a área de transferência!');
  };

  // Generate real .ics file for Google Calendar / Apple Calendar
  const handleExportICS = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Help Ideias Digitais//Datas Comemorativas 2026//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Datas Comemorativas 2026 - Help Ideias',
    ];

    const datesToExport = filteredMonthDates.length > 0 ? filteredMonthDates : allDates;

    datesToExport.forEach((d) => {
      const year = d.year || 2026;
      const monthStr = String(d.month).padStart(2, '0');
      const dayStr = String(d.day).padStart(2, '0');
      const dtDate = `${year}${monthStr}${dayStr}`;

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:comm-${d.id}-${year}@helpideias.com.br`);
      icsContent.push(`DTSTAMP:${dtDate}T090000Z`);
      icsContent.push(`DTSTART;VALUE=DATE:${dtDate}`);
      icsContent.push(`SUMMARY:${d.title}`);
      icsContent.push(`DESCRIPTION:${(d.description + (d.contentHook ? ' | Gancho: ' + d.contentHook : '')).replace(/\n/g, ' ')}`);
      icsContent.push(`CATEGORIES:${d.categoryLabel}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `datas-comemorativas-${MONTH_NAMES_PT[selectedMonth - 1].toLowerCase()}-2026.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showCopiedToast('Arquivo .ICS gerado com sucesso!');
  };

  // Trigger demand creation from a date
  const handleCreateDemandFromDate = (dateItem: CommemorativeDate) => {
    if (onOpenNewDemandModal) {
      const defaultClient = clients[0]?.name || 'Dra. Camila Vasconcellos';
      const defaultDueDate = `${dateItem.year || 2026}-${String(dateItem.month).padStart(2, '0')}-${String(dateItem.day).padStart(2, '0')}`;
      
      onOpenNewDemandModal({
        title: `[Campanha] ${dateItem.title}`,
        client: defaultClient,
        dueDate: defaultDueDate,
        description: `Demanda de conteúdo para a data comemorativa: ${dateItem.title} (${dateItem.categoryLabel}).\n\nGancho sugerido: "${dateItem.contentHook || ''}"\n\nFormatos recomendados: ${dateItem.suggestedFormats?.join(', ') || 'Post, Stories'}`,
      });
      setActiveDateModal(null);
    }
  };

  // Add new custom date modal form state
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState<number>(15);
  const [newMonth, setNewMonth] = useState<number>(selectedMonth);
  const [newCategory, setNewCategory] = useState<CommemorativeDateCategory>('personalizada');
  const [newDescription, setNewDescription] = useState('');
  const [newSegment, setNewSegment] = useState('Geral');
  const [newContentHook, setNewContentHook] = useState('');
  const [newFormats, setNewFormats] = useState<string[]>(['Post', 'Stories']);

  const handleSaveCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const categoryLabelMap: Record<CommemorativeDateCategory, string> = {
      todos: 'Geral',
      comercial: 'Data Comercial',
      feriado: 'Feriado Nacional',
      redes_sociais: 'Redes Sociais',
      profissao_nicho: 'Profissão & Nicho',
      aniversario_cliente: 'Aniversário de Cliente',
      personalizada: 'Personalizada da Agência',
    };

    const newDateItem: CommemorativeDate = {
      id: `cust-${Date.now()}`,
      title: newTitle.trim(),
      date: `2026-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`,
      day: newDay,
      month: newMonth,
      year: 2026,
      category: newCategory,
      categoryLabel: categoryLabelMap[newCategory] || 'Data Personalizada',
      description: newDescription.trim() || 'Data comemorativa interna cadastrada pela equipe da agência.',
      targetSegments: [newSegment],
      contentHook: newContentHook.trim() || undefined,
      suggestedFormats: newFormats as any,
      isCustom: true,
    };

    saveCustomDates([...customDates, newDateItem]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewContentHook('');
    showCopiedToast('Nova data comemorativa adicionada com sucesso!');
  };

  const handleDeleteCustomDate = (dateId: string) => {
    const updated = customDates.filter((d) => d.id !== dateId);
    saveCustomDates(updated);
    if (activeDateModal?.id === dateId) {
      setActiveDateModal(null);
    }
    showCopiedToast('Data personalizada removida.');
  };

  // Month stats
  const stats = useMemo(() => {
    const list = filteredMonthDates;
    const holidays = list.filter((d) => d.category === 'feriado').length;
    const commercials = list.filter((d) => d.category === 'comercial').length;
    const clientBdays = list.filter((d) => d.category === 'aniversario_cliente').length;
    return {
      total: list.length,
      holidays,
      commercials,
      clientBdays,
    };
  }, [filteredMonthDates]);

  return (
    <div id="calendario-view-container" className="space-y-6">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#142142] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-amber-400/40 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="text-[#fab518] shrink-0" size={18} />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Top Header & Action Bar */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <button
              id="btn-prev-month"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#142142] dark:text-white">
                {MONTH_NAMES_PT[selectedMonth - 1]} {selectedYear}
              </span>
              {selectedMonth === 9 && selectedYear === 2026 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                  Mês Atual
                </span>
              )}
            </div>
            <button
              id="btn-next-month"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>

            {/* Quick Button to return to current month */}
            {(selectedMonth !== 9 || selectedYear !== 2026) && (
              <button
                onClick={handleGoToCurrentMonth}
                className="text-xs font-bold text-[#142142] dark:text-amber-400 hover:underline flex items-center gap-1 ml-2 cursor-pointer"
              >
                <Clock size={13} />
                <span>Ir para Setembro (Atual)</span>
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-add-custom-date"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Adicionar Data</span>
            </button>

            <button
              id="btn-export-ics"
              onClick={handleExportICS}
              title="Exportar para Google Calendar / Apple Calendar"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Exportar .ICS</span>
            </button>

            <button
              id="btn-copy-pauta"
              onClick={handleCopyMonthPauta}
              title="Copiar pauta do mês atual formatada"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
            >
              <Copy size={15} />
              <span className="hidden sm:inline">Copiar Pauta</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 ml-1">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Grid size={14} />
                <span>Grade</span>
              </button>
              <button
                id="btn-view-list"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#142142] text-[#142142] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <List size={14} />
                <span>Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* 12 Months Fast Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">

          {/* Month Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {MONTH_NAMES_PT.map((mName, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum && selectedYear === 2026;
              const isCurrent = mNum === 9 && selectedYear === 2026;
              const count = allDates.filter((d) => d.month === mNum).length;

              return (
                <button
                  key={mName}
                  onClick={() => {
                    setSelectedYear(2026);
                    setSelectedMonth(mNum);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{mName.substring(0, 3)}</span>
                  {isCurrent && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#142142]'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metrics Bar for the Selected Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-[20px] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total no Mês</span>
            <CalendarDays size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-[#142142] dark:text-white">
            {stats.total} <span className="text-xs font-normal text-slate-500">datas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-[20px] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Feriados Nacionais</span>
            <Flag size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.holidays} <span className="text-xs font-normal text-slate-500">feriados</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-[20px] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Comerciais & Varejo</span>
            <ShoppingBag size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.commercials} <span className="text-xs font-normal text-slate-500">oportunidades</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-[20px] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Aniversários de Clientes</span>
            <Cake size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.clientBdays} <span className="text-xs font-normal text-slate-500">clientes</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-[#0f172a] p-4 sm:p-5 rounded-[22px] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por data, nicho, cliente ou gancho de post..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-[#142142] dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#fab518]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Segment Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
              Nicho / Segmento:
            </span>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#142142] dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#fab518]"
            >
              <option value="todos">Todos os Segmentos</option>
              {availableSegments.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as CommemorativeDateCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142]'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Grid View or List View */}
      {viewMode === 'grid' ? (
        /* ================= CALENDAR GRID VIEW ================= */
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((wd, i) => (
              <div
                key={wd}
                className={`py-2 text-[11px] font-black tracking-wider uppercase ${
                  i === 0 || i === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty prefix cells for proper weekday offset */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div
                key={`empty-pref-${i}`}
                className="min-h-[115px] sm:min-h-[135px] p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200/60 dark:border-slate-800/60 opacity-40"
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isToday =
                selectedYear === 2026 && selectedMonth === 9 && dayNum === 17;

              // Dates on this day
              const datesOnDay = filteredMonthDates.filter((d) => d.day === dayNum);

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[115px] sm:min-h-[135px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                    isToday
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-[#fab518] shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs sm:text-sm font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                          isToday
                            ? 'bg-[#fab518] text-[#142142]'
                            : 'text-slate-700 dark:text-slate-300 group-hover:text-[#142142] dark:group-hover:text-white'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="hidden sm:inline-block text-[9px] font-black uppercase text-amber-800 dark:text-amber-300">
                          Hoje
                        </span>
                      )}
                    </div>

                    {datesOnDay.length > 0 && (
                      <span className="text-[10px] font-black text-slate-400">
                        {datesOnDay.length}
                      </span>
                    )}
                  </div>

                  {/* Dates list on this day */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[85px] sm:max-h-[95px] pr-0.5 no-scrollbar">
                    {datesOnDay.slice(0, 3).map((dateItem) => {
                      const theme = getCategoryTheme(dateItem.category);
                      const Icon = theme.icon;

                      return (
                        <button
                          key={dateItem.id}
                          onClick={() => setActiveDateModal(dateItem)}
                          className={`w-full text-left p-1.5 rounded-xl border text-[11px] font-bold transition-all truncate flex items-center gap-1.5 ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} hover:scale-[1.02] shadow-2xs`}
                          title={`${dateItem.title} - ${dateItem.categoryLabel}`}
                        >
                          <Icon size={12} className="shrink-0" />
                          <span className="truncate">{dateItem.title}</span>
                        </button>
                      );
                    })}

                    {datesOnDay.length > 3 && (
                      <button
                        onClick={() => setActiveDateModal(datesOnDay[0])}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 block text-center w-full py-0.5"
                      >
                        +{datesOnDay.length - 3} mais
                      </button>
                    )}
                  </div>

                  {/* Quick Add icon on hover */}
                  <div className="mt-1 pt-1 border-t border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        setNewDay(dayNum);
                        setNewMonth(selectedMonth);
                        setIsAddModalOpen(true);
                      }}
                      title={`Adicionar data no dia ${dayNum}/${selectedMonth}`}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#142142] dark:hover:text-[#fab518] transition-opacity p-0.5"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= LIST / AGENDA VIEW ================= */
        <div className="space-y-3">
          {filteredMonthDates.length === 0 ? (
            <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-3">
              <CalendarIcon size={36} className="mx-auto text-slate-400" />
              <h3 className="text-lg font-black text-[#142142] dark:text-white">
                Nenhuma data encontrada para os filtros atuais
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Tente ajustar a busca textual, alterar o segmento ou selecionar outro mês de 2026.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                  setSelectedSegment('todos');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#142142] dark:text-white hover:bg-slate-200"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            filteredMonthDates.map((dateItem) => {
              const theme = getCategoryTheme(dateItem.category);
              const Icon = theme.icon;
              const isToday =
                selectedYear === 2026 && selectedMonth === 9 && dateItem.day === 17;

              return (
                <div
                  key={dateItem.id}
                  className={`bg-white dark:bg-[#0f172a] rounded-[22px] border p-5 transition-all hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                    isToday
                      ? 'border-[#fab518] ring-1 ring-[#fab518]/30 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Left: Day badge & Info */}
                  <div className="flex items-start gap-4">
                    {/* Big Date Circle/Square */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                        isToday
                          ? 'bg-[#fab518] text-[#142142] border-[#fab518]'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#142142] dark:text-white border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-xl font-black leading-none">{dateItem.day}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {MONTH_NAMES_PT[dateItem.month - 1].substring(0, 3)}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                        >
                          <Icon size={12} />
                          {dateItem.categoryLabel}
                        </span>

                        {dateItem.isHoliday && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200">
                            Feriado Oficial
                          </span>
                        )}

                        {isToday && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                            Hoje
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white">
                        {dateItem.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                        {dateItem.description}
                      </p>

                      {/* Content hook snippet */}
                      {dateItem.contentHook && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 max-w-2xl">
                          <Lightbulb size={15} className="text-[#fab518] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#142142] dark:text-white mr-1">
                              Ideia de Gancho:
                            </span>
                            <span className="italic">"{dateItem.contentHook}"</span>
                          </div>
                        </div>
                      )}

                      {/* Target Segments */}
                      {dateItem.targetSegments && dateItem.targetSegments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Nichos:
                          </span>
                          {dateItem.targetSegments.map((seg) => (
                            <span
                              key={seg}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              {seg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 md:self-center">
                    <button
                      onClick={() => setActiveDateModal(dateItem)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Ver Detalhes
                    </button>

                    {dateItem.contentHook && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(dateItem.contentHook || '');
                          showCopiedToast('Gancho copiado!');
                        }}
                        title="Copiar Gancho"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    )}

                    {onOpenNewDemandModal && (
                      <button
                        onClick={() => handleCreateDemandFromDate(dateItem)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all shadow-xs"
                      >
                        <Plus size={14} className="stroke-[3]" />
                        <span>Criar Demanda</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= MODAL: DATE DETAILS & BRIEFING ================= */}
      {activeDateModal && (
        <div
          className="fixed inset-0 z-50 bg-[#142142]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveDateModal(null)}
        >
          <div
            className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      getCategoryTheme(activeDateModal.category).badgeBg
                    } ${getCategoryTheme(activeDateModal.category).badgeText} ${
                      getCategoryTheme(activeDateModal.category).badgeBorder
                    }`}
                  >
                    {activeDateModal.categoryLabel}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {String(activeDateModal.day).padStart(2, '0')}/
                    {String(activeDateModal.month).padStart(2, '0')}/{activeDateModal.year || 2026}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#142142] dark:text-white">
                  {activeDateModal.title}
                </h2>
              </div>

              <button
                onClick={() => setActiveDateModal(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sobre esta data
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {activeDateModal.description}
              </p>
            </div>

            {/* Content Hook / Copy Idea */}
            {activeDateModal.contentHook && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    <Lightbulb size={15} className="text-[#fab518]" />
                    <span>Ideia de Post & Gancho de Copy</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeDateModal.contentHook || '');
                      showCopiedToast('Gancho de post copiado!');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline"
                  >
                    <Copy size={13} />
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  "{activeDateModal.contentHook}"
                </p>
              </div>
            )}

            {/* Target Segments & Formats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nichos Recomendados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeDateModal.targetSegments?.map((seg) => (
                    <span
                      key={seg}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-[#142142] dark:text-white border border-slate-200 dark:border-slate-600"
                    >
                      {seg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Formatos Recomendados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeDateModal.suggestedFormats || ['Post', 'Stories']).map((fmt) => (
                    <span
                      key={fmt}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-[#142142] dark:text-white border border-slate-200 dark:border-slate-600"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Bottom CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                {activeDateModal.isCustom && (
                  <button
                    onClick={() => handleDeleteCustomDate(activeDateModal.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Excluir Data Customizada</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDateModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Fechar
                </button>

                {onOpenNewDemandModal && (
                  <button
                    onClick={() => handleCreateDemandFromDate(activeDateModal)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all shadow-sm active:scale-95"
                  >
                    <Plus size={15} className="stroke-[3]" />
                    <span>Criar Demanda no Kanban</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOM COMMEMORATIVE DATE ================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#142142]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#142142] dark:text-white">
                  Adicionar Data Comemorativa
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre uma data exclusiva para as marcas e clientes da Help Ideias Digitais
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomDate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Título da Data Comemorativa *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Aniversário da Agência, Dia do Sushi, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Dia *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={newDay}
                    onChange={(e) => setNewDay(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Mês *
                  </label>
                  <select
                    value={newMonth}
                    onChange={(e) => setNewMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                  >
                    {MONTH_NAMES_PT.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CommemorativeDateCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                  >
                    <option value="personalizada">Personalizada</option>
                    <option value="comercial">Comercial & Varejo</option>
                    <option value="redes_sociais">Redes Sociais</option>
                    <option value="profissao_nicho">Profissão & Nicho</option>
                    <option value="feriado">Feriado Local / Regional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Nicho / Segmento
                  </label>
                  <input
                    type="text"
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    placeholder="Ex: Gastronomia, Odonto..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Descrição / Objetivo Estratégico
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Por que essa data é importante para a marca do cliente..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Ideia de Post ou Gancho de Copy (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newContentHook}
                  onChange={(e) => setNewContentHook(e.target.value)}
                  placeholder="Ex: 'Hoje é dia de homenagear quem faz acontecer...'"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#fab518] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs shadow-sm active:scale-95"
                >
                  Salvar Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
