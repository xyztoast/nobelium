# Nobelium documentation

Nobelium is a small language that lives inside HTML and makes interactive pages easier to write than JavaScript. It has its own lexer, parser and interpreter. It never uses `eval()` or `Function()`.

## Read in this order

1. [Getting started](getting-started.md) - add Nobelium to a page and write your first block
2. [Language reference](language-reference.md) - syntax, variables, scope, truthiness
3. [Strings, lists and objects](strings-and-data.md) - interpolation, data, loops
4. [Events](events.md) - every event, key combos and the `event` object
5. [Statements](statements.md) - every statement with examples
6. [HTTP requests, fetch and streaming](http.md) - get, post, fetch, stream
7. [Saving data](storage.md) - localStorage
8. [Timers](timers.md) - every, after, cancel
9. [Animation](animation.md) - animate and presets
10. [Importing between files](modules.md) - import and export
    - [Elements, tabs and accordions](dom.md) - create, copy, tabs, accordion
    - [Testing](testing.md) - test, assert, trigger
11. [Expressions and built-ins](expressions.md) - operators, `value of`, built-in functions
12. [Errors and debugging](errors.md) - what error messages mean and how to fix them
13. [JavaScript API](api.md) - running Nobelium from your own scripts
14. [Architecture](architecture.md) - how the lexer, parser and interpreter work
15. [Examples](examples.md) - copy-paste recipes
16. [Roadmap](roadmap.md) - what is done and what is planned

## One-minute version

```html
<script src="nobelium.js"></script>

<button id="b">Menu</button>
<ul id="menu" style="display:none"><li>Home</li></ul>

<nobelium>
  when click "#b" {
    toggle "#menu"
  }
</nobelium>
```
