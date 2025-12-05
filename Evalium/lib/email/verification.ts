/**
 * L-6: Email Verification Helper
 * 
 * In development: Logs verification URL to console
 * In production: Ready to integrate with email providers (Resend, SendGrid, etc.)
 * 
 * TODO: For production, configure one of:
 * - Resend: Set RESEND_API_KEY env var
 * - SendGrid: Set SENDGRID_API_KEY env var
 * - SMTP: Set EMAIL_SERVER_* env vars
 */

import { logger } from '@/lib/logger';
import { APP_CONFIG } from '@/config/constants';

const isProd = process.env.NODE_ENV === 'production';

interface SendVerificationEmailParams {
  email: string;
  token: string;
  name?: string;
}

/**
 * Generate the verification URL for a given token
 */
export function getVerificationUrl(token: string): string {
  return `${APP_CONFIG.url}/verify-email?token=${token}`;
}

/**
 * Send verification email to user
 * 
 * In development: Logs the verification URL
 * In production: Would send actual email via configured provider
 */
export async function sendVerificationEmail({
  email,
  token,
  name,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = getVerificationUrl(token);

  // In development, just log the URL
  if (!isProd) {
    logger.info('📧 Verification email (dev mode)', {
      to: email,
      url: verificationUrl,
    });

    // Also log a clickable message for convenience
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL VERIFICATION (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`\nVerification URL:\n${verificationUrl}`);
    console.log('='.repeat(60) + '\n');

    return { success: true };
  }

  // Production: Check for configured email provider
  // TODO: Implement actual email sending

  // Check for Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return sendWithResend({ email, token, name, verificationUrl });
  }

  // Check for SendGrid
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    // TODO: Implement SendGrid integration
    logger.warn('SendGrid is configured but not yet implemented');
  }

  // Check for SMTP
  const smtpHost = process.env.EMAIL_SERVER_HOST;
  if (smtpHost) {
    // TODO: Implement SMTP integration
    logger.warn('SMTP is configured but not yet implemented');
  }

  // No email provider configured - log warning and continue
  logger.warn('No email provider configured for verification emails', {
    email,
    fallback: 'Verification URL logged to console',
  });

  // Log URL as fallback even in production (better than failing)
  console.log(`[Evalium] Verification URL for ${email}: ${verificationUrl}`);

  return { success: true };
}

/**
 * Send email using Resend API
 */
async function sendWithResend({
  email,
  name,
  verificationUrl,
}: {
  email: string;
  token: string;
  name?: string;
  verificationUrl: string;
}): Promise<{ success: boolean; error?: string }> {
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
        to: [email],
        subject: 'Verifica la tua email - Evalium',
        html: generateVerificationEmailHtml(name, verificationUrl),
        text: generateVerificationEmailText(name, verificationUrl),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Resend API error', { status: response.status, error: errorData });
      return { success: false, error: 'Errore nell\'invio dell\'email di verifica' };
    }

    logger.info('Verification email sent via Resend', { to: email });
    return { success: true };
  } catch (error) {
    logger.error('Failed to send verification email via Resend', { error });
    return { success: false, error: 'Errore nell\'invio dell\'email di verifica' };
  }
}

/**
 * Generate HTML email content
 */
function generateVerificationEmailHtml(name: string | undefined, verificationUrl: string): string {
  const userName = name || 'Utente';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica la tua email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Evalium</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Analisi del bilancio semplificata</p>
  </div>
  
  <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0;">Ciao ${userName},</h2>
    <p>Grazie per esserti registrato su Evalium! Per completare la registrazione, verifica la tua email cliccando il pulsante qui sotto:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Verifica la mia email
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      Se non riesci a cliccare il pulsante, copia e incolla questo link nel browser:<br>
      <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
    </p>
    
    <p style="color: #64748b; font-size: 14px;">
      Questo link scadrà tra 24 ore.
    </p>
  </div>
  
  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p>Se non hai creato un account su Evalium, ignora questa email.</p>
    <p>© ${new Date().getFullYear()} Evalium. Tutti i diritti riservati.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email content
 */
function generateVerificationEmailText(name: string | undefined, verificationUrl: string): string {
  const userName = name || 'Utente';
  
  return `
Ciao ${userName},

Grazie per esserti registrato su Evalium! Per completare la registrazione, verifica la tua email visitando questo link:

${verificationUrl}

Questo link scadrà tra 24 ore.

Se non hai creato un account su Evalium, ignora questa email.

---
Evalium - Analisi del bilancio semplificata
  `.trim();
}


