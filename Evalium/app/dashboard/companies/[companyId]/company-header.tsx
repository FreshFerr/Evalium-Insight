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
import { ArrowLeft, MoreHorizontal, RefreshCw, Trash2, Download } from 'lucide-react';
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

  const hasPaidReport = company.reports.some((r) => r.status === 'PAID');
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
            {hasPaidReport && <Badge variant="success">Pro</Badge>}
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
            Aggiorna dati
          </Button>

          {hasPaidReport && (
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Esporta
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
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
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

