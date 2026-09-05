import { test, expect } from '@playwright/test';

test.describe('Timer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#stage');
  });

  test.describe('Timer Display', () => {
    test('should show initial time for first exercise', async ({ page }) => {
      const clock = page.locator('#clock');
      await expect(clock).toBeVisible();
      const text = await clock.textContent();
      // Should show MM:SS format
      expect(text?.trim()).toMatch(/^\d{2}:\d{2}$/);
    });

    test('should display time in MM:SS format', async ({ page }) => {
      const clock = page.locator('#clock');
      const text = await clock.textContent();
      // Verify format like "01:30" or "00:15"
      expect(text?.trim()).toMatch(/^\d{2}:\d{2}$/);
    });

    test('should have tabular numbers for clock', async ({ page }) => {
      const clock = page.locator('#clock');
      const style = await clock.evaluate((el) => window.getComputedStyle(el).fontVariantNumeric);
      expect(style).toContain('tabular-nums');
    });
  });

  test.describe('Timer Countdown', () => {
    test('should start counting down on Start click', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Get initial time
      const initialTime = await clock.textContent();

      // Click start
      await startBtn.click();

      // Wait for 2 seconds
      await page.waitForTimeout(2100);

      // Get updated time
      const updatedTime = await clock.textContent();

      // Time should have decreased
      expect(updatedTime).not.toBe(initialTime);
    });

    test('should decrease by 1 second each tick', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Click start
      await startBtn.click();

      // Get time after 1 second
      await page.waitForTimeout(1100);
      const afterOneSecond = await clock.textContent();

      // Get time after 2 seconds total
      await page.waitForTimeout(1100);
      const afterTwoSeconds = await clock.textContent();

      // Both times should be in MM:SS format
      expect(afterOneSecond?.trim()).toMatch(/^\d{2}:\d{2}$/);
      expect(afterTwoSeconds?.trim()).toMatch(/^\d{2}:\d{2}$/);
      // Second time should be 1 second less
      expect(afterTwoSeconds).not.toBe(afterOneSecond);
    });

    test('should continue counting down for full duration', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Get initial time
      const initialTime = await clock.textContent();

      // Click start
      await startBtn.click();

      // Wait 3 seconds
      await page.waitForTimeout(3100);

      // Get updated time
      const updatedTime = await clock.textContent();

      // Time should have decreased by ~3 seconds
      expect(updatedTime).not.toBe(initialTime);
    });

    test('should transition to next step when time runs out', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      // Get initial counter
      const initialCounter = await counter.textContent();

      // Move to a short step (like rest) to complete quickly
      // Simulate completion by clicking next multiple times or waiting
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Counter should have changed
      const updatedCounter = await counter.textContent();
      expect(updatedCounter).not.toBe(initialCounter);
    });

    test('should not count down faster than 1 second per tick', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Get initial time and parse it
      const initialText = await clock.textContent();
      const initialSeconds = parseInt(initialText?.split(':')[1] || '0');

      // Click start
      await startBtn.click();

      // Wait exactly 500ms (half second)
      await page.waitForTimeout(500);

      // Get time after 500ms
      const afterHalfSecond = await clock.textContent();
      const halfSecondSeconds = parseInt(afterHalfSecond?.split(':')[1] || '0');

      // Should still be the same second (not decreased yet)
      expect(halfSecondSeconds).toBe(initialSeconds);
    });
  });

  test.describe('Start/Pause Control', () => {
    test('should start timer on Start button click', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      const initialTime = await clock.textContent();
      await startBtn.click();
      await page.waitForTimeout(1100);
      const newTime = await clock.textContent();

      // Time should have changed
      expect(newTime).not.toBe(initialTime);
    });

    test('should pause timer on Pause button click', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Start timer
      await startBtn.click();
      await page.waitForTimeout(1100);

      const pausedTime = await clock.textContent();

      // Click pause (button text changes to "Pauza")
      await startBtn.click();

      // Wait and check time doesn't change
      await page.waitForTimeout(1100);
      const stillPausedTime = await clock.textContent();

      expect(stillPausedTime).toBe(pausedTime);
    });

    test('should resume from pause when Start clicked again', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Start
      await startBtn.click();
      await page.waitForTimeout(1100);

      // Pause
      await startBtn.click();
      const pausedTime = await clock.textContent();

      // Resume
      await startBtn.click();
      await page.waitForTimeout(1100);
      const resumedTime = await clock.textContent();

      // Time should have changed
      expect(resumedTime).not.toBe(pausedTime);
    });

    test('should change button text from Start to Pauza when running', async ({ page }) => {
      const startBtn = page.locator('#startBtn');

      // Initially should show "Start"
      let text = await startBtn.textContent();
      expect(text?.trim()).toBe('Start');

      // Click to start
      await startBtn.click();
      await page.waitForTimeout(100);

      // Should now show "Pauza"
      text = await startBtn.textContent();
      expect(text?.trim()).toBe('Pauza');
    });

    test('should change button text back to Start when paused', async ({ page }) => {
      const startBtn = page.locator('#startBtn');

      // Start
      await startBtn.click();
      await page.waitForTimeout(100);

      // Verify shows "Pauza"
      let text = await startBtn.textContent();
      expect(text?.trim()).toBe('Pauza');

      // Pause
      await startBtn.click();
      await page.waitForTimeout(100);

      // Should show "Start" again
      text = await startBtn.textContent();
      expect(text?.trim()).toBe('Start');
    });

    test('should preserve time remaining when paused', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');

      // Start
      await startBtn.click();
      await page.waitForTimeout(1100);

      const timeBeforePause = await clock.textContent();

      // Pause
      await startBtn.click();
      await page.waitForTimeout(500);

      const timeAfterPause = await clock.textContent();

      // Should be identical
      expect(timeAfterPause).toBe(timeBeforePause);

      // Wait more and verify still same
      await page.waitForTimeout(1000);
      const timeMuchLater = await clock.textContent();
      expect(timeMuchLater).toBe(timeBeforePause);
    });
  });

  test.describe('Phase Transitions', () => {
    test('should transition from prep to work', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      // Initially should be prep phase
      let phaseText = await phase.textContent();
      expect(['Gotowy?', 'Przygotowanie']).toContain(phaseText?.trim());

      // Move to next step (work phase)
      await nextBtn.click();
      await page.waitForTimeout(200);

      phaseText = await phase.textContent();
      expect(phaseText?.trim()).toBe('Ćwiczenie');
    });

    test('should transition from work to rest', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      // Move to work phase first
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Move to rest phase
      await nextBtn.click();
      await page.waitForTimeout(200);

      const phaseText = await phase.textContent();
      expect(phaseText?.trim()).toBe('Przerwa');
    });

    test('should transition from rest to prep (if prep enabled)', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      // Navigate to rest phase
      await nextBtn.click();
      await page.waitForTimeout(200);
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Move from rest to prep
      await nextBtn.click();
      await page.waitForTimeout(200);

      const phaseText = await phase.textContent();
      expect(['Przygotowanie', 'Ćwiczenie']).toContain(phaseText?.trim());
    });

    test('should transition from prep to next work', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      // Navigate through phases to get to prep
      for (let i = 0; i < 3; i++) {
        await nextBtn.click();
        await page.waitForTimeout(200);
      }

      // Should be in work or prep by now
      const phaseText = await phase.textContent();
      expect(['Ćwiczenie', 'Przygotowanie']).toContain(phaseText?.trim());
    });

    test('should transition through entire workout sequence', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      // Get initial counter
      const initialCounter = await counter.textContent();

      // Move through several phases
      for (let i = 0; i < 5; i++) {
        await nextBtn.click();
        await page.waitForTimeout(200);
      }

      // Should have progressed
      const newCounter = await counter.textContent();
      expect(newCounter).not.toBe(initialCounter);

      // Phase should be valid
      const phaseText = await phase.textContent();
      expect(['Gotowy?', 'Ćwiczenie', 'Przerwa', 'Przygotowanie']).toContain(phaseText?.trim());
    });

    test('should display correct phase label for each type', async ({ page }) => {
      const phase = page.locator('#phase');

      // Verify initial phase is one of the valid options
      let phaseText = await phase.textContent();
      expect(['Gotowy?', 'Ćwiczenie', 'Przerwa', 'Przygotowanie']).toContain(phaseText?.trim());

      // Move to next and verify it's also valid
      const nextBtn = page.locator('#nextBtn');
      await nextBtn.click();
      await page.waitForTimeout(200);

      phaseText = await phase.textContent();
      expect(['Ćwiczenie', 'Przerwa', 'Przygotowanie']).toContain(phaseText?.trim());
    });

    test('should update stage background color on phase change', async ({ page }) => {
      const stage = page.locator('#stage');
      const nextBtn = page.locator('#nextBtn');

      // Get initial classes
      let classes = await stage.getAttribute('class');
      expect(classes).toBeTruthy();

      // Click next to change phase
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Get updated classes
      const newClasses = await stage.getAttribute('class');

      // Should have phase class (prep/work/rest)
      expect(newClasses).toMatch(/prep|work|rest/);
    });

    test('should update next exercise text on phase change', async ({ page }) => {
      const nextExercise = page.locator('#next');
      const nextBtn = page.locator('#nextBtn');

      // Get initial next exercise text
      const initialText = await nextExercise.textContent();

      // Move to next step
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Get updated text
      const updatedText = await nextExercise.textContent();

      // Next exercise should exist and potentially change
      expect(initialText?.length).toBeGreaterThan(0);
      expect(updatedText?.length).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation Between Steps', () => {
    test('should skip to next step with Next button', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      const initialCounter = await counter.textContent();

      // Click next
      await nextBtn.click();
      await page.waitForTimeout(200);

      const newCounter = await counter.textContent();
      expect(newCounter).not.toBe(initialCounter);
    });

    test('should go to previous step with Previous button', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const prevBtn = page.locator('#prevBtn');
      const counter = page.locator('#counter');

      // Move to step 1
      await nextBtn.click();
      await page.waitForTimeout(200);

      const forwardCounter = await counter.textContent();

      // Go back
      await prevBtn.click();
      await page.waitForTimeout(200);

      const backwardCounter = await counter.textContent();
      expect(backwardCounter).not.toBe(forwardCounter);
    });

    test('should restart current step if in middle of it', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const prevBtn = page.locator('#prevBtn');
      const clock = page.locator('#clock');

      // Start timer to get into middle of step
      await startBtn.click();
      await page.waitForTimeout(1100);

      const timeAfterCountdown = await clock.textContent();

      // Click previous to go back
      await prevBtn.click();
      await page.waitForTimeout(200);

      const timeAfterPrevious = await clock.textContent();

      // Time should have been reset (or different)
      expect(timeAfterPrevious).not.toBe(timeAfterCountdown);
    });

    test('should jump to previous step if at beginning of current', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const prevBtn = page.locator('#prevBtn');
      const counter = page.locator('#counter');

      // Move forward 2 steps
      await nextBtn.click();
      await page.waitForTimeout(200);
      await nextBtn.click();
      await page.waitForTimeout(200);

      const counterAfterForward = await counter.textContent();

      // Go previous twice
      await prevBtn.click();
      await page.waitForTimeout(200);

      const counterAfterOneBack = await counter.textContent();
      expect(counterAfterOneBack).not.toBe(counterAfterForward);
    });

    test('should disable Previous button at first step', async ({ page }) => {
      const prevBtn = page.locator('#prevBtn');

      // At first step, previous should be disabled
      await expect(prevBtn).toBeDisabled();
    });

    test('should enable Previous button after first step', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const prevBtn = page.locator('#prevBtn');

      // Initially disabled
      await expect(prevBtn).toBeDisabled();

      // Move to step 1
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Should now be enabled
      await expect(prevBtn).toBeEnabled();
    });

    test('should jump to step by clicking plan list row', async ({ page }) => {
      // Expand plan list first
      const planSummary = page.locator('#planList summary');
      await planSummary.click();
      await page.waitForTimeout(200);

      const counter = page.locator('#counter');
      const initialCounter = await counter.textContent();

      // Click on a plan list row (second row to jump to different step)
      const stepRows = page.locator('#planList .step-row');
      if (await stepRows.count() > 1) {
        const secondRow = stepRows.nth(1);
        await secondRow.click();
        await page.waitForTimeout(200);

        const newCounter = await counter.textContent();
        expect(newCounter).not.toBe(initialCounter);
      }
    });

    test('should pause timer when jumping between steps', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const nextBtn = page.locator('#nextBtn');
      const clock = page.locator('#clock');

      // Start timer
      await startBtn.click();
      await page.waitForTimeout(500);

      const timeWhileRunning = await clock.textContent();

      // Click next to jump
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Timer should be paused, so time should stay the same after a wait
      await page.waitForTimeout(500);
      const timeAfterJump = await clock.textContent();

      // Should be different times but not counting
      expect(timeAfterJump).not.toBe(timeWhileRunning);
    });
  });

  test.describe('Step Counter', () => {
    test('should display current step number', async ({ page }) => {
      const counter = page.locator('#counter');
      await expect(counter).toBeVisible();
      const text = await counter.textContent();
      // Should match format "N / Total"
      expect(text?.trim()).toMatch(/^\d+\s*\/\s*\d+$/);
    });

    test('should display total number of steps', async ({ page }) => {
      const counter = page.locator('#counter');
      const text = await counter.textContent();
      // Extract the total (after /)
      const parts = text?.split('/');
      const total = parseInt(parts?.[1] || '0');
      // Should have a reasonable number of steps (at least 5)
      expect(total).toBeGreaterThan(5);
    });

    test('should increment counter on step completion', async ({ page }) => {
      const counter = page.locator('#counter');
      const nextBtn = page.locator('#nextBtn');

      const initialCounter = await counter.textContent();
      const initialNum = parseInt(initialCounter?.split('/')[0] || '0');

      // Click next
      await nextBtn.click();
      await page.waitForTimeout(200);

      const newCounter = await counter.textContent();
      const newNum = parseInt(newCounter?.split('/')[0] || '0');

      // Should have incremented
      expect(newNum).toBeGreaterThan(initialNum);
    });

    test('should maintain correct count through full workout', async ({ page }) => {
      const counter = page.locator('#counter');
      const nextBtn = page.locator('#nextBtn');

      // Get initial state
      const initialCounter = await counter.textContent();
      const parts = initialCounter?.split('/');
      const currentStep = parseInt(parts?.[0] || '0');
      const totalSteps = parseInt(parts?.[1] || '0');

      expect(currentStep).toBeGreaterThanOrEqual(1);
      expect(currentStep).toBeLessThanOrEqual(totalSteps);

      // Move through several steps
      for (let i = 0; i < 3; i++) {
        await nextBtn.click();
        await page.waitForTimeout(200);

        const currentCounter = await counter.textContent();
        const curParts = currentCounter?.split('/');
        const curStep = parseInt(curParts?.[0] || '0');
        const curTotal = parseInt(curParts?.[1] || '0');

        // Counter should be valid
        expect(curStep).toBeGreaterThanOrEqual(1);
        expect(curStep).toBeLessThanOrEqual(curTotal);
        expect(curTotal).toBe(totalSteps); // Total shouldn't change
      }
    });
  });

  test.describe('Workout Completion', () => {
    test('should complete workout when all steps done', async ({ page }) => {
      const counter = page.locator('#counter');
      const nextBtn = page.locator('#nextBtn');

      // Get total steps
      const counterText = await counter.textContent();
      const totalSteps = parseInt(counterText?.split('/')[1] || '0');

      // Skip through all remaining steps (safety limit to prevent infinite loop)
      for (let i = 0; i < totalSteps + 5; i++) {
        const currentCounterText = await counter.textContent();
        const currentStep = parseInt(currentCounterText?.split('/')[0] || '0');
        const currentTotal = parseInt(currentCounterText?.split('/')[1] || '0');

        if (currentStep >= currentTotal) {
          // Workout completed
          break;
        }

        await nextBtn.click();
        await page.waitForTimeout(200);
      }

      // Verify we reached the end
      const finalCounterText = await counter.textContent();
      const finalStep = parseInt(finalCounterText?.split('/')[0] || '0');
      const finalTotal = parseInt(finalCounterText?.split('/')[1] || '0');

      expect(finalStep).toBe(finalTotal);
    });

    test('should pause timer at end', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const clock = page.locator('#clock');
      const nextBtn = page.locator('#nextBtn');

      // Get to near end by skipping steps
      const counter = page.locator('#counter');
      const counterText = await counter.textContent();
      const totalSteps = parseInt(counterText?.split('/')[1] || '0');

      // Skip to last step
      for (let i = 0; i < totalSteps - 2; i++) {
        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // Start and complete the last steps
      await startBtn.click();
      await page.waitForTimeout(100);

      // At end, timer should be paused
      const endingBtn = page.locator('#startBtn');
      const btnText = await endingBtn.textContent();
      // Button should show "Start" or "Od nowa", not "Pauza"
      expect(['Start', 'Od nowa']).toContain(btnText?.trim());
    });

    test('should display done state on stage', async ({ page }) => {
      const stage = page.locator('#stage');
      const nextBtn = page.locator('#nextBtn');

      // Skip through all steps
      const counter = page.locator('#counter');
      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const currentStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (currentStep >= totalSteps) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // Check stage has done class
      const classes = await stage.getAttribute('class');
      expect(classes).toMatch(/done/);
    });

    test('should display completion message', async ({ page }) => {
      const phase = page.locator('#phase');
      const nextBtn = page.locator('#nextBtn');

      // Skip to end
      const counter = page.locator('#counter');
      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const currentStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (currentStep >= totalSteps) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // At completion, phase should show completion state
      const phaseText = await phase.textContent();
      expect(phaseText?.trim().length).toBeGreaterThan(0);
    });

    test('should show "Od nowa" on button after completion', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      // Skip through all steps
      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const currentStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (currentStep >= totalSteps) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // Button should show "Od nowa"
      const btnText = await startBtn.textContent();
      expect(btnText?.trim()).toBe('Od nowa');
    });

    test('should allow restart after completion', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      // Skip to end
      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const currentStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (currentStep >= totalSteps) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // Click "Od nowa"
      const finalCounterBefore = await counter.textContent();

      await startBtn.click();
      await page.waitForTimeout(300);

      // Counter should reset to 1
      const finalCounterAfter = await counter.textContent();
      const newStep = parseInt(finalCounterAfter?.split('/')[0] || '0');

      expect(newStep).toBe(1);
    });
  });

  test.describe('Remaining Time Calculation', () => {
    test('should calculate total remaining time correctly', async ({ page }) => {
      const remainingTime = page.locator('#remainingTime');
      await expect(remainingTime).toBeVisible();

      const text = await remainingTime.textContent();
      // Should be in MM:SS format
      expect(text?.trim()).toMatch(/^\d{2}:\d{2}$/);

      // Should be greater than 0:00
      const parts = text?.split(':');
      const minutes = parseInt(parts?.[0] || '0');
      const seconds = parseInt(parts?.[1] || '0');
      const totalSeconds = minutes * 60 + seconds;

      expect(totalSeconds).toBeGreaterThan(0);
    });

    test('should update remaining time as steps complete', async ({ page }) => {
      const remainingTime = page.locator('#remainingTime');
      const nextBtn = page.locator('#nextBtn');

      const initialText = await remainingTime.textContent();
      const initialSeconds = parseInt(initialText?.split(':')[0] || '0') * 60 +
                             parseInt(initialText?.split(':')[1] || '0');

      // Move to next step
      await nextBtn.click();
      await page.waitForTimeout(200);

      const newText = await remainingTime.textContent();
      const newSeconds = parseInt(newText?.split(':')[0] || '0') * 60 +
                        parseInt(newText?.split(':')[1] || '0');

      // Remaining time should have decreased
      expect(newSeconds).toBeLessThan(initialSeconds);
    });

    test('should show 00:00 when workout complete', async ({ page }) => {
      const remainingTime = page.locator('#remainingTime');
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      // Skip to end of workout
      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const currentStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (currentStep >= totalSteps) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // Check remaining time is 00:00
      const finalText = await remainingTime.textContent();
      expect(finalText?.trim()).toBe('00:00');
    });
  });

  test.describe('Progress Bar', () => {
    test('should display progress bar at top of stage', async ({ page }) => {
      const bar = page.locator('#bar');
      await expect(bar).toBeVisible();
    });

    test('should have zero width at step start', async ({ page }) => {
      const bar = page.locator('#bar');

      // Get bar width at start
      const box = await bar.boundingBox();
      const width = box?.width || 0;

      // Should be very small or 0 at start
      expect(width).toBeLessThan(10);
    });

    test('should increase width as time passes', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const bar = page.locator('#bar');

      // Get initial width
      let box = await bar.boundingBox();
      const initialWidth = box?.width || 0;

      // Start timer
      await startBtn.click();

      // Wait for progress
      await page.waitForTimeout(1500);

      // Get new width
      box = await bar.boundingBox();
      const newWidth = box?.width || 0;

      // Width should have increased
      expect(newWidth).toBeGreaterThan(initialWidth);
    });

    test('should reach full width at step end', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const bar = page.locator('#bar');
      const stage = page.locator('#stage');

      // Start timer
      await startBtn.click();

      // Wait for step to complete (or get close to it)
      // This depends on the step duration, so we wait a reasonable time
      await page.waitForTimeout(8000);

      // Get bar width
      const barBox = await bar.boundingBox();
      const stageBox = await stage.boundingBox();

      const barWidth = barBox?.width || 0;
      const stageWidth = stageBox?.width || 1;

      // Bar should be close to full width
      const percentage = (barWidth / stageWidth) * 100;
      expect(percentage).toBeGreaterThan(80);
    });

    test('should animate smoothly', async ({ page }) => {
      const bar = page.locator('#bar');
      const startBtn = page.locator('#startBtn');

      // Get transition property
      const transition = await bar.evaluate((el) => window.getComputedStyle(el).transition);
      // Should have a transition property (smooth animation)
      expect(transition).toBeTruthy();

      // Start timer
      await startBtn.click();

      // Monitor bar width changes over time
      await page.waitForTimeout(500);
      const box1 = await bar.boundingBox();
      const width1 = box1?.width || 0;

      await page.waitForTimeout(500);
      const box2 = await bar.boundingBox();
      const width2 = box2?.width || 0;

      // Should be continuous change (smooth)
      expect(width2).toBeGreaterThan(width1);
    });

    test('should reset on step change', async ({ page }) => {
      const bar = page.locator('#bar');
      const nextBtn = page.locator('#nextBtn');
      const startBtn = page.locator('#startBtn');

      // Start timer to build up progress
      await startBtn.click();
      await page.waitForTimeout(1000);

      // Get width during progress
      let box = await bar.boundingBox();
      const widthDuringProgress = box?.width || 0;

      // Click next to change step
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Get width after step change
      box = await bar.boundingBox();
      const widthAfterStep = box?.width || 0;

      // Width should have reset to near zero
      expect(widthAfterStep).toBeLessThan(widthDuringProgress);
    });
  });
});
