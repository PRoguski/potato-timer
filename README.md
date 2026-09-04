# Trening — Timer

Aplikacja webowa: **timer treningu interwałowego**. Bez zależności, bez builda, bez internetu — otwiera się bezpośrednio w przeglądarce (też na telefonie).

### Struktura projektu

**Wersja główna (main)** — Vanilla JavaScript:
- `index.html` — strukturą i style
- `app.js` — logika aplikacji (19 KB)
- `plans/plan-*.json` — plany treningowe

**Wersja alternatywna** — Vue.js 3 (branch `feature/vuejs-refactor`):
- `index-vue.html` — kompletna aplikacja w Vue.js 3 (CDN)

## Sprzęt użytkownika / założenia treningu

Trening ułożony pod: **skakankę, podpory pod pompki, gumy oporowe**.
Struktura: 
- **Rozgrzewka**: 2 min skakanka + 3 min krążenia
- **4 rundy treningowe**: każda runda to 6 ćwiczeń (praca 60 s + przerwa 30 s)
- **Schłodzenie**: 5 min rozciągania
- Razem ok. 60 min. Skakanka przeplata ćwiczenia siłowe jako kardio.

Ćwiczenia siłowe: pompki, rozpiętki z gumą, przysiady, wiosłowanie, wykroki, martwy ciąg, plank.

## Uruchomienie

### Wersja główna (Vanilla JS)

```bash
npm start       # Uruchamia live-server na http://localhost:8080
# lub
npm run dev     # Alias dla npm start
```

Otwiera się w przeglądarce. Bez kompilacji, bez żadnych kroków — wszystko działa offline.

### Wersja Vue.js

```bash
git checkout feature/vuejs-refactor
npm start
```

Otwiera `index-vue.html` zamiast `index.html`.

## Struktura pliku (Vanilla JS)

Rozdzielone na dwa pliki:
- **`index.html`** — struktura HTML i style CSS (Grid/Flexbox, motyw ciemny, zmienne kolorów)
- **`app.js`** — logika aplikacji:
  - Timer engine (initApp, goto, tickDown, render)
  - WebAudio synth do dźwięków (beep)
  - Event handlers (przyciski, ustawienia)
  - Persistence (localStorage — ustawienia, stan treningu)
  - Plan builder (dynamiczna wstawka prep time pomiędzy przerwy i ćwiczenia)

## Model danych

