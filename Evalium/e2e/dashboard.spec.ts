import { test, expect } from '@playwright/test';

test.describe('Dashboard (Unauthenticated)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing companies', async ({ page }) => {
    await page.goto('/dashboard/companies');
    
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing admin', async ({ page }) => {
    await page.goto('/dashboard/admin');
    
    await expect(page).toHaveURL(/\/login/);
  });
});

// Note: Authenticated tests would require setting up test user credentials
// and proper session handling. These would be added in a real testing environment.
test.describe('Dashboard (Authenticated)', () => {
  test.skip('should display dashboard when authenticated', async ({ page }) => {
    // This test would require:
    // 1. Setting up a test database with seed data
    // 2. Logging in with test credentials
    // 3. Verifying dashboard content
    
    // Example structure:
    // await page.goto('/login');
    // await page.fill('input[name="email"]', 'test@evalium.it');
    // await page.fill('input[name="password"]', 'testpassword');
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL('/dashboard');
    // await expect(page.locator('text=Ciao')).toBeVisible();
  });
});

