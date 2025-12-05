import Stripe from 'stripe';
import { PRICING, PRICING_PLANS } from '@/config/constants';

function getStripeInstance(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
}

// Lazy initialization to avoid errors at build time
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = getStripeInstance();
  }
  return _stripe;
}

// For backwards compatibility - will throw if accessed at build time
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export type ProductType = 'SINGLE_REPORT' | 'BENCHMARK_3' | 'BENCHMARK_UNLIMITED';

export interface ProductConfig {
  type: ProductType;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  features: string[];
}

/**
 * L-5: Product config now uses centralized PRICING constants
 * Prices are configurable via environment variables
 */
export function getProductConfig(planType: string): ProductConfig | null {
  const products: Record<string, ProductConfig> = {
    pro: {
      type: 'SINGLE_REPORT',
      name: PRICING_PLANS.PRO.name,
      description: PRICING_PLANS.PRO.description,
      priceId: PRICING_PLANS.PRO.priceId || '',
      amount: PRICING.PRO * 100, // Convert EUR to cents
      features: [...PRICING_PLANS.PRO.features], // Spread to make mutable
    },
    pro_plus: {
      type: 'BENCHMARK_UNLIMITED',
      name: PRICING_PLANS.PRO_PLUS.name,
      description: PRICING_PLANS.PRO_PLUS.description,
      priceId: PRICING_PLANS.PRO_PLUS.priceId || '',
      amount: PRICING.PRO_PLUS * 100, // Convert EUR to cents
      features: [...PRICING_PLANS.PRO_PLUS.features], // Spread to make mutable
    },
  };

  return products[planType] || null;
}

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  companyId: string;
  reportId: string;
  planType: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  userId,
  userEmail,
  companyId,
  reportId,
  planType,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const product = getProductConfig(planType);
  
  if (!product) {
    throw new Error(`Invalid plan type: ${planType}`);
  }

  // If we have a Stripe Price ID, use it; otherwise, create a one-time price
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = product.priceId
    ? [{ price: product.priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.amount,
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: userEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      companyId,
      reportId,
      planType,
      productType: product.type,
    },
    payment_intent_data: {
      metadata: {
        userId,
        companyId,
        reportId,
        planType,
        productType: product.type,
      },
    },
    locale: 'it',
    allow_promotion_codes: true,
  });

  return session;
}

export async function constructWebhookEvent(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer'],
  });
}

