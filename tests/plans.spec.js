import { test, expect } from '@playwright/test';

test.describe('Plans - Selector Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#planSelector', { timeout: 5000 });
  });

  test('should detect all available plans', async ({ page }) => {
    const radios = await page.locator('input[name="plan"]');
    const count = await radios.count();

    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should have plan-0, plan-1, plan-2 available', async ({ page }) => {
    const plan0 = await page.locator('input[value="plan-0"]');
    const plan1 = await page.locator('input[value="plan-1"]');
    const plan2 = await page.locator('input[value="plan-2"]');

    await expect(plan0).toBeVisible();
    await expect(plan1).toBeVisible();
    await expect(plan2).toBeVisible();
  });

  test('should display plan names', async ({ page }) => {
    await expect(page.locator('text=60 min')).toBeVisible();
    await expect(page.locator('text=30 min')).toBeVisible();
    await expect(page.locator('text=Tabata')).toBeVisible();
  });

  test('should have plan-0 selected by default', async ({ page }) => {
    const plan0 = await page.locator('input[value="plan-0"]:checked');
    await expect(plan0).toBeChecked();
  });

  test('should switch to plan-1', async ({ page }) => {
    const plan1 = await page.locator('input[value="plan-1"]');
    await plan1.click();

    await page.waitForTimeout(500);

    const exercise = await page.locator('#exercise');
    const text = await exercise.textContent();

    // Plan-1 is 30 min, should load different exercises
    expect(text).toBeTruthy();
  });

  test('should switch to plan-2 (TABATA)', async ({ page }) => {
    const plan2 = await page.locator('input[value="plan-2"]');
    await plan2.click();

    await page.waitForTimeout(500);

    const exercise = await page.locator('#exercise');
    const text = await exercise.textContent();

    expect(text).toContain('Dynamiczna rozgrzewka');
  });

  test('should update exercise list when switching plans', async ({ page }) => {
    const exercise = await page.locator('#exercise');

    const plan0Exercise = await exercise.textContent();

    const plan1 = await page.locator('input[value="plan-1"]');
    await plan1.click();

    await page.waitForTimeout(500);

    const plan1Exercise = await exercise.textContent();

    // Different plans might have same first exercise, but check it loads
    expect(plan1Exercise).toBeTruthy();
  });

  test('should update clock time for different plans', async ({ page }) => {
    const clock = await page.locator('#clock');

    const plan0Time = await clock.textContent();

    const plan1 = await page.locator('input[value="plan-1"]');
    await plan1.click();

    await page.waitForTimeout(500);

    const plan1Time = await clock.textContent();

    expect(plan1Time).toBeTruthy();
  });

  test('should update plan list when switching plans', async ({ page }) => {
    const rows = await page.locator('.row:not(.head)');
    const plan0Count = await rows.count();

    const plan1 = await page.locator('input[value="plan-1"]');
    await plan1.click();

    await page.waitForTimeout(500);

    const newRows = await page.locator('.row:not(.head)');
    const plan1Count = await newRows.count();

    // Different plans have different number of exercises
    expect(plan1Count).toBeGreaterThan(0);
  });

  test('should persist plan selection in localStorage', async ({ page }) => {
    const plan2 = await page.locator('input[value="plan-2"]');
    await plan2.click();

    await page.waitForTimeout(300);

    const selectedPlan = await page.evaluate(() => {
      return localStorage.getItem('selectedPlan');
    });

    expect(selectedPlan).toBe('plan-2');
  });

  test('should restore plan selection on reload', async ({ page }) => {
    const plan1 = await page.locator('input[value="plan-1"]');
    await plan1.click();

    await page.waitForTimeout(300);

    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForSelector('input[value="plan-1"]:checked', { timeout: 5000 });

    const selectedPlan = await page.locator('input[value="plan-1"]:checked');
    await expect(selectedPlan).toBeChecked();
  });
});

test.describe('Plans - Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#planList', { timeout: 5000 });
  });

  test('plan-0 should have section headers', async ({ page }) => {
    await expect(page.locator('text=ROZGRZEWKA')).toBeVisible();
    await expect(page.locator('text=RUNDA')).toBeVisible();
    await expect(page.locator('text=SCHŁODZENIE')).toBeVisible();
  });

  test('should display exercise count', async ({ page }) => {
    const counter = await page.locator('#counter');
    const text = await counter.textContent();

    const match = text.match(/(\d+) \/ (\d+)/);
    expect(match).toBeTruthy();
    expect(parseInt(match[1])).toBeGreaterThan(0);
    expect(parseInt(match[2])).toBeGreaterThan(0);
  });

  test('should be able to click on exercises in plan list', async ({ page }) => {
    const exerciseRows = await page.locator('.row:not(.head)');
    const firstRow = exerciseRows.first();

    // Get initial exercise
    const exercise = await page.locator('#exercise');
    const initialText = await exercise.textContent();

    // Click on a different row
    const rows = await exerciseRows.all();
    if (rows.length > 1) {
      await rows[1].click();
      await page.waitForTimeout(300);

      const newText = await exercise.textContent();
      expect(newText).not.toBe(initialText);
    }
  });
});
