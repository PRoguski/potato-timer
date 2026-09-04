// Ładuj plan z zewnętrznego pliku JSON
let plan = [];
let basePlan = []; // Oryginalny plan bez kroków przygotowania
let availablePlans = [];
let currentPlanIndex = 0;

const planNames = {
  'plan-0': '60 min - Standardowy',
  'plan-1': '30 min - Średni',
  'plan-2': '20 min - Tabata'
};

async function detectAvailablePlans(){
  availablePlans = [];
  // Spróbuj załadować plan-0, plan-1, plan-2, itd.
  for(let i = 0; i < 10; i++){
    try{
      const response = await fetch(`plans/plan-${i}.json`);
      if(response.ok){
        availablePlans.push(`plan-${i}`);
      }
    }catch(e){}
  }
  return availablePlans.length > 0;
}

async function loadPlanFromFile(planName){
  try{
    const response = await fetch(`plans/${planName}.json`);
    if(!response.ok) throw new Error('Plan not found');
    plan = await response.json();
    // Zapisz oryginalny plan bez kroków przygotowania
    basePlan = JSON.parse(JSON.stringify(plan));
    currentPlanIndex = availablePlans.indexOf(planName);
  }catch(e){
    console.error('Błąd ładowania planu:', e);
    plan = [{type:'head', name:'BŁĄD'}, {type:'prep', name:'Nie można załadować planu', t:60}];
    basePlan = JSON.parse(JSON.stringify(plan));
  }
}

