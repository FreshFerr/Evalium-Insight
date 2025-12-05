import { describe, it, expect } from 'vitest';
import { generateNarrative, getKPIExplanation } from '@/lib/financial-logic/narrative';
import { FinancialStatement } from '@prisma/client';

/**
 * L-4: Unit tests for Narrative Generation
 * Extended to cover edge cases:
 * - Very strong company (high margins)
 * - Weak company (negative EBITDA)
 * - High leverage vs low leverage
 * - Multiple years with growth/decline
 */

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

  /**
   * L-4: Edge case tests for narrative generation
   */
  describe('Edge Cases', () => {
    describe('Very Strong Company (High Margins)', () => {
      it('should identify excellent EBITDA margin', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(10000000) as unknown as number,
            ebitda: BigInt(2500000) as unknown as number,
            ebitdaMargin: 0.25 as unknown as number, // 25% - excellent
            netIncome: BigInt(1500000) as unknown as number,
          }),
        ];

        const result = generateNarrative(statements);

        // Should have positive profitability section
        const profitSection = result.sections.find(s => s.title === 'La tua redditività');
        expect(profitSection).toBeDefined();
        expect(profitSection?.status).toBe('positive');
        expect(profitSection?.content).toContain('eccellente');

        // Should identify as strength
        expect(result.strengths.length).toBeGreaterThan(0);
      });

      it('should recognize excellent net profit margin', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(5000000) as unknown as number,
            netIncome: BigInt(500000) as unknown as number, // 10% net margin
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.strengths).toContain('Eccellente utile netto');
      });

      it('should recognize low debt as strength', () => {
        const statements = [
          createMockStatement({
            debtToEquityRatio: 0.2 as unknown as number, // Very low
            equity: BigInt(5000000) as unknown as number,
            totalLiabilities: BigInt(1000000) as unknown as number,
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.strengths).toContain('Basso indebitamento');
      });
    });

    describe('Weak Company (Negative EBITDA)', () => {
      it('should handle negative EBITDA gracefully', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(1000000) as unknown as number,
            ebitda: BigInt(-50000) as unknown as number, // Negative EBITDA
            ebitdaMargin: -0.05 as unknown as number,
            netIncome: BigInt(-100000) as unknown as number,
          }),
        ];

        // Should not throw
        expect(() => generateNarrative(statements)).not.toThrow();

        const result = generateNarrative(statements);

        // Should have negative status for profitability
        const profitSection = result.sections.find(s => s.title === 'La tua redditività');
        expect(profitSection).toBeDefined();
        expect(profitSection?.status).toBe('negative');

        // Should identify negative income as weakness
        expect(result.weaknesses).toContain('Utile netto negativo');
      });

      it('should handle zero revenue', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(0) as unknown as number,
            ebitda: BigInt(0) as unknown as number,
            ebitdaMargin: 0 as unknown as number,
          }),
        ];

        // Should not throw
        expect(() => generateNarrative(statements)).not.toThrow();

        const result = generateNarrative(statements);
        expect(result.sections.length).toBeGreaterThan(0);
      });
    });

    describe('High Leverage vs Low Leverage', () => {
      it('should warn about high debt-to-equity ratio', () => {
        const statements = [
          createMockStatement({
            debtToEquityRatio: 2.5 as unknown as number, // High leverage
            equity: BigInt(1000000) as unknown as number,
            totalLiabilities: BigInt(2500000) as unknown as number,
          }),
        ];

        const result = generateNarrative(statements);

        // Should identify high leverage as weakness
        expect(result.weaknesses).toContain('Elevato rapporto debiti/patrimonio');

        // Financial structure section should be negative
        const structureSection = result.sections.find(s => s.title === 'La tua solidità finanziaria');
        expect(structureSection?.status).toBe('negative');
      });

      it('should praise low leverage', () => {
        const statements = [
          createMockStatement({
            debtToEquityRatio: 0.15 as unknown as number, // Very low
            equity: BigInt(5000000) as unknown as number,
            totalLiabilities: BigInt(750000) as unknown as number,
          }),
        ];

        const result = generateNarrative(statements);

        // Should identify as strength
        expect(result.strengths).toContain('Basso indebitamento');

        // Financial structure section should be positive
        const structureSection = result.sections.find(s => s.title === 'La tua solidità finanziaria');
        expect(structureSection?.status).toBe('positive');
      });

      it('should handle negative equity (balance sheet hole)', () => {
        const statements = [
          createMockStatement({
            equity: BigInt(-500000) as unknown as number, // Negative equity
            totalLiabilities: BigInt(3000000) as unknown as number,
            debtToEquityRatio: null,
          }),
        ];

        const result = generateNarrative(statements);

        // Should warn about negative equity
        const structureSection = result.sections.find(s => s.title === 'La tua solidità finanziaria');
        expect(structureSection?.status).toBe('negative');
        expect(structureSection?.content).toContain('negativo');
      });
    });

    describe('Revenue Growth/Decline', () => {
      it('should celebrate double-digit growth', () => {
        const statements = [
          createMockStatement({ fiscalYear: 2023, revenue: BigInt(5500000) as unknown as number }),
          createMockStatement({ fiscalYear: 2022, revenue: BigInt(4000000) as unknown as number }),
        ];

        const result = generateNarrative(statements);

        // Should identify growth as strength
        expect(result.strengths).toContain('Crescita dei ricavi a doppia cifra');

        // Revenue section should be positive
        const revenueSection = result.sections.find(s => s.title === 'I tuoi ricavi');
        expect(revenueSection?.status).toBe('positive');
      });

      it('should flag revenue decline', () => {
        const statements = [
          createMockStatement({ fiscalYear: 2023, revenue: BigInt(3000000) as unknown as number }),
          createMockStatement({ fiscalYear: 2022, revenue: BigInt(4000000) as unknown as number }), // 25% decline
        ];

        const result = generateNarrative(statements);

        // Should identify decline as weakness
        expect(result.weaknesses).toContain('Ricavi in calo rispetto all\'anno precedente');

        // Revenue section should be negative
        const revenueSection = result.sections.find(s => s.title === 'I tuoi ricavi');
        expect(revenueSection?.status).toBe('negative');
      });

      it('should handle stable revenue', () => {
        const statements = [
          createMockStatement({ fiscalYear: 2023, revenue: BigInt(3000000) as unknown as number }),
          createMockStatement({ fiscalYear: 2022, revenue: BigInt(2950000) as unknown as number }), // ~1.7% growth
        ];

        const result = generateNarrative(statements);

        const revenueSection = result.sections.find(s => s.title === 'I tuoi ricavi');
        expect(revenueSection?.status).toBe('neutral');
      });
    });

    describe('Net Debt Position', () => {
      it('should celebrate positive cash position', () => {
        const statements = [
          createMockStatement({
            netDebt: BigInt(-500000) as unknown as number, // Negative = more cash than debt
            ebitda: BigInt(300000) as unknown as number,
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.strengths).toContain('Posizione di cassa positiva');
      });

      it('should warn about high net debt relative to EBITDA', () => {
        const statements = [
          createMockStatement({
            netDebt: BigInt(2000000) as unknown as number, // High
            ebitda: BigInt(200000) as unknown as number, // Net Debt > 3x EBITDA
          }),
        ];

        const result = generateNarrative(statements);

        const structureSection = result.sections.find(s => s.title === 'La tua solidità finanziaria');
        expect(structureSection?.content).toContain('significativo');
      });
    });

    describe('Company Size Recognition', () => {
      it('should recognize significant company size', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(5000000) as unknown as number, // > 2M
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.strengths).toContain('Dimensione aziendale significativa');
      });

      it('should not flag size for smaller companies', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(500000) as unknown as number, // < 2M
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.strengths).not.toContain('Dimensione aziendale significativa');
      });
    });

    describe('Overall Summary Generation', () => {
      it('should generate positive summary when strengths outweigh weaknesses', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(5000000) as unknown as number,
            ebitdaMargin: 0.20 as unknown as number,
            netIncome: BigInt(600000) as unknown as number,
            debtToEquityRatio: 0.2 as unknown as number,
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.summary).toContain('buona salute');
      });

      it('should generate cautionary summary when weaknesses outweigh strengths', () => {
        const statements = [
          createMockStatement({
            revenue: BigInt(1000000) as unknown as number,
            ebitdaMargin: 0.02 as unknown as number,
            netIncome: BigInt(-100000) as unknown as number,
            debtToEquityRatio: 1.5 as unknown as number,
          }),
          createMockStatement({
            fiscalYear: 2022,
            revenue: BigInt(1200000) as unknown as number, // Revenue decline
          }),
        ];

        const result = generateNarrative(statements);

        expect(result.summary).toContain('aree di attenzione');
      });
    });

    describe('Italian Language Quality', () => {
      it('should not crash and produce Italian text', () => {
        const statements = [createMockStatement()];
        const result = generateNarrative(statements);

        // Should contain Italian words
        expect(result.summary).toMatch(/nel|del|con|di/i);
        
        result.sections.forEach(section => {
          expect(section.content).toMatch(/nel|del|con|di|la|il/i);
        });
      });
    });
  });
});

