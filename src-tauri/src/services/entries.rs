use rusqlite::{params, Connection};

use crate::error::AppError;
use crate::models::{DailyProgress, EntryState, GridEntry, GridHabit, MonthGrid};
use crate::services::calendar::{self, days_in_month};

pub fn get_month_grid(
    conn: &Connection,
    year: i32,
    month: u32,
) -> Result<MonthGrid, AppError> {
    let days = calendar::build_days(year, month);
    let weeks = calendar::compute_weeks(year, month, days_in_month(year, month));

    let habits: Vec<GridHabit> = conn
        .prepare(
            "SELECT id, name, icon, color FROM habits WHERE archived = 0 ORDER BY sort_order, id",
        )?
        .query_map([], |row| {
            Ok(GridHabit {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let (start, end) = calendar::month_date_range(year, month);
    let mut stmt = conn.prepare(
        "SELECT he.habit_id, he.entry_date, he.completed
         FROM habit_entries he
         JOIN habits h ON h.id = he.habit_id
         WHERE he.entry_date >= ?1 AND he.entry_date <= ?2 AND he.completed = 1 AND h.archived = 0",
    )?;

    let entries: Vec<GridEntry> = stmt
        .query_map(params![start, end], |row| {
            let date_str: String = row.get(1)?;
            let day: u32 = date_str[8..10].parse().unwrap_or(0);
            Ok(GridEntry {
                habit_id: row.get(0)?,
                day,
                completed: row.get::<_, i64>(2)? != 0,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let habit_count = habits.len() as u32;
    let daily_progress: Vec<DailyProgress> = days
        .iter()
        .map(|d| {
            let completed = entries
                .iter()
                .filter(|e| e.day == d.day && e.completed)
                .count() as u32;
            let pct = if habit_count > 0 {
                completed as f64 / habit_count as f64
            } else {
                0.0
            };
            DailyProgress {
                day: d.day,
                completed,
                total: habit_count,
                pct,
            }
        })
        .collect();

    Ok(MonthGrid {
        year,
        month,
        days,
        weeks,
        habits,
        entries,
        daily_progress,
    })
}

pub fn toggle_entry(conn: &Connection, habit_id: i64, date: &str) -> Result<EntryState, AppError> {
    let exists: Option<i64> = conn
        .query_row(
            "SELECT id FROM habit_entries WHERE habit_id = ?1 AND entry_date = ?2 AND completed = 1",
            params![habit_id, date],
            |r| r.get(0),
        )
        .ok();

    if exists.is_some() {
        conn.execute(
            "DELETE FROM habit_entries WHERE habit_id = ?1 AND entry_date = ?2",
            params![habit_id, date],
        )?;
        Ok(EntryState { completed: false })
    } else {
        conn.execute(
            "INSERT INTO habit_entries (habit_id, entry_date, completed) VALUES (?1, ?2, 1)
             ON CONFLICT(habit_id, entry_date) DO UPDATE SET completed = 1",
            params![habit_id, date],
        )?;
        Ok(EntryState { completed: true })
    }
}

pub fn set_entry(
    conn: &Connection,
    habit_id: i64,
    date: &str,
    completed: bool,
) -> Result<EntryState, AppError> {
    if completed {
        conn.execute(
            "INSERT INTO habit_entries (habit_id, entry_date, completed) VALUES (?1, ?2, 1)
             ON CONFLICT(habit_id, entry_date) DO UPDATE SET completed = 1",
            params![habit_id, date],
        )?;
    } else {
        conn.execute(
            "DELETE FROM habit_entries WHERE habit_id = ?1 AND entry_date = ?2",
            params![habit_id, date],
        )?;
    }
    Ok(EntryState { completed })
}
