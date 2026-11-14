# Nobelium documentation

Nobelium is a small language that lives inside HTML and makes interactive pages easier to write than JavaScript. It has its own lexer, parser and interpreter. It never uses `eval()` or `Function()`.

## Read in this order

1. [Getting started](getting-started.md) - add Nobelium to a page and write your first block
2. [Language reference](language-reference.md) - syntax, variables, scope, truthiness
3. [Events](events.md) - every event and the `event` object
4. [Statements](statements.md) - every statement with examples
5. [Expressions and built-ins](expressions.md) - operators, `value of`, built-in functions
6. [Errors and debugging](errors.md) - what error messages mean and how to fix them
7. [JavaScript API](api.md) - running Nobelium from your own scripts
8. [Architecture](architecture.md) - how the lexer, parser and interpreter work
9. [Examples](examples.md) - copy-paste recipes
10. [Roadmap](roadmap.md) - what is done and what is planned

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
