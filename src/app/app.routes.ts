import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tracker', pathMatch: 'full' },
  {
    path: 'tracker',
    loadComponent: () =>
      import('./features/tracker/tracker.component').then((m) => m.TrackerComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
  },
  {
    path: 'habits',
    loadComponent: () =>
      import('./features/habits/habits.component').then((m) => m.HabitsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
];
