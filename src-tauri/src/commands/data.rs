use tauri::{AppHandle, State};

use crate::db::{db_path_from_app, DbPool};
use crate::error::AppError;
use crate::services::data_mgmt;

#[tauri::command]
pub async fn export_database(app: AppHandle, dest_path: String) -> Result<(), AppError> {
    let src = db_path_from_app(&app)?;
    data_mgmt::export_database(&src, &dest_path)
}

#[tauri::command]
pub async fn import_database(app: AppHandle, src_path: String) -> Result<(), AppError> {
    let dest = db_path_from_app(&app)?;
    data_mgmt::import_database(&src_path, &dest)
}

#[tauri::command]
pub async fn export_month_csv(
    pool: State<'_, DbPool>,
    year: i32,
    month: u32,
    dest_path: String,
) -> Result<(), AppError> {
    let conn = pool.get()?;
    data_mgmt::export_month_csv(&conn, year, month, &dest_path)
}
