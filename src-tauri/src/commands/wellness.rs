use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::WellnessDay;
use crate::services::wellness;

#[tauri::command]
pub async fn get_wellness_month(
    pool: State<'_, DbPool>,
    year: i32,
    month: u32,
) -> Result<Vec<WellnessDay>, AppError> {
    let conn = pool.get()?;
    wellness::get_wellness_month(&conn, year, month)
}

#[tauri::command]
pub async fn set_wellness(
    pool: State<'_, DbPool>,
    date: String,
    mood: Option<i32>,
    sleep_hours: Option<f64>,
) -> Result<(), AppError> {
    let conn = pool.get()?;
    wellness::set_wellness(&conn, &date, mood, sleep_hours)
}
