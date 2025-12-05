import { Metadata } from 'next';
import prisma from '@/db';
import { LeadsTable } from './leads-table';

export const metadata: Metadata = {
  title: 'Lead M&A',
  description: 'Gestione lead M&A',
};

interface LeadsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { status } = await searchParams;
  
  const leads = await prisma.mAndALead.findMany({
    where: status ? { status: status as 'NEW' | 'CONTACTED' | 'SENT_TO_PARTNER' | 'CLOSED' } : undefined,
    include: {
      company: {
        include: {
          financialStatements: {
            orderBy: { fiscalYear: 'desc' },
            take: 1,
          },
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lead M&A</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci i lead interessati a operazioni straordinarie
        </p>
      </div>

      <LeadsTable leads={leads} currentStatus={status} />
    </div>
  );
}


