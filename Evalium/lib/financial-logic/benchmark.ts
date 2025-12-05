/**
 * Benchmark Comparison Logic
 * Compares a company's financials against competitors
 */

import { FinancialStatement } from '@prisma/client';
import { extractKPIs, KPISet, calculateGrowthRate } from './kpi';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export interface CompetitorData {
  name: string;
  vatNumber?: string;
  kpis: KPISet;
}

export interface BenchmarkResult {
  companyKPIs: KPISet;
  competitors: CompetitorData[];
  comparisons: BenchmarkComparison[];
  summary: BenchmarkSummary;
}

export interface BenchmarkComparison {
  metric: string;
  metricLabel: string;
  companyValue: number;
  competitorAverage: number;
  position: 'above' | 'below' | 'average';
  percentile: number;
  narrative: string;
}

export interface BenchmarkSummary {
  overallPosition: 'leader' | 'competitive' | 'average' | 'lagging';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/**
 * Create benchmark analysis comparing company against competitors
 */
export function createBenchmark(
  companyStatement: FinancialStatement,
  competitorStatements: { name: string; vatNumber?: string; statement: FinancialStatement }[]
): BenchmarkResult {
  const companyKPIs = extractKPIs(companyStatement);
  
  const competitors: CompetitorData[] = competitorStatements.map((c) => ({
    name: c.name,
    vatNumber: c.vatNumber,
    kpis: extractKPIs(c.statement),
  }));

  const comparisons = calculateComparisons(companyKPIs, competitors);
  const summary = generateBenchmarkSummary(comparisons, companyKPIs, competitors);

  return {
    companyKPIs,
    competitors,
    comparisons,
    summary,
  };
}

function calculateComparisons(
  companyKPIs: KPISet,
  competitors: CompetitorData[]
): BenchmarkComparison[] {
  const comparisons: BenchmarkComparison[] = [];

  // Revenue comparison
  const revenues = competitors.map((c) => c.kpis.revenue);
  const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  comparisons.push(
    createComparison('revenue', 'Ricavi', companyKPIs.revenue, avgRevenue, revenues)
  );

  // EBITDA comparison
  const ebitdas = competitors.map((c) => c.kpis.ebitda);
  const avgEbitda = ebitdas.reduce((a, b) => a + b, 0) / ebitdas.length;
  comparisons.push(
    createComparison('ebitda', 'EBITDA', companyKPIs.ebitda, avgEbitda, ebitdas)
  );

  // EBITDA Margin comparison
  const margins = competitors.map((c) => c.kpis.ebitdaMargin);
  const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
  comparisons.push(
    createComparison('ebitdaMargin', 'Margine EBITDA', companyKPIs.ebitdaMargin, avgMargin, margins, true)
  );

  // Net Income comparison
  const netIncomes = competitors.map((c) => c.kpis.netIncome);
  const avgNetIncome = netIncomes.reduce((a, b) => a + b, 0) / netIncomes.length;
  comparisons.push(
    createComparison('netIncome', 'Utile Netto', companyKPIs.netIncome, avgNetIncome, netIncomes)
  );

  // Equity comparison
  const equities = competitors.map((c) => c.kpis.equity);
  const avgEquity = equities.reduce((a, b) => a + b, 0) / equities.length;
  comparisons.push(
    createComparison('equity', 'Patrimonio Netto', companyKPIs.equity, avgEquity, equities)
  );

  return comparisons;
}

function createComparison(
  metric: string,
  metricLabel: string,
  companyValue: number,
  competitorAverage: number,
  allValues: number[],
  isPercentage: boolean = false
): BenchmarkComparison {
  // Calculate percentile
  const sorted = [...allValues, companyValue].sort((a, b) => a - b);
  const position = sorted.indexOf(companyValue);
  const percentile = Math.round((position / sorted.length) * 100);

  // Determine position
  const ratio = companyValue / competitorAverage;
  let positionLabel: 'above' | 'below' | 'average';
  if (ratio > 1.1) {
    positionLabel = 'above';
  } else if (ratio < 0.9) {
    positionLabel = 'below';
  } else {
    positionLabel = 'average';
  }

  // Generate narrative
  const narrative = generateComparisonNarrative(
    metricLabel,
    companyValue,
    competitorAverage,
    positionLabel,
    percentile,
    isPercentage
  );

  return {
    metric,
    metricLabel,
    companyValue,
    competitorAverage,
    position: positionLabel,
    percentile,
    narrative,
  };
}

function generateComparisonNarrative(
  metricLabel: string,
  companyValue: number,
  avgValue: number,
  position: 'above' | 'below' | 'average',
  percentile: number,
  isPercentage: boolean
): string {
  const formatted = isPercentage
    ? formatPercentage(companyValue)
    : formatCurrency(companyValue);
  const formattedAvg = isPercentage
    ? formatPercentage(avgValue)
    : formatCurrency(avgValue);

  if (position === 'above') {
    return `Il tuo ${metricLabel.toLowerCase()} (${formatted}) è superiore alla media dei competitor (${formattedAvg}). Ti posizioni nel ${percentile}° percentile.`;
  } else if (position === 'below') {
    return `Il tuo ${metricLabel.toLowerCase()} (${formatted}) è inferiore alla media dei competitor (${formattedAvg}). Ti posizioni nel ${percentile}° percentile.`;
  } else {
    return `Il tuo ${metricLabel.toLowerCase()} (${formatted}) è in linea con la media dei competitor (${formattedAvg}).`;
  }
}

function generateBenchmarkSummary(
  comparisons: BenchmarkComparison[],
  companyKPIs: KPISet,
  competitors: CompetitorData[]
): BenchmarkSummary {
  // Count positions
  const aboveCount = comparisons.filter((c) => c.position === 'above').length;
  const belowCount = comparisons.filter((c) => c.position === 'below').length;

  // Determine overall position
  let overallPosition: BenchmarkSummary['overallPosition'];
  if (aboveCount >= 4) {
    overallPosition = 'leader';
  } else if (aboveCount >= 3) {
    overallPosition = 'competitive';
  } else if (belowCount >= 3) {
    overallPosition = 'lagging';
  } else {
    overallPosition = 'average';
  }

  // Collect strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  comparisons.forEach((c) => {
    if (c.position === 'above') {
      strengths.push(`${c.metricLabel} superiore alla media`);
    } else if (c.position === 'below') {
      weaknesses.push(`${c.metricLabel} inferiore alla media`);
    }
  });

  // Generate recommendations
  const recommendations = generateRecommendations(comparisons, overallPosition);

  return {
    overallPosition,
    strengths,
    weaknesses,
    recommendations,
  };
}

