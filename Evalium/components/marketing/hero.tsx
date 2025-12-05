import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, TrendingUp, Shield, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden hero-pattern">
      <div className="section-container py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Oltre 500 PMI italiane si fidano di noi
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
            Capisci il bilancio della tua azienda{' '}
            <span className="gradient-text">in modo semplice</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance">
            Evalium trasforma i numeri del tuo bilancio in consigli chiari e comprensibili. 
            Niente gergo finanziario, solo risposte concrete per far crescere la tua impresa.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="xl" asChild>
              <Link href="/register">
                Inizia gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="#come-funziona">Scopri come funziona</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-trust-600" />
              Dati al sicuro
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-evalium-600" />
              Analisi automatica
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-evalium-600" />
              Benchmark con competitor
            </div>
          </div>
        </div>

        {/* Hero Image/Illustration */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-evalium-100 to-evalium-50 rounded-2xl transform rotate-1" />
            
            {/* Mock Dashboard Preview */}
            <div className="relative bg-white rounded-2xl shadow-soft-lg border overflow-hidden">
              <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-muted-foreground">Dashboard Evalium</span>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Ricavi', value: '€3.5M', change: '+12%' },
                    { label: 'EBITDA', value: '€455K', change: '+8%' },
                    { label: 'Margine', value: '13%', change: '+2pp' },
                    { label: 'Score M&A', value: '72/100', change: 'Alto' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-slate-50 rounded-xl p-4"
                    >
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-trust-600">{stat.change}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-evalium-50 rounded-xl p-4 border border-evalium-100">
                  <p className="font-medium text-evalium-900 mb-2">
                    💡 Cosa significa per te
                  </p>
                  <p className="text-sm text-evalium-700">
                    La tua azienda sta crescendo bene! I ricavi sono aumentati del 12% rispetto all&apos;anno scorso 
                    e il margine operativo è sopra la media del settore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

