import { Metadata } from 'next';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Registrati',
  description: 'Crea il tuo account Evalium gratuito per analizzare i dati della tua azienda',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Crea il tuo account</h1>
        <p className="text-muted-foreground">
          Inizia gratis a capire i numeri della tua azienda
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}

