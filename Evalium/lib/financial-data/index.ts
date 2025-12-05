import { FinancialDataProvider } from './types';
import { MockFinancialDataProvider } from './mock-provider';

export * from './types';
export { MockFinancialDataProvider } from './mock-provider';

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
 * Singleton instance for server-side usage
 */
let providerInstance: FinancialDataProvider | null = null;

export function getProvider(): FinancialDataProvider {
  if (!providerInstance) {
    providerInstance = getFinancialDataProvider();
  }
  return providerInstance;
}

