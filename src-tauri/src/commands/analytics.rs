use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::MonthAnalytics;
use crate::services::analytics;

#[tauri::command]
pub async fn get_month_analytics(
    pool: State<'_, DbPool>,
    year: i32,
    month: u32,
) -> Result<MonthAnalytics, AppError> {
    let conn = pool.get()?;
    analytics::get_month_analytics(&conn, year, month)
}
