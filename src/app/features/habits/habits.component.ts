import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TauriService } from '../../core/tauri.service';
import { Habit, NewHabit } from '../../core/models';

const EMOJI_OPTIONS = ['⏰', '💪', '📖', '🗓️', '🎯', '🍷', '📵', '📓', '🚿', '🧘', '🏃', '💧'];
const COLOR_OPTIONS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="habits-page">
      <div class="header">
        <h2>Habit Manager</h2>
        <div class="header-actions">
          <button class="btn" (click)="loadSamples()">Load sample habits</button>
          <button class="btn btn-primary" (click)="showForm.set(true)">+ New Habit</button>
        </div>
      </div>

      @if (showForm()) {
        <div class="card form-card">
          <h3>{{ editingId() ? 'Edit Habit' : 'New Habit' }}</h3>
          <div class="form-group">
            <label>Name</label>
            <input [(ngModel)]="form.name" placeholder="e.g. Gym" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Icon</label>
              <div class="emoji-picker">
                @for (e of EMOJI_OPTIONS; track e) {
                  <button
                    type="button"
                    class="emoji-btn"
                    [class.selected]="form.icon === e"
                    (click)="form.icon = e"
                  >{{ e }}</button>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                @for (c of COLOR_OPTIONS; track c) {
                  <button
                    type="button"
                    class="color-btn"
                    [class.selected]="form.color === c"
                    [style.background]="c"
                    (click)="form.color = c"
                  ></button>
                }
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Monthly Goal (blank = every day)</label>
            <input type="number" [(ngModel)]="form.monthly_goal" min="1" max="31" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="save()">Save</button>
            <button class="btn" (click)="cancelForm()">Cancel</button>
          </div>
        </div>
      }

      <div class="habit-list card">
        @for (habit of habits(); track habit.id; let i = $index) {
          <div class="habit-item" [class.archived]="habit.archived">
            <span class="drag-handle">⠿</span>
            <span class="habit-icon" [style.color]="habit.color">{{ habit.icon }}</span>
            <span class="habit-name">{{ habit.name }}</span>
            @if (habit.monthly_goal) {
              <span class="goal-badge">{{ habit.monthly_goal }}/mo</span>
            }
            @if (habit.archived) {
              <span class="archived-badge">Archived</span>
            }
            <div class="item-actions">
              <button class="btn-sm" (click)="moveUp(i)" [disabled]="i === 0">↑</button>
              <button class="btn-sm" (click)="moveDown(i)" [disabled]="i === habits().length - 1">↓</button>
              <button class="btn-sm" (click)="edit(habit)">Edit</button>
              <button class="btn-sm" (click)="toggleArchive(habit)">
                {{ habit.archived ? 'Restore' : 'Archive' }}
              </button>
              <button class="btn-sm btn-danger" (click)="remove(habit.id)">Delete</button>
            </div>
          </div>
        } @empty {
          <p class="empty">No habits yet. Create one or load samples.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .habits-page { display: flex; flex-direction: column; gap: 1rem; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h2 { margin: 0; }
    .header-actions { display: flex; gap: 0.5rem; }
    .form-card h3 { margin: 0 0 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .emoji-picker, .color-picker { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .emoji-btn, .color-btn {
      width: 36px;
      height: 36px;
      border: 2px solid transparent;
      border-radius: 6px;
      background: var(--surface);
      font-size: 1.125rem;
      cursor: pointer;
    }
    .emoji-btn.selected, .color-btn.selected { border-color: var(--accent); }
    .color-btn { border-radius: 50%; }
    .form-actions { display: flex; gap: 0.5rem; }
    .habit-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }
    .habit-item.archived { opacity: 0.5; }
    .drag-handle { color: var(--text-muted); cursor: grab; }
    .habit-icon { font-size: 1.25rem; }
    .habit-name { flex: 1; font-weight: 500; }
    .goal-badge, .archived-badge {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      background: var(--surface);
      color: var(--text-muted);
    }
    .item-actions { display: flex; gap: 0.25rem; }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--surface);
      color: var(--text);
    }
    .btn-sm:disabled { opacity: 0.3; cursor: default; }
    .empty { color: var(--text-muted); text-align: center; padding: 2rem; }
  `,
})
export class HabitsComponent implements OnInit {
  private readonly tauri = inject(TauriService);

  readonly habits = signal<Habit[]>([]);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  form: NewHabit & { monthly_goal?: number | null } = {
    name: '',
    icon: '💪',
    color: '#6366f1',
    monthly_goal: null,
  };

  protected readonly EMOJI_OPTIONS = EMOJI_OPTIONS;
  protected readonly COLOR_OPTIONS = COLOR_OPTIONS;

  ngOnInit(): void {
    this.load();
  }

  edit(habit: Habit): void {
    this.editingId.set(habit.id);
    this.form = {
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      monthly_goal: habit.monthly_goal,
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  async save(): Promise<void> {
    if (!this.form.name.trim()) return;

    if (this.editingId()) {
      await this.tauri.updateHabit(this.editingId()!, {
        name: this.form.name,
        icon: this.form.icon,
        color: this.form.color,
        monthly_goal: this.form.monthly_goal || null,
      });
    } else {
      await this.tauri.createHabit({
        name: this.form.name,
        icon: this.form.icon,
        color: this.form.color,
        monthly_goal: this.form.monthly_goal || null,
      });
    }

    this.cancelForm();
    await this.load();
  }

  async remove(id: number): Promise<void> {
    if (!confirm('Delete this habit and all its entries?')) return;
    await this.tauri.deleteHabit(id);
    await this.load();
  }

  async toggleArchive(habit: Habit): Promise<void> {
    await this.tauri.setHabitArchived(habit.id, !habit.archived);
    await this.load();
  }

  async moveUp(index: number): Promise<void> {
    if (index === 0) return;
    await this.swap(index, index - 1);
  }

  async moveDown(index: number): Promise<void> {
    if (index >= this.habits().length - 1) return;
    await this.swap(index, index + 1);
  }

  async loadSamples(): Promise<void> {
    await this.tauri.loadSampleHabits();
    await this.load();
  }

  private async swap(a: number, b: number): Promise<void> {
    const list = [...this.habits()];
    [list[a], list[b]] = [list[b], list[a]];
    await this.tauri.reorderHabits(list.map((h) => h.id));
    await this.load();
  }

  private async load(): Promise<void> {
    const habits = await this.tauri.listHabits(true);
    this.habits.set(habits);
  }

  private resetForm(): void {
    this.form = { name: '', icon: '💪', color: '#6366f1', monthly_goal: null };
  }
}
