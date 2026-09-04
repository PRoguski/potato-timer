import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Step } from './timer.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private basePlan: Step[] = [];
  private fullPlan = new BehaviorSubject<Step[]>([]);
  public fullPlan$ = this.fullPlan.asObservable();

  private availablePlans = new BehaviorSubject<string[]>([]);
  public availablePlans$ = this.availablePlans.asObservable();

  private selectedPlan = new BehaviorSubject<string>('plan-0');
  public selectedPlan$ = this.selectedPlan.asObservable();

  constructor(private settingsService: SettingsService) {
    this.detectAvailablePlans();
    this.loadPlanFromFile('plan-0');
  }

  private detectAvailablePlans(): void {
    const plans = ['plan-0', 'plan-1', 'plan-2'];
    this.availablePlans.next(plans);
  }

  loadPlanFromFile(planName: string): void {
    fetch(`plans/${planName}.json`)
      .then(r => r.json())
      .then(data => {
        this.basePlan = data;
        this.buildPlan();
        this.selectedPlan.next(planName);
        try {
          localStorage.setItem('selectedPlan', planName);
        } catch (e) {}
      })
      .catch(err => console.error('Failed to load plan:', err));
  }

  private buildPlan(): void {
    const settings = this.settingsService.getSettings();
    const newPlan: Step[] = [];

    for (let i = 0; i < this.basePlan.length; i++) {
      const step = { ...this.basePlan[i] };

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
        while (nextSectionIdx < this.basePlan.length && this.basePlan[nextSectionIdx].type !== 'head') {
          nextSectionIdx++;
        }

        if (nextSectionIdx < this.basePlan.length && !this.basePlan[nextSectionIdx].name?.includes('SCHŁODZENIE')) {
          newPlan.push({
            type: 'prep',
            name: 'Czas na przygotowanie sprzętu/pozycji',
            t: settings.prepTime
          });
        }
      }
    }

    this.fullPlan.next(newPlan);
  }

  updatePlan(): void {
    this.buildPlan();
  }

  getFullPlan(): Step[] {
    return this.fullPlan.value;
  }

  getTotalTime(): number {
    return this.fullPlan.value
      .filter(s => s.type !== 'head')
      .reduce((sum, s) => sum + (s.t || 0), 0);
  }
}
