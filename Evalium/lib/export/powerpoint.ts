/**
 * PowerPoint Export Generator
 * Creates professional PowerPoint presentations using PptxGenJS
 */

import PptxGenJS from 'pptxgenjs';
import { FinancialStatement, Company } from '@prisma/client';
import { extractKPIs } from '@/lib/financial-logic/kpi';
import { BenchmarkResult } from '@/lib/financial-logic/benchmark';
import { FinancialNarrative } from '@/lib/financial-logic/narrative';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export interface PowerPointExportData {
  company: Company;
  statements: FinancialStatement[];
  narrative: FinancialNarrative;
  benchmark?: BenchmarkResult;
}

// Brand colors
const COLORS = {
  primary: '0070c5',
  secondary: '064c84',
  accent: '22c55e',
  text: '1e293b',
  muted: '64748b',
  background: 'f8fafc',
  white: 'ffffff',
};

/**
 * Generate PowerPoint presentation with financial analysis
 */
export async function generatePowerPointReport(data: PowerPointExportData): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.title = `Analisi Finanziaria - ${data.company.legalName}`;
  pptx.author = 'Evalium';
  pptx.company = 'Evalium';
  pptx.subject = 'Analisi del bilancio aziendale';

  // Slide 1: Title
  createTitleSlide(pptx, data.company);

  // Slide 2: KPI Overview
  if (data.statements.length > 0) {
    createKPISlide(pptx, data.statements[0]);
  }

  // Slide 3: Strengths
  if (data.narrative.strengths.length > 0) {
    createStrengthsSlide(pptx, data.narrative.strengths);
  }

  // Slide 4: Weaknesses
  if (data.narrative.weaknesses.length > 0) {
    createWeaknessesSlide(pptx, data.narrative.weaknesses);
  }

  // Slide 5: Benchmark (if available)
  if (data.benchmark) {
    createBenchmarkSlide(pptx, data.benchmark);
  }

  // Slide 6: Recommendations
  if (data.benchmark?.summary.recommendations.length) {
    createRecommendationsSlide(pptx, data.benchmark.summary.recommendations);
  }

  // Generate buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer as Buffer;
}

function createTitleSlide(pptx: PptxGenJS, company: Company) {
  const slide = pptx.addSlide();
  
  // Background
  slide.background = { color: COLORS.primary };

  // Logo area (placeholder)
  slide.addText('EVALIUM', {
    x: 0.5,
    y: 0.5,
    w: 2,
    h: 0.5,
    color: COLORS.white,
    fontSize: 18,
    bold: true,
  });

  // Company name
  slide.addText(company.legalName, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    color: COLORS.white,
    fontSize: 36,
    bold: true,
  });

  // Subtitle
  slide.addText('Analisi Finanziaria', {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.5,
    color: COLORS.white,
    fontSize: 24,
  });

  // Date
  slide.addText(new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }), {
    x: 0.5,
    y: 5,
    w: 9,
    h: 0.4,
    color: COLORS.white,
    fontSize: 14,
  });
}

function createKPISlide(pptx: PptxGenJS, statement: FinancialStatement) {
  const slide = pptx.addSlide();
  const kpis = extractKPIs(statement);

  // Title
  slide.addText('Indicatori Chiave', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    color: COLORS.secondary,
    fontSize: 28,
    bold: true,
  });

  // Subtitle
  slide.addText(`Anno fiscale ${statement.fiscalYear}`, {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.4,
    color: COLORS.muted,
    fontSize: 14,
  });

  // KPI Cards
  const kpiData = [
    { label: 'Ricavi', value: formatCurrency(kpis.revenue) },
    { label: 'EBITDA', value: formatCurrency(kpis.ebitda) },
    { label: 'Margine EBITDA', value: formatPercentage(kpis.ebitdaMargin) },
    { label: 'Utile Netto', value: formatCurrency(kpis.netIncome) },
    { label: 'Patrimonio Netto', value: formatCurrency(kpis.equity) },
    { label: 'Totale Attivo', value: formatCurrency(kpis.totalAssets) },
  ];

  kpiData.forEach((kpi, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 0.5 + col * 3.2;
    const y = 1.5 + row * 1.8;

    // Card background
    slide.addShape('rect', {
      x,
      y,
      w: 3,
      h: 1.5,
      fill: { color: COLORS.background },
      line: { color: 'e2e8f0', width: 1 },
    });

    // Label
    slide.addText(kpi.label, {
      x,
      y: y + 0.2,
      w: 3,
      h: 0.4,
      color: COLORS.muted,
      fontSize: 12,
      align: 'center',
    });

    // Value
    slide.addText(kpi.value, {
      x,
      y: y + 0.6,
      w: 3,
      h: 0.6,
      color: COLORS.text,
      fontSize: 20,
      bold: true,
      align: 'center',
    });
  });
}

