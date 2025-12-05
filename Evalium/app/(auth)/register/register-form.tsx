'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Mail, Lock, User, Chrome } from 'lucide-react';
import { registerUser } from '@/lib/actions/auth';

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!acceptedTerms) {
      setError('Devi accettare i termini e le condizioni per registrarti');
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerUser(formData);

      if (result.success) {
        setSuccess(result.message || 'Account creato con successo!');
        // Auto login after successful registration
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 1500);
      } else {
        setError(result.error || 'Errore durante la registrazione');
      }
    });
  };

  const handleGoogleRegister = () => {
    signIn('google', { callbackUrl: '/dashboard' });
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

        {/* Google Register */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={handleGoogleRegister}
        >
          <Chrome className="mr-2 h-5 w-5" />
          Registrati con Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              oppure
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome e Cognome</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Mario Rossi"
                required
                className="pl-10"
                autoComplete="name"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10"
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimo 6 caratteri
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                className="pl-10"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-tight cursor-pointer"
            >
              Accetto i{' '}
              <Link href="/terms" className="text-primary hover:underline">
                termini di servizio
              </Link>{' '}
              e la{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>
            </label>
          </div>

          <Button type="submit" className="w-full h-11" isLoading={isPending}>
            Crea account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-4">
        <p className="text-sm text-muted-foreground">
          Hai già un account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Accedi
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

