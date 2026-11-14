# Architecture

Nobelium is a normal small language implementation in four files. The source is never turned into JavaScript text and never passed to `eval()` or `Function()`.

```
source text --lexer--> tokens --parser--> AST --interpreter--> DOM changes
```

| file | job |
|---|---|
| `src/lexer.js` | `tokenize(source)`: text to tokens, tracks line numbers |
| `src/parser.js` | `parse(source)`: tokens to an AST (recursive descent) |
| `src/interpreter.js` | walks the AST, talks to the DOM |
| `src/runtime.js` | finds blocks in the page, loads `src` files, runs them |

`dist/nobelium.js` is these four files joined in that order.

## Lexer

Token shapes: `{ t, v, line }` where `t` is `num`, `str`, `id`, `op` or `eof`.

- numbers accept `ms` and `s` suffixes and are stored in milliseconds
- strings accept single or double quotes
- `//` comments are dropped
- anything unknown throws a `NobeliumError` with the line

## Parser

Statements are parsed by looking at the first word. Expressions use precedence levels built from one helper, from lowest to highest: `or`, `and`, equality, comparison, add, multiply, unary, primary.

### Statement nodes

| `k` | fields |
|---|---|
| `when` | `ev`, `sel` (expression or null), `body` |
| `let` | `n`, `e` |
| `assign` | `n`, `e` |
| `fn` | `n`, `ps`, `body` |
| `set` | `prop`, `sel`, `e` |
| `vis` | `op` (show/hide/toggle), `sel` |
| `cls` | `op` (add/remove/toggle), `c`, `sel` |
| `fade` | `dir`, `sel` |
| `wait`, `log` | `e` |
| `get` | `url`, `n` |
| `if` | `c`, `a`, `b` (else body or null) |
| `repeat` | `n`, `body` |
| `return` | `e` or null |
| `stop` | none |
| `call` | `e` (a call expression) |

### Expression nodes

| `k` | fields |
|---|---|
| `lit` | `v` |
| `var` | `n` |
| `member` | `o`, `n` |
| `read` | `prop` (value/text), `sel` |
| `un` | `op`, `e` |
| `bin` | `op`, `l`, `r` |
| `call` | `n`, `args` |

Every node that can fail carries `L`, its line number.

## Interpreter

- `exec(stmt, scope)` runs statements, `ev(expr, scope)` computes values. Both are `async` so `wait`, `fade` and `get` can pause without freezing the page.
- `Scope` is a chain of Maps. `let` defines in the current scope, assignment finds the nearest existing one.
- Functions are `Fn` objects holding their definition and the scope they were created in (closures).
- `return` is implemented with a thrown `Ret` object and caught in `callFn`.
- Event handling: one listener per `when` is added to the document. On each event it finds the matching element with `closest(selector)` and runs the body in a fresh child scope that has `event` and a hidden reference to the real browser event (used by `stop`).
- Member access only reads own properties, so `x.constructor` or `x.__proto__` cannot reach JavaScript internals.
- Built-ins are a fixed table of small functions. User code cannot add to it.
- Text is only ever written with `textContent` / `.value`, never `innerHTML`.

## Error handling

All language errors are `NobeliumError`. They are caught at the handler (or top-level statement) boundary and sent to `Nobelium.config.log`, so one failure never crashes the page.

## Adding a statement (contributor guide)

1. Add the keyword case in `stmt()` in `parser.js`, returning a node with a new `k`.
2. Add the matching `case` in `exec()` in `interpreter.js`.
3. Add the word to the highlight list in `playground.html`.
4. Add a test in `tests.html`, document it in [statements](statements.md), rebuild `dist/nobelium.js` by joining the four source files.
