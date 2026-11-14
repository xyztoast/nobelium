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
- double-quoted strings with `{ }` become `tpl` tokens (see "Interpolation" below)
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
| `assign` | `t`, `e` |
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

## Newer parts

The statements and expressions below were added after the first version. They follow the same pattern (parser node, then an `exec` / `ev` case).

| `k` | fields | notes |
|---|---|---|
| `foreach` | `n`, `it`, `body` | loop over a list or text |
| `break` | none | thrown as a `Brk` object, caught by the loop helper |
| `fetch` | `url`, `opts`, `n` | full response object |
| `http` | `m` (verb), `url`, `body`, `hd`, `n` | simple verbs |
| `stream` | `url`, `opts`, `n`, `body` | reads `response.body` with a reader and a `TextDecoder` |
| `timer` | `kind` (every/after), `d`, `n`, `body` | handles are kept in `interpreter.timers` so `dispose()` can clear them |
| `cancel` | `e` | |
| `save` / `forget` / `clearstore` | `e`, `key` | localStorage with the `nobelium:` prefix, memory fallback |
| `animate` | `sel`, `from`, `to`, `over`, `ease`, `delay`, `times`, `nowait`, `preset` | uses `element.animate()` |
| `import` / `export` | `names`, `src` / `s` | see below |

`assign` now has a target `t` (a `var`, `member` or `index` node) and a value `e`. `x += 1` is turned into `x = x + 1` by the parser.

New expression nodes: `tpl` (parts: text or expression nodes), `list` (`items`), `obj` (`props`), `index` (`o`, `i`).

### Interpolation

The lexer finds the matching `}` of every `{` inside a double-quoted string (skipping braces inside nested strings) and keeps the raw source of the inner expression in a `tpl` token. The parser hands each piece to `Nobelium.parseExpr(source, line)`, which runs a fresh parser on it. So interpolated code goes through exactly the same parser as everything else.

### Modules

`import` loads the file (virtual file, or `fetch` of the resolved address), parses it, and runs it in its **own** `Interpreter` with its own global scope. The result is cached in `Nobelium.modules` by resolved address, so a file runs once. `export` records values in the module's `exports` map, and `import a, b from` copies those into the importing scope. A function keeps a reference to the interpreter that defined it (`Fn.owner`), so calling an imported function runs it with its own scope, log and base address. Each module carries the chain of files that led to it, which is how circular imports are caught.

### Events

All listeners use the capture phase, so non-bubbling events work. `resize`, `online`, `offline`, `hashchange` and a few others are attached to the window instead of the document. `key` parses its argument into a key and modifier set.
