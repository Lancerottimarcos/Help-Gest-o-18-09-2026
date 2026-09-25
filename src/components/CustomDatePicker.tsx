import React, { useState, useRef, useEffect } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  Sparkles,
  Check
} from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEK_DAYS_TOOLTIPS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Selecione uma data...',
  disabled = false,
  className = '',
  id = 'custom-date-picker',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const parseDate = (dateStr: string): { year: number; month: number; day: number } | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return { year: y, month: m, day: d };
  };

  const parsedValue = parseDate(value);

  // Calendar view navigation state (month is 1-indexed: 1..12)
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const [viewYear, setViewYear] = useState<number>(parsedValue ? parsedValue.year : todayYear);
  const [viewMonth, setViewMonth] = useState<number>(parsedValue ? parsedValue.month : todayMonth);

  // Synchronize view state when modal opens or value changes
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [value]);

  // Click outside and Esc listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Format date helper: "YYYY-MM-DD"
  const formatDateString = (y: number, m: number, d: number): string => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleSelectDate = (y: number, m: number, d: number) => {
    onChange(formatDateString(y, m, d));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Quick preset shortcuts
  const applyPreset = (daysToAdd: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    const y = target.getFullYear();
    const m = target.getMonth() + 1;
    const d = target.getDate();
    onChange(formatDateString(y, m, d));
    setViewYear(y);
    setViewMonth(m);
    setIsOpen(false);
  };

  const applyNextMonday = () => {
    const target = new Date();
    const dayOfWeek = target.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (8 - dayOfWeek) % 7 || 7;
    target.setDate(target.getDate() + distanceToMonday);
    const y = target.getFullYear();
    const m = target.getMonth() + 1;
    const d = target.getDate();
    onChange(formatDateString(y, m, d));
    setViewYear(y);
    setViewMonth(m);
    setIsOpen(false);
  };

  // Calculate days for the calendar grid
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  // Relative status tag computation
  const getRelativeStatus = (val: string) => {
    if (!val) return null;
    const parsed = parseDate(val);
    if (!parsed) return null;

    const targetDate = new Date(parsed.year, parsed.month - 1, parsed.day);
    const currToday = new Date(todayYear, todayMonth - 1, todayDay);
    const diffTime = targetDate.getTime() - currToday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) {
      return { label: 'Hoje', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' };
    }
    if (diffDays === 1) {
      return { label: 'Amanhã', badgeClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700' };
    }
    if (diffDays === -1) {
      return { label: 'Ontem', badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700' };
    }
    if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)}d atrasado`, badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700' };
    }
    if (diffDays <= 7) {
      return { label: `Em ${diffDays}d`, badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700' };
    }
    return null;
  };

  const relativeStatus = getRelativeStatus(value);

  // Formatted trigger text: "20 Set, 2026"
  const getFormattedDisplay = () => {
    if (!parsedValue) return null;
    const shortMonth = MONTH_NAMES[parsedValue.month - 1]?.substring(0, 3);
    return `${String(parsedValue.day).padStart(2, '0')} ${shortMonth}, ${parsedValue.year}`;
  };

  const isSelectedDate = (y: number, m: number, d: number) => {
    if (!parsedValue) return false;
    return parsedValue.year === y && parsedValue.month === m && parsedValue.day === d;
  };

  const isTodayDate = (y: number, m: number, d: number) => {
    return todayYear === y && todayMonth === m && todayDay === d;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          <CalendarDays size={12} className="text-[#fab518]" />
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button Field */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'border-[#fab518] ring-2 ring-[#fab518]/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-[#fab518]/15 text-[#fab518] dark:text-[#fab518] flex items-center justify-center shrink-0">
            <CalendarDays size={13} className="stroke-[2.2]" />
          </div>

          {parsedValue ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-[#142142] dark:text-white truncate">
                {getFormattedDisplay()}
              </span>
              {relativeStatus && (
                <span className={`inline-flex items-center text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md border ${relativeStatus.badgeClass} shrink-0`}>
                  {relativeStatus.label}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {parsedValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Limpar data"
            >
              <X size={12} />
            </button>
          )}
          <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#fab518]' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div 
          className={`absolute z-50 ${align === 'left' ? 'left-0 right-auto' : 'right-0 left-auto'} mt-2 w-[290px] sm:w-[310px] bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5`}
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Presets Section */}
          <div className="mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
              <Sparkles size={11} className="text-[#fab518]" />
              <span>Atalhos Rápidos</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="px-1.5 py-1 rounded-lg text-[10.5px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#fab518] hover:text-[#142142] transition-colors text-center cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1)}
                className="px-1.5 py-1 rounded-lg text-[10.5px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#fab518] hover:text-[#142142] transition-colors text-center cursor-pointer"
              >
                Amanhã
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className="px-1.5 py-1 rounded-lg text-[10.5px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#fab518] hover:text-[#142142] transition-colors text-center cursor-pointer"
              >
                +3 Dias
              </button>
              <button
                type="button"
                onClick={applyNextMonday}
                className="px-1.5 py-1 rounded-lg text-[10.5px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#fab518] hover:text-[#142142] transition-colors text-center cursor-pointer"
              >
                Próx. Seg
              </button>
            </div>
          </div>

          {/* Month & Year Navigator */}
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#142142] dark:hover:text-white transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center font-black text-xs sm:text-sm text-[#142142] dark:text-white tracking-tight flex items-center gap-1">
              <span>{MONTH_NAMES[viewMonth - 1]}</span>
              <span className="text-[#fab518]">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#142142] dark:hover:text-white transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map((dayLabel, idx) => (
              <div
                key={idx}
                title={WEEK_DAYS_TOOLTIPS[idx]}
                className={`text-[10px] font-black uppercase py-1 ${
                  idx === 0 || idx === 6
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                {dayLabel}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous Month Padding */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayIndex + idx + 1;
              const prevMonthVal = viewMonth === 1 ? 12 : viewMonth - 1;
              const prevYearVal = viewMonth === 1 ? viewYear - 1 : viewYear;

              return (
                <button
                  key={`prev-${idx}`}
                  type="button"
                  onClick={() => handleSelectDate(prevYearVal, prevMonthVal, dayNum)}
                  className="h-8 rounded-xl text-[11px] font-medium text-slate-300 dark:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer opacity-50"
                >
                  {dayNum}
                </button>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = isSelectedDate(viewYear, viewMonth, dayNum);
              const isToday = isTodayDate(viewYear, viewMonth, dayNum);

              return (
                <button
                  key={`cur-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDate(viewYear, viewMonth, dayNum)}
                  className={`relative h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#fab518] text-[#142142] font-black shadow-sm ring-2 ring-[#fab518]/40 scale-105 z-10'
                      : isToday
                      ? 'bg-[#142142]/10 dark:bg-white/10 text-[#142142] dark:text-[#fab518] border border-[#fab518]/50 hover:bg-[#fab518]/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#142142] dark:hover:text-white'
                  }`}
                >
                  <span>{dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#fab518]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              Limpar
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="text-[11px] font-extrabold text-[#142142] dark:text-[#fab518] hover:underline cursor-pointer px-2 py-1"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-black bg-[#142142] text-white hover:bg-[#1a2b56] px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
