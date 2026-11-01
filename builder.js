// Kreator treningu: edytowalna tabela rund -> JSON planu dla timera.
// Czas pracy i przerwy nadpisuje timer (suwaki w ustawieniach), więc
// w JSON-ie wpisujemy tylko wartości domyślne.

const STORAGE_KEY = 'builderDraft';
const CUSTOM_KEY = 'customTrainings'; // zapisane treningi, czytane też przez timer (app.js)
const THEME_KEY = 'theme';
const DEFAULT_WORK = 60;
const DEFAULT_REST = 30;
const TIME_STEP = 30; // rozdzielczość własnego czasu ćwiczenia (sekundy)

// Zaokrągla do wielokrotności TIME_STEP (min. TIME_STEP); 0 = brak własnego czasu
function snapTime(v){
  const n = parseInt(v, 10);
  if(!(n > 0)) return 0;
  return Math.max(TIME_STEP, Math.round(n / TIME_STEP) * TIME_STEP);
}

// ----- Zapisane treningi (localStorage['customTrainings']) -----
function loadCustomTrainings(){
  try{
    const raw = JSON.parse(localStorage.getItem(CUSTOM_KEY));
    return (raw && typeof raw === 'object') ? raw : {};
  }catch(e){ return {}; }
}

function saveCustomTrainings(map){
  try{ localStorage.setItem(CUSTOM_KEY, JSON.stringify(map)); }catch(e){}
}

// ----- Motyw jasny/ciemny -----
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if(btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}

function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const preferred = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(preferred);
}

function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
}

initTheme();

function defaultState(){
  return {
    fileName: 'plan-5',
    warmup: [
      { name: 'Skakanka spokojnie', sec: 120 },
      { name: 'Krążenia ramion, bioder, przysiady', sec: 180 }
    ],
    rounds: 1,
    rows: [['']],              // rows[wiersz][runda] = nazwa ćwiczenia
    times: [[]],               // times[wiersz][runda] = własny czas w sekundach (puste = z ustawień timera)
    preps: [[]],               // preps[wiersz][runda] = true -> przygotowanie 🧰 przed ćwiczeniem
    cooldown: [
      { name: 'Rozciąganie', sec: 300 }
    ]
  };
}

// Uzupełnia brakujące pola w starszych szkicach/zapisach
function normalizeState(s){
  // Starsze szkice trzymały rozgrzewkę/schłodzenie w minutach (pole min) — przelicz na sekundy
  [s.warmup, s.cooldown].forEach(list => (list || []).forEach(it => {
    if(it.sec == null) it.sec = snapTime((+it.min || 0) * 60);
    delete it.min;
  }));
  ['times', 'preps'].forEach(key => {
    if(!Array.isArray(s[key])) s[key] = [];
    s.rows.forEach((_, i) => { if(!Array.isArray(s[key][i])) s[key][i] = []; });
    s[key].length = s.rows.length;
  });
  return s;
}

// Tablice równoległe do rows — muszą być zmieniane razem z wierszami/rundami
const CELL_ARRAYS = ['rows', 'times', 'preps'];

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved && Array.isArray(saved.rows)) return normalizeState(saved);
  }catch(e){}
  return defaultState();
}

let state = loadState();

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

// Zamienia stan kreatora na tablicę kroków w formacie plans/plan-*.json
function buildPlanJson(s){
  const out = [];
  const prepItems = list => list
    .filter(it => it.name.trim())
    .map(it => ({ type: 'prep', name: it.name.trim(), t: snapTime(it.sec) }));

  const warm = prepItems(s.warmup);
  if(warm.length){
    out.push({ type: 'head', name: 'ROZGRZEWKA' });
    out.push(...warm);
  }

  let roundNo = 0;
  for(let r = 0; r < s.rounds; r++){
    const items = s.rows
      .map((row, i) => ({
        name: (row[r] || '').trim(),
        t: snapTime((s.times && s.times[i] || [])[r]),
        prep: !!(s.preps && s.preps[i] || [])[r]
      }))
      .filter(it => it.name);
    if(!items.length) continue;
    out.push({ type: 'head', name: 'RUNDA ' + (++roundNo) });
    items.forEach(({ name, t, prep }) => {
      // Własny czas -> fixed: true, timer go nie nadpisuje; brak -> czas z ustawień (⚙)
      // prep: true -> timer wstawi "Przygotowanie 🧰" przed ćwiczeniem
      out.push(t > 0 ? { type: 'work', name, t, fixed: true, prep } : { type: 'work', name, t: DEFAULT_WORK, prep });
      out.push({ type: 'rest', name: 'Przerwa', t: DEFAULT_REST });
    });
  }

  const cool = prepItems(s.cooldown);
  if(cool.length){
    // Timer rozpoznaje schłodzenie po tej dokładnej nazwie nagłówka
    out.push({ type: 'head', name: 'SCHŁODZENIE' });
    out.push(...cool);
  }
  return out;
}
window.buildPlanJson = buildPlanJson;

