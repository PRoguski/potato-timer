import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimerService, TimerState, Step } from './services/timer.service';
import { SettingsService, AppSettings } from './services/settings.service';
import { PlansService } from './services/plans.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  timerState: TimerState = {
    idx: 0,
    remaining: 0,
    total: 0,
    running: false,
    steps: []
  };

  settings: AppSettings = {
    exerciseSize: 100,
    nextSize: 100,
    workTime: 60,
    restTime: 30,
    prepTime: 15,
    wakeLock: false,
    tapNavigation: false
  };

  availablePlans: string[] = [];
  selectedPlan = 'plan-0';
  fullPlan: Step[] = [];
  showResumeDialog = false;
  resumeDetails = '';
  settingsOpen = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private timerService: TimerService,
    private settingsService: SettingsService,
    private plansService: PlansService
  ) {}

  ngOnInit(): void {
    // Subscribe to timer state
    const timerSub = this.timerService.timerState$.subscribe(state => {
      this.timerState = state;
      this.timerService.saveWorkoutState();
    });
    this.subscriptions.push(timerSub);

    // Subscribe to settings
    const settingsSub = this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
      this.applySettings();
      this.plansService.updatePlan();
    });
    this.subscriptions.push(settingsSub);

    // Subscribe to plans
    const plansSub = this.plansService.fullPlan$.subscribe(plan => {
      this.fullPlan = plan;
    });
    this.subscriptions.push(plansSub);

    // Subscribe to available plans
    const availableSub = this.plansService.availablePlans$.subscribe(plans => {
      this.availablePlans = plans;
    });
    this.subscriptions.push(availableSub);

    // Subscribe to selected plan
    const selectedSub = this.plansService.selectedPlan$.subscribe(plan => {
      this.selectedPlan = plan;
    });
    this.subscriptions.push(selectedSub);

    // Initialize
    this.initializeApp();
  }

  private initializeApp(): void {
    const savedPlan = this.tryLoadPlan();
    this.plansService.loadPlanFromFile(savedPlan);

    setTimeout(() => {
      const stepsWithoutHead = this.fullPlan.filter(s => s.type !== 'head');
      this.timerService.initTimer(stepsWithoutHead);

      // Check for resume state
      const savedState = this.timerService.loadWorkoutState();
      if (savedState) {
        this.showResumeDialog = true;
        const step = stepsWithoutHead[savedState.idx];
        this.resumeDetails = `${step.name} — ${this.formatTime(savedState.remaining)}/${this.formatTime(savedState.total)}`;
      }
    }, 500);
  }

  private tryLoadPlan(): string {
    try {
      const saved = localStorage.getItem('selectedPlan');
      return saved || 'plan-0';
    } catch {
      return 'plan-0';
    }
  }

  applySettings(): void {
    const doc = document.documentElement;
    const exerciseMultiplier = this.settings.exerciseSize / 100;
    const nextMultiplier = this.settings.nextSize / 100;

    doc.style.setProperty('--exercise-size', `${exerciseMultiplier}`);
    doc.style.setProperty('--next-size', `${nextMultiplier}`);
  }

  getCurrentStep(): Step | null {
    return this.timerState.steps[this.timerState.idx] || null;
  }

  getNextStep(): Step | null {
    return this.timerState.steps[this.timerState.idx + 1] || null;
  }

  getPhaseLabel(): string {
    const step = this.getCurrentStep();
    if (!step) return 'Gotowy?';

    const labels: { [key: string]: string } = {
      work: 'Ćwiczenie',
      rest: 'Przerwa',
      prep: 'Przygotowanie'
    };
    return labels[step.type] || 'Gotowy?';
  }

  getStageClass(): string {
    const step = this.getCurrentStep();
    return step ? step.type : 'prep';
  }

  getProgressPercent(): number {
    if (this.timerState.total === 0) return 0;
    return ((this.timerState.total - this.timerState.remaining) / this.timerState.total) * 100;
  }

  getCounterText(): string {
    return `${this.timerState.idx + 1} / ${this.timerState.steps.length}`;
  }

  getRemainingTimeTotal(): number {
    return this.timerState.steps
      .slice(this.timerState.idx)
      .reduce((sum, step) => sum + (step.t || 0), 0);
  }

  formatTime(seconds: number): string {
    return this.timerService.formatTime(seconds);
  }

  togglePlayPause(): void {
    this.timerService.togglePlayPause();
  }

  previous(): void {
    this.timerService.previous();
  }

  next(): void {
    this.timerService.next();
  }

  onStageClick(event: MouseEvent): void {
    if (!this.settings.tapNavigation) return;

    const stage = event.currentTarget as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      this.previous();
    } else if (x > (width * 2) / 3) {
      this.next();
    } else {
      this.togglePlayPause();
    }
  }

  changePlan(plan: string): void {
    this.plansService.loadPlanFromFile(plan);

    setTimeout(() => {
      const stepsWithoutHead = this.fullPlan.filter(s => s.type !== 'head');
      this.timerService.initTimer(stepsWithoutHead);
    }, 500);
  }

  openSettings(): void {
    this.settingsOpen = true;
  }

  closeSettings(): void {
    this.settingsOpen = false;
  }

  resetSettings(): void {
    this.settingsService.resetSettings();
  }

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settingsService.updateSetting(key, value);
  }

  resumeWorkout(): void {
    const savedState = this.timerService.loadWorkoutState();
    if (savedState) {
      this.timerService.goto(savedState.idx);
      if (savedState.running) {
        this.timerService.start();
      }
    }
    this.showResumeDialog = false;
  }

  startNewWorkout(): void {
    this.timerService.initTimer(this.fullPlan.filter(s => s.type !== 'head'));
    this.showResumeDialog = false;
  }

  getPlanList(): Step[] {
    return this.fullPlan;
  }

  toggleDetails(): void {
    const details = document.querySelector('details');
    if (details) {
      details.toggleAttribute('open');
    }
  }

  jumpTo(idx: number): void {
    const step = this.fullPlan[idx];
    if (step && step.type !== 'head') {
      // Count actual step index (excluding heads)
      let stepIdx = 0;
      for (let i = 0; i <= idx; i++) {
        if (this.fullPlan[i].type !== 'head') {
          if (i === idx) {
            this.timerService.goto(stepIdx);
            break;
          }
          stepIdx++;
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.timerService.pause();
  }
}
