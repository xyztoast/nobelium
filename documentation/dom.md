# Building the page: elements, tabs and accordions

## create

```nobelium
create "li" in "#list" with { text: "buy milk", class: "todo", "data-id": 7 }
```

Shape: `create "tag" in "selector" [with { options }]`. Adds a new element to the end of every matching container.

Options: `text` (plain text), `value`, `class`, and anything else becomes an html attribute. Event attributes (`onclick`...), `javascript:` links, and the tags `script`, `iframe`, `object` and `embed` are blocked. Text is never read as html, so user input is safe.

## copy (templates)

Write the shape once in html, fill it in with Nobelium:

```html
<template id="row">
  <li><b data-slot="name"></b> - <span data-slot="job"></span></li>
</template>
<ul id="people"></ul>

<nobelium>
  copy "#row" to "#people" with { name: "Ann", job: "baker" }
  copy "#row" to "#people" with { name: "Bo", job: "pilot" }
</nobelium>
```

`copy "#template" to "#target" [with { slot: value }]` copies the template, puts each value into the element with the matching `data-slot` (as plain text) and adds it to the target. The source can be a `<template>` or a normal element (its `id` is dropped on the copy).

## empty and remove element

```nobelium
empty "#people"              // remove everything inside
remove element ".old-row"    // remove the elements themselves
```

## tabs

```html
<button class="tab">One</button> <button class="tab">Two</button>
<div class="panel">first</div> <div class="panel">second</div>

<nobelium>
  tabs ".tab" for ".panel"
</nobelium>
```

The 1st button goes with the 1st panel, and so on. Clicking a button shows its panel, hides the others, and gives the button the class `active` (add `.active { ... }` in your css). The tab that already has class `active` starts open, otherwise the first one.

## accordion

```nobelium
accordion ".question" for ".answer"          // any number can be open
accordion ".question" for ".answer" only     // opening one closes the others
```

All answers start closed. Clicking a header toggles its answer and the class `open` on the header.

Both match elements when you click, so items added later with `create` or `copy` work too (they pair up by position).
