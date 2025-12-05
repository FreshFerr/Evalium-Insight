import { Building2, BarChart3, Lightbulb, FileText } from 'lucide-react';

const steps = [
  {
    icon: Building2,
    title: 'Inserisci la tua azienda',
    description:
      'Basta il nome o la Partita IVA. Recuperiamo automaticamente i dati del bilancio dagli archivi ufficiali.',
  },
  {
    icon: BarChart3,
    title: 'Analisi automatica',
    description:
      'In pochi secondi calcoliamo tutti gli indicatori chiave: ricavi, EBITDA, margini, indebitamento e molto altro.',
  },
  {
    icon: Lightbulb,
    title: 'Spiegazioni chiare',
    description:
      'Ti spieghiamo cosa significano i numeri in italiano semplice. Niente gergo da commercialista.',
  },
  {
    icon: FileText,
    title: 'Raccomandazioni concrete',
    description:
      'Ricevi consigli pratici basati sui dati. Confronta la tua azienda con i competitor del settore.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="come-funziona" className="py-20 lg:py-28 bg-slate-50">
      <div className="section-container">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Come funziona Evalium
          </h2>
          <p className="text-lg text-muted-foreground">
            Quattro semplici passi per capire la salute finanziaria della tua azienda
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connection line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-evalium-200 to-evalium-100" />
              )}

              <div className="bg-white rounded-2xl p-6 shadow-soft card-hover h-full">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-evalium-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 bg-evalium-100 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-evalium-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

