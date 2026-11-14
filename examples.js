window.EXAMPLES = [
{ id: 'toggle', name: 'Toggle a menu', html: `<button id="b">Menu</button>
<ul id="menu" style="display:none"><li>Home</li><li>About</li></ul>`, code: `when click "#b" {
  toggle "#menu"
}` },
{ id: 'counter', name: 'Counter (variables)', html: `<h2 id="n">0</h2>
<button id="inc">+1</button> <button id="reset">Reset</button>`, code: `let count = 0

when click "#inc" {
  count = count + 1
  set text "#n" to count
}

when click "#reset" {
  count = 0
  set text "#n" to count
}` },
{ id: 'form', name: 'Form validation', html: `<form id="f"><input id="email" placeholder="email"> <button>Join</button></form>
<p id="msg"></p>`, code: `when submit "#f" {
  stop
  if not contains(value of "#email", "@") {
    set text "#msg" to "enter a valid email"
  } else {
    set text "#msg" to "thanks for joining!"
  }
}` },
{ id: 'modal', name: 'Modal + Escape key', html: `<button id="open">Open</button>
<div id="modal" style="display:none;border:2px solid #333;padding:12px;margin-top:8px">
  hello from the modal <button id="close">Close</button>
</div>`, code: `when click "#open" { fade in "#modal" }
when click "#close" { fade out "#modal" }
when key "Escape" { fade out "#modal" }` },
{ id: 'tabs', name: 'Tabs', html: `<button id="t1">One</button> <button id="t2">Two</button>
<div id="p1">panel one</div><div id="p2" style="display:none">panel two</div>`, code: `when click "#t1" {
  show "#p1"
  hide "#p2"
}
when click "#t2" {
  show "#p2"
  hide "#p1"
}` },
{ id: 'functions', name: 'Functions + hover', html: `<style>.glow{background:gold}</style>
<input id="who" placeholder="your name"> <button id="go">Greet</button>
<p id="out"></p>`, code: `fn greet(name) {
  if name == "" { return "hello, stranger!" }
  return "hello, " + upper(name) + "!"
}

when click "#go" {
  set text "#out" to greet(value of "#who")
}
when hover "#go" { add class "glow" to "#go" }
when leave "#go" { remove class "glow" from "#go" }` },
{ id: 'fetch', name: 'HTTP request', html: `<button id="load">Load a todo</button>
<p id="out"></p>`, code: `when click "#load" {
  set text "#out" to "loading..."
  get "https://jsonplaceholder.typicode.com/todos/1" into todo
  set text "#out" to todo.title
}` }
,
{ id: 'http', name: 'POST request', html: `<form id="f"><input id="title" placeholder="title"> <button>Send</button></form>
<p id="msg"></p>`, code: `when submit "#f" {
  stop
  set text "#msg" to "sending..."
  post "https://jsonplaceholder.typicode.com/posts" with { title: value of "#title", userId: 1 } into created
  set text "#msg" to "saved as post #{created.id}"
}` },
{ id: 'stream', name: 'Streaming response', html: `<button id="go">Stream</button>
<pre id="out"></pre>`, code: `when click "#go" {
  set text "#out" to ""
  let count = 0
  stream "https://httpbin.org/stream/3" with { lines: true } into line {
    count += 1
    let item = parse(line)
    set text "#out" to "{text of "#out"}#{count}: {item.url}\\n"
  }
  log "done, {count} lines"
}` },
{ id: 'storage', name: 'Save data (localStorage)', html: `<p id="v"></p>
<button id="r">Reset</button>`, code: `let visits = saved("visits") or 0
visits += 1
save visits as "visits"
set text "#v" to "run number {visits}"

when click "#r" {
  forget "visits"
  set text "#v" to "reset! reload to start again"
}` },
{ id: 'todos', name: 'Todo list (lists + storage)', html: `<input id="t" placeholder="new item"> <button id="add">Add</button>
<p id="out"></p>`, code: `let todos = saved("todos") or []

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

draw()` },
{ id: 'timers', name: 'Stopwatch (timers)', html: `<h2 id="time">0s</h2>
<button id="start">Start</button> <button id="stop">Stop</button>`, code: `let secs = 0
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
}` },
{ id: 'animate', name: 'Animation', html: `<div id="box" style="position:relative;left:0;width:60px;height:60px;background:gold;margin:8px 0"></div>
<button id="go">Move</button> <button id="no">Shake</button>`, code: `when click "#go" {
  animate "#box" to { left: 200, backgroundColor: "tomato" } over 600ms ease "ease-in-out"
  animate "#box" to { left: 0, backgroundColor: "gold" } over 600ms
}
when click "#no" { animate "#box" shake }` },
{ id: 'events', name: 'Shortcuts and more events', html: `<p id="out">try ctrl+k, double click, or right click here</p>`, code: `when key "ctrl+k" {
  stop
  set text "#out" to "search opened"
}
when dblclick "#out" { set text "#out" to "double clicked" }
when rightclick "#out" {
  stop
  set text "#out" to "right clicked at {event.x}, {event.y}"
}` },
{ id: 'import', name: 'Import from another file', html: `<p id="out"></p>`, lib: `export fn greet(name) {
  return "hello, {name}!"
}
export let version = "1.0"`, code: `import greet, version from "lib.nbm"

set text "#out" to "{greet("sam")} (v{version})"` }
];
