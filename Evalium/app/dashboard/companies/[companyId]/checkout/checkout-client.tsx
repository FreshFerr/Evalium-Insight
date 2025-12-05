'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Check, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { createReportCheckout } from '@/lib/actions/payment';
import { ProductConfig } from '@/lib/payment/stripe';

interface CheckoutClientProps {
  companyId: string;
  companyName: string;
  planType: string;
  product: ProductConfig;
}

export function CheckoutClient({
  companyId,
  companyName,
  planType,
  product,
}: CheckoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = () => {
    setError(null);

    startTransition(async () => {
      const result = await createReportCheckout(companyId, planType);

      if (result.success && result.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error || 'Errore durante il checkout');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/companies/${companyId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Torna all&apos;analisi
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Order Summary */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-evalium-100 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-evalium-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Per: {companyName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">€{product.amount / 100}</p>
                  <p className="text-sm text-muted-foreground">IVA inclusa</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Cosa include:</h4>
                <ul className="space-y-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-trust-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Totale</span>
                <span>€{product.amount / 100}</span>
              </div>

              <Button
                onClick={handleCheckout}
                isLoading={isPending}
                className="w-full h-12"
                size="lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Procedi al pagamento
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Pagamento sicuro con Stripe
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Elements */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">Garanzie</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-trust-600 mt-0.5" />
                  <span>Rimborso completo entro 14 giorni se non sei soddisfatto</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-trust-600 mt-0.5" />
                  <span>Accesso immediato al report dopo il pagamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-trust-600 mt-0.5" />
                  <span>Dati trattati in modo sicuro e conforme al GDPR</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">Hai domande?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Contattaci a{' '}
                <a
                  href="mailto:supporto@evalium.it"
                  className="text-primary hover:underline"
                >
                  supporto@evalium.it
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

