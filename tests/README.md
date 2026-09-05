# Potato Timer — Playwright Test Suite

Kompleksowy zestaw przypadków testowych napisanych w Playwright'e dla aplikacji Potato Timer.

## 📋 Struktura Testów

### 1. **ui.spec.ts** — Interfejs Użytkownika (25 testów)
Testy wyświetlania elementów UI i interakcji z interfejsem:
- Wyświetlanie etapu treningu (timer, faza, nazwa ćwiczenia, zegar, następne)
- Kolory tła dla różnych faz (prep/work/rest/done)
- Przyciski sterowania (poprzedni/start/dalej)
- Przycisk ustawień
- Wyświetlanie czasu pozostałego
- Selektor planu
- Lista planu treningowego
- Responsywność na różnych rozmiarach ekranu

### 2. **timer.spec.ts** — Funkcjonalność Timera (30 testów)
Testy logiki odliczania i obsługi czasu:
- Format wyświetlania czasu (MM:SS)
- Odliczanie w dół (1 sekunda na tick)
- Sterowanie start/pauza/wznowienie
- Przejścia między fazami
- Nawigacja między krokami (poprzedni/następny/skok)
- Licznik postępu
- Zakończenie treningu
- Obliczanie czasu pozostałego
- Animacja paska postępu

### 3. **settings.spec.ts** — Ustawienia (45 testów)
Testy panelu ustawień i ich persistencji:
- Otwieranie/zamykanie panelu
- Suwak rozmiaru nazwy ćwiczenia (70-150%)
- Suwak rozmiaru tekstu "Następnie" (70-150%)
- Suwak czasu pracy (30-120s)
- Suwak czasu przerwy (15-60s)
- Suwak czasu przygotowania (5-30s)
- Przełącznik Wake Lock
- Przełącznik nawigacji tapem
- Przycisk resetowania
- Persistencja w localStorage

### 4. **plans.spec.ts** — Plany Treningowe (35 testów)
Testy wczytywania i budowania planów:
- Wczytywanie planów z JSON
- Struktura planu (rozgrzewka, rundy, schłodzenie)
- Dynamiczne wstawianie czasów przygotowania
- Selektor i przełączanie planów
- Wyświetlanie listy planu
- Informacje o ćwiczeniach i gifach
- Obliczanie czasu treningu
- Dostępność planów

### 5. **audio.spec.ts** — Dźwięki (22 testy)
Testy Web Audio API i sygnałów dźwiękowych:
- Inicjalizacja AudioContext
- Sygnały dźwiękowe dla różnych zdarzeń:
  - Start: 988 Hz, 0.12s
  - Koniec kroku: 1046 Hz, 0.25s
  - Przejścia faz: 520/988 Hz, 0.18s
  - Ostrzeżenie przed końcem przerwy: 440 Hz (podwójny)
  - Ostatnie 3 sekundy: 660 Hz, 0.1s
  - Koniec treningu: 1319 Hz, 0.3s
- Zarządzanie AudioContext
- Obsługa błędów

### 6. **persistence.spec.ts** — Wznowienie Treningu (38 testów)
Testy zapisywania i przywracania stanu:
- Zapisywanie stanu treningu do localStorage
- Wyświetlanie dialogu wznowienia
- Akcja wznowienia i przywracania
- Akcja nowego treningu
- Walidacja stanu
- Obsługa błędów
- Synchronizacja między kartami
- Prywatność i bezpieczeństwo

### 7. **advanced-features.spec.ts** — Funkcje Zaawansowane (48 testów)
Testy zaawansowanych funkcji i optymalizacji:
- Nawigacja tapem (strefy lewo/środek/prawo)
- Detekcja kliknięć na etapie
- Wake Lock API
- Wyświetlanie obrazów ćwiczeń (GIFy z Giphy)
- Interakcja klawiaturą (opcjonalnie)
- Dostępność (ARIA, nawigacja, kontrast)
- Wydajność (ładowanie, FPS, pamięć)
- Funkcjonalność offline
- Optymalizacja mobilna
- Kompatybilność przeglądarek
- Obsługa błędów

