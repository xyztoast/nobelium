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
];
