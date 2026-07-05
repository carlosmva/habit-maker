import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TauriService } from '../../core/tauri.service';
import { MonthAnalytics } from '../../core/models';
import { currentMonthRef, pctLabel } from '../../core/month.util';
import { MonthSelectorComponent } from '../../shared/month-selector.component';
import { DonutComponent } from '../../shared/donut.component';
import { ProgressBarsComponent } from '../../shared/progress-bars.component';
import { AnalysisTableComponent } from '../../shared/analysis-table.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    MonthSelectorComponent,
    DonutComponent,
    ProgressBarsComponent,
    AnalysisTableComponent,
  ],
  template: `
    <div class="analytics">
      <app-month-selector
        [year]="year()"
        [month]="month()"
        (prev)="changeMonth(-1)"
        (next)="changeMonth(1)"
        (selectMonth)="setMonth($event)"
      />

      @if (loading()) {
        <p class="loading">Loading analytics…</p>
      } @else if (data()) {
        <div class="stats-row">
          <div class="stat-tile">
            <div class="label">Goal</div>
            <div class="value">{{ data()!.totals.goal }}</div>
          </div>
          <div class="stat-tile">
            <div class="label">Completed</div>
            <div class="value">{{ data()!.totals.completed }}</div>
          </div>
          <div class="stat-tile">
            <div class="label">Left</div>
            <div class="value">{{ data()!.totals.left }}</div>
          </div>
        </div>

        <div class="charts-row">
          <div class="card donut-card">
            <h3 class="band-title">Overall Stats</h3>
            <app-donut [pct]="data()!.totals.pct" />
          </div>
          <div class="card bars-card">
            <h3 class="band-title">Daily Progress</h3>
            <app-progress-bars [data]="dailyBars()" />
          </div>
        </div>

        <div class="card">
          <h3 class="band-title">Analysis</h3>
          <app-analysis-table [data]="data()!.per_habit" />
        </div>

        <div class="card top-habits">
          <h3 class="band-title">Top 10 Habits</h3>
          <ol>
            @for (h of data()!.top_habits; track h.habit_id) {
              <li>
                <span class="rank">{{ h.rank }}.</span>
                {{ h.name }}
                <span class="pct">{{ pctLabel(h.pct) }}</span>
              </li>
            } @empty {
              <li class="empty">No habits tracked yet.</li>
            }
          </ol>
        </div>
      }
    </div>
  `,
  styles: `
    .analytics { display: flex; flex-direction: column; gap: 1rem; }
    .loading { color: var(--text-muted); }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 1rem;
    }
    .top-habits ol {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .top-habits li {
      padding: 0.5rem 0.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .top-habits li:nth-child(even) { background: var(--surface); }
    .rank { color: var(--text); font-weight: 700; min-width: 1.5rem; }
    .pct { margin-left: auto; color: var(--text); font-weight: 700; }
    .empty { color: var(--text-muted); }
  `,
})
export class AnalyticsComponent implements OnInit {
  private readonly tauri = inject(TauriService);

  readonly year = signal(currentMonthRef().year);
  readonly month = signal(currentMonthRef().month);
  readonly data = signal<MonthAnalytics | null>(null);
  readonly loading = signal(true);

  readonly dailyBars = computed(() =>
    (this.data()?.daily_progress ?? []).map((d) => ({ day: d.day, pct: d.pct })),
  );

  protected readonly pctLabel = pctLabel;

  ngOnInit(): void {
    this.load();
  }

  changeMonth(delta: number): void {
    let m = this.month() + delta;
    let y = this.year();
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.year.set(y);
    this.month.set(m);
    this.load();
  }

  setMonth(m: number): void {
    this.month.set(m);
    this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const analytics = await this.tauri.getMonthAnalytics(this.year(), this.month());
      this.data.set(analytics);
    } finally {
      this.loading.set(false);
    }
  }
}
