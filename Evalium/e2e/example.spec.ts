import { test, expect } from '@playwright/test';

test.describe('Evalium E2E Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Evalium/);
  });

  // More tests will be added as features are implemented
});

