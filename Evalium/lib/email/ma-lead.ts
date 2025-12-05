/**
 * M&A Lead Email Notification
 * Sends email notification to founder when a new M&A lead is created
 */

import { logger } from '@/lib/logger';
import { APP_CONFIG } from '@/config/constants';
import { formatCurrency, formatPercentage } from '@/lib/utils';

const isProd = process.env.NODE_ENV === 'production';

interface SendMAndALeadEmailParams {
  leadId: string;
  company: {
    legalName: string;
    country?: string;
    lastYearRevenue?: number | null;
    lastYearEbitda?: number | null;
    lastYearEbitdaMargin?: number | null;
    netDebt?: number | null;
  };
  user: {
    name?: string | null;
    email: string;
    phone?: string | null;
  };
  isPayingCustomer: boolean;
  reports: { type: string; status: string }[];
}

/**
 * Send M&A lead notification email to founder
 * 
 * In development: Logs the email content
 * In production: Sends via configured email provider (Resend)
 */
export async function sendMAndALeadEmail(params: SendMAndALeadEmailParams): Promise<void> {
  const notificationEmail = process.env.MNA_LEAD_NOTIFICATION_EMAIL;
  
  if (!notificationEmail) {
    logger.warn('MNA_LEAD_NOTIFICATION_EMAIL not set, skipping email notification', {
      leadId: params.leadId,
    });
    return;
  }

  const { leadId, company, user, isPayingCustomer, reports } = params;

  // Generate email content
  const subject = `Nuovo Lead M&A - ${company.legalName}`;
  const htmlContent = generateMAndALeadEmailHtml(params);
  const textContent = generateMAndALeadEmailText(params);

  // In development, just log the email
  if (!isProd) {
    logger.info('📧 M&A Lead Notification Email (dev mode)', {
      to: notificationEmail,
      leadId,
      company: company.legalName,
    });

    console.log('\n' + '='.repeat(60));
    console.log('📧 M&A LEAD NOTIFICATION (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${notificationEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${textContent}`);
    console.log('='.repeat(60) + '\n');

    return;
  }

  // Production: Send via Resend (or other configured provider)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    await sendWithResend({
      to: notificationEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });
    return;
  }

  // No email provider configured - log warning
  logger.warn('No email provider configured for M&A lead notifications', {
    leadId,
    fallback: 'Email content logged to console',
  });

  // Log email content as fallback
  console.log(`[Evalium] M&A Lead Notification for ${company.legalName}:`);
  console.log(`To: ${notificationEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`\n${textContent}`);
}

/**
 * Send email using Resend API
 */
async function sendWithResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || `Evalium <noreply@${new URL(APP_CONFIG.url).hostname}>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Resend API error for M&A lead notification', {
        status: response.status,
        error: errorData,
      });
      throw new Error('Failed to send M&A lead notification email');
    }

    logger.info('M&A lead notification email sent via Resend', { to });
  } catch (error) {
    logger.error('Failed to send M&A lead notification email via Resend', { error });
    throw error;
  }
}

/**
 * Generate HTML email content
 */
function generateMAndALeadEmailHtml(params: SendMAndALeadEmailParams): string {
  const { leadId, company, user, isPayingCustomer, reports } = params;

  const revenue = company.lastYearRevenue ? formatCurrency(company.lastYearRevenue) : 'N/A';
  const ebitda = company.lastYearEbitda ? formatCurrency(company.lastYearEbitda) : 'N/A';
  const ebitdaMargin = company.lastYearEbitdaMargin
    ? formatPercentage(company.lastYearEbitdaMargin)
    : 'N/A';
  const netDebt = company.netDebt !== null && company.netDebt !== undefined
    ? formatCurrency(company.netDebt)
    : 'N/A';

  const customerType = isPayingCustomer ? 'Cliente pagante' : 'Utente gratuito';
  const reportsList = reports.length > 0
    ? reports.map((r) => `- ${r.type} (${r.status})`).join('<br>')
    : 'Nessun report acquistato';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuovo Lead M&A</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Evalium</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Nuovo Lead M&A</p>
  </div>
  
  <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">Nuovo Lead M&A Ricevuto</h2>
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: #475569; font-size: 16px; margin-bottom: 10px;">Azienda</h3>
      <p style="font-size: 18px; font-weight: 600; margin: 0;">${company.legalName}</p>
      ${company.country ? `<p style="color: #64748b; margin: 5px 0 0;">Paese: ${company.country}</p>` : ''}
    </div>

    <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px;">
      <h3 style="color: #475569; font-size: 16px; margin-bottom: 10px;">Dati Finanziari (Ultimo Anno)</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Ricavi:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${revenue}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">EBITDA:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${ebitda}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Margine EBITDA:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${ebitdaMargin}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Indebitamento Netto:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${netDebt}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px;">
      <h3 style="color: #475569; font-size: 16px; margin-bottom: 10px;">Contatti Utente</h3>
      <p style="margin: 5px 0;"><strong>Nome:</strong> ${user.name || 'Non specificato'}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${user.email}" style="color: #2563eb;">${user.email}</a></p>
      ${user.phone ? `<p style="margin: 5px 0;"><strong>Telefono:</strong> <a href="tel:${user.phone}" style="color: #2563eb;">${user.phone}</a></p>` : ''}
    </div>

    <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px;">
      <h3 style="color: #475569; font-size: 16px; margin-bottom: 10px;">Profilo Cliente</h3>
      <p style="margin: 0;"><strong>Tipo:</strong> ${customerType}</p>
      <p style="margin: 10px 0 0;"><strong>Report acquistati:</strong></p>
      <div style="margin-top: 5px; color: #64748b;">
        ${reportsList}
      </div>
    </div>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        <strong>Lead ID:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${leadId}</code>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Evalium. Tutti i diritti riservati.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email content
 */
function generateMAndALeadEmailText(params: SendMAndALeadEmailParams): string {
  const { leadId, company, user, isPayingCustomer, reports } = params;

  const revenue = company.lastYearRevenue ? formatCurrency(company.lastYearRevenue) : 'N/A';
  const ebitda = company.lastYearEbitda ? formatCurrency(company.lastYearEbitda) : 'N/A';
  const ebitdaMargin = company.lastYearEbitdaMargin
    ? formatPercentage(company.lastYearEbitdaMargin)
    : 'N/A';
  const netDebt = company.netDebt !== null && company.netDebt !== undefined
    ? formatCurrency(company.netDebt)
    : 'N/A';

  const customerType = isPayingCustomer ? 'Cliente pagante' : 'Utente gratuito';
  const reportsList = reports.length > 0
    ? reports.map((r) => `  - ${r.type} (${r.status})`).join('\n')
    : '  Nessun report acquistato';

  return `
Nuovo Lead M&A Ricevuto

AZIENDA
${company.legalName}
${company.country ? `Paese: ${company.country}` : ''}

DATI FINANZIARI (Ultimo Anno)
Ricavi: ${revenue}
EBITDA: ${ebitda}
Margine EBITDA: ${ebitdaMargin}
Indebitamento Netto: ${netDebt}

CONTATTI UTENTE
Nome: ${user.name || 'Non specificato'}
Email: ${user.email}
${user.phone ? `Telefono: ${user.phone}` : ''}

PROFILO CLIENTE
Tipo: ${customerType}
Report acquistati:
${reportsList}

Lead ID: ${leadId}

---
Evalium - Analisi del bilancio semplificata
  `.trim();
}

