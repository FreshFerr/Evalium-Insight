/**
 * M&A Attractiveness Scoring
 * Calculates how attractive a company is for M&A operations
 */

import { FinancialStatement } from '@prisma/client';
import { MA_CONFIG } from '@/config/constants';
import { extractKPIs, calculateGrowthRate } from './kpi';

export interface MAScoreResult {
  score: number; // 0-100
  isEligible: boolean;
  factors: MAFactor[];
  highlights: string[];
  summary: string;
}

export interface MAFactor {
  name: string;
  score: number; // 0-100
  weight: number;
  status: 'positive' | 'neutral' | 'negative';
  description: string;
}

/**
 * Calculate M&A attractiveness score
 */
export function calculateMAScore(statements: FinancialStatement[]): MAScoreResult {
  if (statements.length === 0) {
    return {
      score: 0,
      isEligible: false,
      factors: [],
      highlights: [],
      summary: 'Dati finanziari insufficienti per la valutazione.',
    };
  }

  // Sort by year descending
  const sorted = [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear);
  const latest = extractKPIs(sorted[0]);
  const previous = sorted[1] ? extractKPIs(sorted[1]) : null;

  const factors: MAFactor[] = [];

  // Factor 1: Revenue Size (weight: 30%)
  const revenueFactor = calculateRevenueFactor(latest.revenue);
  factors.push(revenueFactor);

  // Factor 2: EBITDA Level (weight: 25%)
  const ebitdaFactor = calculateEbitdaFactor(latest.ebitda, latest.ebitdaMargin);
  factors.push(ebitdaFactor);

  // Factor 3: Growth (weight: 20%)
  const growthRate = previous
    ? calculateGrowthRate(latest.revenue, previous.revenue)
    : latest.revenueGrowth;
  const growthFactor = calculateGrowthFactor(growthRate);
  factors.push(growthFactor);

  // Factor 4: Profitability (weight: 15%)
  const profitabilityFactor = calculateProfitabilityFactor(latest.netIncome, latest.revenue);
  factors.push(profitabilityFactor);

  // Factor 5: Financial Health (weight: 10%)
  const healthFactor = calculateFinancialHealthFactor(
    latest.debtToEquityRatio,
    latest.equity
  );
  factors.push(healthFactor);

  // Calculate weighted score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0) / totalWeight;
  const score = Math.round(weightedScore);

  // Determine eligibility
  const meetsRevenueThreshold = latest.revenue >= MA_CONFIG.REVENUE_THRESHOLD;
  const meetsEbitdaMarginThreshold = latest.ebitdaMargin >= MA_CONFIG.EBITDA_MARGIN_THRESHOLD;
  const meetsEbitdaThreshold = latest.ebitda >= MA_CONFIG.EBITDA_THRESHOLD;
  const isEligible = score >= MA_CONFIG.SCORE_THRESHOLD &&
    (meetsRevenueThreshold || (meetsEbitdaMarginThreshold && meetsEbitdaThreshold));

  // Generate highlights
  const highlights: string[] = [];
  if (meetsRevenueThreshold) {
    highlights.push('Ricavi superiori a €2M');
  }
  if (latest.ebitdaMargin > 0.15) {
    highlights.push('Margine EBITDA sopra la media');
  }
  if (growthRate && growthRate > 0.10) {
    highlights.push('Crescita a doppia cifra');
  }
  if (latest.debtToEquityRatio !== null && latest.debtToEquityRatio < 0.5) {
    highlights.push('Basso indebitamento');
  }
  if (latest.netIncome > 0 && latest.netIncome / latest.revenue > 0.05) {
    highlights.push('Buona redditività netta');
  }

  // Generate summary
  const summary = generateMASummary(score, isEligible, factors);

  return {
    score,
    isEligible,
    factors,
    highlights,
    summary,
  };
}

function calculateRevenueFactor(revenue: number): MAFactor {
  let score: number;
  let status: MAFactor['status'];
  let description: string;

  if (revenue >= 5_000_000) {
    score = 100;
    status = 'positive';
    description = 'Dimensione significativa per il mercato M&A';
  } else if (revenue >= 2_000_000) {
    score = 80;
    status = 'positive';
    description = 'Buona dimensione per operazioni straordinarie';
  } else if (revenue >= 1_000_000) {
    score = 50;
    status = 'neutral';
    description = 'Dimensione nella media per piccole operazioni';
  } else {
    score = 20;
    status = 'negative';
    description = 'Dimensione ridotta per il mercato M&A';
  }

  return {
    name: 'Dimensione (Ricavi)',
    score,
    weight: 30,
    status,
    description,
  };
}

