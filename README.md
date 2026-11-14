# Nobelium

**A lightweight embedded programming language for interactive HTML.**

Nobelium makes it easier to add interactivity to websites without writing lengthy JavaScript. It introduces a simple, readable syntax for handling events, manipulating elements, managing state, and creating interactive experiences directly inside HTML.

Instead of writing repetitive JavaScript for everyday interactions, Nobelium lets you describe what elements should do.

## Example

```html
<script src="dist/nobelium.js"></script>

<button id="menuButton">Open menu</button>

<div id="menu" hidden>
  Hello from Nobelium!
</div>

<nobelium>
  when click "#menuButton" {
    toggle "#menu"
  }
</nobelium>
```

That's it. No manual event listeners, DOM queries, or JavaScript callbacks required.

## Features

- **Event handling** — Respond to clicks, hovering, keyboard input, form submissions, and more.
- **DOM manipulation** — Show, hide, toggle, and modify HTML elements.
- **Variables and conditions** — Store values and control program behavior.
- **Functions** — Create reusable interactions.
- **Animations** — Add transitions and timed effects.
- **HTTP requests** — Retrieve data from external endpoints.
- **Standalone files** — Organize code using `.nobelium` and `.nbm` files.
- **Browser-native execution** — Runs directly in modern browsers without a backend.

Nobelium includes its own lexer, parser, abstract syntax tree (AST), and tree-walking interpreter. It does not use `eval()` or `Function()`.

## Getting Started

Include the Nobelium runtime in your HTML:

```html
<script src="dist/nobelium.js"></script>
```

Write Nobelium directly inside a `<nobelium>` element:

```html
<nobelium>
  when click "#button" {
    show "#message"
  }
</nobelium>
```

Alternatively, use a script element:

```html
<script type="text/nobelium">
  when click "#button" {
    hide "#message"
  }
</script>
```

For larger projects, load standalone files:

```html
<nobelium src="app.nbm"></nobelium>
```

## Project Structure

```text
nobelium/
├── src/
│   ├── lexer.js
│   ├── parser.js
│   ├── interpreter.js
│   └── runtime.js
├── dist/
│   └── nobelium.js
├── documentation/
├── site/
├── index.html
├── docs.html
├── playground.html
├── examples.js
└── tests.html
```

| File | Description |
|---|---|
| `src/` | Language implementation |
| `dist/` | Combined browser runtime |
| `documentation/` | Language documentation |
| `site/` | Website styling and documentation viewer |
| `playground.html` | Interactive coding playground |
| `tests.html` | Browser-based test suite |

## Playground and Documentation

Nobelium includes a browser-based playground for experimenting with the language, alongside documentation, examples, and a feature roadmap.

Visit the project website to explore the language and try it without setting up a development environment.

## Current Status

Nobelium currently supports:

- Events and keyboard interactions
- DOM visibility and class manipulation
- Variables and conditions
- Functions and repetition
- Fade effects and delays
- HTTP GET requests
- Form value reading
- Standalone source files
- Browser playground and tests

Planned features include POST requests, lists and indexing, string templates, and custom animations.

See the project roadmap for development progress.

## Contributing

Contributions, suggestions, bug reports, and feature requests are welcome.

Feel free to open an issue or submit a pull request to help improve Nobelium.

## License

Nobelium is released under the MIT License. See [LICENSE](LICENSE) for details.