function generateRecommendations(
  comparisons: BenchmarkComparison[],
  position: BenchmarkSummary['overallPosition']
): string[] {
  const recommendations: string[] = [];

  // Find specific areas for improvement
  const marginComparison = comparisons.find((c) => c.metric === 'ebitdaMargin');
  if (marginComparison?.position === 'below') {
    recommendations.push(
      'Valuta una revisione della struttura dei costi per migliorare i margini'
    );
  }

  const revenueComparison = comparisons.find((c) => c.metric === 'revenue');
  if (revenueComparison?.position === 'below') {
    recommendations.push(
      'Potresti investire in strategie di crescita per aumentare i ricavi'
    );
  }

  const netIncomeComparison = comparisons.find((c) => c.metric === 'netIncome');
  if (netIncomeComparison?.position === 'below') {
    recommendations.push(
      'Analizza le voci che impattano l\'utile finale: interessi, tasse, ammortamenti'
    );
  }

  // General recommendations based on position
  if (position === 'leader') {
    recommendations.push('Mantieni il vantaggio competitivo investendo in innovazione');
  } else if (position === 'lagging') {
    recommendations.push('Considera una consulenza strategica per identificare le aree prioritarie di intervento');
  }

  return recommendations.slice(0, 4); // Max 4 recommendations
}

/**
 * Get chart data for benchmark visualization
 */
export function getBenchmarkChartData(result: BenchmarkResult) {
  return {
    revenue: {
      company: result.companyKPIs.revenue,
      competitors: result.competitors.map((c) => ({
        name: c.name,
        value: c.kpis.revenue,
      })),
    },
    ebitda: {
      company: result.companyKPIs.ebitda,
      competitors: result.competitors.map((c) => ({
        name: c.name,
        value: c.kpis.ebitda,
      })),
    },
    ebitdaMargin: {
      company: result.companyKPIs.ebitdaMargin * 100,
      competitors: result.competitors.map((c) => ({
        name: c.name,
        value: c.kpis.ebitdaMargin * 100,
      })),
    },
  };
}


