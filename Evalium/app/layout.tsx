import type { Metadata, Viewport } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Evalium - Analisi Bilancio Aziendale Semplificata',
    template: '%s | Evalium',
  },
  description:
    'Evalium ti aiuta a capire i numeri della tua azienda in modo semplice. Analisi del bilancio, benchmark con competitor e raccomandazioni concrete per imprenditori.',
  keywords: [
    'analisi bilancio',
    'analisi aziendale',
    'benchmark competitor',
    'PMI italiane',
    'EBITDA',
    'analisi finanziaria',
    'business intelligence',
  ],
  authors: [{ name: 'Evalium' }],
  creator: 'Evalium',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/site.webmanifest',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://evalium.it',
    siteName: 'Evalium',
    title: 'Evalium - Analisi Bilancio Aziendale Semplificata',
    description:
      'Evalium ti aiuta a capire i numeri della tua azienda in modo semplice. Analisi del bilancio, benchmark con competitor e raccomandazioni concrete per imprenditori.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evalium - Analisi Bilancio Aziendale Semplificata',
    description:
      'Evalium ti aiuta a capire i numeri della tua azienda in modo semplice.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}


