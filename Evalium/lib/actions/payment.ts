'use server';

import { auth } from '@/lib/auth';
import prisma from '@/db';
import { createCheckoutSession, getProductConfig } from '@/lib/payment/stripe';
import { APP_CONFIG } from '@/config/constants';
import { logError } from '@/lib/logger';

export interface CheckoutResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
}

/**
 * Create a Stripe checkout session for a report purchase
 * M-7: Uses Prisma transaction to create Report + Purchase atomically
 */
export async function createReportCheckout(
  companyId: string,
  planType: string
): Promise<CheckoutResult> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: 'Non autorizzato. Effettua il login per continuare.' };
  }

  try {
    // Verify company ownership
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return { success: false, error: 'Azienda non trovata o non hai i permessi per accedervi.' };
    }

    // Get product config
    const product = getProductConfig(planType);
    if (!product) {
      return { success: false, error: 'Il piano selezionato non è valido.' };
    }

    // Check if user already has a paid report of this type
    const existingReport = await prisma.report.findFirst({
      where: {
        companyId,
        type: planType === 'pro' ? 'FULL_ANALYSIS' : 'BENCHMARK',
        status: 'PAID',
      },
    });

    if (existingReport) {
      return { success: false, error: 'Hai già acquistato questo report per questa azienda.' };
    }

    // M-7: Create Report and Purchase in a single transaction
    // This ensures both records are created together or neither is created
    const { report } = await prisma.$transaction(async (tx) => {
      // Create a pending report
      const newReport = await tx.report.create({
        data: {
          companyId,
          type: planType === 'pro' ? 'FULL_ANALYSIS' : 'BENCHMARK',
          status: 'CREATED',
        },
      });

      // Create pending purchase linked to the report
      await tx.purchase.create({
        data: {
          userId: session.user.id,
          reportId: newReport.id,
          productType: product.type,
          amount: product.amount / 100, // Convert from cents
          currency: 'EUR',
          status: 'PENDING',
        },
      });

      return { report: newReport };
    });

    // Create Stripe checkout session (external call, outside transaction)
    const baseUrl = APP_CONFIG.url;
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      companyId,
      reportId: report.id,
      planType,
      successUrl: `${baseUrl}/dashboard/companies/${companyId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard/companies/${companyId}?canceled=true`,
    });

    if (!checkoutSession.url) {
      // If Stripe fails, we should clean up the pending records
      // However, the webhook will handle this if payment never completes
      throw new Error('Stripe checkout session URL not generated');
    }

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    logError('Checkout error', error);
    return {
      success: false,
      error: 'Non è stato possibile avviare il pagamento. Riprova tra qualche minuto.',
    };
  }
}

/**
 * Handle successful payment (called from success page)
 * M-7: Uses transaction for atomic update of Report + Purchase
 */
export async function handlePaymentSuccess(
  sessionId: string,
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // M-7: Wrap updates in transaction
    await prisma.$transaction(async (tx) => {
      // Update report status
      await tx.report.update({
        where: { id: reportId },
        data: { status: 'PAID' },
      });

      // Update purchase status
      await tx.purchase.updateMany({
        where: { reportId },
        data: {
          stripeCheckoutSessionId: sessionId,
          status: 'PAID',
        },
      });
    });

    return { success: true };
  } catch (error) {
    logError('Payment success handler error', error);
    return { 
      success: false, 
      error: 'Qualcosa è andato storto durante l\'attivazione del report. Contatta l\'assistenza.' 
    };
  }
}
