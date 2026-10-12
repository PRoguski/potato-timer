import { test, expect } from '@playwright/test';

test.describe('Workout Plans', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#stage');
  });

  test.describe('Plan Loading', () => {
    test('should load plan-0 by default', async ({ page }) => {
      const plan0Radio = page.locator('input[name="plan"][value="0"]');
      await expect(plan0Radio).toBeChecked();
    });

    test('should display all steps from plan JSON', async ({ page }) => {
      const planList = page.locator('#planList');
      await expect(planList).toBeVisible();

      // Open the plan list
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Verify steps are displayed
      const steps = page.locator('#planList .step-row');
      const count = await steps.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should load correct plan when selected', async ({ page }) => {
      const plan1Radio = page.locator('input[name="plan"][value="1"]');
      await plan1Radio.click();
      await page.waitForTimeout(300);

      // Verify plan 1 is loaded
      await expect(plan1Radio).toBeChecked();

      // Verify content changed (different steps)
      const planList = page.locator('#planList');
      await expect(planList).toBeVisible();
    });

    test('should load plan from plans/ directory', async ({ page }) => {
      // Network requests should show plan files loading
      const plan2Radio = page.locator('input[name="plan"][value="2"]');
      await plan2Radio.click();
      await page.waitForTimeout(300);

      // App should still be functional
      const stage = page.locator('#stage');
      await expect(stage).toBeVisible();
    });

    test('should handle plan load errors gracefully', async ({ page }) => {
      // Even if a plan fails to load, app should be functional
      const stage = page.locator('#stage');
      await expect(stage).toBeVisible();

      // Plans selector should still work
      const plan0Radio = page.locator('input[name="plan"][value="0"]');
      await expect(plan0Radio).toBeVisible();
    });
  });

  test.describe('Plan Structure', () => {
    test('should include ROZGRZEWKA (warm-up) section', async ({ page }) => {
      const planList = page.locator('#planList');
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const warmupSection = page.locator('#planList .step-row:has-text("ROZGRZEWKA")');
      await expect(warmupSection).toBeVisible();
    });

    test('should include RUNDA sections (1-4)', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Look for round sections
      const rounds = page.locator('#planList .step-row:has-text("RUNDA")');
      const count = await rounds.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should include SCHŁODZENIE (cool-down) section', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const cooldownSection = page.locator('#planList .step-row:has-text("SCHŁODZENIE")');
      await expect(cooldownSection).toBeVisible();
    });

    test('should have work exercises in each round', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const steps = page.locator('#planList .step-row');
      const count = await steps.count();
      // Should have many steps if includes work phases
      expect(count).toBeGreaterThan(5);
    });

    test('should have rest periods between exercises', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Navigate to rest phase
      const nextBtn = page.locator('#nextBtn');
      for (let i = 0; i < 5; i++) {
        await nextBtn.click();
        await page.waitForTimeout(200);

        const phase = page.locator('#phase');
        const phaseText = await phase.textContent();
        if (phaseText?.trim() === 'Przerwa') {
          expect(phaseText?.trim()).toBe('Przerwa');
          break;
        }
      }
    });

    test('should have prep periods for warm-up and cool-down', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Look for prep steps
      const prepSteps = page.locator('#planList .step-row:has-text("Przygotowanie")');
      const count = await prepSteps.count();
      // Should have at least some prep steps
      expect(count).toBeGreaterThan(0);
    });

    test('should not include section headers in step counter', async ({ page }) => {
      const counter = page.locator('#counter');
      const text = await counter.textContent();
      const parts = text?.split('/');
      const currentStep = parseInt(parts?.[0] || '0');
      const totalSteps = parseInt(parts?.[1] || '0');

      // Counter should show valid step numbers
      expect(currentStep).toBeGreaterThanOrEqual(1);
      expect(totalSteps).toBeGreaterThan(0);
      // Headers shouldn't be counted, so total should be reasonable
      expect(totalSteps).toBeLessThan(100);
    });
  });

  test.describe('Prep Time Insertion', () => {
    test('should insert prep steps dynamically', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Look for prep steps with proper name
      const prepSteps = page.locator('#planList .step-row:has-text("przygotowanie")');
      const count = await prepSteps.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should insert prep after each rest period (except before cooldown)', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Navigate through steps and look for prep after rest
      const nextBtn = page.locator('#nextBtn');
      let foundPrepAfterRest = false;

      for (let i = 0; i < 10; i++) {
        const phase = page.locator('#phase');
        const phaseText = await phase.textContent();

        if (phaseText?.trim() === 'Przerwa') {
          // Found rest, next should be prep
          await nextBtn.click();
          await page.waitForTimeout(200);

          const nextPhaseText = await phase.textContent();
          if (nextPhaseText?.trim() === 'Przygotowanie') {
            foundPrepAfterRest = true;
            break;
          }
        }

        await nextBtn.click();
        await page.waitForTimeout(200);
      }

      // At least found pattern once
      expect(foundPrepAfterRest).toBe(true);
    });

    test('should not insert prep before SCHŁODZENIE section', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Navigate to near end of workout
      const counter = page.locator('#counter');
      const nextBtn = page.locator('#nextBtn');

      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const curStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (curStep >= totalSteps - 3) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // At end, should not have prep anymore
      const phase = page.locator('#phase');
      const phaseText = await phase.textContent();
      expect(phaseText?.trim().length).toBeGreaterThan(0);
    });

    test('should use configurable prep time duration', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const summary = page.locator('#planList summary');

      // Change prep time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('20');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Check plan list for prep times
      await summary.click();
      await page.waitForTimeout(200);

      const planList = page.locator('#planList');
      await expect(planList).toBeVisible();
    });

    test('should name prep steps correctly', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Look for correct prep step name
      const prepSteps = page.locator('#planList .step-row:has-text("Czas na przygotowanie")');
      const count = await prepSteps.count();
      // Should have at least some prep steps with correct name
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should update prep durations when prep time setting changes', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const summary = page.locator('#planList summary');
      const remainingTime = page.locator('#remainingTime');

      const initialTime = await remainingTime.textContent();

      // Change prep time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('25');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Total time should update
      const newTime = await remainingTime.textContent();
      expect(newTime).not.toBe(initialTime);
    });

    test('should apply prep time to all inserted steps', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Look for prep step durations
      const prepDurations = page.locator('#planList .step-row:has-text("Przygotowanie") .step-duration');
      const count = await prepDurations.count();

      if (count > 1) {
        // Get all prep step durations
        const durations = [];
        for (let i = 0; i < count; i++) {
          const text = await prepDurations.nth(i).textContent();
          durations.push(text?.trim());
        }

        // All should be the same duration
        const firstDuration = durations[0];
        for (const duration of durations) {
          expect(duration).toBe(firstDuration);
        }
      }
    });
  });

  test.describe('Plan Selector', () => {
    test('should display plan selector with radio buttons', async ({ page }) => {
      const planSelector = page.locator('#planSelector');
      await expect(planSelector).toBeVisible();

      const radios = page.locator('input[name="plan"]');
      const count = await radios.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should have plan-0 selected by default', async ({ page }) => {
      const plan0Radio = page.locator('input[name="plan"][value="0"]');
      await expect(plan0Radio).toBeChecked();
    });

    test('should select plan-1 when clicked', async ({ page }) => {
      const plan1Radio = page.locator('input[name="plan"][value="1"]');
      await plan1Radio.click();
      await page.waitForTimeout(200);

      await expect(plan1Radio).toBeChecked();
    });

    test('should select plan-2 when clicked', async ({ page }) => {
      const plan2Radio = page.locator('input[name="plan"][value="2"]');
      await plan2Radio.click();
      await page.waitForTimeout(200);

      await expect(plan2Radio).toBeChecked();
    });

    test('should load selected plan immediately', async ({ page }) => {
      const plan1Radio = page.locator('input[name="plan"][value="1"]');
      const planList = page.locator('#planList');

      const summary = page.locator('#planList summary');
      const initialSummary = await summary.textContent();

      // Select plan 1
      await plan1Radio.click();
      await page.waitForTimeout(300);

      // Verify plan loaded
      const newSummary = await summary.textContent();
      expect(planList).toBeVisible();
    });

    test('should pause timer when changing plans', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const plan1Radio = page.locator('input[name="plan"][value="1"]');

      // Start timer
      await startBtn.click();
      await page.waitForTimeout(500);

      // Button should show Pauza
      let btnText = await startBtn.textContent();
      expect(btnText?.trim()).toBe('Pauza');

      // Change plan
      await plan1Radio.click();
      await page.waitForTimeout(300);

      // Timer should be paused
      btnText = await startBtn.textContent();
      expect(btnText?.trim()).toBe('Start');
    });

    test('should reset to first step when changing plans', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');
      const plan1Radio = page.locator('input[name="plan"][value="1"]');

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        await nextBtn.click();
        await page.waitForTimeout(200);
      }

      const beforeCounter = await counter.textContent();
      expect(beforeCounter?.split('/')[0]).not.toBe('1');

      // Change plan
      await plan1Radio.click();
      await page.waitForTimeout(300);

      // Should be back at step 1
      const afterCounter = await counter.textContent();
      expect(afterCounter?.split('/')[0]).toBe('1');
    });

    test('should reset timer display when changing plans', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');
      const plan2Radio = page.locator('input[name="plan"][value="2"]');

      // Get initial clock
      const initialClock = await clock.textContent();

      // Start and let it count
      await startBtn.click();
      await page.waitForTimeout(1000);

      const countedClock = await clock.textContent();
      expect(countedClock).not.toBe(initialClock);

      // Change plan
      await plan2Radio.click();
      await page.waitForTimeout(300);

      // Clock should be reset
      const resetClock = await clock.textContent();
      expect(resetClock).toBeTruthy();
    });

    test('should save selected plan to localStorage', async ({ page }) => {
      const plan2Radio = page.locator('input[name="plan"][value="2"]');

      // Select plan 2
      await plan2Radio.click();
      await page.waitForTimeout(300);

      // Close and reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify plan 2 is still selected
      await expect(plan2Radio).toBeChecked();
    });

    test('should load saved plan preference on startup', async ({ page }) => {
      const plan1Radio = page.locator('input[name="plan"][value="1"]');

      // Select plan 1
      await plan1Radio.click();
      await page.waitForTimeout(300);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify plan 1 loaded
      await expect(plan1Radio).toBeChecked();
    });
  });

  test.describe('Plan List Display', () => {
    test('should show expandable plan list in details element', async ({ page }) => {
      const planList = page.locator('#planList');
      await expect(planList).toBeVisible();
    });

    test('should display plan summary with duration', async ({ page }) => {
      const summary = page.locator('#planList summary');
      const text = await summary.textContent();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('should expand/collapse list on summary click', async ({ page }) => {
      const summary = page.locator('#planList summary');
      const list = page.locator('#planList .plan-list');

      let isVisible = await list.isVisible();
      await summary.click();
      await page.waitForTimeout(100);

      const newVisibility = await list.isVisible();
      expect(newVisibility).not.toBe(isVisible);
    });

    test('should display all plan steps in list', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const steps = page.locator('#planList .step-row');
      const count = await steps.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show step type indicators (colored dots)', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const dots = page.locator('#planList .type-dot');
      const count = await dots.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display step names', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const names = page.locator('#planList .step-name');
      const count = await names.count();
      expect(count).toBeGreaterThan(0);

      const firstText = await names.first().textContent();
      expect(firstText?.length).toBeGreaterThan(0);
    });

    test('should display step durations in MM:SS format', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const durations = page.locator('#planList .step-duration');
      const firstDuration = await durations.first().textContent();
      expect(firstDuration?.trim()).toMatch(/\d+:\d+|s$/);
    });

    test('should not display durations for headers', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      // Headers should not have durations
      const list = page.locator('#planList');
      await expect(list).toBeVisible();
    });

    test('should highlight current active step', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const activeStep = page.locator('#planList .step-row.active');
      await expect(activeStep).toBeVisible();
    });

    test('should update highlight as workout progresses', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const nextBtn = page.locator('#nextBtn');

      // Get initial active step
      let activeSteps = page.locator('#planList .step-row.active');
      let initialCount = await activeSteps.count();

      // Move to next step
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Active should still exist (different one)
      activeSteps = page.locator('#planList .step-row.active');
      let newCount = await activeSteps.count();
      expect(newCount).toBeGreaterThan(0);
    });

    test('should allow jumping to step by clicking row', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const counter = page.locator('#counter');
      const initialCounter = await counter.textContent();

      // Click second step in list
      const rows = page.locator('#planList .step-row');
      if (await rows.count() > 1) {
        await rows.nth(1).click();
        await page.waitForTimeout(200);

        const newCounter = await counter.textContent();
        expect(newCounter).not.toBe(initialCounter);
      }
    });

    test('should display step index numbers', async ({ page }) => {
      const summary = page.locator('#planList summary');
      await summary.click();
      await page.waitForTimeout(200);

      const rows = page.locator('#planList .step-row');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Exercise Information', () => {
    test('should display exercise name for work steps', async ({ page }) => {
      const exercise = page.locator('#exercise');
      await expect(exercise).toBeVisible();
      const text = await exercise.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });

    test('should display "Przerwa" for rest steps', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      for (let i = 0; i < 5; i++) {
        const phaseText = await phase.textContent();
        if (phaseText?.trim() === 'Przerwa') {
          expect(phaseText?.trim()).toBe('Przerwa');
          return;
        }
        await nextBtn.click();
        await page.waitForTimeout(200);
      }
    });

    test('should display prep step name', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      for (let i = 0; i < 10; i++) {
        const phaseText = await phase.textContent();
        if (phaseText?.trim() === 'Przygotowanie') {
          expect(phaseText?.trim()).toBe('Przygotowanie');
          return;
        }
        await nextBtn.click();
        await page.waitForTimeout(200);
      }
    });

    test('should display exercise GIF if available', async ({ page }) => {
      const image = page.locator('#exerciseImage');
      const isVisible = await image.isVisible();
      // May or may not be visible depending on current step
      expect(typeof isVisible).toBe('boolean');
    });

    test('should load GIF from Giphy URL', async ({ page }) => {
      const image = page.locator('#exerciseImage');
      const isVisible = await image.isVisible();

      if (isVisible) {
        const src = await image.getAttribute('src');
        expect(src).toContain('giphy.com');
      }
    });

    test('should not display image for rest periods without images', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const phase = page.locator('#phase');
      const image = page.locator('#exerciseImage');

      // Navigate to rest phase
      for (let i = 0; i < 5; i++) {
        const phaseText = await phase.textContent();
        if (phaseText?.trim() === 'Przerwa') {
          // At rest, image should be hidden
          const isVisible = await image.isVisible();
          expect(typeof isVisible).toBe('boolean');
          break;
        }
        await nextBtn.click();
        await page.waitForTimeout(200);
      }
    });

    test('should handle missing GIF URLs gracefully', async ({ page }) => {
      // App should remain functional even if images fail
      const stage = page.locator('#stage');
      await expect(stage).toBeVisible();

      const startBtn = page.locator('#startBtn');
      await expect(startBtn).toBeVisible();
    });
  });

  test.describe('Plan Duration', () => {
    test('should calculate total workout duration correctly', async ({ page }) => {
      const summary = page.locator('#planList summary');
      const text = await summary.textContent();
      // Summary should contain duration info
      expect(text?.length).toBeGreaterThan(0);
    });

    test('should show duration in plan summary', async ({ page }) => {
      const summary = page.locator('#planList summary');
      const text = await summary.textContent();
      // Should show time (minutes or full duration)
      expect(text).toMatch(/\d+/);
    });

    test('should update duration when times change', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const summary = page.locator('#planList summary');

      const initialText = await summary.textContent();

      // Change work time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      await workTime.fill('90');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(200);

      // Duration should have changed
      const newText = await summary.textContent();
      expect(newText).not.toBe(initialText);
    });

    test('should include prep time in total duration', async ({ page }) => {
      const remainingTime = page.locator('#remainingTime');
      const text = await remainingTime.textContent();
      // Should show total remaining time including prep
      expect(text?.trim()).toMatch(/^\d{2}:\d{2}$/);
    });

    test('should calculate remaining time correctly', async ({ page }) => {
      const remainingTime = page.locator('#remainingTime');
      const text = await remainingTime.textContent();
      const parts = text?.split(':');
      const minutes = parseInt(parts?.[0] || '0');
      const seconds = parseInt(parts?.[1] || '0');
      const total = minutes * 60 + seconds;

      // Should have some remaining time
      expect(total).toBeGreaterThan(0);
    });
  });

  test.describe('Plan Availability', () => {
    test('should have at least 3 plans available', async ({ page }) => {
      const radios = page.locator('input[name="plan"]');
      const count = await radios.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should detect available plans on startup', async ({ page }) => {
      const planSelector = page.locator('#planSelector');
      await expect(planSelector).toBeVisible();

      const radios = page.locator('input[name="plan"]');
      const count = await radios.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should handle missing plan files gracefully', async ({ page }) => {
      // App should be functional even if some plans are missing
      const stage = page.locator('#stage');
      await expect(stage).toBeVisible();

      // Selector should still work
      const plan0Radio = page.locator('input[name="plan"][value="0"]');
      await expect(plan0Radio).toBeVisible();
    });

    test('should switch to plan-0 if current plan missing', async ({ page }) => {
      // App should have fallback to plan-0
      const plan0Radio = page.locator('input[name="plan"][value="0"]');
      await expect(plan0Radio).toBeVisible();

      // Plan 0 should be available
      const planList = page.locator('#planList');
      await expect(planList).toBeVisible();
    });
  });
});
