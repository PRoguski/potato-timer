import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';

export interface Step {
  type: 'head' | 'work' | 'rest' | 'prep';
  name: string;
  t?: number;
  image?: string;
}

export interface TimerState {
  idx: number;
  remaining: number;
  total: number;
  running: boolean;
  steps: Step[];
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerState = new BehaviorSubject<TimerState>({
    idx: 0,
    remaining: 0,
    total: 0,
    running: false,
    steps: []
  });

  public timerState$ = this.timerState.asObservable();
  private tickSubscription: any;
  private audioContext: AudioContext | null = null;

  constructor() {}

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  initTimer(steps: Step[]): void {
    const state = this.timerState.value;
    const updatedSteps = steps.filter((s: Step) => s.type !== 'head');

    if (updatedSteps.length > 0) {
      this.timerState.next({
        ...state,
        steps: updatedSteps,
        idx: 0,
        remaining: updatedSteps[0].t || 0,
        total: updatedSteps[0].t || 0,
        running: false
      });
    }
  }

  start(): void {
    const state = this.timerState.value;
    if (state.running) return;

    this.beep(988, 0.12);
    this.timerState.next({ ...state, running: true });

    this.tickSubscription = interval(1000).subscribe(() => {
      this.tickDown();
    });
  }

  pause(): void {
    const state = this.timerState.value;
    this.timerState.next({ ...state, running: false });
    if (this.tickSubscription) {
      this.tickSubscription.unsubscribe();
    }
  }

  togglePlayPause(): void {
    const state = this.timerState.value;
    if (state.running) {
      this.pause();
    } else {
      this.start();
    }
  }

  private tickDown(): void {
    const state = this.timerState.value;
    let remaining = state.remaining - 1;

    // Warning beep 15s before end of rest
    if (state.steps[state.idx].type === 'rest' && remaining === 15) {
      this.beep(440, 0.18);
      setTimeout(() => this.beep(440, 0.18), 200);
    }

    // Beeps in last 3 seconds
    if (remaining <= 3 && remaining > 0) {
      this.beep(660, 0.1);
    }

    if (remaining <= 0) {
      this.beep(1046, 0.25);
      this.nextStep();
    } else {
      this.timerState.next({ ...state, remaining });
    }
  }

  private nextStep(): void {
    const state = this.timerState.value;
    let nextIdx = state.idx + 1;

    if (nextIdx >= state.steps.length) {
      this.finish();
      return;
    }

    const nextStep = state.steps[nextIdx];
    const transitionFreq = nextStep.type === 'rest' ? 520 : 988;
    this.beep(transitionFreq, 0.18);

    this.timerState.next({
      ...state,
      idx: nextIdx,
      remaining: nextStep.t || 0,
      total: nextStep.t || 0
    });
  }

  finish(): void {
    const state = this.timerState.value;
    this.pause();
    this.beep(1319, 0.3);
    this.timerState.next({
      ...state,
      idx: state.steps.length - 1,
      remaining: 0
    });
    this.clearWorkoutState();
  }

  goto(idx: number): void {
    const state = this.timerState.value;
    if (idx < 0 || idx >= state.steps.length) return;

    const wasRunning = state.running;
    if (wasRunning) this.pause();

    const step = state.steps[idx];
    this.timerState.next({
      ...state,
      idx,
      remaining: step.t || 0,
      total: step.t || 0
    });

    if (wasRunning) this.start();
  }

  previous(): void {
    const state = this.timerState.value;
    const step = state.steps[state.idx];

    // If we're in the middle of a step, restart it
    if (state.remaining < (step.t || 0) - 1) {
      this.goto(state.idx);
    } else {
      this.goto(state.idx - 1);
    }
  }

  next(): void {
    const state = this.timerState.value;
    this.goto(state.idx + 1);
  }

  private beep(freq: number = 880, duration: number = 0.15): void {
    try {
      const ctx = this.audioContext || (this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)());

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context not available
    }
  }

  private clearWorkoutState(): void {
    try {
      localStorage.removeItem('workoutState');
    } catch (e) {}
  }

  saveWorkoutState(): void {
    try {
      const state = this.timerState.value;
      const workoutState = {
        selectedPlan: localStorage.getItem('selectedPlan'),
        idx: state.idx,
        remaining: state.remaining,
        total: state.total,
        running: state.running,
        timestamp: Date.now()
      };
      localStorage.setItem('workoutState', JSON.stringify(workoutState));
    } catch (e) {}
  }

  loadWorkoutState(): any {
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
}
