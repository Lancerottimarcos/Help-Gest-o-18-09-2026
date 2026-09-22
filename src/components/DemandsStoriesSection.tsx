import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCheck 
} from 'lucide-react';
import { Client, DemandItem } from '../types';
import { DemandStoryModal, StoryClientData } from './DemandStoryModal';

interface DemandsStoriesSectionProps {
  clients: Client[];
  demands: DemandItem[];
  onSelectDemand?: (demandId: string) => void;
  onOpenNewDemandModal?: () => void;
}

// Fallback high-quality avatars for clients without a photo
const FALLBACK_AVATARS: Record<string, string> = {
  'help ideias': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'oticaa': 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
  'marcelo': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'carlos': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'keisy mendroti': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'sao carlos no toque': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'cantor ph': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'sepam tratores': 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=150&auto=format&fit=crop&q=80',
  'evandro siebert': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=150&auto=format&fit=crop&q=80',
  'feh': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=150&auto=format&fit=crop&q=80',
  'moraes alimentos': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
};

const DEFAULT_AVATARS_LIST = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

// Clean string for fuzzy comparison: removes accents, dashes, symbols, punctuation, whitespace
export const cleanSearchString = (str?: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents/diacritics
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, ' ') // convert all dashes (hyphen, en-dash, em-dash, etc.)
    .replace(/[^a-z0-9]/g, ' ') // convert all symbols/punctuation to spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
};

// Significant word tokens ignoring corporate suffixes and prepositions
const STOP_WORDS = new Set([
  'e', 'de', 'do', 'da', 'dos', 'das', 'a', 'o', 'em', 'com', 'no', 'na', 
  'ltda', 'me', 'epp', 'sa', 'cia', 'eireli', 'ss', 'sociedade', 'limitada', 'consultoria'
]);

export const getSignificantTokens = (str?: string): string[] => {
  const cleaned = cleanSearchString(str);
  if (!cleaned) return [];
  return cleaned
    .split(' ')
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
};

export const findRegisteredClient = (
  queryNameOrId: string, 
  clientList: Client[]
): Client | undefined => {
  if (!queryNameOrId || !clientList || clientList.length === 0) return undefined;
  const rawQuery = queryNameOrId.trim();
  const cleanedQuery = cleanSearchString(rawQuery);
  if (!cleanedQuery) return undefined;

  // 1. Direct ID match
  const byId = clientList.find((c) => c.id === rawQuery);
  if (byId) return byId;

  // 2. Exact match on cleaned name, companyName, or contactName
  for (const c of clientList) {
    if (cleanSearchString(c.name) === cleanedQuery) return c;
    if (c.companyName && cleanSearchString(c.companyName) === cleanedQuery) return c;
    if (c.contactName && cleanSearchString(c.contactName) === cleanedQuery) return c;
  }

  // 3. Substring contains match
  for (const c of clientList) {
    const cNameClean = cleanSearchString(c.name);
    const cCompClean = cleanSearchString(c.companyName);
    if (cNameClean && (cleanedQuery.includes(cNameClean) || cNameClean.includes(cleanedQuery))) return c;
    if (cCompClean && (cleanedQuery.includes(cCompClean) || cCompClean.includes(cleanedQuery))) return c;
  }

  // 4. Significant tokens overlap (e.g. "richard bellazalma")
  const queryTokens = getSignificantTokens(rawQuery);
  if (queryTokens.length > 0) {
    let bestMatch: Client | undefined;
    let maxMatchCount = 0;

    for (const c of clientList) {
      const clientTokens = new Set([
        ...getSignificantTokens(c.name),
        ...getSignificantTokens(c.companyName),
        ...getSignificantTokens(c.contactName),
      ]);
      const matchCount = queryTokens.filter((token) => clientTokens.has(token)).length;
      if (matchCount > maxMatchCount && matchCount >= Math.min(2, queryTokens.length)) {
        maxMatchCount = matchCount;
        bestMatch = c;
      }
    }

    if (bestMatch) return bestMatch;

    // Single strong token match (length >= 4, e.g. "bellazalma")
    for (const c of clientList) {
      const clientTokens = new Set([
        ...getSignificantTokens(c.name),
        ...getSignificantTokens(c.companyName),
      ]);
      const longMatches = queryTokens.filter((token) => token.length >= 4 && clientTokens.has(token));
      if (longMatches.length > 0) {
        return c;
      }
    }
  }

  return undefined;
};

