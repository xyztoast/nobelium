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

## JSON

`json(x)` turns a value into JSON text and `parse(text)` turns JSON text back into a value (or `null` if it is not valid JSON). Responses from [http requests](http.md) are parsed for you.
