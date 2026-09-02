import { test, expect } from '@playwright/test';

test.describe('Settings - Font Size Adjustments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#settingsBtn', { timeout: 5000 });
    await page.click('#settingsBtn');
    await page.waitForSelector('#settingsPanel', { timeout: 5000 });
  });

  test('should display exercise size slider', async ({ page }) => {
    const slider = await page.locator('#exerciseSize');
    await expect(slider).toBeVisible();

    const value = await slider.getAttribute('value');
    expect(value).toBe('100');
  });

  test('should update exercise size display value', async ({ page }) => {
    const slider = await page.locator('#exerciseSize');
    const displayValue = await page.locator('#exerciseSizeValue');

    await slider.fill('120');
    await page.waitForTimeout(300);

    const text = await displayValue.textContent();
    expect(text).toContain('120');
  });

  test('should change exercise font size', async ({ page }) => {
    const exercise = await page.locator('#exercise');
    const slider = await page.locator('#exerciseSize');

    const initialSize = await exercise.evaluate(el => window.getComputedStyle(el).fontSize);

    await slider.fill('150');
    await page.waitForTimeout(500);

    const newSize = await exercise.evaluate(el => window.getComputedStyle(el).fontSize);

    expect(newSize).not.toBe(initialSize);
  });

  test('should display next exercise size slider', async ({ page }) => {
    const slider = await page.locator('#nextSize');
    await expect(slider).toBeVisible();

    const value = await slider.getAttribute('value');
    expect(value).toBe('100');
  });

  test('should update next size display value', async ({ page }) => {
    const slider = await page.locator('#nextSize');
    const displayValue = await page.locator('#nextSizeValue');

    await slider.fill('80');
    await page.waitForTimeout(300);

    const text = await displayValue.textContent();
    expect(text).toContain('80');
  });

  test('should persist font sizes in localStorage', async ({ page }) => {
    const exerciseSlider = await page.locator('#exerciseSize');
    const nextSlider = await page.locator('#nextSize');

    await exerciseSlider.fill('130');
    await nextSlider.fill('90');

    await page.waitForTimeout(500);

    const settings = await page.evaluate(() => {
      const saved = localStorage.getItem('timerSettings');
      return saved ? JSON.parse(saved) : null;
    });

    expect(settings.exerciseSize).toBe(130);
    expect(settings.nextSize).toBe(90);
  });

  test('should restore font sizes on reload', async ({ page }) => {
    const exerciseSlider = await page.locator('#exerciseSize');
    await exerciseSlider.fill('140');

    await page.waitForTimeout(500);

    await page.reload({ waitUntil: 'networkidle' });
    await page.click('#settingsBtn');

    const slider = await page.locator('#exerciseSize');
    const value = await slider.getAttribute('value');

    expect(value).toBe('140');
  });
});

test.describe('Settings - Work/Rest Time', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#settingsBtn', { timeout: 5000 });
    await page.click('#settingsBtn');
    await page.waitForSelector('#settingsPanel', { timeout: 5000 });
  });

  test('should display work time slider', async ({ page }) => {
    const slider = await page.locator('#workTime');
    await expect(slider).toBeVisible();

    const value = await slider.getAttribute('value');
    expect(value).toBe('60');
  });

  test('should update work time display value', async ({ page }) => {
    const slider = await page.locator('#workTime');
    const displayValue = await page.locator('#workTimeValue');

    await slider.fill('90');
    await page.waitForTimeout(300);

    const text = await displayValue.textContent();
    expect(text).toContain('90s');
  });

  test('should display rest time slider', async ({ page }) => {
    const slider = await page.locator('#restTime');
    await expect(slider).toBeVisible();

    const value = await slider.getAttribute('value');
    expect(value).toBe('30');
  });

  test('should update rest time display value', async ({ page }) => {
    const slider = await page.locator('#restTime');
    const displayValue = await page.locator('#restTimeValue');

    await slider.fill('45');
    await page.waitForTimeout(300);

    const text = await displayValue.textContent();
    expect(text).toContain('45s');
  });

  test('should update plan with new work time', async ({ page }) => {
    const workSlider = await page.locator('#workTime');

    // Close settings first
    await page.click('#closeSettingsBtn');
    await page.waitForTimeout(300);

    // Change work time
    await page.click('#settingsBtn');
    await workSlider.fill('45');
    await page.waitForTimeout(500);

    // Close settings and check if exercises show new duration
    await page.click('#closeSettingsBtn');

    const rows = await page.locator('.row:not(.head)');
    const count = await rows.count();

    if (count > 1) {
      const secondRow = rows.nth(1);
      const duration = await secondRow.locator('.dur').textContent();

      expect(duration).toContain('00:45');
    }
  });

  test('should persist work/rest times in localStorage', async ({ page }) => {
    const workSlider = await page.locator('#workTime');
    const restSlider = await page.locator('#restTime');

    await workSlider.fill('75');
    await restSlider.fill('20');

    await page.waitForTimeout(500);

    const settings = await page.evaluate(() => {
      const saved = localStorage.getItem('timerSettings');
      return saved ? JSON.parse(saved) : null;
    });

    expect(settings.workTime).toBe(75);
    expect(settings.restTime).toBe(20);
  });
});

