import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  X, 
  ChevronRight, 
  Layers, 
  ArrowUpRight,
  Briefcase
} from 'lucide-react';
import { Client, DemandItem } from '../types';

interface SidebarClientsSubBarProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  clients: Client[];
  demands: DemandItem[];
  selectedClientFilter?: string;
  onSelectClientDemands: (clientName: string) => void;
  onSelectAllDemands: () => void;
  isSidebarCollapsed?: boolean;
  onNavigateToClients?: () => void;
}

// Componente dedicado para exibir a foto de perfil cadastrada do cliente
const ClientProfileAvatar: React.FC<{ client: Client }> = ({ client }) => {
  const [imgError, setImgError] = useState(false);
  const avatarSrc = client.avatar?.trim();
  const hasAvatar = Boolean(avatarSrc && !imgError);

  if (hasAvatar && avatarSrc) {
    return (
      <div className="relative shrink-0">
        <img
          src={avatarSrc}
          alt={`Foto de ${client.name}`}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200/90 dark:ring-slate-700 bg-white dark:bg-slate-800 shadow-2xs group-hover:scale-105 transition-transform"
        />
        {client.coverColor && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0f172a] shadow-xs"
            style={{ backgroundColor: client.coverColor }}
            title={`Cor da capa: ${client.coverColor}`}
          />
        )}
      </div>
    );
  }

  // Monograma de fallback com a cor de capa do cliente
  return (
    <div className="relative shrink-0">
      <div
        style={{ backgroundColor: client.coverColor || '#142142' }}
        className="w-9 h-9 rounded-full text-white font-black text-xs flex items-center justify-center ring-2 ring-slate-200/90 dark:ring-slate-700 shadow-2xs group-hover:scale-105 transition-transform"
      >
        {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
      </div>
      {client.coverColor && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0f172a] shadow-xs"
          style={{ backgroundColor: client.coverColor }}
        />
      )}
    </div>
  );
};