const $ = id => document.getElementById(id);

function el(tag, props = {}, children = []){
  const node = document.createElement(tag);
  Object.assign(node, props);
  children.forEach(c => node.appendChild(c));
  return node;
}

// ----- Rozgrzewka / schłodzenie -----
function renderList(containerId, list){
  const box = $(containerId);
  box.innerHTML = '';
  const itemClass = containerId === 'warmupList' ? 'warmup' : 'cooldown';
  list.forEach((it, i) => {
    const name = el('input', { type: 'text', value: it.name, placeholder: 'Nazwa' });
    name.oninput = () => { it.name = name.value; changed(); };
    const sec = el('input', { type: 'number', value: it.sec, min: TIME_STEP, step: TIME_STEP });
    sec.setAttribute('aria-label', 'Sekundy');
    sec.oninput = () => { it.sec = parseInt(sec.value, 10) || 0; changed(); };
    // Po wyjściu z pola dociągnij do wielokrotności 30 s
    sec.onchange = () => { it.sec = snapTime(sec.value); sec.value = it.sec || ''; changed(); };
    const del = el('button', { className: 'del', textContent: '✕', title: 'Usuń' });
    del.onclick = () => { list.splice(i, 1); renderAll(); };
    box.appendChild(el('div', { className: `item ${itemClass}` }, [
      name, sec, el('span', { className: 'unit', textContent: 'sek.' }), del
    ]));
  });
}

// ----- Tabela rund -----
function renderTable(){
  const table = $('roundsTable');
  table.innerHTML = '';

  const headRow = el('tr', {}, [el('th')]);
  for(let r = 0; r < state.rounds; r++){
    const th = el('th', { textContent: 'Runda ' + (r + 1) + ' ' });
    if(state.rounds > 1){
      const del = el('button', { className: 'del', textContent: '✕', title: 'Usuń rundę' });
      del.onclick = () => removeRound(r);
      th.appendChild(del);
    }
    headRow.appendChild(th);
  }
  headRow.appendChild(el('th'));
  table.appendChild(el('thead', {}, [headRow]));

  const body = el('tbody');
  state.rows.forEach((row, i) => {
    const tr = el('tr', {}, [el('td', { className: 'idx', textContent: i + 1 })]);
    for(let r = 0; r < state.rounds; r++){
      const input = el('input', { type: 'text', value: row[r] || '', placeholder: 'Ćwiczenie' });
      input.setAttribute('aria-label', `Runda ${r + 1}, ćwiczenie ${i + 1}`);
      input.oninput = () => { row[r] = input.value; changed(); };
      const times = state.times[i];
      const time = el('input', { type: 'number', className: 'sec', value: times[r] || '', min: TIME_STEP, step: TIME_STEP, placeholder: '⚙' });
      time.setAttribute('aria-label', `Runda ${r + 1}, czas ćwiczenia ${i + 1} (sekundy)`);
      time.title = 'Czas w sekundach — puste: czas z ustawień timera';
      time.oninput = () => { times[r] = time.value; changed(); };
      // Po wyjściu z pola dociągnij wpisaną wartość do wielokrotności 30 s
      time.onchange = () => {
        const v = snapTime(time.value);
        times[r] = v ? String(v) : '';
        time.value = times[r];
        changed();
      };
      const unit = el('span', { className: 'unit', textContent: 'sek.' });
      const preps = state.preps[i];
      const prep = el('input', { type: 'checkbox', checked: !!preps[r] });
      prep.setAttribute('aria-label', `Runda ${r + 1}, przygotowanie przed ćwiczeniem ${i + 1}`);
      prep.onchange = () => { preps[r] = prep.checked; changed(); };
      const prepLabel = el('label', { className: 'prep', title: 'Przygotowanie przed ćwiczeniem' },
        [prep, el('span', { textContent: '🧰' })]);
      tr.appendChild(el('td', {}, [el('div', { className: 'cell' }, [input, time, unit, prepLabel])]));
    }
    const del = el('button', { className: 'del', textContent: '✕', title: 'Usuń ćwiczenie' });
    del.onclick = () => {
      CELL_ARRAYS.forEach(key => state[key].splice(i, 1));
      if(!state.rows.length) CELL_ARRAYS.forEach(key => state[key].push([]));
      renderAll();
    };
    tr.appendChild(el('td', {}, [del]));
    body.appendChild(tr);
  });
  table.appendChild(body);
}

