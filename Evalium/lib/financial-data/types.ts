/**
 * Financial Data Provider Types
 * These types define the interface for financial data providers
 */

export interface CompanySearchResult {
  id: string;
  legalName: string;
  vatNumber?: string;
  country: string;
  industry?: string;
  foundedYear?: number;
}

export interface FinancialStatementData {
  fiscalYear: number;
  
  // Income Statement
  revenue: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  operatingCosts?: number;
  ebitda: number;
  ebitdaMargin: number;
  depreciation?: number;
  ebit?: number;
  interestExpense?: number;
  netIncome: number;
  
  // Balance Sheet
  cashAndEquivalents?: number;
  receivables?: number;
  inventory?: number;
  currentAssets?: number;
  fixedAssets?: number;
  totalAssets: number;
  
  currentLiabilities?: number;
  longTermDebt?: number;
  totalLiabilities: number;
  
  equity: number;
  netDebt?: number;
  
  // Computed
  revenueGrowth?: number;
  netProfitMargin?: number;
  debtToEquityRatio?: number;
  currentRatio?: number;
  
  // Metadata
  currency: string;
}

export interface CompanyFinancialsResult {
  company: CompanySearchResult;
  financials: FinancialStatementData[];
}

export interface FinancialDataProviderError {
  code: 'NOT_FOUND' | 'RATE_LIMITED' | 'PROVIDER_ERROR' | 'INVALID_INPUT';
  message: string;
}

/**
 * Interface for financial data providers
 * Implementations can be MockFinancialDataProvider (development) or real API integrations
 */
export interface FinancialDataProvider {
  /**
   * Search for a company by name or VAT number
   */
  searchCompany(query: string, country?: string): Promise<CompanySearchResult[]>;
  
  /**
   * Fetch financial statements for a company
   * @param companyId - Company identifier (from search result)
   * @param yearsBack - Number of years of historical data to fetch
   */
  fetchFinancials(
    companyId: string,
    yearsBack?: number
  ): Promise<CompanyFinancialsResult>;
  
  /**
   * Get company details by ID
   */
  getCompanyById(companyId: string): Promise<CompanySearchResult | null>;
}

export type { FinancialDataProvider as IFinancialDataProvider };

