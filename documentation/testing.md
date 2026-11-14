# Testing your Nobelium code

```nobelium
let n = 0
when click "#add" {
  n += 1
  set text "#out" to n
}

test "clicking adds one" {
  trigger click "#add"
  assert text of "#out" == "1", "the counter should show 1"
}

test "twice gives two" {
  trigger click "#add"
  assert n == 2
}

run tests
```

| statement | what it does |
|---|---|
| `test "name" { ... }` | register a test. It does not run yet |
| `assert expr` / `assert expr, "message"` | fail the test if the expression is false |
| `trigger click "#sel"` | fire an event on the matching elements and wait a moment (20 ms) for handlers |
| `run tests` | run every test registered so far, one after another |

Output (console, or the playground console):

```
test passed: clicking adds one
test FAILED: twice gives two - line 14: assertion failed
1 passed, 1 failed
```

Notes:

- Tests run against the real page, so they can change it. Tests run in order and share the page and the variables of the file, so a later test sees what an earlier one did (above, `n` is already 1 in the second test).
- Any error inside a test (a missing element, an unknown variable) also fails it.
- `trigger` takes any event name from [events](events.md). If a handler uses `wait` or `get`, add your own `wait` before asserting.
- Errors inside the **handlers** that a test triggers are reported as usual but do not fail the test. Assert on what they should have changed.
- Put tests in a separate file and `import "tests.nbm"` while developing, then remove the import for production.