function removeRound(r){
  CELL_ARRAYS.forEach(key => state[key].forEach(cells => cells.splice(r, 1)));
  state.rounds--;
  renderAll();
}

function renderSummary(plan){
  const work = plan.filter(p => p.type === 'work').length;
  const rounds = plan.filter(p => p.type === 'head' && p.name.startsWith('RUNDA')).length;
  const prepSec = plan.filter(p => p.type === 'prep').reduce((a, p) => a + p.t, 0);
  $('summary').innerHTML =
    `Rundy: <b>${rounds}</b> · Ćwiczenia: <b>${work}</b> · Rozgrzewka + schłodzenie: <b>${Math.round(prepSec / 60)} min</b>`;
}

function changed(){
  const plan = buildPlanJson(state);
  $('output').value = JSON.stringify(plan, null, 2);
  renderSummary(plan);
  saveState();
}

function renderSavedList(){
  const box = $('savedList');
  const map = loadCustomTrainings();
  const names = Object.keys(map);
  box.innerHTML = '';
  if(!names.length){
    box.appendChild(el('p', { className: 'hint', textContent: 'Brak zapisanych treningów.' }));
    return;
  }
  names.forEach(name => {
    const info = map[name];
    const count = (info.plan || []).filter(p => p.type === 'work').length;
    const load = el('button', { textContent: '↩ Wczytaj' });
    load.onclick = () => {
      state = normalizeState(JSON.parse(JSON.stringify(info.state)));
      renderAll();
      toast(`Wczytano „${name}"`);
    };
    const del = el('button', { className: 'del', textContent: '✕', title: 'Usuń trening' });
    del.onclick = () => {
      if(!confirm(`Usunąć zapisany trening „${name}"?`)) return;
      delete map[name];
      saveCustomTrainings(map);
      renderSavedList();
    };
    box.appendChild(el('div', { className: 'item saved' }, [
      el('span', { className: 'saved-name', textContent: `${name} (${count} ćw.)` }),
      el('div', { style: 'display:flex;gap:8px' }, [load, del])
    ]));
  });
}

function renderAll(){
  $('fileName').value = state.fileName;
  renderList('warmupList', state.warmup);
  renderList('cooldownList', state.cooldown);
  renderTable();
  changed();
  renderSavedList();
}

function toast(msg){
  $('toast').textContent = msg;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { $('toast').textContent = ''; }, 2500);
}

// ----- Przyciski -----
$('addWarmup').onclick = () => { state.warmup.push({ name: '', sec: 60 }); renderAll(); };
$('addCooldown').onclick = () => { state.cooldown.push({ name: '', sec: 60 }); renderAll(); };
$('addRow').onclick = () => { CELL_ARRAYS.forEach(key => state[key].push([])); renderAll(); };
$('addRound').onclick = () => {
  // Nowa runda startuje jako kopia poprzedniej — zwykle zmienia się tylko kilka ćwiczeń
  const last = state.rounds - 1;
  state.rows.forEach(row => { row[state.rounds] = row[last] || ''; });
  state.times.forEach(t => { t[state.rounds] = t[last] || ''; });
  state.preps.forEach(p => { p[state.rounds] = !!p[last]; });
  state.rounds++;
  renderAll();
};
$('fileName').oninput = e => { state.fileName = e.target.value; saveState(); };
$('themeToggle').onclick = toggleTheme;

$('saveTrainingBtn').onclick = () => {
  const name = state.fileName.trim();
  if(!name){ toast('Wpisz nazwę pliku, żeby zapisać trening'); return; }
  const plan = buildPlanJson(state);
  if(!plan.some(p => p.type === 'work')){ toast('Dodaj przynajmniej jedno ćwiczenie'); return; }
  const map = loadCustomTrainings();
  map[name] = { plan, state: JSON.parse(JSON.stringify(state)) };
  saveCustomTrainings(map);
  renderSavedList();
  toast(`Zapisano „${name}" — dostępny w timerze`);
};

