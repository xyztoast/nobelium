# Roadmap

## Done

- lexer, parser and interpreter with line-numbered errors
- events: click, dblclick, rightclick, hover, leave, mouse, input, change, focus, blur, submit, keys with combos, scroll, resize, online/offline, hashchange, clipboard, drag, touch, load
- show, hide, toggle, fade in/out, classes
- variables, assignment (`+=`, fields, list items), scope, closures
- if / else if / else, repeat, for each, break
- functions with return
- text interpolation, lists, objects, indexing
- http: get, post, put, patch, delete, fetch, stream (chunks and lines)
- localStorage: save, saved, forget, clear storage
- timers: every, after, cancel
- animate with custom css, easing, delay, repeat, and presets
- import / export between files, virtual files, circular import detection
- built-in functions for text, lists, math, json
- `<nobelium>` and `<script type="text/nobelium">` blocks, standalone `.nobelium` / `.nbm` files
- playground with syntax highlighting, preview, console, and an import library file
- browser test page

## Planned next

- `while` loop and `continue`
- methods on values (`list.push(x)`) and dates
- `sessionStorage` and cookies
- shortcuts for tabs and accordions
- editor highlighting for VS Code

## Later

- `import ... as name` namespaces
- a small test runner for Nobelium programs
- error line numbers that point into the html file, not just the block
- creating new elements from templates

## Known limits

- a top-level `wait`, `get` or `stream` delays later code in the same page
- no `while` loop yet, only `repeat` and `for each`
- numbers are JavaScript numbers (floating point)
- `import` needs a web server, or virtual files
