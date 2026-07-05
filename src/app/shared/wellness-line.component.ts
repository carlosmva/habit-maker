import { Component, computed, input } from '@angular/core';
import { WellnessDay } from '../core/models';

/** Matches progress-bars column min-width and gap for x-axis alignment. */
const COL_MIN = 8;
const COL_GAP = 2;
const GAP_UNIT = COL_GAP / COL_MIN;

@Component({
  selector: 'app-wellness-line',
  standalone: true,
  template: `
    <div class="chart">
      <div class="y-axis">
        @for (t of ticks; track t) {
          <span class="y-label">{{ t }}</span>
        }
      </div>
      <div class="plot-wrap">
        <div class="plot">
          @for (t of gridTicks; track t) {
            <div class="gridline" [style.bottom.%]="t"></div>
          }
          <div class="bars">
            @for (item of data(); track item.day) {
              <div class="bar-col"></div>
            }
            <svg
              class="wellness-svg"
              preserveAspectRatio="none"
              [attr.viewBox]="viewBox()"
            >
              @if (moodPath()) {
                <path [attr.d]="moodPath()" fill="none" stroke="#16a34a" stroke-width="2" vector-effect="non-scaling-stroke" />
              }
              @if (sleepPath()) {
                <path [attr.d]="sleepPath()" fill="none" stroke="#131316" stroke-width="2" vector-effect="non-scaling-stroke" />
              }
            </svg>
          </div>
        </div>
        <div class="labels">
          @for (item of data(); track item.day) {
            <span class="day-label">{{ item.day }}</span>
          }
        </div>
      </div>
    </div>
    <div class="legend">
      <span class="legend-item"><span class="dot mood"></span> Mood (1–5)</span>
      <span class="legend-item"><span class="dot sleep"></span> Sleep (hrs)</span>
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
    }
    .wellness-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
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
    .legend {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .legend-item { display: flex; align-items: center; gap: 0.375rem; }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot.mood { background: #16a34a; }
    .dot.sleep { background: #131316; }
  `,
})
export class WellnessLineComponent {
  data = input<WellnessDay[]>([]);

  readonly height = 120;
  readonly padding = 8;
  readonly ticks = [0, 3, 6, 9, 12];
  readonly gridTicks = [0, 25, 50, 75, 100];

  readonly viewBox = computed(() => {
    const n = this.data().length;
    const width = n + Math.max(n - 1, 0) * GAP_UNIT;
    return `0 0 ${width} ${this.height}`;
  });

  moodPath(): string | null {
    return this.buildPath((d) => d.mood ?? null, 1, 5);
  }

  sleepPath(): string | null {
    return this.buildPath((d) => d.sleep_hours ?? null, 0, 12);
  }

  private buildPath(
    getter: (d: WellnessDay) => number | null,
    min: number,
    max: number,
  ): string | null {
    const days = this.data();
    const items = days.filter((d) => getter(d) !== null && getter(d) !== undefined);
    if (items.length === 0) return null;

    const points = items.map((d) => {
      const val = getter(d)!;
      const x = (d.day - 1) * (1 + GAP_UNIT) + 0.5;
      const y =
        this.height -
        this.padding -
        ((val - min) / (max - min)) * (this.height - this.padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }
}
