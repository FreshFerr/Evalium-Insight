'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { createCheckoutSession, getProductConfig } from '@/lib/payment/stripe';
import { APP_CONFIG } from '@/config/constants';

export interface CheckoutResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
}

/**
 * Create a Stripe checkout session for a report purchase
 */
export async function createReportCheckout(
  companyId: string,
  planType: string
): Promise<CheckoutResult> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: 'Non autorizzato' };
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
      return { success: false, error: 'Azienda non trovata' };
    }

    // Get product config
    const product = getProductConfig(planType);
    if (!product) {
      return { success: false, error: 'Piano non valido' };
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
      return { success: false, error: 'Hai già acquistato questo report' };
    }

    // Create a pending report
    const report = await prisma.report.create({
      data: {
        companyId,
        type: planType === 'pro' ? 'FULL_ANALYSIS' : 'BENCHMARK',
        status: 'CREATED',
      },
    });

    // Create pending purchase
    await prisma.purchase.create({
      data: {
        userId: session.user.id,
        reportId: report.id,
        productType: product.type,
        amount: product.amount / 100, // Convert from cents
        currency: 'EUR',
        status: 'PENDING',
      },
    });

    // Create Stripe checkout session
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
      throw new Error('Failed to create checkout session');
    }

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante la creazione del pagamento',
    };
  }
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(
  sessionId: string,
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update report status
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'PAID' },
    });

    // Update purchase status
    await prisma.purchase.updateMany({
      where: { reportId },
      data: {
        stripeCheckoutSessionId: sessionId,
        status: 'PAID',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Payment success handler error:', error);
    return { success: false, error: 'Errore durante l\'aggiornamento del pagamento' };
  }
}

