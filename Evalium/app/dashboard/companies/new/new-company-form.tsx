'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Building2, Search, CheckCircle2 } from 'lucide-react';
import { createCompany } from '@/lib/actions/company';
import { COUNTRIES } from '@/config/constants';

type FormStep = 'input' | 'searching' | 'success' | 'error';

export function NewCompanyForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<FormStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStep('searching');
    setProgress(0);

    const formData = new FormData(e.currentTarget);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 90));
    }, 300);

    startTransition(async () => {
      try {
        const result = await createCompany(formData);

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success && result.data) {
          setCreatedCompanyId(result.data.companyId);
          setStep('success');
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push(`/dashboard/companies/${result.data!.companyId}`);
          }, 1500);
        } else {
          setError(result.error || 'Errore durante la creazione');
          setStep('error');
        }
      } catch {
        clearInterval(progressInterval);
        setError('Si è verificato un errore. Riprova.');
        setStep('error');
      }
    });
  };

  if (step === 'searching') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Search className="mx-auto h-12 w-12 text-evalium-600 animate-pulse" />
            <h3 className="mt-4 text-lg font-semibold">Stiamo cercando i dati...</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Recuperiamo le informazioni finanziarie dai registri ufficiali
            </p>
            <Progress value={progress} className="mt-6 max-w-xs mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-trust-600" />
            <h3 className="mt-4 text-lg font-semibold">Azienda aggiunta!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Abbiamo recuperato i dati finanziari. Ti stiamo reindirizzando all&apos;analisi...
            </p>
            <Progress value={100} className="mt-6 max-w-xs mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="legalName">Nome azienda *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="legalName"
                name="legalName"
                placeholder="Es. Rossi Meccanica S.r.l."
                required
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Inserisci la ragione sociale completa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatNumber">Partita IVA (opzionale)</Label>
            <Input
              id="vatNumber"
              name="vatNumber"
              placeholder="Es. IT12345678901"
            />
            <p className="text-xs text-muted-foreground">
              Se disponibile, ci aiuta a trovare i dati più rapidamente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Paese *</Label>
            <Select name="country" defaultValue="IT">
              <SelectTrigger>
                <SelectValue placeholder="Seleziona paese" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-evalium-50 p-4 border border-evalium-100">
            <p className="text-sm text-evalium-800">
              <strong>💡 Come funziona:</strong> Una volta inseriti i dati, 
              cercheremo automaticamente le informazioni finanziarie dagli 
              archivi pubblici delle Camere di Commercio.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annulla
          </Button>
          <Button type="submit" isLoading={isPending}>
            Cerca e aggiungi
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


