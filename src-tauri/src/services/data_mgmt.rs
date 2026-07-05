use std::fs;
use std::path::Path;

use rusqlite::Connection;

use crate::error::AppError;
use crate::services::calendar::{days_in_month, month_date_range};

pub fn export_database(src: &Path, dest: &str) -> Result<(), AppError> {
    fs::copy(src, dest)?;
    Ok(())
}

pub fn import_database(src: &str, dest: &Path) -> Result<(), AppError> {
    // Validate schema by opening the source
    let conn = Connection::open(src)?;
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='habits'",
        [],
        |r| r.get(0),
    )?;
    if count == 0 {
        return Err(AppError::Validation("Invalid database: missing habits table".into()));
    }
    drop(conn);
    fs::copy(src, dest)?;
    Ok(())
}

pub fn export_month_csv(conn: &Connection, year: i32, month: u32, dest: &str) -> Result<(), AppError> {
    let dim = days_in_month(year, month);
    let (start, end) = month_date_range(year, month);

    let habits: Vec<(i64, String)> = conn
        .prepare("SELECT id, name FROM habits WHERE archived = 0 ORDER BY sort_order, id")?
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;

    let mut lines = vec!["Habit".to_string()];
    for day in 1..=dim {
        lines[0].push(',');
        lines[0].push_str(&day.to_string());
    }

    for (habit_id, name) in &habits {
        let mut row = name.clone();
        for day in 1..=dim {
            let date = format!("{year:04}-{month:02}-{day:02}");
            let done: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM habit_entries
                     WHERE habit_id = ?1 AND entry_date = ?2 AND completed = 1",
                    rusqlite::params![habit_id, date],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            row.push(',');
            row.push(if done > 0 { '1' } else { '0' });
        }
        lines.push(row);
    }

    let _ = (start, end); // used for validation context
    fs::write(dest, lines.join("\n"))?;
    Ok(())
}
