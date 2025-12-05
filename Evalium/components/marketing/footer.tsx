import Link from 'next/link';
import { Shield, Lock, Award } from 'lucide-react';

const footerLinks = {
  prodotto: [
    { label: 'Come funziona', href: '#come-funziona' },
    { label: 'Prezzi', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  azienda: [
    { label: 'Chi siamo', href: '/about' },
    { label: 'Contatti', href: '/contact' },
    { label: 'Blog', href: '/blog' },
  ],
  legale: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Termini di Servizio', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Trust Bar */}
      <div className="border-b border-slate-800">
        <div className="section-container py-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-5 w-5 text-trust-500" />
              <span>Dati protetti con crittografia SSL</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-5 w-5 text-trust-500" />
              <span>GDPR compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-5 w-5 text-trust-500" />
              <span>Usato da +500 PMI italiane</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="section-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white mb-4">
              <svg
                className="w-8 h-8"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="2"
                  y="2"
                  width="28"
                  height="28"
                  rx="6"
                  className="fill-evalium-500"
                />
                <path
                  d="M8 12L12 8L20 8L24 12L24 20L20 24L12 24L8 20V12Z"
                  className="fill-white"
                />
                <path
                  d="M12 14H20M12 18H18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="stroke-evalium-500"
                />
              </svg>
              Evalium
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              Capisci i numeri della tua azienda in modo semplice. 
              Analisi del bilancio e raccomandazioni concrete per imprenditori.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Prodotto</h4>
            <ul className="space-y-2">
              {footerLinks.prodotto.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Azienda</h4>
            <ul className="space-y-2">
              {footerLinks.azienda.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legale</h4>
            <ul className="space-y-2">
              {footerLinks.legale.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Evalium. Tutti i diritti riservati.
          </p>
          <p className="text-sm text-slate-500">
            Made with ❤️ in Italia
          </p>
        </div>
      </div>
    </footer>
  );
}


