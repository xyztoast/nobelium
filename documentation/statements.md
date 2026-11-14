# Statements

Quick table, details below.

| statement | what it does |
|---|---|
| `show "sel"` / `hide "sel"` / `toggle "sel"` | visibility |
| `fade in "sel"` / `fade out "sel"` | animated visibility |
| `add class "x" to "sel"` | add a css class |
| `remove class "x" from "sel"` | remove a css class |
| `toggle class "x" on "sel"` | add if missing, remove if present |
| `set text "sel" to expr` | change an element's text |
| `set value "sel" to expr` | change an input's value |
| `let x = expr` | create a variable |
| `x = expr` | change a variable |
| `if cond { } else { }` | conditions |
| `repeat n { }` | loop |
| `fn name(a, b) { }` | define a function |
| `return expr` | leave a function or handler |
| `name(args)` | call a function |
| `wait 500ms` | pause |
| `get "url" into name` | http request |
| `stop` | cancel the browser default action |
| `log expr` | print a message |
| `when ...` | see [events](events.md) |

All statements that take a selector apply to **every** matching element. If no element matches, it is an error (see [errors](errors.md)).

## show, hide, toggle

```
show "#panel"
hide ".tip"
toggle "#menu"
```

`hide` sets `display: none`. `show` removes that, and if css is still hiding the element it forces `display: block`. `toggle` checks whether the element is currently visible. Note that `toggle` and `toggle class` are different: `toggle class "open" on "#menu"` is the class version.

## fade

```
fade in "#modal"
fade out "#modal"
```

Takes 0.3 seconds and waits for it to finish before the next statement runs. After `fade out` the element is hidden.

## classes

```
add class "active" to "#tab1"
remove class "active" from "#tab2"
toggle class "dark" on "body"
```

The class name can be any expression, not only a literal.

## set

```
set text "#total" to "Score: " + score
set value "#name" to ""
```

Only `text` and `value` can be set. Text is set as plain text, never as HTML, so user input is safe to display. Non-text values are converted (objects become JSON).

## let and assignment

```
let items = 3
items = items - 1
```

## if / else

```
if score >= 10 {
  set text "#r" to "win"
} else if score >= 5 {
  set text "#r" to "almost"
} else {
  set text "#r" to "keep going"
}
```

Conditions can be any expression. They nest freely.

## repeat

```
repeat 3 {
  log "hi"
}
```

Inside the body you have no counter variable. Make your own with `let` outside and `i = i + 1` inside.

## fn and return

```
fn clamp(n, low, high) {
  if n < low { return low }
  if n > high { return high }
  return n
}
```

A function call can be used as a statement or inside an expression.

## wait

```
wait 500ms
wait 2s
wait delay      // a variable holding milliseconds
```

## get

```
get "https://example.com/api/item" into item
set text "#out" to item.title
```

- Sends a GET request and waits for it.
- If the response is JSON you get an object (read fields with `item.title`), otherwise you get the text.
- The server must allow cross-origin requests (CORS) unless it is on the same site.
- A failed request or a non-2xx status is an error for that handler.
- Missing fields read as `null`, not an error.
- The variable is created in the current scope.

## stop

See [events](events.md#cancelling-the-default-action).

## log

```
log "clicked"
log count
```

Prints to the browser console (or the playground console).
