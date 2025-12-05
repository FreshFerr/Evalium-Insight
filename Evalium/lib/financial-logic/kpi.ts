/**
 * KPI Calculation Utilities
 * Pure functions for computing financial KPIs
 */

import { FinancialStatement } from '@prisma/client';

export interface KPISet {
  // Profitability
  revenue: number;
  revenueGrowth: number | null;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  netProfitMargin: number | null;
  
  // Balance Sheet
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  netDebt: number | null;
  
  // Ratios
  debtToEquityRatio: number | null;
  currentRatio: number | null;
  
  // Metadata
  fiscalYear: number;
  currency: string;
}

/**
 * Extract KPIs from a financial statement
 */
export function extractKPIs(statement: FinancialStatement): KPISet {
  return {
    revenue: Number(statement.revenue),
    revenueGrowth: statement.revenueGrowth ? Number(statement.revenueGrowth) : null,
    ebitda: Number(statement.ebitda),
    ebitdaMargin: Number(statement.ebitdaMargin),
    netIncome: Number(statement.netIncome),
    netProfitMargin: statement.netProfitMargin ? Number(statement.netProfitMargin) : null,
    totalAssets: Number(statement.totalAssets),
    totalLiabilities: Number(statement.totalLiabilities),
    equity: Number(statement.equity),
    netDebt: statement.netDebt ? Number(statement.netDebt) : null,
    debtToEquityRatio: statement.debtToEquityRatio ? Number(statement.debtToEquityRatio) : null,
    currentRatio: statement.currentRatio ? Number(statement.currentRatio) : null,
    fiscalYear: statement.fiscalYear,
    currency: statement.currency,
  };
}

/**
 * Calculate year-over-year growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / Math.abs(previous);
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * Calculate average across financial statements
 */
export function calculateAverage(statements: FinancialStatement[], field: keyof FinancialStatement): number {
  const values = statements
    .map((s) => s[field])
    .filter((v) => v !== null && v !== undefined)
    .map(Number);
  
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Determine KPI health status
 */
export type KPIStatus = 'excellent' | 'good' | 'fair' | 'poor';

export function getEbitdaMarginStatus(margin: number): KPIStatus {
  if (margin >= 0.20) return 'excellent';
  if (margin >= 0.12) return 'good';
  if (margin >= 0.05) return 'fair';
  return 'poor';
}

export function getGrowthStatus(growth: number | null): KPIStatus {
  if (growth === null) return 'fair';
  if (growth >= 0.15) return 'excellent';
  if (growth >= 0.05) return 'good';
  if (growth >= 0) return 'fair';
  return 'poor';
}

export function getDebtToEquityStatus(ratio: number | null): KPIStatus {
  if (ratio === null) return 'fair';
  if (ratio <= 0.3) return 'excellent';
  if (ratio <= 0.6) return 'good';
  if (ratio <= 1.0) return 'fair';
  return 'poor';
}

export function getCurrentRatioStatus(ratio: number | null): KPIStatus {
  if (ratio === null) return 'fair';
  if (ratio >= 2.0) return 'excellent';
  if (ratio >= 1.5) return 'good';
  if (ratio >= 1.0) return 'fair';
  return 'poor';
}


