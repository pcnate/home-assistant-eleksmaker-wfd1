# EleksWFD Monitor

A Windows system monitoring agent that reads hardware sensor data from [AIDA64](https://www.aida64.com/) and pushes it to [Home Assistant](https://www.home-assistant.io/). Designed to drive an [EleksWFD](https://eleksmaker.com/) LED desktop clock/display via an ESP32 running ESPHome.

## Features

- Reads 13+ system metrics via WMI (CPU, GPU, RAM, disk, battery, power state)
- Pushes changed values to Home Assistant REST API
- Interactive TUI with real-time stats, log panel, and configurable refresh interval
- System tray launcher with automatic connectivity management
- Standalone `.exe` -- no runtime dependencies
- Cross-compiled to Windows via Docker (no local Rust toolchain needed)

## Requirements

- Windows 10/11
- [AIDA64](https://www.aida64.com/) running with WMI sensor sharing enabled
- [Home Assistant](https://www.home-assistant.io/) instance with a [long-lived access token](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-tokens)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for building from source)

## Installation

### From Release

Download the latest release from [GitHub Releases](../../releases) and run the installer, or place the executables manually.

### From Source

```bash
npm install
npm run build
```

This builds both `eleks-monitor.exe` and `eleks-tray.exe` inside Docker and outputs them to `dist/`.

## Configuration

Create a `.env` file in the same directory as the executable:

```env
MACHINE_NAME=my_desktop
HA_URL=http://192.168.1.100:8123/api/states/
HA_TOKEN=your_long_lived_access_token
```

| Variable | Description | Default |
|----------|-------------|---------|
| `MACHINE_NAME` | Prefix for all HA entity IDs | System hostname |
| `HA_URL` | Home Assistant REST API base URL | `http://localhost:8123/api/states/` |
| `HA_TOKEN` | Long-lived access token | (required) |

## Usage

### TUI Mode

```bash
eleks-monitor.exe
```

Interactive terminal interface with live sensor data, log output, and settings.

| Key | Action |
|-----|--------|
| `p` / `Space` | Pause/resume |
| `s` | Open settings (refresh interval) |
| `q` / `Ctrl+C` | Quit (sends zeros to HA) |

### Daemon Mode

```bash
eleks-monitor.exe -d
```

Headless operation. Logs to stdout and `run.log`. Exits after 60s of consecutive HA failures.

### System Tray

```bash
eleks-tray.exe
```

Runs in the system tray with no console window. Automatically starts/stops the daemon based on Home Assistant connectivity.

| Icon Color | State |
|------------|-------|
| Green | Connected, daemon running |
| Orange | HA unreachable, daemon stopped |
| Gray | Disabled by user |

## Home Assistant Entities

The monitor creates sensors in Home Assistant with the naming pattern `sensor.{MACHINE_NAME}_{metric}`:

- `cpu_usage`, `cpu_clock`, `cpu_temp`
- `gpu_usage`, `gpu_temp`
- `ram_usage`
- `disk_activity`, `disk_read_speed`, `disk_write_speed`
- `battery_perc`, `battery_volt`
- `power_state`, `connected`
- `refresh_interval` (configurable, synced between TUI and HA)

## ESP32 Display Component

The `component/` directory contains a custom ESPHome component for the EleksWFD LED clock. It subscribes to the above Home Assistant entities and renders them on a TM1680 24x16 LED matrix with:

- 7-segment clock display (HH:MM:SS)
- 14-segment text display
- CPU/GPU/RAM usage bars
- Status icons and weather indicators
- 7x7 LED matrix for animations

See `CLAUDE.md` for detailed architecture, sensor mappings, and display layout.

## Building the Installer

Requires [Inno Setup](https://jrsoftware.org/isinfo.php) with `iscc` on PATH:

```bash
npm run create-installer
```

Outputs `dist/EleksWFD-Monitor-Setup.exe`.

## License

MIT
