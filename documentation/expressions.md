# Expressions and built-ins

## Operators (highest priority first)

| operators | notes |
|---|---|
| `.` and `[ ]` | read a field: `data.title`, `data["a-b"]`, or a list position `xs[0]` (`xs[-1]` is the last). Missing fields and positions give `null`. Reading a field of a non-object is an error |
| `not`, `-` (unary) | `-x` needs a number |
| `*` `/` `%` | numbers only. Dividing by zero is an error |
| `+` `-` | `+` joins text if either side is text |
| `<` `>` `<=` `>=` | comparison |
| `==` `!=` | strict equality (`"1" == 1` is false) |
| `and` | stops early if the left side is false |
| `or` | stops early if the left side is true |

Use `( )` to group. Double-quoted text can contain `{expressions}`: see [strings, lists and objects](strings-and-data.md). Lists `[1, 2]` and objects `{ a: 1 }` are written directly in expressions. `and` / `or` return one of their sides, not strictly true/false, so `name or "guest"` is a handy default.

```
set text "#msg" to "you have " + count + " items"
if age >= 18 and agreed { show "#next" }
```

## Reading the page

```
value of "#email"     // the value typed into an input
text of "#title"      // the text inside an element
```

Both read the first matching element. They are errors if nothing matches. The selector part can be a variable: `value of fieldId`.

`value of` is always text, even for number inputs, so convert it:

```
let qty = num(value of "#qty")
```

## Built-in functions

| function | returns |
|---|---|
| `len(x)` | length of text or a list (0 for `null`) |
| `upper(x)` / `lower(x)` | text in capitals / lowercase |
| `trim(x)` | text without spaces at the start and end |
| `contains(a, b)` | true if text `a` contains text `b` |
| `num(x)` | `x` as a number (not-a-number if it cannot be) |
| `str(x)` | `x` as text |
| `round(x)` | nearest whole number |
| `random(a, b)` | random whole number from `a` to `b`, both included |
| `item(list, i)` | item `i` of a list (first is `0`), or `null` |
| `exists("sel")` | true if the page has a matching element |
| `push(list, x)` | add `x` to the end of the list (returns the list) |
| `keys(obj)` | list of an object's field names |
| `json(x)` / `parse(text)` | value to JSON text / JSON text to value (`null` if invalid) |
| `split(text, sep)` / `join(list, sep)` | text to list / list to text |
| `replace(text, a, b)` | replace every `a` with `b` |
| `starts(text, p)` / `ends(text, p)` | begins / ends with |
| `slice(x, from, to)` | part of a list or text (`to` is optional) |
| `contains(list, x)` | also works on lists |
| `floor(x)` `abs(x)` `min(a, b, ...)` `max(a, b, ...)` | math helpers |
| `now()` | current time in milliseconds |
| `saved("key")` | a value stored with `save` (see [storage](storage.md)) |

Calling a function that does not exist is an error. If you have a variable with the same name as a function and call it, you get `"x" is not a function`.

## Text and numbers

- `"a" + 1` gives `"a1"`.
- `1 + 2` gives `3`, but `"1" + 2` gives `"12"`. Use `num()` first for math on text.
- `5s` is the number `5000`, anywhere a number is allowed.

## Validation recipes

```
// not empty
if trim(value of "#name") == "" { ... }

// looks like an email
if contains(value of "#email", "@") and contains(value of "#email", ".") { ... }

// minimum length
if len(value of "#pw") < 8 { ... }

// is a number
if num(value of "#age") == num(value of "#age") { ... }   // false only when not-a-number
```
