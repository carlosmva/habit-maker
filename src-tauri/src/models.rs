use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Habit {
    pub id: i64,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub sort_order: i64,
    pub monthly_goal: Option<i64>,
    pub archived: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct NewHabit {
    pub name: String,
    pub icon: String,
    pub color: String,
    pub monthly_goal: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct HabitPatch {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub monthly_goal: Option<Option<i64>>,
}

#[derive(Debug, Serialize)]
pub struct GridDay {
    pub day: u32,
    pub weekday: String,
    pub week_index: u32,
}

#[derive(Debug, Serialize)]
pub struct GridWeek {
    pub index: u32,
    pub label: String,
    pub day_start: u32,
    pub day_end: u32,
}

#[derive(Debug, Serialize)]
pub struct GridHabit {
    pub id: i64,
    pub name: String,
    pub icon: String,
    pub color: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct GridEntry {
    pub habit_id: i64,
    pub day: u32,
    pub completed: bool,
}

#[derive(Debug, Serialize)]
pub struct DailyProgress {
    pub day: u32,
    pub completed: u32,
    pub total: u32,
    pub pct: f64,
}

#[derive(Debug, Serialize)]
pub struct MonthGrid {
    pub year: i32,
    pub month: u32,
    pub days: Vec<GridDay>,
    pub weeks: Vec<GridWeek>,
    pub habits: Vec<GridHabit>,
    pub entries: Vec<GridEntry>,
    pub daily_progress: Vec<DailyProgress>,
}

#[derive(Debug, Serialize)]
pub struct EntryState {
    pub completed: bool,
}

#[derive(Debug, Serialize)]
pub struct WellnessDay {
    pub day: u32,
    pub mood: Option<i32>,
    pub sleep_hours: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct MonthTotals {
    pub goal: i64,
    pub completed: i64,
    pub left: i64,
    pub pct: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct HabitAnalytics {
    pub habit_id: i64,
    pub name: String,
    pub icon: String,
    pub goal: i64,
    pub actual: i64,
    pub left: i64,
    pub pct: f64,
}

#[derive(Debug, Serialize)]
pub struct TopHabit {
    pub rank: u32,
    pub habit_id: i64,
    pub name: String,
    pub pct: f64,
}

#[derive(Debug, Serialize)]
pub struct MonthAnalytics {
    pub totals: MonthTotals,
    pub per_habit: Vec<HabitAnalytics>,
    pub top_habits: Vec<TopHabit>,
    pub daily_progress: Vec<DailyProgressPct>,
}

#[derive(Debug, Serialize)]
pub struct DailyProgressPct {
    pub day: u32,
    pub pct: f64,
}
