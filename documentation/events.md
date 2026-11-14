# Events

```
when EVENT "selector" { ... }
```

The listener is attached to the whole page and checks whether the event happened on (or inside) an element matching the selector. This means:

- elements added to the page later still work
- many listeners on the same element are fine, they all run
- clicking a child inside a matching element counts as clicking the element

## Event list

| written as | fires when | needs selector |
|---|---|---|
| `click` | element is clicked | yes |
| `hover` | pointer moves onto the element | yes |
| `leave` | pointer moves off the element | yes |
| `input` | typing or changing an input | yes |
| `change` | an input's value is committed | yes |
| `submit` | a form is submitted | yes |
| `keypress` | any key is pressed | no (`when keypress { }`) |
| `key "Escape"` | one specific key is pressed, anywhere | the key name goes where the selector goes |
| `load` | runs immediately when the block starts | no (`when load { }`) |

`hover` and `leave` ignore moves between the element's own children, so they do not flicker.

Any other name is passed to the browser as a DOM event name, but only events that bubble work (`click`, `input`, `change`, `submit`, `keydown`, `keyup`, `mouseover`, ...). Events that do not bubble, like `focus` and `blur`, do not fire.

## Key names

Use the browser's key names, with exact capitalization: `"Escape"`, `"Enter"`, `"ArrowUp"`, `"ArrowDown"`, `"a"`, `" "` (space). To find a name, log it:

```
when keypress {
  log event.key
}
```

## The `event` object

Inside a handler, `event` has these fields:

| field | meaning |
|---|---|
| `event.type` | the event name you wrote, like `"click"` |
| `event.key` | the key pressed, or `null` for non-keyboard events |
| `event.value` | the `.value` of the matched element (inputs), or `null` |
| `event.text` | the text content of the matched element |

```
when input "#search" {
  set text "#count" to len(event.value)
}
```

## Cancelling the default action

`stop` cancels what the browser would normally do (a form reloading the page, a link navigating). Put it near the top of the handler, before any `wait` or `get`, because the browser only allows cancelling right away.

```
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
