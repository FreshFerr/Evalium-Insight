import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText('Bentornato');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.locator('h1')).toContainText('Crea il tuo account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('text=Registrati gratis');
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Crea il tuo account');
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Email o password non corrette')).toBeVisible({ timeout: 10000 });
  });

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await expect(page.locator('h1')).toContainText('Password dimenticata');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});


