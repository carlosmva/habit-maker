CREATE TABLE habits (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    icon         TEXT    NOT NULL DEFAULT '',
    color        TEXT    NOT NULL DEFAULT '#3b82f6',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    monthly_goal INTEGER,
    archived     INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL
);

CREATE TABLE habit_entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    entry_date TEXT    NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 1,
    UNIQUE (habit_id, entry_date)
);
CREATE INDEX idx_entries_date ON habit_entries(entry_date);
CREATE INDEX idx_entries_habit ON habit_entries(habit_id);

CREATE TABLE wellness (
    entry_date  TEXT PRIMARY KEY,
    mood        INTEGER,
    sleep_hours REAL
);

CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
