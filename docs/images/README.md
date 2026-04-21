# docs/images

Screenshots and GIFs referenced by the top-level `README.md`.

## Animated GIFs

Generate a GIF from the current HA animation string with:

```bash
npm run render:gif                    # → docs/images/animation.gif
npm run render:gif -- heartbeat       # → docs/images/heartbeat.gif
npm run render:gif -- --name=spin     # → docs/images/spin.gif
npm run render:gif -- --preset=3      # render a preset slot instead of the live GIF
```

Source + canvas details live in `bin/render-gif.ts`.

## Screenshots

Capture these manually and drop them in here with these filenames for the README to pick up:

| File | Content |
|------|---------|
| `ha-helpers.jpg` | HA **Settings → Devices & services → Helpers**, filtered to "eleks" |
| `esphome-dashboard.jpg` | HA's ESPHome add-on page showing the device |
| `card-editor.jpg` | The Lovelace card in a dashboard with a sample animation |
| `editor-frames.jpg` | Editor mid-edit with frame nav + preset picker visible |
| `monitor-tui.jpg` | `eleks-monitor.exe` TUI with live sensor values |
| `logo-slide.jpg` | Device mid-animation — ELEKSMAKER letters partially revealed |

Keep screenshots ~800-1200 px wide, ≤500 KB each (JPEG or WebP).
