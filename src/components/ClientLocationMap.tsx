import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Globe, 
  Navigation, 
  Users, 
  Building2, 
  TrendingUp, 
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  X,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Client, PageId } from '../types';
import { 
  BRAZIL_STATES, 
  BRAZIL_ISLANDS, 
  STATE_CENTROIDS, 
  geoToBrazilSvg, 
  BrazilStatePath 
} from '../data/brazilStatesData';

interface ClientLocationMapProps {
  clients: Client[];
  onNavigate?: (page: PageId) => void;
  onSelectClient?: (clientId: string) => void;
}

interface CityCoordinates {
  name: string;
  state?: string;
  region: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte' | 'Internacional';
  lat: number;
  lng: number;
  country?: string;
}

// Extensive dictionary of Brazilian and global city coordinates with regional mapping
const KNOWN_CITIES: Record<string, CityCoordinates> = {
  // SP (Sudeste)
  'sao paulo': { name: 'São Paulo', state: 'SP', region: 'Sudeste', lat: -23.5505, lng: -46.6333 },
  'campinas': { name: 'Campinas', state: 'SP', region: 'Sudeste', lat: -22.9099, lng: -47.0626 },
  'santos': { name: 'Santos', state: 'SP', region: 'Sudeste', lat: -23.9608, lng: -46.3336 },
  'ribeirao preto': { name: 'Ribeirão Preto', state: 'SP', region: 'Sudeste', lat: -21.1704, lng: -47.8103 },
  'sao jose dos campos': { name: 'São José dos Campos', state: 'SP', region: 'Sudeste', lat: -23.1896, lng: -45.8841 },
  'sorocaba': { name: 'Sorocaba', state: 'SP', region: 'Sudeste', lat: -23.5015, lng: -47.4526 },
  'santo andre': { name: 'Santo André', state: 'SP', region: 'Sudeste', lat: -23.6639, lng: -46.5383 },
  'sao bernardo do campo': { name: 'São Bernardo do Campo', state: 'SP', region: 'Sudeste', lat: -23.6944, lng: -46.5654 },
  'osasco': { name: 'Osasco', state: 'SP', region: 'Sudeste', lat: -23.5329, lng: -46.7917 },
  'guarulhos': { name: 'Guarulhos', state: 'SP', region: 'Sudeste', lat: -23.4542, lng: -46.5333 },
  'barueri': { name: 'Barueri', state: 'SP', region: 'Sudeste', lat: -23.5111, lng: -46.8764 },
  'jundiai': { name: 'Jundiaí', state: 'SP', region: 'Sudeste', lat: -23.1857, lng: -46.8978 },
  'piracicaba': { name: 'Piracicaba', state: 'SP', region: 'Sudeste', lat: -22.7338, lng: -47.6476 },
  'bauru': { name: 'Bauru', state: 'SP', region: 'Sudeste', lat: -22.3145, lng: -49.0587 },

  // RJ (Sudeste)
  'rio de janeiro': { name: 'Rio de Janeiro', state: 'RJ', region: 'Sudeste', lat: -22.9068, lng: -43.1729 },
  'niteroi': { name: 'Niterói', state: 'RJ', region: 'Sudeste', lat: -22.8833, lng: -43.1036 },
  'petropolis': { name: 'Petrópolis', state: 'RJ', region: 'Sudeste', lat: -22.5050, lng: -43.1789 },
  'nova iguacu': { name: 'Nova Iguaçu', state: 'RJ', region: 'Sudeste', lat: -22.7556, lng: -43.4603 },
  'duque de caxias': { name: 'Duque de Caxias', state: 'RJ', region: 'Sudeste', lat: -22.7858, lng: -43.3117 },
  'campos dos goytacazes': { name: 'Campos dos Goytacazes', state: 'RJ', region: 'Sudeste', lat: -21.7545, lng: -41.3244 },

  // MG (Sudeste)
  'belo horizonte': { name: 'Belo Horizonte', state: 'MG', region: 'Sudeste', lat: -19.9167, lng: -43.9345 },
  'ouro preto': { name: 'Ouro Preto', state: 'MG', region: 'Sudeste', lat: -20.3856, lng: -43.5035 },
  'uberlandia': { name: 'Uberlândia', state: 'MG', region: 'Sudeste', lat: -18.9186, lng: -48.2772 },
  'juiz de fora': { name: 'Juiz de Fora', state: 'MG', region: 'Sudeste', lat: -21.7587, lng: -43.3496 },
  'contagem': { name: 'Contagem', state: 'MG', region: 'Sudeste', lat: -19.9317, lng: -44.0536 },
  'betim': { name: 'Betim', state: 'MG', region: 'Sudeste', lat: -19.9678, lng: -44.1983 },
  'montes claros': { name: 'Montes Claros', state: 'MG', region: 'Sudeste', lat: -16.7282, lng: -43.8617 },
  'uberaba': { name: 'Uberaba', state: 'MG', region: 'Sudeste', lat: -19.7472, lng: -47.9392 },

  // ES (Sudeste)
  'vitoria': { name: 'Vitória', state: 'ES', region: 'Sudeste', lat: -20.3155, lng: -40.3128 },
  'vila velha': { name: 'Vila Velha', state: 'ES', region: 'Sudeste', lat: -20.3297, lng: -40.2925 },

  // PR (Sul)
  'curitiba': { name: 'Curitiba', state: 'PR', region: 'Sul', lat: -25.4284, lng: -49.2733 },
  'londrina': { name: 'Londrina', state: 'PR', region: 'Sul', lat: -23.3045, lng: -51.1696 },
  'maringa': { name: 'Maringá', state: 'PR', region: 'Sul', lat: -23.4205, lng: -51.9331 },
  'ponta grossa': { name: 'Ponta Grossa', state: 'PR', region: 'Sul', lat: -25.0994, lng: -50.1583 },
  'cascavel': { name: 'Cascavel', state: 'PR', region: 'Sul', lat: -24.9578, lng: -53.4595 },
  'foz do iguacu': { name: 'Foz do Iguaçu', state: 'PR', region: 'Sul', lat: -25.5478, lng: -54.5880 },

  // RS (Sul)
  'porto alegre': { name: 'Porto Alegre', state: 'RS', region: 'Sul', lat: -30.0346, lng: -51.2177 },
  'caxias do sul': { name: 'Caxias do Sul', state: 'RS', region: 'Sul', lat: -29.1678, lng: -51.1794 },
  'pelotas': { name: 'Pelotas', state: 'RS', region: 'Sul', lat: -31.7654, lng: -52.3376 },
  'canoas': { name: 'Canoas', state: 'RS', region: 'Sul', lat: -29.9178, lng: -51.1836 },
  'santa maria': { name: 'Santa Maria', state: 'RS', region: 'Sul', lat: -29.6868, lng: -53.8149 },

  // SC (Sul)
  'florianopolis': { name: 'Florianópolis', state: 'SC', region: 'Sul', lat: -27.5954, lng: -48.5480 },
  'joinville': { name: 'Joinville', state: 'SC', region: 'Sul', lat: -26.3045, lng: -48.8487 },
  'blumenau': { name: 'Blumenau', state: 'SC', region: 'Sul', lat: -26.9194, lng: -49.0661 },
  'itajaí': { name: 'Itajaí', state: 'SC', region: 'Sul', lat: -26.9078, lng: -48.6619 },
  'balneario camboriu': { name: 'Balneário Camboriú', state: 'SC', region: 'Sul', lat: -26.9926, lng: -48.6353 },
  'chapeco': { name: 'Chapecó', state: 'SC', region: 'Sul', lat: -27.1004, lng: -52.6152 },

  // Centro-Oeste
  'brasilia': { name: 'Brasília', state: 'DF', region: 'Centro-Oeste', lat: -15.7975, lng: -47.8919 },
  'goiania': { name: 'Goiânia', state: 'GO', region: 'Centro-Oeste', lat: -16.6869, lng: -49.2648 },
  'aparecida de goiania': { name: 'Aparecida de Goiânia', state: 'GO', region: 'Centro-Oeste', lat: -16.8239, lng: -49.2439 },
  'anapolis': { name: 'Anápolis', state: 'GO', region: 'Centro-Oeste', lat: -16.3267, lng: -48.9534 },
  'cuiaba': { name: 'Cuiabá', state: 'MT', region: 'Centro-Oeste', lat: -15.6010, lng: -56.0974 },
  'campo grande': { name: 'Campo Grande', state: 'MS', region: 'Centro-Oeste', lat: -20.4697, lng: -54.6201 },

  // Nordeste
  'salvador': { name: 'Salvador', state: 'BA', region: 'Nordeste', lat: -12.9777, lng: -38.5016 },
  'feira de santana': { name: 'Feira de Santana', state: 'BA', region: 'Nordeste', lat: -12.2667, lng: -38.9667 },
  'recife': { name: 'Recife', state: 'PE', region: 'Nordeste', lat: -8.0476, lng: -34.8770 },
  'olinda': { name: 'Olinda', state: 'PE', region: 'Nordeste', lat: -8.0089, lng: -34.8553 },
  'fortaleza': { name: 'Fortaleza', state: 'CE', region: 'Nordeste', lat: -3.7319, lng: -38.5267 },
  'natal': { name: 'Natal', state: 'RN', region: 'Nordeste', lat: -5.7945, lng: -35.2110 },
  'joao pessoa': { name: 'João Pessoa', state: 'PB', region: 'Nordeste', lat: -7.1195, lng: -34.8450 },
  'maceio': { name: 'Maceió', state: 'AL', region: 'Nordeste', lat: -9.6498, lng: -35.7089 },
  'aracaju': { name: 'Aracaju', state: 'SE', region: 'Nordeste', lat: -10.9472, lng: -37.0731 },
  'sao luis': { name: 'São Luís', state: 'MA', region: 'Nordeste', lat: -2.5307, lng: -44.3068 },
  'teresina': { name: 'Teresina', state: 'PI', region: 'Nordeste', lat: -5.0920, lng: -42.8038 },

  // Norte
  'manaus': { name: 'Manaus', state: 'AM', region: 'Norte', lat: -3.1190, lng: -60.0217 },
  'belem': { name: 'Belém', state: 'PA', region: 'Norte', lat: -1.4558, lng: -48.4902 },
  'porto velho': { name: 'Porto Velho', state: 'RO', region: 'Norte', lat: -8.7619, lng: -63.9039 },
  'macapa': { name: 'Macapá', state: 'AP', region: 'Norte', lat: 0.0356, lng: -51.0705 },
  'boa vista': { name: 'Boa Vista', state: 'RR', region: 'Norte', lat: 2.8235, lng: -60.6758 },
  'palmas': { name: 'Palmas', state: 'TO', region: 'Norte', lat: -10.2491, lng: -48.3243 },
  'rio branco': { name: 'Rio Branco', state: 'AC', region: 'Norte', lat: -9.9753, lng: -67.8249 },

  // Internacional
  'lisboa': { name: 'Lisboa', region: 'Internacional', lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  'porto': { name: 'Porto', region: 'Internacional', lat: 41.1579, lng: -8.6291, country: 'Portugal' },
  'miami': { name: 'Miami', region: 'Internacional', lat: 25.7617, lng: -80.1918, country: 'EUA' },
  'new york': { name: 'Nova York', region: 'Internacional', lat: 40.7128, lng: -74.0060, country: 'EUA' },
  'nova york': { name: 'Nova York', region: 'Internacional', lat: 40.7128, lng: -74.0060, country: 'EUA' },
  'orlando': { name: 'Orlando', region: 'Internacional', lat: 28.5383, lng: -81.3792, country: 'EUA' },
  'londres': { name: 'Londres', region: 'Internacional', lat: 51.5074, lng: -0.1278, country: 'Reino Unido' },
  'madri': { name: 'Madri', region: 'Internacional', lat: 40.4168, lng: -3.7038, country: 'Espanha' },
  'buenos aires': { name: 'Buenos Aires', region: 'Internacional', lat: -34.6037, lng: -58.3816, country: 'Argentina' },
  'santiago': { name: 'Santiago', region: 'Internacional', lat: -33.4489, lng: -70.6693, country: 'Chile' },
};

function normalizeCityName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveRegionByState(state?: string): 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte' | 'Internacional' {
  if (!state) return 'Sudeste';
  const s = state.toUpperCase().trim();
  if (['SP', 'RJ', 'MG', 'ES'].includes(s)) return 'Sudeste';
  if (['PR', 'SC', 'RS'].includes(s)) return 'Sul';
  if (['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'MA', 'PI'].includes(s)) return 'Nordeste';
  if (['DF', 'GO', 'MT', 'MS'].includes(s)) return 'Centro-Oeste';
  if (['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'TO'].includes(s)) return 'Norte';
  return 'Internacional';
}

function getClientCoordinates(client: Client): { 
  lat: number; 
  lng: number; 
  cityName: string; 
  stateName?: string;
  region: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte' | 'Internacional';
} {
  // 1. Try explicit client.city
  if (client.city) {
    const norm = normalizeCityName(client.city);
    if (KNOWN_CITIES[norm]) {
      const entry = KNOWN_CITIES[norm];
      return { 
        lat: entry.lat, 
        lng: entry.lng, 
        cityName: client.city, 
        stateName: client.state || entry.state,
        region: entry.region || resolveRegionByState(client.state || entry.state)
      };
    }
  }

  // 2. Try parsing from address if city is missing or not matched
  if (client.address) {
    const parts = client.address.split(/[-–,]/).map((p) => p.trim());
    for (const part of parts) {
      const norm = normalizeCityName(part);
      if (KNOWN_CITIES[norm]) {
        const entry = KNOWN_CITIES[norm];
        return { 
          lat: entry.lat, 
          lng: entry.lng, 
          cityName: entry.name, 
          stateName: client.state || entry.state,
          region: entry.region || resolveRegionByState(client.state || entry.state)
        };
      }
    }
  }

  // 3. Fallback based on state
  const stateCode = (client.state || '').toUpperCase().trim();
  const stateFallbacks: Record<string, { lat: number; lng: number; defaultCity: string; region: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte' | 'Internacional' }> = {
    SP: { lat: -23.5505, lng: -46.6333, defaultCity: 'São Paulo', region: 'Sudeste' },
    RJ: { lat: -22.9068, lng: -43.1729, defaultCity: 'Rio de Janeiro', region: 'Sudeste' },
    MG: { lat: -19.9167, lng: -43.9345, defaultCity: 'Belo Horizonte', region: 'Sudeste' },
    ES: { lat: -20.3155, lng: -40.3128, defaultCity: 'Vitória', region: 'Sudeste' },
    PR: { lat: -25.4284, lng: -49.2733, defaultCity: 'Curitiba', region: 'Sul' },
    RS: { lat: -30.0346, lng: -51.2177, defaultCity: 'Porto Alegre', region: 'Sul' },
    SC: { lat: -27.5954, lng: -48.5480, defaultCity: 'Florianópolis', region: 'Sul' },
    DF: { lat: -15.7975, lng: -47.8919, defaultCity: 'Brasília', region: 'Centro-Oeste' },
    GO: { lat: -16.6869, lng: -49.2648, defaultCity: 'Goiânia', region: 'Centro-Oeste' },
    BA: { lat: -12.9777, lng: -38.5016, defaultCity: 'Salvador', region: 'Nordeste' },
    PE: { lat: -8.0476, lng: -34.8770, defaultCity: 'Recife', region: 'Nordeste' },
    CE: { lat: -3.7319, lng: -38.5267, defaultCity: 'Fortaleza', region: 'Nordeste' },
    AM: { lat: -3.1190, lng: -60.0217, defaultCity: 'Manaus', region: 'Norte' },
    PA: { lat: -1.4558, lng: -48.4902, defaultCity: 'Belém', region: 'Norte' },
  };

  if (stateFallbacks[stateCode]) {
    const fb = stateFallbacks[stateCode];
    return {
      lat: fb.lat + (client.id.charCodeAt(client.id.length - 1) % 5) * 0.08,
      lng: fb.lng + (client.id.charCodeAt(client.id.length - 1) % 5) * 0.08,
      cityName: client.city || fb.defaultCity,
      stateName: stateCode,
      region: fb.region
    };
  }

  // Final fallback
  return {
    lat: -23.5505,
    lng: -46.6333,
    cityName: client.city || 'São Paulo',
    stateName: client.state || 'SP',
    region: 'Sudeste'
  };
}

export interface CityCluster {
  key: string;
  cityName: string;
  stateName?: string;
  region: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte' | 'Internacional';
  lat: number;
  lng: number;
  clients: Client[];
  totalMRR: number;
  worldX: number;
  worldY: number;
  brazilX: number;
  brazilY: number;
}

export const ClientLocationMap: React.FC<ClientLocationMapProps> = ({
  clients,
  onNavigate,
  onSelectClient,
}) => {
  const [viewMode, setViewMode] = useState<'world' | 'brazil'>('brazil');
  const [selectedCluster, setSelectedCluster] = useState<CityCluster | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<CityCluster | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<BrazilStatePath | null>(null);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Group clients by State (UF) to highlight registered client states
  const activeStatesMap = useMemo(() => {
    const map = new Map<string, { count: number; clients: Client[]; mrr: number; stateName: string }>();

    clients.forEach((client) => {
      let uf = (client.state || '').trim().toUpperCase();
      if (!uf && client.city) {
        const norm = normalizeCityName(client.city);
        if (KNOWN_CITIES[norm]?.state) {
          uf = KNOWN_CITIES[norm].state!;
        }
      }

      if (uf) {
        if (!map.has(uf)) {
          const stateObj = BRAZIL_STATES.find((s) => s.id === uf);
          map.set(uf, {
            count: 0,
            clients: [],
            mrr: 0,
            stateName: stateObj?.name || uf,
          });
        }
        const entry = map.get(uf)!;
        entry.count += 1;
        entry.clients.push(client);
        if (client.status === 'Ativo') {
          entry.mrr += client.monthlyFee;
        }
      }
    });

    return map;
  }, [clients]);

  // Group clients by resolved city & coordinates
  const clusters: CityCluster[] = useMemo(() => {
    const map = new Map<string, CityCluster>();

    clients.forEach((client) => {
      const coords = getClientCoordinates(client);
      const key = `${coords.cityName.toLowerCase()}-${(coords.stateName || '').toLowerCase()}`;

      if (!map.has(key)) {
        // Project to World SVG: viewBox="0 0 1000 500"
        const worldX = 500 + (coords.lng / 180) * 470;
        const worldY = 250 - (coords.lat / 90) * 230;

        // Project to Brazil SVG: viewBox="0 0 353.845 367.766"
        const brCoords = geoToBrazilSvg(coords.lat, coords.lng);

        map.set(key, {
          key,
          cityName: coords.cityName,
          stateName: coords.stateName,
          region: coords.region,
          lat: coords.lat,
          lng: coords.lng,
          clients: [client],
          totalMRR: client.status === 'Ativo' ? client.monthlyFee : 0,
          worldX: Math.max(15, Math.min(985, worldX)),
          worldY: Math.max(15, Math.min(485, worldY)),
          brazilX: brCoords.x,
          brazilY: brCoords.y,
        });
      } else {
        const cluster = map.get(key)!;
        cluster.clients.push(client);
        if (client.status === 'Ativo') {
          cluster.totalMRR += client.monthlyFee;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalMRR - a.totalMRR);
  }, [clients]);

  // Aggregate Regional Statistics
  const regionalStats = useMemo(() => {
    const regions: Record<string, { count: number; mrr: number; clients: number }> = {
      'Sudeste': { count: 0, mrr: 0, clients: 0 },
      'Sul': { count: 0, mrr: 0, clients: 0 },
      'Nordeste': { count: 0, mrr: 0, clients: 0 },
      'Centro-Oeste': { count: 0, mrr: 0, clients: 0 },
      'Norte': { count: 0, mrr: 0, clients: 0 },
      'Internacional': { count: 0, mrr: 0, clients: 0 },
    };

    clusters.forEach((c) => {
      const reg = c.region || 'Sudeste';
      if (!regions[reg]) {
        regions[reg] = { count: 0, mrr: 0, clients: 0 };
      }
      regions[reg].count += 1;
      regions[reg].mrr += c.totalMRR;
      regions[reg].clients += c.clients.length;
    });

    const totalClientsCount = clusters.reduce((acc, c) => acc + c.clients.length, 0);
    const totalMRRValue = clusters.reduce((acc, c) => acc + c.totalMRR, 0);

    return {
      regions,
      totalClientsCount,
      totalMRRValue,
    };
  }, [clusters]);

  // Filtered clusters based on Region & Search
  const filteredClusters = useMemo(() => {
    return clusters.filter((c) => {
      const matchRegion = selectedRegionFilter === 'todas' || c.region === selectedRegionFilter;
      const matchState = !selectedState || c.stateName?.toUpperCase() === selectedState.toUpperCase();
      const matchQuery = !searchQuery.trim() || 
        c.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.stateName && c.stateName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.clients.some((cli) => cli.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRegion && matchState && matchQuery;
    });
  }, [clusters, selectedRegionFilter, selectedState, searchQuery]);

  // Active cluster popover
  const activeCluster = selectedCluster || hoveredCluster;

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.0, +(prev + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.8, +(prev - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setSelectedCluster(null);
    setSelectedState(null);
  };

  const activeStatesList = useMemo(() => Array.from(activeStatesMap.keys()), [activeStatesMap]);

  return (
    <div 
      id="client-location-map-section"
      className="bg-white dark:bg-[#0f172a] rounded-[26px] p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all"
    >
      {/* Top Header: Title, Metric Chips, and View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fab518] shadow-xs shrink-0 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black text-[#142142] dark:text-white tracking-tight">
              Distribuição Geográfica da Carteira
            </h3>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Sparkles size={11} />
              <span>
                {activeStatesList.length > 0
                  ? `${activeStatesList.length} Estados Atendidos (${activeStatesList.join(', ')})`
                  : 'Pronto para cadastrar clientes'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mapa temático cartográfico com destaque para estados da federação onde há clientes ativos cadastrados
          </p>
        </div>

        {/* View Mode Switcher + Zoom Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              id="btn-map-view-brazil"
              onClick={() => {
                setViewMode('brazil');
                setSelectedCluster(null);
                setSelectedState(null);
                setZoomLevel(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'brazil'
                  ? 'bg-[#142142] text-white shadow-xs dark:bg-[#fab518] dark:text-[#142142]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <Compass size={13} className="shrink-0" />
              <span>Foco Brasil (Estados)</span>
            </button>
            <button
              type="button"
              id="btn-map-view-world"
              onClick={() => {
                setViewMode('world');
                setSelectedCluster(null);
                setSelectedState(null);
                setZoomLevel(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'world'
                  ? 'bg-[#142142] text-white shadow-xs dark:bg-[#fab518] dark:text-[#142142]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white'
              }`}
            >
              <Globe size={13} className="shrink-0" />
              <span>Visão Global</span>
            </button>
          </div>

          {/* Quick Zoom Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.0}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Aproximar mapa (+)"
            >
              <ZoomIn size={14} />
            </button>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 w-8 text-center select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.8}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Afastar mapa (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Resetar enquadramento"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">Estados Ativos</p>
            <p className="text-base font-black text-[#142142] dark:text-white leading-tight mt-0.5">
              {activeStatesList.length} <span className="text-[11px] font-bold text-amber-500">UFs</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">Clientes Mapeados</p>
            <p className="text-base font-black text-[#142142] dark:text-white leading-tight mt-0.5">
              {regionalStats.totalClientsCount} <span className="text-[11px] font-normal text-slate-500">contas</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">MRR Geolocalizado</p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
              R$ {regionalStats.totalMRRValue.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Navigation size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">Polo Principal</p>
            <p className="text-base font-black text-[#142142] dark:text-white leading-tight mt-0.5 truncate">
              São Paulo <span className="text-[11px] font-bold text-amber-500">
                ({activeStatesMap.get('SP')?.count || 0} cli)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Map & Analytics Split Grid */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column (8 cols): The Refined Interactive Map Stage */}
        <div 
          id="client-map-canvas-container"
          className="lg:col-span-8 relative rounded-2xl bg-gradient-to-b from-slate-900 via-[#0b1329] to-[#070b18] border border-slate-800 shadow-inner overflow-hidden flex flex-col min-h-[480px] sm:min-h-[540px]"
        >
          {/* Map Controls HUD Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10 shrink-0">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar estado, cidade ou cliente..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-[#fab518] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
              {[
                { id: 'todas', label: 'Todas UFs' },
                { id: 'Sudeste', label: 'Sudeste' },
                { id: 'Sul', label: 'Sul' },
                { id: 'Nordeste', label: 'Nordeste' },
                { id: 'Centro-Oeste', label: 'C-Oeste' },
                { id: 'Norte', label: 'Norte' },
                { id: 'Internacional', label: 'Global' },
              ].map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => {
                    setSelectedRegionFilter(reg.id);
                    setSelectedState(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedRegionFilter === reg.id
                      ? 'bg-[#fab518] text-[#142142] shadow-xs'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Stage with Smooth Zoom & Center */}
          <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-3 sm:p-6 select-none">
            
            <div 
              className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {viewMode === 'world' ? (
                /* WORLD MAP SVG: High Fidelity Cartographic Vector */
                <svg
                  viewBox="0 0 1000 500"
                  className="w-full h-auto max-h-[440px] drop-shadow-2xl"
                  aria-label="Mapa Mundi Cartográfico"
                >
                  <defs>
                    <linearGradient id="world-grad-land" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <radialGradient id="ocean-core" cx="50%" cy="50%" r="55%">
                      <stop offset="0%" stopColor="#0b1329" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#030712" stopOpacity="1" />
                    </radialGradient>
                    <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fab518" floodOpacity="0.8" />
                    </filter>
                  </defs>

                  {/* Ocean Background Area */}
                  <rect width="1000" height="500" fill="url(#ocean-core)" rx="16" />

                  {/* Latitude / Longitude Graticule Lines */}
                  <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.4">
                    <line x1="150" y1="20" x2="150" y2="480" />
                    <line x1="300" y1="20" x2="300" y2="480" />
                    <line x1="500" y1="20" x2="500" y2="480" />
                    <line x1="700" y1="20" x2="700" y2="480" />
                    <line x1="850" y1="20" x2="850" y2="480" />
                    <line x1="20" y1="140" x2="980" y2="140" stroke="#475569" />
                    <line x1="20" y1="250" x2="980" y2="250" stroke="#fab518" strokeDasharray="none" strokeWidth="0.8" opacity="0.5" />
                    <line x1="20" y1="340" x2="980" y2="340" stroke="#475569" />
                  </g>

                  {/* Latitude markings */}
                  <text x="30" y="246" className="fill-slate-500 text-[9px] font-mono select-none">EQUADOR 0°</text>
                  <text x="30" y="136" className="fill-slate-600 text-[8px] font-mono select-none">30°N</text>
                  <text x="30" y="336" className="fill-slate-600 text-[8px] font-mono select-none">30°S</text>

                  {/* Continents Vector Paths */}
                  <g fill="url(#world-grad-land)" stroke="#334155" strokeWidth="1" strokeLinejoin="round">
                    <path d="M 90,80 Q 140,65 190,85 T 260,70 T 320,110 T 300,160 Q 260,180 280,220 Q 250,260 210,250 T 170,220 Q 140,180 120,130 Z" />
                    <path d="M 210,250 Q 230,270 250,295 T 240,310 T 215,280 Z" />
                    <path d="M 330,45 Q 380,40 405,75 T 370,110 T 335,80 Z" />
                    <path d="M 255,295 Q 290,290 320,305 Q 370,300 410,335 Q 415,365 385,410 Q 360,450 330,480 Q 315,480 305,440 Q 285,390 270,360 Q 250,330 255,295 Z" className="fill-slate-800/90 stroke-slate-700" />
                    <path d="M 285,310 Q 345,305 395,335 Q 405,365 380,400 Q 355,415 330,395 Q 310,360 285,310 Z" fill="#fab518" fillOpacity="0.25" stroke="#fab518" strokeWidth="1.6" />
                    <path d="M 470,140 Q 520,130 550,150 T 570,185 Q 540,215 490,210 T 470,170 Z" />
                    <path d="M 455,145 Q 470,135 480,155 T 465,175 T 450,160 Z" />
                    <path d="M 505,80 Q 540,75 550,125 T 515,135 Z" />
                    <path d="M 465,220 Q 550,210 595,255 T 590,340 Q 560,405 530,420 Q 495,420 480,360 T 455,270 Z" />
                    <path d="M 605,345 Q 615,350 610,385 T 595,380 Z" />
                    <path d="M 560,140 Q 640,110 750,110 T 890,130 Q 860,180 810,210 T 730,230 Q 720,290 680,290 T 640,240 Q 580,240 560,180 Z" />
                    <path d="M 655,235 Q 710,235 695,295 T 660,265 Z" />
                    <path d="M 855,170 Q 870,160 865,210 T 850,200 Z" />
                    <path d="M 760,300 Q 820,310 805,345 T 750,335 Z" />
                    <path d="M 780,360 Q 860,345 885,395 T 855,445 T 785,425 Z" />
                    <path d="M 910,430 Q 925,425 920,460 T 905,455 Z" />
                  </g>

                  {/* Markers on World Map */}
                  {filteredClusters.map((cluster) => {
                    const isSelected = selectedCluster?.key === cluster.key;
                    const isHovered = hoveredCluster?.key === cluster.key;
                    const isActive = isSelected || isHovered;

                    return (
                      <g
                        key={`world-${cluster.key}`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedCluster(isSelected ? null : cluster)}
                        onMouseEnter={() => setHoveredCluster(cluster)}
                        onMouseLeave={() => setHoveredCluster(null)}
                      >
                        <circle
                          cx={cluster.worldX}
                          cy={cluster.worldY}
                          r={isActive ? 22 : 14}
                          className="fill-[#fab518]/25 stroke-[#fab518] stroke-[1] animate-ping"
                          style={{ transformOrigin: `${cluster.worldX}px ${cluster.worldY}px`, animationDuration: '2.4s' }}
                        />
                        <circle
                          cx={cluster.worldX}
                          cy={cluster.worldY}
                          r={isActive ? 10 : 7}
                          className="fill-slate-900 stroke-slate-700 stroke-[1]"
                        />
                        <circle
                          cx={cluster.worldX}
                          cy={cluster.worldY}
                          r={isActive ? 7 : 4.5}
                          fill="#fab518"
                          filter={isActive ? 'url(#glow-gold)' : undefined}
                          className="group-hover:fill-amber-300 transition-all stroke-slate-950 stroke-[1.5]"
                        />
                        {cluster.clients.length > 1 && (
                          <g transform={`translate(${cluster.worldX + 5}, ${cluster.worldY - 11})`}>
                            <rect width="15" height="13" rx="6" className="fill-[#fab518] stroke-slate-900 stroke-[1]" />
                            <text x="7.5" y="9.5" textAnchor="middle" className="fill-[#142142] text-[8.5px] font-black pointer-events-none">
                              {cluster.clients.length}
                            </text>
                          </g>
                        )}
                        <text
                          x={cluster.worldX}
                          y={cluster.worldY + 16}
                          textAnchor="middle"
                          className={`text-[9.5px] font-bold tracking-tight pointer-events-none drop-shadow-md transition-all ${
                            isActive ? 'fill-[#fab518] font-black text-[11px]' : 'fill-slate-300'
                          }`}
                        >
                          {cluster.cityName}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                /* OFFICIAL DETAILED BRAZIL STATES VECTOR MAP SVG (REFERÊNCIA mapa-brasil.png) */
                <svg
                  viewBox="0 0 353.845 367.766"
                  className="w-full h-auto max-h-[460px] drop-shadow-2xl mx-auto select-none"
                  aria-label="Mapa do Brasil com Divisão de Todos os Estados"
                >
                  <defs>
                    {/* Brand Gold/Amber Gradient for Client States */}
                    <linearGradient id="br-active-state-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fcd34d" />
                      <stop offset="40%" stopColor="#fab518" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>

                    {/* Subtle Glow for Highlighted States */}
                    <filter id="br-active-state-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#fab518" floodOpacity="0.8" />
                    </filter>

                    {/* City Marker Beacon Glow */}
                    <filter id="city-pin-glow" x="-40%" y="-40%" width="180%" height="180%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fab518" floodOpacity="1" />
                    </filter>
                  </defs>

                  {/* 1. Coastal Islands Layer matching official geography */}
                  <g id="brazil-islands" className="pointer-events-none opacity-80">
                    {BRAZIL_ISLANDS.map((points, idx) => (
                      <polygon
                        key={`island-${idx}`}
                        points={points}
                        className="fill-slate-800 stroke-slate-700/80 stroke-[0.6]"
                      />
                    ))}
                  </g>

                  {/* 2. All 27 Brazilian States Layer with Brand Color Highlighting */}
                  <g id="brazil-states-layer">
                    {BRAZIL_STATES.map((state) => {
                      const stateData = activeStatesMap.get(state.id);
                      const hasClients = !!stateData && stateData.count > 0;
                      const isStateSelected = selectedState === state.id;
                      const isStateHovered = hoveredState?.id === state.id;

                      // Fill color logic: Brand Gold (#fab518) for states with registered clients
                      // Neutral slate for states without clients (matching black/white outline reference)
                      let fillColor = '#1e293b'; // neutral dark slate
                      if (hasClients) {
                        fillColor = isStateHovered || isStateSelected ? '#fde047' : '#fab518';
                      } else if (isStateHovered) {
                        fillColor = '#334155';
                      }

                      // Stroke styling: Crisp borders
                      const strokeColor = hasClients
                        ? '#142142' // Deep Navy boundary for sharp contrast against gold
                        : isStateHovered 
                          ? '#94a3b8' 
                          : '#475569';

                      const strokeWidth = hasClients 
                        ? (isStateSelected || isStateHovered ? 1.6 : 1.1) 
                        : 0.65;

                      const commonProps = {
                        id: state.id,
                        className: `transition-all duration-200 cursor-pointer ${
                          hasClients ? 'hover:brightness-110 drop-shadow-md' : 'hover:fill-slate-700'
                        }`,
                        fill: fillColor,
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        strokeLinecap: 'round' as const,
                        strokeLinejoin: 'round' as const,
                        filter: hasClients ? 'url(#br-active-state-glow)' : undefined,
                        onClick: () => {
                          if (hasClients) {
                            setSelectedState(selectedState === state.id ? null : state.id);
                          }
                        },
                        onMouseEnter: () => setHoveredState(state),
                        onMouseLeave: () => setHoveredState(null),
                      };

                      if (state.type === 'polygon' && state.points) {
                        return (
                          <polygon
                            key={state.id}
                            points={state.points}
                            {...commonProps}
                          >
                            <title>{`${state.name} (${state.id}) - ${hasClients ? `${stateData?.count} clientes cadastrados` : 'Sem clientes cadastrados'}`}</title>
                          </polygon>
                        );
                      }

                      if (state.type === 'path' && state.d) {
                        return (
                          <path
                            key={state.id}
                            d={state.d}
                            {...commonProps}
                          >
                            <title>{`${state.name} (${state.id}) - ${hasClients ? `${stateData?.count} clientes cadastrados` : 'Sem clientes cadastrados'}`}</title>
                          </path>
                        );
                      }

                      return null;
                    })}
                  </g>

                  {/* 3. State Centroid Badges for Active Client States */}
                  <g id="state-badges-layer" className="pointer-events-none select-none">
                    {BRAZIL_STATES.map((state) => {
                      const stateData = activeStatesMap.get(state.id);
                      const hasClients = !!stateData && stateData.count > 0;
                      if (!hasClients) return null;

                      const centroid = STATE_CENTROIDS[state.id];
                      if (!centroid) return null;

                      return (
                        <g 
                          key={`badge-${state.id}`} 
                          transform={`translate(${centroid.x}, ${centroid.y})`}
                        >
                          {/* Mini Navy Badge with Gold Border */}
                          <rect
                            x="-9.5"
                            y="-7"
                            width="19"
                            height="14"
                            rx="4"
                            fill="#142142"
                            stroke="#ffffff"
                            strokeWidth="0.9"
                            className="drop-shadow-sm"
                          />
                          <text
                            textAnchor="middle"
                            y="3.5"
                            className="fill-white text-[8px] font-black tracking-tight"
                          >
                            {state.id}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* 4. Client City Markers on Top of the Accurate Map */}
                  <g id="city-markers-layer">
                    {filteredClusters.map((cluster) => {
                      const isSelected = selectedCluster?.key === cluster.key;
                      const isHovered = hoveredCluster?.key === cluster.key;
                      const isActive = isSelected || isHovered;

                      return (
                        <g
                          key={`br-marker-${cluster.key}`}
                          className="cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCluster(isSelected ? null : cluster);
                          }}
                          onMouseEnter={() => setHoveredCluster(cluster)}
                          onMouseLeave={() => setHoveredCluster(null)}
                        >
                          {/* Outer Radar Ripple */}
                          <circle
                            cx={cluster.brazilX}
                            cy={cluster.brazilY}
                            r={isActive ? 16 : 9}
                            className="fill-[#fab518]/30 stroke-[#fab518] stroke-[1] animate-ping"
                            style={{ transformOrigin: `${cluster.brazilX}px ${cluster.brazilY}px`, animationDuration: '2.5s' }}
                          />

                          {/* Outer Dark Ring */}
                          <circle
                            cx={cluster.brazilX}
                            cy={cluster.brazilY}
                            r={isActive ? 7 : 5}
                            className="fill-[#142142] stroke-white stroke-[1]"
                          />

                          {/* Center Core Gold Pin */}
                          <circle
                            cx={cluster.brazilX}
                            cy={cluster.brazilY}
                            r={isActive ? 4.5 : 3}
                            fill="#fab518"
                            filter={isActive ? 'url(#city-pin-glow)' : undefined}
                            className="stroke-[#142142] stroke-[0.8] group-hover:scale-125 transition-transform"
                          />

                          {/* Multi-client Counter Badge */}
                          {cluster.clients.length > 1 && (
                            <g transform={`translate(${cluster.brazilX + 3.5}, ${cluster.brazilY - 9})`}>
                              <rect
                                width="12"
                                height="10"
                                rx="5"
                                className="fill-[#142142] stroke-[#fab518] stroke-[1]"
                              />
                              <text
                                x="6"
                                y="7.5"
                                textAnchor="middle"
                                className="fill-[#fab518] text-[7px] font-black pointer-events-none"
                              >
                                {cluster.clients.length}
                              </text>
                            </g>
                          )}

                          {/* City Name Label */}
                          <text
                            x={cluster.brazilX}
                            y={cluster.brazilY + 12}
                            textAnchor="middle"
                            className={`text-[8px] font-bold tracking-tight pointer-events-none drop-shadow-md transition-all ${
                              isActive
                                ? 'fill-[#fab518] font-black text-[9px]'
                                : 'fill-white group-hover:fill-[#fab518]'
                            }`}
                          >
                            {cluster.cityName}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
            </div>

            {/* Floating State Mini HUD on Hover */}
            {hoveredState && !activeCluster && (
              <div className="absolute top-4 right-4 bg-slate-950/90 text-white backdrop-blur-md rounded-xl px-3.5 py-2 border border-slate-700/80 shadow-xl pointer-events-none z-20 flex items-center gap-2.5 animate-in fade-in duration-150">
                <span className={`w-3 h-3 rounded-full shrink-0 ${activeStatesMap.has(hoveredState.id) ? 'bg-[#fab518] shadow-xs' : 'bg-slate-600'}`} />
                <div>
                  <p className="text-xs font-black text-white leading-none">
                    {hoveredState.name} ({hoveredState.id})
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {activeStatesMap.has(hoveredState.id)
                      ? `${activeStatesMap.get(hoveredState.id)?.count} clientes cadastrados • R$ ${activeStatesMap.get(hoveredState.id)?.mrr.toLocaleString('pt-BR')}/mês`
                      : 'Sem clientes ativos nesta UF'}
                  </p>
                </div>
              </div>
            )}

            {/* Floating Interactive Popover Card for Active City Cluster or Selected State */}
            {activeCluster && (
              <div 
                id="active-city-inspector-card"
                className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-slate-950/95 text-white backdrop-blur-xl rounded-2xl p-4 border border-slate-700/90 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-3 duration-200"
              >
                {/* Popover Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black shrink-0 shadow-xs">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {activeCluster.cityName}{activeCluster.stateName ? `, ${activeCluster.stateName}` : ''}
                      </h4>
                      <p className="text-[11px] text-[#fab518] font-semibold mt-0.5">
                        {activeCluster.region} • {activeCluster.clients.length} {activeCluster.clients.length === 1 ? 'cliente' : 'clientes'}
                      </p>
                    </div>
                  </div>

                  {selectedCluster && (
                    <button
                      type="button"
                      onClick={() => setSelectedCluster(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Fechar"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Popover Revenue summary */}
                <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Receita Recorrente (MRR):</span>
                  <span className="font-black text-emerald-400 text-sm">
                    R$ {activeCluster.totalMRR.toLocaleString('pt-BR')}/mês
                  </span>
                </div>

                {/* List of Clients in this City */}
                <div className="mt-2.5 space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeCluster.clients.map((cli) => (
                    <div
                      key={cli.id}
                      onClick={() => {
                        if (onSelectClient) onSelectClient(cli.id);
                        if (onNavigate) onNavigate('clientes');
                      }}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer group border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {cli.avatar?.trim() ? (
                          <img
                            src={cli.avatar}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-[#fab518] font-bold text-[10px] flex items-center justify-center ring-1 ring-slate-700 shrink-0">
                            {cli.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-[#fab518] transition-colors">
                            {cli.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {cli.segment}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          cli.status === 'Ativo' 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                            : cli.status === 'Pausado'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        }`}>
                          {cli.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Open Client Wallet CTA */}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('clientes')}
                    className="w-full mt-3 py-2 px-3 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Ver Clientes no Painel</span>
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Map Footer HUD Status Bar & Palette Legend */}
          <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 shrink-0">
            {/* Visual Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#fab518] shadow-xs border border-white/40" />
                <span className="font-bold text-white">Estado com Clientes (Paleta Ouro)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-600" />
                <span>Estado sem Clientes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fab518] ring-2 ring-[#142142]" />
                <span>Cidade Atendida</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Passe o mouse ou clique no estado para filtrar</span>
              <span className="font-mono text-slate-400">Zoom: {Math.round(zoomLevel * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Regional Breakdown & Ranking Leaderboard */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Card 1: Regional Share Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[#fab518]" />
                <h4 className="text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider">
                  Distribuição por Região
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                100% Mapeado
              </span>
            </div>

            <div className="space-y-2.5">
              {regionalStats.totalClientsCount === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum cliente cadastrado ainda</p>
                </div>
              ) : (
                [
                  { name: 'Sudeste', color: 'bg-amber-500' },
                  { name: 'Sul', color: 'bg-blue-500' },
                  { name: 'Nordeste', color: 'bg-emerald-500' },
                  { name: 'Centro-Oeste', color: 'bg-purple-500' },
                  { name: 'Norte', color: 'bg-orange-500' },
                  { name: 'Internacional', color: 'bg-indigo-500' },
                ].map((item) => {
                  const data = regionalStats.regions[item.name];
                  if (!data || data.clients === 0) return null;
                  const percent = Math.round((data.clients / (regionalStats.totalClientsCount || 1)) * 100);

                  return (
                    <div 
                      key={item.name}
                      onClick={() => {
                        setSelectedRegionFilter(selectedRegionFilter === item.name ? 'todas' : item.name);
                        setSelectedState(null);
                      }}
                      className={`p-2 rounded-xl transition-all cursor-pointer border ${
                        selectedRegionFilter === item.name
                          ? 'bg-white dark:bg-slate-800 border-amber-500/40 shadow-xs'
                          : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#142142] dark:text-slate-200 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span>{item.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#142142] dark:text-white">{data.clients} cli.</span>
                          <span className="text-[11px] font-bold text-slate-400">({percent}%)</span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Top Cities Leaderboard */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#fab518]" />
                <h4 className="text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider">
                  Principais Polos (MRR)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Top {Math.min(5, clusters.length)}
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
              {clusters.length === 0 ? (
                <div className="py-6 px-3 text-center rounded-xl bg-white/70 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700/80">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhuma praça registrada ainda</p>
                  <p className="text-[11px] text-slate-400 mt-1">Ao cadastrar clientes com endereço e cidade, o ranking de faturamento por praça aparecerá aqui.</p>
                </div>
              ) : (
                clusters.slice(0, 6).map((c, idx) => {
                  const isSelected = selectedCluster?.key === c.key;

                  return (
                    <div
                      key={c.key}
                      onClick={() => setSelectedCluster(isSelected ? null : c)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] border-transparent shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">
                            {c.cityName}{c.stateName ? ` (${c.stateName})` : ''}
                          </p>
                          <p className="text-[10px] opacity-70 truncate">
                            {c.clients.length} {c.clients.length === 1 ? 'cliente' : 'clientes'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black">
                          R$ {c.totalMRR.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[9.5px] opacity-60">/mês</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Helper */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center">
              Clique em uma praça ou estado para destacar seus clientes no mapa.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom City & States Chips Quick Bar */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Navigation size={13} className="text-[#fab518]" />
            <span>Estados Ativos:</span>
          </span>

          {activeStatesList.length === 0 ? (
            <span className="text-xs text-slate-400">Nenhum estado registrado ainda</span>
          ) : (
            activeStatesList.map((uf) => {
            const data = activeStatesMap.get(uf);
            const isSelected = selectedState === uf;
            return (
              <button
                key={`chip-state-${uf}`}
                type="button"
                onClick={() => setSelectedState(isSelected ? null : uf)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-xs'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#fab518]" />
                <span>{data?.stateName || uf} ({uf})</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/15 font-black">
                  {data?.count}
                </span>
              </button>
            );
          })
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fab518] shadow-xs" />
            <span>Estado com Clientes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>MRR Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
