'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { updateLeadStatus } from './actions';
import { useToast } from '@/components/ui/use-toast';
import { Phone, Mail, Building2, TrendingUp, Calendar } from 'lucide-react';
import { MAndALead, Company, FinancialStatement, User } from '@prisma/client';

type LeadWithRelations = MAndALead & {
  company: Company & {
    financialStatements: FinancialStatement[];
  };
  user: Pick<User, 'name' | 'email'>;
};

interface LeadsTableProps {
  leads: LeadWithRelations[];
  currentStatus?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'outline' }> = {
  NEW: { label: 'Nuovo', variant: 'default' },
  CONTACTED: { label: 'Contattato', variant: 'secondary' },
  SENT_TO_PARTNER: { label: 'Inviato a partner', variant: 'success' },
  CLOSED: { label: 'Chiuso', variant: 'outline' },
};

export function LeadsTable({ leads, currentStatus }: LeadsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  const handleFilterChange = (status: string) => {
    const url = new URL(window.location.href);
    if (status === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', status);
    }
    router.push(url.pathname + url.search);
  };

  const handleUpdateStatus = async () => {
    if (!selectedLead || !newStatus) return;

    setIsUpdating(true);
    const result = await updateLeadStatus(selectedLead.id, newStatus as MAndALead['status'], notes);
    setIsUpdating(false);

    if (result.success) {
      toast({
        title: 'Lead aggiornato',
        description: 'Lo stato del lead è stato aggiornato con successo.',
      });
      setSelectedLead(null);
      router.refresh();
    } else {
      toast({
        title: 'Errore',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={currentStatus || 'all'} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="NEW">Nuovi</SelectItem>
            <SelectItem value="CONTACTED">Contattati</SelectItem>
            <SelectItem value="SENT_TO_PARTNER">Inviati a partner</SelectItem>
            <SelectItem value="CLOSED">Chiusi</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-sm text-muted-foreground">
          {leads.length} lead{leads.length !== 1 && 's'}
        </p>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nessun lead</h3>
            <p className="text-muted-foreground">
              Non ci sono lead che corrispondono ai filtri selezionati.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const latestStatement = lead.company.financialStatements[0];
            const statusInfo = statusConfig[lead.status];
            const reasonData = lead.reason as { highlights?: string[]; revenue?: number; ebitda?: number } | null;

            return (
              <Card key={lead.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-evalium-100 flex items-center justify-center text-evalium-700 font-semibold">
                        {lead.company.legalName.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{lead.company.legalName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lead.user.name || lead.user.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusInfo?.variant || 'default'}>
                      {statusInfo?.label || lead.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Contatto</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${lead.userContactEmail}`} className="text-primary hover:underline">
                          {lead.userContactEmail}
                        </a>
                      </div>
                      {lead.userContactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${lead.userContactPhone}`} className="text-primary hover:underline">
                            {lead.userContactPhone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Richiesto il {formatDate(lead.createdAt)}
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Dati finanziari</h4>
                      {latestStatement ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Ricavi: </span>
                            <span className="font-medium">{formatCurrency(Number(latestStatement.revenue))}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">EBITDA: </span>
                            <span className="font-medium">{formatCurrency(Number(latestStatement.ebitda))}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Margine: </span>
                            <span className="font-medium">{(Number(latestStatement.ebitdaMargin) * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Score M&A: </span>
                            <span className="font-medium">{lead.maScore || '-'}/100</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Dati non disponibili</p>
                      )}
                    </div>
                  </div>

                  {/* Highlights */}
                  {reasonData?.highlights && reasonData.highlights.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Punti di interesse</h4>
                      <div className="flex flex-wrap gap-2">
                        {reasonData.highlights.map((h, i) => (
                          <Badge key={i} variant="secondary">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {lead.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Note</h4>
                      <p className="text-sm text-muted-foreground">{lead.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button onClick={() => {
                      setSelectedLead(lead);
                      setNewStatus(lead.status);
                      setNotes(lead.notes || '');
                    }}>
                      Gestisci
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestisci Lead</DialogTitle>
            <DialogDescription>
              Aggiorna lo stato e le note per {selectedLead?.company.legalName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Nuovo</SelectItem>
                  <SelectItem value="CONTACTED">Contattato</SelectItem>
                  <SelectItem value="SENT_TO_PARTNER">Inviato a partner</SelectItem>
                  <SelectItem value="CLOSED">Chiuso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note interne</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi note..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? 'Aggiornamento...' : 'Salva'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


