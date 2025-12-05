import { FinancialDataProvider, CompanySearchResult, CompanyFinancialsResult } from './types';
import { MockFinancialDataProvider } from './mock-provider';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

export * from './types';
export { MockFinancialDataProvider } from './mock-provider';

/**
 * M-5: Rate limit error for financial data provider
 */
export class FinancialDataRateLimitError extends Error {
  constructor() {
    super('Hai effettuato troppe richieste di analisi in poco tempo. Riprova tra qualche minuto.');
    this.name = 'FinancialDataRateLimitError';
  }
}

/**
 * M-5: Rate-limited wrapper around FinancialDataProvider
 * Applies rate limiting per user to prevent abuse
 * 
 * NOTE: For production at scale, consider using @upstash/ratelimit
 * for distributed rate limiting across serverless instances.
 */
class RateLimitedFinancialDataProvider implements FinancialDataProvider {
  private provider: FinancialDataProvider;
  private userId: string;

  constructor(provider: FinancialDataProvider, userId: string) {
    this.provider = provider;
    this.userId = userId;
  }

  private checkRateLimit(): void {
    const key = `financial-data:${this.userId}`;
    const result = checkRateLimit(key, RATE_LIMIT_CONFIGS.financialData);
    
    if (!result.success) {
      throw new FinancialDataRateLimitError();
    }
  }

  async searchCompany(query: string, country?: string): Promise<CompanySearchResult[]> {
    this.checkRateLimit();
    return this.provider.searchCompany(query, country);
  }

  async fetchFinancials(companyId: string, yearsBack?: number): Promise<CompanyFinancialsResult> {
    this.checkRateLimit();
    return this.provider.fetchFinancials(companyId, yearsBack);
  }

  async getCompanyById(companyId: string): Promise<CompanySearchResult | null> {
    this.checkRateLimit();
    return this.provider.getCompanyById(companyId);
  }
}

/**
 * Get the configured financial data provider
 * Currently returns MockFinancialDataProvider
 * 
 * TODO: Implement RealFinancialDataProvider when integrating with actual APIs
 * The provider to use is configured via FINANCIAL_DATA_PROVIDER env variable
 */
export function getFinancialDataProvider(): FinancialDataProvider {
  const providerType = process.env.FINANCIAL_DATA_PROVIDER || 'mock';

  switch (providerType) {
    case 'mock':
      return new MockFinancialDataProvider({ simulateLatency: true });
    case 'real':
      // TODO: Implement RealFinancialDataProvider
      // Example: return new CervedProvider({ apiKey: process.env.CERVED_API_KEY });
      throw new Error(
        'Real financial data provider not yet implemented. ' +
        'Set FINANCIAL_DATA_PROVIDER=mock to use mock data.'
      );
    default:
      return new MockFinancialDataProvider({ simulateLatency: true });
  }
}

/**
 * Singleton instance for server-side usage (without rate limiting)
 */
let providerInstance: FinancialDataProvider | null = null;

/**
 * Get the base financial data provider (without rate limiting)
 * Use this only for internal/admin operations where rate limiting is not needed
 */
export function getProvider(): FinancialDataProvider {
  if (!providerInstance) {
    providerInstance = getFinancialDataProvider();
  }
  return providerInstance;
}

/**
 * M-5: Get a rate-limited financial data provider for a specific user
 * Use this for user-facing operations to prevent abuse
 * 
 * @param userId - The user ID to apply rate limiting for
 * @returns Rate-limited financial data provider
 */
export function getRateLimitedProvider(userId: string): FinancialDataProvider {
  const baseProvider = getProvider();
  return new RateLimitedFinancialDataProvider(baseProvider, userId);
}
