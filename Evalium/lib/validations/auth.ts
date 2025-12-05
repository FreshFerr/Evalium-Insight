import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
  password: z
    .string()
    .min(1, 'La password è obbligatoria')
    .min(6, 'La password deve avere almeno 6 caratteri'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Il nome è obbligatorio')
    .min(2, 'Il nome deve avere almeno 2 caratteri')
    .max(100, 'Il nome non può superare 100 caratteri'),
  email: z
    .string()
    .min(1, 'L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
  password: z
    .string()
    .min(1, 'La password è obbligatoria')
    .min(6, 'La password deve avere almeno 6 caratteri')
    .max(100, 'La password non può superare 100 caratteri'),
  confirmPassword: z.string().min(1, 'Conferma la password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'La password è obbligatoria')
    .min(6, 'La password deve avere almeno 6 caratteri')
    .max(100, 'La password non può superare 100 caratteri'),
  confirmPassword: z.string().min(1, 'Conferma la password'),
  token: z.string().min(1, 'Token non valido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


