# JavaScript API

Most people never need this. It is for running Nobelium from your own script, such as a custom page or test.

Everything lives on `window.Nobelium`.

| name | what it is |
|---|---|
| `Nobelium.run(source, options)` | parse and run source text. Returns a promise for the running program, or `null` if there was a syntax error |
| `Nobelium.init()` | find and run all `<nobelium>` and `<script type="text/nobelium">` blocks (done automatically at page load) |
| `Nobelium.parse(source)` | returns the AST (array of statement objects). Throws `NobeliumError` |
| `Nobelium.tokenize(source)` | returns the token list |
| `Nobelium.Interpreter` | the interpreter class |
| `Nobelium.NobeliumError` | error type with a `.line` property |
| `Nobelium.config.log(level, message)` | where messages go. `level` is `"log"` or `"error"`. Replace it to capture output |
| `Nobelium.programs` | every program started so far |

## run options

| option | meaning |
|---|---|
| `doc` | the document to work on (default `document`). Useful for iframes |
| `log` | function `(level, message)` just for this program |
| `label` | text put in front of messages, like `"my script"` |

## The returned program

```js
const program = await Nobelium.run('when click "#b" { log "hi" }');
program.dispose();   // removes every event listener it added
```

`dispose()` stops the program from reacting to events (the page itself is not reset).

## Turning off auto-run

Set this before the script tag if you want to start things yourself:

```html
<script>window.NOBELIUM_MANUAL = true;</script>
<script src="nobelium.js"></script>
<script>Nobelium.init();</script>
```

## Capturing output

```js
Nobelium.config.log = function (level, message) {
  document.getElementById("console").textContent += level + ": " + message + "\n";
};
```