$('copyBtn').onclick = async () => {
  const text = $('output').value;
  try{
    await navigator.clipboard.writeText(text);
  }catch(e){
    $('output').select();
    document.execCommand('copy');
  }
  toast('Skopiowano JSON');
};

$('downloadBtn').onclick = () => {
  const blob = new Blob([$('output').value + '\n'], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: (state.fileName.trim() || 'plan') + '.json' });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
};

// ----- Import pliku JSON -----
const PREP_STEP_NAME = 'Przygotowanie 🧰'; // krok wstawiany przez timer (app.js)

// Zamienia plan (format plans/plan-*.json) na stan kreatora.
// ROZGRZEWKA / SCHŁODZENIE -> listy; każdy inny nagłówek -> runda.
function planToState(plan, fileName){
  if(!Array.isArray(plan)) throw new Error('Plik nie zawiera listy kroków');
  const s = { fileName, warmup: [], cooldown: [], rounds: 0, rows: [], times: [], preps: [] };
  const rounds = [];     // rounds[r] = [{ name, t, prep }]
  let section = null;    // 'warmup' | 'cooldown' | 'round'
  let pendingPrep = false;
  let skipped = 0;

  plan.forEach(p => {
    if(!p || typeof p !== 'object') return;
    if(p.type === 'head'){
      const name = String(p.name || '').trim().toUpperCase();
      if(name === 'ROZGRZEWKA') section = 'warmup';
      else if(name === 'SCHŁODZENIE') section = 'cooldown';
      else { section = 'round'; rounds.push([]); }
      pendingPrep = false;
      return;
    }
    const name = String(p.name || '').trim();
    if(p.type === 'rest') return; // przerwy bierze timer z ustawień
    if(p.type === 'prep' && name === PREP_STEP_NAME){ pendingPrep = true; return; }
    if(p.type === 'prep' && (section === 'warmup' || section === 'cooldown' || !section)){
      s[section === 'cooldown' ? 'cooldown' : 'warmup'].push({ name, sec: snapTime(p.t) || TIME_STEP });
      return;
    }
    if(p.type === 'work' || p.type === 'prep'){
      if(!rounds.length) rounds.push([]);
      rounds[rounds.length - 1].push({
        name,
        t: p.fixed ? snapTime(p.t) : 0,
        prep: typeof p.prep === 'boolean' ? p.prep : pendingPrep
      });
      pendingPrep = false;
      return;
    }
    skipped++; // np. kroki typu input — kreator ich nie obsługuje
  });

  const used = rounds.filter(r => r.length);
  s.rounds = Math.max(1, used.length);
  const rowCount = Math.max(1, ...used.map(r => r.length));
  for(let i = 0; i < rowCount; i++){
    s.rows.push(used.map(r => r[i] ? r[i].name : ''));
    s.times.push(used.map(r => r[i] && r[i].t ? String(r[i].t) : ''));
    s.preps.push(used.map(r => !!(r[i] && r[i].prep)));
  }
  return { state: normalizeState(s), skipped };
}

function importFile(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      // Akceptuj też zapis w formacie { plan, state } (jak w localStorage)
      const plan = Array.isArray(data) ? data : data && data.plan;
      const name = file.name.replace(/\.json$/i, '');
      const { state: imported, skipped } = planToState(plan, name);
      if(!confirm(`Wczytać „${name}"? Obecna zawartość kreatora zostanie zastąpiona.`)) return;
      state = imported;
      renderAll();
      toast(`Wczytano „${name}"` + (skipped ? ` (pominięto kroków: ${skipped})` : '') + ' — kliknij 💾 Zapisz, żeby dodać do timera');
    }catch(e){
      toast('Nie udało się wczytać pliku: ' + e.message);
    }
  };
  reader.readAsText(file);
}

$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = e => { importFile(e.target.files[0]); e.target.value = ''; };
document.addEventListener('dragover', e => { e.preventDefault(); });
document.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer && e.dataTransfer.files[0];
  if(file) importFile(file);
});

$('resetBtn').onclick = () => {
  if(!confirm('Wyczyścić kreator?')) return;
  state = defaultState();
  renderAll();
};

renderAll();