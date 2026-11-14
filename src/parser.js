// Nobelium parser: tokens -> AST (plain objects). Recursive descent.
(function (N) {
  const E = N.NobeliumError;
  const PRESETS = ['shake', 'pulse', 'bounce', 'spin', 'flash', 'wobble'];
  const CLAUSES = ['from', 'to', 'over', 'ease', 'delay', 'times'];
  function build(T) {
    let p = 0;
    const next = () => T[p++];
    const isId = v => T[p].t === 'id' && (v === undefined || T[p].v === v);
    const isOp = v => T[p].t === 'op' && T[p].v === v;
    const desc = k => k.t === 'eof' ? 'end of file' : k.t === 'tpl' ? 'a string' : '"' + k.v + '"';
    const fail = m => { throw new E(m, T[Math.min(p, T.length - 1)].line); };
    const expectOp = v => { if (!isOp(v)) fail('expected "' + v + '" but found ' + desc(T[p])); return next(); };
    const expectId = v => { if (!isId(v)) fail('expected "' + v + '" but found ' + desc(T[p])); return next(); };
    const name = () => { if (T[p].t !== 'id') fail('expected a name but found ' + desc(T[p])); return next().v; };

    function lvl(sub, ops) {
      return function () {
        let l = sub();
        for (;;) {
          const k = T[p];
          if ((k.t === 'op' || k.t === 'id') && ops.indexOf(k.v) >= 0) { next(); l = { k: 'bin', op: k.v, l: l, r: sub(), L: k.line }; }
          else return l;
        }
      };
    }
    function unary() {
      const k = T[p];
      if (k.t === 'id' && k.v === 'not') { next(); return { k: 'un', op: 'not', e: unary() }; }
      if (k.t === 'op' && k.v === '-') { next(); return { k: 'un', op: '-', e: unary(), L: k.line }; }
      return primary();
    }
    const mul = lvl(unary, ['*', '/', '%']), add = lvl(mul, ['+', '-']), cmp = lvl(add, ['<', '>', '<=', '>=']),
      eq = lvl(cmp, ['==', '!=']), and = lvl(eq, ['and']), or = lvl(and, ['or']);
    const expr = () => or();

    function args() {
      expectOp('('); const a = [];
      while (!isOp(')')) { a.push(expr()); if (isOp(',')) next(); else break; }
      expectOp(')'); return a;
    }
    function postfix(e) {
      for (;;) {
        if (isOp('.')) { const k = next(); e = { k: 'member', o: e, n: name(), L: k.line }; }
        else if (isOp('[')) { const k = next(); const i = expr(); expectOp(']'); e = { k: 'index', o: e, i: i, L: k.line }; }
        else return e;
      }
    }
    function primary() {
      const k = next(); let e;
      if (k.t === 'num' || k.t === 'str') e = { k: 'lit', v: k.v };
      else if (k.t === 'tpl') e = { k: 'tpl', parts: k.parts.map(x => typeof x === 'string' ? x : N.parseExpr(x.src, x.line)) };
      else if (k.t === 'op' && k.v === '(') { e = expr(); expectOp(')'); }
      else if (k.t === 'op' && k.v === '[') {
        const items = []; while (!isOp(']')) { items.push(expr()); if (isOp(',')) next(); else break; }
        expectOp(']'); e = { k: 'list', items: items };
      }
      else if (k.t === 'op' && k.v === '{') {
        const props = [];
        while (!isOp('}')) {
          const kt = next(); if (kt.t !== 'id' && kt.t !== 'str') { p--; fail('expected a key name but found ' + desc(kt)); }
          expectOp(':'); props.push([kt.v, expr()]); if (isOp(',')) next(); else break;
        }
        expectOp('}'); e = { k: 'obj', props: props, L: k.line };
      }
      else if (k.t === 'id') {
        if (k.v === 'true') e = { k: 'lit', v: true };
        else if (k.v === 'false') e = { k: 'lit', v: false };
        else if (k.v === 'null') e = { k: 'lit', v: null };
        else if ((k.v === 'value' || k.v === 'text') && isId('of')) { next(); return { k: 'read', prop: k.v, sel: primary(), L: k.line }; }
        else e = isOp('(') ? { k: 'call', n: k.v, args: args(), L: k.line } : { k: 'var', n: k.v, L: k.line };
      }
      else { p--; fail('unexpected ' + desc(k)); }
      return postfix(e);
    }
    function block() {
      expectOp('{'); const b = [];
      while (!isOp('}')) { if (T[p].t === 'eof') fail('missing "}" to close the block'); b.push(stmt()); }
      next(); return b;
    }
    function optWith() { if (isId('with')) { next(); return expr(); } return null; }
    function stmt() {
      const k = T[p]; if (k.t !== 'id') fail('unexpected ' + desc(k));
      const L = k.line; next();
      switch (k.v) {
        case 'when': { const ev = name(); const sel = isOp('{') ? null : primary(); return { k: 'when', ev: ev, sel: sel, body: block(), L: L }; }
        case 'let': { const n = name(); expectOp('='); return { k: 'let', n: n, e: expr(), L: L }; }
        case 'set': { const prop = name(); const sel = primary(); expectId('to'); return { k: 'set', prop: prop, sel: sel, e: expr(), L: L }; }
        case 'fn': { const n = name(); expectOp('('); const ps = [];
          while (!isOp(')')) { ps.push(name()); if (isOp(',')) next(); else break; }
          expectOp(')'); return { k: 'fn', n: n, ps: ps, body: block(), L: L }; }
        case 'if': { const c = expr(), a = block(); let b = null;
          if (isId('else')) { next(); b = isId('if') ? [stmt()] : block(); }
          return { k: 'if', c: c, a: a, b: b, L: L }; }
        case 'repeat': { const n = expr(); return { k: 'repeat', n: n, body: block(), L: L }; }
        case 'for': { expectId('each'); const n = name(); expectId('in'); const it = expr(); return { k: 'foreach', n: n, it: it, body: block(), L: L }; }
        case 'break': return { k: 'break', L: L };
        case 'return': return { k: 'return', e: (isOp('}') || T[p].t === 'eof') ? null : expr(), L: L };
        case 'stop': return { k: 'stop', L: L };
        case 'show': case 'hide': return { k: 'vis', op: k.v, sel: primary(), L: L };
        case 'toggle': if (isId('class')) { next(); const c = expr(); expectId('on'); return { k: 'cls', op: 'toggle', c: c, sel: primary(), L: L }; }
          return { k: 'vis', op: 'toggle', sel: primary(), L: L };
        case 'add': { expectId('class'); const c = expr(); expectId('to'); return { k: 'cls', op: 'add', c: c, sel: primary(), L: L }; }
        case 'remove': { expectId('class'); const c = expr(); expectId('from'); return { k: 'cls', op: 'remove', c: c, sel: primary(), L: L }; }
        case 'fade': { const dir = name(); if (dir !== 'in' && dir !== 'out') fail('use "fade in" or "fade out"'); return { k: 'fade', dir: dir, sel: primary(), L: L }; }
        case 'animate': {
          const a = { k: 'animate', sel: primary(), from: null, to: null, over: null, ease: null, delay: null, times: null, nowait: false, preset: null, L: L };
          for (;;) {
            const t = T[p]; if (t.t !== 'id') break;
            if (PRESETS.indexOf(t.v) >= 0 && !a.preset) { next(); a.preset = t.v; }
            else if (t.v === 'nowait') { next(); a.nowait = true; }
            else if (CLAUSES.indexOf(t.v) >= 0) { next(); a[t.v] = expr(); }
            else break;
          }
          if (!a.preset && !a.to && !a.from) fail('animate needs "to { ... }" or a preset (' + PRESETS.join(', ') + ')');
          return a; }
        case 'wait': return { k: 'wait', e: expr(), L: L };
        case 'log': return { k: 'log', e: expr(), L: L };
        case 'fetch': { const url = expr(); const opts = optWith(); expectId('into'); return { k: 'fetch', url: url, opts: opts, n: name(), L: L }; }
        case 'get': case 'post': case 'put': case 'patch': case 'delete': {
          const url = expr(); let body = null, hd = null;
          if (isId('with')) { if (k.v === 'get') fail('"get" cannot send a body (use post, or fetch with options)'); next(); body = expr(); }
          if (isId('headers')) { next(); hd = expr(); }
          expectId('into'); return { k: 'http', m: k.v, url: url, body: body, hd: hd, n: name(), L: L }; }
        case 'stream': { const url = expr(); const opts = optWith(); expectId('into'); const n = name(); return { k: 'stream', url: url, opts: opts, n: n, body: block(), L: L }; }
        case 'every': case 'after': { const d = expr(); let n = null; if (isId('as')) { next(); n = name(); } return { k: 'timer', kind: k.v, d: d, n: n, body: block(), L: L }; }
        case 'cancel': return { k: 'cancel', e: expr(), L: L };
        case 'save': { const v = expr(); expectId('as'); return { k: 'save', e: v, key: expr(), L: L }; }
        case 'forget': return { k: 'forget', key: expr(), L: L };
        case 'clear': expectId('storage'); return { k: 'clearstore', L: L };
        case 'import': {
          if (T[p].t === 'str' || T[p].t === 'tpl') return { k: 'import', names: null, src: primary(), L: L };
          const names = [name()]; while (isOp(',')) { next(); names.push(name()); }
          expectId('from'); return { k: 'import', names: names, src: primary(), L: L }; }
        case 'export': if (!isId('fn') && !isId('let')) fail('"export" must be followed by fn or let'); return { k: 'export', s: stmt(), L: L };
        default: {
          p--; const e = primary();
          if (e.k === 'call') return { k: 'call', e: e, L: L };
          const AS = { '=': null, '+=': '+', '-=': '-' }, t = T[p];
          if (t.t === 'op' && Object.prototype.hasOwnProperty.call(AS, t.v) && (e.k === 'var' || e.k === 'member' || e.k === 'index')) {
            next(); let v = expr(); if (AS[t.v]) v = { k: 'bin', op: AS[t.v], l: e, r: v, L: L };
            return { k: 'assign', t: e, e: v, L: L };
          }
          throw new E(e.k === 'var' ? 'unexpected "' + e.n + '" (typo? statements start with when, let, set, if, show, ...)' : 'this is not a statement', L);
        }
      }
    }
    return {
      prog: function () { const r = []; while (T[p].t !== 'eof') r.push(stmt()); return r; },
      expr: function () { const e = expr(); if (T[p].t !== 'eof') fail('unexpected ' + desc(T[p]) + ' inside {...}'); return e; }
    };
  }
  N.parse = src => build(N.tokenize(src)).prog();
  N.parseExpr = (src, line) => build(N.tokenize(src, line)).expr();
})(window.Nobelium = window.Nobelium || {});
