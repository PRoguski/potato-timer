import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  exerciseSize: number;
  nextSize: number;
  workTime: number;
  restTime: number;
  prepTime: number;
  wakeLock: boolean;
  tapNavigation: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private defaultSettings: AppSettings = {
    exerciseSize: 100,
    nextSize: 100,
    workTime: 60,
    restTime: 30,
    prepTime: 15,
    wakeLock: false,
    tapNavigation: false
  };

  private settings = new BehaviorSubject<AppSettings>(this.defaultSettings);
  public settings$ = this.settings.asObservable();

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    try {
      const saved = localStorage.getItem('settings');
      if (saved) {
        const loaded = JSON.parse(saved);
        this.settings.next({ ...this.defaultSettings, ...loaded });
      }
    } catch (e) {}
  }

  saveSettings(): void {
    try {
      localStorage.setItem('settings', JSON.stringify(this.settings.value));
    } catch (e) {}
  }

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const current = this.settings.value;
    this.settings.next({ ...current, [key]: value });
    this.saveSettings();
  }

  getSettings(): AppSettings {
    return this.settings.value;
  }

  resetSettings(): void {
    this.settings.next({ ...this.defaultSettings });
    this.saveSettings();
  }
}
