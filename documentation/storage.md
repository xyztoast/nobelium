# Saving data (localStorage)

Nobelium can remember values between visits using the browser's localStorage. Values stay on the visitor's device, per website.

| statement | what it does |
|---|---|
| `save expr as "key"` | store a value |
| `saved("key")` | read it back (an expression). `null` if nothing is saved |
| `forget "key"` | remove one value |
| `clear storage` | remove everything Nobelium saved on this site |

```nobelium
let visits = saved("visits") or 0
visits += 1
save visits as "visits"
set text "#v" to "visit number {visits}"
```

`saved("visits") or 0` is the usual pattern for "use the saved value, or this default".

## What can be saved

Numbers, text, true/false, `null`, lists and objects (nested as deep as you like). They come back as the same kind of value:

```nobelium
save { name: "sam", scores: [3, 9] } as "profile"
let p = saved("profile")
log p.scores[1]      // 9
```

Functions cannot be saved.

## Session storage

Add `in session` to keep a value only until the tab is closed. Read it with `saved("key", "session")`:

```nobelium
save step as "step" in session
let s = saved("step", "session") or 1
forget "step" in session
clear session
```

## Cookies

```nobelium
set cookie "theme" to "dark" days 30    // days is optional (without it the cookie ends with the browser session)
log cookie("theme")                     // dark, or null
forget cookie "theme"
```

Cookies are plain text, are sent to your server with every request, and are limited to about 4 KB each. Use `save` for anything the server does not need.

## Good to know

- Keys are private to Nobelium: internally they are stored with a `nobelium:` prefix, so `clear storage` never touches data that other scripts on your site saved.
- Browsers allow roughly 5 MB per site. If it is full or blocked you get a `could not save` error for that handler.
- Reading and saving are instant (no `wait` needed).
- In places where storage is blocked (some private modes, sandboxed frames like the playground preview), Nobelium keeps values in memory for the current page and prints a one-time note. Nothing breaks, the values just do not survive a reload.
- Anyone using the same browser can read these values, so do not store passwords or secrets.
