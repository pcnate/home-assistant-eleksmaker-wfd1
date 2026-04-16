# EleksWFD WFD1 for Home Assistant

Full stack for driving an [EleksWFD WFD1](https://eleksmaker.com/) LED display from Home Assistant: a Windows system-monitor agent that pushes sensor data, an ESP32 ESPHome component that renders it on the 24×16 TM1680 LED matrix, and a Lovelace card for editing the animations visually.

![Matrix animation](docs/images/wow.gif) ![Snake animation](docs/images/snake.gif) ![Another animation](docs/images/wow2.gif)

## Table of Contents

- [What this provides](#what-this-provides)
- [Architecture](#architecture)
- [Setup](#setup)
  - [1. Home Assistant helpers](#1-home-assistant-helpers)
  - [2. ESP32 firmware](#2-esp32-firmware)
  - [3. Lovelace card (HACS)](#3-lovelace-card-hacs)
  - [4. Windows system monitor](#4-windows-system-monitor)
- [Usage](#usage)
  - [Matrix animation editor](#matrix-animation-editor)
  - [Upper text / date fallback](#upper-text--date-fallback)
  - [Lower text / clock fallback](#lower-text--clock-fallback)
  - [Logo animation + flicker](#logo-animation--flicker)
  - [Presets](#presets)
  - [Clear-after animations](#clear-after-animations)
- [Animation encoding](#animation-encoding)
- [npm scripts reference](#npm-scripts-reference)
- [Development](#development)
- [License](#license)

## What this provides

| Component | Location | Purpose |
|-----------|----------|---------|
| **Windows monitor** | `src/main.rs`, `src/tray.rs` | Reads AIDA64 metrics and pushes to HA |
| **ESPHome component** | `components/elekswfd/` | Firmware driving the TM1680 LED matrix |
| **Lovelace card** | `ha-card/` | Visual GIF editor with presets |
| **Helper scripts** | `bin/` | One-shot HA helper creation, set animation strings |

## Architecture

```
┌────────────────┐                        ┌──────────────────┐
│ AIDA64 (WMI)   │─ eleks-monitor.exe ───▶│ Home Assistant   │
└────────────────┘                        │                  │
┌────────────────┐                        │  input_text.*    │◀── Lovelace card
│ Lovelace card  │─── HA WebSocket API ──▶│  input_number.*  │
└────────────────┘                        │  input_boolean.* │
                                          │                  │
                                          │  ESPHome API     │─── ESPHome device
                                          └──────────────────┘           │
                                                                          ▼
                                                                  ┌──────────────┐
                                                                  │ ESP32 + LEDs │
                                                                  └──────────────┘
```

---

## Setup

### 1. Home Assistant helpers

The device reads animation data, text, and settings from HA helper entities. Create them all in one go:

```bash
cp .env.example .env   # fill in HA_URL and HA_TOKEN
npm install
npm run create:helpers
```

This creates:
- `input_text.eleksmaker_gif` — matrix animation string
- `input_text.eleksmaker_logo` — logo animation string
- `input_text.eleksmaker_upper` / `_lower` — text for the 14-segment / 7-segment digits
- `input_text.eleksmaker_gif_preset_1` … `_10` — 10 preset slots
- `input_number.eleksmaker_logo_flicker` — global flicker rate (Hz, 0-100)
- `input_boolean.eleksmaker_gif_clear_after` — one-shot "play once then clear" trigger

> _Screenshot: HA helpers list after running create:helpers_
> ![HA Helpers](docs/images/ha-helpers.jpg)

### 2. ESP32 firmware

Copy the example YAML and fill in your secrets:

```bash
cp eleksmaker-home.example.yaml eleksmaker-home.yaml
# edit device name, api key, and secrets.yaml as needed
```

Compile and upload:

```bash
npm run build:esphome     # compiles in Docker
npm run upload:esphome    # OTA upload to ESPHOME_DEVICE_IP from .env
```

Alternatively, paste the YAML into HA's ESPHome add-on and flash from there.

> _Screenshot: ESPHome dashboard showing the compiled device_
> ![ESPHome Dashboard](docs/images/esphome-dashboard.jpg)

### 3. Lovelace card (HACS)

**Option A — HACS**

1. HACS → **Dashboard** → ⋮ → **Custom repositories**
2. URL: this repo, category **Dashboard**
3. Install **EleksMaker WFD Cards**
4. Settings → Dashboards → ⋮ → Resources → Add `/hacsfiles/home-assistant-eleksmaker-wfd1/eleksmaker-gif-editor.js` as a JavaScript Module

**Option B — Manual**

1. `cd ha-card && npm install && npm run build`
2. Copy `dist/eleksmaker-gif-editor.js` to `/config/www/eleksmaker/`
3. Add `/local/eleksmaker/eleksmaker-gif-editor.js` as a dashboard resource

Add the card to any dashboard:

```yaml
type: custom:eleksmaker-gif-editor
entity: input_text.eleksmaker_gif
```

> _Screenshot: the card rendered in a dashboard with a sample animation loaded_
> ![Lovelace Card](docs/images/card-editor.jpg)

### 4. Windows system monitor

Optional — only needed if you want CPU/GPU/RAM/temp sensors pushed to the device.

Install the signed Windows installer from [GitHub Releases](../../releases), or build from source:

```bash
npm run build              # Docker build
npm run create-installer   # Inno Setup (requires iscc on PATH)
```

Fill in `.env`:

```env
MACHINE_NAME=my_desktop
HA_URL=http://192.168.1.100:8123/api/states/
HA_TOKEN=your_long_lived_access_token
```

Run via the system tray (`eleks-tray.exe`) or directly:

| Mode | Command | Description |
|------|---------|-------------|
| TUI | `eleks-monitor.exe` | Interactive terminal with live sensors + log |
| Daemon | `eleks-monitor.exe -d` | Headless, logs to `run.log` |
| Tray | `eleks-tray.exe` | Auto-connects when HA is reachable |

> _Screenshot: the TUI showing live sensor values_
> ![Monitor TUI](docs/images/monitor-tui.jpg)

---

## Usage

### Matrix animation editor

The Lovelace card lets you draw frame-by-frame animations on the 7×7 matrix plus the 12 surrounding circle LEDs.

- Click cells to toggle. The frame count/timing are in the header.
- **Save to HA** pushes the encoded string to `input_text.eleksmaker_gif` — the device picks it up instantly via the ESPHome native API.
- **Reload from HA** pulls whatever's currently set.
- The **Clear after last frame** checkbox bakes a one-shot flag into the animation: the device plays it once and blanks instead of looping.

> _Screenshot: editor mid-edit with 4 frames_
> ![Editor Frames](docs/images/editor-frames.jpg)

### Upper text / date fallback

`input_text.eleksmaker_upper` drives the six 14-segment digits.

- Any non-blank string is rendered; text longer than 6 chars scrolls left at 300 ms/step.
- Empty or all-spaces → firmware falls back to showing the date as `MMM DD` (e.g. `APR 16`, `MAR  1`).

```bash
npm run set:upper -- HELLO WORLD
npm run set:upper                 # empty = date mode
```

### Lower text / clock fallback

`input_text.eleksmaker_lower` drives the six 7-segment digits.

- Any non-blank string overrides the clock and hides the colons.
- Empty → shows the clock (HH:MM:SS).

```bash
npm run set:lower -- HI
npm run set:lower                 # empty = clock mode
```

### Logo animation + flicker

- `input_text.eleksmaker_logo` — per-frame logo animation (2×13 LED area spelling "ELEKSMAKER"), 5 chars per frame.
- `input_number.eleksmaker_logo_flicker` — **flicker rate in Hz** (0-100). Random lit LEDs briefly blink off to simulate a loose connection. 0 disables.

> _Screenshot: logo mid-slide-in_
> ![Logo Slide](docs/images/logo-slide.jpg)

### Presets

Ten persistent preset slots let you save animations for later recall or automation use.

- Use the **Presets** row in the card: pick a slot, click **Save** / **Load** / **Clear**.
- Each slot is its own `input_text.eleksmaker_gif_preset_N` entity, so Node-RED / automations can load one directly:

```yaml
service: input_text.set_value
data:
  entity_id: input_text.eleksmaker_gif
  value: "{{ states('input_text.eleksmaker_gif_preset_3') }}"
```

### Clear-after animations

Two ways to "play once and clear":

- **Per-animation** — check **Clear after last frame** in the editor. A bit is baked into frame 0 of the GIF.
- **Global one-shot** — turn on `input_boolean.eleksmaker_gif_clear_after`. The device plays the current animation once, blanks the matrix, clears `input_text.eleksmaker_gif` (so pushing the same string re-triggers), and turns the boolean back off.

Both are additive — either will trigger the behavior.

---

## Animation encoding

Both GIF and logo strings use a **6-bit-per-char** encoding. Each character's value = `charCode - 0x30`, valid range `'0'` (0x30) through `'o'` (0x6F). No non-printable bytes, so everything fits in HA's 255-char `input_text` limit and survives JSON / UTF-8 round-trips.

### GIF frames — 11 chars each

| Bits | Meaning |
|------|---------|
| 0-48 | 7 × 7 matrix, row-major |
| 49-60 | 12 circle LEDs |
| 61-62 | Timing preset (0=50ms, 1=100ms, 2=200ms, 3=500ms) |
| 63 (frame 0 only) | Clear-after-cycle flag |

Maximum 23 frames per animation (`23 × 11 = 253` chars, within the 255 limit).

### Logo frames — 5 chars each

| Bits | Meaning |
|------|---------|
| 0-12 | LOWER row, 13 LEDs |
| 13-25 | UPPER row, 13 LEDs |
| 26-27 | Timing preset |

Up to 51 frames per animation.

---

## npm scripts reference

| Script | Does |
|--------|------|
| `build` | Builds the Windows Rust binaries in Docker |
| `build:esphome` | Compiles ESP32 firmware in Docker |
| `upload:esphome` | OTA-upload firmware to `ESPHOME_DEVICE_IP` |
| `create:helpers` | Creates all HA helpers via WebSocket API (one-time) |
| `update:ha` | Push animations/text/flicker to HA. Flags: `--gif --logo --upper --lower --flicker --all` |
| `set:upper` | Shortcut to set upper text (empty = date mode) |
| `set:lower` | Shortcut to set lower text (empty = clock mode) |
| `show:gif` | Dump the current GIF string from HA; pass `--render` or `--animate [N]` |
| `create-installer` | Build the Windows installer via Inno Setup |

---

## Development

### Project layout

```
bin/                    TypeScript helper scripts (ts-node)
build/                  Docker + Inno Setup build files
components/elekswfd/    ESPHome C++/Python component
ha-card/                Vite-built Lovelace card source
src/                    Rust code for the Windows monitor
animations.md           Animation string format reference
```

### Rebuilding the card

```bash
cd ha-card
npm install
npm run build   # or: npm run dev  (rebuild on changes)
```

CI builds the card on every push to `master` / `main` / `development` and attaches it to the release as `eleksmaker-gif-editor.js`.

### Branches

- `master` / `main` → cuts stable releases (e.g. `v1.0.0`)
- `development` → cuts prereleases (e.g. `v1.0.0-rc.12`)

Stable releases are what HACS picks up in its default mode. Enable "Show beta versions" on the plugin in HACS to consume prereleases.

## License

MIT
