mod migrations;
mod pool;

pub use pool::DbPool;

use std::path::PathBuf;
use tauri::Manager;

pub fn init(app: &tauri::App) -> Result<DbPool, crate::error::AppError> {
    let dir = app.path().app_data_dir().map_err(|e| {
        crate::error::AppError::Validation(format!("Failed to resolve app data dir: {e}"))
    })?;
    std::fs::create_dir_all(&dir)?;
    let db_path = dir.join("habit-maker.db");
    let pool = pool::new_pool(&db_path)?;
    let conn = pool.get()?;
    migrations::run_migrations(&*conn)?;
    Ok(pool)
}

pub fn db_path_from_app(app: &tauri::AppHandle) -> Result<PathBuf, crate::error::AppError> {
    let dir = app.path().app_data_dir().map_err(|e| {
        crate::error::AppError::Validation(format!("Failed to resolve app data dir: {e}"))
    })?;
    Ok(dir.join("habit-maker.db"))
}
