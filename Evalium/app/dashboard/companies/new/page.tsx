import { Metadata } from 'next';
import { NewCompanyForm } from './new-company-form';

export const metadata: Metadata = {
  title: 'Aggiungi azienda',
  description: 'Aggiungi una nuova azienda al tuo account Evalium',
};

export default function NewCompanyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Aggiungi azienda</h1>
        <p className="text-muted-foreground mt-2">
          Inserisci i dati della tua azienda. Recupereremo automaticamente 
          i dati del bilancio dagli archivi ufficiali.
        </p>
      </div>
      <NewCompanyForm />
    </div>
  );
}


