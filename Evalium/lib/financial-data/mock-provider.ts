import {
  FinancialDataProvider,
  CompanySearchResult,
  CompanyFinancialsResult,
  FinancialStatementData,
} from './types';
import { sleep } from '@/lib/utils';

/**
 * Mock company database for realistic test data
 */
const mockCompanies: Record<string, CompanySearchResult> = {
  'mock-1': {
    id: 'mock-1',
    legalName: 'Rossi Meccanica S.r.l.',
    vatNumber: 'IT12345678901',
    country: 'IT',
    industry: 'manufacturing',
    foundedYear: 1985,
  },
  'mock-2': {
    id: 'mock-2',
    legalName: 'Tech Solutions Italia S.p.A.',
    vatNumber: 'IT98765432109',
    country: 'IT',
    industry: 'technology',
    foundedYear: 2010,
  },
  'mock-3': {
    id: 'mock-3',
    legalName: 'Alimentari Bianchi S.r.l.',
    vatNumber: 'IT55566677788',
    country: 'IT',
    industry: 'food',
    foundedYear: 1972,
  },
  'mock-4': {
    id: 'mock-4',
    legalName: 'Costruzioni Verdi S.p.A.',
    vatNumber: 'IT11122233344',
    country: 'IT',
    industry: 'construction',
    foundedYear: 1995,
  },
  'mock-5': {
    id: 'mock-5',
    legalName: 'Digital Marketing Pro S.r.l.',
    vatNumber: 'IT99988877766',
    country: 'IT',
    industry: 'services',
    foundedYear: 2015,
  },
};

/**
 * Generate realistic financial data based on industry and company characteristics
 */
function generateFinancialData(
  company: CompanySearchResult,
  yearsBack: number
): FinancialStatementData[] {
  const currentYear = new Date().getFullYear() - 1; // Last completed fiscal year
  const financials: FinancialStatementData[] = [];

  // Base metrics vary by industry
  const industryProfiles: Record<string, { baseRevenue: number; ebitdaMargin: number; growthRate: number }> = {
    manufacturing: { baseRevenue: 3500000, ebitdaMargin: 0.12, growthRate: 0.06 },
    technology: { baseRevenue: 1800000, ebitdaMargin: 0.20, growthRate: 0.15 },
    food: { baseRevenue: 5200000, ebitdaMargin: 0.08, growthRate: 0.03 },
    construction: { baseRevenue: 8500000, ebitdaMargin: 0.10, growthRate: 0.04 },
    services: { baseRevenue: 950000, ebitdaMargin: 0.25, growthRate: 0.12 },
  };

  const profile = industryProfiles[company.industry || 'services'] || industryProfiles.services;
  
  // Add some randomization based on company ID for consistency
  const seed = company.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const randomFactor = 0.8 + (seed % 40) / 100; // 0.8 to 1.2

  for (let i = 0; i < yearsBack; i++) {
    const year = currentYear - i;
    const yearFactor = Math.pow(1 + profile.growthRate, -i);
    
    // Add some variance year over year
    const variance = 1 + (Math.sin(seed + i) * 0.05);
    
    const revenue = Math.round(profile.baseRevenue * randomFactor * yearFactor * variance);
    const ebitdaMarginActual = profile.ebitdaMargin + (Math.sin(seed + i * 2) * 0.02);
    const ebitda = Math.round(revenue * ebitdaMarginActual);
    const depreciation = Math.round(revenue * 0.03);
    const ebit = ebitda - depreciation;
    const interestExpense = Math.round(revenue * 0.015);
    const taxRate = 0.24;
    const netIncome = Math.round((ebit - interestExpense) * (1 - taxRate));
    
    const totalAssets = Math.round(revenue * (1.1 + (seed % 30) / 100));
    const currentAssets = Math.round(totalAssets * 0.4);
    const fixedAssets = totalAssets - currentAssets;
    const cashAndEquivalents = Math.round(currentAssets * 0.25);
    const receivables = Math.round(currentAssets * 0.45);
    const inventory = currentAssets - cashAndEquivalents - receivables;
    
    const debtRatio = 0.4 + (seed % 20) / 100;
    const totalLiabilities = Math.round(totalAssets * debtRatio);
    const currentLiabilities = Math.round(totalLiabilities * 0.4);
    const longTermDebt = totalLiabilities - currentLiabilities;
    const equity = totalAssets - totalLiabilities;
    const netDebt = longTermDebt - cashAndEquivalents;

    financials.push({
      fiscalYear: year,
      revenue,
      costOfGoodsSold: Math.round(revenue * 0.65),
      grossProfit: Math.round(revenue * 0.35),
      operatingCosts: Math.round(revenue * 0.35) - ebitda,
      ebitda,
      ebitdaMargin: ebitdaMarginActual,
      depreciation,
      ebit,
      interestExpense,
      netIncome,
      cashAndEquivalents,
      receivables,
      inventory,
      currentAssets,
      fixedAssets,
      totalAssets,
      currentLiabilities,
      longTermDebt,
      totalLiabilities,
      equity,
      netDebt,
      revenueGrowth: i < yearsBack - 1 ? profile.growthRate + (Math.sin(seed + i) * 0.02) : undefined,
      netProfitMargin: netIncome / revenue,
      debtToEquityRatio: totalLiabilities / equity,
      currentRatio: currentAssets / currentLiabilities,
      currency: 'EUR',
    });
  }

  return financials;
}

