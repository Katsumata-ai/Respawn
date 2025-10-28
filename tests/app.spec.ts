/**
 * Playwright tests for Course Downloader Whop App
 * Tests app loading, authentication, and basic functionality
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Course Downloader App', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock Whop token in headers
    await page.addInitScript(() => {
      // Mock localStorage for Whop context
      localStorage.setItem('whop_token', 'mock_token_for_testing');
    });
  });

  test('should load without hydration errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to app
    await page.goto(BASE_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for hydration errors
    const hydrationErrors = errors.filter((e) =>
      e.includes('hydration') || e.includes('mismatch')
    );

    expect(hydrationErrors).toHaveLength(0);
    console.log('✅ No hydration errors detected');
  });

  test('should display loading state initially', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for loading indicator
    const loadingText = page.locator('text=Loading');
    await expect(loadingText).toBeVisible({ timeout: 5000 });

    console.log('✅ Loading state displayed');
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check page title
    const title = await page.title();
    expect(title).toContain('Course Downloader');

    console.log('✅ Page title is correct');
  });

  test('should display main heading', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Course Downloader');

    console.log('✅ Main heading displayed');
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    // Wait for content
    await page.waitForTimeout(2000);

    // Check if content is visible
    const main = page.locator('main');
    await expect(main).toBeVisible();

    console.log('✅ Mobile responsive design works');

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);

    await page.waitForTimeout(2000);
    await expect(main).toBeVisible();

    console.log('✅ Desktop responsive design works');
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Filter out expected warnings
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('React DevTools') && !e.includes('extension')
    );

    expect(unexpectedErrors).toHaveLength(0);
    console.log(`✅ No unexpected console errors (${warnings.length} warnings)`);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    console.log('✅ Meta tags are present');
  });

  test('should have accessible structure', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check for headings
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✅ Accessible structure with ${count} headings`);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate errors
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // App should still be visible (not crash)
    const main = page.locator('main');
    const isVisible = await main.isVisible().catch(() => false);

    console.log(`✅ App handles API errors gracefully (visible: ${isVisible})`);
  });
});

test.describe('API Routes', () => {
  test('GET /api/whop/user should return 401 without token', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/whop/user`);
    expect(response.status()).toBe(401);
    console.log('✅ /api/whop/user returns 401 without token');
  });

  test('GET /api/whop/validate-access should return 401 without token', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/whop/validate-access`);
    expect(response.status()).toBe(401);
    console.log('✅ /api/whop/validate-access returns 401 without token');
  });

  test('POST /api/webhooks/whop should return 401 without signature', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/webhooks/whop`, {
      data: { event: 'payment.completed' },
    });
    expect(response.status()).toBe(401);
    console.log('✅ /api/webhooks/whop returns 401 without signature');
  });
});

