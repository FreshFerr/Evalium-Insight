# Evalium

**Analisi del bilancio aziendale semplificata per PMI italiane**

Evalium è una piattaforma web moderna che aiuta gli imprenditori a comprendere i numeri della propria azienda in modo semplice e accessibile, senza bisogno di competenze finanziarie avanzate.

## 🚀 Stack Tecnologico

- **Framework**: Next.js 15 (App Router, Server Components)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (componenti headless + utility)
- **Grafici**: Recharts
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Autenticazione**: Auth.js (NextAuth v5)
- **Validazione**: Zod
- **Pagamenti**: Stripe
- **Export File**: xlsx (SheetJS), PptxGenJS
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deploy**: Vercel-ready

## 📋 Prerequisiti

- Node.js 18.17+ 
- PostgreSQL 14+
- Account Stripe (per pagamenti)
- Account Google OAuth (opzionale)

## 🛠️ Installazione

### 1. Clona il repository

```bash
git clone https://github.com/your-org/evalium.git
cd evalium
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Copia il file di esempio e configura le tue variabili:

```bash
cp env.example .env.local
```

Modifica `.env.local` con i tuoi valori:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/evalium"

# Auth
AUTH_SECRET="genera-con-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Inizializza il database

```bash
# Genera il client Prisma
npm run prisma:generate

# Esegui le migrazioni
npm run prisma:migrate

# (Opzionale) Popola con dati di test
npm run prisma:seed
```

### 5. Avvia il server di sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000)

## 📁 Struttura del Progetto

```
evalium/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Pagine pubbliche (landing, pricing)
│   ├── (auth)/            # Login, registrazione, reset password
│   ├── dashboard/         # Area autenticata
│   │   ├── companies/     # Gestione aziende
│   │   └── admin/         # Area admin (solo ADMIN)
│   ├── api/               # API Routes
│   └── layout.tsx         # Layout root
├── components/            # Componenti React condivisi
│   └── ui/               # Componenti shadcn/ui
├── lib/                   # Business logic e utility
│   ├── auth/             # Helper autenticazione
│   ├── export/           # Generazione Excel/PowerPoint
│   ├── financial-data/   # Provider dati finanziari
│   ├── financial-logic/  # Calcoli KPI e analisi
│   └── payment/          # Integrazione Stripe
├── prisma/               # Schema e migrazioni
├── config/               # Costanti e configurazione
├── tests/                # Test unitari (Vitest)
├── e2e/                  # Test E2E (Playwright)
└── db/                   # Client Prisma
```

## 🧪 Testing

### Test Unitari

```bash
# Esegui tutti i test
npm run test

# Esegui in modalità watch
npm run test:watch

# Con coverage
npm run test:coverage
```

### Test E2E

```bash
# Esegui test Playwright
npm run test:e2e

# Con interfaccia grafica
npm run test:e2e:ui
```

## 📜 Script Disponibili

| Script | Descrizione |
|--------|-------------|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run start` | Avvia il server di produzione |
| `npm run lint` | Esegue ESLint |
| `npm run lint:fix` | Fix automatico lint |
| `npm run format` | Formatta con Prettier |
| `npm run test` | Test unitari |
| `npm run test:e2e` | Test E2E |
| `npm run prisma:migrate` | Migrazioni database |
| `npm run prisma:studio` | Apre Prisma Studio |
| `npm run prisma:seed` | Popola database |

## 🔐 Ruoli Utente

- **USER**: Utente standard, può gestire le proprie aziende
- **ADMIN**: Accesso all'area admin per gestione lead M&A

## 💳 Piani e Funzionalità

| Funzionalità | Gratuito | Pro | Pro Plus |
|-------------|----------|-----|----------|
| Analisi base KPI | ✅ | ✅ | ✅ |
| Spiegazioni semplificate | ✅ | ✅ | ✅ |
| Analisi completa bilancio | ❌ | ✅ | ✅ |
| Benchmark 3 competitor | ❌ | ✅ | ✅ |
| Benchmark illimitati | ❌ | ❌ | ✅ |
| Export Excel | ❌ | ✅ | ✅ |
| Export PowerPoint | ❌ | ❌ | ✅ |

## 🔧 Configurazione Stripe

1. Crea un account su [Stripe Dashboard](https://dashboard.stripe.com)
2. Crea i prodotti e prezzi per i piani Pro e Pro Plus
3. Configura il webhook per `checkout.session.completed`
4. Aggiungi le chiavi in `.env.local`

## 📊 Provider Dati Finanziari

L'applicazione usa un'architettura a provider per i dati finanziari:

- `MockFinancialDataProvider`: Dati fittizi realistici (default)
- `RealFinancialDataProvider`: Placeholder per integrazione futura

Per cambiare provider, modifica `FINANCIAL_DATA_PROVIDER` nel `.env.local`.

## 🚀 Deploy su Vercel

Il progetto è ottimizzato per il deploy su Vercel:

1. Connetti il repository a Vercel
2. Configura le variabili d'ambiente
3. Deploy automatico ad ogni push

## 📝 Licenza

Proprietario - Tutti i diritti riservati

## 👥 Supporto

Per supporto tecnico: supporto@evalium.it

