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
| `no element matches "#x"` | nothing on the page has that selector. Check spelling, the `#` or `.`, and that the element exists when the code runs |
| `"x" is not a valid selector` | broken css selector, like `"#"` or `"..a"` |
| `expected a selector string like "#id" but got number` | you passed a non-text value where a selector goes. Add quotes |
| `"x" is not defined` | variable used before `let`, or misspelled |
| `"x" is not defined (create it with let first)` | assigned with `x = ...` before `let x = ...` |
| `unknown function "x"` | no function or built-in with that name |
| `"x" is not a function` | you called a variable like a function |
| `cannot read "f" of null` | a field was read on something that is not an object. Often `get` failed or returned text |
| `cannot set "x" (use text or value)` | only `set text` and `set value` exist |
| `"+" needs two numbers` (also - * / %) | convert with `num()` |
| `cannot divide by zero` | check the divisor first |
| `request to "url" failed` | network problem or the server blocks cross-origin requests |
| `request to "url" returned status 404` | the server answered with an error |
| `too many nested function calls` | a function keeps calling itself forever |
| `block N: could not load file` | the `src` file was not found, or you opened the page from disk instead of a server |

## Debugging tips

1. Use `log` to see values: `log value of "#email"`.
2. Test selectors in the console: `document.querySelectorAll("#menu")` should show your element.
3. If nothing happens at all, check that `nobelium.js` loads (Network tab) and that the script tag comes from the right path.
4. If a block silently does nothing and there is no error, check that it is not inside an html comment, and that `<` characters did not break it (switch to `<script type="text/nobelium">`).
5. Each block is independent, so a variable made in one block is not visible in another.
