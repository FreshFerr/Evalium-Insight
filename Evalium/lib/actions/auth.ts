'use server';

import { hash } from 'bcryptjs';
import { signIn } from '@/lib/auth';
import prisma from '@/db';
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';
import { AuthError } from 'next-auth';
import { randomBytes, randomUUID } from 'crypto';
import { logger, logError } from '@/lib/logger';
import { sendVerificationEmail } from '@/lib/email/verification';
import { EMAIL_VERIFICATION_CONFIG } from '@/config/constants';

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Register a new user
 * L-6: Implements email verification flow
 */
export async function registerUser(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Dati non validi',
    };
  }

  const { name, email, password } = validated.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Esiste già un account con questa email',
      };
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // L-6: Create user with emailVerified = null (pending verification)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerified: null, // Will be set when email is verified
      },
    });

    // L-6: Generate verification token
    const verificationToken = randomUUID();
    const tokenExpiry = new Date(Date.now() + EMAIL_VERIFICATION_CONFIG.TOKEN_EXPIRY_MS);

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // L-6: Send verification email
    const emailResult = await sendVerificationEmail({
      email: email.toLowerCase(),
      token: verificationToken,
      name,
    });

    if (!emailResult.success) {
      logger.warn('Failed to send verification email, but user was created', {
        email: email.toLowerCase(),
        error: emailResult.error,
      });
    }

    // Return appropriate message based on verification requirement
    if (EMAIL_VERIFICATION_CONFIG.REQUIRE_EMAIL_VERIFICATION) {
      return {
        success: true,
        message: 'Account creato! Controlla la tua email per verificare l\'account prima di accedere.',
      };
    }

    return {
      success: true,
      message: 'Account creato con successo! Puoi ora accedere. Ti abbiamo inviato un\'email per verificare il tuo indirizzo.',
    };
  } catch (error) {
    logError('Registration error', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante la registrazione',
    };
  }
}

/**
 * Login with credentials
 * L-6: Enforces email verification if REQUIRE_EMAIL_VERIFICATION is true
 */
export async function loginWithCredentials(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email e password sono obbligatorie',
    };
  }

  // L-6: Check email verification if required
  if (EMAIL_VERIFICATION_CONFIG.REQUIRE_EMAIL_VERIFICATION) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { emailVerified: true },
    });

    if (user && !user.emailVerified) {
      return {
        success: false,
        error: 'Devi prima verificare la tua email. Controlla la posta in arrivo.',
      };
    }
  }

  try {
    await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    return {
      success: true,
      message: 'Accesso effettuato con successo',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'Email o password non corrette',
          };
        default:
          return {
            success: false,
            error: 'Si è verificato un errore durante l\'accesso',
          };
      }
    }
    throw error;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email'),
  };

  const validated = forgotPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Email non valida',
    };
  }

  const { email } = validated.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'Se l\'email esiste, riceverai un link per reimpostare la password',
      };
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

    // In production, send email here
    // For development, log the reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    logger.debug('Password reset link generated', { resetUrl });

    return {
      success: true,
      message: 'Se l\'email esiste, riceverai un link per reimpostare la password',
    };
  } catch (error) {
    logError('Password reset request error', error);
    return {
      success: false,
      error: 'Si è verificato un errore. Riprova più tardi.',
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    token: formData.get('token'),
  };

  const validated = resetPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Dati non validi',
    };
  }

  const { password, token } = validated.data;

  try {
    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return {
        success: false,
        error: 'Link non valido o scaduto',
      };
    }

    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return {
        success: false,
        error: 'Il link è scaduto. Richiedi un nuovo link.',
      };
    }

    // Update password
    const hashedPassword = await hash(password, 12);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return {
      success: true,
      message: 'Password reimpostata con successo! Puoi ora accedere.',
    };
  } catch (error) {
    logError('Password reset error', error);
    return {
      success: false,
      error: 'Si è verificato un errore. Riprova più tardi.',
    };
  }
}

