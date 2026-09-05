// Potato Timer - jQuery Version
// Uses jQuery for DOM manipulation and event handling

let basePlan = [];
let plan = [];
let steps = [];
let idx = 0;
let remaining = 0;
let total = 0;
let running = false;
let tick = null;
let actx = null;
let wakeLockSentinel = null;

const defaultSettings = {
  exerciseSize: 100,
  nextSize: 100,
  workTime: 60,
  restTime: 30,
  prepTime: 15,
  wakeLock: false,
  tapNavigation: false
};

let settings = { ...defaultSettings };
let availablePlans = [];
let selectedPlan = 'plan-0';

// ===== Utility =====
function $(selector) {
  return jQuery(selector);
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const x = s % 60;
  return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
}

function calcRemainingTime() {
  return steps.slice(idx).reduce((sum, s) => sum + (s.t || 0), 0);
}

function beep(freq = 880, dur = 0.15) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(actx.destination);
    gain.gain.setValueAtTime(0.3, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + dur);
    osc.start(actx.currentTime);
    osc.stop(actx.currentTime + dur);
  } catch (e) {}
}

// ===== Rendering =====
function render() {
  const step = steps[idx];
  if (!step) return;

  // Update stage class
  $('#stage').removeClass('work rest prep done').addClass(step.type);

  // Update phase, exercise name, and clock
  const phaseLabels = { work: 'Ćwiczenie', rest: 'Przerwa', prep: 'Przygotowanie' };
  $('#phase').text(phaseLabels[step.type] || 'Gotowy?');
  $('#exercise').text(step.name || 'Trening interwałowy');
  $('#clock').text(fmt(remaining));

  // Update next step
  const nextStep = steps[idx + 1];
  if (nextStep) {
    $('#next').html('Następnie: <b>' + nextStep.name + '</b>');
  } else {
    $('#next').text('Koniec treningu');
  }

  // Update progress bar
  const progressPercent = total === 0 ? 0 : ((total - remaining) / total) * 100;
  $('#bar').css('width', progressPercent + '%');

  // Update counter
  $('#counter').text((idx + 1) + ' / ' + steps.length);

  // Update remaining time
  $('#remainingTimeValue').text(fmt(calcRemainingTime()));

  // Update exercise image
  if (step.image) {
    $('#exerciseImage').attr('src', step.image).addClass('show');
  } else {
    $('#exerciseImage').removeClass('show');
  }

  // Update active row in plan list
  $('.row').removeClass('active');
  $('.row').eq(idx).addClass('active');

  // Update button states
  $('#prevBtn').prop('disabled', idx === 0);
  if (running) {
    $('#startBtn').text('Pauza');
  } else {
    $('#startBtn').text(steps.length > 0 && idx < steps.length ? 'Start' : 'Od nowa');
  }

  // Apply settings visually
  applySettings();
}

function applySettings() {
  const doc = jQuery(document.documentElement);
  doc.css('--exercise-size', settings.exerciseSize / 100);
  doc.css('--next-size', settings.nextSize / 100);
}

// ===== Timer Control =====
function goto(i) {
  if (i < 0 || i >= steps.length) return;
  const wasRunning = running;
  if (running) pause();

  idx = i;
  const step = steps[idx];
  remaining = step.t || 0;
  total = step.t || 0;

  render();
  if (wasRunning) start();
}

function tickDown() {
  remaining--;

  // Warning beep 15s before end of rest
  if (steps[idx].type === 'rest' && remaining === 15) {
    beep(440, 0.18);
    setTimeout(() => beep(440, 0.18), 200);
  }

  // Beeps in last 3 seconds
  if (remaining <= 3 && remaining > 0) {
    beep(660, 0.1);
  }

  if (remaining <= 0) {
    beep(1046, 0.25);
    if (idx + 1 >= steps.length) {
      finish();
    } else {
      const nextStep = steps[idx + 1];
      const freq = nextStep.type === 'rest' ? 520 : 988;
      beep(freq, 0.18);
      idx++;
      remaining = steps[idx].t || 0;
      total = steps[idx].t || 0;
    }
  }

  render();
}

function start() {
  if (running) return;
  beep(988, 0.12);
  running = true;
  requestWakeLock();

  tick = setInterval(() => {
    tickDown();
  }, 1000);

  render();
}

function pause() {
  running = false;
  if (tick) clearInterval(tick);
  releaseWakeLock();
  render();
}

function toggle() {
  running ? pause() : start();
}

function finish() {
  pause();
  beep(1319, 0.3);
  $('#stage').removeClass('work rest prep').addClass('done');
  clearWorkoutState();
}

// ===== Navigation =====
function previous() {
  const step = steps[idx];
  // If we're in the middle of a step, restart it
  if (remaining < (step.t || 0) - 1) {
    goto(idx);
  } else {
    goto(idx - 1);
  }
}

function next() {
  goto(idx + 1);
}

