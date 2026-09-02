import { test, expect } from '@playwright/test';

test.describe('UI - Interface Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#stage', { timeout: 5000 });
  });

  test('should display main timer screen', async ({ page }) => {
    const stage = await page.locator('#stage');
    await expect(stage).toBeVisible();

    const phase = await page.locator('#phase');
    await expect(phase).toBeVisible();

    const exercise = await page.locator('#exercise');
    await expect(exercise).toBeVisible();

    const clock = await page.locator('#clock');
    await expect(clock).toBeVisible();
  });

  test('should display all control buttons', async ({ page }) => {
    const prevBtn = await page.locator('#prevBtn');
    await expect(prevBtn).toBeVisible();
    await expect(prevBtn).toContainText('Wstecz');

    const startBtn = await page.locator('#startBtn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText('Start');

    const nextBtn = await page.locator('#nextBtn');
    await expect(nextBtn).toBeVisible();
    await expect(nextBtn).toContainText('Dalej');

    const settingsBtn = await page.locator('#settingsBtn');
    await expect(settingsBtn).toBeVisible();
  });

  test('should display plan list', async ({ page }) => {
    const planList = await page.locator('#planList');
    await expect(planList).toBeVisible();

    const rows = await page.locator('.row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display remaining time indicator', async ({ page }) => {
    const remaining = await page.locator('#remainingTime');
    await expect(remaining).toBeVisible();
    await expect(remaining).toContainText('Pozostało');

    const value = await page.locator('#remainingTimeValue');
    await expect(value).toContainText(/\d{2}:\d{2}/);
  });

  test('should display plan selector', async ({ page }) => {
    const selector = await page.locator('#planSelector');
    await expect(selector).toBeVisible();

    const radios = await page.locator('input[name="plan"]');
    const count = await radios.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display progress bar', async ({ page }) => {
    const progress = await page.locator('.progress');
    await expect(progress).toBeVisible();
  });

  test('should display counter', async ({ page }) => {
    const counter = await page.locator('#counter');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText(/\d+ \/ \d+/);
  });

  test('should display next exercise hint', async ({ page }) => {
    const next = await page.locator('#next');
    await expect(next).toBeVisible();
    await expect(next).toContainText('Następnie');
  });

  test('previous button should be disabled at start', async ({ page }) => {
    const prevBtn = await page.locator('#prevBtn');
    await expect(prevBtn).toBeDisabled();
  });

  test('should have dark theme colors', async ({ page }) => {
    const stage = await page.locator('#stage');
    const bgColor = await stage.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // Should be dark theme (near black)
    expect(bgColor).toBeTruthy();
  });
});

test.describe('UI - Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#settingsBtn', { timeout: 5000 });
  });

  test('should open settings panel', async ({ page }) => {
    const settingsBtn = await page.locator('#settingsBtn');
    await settingsBtn.click();

    const panel = await page.locator('#settingsPanel');
    await expect(panel).toBeVisible();
  });

  test('should show all settings options', async ({ page }) => {
    const settingsBtn = await page.locator('#settingsBtn');
    await settingsBtn.click();

    await expect(page.locator('text=Rozmiar nazwy ćwiczenia')).toBeVisible();
    await expect(page.locator('text=Rozmiar „Następnie"')).toBeVisible();
    await expect(page.locator('text=Czas pracy')).toBeVisible();
    await expect(page.locator('text=Czas przerwy')).toBeVisible();
    await expect(page.locator('text=Nie wyłączaj ekranu')).toBeVisible();
  });

  test('should close settings when clicking outside', async ({ page }) => {
    const settingsBtn = await page.locator('#settingsBtn');
    await settingsBtn.click();

    const overlay = await page.locator('#settingsOverlay.open');
    await expect(overlay).toBeVisible();

    // Click on overlay itself (background)
    await page.click('#settingsOverlay');

    await expect(page.locator('#settingsOverlay.open')).not.toBeVisible();
  });

  test('should close settings with button', async ({ page }) => {
    const settingsBtn = await page.locator('#settingsBtn');
    await settingsBtn.click();

    const closeBtn = await page.locator('#closeSettingsBtn');
    await closeBtn.click();

    await expect(page.locator('#settingsOverlay.open')).not.toBeVisible();
  });
});
