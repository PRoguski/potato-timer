import { test, expect } from '@playwright/test';

test.describe('Kreator treningu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('timer ma link do kreatora', async ({ page }) => {
    await page.goto('/');
    await page.click('#builderLink');
    await expect(page).toHaveURL(/builder\.html$/);
  });

  test('generuje JSON z rund z automatycznymi przerwami', async ({ page }) => {
    await page.fill('[aria-label="Runda 1, ćwiczenie 1"]', 'Skakanka');
    await page.click('#addRow');
    await page.fill('[aria-label="Runda 1, ćwiczenie 2"]', 'Pompki');

    // Nowa runda kopiuje poprzednią
    await page.click('#addRound');
    await expect(page.locator('[aria-label="Runda 2, ćwiczenie 2"]')).toHaveValue('Pompki');
    await page.fill('[aria-label="Runda 2, ćwiczenie 2"]', 'Wykroki');

    const plan = JSON.parse(await page.inputValue('#output'));
    const summary = plan.map((p: any) => `${p.type}:${p.name}`);
    expect(summary).toEqual([
      'head:ROZGRZEWKA',
      'prep:Skakanka spokojnie',
      'prep:Krążenia ramion, bioder, przysiady',
      'head:RUNDA 1',
      'work:Skakanka', 'rest:Przerwa',
      'work:Pompki', 'rest:Przerwa',
      'head:RUNDA 2',
      'work:Skakanka', 'rest:Przerwa',
      'work:Wykroki', 'rest:Przerwa',
      'head:SCHŁODZENIE',
      'prep:Rozciąganie',
    ]);
    expect(plan[1].t).toBe(120);
  });

  test('pomija puste pola i puste rundy', async ({ page }) => {
    await page.click('#addRound');
    await page.fill('[aria-label="Runda 2, ćwiczenie 1"]', 'Plank');
    const plan = JSON.parse(await page.inputValue('#output'));
    const heads = plan.filter((p: any) => p.type === 'head').map((p: any) => p.name);
    expect(heads).toEqual(['ROZGRZEWKA', 'RUNDA 1', 'SCHŁODZENIE']);
  });

  test('szkic przetrwa odświeżenie strony', async ({ page }) => {
    await page.fill('[aria-label="Runda 1, ćwiczenie 1"]', 'Burpees');
    await page.reload();
    await expect(page.locator('[aria-label="Runda 1, ćwiczenie 1"]')).toHaveValue('Burpees');
  });
});
