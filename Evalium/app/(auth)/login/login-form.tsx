'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Mail, Lock, Chrome } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setFormError('Email o password non corrette');
        } else if (result?.ok) {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch {
        setFormError('Si è verificato un errore. Riprova.');
      }
    });
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <Card className="border-0 shadow-soft-lg">
      <CardContent className="pt-6 space-y-6">
        {(error || formError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {formError || 'Si è verificato un errore durante l\'accesso'}
            </AlertDescription>
          </Alert>
        )}

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={handleGoogleLogin}
        >
          <Chrome className="mr-2 h-5 w-5" />
          Continua con Google
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

        {/* Credentials Login */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Password dimenticata?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11" isLoading={isPending}>
            Accedi
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t py-4">
        <p className="text-sm text-muted-foreground">
          Non hai un account?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Registrati gratis
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

