import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TauriService } from '../../core/tauri.service';
import { MonthGrid, WellnessDay } from '../../core/models';
import {
  currentMonthRef,
  dateString,
  MONTH_NAMES,
  todayDay,
} from '../../core/month.util';
import { MonthSelectorComponent } from '../../shared/month-selector.component';
import { ProgressBarsComponent } from '../../shared/progress-bars.component';
import { WellnessLineComponent } from '../../shared/wellness-line.component';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [MonthSelectorComponent, ProgressBarsComponent, WellnessLineComponent],
  template: `
    <div class="tracker">
      <app-month-selector
        [year]="year()"
        [month]="month()"
        (prev)="changeMonth(-1)"
        (next)="changeMonth(1)"
        (selectMonth)="setMonth($event)"
      />

      @if (loading()) {
        <p class="loading">Loading grid…</p>
      } @else if (grid()) {
        <div class="grid-scroll">
          <table class="habit-grid">
            <thead>
              <tr class="week-row">
                <th class="sticky-col"></th>
                @for (week of grid()!.weeks; track week.index) {
                  <th [attr.colspan]="week.day_end - week.day_start + 1" class="week-header">
                    {{ week.label }}
                  </th>
                }
              </tr>
              <tr class="day-row">
                <th class="sticky-col habits-header">My Habits</th>
                @for (day of grid()!.days; track day.day) {
                  <th
                    class="day-header"
                    [class.today]="day.day === todayCol()"
                  >
                    <span class="weekday">{{ day.weekday }}</span>
                    <span class="day-num">{{ day.day }}</span>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (habit of grid()!.habits; track habit.id) {
                <tr>
                  <td class="sticky-col habit-cell">
                    <span class="habit-icon" [style.color]="habit.color">{{ habit.icon }}</span>
                    {{ habit.name }}
                  </td>
                  @for (day of grid()!.days; track day.day) {
                    <td
                      class="check-cell"
                      [class.today]="day.day === todayCol()"
                      [class.checked]="isChecked(habit.id, day.day)"
                      [tabindex]="0"
                      (click)="onToggle(habit.id, day.day, $event)"
                      (keydown)="onKeydown($event, habit.id, day.day)"
                    >
                      <span class="check-box" [class.checked]="isChecked(habit.id, day.day)">
                        @if (isChecked(habit.id, day.day)) {
                          <span class="check-mark">✓</span>
                        }
                      </span>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <section class="chart-section card">
          <h3 class="band-title">Daily Progress</h3>
          <app-progress-bars [data]="progressBars()" />
        </section>

        <section class="chart-section card">
          <h3 class="band-title">Overall Wellness</h3>
          <app-wellness-line [data]="wellness()" />
          <div class="wellness-log">
            <div class="log-head">
              <label class="day-select">
                Log for
                <select [value]="selectedDay()" (change)="onSelectDay($event)">
                  @for (day of grid()!.days; track day.day) {
                    <option [value]="day.day">
                      {{ day.weekday }}, {{ monthShort() }} {{ day.day }}{{ day.day === todayCol() ? ' · Today' : '' }}
                    </option>
                  }
                </select>
              </label>
              @if (selectedMood() !== null || selectedSleep() !== null) {
                <button type="button" class="clear-btn" (click)="clearWellness()">Clear</button>
              }
              @if (savedMsg()) {
                <span class="saved-badge">✓ {{ savedMsg() }}</span>
              }
            </div>
            <div class="wellness-inputs">
              <label>
                Mood (1–5)
                <input
                  type="number"
                  min="1"
                  max="5"
                  [value]="selectedMood() ?? ''"
                  (change)="onMoodChange($event)"
                />
              </label>
              <label>
                Sleep (hrs)
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  [value]="selectedSleep() ?? ''"
                  (change)="onSleepChange($event)"
                />
              </label>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .tracker { display: flex; flex-direction: column; gap: 1rem; }
    .loading { color: var(--text-muted); }
    .grid-scroll {
      overflow: auto;
      max-height: calc(100vh - 320px);
      border: 1px solid var(--border-strong);
      border-radius: 4px;
      background: var(--panel-bg);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }
    .habit-grid {
      border-collapse: collapse;
      font-size: 0.8125rem;
      white-space: nowrap;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0;
      text-align: center;
    }
    /* White data cells (the "sheet"). */
    .check-cell { background: var(--panel-bg); }
    /* Dark habit-name column. */
    .sticky-col {
      position: sticky;
      left: 0;
      z-index: 2;
      background: var(--band);
      color: var(--band-text);
      border-color: rgba(255, 255, 255, 0.12);
      min-width: 180px;
      text-align: left;
      padding: 0.375rem 0.75rem;
    }
    /* Dark header rows. */
    thead th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--band);
      color: var(--band-text);
      border-color: rgba(255, 255, 255, 0.12);
    }
    thead .sticky-col { z-index: 3; }
    .week-header {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.3rem;
    }
    .habits-header { font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; }
    .day-header { min-width: 32px; padding: 0.25rem; }
    .day-header.today { background: #2563eb; }
    .weekday { display: block; font-size: 0.625rem; color: rgba(255, 255, 255, 0.55); }
    .day-num { display: block; font-size: 0.75rem; font-weight: 600; }
    .habit-cell { display: flex; align-items: center; gap: 0.375rem; font-weight: 500; }
    .habit-icon { font-size: 1rem; }
    .check-cell {
      width: 32px;
      height: 30px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .check-cell:hover { background: var(--hover-bg); }
    .check-cell.today { background: var(--today-col); }
    /* Square checkbox in every cell; filled black when checked. */
    .check-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--border-strong);
      border-radius: 3px;
      background: #fff;
    }
    .check-box.checked {
      background: var(--checkbox-checked);
      border-color: var(--checkbox-checked);
    }
    .check-mark { color: #fff; font-size: 0.75rem; font-weight: 700; line-height: 1; }
    .chart-section h3 { margin: -1rem -1rem 1rem; }
    .wellness-log {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
    .log-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .day-select {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .day-select select {
      padding: 0.375rem 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 4px;
      color: var(--text);
      font-size: 0.8125rem;
      text-transform: none;
      letter-spacing: normal;
    }
    .clear-btn {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      border: 1px solid var(--border-strong);
      border-radius: 4px;
      background: var(--surface);
      color: var(--text-muted);
    }
    .clear-btn:hover { color: var(--danger); border-color: var(--danger); }
    .saved-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--success);
      background: rgba(22, 163, 74, 0.12);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .wellness-inputs {
      display: flex;
      gap: 1rem;
      margin-top: 0.75rem;
    }
    .wellness-inputs label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .wellness-inputs input {
      width: 80px;
      padding: 0.375rem 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
    }
  `,
})
export class TrackerComponent implements OnInit {
  private readonly tauri = inject(TauriService);

