-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FinancialDataSource" AS ENUM ('API', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BASIC_ANALYSIS', 'FULL_ANALYSIS', 'BENCHMARK');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('CREATED', 'PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SINGLE_REPORT', 'BENCHMARK_3', 'BENCHMARK_UNLIMITED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SENT_TO_PARTNER', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "vatNumber" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IT',
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_statements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "costOfGoodsSold" DECIMAL(15,2),
    "grossProfit" DECIMAL(15,2),
    "operatingCosts" DECIMAL(15,2),
    "ebitda" DECIMAL(15,2) NOT NULL,
    "ebitdaMargin" DECIMAL(5,4) NOT NULL,
    "depreciation" DECIMAL(15,2),
    "ebit" DECIMAL(15,2),
    "interestExpense" DECIMAL(15,2),
    "netIncome" DECIMAL(15,2) NOT NULL,
    "cashAndEquivalents" DECIMAL(15,2),
    "receivables" DECIMAL(15,2),
    "inventory" DECIMAL(15,2),
    "currentAssets" DECIMAL(15,2),
    "fixedAssets" DECIMAL(15,2),
    "totalAssets" DECIMAL(15,2) NOT NULL,
    "currentLiabilities" DECIMAL(15,2),
    "longTermDebt" DECIMAL(15,2),
    "totalLiabilities" DECIMAL(15,2) NOT NULL,
    "equity" DECIMAL(15,2) NOT NULL,
    "netDebt" DECIMAL(15,2),
    "revenueGrowth" DECIMAL(5,4),
    "netProfitMargin" DECIMAL(5,4),
    "debtToEquityRatio" DECIMAL(5,2),
    "currentRatio" DECIMAL(5,2),
    "source" "FinancialDataSource" NOT NULL DEFAULT 'API',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'CREATED',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_competitors" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "competitorVatNumber" TEXT,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmark_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeCustomerId" TEXT,
    "productType" "ProductType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_leads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "reason" JSONB,
    "maScore" INTEGER,
    "hasUserConsented" BOOLEAN NOT NULL DEFAULT false,
    "userContactEmail" TEXT NOT NULL,
    "userContactPhone" TEXT,
    "consentDate" TIMESTAMP(3),
    "notes" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens"("email", "token");

-- CreateIndex
CREATE INDEX "companies_userId_idx" ON "companies"("userId");

-- CreateIndex
CREATE INDEX "companies_vatNumber_idx" ON "companies"("vatNumber");

-- CreateIndex
CREATE INDEX "financial_statements_companyId_idx" ON "financial_statements"("companyId");

-- CreateIndex
CREATE INDEX "financial_statements_fiscalYear_idx" ON "financial_statements"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "financial_statements_companyId_fiscalYear_key" ON "financial_statements"("companyId", "fiscalYear");

-- CreateIndex
CREATE INDEX "reports_companyId_idx" ON "reports"("companyId");

-- CreateIndex
CREATE INDEX "reports_type_status_idx" ON "reports"("type", "status");

-- CreateIndex
CREATE INDEX "benchmark_competitors_reportId_idx" ON "benchmark_competitors"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripePaymentIntentId_key" ON "purchases"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripeCheckoutSessionId_key" ON "purchases"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "purchases"("userId");

-- CreateIndex
CREATE INDEX "purchases_reportId_idx" ON "purchases"("reportId");

-- CreateIndex
CREATE INDEX "purchases_stripePaymentIntentId_idx" ON "purchases"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "purchases_stripeCheckoutSessionId_idx" ON "purchases"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "ma_leads_companyId_idx" ON "ma_leads"("companyId");

-- CreateIndex
CREATE INDEX "ma_leads_userId_idx" ON "ma_leads"("userId");

-- CreateIndex
CREATE INDEX "ma_leads_status_idx" ON "ma_leads"("status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_competitors" ADD CONSTRAINT "benchmark_competitors_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ma_leads" ADD CONSTRAINT "ma_leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ma_leads" ADD CONSTRAINT "ma_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
