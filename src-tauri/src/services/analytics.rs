use rusqlite::{params, Connection};

use crate::error::AppError;
use crate::models::{
    DailyProgressPct, HabitAnalytics, MonthAnalytics, MonthTotals, TopHabit,
};
use crate::services::calendar::{days_in_month, month_date_range};

pub fn get_month_analytics(
    conn: &Connection,
    year: i32,
    month: u32,
) -> Result<MonthAnalytics, AppError> {
    let dim = days_in_month(year, month) as i64;
    let (start, end) = month_date_range(year, month);

    let habits: Vec<(i64, String, String, Option<i64>)> = conn
        .prepare(
            "SELECT id, name, icon, monthly_goal FROM habits WHERE archived = 0 ORDER BY sort_order, id",
        )?
        .query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut per_habit = Vec::new();
    let mut total_goal: i64 = 0;
    let mut total_completed: i64 = 0;

    for (habit_id, name, icon, monthly_goal) in &habits {
        let goal = monthly_goal.unwrap_or(dim);
        let actual: i64 = conn.query_row(
            "SELECT COUNT(*) FROM habit_entries
             WHERE habit_id = ?1 AND entry_date >= ?2 AND entry_date <= ?3 AND completed = 1",
            params![habit_id, start, end],
            |r| r.get(0),
        )?;
        let left = (goal - actual).max(0);
        let pct = if goal > 0 {
            actual as f64 / goal as f64
        } else {
            0.0
        };

        total_goal += goal;
        total_completed += actual;

        per_habit.push(HabitAnalytics {
            habit_id: *habit_id,
            name: name.clone(),
            icon: icon.clone(),
            goal,
            actual,
            left,
            pct,
        });
    }

    let totals = MonthTotals {
        goal: total_goal,
        completed: total_completed,
        left: (total_goal - total_completed).max(0),
        pct: if total_goal > 0 {
            total_completed as f64 / total_goal as f64
        } else {
            0.0
        },
    };

    let mut sorted = per_habit.clone();
    sorted.sort_by(|a, b| {
        b.pct
            .partial_cmp(&a.pct)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(b.actual.cmp(&a.actual))
    });

    let top_habits: Vec<TopHabit> = sorted
        .iter()
        .take(10)
        .enumerate()
        .map(|(i, h)| TopHabit {
            rank: (i + 1) as u32,
            habit_id: h.habit_id,
            name: h.name.clone(),
            pct: h.pct,
        })
        .collect();

    let habit_count = habits.len() as f64;
    let daily_progress: Vec<DailyProgressPct> = (1..=dim as u32)
        .map(|day| {
            let date = format!("{year:04}-{month:02}-{day:02}");
            let completed: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM habit_entries he
                     JOIN habits h ON h.id = he.habit_id
                     WHERE he.entry_date = ?1 AND he.completed = 1 AND h.archived = 0",
                    params![date],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            let pct = if habit_count > 0.0 {
                completed as f64 / habit_count
            } else {
                0.0
            };
            DailyProgressPct { day, pct }
        })
        .collect();

    Ok(MonthAnalytics {
        totals,
        per_habit,
        top_habits,
        daily_progress,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::models::NewHabit;
    use crate::services::habits::create_habit;
    use rusqlite::Connection;

    fn test_conn() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(conn).unwrap();
        Connection::open_in_memory().unwrap()
    }

    fn setup_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(include_str!("../../migrations/0001_init.sql"))
            .unwrap();
        create_habit(
            &conn,
            NewHabit {
                name: "Gym".into(),
                icon: "💪".into(),
                color: "#6366f1".into(),
                monthly_goal: None,
            },
        )
        .unwrap();
        create_habit(
            &conn,
            NewHabit {
                name: "Read".into(),
                icon: "📖".into(),
                color: "#22c55e".into(),
                monthly_goal: Some(15),
            },
        )
        .unwrap();
        conn
    }

    #[test]
    fn analytics_totals() {
        let conn = setup_db();
        conn.execute(
            "INSERT INTO habit_entries (habit_id, entry_date, completed) VALUES (1, '2026-07-01', 1)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO habit_entries (habit_id, entry_date, completed) VALUES (1, '2026-07-02', 1)",
            [],
        )
        .unwrap();

        let analytics = get_month_analytics(&conn, 2026, 7).unwrap();
        assert_eq!(analytics.totals.goal, 31 + 15);
        assert_eq!(analytics.totals.completed, 2);
        assert_eq!(analytics.per_habit.len(), 2);
    }

    #[test]
    fn top_habits_ordering() {
        let conn = setup_db();
        for day in 1..=20 {
            conn.execute(
                &format!(
                    "INSERT INTO habit_entries (habit_id, entry_date, completed) VALUES (1, '2026-07-{day:02}', 1)"
                ),
                [],
            )
            .unwrap();
        }
        let analytics = get_month_analytics(&conn, 2026, 7).unwrap();
        assert!(!analytics.top_habits.is_empty());
        assert_eq!(analytics.top_habits[0].habit_id, 1);
    }
}
