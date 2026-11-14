# Getting started

## 1. Get the file

**Easiest (no download):** use the CDN link in step 2 below.

**Or self-host:** download `dist/nobelium.js` from the project (or copy the four files in `src/`: `lexer.js`, `parser.js`, `interpreter.js`, `runtime.js`). Put it next to your HTML file. There is nothing to install and no build step.

## 2. Add it to your page

Put the script tag before your Nobelium blocks (anywhere in `<head>` or `<body>` works).

From the CDN (jsDelivr, free):

```html
<script src="https://cdn.jsdelivr.net/gh/xyztoast/nobelium@v1.0.0/dist/nobelium.min.js"></script>
```

Pinned to `v1.0.0`, so your site never changes unexpectedly. Swap `@v1.0.0` for `@latest` to always get the newest release, and `nobelium.min.js` for `nobelium.js` if you want the readable version.

From your own copy:

```html
<script src="nobelium.js"></script>
```

## 3. Write a block

```html
<h2 id="n">0</h2>
<button id="inc">+1</button>

<nobelium>
  let count = 0

  when click "#inc" {
    count = count + 1
    set text "#n" to count
  }
</nobelium>
```

Open the page and click the button. The number goes up.

## Two ways to write a block

| form | use when |
|---|---|
| `<nobelium> ... </nobelium>` | normal code |
| `<script type="text/nobelium"> ... </script>` | your code contains `<` or `&` (the HTML parser would treat them as tags) |

Both behave the same. You can have as many blocks on a page as you want. Each block runs on its own and shares no variables with other blocks.

## Loading a standalone file

Nobelium source files use the extension `.nobelium` (main) or `.nbm` (short):

```html
<nobelium src="app.nbm"></nobelium>
```

This uses `fetch`, so it needs a web server (GitHub Pages works). It will not work by double-clicking the html file on your computer. Inline blocks work everywhere.

## Selectors

Anything that points at an element is a string in quotes, written like CSS: `"#id"`, `".class"`, `"form input"`. Without the quotes it is read as a variable instead.

## Where do errors show up?

In the browser console (right click the page, Inspect, Console tab). Every message starts with `[nobelium]`. In the playground they show in the console panel under the preview. See [errors](errors.md).

## Next

Read the [language reference](language-reference.md), or jump to [examples](examples.md). Once you know the basics, see [strings, lists and objects](strings-and-data.md), [http](http.md), [storage](storage.md), [timers](timers.md), [animation](animation.md) and [modules](modules.md).
