import Stripe from 'stripe';

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

export function getProductConfig(planType: string): ProductConfig | null {
  const products: Record<string, ProductConfig> = {
    pro: {
      type: 'SINGLE_REPORT',
      name: 'Analisi Pro',
      description: 'Analisi completa del bilancio con benchmark 3 competitor',
      priceId: process.env.STRIPE_PRICE_FULL_ANALYSIS || '',
      amount: 49_00, // in cents
      features: [
        'Analisi dettagliata del bilancio',
        'Benchmark con 3 competitor',
        'Grafici di trend multi-anno',
        'Raccomandazioni data-driven',
        'Export Excel',
      ],
    },
    pro_plus: {
      type: 'BENCHMARK_UNLIMITED',
      name: 'Analisi Pro Plus',
      description: 'Analisi completa con benchmark illimitati e export PowerPoint',
      priceId: process.env.STRIPE_PRICE_BENCHMARK_UNLIMITED || '',
      amount: 99_00, // in cents
      features: [
        'Tutto del piano Pro',
        'Benchmark con competitor illimitati',
        'Export PowerPoint professionale',
        'Report brandizzati',
        'Supporto prioritario',
      ],
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

