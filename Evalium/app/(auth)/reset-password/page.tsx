import { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reimposta Password',
  description: 'Crea una nuova password per il tuo account Evalium',
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Nuova password</h1>
        <p className="text-muted-foreground">
          Scegli una nuova password sicura per il tuo account
        </p>
      </div>
      <Suspense fallback={<div>Caricamento...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}


