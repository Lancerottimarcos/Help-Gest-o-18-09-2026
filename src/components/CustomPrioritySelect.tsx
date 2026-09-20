import React, { useState, useRef, useEffect } from 'react';
import { Flag, Check, ChevronDown, Flame, AlertCircle } from 'lucide-react';
import { Priority } from '../types';

interface CustomPrioritySelectProps {
  value: Priority;
  onChange: (value: Priority) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

interface PriorityOption {
  id: Priority;
  label: string;
  description: string;
  bars: number;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon?: React.ReactNode;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    id: 'baixa',
    label: 'Baixa',
    description: 'Demanda de rotina sem pressa imediata',
    bars: 1,
    color: '#0ea5e9', // Sky
    bgColor: 'bg-sky-500',
    borderColor: 'border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  {
    id: 'media',
    label: 'Média',
    description: 'Prazo e ritmo de entrega padrão',
    bars: 2,
    color: '#f59e0b', // Amber
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  {
    id: 'alta',
    label: 'Alta',
    description: 'Prioridade elevada na fila de criação',
    bars: 3,
    color: '#f97316', // Orange
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/60',
    badgeText: 'text-orange-800 dark:text-orange-300',
  },
  {
    id: 'urgente',
    label: 'Urgente',
    description: 'Atenção e entrega crítica imediata',
    bars: 4,
    color: '#f43f5e', // Rose/Crimson
    bgColor: 'bg-rose-500',
    borderColor: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
];

export const CustomPrioritySelect: React.FC<CustomPrioritySelectProps> = ({
  value,
  onChange,
  label,
  id = 'custom-priority-select',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = PRIORITY_OPTIONS.find((p) => p.id === value) || PRIORITY_OPTIONS[1];

  // Click outside and escape key listener
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

  const renderSignalBars = (activeBars: number, barColor: string) => {
    return (
      <div className="flex items-end gap-0.5 h-3.5 px-0.5 shrink-0" title={`${activeBars} barras de prioridade`}>
        <span
          className={`w-1 rounded-xs transition-all ${
            activeBars >= 1 ? '' : 'bg-slate-200 dark:bg-slate-700'
          }`}
          style={{ height: '5px', backgroundColor: activeBars >= 1 ? barColor : undefined }}
        />
        <span
          className={`w-1 rounded-xs transition-all ${
            activeBars >= 2 ? '' : 'bg-slate-200 dark:bg-slate-700'
          }`}
          style={{ height: '8px', backgroundColor: activeBars >= 2 ? barColor : undefined }}
        />
        <span
          className={`w-1 rounded-xs transition-all ${
            activeBars >= 3 ? '' : 'bg-slate-200 dark:bg-slate-700'
          }`}
          style={{ height: '11px', backgroundColor: activeBars >= 3 ? barColor : undefined }}
        />
        <span
          className={`w-1 rounded-xs transition-all ${
            activeBars >= 4 ? '' : 'bg-slate-200 dark:bg-slate-700'
          }`}
          style={{ height: '14px', backgroundColor: activeBars >= 4 ? barColor : undefined }}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          <Flag size={12} className="text-[#fab518]" />
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'border-[#fab518] ring-2 ring-[#fab518]/25 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {renderSignalBars(currentOption.bars, currentOption.color)}
          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
            {currentOption.label}
          </span>
          {currentOption.id === 'urgente' && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#fab518]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 min-w-[220px] bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-1.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5"
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Definir Nível de Prioridade
            </span>
          </div>

          <div className="space-y-1">
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = option.id === value;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white font-bold ring-1 ring-slate-300 dark:ring-slate-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderSignalBars(option.bars, option.color)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {option.label}
                        </span>
                        {option.id === 'urgente' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 uppercase tracking-tight">
                            Crítico
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-lg bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 shadow-2xs">
                      <Check size={12} className="stroke-[2.8]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
