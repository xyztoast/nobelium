# Strings, lists and objects

## Text and interpolation

Text in **double quotes** can hold expressions inside `{ }`. They are worked out and joined into the text:

```nobelium
let name = "sam"
let items = 3
set text "#msg" to "hi {upper(name)}, you have {items + 1} items"
```

- Any expression works inside the braces: variables, math, function calls, fields (`{user.name}`), list positions (`{xs[0]}`), even other strings (`{join(tags, ", ")}`).
- Selectors can be built the same way: `show "#item-{id}"`.
- Write `\{` for a literal brace: `"use \{curly\} braces"`.
- Text in **single quotes** is never interpolated, so `'{name}'` is exactly those six characters. Use it for text full of braces, like JSON.
- Values are converted to text for you. Lists and objects become JSON, `null` becomes `null`.
- Escapes: `\n` new line, `\t` tab, `\"` quote, `\\` backslash.

## Lists

```nobelium
let colors = ["red", "green", "blue"]
log colors[0]          // red
log colors[-1]         // blue (negative counts from the end)
colors[1] = "lime"     // change an item
push(colors, "pink")   // add to the end
log len(colors)        // 4
```

- Positions start at `0`. A position that does not exist reads as `null`.
- You can set a position from `0` up to the current length (setting the length adds a new item). Anything further is an error.
- Text can be indexed too: `"abc"[1]` is `"b"`.
- `item(list, i)` still works and does the same as `list[i]` for positive `i`.

## Objects

```nobelium
let user = { name: "sam", "favorite-color": "teal", age: 9 }
log user.name                  // sam
log user["favorite-color"]     // teal
user.age += 1                  // change a field
user.city = "Lima"             // add a field
log keys(user)                 // ["name","favorite-color","age","city"]
```

- Keys are names or text. Use text (and `[ ]`) for keys with dashes or spaces.
- Reading a missing field gives `null`. Reading a field of something that is not an object (like `null`) is an error.
- `__proto__`, `constructor` and `prototype` cannot be used as keys.
- Lists and objects are shared, not copied: `let b = a` makes `b` the same list.

## Changing things: assignment

| form | meaning |
|---|---|
| `x = expr` | change a variable |
| `x += expr` / `x -= expr` | add to / subtract from a variable, field or list item |
| `obj.key = expr` | set a field |
| `list[i] = expr` | set a list item |

## Looping over a list

```nobelium
let total = 0
for each price in [4, 8, 15] {
  total += price
}
log "total {total}"
```

- `for each x in text` goes one character at a time.
- `break` leaves the nearest loop (`for each`, `repeat`, or `stream`).
- Looping over `null` or a number is an error, so check data from a `get` first.
- To loop over an object, use its keys: `for each k in keys(obj) { log "{k} = {obj[k]}" }`.

## Methods

Lists and text have methods, written after a dot:

```nobelium
let xs = [3, 1, 2]
xs.push(9).sort()
log xs.pop()                          // 9
log "  Hi,There ".trim().upper().split(",")
```

| on lists | |
|---|---|
| `push(x)` `unshift(x)` | add to the end / start (return the list) |
| `pop()` `shift()` | remove and return the last / first (`null` if empty) |
| `sort()` `reverse()` | change the list in place |
| `index(x)` `contains(x)` `join(sep)` `slice(a, b)` `len()` | look at it |

| on text | |
|---|---|
| `upper()` `lower()` `trim()` | |
| `split(sep)` `replace(a, b)` `slice(a, b)` | |
| `starts(p)` `ends(p)` `contains(p)` `index(p)` `len()` | |

The function forms (`len(x)`, `upper(x)`, ...) still work. Methods on an imported namespace call its exported functions (see [modules](modules.md)).

## Dates

`date()` is now, `date(value)` reads a date (milliseconds or text like `"2026-03-04"`, `null` if invalid). You get an object:

```nobelium
let d = date()
log "{d.weekday_name} {d.day}/{d.month}/{d.year} {d.clock}"
```

Fields: `year`, `month` (1-12), `day`, `weekday` (0 = Sunday), `weekday_name`, `hour`, `minute`, `second`, `time` (milliseconds), `iso`, `date`, `clock`.

## while and continue

```nobelium
let i = 0
while i < 10 {
  i += 1
  if i % 2 == 0 { continue }   // skip even numbers
  if i > 7 { break }
  log i
}
```

`while` stops with an error after 10000 passes so a mistake cannot freeze the page.

## JSON

`json(x)` turns a value into JSON text and `parse(text)` turns JSON text back into a value (or `null` if it is not valid JSON). Responses from [http requests](http.md) are parsed for you.
