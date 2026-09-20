// Cartographic World Map Vector Data (Equirectangular Projection 1000x500)
// High-fidelity geographic outlines for global client mapping

export interface WorldCountryPath {
  id: string; // ISO 2/3 or unique key (BR, US, PT, ES, UK, FR, IT, DE, AR, etc.)
  name: string;
  region: 'América do Sul' | 'América do Norte' | 'Europa' | 'África' | 'Ásia' | 'Oceania' | 'Oriente Médio';
  d: string;
  isFocusable?: boolean;
}

export interface WorldContinentPath {
  id: string;
  name: string;
  d: string;
}

// Convert geographic latitude (-90 to +90) and longitude (-180 to +180) to SVG canvas coordinates (1000 x 500)
export function geoToWorldSvg(lat: number, lng: number): { x: number; y: number } {
  // Clamped bounds
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));

  // Equirectangular mapping to 1000x500 canvas
  const x = 500 + (clampedLng / 180) * 480;
  const y = 250 - (clampedLat / 90) * 235;

  return {
    x: Math.max(12, Math.min(988, +x.toFixed(2))),
    y: Math.max(12, Math.min(488, +y.toFixed(2))),
  };
}

// Major countries and territorial outlines
export const WORLD_COUNTRIES: WorldCountryPath[] = [
  // 1. BRASIL (Highlight territory with precise borders)
  {
    id: 'BR',
    name: 'Brasil',
    region: 'América do Sul',
    isFocusable: true,
    d: `M 310,240 
        C 325,236 345,238 360,242 
        C 375,246 395,250 408,260 
        C 420,270 425,282 422,295 
        C 418,308 405,320 395,335 
        C 385,350 372,370 358,382 
        C 350,388 340,385 334,375 
        C 328,365 320,350 312,342 
        C 305,335 295,328 290,320 
        C 285,310 280,295 285,285 
        C 290,275 298,265 302,255 
        Z`
  },

  // 2. PORTUGAL (Key territory for European/international clients)
  {
    id: 'PT',
    name: 'Portugal',
    region: 'Europa',
    isFocusable: true,
    d: `M 474,142 
        C 476,140 478,141 479,144 
        C 480,147 479,153 478,157 
        C 477,160 474,161 473,158 
        C 472,154 472,148 473,144 
        Z`
  },

  // 3. ESPANHA
  {
    id: 'ES',
    name: 'Espanha',
    region: 'Europa',
    isFocusable: true,
    d: `M 479,144 
        C 485,138 495,138 500,142 
        C 505,145 502,152 498,158 
        C 494,162 485,164 478,160 
        C 478,155 480,148 479,144 
        Z`
  },

  // 4. ESTADOS UNIDOS (Mainland, Alaska, Florida)
  {
    id: 'US',
    name: 'Estados Unidos',
    region: 'América do Norte',
    isFocusable: true,
    d: `M 175,135 
        C 200,132 230,132 265,135 
        C 285,138 305,142 320,150 
        C 325,160 318,175 305,185 
        C 298,192 292,205 288,212 
        C 285,210 282,198 275,195 
        C 260,195 245,200 230,198 
        C 210,195 190,192 180,182 
        C 172,170 170,150 175,135 
        Z
        M 105,75 
        C 120,68 140,70 155,80 
        C 150,92 135,100 120,98 
        C 105,95 95,85 105,75 
        Z`
  },

  // 5. CANADÁ
  {
    id: 'CA',
    name: 'Canadá',
    region: 'América do Norte',
    isFocusable: true,
    d: `M 160,78 
        C 195,60 250,55 295,65 
        C 325,72 345,85 360,105 
        C 350,120 330,132 315,138 
        C 280,134 220,132 175,135 
        C 165,120 158,98 160,78 
        Z`
  },

  // 6. MÉXICO E AMÉRICA CENTRAL
  {
    id: 'MX',
    name: 'México & América Central',
    region: 'América do Norte',
    isFocusable: true,
    d: `M 225,198 
        C 240,200 255,202 268,210 
        C 265,225 258,235 250,245 
        C 245,248 240,242 235,232 
        C 228,220 220,208 225,198 
        Z
        M 250,245 
        C 258,252 268,260 278,268 
        C 272,272 262,268 255,260 
        C 250,255 248,248 250,245 
        Z`
  },

  // 7. AMÉRICA DO SUL (Exceto Brasil)
  {
    id: 'SA_REST',
    name: 'América do Sul (Vizinhos)',
    region: 'América do Sul',
    isFocusable: true,
    d: `M 285,240 
        C 295,235 308,238 310,240 
        C 305,255 295,270 290,285 
        C 285,305 288,335 292,355 
        C 298,375 308,400 312,425 
        C 308,435 298,435 294,420 
        C 288,390 282,350 280,310 
        C 278,280 275,255 285,240 
        Z
        M 312,425 
        C 325,415 342,400 358,382 
        C 350,388 340,385 334,375 
        C 328,365 320,350 312,342 
        C 308,365 305,395 312,425 
        Z`
  },

  // 8. REINO UNIDO E IRLANDA
  {
    id: 'UK',
    name: 'Reino Unido & Irlanda',
    region: 'Europa',
    isFocusable: true,
    d: `M 495,115 
        C 502,110 506,118 504,128 
        C 500,135 494,136 492,128 
        C 490,122 492,118 495,115 
        Z
        M 486,122 
        C 490,120 491,126 489,132 
        C 486,134 484,130 484,125 
        Z`
  },

  // 9. FRANÇA, ITÁLIA, ALEMANHA E EUROPA CENTRAL
  {
    id: 'EU_CENTRAL',
    name: 'Europa Central (França, Itália, Alemanha)',
    region: 'Europa',
    isFocusable: true,
    d: `M 500,135 
        C 515,128 535,128 548,132 
        C 555,140 550,152 542,160 
        C 538,168 540,175 536,182 
        C 530,180 528,172 530,165 
        C 525,160 515,160 508,165 
        C 500,162 498,150 500,135 
        Z`
  },

  // 10. ESCANDINÁVIA (Noruega, Suécia, Finlândia)
  {
    id: 'NORDIC',
    name: 'Escandinávia',
    region: 'Europa',
    isFocusable: true,
    d: `M 525,80 
        C 540,75 555,82 562,95 
        C 558,110 545,122 535,125 
        C 528,115 522,95 525,80 
        Z`
  },

  // 11. EUROPA ORIENTAL E RÚSSIA
  {
    id: 'RU',
    name: 'Rússia & Leste Europeu',
    region: 'Europa',
    isFocusable: true,
    d: `M 550,85 
        C 620,70 720,70 820,80 
        C 880,88 930,105 960,118 
        C 940,135 880,140 820,138 
        C 750,136 680,140 620,142 
        C 570,140 555,120 550,85 
        Z`
  },

  // 12. ÁFRICA
  {
    id: 'AF',
    name: 'África',
    region: 'África',
    isFocusable: true,
    d: `M 470,185 
        C 510,180 560,185 580,205 
        C 595,225 585,255 575,280 
        C 565,310 555,345 540,370 
        C 530,385 515,380 505,355 
        C 490,320 480,275 465,245 
        C 455,225 458,200 470,185 
        Z
        M 585,335 
        C 592,330 598,340 595,360 
        C 590,370 585,365 585,345 
        Z`
  },

  // 13. ORIENTE MÉDIO
  {
    id: 'ME',
    name: 'Oriente Médio & Emirados',
    region: 'Oriente Médio',
    isFocusable: true,
    d: `M 585,200 
        C 610,195 635,200 648,215 
        C 645,235 635,250 620,255 
        C 605,250 595,235 590,220 
        Z`
  },

  // 14. ÍNDIA E ÁSIA MERIDIONAL
  {
    id: 'IN',
    name: 'Índia & Sul da Ásia',
    region: 'Ásia',
    isFocusable: true,
    d: `M 680,205 
        C 710,200 735,208 740,225 
        C 735,250 720,280 705,295 
        C 695,280 685,250 675,230 
        Z`
  },

  // 15. CHINA E LESTE ASIÁTICO
  {
    id: 'CN',
    name: 'China & Leste Asiático',
    region: 'Ásia',
    isFocusable: true,
    d: `M 725,150 
        C 770,140 820,145 845,165 
        C 835,190 820,215 795,230 
        C 760,225 735,200 725,180 
        Z`
  },

  // 16. JAPÃO
  {
    id: 'JP',
    name: 'Japão',
    region: 'Ásia',
    isFocusable: true,
    d: `M 870,155 
        C 880,150 885,160 880,175 
        C 872,185 865,180 868,168 
        Z`
  },

  // 17. SUDESTE ASIÁTICO E INDONÉSIA
  {
    id: 'SEA',
    name: 'Sudeste Asiático & Indonésia',
    region: 'Ásia',
    isFocusable: true,
    d: `M 765,235 
        C 785,230 805,240 800,260 
        C 790,270 775,265 765,250 
        Z
        M 780,285 
        C 820,285 860,295 875,305 
        C 855,315 810,310 780,300 
        Z`
  },

  // 18. AUSTRÁLIA E NOVA ZELÂNDIA
  {
    id: 'AU',
    name: 'Austrália & Oceania',
    region: 'Oceania',
    isFocusable: true,
    d: `M 810,335 
        C 855,325 905,335 918,365 
        C 915,395 885,420 840,415 
        C 815,405 800,375 805,350 
        Z
        M 945,395 
        C 955,390 962,405 955,425 
        C 948,425 942,410 945,395 
        Z`
  },

  // 19. GROELÂNDIA
  {
    id: 'GL',
    name: 'Groelândia',
    region: 'América do Norte',
    isFocusable: false,
    d: `M 380,50 
        C 410,45 440,55 445,75 
        C 435,95 405,105 385,95 
        C 375,85 375,65 380,50 
        Z`
  },
];