const getAvatarForClient = (
  name: string, 
  currentAvatar?: string,
  availableClients?: Client[]
): string => {
  if (currentAvatar && typeof currentAvatar === 'string' && currentAvatar.trim()) {
    return currentAvatar.trim();
  }
  if (availableClients && availableClients.length > 0) {
    const matched = findRegisteredClient(name, availableClients);
    if (matched?.avatar && matched.avatar.trim()) {
      return matched.avatar.trim();
    }
  }
  const clean = cleanSearchString(name);
  for (const [key, avatar] of Object.entries(FALLBACK_AVATARS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return avatar;
    }
  }
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    sum += clean.charCodeAt(i);
  }
  return DEFAULT_AVATARS_LIST[sum % DEFAULT_AVATARS_LIST.length];
};

const normalizeStr = (s: string) => 
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Format handle or shortened name for story circle
const formatStoryLabel = (name: string): string => {
  // If name has a hyphen like "Help Ideias - Cliente Demonstração", prefer the company part
  const parts = name.split('-');
  const primaryName = (parts[0] || name).trim();
  if (primaryName.length <= 11) return primaryName;
  return primaryName.slice(0, 10) + '...';
};

const STORAGE_VIEWED_SIGNATURES_KEY = 'ideias_digitais_viewed_stories_signatures_v2';

export const isDemandCompleted = (demand: DemandItem): boolean => {
  const colId = (demand.columnId || '').toLowerCase().trim();
  const status = (demand.statusLabel || '').toLowerCase().trim();
  return (
    colId === 'concluidas' ||
    colId === 'concluida' ||
    colId === 'done' ||
    colId === 'finalizado' ||
    colId === 'completed' ||
    colId.includes('conclui') ||
    status === 'concluída' ||
    status === 'concluida' ||
    status.includes('conclui')
  );
};