function calculateEbitdaFactor(ebitda: number, ebitdaMargin: number): MAFactor {
  let score: number;
  let status: MAFactor['status'];
  let description: string;

  const marginPercent = ebitdaMargin * 100;

  if (ebitda >= 500_000 && ebitdaMargin >= 0.15) {
    score = 100;
    status = 'positive';
    description = 'Eccellente redditività operativa';
  } else if (ebitda >= 200_000 && ebitdaMargin >= 0.10) {
    score = 75;
    status = 'positive';
    description = 'Buona generazione di cassa';
  } else if (ebitda > 0 && ebitdaMargin >= 0.05) {
    score = 50;
    status = 'neutral';
    description = 'Marginalità nella media';
  } else if (ebitda > 0) {
    score = 25;
    status = 'negative';
    description = 'Margini operativi ridotti';
  } else {
    score = 0;
    status = 'negative';
    description = 'EBITDA negativo';
  }

  return {
    name: 'Redditività (EBITDA)',
    score,
    weight: 25,
    status,
    description,
  };
}

function calculateGrowthFactor(growthRate: number | null): MAFactor {
  let score: number;
  let status: MAFactor['status'];
  let description: string;

  if (growthRate === null) {
    return {
      name: 'Crescita',
      score: 50,
      weight: 20,
      status: 'neutral',
      description: 'Dati storici insufficienti',
    };
  }

  const growthPercent = growthRate * 100;

  if (growthRate >= 0.20) {
    score = 100;
    status = 'positive';
    description = 'Crescita eccezionale';
  } else if (growthRate >= 0.10) {
    score = 85;
    status = 'positive';
    description = 'Crescita a doppia cifra';
  } else if (growthRate >= 0.05) {
    score = 65;
    status = 'neutral';
    description = 'Crescita moderata';
  } else if (growthRate >= 0) {
    score = 40;
    status = 'neutral';
    description = 'Crescita piatta';
  } else {
    score = 15;
    status = 'negative';
    description = 'Ricavi in calo';
  }

  return {
    name: 'Crescita',
    score,
    weight: 20,
    status,
    description,
  };
}

function calculateProfitabilityFactor(netIncome: number, revenue: number): MAFactor {
  const netMargin = revenue > 0 ? netIncome / revenue : 0;
  let score: number;
  let status: MAFactor['status'];
  let description: string;

  if (netMargin >= 0.10) {
    score = 100;
    status = 'positive';
    description = 'Eccellente utile netto';
  } else if (netMargin >= 0.05) {
    score = 75;
    status = 'positive';
    description = 'Buona redditività finale';
  } else if (netMargin > 0) {
    score = 50;
    status = 'neutral';
    description = 'Utile positivo ma contenuto';
  } else {
    score = 10;
    status = 'negative';
    description = 'Azienda in perdita';
  }

  return {
    name: 'Utile Netto',
    score,
    weight: 15,
    status,
    description,
  };
}

function calculateFinancialHealthFactor(
  debtToEquityRatio: number | null,
  equity: number
): MAFactor {
  let score: number;
  let status: MAFactor['status'];
  let description: string;

  if (equity <= 0) {
    return {
      name: 'Solidità Patrimoniale',
      score: 0,
      weight: 10,
      status: 'negative',
      description: 'Patrimonio netto negativo',
    };
  }

  if (debtToEquityRatio === null) {
    return {
      name: 'Solidità Patrimoniale',
      score: 50,
      weight: 10,
      status: 'neutral',
      description: 'Dati insufficienti',
    };
  }

  if (debtToEquityRatio <= 0.3) {
    score = 100;
    status = 'positive';
    description = 'Struttura finanziaria molto solida';
  } else if (debtToEquityRatio <= 0.6) {
    score = 75;
    status = 'positive';
    description = 'Buon equilibrio finanziario';
  } else if (debtToEquityRatio <= 1.0) {
    score = 50;
    status = 'neutral';
    description = 'Indebitamento nella norma';
  } else {
    score = 25;
    status = 'negative';
    description = 'Elevato indebitamento';
  }

  return {
    name: 'Solidità Patrimoniale',
    score,
    weight: 10,
    status,
    description,
  };
}

function generateMASummary(score: number, isEligible: boolean, factors: MAFactor[]): string {
  if (score >= 80) {
    return 'Azienda con profilo molto interessante per operazioni straordinarie. Dimensione, redditività e crescita sono tutti fattori attrattivi.';
  } else if (score >= 60 && isEligible) {
    return 'Azienda con buon potenziale per M&A. Presenta alcuni punti di forza che potrebbero interessare investitori o acquirenti.';
  } else if (score >= 40) {
    return 'Azienda con alcuni elementi interessanti ma con margini di miglioramento prima di considerare operazioni straordinarie.';
  } else {
    return 'Al momento il profilo aziendale non è ottimale per operazioni M&A. Consigliamo di concentrarsi sulla crescita e sul miglioramento dei margini.';
  }
}

