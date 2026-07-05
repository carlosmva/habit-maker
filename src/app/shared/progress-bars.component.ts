import { Component, input } from '@angular/core';

export interface BarItem {
  day: number;
  pct: number;
}

@Component({
  selector: 'app-progress-bars',
  standalone: true,
  template: `
    <div class="chart">
      <div class="y-axis">
        @for (t of ticks; track t) {
          <span class="y-label">{{ t }}%</span>
        }
      </div>
      <div class="plot-wrap">
        <div class="plot">
          @for (t of ticks; track t) {
            <div class="gridline" [style.bottom.%]="t"></div>
          }
          <div class="bars">
            @for (item of data(); track item.day) {
              <div class="bar-col">
                <div
                  class="bar"
                  [style.height.%]="item.pct * 100"
                  [style.background]="color()"
                ></div>
              </div>
            }
          </div>
        </div>
        <div class="labels">
          @for (item of data(); track item.day) {
            <span class="day-label">{{ item.day }}</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .chart { display: flex; gap: 0.5rem; }
    .y-axis {
      display: flex;
      flex-direction: column-reverse;
      justify-content: space-between;
      height: 120px;
      padding-bottom: 14px;
      font-size: 0.625rem;
      color: var(--text-muted);
      text-align: right;
      min-width: 26px;
    }
    .plot-wrap { flex: 1; overflow-x: auto; }
    .plot {
      position: relative;
      height: 120px;
      border-bottom: 1px solid var(--border-strong);
    }
    .gridline {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border);
    }
    .bars {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      gap: 2px;
    }
    .bar-col {
      flex: 1;
      min-width: 8px;
      height: 100%;
      display: flex;
      align-items: flex-end;
    }
    .bar {
      width: 100%;
      min-height: 1px;
      background: var(--band);
    }
    .labels {
      display: flex;
      gap: 2px;
      margin-top: 2px;
    }
    .day-label {
      flex: 1;
      min-width: 8px;
      text-align: center;
      font-size: 0.5625rem;
      color: var(--text-muted);
    }
  `,
})
export class ProgressBarsComponent {
  data = input<BarItem[]>([]);
  color = input('#131316');

  readonly ticks = [0, 25, 50, 75, 100];
}