// ===== Plans =====
function detectAvailablePlans() {
  availablePlans = ['plan-0', 'plan-1', 'plan-2'];
}

function loadPlanFromFile(planName) {
  jQuery.ajax({
    url: 'plans/' + planName + '.json',
    method: 'GET',
    dataType: 'json',
    success: function(data) {
      basePlan = data;
      buildPlan();
      selectedPlan = planName;
      try {
        localStorage.setItem('selectedPlan', planName);
      } catch (e) {}
    },
    error: function() {
      console.error('Failed to load plan:', planName);
    }
  });
}

function buildPlan(source = basePlan) {
  const newPlan = [];
  for (let i = 0; i < source.length; i++) {
    const step = jQuery.extend({}, source[i]);

    // Update work and rest times from settings
    if (step.type === 'work') {
      step.t = settings.workTime;
    } else if (step.type === 'rest') {
      step.t = settings.restTime;
    }

    newPlan.push(step);

    // Add prep time after rest (except before cooldown)
    if (step.type === 'rest') {
      let nextSectionIdx = i + 1;
      while (nextSectionIdx < source.length && source[nextSectionIdx].type !== 'head') {
        nextSectionIdx++;
      }

      if (nextSectionIdx < source.length && source[nextSectionIdx].name !== 'SCHŁODZENIE') {
        newPlan.push({
          type: 'prep',
          name: 'Czas na przygotowanie sprzętu/pozycji',
          t: settings.prepTime
        });
      }
    }
  }

  plan = newPlan;
  steps = plan.filter(p => p.type !== 'head');

  if (steps.length > 0) {
    idx = 0;
    remaining = steps[0].t || 0;
    total = steps[0].t || 0;
  }

  buildPlanList();
  render();
}

function updatePlan() {
  buildPlan();
  clearWorkoutState();
}

function buildPlanList() {
  const list = $('#planList');
  list.empty();

  plan.forEach((step, i) => {
    const row = jQuery('<div>')
      .addClass('row')
      .addClass(step.type === 'head' ? 'head' : '');

    // Dot
    row.append(jQuery('<div>').addClass('dot ' + step.type));

    // Index
    if (step.type !== 'head') {
      row.append(jQuery('<div>').addClass('idx').text(i));
    }

    // Name
    row.append(jQuery('<div>').addClass('name').text(step.name));

    // Duration
    if (step.t) {
      row.append(jQuery('<div>').addClass('dur').text(fmt(step.t)));
    }

    // Click to jump
    if (step.type !== 'head') {
      row.on('click', function() {
        pause();
        const stepIndex = steps.findIndex((s, idx) => plan[i] === source[idx]);
        let stepIdx = 0;
        for (let j = 0; j < i; j++) {
          if (plan[j].type !== 'head') stepIdx++;
        }
        goto(stepIdx);
      });
    }

    list.append(row);
  });
}

// ===== Settings =====
function loadSettings() {
  try {
    const saved = localStorage.getItem('settings');
    if (saved) {
      settings = jQuery.extend({}, defaultSettings, JSON.parse(saved));
    }
  } catch (e) {}
  applySettings();
  updateSettingsUI();
}

function saveSettings() {
  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (e) {}
}

function applySettings() {
  const doc = jQuery(document.documentElement);
  doc.css('--exercise-size', settings.exerciseSize / 100);
  doc.css('--next-size', settings.nextSize / 100);
}

function updateSettingsUI() {
  $('#exerciseSizeValue').text(settings.exerciseSize + '%');
  $('#nextSizeValue').text(settings.nextSize + '%');
  $('#workTimeValue').text(settings.workTime + 's');
  $('#restTimeValue').text(settings.restTime + 's');
  $('#prepTimeValue').text(settings.prepTime + 's');
  $('#exerciseSize').val(settings.exerciseSize);
  $('#nextSize').val(settings.nextSize);
  $('#workTime').val(settings.workTime);
  $('#restTime').val(settings.restTime);
  $('#prepTime').val(settings.prepTime);
  $('#wakeLockToggle').prop('checked', settings.wakeLock);
  $('#tapNavToggle').prop('checked', settings.tapNavigation);
}

function resetSettings() {
  settings = jQuery.extend({}, defaultSettings);
  saveSettings();
  updateSettingsUI();
  updatePlan();
}

// ===== Persistence =====
function clearWorkoutState() {
  try {
    localStorage.removeItem('workoutState');
  } catch (e) {}
}

function saveWorkoutState() {
  try {
    const state = {
      selectedPlan: localStorage.getItem('selectedPlan'),
      idx: idx,
      remaining: remaining,
      total: total,
      running: running,
      timestamp: Date.now()
    };
    localStorage.setItem('workoutState', JSON.stringify(state));
  } catch (e) {}
}

