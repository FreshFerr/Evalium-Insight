import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Come fate ad avere i dati del mio bilancio?',
    answer:
      'Recuperiamo i dati dai registri pubblici delle Camere di Commercio e altre fonti ufficiali. Basta inserire il nome della tua azienda o la Partita IVA e il sistema trova automaticamente i bilanci depositati.',
  },
  {
    question: 'I miei dati sono al sicuro?',
    answer:
      'Assolutamente sì. Utilizziamo crittografia SSL per tutti i dati in transito e i tuoi dati sono memorizzati in modo sicuro su server europei. Siamo pienamente conformi al GDPR e non condividiamo mai i tuoi dati con terze parti senza il tuo esplicito consenso.',
  },
  {
    question: 'Devo essere un esperto di finanza per usare Evalium?',
    answer:
      'No, anzi! Evalium è pensato proprio per chi non ha competenze finanziarie. Spieghiamo tutto in italiano semplice, senza gergo da commercialisti. Ogni termine tecnico ha una spiegazione chiara.',
  },
  {
    question: 'Cosa include il piano gratuito?',
    answer:
      'Il piano gratuito ti dà accesso all\'analisi di base del bilancio: i KPI principali (ricavi, EBITDA, margini) con spiegazioni semplificate e un\'identificazione dei punti di forza e debolezza della tua azienda. È perfetto per iniziare a capire i tuoi numeri.',
  },
  {
    question: 'Cosa ottengo con i piani a pagamento?',
    answer:
      'I piani Pro e Pro Plus sbloccano funzionalità avanzate: analisi dettagliata del bilancio, benchmark con i tuoi competitor, grafici di andamento su più anni, raccomandazioni concrete basate sui dati, e la possibilità di esportare report professionali in Excel e PowerPoint.',
  },
  {
    question: 'Come funziona il benchmark con i competitor?',
    answer:
      'Puoi selezionare fino a 3 competitor (o illimitati con Pro Plus) e noi recuperiamo i loro dati di bilancio. Ti mostriamo un confronto chiaro su tutti gli indicatori principali e ti spieghiamo dove ti posizioni rispetto al mercato.',
  },
  {
    question: 'Cos\'è lo "Score M&A" che vedo nella dashboard?',
    answer:
      'È un punteggio da 0 a 100 che indica quanto la tua azienda potrebbe essere interessante per operazioni straordinarie (fusioni, acquisizioni, ingresso di investitori). Si basa su fattori come ricavi, marginalità, crescita e solidità finanziaria.',
  },
  {
    question: 'Posso ottenere un rimborso se non sono soddisfatto?',
    answer:
      'Certo! Offriamo una garanzia di rimborso totale entro 14 giorni dall\'acquisto. Se non sei soddisfatto per qualsiasi motivo, ti restituiamo l\'intero importo senza fare domande.',
  },
  {
    question: 'Quanto tempo ci vuole per avere l\'analisi?',
    answer:
      'L\'analisi di base è istantanea: appena inserisci l\'azienda, vedi subito i risultati. Le analisi più approfondite e i benchmark richiedono qualche secondo in più, ma normalmente non più di 30 secondi.',
  },
  {
    question: 'Posso usare Evalium per più aziende?',
    answer:
      'Sì! Puoi aggiungere tutte le aziende che vuoi al tuo account. L\'analisi gratuita è disponibile per ogni azienda, mentre i report a pagamento sono acquistati singolarmente per ogni azienda.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="section-container">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Domande frequenti
          </h2>
          <p className="text-lg text-muted-foreground">
            Tutto quello che devi sapere su Evalium. Non trovi la risposta che cerchi?{' '}
            <a href="mailto:info.aivaluation@gmail.com" className="text-primary hover:underline">
              Contattaci
            </a>
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-xl border px-6 shadow-soft"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}


