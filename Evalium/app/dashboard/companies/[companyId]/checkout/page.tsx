import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { CheckoutClient } from './checkout-client';
import { getProductConfig } from '@/lib/payment/stripe';

interface CheckoutPageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ plan?: string }>;
}

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Completa il tuo acquisto',
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const session = await auth();
  const { companyId } = await params;
  const { plan } = await searchParams;

  if (!session?.user?.id) {
    redirect('/login');
  }

  const planType = plan || 'pro';
  const product = getProductConfig(planType);

  if (!product) {
    redirect(`/dashboard/companies/${companyId}`);
  }

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

  // Check for existing paid report
  const existingReport = await prisma.report.findFirst({
    where: {
      companyId,
      type: planType === 'pro' ? 'FULL_ANALYSIS' : 'BENCHMARK',
      status: 'PAID',
    },
  });

  if (existingReport) {
    redirect(`/dashboard/companies/${companyId}?already_purchased=true`);
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <CheckoutClient
        companyId={companyId}
        companyName={company.legalName}
        planType={planType}
        product={product}
      />
    </div>
  );
}


