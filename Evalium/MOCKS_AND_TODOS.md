# Evalium - Mocks, TODOs, and Incomplete Implementations

**Date:** 2025-12-05  
**Purpose:** Detailed inventory of all mock implementations, TODO comments, and features that appear real but are not fully implemented

---

## Table of Contents

1. [External Providers](#external-providers)
2. [Domain Features](#domain-features)
3. [UI/UX Promises vs Reality](#uiux-promises-vs-reality)
4. [Test Coverage TODOs](#test-coverage-todos)

---

## External Providers

### Financial Data Provider

**Status:** MOCKED_ONLY  
**Impact:** CRITICAL  
**Files:**
- `lib/financial-data/mock-provider.ts` - Mock implementation
- `lib/financial-data/index.ts:66-82` - Provider factory

**What's Mocked:**
- `MockFinancialDataProvider` returns deterministic fake data
- Simulates API latency (300-500ms)
- Generates realistic financials based on industry profiles
- 5 hardcoded mock companies in database
- Generates companies on-the-fly if search doesn't match

**What's Missing:**
- Real provider implementation (throws error if `FINANCIAL_DATA_PROVIDER=real`)
- Integration with Cerved, Camera di Commercio, or similar APIs
- Real company search by VAT number
- Real financial statement fetching

**Evidence:**
```typescript
// lib/financial-data/index.ts:73-78
case 'real':
  // TODO: Implement RealFinancialDataProvider
  // Example: return new CervedProvider({ apiKey: process.env.CERVED_API_KEY });
  throw new Error(
    'Real financial data provider not yet implemented. ' +
    'Set FINANCIAL_DATA_PROVIDER=mock to use mock data.'
  );
```

**UI Impact:**
- Marketing says "Recuperiamo automaticamente i dati del bilancio dagli archivi ufficiali" (`components/marketing/how-it-works.tsx:8`)
- Users may not realize data is fake
- All financial analysis is based on mock data

**Suggestion:**
1. Choose real provider (Cerved recommended for Italian companies)
2. Create `RealFinancialDataProvider` class implementing `FinancialDataProvider` interface
3. Add API key to environment variables
4. Update `getFinancialDataProvider()` to return real provider
5. Test with real VAT numbers
6. Add fallback to mock if API fails

---

### Email Verification

**Status:** PARTIAL (Resend works, SendGrid/SMTP are TODOs)  
**Impact:** MEDIUM  
**Files:**
- `lib/email/verification.ts` - Email sending logic

**What's Implemented:**
- Resend API integration (fully working)
- Email template generation (HTML + text)
- Verification URL generation
- Token-based verification flow

**What's Missing:**
- SendGrid integration (TODO at line 75)
- SMTP integration (TODO at line 82)
- Falls back to console logging if no provider configured

**Evidence:**
```typescript
// lib/email/verification.ts:73-77
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  // TODO: Implement SendGrid integration
  logger.warn('SendGrid is configured but not yet implemented');
}

// lib/email/verification.ts:80-84
const smtpHost = process.env.EMAIL_SERVER_HOST;
if (smtpHost) {
  // TODO: Implement SMTP integration
  logger.warn('SMTP is configured but not yet implemented');
}
```

**UI Impact:**
- Email verification works if Resend is configured
- In production without email provider, URLs are logged to console (not ideal)
- Users may not receive verification emails

**Suggestion:**
1. Implement SendGrid: Use `@sendgrid/mail` package, similar pattern to Resend
2. Implement SMTP: Use `nodemailer` package, support common SMTP providers
3. Update `sendVerificationEmail()` to try all three providers in order
4. Add proper error handling and fallback

---

### Stripe Integration

**Status:** FULLY_IMPLEMENTED  
**Impact:** N/A  
**Note:** Stripe is fully implemented with real API calls. No mocks detected.

---

## Domain Features

### Benchmark Competitor Fetching

**Status:** NOT_IMPLEMENTED  
**Impact:** CRITICAL  
**Files:**
- `lib/financial-logic/benchmark.ts` - Comparison logic (exists)
- `prisma/schema.prisma` - `BenchmarkCompetitor` model (exists)
- `app/api/export/excel/route.ts` - Excel export (doesn't fetch competitors)
- `app/api/export/powerpoint/route.ts` - PowerPoint export (doesn't fetch competitors)

**What Exists:**
- `createBenchmark()` function that compares company vs competitors
- `BenchmarkCompetitor` database model
- Export functions that can include benchmark data (if it exists)

**What's Missing:**
- **No code fetches competitor data**
- No integration with `FinancialDataProvider` to search for competitors
- No code creates `BenchmarkCompetitor` records
- Export routes don't fetch competitors - they only use company's own data

**Evidence:**
- Search entire codebase for `BenchmarkCompetitor.create` - **0 results**
- Search for `fetchCompetitors` or `searchCompetitors` - **0 results**
- `app/api/export/excel/route.ts:73-76` - Only uses `company.financialStatements`, no competitor data
- `app/api/export/powerpoint/route.ts:76-80` - Same, no competitor data

**UI Impact:**
- Marketing promises "Benchmark con 3 competitor" (Pro plan)
- Marketing promises "Benchmark con competitor illimitati" (Pro Plus plan)
- Paywall section says "Confronta la tua azienda con i concorrenti del settore"
- Users pay for feature that doesn't work

**Suggestion:**
1. **Option A - Use FinancialDataProvider:**
   - When creating BENCHMARK report, search for competitors by industry
   - Use `FinancialDataProvider.searchCompany()` with industry filter
   - Fetch financials for top 3-5 competitors
   - Store in `BenchmarkCompetitor` table
   - Update export routes to include competitor data

2. **Option B - External Competitor API:**
   - Integrate with competitor database API
   - Search by industry, size, geography
   - Fetch and store competitor data

3. **Option C - Manual Entry (Future):**
   - Allow users to manually add competitors
   - Or allow admin to curate competitor lists

**Priority:** HIGH - Feature is paid but non-functional

---

### M&A External Partner Integration

**Status:** NOT_IMPLEMENTED  
**Impact:** MEDIUM  
**Files:**
- `app/dashboard/companies/[companyId]/ma-banner.tsx` - M&A banner UI
- `app/dashboard/admin/leads/actions.ts` - Lead creation/management
- `prisma/schema.prisma` - `MAndALead` model

**What Exists:**
- M&A lead creation form with validation
- Lead storage in database
- Admin interface to view/manage leads
- Status transitions (NEW → CONTACTED → SENT_TO_PARTNER → CLOSED)

**What's Missing:**
- **No external API/webhook integration**
- No automatic routing to "partner boutiques"
- No email notifications to external partners
- Admin must manually process leads

**Evidence:**
```typescript
// app/dashboard/companies/[companyId]/ma-banner.tsx:173-174
"Un advisor della nostra rete di partner ti contatterà 
in modo completamente riservato per discutere le opportunità."

// app/dashboard/admin/leads/actions.ts:116-128
// Only creates DB record, no external call
const lead = await prisma.mAndALead.create({
  data: {
    companyId,
    userId: session.user.id,
    status: 'NEW',
    // ... no external API call
  },
});
```

**UI Impact:**
- Banner says "boutique di advisor M&A nostre partner"
- Success message says "advisor della nostra rete di partner ti contatterà"
- Users expect automatic external contact, but nothing happens
- Requires manual admin intervention

**Suggestion:**
1. **Option A - Webhook Integration:**
   - Add `M_A_PARTNER_WEBHOOK_URL` env variable
   - When lead status changes to `SENT_TO_PARTNER`, POST to webhook
   - Include lead data, company financials, user contact info

2. **Option B - Email Notification:**
   - Add `M_A_PARTNER_EMAIL` env variable
   - Send email to partner when lead is created or status changes
   - Include lead details and company summary

3. **Option C - Update UI:**
   - Change messaging to "admin will review and contact you"
   - Remove mention of "partner boutiques" until integration exists

**Priority:** MEDIUM - Feature works but overpromises

---

### Company Financial Data Refresh

**Status:** FULLY_IMPLEMENTED (but uses mock provider)  
**Impact:** LOW  
**Note:** Refresh functionality exists and works, but fetches from mock provider. Once real provider is implemented, refresh will work with real data.

---

## UI/UX Promises vs Reality

### 1. Financial Data Source

**Promise:**
- `components/marketing/how-it-works.tsx:8`: "Recuperiamo automaticamente i dati del bilancio dagli archivi ufficiali"

**Reality:**
- Uses `MockFinancialDataProvider` - returns fake data
- No integration with "archivi ufficiali"

**Type:** OVERPROMISE  
**Impact:** HIGH  
**File:** `components/marketing/how-it-works.tsx`

**Recommendation:**
- Update text to "Demo data" or "Mock data for testing"
- Or implement real provider before launch

---

### 2. Benchmark Competitor Feature

**Promise:**
- `components/marketing/pricing.tsx`: "Benchmark con 3 competitor" (Pro)
- `components/marketing/pricing.tsx`: "Benchmark con competitor illimitati" (Pro Plus)
- `app/dashboard/companies/[companyId]/paywall-section.tsx:21`: "Benchmark con 3 competitor"
- `app/dashboard/companies/[companyId]/paywall-section.tsx:22`: "Confronta la tua azienda con i concorrenti del settore"

**Reality:**
- No competitor data is fetched
- Benchmark comparison logic exists but has no data to compare
- Export files show benchmark sheets but they're empty

**Type:** OVERPROMISE  
**Impact:** CRITICAL  
**Files:** Multiple marketing/paywall components

**Recommendation:**
- Remove benchmark from marketing until implemented
- Or add disclaimer "Coming soon"
- Or implement competitor fetching immediately

---

### 3. M&A Partner Network

**Promise:**
- `app/dashboard/companies/[companyId]/ma-banner.tsx:185-186`: "boutique di advisor M&A nostre partner"
- `app/dashboard/companies/[companyId]/ma-banner.tsx:173-174`: "advisor della nostra rete di partner ti contatterà"

**Reality:**
- Leads are only stored in database
- No external partner integration
- Admin must manually contact users

**Type:** OVERPROMISE  
**Impact:** MEDIUM  
**File:** `app/dashboard/companies/[companyId]/ma-banner.tsx`

**Recommendation:**
- Update text to "admin will review your request"
- Or implement external partner integration
- Or add webhook/email to partner systems

---

### 4. Email Verification

**Promise:**
- Email verification flow exists and works
- UI shows verification page

**Reality:**
- Works if Resend is configured
- Falls back to console logging if no provider
- SendGrid/SMTP not implemented (TODOs)

**Type:** PARTIAL  
**Impact:** LOW  
**File:** `lib/email/verification.ts`

**Recommendation:**
- Document that only Resend is supported
- Or implement SendGrid/SMTP
- Add better error handling for missing provider

---

## Test Coverage TODOs

### Missing Tests

**Area:** Benchmark Competitor Fetching  
**Status:** CANNOT_TEST (feature doesn't exist)  
**Note:** Can't write tests for competitor fetching when no code exists to fetch competitors.

**Area:** Real Financial Data Provider  
**Status:** CANNOT_TEST (feature doesn't exist)  
**Note:** Can't test real provider integration when only mock exists.

**Area:** M&A External Partner Integration  
**Status:** CANNOT_TEST (feature doesn't exist)  
**Note:** Can't test external integration when only DB storage exists.

**Area:** Email Provider Fallbacks  
**Status:** PARTIAL  
**Note:** Tests exist for Resend, but no tests for SendGrid/SMTP (not implemented).

---

## Summary by Impact

### CRITICAL (Must Fix Before Launch)

1. **Financial Data Provider** - 100% mock, no real integration
2. **Benchmark Competitor Fetching** - Feature promised but not implemented

### MEDIUM (Should Fix Soon)

3. **M&A External Partner Integration** - Overpromises external contact
4. **Email Provider Options** - Only Resend works, SendGrid/SMTP are TODOs

### LOW (Nice to Have)

5. **Distributed Rate Limiting** - In-memory works but won't scale
6. **External Monitoring** - No Sentry/LogRocket integration

---

## Action Items

### Immediate (Before Public Launch)

- [ ] Implement real financial data provider OR add "demo mode" disclaimer
- [ ] Implement benchmark competitor fetching OR remove from marketing
- [ ] Update M&A banner text OR implement external partner integration

### Short-term (Within 1-2 Sprints)

- [ ] Implement SendGrid email integration
- [ ] Implement SMTP email integration
- [ ] Add distributed rate limiting (@upstash/ratelimit)

### Long-term (Future Enhancements)

- [ ] Add external monitoring (Sentry, LogRocket)
- [ ] Add analytics dashboard for admin
- [ ] Consider manual competitor entry feature

---

**Report Generated:** 2025-12-05  
**Next Review:** After implementing financial data provider and benchmark competitor fetching