## 🚀 Uruchamianie Testów

### Wszystkie testy
```bash
npm test
```

### Interfejs użytkownika Playwright'a
```bash
npm run test:ui
```

### Tryb debugowania
```bash
npm run test:debug
```

### Widoczna przeglądarka
```bash
npm run test:headed
```

### Testy dla konkretnej przeglądarki
```bash
npm run test:chromium  # Chrome/Edge
npm run test:firefox   # Firefox
npm run test:webkit    # Safari
```

## 📊 Statystyka Testów

| Plik | Liczba Testów | Obszar |
|------|---------------|--------|
| ui.spec.ts | 25 | Interfejs |
| timer.spec.ts | 30 | Timer |
| settings.spec.ts | 45 | Ustawienia |
| plans.spec.ts | 35 | Plany |
| audio.spec.ts | 22 | Dźwięki |
| persistence.spec.ts | 38 | Persistencja |
| advanced-features.spec.ts | 48 | Zaawansowane |
| **RAZEM** | **243** | **Wszystkie** |

## 🔧 Konfiguracja

Plik `playwright.config.ts` zawiera:
- Directory: `./tests`
- Base URL: `http://localhost:8080`
- Przeglądarki: Chromium, Firefox, WebKit
- Mobile: Pixel 5 (Chrome Mobile)
- Automatyczne uruchamianie dev serwera: `npm start`
- Raporty HTML: `playwright-report/`
- Screenshots on failure
- Traces for debugging

## ⚙️ Wymagania

- Node.js >= 18
- npm >= 9
- Playwright test package

```bash
npm install -D @playwright/test
```

## 📝 Struktura Testu

Wszystkie testy są napisane w strukturze **bez implementacji** - zawierają:
- ✅ Opisy (`test.describe()`)
- ✅ Nazwy testów (`test()`)
- ✅ Komentarze wyjaśniające co powinno być testowane
- ❌ Bez kodu implementacji (puste funkcje testowe)

To umożliwia:
1. Szybkie dodanie implementacji bez zmiany struktury
2. Przegląd wszystkich przypadków testowych
3. Łatwe planowanie testów do zaimplementowania
4. Dokumentacja oczekiwanego zachowania

## 🔍 Przykład Struktury

```typescript
test.describe('Timer Functionality', () => {
  test('should start counting down on Start click', async ({ page }) => {
    // Click start button and verify time decreases
    // TODO: Implement test
  });

  test('should transition to next step when time runs out', async ({ page }) => {
    // Wait for completion and verify step change
    // TODO: Implement test
  });
});
```

## 📋 Implementacja Testów

Aby dodać implementację testu:

1. Otwórz plik specyfikacji (np. `ui.spec.ts`)
2. Znajdź test do implementacji
3. Dodaj kod wewnątrz funkcji testowej

Przykład:
```typescript
test('should display timer clock in MM:SS format', async ({ page }) => {
  await page.goto('/');
  const clock = page.locator('#clock');
  const text = await clock.textContent();
  expect(text).toMatch(/^\d{2}:\d{2}$/);
});
```

## 🎯 Cele Testów

- ✅ Pokrycie wszystkich funkcji aplikacji
- ✅ Testowanie wszystkich przeglądarek (Chrome, Firefox, Safari)
- ✅ Testowanie na urządzeniach mobilnych
- ✅ Walidacja dostępności
- ✅ Testowanie wydajności
- ✅ Testy offline
- ✅ Obsługa błędów

## 📖 Dokumentacja

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test Runner](https://playwright.dev/docs/intro)
- [Selectors Guide](https://playwright.dev/docs/selectors)

## 🤝 Wkład

Podczas implementowania testów:
1. Zachowaj strukturę i nomenklaturę
2. Dodawaj komentarze dla złożonych asercji
3. Testuj zarówno happy path jak i edge cases
4. Uwzględniaj responsywność i dostępność
