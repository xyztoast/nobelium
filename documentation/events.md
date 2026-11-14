# Events

```nobelium
when EVENT "selector" {
  log "happened"
}
```

The listener is attached to the whole page and checks whether the event happened on (or inside) an element matching the selector. This means:

- elements added to the page later still work
- many listeners on the same element are fine, they all run
- clicking a child inside a matching element counts as clicking the element
- events that do not normally bubble (`focus`, `blur`, `scroll`, ...) work too

## Event list

| written as | fires when | selector |
|---|---|---|
| `click` | element clicked | yes |
| `dblclick` (or `doubleclick`) | double click | yes |
| `rightclick` | context menu (right click) | yes |
| `hover` / `leave` | pointer moves onto / off the element | yes |
| `mousedown` (`press`) / `mouseup` (`release`) | button pressed / let go | yes |
| `mousemove` | pointer moves over the element | yes |
| `input` | typing or changing an input | yes |
| `change` | an input's value is committed | yes |
| `focus` / `blur` | element gets / loses focus | yes |
| `submit` | a form is submitted | yes |
| `keypress` | any key pressed (`when keypress { }`) | no |
| `keyup` | any key released | no |
| `key "Escape"` | one specific key or key combo, anywhere | the key goes where the selector goes |
| `scroll` | the page (no selector) or a scrollable element (with selector) scrolls | optional |
| `resize` | the window is resized | no |
| `online` / `offline` | internet connection comes back / drops | no |
| `hashchange` | the `#part` of the address changes | no |
| `visibilitychange` | the tab is shown or hidden | no |
| `copy` / `cut` / `paste` | clipboard actions | optional |
| `dragover` / `drop` | drag and drop | optional |
| `touchstart` / `touchend` | touch screens | optional |
| `load` | runs right away when the block starts | no |

Any other browser event name also works as long as the browser reports it on the page. `hover` and `leave` ignore moves between an element's own children so they do not flicker.

## Key combos

`key` takes a key name, optionally with modifiers joined by `+`:

```nobelium
when key "Escape" { hide "#modal" }
when key "Enter" { log "enter" }
when key "ctrl+s" {
  stop
  log "saving"
}
when key "ctrl+shift+z" { log "redo" }
```

- Modifiers: `ctrl`, `shift`, `alt`, `meta` (`cmd` also works for the Mac command key).
- Letters ignore capitalization. Other keys use the browser's names with exact capitalization: `"Escape"`, `"Enter"`, `"ArrowUp"`, `"Tab"`, `" "` (space).
- Modifiers must match: `key "s"` does **not** fire when ctrl is held, and `key "ctrl+s"` only fires when ctrl is held. Shift is only checked when you write it.
- To find a key name, run `when keypress { log event.key }` and press it.

## The `event` object

Inside a handler (and timer blocks), `event` has these fields. Fields that do not apply to that kind of event are `null`.

| field | meaning |
|---|---|
| `event.type` | the event name you wrote, like `"click"` |
| `event.key` | the key pressed |
| `event.value` | the `.value` of the matched element (inputs) |
| `event.text` | the text inside the matched element |
| `event.x`, `event.y` | pointer position in the window (mouse events) |
| `event.ctrl`, `event.shift`, `event.alt`, `event.meta` | true while that key is held |
| `event.scroll` | how far the page is scrolled down, in pixels |

```nobelium
when input "#search" {
  set text "#count" to "{len(event.value)} characters"
}

when scroll {
  if event.scroll > 400 { show "#to-top" } else { hide "#to-top" }
}
```

## Cancelling the default action

`stop` cancels what the browser would normally do (a form reloading the page, a link navigating, ctrl+s opening the save dialog). Put it near the top of the handler, before any `wait`, `get` or `fetch`, because the browser only allows cancelling right away.

```nobelium
when submit "#form" {
  stop
  log "handled by nobelium"
}
```

`stop` does not end the handler. Use `return` for that.

## Several listeners, errors, and ordering

- Listeners run in the order they were created.
- An error in one handler is reported and stops only that handler run. Other handlers and later events still work.
- Handlers can overlap if they `wait` or `get`. Two quick clicks while a handler is waiting will run two copies at once.
- For things that happen on a schedule instead of an event, see [timers](timers.md).
