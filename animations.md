# EleksWFD Animation Strings

Current animation strings pushed to Home Assistant entities by `bin/update-ha.ts`. Encoding details: each character contributes 6 bits (value = `char - 0x30`, valid chars `0`-`o`).

## GIF Animation (7x7 matrix + CIRCLE LEDs)

**Entity**: `input_text.eleksmaker_gif`
**Frame size**: 11 chars (49 matrix bits + 12 circle bits + 2 timing bits)
**Frame count**: 7 frames @ 100ms (MEDIUM)
**Total cycle**: 2.8 seconds visual (plays 4x for full 360° rotation)

```
8@Ph?248BB2@`\`7J64TT2`RlQ3OR6893PViQ3?c2BB22<cSSWIPTT268bWcW8`8934HPfg2<@BB2
```

**Behavior**:
- Rotating cross through 7 positions spanning 90° (cross has 90° symmetry, so loops give a continuous 360° rotation effect)
- Each frame step is ~12.86° of rotation
- CIRCLE LEDs show an on-off-off chase rotating clockwise (A → B → C), synchronized with the cross rotation direction
- Since 7 frames mod 3 circle phases ≠ 0, the circle phase drifts across loops for non-repeating visuals

## Logo Animation (2×13 LED logo area)

**Entity**: `input_text.eleksmaker_logo`
**Frame size**: 5 chars (26 LED bits + 2 timing bits)
**Frame count**: 51 frames @ 500ms (SLOWER)
**Total cycle**: 25.5 seconds

```
3020<7060<O0>0<o0N0<o1n0<o7n3<o?n7<oOn?<oono<oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?oooo?lomo?hoio?Poao?0oQo?0n1o?0h1l?0`1h?0P1`?0010?0000<0000<0000<0000<0000<0000<0000<0000<0000<0000<0000<0000<0000<0000<0000<
```

**4 equal states** (~6 seconds each):

| State | Frames | Description |
|-------|--------|-------------|
| Slide in | 12 | Letters E-L-E-K-S-M-A-K-E-R appear one at a time L→R (10 frames), then 2 frames hold all-on |
| Hold on | 15 | All LEDs lit (firmware flicker runs during this state if enabled) |
| Slide out | 12 | Letters disappear one at a time L→R (10 frames), then 2 frames blank |
| Hold off | 12 | All LEDs dark |

**Letter-to-LED mapping** (bits 0-12 = LOWER row, 13-25 = UPPER row, left to right):

| Letter | Bits |
|--------|------|
| E (1st) | 0, 1, 13 |
| L | 2, 14 |
| E (2nd) | 3, 4, 15 |
| K (1st) | 5, 16 |
| S | 6, 17 |
| M | 7, 8, 18, 19 |
| A | 9, 20 |
| K (2nd) | 10, 21 |
| E (3rd) | 11, 22, 23 |
| R | 12, 24, 25 |

## Upper Text (6× 14-segment digits)

**Entity**: `input_text.eleksmaker_upper`
**Value**: `ELEKSMAKER WFD1`

Scrolls left at 300ms per step when text > 6 characters. Overridden by OTA progress ("UPd XX") during firmware upload via the native ESPHome OTA port.

## Lower Text (6× 7-segment digits)

**Entity**: `input_text.eleksmaker_lower`
**Value**: `(empty)`

When empty or all spaces, shows the clock (HH:MM:SS with colons). Any non-blank text overrides the clock and hides the colons.

## Logo Flicker Toggle

**Entity**: `input_boolean.eleksmaker_logo_flicker`
**Value**: `on`

When enabled, firmware randomly turns off 1 currently-lit logo LED with ~15% probability per 50ms tick. LEDs are restored on the next frame render (every 250ms or when the frame advances). Replaces the prior frame-based flicker animation.

## Timing Presets

The 2 timing bits per frame map to:

| Value | Delay | Constant |
|-------|-------|----------|
| 0 | 50ms | FAST |
| 1 | 100ms | MEDIUM |
| 2 | 200ms | SLOW |
| 3 | 500ms | SLOWER |

## Encoding Summary

- Every character encodes 6 bits: `value = charCode - 0x30`
- Valid output chars: `0x30` (`'0'`) through `0x6F` (`'o'`)
- GIF bit layout (per frame): rows 0-48, circle 49-60, timing 61-62
- Logo bit layout (per frame): LEDs 0-25, timing 26-27
