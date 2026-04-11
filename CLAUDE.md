# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EleksWFD is a Windows system monitoring agent written in Rust that reads AIDA64 sensor data via WMI and pushes metrics to Home Assistant. A companion ESP32 ESPHome component (in `component/`) receives the data from HA and drives a TM1680 LED matrix display.

Data flow: `AIDA64 -> WMI -> eleks-monitor.exe -> HTTP POST -> Home Assistant -> ESPHome -> EleksWFD Display`

## Build & Run

All Rust compilation happens inside Docker (no local Rust toolchain needed). Cross-compiles to `x86_64-pc-windows-gnu`.

```bash
npm run build              # Docker build, outputs dist/eleks-monitor.exe and dist/eleks-tray.exe
npm start                  # Copy + run TUI mode
npm run start:daemon       # Copy + run daemon mode (headless)
npm run create-installer   # Build Inno Setup installer (requires iscc on PATH)
```

The `start` scripts copy the exe to `eleks-monitor.running.exe` before running so the source exe is never locked and can be overwritten by a rebuild at any time.

## Architecture

### Two Rust Binaries

- **`eleks-monitor`** (`src/main.rs`) -- The main agent. Two modes:
  - **TUI mode** (default): ratatui-based terminal UI with sensor stats, log panel, settings modal. Keys: `p`=pause, `s`=settings, `q`=quit.
  - **Daemon mode** (`-d`): Headless, logs to stdout and `run.log`. Auto-exits after 60s of consecutive HA failures (so the tray launcher can retry).

- **`eleks-tray`** (`src/tray.rs`) -- System tray launcher (`#![windows_subsystem = "windows"]`). Manages daemon lifecycle:
  - Green icon = connected, orange = HA unreachable, gray = disabled by user
  - Checks HA connectivity via TCP every 60s, auto-starts/stops daemon accordingly
  - Spawns daemon with `CREATE_NO_WINDOW` flag

### Rust Module Responsibilities

| Module | Purpose |
|--------|---------|
| `sensors.rs` | WMI query (`Root\WMI/AIDA64_SensorValues`), sensor ID mapping, payload diffing, value formatting |
| `ha.rs` | reqwest HTTP client, `post_to_ha()`, `get_from_ha()`, connectivity check |
| `config.rs` | `.env` loading via dotenvy into `Config` struct |
| `tui_app.rs` | ratatui rendering, stdin-based keyboard input (works through pipes/SSH) |
| `logging.rs` | File + stdout logging with timestamps |

### Key Design Decisions

- **Stdin input over Console API**: The TUI reads keyboard input via a spawned thread reading `stdin` byte-by-byte, not crossterm's `ReadConsoleInput`. This is required for the exe to receive keyboard events when launched through process managers.
- **Sentinel-based first send**: `SensorPayload::sentinel()` initializes with `NaN` values so all metrics are guaranteed to POST on the first cycle (since `NaN != NaN`).
- **Refresh interval synced to HA**: Stored as `sensor.{MACHINE_NAME}_refresh_interval`. Created with default 333ms if missing. Checked every 5s for external changes. TUI settings pushes changes to HA.
- **Shutdown sends zeros**: On graceful exit, all metrics are POSTed as zero so HA/display knows the PC is offline. Not attempted during auto-exit on HA failure.

### ESPHome Component (`component/`)

C++/Python code for ESP32. Not part of the Rust build. Drives a TM1680 24x16 LED matrix via I2C (addr `0x73`) with DS3231 RTC (addr `0x68`). The display has 384 LEDs mapped to `display_elements[24*16]`: 7-segment clock digits, 14-segment text, CPU/GPU/RAM horizontal bars (20 LEDs each), vertical bar charts (12 LEDs each), status icons, weather indicators, 7x7 matrix for GIF animations, and a 2x13 logo area. `updateExternals()` runs every 133ms to read HA sensor entities and update the display.

### AIDA64 Sensor Mapping

| Metric | AIDA64 ID | HA Entity Suffix | Unit |
|--------|-----------|------------------|------|
| CPU Usage | `SCPUUTI` | `cpu_usage` | % |
| CPU Clock | `SCPUCLK` | `cpu_clock` | % of max observed |
| CPU Temp | `TCPU` | `cpu_temp` | C |
| GPU Usage | `SGPU1UTI` | `gpu_usage` | % |
| GPU Temp | `TGPU1` / `TGPU1HOT` | `gpu_temp` | C (max of both) |
| RAM Usage | `SMEMUTI` | `ram_usage` | % |
| Disk Activity | `SDSK1ACT` | `disk_activity` | % |
| Disk Read Speed | `SDSK1READSPD` | `disk_read_speed` | MB/s |
| Disk Write Speed | `SDSK1WRITESPD` | `disk_write_speed` | MB/s |
| Battery % | `SBATTLVL` | `battery_perc` | % |
| Battery Voltage | `VBATT` | `battery_volt` | V |
| Power State | `SPWRSTATE` | `power_state` | string |
| Connected | (synthetic) | `connected` | 0/1 |
| Refresh Interval | (settings) | `refresh_interval` | ms |

## Configuration

`.env` file in project root (not committed):
```
MACHINE_NAME=your_machine_name
HA_URL=http://your-home-assistant:8123/api/states/
HA_TOKEN=your_long_lived_access_token
```

The exe checks `.env` in cwd and `../.env` (for when running from `dist/`).

## Release Process

- **master/main**: Stable releases via semantic-release
- **development**: RC candidates (e.g., `1.1.0-rc.1`)
- GitHub Actions builds in Docker, attaches both exes to the release
- Uses `GITHUB_TOKEN` (no custom secrets). Branch protection must allow `github-actions[bot]` to bypass for version commit pushback.

## Installer

Inno Setup script at `build/setup.iss`. Prompts for Machine Name, HA URL, and Token (pre-fills from existing `.env` on upgrade). Options for system tray auto-start on login and adding to PATH. Kills running processes before installing.
