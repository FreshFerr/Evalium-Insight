import { describe, it, expect } from 'vitest';
import { generateNarrative, getKPIExplanation } from '@/lib/financial-logic/narrative';
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

describe('Narrative Generation', () => {
  describe('generateNarrative', () => {
    it('should return empty narrative for empty statements', () => {
      const result = generateNarrative([]);
      
      expect(result.summary).toBeTruthy();
      expect(result.sections).toHaveLength(0);
      expect(result.strengths).toHaveLength(0);
      expect(result.weaknesses).toHaveLength(0);
    });

    it('should generate narrative sections for valid data', () => {
      const statements = [createMockStatement()];
      const result = generateNarrative(statements);
      
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.summary).toBeTruthy();
    });

    it('should include revenue section', () => {
      const statements = [createMockStatement()];
      const result = generateNarrative(statements);
      
      const revenueSection = result.sections.find(s => s.title === 'I tuoi ricavi');
      expect(revenueSection).toBeDefined();
      expect(revenueSection?.content).toContain('2023');
    });

    it('should include profitability section', () => {
      const statements = [createMockStatement()];
      const result = generateNarrative(statements);
      
      const profitSection = result.sections.find(s => s.title === 'La tua redditività');
      expect(profitSection).toBeDefined();
      expect(profitSection?.content).toContain('EBITDA');
    });

    it('should calculate growth when multiple years provided', () => {
      const statements = [
        createMockStatement({ fiscalYear: 2023, revenue: BigInt(3500000) as unknown as number }),
        createMockStatement({ fiscalYear: 2022, revenue: BigInt(3000000) as unknown as number }),
      ];
      
      const result = generateNarrative(statements);
      
      const revenueSection = result.sections.find(s => s.title === 'I tuoi ricavi');
      expect(revenueSection?.content).toContain('%');
    });

    it('should identify strengths for good metrics', () => {
      const statements = [
        createMockStatement({
          ebitdaMargin: 0.20 as unknown as number, // Excellent margin
          netIncome: BigInt(500000) as unknown as number, // Good profit
        }),
      ];
      
      const result = generateNarrative(statements);
      
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it('should identify weaknesses for poor metrics', () => {
      const statements = [
        createMockStatement({
          ebitdaMargin: 0.03 as unknown as number, // Poor margin
          netIncome: BigInt(-100000) as unknown as number, // Loss
        }),
      ];
      
      const result = generateNarrative(statements);
      
      expect(result.weaknesses.length).toBeGreaterThan(0);
    });
  });

  describe('getKPIExplanation', () => {
    it('should return explanation for known KPIs', () => {
      expect(getKPIExplanation('revenue')).toContain('ricavi');
      expect(getKPIExplanation('ebitda')).toContain('EBITDA');
      expect(getKPIExplanation('equity')).toContain('patrimonio');
    });

    it('should return generic message for unknown KPIs', () => {
      expect(getKPIExplanation('unknownKpi')).toBe('Indicatore finanziario');
    });
  });
});

