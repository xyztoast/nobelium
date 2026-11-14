# Animation

`animate` moves any CSS property smoothly from one value to another, using the browser's Web Animations feature.

```nobelium
animate "#box" to { opacity: 0.4, width: 200 } over 600ms
```

Shape: `animate "selector" [from {...}] [to {...}] [over D] [ease E] [delay D] [times N] [nowait]`

| part | meaning | default |
|---|---|---|
| `to { css }` | where to end up | (required, unless you use a preset or `from`) |
| `from { css }` | where to start. Without it the animation starts from how the element looks now | current look |
| `over 600ms` | how long it takes | `400ms` (`600ms` for presets) |
| `ease "ease-in-out"` | any CSS easing: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier(...)` | `ease` |
| `delay 200ms` | wait before starting | none |
| `times 3` | repeat count (up to 100) | `1` |
| `nowait` | start it and go on to the next statement right away | wait until finished |

The clauses can come in any order, on one line or several.

## CSS values

- Property names can be camelCase (`backgroundColor`) or CSS names in quotes (`"background-color"`).
- A plain number gets `px` added: `width: 200` means `200px`. Unitless properties (`opacity`, `zIndex`, `lineHeight`, `fontWeight`, `order`, `flexGrow`, `flexShrink`, `scale`, `zoom`) stay as they are.
- Anything else must be text: `left: "50%"`, `transform: "rotate(45deg) scale(1.2)"`, `color: "tomato"`.
- Animating needs a start value the browser understands, so give position properties like `left` a starting value in your css (`position: relative; left: 0`).

When the animation ends, the final values stay on the element (they are written to its style), so it does not jump back.

## Presets

```nobelium
animate "#button" shake
animate "#heart" pulse times 3
animate "#logo" spin over 2s
```

| preset | looks like |
|---|---|
| `shake` | side to side, good for errors |
| `pulse` | grows and shrinks once |
| `bounce` | hops up and down |
| `spin` | one full turn |
| `flash` | blinks |
| `wobble` | small rocking |

Presets return the element to how it was when they finish.

## Several things at once

Every element matching the selector animates together. To run different animations at the same time, use `nowait` on all but the last:

```nobelium
animate "#a" to { left: 300 } over 1s nowait
animate "#b" to { left: 300 } over 2s nowait
animate "#c" to { left: 300 } over 3s
log "all three finished"
```

## Chaining

Without `nowait`, each `animate` waits for the one before:

```nobelium
animate "#box" to { left: 200 } over 400ms
animate "#box" to { top: 100 } over 400ms
animate "#box" spin
```

## Notes

- Very old browsers without Web Animations skip the motion and just jump to the final values.
- `fade in` / `fade out` are shortcuts for simple opacity changes (see [statements](statements.md#fade)).
