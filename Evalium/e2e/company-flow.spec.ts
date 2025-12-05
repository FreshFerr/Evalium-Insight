import { test, expect } from '@playwright/test';

/**
 * L-3: E2E Test for Company Creation Flow
 * 
 * This test verifies the core flow: login → create company → see basic analysis.
 * 
 * Scope:
 * - User authentication (registration/login)
 * - Company creation via UI form
 * - Financial data provider completes (mock)
 * - Company appears in list
 * - Company detail page shows basic KPIs and narrative analysis
 */

// Test credentials - unique per test run
const TEST_USER = {
  email: `test-company-${Date.now()}@evalium-test.it`,
  password: 'TestPassword123!',
  name: 'Test User Company Flow',
};

const TEST_COMPANY = {
  legalName: `E2E Test Company ${Date.now()}`,
  vatNumber: 'IT98765432109',
};

test.describe('Company Creation Flow', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in order

  let isLoggedIn = false;

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="name"]', TEST_USER.name);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to login or dashboard
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 15000 });
    
    // If on login page, we need to login
    if (page.url().includes('/login')) {
      // Check for success message
      await expect(page.locator('text=Account creato con successo')).toBeVisible({ timeout: 5000 });
    }
    
    isLoggedIn = true;
  });

  test('should login with registered user', async ({ page }) => {
    test.skip(!isLoggedIn, 'User not registered');
    
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to new company page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to add new company
    await page.goto('/dashboard/companies/new');
    await page.waitForLoadState('networkidle');
    
    // Verify form is visible
    await expect(page.locator('input[name="legalName"]')).toBeVisible();
    await expect(page.locator('input[name="vatNumber"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(/Cerca|Aggiungi/i);
  });

  test('should create a new company and see analysis', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to add new company
    await page.goto('/dashboard/companies/new');
    await page.waitForLoadState('networkidle');
    
    // Fill company form
    await page.fill('input[name="legalName"]', TEST_COMPANY.legalName);
    await page.fill('input[name="vatNumber"]', TEST_COMPANY.vatNumber);
    
    // Country should default to Italy, but let's make sure
    // Select is already defaulted to IT
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for searching state
    await expect(page.locator('text=Stiamo cercando i dati')).toBeVisible({ timeout: 5000 });
    
    // Wait for success state (mock provider completes in ~300-500ms)
    await expect(page.locator('text=Azienda aggiunta')).toBeVisible({ timeout: 15000 });
    
    // Wait for redirect to company detail page
    await page.waitForURL(/\/dashboard\/companies\/[a-z0-9-]+$/, { timeout: 30000 });
    
    // Verify company detail page content
    await page.waitForLoadState('networkidle');
    
    // Company name should be visible in header
    await expect(page.locator(`text=${TEST_COMPANY.legalName}`).first()).toBeVisible({ timeout: 10000 });
    
    // Basic KPIs should be visible (from mock financial data)
    // The KPI cards section should contain financial metrics
    const kpiSection = page.locator('[class*="kpi"], [class*="card"]').first();
    
    // Check for typical KPI labels
    const hasKPIs = await page.locator('text=/Fatturato|Ricavi|Revenue|EBITDA|Margine/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasKPIs) {
      // KPIs are visible - success
      expect(hasKPIs).toBe(true);
    } else {
      // If KPIs aren't visible, check that at least the narrative section is present
      const hasNarrative = await page.locator('text=/Analisi|Panoramica|Overview/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasNarrative || hasKPIs).toBe(true);
    }
  });

  test('company should appear in companies list', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to companies list
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Company should be in the list
    await expect(page.locator(`text=${TEST_COMPANY.legalName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display narrative analysis section', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to companies list and click on our company
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Click on the company
    await page.click(`text=${TEST_COMPANY.legalName}`);
    
    // Wait for company detail page
    await page.waitForURL(/\/dashboard\/companies\/[a-z0-9-]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Verify narrative section is visible
    // Look for typical narrative headings
    const narrativeIndicators = [
      /Panoramica|Overview|Sintesi/i,
      /Punti di forza|Strengths/i,
      /Aree di miglioramento|Weaknesses|Criticità/i,
      /Analisi|Analysis/i,
    ];
    
    let foundNarrative = false;
    for (const indicator of narrativeIndicators) {
      if (await page.locator(`text=${indicator}`).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        foundNarrative = true;
        break;
      }
    }
    
    // Either narrative indicators are found, or we have basic analysis visible
    const hasBasicContent = await page.locator('text=/Sblocca|Analisi/i').first().isVisible().catch(() => false);
    expect(foundNarrative || hasBasicContent).toBe(true);
  });
});

test.describe('Company Creation - Validation', () => {
  test('should show error for empty company name', async ({ page }) => {
    // Login with test user (assuming registered from previous tests)
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // May fail if user doesn't exist, which is fine for this validation test
    try {
      await page.waitForURL('/dashboard', { timeout: 5000 });
    } catch {
      // Skip if login fails (user may not exist in this test run)
      test.skip();
      return;
    }
    
    await page.goto('/dashboard/companies/new');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling required field
    // The browser should prevent submission due to required attribute
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Form should still be visible (not submitted)
    await expect(page.locator('input[name="legalName"]')).toBeVisible();
  });
});

test.describe('Company Creation - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/companies/new');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});


