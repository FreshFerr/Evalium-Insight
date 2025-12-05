/**
 * Excel Export Generator
 * Creates professional Excel reports using xlsx library
 */

import * as XLSX from 'xlsx';
import { FinancialStatement, Company } from '@prisma/client';
import { extractKPIs } from '@/lib/financial-logic/kpi';
import { BenchmarkResult } from '@/lib/financial-logic/benchmark';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export interface ExcelExportData {
  company: Company;
  statements: FinancialStatement[];
  benchmark?: BenchmarkResult;
}

/**
 * Generate Excel workbook with financial analysis
 */
export function generateExcelReport(data: ExcelExportData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary KPIs
  const summarySheet = createSummarySheet(data);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sintesi');

  // Sheet 2: Income Statement
  const incomeSheet = createIncomeStatementSheet(data.statements);
  XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Conto Economico');

  // Sheet 3: Balance Sheet
  const balanceSheet = createBalanceSheet(data.statements);
  XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Stato Patrimoniale');

  // Sheet 4: Benchmark (if available)
  if (data.benchmark) {
    const benchmarkSheet = createBenchmarkSheet(data.benchmark);
    XLSX.utils.book_append_sheet(workbook, benchmarkSheet, 'Benchmark');
  }

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

function createSummarySheet(data: ExcelExportData): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  // Header
  rows.push(['EVALIUM - Analisi Finanziaria']);
  rows.push([data.company.legalName]);
  rows.push([`Generato il: ${new Date().toLocaleDateString('it-IT')}`]);
  rows.push([]);

  // KPI Table
  rows.push(['KPI Principali', 'Valore', 'Anno']);
  rows.push([]);

  const latestStatement = data.statements[0];
  if (latestStatement) {
    const kpis = extractKPIs(latestStatement);
    
    rows.push(['Ricavi', kpis.revenue, kpis.fiscalYear]);
    rows.push(['EBITDA', kpis.ebitda, kpis.fiscalYear]);
    rows.push(['Margine EBITDA', `${(kpis.ebitdaMargin * 100).toFixed(1)}%`, kpis.fiscalYear]);
    rows.push(['Utile Netto', kpis.netIncome, kpis.fiscalYear]);
    rows.push(['Patrimonio Netto', kpis.equity, kpis.fiscalYear]);
    rows.push(['Totale Attivo', kpis.totalAssets, kpis.fiscalYear]);
    rows.push(['Totale Debiti', kpis.totalLiabilities, kpis.fiscalYear]);
    
    if (kpis.netDebt !== null) {
      rows.push(['Indebitamento Netto', kpis.netDebt, kpis.fiscalYear]);
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  sheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
  ];

  return sheet;
}

function createIncomeStatementSheet(statements: FinancialStatement[]): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = [];

  // Header row with years
  const headerRow = ['Conto Economico'];
  statements.forEach((s) => headerRow.push(s.fiscalYear.toString()));
  rows.push(headerRow);
  rows.push([]);

  // Data rows
  const metrics = [
    { key: 'revenue', label: 'Ricavi' },
    { key: 'costOfGoodsSold', label: 'Costo del Venduto' },
    { key: 'grossProfit', label: 'Margine Lordo' },
    { key: 'operatingCosts', label: 'Costi Operativi' },
    { key: 'ebitda', label: 'EBITDA' },
    { key: 'depreciation', label: 'Ammortamenti' },
    { key: 'ebit', label: 'EBIT' },
    { key: 'interestExpense', label: 'Oneri Finanziari' },
    { key: 'netIncome', label: 'Utile Netto' },
  ];

  metrics.forEach(({ key, label }) => {
    const row: (string | number | null)[] = [label];
    statements.forEach((s) => {
      const value = s[key as keyof FinancialStatement];
      row.push(value !== null && value !== undefined ? Number(value) : null);
    });
    rows.push(row);
  });

  // Add margin rows
  rows.push([]);
  const marginRow: (string | number | null)[] = ['Margine EBITDA %'];
  statements.forEach((s) => {
    marginRow.push(`${(Number(s.ebitdaMargin) * 100).toFixed(1)}%`);
  });
  rows.push(marginRow);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 20 }, ...statements.map(() => ({ wch: 15 }))];

  return sheet;
}

function createBalanceSheet(statements: FinancialStatement[]): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = [];

  // Header
  const headerRow = ['Stato Patrimoniale'];
  statements.forEach((s) => headerRow.push(s.fiscalYear.toString()));
  rows.push(headerRow);
  rows.push([]);

  // Assets
  rows.push(['ATTIVO']);
  const assetMetrics = [
    { key: 'cashAndEquivalents', label: 'Disponibilità Liquide' },
    { key: 'receivables', label: 'Crediti' },
    { key: 'inventory', label: 'Magazzino' },
    { key: 'currentAssets', label: 'Attivo Corrente' },
    { key: 'fixedAssets', label: 'Immobilizzazioni' },
    { key: 'totalAssets', label: 'TOTALE ATTIVO' },
  ];

  assetMetrics.forEach(({ key, label }) => {
    const row: (string | number | null)[] = [label];
    statements.forEach((s) => {
      const value = s[key as keyof FinancialStatement];
      row.push(value !== null && value !== undefined ? Number(value) : null);
    });
    rows.push(row);
  });

  rows.push([]);
  rows.push(['PASSIVO']);
  const liabilityMetrics = [
    { key: 'currentLiabilities', label: 'Passivo Corrente' },
    { key: 'longTermDebt', label: 'Debiti a Lungo Termine' },
    { key: 'totalLiabilities', label: 'Totale Passivo' },
    { key: 'equity', label: 'Patrimonio Netto' },
  ];

  liabilityMetrics.forEach(({ key, label }) => {
    const row: (string | number | null)[] = [label];
    statements.forEach((s) => {
      const value = s[key as keyof FinancialStatement];
      row.push(value !== null && value !== undefined ? Number(value) : null);
    });
    rows.push(row);
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 25 }, ...statements.map(() => ({ wch: 15 }))];

  return sheet;
}

function createBenchmarkSheet(benchmark: BenchmarkResult): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  rows.push(['Benchmark con Competitor']);
  rows.push([]);

  // Header
  const headerRow = ['Metrica', 'La tua azienda', 'Media competitor', 'Posizione'];
  rows.push(headerRow);
  rows.push([]);

  // Comparisons
  benchmark.comparisons.forEach((comp) => {
    rows.push([
      comp.metricLabel,
      comp.companyValue,
      comp.competitorAverage,
      comp.position === 'above' ? 'Sopra' : comp.position === 'below' ? 'Sotto' : 'In linea',
    ]);
  });

  rows.push([]);
  rows.push(['Competitor analizzati:']);
  benchmark.competitors.forEach((c) => {
    rows.push([c.name, c.kpis.revenue, c.kpis.ebitdaMargin * 100]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];

  return sheet;
}

/**
 * Get filename for the Excel report
 */
export function getExcelFilename(companyName: string): string {
  const safeName = companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const date = new Date().toISOString().split('T')[0];
  return `Evalium_${safeName}_${date}.xlsx`;
}

