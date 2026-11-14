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
| `get / post / put / patch / delete "url" ... into name` | simple http requests, see [http](http.md) |
| `fetch "url" into name` | full response with status and headers, see [http](http.md) |
| `stream "url" into chunk { }` | read a response piece by piece, see [http](http.md) |
| `for each x in list { }` | loop over a list or text |
| `while cond { }` / `continue` / `break` | loop while true / skip to the next pass / leave the loop |
| `create` / `copy` / `empty` / `remove element` | build and remove elements, see [dom](dom.md) |
| `tabs` / `accordion` | click-to-show panels, see [dom](dom.md) |
| `test` / `assert` / `trigger` / `run tests` | see [testing](testing.md) |
| `x += 1`, `obj.key = v`, `list[0] = v` | change variables, fields and list items |
| `animate "sel" to { } over 1s` | smooth css animation, see [animation](animation.md) |
| `every 1s { }` / `after 1s { }` / `cancel t` | timers, see [timers](timers.md) |
| `save v as "key"` / `forget "key"` / `clear storage` | localStorage, see [storage](storage.md) |
| `import a, b from "file"` / `export fn` | share code between files, see [modules](modules.md) |
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

`repeat` has no counter variable. Use `break` to leave early. To walk through a list use `for each`, or make your own counter with `let` outside and `i += 1` inside.

## for each

```nobelium
for each name in ["ann", "bo", "cy"] {
  log "hello {name}"
}
```

See [strings, lists and objects](strings-and-data.md#looping-over-a-list).

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

## http

`get`, `post`, `put`, `patch`, `delete`, `fetch` and `stream` have their own page: [http requests, fetch and streaming](http.md).

## assignment

```nobelium
score = score + 1
score += 1
user.name = "sam"
items[0] = "first"
```

`x += 1` is short for `x = x + 1` (and `-=` for subtracting). The target can be a variable, an object field or a list position. See [strings, lists and objects](strings-and-data.md#changing-things-assignment).

## stop

See [events](events.md#cancelling-the-default-action).

## log

```
log "clicked"
log count
```

Prints to the browser console (or the playground console).
