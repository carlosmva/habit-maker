import { Component, input, output } from '@angular/core';
import { MONTH_NAMES } from '../core/month.util';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  template: `
    <div class="month-selector">
      <button class="nav-btn" (click)="prev.emit()">‹</button>
      <span class="current">{{ MONTH_NAMES[month() - 1] }} {{ year() }}</span>
      <button class="nav-btn" (click)="next.emit()">›</button>
    </div>
    <div class="month-tabs">
      @for (name of MONTH_NAMES; track name; let i = $index) {
        <button
          class="month-tab"
          [class.active]="month() === i + 1"
          (click)="selectMonth.emit(i + 1)"
        >
          {{ name.slice(0, 3) }}
        </button>
      }
    </div>
  `,
  styles: `
    .month-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .current {
      font-size: 1.125rem;
      font-weight: 600;
      min-width: 160px;
      text-align: center;
    }
    .nav-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      width: 32px;
      height: 32px;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-btn:hover { background: var(--hover-bg); }
  `,
})
export class MonthSelectorComponent {
  year = input.required<number>();
  month = input.required<number>();
  prev = output<void>();
  next = output<void>();
  selectMonth = output<number>();
  protected readonly MONTH_NAMES = MONTH_NAMES;
}
