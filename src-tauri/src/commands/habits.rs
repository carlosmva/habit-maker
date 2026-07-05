use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::{Habit, HabitPatch, NewHabit};
use crate::services::habits;

#[tauri::command]
pub async fn list_habits(
    pool: State<'_, DbPool>,
    include_archived: bool,
) -> Result<Vec<Habit>, AppError> {
    let conn = pool.get()?;
    habits::list_habits(&conn, include_archived)
}

#[tauri::command]
pub async fn create_habit(pool: State<'_, DbPool>, input: NewHabit) -> Result<Habit, AppError> {
    let conn = pool.get()?;
    habits::create_habit(&conn, input)
}

#[tauri::command]
pub async fn update_habit(
    pool: State<'_, DbPool>,
    id: i64,
    patch: HabitPatch,
) -> Result<Habit, AppError> {
    let conn = pool.get()?;
    habits::update_habit(&conn, id, patch)
}

#[tauri::command]
pub async fn delete_habit(pool: State<'_, DbPool>, id: i64) -> Result<(), AppError> {
    let conn = pool.get()?;
    habits::delete_habit(&conn, id)
}

#[tauri::command]
pub async fn reorder_habits(
    pool: State<'_, DbPool>,
    ordered_ids: Vec<i64>,
) -> Result<(), AppError> {
    let conn = pool.get()?;
    habits::reorder_habits(&conn, ordered_ids)
}

#[tauri::command]
pub async fn set_habit_archived(
    pool: State<'_, DbPool>,
    id: i64,
    archived: bool,
) -> Result<(), AppError> {
    let conn = pool.get()?;
    habits::set_habit_archived(&conn, id, archived)
}

#[tauri::command]
pub async fn load_sample_habits(pool: State<'_, DbPool>) -> Result<(), AppError> {
    let conn = pool.get()?;
    habits::load_sample_habits(&conn)
}