  readonly year = signal(currentMonthRef().year);
  readonly month = signal(currentMonthRef().month);
  readonly grid = signal<MonthGrid | null>(null);
  readonly wellness = signal<WellnessDay[]>([]);
  readonly loading = signal(true);
  readonly todayCol = signal<number | null>(todayDay(this.year(), this.month()));

  readonly progressBars = computed(() =>
    (this.grid()?.daily_progress ?? []).map((d) => ({ day: d.day, pct: d.pct })),
  );

  readonly selectedDay = signal<number>(todayDay(this.year(), this.month()) ?? 1);
  readonly savedMsg = signal<string>('');

  readonly monthShort = computed(() => MONTH_NAMES[this.month() - 1].slice(0, 3));

  readonly selectedMood = computed(
    () => this.wellness().find((w) => w.day === this.selectedDay())?.mood ?? null,
  );

  readonly selectedSleep = computed(
    () => this.wellness().find((w) => w.day === this.selectedDay())?.sleep_hours ?? null,
  );

  private lastClick: { habitId: number; day: number } | null = null;

  ngOnInit(): void {
    this.loadGrid();
  }

  changeMonth(delta: number): void {
    let m = this.month() + delta;
    let y = this.year();
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.year.set(y);
    this.month.set(m);
    this.todayCol.set(todayDay(y, m));
    this.selectedDay.set(todayDay(y, m) ?? 1);
    this.loadGrid();
  }

  setMonth(m: number): void {
    this.month.set(m);
    this.todayCol.set(todayDay(this.year(), m));
    this.selectedDay.set(todayDay(this.year(), m) ?? 1);
    this.loadGrid();
  }

