import { describe, it, expect } from 'vitest';
import { createBenchmark, getBenchmarkChartData } from '@/lib/financial-logic/benchmark';
import { FinancialStatement } from '@prisma/client';

/**
 * L-4: Unit tests for Benchmark Comparison Logic
 * Tests scenarios where company is below, at, and above competitor averages
 * Also tests edge cases with missing or zero metrics
 */

// Mock financial statement factory
function createMockStatement(overrides: Partial<FinancialStatement> = {}): FinancialStatement {
  return {
    id: 'test-id',
    companyId: 'company-1',
    fiscalYear: 2023,
    revenue: BigInt(3000000) as unknown as number,
    costOfGoodsSold: null,
    grossProfit: null,
    operatingCosts: null,
    ebitda: BigInt(300000) as unknown as number,
    ebitdaMargin: 0.10 as unknown as number,
    depreciation: null,
    ebit: null,
    interestExpense: null,
    netIncome: BigInt(200000) as unknown as number,
    cashAndEquivalents: null,
    receivables: null,
    inventory: null,
    currentAssets: null,
    fixedAssets: null,
    totalAssets: BigInt(5000000) as unknown as number,
    currentLiabilities: null,
    longTermDebt: null,
    totalLiabilities: BigInt(2500000) as unknown as number,
    equity: BigInt(2500000) as unknown as number,
    netDebt: BigInt(500000) as unknown as number,
    revenueGrowth: 0.10 as unknown as number,
    netProfitMargin: null,
    debtToEquityRatio: 0.5 as unknown as number,
    currentRatio: null,
    source: 'API',
    currency: 'EUR',
    rawData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as FinancialStatement;
}

describe('Benchmark Comparison Logic', () => {
  describe('createBenchmark', () => {
    it('should create benchmark result with correct structure', () => {
      const company = createMockStatement();
      const competitors = [
        { name: 'Competitor A', vatNumber: 'IT123', statement: createMockStatement() },
        { name: 'Competitor B', statement: createMockStatement() },
      ];

      const result = createBenchmark(company, competitors);

      expect(result).toHaveProperty('companyKPIs');
      expect(result).toHaveProperty('competitors');
      expect(result).toHaveProperty('comparisons');
      expect(result).toHaveProperty('summary');
      expect(result.competitors).toHaveLength(2);
    });

    it('should identify company as ABOVE average when metrics are higher', () => {
      // Company with significantly higher metrics
      const company = createMockStatement({
        revenue: BigInt(10000000) as unknown as number,
        ebitda: BigInt(2000000) as unknown as number,
        ebitdaMargin: 0.20 as unknown as number,
        netIncome: BigInt(1500000) as unknown as number,
        equity: BigInt(8000000) as unknown as number,
      });

      // Competitors with lower metrics
      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            revenue: BigInt(2000000) as unknown as number,
            ebitda: BigInt(200000) as unknown as number,
            ebitdaMargin: 0.10 as unknown as number,
            netIncome: BigInt(100000) as unknown as number,
            equity: BigInt(1500000) as unknown as number,
          }),
        },
        {
          name: 'Competitor B',
          statement: createMockStatement({
            revenue: BigInt(2500000) as unknown as number,
            ebitda: BigInt(250000) as unknown as number,
            ebitdaMargin: 0.10 as unknown as number,
            netIncome: BigInt(150000) as unknown as number,
            equity: BigInt(2000000) as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      // Company should be above average for most metrics
      const aboveCount = result.comparisons.filter(c => c.position === 'above').length;
      expect(aboveCount).toBeGreaterThanOrEqual(4);

      // Should be classified as leader
      expect(result.summary.overallPosition).toBe('leader');
    });

    it('should identify company as BELOW average when metrics are lower', () => {
      // Company with lower metrics
      const company = createMockStatement({
        revenue: BigInt(1000000) as unknown as number,
        ebitda: BigInt(50000) as unknown as number,
        ebitdaMargin: 0.05 as unknown as number,
        netIncome: BigInt(20000) as unknown as number,
        equity: BigInt(500000) as unknown as number,
      });

      // Competitors with higher metrics
      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            revenue: BigInt(5000000) as unknown as number,
            ebitda: BigInt(750000) as unknown as number,
            ebitdaMargin: 0.15 as unknown as number,
            netIncome: BigInt(400000) as unknown as number,
            equity: BigInt(3000000) as unknown as number,
          }),
        },
        {
          name: 'Competitor B',
          statement: createMockStatement({
            revenue: BigInt(6000000) as unknown as number,
            ebitda: BigInt(900000) as unknown as number,
            ebitdaMargin: 0.15 as unknown as number,
            netIncome: BigInt(500000) as unknown as number,
            equity: BigInt(4000000) as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      // Company should be below average for most metrics
      const belowCount = result.comparisons.filter(c => c.position === 'below').length;
      expect(belowCount).toBeGreaterThanOrEqual(3);

      // Should be classified as lagging
      expect(result.summary.overallPosition).toBe('lagging');
    });

    it('should identify company as AVERAGE when metrics are similar', () => {
      // Company with similar metrics to competitors
      const baseMetrics = {
        revenue: BigInt(3000000) as unknown as number,
        ebitda: BigInt(300000) as unknown as number,
        ebitdaMargin: 0.10 as unknown as number,
        netIncome: BigInt(200000) as unknown as number,
        equity: BigInt(2000000) as unknown as number,
      };

      const company = createMockStatement(baseMetrics);

      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            ...baseMetrics,
            revenue: BigInt(3100000) as unknown as number, // Slightly higher
          }),
        },
        {
          name: 'Competitor B',
          statement: createMockStatement({
            ...baseMetrics,
            revenue: BigInt(2900000) as unknown as number, // Slightly lower
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      // Most comparisons should be "average"
      const avgCount = result.comparisons.filter(c => c.position === 'average').length;
      expect(avgCount).toBeGreaterThanOrEqual(2);
    });

    it('should handle edge case: some metrics are zero', () => {
      const company = createMockStatement({
        revenue: BigInt(1000000) as unknown as number,
        ebitda: BigInt(0) as unknown as number, // Zero EBITDA
        ebitdaMargin: 0 as unknown as number,
        netIncome: BigInt(-50000) as unknown as number, // Negative net income
        equity: BigInt(500000) as unknown as number,
      });

      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            revenue: BigInt(2000000) as unknown as number,
            ebitda: BigInt(200000) as unknown as number,
          }),
        },
      ];

      // Should not throw
      expect(() => createBenchmark(company, competitors)).not.toThrow();

      const result = createBenchmark(company, competitors);
      expect(result.comparisons).toBeDefined();
      expect(result.comparisons.length).toBeGreaterThan(0);
    });

    it('should handle edge case: single competitor', () => {
      const company = createMockStatement();
      const competitors = [
        {
          name: 'Only Competitor',
          statement: createMockStatement({
            revenue: BigInt(2000000) as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      expect(result.competitors).toHaveLength(1);
      expect(result.comparisons.length).toBeGreaterThan(0);
    });

    it('should generate strengths for above-average metrics', () => {
      const company = createMockStatement({
        revenue: BigInt(10000000) as unknown as number,
        ebitda: BigInt(2000000) as unknown as number,
      });

      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            revenue: BigInt(2000000) as unknown as number,
            ebitda: BigInt(200000) as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      expect(result.summary.strengths.length).toBeGreaterThan(0);
      expect(result.summary.strengths.some(s => s.includes('superiore'))).toBe(true);
    });

    it('should generate weaknesses for below-average metrics', () => {
      const company = createMockStatement({
        revenue: BigInt(500000) as unknown as number,
        ebitda: BigInt(25000) as unknown as number,
      });

      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            revenue: BigInt(5000000) as unknown as number,
            ebitda: BigInt(750000) as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      expect(result.summary.weaknesses.length).toBeGreaterThan(0);
      expect(result.summary.weaknesses.some(w => w.includes('inferiore'))).toBe(true);
    });

    it('should generate recommendations based on weaknesses', () => {
      const company = createMockStatement({
        revenue: BigInt(1000000) as unknown as number,
        ebitdaMargin: 0.03 as unknown as number, // Very low margin
      });

      const competitors = [
        {
          name: 'Competitor A',
          statement: createMockStatement({
            revenue: BigInt(5000000) as unknown as number,
            ebitdaMargin: 0.15 as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      // Should have recommendations
      expect(result.summary.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate percentile correctly', () => {
      const company = createMockStatement({
        revenue: BigInt(3000000) as unknown as number, // Middle value
      });

      const competitors = [
        {
          name: 'Small',
          statement: createMockStatement({
            revenue: BigInt(1000000) as unknown as number,
          }),
        },
        {
          name: 'Large',
          statement: createMockStatement({
            revenue: BigInt(5000000) as unknown as number,
          }),
        },
      ];

      const result = createBenchmark(company, competitors);

      const revenueComparison = result.comparisons.find(c => c.metric === 'revenue');
      expect(revenueComparison).toBeDefined();
      // Should be in the middle percentile range
      expect(revenueComparison!.percentile).toBeGreaterThanOrEqual(25);
      expect(revenueComparison!.percentile).toBeLessThanOrEqual(75);
    });
  });

  describe('getBenchmarkChartData', () => {
    it('should return chart data in correct format', () => {
      const company = createMockStatement();
      const competitors = [
        { name: 'Comp A', statement: createMockStatement() },
        { name: 'Comp B', statement: createMockStatement() },
      ];

      const result = createBenchmark(company, competitors);
      const chartData = getBenchmarkChartData(result);

      expect(chartData).toHaveProperty('revenue');
      expect(chartData).toHaveProperty('ebitda');
      expect(chartData).toHaveProperty('ebitdaMargin');

      expect(chartData.revenue.company).toBeDefined();
      expect(chartData.revenue.competitors).toHaveLength(2);
      expect(chartData.revenue.competitors[0]).toHaveProperty('name');
      expect(chartData.revenue.competitors[0]).toHaveProperty('value');
    });

    it('should convert EBITDA margin to percentage', () => {
      const company = createMockStatement({
        ebitdaMargin: 0.15 as unknown as number, // 15%
      });

      const competitors = [
        {
          name: 'Comp A',
          statement: createMockStatement({
            ebitdaMargin: 0.10 as unknown as number, // 10%
          }),
        },
      ];

      const result = createBenchmark(company, competitors);
      const chartData = getBenchmarkChartData(result);

      // Should be converted to percentage (multiplied by 100)
      expect(chartData.ebitdaMargin.company).toBe(15);
      expect(chartData.ebitdaMargin.competitors[0].value).toBe(10);
    });
  });

  describe('Narrative generation in comparisons', () => {
    it('should generate Italian narrative for each comparison', () => {
      const company = createMockStatement();
      const competitors = [
        { name: 'Competitor A', statement: createMockStatement() },
      ];

      const result = createBenchmark(company, competitors);

      result.comparisons.forEach(comparison => {
        expect(comparison.narrative).toBeTruthy();
        // Should contain Italian text
        expect(comparison.narrative).toMatch(/percentile|media|competitor/);
      });
    });
  });
});


