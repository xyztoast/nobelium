# Language reference

## Source basics

- Statements run top to bottom. Line breaks are not significant, but one statement per line reads best.
- Comments start with `//` and run to the end of the line.
- Blocks use `{ }`.
- Names (variables, functions) use letters, digits and `_`, and cannot start with a digit. They are case sensitive.

```
// this is a comment
let name = "sam"
```

## Values

| kind | examples |
|---|---|
| number | `42`, `3.5` |
| duration | `500ms`, `2s` (these are just numbers; `2s` is `2000`) |
| text | `"hello"`, `'hello'` |
| boolean | `true`, `false` |
| nothing | `null` |
| list | `[1, 2, 3]` (see [strings, lists and objects](strings-and-data.md)) |
| object | `{ name: "sam", age: 9 }`, also what JSON responses become |

Text in double quotes can hold `{expressions}` (interpolation) and single-quoted text cannot. Escapes: `\n` is a new line, `\t` a tab. Any other character after a backslash is that character, so `\"` is a quote, `\{` a brace and `\\` a backslash. See [strings, lists and objects](strings-and-data.md).

## Variables

```
let score = 0       // create
score = score + 1   // change
```

Using a name before `let`, or assigning to a name that was never created, is an error.

## Scope

- Each Nobelium block (and each imported file) has its own global scope. Blocks do not share variables. Files share only what they `export` and `import` (see [modules](modules.md)).
- `if` and `repeat` bodies get their own inner scope. A `let` inside is gone after the body ends. Assigning to an outer variable from inside works.
- Each time an event handler runs it gets a fresh scope, so a `let` inside a handler does not remember its value for the next click. Put long-lived variables outside, at the top of the block.
- Functions can see the scope where they were defined.

```
let total = 0                 // lives for the whole block

when click "#add" {
  let step = 5                // new every click
  total = total + step        // updates the outer variable
}
```

## Truthiness

These count as false: `false`, `null`, `0`, empty text `""`, and not-a-number. Everything else is true. This is used by `if`, `and`, `or`, `not`.

## Equality and comparison

`==` and `!=` are strict: `"5" == 5` is false, and two lists or objects are only equal if they are the very same one. Convert with `num()` or `str()` when needed. `<`, `>`, `<=`, `>=` compare like JavaScript.

## Functions

```
fn greet(name) {
  return "hello, " + name
}

set text "#out" to greet("sam")
```

- Top-level functions in a block are available to the whole block, even above where they are written.
- Missing arguments become `null`.
- `return` with no value (or reaching the end) gives back `null`.
- Functions can call themselves. Nesting deeper than 200 calls is an error.
- A function name hides a built-in with the same name.

## Reserved words

`when let set fn if else repeat for each in break return stop show hide toggle add remove class to from on fade animate wait log fetch get post put patch delete stream every after cancel save forget clear storage import export with headers into as over ease delay times nowait of and or not true false null value text` and the animation presets `shake pulse bounce spin flash wobble`.

Statement words only matter at the start of a statement (and the clause words only inside the statement that uses them), so a variable called `delay` is fine until it appears right after an `animate` line. When in doubt, pick a different name.

`value` and `text` are only special when followed by `of`, so you can still name a variable `text`. Avoid it anyway to keep code readable.

## Limits

| thing | limit |
|---|---|
| `repeat` count | 10000 |
| `wait` time | 60 seconds |
| nested function calls | 200 |
| `every` interval | at least 16 ms |
| `animate ... times` | 100 |

## Execution order

A block's top-level statements run in order, and each one finishes before the next starts. A top-level `wait` or `get` therefore delays the statements after it, and the blocks after it on the page. Put slow work inside a `when` handler instead.
