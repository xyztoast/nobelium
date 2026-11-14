# HTTP requests, fetch and streaming

Nobelium has three levels, from simplest to most flexible.

| level | statements | use it for |
|---|---|---|
| simple verbs | `get`, `post`, `put`, `patch`, `delete` | "send this, give me the answer" |
| full response | `fetch` | when you need the status, headers or the raw text |
| streaming | `stream` | big or slow responses you want to read piece by piece |

The server must allow your site to call it (CORS), unless it is on the same site. Relative urls like `"/api/items"` always work against your own site.

## Simple verbs

```nobelium
get "https://example.com/api/items" into items

post "/api/items" with { name: "pen", price: 3 } into created
log "new id: {created.id}"

put "/api/items/7" with { price: 4 } into updated
patch "/api/items/7" with { price: 5 } headers { "X-Token": "abc" } into updated
delete "/api/items/7" into gone
```

Shape: `VERB url [with body] [headers object] into name`

- The result is the response body. If it is JSON you get an object or list, otherwise you get text.
- A body that is an object or list is sent as JSON (and `Content-Type: application/json` is added unless you set your own). A text body is sent as is.
- `get` cannot have a body. Use `fetch` with options if you really need one.
- A network failure, a CORS block, or a status outside 200-299 is an error for that handler.
- Missing JSON fields read as `null`.

## fetch: the full response

```nobelium
fetch "/api/items" into res
log "{res.status} {res.ok}"
log res.headers["content-type"]
log res.json.items[0]
```

Shape: `fetch url [with options] into name`

Options (all optional): `method`, `body`, `headers`.

```nobelium
fetch "/api/login" with { method: "POST", body: { user: "sam" }, headers: { Accept: "application/json" } } into res
if res.status == 401 {
  set text "#msg" to "wrong password"
}
```

The response object has these fields:

| field | meaning |
|---|---|
| `res.status` | number like `200` or `404` |
| `res.ok` | true for 200-299 |
| `res.statusText` | text like `"Not Found"` |
| `res.url` | final url |
| `res.headers` | object of header names (lowercase) to values |
| `res.text` | the body as text |
| `res.json` | the body parsed as JSON, or `null` if it is not JSON |

Unlike the simple verbs, `fetch` does **not** treat a bad status as an error, so you can handle it yourself. Only network failures raise an error.

## stream: read a response as it arrives

```nobelium
stream "/api/events" into chunk {
  log "got: {chunk}"
}
log "stream finished"
```

Shape: `stream url [with options] into name { ... }`

- The block runs every time a piece of the body arrives. The piece is available under the name you chose.
- The statement finishes when the server closes the stream. Code after it runs then.
- `break` stops reading early and closes the connection.
- Options are the same as `fetch`, plus `lines: true`, which gives you one **full line** at a time instead of arbitrary pieces. Lines that arrive split across pieces are put back together for you.

```nobelium
stream "/api/log" with { lines: true } into line {
  if starts(line, "data: ") {
    let msg = parse(replace(line, "data: ", ""))
    set text "#last" to "{msg.text}"
  }
}
```

Useful for server-sent events, newline-delimited JSON, and AI-style token streams.

If the browser cannot stream a response, Nobelium reads it all and then runs your block once (or once per line with `lines: true`), so the same code still works.

## Tips

- Show progress with `set text` before the request and after it.
- Handlers can overlap. If a user clicks twice, two requests run. Use a flag variable (`let busy = false`) to ignore the second click.
- `stop` must come before any `get` or `fetch` in a handler (see [events](events.md#cancelling-the-default-action)).
