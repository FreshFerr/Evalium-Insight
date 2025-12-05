import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Marco R.',
    role: 'Imprenditore, settore manifatturiero',
    location: 'Bergamo',
    image: null,
    rating: 5,
    quote:
      'Finalmente capisco i numeri della mia azienda senza dover chiamare il commercialista ogni volta. Le spiegazioni sono chiarissime.',
  },
  {
    name: 'Giulia M.',
    role: 'CEO, azienda tech',
    location: 'Milano',
    image: null,
    rating: 5,
    quote:
      'Il benchmark con i competitor è stato illuminante. Ho scoperto che i miei margini erano sotto la media del settore e ho potuto intervenire.',
  },
  {
    name: 'Roberto B.',
    role: 'Titolare PMI',
    location: 'Torino',
    image: null,
    rating: 5,
    quote:
      'Avevo paura di leggere il bilancio. Con Evalium è tutto spiegato in modo semplice. Ora so esattamente dove migliorare.',
  },
  {
    name: 'Francesca L.',
    role: 'Amministratrice delegata',
    location: 'Roma',
    image: null,
    rating: 5,
    quote:
      'Il report in PowerPoint è perfetto per le riunioni con i soci. Professionale e comprensibile anche per chi non ha background finanziario.',
  },
  {
    name: 'Alessandro P.',
    role: 'Fondatore startup',
    location: 'Firenze',
    image: null,
    rating: 4,
    quote:
      'Mi ha aiutato a capire se eravamo pronti per cercare investitori. Lo score M&A è stato particolarmente utile.',
  },
  {
    name: 'Valentina C.',
    role: 'Direttrice commerciale',
    location: 'Bologna',
    image: null,
    rating: 5,
    quote:
      'Uso Evalium prima di ogni incontro con le banche. Avere i numeri chiari mi dà sicurezza nelle trattative.',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-slate-50">
      <div className="section-container">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cosa dicono i nostri clienti
          </h2>
          <p className="text-lg text-muted-foreground">
            Oltre 500 imprenditori italiani usano Evalium per capire i numeri della loro azienda
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-soft card-hover"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < testimonial.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-evalium-100 flex items-center justify-center text-evalium-700 font-semibold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Utilizzato da PMI di tutti i settori in Italia
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['Manifatturiero', 'Tecnologia', 'Servizi', 'Commercio', 'Edilizia'].map(
              (sector) => (
                <span key={sector} className="text-sm font-medium text-muted-foreground">
                  {sector}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

