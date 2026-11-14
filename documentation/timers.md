# Timers

| statement | what it does |
|---|---|
| `every 1s { ... }` | run a block again and again |
| `after 2s { ... }` | run a block once, later |
| `every 1s as name { ... }` | same, and keep the timer in `name` so it can be stopped |
| `cancel name` | stop a timer |

Durations are numbers in milliseconds, or use the `ms` / `s` suffixes: `500ms`, `1s`, `2.5s`.

```nobelium
after 3s {
  hide "#welcome-banner"
}
```

## A countdown

```nobelium
let left = 10
every 1s as tick {
  left -= 1
  set text "#clock" to "{left}"
  if left == 0 {
    cancel tick
    set text "#clock" to "done!"
  }
}
```

## Start / stop button

```nobelium
let running = null

when click "#toggle" {
  if running == null {
    every 1s as t { log "tick" }
    running = t
  } else {
    cancel running
    running = null
  }
}
```

## Rules

- A timer block runs in a fresh scope each time, like an event handler. It can read and change variables from where it was created. Put counters outside the block.
- `every` has a minimum interval of 16 ms.
- Timers keep running even if the previous run has not finished (for example the block contains a `wait`). Use a flag if you need to avoid overlap.
- Timers can be created anywhere: at the top of a block, inside `when` handlers, or inside other timers.
- `cancel` on a timer that already ended (or on a value that is not a timer) does nothing.
- If an error happens inside a timer block, it is reported and the timer keeps going. Cancel it yourself if it should stop.
- `event.type` inside the block is `"every"` or `"after"`.
- For a simple pause inside a handler, use `wait` instead (see [statements](statements.md#wait)).
