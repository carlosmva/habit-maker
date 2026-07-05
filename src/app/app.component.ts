import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <nav class="sidebar">
        <div class="logo-wrap">
          <img src="/logo-banner-transparent.png" alt="Habit Maker" class="logo" />
        </div>
        <a routerLink="/tracker" routerLinkActive="active">Tracker</a>
        <a routerLink="/analytics" routerLinkActive="active">Analytics</a>
        <a routerLink="/habits" routerLinkActive="active">Habits</a>
        <a routerLink="/settings" routerLinkActive="active">Settings</a>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .sidebar {
      width: 180px;
      background: var(--band);
      color: var(--band-text);
      border-right: 1px solid #000;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-shrink: 0;
    }
    .logo-wrap {
      display: block;
      margin: 0 0 1rem;
      padding: 0.5rem;
      background: #fff;
      border-radius: 6px;
    }
    .logo {
      display: block;
      width: 100%;
      height: auto;
    }
    .sidebar a {
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.875rem;
      transition: background 0.15s, color 0.15s;
    }
    .sidebar a:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--band-text);
    }
    .sidebar a.active {
      background: var(--band-text);
      color: var(--band);
      font-weight: 600;
    }
    .content {
      flex: 1;
      overflow: auto;
      padding: 1rem;
    }
  `,
})
export class AppComponent {}
