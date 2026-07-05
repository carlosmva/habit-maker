use rusqlite::{params, Connection};

use crate::error::AppError;
use crate::models::WellnessDay;
use crate::services::calendar::{days_in_month, month_date_range};

pub fn get_wellness_month(
    conn: &Connection,
    year: i32,
    month: u32,
) -> Result<Vec<WellnessDay>, AppError> {
    let dim = days_in_month(year, month);
    let (start, end) = month_date_range(year, month);

    let mut map: std::collections::HashMap<u32, WellnessDay> = (1..=dim)
        .map(|day| (day, WellnessDay { day, mood: None, sleep_hours: None }))
        .collect();

    let mut stmt = conn.prepare(
        "SELECT entry_date, mood, sleep_hours FROM wellness
         WHERE entry_date >= ?1 AND entry_date <= ?2",
    )?;

    stmt.query_map(params![start, end], |row| {
        let date_str: String = row.get(0)?;
        let day: u32 = date_str[8..10].parse().unwrap_or(0);
        Ok((day, row.get::<_, Option<i32>>(1)?, row.get::<_, Option<f64>>(2)?))
    })?
    .for_each(|r| {
        if let Ok((day, mood, sleep)) = r {
            if let Some(entry) = map.get_mut(&day) {
                entry.mood = mood;
                entry.sleep_hours = sleep;
            }
        }
    });

    let mut result: Vec<WellnessDay> = map.into_values().collect();
    result.sort_by_key(|d| d.day);
    Ok(result)
}

pub fn set_wellness(
    conn: &Connection,
    date: &str,
    mood: Option<i32>,
    sleep_hours: Option<f64>,
) -> Result<(), AppError> {
    if mood.is_none() && sleep_hours.is_none() {
        conn.execute("DELETE FROM wellness WHERE entry_date = ?1", params![date])?;
    } else {
        conn.execute(
            "INSERT INTO wellness (entry_date, mood, sleep_hours) VALUES (?1, ?2, ?3)
             ON CONFLICT(entry_date) DO UPDATE SET mood = ?2, sleep_hours = ?3",
            params![date, mood, sleep_hours],
        )?;
    }
    Ok(())
}
