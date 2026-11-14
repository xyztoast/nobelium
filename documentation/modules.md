# Importing between files

Split bigger programs into several files and share code between them.

## Exporting

In a file, put `export` in front of a function or variable to make it available to others:

```nobelium
// utils.nbm
export fn money(n) {
  return "${round(n * 100) / 100}"
}

export let currency = "USD"

fn secret_helper() {
  return 1
}
```

`secret_helper` is private. Only things marked `export` can be imported. Exported functions can still use the file's private helpers and variables.

## Importing

```nobelium
import money, currency from "utils.nbm"

set text "#price" to "{money(4.5)} {currency}"
```

Shapes:

| form | meaning |
|---|---|
| `import a, b from "file"` | bring in those exported names |
| `import "file"` | just run the file (useful for files that set up events with `when`) |

Put imports near the top. Imported names behave like your own functions and variables.

## Loading files in a page

The main file is loaded from your html as usual:

```html
<script src="nobelium.js"></script>
<nobelium src="js/app.nbm"></nobelium>
```

Inside `js/app.nbm`, paths are relative to **that file**, so `import "utils.nbm"` loads `js/utils.nbm`. In an inline `<nobelium>` block, paths are relative to the page. Standard `../` and `/absolute/paths` work.

Files use `.nobelium` or `.nbm`. Any name works.

## Rules

- A file runs **once** per page, no matter how many files import it. Its `when` handlers, timers and variables are created once and shared by everyone that imports it.
- Each file has its own private scope. Variables from the importing file are not visible inside the imported file and the other way around, except what is exported.
- `export let` copies the value at that moment. Changing it later in the importing file changes only the importing file's copy. For shared changing state use an exported object (`export let state = { count: 0 }`) and change its fields, or export functions.
- Circular imports (`a` imports `b` imports `a`) are an error.
- By default only files from the **same website** can be imported. To allow other sites, set `Nobelium.config.allowRemoteImports = true` before your blocks run. Only do that for sites you trust, since their code will run on your page.
- Errors from an imported file are reported with the file name in front.
- Importing needs `fetch`, so it needs a web server (GitHub Pages works). When opening an html file straight from your computer, use virtual files instead (see [api](api.md#virtual-files)).
