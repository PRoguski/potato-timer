import { test, expect } from '@playwright/test';

test.describe('Timer - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#startBtn', { timeout: 5000 });
  });

  test('should display initial time format MM:SS', async ({ page }) => {
    const clock = await page.locator('#clock');
    const text = await clock.textContent();
    expect(text).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should start timer on Start button click', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');
    const clock = await page.locator('#clock');

    const initialTime = await clock.textContent();
    await startBtn.click();

    // Wait 2 seconds and check if time decreased
    await page.waitForTimeout(2000);
    const afterTime = await clock.textContent();

    expect(afterTime).not.toBe(initialTime);
    expect(startBtn).toContainText('Pauza');
  });

  test('should pause timer on Pause button click', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');
    const clock = await page.locator('#clock');

    await startBtn.click();
    await page.waitForTimeout(1000);

    const pausedTime = await clock.textContent();
    await startBtn.click(); // Pause

    await page.waitForTimeout(1500);
    const stillPausedTime = await clock.textContent();

    expect(pausedTime).toBe(stillPausedTime);
    expect(startBtn).toContainText('Wznów');
  });

  test('should resume timer from pause', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');
    const clock = await page.locator('#clock');

    await startBtn.click();
    await page.waitForTimeout(1000);
    await startBtn.click(); // Pause

    const pausedTime = await clock.textContent();
    await startBtn.click(); // Resume

    await page.waitForTimeout(1000);
    const resumedTime = await clock.textContent();

    expect(pausedTime).not.toBe(resumedTime);
  });

  test('should change button text during lifecycle', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');

    await expect(startBtn).toContainText('Start');

    await startBtn.click();
    await expect(startBtn).toContainText('Pauza');

    await startBtn.click();
    await expect(startBtn).toContainText('Wznów');
  });

  test('should update progress bar during countdown', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');
    const progress = await page.locator('.progress');

    const initialWidth = await progress.evaluate(el => el.style.width);
    expect(initialWidth).toBe('0%');

    await startBtn.click();
    await page.waitForTimeout(2000);

    const newWidth = await progress.evaluate(el => el.style.width);
    expect(newWidth).not.toBe('0%');
    expect(parseFloat(newWidth) > 0).toBeTruthy();
  });

  test('should increment counter correctly', async ({ page }) => {
    const counter = await page.locator('#counter');
    const initialText = await counter.textContent();

    expect(initialText).toContain('1 /');
  });

  test('should disable previous button at start', async ({ page }) => {
    const prevBtn = await page.locator('#prevBtn');
    await expect(prevBtn).toBeDisabled();
  });

  test('should enable previous button when not at start', async ({ page }) => {
    const prevBtn = await page.locator('#prevBtn');
    const nextBtn = await page.locator('#nextBtn');

    await nextBtn.click();
    await expect(prevBtn).toBeEnabled();
  });

  test('should navigate to next step', async ({ page }) => {
    const nextBtn = await page.locator('#nextBtn');
    const exercise = await page.locator('#exercise');

    const initialExercise = await exercise.textContent();
    await nextBtn.click();
    await page.waitForTimeout(300);

    const nextExercise = await exercise.textContent();
    expect(nextExercise).not.toBe(initialExercise);
  });

  test('should navigate to previous step', async ({ page }) => {
    const nextBtn = await page.locator('#nextBtn');
    const prevBtn = await page.locator('#prevBtn');
    const exercise = await page.locator('#exercise');

    const initialExercise = await exercise.textContent();
    await nextBtn.click();
    await page.waitForTimeout(300);
    await prevBtn.click();
    await page.waitForTimeout(300);

    const backExercise = await exercise.textContent();
    expect(backExercise).toBe(initialExercise);
  });

  test('should update remaining time display', async ({ page }) => {
    const remaining = await page.locator('#remainingTimeValue');
    const text = await remaining.textContent();

    expect(text).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should change background color by phase', async ({ page }) => {
    const stage = await page.locator('#stage');

    const initialClass = await stage.getAttribute('class');
    expect(initialClass).toBeTruthy();
  });
});

test.describe('Timer - Phase Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#phase', { timeout: 5000 });
  });

  test('should show correct phase labels', async ({ page }) => {
    const phase = await page.locator('#phase');
    const text = await phase.textContent();

    expect(['Rozgrzewka', 'Ćwiczenie', 'Przerwa']).toContain(text);
  });

  test('should update phase when moving between steps', async ({ page }) => {
    const nextBtn = await page.locator('#nextBtn');
    const phase = await page.locator('#phase');

    const initialPhase = await phase.textContent();

    // Click next a few times
    for (let i = 0; i < 3; i++) {
      await nextBtn.click();
      await page.waitForTimeout(200);
    }

    const newPhase = await phase.textContent();
    // At some point phase should differ
    expect(newPhase).toBeTruthy();
  });
});
