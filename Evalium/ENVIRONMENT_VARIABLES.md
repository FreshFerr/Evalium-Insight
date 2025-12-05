# Evalium - Complete Environment Variables Documentation

**Generated:** 2025-01-27  
**Status:** Comprehensive audit of all environment variables

---

## Table of Contents

1. [Required for Local Development](#1-required-for-local-development)
2. [Required for Production (Vercel)](#2-required-for-production-vercel)
3. [Optional but Recommended Variables](#3-optional-but-recommended-variables)
4. [Variables That Exist in Code But Are Currently Unused](#4-variables-that-exist-in-code-but-are-currently-unused)
5. [Environment Consistency Check](#5-environment-consistency-check)
6. [Final Consolidated Table](#6-final-consolidated-table)

---

## 1. Required for Local Development

### Database

#### `DATABASE_URL`
- **Exact Name:** `DATABASE_URL`
- **Default:** None (required)
- **Used In:**
  - `prisma/schema.prisma:12` - Prisma datasource configuration
  - `db/index.ts:10` - PrismaClient initialization
- **Why Required:** PostgreSQL connection string for database operations. Prisma requires this to connect to the database.
- **Example Value:** `postgresql://postgres:password@localhost:5432/evalium`
- **Notes:** Must be a valid PostgreSQL connection string. For Supabase, use pooled connection URL.

#### `DIRECT_URL`
- **Exact Name:** `DIRECT_URL`
- **Default:** None (optional but recommended)
- **Used In:**
  - `prisma/schema.prisma:13` - Prisma datasource directUrl configuration
- **Why Required:** Direct connection URL for Prisma migrations when using connection pooling. Bypasses the pooler for schema migrations.
- **Example Value:** `postgresql://postgres:password@localhost:5432/evalium`
- **Notes:** Optional but recommended when using connection pooling (e.g., Supabase). If not set, Prisma will use `DATABASE_URL` for migrations.

### Authentication (NextAuth.js)

#### `AUTH_SECRET`
- **Exact Name:** `AUTH_SECRET`
- **Default:** None (required)
- **Used In:**
  - Automatically read by NextAuth.js (NextAuth v5 reads this from environment)
  - `lib/auth/index.ts:11` - NextAuth initialization
- **Why Required:** Secret key used by NextAuth.js to encrypt JWT tokens and session cookies. Without this, authentication will fail.
- **Example Value:** `your-auth-secret-here-generate-with-openssl` (generate with `openssl rand -base64 32`)
- **Notes:** Must be the same across all deployments. Generate a secure random string. Never commit to version control.

#### `AUTH_URL`
- **Exact Name:** `AUTH_URL`
- **Default:** None (required)
- **Used In:**
  - Automatically read by NextAuth.js for OAuth callbacks and redirects
  - `lib/auth/index.ts:11` - NextAuth initialization
- **Why Required:** Base URL of the application used for OAuth callbacks and redirects. NextAuth needs this to construct callback URLs.
- **Example Value (Local):** `http://localhost:3000`
- **Example Value (Production):** `https://evalium.vercel.app`
- **Notes:** Must match the actual URL where the app is running. In production, this should be your production domain.

### Stripe Payments

#### `STRIPE_SECRET_KEY`
- **Exact Name:** `STRIPE_SECRET_KEY`
- **Default:** None (required)
- **Used In:**
  - `lib/payment/stripe.ts:5` - Stripe instance initialization
- **Why Required:** Stripe secret API key for server-side operations (creating checkout sessions, handling webhooks). The code throws an error if this is missing.
- **Example Value (Test):** `sk_test_51...`
- **Example Value (Live):** `sk_live_51...`
- **Notes:** Use test key for local development, live key for production. Never expose this key in client-side code.

#### `STRIPE_WEBHOOK_SECRET`
- **Exact Name:** `STRIPE_WEBHOOK_SECRET`
- **Default:** None (required for webhooks)
- **Used In:**
  - `lib/payment/stripe.ts:146` - Webhook signature verification
  - `app/api/webhooks/stripe/route.ts:35` - Webhook event construction
- **Why Required:** Secret used to verify Stripe webhook signatures. Without this, webhook events cannot be verified and will be rejected.
- **Example Value:** `whsec_...`
- **Notes:** Get this from Stripe Dashboard > Webhooks > Your endpoint > Signing secret. Different for each webhook endpoint.

### Application

#### `NEXT_PUBLIC_APP_URL`
- **Exact Name:** `NEXT_PUBLIC_APP_URL`
- **Default:** `http://localhost:3000` (fallback in code)
- **Used In:**
  - `config/constants.ts:119` - APP_CONFIG.url
  - `lib/actions/auth.ts:232` - Password reset URL generation
  - `lib/email/verification.ts:28` - Email verification URL generation
- **Why Required:** Base URL used for generating email links (verification, password reset) and redirects. Used in both server and client code.
- **Example Value (Local):** `http://localhost:3000`
- **Example Value (Production):** `https://evalium.vercel.app`
- **Notes:** This is a `NEXT_PUBLIC_*` variable, meaning it's exposed to the client. Must be set correctly for email links to work.

---

## 2. Required for Production (Vercel)

### Build-Time Requirements

All variables listed in [Section 1](#1-required-for-local-development) are required for production builds. Additionally:

#### `NODE_ENV`
- **Exact Name:** `NODE_ENV`
- **Default:** `development` (set automatically by Next.js)
- **Used In:**
  - `db/index.ts:11` - Prisma logging configuration
  - `db/index.ts:16` - Prisma singleton pattern
  - `lib/email/verification.ts:16` - Email sending mode detection
  - `lib/logger.ts:20` - Log level configuration
- **Why Required:** Controls behavior between development and production (logging, error handling, etc.)
- **Example Value:** `production`
- **Notes:** Vercel automatically sets this to `production` for production deployments.

### Runtime Requirements

#### Variables That Must Be Set Before Stripe Webhook Deployment

1. **`STRIPE_WEBHOOK_SECRET`** - Required before configuring webhook endpoint in Stripe Dashboard
   - Without this, webhook signature verification will fail
   - Must match the signing secret from your Stripe webhook endpoint

2. **`STRIPE_SECRET_KEY`** - Required for creating checkout sessions
   - Use live key (`sk_live_...`) for production
   - Use test key (`sk_test_...`) for preview/staging deployments

3. **`AUTH_URL`** - Must be set to production URL
   - OAuth callbacks will fail if this doesn't match the actual domain
   - Example: `https://evalium.vercel.app`

#### NEXT_PUBLIC Variables That Frontend Will Break Without

1. **`NEXT_PUBLIC_APP_URL`** - Used for:
   - Email verification links
   - Password reset links
   - Redirect URLs
   - If missing, email links will be broken (falls back to `http://localhost:3000`)

2. **`NEXT_PUBLIC_APP_NAME`** - Currently not used in code, but documented in env.example
   - Safe to omit for now

#### Variables That Change Behavior Between Staging and Production

1. **`STRIPE_SECRET_KEY`**
   - Staging: Use `sk_test_...` (test mode)
   - Production: Use `sk_live_...` (live mode)

2. **`STRIPE_WEBHOOK_SECRET`**
   - Different secrets for staging and production webhook endpoints
   - Configure separate webhook endpoints in Stripe Dashboard

3. **`AUTH_URL`**
   - Staging: `https://evalium-staging.vercel.app`
   - Production: `https://evalium.vercel.app`

4. **`NEXT_PUBLIC_APP_URL`**
   - Staging: `https://evalium-staging.vercel.app`
   - Production: `https://evalium.vercel.app`

5. **`REQUIRE_EMAIL_VERIFICATION`**
   - Staging: Can be `false` for easier testing
   - Production: Should be `true` for security

---

## 3. Optional but Recommended Variables

### Google OAuth (Optional)

#### `AUTH_GOOGLE_ID`
- **Exact Name:** `AUTH_GOOGLE_ID`
- **Default:** `undefined` (Google provider disabled if not set)
- **Used In:**
  - `lib/auth/config.ts:21` - Google OAuth provider configuration
- **Why Recommended:** Enables Google OAuth login, improving user experience. App works without it (credentials login only).
- **Example Value:** `123456789-abc...apps.googleusercontent.com`
- **Functionality Unlocked:** Google Sign-In button on login page

#### `AUTH_GOOGLE_SECRET`
- **Exact Name:** `AUTH_GOOGLE_SECRET`
- **Default:** `undefined` (Google provider disabled if not set)
- **Used In:**
  - `lib/auth/config.ts:22` - Google OAuth provider configuration
- **Why Recommended:** Required alongside `AUTH_GOOGLE_ID` to enable Google OAuth.
- **Example Value:** `GOCSPX-...`
- **Functionality Unlocked:** Google Sign-In authentication

### Stripe Price IDs (Optional)

#### `STRIPE_PRICE_FULL_ANALYSIS`
- **Exact Name:** `STRIPE_PRICE_FULL_ANALYSIS`
- **Default:** `undefined` (app creates one-time prices dynamically)
- **Used In:**
  - `config/constants.ts:85` - PRICING_PLANS.PRO.priceId
  - `lib/payment/stripe.ts:53` - Product configuration for Pro plan
- **Why Recommended:** Pre-configured Stripe Price IDs allow better tracking and management in Stripe Dashboard. If not set, app creates prices on-the-fly.
- **Example Value:** `price_1234567890abcdef`
- **Functionality Unlocked:** Uses existing Stripe Price instead of creating dynamic prices

#### `STRIPE_PRICE_BENCHMARK_UNLIMITED`
- **Exact Name:** `STRIPE_PRICE_BENCHMARK_UNLIMITED`
- **Default:** `undefined` (app creates one-time prices dynamically)
- **Used In:**
  - `config/constants.ts:101` - PRICING_PLANS.PRO_PLUS.priceId
  - `lib/payment/stripe.ts:61` - Product configuration for Pro Plus plan
- **Why Recommended:** Same as above - better Stripe Dashboard management.
- **Example Value:** `price_0987654321fedcba`
- **Functionality Unlocked:** Uses existing Stripe Price for Pro Plus plan

### Financial Data Provider (Optional)

#### `FINANCIAL_DATA_PROVIDER`
- **Exact Name:** `FINANCIAL_DATA_PROVIDER`
- **Default:** `"mock"` (fallback in code)
- **Used In:**
  - `lib/financial-data/index.ts:67` - Provider selection logic
- **Why Recommended:** Currently only `"mock"` is implemented. When real provider is implemented, set to `"real"`.
- **Example Value:** `mock` or `real`
- **Functionality Unlocked:** Switching to real provider when implemented (currently throws error if set to `"real"`)

#### `FINANCIAL_DATA_RATE_LIMIT`
- **Exact Name:** `FINANCIAL_DATA_RATE_LIMIT`
- **Default:** `60` (fallback in code)
- **Used In:**
  - `config/constants.ts:123` - APP_CONFIG.RATE_LIMIT
- **Why Recommended:** Controls rate limiting for financial data API calls (requests per minute).
- **Example Value:** `60`
- **Functionality Unlocked:** Adjustable rate limiting threshold

### M&A Configuration Thresholds (Optional - All Have Defaults)

All M&A threshold variables have defaults in `config/constants.ts` and are exposed as `NEXT_PUBLIC_*` variables (client-accessible).

#### `NEXT_PUBLIC_MA_REVENUE_THRESHOLD`
- **Default:** `2000000` (€2,000,000)
- **Used In:** `config/constants.ts:11`
- **Example Value:** `2000000`

#### `NEXT_PUBLIC_MA_EBITDA_MARGIN_THRESHOLD`
- **Default:** `0.10` (10%)
- **Used In:** `config/constants.ts:14`
- **Example Value:** `0.10`

#### `NEXT_PUBLIC_MA_EBITDA_THRESHOLD`
- **Default:** `200000` (€200,000)
- **Used In:** `config/constants.ts:17`
- **Example Value:** `200000`

#### `NEXT_PUBLIC_MA_GROWTH_THRESHOLD`
- **Default:** `0.05` (5%)
- **Used In:** `config/constants.ts:20`
- **Example Value:** `0.05`

#### `NEXT_PUBLIC_MA_SCORE_THRESHOLD`
- **Default:** `60` (0-100 scale)
- **Used In:** `config/constants.ts:23`
- **Example Value:** `60`

**Functionality Unlocked:** Adjustable M&A eligibility thresholds without code changes.

### Pricing Configuration (Optional - All Have Defaults)

#### `NEXT_PUBLIC_PRICING_PRO`
- **Default:** `49` (€49)
- **Used In:**
  - `config/constants.ts:54` - PRICING.PRO
  - `lib/payment/stripe.ts:54` - Product amount calculation
- **Example Value:** `49`

#### `NEXT_PUBLIC_PRICING_PRO_PLUS`
- **Default:** `99` (€99)
- **Used In:**
  - `config/constants.ts:56` - PRICING.PRO_PLUS
  - `lib/payment/stripe.ts:62` - Product amount calculation
- **Example Value:** `99`

**Functionality Unlocked:** Adjustable pricing without code changes.

### Email Verification (Optional)

#### `REQUIRE_EMAIL_VERIFICATION`
- **Exact Name:** `REQUIRE_EMAIL_VERIFICATION`
- **Default:** `false` (fallback in code)
- **Used In:**
  - `config/constants.ts:135` - EMAIL_VERIFICATION_CONFIG.REQUIRE_EMAIL_VERIFICATION
  - `lib/actions/auth.ts:101,137` - Registration and login enforcement
- **Why Recommended:** Set to `true` in production for security. When `true`, users must verify email before logging in.
- **Example Value:** `true` or `false`
- **Functionality Unlocked:** Email verification enforcement

#### `EMAIL_VERIFICATION_TOKEN_EXPIRY_MS`
- **Exact Name:** `EMAIL_VERIFICATION_TOKEN_EXPIRY_MS`
- **Default:** `86400000` (24 hours)
- **Used In:**
  - `config/constants.ts:138` - EMAIL_VERIFICATION_CONFIG.TOKEN_EXPIRY_MS
  - `lib/actions/auth.ts:70` - Token expiry calculation
- **Example Value:** `86400000` (24 hours in milliseconds)
- **Functionality Unlocked:** Configurable token expiration time

### Email Provider (Optional - Choose One)

#### `RESEND_API_KEY`
- **Exact Name:** `RESEND_API_KEY`
- **Default:** `undefined` (emails logged to console)
- **Used In:**
  - `lib/email/verification.ts:67,111` - Resend email sending
- **Why Recommended:** Recommended email provider for production. Simple API, good deliverability.
- **Example Value:** `re_...`
- **Functionality Unlocked:** Actual email sending via Resend API

#### `EMAIL_FROM`
- **Exact Name:** `EMAIL_FROM`
- **Default:** `Evalium <noreply@${hostname}>` (fallback in code)
- **Used In:**
  - `lib/email/verification.ts:112` - Email from address
- **Example Value:** `Evalium <noreply@evalium.it>`
- **Functionality Unlocked:** Custom "from" address for emails

#### `SENDGRID_API_KEY`
- **Exact Name:** `SENDGRID_API_KEY`
- **Default:** `undefined` (not implemented)
- **Used In:**
  - `lib/email/verification.ts:73` - Detected but not implemented (logs warning)
- **Status:** Referenced in code but not implemented. TODO in code comments.
- **Example Value:** `SG....`
- **Functionality Unlocked:** None (not implemented)

#### `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`
- **Exact Names:** `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`
- **Default:** `undefined` (not implemented)
- **Used In:**
  - `lib/email/verification.ts:80` - Only `EMAIL_SERVER_HOST` is checked, but SMTP not implemented
- **Status:** Referenced in code but not implemented. TODO in code comments.
- **Example Values:**
  - `EMAIL_SERVER_HOST`: `smtp.gmail.com`
  - `EMAIL_SERVER_PORT`: `587`
  - `EMAIL_SERVER_USER`: `your-email@gmail.com`
  - `EMAIL_SERVER_PASSWORD`: `your-app-password`
- **Functionality Unlocked:** None (not implemented)

---

## 4. Variables That Exist in Code But Are Currently Unused

### In `env.example` But Not Used in Code

#### `STRIPE_PUBLISHABLE_KEY`
- **Location:** `env.example:35`
- **Status:** Not referenced anywhere in the codebase
- **Recommendation:** Remove from `env.example` unless planning to use Stripe.js on client-side. Currently, all Stripe operations are server-side only.

#### `STRIPE_PRICE_BENCHMARK_3`
- **Location:** `env.example:43`
- **Status:** Not referenced anywhere in the codebase
- **Recommendation:** Remove from `env.example`. The code only uses `STRIPE_PRICE_FULL_ANALYSIS` and `STRIPE_PRICE_BENCHMARK_UNLIMITED`.

#### `NEXT_PUBLIC_APP_NAME`
- **Location:** `env.example:53`
- **Status:** Not referenced anywhere in the codebase
- **Recommendation:** Remove from `env.example` or implement usage if app name needs to be configurable.

### Commented/Planned But Not Implemented

#### `CERVED_API_KEY`
- **Location:** `lib/financial-data/index.ts:74` (commented example)
- **Status:** Only mentioned in a TODO comment. Not actually used.
- **Recommendation:** Keep as comment until real provider is implemented.

---

## 5. Environment Consistency Check

### Variables Used in Code But Not in `env.example`

**None found.** All variables used in code are documented in `env.example`.

### Variables in `env.example` That No Longer Match Implementation

1. **`STRIPE_PUBLISHABLE_KEY`** - In `env.example` but not used in code
2. **`STRIPE_PRICE_BENCHMARK_3`** - In `env.example` but not used in code
3. **`NEXT_PUBLIC_APP_NAME`** - In `env.example` but not used in code

### NEXT_PUBLIC Variables That Should or Should Not Be Public

#### ✅ Correctly Public (Client-Side Access Needed)
- `NEXT_PUBLIC_APP_URL` - Used for email links, redirects
- `NEXT_PUBLIC_MA_*` - M&A thresholds used in client-side calculations
- `NEXT_PUBLIC_PRICING_*` - Pricing displayed in UI

#### ⚠️ Potentially Unnecessary Public
- `NEXT_PUBLIC_APP_NAME` - Not used, but if implemented, should be public (display name)

#### ❌ Should NOT Be Public (Correctly Server-Only)
- `AUTH_SECRET` - Correctly server-only
- `STRIPE_SECRET_KEY` - Correctly server-only
- `STRIPE_WEBHOOK_SECRET` - Correctly server-only
- `DATABASE_URL` - Correctly server-only
- `RESEND_API_KEY` - Correctly server-only

### Hardcoded Values That Should Become Env Variables

**None found.** All configurable values are already environment-aware:
- M&A thresholds: ✅ Configurable via env
- Pricing: ✅ Configurable via env
- Email verification: ✅ Configurable via env
- Rate limits: ✅ Configurable via env

---

## 6. Final Consolidated Table

| Variable Name | Required? | Default | Used In (Paths) | Needed on Vercel? | Notes |
|--------------|-----------|---------|-----------------|-------------------|-------|
| `DATABASE_URL` | ✅ Yes | None | `prisma/schema.prisma:12`, `db/index.ts:10` | ✅ Yes | PostgreSQL connection string |
| `DIRECT_URL` | ⚠️ Optional | None | `prisma/schema.prisma:13` | ⚠️ Recommended | For migrations with connection pooling |
| `AUTH_SECRET` | ✅ Yes | None | NextAuth auto-read | ✅ Yes | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | ✅ Yes | None | NextAuth auto-read | ✅ Yes | Must match production domain |
| `AUTH_GOOGLE_ID` | ❌ Optional | `undefined` | `lib/auth/config.ts:21` | ❌ Optional | For Google OAuth |
| `AUTH_GOOGLE_SECRET` | ❌ Optional | `undefined` | `lib/auth/config.ts:22` | ❌ Optional | For Google OAuth |
| `STRIPE_SECRET_KEY` | ✅ Yes | None | `lib/payment/stripe.ts:5` | ✅ Yes | Throws error if missing |
| `STRIPE_PUBLISHABLE_KEY` | ❌ Unused | None | Not used | ❌ No | Not referenced in code |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | None | `lib/payment/stripe.ts:146` | ✅ Yes | Required for webhook verification |
| `STRIPE_PRICE_FULL_ANALYSIS` | ❌ Optional | `undefined` | `config/constants.ts:85` | ❌ Optional | App creates prices dynamically if not set |
| `STRIPE_PRICE_BENCHMARK_3` | ❌ Unused | None | Not used | ❌ No | Not referenced in code |
| `STRIPE_PRICE_BENCHMARK_UNLIMITED` | ❌ Optional | `undefined` | `config/constants.ts:101` | ❌ Optional | App creates prices dynamically if not set |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | `http://localhost:3000` | `config/constants.ts:119`, `lib/actions/auth.ts:232`, `lib/email/verification.ts:28` | ✅ Yes | Used for email links |
| `NEXT_PUBLIC_APP_NAME` | ❌ Unused | None | Not used | ❌ No | Not referenced in code |
| `FINANCIAL_DATA_PROVIDER` | ❌ Optional | `"mock"` | `lib/financial-data/index.ts:67` | ❌ Optional | Currently only "mock" works |
| `FINANCIAL_DATA_RATE_LIMIT` | ❌ Optional | `60` | `config/constants.ts:123` | ❌ Optional | Requests per minute |
| `NEXT_PUBLIC_MA_REVENUE_THRESHOLD` | ❌ Optional | `2000000` | `config/constants.ts:11` | ❌ Optional | €2M default |
| `NEXT_PUBLIC_MA_EBITDA_MARGIN_THRESHOLD` | ❌ Optional | `0.10` | `config/constants.ts:14` | ❌ Optional | 10% default |
| `NEXT_PUBLIC_MA_EBITDA_THRESHOLD` | ❌ Optional | `200000` | `config/constants.ts:17` | ❌ Optional | €200K default |
| `NEXT_PUBLIC_MA_GROWTH_THRESHOLD` | ❌ Optional | `0.05` | `config/constants.ts:20` | ❌ Optional | 5% default |
| `NEXT_PUBLIC_MA_SCORE_THRESHOLD` | ❌ Optional | `60` | `config/constants.ts:23` | ❌ Optional | 0-100 scale |
| `NEXT_PUBLIC_PRICING_PRO` | ❌ Optional | `49` | `config/constants.ts:54` | ❌ Optional | €49 default |
| `NEXT_PUBLIC_PRICING_PRO_PLUS` | ❌ Optional | `99` | `config/constants.ts:56` | ❌ Optional | €99 default |
| `REQUIRE_EMAIL_VERIFICATION` | ❌ Optional | `false` | `config/constants.ts:135` | ❌ Optional | Set to `true` for production |
| `EMAIL_VERIFICATION_TOKEN_EXPIRY_MS` | ❌ Optional | `86400000` | `config/constants.ts:138` | ❌ Optional | 24 hours default |
| `RESEND_API_KEY` | ❌ Optional | `undefined` | `lib/email/verification.ts:67,111` | ❌ Optional | For email sending |
| `EMAIL_FROM` | ❌ Optional | `Evalium <noreply@${hostname}>` | `lib/email/verification.ts:112` | ❌ Optional | Email from address |
| `SENDGRID_API_KEY` | ❌ Optional | `undefined` | `lib/email/verification.ts:73` | ❌ No | Not implemented |
| `EMAIL_SERVER_HOST` | ❌ Optional | `undefined` | `lib/email/verification.ts:80` | ❌ No | Not implemented |
| `EMAIL_SERVER_PORT` | ❌ Optional | `undefined` | Not used | ❌ No | Not implemented |
| `EMAIL_SERVER_USER` | ❌ Optional | `undefined` | Not used | ❌ No | Not implemented |
| `EMAIL_SERVER_PASSWORD` | ❌ Optional | `undefined` | Not used | ❌ No | Not implemented |
| `NODE_ENV` | ✅ Auto | `development` | Multiple files | ✅ Auto | Set by Vercel automatically |

---

## Summary

### Minimum Required for Local Development (8 variables)
1. `DATABASE_URL`
2. `DIRECT_URL` (recommended)
3. `AUTH_SECRET`
4. `AUTH_URL`
5. `STRIPE_SECRET_KEY`
6. `STRIPE_WEBHOOK_SECRET`
7. `NEXT_PUBLIC_APP_URL`

### Minimum Required for Production/Vercel (7 variables)
Same as local development, but:
- `AUTH_URL` must be production URL
- `STRIPE_SECRET_KEY` should be live key
- `STRIPE_WEBHOOK_SECRET` must be production webhook secret

### Recommended for Production (3 additional)
1. `REQUIRE_EMAIL_VERIFICATION=true`
2. `RESEND_API_KEY` (for email sending)
3. `EMAIL_FROM` (custom from address)

### Variables to Remove from `env.example`
1. `STRIPE_PUBLISHABLE_KEY` (not used)
2. `STRIPE_PRICE_BENCHMARK_3` (not used)
3. `NEXT_PUBLIC_APP_NAME` (not used)

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-27


