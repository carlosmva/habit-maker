export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  monthly_goal: number | null;
  archived: boolean;
  created_at: string;
}

export interface NewHabit {
  name: string;
  icon: string;
  color: string;
  monthly_goal?: number | null;
}

export interface HabitPatch {
  name?: string;
  icon?: string;
  color?: string;
  monthly_goal?: number | null;
}

export interface GridDay {
  day: number;
  weekday: string;
  week_index: number;
}

export interface GridWeek {
  index: number;
  label: string;
  day_start: number;
  day_end: number;
}

export interface GridHabit {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface GridEntry {
  habit_id: number;
  day: number;
  completed: boolean;
}

export interface DailyProgress {
  day: number;
  completed: number;
  total: number;
  pct: number;
}

export interface MonthGrid {
  year: number;
  month: number;
  days: GridDay[];
  weeks: GridWeek[];
  habits: GridHabit[];
  entries: GridEntry[];
  daily_progress: DailyProgress[];
}

export interface EntryState {
  completed: boolean;
}

export interface WellnessDay {
  day: number;
  mood?: number | null;
  sleep_hours?: number | null;
}

export interface MonthTotals {
  goal: number;
  completed: number;
  left: number;
  pct: number;
}

export interface HabitAnalytics {
  habit_id: number;
  name: string;
  icon: string;
  goal: number;
  actual: number;
  left: number;
  pct: number;
}

export interface TopHabit {
  rank: number;
  habit_id: number;
  name: string;
  pct: number;
}

export interface MonthAnalytics {
  totals: MonthTotals;
  per_habit: HabitAnalytics[];
  top_habits: TopHabit[];
  daily_progress: { day: number; pct: number }[];
}

export interface MonthRef {
  year: number;
  month: number;
}

export interface AppError {
  code: string;
  message: string;
}
