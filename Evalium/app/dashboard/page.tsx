import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Il tuo pannello di controllo Evalium',
};

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  // Fetch user's companies with latest financial data
  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    include: {
      financialStatements: {
        orderBy: { fiscalYear: 'desc' },
        take: 1,
      },
      reports: {
        where: { status: 'PAID' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const totalCompanies = await prisma.company.count({
    where: { userId: session.user.id },
  });

  const paidReports = await prisma.report.count({
    where: {
      company: { userId: session.user.id },
      status: 'PAID',
    },
  });

  // Calculate aggregate metrics
  const totalRevenue = companies.reduce((sum, company) => {
    const latestStatement = company.financialStatements[0];
    return sum + (latestStatement?.revenue ? Number(latestStatement.revenue) : 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Ciao, {session.user.name?.split(' ')[0] || 'utente'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ecco una panoramica delle tue aziende
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi azienda
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aziende</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompanies === 1 ? 'Azienda registrata' : 'Aziende registrate'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi totali</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue > 0 ? formatCompactNumber(totalRevenue) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Ultimo anno fiscale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report acquistati</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidReports}</div>
            <p className="text-xs text-muted-foreground">
              Analisi complete sbloccate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Le tue aziende</CardTitle>
            <CardDescription>
              {totalCompanies > 0
                ? 'Clicca su un\'azienda per vedere l\'analisi'
                : 'Inizia aggiungendo la tua prima azienda'}
            </CardDescription>
          </div>
          {totalCompanies > 5 && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/companies">Vedi tutte</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nessuna azienda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aggiungi la tua prima azienda per iniziare l&apos;analisi del bilancio
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/companies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi azienda
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => {
                const latestStatement = company.financialStatements[0];
                const hasPaidReport = company.reports.length > 0;

                return (
                  <Link
                    key={company.id}
                    href={`/dashboard/companies/${company.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-evalium-100 flex items-center justify-center text-evalium-700 font-semibold">
                        {company.legalName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-evalium-700">
                          {company.legalName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {latestStatement
                            ? `Ricavi ${latestStatement.fiscalYear}: ${formatCurrency(Number(latestStatement.revenue))}`
                            : 'Dati finanziari non disponibili'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {hasPaidReport && (
                        <Badge variant="success">Pro</Badge>
                      )}
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-evalium-700 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      {totalCompanies > 0 && (
        <Card className="bg-evalium-50 border-evalium-100">
          <CardHeader>
            <CardTitle className="text-evalium-900">💡 Suggerimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-evalium-800">
              Sblocca l&apos;analisi completa per confrontare la tua azienda con i competitor 
              e ricevere raccomandazioni concrete per migliorare i tuoi risultati.
            </p>
            <Button className="mt-4" variant="default" asChild>
              <Link href="#pricing">Scopri i piani Pro</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

