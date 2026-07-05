import { Component, input } from '@angular/core';
import { pctLabel } from '../core/month.util';

@Component({
  selector: 'app-donut',
  standalone: true,
  template: `
    <div class="donut-wrap">
      <svg viewBox="0 0 120 120" class="donut-svg">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#d6d6dc" stroke-width="16" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="16"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="68" text-anchor="middle" class="pct-text">{{ label }}</text>
      </svg>
    </div>
  `,
  styles: `
    .donut-wrap { display: flex; justify-content: center; }
    .donut-svg { width: 160px; height: 160px; }
    .pct-text {
      fill: var(--text);
      font-size: 26px;
      font-weight: 800;
    }
  `,
})
export class DonutComponent {
  pct = input(0);
  color = input('#131316');

  readonly circumference = 2 * Math.PI * 50;

  get dashOffset(): number {
    return this.circumference * (1 - this.pct());
  }

  get label(): string {
    return pctLabel(this.pct());
  }
}
