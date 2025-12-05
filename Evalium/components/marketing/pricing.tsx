import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICING_PLANS } from '@/config/constants';

const plans = [
  {
    ...PRICING_PLANS.FREE,
    cta: 'Inizia gratis',
    href: '/register',
  },
  {
    ...PRICING_PLANS.PRO,
    cta: 'Scegli Pro',
    href: '/register?plan=pro',
  },
  {
    ...PRICING_PLANS.PRO_PLUS,
    cta: 'Scegli Pro Plus',
    href: '/register?plan=pro_plus',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="section-container">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prezzi semplici e trasparenti
          </h2>
          <p className="text-lg text-muted-foreground">
            Inizia gratis e passa al piano a pagamento solo quando ne hai bisogno. 
            Nessun costo nascosto, nessun abbonamento obbligatorio.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative rounded-2xl border bg-white p-8',
              'popular' in plan && plan.popular
                ? 'border-evalium-500 shadow-soft-lg ring-1 ring-evalium-500'
                : 'shadow-soft'
            )}
          >
            {/* Popular Badge */}
            {'popular' in plan && plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-evalium-600">
                  Più popolare
                </Badge>
              )}

              {/* Plan Info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    €{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/report</span>
                  )}
                </div>
                {plan.price === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Per sempre gratis
                  </p>
                )}
              </div>

              {/* CTA */}
              <Button
                className="w-full mb-6"
                variant={'popular' in plan && plan.popular ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-trust-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {'limitations' in plan && plan.limitations?.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                    <X className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Pagamento sicuro con Stripe. Puoi richiedere il rimborso entro 14 giorni se non sei soddisfatto.
        </p>
      </div>
    </section>
  );
}

