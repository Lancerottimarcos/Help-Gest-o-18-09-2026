import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'sidebar';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'sidebar') {
    return (
      <button
        id="sidebar-theme-toggle-btn"
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
          isDark
            ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-750 border border-slate-700/60'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
        } ${className}`}
        title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg transition-transform duration-300 ${
              isDark ? 'bg-amber-400/20 text-amber-400 rotate-0' : 'bg-white text-[#142142] -rotate-12 shadow-2xs'
            }`}
          >
            {isDark ? <Sun size={15} className="stroke-[2.2]" /> : <Moon size={15} className="stroke-[2.2]" />}
          </div>
          <span className="font-bold">{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
        </div>
        <span
          className={`text-[10px] uppercase font-mono font-black px-1.5 py-0.5 rounded-md ${
            isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        id="pill-theme-toggle-btn"
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs border ${
          isDark
            ? 'bg-[#1a2642] text-amber-300 border-slate-700 hover:border-amber-400/50'
            : 'bg-white text-slate-700 border-slate-200 hover:border-[#142142]/40'
        } ${className}`}
        title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        aria-label={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      >
        <span className="transition-transform duration-300">
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-[#142142]" />}
        </span>
        <span>{isDark ? 'Tema Escuro' : 'Tema Claro'}</span>
      </button>
    );
  }

  // Default: icon button (ideal for top header next to search and notifications)
  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-xl transition-all duration-300 cursor-pointer group flex items-center justify-center ${
        isDark
          ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/40 shadow-sm'
          : 'bg-slate-100 text-[#142142] hover:bg-slate-200/80 border border-slate-200/60 shadow-2xs'
      } ${className}`}
      title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      aria-label={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun icon with rotation entry/exit */}
        <Sun
          size={19}
          className={`absolute transition-all duration-300 transform ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-amber-400'
              : 'opacity-0 -rotate-90 scale-50 text-amber-500 pointer-events-none'
          }`}
        />
        {/* Moon icon with rotation entry/exit */}
        <Moon
          size={18}
          className={`absolute transition-all duration-300 transform ${
            isDark
              ? 'opacity-0 rotate-90 scale-50 text-slate-400 pointer-events-none'
              : 'opacity-100 rotate-0 scale-100 text-[#142142] group-hover:text-amber-600'
          }`}
        />
      </div>

      {/* Subtle indicator ring/dot */}
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 transition-colors pointer-events-none ${
          isDark ? 'bg-amber-400 ring-slate-800' : 'bg-slate-400 ring-white'
        }`}
      />
    </button>
  );
};
