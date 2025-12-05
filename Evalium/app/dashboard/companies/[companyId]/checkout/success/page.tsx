import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { retrieveSession } from '@/lib/payment/stripe';

interface SuccessPageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export const metadata: Metadata = {
  title: 'Pagamento completato',
  description: 'Il tuo pagamento è stato elaborato con successo',
};

export default async function CheckoutSuccessPage({ params, searchParams }: SuccessPageProps) {
  const session = await auth();
  const { companyId } = await params;
  const { session_id } = await searchParams;

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session_id) {
    redirect(`/dashboard/companies/${companyId}`);
  }

  // Verify the company belongs to the user
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      userId: session.user.id,
    },
    select: {
      id: true,
      legalName: true,
    },
  });

  if (!company) {
    notFound();
  }

  // Verify the Stripe session
  try {
    const stripeSession = await retrieveSession(session_id);
    
    if (stripeSession.payment_status !== 'paid') {
      redirect(`/dashboard/companies/${companyId}?payment_pending=true`);
    }

    // Update report and purchase if not already done by webhook
    const reportId = stripeSession.metadata?.reportId;
    if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'PAID' },
      });

      await prisma.purchase.updateMany({
        where: { reportId },
        data: {
          stripeCheckoutSessionId: session_id,
          status: 'PAID',
        },
      });
    }
  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    // Continue anyway - webhook might have already processed this
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-trust-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-trust-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Pagamento completato!</h1>
          <p className="text-muted-foreground mb-6">
            Grazie per l&apos;acquisto. Ora hai accesso all&apos;analisi completa di{' '}
            <strong>{company.legalName}</strong>.
          </p>

          <Button asChild size="lg">
            <Link href={`/dashboard/companies/${companyId}`}>
              Vai all&apos;analisi completa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            Riceverai una email di conferma con la ricevuta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

