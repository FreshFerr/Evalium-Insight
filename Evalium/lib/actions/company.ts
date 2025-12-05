'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { getRateLimitedProvider, FinancialDataRateLimitError } from '@/lib/financial-data';
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
 * M-7: Uses Prisma transaction to ensure all DB operations succeed or fail together
 */
export async function createCompany(formData: FormData): Promise<ActionResult<{ companyId: string }>> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato. Effettua il login per continuare.' };
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

    // M-5: Get rate-limited financial data provider
    // External API calls should be outside the DB transaction
    const provider = getRateLimitedProvider(session.user.id);
    let financials: FinancialStatementData[] = [];

    const searchResults = await provider.searchCompany(
      vatNumber || legalName,
      country
    );

    if (searchResults.length > 0) {
      const matchedCompany = searchResults[0];
      try {
        const financialResult = await provider.fetchFinancials(
          matchedCompany.id,
          FINANCIAL_CONFIG.DEFAULT_YEARS_BACK
        );
        financials = financialResult.financials;
      } catch (e) {
        // M-5: Handle rate limit errors specifically
        if (e instanceof FinancialDataRateLimitError) {
          return { success: false, error: e.message };
        }
        console.error('Error fetching financials:', e);
        // Continue without financials - we can still create the company
      }
    }

    // M-7: Wrap all DB operations in a single transaction
    const company = await prisma.$transaction(async (tx) => {
      // Create company
      const newCompany = await tx.company.create({
        data: {
          userId: session.user.id,
          legalName,
          vatNumber: vatNumber?.toUpperCase() || null,
          country,
        },
      });

      // Store financial statements if available
      if (financials.length > 0) {
        await tx.financialStatement.createMany({
          data: financials.map((f) => ({
            companyId: newCompany.id,
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
        await tx.report.create({
          data: {
            companyId: newCompany.id,
            type: 'BASIC_ANALYSIS',
            status: 'COMPLETED',
            data: {
              generatedAt: new Date().toISOString(),
              yearsAnalyzed: financials.map((f) => f.fiscalYear),
            },
          },
        });
      }

      return newCompany;
    });

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
      error: 'Qualcosa è andato storto durante la creazione dell\'azienda. Riprova più tardi.',
    };
  }
}

/**
 * Delete a company
 */
export async function deleteCompany(companyId: string): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato. Effettua il login per continuare.' };
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
      return { success: false, error: 'Azienda non trovata o non hai i permessi per eliminarla.' };
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
      error: 'Qualcosa è andato storto durante l\'eliminazione. Riprova più tardi.',
    };
  }
}

/**
 * Refresh financial data for a company
 */
export async function refreshCompanyFinancials(companyId: string): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato. Effettua il login per continuare.' };
  }

  try {
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return { success: false, error: 'Azienda non trovata o non hai i permessi per modificarla.' };
    }

    // M-5: Get rate-limited financial data provider
    const provider = getRateLimitedProvider(session.user.id);
    
    // Search and fetch new financial data (external call outside transaction)
    let searchResults;
    let financialResult;
    
    try {
      searchResults = await provider.searchCompany(
        company.vatNumber || company.legalName,
        company.country
      );

      if (searchResults.length === 0) {
        return {
          success: false,
          error: 'Non è stato possibile trovare dati finanziari aggiornati per questa azienda.',
        };
      }

      financialResult = await provider.fetchFinancials(
        searchResults[0].id,
        FINANCIAL_CONFIG.DEFAULT_YEARS_BACK
      );
    } catch (e) {
      // M-5: Handle rate limit errors specifically
      if (e instanceof FinancialDataRateLimitError) {
        return { success: false, error: e.message };
      }
      throw e;
    }

    // M-7: Wrap all upserts in a transaction for consistency
    await prisma.$transaction(async (tx) => {
      for (const f of financialResult.financials) {
        await tx.financialStatement.upsert({
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
    });

    revalidatePath(`/dashboard/companies/${companyId}`);

    return { success: true };
  } catch (error) {
    console.error('Refresh financials error:', error);
    return {
      success: false,
      error: 'Qualcosa è andato storto durante l\'aggiornamento dei dati. Riprova più tardi.',
    };
  }
}
