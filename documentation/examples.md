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
