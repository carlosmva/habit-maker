mod commands;
mod db;
mod error;
mod models;
mod services;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let pool = db::init(app)?;
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_habits,
            commands::create_habit,
            commands::update_habit,
            commands::delete_habit,
            commands::reorder_habits,
            commands::set_habit_archived,
            commands::load_sample_habits,
            commands::get_month_grid,
            commands::toggle_entry,
            commands::set_entry,
            commands::get_wellness_month,
            commands::set_wellness,
            commands::get_month_analytics,
            commands::export_database,
            commands::import_database,
            commands::export_month_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