`plan` to tablica obiektów `{type, name, t}`:
- `type: 'head'` — nagłówek sekcji (bez czasu, nie liczy się w odliczaniu). Dla organizacji.
- `type: 'prep'` — rozgrzewka/schłodzenie (pomarańczowy #f4a742).
- `type: 'work'` — ćwiczenie/praca (zielony #c6ff3d).
- `type: 'rest'` — przerwa (niebieski #38bdf8).
- `t` — czas w sekundach. Stała `S = 30` to długość pauzy między ćwiczeniami.

`steps = plan.filter(p => p.type !== 'head')` — tablica efektywnych kroków (bez nagłówków), po której iteruje timer.

### Zmienne CSS (design system)

```css
--bg: #0d1117;           /* tło główne */
--panel: #161c26;        /* tło paneli, przycisków */
--line: #26303d;         /* separatory */
--text: #eef2f6;         /* tekst główny */
--muted: #8b98a8;        /* tekst wyciszony */
--work: #c6ff3d;         /* zielony - praca */
--work-ink: #12200a;     /* kontrast na zielonym */
--rest: #38bdf8;         /* niebieski - przerwa */
--rest-ink: #04222f;     /* kontrast na niebieskim */
--prep: #f4a742;         /* pomarańczowy - rozgrzewka */
--prep-ink: #2a1a02;     /* kontrast na pomarańczowym */
```

## Zachowanie / dźwięki (WebAudio, bez plików audio)

Wszystkie dźwięki generowane przez `beep(freq, duration)` — oscylator + gain + exponential ramp.

### Sygnały dźwiękowe

- **Koniec kroku**: `beep(1046, 0.25)` — wysoki ton.
- **15 s przed końcem PRZERWY**: `beep(440, 0.18)` → czekaj 200 ms → `beep(440, 0.18)` — ostrzeżenie.
- **Ostatnie 3 s** (dowolny krok): `beep(660, 0.1)` — krótki pik co sekundę.
- **Zmiana kroku**:
  - Na rest: `beep(520, 0.18)` (niższy).
  - Na work: `beep(988, 0.18)` (wyższy).
- **Start/wznów**: `beep(988, 0.12)`.
- **Koniec treningu**: `beep(1319, 0.3)` — najwyższy ton.

### Ograniczenia przeglądarek mobilnych

Dźwięk (AudioContext) odblokowuje się dopiero po pierwszym interakcji użytkownika (dotknięcie, klik).
W kodzie: `actx = actx || new (window.AudioContext || window.webkitAudioContext)()` — lazy init.

## Logika timera

### Stan

```javascript
let idx = 0;              // indeks w tablicy steps
let remaining = ..;       // sekundy pozostałe dla bieżącego kroku
let total = ..;           // całkowity czas kroku (do obliczenia progress bar)
let tick = null;          // ID setInterval (licznik tyka co 1 s)
let running = false;      // czy timer tyka
```

### Cykl

1. `tick()` co 1 s → `tickDown()`:
   - `remaining--`
   - Sprawdzenie warningów (15 s przed koncem przerwy, ostatnie 3 s).
   - Gdy `remaining <= 0`: koniec kroku → `idx++`, załaduj następny, albo `finish()`.

2. `render()` — aktualizuje ekran (phase, exercise, clock, progress bar, active row w liście).

3. Kliknięcie przycisków → `goto(idx)` (skok do kroku, reset `remaining` i `total`).

## Interfejs użytkownika

### Ekran główny (#stage)

- `#phase` — faza („Ćwiczenie", „Przerwa", „Rozgrzewka").
- `#exercise` — nazwa ćwiczenia/aktywności.
- `#clock` — czas MM:SS, monospace, duży font.
- `.progress` — pasek postępu (top, 5 px wysoki), `width` = `(total - remaining) / total * 100%`.
- `.counter` — licznik „N / 48" (top-right).
- `#next` — podpowiedź „Następnie: <b>…</b>".

### Kolory tła ekranu

- `.work` — zielony.
- `.rest` — niebieski.
- `.prep` — pomarańczowy.
- `.done` — ciemny panel (po zakończeniu).

### Przyciski (#controls)

- `#prevBtn` — „‹ Wstecz" (disabled na idx=0).
- `#startBtn` — „Start" → podczas: „Pauza" → po koniec: „Od nowa".
- `#nextBtn` — „Dalej ›".

Logika Wstecz: jeśli `remaining < total - 1` (w trakcie kroku), restart kroku; inaczej poprzedni.

### Lista planu (detailsy + list)

Rozwijany element `<details>` z pełnym planem. Każdy rząd:
- Kolorowa kropka (`.dot`) — typ fazy.
- Numer (`.idx`).
- Nazwa (`.name`).
- Czas (`.dur`).

Klik w rząd → `pause()` → `goto(idx)`. Active row: `.active` (highlight tła).

## Zmiana treningu

Edytuj `const plan` — dodaj/usuń/modyfikuj obiekty. Kiedy `type !== 'head'`, liczy się czas.
Uruchom stronę → automatycznie wylicza długość (`steps.length`) i wstawia w countery.

## Implementowane funkcje

✅ **Timer interwałowy** — odpoczynek, ćwiczenia, rozgrzewka, schłodzenie  
✅ **Czas przygotowania** — automatyczne przerwy do przygotowania sprzętu (5-30 s, konfigurowalnie)  
✅ **Gif demonstrujące** — animacje z Giphy dla każdego ćwiczenia  
✅ **Dźwięki** — WebAudio synth, ostrzeżenia przed koncem, sygnały przejść  
✅ **Ustawienia** — suwaki: czas pracy, przerwy, przygotowania; przełączniki: ekran aktywny, nawigacja tapem  
✅ **Wznowienie treningu** — localStorage, resume dialog po przeładowaniu  
✅ **Navigacja** — przyciski, tapnięcie w trzy strefy ekranu, lista planu z jump-to  
✅ **Responsive** — mobile-first, safe-area-inset dla notchy  
✅ **Dark theme** — ciemne kolory, zmienne CSS  
✅ **Offline** — brak zależności, wszystko działa bez internetu (poza gifami)  

## Konwencje

- **Interfejs po polsku** — utrzymuj polski w UI i komunikatach (phase labels, przycisk, next text).
- **Zero zależności** (Vanilla JS) — offline-first, brak npm w runtime.
- **Kolory semantyczne**:
  - Zielony = praca/wysiłek.
  - Niebieski = przerwa/regeneracja.
  - Pomarańczowy = rozgrzewka/schłodzenie.
  Nie mieszać — każda faza ma ustalone kolory.
- **Format czasu**: `MM:SS` (tabular-nums, monospace).
- **Responsive**: `clamp()` dla font-size, `vw` dla skali, `env(safe-area-inset-*)` dla notch.

## Formatowanie czasu

Funkcja `fmt(s)` — konwertuje sekundy na `MM:SS`:
```javascript
function fmt(s) {
  const m = Math.floor(s / 60);
  const x = s % 60;
  return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
}
```

## Plany treningowe

Plany są przechowywane w JSON (`plans/plan-*.json`):
- `plan-0.json` — Standardowy (60 min, 4 rundy)
- `plan-1.json` — Alternatywny (do zdefiniowania)
- `plan-2.json` — Alternatywny (do zdefiniowania)

Każdy plan to tablica kroków:
```json
[
  { "type": "head", "name": "ROZGRZEWKA" },
  { "type": "prep", "name": "Skakanka spokojnie", "t": 120, "image": "https://..." },
  { "type": "work", "name": "Pompki", "t": 60, "image": "https://..." },
  { "type": "rest", "name": "Przerwa", "t": 30 }
]
```

Prep time między ćwiczeniami dodawany jest **dynamicznie** przez `buildPlan()` w app.js — nie modyfikuje JSON.

## Możliwe kolejne kroki (backlog)

- **Głosowe zapowiadanie** (Web Speech API / SpeechSynthesis) — czytanie nazwy ćwiczenia.
- **Vibration API** — wibracja na mobilach zamiast/oprócz dźwięków.
- **Statystyka** — liczba ukończonych treningów, kalendarz.
- **Edytor planu** — UI do tworzenia własnych treningów bez edycji JSON.
- **Eksport/Import** — udostępnianie planów między użytkownikami.
- **Build step** — Vite/Webpack dla Vue.js wersji (zamiast CDN).

## Wersje aplikacji

### Vanilla JavaScript (`main` branch)

- **Plik**: `index.html` + `app.js`
- **Rozmiar**: ~30 KB (HTML + JS)
- **Zależności**: zero
- **Wydajność**: bardzo szybko ładuje się
- **Offline**: 100% funkcjonalny bez internetu
- **Browser support**: Chrome, Firefox, Safari, Edge (ostatnie 2 wersje)

### Vue.js 3 (`feature/vuejs-refactor` branch)

- **Plik**: `index-vue.html` (single-file, Vue 3 CDN)
- **Rozmiar**: ~40 KB
- **Zależności**: Vue 3 z CDN (https://cdnjs.cloudflare.com)
- **Zaleta**: reaktywny, łatwy do rozszerzeń
- **Eksperymentalna**: alternatywa do testowania

**Która wersja wybrać?**
- Vanilla JS — jeśli chcesz zero zależności, szybkosc ładowania, offline 100%
- Vue.js — jeśli planujesz dalsze rozszerzenia, lubisz reactive patterns
