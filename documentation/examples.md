# Examples

Each recipe shows the HTML it needs and the Nobelium code. All of them are also in the playground.

## Toggle a menu

```html
<button id="b">Menu</button>
<ul id="menu" style="display:none"><li>Home</li><li>About</li></ul>

<nobelium>
  when click "#b" { toggle "#menu" }
</nobelium>
```

## Counter

```html
<h2 id="n">0</h2>
<button id="inc">+1</button> <button id="reset">Reset</button>

<nobelium>
  let count = 0
  when click "#inc" {
    count = count + 1
    set text "#n" to count
  }
  when click "#reset" {
    count = 0
    set text "#n" to count
  }
</nobelium>
```

## Tabs

```html
<button id="t1">One</button> <button id="t2">Two</button>
<div id="p1">panel one</div>
<div id="p2" style="display:none">panel two</div>

<nobelium>
  when click "#t1" {
    show "#p1"
    hide "#p2"
  }
  when click "#t2" {
    show "#p2"
    hide "#p1"
  }
</nobelium>
```

## Accordion (class based)

```html
<style>.body{display:none}.open .body{display:block}</style>
<div class="item" id="a1"><button class="head">Question</button><div class="body">Answer</div></div>

<nobelium>
  when click ".head" {
    toggle class "open" on ".item"
  }
</nobelium>
```

## Modal with Escape to close

```html
<button id="open">Open</button>
<div id="modal" style="display:none">hello <button id="close">Close</button></div>

<nobelium>
  when click "#open" { fade in "#modal" }
  when click "#close" { fade out "#modal" }
  when key "Escape" { fade out "#modal" }
</nobelium>
```

## Form validation

```html
<form id="f"><input id="email" placeholder="email"> <button>Join</button></form>
<p id="msg"></p>

<nobelium>
  when submit "#f" {
    stop
    if not contains(value of "#email", "@") {
      set text "#msg" to "enter a valid email"
    } else {
      set text "#msg" to "thanks for joining!"
    }
  }
</nobelium>
```

## Live character count

```html
<textarea id="t"></textarea> <span id="c">0</span>/100

<nobelium>
  when input "#t" {
    set text "#c" to len(event.value)
    if len(event.value) > 100 {
      add class "bad" to "#c"
    } else {
      remove class "bad" from "#c"
    }
  }
</nobelium>
```

## Greeting with a function

```html
<input id="who" placeholder="your name"> <button id="go">Greet</button>
<p id="out"></p>

<nobelium>
  fn greet(name) {
    if trim(name) == "" { return "hello, stranger!" }
    return "hello, " + upper(name) + "!"
  }
  when click "#go" {
    set text "#out" to greet(value of "#who")
  }
</nobelium>
```

## Load data

```html
<button id="load">Load</button>
<p id="out"></p>

<nobelium>
  when click "#load" {
    set text "#out" to "loading..."
    get "https://jsonplaceholder.typicode.com/todos/1" into todo
    set text "#out" to todo.title
  }
</nobelium>
```

## Show a message for a few seconds

```html
<button id="b">Save</button>
<p id="toast" style="display:none">saved!</p>

<nobelium>
  when click "#b" {
    fade in "#toast"
    wait 2s
    fade out "#toast"
  }
</nobelium>
```

## Keyboard shortcut

```html
<p id="out">press s</p>

<nobelium>
  when key "s" {
    set text "#out" to "saved"
  }
</nobelium>
```

## Persistent todo list (lists, interpolation, storage)

```html
<input id="t" placeholder="new item"> <button id="add">Add</button>
<p id="out"></p>

<nobelium>
  let todos = saved("todos") or []

  fn draw() {
    set text "#out" to "{len(todos)} items: {join(todos, ', ')}"
  }

  when click "#add" {
    let t = trim(value of "#t")
    if t == "" { return }
    push(todos, t)
    save todos as "todos"
    set value "#t" to ""
    draw()
  }

  draw()
</nobelium>
```

## Stopwatch (timers)

```html
<h2 id="time">0s</h2>
<button id="start">Start</button> <button id="stop">Stop</button>

<nobelium>
  let secs = 0
  let running = null

  when click "#start" {
    if running == null {
      every 1s as tick {
        secs += 1
        set text "#time" to "{secs}s"
      }
      running = tick
    }
  }
  when click "#stop" {
    if running != null {
      cancel running
      running = null
    }
  }
</nobelium>
```

## Animated box

```html
<div id="box" style="position:relative;left:0;width:60px;height:60px;background:gold"></div>
<button id="go">Move</button> <button id="no">No!</button>

<nobelium>
  when click "#go" {
    animate "#box" to { left: 200, backgroundColor: "tomato" } over 600ms ease "ease-in-out"
    animate "#box" to { left: 0, backgroundColor: "gold" } over 600ms
  }
  when click "#no" { animate "#box" shake }
</nobelium>
```

## Post a form as JSON

```html
<form id="f"><input id="title" placeholder="title"> <button>Send</button></form>
<p id="msg"></p>

<nobelium>
  when submit "#f" {
    stop
    set text "#msg" to "sending..."
    post "https://jsonplaceholder.typicode.com/posts" with { title: value of "#title", userId: 1 } into created
    set text "#msg" to "saved as post #{created.id}"
  }
</nobelium>
```

## Handle error statuses yourself (fetch)

```html
<button id="b">Check</button> <p id="out"></p>

<nobelium>
  when click "#b" {
    fetch "https://jsonplaceholder.typicode.com/todos/99999" into res
    if res.ok {
      set text "#out" to "found: {res.json.title}"
    } else {
      set text "#out" to "not found (status {res.status})"
    }
  }
</nobelium>
```

## Read a streaming response line by line

```html
<button id="go">Stream</button> <pre id="out"></pre>

<nobelium>
  when click "#go" {
    set text "#out" to ""
    let count = 0
    stream "https://httpbin.org/stream/3" with { lines: true } into line {
      count += 1
      let item = parse(line)
      set text "#out" to "{text of "#out"}#{count}: {item.url}\n"
    }
    log "done, {count} lines"
  }
</nobelium>
```

## Shortcuts and scroll

```html
<p id="out">try ctrl+k, or double click this text</p>
<button id="up" style="position:fixed;bottom:10px;right:10px;display:none">Top</button>

<nobelium>
  when key "ctrl+k" {
    stop
    set text "#out" to "search opened"
  }
  when dblclick "#out" { set text "#out" to "double clicked" }
  when scroll {
    if event.scroll > 300 { show "#up" } else { hide "#up" }
  }
</nobelium>
```

## Two files with import

`utils.nbm`:

```nobelium
export fn greet(name) {
  return "hello, {name}!"
}
export let version = "1.0"
```

`index.html`:

```html
<p id="out"></p>
<nobelium>
  import greet, version from "utils.nbm"
  set text "#out" to "{greet("sam")} (v{version})"
</nobelium>
```