export const DemandsStoriesSection: React.FC<DemandsStoriesSectionProps> = ({
  clients = [],
  demands = [],
  onSelectDemand,
  onOpenNewDemandModal,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Viewed signatures map: { [clientId]: "count_latestDemandId_columns" }
  const [viewedSignatures, setViewedSignatures] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIEWED_SIGNATURES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Modal viewer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Keep clients in sync directly from props with fallback to localStorage
  const allKnownClients = useMemo(() => {
    const clientMap = new Map<string, Client>();

    // 1. Live props always take absolute precedence
    (clients || []).forEach((c) => {
      if (c && c.id) {
        clientMap.set(c.id, c);
      }
    });

    // 2. Extra offline clients fallback (do not overwrite live props)
    try {
      const saved = localStorage.getItem('agency_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (c && c.id && !clientMap.has(c.id)) {
              clientMap.set(c.id, c);
            }
          });
        }
      }
    } catch {}

    return Array.from(clientMap.values());
  }, [clients]);

  // Synchronize clients & demands directly from state
  const { storyClients, newUpdatesCount } = useMemo(() => {
    // Only active (non-completed) demands represent updates in this section.
    // When a demand is placed in "Concluídas", it is removed from this section.
    const activeDemands = demands.filter((demand) => !isDemandCompleted(demand));

    // 1. Group active demands by client
    // Support matching by name, companyName, id, or normalized string
    const clientDemandsMap = new Map<string, {
      id: string;
      domId?: string;
      fullName: string;
      displayName: string;
      handle: string;
      avatar: string;
      demands: DemandItem[];
    }>();

    // Map existing registered clients first
    allKnownClients.forEach((c) => {
      const displayName = (c.name || c.companyName || 'Cliente').trim();
      const avatar = (c.avatar && c.avatar.trim())
        ? c.avatar.trim()
        : getAvatarForClient(displayName, c.avatar, allKnownClients);
      const handle = c.instagram 
        ? c.instagram.replace(/^@/, '') 
        : formatStoryLabel(displayName);
      const domSlug = `demand-cli-${normalizeStr(displayName).replace(/[^a-z0-9]/g, '-')}`;

      clientDemandsMap.set(c.id, {
        id: c.id,
        domId: domSlug,
        fullName: displayName,
        displayName: formatStoryLabel(displayName),
        handle,
        avatar,
        demands: [],
      });
    });

    // Match all ACTIVE demands to their clients or create dynamic client entries
    activeDemands.forEach((demand) => {
      const rawClient = (demand.client || '').trim();
      if (!rawClient && !demand.clientId) return;

      // 1. Match by demand.clientId if available
      let matchedClient: Client | undefined = undefined;
      if (demand.clientId) {
        matchedClient = allKnownClients.find((c) => c.id === demand.clientId);
      }
      // 2. Match by registered client search
      if (!matchedClient && rawClient) {
        matchedClient = findRegisteredClient(rawClient, allKnownClients);
      }

      if (matchedClient && clientDemandsMap.has(matchedClient.id)) {
        clientDemandsMap.get(matchedClient.id)!.demands.push(demand);
      } else if (matchedClient) {
        const displayName = (matchedClient.name || matchedClient.companyName || rawClient).trim();
        const avatar = (matchedClient.avatar && matchedClient.avatar.trim())
          ? matchedClient.avatar.trim()
          : getAvatarForClient(displayName, matchedClient.avatar, allKnownClients);
        const handle = matchedClient.instagram 
          ? matchedClient.instagram.replace(/^@/, '') 
          : formatStoryLabel(displayName);
        const domSlug = `demand-cli-${normalizeStr(displayName).replace(/[^a-z0-9]/g, '-')}`;

        clientDemandsMap.set(matchedClient.id, {
          id: matchedClient.id,
          domId: domSlug,
          fullName: displayName,
          displayName: formatStoryLabel(displayName),
          handle,
          avatar,
          demands: [demand],
        });
      } else {
        // Fallback for unlinked demands: generate dom slug and search for registered avatar
        const domSlug = `demand-cli-${normalizeStr(rawClient).replace(/[^a-z0-9]/g, '-')}`;
        const avatar = getAvatarForClient(rawClient, undefined, allKnownClients);

        if (clientDemandsMap.has(domSlug)) {
          clientDemandsMap.get(domSlug)!.demands.push(demand);
        } else {
          clientDemandsMap.set(domSlug, {
            id: domSlug,
            domId: domSlug,
            fullName: rawClient,
            displayName: formatStoryLabel(rawClient),
            handle: formatStoryLabel(rawClient),
            avatar,
            demands: [demand],
          });
        }
      }
    });

    // Convert map to StoryClientData array
    // Only include clients that have active updates. If all demands are concluded, the update disappears from this section!
    const list: StoryClientData[] = [];
    let unviewedCount = 0;

    clientDemandsMap.forEach((entry) => {
      // If client has no active demands, they don't have an active story/update in this section
      if (entry.demands.length === 0) return;

      // Signature based on demand IDs and their column statuses
      // Whenever a demand is added, edited, or moved for this client, this signature changes!
      const sortedDemands = [...entry.demands].sort((a, b) => a.id.localeCompare(b.id));
      const currentSignature = `${sortedDemands.length}_${sortedDemands.map((d) => `${d.id}-${d.columnId}`).join('_')}`;

      const savedSignature = viewedSignatures[entry.id];
      const isUnread = savedSignature !== currentSignature;

      if (isUnread) {
        unviewedCount++;
      }

      list.push({
        id: entry.id,
        domId: entry.domId,
        name: entry.fullName,
        handle: entry.displayName,
        avatar: entry.avatar,
        hasUpdates: isUnread,
        updatesCount: entry.demands.length,
        demands: entry.demands,
      });
    });

    // Sort order:
    // 1. Clients with unread new updates first (highest demand count first)
    // 2. Clients with demands already viewed (highest demand count first)
    list.sort((a, b) => {
      if (a.hasUpdates && !b.hasUpdates) return -1;
      if (!a.hasUpdates && b.hasUpdates) return 1;
      return b.updatesCount - a.updatesCount;
    });

    return { storyClients: list, newUpdatesCount: unviewedCount };
  }, [allKnownClients, demands, viewedSignatures]);

  // Scroll checking
  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [storyClients.length, updateScrollButtons]);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 280;
    scrollContainerRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(updateScrollButtons, 350);
  }, [updateScrollButtons]);

  const handleOpenStory = useCallback((index: number) => {
    setSelectedStoryIndex(index);
    setIsModalOpen(true);
  }, []);

  // Mark client as viewed by storing current signature (guards against redundant re-renders)
  const handleMarkAsViewed = useCallback((clientId: string) => {
    const target = storyClients.find((c) => c.id === clientId);
    if (!target) return;

    const sortedDemands = [...target.demands].sort((a, b) => a.id.localeCompare(b.id));
    const currentSignature = `${sortedDemands.length}_${sortedDemands.map((d) => `${d.id}-${d.columnId}`).join('_')}`;

    setViewedSignatures((prev) => {
      if (prev[clientId] === currentSignature) {
        return prev; // Do not trigger state update if signature is unchanged
      }
      const updated = { ...prev, [clientId]: currentSignature };
      try {
        localStorage.setItem(STORAGE_VIEWED_SIGNATURES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [storyClients]);

  // Mark all as viewed
  const handleMarkAllAsViewed = useCallback(() => {
    const updated: Record<string, string> = {};
    storyClients.forEach((c) => {
      const sorted = [...c.demands].sort((a, b) => a.id.localeCompare(b.id));
      updated[c.id] = `${sorted.length}_${sorted.map((d) => `${d.id}-${d.columnId}`).join('_')}`;
    });
    setViewedSignatures((prev) => {
      const isIdentical = Object.keys(updated).every((key) => prev[key] === updated[key]);
      if (isIdentical && Object.keys(updated).length === Object.keys(prev).length) {
        return prev;
      }
      try {
        localStorage.setItem(STORAGE_VIEWED_SIGNATURES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [storyClients]);

  return (
    <section 
      id="demands-stories-section"
      aria-label="Atualizações de Demandas em formato Stories"
      className="bg-white dark:bg-[#0f172a] rounded-[24px] p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs relative transition-all"
    >
      {/* Stories Carousel Wrapper with Scroll Buttons */}
      <div className="relative group">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            type="button"
            id="btn-stories-scroll-left"
            onClick={() => handleScroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all"
            aria-label="Rolar histórias para a esquerda"
          >
            <ChevronLeft size={18} className="stroke-[2.5]" />
          </button>
        )}

        {/* The Scrollable Stories Track */}
        <div
          ref={scrollContainerRef}
          id="demands-stories-track"
          onScroll={updateScrollButtons}
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1 select-none scroll-smooth"
        >
          {storyClients.length === 0 ? (
            <div className="py-6 px-4 text-center w-full flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCheck size={16} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nenhuma atualização ativa no momento
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Demandas na coluna "Concluídas" não aparecem aqui. Novas demandas em andamento aparecerão automaticamente.
              </p>
            </div>
          ) : (
            storyClients.map((client, index) => {
              const hasUnread = client.hasUpdates;
              const hasDemands = client.demands.length > 0;

              return (
                <div
                  key={client.id}
                  id={`story-item-${client.domId || client.id}`}
                  onClick={() => handleOpenStory(index)}
                  className="flex flex-col items-center shrink-0 cursor-pointer group/story focus:outline-none"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenStory(index);
                    }
                  }}
                  aria-label={`Ver atualizações de ${client.name}`}
                  title={`${client.name} (${client.demands.length} demandas cadastradas)`}
                >
                  {/* Avatar with Ring */}
                  <div className="relative">
                    {/* Outer Ring: Instagram Gradient if unviewed with updates, subtle ring if viewed/no updates */}
                    <div 
                      className={`
                        rounded-full transition-all duration-300 group-hover/story:scale-105
                        ${hasUnread
                          ? 'p-[2.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-sm animate-in fade-in' 
                          : hasDemands
                            ? 'p-[2px] bg-slate-300 dark:bg-slate-700 opacity-80 group-hover/story:opacity-100'
                            : 'p-[2px] bg-slate-200 dark:bg-slate-800 opacity-60'
                        }
                      `}
                    >
                      {/* Inner White/Dark gap ring */}
                      <div className="p-[2.5px] bg-white dark:bg-[#0f172a] rounded-full">
                        {/* Avatar Image */}
                        <img
                          src={client.avatar}
                          alt={client.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover transition-transform duration-300 group-hover/story:scale-102"
                          onError={(e) => {
                            const fallback = getAvatarForClient(client.name, undefined, allKnownClients);
                            if (fallback && (e.target as HTMLImageElement).src !== fallback) {
                              (e.target as HTMLImageElement).src = fallback;
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real client name pulled dynamically */}
                  <span 
                    className={`
                      text-[11px] sm:text-xs text-center truncate max-w-[72px] sm:max-w-[80px] mt-1.5 transition-colors block
                      ${hasUnread 
                        ? 'text-slate-900 dark:text-white font-bold' 
                        : 'text-slate-600 dark:text-slate-400 font-medium'
                      }
                    `}
                    title={client.name}
                  >
                    {client.handle}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Scroll Right Button (Signature '>' button matching the screenshot) */}
        {canScrollRight && storyClients.length > 5 && (
          <button
            type="button"
            id="btn-stories-scroll-right"
            onClick={() => handleScroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all"
            aria-label="Rolar histórias para a direita"
          >
            <ChevronRight size={18} className="stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Story Viewer Modal */}
      <DemandStoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        storyClients={storyClients}
        initialClientIndex={selectedStoryIndex}
        onSelectDemand={onSelectDemand}
        onMarkAsViewed={handleMarkAsViewed}
      />
    </section>
  );
};
