import { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Recupera Password',
  description: 'Recupera la tua password di accesso a Evalium',
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Password dimenticata?</h1>
        <p className="text-muted-foreground">
          Inserisci la tua email e ti invieremo un link per reimpostare la password
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

