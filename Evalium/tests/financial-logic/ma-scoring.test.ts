import { describe, it, expect } from 'vitest';
import { calculateMAScore } from '@/lib/financial-logic/ma-scoring';
import { FinancialStatement } from '@prisma/client';

// Mock financial statement factory
function createMockStatement(overrides: Partial<FinancialStatement> = {}): FinancialStatement {
  return {
    id: 'test-id',
    companyId: 'company-1',
    fiscalYear: 2023,
    revenue: BigInt(3500000) as unknown as number,
    costOfGoodsSold: null,
    grossProfit: null,
    operatingCosts: null,
    ebitda: BigInt(420000) as unknown as number,
    ebitdaMargin: 0.12 as unknown as number,
    depreciation: null,
    ebit: null,
    interestExpense: null,
    netIncome: BigInt(250000) as unknown as number,
    cashAndEquivalents: null,
    receivables: null,
    inventory: null,
    currentAssets: null,
    fixedAssets: null,
    totalAssets: BigInt(4000000) as unknown as number,
    currentLiabilities: null,
    longTermDebt: null,
    totalLiabilities: BigInt(2000000) as unknown as number,
    equity: BigInt(2000000) as unknown as number,
    netDebt: BigInt(500000) as unknown as number,
    revenueGrowth: 0.08 as unknown as number,
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

describe('M&A Scoring', () => {
  describe('calculateMAScore', () => {
    it('should return 0 score for empty statements', () => {
      const result = calculateMAScore([]);
      
      expect(result.score).toBe(0);
      expect(result.isEligible).toBe(false);
      expect(result.factors).toHaveLength(0);
    });

    it('should calculate score for company meeting thresholds', () => {
      const statements = [createMockStatement()];
      const result = calculateMAScore(statements);
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should mark company as eligible when meeting revenue threshold', () => {
      const statements = [
        createMockStatement({
          revenue: BigInt(3000000) as unknown as number,
          ebitda: BigInt(400000) as unknown as number,
          ebitdaMargin: 0.13 as unknown as number,
        }),
      ];
      
      const result = calculateMAScore(statements);
      
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.isEligible).toBe(true);
      expect(result.highlights.length).toBeGreaterThan(0);
    });

    it('should not mark small company as eligible', () => {
      const statements = [
        createMockStatement({
          revenue: BigInt(500000) as unknown as number,
          ebitda: BigInt(30000) as unknown as number,
          ebitdaMargin: 0.06 as unknown as number,
        }),
      ];
      
      const result = calculateMAScore(statements);
      
      expect(result.isEligible).toBe(false);
    });

    it('should include growth factor when multiple years provided', () => {
      const statements = [
        createMockStatement({ fiscalYear: 2023, revenue: BigInt(3500000) as unknown as number }),
        createMockStatement({ fiscalYear: 2022, revenue: BigInt(3000000) as unknown as number }),
      ];
      
      const result = calculateMAScore(statements);
      
      const growthFactor = result.factors.find(f => f.name === 'Crescita');
      expect(growthFactor).toBeDefined();
      expect(growthFactor?.score).toBeGreaterThan(0);
    });

    it('should generate summary text', () => {
      const statements = [createMockStatement()];
      const result = calculateMAScore(statements);
      
      expect(result.summary).toBeTruthy();
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeGreaterThan(20);
    });
  });
});

