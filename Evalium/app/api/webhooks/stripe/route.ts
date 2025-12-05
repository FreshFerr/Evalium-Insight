import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/payment/stripe';
import prisma from '@/db';
import Stripe from 'stripe';
import { z } from 'zod';

// H-5: Zod schema for validating Stripe metadata
const StripeMetadataSchema = z.object({
  reportId: z.string().min(1),
  userId: z.string().min(1),
  companyId: z.string().min(1),
  planType: z.string().optional(),
  productType: z.string().optional(),
});

type ValidatedMetadata = z.infer<typeof StripeMetadataSchema>;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = await constructWebhookEvent(body, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // H-5: Validate metadata with Zod
  const metadataResult = StripeMetadataSchema.safeParse(session.metadata);
  
  if (!metadataResult.success) {
    console.warn('Invalid webhook metadata:', metadataResult.error.errors);
    return;
  }

  const { reportId, userId, companyId } = metadataResult.data;

  // H-2: Verify ownership - fetch report with company relationship
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { company: true },
  });

  if (!report) {
    console.warn(`Report ${reportId} not found in webhook handler`);
    return;
  }

  // H-2: Verify companyId matches
  if (report.companyId !== companyId) {
    console.warn(
      `Webhook ownership mismatch: report.companyId=${report.companyId} vs metadata.companyId=${companyId}`
    );
    return;
  }

  // H-2: Verify company belongs to userId
  if (report.company.userId !== userId) {
    console.warn(
      `Webhook ownership mismatch: company.userId=${report.company.userId} vs metadata.userId=${userId}`
    );
    return;
  }

  // H-4: Check idempotency - if report is already PAID, skip processing
  if (report.status === 'PAID') {
    console.log(`Report ${reportId} is already PAID, skipping duplicate webhook`);
    return;
  }

  // All verifications passed - update report and purchase in a transaction
  await prisma.$transaction(async (tx) => {
    // Update report status to PAID
    await tx.report.update({
      where: { id: reportId },
      data: { status: 'PAID' },
    });

    // Update purchase record
    await tx.purchase.updateMany({
      where: { reportId },
      data: {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        status: 'PAID',
      },
    });
  });

  console.log(`✅ Payment completed for report ${reportId}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // H-5: Validate metadata with Zod
  const metadataResult = StripeMetadataSchema.safeParse(paymentIntent.metadata);
  
  if (!metadataResult.success) {
    // Metadata might be empty for payment intents not created via our checkout
    console.log('PaymentIntent has no valid metadata, skipping');
    return;
  }

  const { reportId, userId, companyId } = metadataResult.data;

  // H-2: Verify ownership
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { company: true },
  });

  if (!report) {
    console.warn(`Report ${reportId} not found for payment_intent.succeeded`);
    return;
  }

  if (report.companyId !== companyId || report.company.userId !== userId) {
    console.warn(`Ownership mismatch in payment_intent.succeeded for report ${reportId}`);
    return;
  }

  // H-4: Check idempotency
  if (report.status === 'PAID') {
    console.log(`Report ${reportId} already PAID, skipping payment_intent.succeeded`);
    return;
  }

  // Update in transaction
  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: { status: 'PAID' },
    });

    await tx.purchase.updateMany({
      where: { reportId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        status: 'PAID',
      },
    });
  });

  console.log(`✅ Payment intent succeeded for report ${reportId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // H-5: Validate metadata
  const metadataResult = StripeMetadataSchema.safeParse(paymentIntent.metadata);
  
  if (!metadataResult.success) {
    console.log('PaymentIntent has no valid metadata for failed payment');
    return;
  }

  const { reportId } = metadataResult.data;

  // Update purchase status to failed (no ownership check needed for failures)
  await prisma.purchase.updateMany({
    where: { reportId },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      status: 'FAILED',
    },
  });

  console.log(`❌ Payment failed for report ${reportId}`);
}