export const SidebarClientsSubBar: React.FC<SidebarClientsSubBarProps> = ({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
  clients = [],
  demands = [],
  selectedClientFilter = 'todos',
  onSelectClientDemands,
  onSelectAllDemands,
  isSidebarCollapsed = false,
  onNavigateToClients,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Map of client name/id to demands count
  const demandCountMap = useMemo(() => {
    const map = new Map<string, number>();
    demands.forEach((d) => {
      // By clientId
      if (d.clientId) {
        map.set(d.clientId, (map.get(d.clientId) || 0) + 1);
      }
      // By client name lower
      if (d.client) {
        const key = d.client.trim().toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
      if (d.clientProject) {
        const key = d.clientProject.trim().toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [demands]);

  // Compute demands count for a specific client
  const getClientDemandsCount = (client: Client): number => {
    let count = 0;
    if (client.id && demandCountMap.has(client.id)) {
      count = demandCountMap.get(client.id)!;
    } else {
      const nameKey = client.name ? client.name.trim().toLowerCase() : '';
      const compKey = client.companyName ? client.companyName.trim().toLowerCase() : '';
      count = (nameKey && demandCountMap.get(nameKey)) || 
              (compKey && demandCountMap.get(compKey)) || 
              0;
    }

    if (count === 0) {
      count = demands.filter((d) => {
        if (d.clientId && client.id && d.clientId === client.id) return true;
        if (d.client) {
          const dClientLower = d.client.trim().toLowerCase();
          if (client.name && dClientLower === client.name.trim().toLowerCase()) return true;
          if (client.companyName && dClientLower === client.companyName.trim().toLowerCase()) return true;
        }
        if (d.clientProject && client.name && d.clientProject.trim().toLowerCase() === client.name.trim().toLowerCase()) return true;
        return false;
      }).length;
    }
    return count;
  };

  // Filtrar estritamente apenas clientes que possuem demandas cadastradas
  const clientsWithDemands = useMemo(() => {
    const matched = clients.filter((c) => getClientDemandsCount(c) > 0);
    const existingNames = new Set(
      matched.map((c) => (c.name || '').trim().toLowerCase())
    );

    // Incluir também clientes referenciados nas demandas que porventura não estejam no array principal
    const extraClients: Client[] = [];
    demands.forEach((d) => {
      const cName = (d.client || '').trim();
      if (cName && !existingNames.has(cName.toLowerCase())) {
        existingNames.add(cName.toLowerCase());
        extraClients.push({
          id: d.clientId || `cli-demand-${cName.toLowerCase().replace(/\s+/g, '-')}`,
          name: cName,
          companyName: cName,
          segment: 'Cliente',
          contactName: cName,
          email: '',
          phone: '',
          avatar: '',
          status: 'Ativo',
          monthlyFee: 0,
          services: [],
          activeDemandsCount: 1,
        });
      }
    });

    return [...matched, ...extraClients];
  }, [clients, demands, demandCountMap]);

  // Filter and sort clients with demands alphabetically (A-Z)
  const sortedAndFilteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = clientsWithDemands.filter((c) => {
      if (!query) return true;
      const name = (c.name || '').toLowerCase();
      const comp = (c.companyName || '').toLowerCase();
      const segment = (c.segment || '').toLowerCase();
      return name.includes(query) || comp.includes(query) || segment.includes(query);
    });

    return [...list].sort((a, b) => 
      (a.name || a.companyName || '').localeCompare(b.name || b.companyName || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [clientsWithDemands, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile devices */}
      <div
        className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-[65] lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="sidebar-clients-subbar"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          fixed z-[70]
          /* Mobile / Small Screens: perfeitamente centralizado e contido dentro da tela do celular sem cortar */
          top-3 bottom-3 left-3 right-3 max-w-[340px] sm:max-w-md mx-auto
          h-[calc(100dvh-1.5rem)] w-auto
          /* Desktop Screens: ancorado ao lado da barra lateral */
          lg:inset-y-auto lg:top-3 lg:bottom-auto lg:right-auto lg:mx-0
          lg:h-[calc(100vh-1.5rem)] lg:w-80 lg:max-w-[calc(100vw-5.5rem)]
          ${isSidebarCollapsed ? 'lg:left-[92px]' : 'lg:left-[304px]'}
          bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md
          rounded-[28px] sm:rounded-[32px] border border-slate-200/90 dark:border-slate-800
          shadow-2xl shadow-slate-900/20 dark:shadow-black/70
          flex flex-col overflow-hidden
          transition-all duration-200 ease-out
          animate-in fade-in-0 slide-in-from-bottom-3 lg:slide-in-from-left-2
          /* Invisible hover bridge to prevent cursor loss on desktop */
          lg:before:absolute lg:before:-left-3 lg:before:top-0 lg:before:bottom-0 lg:before:w-4 lg:before:content-['']
        `}
        role="region"
        aria-label="Demandas por Cliente"
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-[#fab518] flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#142142] dark:text-white truncate">
                  Demandas por Cliente
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {clientsWithDemands.length} {clientsWithDemands.length === 1 ? 'cliente com demandas' : 'clientes com demandas'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Fechar menu de clientes"
              aria-label="Fechar"
            >
              <X size={18} />
              <span className="lg:hidden text-xs font-semibold text-slate-500 dark:text-slate-400">Fechar</span>
            </button>
          </div>

        {/* Quick Search Input */}
        <div className="relative mt-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-slate-50 dark:bg-slate-900 text-xs text-[#142142] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 focus:border-[#fab518] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
            autoFocus={false}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Limpar busca"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main List Section */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {/* Option 1: "Todas as Demandas" */}
        <button
          type="button"
          onClick={() => {
            onSelectAllDemands();
            onClose();
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left
            text-xs font-semibold transition-all group cursor-pointer
            ${
              selectedClientFilter === 'todos'
                ? 'bg-[#142142] text-white shadow-sm dark:bg-[#fab518] dark:text-[#142142]'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
            }
          `}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              selectedClientFilter === 'todos'
                ? 'bg-white/10 dark:bg-[#142142]/10 text-[#fab518] dark:text-[#142142]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700'
            }`}>
              <Layers size={14} />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold">Todas as Demandas</span>
              <span className={`block text-[10px] truncate ${
                selectedClientFilter === 'todos' ? 'text-white/80 dark:text-[#142142]/80' : 'text-slate-400 dark:text-slate-500'
              }`}>
                Ver quadro completo
              </span>
            </div>
          </div>

          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
            selectedClientFilter === 'todos'
              ? 'bg-white/20 text-white dark:bg-[#142142]/20 dark:text-[#142142]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {demands.length}
          </span>
        </button>

        {/* Section Divider */}
        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Clientes com Demandas ({sortedAndFilteredClients.length})
          </span>
        </div>

        {/* Clients List */}
        {sortedAndFilteredClients.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {searchQuery ? `Nenhum cliente com "${searchQuery}"` : 'Nenhum cliente possui demandas cadastradas'}
            </p>
          </div>
        ) : (
          sortedAndFilteredClients.map((client) => {
            const demandsCount = getClientDemandsCount(client);
            const isSelected = selectedClientFilter.toLowerCase() === client.name.toLowerCase() ||
                               (client.companyName && selectedClientFilter.toLowerCase() === client.companyName.toLowerCase());

            return (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onSelectClientDemands(client.name);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left
                  text-xs transition-all group cursor-pointer
                  ${
                    isSelected
                      ? 'bg-[#142142] text-white shadow-sm dark:bg-[#fab518] dark:text-[#142142]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                  }
                `}
                title={`Ver demandas de ${client.name}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  {/* Foto de Perfil Inserida no Cadastro do Cliente */}
                  <ClientProfileAvatar key={`${client.id}-${client.avatar || ''}`} client={client} />

                  {/* Name and Meta */}
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold truncate leading-tight ${isSelected ? 'text-white dark:text-[#142142]' : 'text-[#142142] dark:text-white'}`}>
                      {client.name}
                    </p>
                    <p className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isSelected ? 'text-white/80 dark:text-[#142142]/80' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {client.companyName || client.segment || 'Cliente'}
                    </p>
                  </div>
                </div>

                {/* Demands Count Badge & Chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`
                      text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors
                      ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-[#142142]/20 dark:text-[#142142]'
                          : demandsCount > 0
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }
                    `}
                  >
                    {demandsCount} {demandsCount === 1 ? 'demanda' : 'demandas'}
                  </span>

                  <ChevronRight
                    size={13}
                    className={`
                      transition-transform duration-150
                      ${
                        isSelected
                          ? 'text-[#fab518] dark:text-[#142142] translate-x-0.5'
                          : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }
                    `}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Navigation Link */}
      {onNavigateToClients && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              onNavigateToClients();
              onClose();
            }}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#142142] dark:hover:text-white py-1.5 px-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Briefcase size={14} className="text-[#fab518]" />
              Gerenciar clientes cadastrados
            </span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </div>
    </>
  );
};
