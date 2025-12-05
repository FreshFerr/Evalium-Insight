import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  test('should display homepage with hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section
    await expect(page.locator('h1')).toContainText('bilancio');
    await expect(page.locator('text=Inizia gratis')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await page.goto('/#pricing');
    
    await expect(page.locator('text=Prezzi semplici')).toBeVisible();
    await expect(page.locator('text=Gratuito')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/#faq');
    
    await expect(page.locator('text=Domande frequenti')).toBeVisible();
    await expect(page.locator('text=Come fate ad avere i dati')).toBeVisible();
  });

  test('should navigate to login from CTA', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Inizia gratis');
    
    await expect(page).toHaveURL('/register');
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Click on nav items
    await page.click('text=Come funziona');
    await expect(page.locator('text=Come funziona Evalium')).toBeVisible();
    
    await page.click('text=Prezzi');
    await expect(page.locator('text=Prezzi semplici')).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu should exist
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Inizia gratis').first()).toBeVisible();
  });
});


