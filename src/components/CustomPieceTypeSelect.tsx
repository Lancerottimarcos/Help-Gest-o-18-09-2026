import React, { useState, useRef, useEffect } from 'react';
import { 
  Megaphone, 
  Globe, 
  Palette, 
  Layers, 
  Image as ImageIcon, 
  Check, 
  ChevronDown 
} from 'lucide-react';

export interface PieceTypeOption {
  id: string;
  label: string;
  category: 'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Design Geral';
  description: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export const PIECE_TYPES: PieceTypeOption[] = [
  {
    id: 'Post',
    label: 'Post',
    category: 'Social Media',
    description: 'Feed, Carrossel, Stories ou Reels para redes sociais',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/80 dark:border-indigo-800/80',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    icon: <ImageIcon size={15} />,
  },
  {
    id: 'Meta Ads',
    label: 'Meta Ads',
    category: 'Tráfego Pago',
    description: 'Campanhas patrocinadas, criativos para Instagram & Facebook',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: <Megaphone size={15} />,
  },
  {
    id: 'Des. de Site',
    label: 'Des. de Site',
    category: 'Criação de Sites',
    description: 'Landing pages de conversão, portais institucionais e lojas',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200/80 dark:border-sky-800/80',
    badgeText: 'text-sky-700 dark:text-sky-300',
    iconBg: 'bg-sky-100 dark:bg-sky-900/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
    icon: <Globe size={15} />,
  },
  {
    id: 'Logotipo',
    label: 'Logotipo',
    category: 'Design Geral',
    description: 'Identidade visual, branding, manuais de marca e vetores',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/80',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: <Palette size={15} />,
  },
  {
    id: 'Outros',
    label: 'Outros',
    category: 'Social Media',
    description: 'Peças avulsas, papelaria, roteiros e demandas especiais',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    badgeText: 'text-slate-700 dark:text-slate-300',
    iconBg: 'bg-slate-200 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-400',
    icon: <Layers size={15} />,
  },
];

interface CustomPieceTypeSelectProps {
  value: string;
  onChange: (val: string, category?: 'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Design Geral') => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}

export const CustomPieceTypeSelect: React.FC<CustomPieceTypeSelectProps> = ({
  value,
  onChange,
  id = 'demand-type-select',
  label = 'Tipo de Peça',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normaliza o tipo selecionado
  const currentOption = PIECE_TYPES.find(
    (p) => p.id.toLowerCase() === (value || '').toLowerCase()
  ) || PIECE_TYPES[0];

  // Fechar ao clicar fora ou tecla ESC
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

  const handleSelect = (option: PieceTypeOption) => {
    onChange(option.id, option.category);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label caso desejado */}
      {label && (
        <label 
          htmlFor={id} 
          className="block text-xs font-bold text-[#142142] dark:text-white mb-1"
        >
          {label}
        </label>
      )}

      {/* Select Nativo Sincronizado para garantir acessibilidade e compatibilidade de testes/seletores */}
      <select
        id={id}
        value={currentOption.id}
        onChange={(e) => {
          const matched = PIECE_TYPES.find((p) => p.id === e.target.value);
          if (matched) {
            onChange(matched.id, matched.category);
          }
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {PIECE_TYPES.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger visual personalizado */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-white dark:bg-slate-900 border-[#fab518] ring-2 ring-[#fab518]/25 shadow-sm'
            : 'bg-[#F2F2F2] dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border-transparent text-[#142142] dark:text-slate-100'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-6 h-6 rounded-lg ${currentOption.iconBg} ${currentOption.iconColor} flex items-center justify-center shrink-0`}>
            {currentOption.icon}
          </div>
          <span className="text-xs font-bold text-[#142142] dark:text-white truncate">
            {currentOption.label}
          </span>
          <span 
            title={currentOption.category}
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${currentOption.badgeBg} ${currentOption.badgeText} shrink-0 ml-auto max-w-[85px] truncate hidden sm:inline-flex items-center justify-center leading-tight shadow-2xs`}
          >
            {currentOption.category}
          </span>
        </div>

        <ChevronDown 
          size={14} 
          className={`text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#fab518]' : ''
          }`} 
        />
      </button>

      {/* Menu Dropdown de Opções */}
      {isOpen && (
        <div 
          className="absolute z-50 left-0 mt-1.5 w-full sm:w-72 bg-white dark:bg-[#111c35] rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700/80 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Selecione o formato da entrega
          </div>

          <div className="space-y-1">
            {PIECE_TYPES.map((option) => {
              const isSelected = option.id.toLowerCase() === currentOption.id.toLowerCase();
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-[#fab518]/40'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg ${option.iconBg} ${option.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    {option.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-xs font-bold ${
                        isSelected ? 'text-[#142142] dark:text-[#fab518]' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {option.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${option.badgeBg} ${option.badgeText}`}>
                        {option.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {option.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 mt-1">
                      <Check size={11} strokeWidth={3} />
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