  onSelectDay(event: Event): void {
    this.selectedDay.set(Number((event.target as HTMLSelectElement).value));
  }

  isChecked(habitId: number, day: number): boolean {
    return (this.grid()?.entries ?? []).some(
      (e) => e.habit_id === habitId && e.day === day && e.completed,
    );
  }

  async onToggle(habitId: number, day: number, event: MouseEvent): Promise<void> {
    const date = dateString(this.year(), this.month(), day);

    if (event.shiftKey && this.lastClick) {
      await this.fillRange(this.lastClick.habitId, this.lastClick.day, habitId, day);
      this.lastClick = { habitId, day };
      return;
    }

    this.lastClick = { habitId, day };
    const wasChecked = this.isChecked(habitId, day);
    this.optimisticToggle(habitId, day, !wasChecked);

    try {
      const state = await this.tauri.toggleEntry(habitId, date);
      this.optimisticToggle(habitId, day, state.completed);
    } catch {
      this.optimisticToggle(habitId, day, wasChecked);
    }
  }

  onKeydown(event: KeyboardEvent, habitId: number, day: number): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onToggle(habitId, day, event as unknown as MouseEvent);
    }
  }

  private optimisticToggle(habitId: number, day: number, completed: boolean): void {
    const g = this.grid();
    if (!g) return;

    let entries = g.entries.filter((e) => !(e.habit_id === habitId && e.day === day));
    if (completed) entries = [...entries, { habit_id: habitId, day, completed: true }];

    const habitCount = g.habits.length;
    const dailyProgress = g.days.map((d) => {
      const completedCount = entries.filter((e) => e.day === d.day && e.completed).length;
      return {
        day: d.day,
        completed: completedCount,
        total: habitCount,
        pct: habitCount > 0 ? completedCount / habitCount : 0,
      };
    });

    this.grid.set({ ...g, entries, daily_progress: dailyProgress });
  }

  private async fillRange(
    h1: number, d1: number, h2: number, d2: number,
  ): Promise<void> {
    if (h1 !== h2) return;
    const start = Math.min(d1, d2);
    const end = Math.max(d1, d2);
    for (let d = start; d <= end; d++) {
      const date = dateString(this.year(), this.month(), d);
      await this.tauri.setEntry(h1, date, true);
    }
    await this.loadGrid(false);
  }

  private async loadGrid(showLoading = true): Promise<void> {
    if (showLoading) this.loading.set(true);
    try {
      const [grid, wellness] = await Promise.all([
        this.tauri.getMonthGrid(this.year(), this.month()),
        this.tauri.getWellnessMonth(this.year(), this.month()),
      ]);
      this.grid.set(grid);
      this.wellness.set(wellness);
    } finally {
      this.loading.set(false);
    }
  }

  async onMoodChange(event: Event): Promise<void> {
    const val = (event.target as HTMLInputElement).value;
    const mood = val ? Number(val) : null;
    await this.saveWellness(mood, this.selectedSleep());
  }

  async onSleepChange(event: Event): Promise<void> {
    const val = (event.target as HTMLInputElement).value;
    const sleep = val ? Number(val) : null;
    await this.saveWellness(this.selectedMood(), sleep);
  }

  async clearWellness(): Promise<void> {
    await this.saveWellness(null, null, 'Cleared');
  }

  private async saveWellness(
    mood: number | null,
    sleep: number | null,
    label = 'Saved',
  ): Promise<void> {
    const day = this.selectedDay();
    const date = dateString(this.year(), this.month(), day);

    // Update locally instead of reloading the grid — wellness doesn't affect
    // the habit grid or daily-progress bars, and a full reload resets scroll.
    this.wellness.update((list) =>
      list.map((w) =>
        w.day === day ? { ...w, mood, sleep_hours: sleep } : w,
      ),
    );

    try {
      await this.tauri.setWellness(date, mood, sleep);
      this.flashSaved(label);
    } catch {
      const fresh = await this.tauri.getWellnessMonth(this.year(), this.month());
      this.wellness.set(fresh);
    }
  }

  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  private flashSaved(msg: string): void {
    this.savedMsg.set(msg);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.savedMsg.set(''), 2000);
  }
}
