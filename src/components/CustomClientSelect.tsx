import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, Search, Check, ChevronDown, X, User } from 'lucide-react';
import { Client } from '../types';

interface CustomClientSelectProps {
  clients: Client[];
  value: string;
  onChange: (clientName: string) => void;
  disabled?: boolean;
  id?: string;
  required?: boolean;
}

export const CustomClientSelect: React.FC<CustomClientSelectProps> = ({
  clients = [],
  value,
  onChange,
  disabled = false,
  id = 'new-demand-client-select',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Encontra o cliente atualmente selecionado
  const selectedClient = useMemo(() => {
    if (!value) return null;
    return clients.find(
      (c) =>
        c.name === value ||
        c.companyName === value ||
        c.id === value ||
        c.name.trim().toLowerCase() === value.trim().toLowerCase()
    );
  }, [clients, value]);

  // Lista filtrada pela busca
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.companyName && c.companyName.toLowerCase().includes(term)) ||
        (c.segment && c.segment.toLowerCase().includes(term)) ||
        (c.contactName && c.contactName.toLowerCase().includes(term))
    );
  }, [clients, search]);

  // Fechar ao clicar fora ou pressionar Escape
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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (clientName: string) => {
    onChange(clientName);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Botão de Disparo / Trigger Principal */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'border-[#fab518] ring-2 ring-[#fab518]/25 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
            : 'bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedClient ? (
            <>
              {/* Avatar do Cliente */}
              {selectedClient.avatar ? (
                <img
                  src={selectedClient.avatar}
                  alt={selectedClient.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-[#fab518] text-[#142142] flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                  {(selectedClient.name.charAt(0) || 'C').toUpperCase()}
                </div>
              )}

              {/* Informações do Cliente */}
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#142142] dark:text-white truncate">
                  {selectedClient.name}
                </span>

                {selectedClient.companyName && selectedClient.companyName !== selectedClient.name && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                    ({selectedClient.companyName})
                  </span>
                )}

                {selectedClient.segment && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 hidden md:inline">
                    {selectedClient.segment}
                  </span>
                )}
              </div>
            </>
          ) : value ? (
            /* Cliente digitado/customizado */
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                <Building2 size={14} />
              </div>
              <span className="font-bold text-xs sm:text-sm text-[#142142] dark:text-white truncate">
                {value}
              </span>
            </div>
          ) : (
            /* Placeholder */
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 size={15} className="text-slate-400 shrink-0" />
              <span className="text-xs sm:text-sm">Selecione um cliente cadastrado...</span>
            </div>
          )}
        </div>

        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#fab518]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Campo de Busca Rápida */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, empresa ou segmento..."
                className="w-full text-xs pl-8 pr-7 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#fab518] focus:ring-1 focus:ring-[#fab518]/30 transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100/80 dark:divide-slate-800/60 p-1 scrollbar-thin">
            {filteredClients.length > 0 ? (
              filteredClients.map((c) => {
                const isSelected =
                  c.name === value ||
                  c.companyName === value ||
                  c.id === value ||
                  c.name.trim().toLowerCase() === value.trim().toLowerCase();

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.name)}
                    className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 text-[#142142] dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar */}
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200/90 dark:border-slate-700 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-[#fab518] text-[#142142] flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          {(c.name.charAt(0) || 'C').toUpperCase()}
                        </div>
                      )}

                      {/* Nome e Detalhes */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#142142] dark:text-[#fab518]' : 'text-slate-900 dark:text-white'}`}>
                            {c.name}
                          </span>
                          {c.segment && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {c.segment}
                            </span>
                          )}
                        </div>

                        {c.companyName && c.companyName !== c.name && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {c.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Indicador de Seleção */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 shadow-2xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center">
                <Building2 size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nenhum cliente encontrado
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Verifique o termo buscado ou adicione um novo cliente
                </p>
              </div>
            )}
          </div>

          {/* Rodapé Informativo */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}</span>
            <span className="text-[10px] text-slate-400">Selecione para vincular à demanda</span>
          </div>
        </div>
      )}
    </div>
  );
};
