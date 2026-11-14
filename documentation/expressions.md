# Expressions and built-ins

## Operators (highest priority first)

| operators | notes |
|---|---|
| `.` | read a field: `data.title`. Missing fields give `null`. Reading a field of a non-object is an error |
| `not`, `-` (unary) | `-x` needs a number |
| `*` `/` `%` | numbers only. Dividing by zero is an error |
| `+` `-` | `+` joins text if either side is text |
| `<` `>` `<=` `>=` | comparison |
| `==` `!=` | strict equality (`"1" == 1` is false) |
| `and` | stops early if the left side is false |
| `or` | stops early if the left side is true |

Use `( )` to group. `and` / `or` return one of their sides, not strictly true/false, so `name or "guest"` is a handy default.

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
