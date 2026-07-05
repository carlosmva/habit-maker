# Habit Maker — Product & Technical Specification

> Source of truth: the reference screen recording (`Screen_Recording_20260704_205220_Facebook.mp4`),
> a monthly habit-tracker "dashboard" laid out like a dark-themed spreadsheet.
> This spec re-implements that concept as a native desktop app.

**Stack:** Tauri 2 · Angular 22 (standalone, signals) · Rust backend · SQLite (local, offline-first)

---

## 1. Product overview

Habit Maker is a **single-user, offline-first desktop app** for tracking daily habits across a
calendar month and reflecting on progress through analytics. Everything is stored locally in a
SQLite database — no accounts, no network, no sync (v1).

The core loop:

1. Define a list of habits (name + emoji icon).
2. Each day, check off the habits you completed in a month-grid.
3. Optionally log daily wellness (mood + hours of sleep).
4. Review progress via daily-progress bars, an overall completion donut, a per-habit analysis
   table, and a "Top habits" ranking.

### 1.1 What the reference shows (observed features)

| Region in recording | Feature |
|---|---|
| Left panel titled **"My Habits"** | Ordered list of habits, each with a name and emoji (e.g. `Wake up at 05:00 ⏰`, `Gym 💪`, `Reading / Learning 📖`, `Day Planning 🗓️`, `No Gooning 🎯`, `Project Work`, `No Alcohol 🍷`, `Social Media Detox 📵`, `Goal Journaling 📓`, `Cold Shower 🚿`, `Learn a skill`, `Meditate`, `Stretching`). |
| Central grid | Rows = habits, columns = days of the month grouped into **Week 1 … Week 5**, with weekday header (`Su Mo Tu We Th Fr Sa`) and the day number (`1 … 31`). Each cell is a **checkbox** the user toggles when a habit is done. |
| Bottom month tabs | Month selector: **January … December** (July highlighted in the recording). |
| **Daily Progress** bar charts | Per-day bar of "% of habits completed that day". |
| **Overall wellness** row | Per-day **Mood** and **Hours of Sleep** shown as a line/area chart. |
| **Goal / Completed / Left** stat tiles | Monthly totals: Goal `372`, Completed `277`/`342`, Left `95`/`30`. |
| **Overall Stats** donut | Single big completion percentage (e.g. `74%`, `92%`). |
| **Analysis** table | Per habit: `Goal`, `Actual`, `Left`, `Progress` bar, `%`. |
| **Top 10 Habits** | Ranked list of best-performing habits (e.g. `1. Stretching`). |

### 1.2 Derived from observation

- **Goal** per habit = its monthly target. Reference shows `31`/`30` (= days in month), i.e. "do it
  every day". We make this **configurable per habit** with default = number of days in the month.
- **Overall Goal** (`372`) ≈ Σ per-habit goals for the month (12 habits × 31 ≈ 372).
- **Completed** = Σ checked cells for the month. **Left** = Goal − Completed.
- **Overall %** = Completed / Goal.
- **Daily progress %** = habits completed that day / active habits that day.

---

## 2. Goals & non-goals

**Goals (v1)**
- Fast, keyboard-and-mouse-friendly monthly grid for checking off habits.
- Accurate monthly analytics computed in Rust/SQLite.
- Fully offline; data owned by the user in a local SQLite file.
- Cross-platform desktop (Windows, macOS, Linux) via Tauri.
- Import/export the database (backup) and CSV export of a month.

**Non-goals (v1)**
- Multi-user, auth, cloud sync, mobile.
- Reminders/notifications (candidate for v2).
- Arbitrary habit frequencies (e.g. "3× per week") — v1 goal is a monthly count target.

---

## 3. Architecture

```
┌───────────────────────────────────────────────────────────┐
│ Tauri window (WebView)                                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Angular SPA (standalone components + signals)          │ │
│  │  - Grid view, Analytics view, Habit editor            │ │
│  │  - Charts (progress bars, donut, wellness line)       │ │
│  │  - Calls Rust via @tauri-apps/api `invoke()`          │ │
│  └───────────────▲──────────────────────────────────────┘ │
│                  │ invoke(command, args) / typed results    │
│  ┌───────────────┴──────────────────────────────────────┐ │
│  │ Rust core (Tauri commands)                             │ │
│  │  - Command handlers (thin) → services (logic)          │ │
│  │  - Analytics/aggregation queries                       │ │
│  │  - rusqlite connection pool (r2d2) + migrations        │ │
│  └───────────────▲──────────────────────────────────────┘ │
│                  │ SQL                                       │
│           ┌──────┴───────┐                                  │
│           │ SQLite file  │  (app data dir)                  │
│           └──────────────┘                                  │
└───────────────────────────────────────────────────────────┘
```

