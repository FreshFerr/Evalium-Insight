/**
 * Narrative Generation
 * Generates simple Italian explanations of financial data
 */

import { FinancialStatement } from '@prisma/client';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { extractKPIs, KPISet, KPIStatus, getEbitdaMarginStatus, getGrowthStatus, getDebtToEquityStatus } from './kpi';

export interface NarrativeSection {
  title: string;
  icon: string;
  content: string;
  status: 'positive' | 'neutral' | 'negative' | 'info';
}

export interface FinancialNarrative {
  summary: string;
  sections: NarrativeSection[];
  strengths: string[];
  weaknesses: string[];
}

/**
 * Generate a complete financial narrative in simple Italian
 */
export function generateNarrative(statements: FinancialStatement[]): FinancialNarrative {
  if (statements.length === 0) {
    return {
      summary: 'Non abbiamo ancora dati finanziari per questa azienda.',
      sections: [],
      strengths: [],
      weaknesses: [],
    };
  }

  // Sort by year descending
  const sorted = [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear);
  const latest = extractKPIs(sorted[0]);
  const previous = sorted[1] ? extractKPIs(sorted[1]) : null;

  const sections: NarrativeSection[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Section 1: Revenue Overview
  sections.push(generateRevenueSection(latest, previous));
  
  // Section 2: Profitability
  sections.push(generateProfitabilitySection(latest));
  
  // Section 3: Financial Structure
  sections.push(generateFinancialStructureSection(latest));

  // Collect strengths and weaknesses
  collectStrengthsAndWeaknesses(latest, previous, strengths, weaknesses);

  // Generate overall summary
  const summary = generateOverallSummary(latest, previous, strengths.length, weaknesses.length);

  return {
    summary,
    sections,
    strengths,
    weaknesses,
  };
}

function generateRevenueSection(latest: KPISet, previous: KPISet | null): NarrativeSection {
  const revenue = formatCurrency(latest.revenue);
  let content: string;
  let status: NarrativeSection['status'];

  if (previous) {
    const growth = (latest.revenue - previous.revenue) / previous.revenue;
    const growthPercent = (growth * 100).toFixed(1);
    
    if (growth > 0.10) {
      content = `Nel ${latest.fiscalYear} la tua azienda ha fatturato ${revenue}, con una crescita del ${growthPercent}% rispetto all'anno precedente. È un ottimo risultato che indica che il mercato sta rispondendo bene.`;
      status = 'positive';
    } else if (growth > 0) {
      content = `Nel ${latest.fiscalYear} la tua azienda ha fatturato ${revenue}, in crescita del ${growthPercent}% rispetto all'anno precedente. Una crescita positiva, anche se moderata.`;
      status = 'neutral';
    } else if (growth > -0.05) {
      content = `Nel ${latest.fiscalYear} i ricavi sono stati ${revenue}, sostanzialmente stabili rispetto all'anno precedente (${growthPercent}%).`;
      status = 'neutral';
    } else {
      content = `Nel ${latest.fiscalYear} i ricavi sono scesi a ${revenue} (${growthPercent}%). Potrebbe essere utile capire le cause e intervenire.`;
      status = 'negative';
    }
  } else {
    content = `Nel ${latest.fiscalYear} la tua azienda ha generato ricavi per ${revenue}. È il primo anno che analizziamo, quindi non possiamo ancora confrontare con il passato.`;
    status = 'info';
  }

  return {
    title: 'I tuoi ricavi',
    icon: '💰',
    content,
    status,
  };
}

function generateProfitabilitySection(latest: KPISet): NarrativeSection {
  const ebitda = formatCurrency(latest.ebitda);
  const marginPercent = (latest.ebitdaMargin * 100).toFixed(1);
  const marginStatus = getEbitdaMarginStatus(latest.ebitdaMargin);
  
  let content: string;
  let status: NarrativeSection['status'];

  if (marginStatus === 'excellent') {
    content = `L'EBITDA (quello che rimane dalle vendite dopo i costi operativi) è di ${ebitda}, pari al ${marginPercent}% dei ricavi. È un margine eccellente! Significa che controlli molto bene i costi e generi buona cassa.`;
    status = 'positive';
  } else if (marginStatus === 'good') {
    content = `L'EBITDA è di ${ebitda}, pari al ${marginPercent}% dei ricavi. È un buon margine, sopra la media del mercato. La tua azienda genera cassa in modo sano.`;
    status = 'positive';
  } else if (marginStatus === 'fair') {
    content = `L'EBITDA è di ${ebitda} (${marginPercent}% dei ricavi). Il margine è nella media: c'è spazio per migliorare l'efficienza operativa.`;
    status = 'neutral';
  } else {
    content = `L'EBITDA è di ${ebitda}, con un margine del ${marginPercent}%. È un margine basso che potrebbe indicare costi troppo alti o prezzi troppo bassi. Vale la pena analizzare la struttura dei costi.`;
    status = 'negative';
  }

  // Add net income context
  const netIncome = formatCurrency(latest.netIncome);
  if (latest.netIncome > 0) {
    content += ` L'utile netto finale è di ${netIncome}.`;
  } else {
    content += ` Nota: l'utile netto è negativo (${netIncome}), quindi ci sono costi (interessi, tasse, ammortamenti) che stanno erodendo il margine operativo.`;
  }

  return {
    title: 'La tua redditività',
    icon: '📊',
    content,
    status,
  };
}

function generateFinancialStructureSection(latest: KPISet): NarrativeSection {
  const equity = formatCurrency(latest.equity);
  const liabilities = formatCurrency(latest.totalLiabilities);
  
  let content: string;
  let status: NarrativeSection['status'];

  if (latest.equity <= 0) {
    content = `Attenzione: il patrimonio netto è negativo (${equity}). Significa che i debiti superano il valore delle attività. È una situazione da monitorare attentamente.`;
    status = 'negative';
  } else if (latest.debtToEquityRatio !== null) {
    const debtStatus = getDebtToEquityStatus(latest.debtToEquityRatio);
    const ratio = latest.debtToEquityRatio.toFixed(2);

    if (debtStatus === 'excellent') {
      content = `La struttura finanziaria è molto solida: hai ${equity} di patrimonio netto e ${liabilities} di debiti. Il rapporto debiti/patrimonio (${ratio}) è basso, il che ti dà molta flessibilità.`;
      status = 'positive';
    } else if (debtStatus === 'good') {
      content = `La struttura finanziaria è equilibrata: ${equity} di patrimonio netto contro ${liabilities} di debiti. Il rapporto (${ratio}) è nella norma per una PMI.`;
      status = 'positive';
    } else if (debtStatus === 'fair') {
      content = `Il patrimonio netto è di ${equity} e i debiti ammontano a ${liabilities}. Il rapporto debiti/patrimonio (${ratio}) è nella media, ma potresti considerare di ridurre l'indebitamento.`;
      status = 'neutral';
    } else {
      content = `L'indebitamento è elevato: ${liabilities} di debiti contro ${equity} di patrimonio netto. Un rapporto di ${ratio} indica che l'azienda è molto leveraggiata.`;
      status = 'negative';
    }
  } else {
    content = `Il patrimonio netto è di ${equity} e i debiti totali sono ${liabilities}. Complessivamente la struttura patrimoniale sembra bilanciata.`;
    status = 'info';
  }

  // Add net debt context if available
  if (latest.netDebt !== null) {
    const netDebt = formatCurrency(latest.netDebt);
    if (latest.netDebt < 0) {
      content += ` Buona notizia: hai più liquidità che debiti finanziari (posizione finanziaria netta positiva di ${formatCurrency(Math.abs(latest.netDebt))}).`;
    } else if (latest.netDebt > latest.ebitda * 3) {
      content += ` L'indebitamento finanziario netto (${netDebt}) è significativo rispetto all'EBITDA generato.`;
    }
  }

  return {
    title: 'La tua solidità finanziaria',
    icon: '🏛️',
    content,
    status,
  };
}

function collectStrengthsAndWeaknesses(
  latest: KPISet,
  previous: KPISet | null,
  strengths: string[],
  weaknesses: string[]
) {
  // Revenue
  if (previous) {
    const growth = (latest.revenue - previous.revenue) / previous.revenue;
    if (growth > 0.10) {
      strengths.push('Crescita dei ricavi a doppia cifra');
    } else if (growth < -0.05) {
      weaknesses.push('Ricavi in calo rispetto all\'anno precedente');
    }
  }

  // EBITDA Margin
  const marginStatus = getEbitdaMarginStatus(latest.ebitdaMargin);
  if (marginStatus === 'excellent' || marginStatus === 'good') {
    strengths.push('Buona marginalità operativa');
  } else if (marginStatus === 'poor') {
    weaknesses.push('Margine EBITDA sotto la media');
  }

  // Net Income
  if (latest.netIncome > 0) {
    if (latest.netIncome / latest.revenue > 0.08) {
      strengths.push('Eccellente utile netto');
    }
  } else {
    weaknesses.push('Utile netto negativo');
  }

  // Financial Structure
  if (latest.debtToEquityRatio !== null) {
    if (latest.debtToEquityRatio < 0.3) {
      strengths.push('Basso indebitamento');
    } else if (latest.debtToEquityRatio > 1.0) {
      weaknesses.push('Elevato rapporto debiti/patrimonio');
    }
  }

  // Cash position
  if (latest.netDebt !== null && latest.netDebt < 0) {
    strengths.push('Posizione di cassa positiva');
  }

  // Size
  if (latest.revenue >= 2_000_000) {
    strengths.push('Dimensione aziendale significativa');
  }
}

function generateOverallSummary(
  latest: KPISet,
  previous: KPISet | null,
  strengthsCount: number,
  weaknessesCount: number
): string {
  let sentiment: 'positive' | 'neutral' | 'negative';
  
  if (strengthsCount > weaknessesCount + 1) {
    sentiment = 'positive';
  } else if (weaknessesCount > strengthsCount + 1) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  const revenue = formatCurrency(latest.revenue);
  const year = latest.fiscalYear;

  if (sentiment === 'positive') {
    return `Nel complesso, i numeri del ${year} mostrano un'azienda in buona salute con ricavi di ${revenue}. I punti di forza superano le criticità.`;
  } else if (sentiment === 'negative') {
    return `I dati del ${year} (ricavi: ${revenue}) evidenziano alcune aree di attenzione. Consigliamo di analizzare i punti deboli per intervenire.`;
  } else {
    return `I numeri del ${year} (ricavi: ${revenue}) mostrano un quadro equilibrato, con alcuni punti di forza e alcune aree di miglioramento.`;
  }
}

/**
 * Generate a tooltip explanation for a KPI
 */
export function getKPIExplanation(kpiKey: string): string {
  const explanations: Record<string, string> = {
    revenue: 'I ricavi sono il totale delle vendite. Sono i soldi che entrano dalla vendita di prodotti o servizi.',
    ebitda: 'L\'EBITDA è il guadagno operativo prima di interessi, tasse, ammortamenti. Indica quanto l\'azienda guadagna dalle attività principali.',
    ebitdaMargin: 'Il margine EBITDA indica quale percentuale dei ricavi diventa guadagno operativo. Più alto = meglio controlli i costi.',
    netIncome: 'L\'utile netto è quello che rimane dopo aver pagato tutto: costi, interessi, tasse. È il guadagno finale.',
    equity: 'Il patrimonio netto è il valore che appartiene ai soci. È la differenza tra quello che possiedi e quello che devi.',
    totalAssets: 'Le attività totali sono tutto quello che l\'azienda possiede: soldi, crediti, macchinari, immobili.',
    totalLiabilities: 'I debiti totali sono tutto quello che l\'azienda deve: a banche, fornitori, fisco.',
    netDebt: 'L\'indebitamento netto sono i debiti finanziari meno la liquidità disponibile.',
    revenueGrowth: 'La crescita dei ricavi indica quanto sono aumentate le vendite rispetto all\'anno prima.',
    debtToEquityRatio: 'Il rapporto debiti/patrimonio indica quanti debiti hai per ogni euro di capitale proprio.',
  };

  return explanations[kpiKey] || 'Indicatore finanziario';
}