function createStrengthsSlide(pptx: PptxGenJS, strengths: string[]) {
  const slide = pptx.addSlide();

  // Title
  slide.addText('Punti di Forza', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    color: COLORS.accent,
    fontSize: 28,
    bold: true,
  });

  // Icon
  slide.addText('✓', {
    x: 0.5,
    y: 1.2,
    w: 0.5,
    h: 0.5,
    color: COLORS.accent,
    fontSize: 24,
  });

  // Strengths list
  strengths.forEach((strength, index) => {
    slide.addText(`• ${strength}`, {
      x: 0.5,
      y: 1.8 + index * 0.6,
      w: 9,
      h: 0.5,
      color: COLORS.text,
      fontSize: 18,
    });
  });
}

function createWeaknessesSlide(pptx: PptxGenJS, weaknesses: string[]) {
  const slide = pptx.addSlide();

  // Title
  slide.addText('Punti di Attenzione', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    color: 'f59e0b',
    fontSize: 28,
    bold: true,
  });

  // Weaknesses list
  weaknesses.forEach((weakness, index) => {
    slide.addText(`• ${weakness}`, {
      x: 0.5,
      y: 1.5 + index * 0.6,
      w: 9,
      h: 0.5,
      color: COLORS.text,
      fontSize: 18,
    });
  });
}

function createBenchmarkSlide(pptx: PptxGenJS, benchmark: BenchmarkResult) {
  const slide = pptx.addSlide();

  // Title
  slide.addText('Benchmark vs Competitor', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    color: COLORS.secondary,
    fontSize: 28,
    bold: true,
  });

  // Table data - convert to TableRow format
  const tableData: PptxGenJS.TableRow[] = [
    [
      { text: 'Metrica' },
      { text: 'La tua azienda' },
      { text: 'Media competitor' },
      { text: 'Posizione' },
    ],
    ...benchmark.comparisons.map((c) => [
      { text: c.metricLabel },
      {
        text:
          typeof c.companyValue === 'number' && c.metric !== 'ebitdaMargin'
            ? formatCurrency(c.companyValue)
            : formatPercentage(c.companyValue),
      },
      {
        text:
          typeof c.competitorAverage === 'number' && c.metric !== 'ebitdaMargin'
            ? formatCurrency(c.competitorAverage)
            : formatPercentage(c.competitorAverage),
      },
      { text: c.position === 'above' ? '↑ Sopra' : c.position === 'below' ? '↓ Sotto' : '= In linea' },
    ]),
  ];

  slide.addTable(tableData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    colW: [2.5, 2.2, 2.2, 2.1],
    border: { type: 'solid', color: 'e2e8f0' },
    fontFace: 'Arial',
    fontSize: 11,
    color: COLORS.text,
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
  });
}

function createRecommendationsSlide(pptx: PptxGenJS, recommendations: string[]) {
  const slide = pptx.addSlide();

  // Title
  slide.addText('Raccomandazioni', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    color: COLORS.primary,
    fontSize: 28,
    bold: true,
  });

  // Recommendations
  recommendations.forEach((rec, index) => {
    // Number circle
    slide.addShape('ellipse', {
      x: 0.5,
      y: 1.3 + index * 1,
      w: 0.4,
      h: 0.4,
      fill: { color: COLORS.primary },
    });

    slide.addText(`${index + 1}`, {
      x: 0.5,
      y: 1.3 + index * 1,
      w: 0.4,
      h: 0.4,
      color: COLORS.white,
      fontSize: 14,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Recommendation text
    slide.addText(rec, {
      x: 1.1,
      y: 1.3 + index * 1,
      w: 8.4,
      h: 0.5,
      color: COLORS.text,
      fontSize: 16,
      valign: 'middle',
    });
  });

  // Footer
  slide.addText('Generato da Evalium - evalium.it', {
    x: 0.5,
    y: 5,
    w: 9,
    h: 0.3,
    color: COLORS.muted,
    fontSize: 10,
    align: 'center',
  });
}

/**
 * Get filename for the PowerPoint report
 */
export function getPowerPointFilename(companyName: string): string {
  const safeName = companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const date = new Date().toISOString().split('T')[0];
  return `Evalium_${safeName}_${date}.pptx`;
}

