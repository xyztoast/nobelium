# Roadmap

## Done

- lexer, parser and interpreter with line-numbered errors
- events: click, hover, leave, input, change, submit, keypress, key, load
- show, hide, toggle, fade in/out
- classes: add, remove, toggle
- variables, assignment, scope, closures
- if / else if / else, repeat
- functions with return
- wait, get requests with JSON parsing
- reading and setting text and input values
- built-in functions
- `<nobelium>` and `<script type="text/nobelium">` blocks, standalone `.nobelium` / `.nbm` files
- playground with syntax highlighting, preview and console
- browser test page

## Planned next

- `post` requests
- real lists and indexing (`items[0]`), `for each`
- string templates like `"hello {name}"`
- `animate` with custom css values
- shortcuts for tabs and accordions
- editor highlighting for VS Code

## Later

- `import` for sharing code between files
- a small test runner for Nobelium programs
- error line numbers that point into the html file, not just the block

## Known limits

- `focus` and `blur` style events do not work (they do not bubble)
- a top-level `wait` or `get` delays later code in the same page
- no `while` loop yet, only `repeat`
- numbers are JavaScript numbers (floating point)
