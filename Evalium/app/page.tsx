import { Metadata } from 'next';
import { HeroSection } from '@/components/marketing/hero';
import { HowItWorksSection } from '@/components/marketing/how-it-works';
import { PricingSection } from '@/components/marketing/pricing';
import { TestimonialsSection } from '@/components/marketing/testimonials';
import { FAQSection } from '@/components/marketing/faq';
import { CTASection } from '@/components/marketing/cta';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Evalium - Analisi Bilancio Aziendale Semplificata',
  description:
    'Evalium ti aiuta a capire i numeri della tua azienda in modo semplice. Analisi del bilancio, benchmark con competitor e raccomandazioni concrete per imprenditori non finanziari.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}

