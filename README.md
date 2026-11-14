# Nobelium

A small embedded language that makes interactive HTML easier than JavaScript. It has its own lexer, parser (AST) and tree-walking interpreter. It never calls `eval()` or `Function()`.

```html
<script src="nobelium.js"></script>
<button id="b">Menu</button>
<nobelium>
  when click "#b" { toggle "#menu" }
</nobelium>
```

Use `<script type="text/nobelium">` instead of `<nobelium>` if your code contains `<` or `&`. Standalone files (`.nobelium` / `.nbm`): `<nobelium src="app.nbm"></nobelium>`.

## Layout
- `src/lexer.js`, `src/parser.js`, `src/interpreter.js`, `src/runtime.js` - the language
- `dist/nobelium.js` - all four joined in one file (this is what people download)
- `index.html`, `docs.html`, `playground.html`, `style.css`, `examples.js` - the website
- `tests.html` - open it in a browser to run the test suite

## Deploy on GitHub Pages (no terminal needed)
1. Make a new repo on github.com. Click "uploading an existing file" and drag in everything from this folder (not the zip itself). Commit.
2. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
3. After a minute your site is live at `https://YOURNAME.github.io/REPONAME/`.

## Status
Done: events, show/hide/toggle, classes, variables, if/else, functions, repeat, fade, wait, get requests, form reading, keyboard keys, standalone files, playground, tests.
Not yet: post requests, lists/indexing, string templates, custom animations. See the roadmap on the site.

MIT licensed.