**Boundaries**
- Angular never touches SQL. It only calls typed Tauri commands.
- Rust owns all persistence, validation, and aggregation. Angular renders.
- All money-time math (which day is in which week, days-in-month) is computed in Rust so the grid
  and analytics agree.

### 3.1 Technology choices

| Layer | Choice | Notes |
|---|---|---|
| Shell | **Tauri 2** | Small binary, Rust backend, native webview. |
| Frontend | **Angular 22** standalone components, **signals** for state, Angular Router for views. |
| UI charts | **ngx-charts** *or* lightweight custom SVG | Bars/donut/line are simple; custom SVG avoids heavy deps. Recommend custom SVG components for the 3 chart types. |
| DB | **SQLite** via **`rusqlite`** (bundled feature) + **`r2d2` / `r2d2_sqlite`** pool | Full control over aggregation queries. `refinery` or hand-rolled `PRAGMA user_version` migrations. |
| Serialization | **serde** / `serde_json` | Typed DTOs shared conceptually with TS interfaces. |
| Dates | **`chrono`** | Month boundaries, weekday, days-in-month. |
| IDs | Auto-increment integer PKs (single-user, local). |

> Alternative: `tauri-plugin-sql` (sqlx) if you prefer SQL from the frontend. **Rejected for v1** —
> we want aggregation logic in Rust and a clean command API, not SQL strings in Angular.

---

## 4. Data model (SQLite)

```sql
-- schema_version tracked via PRAGMA user_version

CREATE TABLE habits (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    icon         TEXT    NOT NULL DEFAULT '',      -- emoji, e.g. '💪'
    color        TEXT    NOT NULL DEFAULT '#3b82f6',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    -- Monthly target count. NULL => "every day" (days-in-month). Otherwise fixed count.
    monthly_goal INTEGER,
    archived     INTEGER NOT NULL DEFAULT 0,       -- 0/1 boolean
    created_at   TEXT    NOT NULL                  -- ISO-8601 UTC
);

CREATE TABLE habit_entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    entry_date TEXT    NOT NULL,                   -- 'YYYY-MM-DD'
    completed  INTEGER NOT NULL DEFAULT 1,         -- 0/1; row exists only when interacted with
    UNIQUE (habit_id, entry_date)
);
CREATE INDEX idx_entries_date ON habit_entries(entry_date);
CREATE INDEX idx_entries_habit ON habit_entries(habit_id);

CREATE TABLE wellness (
    entry_date  TEXT PRIMARY KEY,                  -- 'YYYY-MM-DD'
    mood        INTEGER,                           -- 1..5 (nullable)
    sleep_hours REAL                               -- e.g. 7.5 (nullable)
);

CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

**Rules**
- A habit is "done" on a date iff a `habit_entries` row exists with `completed = 1`. Toggling off
  either deletes the row or sets `completed = 0` (implementation: delete on untoggle to keep the
  table sparse).
- `entry_date` is a local calendar date string; the app operates in the user's local timezone.
- Archived habits are hidden from the grid but retained for historical analytics.

---

## 5. Backend API (Tauri commands)

All commands are `#[tauri::command]`, `async`, return `Result<T, AppError>` where `AppError`
serializes to `{ code, message }`. Dates are strings (`YYYY-MM-DD`); month is addressed as
`{ year: i32, month: u32 }` (month 1–12).

### 5.1 Habits

```rust
list_habits(include_archived: bool) -> Vec<Habit>
create_habit(input: NewHabit) -> Habit          // name, icon, color, monthly_goal?
update_habit(id: i64, patch: HabitPatch) -> Habit
delete_habit(id: i64) -> ()                      // cascade deletes entries
reorder_habits(ordered_ids: Vec<i64>) -> ()      // sets sort_order
set_habit_archived(id: i64, archived: bool) -> ()
```