async function initializePlanSelector(){
  // Wykryj dostępne plany
  const hasPlans = await detectAvailablePlans();
  if(!hasPlans){
    console.error('Brak dostępnych planów');
    availablePlans = ['plan-0'];
  }

  // Wczytaj wybrany plan z localStorage
  let savedPlan = localStorage.getItem('selectedPlan') || availablePlans[0];
  if(!availablePlans.includes(savedPlan)){
    savedPlan = availablePlans[0];
  }

  // Załaduj plan
  await loadPlanFromFile(savedPlan);

  // Utwórz UI selektora
  const selector = document.getElementById('planSelector');
  selector.innerHTML = '';
  availablePlans.forEach((planName, idx) => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="radio" name="plan" value="${planName}" ${planName === savedPlan ? 'checked' : ''}>
      <span>${planNames[planName] || planName}</span>`;
    label.onchange = async (e) => {
      if(e.target.checked){
        localStorage.setItem('selectedPlan', planName);
        await loadPlanFromFile(planName);
        if(window.initApp) initApp();
      }
    };
    selector.appendChild(label);
  });

  // Inicjuj aplikację
  initApp();
}

/* Plan załadowywany z pliku (plans/default-plan.json)
// type: prep (rozgrzewka/schłodzenie), work (ćwiczenie), rest (przerwa), head (nagłówek – bez czasu)
// const S = 30; // przerwa w sekundach
// const plan = [
  {type:'head', name:'ROZGRZEWKA'},
  {type:'prep', name:'Skakanka spokojnie', t:120},
  {type:'prep', name:'Krążenia ramion, bioder, przysiady', t:180},

  {type:'head', name:'RUNDA 1'},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Pompki na podporach', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Rozpiętki z gumą', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Przysiad z gumą', t:60}, {type:'rest', name:'Przerwa', t:S},

  {type:'head', name:'RUNDA 2'},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Pompki wąskie (triceps)', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Wiosłowanie gumą', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Wykroki', t:60}, {type:'rest', name:'Przerwa', t:S},

  {type:'head', name:'RUNDA 3'},
  {type:'work', name:'Skakanka (sprint/wolno)', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Pompki wolne, głębokie', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Uginanie ramion (biceps)', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Martwy ciąg z gumą', t:60}, {type:'rest', name:'Przerwa', t:S},

  {type:'head', name:'RUNDA 4'},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Pompki diamentowe', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Odwodzenie ramion (barki)', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Skakanka', t:60}, {type:'rest', name:'Przerwa', t:S},
  {type:'work', name:'Plank na podporach', t:60}, {type:'rest', name:'Przerwa', t:S},

  {type:'head', name:'SCHŁODZENIE'},
  {type:'prep', name:'Rozciąganie: klatka, barki, uda, łydki', t:300},
];
*/

// Globalne zmienne
let steps = [];
const phaseLabel = {work:'Ćwiczenie', rest:'Przerwa', prep:'Rozgrzewka'};
const $ = id => document.getElementById(id);

// DOM elements - inicjalizowane w initApp
let stage, phaseEl, exEl, clockEl, nextEl, barEl, counterEl, startBtn, prevBtn, nextBtn;
let idx=0, remaining=0, total=0, tick=null, running=false;

function initApp(){
  // Tylko kroki z czasem biorą udział w odliczaniu
  steps = plan.filter(p => p.type !== 'head');

  // Inicjuj DOM elements
  stage=$('stage'); phaseEl=$('phase'); exEl=$('exercise');
  clockEl=$('clock'); nextEl=$('next'); barEl=$('bar');
  counterEl=$('counter'); startBtn=$('startBtn');
  prevBtn=$('prevBtn'); nextBtn=$('nextBtn');

  // Zainicjuj zmienne
  idx=0;
  remaining=steps[0].t;
  total=steps[0].t;

  // Reszta inicjalizacji
  setupEventListeners();
  buildPlanList();
  loadSettings();
  $('wakeLockToggle').checked = settings.wakeLock;
  updatePlan();
  goto(0);
}

function fmt(s){const m=Math.floor(s/60),x=s%60;return String(m).padStart(2,'0')+':'+String(x).padStart(2,'0');}

// oblicz całkowity pozostały czas treningu
function calcRemainingTime(){
  let total = remaining; // obecny krok
  for(let i=idx+1; i<steps.length; i++){
    total += steps[i].t;
  }
  return total;
}

// prosty dźwięk (WebAudio, bez plików)
let actx;
function beep(freq=880,dur=0.15){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(), g=actx.createGain();
    o.frequency.value=freq; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(.18,actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+dur);
    o.start(); o.stop(actx.currentTime+dur);
  }catch(e){}
}

function render(){
  const step=steps[idx];
  stage.className=step.type;
  phaseEl.textContent=phaseLabel[step.type]||'';
  exEl.textContent=step.name;
  clockEl.textContent=fmt(remaining);
  counterEl.textContent=(idx+1)+' / '+steps.length;
  const nxt=steps[idx+1];
  nextEl.innerHTML = nxt ? 'Następnie: <b>'+nxt.name+'</b>' : 'To ostatni element 💪';
  barEl.style.width = (100*(total-remaining)/total)+'%';

  // Pozostały czas całego treningu
  const remainingTotal = calcRemainingTime();
  document.getElementById('remainingTimeValue').textContent = fmt(remainingTotal);

  document.querySelectorAll('.row').forEach(r=>r.classList.remove('active'));
  const ar=document.querySelector('.row[data-step="'+idx+'"]');
  if(ar){ar.classList.add('active');ar.scrollIntoView({block:'nearest'});}
}

function goto(i){
  idx=Math.max(0,Math.min(steps.length-1,i));
  total=remaining=steps[idx].t;
  prevBtn.disabled=idx===0;
  render();
}

function tickDown(){
  remaining--;
  // ostrzeżenie 15 s przed końcem przerwy
  if(steps[idx].type==='rest' && remaining===15){ beep(440,.18); setTimeout(()=>beep(440,.18),200); }
  if(remaining<=3 && remaining>0) beep(660,.1);
  if(remaining<=0){
    beep(1046,.25);
    if(idx>=steps.length-1){ finish(); return; }
    idx++; total=remaining=steps[idx].t;
    prevBtn.disabled=false;
    beep(steps[idx].type==='rest'?520:988,.18);
  }
  render();
}

function start(){
  if(running) return;
  beep(988,.12);
  running=true; startBtn.textContent='Pauza'; startBtn.classList.remove('primary');
  tick=setInterval(tickDown,1000);
  if(settings.wakeLock) requestWakeLock();
}
function pause(){
  running=false; startBtn.textContent='Wznów'; startBtn.classList.add('primary');
  clearInterval(tick);
  releaseWakeLock();
}
function toggle(){ running?pause():start(); }

function finish(){
  clearInterval(tick); running=false;
  releaseWakeLock();
  stage.className='done';
  phaseEl.textContent='Koniec';
  exEl.textContent='Trening zaliczony 🎉';
  clockEl.textContent='00:00';
  nextEl.textContent='Świetna robota. Rozciągnij się i napij wody.';
  barEl.style.width='100%';
  startBtn.textContent='Od nowa'; startBtn.classList.add('primary');
  startBtn.onclick=()=>{ startBtn.onclick=toggle; goto(0); };
  beep(1319,.3);
}

function setupEventListeners(){
  startBtn.onclick=toggle;
  prevBtn.onclick=()=>{ if(remaining<steps[idx].t-1){goto(idx);}else{goto(idx-1);} };
  nextBtn.onclick=()=>{ if(idx<steps.length-1){goto(idx+1);}else{finish();} };

  // Tap navigation on timer display
  stage.onclick = (e) => {
    if(!settings.tapNavigation) return;
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const thirdWidth = width / 3;

    if(x < thirdWidth){
      // Left side - previous
      if(remaining<steps[idx].t-1){goto(idx);}else{goto(idx-1);}
    }else if(x > width - thirdWidth){
      // Right side - next
      if(idx<steps.length-1){goto(idx+1);}else{finish();}
    }else{
      // Center - start/stop
      toggle();
    }
  };
}

// budowa listy planu
function buildPlanList(){
  const listEl=$('planList');
  listEl.innerHTML = ''; // wyczyść starą listę
  let stepPtr=0;
  plan.forEach(p=>{
    const row=document.createElement('div');
    if(p.type==='head'){
      row.className='row head';
      row.innerHTML='<span class="dot head"></span><span class="idx"></span>'+
        '<span class="name">'+p.name+'</span><span class="dur"></span>';
    }else{
      const si=stepPtr++;
      row.className='row'; row.dataset.step=si;
      row.innerHTML='<span class="dot '+p.type+'"></span><span class="idx">'+(si+1)+'</span>'+
        '<span class="name">'+p.name+'</span><span class="dur">'+fmt(p.t)+'</span>';
      row.onclick=()=>{ pause(); goto(si); };
    }
    listEl.appendChild(row);
  });
}

// ===== WAKE LOCK API =====
let wakeLockSentinel = null;

async function requestWakeLock(){
  if(!('wakeLock' in navigator)) return; // nie wspierane
  try{
    if(!wakeLockSentinel){
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  }catch(e){ console.log('Wake Lock error:', e); }
}

async function releaseWakeLock(){
  if(wakeLockSentinel){
    try{ await wakeLockSentinel.release(); wakeLockSentinel = null; }catch(e){}
  }
}

// Obsługa widoczności strony (Wake Lock się zwalnia gdy strona jest niewidoczna)
document.addEventListener('visibilitychange', async () => {
  if(document.hidden) await releaseWakeLock();
  else if(settings.wakeLock && running) await requestWakeLock();
});

// ===== USTAWIENIA (localStorage) =====
const defaultSettings = {
  exerciseSize: 100,
  nextSize: 100,
  workTime: 60,
  restTime: 30,
  prepTime: 15,
  wakeLock: false,
  tapNavigation: false
};

let settings = {...defaultSettings};

function loadSettings(){
  try{
    const saved = localStorage.getItem('timerSettings');
    if(saved) settings = {...defaultSettings, ...JSON.parse(saved)};
  }catch(e){}
  applySettings();
}

function saveSettings(){
  try{ localStorage.setItem('timerSettings', JSON.stringify(settings)); }catch(e){}
}

function applySettings(){
  // Zastosuj rozmiary czcionek
  const exerciseScale = settings.exerciseSize / 100;
  const nextScale = settings.nextSize / 100;
  exEl.style.fontSize = (exerciseScale >= 1 ? 'clamp(' : '') +
    (2 * exerciseScale) + 'rem,' + (9 * exerciseScale) + 'vw,' + (3.2 * exerciseScale) + 'rem' + (exerciseScale >= 1 ? ')' : '');
  nextEl.style.fontSize = 'clamp(' + (1.1 * nextScale) + 'rem,' + (4 * nextScale) + 'vw,' + (1.4 * nextScale) + 'rem)';

  // Zaktualizuj wartości inputów
  $('exerciseSize').value = settings.exerciseSize;
  $('nextSize').value = settings.nextSize;
  $('workTime').value = settings.workTime;
  $('restTime').value = settings.restTime;
  $('prepTime').value = settings.prepTime;

  // Zaktualizuj wyświetlane wartości
  $('exerciseSizeValue').textContent = settings.exerciseSize + '%';
  $('nextSizeValue').textContent = settings.nextSize + '%';
  $('workTimeValue').textContent = settings.workTime + 's';
  $('restTimeValue').textContent = settings.restTime + 's';
  $('prepTimeValue').textContent = settings.prepTime + 's';

  // Zastosuj tap navigation toggle
  const controls = $('controls');
  if(settings.tapNavigation){
    controls.style.display = 'none';
    stage.style.cursor = 'pointer';
  }else{
    controls.style.display = 'flex';
    stage.style.cursor = 'default';
  }

  // Zaktualizuj checkbox
  $('tapNavToggle').checked = settings.tapNavigation;
}

function resetSettings(){
  settings = {...defaultSettings};
  saveSettings();
  applySettings();
}

// Buduj plan z dynamicznym czasem przygotowania
function buildPlan(source = basePlan){
  const newPlan = [];
  for(let i = 0; i < source.length; i++){
    newPlan.push(source[i]);

    // Dodaj przygotowanie po przerwie, ale nie przed schłodzeniem
    if(source[i].type === 'rest'){
      // Szukaj następnego nagłówka sekcji
      let nextSectionIdx = i + 1;
      while(nextSectionIdx < source.length && source[nextSectionIdx].type !== 'head'){
        nextSectionIdx++;
      }

      // Jeśli następna sekcja istnieje i NIE jest schłodzeniem, dodaj przygotowanie
      if(nextSectionIdx < source.length && source[nextSectionIdx].name !== 'SCHŁODZENIE'){
        newPlan.push({
          type: 'prep',
          name: 'Czas na przygotowanie sprzętu/pozycji',
          t: settings.prepTime
        });
      }
    }
  }
  return newPlan;
}

function updatePlan(){
  // Przebuduj plan z dynamicznym czasem przygotowania na podstawie basePlan
  plan = buildPlan(basePlan);

  // Zaktualizuj plan z nowymi czasami
  const S = settings.restTime;
  plan.forEach(p => {
    if(p.type === 'work') p.t = settings.workTime;
    if(p.type === 'rest') p.t = S;
    // prepTime is already set in buildPlan(), ale możemy go zaktualizować w każdej iteracji
    if(p.type === 'prep' && p.name === 'Czas na przygotowanie sprzętu/pozycji') p.t = settings.prepTime;
  });

  // Aktualizuj steps array z nowym planem
  steps = plan.filter(p => p.type !== 'head');

  // Przebuduj listę
  const listEl = $('planList');
  listEl.innerHTML = '';
  let stepPtr = 0;
  plan.forEach(p=>{
    const row=document.createElement('div');
    if(p.type==='head'){
      row.className='row head';
      row.innerHTML='<span class="dot head"></span><span class="idx"></span>'+
        '<span class="name">'+p.name+'</span><span class="dur"></span>';
    }else{
      const si=stepPtr++;
      row.className='row'; row.dataset.step=si;
      row.innerHTML='<span class="dot '+p.type+'"></span><span class="idx">'+(si+1)+'</span>'+
        '<span class="name">'+p.name+'</span><span class="dur">'+fmt(p.t)+'</span>';
      row.onclick=()=>{ pause(); goto(si); };
    }
    listEl.appendChild(row);
  });
}

// Ustawienia UI
const settingsOverlay = $('settingsOverlay');
const settingsBtn = $('settingsBtn');
const closeSettingsBtn = $('closeSettingsBtn');
const resetBtn = $('resetBtn');

settingsBtn.onclick = () => { settingsOverlay.classList.add('open'); };
closeSettingsBtn.onclick = () => { settingsOverlay.classList.remove('open'); };
settingsOverlay.onclick = (e) => { if(e.target === settingsOverlay) settingsOverlay.classList.remove('open'); };

$('exerciseSize').oninput = (e) => {
  settings.exerciseSize = parseInt(e.target.value);
  $('exerciseSizeValue').textContent = settings.exerciseSize + '%';
  exEl.style.fontSize = 'clamp(' + (2 * settings.exerciseSize / 100) + 'rem,' + (9 * settings.exerciseSize / 100) + 'vw,' + (3.2 * settings.exerciseSize / 100) + 'rem)';
  saveSettings();
};

$('nextSize').oninput = (e) => {
  settings.nextSize = parseInt(e.target.value);
  $('nextSizeValue').textContent = settings.nextSize + '%';
  nextEl.style.fontSize = 'clamp(' + (1.1 * settings.nextSize / 100) + 'rem,' + (4 * settings.nextSize / 100) + 'vw,' + (1.4 * settings.nextSize / 100) + 'rem)';
  saveSettings();
};

$('workTime').oninput = (e) => {
  settings.workTime = parseInt(e.target.value);
  $('workTimeValue').textContent = settings.workTime + 's';
  updatePlan();
  saveSettings();
};

$('restTime').oninput = (e) => {
  settings.restTime = parseInt(e.target.value);
  $('restTimeValue').textContent = settings.restTime + 's';
  updatePlan();
  saveSettings();
};

$('prepTime').oninput = (e) => {
  settings.prepTime = parseInt(e.target.value);
  $('prepTimeValue').textContent = settings.prepTime + 's';
  clearWorkoutState();
  updatePlan();
  saveSettings();
};

resetBtn.onclick = () => {
  resetSettings();
  updatePlan();
};

// Wake Lock toggle
$('wakeLockToggle').onchange = (e) => {
  settings.wakeLock = e.target.checked;
  saveSettings();
  if(running && e.target.checked) requestWakeLock();
  else if(!e.target.checked) releaseWakeLock();
};

// Tap navigation toggle
$('tapNavToggle').onchange = (e) => {
  settings.tapNavigation = e.target.checked;
  applySettings();
  saveSettings();
};

// Define clearWorkoutState function
function clearWorkoutState(){
  try{ localStorage.removeItem('workoutState'); }catch(e){}
}

// Załaduj plan z pliku JSON i inicjuj aplikację
initializePlanSelector();
