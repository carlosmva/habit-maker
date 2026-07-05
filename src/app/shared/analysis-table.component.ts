import { Component, input } from '@angular/core';
import { HabitAnalytics } from '../core/models';
import { pctLabel } from '../core/month.util';

@Component({
  selector: 'app-analysis-table',
  standalone: true,
  template: `
    <table class="analysis-table">
      <thead>
        <tr>
          <th>Habit</th>
          <th>Goal</th>
          <th>Actual</th>
          <th>Left</th>
          <th>Progress</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        @for (row of data(); track row.habit_id) {
          <tr>
            <td class="habit-name">{{ row.icon }} {{ row.name }}</td>
            <td>{{ row.goal }}</td>
            <td>{{ row.actual }}</td>
            <td>{{ row.left }}</td>
            <td>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="row.pct * 100"></div>
              </div>
            </td>
            <td>{{ pctLabel(row.pct) }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .analysis-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.5rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    thead th {
      background: var(--band);
      color: var(--band-text);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tbody tr:nth-child(even) { background: var(--surface); }
    .habit-name { white-space: nowrap; font-weight: 500; }
    .progress-bar {
      width: 140px;
      height: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--band);
      transition: width 0.3s;
    }
  `,
})
export class AnalysisTableComponent {
  data = input<HabitAnalytics[]>([]);
  protected readonly pctLabel = pctLabel;
}
