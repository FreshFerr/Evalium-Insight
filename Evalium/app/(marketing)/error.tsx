'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * M-1: Error boundary for the marketing segment
 * Catches unhandled errors and shows a user-friendly message in Italian
 */
export default function MarketingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Marketing page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Qualcosa è andato storto</h1>
        <p className="text-muted-foreground mb-6">
          Si è verificato un errore inatteso. Riprova più tardi o torna alla homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Torna alla homepage
            </Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Codice errore: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

