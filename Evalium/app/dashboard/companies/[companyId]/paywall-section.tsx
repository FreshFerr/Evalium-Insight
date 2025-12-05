import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, BarChart3, FileText, Users, Download, ArrowRight, Check } from 'lucide-react';
import { PRICING_PLANS } from '@/config/constants';

interface PaywallSectionProps {
  companyId: string;
  companyName: string;
}

const proFeatures = [
  {
    icon: BarChart3,
    title: 'Analisi dettagliata del bilancio',
    description: 'Grafici di andamento su più anni con trend e previsioni',
  },
  {
    icon: Users,
    title: 'Benchmark con 3 competitor',
    description: 'Confronta la tua azienda con i concorrenti del settore',
  },
  {
    icon: FileText,
    title: 'Raccomandazioni data-driven',
    description: 'Consigli concreti basati sui tuoi numeri reali',
  },
  {
    icon: Download,
    title: 'Export in Excel',
    description: 'Scarica i dati in formato professionale',
  },
];

export function PaywallSection({ companyId, companyName }: PaywallSectionProps) {
  return (
    <div className="relative">
      {/* Blur overlay effect */}
      <div className="absolute inset-x-0 -top-20 h-20 bg-gradient-to-b from-transparent to-slate-50 pointer-events-none" />

      <Card className="border-evalium-200 bg-gradient-to-br from-white to-evalium-50/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-evalium-100 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-evalium-600" />
          </div>
          <CardTitle className="text-2xl">Sblocca l&apos;analisi completa</CardTitle>
          <p className="text-muted-foreground mt-2">
            Hai visto l&apos;analisi di base. Passa a Pro per ottenere insights più profondi 
            e confrontare <strong>{companyName}</strong> con i competitor.
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Features Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {proFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-3 p-4 rounded-lg bg-white border"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-evalium-100 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-evalium-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pro Plan */}
            <div className="rounded-xl border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{PRICING_PLANS.PRO.name}</h3>
                <Badge>Consigliato</Badge>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">€{PRICING_PLANS.PRO.price}</span>
                <span className="text-muted-foreground">/report</span>
              </div>
              <ul className="space-y-2 mb-6">
                {PRICING_PLANS.PRO.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-trust-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" asChild>
                <Link href={`/dashboard/companies/${companyId}/checkout?plan=pro`}>
                  Sblocca analisi Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Pro Plus Plan */}
            <div className="rounded-xl border-2 border-evalium-500 bg-white p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-evalium-600">Più completo</Badge>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{PRICING_PLANS.PRO_PLUS.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">€{PRICING_PLANS.PRO_PLUS.price}</span>
                <span className="text-muted-foreground">/report</span>
              </div>
              <ul className="space-y-2 mb-6">
                {PRICING_PLANS.PRO_PLUS.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-trust-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/companies/${companyId}/checkout?plan=pro_plus`}>
                  Sblocca Pro Plus
                </Link>
              </Button>
            </div>
          </div>

          {/* Trust elements */}
          <p className="text-center text-sm text-muted-foreground">
            Pagamento sicuro con Stripe • Rimborso garantito entro 14 giorni
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

