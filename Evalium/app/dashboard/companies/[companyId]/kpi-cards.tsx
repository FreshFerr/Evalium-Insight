'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { KPISet, getEbitdaMarginStatus, getGrowthStatus, KPIStatus } from '@/lib/financial-logic/kpi';
import { getKPIExplanation } from '@/lib/financial-logic/narrative';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  kpis: KPISet;
  previousKPIs: KPISet | null;
  fiscalYear: number;
}

interface KPICardData {
  key: string;
  label: string;
  value: string;
  change?: number;
  status?: KPIStatus;
}

function getStatusColor(status: KPIStatus): string {
  switch (status) {
    case 'excellent':
      return 'text-trust-600';
    case 'good':
      return 'text-trust-500';
    case 'fair':
      return 'text-amber-500';
    case 'poor':
      return 'text-red-500';
  }
}

function getStatusBg(status: KPIStatus): string {
  switch (status) {
    case 'excellent':
      return 'bg-trust-50';
    case 'good':
      return 'bg-trust-50/50';
    case 'fair':
      return 'bg-amber-50';
    case 'poor':
      return 'bg-red-50';
  }
}

export function KPICards({ kpis, previousKPIs, fiscalYear }: KPICardsProps) {
  const cards: KPICardData[] = [
    {
      key: 'revenue',
      label: 'Ricavi',
      value: formatCurrency(kpis.revenue),
      change: previousKPIs
        ? (kpis.revenue - previousKPIs.revenue) / previousKPIs.revenue
        : kpis.revenueGrowth ?? undefined,
      status: getGrowthStatus(
        previousKPIs
          ? (kpis.revenue - previousKPIs.revenue) / previousKPIs.revenue
          : kpis.revenueGrowth
      ),
    },
    {
      key: 'ebitda',
      label: 'EBITDA',
      value: formatCurrency(kpis.ebitda),
      change: previousKPIs
        ? (kpis.ebitda - previousKPIs.ebitda) / Math.abs(previousKPIs.ebitda)
        : undefined,
      status: getEbitdaMarginStatus(kpis.ebitdaMargin),
    },
    {
      key: 'ebitdaMargin',
      label: 'Margine EBITDA',
      value: formatPercentage(kpis.ebitdaMargin),
      change: previousKPIs
        ? kpis.ebitdaMargin - previousKPIs.ebitdaMargin
        : undefined,
      status: getEbitdaMarginStatus(kpis.ebitdaMargin),
    },
    {
      key: 'netIncome',
      label: 'Utile Netto',
      value: formatCurrency(kpis.netIncome),
      change: previousKPIs
        ? (kpis.netIncome - previousKPIs.netIncome) / Math.abs(previousKPIs.netIncome || 1)
        : undefined,
      status: kpis.netIncome > 0 ? 'good' : 'poor',
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Indicatori chiave ({fiscalYear})
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <KPICard key={card.key} card={card} />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function KPICard({ card }: { card: KPICardData }) {
  const explanation = getKPIExplanation(card.key);

  return (
    <Card className={cn('relative', card.status && getStatusBg(card.status))}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{explanation}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>

          {card.change !== undefined && (
            <ChangeIndicator change={card.change} isPercentagePoints={card.key === 'ebitdaMargin'} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChangeIndicator({
  change,
  isPercentagePoints = false,
}: {
  change: number;
  isPercentagePoints?: boolean;
}) {
  const isPositive = change > 0.001;
  const isNegative = change < -0.001;
  const isNeutral = !isPositive && !isNegative;

  const displayValue = isPercentagePoints
    ? `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}pp`
    : `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%`;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5',
        isPositive && 'bg-trust-100 text-trust-700',
        isNegative && 'bg-red-100 text-red-700',
        isNeutral && 'bg-slate-100 text-slate-600'
      )}
    >
      {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
      {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
      {isNeutral && <Minus className="h-3.5 w-3.5" />}
      <span>{displayValue}</span>
    </div>
  );
}

