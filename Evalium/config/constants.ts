/**
 * Application-wide constants and configuration
 */

// ===========================================
// M&A Thresholds
// ===========================================
export const MA_CONFIG = {
  /** Minimum revenue in EUR to be considered for M&A */
  REVENUE_THRESHOLD: Number(process.env.MA_REVENUE_THRESHOLD) || 2_000_000,
  
  /** Minimum EBITDA margin (as decimal) */
  EBITDA_MARGIN_THRESHOLD: Number(process.env.MA_EBITDA_MARGIN_THRESHOLD) || 0.10,
  
  /** Minimum EBITDA in EUR */
  EBITDA_THRESHOLD: Number(process.env.MA_EBITDA_THRESHOLD) || 200_000,
  
  /** Minimum revenue growth rate (YoY) to be attractive */
  GROWTH_THRESHOLD: 0.05,
  
  /** Score threshold to show M&A banner (0-100) */
  SCORE_THRESHOLD: 60,
} as const;

// ===========================================
// Financial Analysis
// ===========================================
export const FINANCIAL_CONFIG = {
  /** Default number of years to fetch for analysis */
  DEFAULT_YEARS_BACK: 3,
  
  /** Maximum number of years to support */
  MAX_YEARS_BACK: 5,
  
  /** Industry average EBITDA margin for benchmarking */
  INDUSTRY_AVG_EBITDA_MARGIN: 0.12,
  
  /** Healthy debt ratio threshold */
  HEALTHY_DEBT_RATIO: 0.5,
  
  /** Good liquidity ratio threshold */
  GOOD_LIQUIDITY_RATIO: 1.5,
} as const;

// ===========================================
// Pricing Plans
// ===========================================
export const PRICING_PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratuito',
    description: 'Analisi di base per iniziare',
    price: 0,
    features: [
      'Analisi semplificata del bilancio',
      'KPI principali con spiegazioni',
      'Identificazione punti di forza e debolezza',
      '1 azienda',
    ],
    limitations: [
      'Nessun benchmark con competitor',
      'Nessun export',
      'Nessuna raccomandazione dettagliata',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'Analisi completa con benchmark',
    price: 49,
    priceId: process.env.STRIPE_PRICE_FULL_ANALYSIS,
    features: [
      'Tutto del piano Gratuito',
      'Analisi dettagliata del bilancio',
      'Benchmark con 3 competitor',
      'Grafici di trend multi-anno',
      'Raccomandazioni data-driven',
      'Export Excel',
    ],
    popular: true,
  },
  PRO_PLUS: {
    id: 'pro_plus',
    name: 'Pro Plus',
    description: 'Analisi premium illimitata',
    price: 99,
    priceId: process.env.STRIPE_PRICE_BENCHMARK_UNLIMITED,
    features: [
      'Tutto del piano Pro',
      'Benchmark con competitor illimitati',
      'Export PowerPoint professionale',
      'Report brandizzati',
      'Supporto prioritario',
      'Analisi settoriale avanzata',
    ],
  },
} as const;

// ===========================================
// Application
// ===========================================
export const APP_CONFIG = {
  name: 'Evalium',
  description: 'Analisi del bilancio aziendale semplificata',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: 'supporto@evalium.it',
  
  /** Rate limit for API calls (requests per minute) */
  RATE_LIMIT: Number(process.env.FINANCIAL_DATA_RATE_LIMIT) || 60,
} as const;

// ===========================================
// Routes
// ===========================================
export const ROUTES = {
  HOME: '/',
  PRICING: '/#pricing',
  FAQ: '/#faq',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  COMPANIES: '/dashboard/companies',
  COMPANY: (id: string) => `/dashboard/companies/${id}`,
  ADMIN: '/dashboard/admin',
  ADMIN_LEADS: '/dashboard/admin/leads',
} as const;

// ===========================================
// KPI Definitions (for tooltips)
// ===========================================
export const KPI_DEFINITIONS = {
  revenue: {
    name: 'Ricavi',
    definition: 'Il totale delle vendite della tua azienda. Sono i soldi che entrano vendendo prodotti o servizi.',
    icon: '💰',
  },
  ebitda: {
    name: 'EBITDA',
    definition: 'Il guadagno operativo prima di interessi, tasse, ammortamenti. Indica quanto la tua azienda guadagna dalle attività principali.',
    icon: '📊',
  },
  ebitdaMargin: {
    name: 'Margine EBITDA',
    definition: 'La percentuale di ricavi che diventa EBITDA. Un margine alto significa che controlli bene i costi.',
    icon: '📈',
  },
  netIncome: {
    name: 'Utile Netto',
    definition: 'Il guadagno finale dopo aver pagato tutto: costi, interessi e tasse. È quello che rimane davvero.',
    icon: '✅',
  },
  equity: {
    name: 'Patrimonio Netto',
    definition: 'Il valore dell\'azienda che appartiene ai soci. È la differenza tra quello che possiedi e quello che devi.',
    icon: '🏛️',
  },
  totalAssets: {
    name: 'Totale Attivo',
    definition: 'Tutto quello che la tua azienda possiede: soldi in banca, crediti, macchinari, immobili.',
    icon: '📦',
  },
  totalLiabilities: {
    name: 'Totale Debiti',
    definition: 'Tutto quello che la tua azienda deve: debiti con banche, fornitori, tasse da pagare.',
    icon: '📋',
  },
  netDebt: {
    name: 'Indebitamento Netto',
    definition: 'I debiti finanziari meno la liquidità disponibile. Se è negativo, hai più soldi che debiti.',
    icon: '💳',
  },
  revenueGrowth: {
    name: 'Crescita Ricavi',
    definition: 'Quanto sono aumentati (o diminuiti) i ricavi rispetto all\'anno precedente.',
    icon: '🚀',
  },
  debtRatio: {
    name: 'Rapporto Debito/Patrimonio',
    definition: 'Quanti debiti hai per ogni euro di patrimonio. Un numero basso indica solidità finanziaria.',
    icon: '⚖️',
  },
} as const;

// ===========================================
// Report Types
// ===========================================
export const REPORT_TYPES = {
  BASIC_ANALYSIS: 'BASIC_ANALYSIS',
  FULL_ANALYSIS: 'FULL_ANALYSIS',
  BENCHMARK: 'BENCHMARK',
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

// ===========================================
// Countries
// ===========================================
export const COUNTRIES = [
  { code: 'IT', name: 'Italia' },
  { code: 'DE', name: 'Germania' },
  { code: 'FR', name: 'Francia' },
  { code: 'ES', name: 'Spagna' },
  { code: 'UK', name: 'Regno Unito' },
  { code: 'US', name: 'Stati Uniti' },
  { code: 'CH', name: 'Svizzera' },
  { code: 'AT', name: 'Austria' },
  { code: 'NL', name: 'Paesi Bassi' },
  { code: 'BE', name: 'Belgio' },
] as const;

// ===========================================
// Industries (for future use)
// ===========================================
export const INDUSTRIES = [
  { code: 'manufacturing', name: 'Manifatturiero' },
  { code: 'retail', name: 'Commercio al dettaglio' },
  { code: 'services', name: 'Servizi' },
  { code: 'technology', name: 'Tecnologia' },
  { code: 'construction', name: 'Edilizia' },
  { code: 'food', name: 'Alimentare' },
  { code: 'automotive', name: 'Automotive' },
  { code: 'healthcare', name: 'Sanità' },
  { code: 'finance', name: 'Finanza' },
  { code: 'other', name: 'Altro' },
] as const;

