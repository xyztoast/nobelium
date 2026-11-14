// Nobelium parser: tokens -> AST (plain objects). Recursive descent.
(function (N) {
  const E = N.NobeliumError;
  N.parse = function (src) {
    const T = N.tokenize(src); let p = 0;
    const next = () => T[p++];
    const isId = v => T[p].t === 'id' && (v === undefined || T[p].v === v);
    const isOp = v => T[p].t === 'op' && T[p].v === v;
    const desc = k => k.t === 'eof' ? 'end of file' : '"' + k.v + '"';
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
    function primary() {
      const k = next();
      if (k.t === 'num' || k.t === 'str') return { k: 'lit', v: k.v };
      if (k.t === 'op' && k.v === '(') { const e = expr(); expectOp(')'); return e; }
      if (k.t === 'id') {
        if (k.v === 'true') return { k: 'lit', v: true };
        if (k.v === 'false') return { k: 'lit', v: false };
        if (k.v === 'null') return { k: 'lit', v: null };
        if ((k.v === 'value' || k.v === 'text') && isId('of')) { next(); return { k: 'read', prop: k.v, sel: primary(), L: k.line }; }
        let e = isOp('(') ? { k: 'call', n: k.v, args: args(), L: k.line } : { k: 'var', n: k.v, L: k.line };
        while (isOp('.')) { next(); e = { k: 'member', o: e, n: name(), L: k.line }; }
        return e;
      }
      p--; fail('unexpected ' + desc(k));
    }
    function block() {
      expectOp('{'); const b = [];
      while (!isOp('}')) { if (T[p].t === 'eof') fail('missing "}" to close the block'); b.push(stmt()); }
      next(); return b;
    }
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
        case 'return': return { k: 'return', e: (isOp('}') || T[p].t === 'eof') ? null : expr(), L: L };
        case 'stop': return { k: 'stop', L: L };
        case 'show': case 'hide': return { k: 'vis', op: k.v, sel: primary(), L: L };
        case 'toggle': if (isId('class')) { next(); const c = expr(); expectId('on'); return { k: 'cls', op: 'toggle', c: c, sel: primary(), L: L }; }
          return { k: 'vis', op: 'toggle', sel: primary(), L: L };
        case 'add': { expectId('class'); const c = expr(); expectId('to'); return { k: 'cls', op: 'add', c: c, sel: primary(), L: L }; }
        case 'remove': { expectId('class'); const c = expr(); expectId('from'); return { k: 'cls', op: 'remove', c: c, sel: primary(), L: L }; }
        case 'fade': { const dir = name(); if (dir !== 'in' && dir !== 'out') fail('use "fade in" or "fade out"'); return { k: 'fade', dir: dir, sel: primary(), L: L }; }
        case 'wait': return { k: 'wait', e: expr(), L: L };
        case 'log': return { k: 'log', e: expr(), L: L };
        case 'get': { const url = expr(); expectId('into'); return { k: 'get', url: url, n: name(), L: L }; }
        default:
          if (isOp('=')) { next(); return { k: 'assign', n: k.v, e: expr(), L: L }; }
          if (isOp('(')) { p--; const e = expr(); return { k: 'call', e: e, L: L }; }
          p--; fail('unexpected "' + k.v + '" (typo? statements start with when, let, set, if, show, ...)');
      }
    }
    const prog = [];
    while (T[p].t !== 'eof') prog.push(stmt());
    return prog;
  };
})(window.Nobelium = window.Nobelium || {});
