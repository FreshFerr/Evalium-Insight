'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '@/lib/actions/auth';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await requestPasswordReset(formData);

      if (result.success) {
        setSuccess(result.message || 'Email inviata!');
      } else {
        setError(result.error || 'Errore durante l\'invio');
      }
    });
  };

  return (
    <Card className="border-0 shadow-soft-lg">
      <CardContent className="pt-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mario@azienda.it"
                required
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11" isLoading={isPending}>
            Invia link di recupero
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-4">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna al login
        </Link>
      </CardFooter>
    </Card>
  );
}

