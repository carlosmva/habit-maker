use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::{EntryState, MonthGrid};
use crate::services::entries;

#[tauri::command]
pub async fn get_month_grid(
    pool: State<'_, DbPool>,
    year: i32,
    month: u32,
) -> Result<MonthGrid, AppError> {
    let conn = pool.get()?;
    entries::get_month_grid(&conn, year, month)
}

#[tauri::command]
pub async fn toggle_entry(
    pool: State<'_, DbPool>,
    habit_id: i64,
    date: String,
) -> Result<EntryState, AppError> {
    let conn = pool.get()?;
    entries::toggle_entry(&conn, habit_id, &date)
}

#[tauri::command]
pub async fn set_entry(
    pool: State<'_, DbPool>,
    habit_id: i64,
    date: String,
    completed: bool,
) -> Result<EntryState, AppError> {
    let conn = pool.get()?;
    entries::set_entry(&conn, habit_id, &date, completed)
}
