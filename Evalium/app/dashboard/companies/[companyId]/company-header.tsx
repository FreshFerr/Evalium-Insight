'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, MoreHorizontal, RefreshCw, Trash2, Download, FileSpreadsheet, Presentation, Loader2 } from 'lucide-react';
import { deleteCompany, refreshCompanyFinancials } from '@/lib/actions/company';
import { useToast } from '@/components/ui/use-toast';
import { Company, FinancialStatement, Report } from '@prisma/client';

interface CompanyHeaderProps {
  company: Company & {
    financialStatements: FinancialStatement[];
    reports: Report[];
  };
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // M-2: Loading states for export
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPowerPoint, setIsExportingPowerPoint] = useState(false);

  const hasPaidReport = company.reports.some((r) => r.status === 'PAID');
  const hasProPlus = company.reports.some((r) => r.status === 'PAID' && r.type === 'BENCHMARK');
  const latestYear = company.financialStatements[0]?.fiscalYear;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await refreshCompanyFinancials(company.id);
    setIsRefreshing(false);

    if (result.success) {
      toast({
        title: 'Dati aggiornati',
        description: 'I dati finanziari sono stati aggiornati con successo.',
        variant: 'default',
      });
      router.refresh();
    } else {
      toast({
        title: 'Errore',
        description: result.error || 'Impossibile aggiornare i dati.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCompany(company.id);
    setIsDeleting(false);

    if (result.success) {
      toast({
        title: 'Azienda eliminata',
        description: `${company.legalName} è stata eliminata.`,
      });
      router.push('/dashboard/companies');
    } else {
      toast({
        title: 'Errore',
        description: result.error || 'Impossibile eliminare l\'azienda.',
        variant: 'destructive',
      });
    }
  };

  // M-2: Export handlers with loading states
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const response = await fetch(`/api/export/excel?companyId=${company.id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante l\'esportazione');
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Evalium_${company.legalName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export completato',
        description: 'Il file Excel è stato scaricato.',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile esportare in Excel.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPowerPoint = async () => {
    setIsExportingPowerPoint(true);
    try {
      const response = await fetch(`/api/export/powerpoint?companyId=${company.id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante l\'esportazione');
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Evalium_${company.legalName.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export completato',
        description: 'La presentazione PowerPoint è stata scaricata.',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile esportare in PowerPoint.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPowerPoint(false);
    }
  };

  const isExporting = isExportingExcel || isExportingPowerPoint;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/companies"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle aziende
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{company.legalName}</h1>
            {hasProPlus && <Badge variant="success">Pro Plus</Badge>}
            {hasPaidReport && !hasProPlus && <Badge variant="success">Pro</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">
            {company.vatNumber && <span>{company.vatNumber} • </span>}
            {company.country}
            {latestYear && <span> • Dati al {latestYear}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Aggiornamento...' : 'Aggiorna dati'}
          </Button>

          {/* M-2: Export dropdown with loading states */}
          {hasPaidReport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isExporting ? 'Preparazione file...' : 'Esporta'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                >
                  {isExportingExcel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  {isExportingExcel ? 'Generazione Excel...' : 'Esporta in Excel'}
                </DropdownMenuItem>
                {hasProPlus && (
                  <DropdownMenuItem 
                    onClick={handleExportPowerPoint}
                    disabled={isExportingPowerPoint}
                  >
                    {isExportingPowerPoint ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Presentation className="mr-2 h-4 w-4" />
                    )}
                    {isExportingPowerPoint ? 'Generazione PowerPoint...' : 'Esporta in PowerPoint'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Aggiorna dati
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina azienda
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare <strong>{company.legalName}</strong>. 
              Questa azione non può essere annullata e tutti i dati associati 
              (report, analisi) verranno persi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminazione in corso...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
