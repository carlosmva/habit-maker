use chrono::Utc;
use rusqlite::{params, Connection};

use crate::error::AppError;
use crate::models::{Habit, HabitPatch, NewHabit};

fn row_to_habit(row: &rusqlite::Row) -> rusqlite::Result<Habit> {
    Ok(Habit {
        id: row.get(0)?,
        name: row.get(1)?,
        icon: row.get(2)?,
        color: row.get(3)?,
        sort_order: row.get(4)?,
        monthly_goal: row.get(5)?,
        archived: row.get::<_, i64>(6)? != 0,
        created_at: row.get(7)?,
    })
}

pub fn list_habits(conn: &Connection, include_archived: bool) -> Result<Vec<Habit>, AppError> {
    let sql = if include_archived {
        "SELECT id, name, icon, color, sort_order, monthly_goal, archived, created_at
         FROM habits ORDER BY sort_order, id"
    } else {
        "SELECT id, name, icon, color, sort_order, monthly_goal, archived, created_at
         FROM habits WHERE archived = 0 ORDER BY sort_order, id"
    };
    let mut stmt = conn.prepare(sql)?;
    let habits = stmt
        .query_map([], row_to_habit)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(habits)
}

pub fn create_habit(conn: &Connection, input: NewHabit) -> Result<Habit, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::Validation("Name is required".into()));
    }
    let max_order: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), -1) FROM habits", [], |r| {
            r.get(0)
        })
        .unwrap_or(-1);

    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO habits (name, icon, color, sort_order, monthly_goal, archived, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)",
        params![
            input.name.trim(),
            input.icon,
            input.color,
            max_order + 1,
            input.monthly_goal,
            now,
        ],
    )?;
    let id = conn.last_insert_rowid();
    get_habit(conn, id)
}

pub fn get_habit(conn: &Connection, id: i64) -> Result<Habit, AppError> {
    conn.query_row(
        "SELECT id, name, icon, color, sort_order, monthly_goal, archived, created_at
         FROM habits WHERE id = ?1",
        params![id],
        row_to_habit,
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Habit {id}")),
        other => AppError::Db(other),
    })
}

pub fn update_habit(conn: &Connection, id: i64, patch: HabitPatch) -> Result<Habit, AppError> {
    let existing = get_habit(conn, id)?;
    let name = patch.name.unwrap_or(existing.name);
    let icon = patch.icon.unwrap_or(existing.icon);
    let color = patch.color.unwrap_or(existing.color);
    let monthly_goal = patch.monthly_goal.unwrap_or(existing.monthly_goal);

    conn.execute(
        "UPDATE habits SET name=?1, icon=?2, color=?3, monthly_goal=?4 WHERE id=?5",
        params![name, icon, color, monthly_goal, id],
    )?;
    get_habit(conn, id)
}

pub fn delete_habit(conn: &Connection, id: i64) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM habits WHERE id = ?1", params![id])?;
    if affected == 0 {
        return Err(AppError::NotFound(format!("Habit {id}")));
    }
    Ok(())
}

pub fn reorder_habits(conn: &Connection, ordered_ids: Vec<i64>) -> Result<(), AppError> {
    for (i, id) in ordered_ids.iter().enumerate() {
        conn.execute(
            "UPDATE habits SET sort_order = ?1 WHERE id = ?2",
            params![i as i64, id],
        )?;
    }
    Ok(())
}

pub fn set_habit_archived(conn: &Connection, id: i64, archived: bool) -> Result<(), AppError> {
    let affected = conn.execute(
        "UPDATE habits SET archived = ?1 WHERE id = ?2",
        params![archived as i64, id],
    )?;
    if affected == 0 {
        return Err(AppError::NotFound(format!("Habit {id}")));
    }
    Ok(())
}

pub fn load_sample_habits(conn: &Connection) -> Result<(), AppError> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM habits", [], |r| r.get(0))?;
    if count > 0 {
        return Ok(());
    }

    let samples = [
        ("Wake up at 05:00", "⏰", "#f59e0b"),
        ("Gym", "💪", "#ef4444"),
        ("Reading / Learning", "📖", "#6366f1"),
        ("Day Planning", "🗓️", "#22c55e"),
        ("No Gooning", "🎯", "#ec4899"),
        ("Project Work", "💻", "#06b6d4"),
        ("No Alcohol", "🍷", "#8b5cf6"),
        ("Social Media Detox", "📵", "#f97316"),
        ("Goal Journaling", "📓", "#a855f7"),
        ("Cold Shower", "🚿", "#0ea5e9"),
        ("Learn a skill", "🧠", "#14b8a6"),
        ("Meditate", "🧘", "#6366f1"),
        ("Stretching", "🏃", "#22c55e"),
    ];

    for (i, (name, icon, color)) in samples.iter().enumerate() {
        create_habit(
            conn,
            NewHabit {
                name: name.to_string(),
                icon: icon.to_string(),
                color: color.to_string(),
                monthly_goal: None,
            },
        )?;
        // Fix sort order since create_habit auto-increments
        conn.execute(
            "UPDATE habits SET sort_order = ?1 WHERE name = ?2",
            params![i as i64, name],
        )?;
    }
    Ok(())
}