/**
 * Mock Financial Data Provider
 * Returns realistic fake data for development and testing
 */
export class MockFinancialDataProvider implements FinancialDataProvider {
  private simulateLatency: boolean;

  constructor(options?: { simulateLatency?: boolean }) {
    this.simulateLatency = options?.simulateLatency ?? true;
  }

  async searchCompany(query: string, _country?: string): Promise<CompanySearchResult[]> {
    if (this.simulateLatency) {
      await sleep(300 + Math.random() * 200);
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // If it looks like a VAT number, search by VAT
    if (/^[a-z]{0,2}\d+$/i.test(normalizedQuery.replace(/\s/g, ''))) {
      const results = Object.values(mockCompanies).filter(
        (c) => c.vatNumber?.toLowerCase().includes(normalizedQuery)
      );
      return results;
    }

    // Search by name
    const results = Object.values(mockCompanies).filter((c) =>
      c.legalName.toLowerCase().includes(normalizedQuery)
    );

    // If no results, return a generated company based on query
    if (results.length === 0 && normalizedQuery.length >= 3) {
      const generatedId = `gen-${normalizedQuery.replace(/\s/g, '-')}`;
      return [
        {
          id: generatedId,
          legalName: query.charAt(0).toUpperCase() + query.slice(1) + ' S.r.l.',
          vatNumber: 'IT' + Math.random().toString().slice(2, 13),
          country: 'IT',
          industry: 'services',
        },
      ];
    }

    return results;
  }

  async fetchFinancials(
    companyId: string,
    yearsBack: number = 3
  ): Promise<CompanyFinancialsResult> {
    if (this.simulateLatency) {
      await sleep(500 + Math.random() * 300);
    }

    // Get company or generate one
    let company = mockCompanies[companyId];
    
    if (!company) {
      // Generate a company based on the ID
      company = {
        id: companyId,
        legalName: companyId.replace(/^gen-/, '').replace(/-/g, ' ') + ' S.r.l.',
        vatNumber: 'IT' + Math.random().toString().slice(2, 13),
        country: 'IT',
        industry: 'services',
      };
    }

    const financials = generateFinancialData(company, yearsBack);

    return {
      company,
      financials,
    };
  }

  async getCompanyById(companyId: string): Promise<CompanySearchResult | null> {
    if (this.simulateLatency) {
      await sleep(100);
    }

    return mockCompanies[companyId] || null;
  }
}


