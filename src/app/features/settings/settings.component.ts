import { Component, inject, signal } from '@angular/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { TauriService } from '../../core/tauri.service';
import { currentMonthRef } from '../../core/month.util';
import { MonthSelectorComponent } from '../../shared/month-selector.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MonthSelectorComponent],
  template: `
    <div class="settings">
      <h2>Settings</h2>

      <div class="card section">
        <h3>Data Management</h3>
        <p class="desc">Export or import your SQLite database for backup.</p>
        <div class="actions">
          <button class="btn btn-primary" (click)="exportDb()">Export Database</button>
          <button class="btn" (click)="importDb()">Import Database</button>
        </div>
      </div>

      <div class="card section">
        <h3>CSV Export</h3>
        <app-month-selector
          [year]="year()"
          [month]="month()"
          (prev)="changeMonth(-1)"
          (next)="changeMonth(1)"
          (selectMonth)="setMonth($event)"
        />
        <button class="btn btn-primary" (click)="exportCsv()">Export Month as CSV</button>
      </div>

      @if (message()) {
        <p class="message" [class.error]="isError()">{{ message() }}</p>
      }
    </div>
  `,
  styles: `
    .settings { display: flex; flex-direction: column; gap: 1rem; max-width: 600px; }
    h2 { margin: 0; }
    .section h3 { margin: 0 0 0.5rem; font-size: 1rem; }
    .desc { color: var(--text-muted); font-size: 0.875rem; margin: 0 0 1rem; }
    .actions { display: flex; gap: 0.5rem; }
    .message {
      padding: 0.75rem;
      border-radius: 6px;
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
    }
    .message.error {
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
    }
  `,
})
export class SettingsComponent {
  private readonly tauri = inject(TauriService);

  readonly year = signal(currentMonthRef().year);
  readonly month = signal(currentMonthRef().month);
  readonly message = signal('');
  readonly isError = signal(false);

  changeMonth(delta: number): void {
    let m = this.month() + delta;
    let y = this.year();
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.year.set(y);
    this.month.set(m);
  }

  setMonth(m: number): void {
    this.month.set(m);
  }

  async exportDb(): Promise<void> {
    try {
      const path = await save({
        filters: [{ name: 'SQLite', extensions: ['db', 'sqlite'] }],
        defaultPath: 'habit-maker-backup.db',
      });
      if (!path) return;
      await this.tauri.exportDatabase(path);
      this.showMsg('Database exported successfully.');
    } catch (e) {
      this.showMsg(String(e), true);
    }
  }

  async importDb(): Promise<void> {
    try {
      const path = await open({
        filters: [{ name: 'SQLite', extensions: ['db', 'sqlite'] }],
        multiple: false,
      });
      if (!path) return;
      await this.tauri.importDatabase(path as string);
      this.showMsg('Database imported successfully. Restart may be needed.');
    } catch (e) {
      this.showMsg(String(e), true);
    }
  }

  async exportCsv(): Promise<void> {
    try {
      const path = await save({
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        defaultPath: `habits-${this.year()}-${String(this.month()).padStart(2, '0')}.csv`,
      });
      if (!path) return;
      await this.tauri.exportMonthCsv(this.year(), this.month(), path);
      this.showMsg('CSV exported successfully.');
    } catch (e) {
      this.showMsg(String(e), true);
    }
  }

  private showMsg(msg: string, error = false): void {
    this.message.set(msg);
    this.isError.set(error);
  }
}
