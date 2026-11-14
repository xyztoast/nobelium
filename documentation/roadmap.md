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

## Also done

- `while`, `continue`, methods on lists and text, dates
- sessionStorage and cookies
- `tabs` and `accordion`
- `create`, `copy` (templates), `empty`, `remove element`
- `import "file" as name`
- built-in test runner (`test`, `assert`, `trigger`, `run tests`)
- error line numbers that point into the html file
- VS Code syntax highlighting (`editors/vscode`)

## Ideas for later

- `else` after loops, `for each` with an index
- lambdas and `map` / `filter`
- source maps for imported files inside bundles
- a formatter

## Known limits

- a top-level `wait`, `get` or `stream` delays later code in the same page
- numbers are JavaScript numbers (floating point)
- `import` needs a web server, or virtual files
