<p align="center">
  <img src="images/logo-banner.png" alt="Habit Maker" width="480" />
</p>

<h1 align="center">Habit Maker</h1>

<p align="center">
  An offline-first desktop habit tracker — monthly grid, daily progress, and analytics in one place.
</p>

<p align="center">
  <a href="https://v2.tauri.app/"><img src="https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white" alt="Tauri 2" /></a>
  <a href="https://angular.dev/"><img src="https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white" alt="Angular 22" /></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-backend-000000?logo=rust&logoColor=white" alt="Rust" /></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite&logoColor=white" alt="SQLite" /></a>
</p>

---

## Overview

**Habit Maker** is a single-user, cross-platform desktop app for tracking daily habits across a calendar month and reviewing progress through built-in analytics. Everything is stored locally in SQLite — no accounts, no network, no sync.

The core loop:

1. Define habits (name + emoji icon, optional monthly goal).
2. Check off completed habits each day in a month grid.
3. Log daily wellness (mood and hours of sleep).
4. Review progress with daily bars, completion stats, wellness charts, and a top-habits ranking.

## Features

| Area | What you get |
|------|--------------|
| **Monthly grid** | Habits as rows, days as columns grouped by week; toggle checkboxes to mark completion |
| **Daily progress** | Per-day bar chart showing % of habits completed |
| **Wellness tracking** | Mood and sleep logged per day, visualized as a line chart |
| **Analytics** | Overall completion donut, goal / completed / left stats, per-habit analysis table, top 10 habits |
| **Habit management** | Create, edit, reorder, archive habits; set monthly targets |
| **Data ownership** | Export / import the SQLite database; export any month as CSV |

## Tech stack

| Layer | Technology |
|-------|------------|
| Shell | [Tauri 2](https://v2.tauri.app/) |
| Frontend | [Angular 22](https://angular.dev/) (standalone components, signals) |
| Backend | Rust (Tauri commands + services) |
| Database | SQLite via `rusqlite` (offline-first, local file) |
| Charts | Custom SVG components |

Angular calls typed Tauri commands; Rust owns persistence, validation, and all aggregation logic. See [SPEC.md](./SPEC.md) for the full product and technical specification.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **v22.22.3+** (required by Angular 22)
- [Rust](https://rustup.rs/) (for the Tauri backend)
- Platform-specific [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) (WebView2 on Windows, etc.)

### Install and run

```bash
git clone https://github.com/YOUR_USERNAME/habit-maker.git
cd habit-maker
npm install
npm run tauri:dev
```

### Production build

```bash
npm run tauri:build
```

Installers and binaries are written to `src-tauri/target/release/bundle/`.

## Project layout

```
habit-maker/
├── src/                 # Angular frontend
│   └── app/
│       ├── features/    # Tracker, analytics, habits, settings views
│       ├── shared/      # Charts, month selector, analysis table
│       └── core/        # Tauri service, models, utilities
├── src-tauri/           # Rust backend (commands, services, migrations)
├── images/              # Brand assets (logo banner)
├── reference/           # Reference frames from the original design
└── SPEC.md              # Product & technical specification
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri:dev` | Start Angular dev server + Tauri app |
| `npm run tauri:build` | Build frontend and create desktop bundles |
| `npm run start` | Angular dev server only (port 1420) |
| `npm run build` | Production Angular build |

## Roadmap (v1 scope)

- ✅ Monthly habit grid with checkbox tracking
- ✅ Daily progress and wellness charts
- ✅ Analytics dashboard
- ✅ Habit CRUD, reorder, archive, monthly goals
- ✅ Database export/import and CSV export
- ⬜ Reminders / notifications (future)
- ⬜ Cloud sync or multi-user (out of scope for v1)

## Contributing

Contributions are welcome. Please open an issue to discuss larger changes before submitting a pull request.

## License

License not yet specified. See repository settings or add a `LICENSE` file when ready.
