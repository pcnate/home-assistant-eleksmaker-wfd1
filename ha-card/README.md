# EleksMaker Lovelace Cards

Custom Lovelace cards for controlling the EleksMaker WFD1 device from Home Assistant.

## Cards

- `eleksmaker-gif-editor` — visual editor for the 7x7 matrix + 12 circle LED animation

## Install (copy to /config/www/)

1. Build the card:
   ```bash
   cd ha-card
   npm install
   npm run build
   ```
2. Copy `ha-card/dist/eleksmaker-gif-editor.js` into your HA config at `/config/www/eleksmaker/`.
3. In HA, go to **Settings → Dashboards → ⋮ → Resources** and add:
   - URL: `/local/eleksmaker/eleksmaker-gif-editor.js`
   - Type: **JavaScript Module**
4. Add the card to a dashboard:
   ```yaml
   type: custom:eleksmaker-gif-editor
   entity: input_text.eleksmaker_gif
   title: Matrix Animation   # optional
   ```

## Install (HACS custom repository)

1. In HACS → **Frontend** → ⋮ → **Custom repositories**.
2. Add your repo URL, category **Lovelace**.
3. Install `EleksMaker WFD Cards`.
4. Add the resource and card as above.

The `hacs.json` points at the prebuilt `dist/eleksmaker-gif-editor.js`; commit that file after building so HACS users can install without a build step.

## Development

```bash
cd ha-card
npm install
npm run dev     # rebuild on changes
```

Then symlink or copy `dist/eleksmaker-gif-editor.js` into your HA `/config/www/eleksmaker/` and reload the dashboard (Ctrl+F5) after each rebuild.

## Encoding

The editor reads and writes the `input_text.eleksmaker_gif` entity using the same 11-char-per-frame format documented in `animations.md`:
- 6 bits per char (`charCode - 0x30`, range `0`-`o`)
- Bits 0-48: 7x7 matrix, row-major
- Bits 49-60: 12 circle LEDs
- Bits 61-62: timing preset (50/100/200/500ms)
