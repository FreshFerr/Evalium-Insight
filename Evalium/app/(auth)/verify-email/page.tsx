import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/db';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

/**
 * L-6: Email Verification Page
 * 
 * Server component that:
 * - Reads token from search params
 * - Validates token exists and is not expired
 * - Marks user as verified if valid
 * - Shows appropriate success/error message in Italian
 */

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: 'Verifica Email',
  description: 'Verifica il tuo indirizzo email per accedere a Evalium',
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  // No token provided
  if (!token) {
    return (
      <VerificationResult
        success={false}
        title="Link non valido"
        message="Il link di verifica non contiene un token valido. Assicurati di aver copiato l'intero URL dall'email."
      />
    );
  }

  // Look up the verification token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  // Token not found
  if (!verificationToken) {
    return (
      <VerificationResult
        success={false}
        title="Link non valido"
        message="Questo link di verifica non è valido. Potrebbe essere già stato usato o non esistere."
      />
    );
  }

  // Token expired
  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: { token },
    }).catch(() => {
      // Ignore delete errors
    });

    return (
      <VerificationResult
        success={false}
        title="Link scaduto"
        message="Questo link di verifica è scaduto. Registrati di nuovo per ricevere un nuovo link."
      />
    );
  }

  // Token is valid - verify the user's email
  try {
    // Update user's emailVerified timestamp
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return (
      <VerificationResult
        success={true}
        title="Email verificata!"
        message="La tua email è stata verificata correttamente. Ora puoi accedere al tuo account."
      />
    );
  } catch {
    return (
      <VerificationResult
        success={false}
        title="Errore"
        message="Si è verificato un errore durante la verifica. Riprova più tardi."
      />
    );
  }
}

interface VerificationResultProps {
  success: boolean;
  title: string;
  message: string;
}

function VerificationResult({ success, title, message }: VerificationResultProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {success ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>

        <CardFooter className="flex justify-center pb-8">
          {success ? (
            <Button asChild>
              <Link href="/login">
                Accedi ora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/">Torna alla home</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Registrati</Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

