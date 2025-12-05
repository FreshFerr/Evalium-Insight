import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ArrowRight, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Le mie aziende',
  description: 'Gestisci le tue aziende su Evalium',
};

export default async function CompaniesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    include: {
      financialStatements: {
        orderBy: { fiscalYear: 'desc' },
        take: 1,
      },
      reports: {
        where: { status: 'PAID' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Le mie aziende</h1>
          <p className="text-muted-foreground mt-1">
            {companies.length === 0
              ? 'Aggiungi la tua prima azienda per iniziare'
              : `${companies.length} ${companies.length === 1 ? 'azienda' : 'aziende'} registrate`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi azienda
          </Link>
        </Button>
      </div>

      {/* Search (placeholder for future) */}
      {companies.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca azienda..."
            className="pl-10"
            disabled
          />
        </div>
      )}

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nessuna azienda</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Aggiungi la tua prima azienda per iniziare a capire i numeri del tuo bilancio
              </p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard/companies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi la prima azienda
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const latestStatement = company.financialStatements[0];
            const hasPaidReports = company.reports.length > 0;
            const ebitdaMargin = latestStatement?.ebitdaMargin
              ? Number(latestStatement.ebitdaMargin) * 100
              : null;

            return (
              <Card key={company.id} className="group hover:shadow-soft-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-xl bg-evalium-100 flex items-center justify-center text-evalium-700 font-bold text-lg">
                      {company.legalName.charAt(0)}
                    </div>
                    {hasPaidReports && (
                      <Badge variant="success">Pro</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4 group-hover:text-evalium-700 transition-colors">
                    {company.legalName}
                  </CardTitle>
                  <CardDescription>
                    {company.vatNumber || company.country}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {latestStatement ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ricavi {latestStatement.fiscalYear}</span>
                        <span className="font-medium">
                          {formatCurrency(Number(latestStatement.revenue))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EBITDA</span>
                        <span className="font-medium">
                          {formatCurrency(Number(latestStatement.ebitda))}
                        </span>
                      </div>
                      {ebitdaMargin !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margine</span>
                          <span className="font-medium">{ebitdaMargin.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Dati finanziari non disponibili
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <Link
                      href={`/dashboard/companies/${company.id}`}
                      className="inline-flex items-center text-sm font-medium text-evalium-600 hover:text-evalium-700"
                    >
                      Vedi analisi
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Company Card */}
          <Link href="/dashboard/companies/new">
            <Card className="h-full border-dashed hover:border-evalium-300 hover:bg-evalium-50/50 transition-colors cursor-pointer">
              <CardContent className="h-full flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium text-muted-foreground">
                  Aggiungi azienda
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}