function loadWorkoutState() {
  try {
    const saved = localStorage.getItem('workoutState');
    if (!saved) return null;

    const state = JSON.parse(saved);
    // Check if state is fresh (less than 1 hour old)
    if (Date.now() - state.timestamp < 3600000) {
      return state;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function showResumeDialog() {
  const savedState = loadWorkoutState();
  if (savedState && savedState.idx < steps.length) {
    const step = steps[savedState.idx];
    $('#resumeDetails').text(step.name + ' — ' + fmt(savedState.remaining) + '/' + fmt(savedState.total));
    $('#resumeOverlay').addClass('show');
    return true;
  }
  return false;
}

// ===== Wake Lock =====
function requestWakeLock() {
  if (!settings.wakeLock) return;
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen')
      .then(sentinel => { wakeLockSentinel = sentinel; })
      .catch(() => {});
  }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
}

// ===== Event Listeners =====
function setupEventListeners() {
  // Control buttons
  $('#startBtn').on('click', toggle);
  $('#prevBtn').on('click', previous);
  $('#nextBtn').on('click', next);

  // Settings
  $('#settingsBtn').on('click', function() {
    $('#settingsOverlay').addClass('open');
  });

  $('#closeSettingsBtn').on('click', function() {
    $('#settingsOverlay').removeClass('open');
  });

  $('#resetBtn').on('click', resetSettings);

  // Settings sliders and toggles
  $('#exerciseSize').on('input', function() {
    settings.exerciseSize = parseInt($(this).val());
    $('#exerciseSizeValue').text(settings.exerciseSize + '%');
    applySettings();
    saveSettings();
  });

  $('#nextSize').on('input', function() {
    settings.nextSize = parseInt($(this).val());
    $('#nextSizeValue').text(settings.nextSize + '%');
    applySettings();
    saveSettings();
  });

  $('#workTime').on('input', function() {
    settings.workTime = parseInt($(this).val());
    $('#workTimeValue').text(settings.workTime + 's');
    clearWorkoutState();
    updatePlan();
    saveSettings();
  });

  $('#restTime').on('input', function() {
    settings.restTime = parseInt($(this).val());
    $('#restTimeValue').text(settings.restTime + 's');
    clearWorkoutState();
    updatePlan();
    saveSettings();
  });

  $('#prepTime').on('input', function() {
    settings.prepTime = parseInt($(this).val());
    $('#prepTimeValue').text(settings.prepTime + 's');
    clearWorkoutState();
    updatePlan();
    saveSettings();
  });

  $('#wakeLockToggle').on('change', function() {
    settings.wakeLock = $(this).prop('checked');
    saveSettings();
  });

  $('#tapNavToggle').on('change', function() {
    settings.tapNavigation = $(this).prop('checked');
    saveSettings();
  });

  // Tap navigation on stage
  $('#stage').on('click', function(e) {
    if (!settings.tapNavigation) return;
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      previous();
    } else if (x > (width * 2) / 3) {
      next();
    } else {
      toggle();
    }
  });

  // Plan selector
  $(document).on('change', '#planSelector input[type="radio"]', function() {
    const plan = $(this).val();
    pause();
    loadPlanFromFile(plan);
    setTimeout(() => {
      if (steps.length > 0) {
        idx = 0;
        remaining = steps[0].t || 0;
        total = steps[0].t || 0;
        render();
      }
    }, 500);
  });

  // Resume dialog
  $('#resumeBtn').on('click', function() {
    const savedState = loadWorkoutState();
    if (savedState) {
      goto(savedState.idx);
      if (savedState.running) start();
    }
    $('#resumeOverlay').removeClass('show');
  });

  $('#newBtn').on('click', function() {
    clearWorkoutState();
    if (steps.length > 0) {
      idx = 0;
      remaining = steps[0].t || 0;
      total = steps[0].t || 0;
      render();
    }
    $('#resumeOverlay').removeClass('show');
  });

  // Auto-save during workout
  $(window).on('beforeunload', function() {
    saveWorkoutState();
  });
}

function buildPlanSelector() {
  const selector = $('#planSelector');
  selector.empty();

  availablePlans.forEach(plan => {
    const label = jQuery('<label>').addClass('plan-label');
    const input = jQuery('<input>')
      .attr('type', 'radio')
      .attr('name', 'plan')
      .attr('value', plan)
      .prop('checked', plan === selectedPlan);

    const span = jQuery('<span>').text(plan);

    label.append(input).append(span);
    selector.append(label);
  });
}

// ===== Initialization =====
function initApp() {
  detectAvailablePlans();

  // Load selected plan or default
  let planToLoad = 'plan-0';
  try {
    const saved = localStorage.getItem('selectedPlan');
    if (saved && availablePlans.includes(saved)) {
      planToLoad = saved;
    }
  } catch (e) {}

  loadSettings();
  buildPlanSelector();
  loadPlanFromFile(planToLoad);

  // Setup event listeners
  setupEventListeners();

  // Check for resume state after delay
  setTimeout(() => {
    if (!showResumeDialog()) {
      // No resume needed, just render
      render();
    }
  }, 1000);
}

// ===== jQuery Ready =====
jQuery(function() {
  initApp();
});
