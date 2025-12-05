import { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Accedi al tuo account Evalium per analizzare i dati della tua azienda',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Bentornato</h1>
        <p className="text-muted-foreground">
          Accedi al tuo account per continuare
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

