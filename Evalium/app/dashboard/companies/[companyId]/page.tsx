import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { CompanyHeader } from './company-header';
import { KPICards } from './kpi-cards';
import { NarrativeSection } from './narrative-section';
import { MABanner } from './ma-banner';
import { PaywallSection } from './paywall-section';
import { generateNarrative } from '@/lib/financial-logic/narrative';
import { calculateMAScore } from '@/lib/financial-logic/ma-scoring';
import { extractKPIs } from '@/lib/financial-logic/kpi';

interface CompanyPageProps {
  params: Promise<{ companyId: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { legalName: true },
  });

  return {
    title: company?.legalName || 'Azienda',
    description: `Analisi finanziaria di ${company?.legalName}`,
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const session = await auth();
  const { companyId } = await params;

  if (!session?.user?.id) {
    return null;
  }

  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      userId: session.user.id,
    },
    include: {
      financialStatements: {
        orderBy: { fiscalYear: 'desc' },
      },
      reports: true,
    },
  });

  if (!company) {
    notFound();
  }

  const statements = company.financialStatements;
  const hasPaidReport = company.reports.some(
    (r) => r.status === 'PAID' && (r.type === 'FULL_ANALYSIS' || r.type === 'BENCHMARK')
  );

  // Generate analysis
  const narrative = generateNarrative(statements);
  const maScore = calculateMAScore(statements);
  
  // Get latest KPIs
  const latestKPIs = statements[0] ? extractKPIs(statements[0]) : null;
  const previousKPIs = statements[1] ? extractKPIs(statements[1]) : null;

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <CompanyHeader company={company} />

      {/* M&A Banner (if eligible) */}
      {maScore.isEligible && (
        <MABanner
          companyId={company.id}
          score={maScore.score}
          highlights={maScore.highlights}
          summary={maScore.summary}
        />
      )}

      {/* KPI Cards */}
      {latestKPIs && (
        <KPICards
          kpis={latestKPIs}
          previousKPIs={previousKPIs}
          fiscalYear={statements[0].fiscalYear}
        />
      )}

      {/* Free Narrative Analysis */}
      <NarrativeSection narrative={narrative} />

      {/* Paywall for Advanced Features */}
      {!hasPaidReport && (
        <PaywallSection companyId={company.id} companyName={company.legalName} />
      )}
    </div>
  );
}


