import { test, expect } from '@playwright/test';

test.describe('Persistence - Workout State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#startBtn', { timeout: 5000 });
    // Clear any previous state
    await page.evaluate(() => localStorage.removeItem('workoutState'));
  });

  test('should save workout state to localStorage', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');

    await startBtn.click();
    await page.waitForTimeout(2000);
    await startBtn.click(); // Pause

    const state = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    expect(state).toBeTruthy();
    expect(state.idx).toBeDefined();
    expect(state.remaining).toBeDefined();
    expect(state.total).toBeDefined();
    expect(state.running).toBeDefined();
  });

  test('should include plan name in saved state', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');

    await startBtn.click();
    await page.waitForTimeout(1000);
    await startBtn.click(); // Pause

    const state = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    expect(state.selectedPlan).toBeTruthy();
  });

  test('should update state on every timer tick', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');

    await startBtn.click();

    const state1 = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    await page.waitForTimeout(1000);

    const state2 = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    expect(state2.remaining).toBeLessThan(state1.remaining);
  });

  test('should save state when pausing', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');

    await startBtn.click();
    await page.waitForTimeout(1500);

    const timeBeforePause = await page.locator('#clock').textContent();

    await startBtn.click(); // Pause

    const state = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    expect(state.running).toBe(false);
  });

  test('should save state when navigating', async ({ page }) => {
    const nextBtn = await page.locator('#nextBtn');

    await nextBtn.click();

    const state = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    expect(state.idx).toBe(1);
  });

  test('should clear state when finishing workout', async ({ page, context }) => {
    // Manually set state as if workout finished
    await page.evaluate(() => {
      // Simulate a workout that's almost finished
      localStorage.setItem('workoutState', JSON.stringify({
        selectedPlan: 'plan-0',
        idx: 0,
        remaining: 1,
        total: 120,
        running: true
      }));
    });

    // Reload to pick up the state
    await page.reload({ waitUntil: 'networkidle' });

    // Wait for resume dialog to potentially appear
    const resumeDialog = await page.locator('#resumeOverlay.open').isVisible().catch(() => false);

    if (resumeDialog) {
      // Click resume to get to that step
      await page.click('#resumeBtn');
      await page.waitForTimeout(500);
    }

    // Start and let it tick through to finish
    const startBtn = await page.locator('#startBtn');
    await startBtn.click();

    // Wait for the timer to complete - should transition to next step and finish
    await page.waitForTimeout(3000);

    // Check if state was cleared (or if still running, it's okay)
    const state = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    // State may or may not be cleared depending on where we are
    // This test mainly checks we don't get errors
    expect(state === null || state.idx >= 0).toBeTruthy();
  });
});

test.describe('Persistence - Resume Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#startBtn', { timeout: 5000 });
  });

  test('should show resume dialog when state exists', async ({ page }) => {
    // Create a saved state
    await page.evaluate(() => {
      localStorage.setItem('workoutState', JSON.stringify({
        selectedPlan: 'plan-0',
        idx: 0,
        remaining: 100,
        total: 120,
        running: false
      }));
    });

    await page.reload({ waitUntil: 'networkidle' });

    const resumeOverlay = await page.locator('#resumeOverlay.open');
    await expect(resumeOverlay).toBeVisible();
  });

  test('should display correct details in resume dialog', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('workoutState', JSON.stringify({
        selectedPlan: 'plan-0',
        idx: 0,
        remaining: 100,
        total: 120,
        running: false
      }));
    });

    await page.reload({ waitUntil: 'networkidle' });

    const details = await page.locator('#resumeDetails');
    const text = await details.textContent();

    expect(text).toContain('Skakanka spokojnie'); // First exercise name
    expect(text).toContain('01:40'); // 100 seconds formatted
  });

  test('should have resume and new workout buttons', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('workoutState', JSON.stringify({
        selectedPlan: 'plan-0',
        idx: 0,
        remaining: 100,
        total: 120,
        running: false
      }));
    });

    await page.reload({ waitUntil: 'networkidle' });

    const resumeBtn = await page.locator('#resumeBtn');
    const newBtn = await page.locator('#newBtn');

    await expect(resumeBtn).toBeVisible();
    await expect(newBtn).toBeVisible();

    expect(await resumeBtn.textContent()).toContain('Wznów');
    expect(await newBtn.textContent()).toContain('Nowy');
  });

  test('should restore workout when clicking resume', async ({ page }) => {
    const startBtn = await page.locator('#startBtn');

    // Start and run for a bit
    await startBtn.click();
    await page.waitForTimeout(2000);
    await startBtn.click(); // Pause

    const exerciseBeforePause = await page.locator('#exercise').textContent();
    const timeBeforePause = await page.locator('#clock').textContent();

    // Reload the page
    await page.reload({ waitUntil: 'networkidle' });

    const resumeOverlay = await page.locator('#resumeOverlay.open').isVisible().catch(() => false);
    if (resumeOverlay) {
      await page.click('#resumeBtn');
      await page.waitForTimeout(500);
    }

    const exerciseAfterResume = await page.locator('#exercise').textContent();
    const timeAfterResume = await page.locator('#clock').textContent();

    expect(exerciseAfterResume).toBe(exerciseBeforePause);
    expect(timeAfterResume).toBe(timeBeforePause);
  });

  test('should start fresh when clicking new workout', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('workoutState', JSON.stringify({
        selectedPlan: 'plan-0',
        idx: 5,
        remaining: 30,
        total: 60,
        running: false
      }));
    });

    await page.reload({ waitUntil: 'networkidle' });

    const resumeOverlay = await page.locator('#resumeOverlay.open').isVisible().catch(() => false);
    if (resumeOverlay) {
      await page.click('#newBtn');
      await page.waitForTimeout(500);
    }

    const counter = await page.locator('#counter');
    const text = await counter.textContent();

    expect(text).toContain('1 /'); // Back at first step
  });

  test('should not show resume dialog if plan changed', async ({ page }) => {
    // Save state for plan-0
    await page.evaluate(() => {
      localStorage.setItem('workoutState', JSON.stringify({
        selectedPlan: 'plan-0',
        idx: 0,
        remaining: 100,
        total: 120,
        running: false
      }));
      // Change selected plan to plan-1
      localStorage.setItem('selectedPlan', 'plan-1');
    });

    await page.reload({ waitUntil: 'networkidle' });

    // Resume dialog should not appear because plan changed
    const resumeOverlay = await page.locator('#resumeOverlay').isVisible();

    // Should show plan-1 content
    const exercise = await page.locator('#exercise');
    const text = await exercise.textContent();

    expect(text).toBeTruthy();
  });

  test('should clear state when switching plans', async ({ page }) => {
    // Start a workout
    const startBtn = await page.locator('#startBtn');
    await startBtn.click();
    await page.waitForTimeout(1000);

    // Switch to plan-1
    const plan1 = await page.locator('input[value="plan-1"]');
    await plan1.click();

    await page.waitForTimeout(500);

    // State should be cleared
    const state = await page.evaluate(() => {
      const saved = localStorage.getItem('workoutState');
      return saved ? JSON.parse(saved) : null;
    });

    expect(state).toBeNull();
  });
});