### 5.2 Grid & entries

```rust
// Everything the month grid needs in one call.
get_month_grid(year: i32, month: u32) -> MonthGrid

// Toggle a single cell. Returns the resulting state.
toggle_entry(habit_id: i64, date: String) -> EntryState   // { completed: bool }

// Explicit set (for keyboard fill / bulk).
set_entry(habit_id: i64, date: String, completed: bool) -> EntryState
```

`MonthGrid`:
```jsonc
{
  "year": 2026, "month": 7,
  "days": [                                  // one per day in month
    { "day": 1, "weekday": "We", "week_index": 1 },
    // ...
  ],
  "weeks": [ { "index": 1, "label": "Week 1", "day_start": 1, "day_end": 4 }, ... ],
  "habits": [ { "id": 1, "name": "Gym", "icon": "💪", "color": "#..." }, ... ],
  "entries": [ { "habit_id": 1, "day": 3, "completed": true }, ... ],
  "daily_progress": [ { "day": 1, "completed": 8, "total": 12, "pct": 0.66 }, ... ]
}
```
> Week grouping: Week 1 = days 1..first Saturday, then 7-day chunks aligned to Su–Sa, matching the
> `Su Mo Tu We Th Fr Sa` header in the reference. Computed in Rust so all views agree.

### 5.3 Wellness

```rust
get_wellness_month(year: i32, month: u32) -> Vec<WellnessDay>   // {day, mood?, sleep_hours?}
set_wellness(date: String, mood: Option<i32>, sleep_hours: Option<f64>) -> ()
```

### 5.4 Analytics

```rust
get_month_analytics(year: i32, month: u32) -> MonthAnalytics
```

`MonthAnalytics`:
```jsonc
{
  "totals": { "goal": 372, "completed": 277, "left": 95, "pct": 0.744 },
  "per_habit": [
    { "habit_id": 1, "name": "Gym", "icon": "💪",
      "goal": 31, "actual": 24, "left": 7, "pct": 0.77 }
  ],
  "top_habits": [ { "rank": 1, "habit_id": 9, "name": "Stretching", "pct": 0.93 } ],
  "daily_progress": [ { "day": 1, "pct": 0.66 }, ... ]
}
```

Aggregation rules:
- `goal` per habit = `monthly_goal` if set, else days-in-month.
- `actual` = count of `completed=1` entries in that month for the habit.
- `left = max(goal - actual, 0)`, `pct = actual / goal` (guard divide-by-zero → 0).
- `totals.goal = Σ goal`, `totals.completed = Σ actual`.
- `top_habits` = habits sorted by `pct` desc (ties by `actual` desc), take top 10.

### 5.5 Data management

```rust
export_database(dest_path: String) -> ()      // copy SQLite file
import_database(src_path: String) -> ()       // validate schema, replace, reload
export_month_csv(year, month, dest_path) -> ()
```

---

## 6. Frontend (Angular)

### 6.1 Views / routes

| Route | View | Purpose |
|---|---|---|
| `/tracker` (default) | **Grid view** | Month grid of habits × days with checkboxes; month selector; inline daily-progress bar row; wellness row. |
| `/analytics` | **Dashboard** | Stat tiles (Goal/Completed/Left), overall donut, per-habit analysis table, Top 10 list, daily-progress chart. |
| `/habits` | **Habit manager** | CRUD, reorder (drag), icon/color picker, archive, monthly goal. |
| `/settings` | **Settings** | DB export/import, CSV export, theme, week-start (future). |

### 6.2 Grid view details
- Sticky habit column (left) + sticky day/week header (top).
- Columns visually grouped by week with the `Su Mo Tu We Th Fr Sa` + day-number header.
- Today's column highlighted; clicking a cell calls `toggle_entry` optimistically (signal update),
  reconciles on response.
- Keyboard: arrow keys move focus, `Space`/`Enter` toggles, `Shift+click` fills a range.
- Below grid: **Daily Progress** mini-bars (per day) and **Overall wellness** line (mood + sleep).

### 6.3 State management
- Angular **signals** hold `currentMonth`, `grid`, `analytics`, `habits`.
- A thin `TauriService` wraps `invoke()` with typed methods mirroring §5.
- Optimistic updates on toggle; refetch `get_month_analytics` (debounced) after edits.

