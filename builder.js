// Kreator treningu: edytowalna tabela rund -> JSON planu dla timera.
// Czas pracy i przerwy nadpisuje timer (suwaki w ustawieniach), więc
// w JSON-ie wpisujemy tylko wartości domyślne.

const STORAGE_KEY = 'builderDraft';
const DEFAULT_WORK = 60;
const DEFAULT_REST = 30;

function defaultState(){
  return {
    fileName: 'plan-5',
    warmup: [
      { name: 'Skakanka spokojnie', min: 2 },
      { name: 'Krążenia ramion, bioder, przysiady', min: 3 }
    ],
    rounds: 1,
    rows: [['']],              // rows[wiersz][runda] = nazwa ćwiczenia
    cooldown: [
      { name: 'Rozciąganie', min: 5 }
    ]
  };
}

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved && Array.isArray(saved.rows)) return saved;
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
    .map(it => ({ type: 'prep', name: it.name.trim(), t: Math.max(0, Math.round((+it.min || 0) * 60)) }));

  const warm = prepItems(s.warmup);
  if(warm.length){
    out.push({ type: 'head', name: 'ROZGRZEWKA' });
    out.push(...warm);
  }

  let roundNo = 0;
  for(let r = 0; r < s.rounds; r++){
    const names = s.rows.map(row => (row[r] || '').trim()).filter(Boolean);
    if(!names.length) continue;
    out.push({ type: 'head', name: 'RUNDA ' + (++roundNo) });
    names.forEach(name => {
      out.push({ type: 'work', name, t: DEFAULT_WORK });
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
  list.forEach((it, i) => {
    const name = el('input', { type: 'text', value: it.name, placeholder: 'Nazwa' });
    name.oninput = () => { it.name = name.value; changed(); };
    const min = el('input', { type: 'number', value: it.min, min: 0, step: 0.5 });
    min.setAttribute('aria-label', 'Minuty');
    min.oninput = () => { it.min = parseFloat(min.value) || 0; changed(); };
    const del = el('button', { className: 'del', textContent: '✕', title: 'Usuń' });
    del.onclick = () => { list.splice(i, 1); renderAll(); };
    box.appendChild(el('div', { className: 'item' }, [
      name, min, el('span', { className: 'unit', textContent: 'min' }), del
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
      tr.appendChild(el('td', {}, [input]));
    }
    const del = el('button', { className: 'del', textContent: '✕', title: 'Usuń ćwiczenie' });
    del.onclick = () => { state.rows.splice(i, 1); if(!state.rows.length) state.rows.push([]); renderAll(); };
    tr.appendChild(el('td', {}, [del]));
    body.appendChild(tr);
  });
  table.appendChild(body);
}

function removeRound(r){
  state.rows.forEach(row => row.splice(r, 1));
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

function renderAll(){
  $('fileName').value = state.fileName;
  renderList('warmupList', state.warmup);
  renderList('cooldownList', state.cooldown);
  renderTable();
  changed();
}

function toast(msg){
  $('toast').textContent = msg;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { $('toast').textContent = ''; }, 2500);
}

// ----- Przyciski -----
$('addWarmup').onclick = () => { state.warmup.push({ name: '', min: 1 }); renderAll(); };
$('addCooldown').onclick = () => { state.cooldown.push({ name: '', min: 1 }); renderAll(); };
$('addRow').onclick = () => { state.rows.push([]); renderAll(); };
$('addRound').onclick = () => {
  // Nowa runda startuje jako kopia poprzedniej — zwykle zmienia się tylko kilka ćwiczeń
  const last = state.rounds - 1;
  state.rows.forEach(row => { row[state.rounds] = row[last] || ''; });
  state.rounds++;
  renderAll();
};
$('fileName').oninput = e => { state.fileName = e.target.value; saveState(); };

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

$('resetBtn').onclick = () => {
  if(!confirm('Wyczyścić kreator?')) return;
  state = defaultState();
  renderAll();
};

renderAll();