// Major international hubs and cities coordinates
export interface GlobalCityDef {
  name: string;
  country: string;
  countryCode: string;
  region: 'Internacional';
  lat: number;
  lng: number;
}

export const GLOBAL_CITIES: Record<string, GlobalCityDef> = {
  // Portugal
  'lisboa': { name: 'Lisboa', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 38.7223, lng: -9.1393 },
  'porto': { name: 'Porto', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 41.1579, lng: -8.6291 },
  'braga': { name: 'Braga', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 41.5454, lng: -8.4265 },
  'coimbra': { name: 'Coimbra', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 40.2033, lng: -8.4103 },
  'faro': { name: 'Faro', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 37.0194, lng: -7.9322 },
  'cascais': { name: 'Cascais', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 38.6979, lng: -9.4215 },
  'sintra': { name: 'Sintra', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 38.8029, lng: -9.3817 },
  'aveiro': { name: 'Aveiro', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 40.6405, lng: -8.6538 },
  'setubal': { name: 'Setúbal', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 38.5244, lng: -8.8882 },
  'funchal': { name: 'Funchal', country: 'Portugal', countryCode: 'PT', region: 'Internacional', lat: 32.6669, lng: -16.9241 },

  // Estados Unidos
  'miami': { name: 'Miami', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 25.7617, lng: -80.1918 },
  'orlando': { name: 'Orlando', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 28.5383, lng: -81.3792 },
  'tampa': { name: 'Tampa', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 27.9506, lng: -82.4572 },
  'fort lauderdale': { name: 'Fort Lauderdale', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 26.1224, lng: -80.1373 },
  'new york': { name: 'Nova York', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 40.7128, lng: -74.0060 },
  'nova york': { name: 'Nova York', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 40.7128, lng: -74.0060 },
  'boston': { name: 'Boston', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 42.3601, lng: -71.0589 },
  'los angeles': { name: 'Los Angeles', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 34.0522, lng: -118.2437 },
  'san francisco': { name: 'San Francisco', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 37.7749, lng: -122.4194 },
  'san diego': { name: 'San Diego', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 32.7157, lng: -117.1611 },
  'chicago': { name: 'Chicago', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 41.8781, lng: -87.6298 },
  'houston': { name: 'Houston', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 29.7604, lng: -95.3698 },
  'dallas': { name: 'Dallas', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 32.7767, lng: -96.7970 },
  'austin': { name: 'Austin', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 30.2672, lng: -97.7431 },
  'atlanta': { name: 'Atlanta', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 33.7490, lng: -84.3880 },
  'washington': { name: 'Washington, D.C.', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 38.9072, lng: -77.0369 },
  'las vegas': { name: 'Las Vegas', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 36.1699, lng: -115.1398 },
  'seattle': { name: 'Seattle', country: 'Estados Unidos', countryCode: 'US', region: 'Internacional', lat: 47.6062, lng: -122.3321 },

  // Europa
  'madri': { name: 'Madri', country: 'Espanha', countryCode: 'ES', region: 'Internacional', lat: 40.4168, lng: -3.7038 },
  'madrid': { name: 'Madrid', country: 'Espanha', countryCode: 'ES', region: 'Internacional', lat: 40.4168, lng: -3.7038 },
  'barcelona': { name: 'Barcelona', country: 'Espanha', countryCode: 'ES', region: 'Internacional', lat: 41.3879, lng: 2.1699 },
  'valencia': { name: 'Valência', country: 'Espanha', countryCode: 'ES', region: 'Internacional', lat: 39.4699, lng: -0.3763 },
  'londres': { name: 'Londres', country: 'Reino Unido', countryCode: 'GB', region: 'Internacional', lat: 51.5074, lng: -0.1278 },
  'london': { name: 'Londres', country: 'Reino Unido', countryCode: 'GB', region: 'Internacional', lat: 51.5074, lng: -0.1278 },
  'manchester': { name: 'Manchester', country: 'Reino Unido', countryCode: 'GB', region: 'Internacional', lat: 53.4808, lng: -2.2426 },
  'dublin': { name: 'Dublin', country: 'Irlanda', countryCode: 'IE', region: 'Internacional', lat: 53.3498, lng: -6.2603 },
  'paris': { name: 'Paris', country: 'França', countryCode: 'FR', region: 'Internacional', lat: 48.8566, lng: 2.3522 },
  'lyon': { name: 'Lyon', country: 'França', countryCode: 'FR', region: 'Internacional', lat: 45.7640, lng: 4.8357 },
  'roma': { name: 'Roma', country: 'Itália', countryCode: 'IT', region: 'Internacional', lat: 41.9028, lng: 12.4964 },
  'milao': { name: 'Milão', country: 'Itália', countryCode: 'IT', region: 'Internacional', lat: 45.4642, lng: 9.1900 },
  'milan': { name: 'Milão', country: 'Itália', countryCode: 'IT', region: 'Internacional', lat: 45.4642, lng: 9.1900 },
  'berlim': { name: 'Berlim', country: 'Alemanha', countryCode: 'DE', region: 'Internacional', lat: 52.5200, lng: 13.4050 },
  'munique': { name: 'Munique', country: 'Alemanha', countryCode: 'DE', region: 'Internacional', lat: 48.1351, lng: 11.5820 },
  'frankfurt': { name: 'Frankfurt', country: 'Alemanha', countryCode: 'DE', region: 'Internacional', lat: 50.1109, lng: 8.6821 },
  'amsterda': { name: 'Amsterdã', country: 'Holanda', countryCode: 'NL', region: 'Internacional', lat: 52.3676, lng: 4.9041 },
  'amsterdam': { name: 'Amsterdã', country: 'Holanda', countryCode: 'NL', region: 'Internacional', lat: 52.3676, lng: 4.9041 },
  'zurique': { name: 'Zurique', country: 'Suíça', countryCode: 'CH', region: 'Internacional', lat: 47.3769, lng: 8.5417 },
  'genebra': { name: 'Genebra', country: 'Suíça', countryCode: 'CH', region: 'Internacional', lat: 46.2044, lng: 6.1432 },

  // América Latina
  'buenos aires': { name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', region: 'Internacional', lat: -34.6037, lng: -58.3816 },
  'cordoba': { name: 'Córdoba', country: 'Argentina', countryCode: 'AR', region: 'Internacional', lat: -31.4201, lng: -64.1888 },
  'mendoza': { name: 'Mendoza', country: 'Argentina', countryCode: 'AR', region: 'Internacional', lat: -32.8895, lng: -68.8458 },
  'santiago': { name: 'Santiago', country: 'Chile', countryCode: 'CL', region: 'Internacional', lat: -33.4489, lng: -70.6693 },
  'montevideu': { name: 'Montevidéu', country: 'Uruguai', countryCode: 'UY', region: 'Internacional', lat: -34.9011, lng: -56.1645 },
  'montevideo': { name: 'Montevidéu', country: 'Uruguai', countryCode: 'UY', region: 'Internacional', lat: -34.9011, lng: -56.1645 },
  'punta del este': { name: 'Punta del Este', country: 'Uruguai', countryCode: 'UY', region: 'Internacional', lat: -34.9644, lng: -54.9439 },
  'assuncao': { name: 'Assunção', country: 'Paraguai', countryCode: 'PY', region: 'Internacional', lat: -25.2637, lng: -57.5759 },
  'asuncion': { name: 'Assunção', country: 'Paraguai', countryCode: 'PY', region: 'Internacional', lat: -25.2637, lng: -57.5759 },
  'ciudad del este': { name: 'Ciudad del Este', country: 'Paraguai', countryCode: 'PY', region: 'Internacional', lat: -25.5097, lng: -54.6111 },
  'bogota': { name: 'Bogotá', country: 'Colômbia', countryCode: 'CO', region: 'Internacional', lat: 4.7110, lng: -74.0721 },
  'medellin': { name: 'Medellín', country: 'Colômbia', countryCode: 'CO', region: 'Internacional', lat: 6.2442, lng: -75.5812 },
  'lima': { name: 'Lima', country: 'Peru', countryCode: 'PE', region: 'Internacional', lat: -12.0464, lng: -77.0428 },
  'cidade do mexico': { name: 'Cidade do México', country: 'México', countryCode: 'MX', region: 'Internacional', lat: 19.4326, lng: -99.1332 },
  'mexico city': { name: 'Cidade do México', country: 'México', countryCode: 'MX', region: 'Internacional', lat: 19.4326, lng: -99.1332 },
  'cancun': { name: 'Cancún', country: 'México', countryCode: 'MX', region: 'Internacional', lat: 21.1619, lng: -86.8515 },

  // Canadá, Ásia, Oceania, Oriente Médio
  'toronto': { name: 'Toronto', country: 'Canadá', countryCode: 'CA', region: 'Internacional', lat: 43.6532, lng: -79.3832 },
  'vancouver': { name: 'Vancouver', country: 'Canadá', countryCode: 'CA', region: 'Internacional', lat: 49.2827, lng: -123.1207 },
  'montreal': { name: 'Montreal', country: 'Canadá', countryCode: 'CA', region: 'Internacional', lat: 45.5017, lng: -73.5673 },
  'dubai': { name: 'Dubai', country: 'Emirados Árabes Unidos', countryCode: 'AE', region: 'Internacional', lat: 25.2048, lng: 55.2708 },
  'abu dhabi': { name: 'Abu Dhabi', country: 'Emirados Árabes Unidos', countryCode: 'AE', region: 'Internacional', lat: 24.4539, lng: 54.3773 },
  'toquio': { name: 'Tóquio', country: 'Japão', countryCode: 'JP', region: 'Internacional', lat: 35.6762, lng: 139.6503 },
  'tokyo': { name: 'Tóquio', country: 'Japão', countryCode: 'JP', region: 'Internacional', lat: 35.6762, lng: 139.6503 },
  'sydney': { name: 'Sydney', country: 'Austrália', countryCode: 'AU', region: 'Internacional', lat: -33.8688, lng: 151.2093 },
  'melbourne': { name: 'Melbourne', country: 'Austrália', countryCode: 'AU', region: 'Internacional', lat: -37.8136, lng: 144.9631 },
};

// Fallback coordinates by Country if specific city is not found
export const GLOBAL_COUNTRIES_FALLBACK: Record<string, { lat: number; lng: number; defaultCity: string; country: string }> = {
  'portugal': { lat: 38.7223, lng: -9.1393, defaultCity: 'Lisboa', country: 'Portugal' },
  'pt': { lat: 38.7223, lng: -9.1393, defaultCity: 'Lisboa', country: 'Portugal' },
  'estados unidos': { lat: 25.7617, lng: -80.1918, defaultCity: 'Miami', country: 'Estados Unidos' },
  'eua': { lat: 25.7617, lng: -80.1918, defaultCity: 'Miami', country: 'Estados Unidos' },
  'usa': { lat: 25.7617, lng: -80.1918, defaultCity: 'Miami', country: 'Estados Unidos' },
  'us': { lat: 25.7617, lng: -80.1918, defaultCity: 'Miami', country: 'Estados Unidos' },
  'espanha': { lat: 40.4168, lng: -3.7038, defaultCity: 'Madri', country: 'Espanha' },
  'spain': { lat: 40.4168, lng: -3.7038, defaultCity: 'Madri', country: 'Espanha' },
  'reino unido': { lat: 51.5074, lng: -0.1278, defaultCity: 'Londres', country: 'Reino Unido' },
  'uk': { lat: 51.5074, lng: -0.1278, defaultCity: 'Londres', country: 'Reino Unido' },
  'england': { lat: 51.5074, lng: -0.1278, defaultCity: 'Londres', country: 'Reino Unido' },
  'inglaterra': { lat: 51.5074, lng: -0.1278, defaultCity: 'Londres', country: 'Reino Unido' },
  'franca': { lat: 48.8566, lng: 2.3522, defaultCity: 'Paris', country: 'França' },
  'france': { lat: 48.8566, lng: 2.3522, defaultCity: 'Paris', country: 'França' },
  'italia': { lat: 41.9028, lng: 12.4964, defaultCity: 'Roma', country: 'Itália' },
  'italy': { lat: 41.9028, lng: 12.4964, defaultCity: 'Roma', country: 'Itália' },
  'alemanha': { lat: 52.5200, lng: 13.4050, defaultCity: 'Berlim', country: 'Alemanha' },
  'germany': { lat: 52.5200, lng: 13.4050, defaultCity: 'Berlim', country: 'Alemanha' },
  'argentina': { lat: -34.6037, lng: -58.3816, defaultCity: 'Buenos Aires', country: 'Argentina' },
  'chile': { lat: -33.4489, lng: -70.6693, defaultCity: 'Santiago', country: 'Chile' },
  'uruguai': { lat: -34.9011, lng: -56.1645, defaultCity: 'Montevidéu', country: 'Uruguai' },
  'uruguay': { lat: -34.9011, lng: -56.1645, defaultCity: 'Montevidéu', country: 'Uruguai' },
  'paraguai': { lat: -25.2637, lng: -57.5759, defaultCity: 'Assunção', country: 'Paraguai' },
  'paraguay': { lat: -25.2637, lng: -57.5759, defaultCity: 'Assunção', country: 'Paraguai' },
  'colombia': { lat: 4.7110, lng: -74.0721, defaultCity: 'Bogotá', country: 'Colômbia' },
  'peru': { lat: -12.0464, lng: -77.0428, defaultCity: 'Lima', country: 'Peru' },
  'mexico': { lat: 19.4326, lng: -99.1332, defaultCity: 'Cidade do México', country: 'México' },
  'canada': { lat: 43.6532, lng: -79.3832, defaultCity: 'Toronto', country: 'Canadá' },
  'emirados arabes': { lat: 25.2048, lng: 55.2708, defaultCity: 'Dubai', country: 'Emirados Árabes Unidos' },
  'dubai': { lat: 25.2048, lng: 55.2708, defaultCity: 'Dubai', country: 'Emirados Árabes Unidos' },
  'japao': { lat: 35.6762, lng: 139.6503, defaultCity: 'Tóquio', country: 'Japão' },
  'japan': { lat: 35.6762, lng: 139.6503, defaultCity: 'Tóquio', country: 'Japão' },
  'australia': { lat: -33.8688, lng: 151.2093, defaultCity: 'Sydney', country: 'Austrália' },
  'suica': { lat: 47.3769, lng: 8.5417, defaultCity: 'Zurique', country: 'Suíça' },
  'irlanda': { lat: 53.3498, lng: -6.2603, defaultCity: 'Dublin', country: 'Irlanda' },
  'holanda': { lat: 52.3676, lng: 4.9041, defaultCity: 'Amsterdã', country: 'Holanda' },
};
