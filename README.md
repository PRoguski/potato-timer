# Trening — Timer

Jednoplikowa aplikacja webowa: **timer treningu interwałowego**. Cały kod
(HTML + CSS + JS) siedzi w `trening-timer.html`. Bez zależności, bez builda,
bez internetu — otwiera się bezpośrednio w przeglądarce (też na telefonie).

## Sprzęt użytkownika / założenia treningu

Trening ułożony pod: **skakankę, podpory pod pompki, gumy oporowe**.
Struktura: 
- **Rozgrzewka**: 2 min skakanka + 3 min krążenia
- **4 rundy treningowe**: każda runda to 6 ćwiczeń (praca 60 s + przerwa 30 s)
- **Schłodzenie**: 5 min rozciągania
- Razem ok. 60 min. Skakanka przeplata ćwiczenia siłowe jako kardio.

Ćwiczenia siłowe: pompki, rozpiętki z gumą, przysiady, wiosłowanie, wykroki, martwy ciąg, plank.

## Struktura pliku

Wszystko w jednym `trening-timer.html`:
- **`<head>`** — metadata, charset UTF-8, viewport dla mobile (safe-area-inset dla notchy).
- **`<style>`** — CSS Grid/Flexbox, motyw ciemny, zmienne kolorów (--bg, --work, --rest, --prep), responsive (clamp).
- **`const plan`** — tablica kroków treningu (źródło prawdy). Edycja treningu = edycja tej tablicy.
- **`<script>`** — timer engine, WebAudio synth, event handlers, render pipeline, lista planu.

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

## Konwencje

- **Interfejs po polsku** — utrzymuj polski w UI i komunikatach (phase labels, przycisk, next text).
- **Zero zależności** — trzymaj jako jeden plik `.html`, offline-first, brak CDN.
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

## Możliwe kolejne kroki (backlog)

- **Głosowe zapowiadanie** (Web Speech API / SpeechSynthesis) — czytanie nazwy ćwiczenia.
- **Wake Lock API** — blokada wygaszania ekranu podczas treningu.
- **Suwaki personalizacji** — długość przerwy, czas pracy, liczba rund.
- **localStorage** — zapamiętanie ustawień, ostatniej pozycji, preferencji dzwiękowych.
- **Ciemny/jasny motyw** — przełącznik lub auto wg `prefers-color-scheme`.
- **Vibration API** — wibracja na mobilach zamiast/oprócz dźwięków.
- **Statystyka** — liczba ukończonych treningów, kalendarz.
- **Edytor planu** — UI do tworzenia własnych treningów bez edycji kodu.
