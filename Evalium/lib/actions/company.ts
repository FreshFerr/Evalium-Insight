'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { getProvider } from '@/lib/financial-data';
import { createCompanySchema } from '@/lib/validations/company';
import { FINANCIAL_CONFIG } from '@/config/constants';
import type { FinancialStatementData } from '@/lib/financial-data/types';

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Create a new company and fetch its financial data
 */
export async function createCompany(formData: FormData): Promise<ActionResult<{ companyId: string }>> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato' };
  }

  const rawData = {
    legalName: formData.get('legalName'),
    vatNumber: formData.get('vatNumber') || undefined,
    country: formData.get('country'),
  };

  const validated = createCompanySchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Dati non validi',
    };
  }

  const { legalName, vatNumber, country } = validated.data;

  try {
    // Check if company with same VAT already exists for this user
    if (vatNumber) {
      const existing = await prisma.company.findFirst({
        where: {
          userId: session.user.id,
          vatNumber: vatNumber.toUpperCase(),
        },
      });

      if (existing) {
        return {
          success: false,
          error: 'Hai già registrato un\'azienda con questa Partita IVA',
        };
      }
    }

    // Get financial data provider
    const provider = getProvider();

    // Search for company
    const searchResults = await provider.searchCompany(
      vatNumber || legalName,
      country
    );

    let financials: FinancialStatementData[] = [];
    let providerCompanyId: string | null = null;

    if (searchResults.length > 0) {
      // Use the first matching result
      const matchedCompany = searchResults[0];
      providerCompanyId = matchedCompany.id;

      // Fetch financial data
      try {
        const financialResult = await provider.fetchFinancials(
          matchedCompany.id,
          FINANCIAL_CONFIG.DEFAULT_YEARS_BACK
        );
        financials = financialResult.financials;
      } catch (e) {
        console.error('Error fetching financials:', e);
        // Continue without financials - we can still create the company
      }
    }

    // Create company in database
    const company = await prisma.company.create({
      data: {
        userId: session.user.id,
        legalName,
        vatNumber: vatNumber?.toUpperCase() || null,
        country,
      },
    });

    // Store financial statements if available
    if (financials.length > 0) {
      await prisma.financialStatement.createMany({
        data: financials.map((f) => ({
          companyId: company.id,
          fiscalYear: f.fiscalYear,
          revenue: f.revenue,
          costOfGoodsSold: f.costOfGoodsSold || null,
          grossProfit: f.grossProfit || null,
          operatingCosts: f.operatingCosts || null,
          ebitda: f.ebitda,
          ebitdaMargin: f.ebitdaMargin,
          depreciation: f.depreciation || null,
          ebit: f.ebit || null,
          interestExpense: f.interestExpense || null,
          netIncome: f.netIncome,
          cashAndEquivalents: f.cashAndEquivalents || null,
          receivables: f.receivables || null,
          inventory: f.inventory || null,
          currentAssets: f.currentAssets || null,
          fixedAssets: f.fixedAssets || null,
          totalAssets: f.totalAssets,
          currentLiabilities: f.currentLiabilities || null,
          longTermDebt: f.longTermDebt || null,
          totalLiabilities: f.totalLiabilities,
          equity: f.equity,
          netDebt: f.netDebt || null,
          revenueGrowth: f.revenueGrowth || null,
          netProfitMargin: f.netProfitMargin || null,
          debtToEquityRatio: f.debtToEquityRatio || null,
          currentRatio: f.currentRatio || null,
          source: 'API',
          currency: f.currency,
        })),
      });

      // Create a basic analysis report
      await prisma.report.create({
        data: {
          companyId: company.id,
          type: 'BASIC_ANALYSIS',
          status: 'COMPLETED',
          data: {
            generatedAt: new Date().toISOString(),
            yearsAnalyzed: financials.map((f) => f.fiscalYear),
          },
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/companies');

    return {
      success: true,
      data: { companyId: company.id },
    };
  } catch (error) {
    console.error('Create company error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante la creazione dell\'azienda',
    };
  }
}

/**
 * Delete a company
 */
export async function deleteCompany(companyId: string): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato' };
  }

  try {
    // Verify ownership
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return { success: false, error: 'Azienda non trovata' };
    }

    // Delete company (cascades to related records)
    await prisma.company.delete({
      where: { id: companyId },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/companies');

    return { success: true };
  } catch (error) {
    console.error('Delete company error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante l\'eliminazione',
    };
  }
}

/**
 * Refresh financial data for a company
 */
export async function refreshCompanyFinancials(companyId: string): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato' };
  }

  try {
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return { success: false, error: 'Azienda non trovata' };
    }

    const provider = getProvider();
    
    // Search and fetch new financial data
    const searchResults = await provider.searchCompany(
      company.vatNumber || company.legalName,
      company.country
    );

    if (searchResults.length === 0) {
      return {
        success: false,
        error: 'Impossibile trovare dati finanziari aggiornati',
      };
    }

    const financialResult = await provider.fetchFinancials(
      searchResults[0].id,
      FINANCIAL_CONFIG.DEFAULT_YEARS_BACK
    );

    // Update or create financial statements
    for (const f of financialResult.financials) {
      await prisma.financialStatement.upsert({
        where: {
          companyId_fiscalYear: {
            companyId: company.id,
            fiscalYear: f.fiscalYear,
          },
        },
        update: {
          revenue: f.revenue,
          ebitda: f.ebitda,
          ebitdaMargin: f.ebitdaMargin,
          netIncome: f.netIncome,
          totalAssets: f.totalAssets,
          totalLiabilities: f.totalLiabilities,
          equity: f.equity,
          netDebt: f.netDebt || null,
          revenueGrowth: f.revenueGrowth || null,
          source: 'API',
          updatedAt: new Date(),
        },
        create: {
          companyId: company.id,
          fiscalYear: f.fiscalYear,
          revenue: f.revenue,
          ebitda: f.ebitda,
          ebitdaMargin: f.ebitdaMargin,
          netIncome: f.netIncome,
          totalAssets: f.totalAssets,
          totalLiabilities: f.totalLiabilities,
          equity: f.equity,
          netDebt: f.netDebt || null,
          revenueGrowth: f.revenueGrowth || null,
          source: 'API',
          currency: f.currency,
        },
      });
    }

    revalidatePath(`/dashboard/companies/${companyId}`);

    return { success: true };
  } catch (error) {
    console.error('Refresh financials error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante l\'aggiornamento',
    };
  }
}