test.describe('Settings - Wake Lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#settingsBtn', { timeout: 5000 });
    await page.click('#settingsBtn');
    await page.waitForSelector('#wakeLockToggle', { timeout: 5000 });
  });

  test('should display wake lock toggle', async ({ page }) => {
    const toggle = await page.locator('#wakeLockToggle');
    await expect(toggle).toBeVisible();
  });

  test('should toggle wake lock setting', async ({ page }) => {
    const toggle = await page.locator('#wakeLockToggle');

    await toggle.click();
    await page.waitForTimeout(300);

    const checked = await toggle.isChecked();
    expect(checked).toBe(true);
  });

  test('should persist wake lock setting', async ({ page }) => {
    const toggle = await page.locator('#wakeLockToggle');

    await toggle.click();
    await page.waitForTimeout(300);

    const settings = await page.evaluate(() => {
      const saved = localStorage.getItem('timerSettings');
      return saved ? JSON.parse(saved) : null;
    });

    expect(settings.wakeLock).toBe(true);
  });

  test('should restore wake lock setting on reload', async ({ page }) => {
    const toggle = await page.locator('#wakeLockToggle');

    await toggle.click();
    await page.waitForTimeout(300);

    await page.reload({ waitUntil: 'networkidle' });
    await page.click('#settingsBtn');

    const newToggle = await page.locator('#wakeLockToggle');
    const checked = await newToggle.isChecked();

    expect(checked).toBe(true);
  });
});

test.describe('Settings - Reset Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#settingsBtn', { timeout: 5000 });
    await page.click('#settingsBtn');
    await page.waitForSelector('#resetBtn', { timeout: 5000 });
  });

  test('should have reset button', async ({ page }) => {
    const resetBtn = await page.locator('#resetBtn');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toContainText('Resetuj');
  });

  test('should reset all settings to default', async ({ page }) => {
    const exerciseSlider = await page.locator('#exerciseSize');
    const workSlider = await page.locator('#workTime');
    const resetBtn = await page.locator('#resetBtn');

    // Change some settings
    await exerciseSlider.fill('150');
    await workSlider.fill('90');
    await page.waitForTimeout(300);

    // Reset
    await resetBtn.click();
    await page.waitForTimeout(500);

    // Check values are back to default
    const exerciseValue = await exerciseSlider.getAttribute('value');
    const workValue = await workSlider.getAttribute('value');

    expect(exerciseValue).toBe('100');
    expect(workValue).toBe('60');
  });

  test('should reset localStorage on reset button', async ({ page }) => {
    const exerciseSlider = await page.locator('#exerciseSize');
    const resetBtn = await page.locator('#resetBtn');

    // Change setting
    await exerciseSlider.fill('120');
    await page.waitForTimeout(300);

    // Reset
    await resetBtn.click();
    await page.waitForTimeout(300);

    const settings = await page.evaluate(() => {
      const saved = localStorage.getItem('timerSettings');
      return saved ? JSON.parse(saved) : null;
    });

    expect(settings.exerciseSize).toBe(100);
  });
});

test.describe('Settings - Close Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#settingsBtn', { timeout: 5000 });
  });

  test('should have done/close button', async ({ page }) => {
    await page.click('#settingsBtn');

    const closeBtn = await page.locator('#closeSettingsBtn');
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toContainText('Gotowe');
  });

  test('should close settings panel', async ({ page }) => {
    await page.click('#settingsBtn');

    const panel = await page.locator('#settingsPanel');
    await expect(panel).toBeVisible();

    const closeBtn = await page.locator('#closeSettingsBtn');
    await closeBtn.click();

    await expect(page.locator('#settingsOverlay.open')).not.toBeVisible();
  });
});
