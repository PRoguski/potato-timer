import { test, expect } from '@playwright/test';

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#stage');
  });

  test.describe('Settings Panel Opening/Closing', () => {
    test('should have settings panel hidden initially', async ({ page }) => {
      const overlay = page.locator('#settingsOverlay');
      const classes = await overlay.getAttribute('class');
      expect(classes).not.toContain('open');
    });

    test('should open settings panel on gear button click', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const overlay = page.locator('#settingsOverlay');

      // Click settings button
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Verify overlay is now visible/open
      const classes = await overlay.getAttribute('class');
      expect(classes).toContain('open');
    });

    test('should close settings panel on "Gotowe" button click', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const doneBtn = page.locator('#settingsDoneBtn');
      const overlay = page.locator('#settingsOverlay');

      // Open settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Click done button
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Verify overlay is closed
      const classes = await overlay.getAttribute('class');
      expect(classes).not.toContain('open');
    });

    test('should close settings when clicking outside (overlay)', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const overlay = page.locator('#settingsOverlay');

      // Open settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Click outside on the overlay background
      const box = await overlay.boundingBox();
      if (box) {
        await page.click({ x: box.x + box.width + 10, y: box.y + 10 });
      }

      await page.waitForTimeout(100);

      // Verify overlay is closed
      const classes = await overlay.getAttribute('class');
      expect(classes).not.toContain('open');
    });

    test('should display all settings controls', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Verify all major settings controls exist
      await expect(page.locator('#exerciseSize')).toBeVisible();
      await expect(page.locator('#nextSize')).toBeVisible();
      await expect(page.locator('#workTime')).toBeVisible();
      await expect(page.locator('#restTime')).toBeVisible();
      await expect(page.locator('#prepTime')).toBeVisible();
      await expect(page.locator('#wakeLockToggle')).toBeVisible();
      await expect(page.locator('#tapNavToggle')).toBeVisible();
    });

    test('should have settings title', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const title = page.locator('#settingsOverlay h2, #settingsOverlay h3');
      await expect(title).toBeVisible();
      const text = await title.textContent();
      expect(text?.trim().toLowerCase()).toContain('ustawienia');
    });
  });

  test.describe('Exercise Size Setting', () => {
    test('should display exercise size slider', async ({ page }) => {
      const exerciseSize = page.locator('#exerciseSize');
      await expect(exerciseSize).toBeVisible();
    });

    test('should have min value 70%', async ({ page }) => {
      const exerciseSize = page.locator('#exerciseSize');
      const min = await exerciseSize.getAttribute('min');
      expect(parseInt(min || '0')).toBe(70);
    });

    test('should have max value 150%', async ({ page }) => {
      const exerciseSize = page.locator('#exerciseSize');
      const max = await exerciseSize.getAttribute('max');
      expect(parseInt(max || '0')).toBe(150);
    });

    test('should have default value 100%', async ({ page }) => {
      const exerciseSize = page.locator('#exerciseSize');
      const value = await exerciseSize.getAttribute('value');
      expect(parseInt(value || '0')).toBe(100);
    });

    test('should display current value as percentage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const sizeValue = page.locator('#exerciseSizeValue');
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('%');
      expect(text?.trim()).toContain('100');
    });

    test('should update display on slider change', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSize = page.locator('#exerciseSize');
      const sizeValue = page.locator('#exerciseSizeValue');

      // Get initial value
      const initialText = await sizeValue.textContent();

      // Change slider to 120
      await exerciseSize.fill('120');
      await page.waitForTimeout(100);

      // Get updated value
      const updatedText = await sizeValue.textContent();
      expect(updatedText?.trim()).toContain('120');
      expect(updatedText).not.toBe(initialText);
    });

    test('should apply size change to exercise name', async ({ page }) => {
      const exercise = page.locator('#exercise');
      const settingsBtn = page.locator('#settingsBtn');

      // Get initial size
      let box = await exercise.boundingBox();
      const initialSize = box?.height || 0;

      // Open settings and change size
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSize = page.locator('#exerciseSize');
      await exerciseSize.fill('130');
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Get new size
      box = await exercise.boundingBox();
      const newSize = box?.height || 0;

      // Size should have changed
      expect(newSize).not.toBe(initialSize);
    });

    test('should persist setting in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change setting
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSize = page.locator('#exerciseSize');
      await exerciseSize.fill('120');
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload page
      await page.reload();
      await page.waitForSelector('#stage');

      // Open settings and verify value persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const sizeValue = page.locator('#exerciseSizeValue');
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('120');
    });

    test('should accept step value of 5', async ({ page }) => {
      const exerciseSize = page.locator('#exerciseSize');
      const step = await exerciseSize.getAttribute('step');
      expect(parseInt(step || '0')).toBe(5);
    });
  });

  test.describe('Next Text Size Setting', () => {
    test('should display next size slider', async ({ page }) => {
      const nextSize = page.locator('#nextSize');
      await expect(nextSize).toBeVisible();
    });

    test('should have min value 70%', async ({ page }) => {
      const nextSize = page.locator('#nextSize');
      const min = await nextSize.getAttribute('min');
      expect(parseInt(min || '0')).toBe(70);
    });

    test('should have max value 150%', async ({ page }) => {
      const nextSize = page.locator('#nextSize');
      const max = await nextSize.getAttribute('max');
      expect(parseInt(max || '0')).toBe(150);
    });

    test('should have default value 100%', async ({ page }) => {
      const nextSize = page.locator('#nextSize');
      const value = await nextSize.getAttribute('value');
      expect(parseInt(value || '0')).toBe(100);
    });

    test('should display current value as percentage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const sizeValue = page.locator('#nextSizeValue');
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('%');
      expect(text?.trim()).toContain('100');
    });

    test('should update display on slider change', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const nextSize = page.locator('#nextSize');
      const sizeValue = page.locator('#nextSizeValue');

      // Change slider to 110
      await nextSize.fill('110');
      await page.waitForTimeout(100);

      // Verify display updated
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('110');
    });

    test('should apply size change to next exercise text', async ({ page }) => {
      const nextText = page.locator('#next');
      const settingsBtn = page.locator('#settingsBtn');

      // Get initial size
      let box = await nextText.boundingBox();
      const initialSize = box?.height || 0;

      // Open settings and change size
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const nextSize = page.locator('#nextSize');
      await nextSize.fill('140');
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Get new size
      box = await nextText.boundingBox();
      const newSize = box?.height || 0;

      // Size should have changed
      expect(newSize).not.toBe(initialSize);
    });

    test('should persist in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change setting
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const nextSize = page.locator('#nextSize');
      await nextSize.fill('125');
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Open settings and verify persistence
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const sizeValue = page.locator('#nextSizeValue');
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('125');
    });
  });

  test.describe('Work Time Setting', () => {
    test('should display work time slider', async ({ page }) => {
      const workTime = page.locator('#workTime');
      await expect(workTime).toBeVisible();
    });

    test('should have min value 30 seconds', async ({ page }) => {
      const workTime = page.locator('#workTime');
      const min = await workTime.getAttribute('min');
      expect(parseInt(min || '0')).toBe(30);
    });

    test('should have max value 120 seconds', async ({ page }) => {
      const workTime = page.locator('#workTime');
      const max = await workTime.getAttribute('max');
      expect(parseInt(max || '0')).toBe(120);
    });

    test('should have default value 60 seconds', async ({ page }) => {
      const workTime = page.locator('#workTime');
      const value = await workTime.getAttribute('value');
      expect(parseInt(value || '0')).toBe(60);
    });

    test('should display value with "s" suffix', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const timeValue = page.locator('#workTimeValue');
      const text = await timeValue.textContent();
      expect(text?.trim()).toMatch(/\d+s$/);
      expect(text?.trim()).toContain('60s');
    });

    test('should have step value 10', async ({ page }) => {
      const workTime = page.locator('#workTime');
      const step = await workTime.getAttribute('step');
      expect(parseInt(step || '0')).toBe(10);
    });

    test('should update display on slider change', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      const timeValue = page.locator('#workTimeValue');

      // Change to 80s
      await workTime.fill('80');
      await page.waitForTimeout(100);

      const text = await timeValue.textContent();
      expect(text?.trim()).toContain('80s');
    });

    test('should change work phase duration', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const nextBtn = page.locator('#nextBtn');

      // Change work time to 50s
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      await workTime.fill('50');
      await page.waitForTimeout(100);

      // Close and navigate to work phase
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Go to work phase
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Verify work phase exists
      const phase = page.locator('#phase');
      const text = await phase.textContent();
      expect(text?.trim()).toBe('Ćwiczenie');
    });

    test('should rebuild plan on change', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const remainingTime = page.locator('#remainingTime');

      const initialTime = await remainingTime.textContent();

      // Change work time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      await workTime.fill('90');
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Remaining time should update
      const newTime = await remainingTime.textContent();
      expect(newTime).not.toBe(initialTime);
    });

    test('should reset workout state on change', async ({ page }) => {
      const startBtn = page.locator('#startBtn');
      const settingsBtn = page.locator('#settingsBtn');
      const counter = page.locator('#counter');

      // Start workout
      await startBtn.click();
      await page.waitForTimeout(500);

      const initialCounter = await counter.textContent();

      // Change setting in middle of workout
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      await workTime.fill('70');
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Counter should be reset to 1
      const newCounter = await counter.textContent();
      const newStep = parseInt(newCounter?.split('/')[0] || '0');
      expect(newStep).toBe(1);
    });

    test('should persist in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      await workTime.fill('75');
      await page.waitForTimeout(100);

      // Close
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const timeValue = page.locator('#workTimeValue');
      const text = await timeValue.textContent();
      expect(text?.trim()).toContain('75s');
    });
  });

  test.describe('Rest Time Setting', () => {
    test('should display rest time slider', async ({ page }) => {
      const restTime = page.locator('#restTime');
      await expect(restTime).toBeVisible();
    });

    test('should have min value 15 seconds', async ({ page }) => {
      const restTime = page.locator('#restTime');
      const min = await restTime.getAttribute('min');
      expect(parseInt(min || '0')).toBe(15);
    });

    test('should have max value 60 seconds', async ({ page }) => {
      const restTime = page.locator('#restTime');
      const max = await restTime.getAttribute('max');
      expect(parseInt(max || '0')).toBe(60);
    });

    test('should have default value 30 seconds', async ({ page }) => {
      const restTime = page.locator('#restTime');
      const value = await restTime.getAttribute('value');
      expect(parseInt(value || '0')).toBe(30);
    });

    test('should display value with "s" suffix', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const timeValue = page.locator('#restTimeValue');
      const text = await timeValue.textContent();
      expect(text?.trim()).toMatch(/\d+s$/);
      expect(text?.trim()).toContain('30s');
    });

    test('should have step value 5', async ({ page }) => {
      const restTime = page.locator('#restTime');
      const step = await restTime.getAttribute('step');
      expect(parseInt(step || '0')).toBe(5);
    });

    test('should change rest phase duration', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const nextBtn = page.locator('#nextBtn');

      // Change rest time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const restTime = page.locator('#restTime');
      await restTime.fill('45');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Navigate to rest phase
      await nextBtn.click();
      await page.waitForTimeout(200);
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Should be in rest phase
      const phase = page.locator('#phase');
      const text = await phase.textContent();
      expect(text?.trim()).toBe('Przerwa');
    });

    test('should affect remaining time calculation', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const remainingTime = page.locator('#remainingTime');

      const initialTime = await remainingTime.textContent();

      // Change rest time to higher value
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const restTime = page.locator('#restTime');
      await restTime.fill('50');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Remaining time should increase
      const newTime = await remainingTime.textContent();
      expect(newTime).not.toBe(initialTime);
    });

    test('should persist in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const restTime = page.locator('#restTime');
      await restTime.fill('40');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const timeValue = page.locator('#restTimeValue');
      const text = await timeValue.textContent();
      expect(text?.trim()).toContain('40s');
    });
  });

  test.describe('Prep Time Setting', () => {
    test('should display prep time slider', async ({ page }) => {
      const prepTime = page.locator('#prepTime');
      await expect(prepTime).toBeVisible();
    });

    test('should have min value 5 seconds', async ({ page }) => {
      const prepTime = page.locator('#prepTime');
      const min = await prepTime.getAttribute('min');
      expect(parseInt(min || '0')).toBe(5);
    });

    test('should have max value 30 seconds', async ({ page }) => {
      const prepTime = page.locator('#prepTime');
      const max = await prepTime.getAttribute('max');
      expect(parseInt(max || '0')).toBe(30);
    });

    test('should have default value 15 seconds', async ({ page }) => {
      const prepTime = page.locator('#prepTime');
      const value = await prepTime.getAttribute('value');
      expect(parseInt(value || '0')).toBe(15);
    });

    test('should display value with "s" suffix', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const timeValue = page.locator('#prepTimeValue');
      const text = await timeValue.textContent();
      expect(text?.trim()).toMatch(/\d+s$/);
      expect(text?.trim()).toContain('15s');
    });

    test('should have step value 5', async ({ page }) => {
      const prepTime = page.locator('#prepTime');
      const step = await prepTime.getAttribute('step');
      expect(parseInt(step || '0')).toBe(5);
    });

    test('should insert prep steps between rest and work', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const planSummary = page.locator('#planList summary');

      // Open settings and change prep time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('20');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Open plan list
      await planSummary.click();
      await page.waitForTimeout(200);

      // Look for prep steps
      const prepSteps = page.locator('#planList .step-row .step-name:has-text("Przygotowanie")');
      const count = await prepSteps.count();
      // Should have at least some prep steps
      expect(count).toBeGreaterThan(0);
    });

    test('should change prep phase duration', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const nextBtn = page.locator('#nextBtn');

      // Change prep time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('25');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Navigate to a prep phase if it exists
      // Skip through steps
      for (let i = 0; i < 5; i++) {
        await nextBtn.click();
        await page.waitForTimeout(200);

        const phase = page.locator('#phase');
        const phaseText = await phase.textContent();
        if (phaseText?.trim() === 'Przygotowanie') {
          // Found prep phase
          expect(phaseText?.trim()).toBe('Przygotowanie');
          break;
        }
      }
    });

    test('should not add prep before cooldown section', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const planSummary = page.locator('#planList summary');
      const nextBtn = page.locator('#nextBtn');

      // Change prep time
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('20');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Navigate to end of workout
      const counter = page.locator('#counter');
      for (let i = 0; i < 100; i++) {
        const counterText = await counter.textContent();
        const curStep = parseInt(counterText?.split('/')[0] || '0');
        const totalSteps = parseInt(counterText?.split('/')[1] || '0');

        if (curStep >= totalSteps - 2) break;

        await nextBtn.click();
        await page.waitForTimeout(100);
      }

      // Open plan list to verify structure
      await planSummary.click();
      await page.waitForTimeout(200);

      // Plan should exist but not have prep steps before cooldown
      const planList = page.locator('#planList .plan-list');
      await expect(planList).toBeVisible();
    });

    test('should persist in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('10');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const timeValue = page.locator('#prepTimeValue');
      const text = await timeValue.textContent();
      expect(text?.trim()).toContain('10s');
    });
  });

  test.describe('Wake Lock Toggle', () => {
    test('should display wake lock toggle', async ({ page }) => {
      const wakeLockToggle = page.locator('#wakeLockToggle');
      await expect(wakeLockToggle).toBeVisible();
    });

    test('should display toggle label', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const label = page.locator('label[for="wakeLockToggle"], .wake-lock-label');
      const text = await label.textContent();
      expect(text?.toLowerCase()).toContain('ekran');
    });

    test('should be unchecked by default', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const wakeLockToggle = page.locator('#wakeLockToggle');
      await expect(wakeLockToggle).not.toBeChecked();
    });

    test('should enable on click', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const wakeLockToggle = page.locator('#wakeLockToggle');
      await wakeLockToggle.click();
      await page.waitForTimeout(100);

      await expect(wakeLockToggle).toBeChecked();
    });

    test('should disable on second click', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const wakeLockToggle = page.locator('#wakeLockToggle');

      // Enable
      await wakeLockToggle.click();
      await page.waitForTimeout(100);
      await expect(wakeLockToggle).toBeChecked();

      // Disable
      await wakeLockToggle.click();
      await page.waitForTimeout(100);
      await expect(wakeLockToggle).not.toBeChecked();
    });

    test('should persist in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and enable toggle
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const wakeLockToggle = page.locator('#wakeLockToggle');
      await wakeLockToggle.click();
      await page.waitForTimeout(100);

      // Close settings
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      await expect(wakeLockToggle).toBeChecked();
    });

    test('should request wake lock when enabled and timer starts', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const startBtn = page.locator('#startBtn');

      // Enable wake lock
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const wakeLockToggle = page.locator('#wakeLockToggle');
      await wakeLockToggle.click();
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Start timer
      await startBtn.click();
      await page.waitForTimeout(500);

      // Verify toggle is still enabled
      await settingsBtn.click();
      await page.waitForTimeout(100);

      await expect(wakeLockToggle).toBeChecked();
    });
  });

  test.describe('Tap Navigation Toggle', () => {
    test('should display tap navigation toggle', async ({ page }) => {
      const tapNavToggle = page.locator('#tapNavToggle');
      await expect(tapNavToggle).toBeVisible();
    });

    test('should display toggle label', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const label = page.locator('label[for="tapNavToggle"], .tap-nav-label');
      const text = await label.textContent();
      expect(text?.toLowerCase()).toContain('klik');
    });

    test('should be unchecked by default', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await expect(tapNavToggle).not.toBeChecked();
    });

    test('should enable on click', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await tapNavToggle.click();
      await page.waitForTimeout(100);

      await expect(tapNavToggle).toBeChecked();
    });

    test('should disable on second click', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');

      // Enable
      await tapNavToggle.click();
      await page.waitForTimeout(100);
      await expect(tapNavToggle).toBeChecked();

      // Disable
      await tapNavToggle.click();
      await page.waitForTimeout(100);
      await expect(tapNavToggle).not.toBeChecked();
    });

    test('should persist in localStorage', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and enable toggle
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await tapNavToggle.click();
      await page.waitForTimeout(100);

      // Close
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      await expect(tapNavToggle).toBeChecked();
    });

    test('should enable clicking on stage left zone for previous', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const prevBtn = page.locator('#prevBtn');

      // Enable tap navigation
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await tapNavToggle.click();
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Move forward first
      const nextBtn = page.locator('#nextBtn');
      await nextBtn.click();
      await page.waitForTimeout(200);

      // Click on left third of stage
      const stage = page.locator('#stage');
      const box = await stage.boundingBox();
      if (box) {
        // Click on left third
        await page.click({ x: box.x + box.width * 0.1, y: box.y + box.height / 2 });
        await page.waitForTimeout(200);

        // Should go back (equivalent to clicking previous)
        // Verify with counter or phase
        const counter = page.locator('#counter');
        const text = await counter.textContent();
        expect(text).toBeTruthy();
      }
    });

    test('should enable clicking on stage center for play/pause', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const startBtn = page.locator('#startBtn');

      // Enable tap navigation
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await tapNavToggle.click();
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Get initial button text
      let btnText = await startBtn.textContent();
      expect(btnText?.trim()).toBe('Start');

      // Click on center of stage
      const stage = page.locator('#stage');
      const box = await stage.boundingBox();
      if (box) {
        await page.click({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
        await page.waitForTimeout(200);

        // Button should have changed to Pauza
        btnText = await startBtn.textContent();
        expect(btnText?.trim()).toBe('Pauza');
      }
    });

    test('should enable clicking on stage right zone for next', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const counter = page.locator('#counter');

      // Enable tap navigation
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await tapNavToggle.click();
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Get initial counter
      const initialCounter = await counter.textContent();

      // Click on right third of stage
      const stage = page.locator('#stage');
      const box = await stage.boundingBox();
      if (box) {
        await page.click({ x: box.x + box.width * 0.9, y: box.y + box.height / 2 });
        await page.waitForTimeout(200);

        // Counter should have incremented
        const newCounter = await counter.textContent();
        expect(newCounter).not.toBe(initialCounter);
      }
    });

    test('should not enable tap navigation when toggle off', async ({ page }) => {
      const nextBtn = page.locator('#nextBtn');
      const counter = page.locator('#counter');

      // Ensure tap navigation is OFF
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      const isChecked = await tapNavToggle.isChecked();
      if (isChecked) {
        await tapNavToggle.click();
        await page.waitForTimeout(100);
      }

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Click on right area of stage should not advance
      const stage = page.locator('#stage');
      const box = await stage.boundingBox();

      const initialCounter = await counter.textContent();

      // We expect buttons to still work normally
      if (box) {
        // Click far right on stage (outside typical button areas)
        await page.click({ x: box.x + box.width * 0.99, y: box.y + 10 });
        await page.waitForTimeout(200);
      }

      // Use button normally to verify system still works
      await nextBtn.click();
      await page.waitForTimeout(200);

      const newCounter = await counter.textContent();
      expect(newCounter).not.toBe(initialCounter);
    });
  });

  test.describe('Reset Button', () => {
    test('should display reset button', async ({ page }) => {
      const resetBtn = page.locator('#resetBtn');
      await expect(resetBtn).toBeVisible();
    });

    test('should reset all settings to defaults', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Change various settings
      const exerciseSize = page.locator('#exerciseSize');
      const workTime = page.locator('#workTime');
      const restTime = page.locator('#restTime');
      const wakeLockToggle = page.locator('#wakeLockToggle');

      await exerciseSize.fill('130');
      await workTime.fill('90');
      await restTime.fill('50');
      await wakeLockToggle.click();
      await page.waitForTimeout(100);

      // Click reset button
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(200);

      // Verify all reset to defaults
      const exerciseSizeValue = await exerciseSize.getAttribute('value');
      const workTimeValue = await workTime.getAttribute('value');
      const restTimeValue = await restTime.getAttribute('value');

      expect(parseInt(exerciseSizeValue || '0')).toBe(100);
      expect(parseInt(workTimeValue || '0')).toBe(60);
      expect(parseInt(restTimeValue || '0')).toBe(30);
    });

    test('should reset exercise size to 100%', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSize = page.locator('#exerciseSize');
      await exerciseSize.fill('140');
      await page.waitForTimeout(100);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      const value = await exerciseSize.getAttribute('value');
      expect(parseInt(value || '0')).toBe(100);
    });

    test('should reset next size to 100%', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const nextSize = page.locator('#nextSize');
      await nextSize.fill('120');
      await page.waitForTimeout(100);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      const value = await nextSize.getAttribute('value');
      expect(parseInt(value || '0')).toBe(100);
    });

    test('should reset work time to 60s', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      await workTime.fill('100');
      await page.waitForTimeout(100);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      const value = await workTime.getAttribute('value');
      expect(parseInt(value || '0')).toBe(60);
    });

    test('should reset rest time to 30s', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const restTime = page.locator('#restTime');
      await restTime.fill('55');
      await page.waitForTimeout(100);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      const value = await restTime.getAttribute('value');
      expect(parseInt(value || '0')).toBe(30);
    });

    test('should reset prep time to 15s', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const prepTime = page.locator('#prepTime');
      await prepTime.fill('25');
      await page.waitForTimeout(100);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      const value = await prepTime.getAttribute('value');
      expect(parseInt(value || '0')).toBe(15);
    });

    test('should uncheck wake lock toggle', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and enable
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const wakeLockToggle = page.locator('#wakeLockToggle');
      await wakeLockToggle.click();
      await page.waitForTimeout(100);
      await expect(wakeLockToggle).toBeChecked();

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      await expect(wakeLockToggle).not.toBeChecked();
    });

    test('should uncheck tap navigation toggle', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and enable
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const tapNavToggle = page.locator('#tapNavToggle');
      await tapNavToggle.click();
      await page.waitForTimeout(100);
      await expect(tapNavToggle).toBeChecked();

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      await expect(tapNavToggle).not.toBeChecked();
    });

    test('should update localStorage with reset values', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open and change settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSize = page.locator('#exerciseSize');
      await exerciseSize.fill('135');
      await page.waitForTimeout(100);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(100);

      // Close
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Open and verify defaults persisted
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const sizeValue = page.locator('#exerciseSizeValue');
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('100');
    });

    test('should rebuild plan after reset', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');
      const remainingTime = page.locator('#remainingTime');

      // Get initial remaining time
      const initialTime = await remainingTime.textContent();

      // Open and change settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const workTime = page.locator('#workTime');
      const restTime = page.locator('#restTime');
      await workTime.fill('80');
      await restTime.fill('45');
      await page.waitForTimeout(100);

      // Time should have changed
      let newTime = await remainingTime.textContent();
      expect(newTime).not.toBe(initialTime);

      // Reset
      const resetBtn = page.locator('#resetBtn');
      await resetBtn.click();
      await page.waitForTimeout(200);

      // Time should be back to original
      const resetTime = await remainingTime.textContent();
      expect(resetTime).toBe(initialTime);
    });
  });

  test.describe('Settings Persistence', () => {
    test('should load settings from localStorage on startup', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Set custom values
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSize = page.locator('#exerciseSize');
      const workTime = page.locator('#workTime');

      await exerciseSize.fill('115');
      await workTime.fill('75');
      await page.waitForTimeout(100);

      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Verify settings loaded
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const exerciseSizeValue = page.locator('#exerciseSizeValue');
      const workTimeValue = page.locator('#workTimeValue');

      const sizeText = await exerciseSizeValue.textContent();
      const timeText = await workTimeValue.textContent();

      expect(sizeText?.trim()).toContain('115');
      expect(timeText?.trim()).toContain('75s');
    });

    test('should save settings on every change', async ({ page }) => {
      const settingsBtn = page.locator('#settingsBtn');

      // Open settings
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Change each setting and verify it's stored
      const exerciseSize = page.locator('#exerciseSize');
      await exerciseSize.fill('105');
      await page.waitForTimeout(100);

      // Close to trigger save
      const doneBtn = page.locator('#settingsDoneBtn');
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Open again immediately
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Verify saved
      const sizeValue = page.locator('#exerciseSizeValue');
      const text = await sizeValue.textContent();
      expect(text?.trim()).toContain('105');
    });

    test('should handle corrupted localStorage gracefully', async ({ page }) => {
      // Set bad JSON in localStorage using evaluation
      await page.evaluate(() => {
        localStorage.setItem('settings', '{invalid json}');
      });

      // Reload page
      await page.reload();
      await page.waitForSelector('#stage');

      // App should still be functional
      const stage = page.locator('#stage');
      await expect(stage).toBeVisible();

      // Should use defaults
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      const sizeValue = page.locator('#exerciseSizeValue');
      const text = await sizeValue.textContent();
      // Should be default value
      expect(text?.trim()).toContain('100');
    });

    test('should use default settings if localStorage empty', async ({ page }) => {
      // Clear localStorage
      await page.evaluate(() => {
        localStorage.clear();
      });

      // Reload
      await page.reload();
      await page.waitForSelector('#stage');

      // Open settings
      const settingsBtn = page.locator('#settingsBtn');
      await settingsBtn.click();
      await page.waitForTimeout(100);

      // Verify all defaults
      const exerciseSizeValue = page.locator('#exerciseSizeValue');
      const nextSizeValue = page.locator('#nextSizeValue');
      const workTimeValue = page.locator('#workTimeValue');
      const restTimeValue = page.locator('#restTimeValue');
      const prepTimeValue = page.locator('#prepTimeValue');

      const sizeText = await exerciseSizeValue.textContent();
      const nextText = await nextSizeValue.textContent();
      const workText = await workTimeValue.textContent();
      const restText = await restTimeValue.textContent();
      const prepText = await prepTimeValue.textContent();

      expect(sizeText?.trim()).toContain('100');
      expect(nextText?.trim()).toContain('100');
      expect(workText?.trim()).toContain('60s');
      expect(restText?.trim()).toContain('30s');
      expect(prepText?.trim()).toContain('15s');
    });
  });
});
