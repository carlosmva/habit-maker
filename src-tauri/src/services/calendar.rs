use chrono::{Datelike, Local, NaiveDate, Weekday};
use crate::models::{GridDay, GridWeek};

const WEEKDAY_LABELS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

pub fn days_in_month(year: i32, month: u32) -> u32 {
    let (y, m) = if month == 12 {
        (year + 1, 1u32)
    } else {
        (year, month + 1)
    };
    NaiveDate::from_ymd_opt(y, m, 1)
        .unwrap()
        .pred_opt()
        .unwrap()
        .day()
}

pub fn weekday_label(wd: Weekday) -> String {
    WEEKDAY_LABELS[wd.num_days_from_sunday() as usize].to_string()
}

pub fn build_days(year: i32, month: u32) -> Vec<GridDay> {
    let dim = days_in_month(year, month);
    let weeks = compute_weeks(year, month, dim);

    (1..=dim)
        .map(|day| {
            let date = NaiveDate::from_ymd_opt(year, month, day).unwrap();
            let week_index = weeks
                .iter()
                .find(|w| day >= w.day_start && day <= w.day_end)
                .map(|w| w.index)
                .unwrap_or(1);

            GridDay {
                day,
                weekday: weekday_label(date.weekday()),
                week_index,
            }
        })
        .collect()
}

/// Week 1 = days 1..first Saturday, then 7-day Su–Sa chunks.
pub fn compute_weeks(year: i32, month: u32, days_in_month: u32) -> Vec<GridWeek> {
    let mut weeks = Vec::new();
    let mut day = 1u32;
    let mut index = 1u32;

    while day <= days_in_month {
        let date = NaiveDate::from_ymd_opt(year, month, day).unwrap();
        let wd = date.weekday().num_days_from_sunday();

        let day_end = if index == 1 {
            // First week ends on first Saturday (or end of month)
            let days_until_sat = if wd == 6 { 0 } else { 6 - wd };
            (day + days_until_sat).min(days_in_month)
        } else {
            (day + 6).min(days_in_month)
        };

        weeks.push(GridWeek {
            index,
            label: format!("Week {index}"),
            day_start: day,
            day_end,
        });

        day = day_end + 1;
        index += 1;
    }

    weeks
}

pub fn date_str(year: i32, month: u32, day: u32) -> String {
    format!("{year:04}-{month:02}-{day:02}")
}

pub fn month_date_range(year: i32, month: u32) -> (String, String) {
    let dim = days_in_month(year, month);
    (date_str(year, month, 1), date_str(year, month, dim))
}

pub fn today_local() -> NaiveDate {
    Local::now().date_naive()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn july_2026_has_31_days() {
        assert_eq!(days_in_month(2026, 7), 31);
    }

    #[test]
    fn feb_2024_leap_year() {
        assert_eq!(days_in_month(2024, 2), 29);
    }

    #[test]
    fn july_2026_week_grouping() {
        let weeks = compute_weeks(2026, 7, 31);
        assert_eq!(weeks[0].day_start, 1);
        // July 1 2026 is Wednesday; first Saturday is July 4
        assert_eq!(weeks[0].day_end, 4);
        assert!(weeks.len() >= 4);
    }
}