### 6.4 Look & feel
- **Dark theme** matching the reference (near-black panels, white text, subtle grid lines,
  accent color per habit). Light theme optional.
- Charts are custom lightweight SVG components:
  - `ProgressBarsComponent` (daily progress),
  - `DonutComponent` (overall %),
  - `WellnessLineComponent` (mood + sleep dual series),
  - `AnalysisTableComponent` (goal/actual/left/progress/%).

---

## 7. Project structure

```
habit-maker/
├─ src/                        # Angular app
│  ├─ app/
│  │  ├─ core/tauri.service.ts # invoke() wrappers, typed DTOs
│  │  ├─ core/models.ts        # TS interfaces mirroring Rust DTOs
│  │  ├─ features/tracker/     # grid view + cell + progress + wellness
│  │  ├─ features/analytics/   # tiles, donut, analysis table, top-10
│  │  ├─ features/habits/      # CRUD + reorder
│  │  └─ features/settings/
│  └─ styles/                  # dark theme tokens
├─ src-tauri/
│  ├─ src/
│  │  ├─ main.rs               # Tauri builder, command registration
│  │  ├─ commands/             # thin command handlers (§5)
│  │  ├─ services/             # habits, entries, wellness, analytics logic
│  │  ├─ db/                   # pool, migrations, schema.sql
│  │  ├─ models.rs             # serde DTOs
│  │  └─ error.rs              # AppError
│  ├─ migrations/              # 0001_init.sql, ...
│  ├─ tauri.conf.json
│  └─ Cargo.toml
└─ SPEC.md
```

---

## 8. Key behaviors & edge cases

- **Days in month / week grouping** computed in Rust (`chrono`) so grid header and analytics align;
  leap-year Feb handled automatically.
- **Timezone**: dates are local calendar dates; "today" derived from the OS local time.
- **Deleting a habit** cascades its entries (kept out of analytics). **Archiving** keeps history but
  removes it from the current grid and from `totals.goal` for months where archived.
  - Decision: analytics for a past month use the habits/goals **as they are now** (v1 simplification).
    A future version may snapshot goals per month.
- **Empty month**: donut/tiles show 0; no divide-by-zero.
- **Untoggle** deletes the entry row (sparse storage).
- **Migrations**: on startup, run pending SQL migrations guarded by `PRAGMA user_version`.
- **First run**: create DB in the Tauri app data dir; seed with the reference habit list as examples
  (optional, behind a "load sample habits" action rather than auto-seeding).

---

## 9. Testing

- **Rust unit tests**: analytics math (goal/actual/left/pct, totals, top-10 ordering), week grouping,
  days-in-month, migration runner. Use an in-memory SQLite DB per test.
- **Rust integration**: command handlers against a temp-file DB.
- **Angular**: `TauriService` mocked; component tests for grid toggle optimism, analytics rendering.
- **E2E (optional)**: Tauri WebDriver / Playwright smoke test — create habit, toggle a cell, see
  analytics update.

---

## 10. Milestones

1. **M1 — Skeleton**: Tauri + Angular boot, SQLite pool + migrations, `list_habits`/`create_habit`.
2. **M2 — Grid**: `get_month_grid`, `toggle_entry`, month selector, dark grid UI, keyboard toggle.
3. **M3 — Analytics**: `get_month_analytics`, tiles, donut, analysis table, top-10, daily bars.
4. **M4 — Wellness**: `set_wellness`, wellness line chart.
5. **M5 — Habit manager**: CRUD, reorder, icon/color, archive, monthly goal.
6. **M6 — Data mgmt & polish**: export/import DB, CSV export, theme, tests, packaging.

---

## 11. Open questions

1. **Week start** — reference starts weeks on **Sunday** (`Su Mo Tu …`). Fixed to Sunday for v1, or
   make configurable?
2. **Per-habit goal** — default to days-in-month ("every day") as observed, or ask the user per
   habit at creation?
3. **Mood scale** — 1–5 numeric assumed; confirm labels/emojis for the mood series.
4. **Historical accuracy** — accept "current goals applied to past months" (v1), or snapshot goals
   per month from the start?
