'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, TrendingUp, X, CheckCircle2, Phone, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createMAndALead } from '@/app/dashboard/admin/leads/actions';
import { logError } from '@/lib/logger';

interface MABannerProps {
  companyId: string;
  score: number;
  highlights: string[];
  summary: string;
}

export function MABanner({ companyId, score, highlights, summary }: MABannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  if (isDismissed) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    if (!consent) {
      toast({
        title: 'Consenso richiesto',
        description: 'Devi acconsentire al trattamento dei dati per continuare.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string | undefined;

    setIsSubmitting(true);

    try {
      const result = await createMAndALead({
        companyId,
        email,
        phone: phone || undefined,
        consent: true,
        score,
        highlights,
      });

      if (result.success) {
        setSubmitted(true);
        toast({
          title: 'Richiesta registrata!',
          description: 'Valuteremo i tuoi dati e, se il profilo è adatto, ti contatteremo per approfondire in modo riservato.',
        });
      } else {
        setFormError(result.error || 'Si è verificato un errore. Riprova.');
        toast({
          title: 'Errore',
          description: result.error || 'Si è verificato un errore. Riprova.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logError('M&A lead submission error', error);
      setFormError('Si è verificato un errore imprevisto. Riprova più tardi.');
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore imprevisto. Riprova più tardi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 relative">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-amber-900">
                  La tua azienda potrebbe interessare a investitori
                </h3>
                <Badge variant="outline" className="border-amber-400 text-amber-700">
                  Score: {score}/100
                </Badge>
              </div>

              <p className="text-amber-800 text-sm mb-4">
                In base ai numeri della tua azienda, potresti essere appetibile per 
                operazioni straordinarie (M&A, ingresso di un investitore, cessione di quote).
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-4">
                {highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full"
                  >
                    <TrendingUp className="h-3 w-3" />
                    {highlight}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setShowDialog(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Sì, voglio saperne di più
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDismissed(true)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Non sono interessato
                </Button>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-4 right-4 text-amber-400 hover:text-amber-600"
              aria-label="Chiudi banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* M&A Interest Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Richiesta registrata!</h3>
              <p className="text-muted-foreground">
                Valuteremo i tuoi dati e, se il profilo è adatto, ti contatteremo per approfondire in modo riservato.
              </p>
              <Button className="mt-6" onClick={() => setShowDialog(false)}>
                Chiudi
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Vuoi essere contattato?</DialogTitle>
                <DialogDescription>
                  Compila i tuoi dati e ti metteremo in contatto, in modo completamente 
                  riservato, con boutique di advisor M&A nostre partner.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="pl-10"
                        placeholder="mario@azienda.it"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono (opzionale)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="pl-10"
                        placeholder="+39 02 1234567"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm text-muted-foreground leading-tight cursor-pointer"
                    >
                      Acconsento a che i miei dati di contatto e le informazioni 
                      finanziarie dell&apos;azienda vengano condivisi con advisor M&A 
                      partner di Evalium per essere contattato.
                    </label>
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">
                      I tuoi dati saranno trattati con la massima riservatezza. 
                      Non vendiamo i tuoi dati e non li condivideremo senza il 
                      tuo esplicito consenso.
                    </AlertDescription>
                  </Alert>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    disabled={isSubmitting}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !consent}>
                    {isSubmitting ? 'Invio in corso...' : 'Invia richiesta'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
