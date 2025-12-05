import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-evalium-600">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto a capire i numeri della tua azienda?
          </h2>
          <p className="text-lg text-evalium-100 mb-8">
            Inizia gratis oggi stesso. Nessuna carta di credito richiesta.
            In pochi minuti avrai un&apos;analisi chiara del tuo bilancio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              variant="secondary"
              className="bg-white text-evalium-700 hover:bg-evalium-50"
              asChild
            >
              <Link href="/register">
                Inizia gratis ora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link href="#pricing">Vedi i prezzi</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

