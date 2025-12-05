import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Pannello di amministrazione Evalium',
};

export default async function AdminDashboardPage() {
  // Fetch admin stats
  const [
    totalUsers,
    totalCompanies,
    totalReports,
    totalLeads,
    recentLeads,
    paidReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.report.count(),
    prisma.mAndALead.count(),
    prisma.mAndALead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { legalName: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.report.count({ where: { status: 'PAID' } }),
  ]);

  // Calculate revenue (simple estimate)
  const estimatedRevenue = paidReports * 49; // Average price

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica della piattaforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Utenti registrati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aziende</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Aziende analizzate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidReports}</div>
            <p className="text-xs text-muted-foreground">Report acquistati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead M&A</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">Lead raccolti</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lead M&A recenti</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/leads">
              Vedi tutti
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nessun lead M&A ancora.
            </p>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{lead.company.legalName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.user.name || lead.user.email} • {lead.userContactEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Score: {lead.maScore || '-'}/100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

