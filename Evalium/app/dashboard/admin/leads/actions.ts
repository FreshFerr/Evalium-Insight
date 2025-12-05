'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { LeadStatus, UserRole } from '@prisma/client';
import { createMAndALeadSchema } from '@/lib/validations/company';
import { logError } from '@/lib/logger';
import { sendMAndALeadEmail } from '@/lib/email/ma-lead';
import { extractKPIs } from '@/lib/financial-logic/kpi';

/**
 * Update M&A lead status (Admin only)
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return { success: false, error: 'Non autorizzato. Solo gli amministratori possono modificare i lead.' };
  }

  try {
    await prisma.mAndALead.update({
      where: { id: leadId },
      data: {
        status,
        notes: notes || undefined,
        assignedTo: session.user.id,
      },
    });

    revalidatePath('/dashboard/admin/leads');

    return { success: true };
  } catch (error) {
    logError('Update lead status error', error);
    return { success: false, error: 'Qualcosa è andato storto durante l\'aggiornamento. Riprova più tardi.' };
  }
}

/**
 * Create a new M&A lead with proper validation
 */
export async function createMAndALead(
  input: {
    companyId: string;
    email: string;
    phone?: string;
    consent: boolean;
    score?: number;
    highlights?: string[];
  }
): Promise<{ success: boolean; error?: string; leadId?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato. Effettua il login.' };
  }

  // Validate input with Zod
  const validationResult = createMAndALeadSchema.safeParse(input);
  
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return { 
      success: false, 
      error: firstError?.message || 'Dati non validi' 
    };
  }

  const { companyId, email, phone, score, highlights } = validationResult.data;

  try {
    // Verify company ownership and fetch related data
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
      include: {
        financialStatements: {
          orderBy: { fiscalYear: 'desc' },
          take: 1,
        },
        reports: {
          select: {
            type: true,
            status: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!company) {
      return { success: false, error: 'Azienda non trovata o non autorizzato' };
    }

    // Check for existing lead
    const existingLead = await prisma.mAndALead.findFirst({
      where: {
        companyId,
        userId: session.user.id,
      },
    });

    if (existingLead) {
      return { success: false, error: 'Hai già inviato una richiesta per questa azienda' };
    }

    // Build reason data from financial statements
    const latestStatement = company.financialStatements[0];
    const reasonData = {
      highlights: highlights || [],
      revenue: latestStatement ? Number(latestStatement.revenue) : undefined,
      ebitda: latestStatement ? Number(latestStatement.ebitda) : undefined,
      growth: latestStatement?.revenueGrowth ? Number(latestStatement.revenueGrowth) : undefined,
    };

    // Create lead
    const lead = await prisma.mAndALead.create({
      data: {
        companyId,
        userId: session.user.id,
        status: 'NEW',
        maScore: score ?? null,
        reason: reasonData,
        hasUserConsented: true,
        userContactEmail: email,
        userContactPhone: phone || null,
        consentDate: new Date(),
      },
    });

    // Send email notification (don't fail lead creation if email fails)
    try {
      const latestKPIs = latestStatement ? extractKPIs(latestStatement) : null;
      const isPayingCustomer = company.reports.some((r) => r.status === 'PAID');

      await sendMAndALeadEmail({
        leadId: lead.id,
        company: {
          legalName: company.legalName,
          country: company.country,
          lastYearRevenue: latestKPIs?.revenue ?? null,
          lastYearEbitda: latestKPIs?.ebitda ?? null,
          lastYearEbitdaMargin: latestKPIs?.ebitdaMargin ?? null,
          netDebt: latestKPIs?.netDebt ?? null,
        },
        user: {
          name: company.user.name,
          email: email,
          phone: phone || null,
        },
        isPayingCustomer,
        reports: company.reports.map((r) => ({
          type: r.type,
          status: r.status,
        })),
      });
    } catch (emailError) {
      // Log error but don't fail the lead creation
      logError('Failed to send M&A lead notification email', emailError);
    }

    revalidatePath('/dashboard/admin/leads');

    return { success: true, leadId: lead.id };
  } catch (error) {
    logError('Create M&A lead error', error);
    return { success: false, error: 'Errore durante l\'invio della richiesta. Riprova più tardi.' };
  }
}
