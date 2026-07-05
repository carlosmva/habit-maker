use r2d2_sqlite::SqliteConnectionManager;
use std::path::Path;

pub type DbPool = r2d2::Pool<SqliteConnectionManager>;

pub fn new_pool(path: &Path) -> Result<DbPool, crate::error::AppError> {
    let manager = SqliteConnectionManager::file(path);
    Ok(r2d2::Pool::builder().max_size(5).build(manager)?)
}
