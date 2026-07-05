import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import {
  EntryState,
  Habit,
  HabitPatch,
  MonthAnalytics,
  MonthGrid,
  NewHabit,
  WellnessDay,
} from './models';

@Injectable({ providedIn: 'root' })
export class TauriService {
  listHabits(includeArchived = false): Promise<Habit[]> {
    return invoke('list_habits', { includeArchived });
  }

  createHabit(input: NewHabit): Promise<Habit> {
    return invoke('create_habit', { input });
  }

  updateHabit(id: number, patch: HabitPatch): Promise<Habit> {
    return invoke('update_habit', { id, patch });
  }

  deleteHabit(id: number): Promise<void> {
    return invoke('delete_habit', { id });
  }

  reorderHabits(orderedIds: number[]): Promise<void> {
    return invoke('reorder_habits', { orderedIds });
  }

  setHabitArchived(id: number, archived: boolean): Promise<void> {
    return invoke('set_habit_archived', { id, archived });
  }

  getMonthGrid(year: number, month: number): Promise<MonthGrid> {
    return invoke('get_month_grid', { year, month });
  }

  toggleEntry(habitId: number, date: string): Promise<EntryState> {
    return invoke('toggle_entry', { habitId, date });
  }

  setEntry(habitId: number, date: string, completed: boolean): Promise<EntryState> {
    return invoke('set_entry', { habitId, date, completed });
  }

  getWellnessMonth(year: number, month: number): Promise<WellnessDay[]> {
    return invoke('get_wellness_month', { year, month });
  }

  setWellness(
    date: string,
    mood: number | null,
    sleepHours: number | null,
  ): Promise<void> {
    return invoke('set_wellness', { date, mood, sleepHours });
  }

  getMonthAnalytics(year: number, month: number): Promise<MonthAnalytics> {
    return invoke('get_month_analytics', { year, month });
  }

  exportDatabase(destPath: string): Promise<void> {
    return invoke('export_database', { destPath });
  }

  importDatabase(srcPath: string): Promise<void> {
    return invoke('import_database', { srcPath });
  }

  exportMonthCsv(year: number, month: number, destPath: string): Promise<void> {
    return invoke('export_month_csv', { year, month, destPath });
  }

  loadSampleHabits(): Promise<void> {
    return invoke('load_sample_habits');
  }
}
