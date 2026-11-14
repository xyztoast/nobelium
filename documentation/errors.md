# Errors and debugging

## Where to look

Open the browser console (Inspect, then Console). Nobelium messages start with `[nobelium]` and include the block number and the line inside the block:

```
[nobelium] block 2: line 4: no element matches "#menu"
```

In the playground the same messages appear in the console panel.

## Kinds of errors

**Syntax errors** are found before anything runs. That whole block is skipped (other blocks still run).

**Runtime errors** happen while running. At the top level of a block, the failing statement is reported and the next one runs. Inside an event handler, that one run of the handler stops. Other handlers and future events are not affected.

## Message guide

| message | meaning and fix |
|---|---|
| `unexpected character "x"` | a symbol Nobelium does not know. Remove it or put it inside quotes |
| `string is missing its closing quote` | add the closing `"` on the same line |
| `missing "}" to close the block` | a `{` was never closed. Check your braces |
| `expected "x" but found "y"` | the statement is shaped wrong, like `set text "#a" "hi"` missing `to` |
| `expected a name but found ...` | `let`, `fn` or `get ... into` needs a name here |
| `unexpected "word" (typo? ...)` | a line starts with something that is not a statement |
| `use "fade in" or "fade out"` | fade needs a direction |
| `"{" in a string is missing its closing "}"` | an interpolation was never closed. For a literal brace write `\{`, or use single quotes |
| `unexpected "x" inside {...}` | the expression between braces in a string is not valid |
| `this is not a statement` | a line is just an expression like `a.b`. Add what to do with it |
| `"get" cannot send a body ...` | use `post`, or `fetch ... with { method: ..., body: ... }` |
| `animate needs "to { ... }" or a preset` | add a `to { }` part or use shake, pulse, bounce, spin, flash, wobble |
| `animate needs an object like { opacity: 0.5 }` | `to` and `from` take an object in braces |
| `"export" must be followed by fn or let` | only functions and variables can be exported |
| `no element matches "#x"` | nothing on the page has that selector. Check spelling, the `#` or `.`, and that the element exists when the code runs |
| `"x" is not a valid selector` | broken css selector, like `"#"` or `"..a"` |
| `expected a selector string like "#id" but got number` | you passed a non-text value where a selector goes. Add quotes |
| `"x" is not defined` | variable used before `let`, or misspelled |
| `"x" is not defined (create it with let first)` | assigned with `x = ...` before `let x = ...` |
| `unknown function "x"` | no function or built-in with that name |
| `"x" is not a function` | you called a variable like a function |
| `"while" ran more than 10000 times` | the condition never became false |
| `cannot call .x() on ...` | that method does not exist for lists or text, see [strings-and-data](strings-and-data.md#methods) |
| `"x" cannot be created ...` / `"onclick" is not allowed ...` | blocked tag or attribute in `create`, see [dom](dom.md) |
| `set cookie needs a name in quotes` | write `set cookie "name" to value` |
| `test FAILED: name - message` | an `assert` or an error inside a test, see [testing](testing.md) |
| `"break" can only be used inside a loop` | `break` must be inside `for each`, `repeat` or `stream` |
| `"for each" needs a list or text but got null` | the thing you loop over is missing. Check the data first |
| `list position 9 is out of range (0 to 3)` | you can set positions up to the current length |
| `a list or text position must be a number` | `xs["a"]` only works on objects |
| `"x" is a reserved name` | objects cannot use `__proto__`, `constructor` or `prototype` as keys |
| `cannot change a field of null` | the object you are assigning into does not exist |
| `cannot read "f" of null` | a field was read on something that is not an object. Often `get` failed or returned text |
| `cannot set "x" (use text or value)` | only `set text` and `set value` exist |
| `"+" needs two numbers` (also - * / %) | convert with `num()` |
| `cannot divide by zero` | check the divisor first |
| `request to "url" failed (network error, or blocked by CORS)` | no connection, wrong address, or the server does not allow your site. See [http](http.md) |
| `the url must be text` | the address given to get/post/fetch/stream is not text |
| `headers must be an object ...` / `fetch options must be an object ...` | pass `{ name: value }` objects |
| `could not save "k" (storage is full or blocked)` | browser storage is full or disabled |
| `save needs a name in quotes ...` | the key after `as` must be non-empty text |
| `cannot save a function` | only plain data can be saved |
| `unknown key modifier "x"` | in `key "ctrl+s"` use ctrl, shift, alt or meta |
| `"file" does not export "name"` | the name is not marked `export` in that file, or is misspelled |
| `circular import of "file"` | two files import each other (directly or through others) |
| `cannot import "file" from another site` | imports must be same-site unless you set `Nobelium.config.allowRemoteImports = true` |
| `could not load "file"` | wrong path (paths are relative to the importing file), or opened from disk without a server |
| `request to "url" returned status 404` | the server answered with an error |
| `too many nested function calls` | a function keeps calling itself forever |
| `block N: could not load file` | the `src` file was not found, or you opened the page from disk instead of a server |

## Debugging tips

1. Use `log` to see values: `log value of "#email"`.
2. Test selectors in the console: `document.querySelectorAll("#menu")` should show your element.
3. If nothing happens at all, check that `nobelium.js` loads (Network tab) and that the script tag comes from the right path.
4. If a block silently does nothing and there is no error, check that it is not inside an html comment, and that `<` characters did not break it (switch to `<script type="text/nobelium">`).
5. Each block is independent, so a variable made in one block is not visible in another.
