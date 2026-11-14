// Nobelium lexer: turns source text into tokens. No eval, no Function().
(function (N) {
  class NobeliumError extends Error {
    constructor(m, line) { super(line ? 'line ' + line + ': ' + m : m); this.name = 'NobeliumError'; this.line = line; }
  }
  N.NobeliumError = NobeliumError;
  const OPS2 = ['==', '!=', '<=', '>=', '+=', '-='], OPS1 = '+-*/%<>=(){},.:[]';
  N.tokenize = function (src, startLine) {
    const out = [], len = src.length; let i = 0, line = startLine || 1;
    const bad = m => { throw new NobeliumError(m, line); };
    while (i < len) {
      const c = src[i];
      if (c === '\n') { line++; i++; }
      else if (/\s/.test(c)) i++;
      else if (c === '/' && src[i + 1] === '/') { while (i < len && src[i] !== '\n') i++; }
      else if (/\d/.test(c)) {
        const m = /^\d+(\.\d+)?(ms|s)?/.exec(src.slice(i)); let v = parseFloat(m[0]);
        if (m[2] === 's') v *= 1000;
        out.push({ t: 'num', v: v, line: line }); i += m[0].length;
      }
      else if (c === '"' || c === "'") {
        // double quotes can hold {expressions}; single quotes are always plain text
        const q = c, interp = q === '"', parts = []; let s = ''; i++;
        while (i < len && src[i] !== q) {
          const ch = src[i];
          if (ch === '\n') bad('string is missing its closing quote');
          if (ch === '\\') { i++; if (i >= len) bad('string is missing its closing quote'); const e = src[i]; s += e === 'n' ? '\n' : e === 't' ? '\t' : e; i++; continue; }
          if (interp && ch === '{') {
            let d = 1, j = i + 1;
            while (j < len && d > 0) {
              const x = src[j];
              if (x === '\n') bad('"{" in a string is missing its closing "}" (use \\{ for a literal brace)');
              if (x === '"' || x === "'") {
                j++; while (j < len && src[j] !== x) { if (src[j] === '\n') bad('string is missing its closing quote'); if (src[j] === '\\') j++; j++; }
                if (j >= len) bad('string is missing its closing quote');
              } else if (x === '{') d++; else if (x === '}') d--;
              j++;
            }
            if (d > 0) bad('"{" in a string is missing its closing "}" (use \\{ for a literal brace)');
            parts.push(s); s = ''; parts.push({ src: src.slice(i + 1, j - 1), line: line }); i = j; continue;
          }
          s += ch; i++;
        }
        if (i >= len) bad('string is missing its closing quote');
        i++; parts.push(s);
        if (parts.length === 1) out.push({ t: 'str', v: parts[0], line: line });
        else out.push({ t: 'tpl', parts: parts.filter(x => x !== ''), line: line });
      }
      else if (/[A-Za-z_]/.test(c)) { const w = /^\w+/.exec(src.slice(i))[0]; out.push({ t: 'id', v: w, line: line }); i += w.length; }
      else if (OPS2.indexOf(src.substr(i, 2)) >= 0) { out.push({ t: 'op', v: src.substr(i, 2), line: line }); i += 2; }
      else if (OPS1.indexOf(c) >= 0) { out.push({ t: 'op', v: c, line: line }); i++; }
      else bad('unexpected character "' + c + '"');
    }
    out.push({ t: 'eof', line: line });
    return out;
  };
})(window.Nobelium = window.Nobelium || {});
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
// Nobelium interpreter: walks the AST. Nothing is ever passed to eval/Function.
(function (N) {
  const E = N.NobeliumError;
  N.files = N.files || {};          // virtual files for import: { "name.nbm": "source" }
  N.modules = new Map();            // imported modules, shared by the whole page
  const MEM = new Map();            // fallback when localStorage is unavailable
  class Scope {
    constructor(p) { this.v = new Map(); this.p = p || null; }
    find(n) { for (let s = this; s; s = s.p) if (s.v.has(n)) return s; return null; }
    get(n, L) { const s = this.find(n); if (!s) throw new E('"' + n + '" is not defined', L); return s.v.get(n); }
    set(n, x, L) { const s = this.find(n); if (!s) throw new E('"' + n + '" is not defined (create it with let first)', L); s.v.set(n, x); }
    def(n, x) { this.v.set(n, x); }
  }
  class Fn { constructor(d, sc, owner) { this.d = d; this.sc = sc; this.owner = owner; } }
  class Ret { constructor(v) { this.v = v; } }
  class Brk {}
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const mk = o => Object.assign(Object.create(null), o || {});
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const BAD_KEYS = ['__proto__', 'constructor', 'prototype'];
  const EV = { hover: 'mouseover', leave: 'mouseout', keypress: 'keydown', key: 'keydown', rightclick: 'contextmenu', doubleclick: 'dblclick', press: 'mousedown', release: 'mouseup' };
  const WIN = ['resize', 'online', 'offline', 'hashchange', 'popstate', 'pageshow', 'beforeprint', 'afterprint'];
  const UNITLESS = ['opacity', 'zIndex', 'scale', 'flexGrow', 'flexShrink', 'lineHeight', 'fontWeight', 'order', 'zoom'];
  const camel = k => String(k).replace(/-([a-z])/g, (m, c) => c.toUpperCase());
  const T = (a, b) => [{ transform: a }, { transform: b }];
  const PRE = {
    shake: [0, -8, 8, -8, 8, 0].map(x => ({ transform: 'translateX(' + x + 'px)' })),
    pulse: [1, 1.12, 1].map(x => ({ transform: 'scale(' + x + ')' })),
    bounce: [0, -18, 0, -8, 0].map(x => ({ transform: 'translateY(' + x + 'px)' })),
    spin: T('rotate(0deg)', 'rotate(360deg)'),
    flash: [1, .15, 1, .15, 1].map(x => ({ opacity: x })),
    wobble: [0, -6, 5, -3, 0].map(x => ({ transform: 'rotate(' + x + 'deg)' }))
  };

  N.Interpreter = class {
    constructor(o) {
      this.doc = o.doc || document; this.log = o.log || function () {};
      this.base = o.base || this.doc.baseURI || ''; this.chain = o.chain || [];
      this.g = new Scope(); this.off = []; this.depth = 0; this.exports = new Map(); this.timers = new Map(); this.tid = 0;
      const lst = (a, w) => { if (!Array.isArray(a)) throw new E(w + ' needs a list'); return a; };
      this.B = {
        len: a => a == null ? 0 : a.length, upper: a => String(a).toUpperCase(), lower: a => String(a).toLowerCase(),
        trim: a => String(a).trim(), num: a => Number(a), str: a => String(a), round: a => Math.round(a),
        floor: a => Math.floor(a), abs: a => Math.abs(a), min: function () { return Math.min.apply(null, arguments); }, max: function () { return Math.max.apply(null, arguments); },
        contains: (a, b) => Array.isArray(a) ? a.indexOf(b) >= 0 : String(a).indexOf(String(b)) >= 0,
        random: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a, now: () => Date.now(),
        item: (a, i) => Array.isArray(a) && i >= 0 && i < a.length ? a[i] : null,
        exists: s => this.doc.querySelector(s) !== null,
        push: (a, x) => { lst(a, 'push').push(x); return a; },
        keys: o => o && typeof o === 'object' ? Object.keys(o) : [],
        json: x => JSON.stringify(x), parse: t => { try { return JSON.parse(t); } catch (e) { return null; } },
        split: (t, s) => String(t).split(String(s)), join: (a, s) => Array.isArray(a) ? a.join(s === undefined ? ',' : String(s)) : String(a),
        replace: (t, a, b) => String(t).split(String(a)).join(String(b)),
        starts: (t, p) => String(t).indexOf(String(p)) === 0, ends: (t, p) => String(t).endsWith(String(p)),
        slice: (x, a, b) => Array.isArray(x) || typeof x === 'string' ? x.slice(a, b) : null,
        saved: k => this.sget(String(k))
      };
    }
    fmt(v) { return v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v); }
    win() { return this.doc.defaultView || window; }
    shown(el) { return this.win().getComputedStyle(el).display !== 'none'; }
    show(el) { el.style.display = ''; el.style.opacity = ''; if (!this.shown(el)) el.style.display = 'block'; }
    q(sel, L) {
      if (typeof sel !== 'string') throw new E('expected a selector string like "#id" but got ' + typeof sel, L);
      let l; try { l = Array.from(this.doc.querySelectorAll(sel)); } catch (e) { throw new E('"' + sel + '" is not a valid selector', L); }
      if (!l.length) throw new E('no element matches "' + sel + '"', L);
      return l;
    }
    fail(x) {
      if (x instanceof Ret) return;
      if (x instanceof Brk) { this.log('error', '"break" can only be used inside a loop'); return; }
      this.log('error', x instanceof E ? x.message : 'internal error: ' + x.message);
    }
    // ---- storage (localStorage, falls back to memory) ----
    store() {
      if (this._st === undefined) {
        try { const s = this.win().localStorage; s.setItem('__nbm', '1'); s.removeItem('__nbm'); this._st = s; }
        catch (e) { this._st = null; this.log('log', 'note: localStorage is not available here, saved values are kept in memory only'); }
      }
      return this._st;
    }
    sget(k) {
      const s = this.store(), raw = s ? s.getItem('nobelium:' + k) : (MEM.has(k) ? MEM.get(k) : null);
      if (raw === null) return null; try { return JSON.parse(raw); } catch (e) { return raw; }
    }
    sset(k, v, L) {
      if (typeof k !== 'string' || !k) throw new E('save needs a name in quotes, like save count as "count"', L);
      if (v instanceof Fn) throw new E('cannot save a function', L);
      const raw = JSON.stringify(v), s = this.store();
      if (!s) { MEM.set(k, raw); return; }
      try { s.setItem('nobelium:' + k, raw); } catch (e) { throw new E('could not save "' + k + '" (storage is full or blocked)', L); }
    }
    sdel(k) { const s = this.store(); if (s) s.removeItem('nobelium:' + k); else MEM.delete(k); }
    sclear() {
      const s = this.store(); if (!s) { MEM.clear(); return; }
      const ks = []; for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k.indexOf('nobelium:') === 0) ks.push(k); }
      ks.forEach(k => s.removeItem(k));
    }
    // ---- http ----
    hdrs(o) {
      const h = {}; if (o === null || o === undefined) return h;
      if (typeof o !== 'object' || Array.isArray(o)) throw new E('headers must be an object like { Accept: "application/json" }');
      Object.keys(o).forEach(k => { h[k] = String(o[k]); }); return h;
    }
    mkInit(method, body, hd) {
      const init = { method: String(method || 'GET').toUpperCase() }, h = this.hdrs(hd);
      if (body !== null && body !== undefined) {
        if (typeof body === 'object') { init.body = JSON.stringify(body); if (!Object.keys(h).some(k => k.toLowerCase() === 'content-type')) h['Content-Type'] = 'application/json'; }
        else init.body = String(body);
      }
      init.headers = h; return init;
    }
    async send(url, init, L) {
      if (typeof url !== 'string') throw new E('the url must be text but got ' + typeof url, L);
      try { return await fetch(url, init); } catch (e) { throw new E('request to "' + url + '" failed (network error, or blocked by CORS)', L); }
    }
    // ---- imports ----
    async load(path, L) {
      let key = path, src;
      if (own(N.files, path)) { src = N.files[path]; key = 'file:' + path; }
      else {
        let u, b; try { u = new URL(path, this.base); b = new URL(this.base); } catch (e) { throw new E('"' + path + '" is not a valid import path', L); }
        if (u.origin !== b.origin && !(N.config && N.config.allowRemoteImports)) throw new E('cannot import "' + path + '" from another site', L);
        key = u.href;
      }
      if (this.chain.indexOf(key) >= 0) throw new E('circular import of "' + path + '"', L);
      let m = N.modules.get(key);
      if (!m) {
        m = (async () => {
          if (src === undefined) {
            let r; try { r = await fetch(key); } catch (e) { throw new E('could not load "' + path + '"', L); }
            if (!r.ok) throw new E('could not load "' + path + '" (status ' + r.status + ')', L);
            src = await r.text();
          }
          let ast; try { ast = N.parse(src); } catch (e) { throw new E(path + ': ' + e.message, L); }
          const it = new N.Interpreter({ doc: this.doc, log: (l, msg) => this.log(l, path + ': ' + msg), base: key, chain: this.chain.concat(key) });
          N.programs && N.programs.push(it);
          await it.start(ast); return it;
        })();
        N.modules.set(key, m); m.catch(() => N.modules.delete(key));
      }
      return m;
    }
    // ---- running ----
    async start(ast) {
      const fnOf = s => s.k === 'fn' ? s : (s.k === 'export' && s.s.k === 'fn' ? s.s : null);
      for (const s of ast) { const f = fnOf(s); if (f) { const fn = new Fn(f, this.g, this); this.g.def(f.n, fn); if (s.k === 'export') this.exports.set(f.n, fn); } }
      for (const s of ast) { if (fnOf(s)) continue; try { await this.exec(s, this.g); } catch (x) { this.fail(x); } }
    }
    dispose() {
      this.off.forEach(f => f()); this.off = [];
      this.timers.forEach(t => (t.every ? clearInterval : clearTimeout)(t.h)); this.timers.clear();
    }
    async block(b, sc) { for (const s of b) await this.exec(s, sc); }
    async run(body, parent, ev, e) {
      const sc = new Scope(parent); sc.def('event', ev); sc.def('__e', e || null);
      try { await this.block(body, sc); } catch (x) { this.fail(x); }
    }
    parseKey(v, L) {
      if (typeof v !== 'string' || !v) throw new E('key needs a name like "Escape" or "ctrl+s"', L);
      const parts = v === '+' ? [] : v.split('+'), key = v === '+' ? '+' : parts.pop(), mods = parts.map(x => x.toLowerCase());
      mods.forEach(m => { if (['ctrl', 'shift', 'alt', 'meta', 'cmd'].indexOf(m) < 0) throw new E('unknown key modifier "' + m + '" (use ctrl, shift, alt, meta)', L); });
      return { key: key, ctrl: mods.indexOf('ctrl') >= 0, shift: mods.indexOf('shift') >= 0, alt: mods.indexOf('alt') >= 0, meta: mods.indexOf('meta') >= 0 || mods.indexOf('cmd') >= 0 };
    }
    keyMatch(k, e) {
      const same = k.key.length === 1 ? String(e.key).toLowerCase() === k.key.toLowerCase() : e.key === k.key;
      return same && !!e.ctrlKey === k.ctrl && !!e.altKey === k.alt && !!e.metaKey === k.meta && (!k.shift || !!e.shiftKey);
    }
    async bind(s, sc) {
      if (s.ev === 'load') { await this.run(s.body, sc, mk({ type: 'load' })); return; }
      const type = EV[s.ev] || s.ev, target = WIN.indexOf(type) >= 0 ? this.win() : this.doc;
      const val = s.sel ? await this.ev(s.sel, sc) : null;
      let sel = null, key = null;
      if (s.ev === 'key') key = this.parseKey(val, s.L); else sel = val;
      if (sel !== null) { if (typeof sel !== 'string') throw new E('expected a selector string', s.L); try { this.doc.querySelector(sel); } catch (e) { throw new E('"' + sel + '" is not a valid selector', s.L); } }
      const guard = ['hover', 'leave', 'mouseenter', 'mouseleave'].indexOf(s.ev) >= 0;
      const h = e => {
        let t = e.target;
        if (sel !== null) { const hit = t && t.closest ? t.closest(sel) : null; if (!hit) return; t = hit; }
        if (key !== null && !this.keyMatch(key, e)) return;
        if (guard && t.contains && t.contains(e.relatedTarget)) return;
        const n = v => v === undefined ? null : v;
        this.run(s.body, sc, mk({ type: s.ev, key: n(e.key), value: n(t.value), text: n(t.textContent), x: n(e.clientX), y: n(e.clientY),
          ctrl: !!e.ctrlKey, shift: !!e.shiftKey, alt: !!e.altKey, meta: !!e.metaKey, scroll: this.win().scrollY || 0 }), e);
      };
      target.addEventListener(type, h, true); this.off.push(() => target.removeEventListener(type, h, true));
    }
    async callFn(f, a, L) {
      if (f.owner !== this) return f.owner.callFn(f, a, L);
      if (this.depth > 200) throw new E('too many nested function calls', L);
      this.depth++; const sc = new Scope(f.sc);
      f.d.ps.forEach((p, i) => sc.def(p, i < a.length ? a[i] : null));
      try { await this.block(f.d.body, sc); } catch (x) { if (x instanceof Ret) return x.v; if (x instanceof Brk) throw new E('"break" can only be used inside a loop', L); throw x; } finally { this.depth--; }
      return null;
    }
    async loop(body, sc, vars) {   // runs one loop pass; returns true if "break" was used
      const c = new Scope(sc); if (vars) c.def(vars[0], vars[1]);
      try { await this.block(body, c); } catch (x) { if (x instanceof Brk) return true; throw x; }
      return false;
    }
    cssObj(o, L) {
      if (o === null || typeof o !== 'object' || Array.isArray(o)) throw new E('animate needs an object like { opacity: 0.5, left: "100px" }', L);
      const r = {}; Object.keys(o).forEach(k => { const key = camel(k); let v = o[k]; if (typeof v === 'number' && UNITLESS.indexOf(key) < 0) v += 'px'; r[key] = String(v); }); return r;
    }
    async animate(s, sc) {
      const els = this.q(await this.ev(s.sel, sc), s.L), g = async x => x ? this.ev(x, sc) : null;
      const to = await g(s.to), from = await g(s.from);
      const toC = to ? this.cssObj(to, s.L) : null, fromC = from ? this.cssObj(from, s.L) : null;
      const dur = s.over ? Math.max(0, Number(await g(s.over)) || 0) : (s.preset ? 600 : 400);
      const delay = s.delay ? Math.max(0, Number(await g(s.delay)) || 0) : 0;
      const times = s.times ? Math.min(100, Math.max(1, Number(await g(s.times)) || 1)) : 1;
      const ease = s.ease ? String(await g(s.ease)) : 'ease';
      const one = async el => {
        let frames;
        if (s.preset) frames = PRE[s.preset];
        else if (fromC && !toC) { const cs = this.win().getComputedStyle(el), end = {}; Object.keys(fromC).forEach(k => { end[k] = cs[k]; }); frames = [fromC, end]; }
        else frames = fromC ? [fromC, toC] : [toC];
        if (typeof el.animate === 'function') {
          const a = el.animate(frames, { duration: dur, easing: ease, delay: delay, iterations: times, fill: s.preset ? 'none' : 'forwards' });
          try { await a.finished; } catch (e) {}
          if (!s.preset && toC) Object.assign(el.style, toC);
          try { a.cancel(); } catch (e) {}
        } else { await sleep(0); if (!s.preset && toC) Object.assign(el.style, toC); }
      };
      const all = Promise.all(els.map(one));
      if (s.nowait) all.catch(x => this.fail(x)); else await all;
    }
    async exec(s, sc) {
      switch (s.k) {
        case 'let': sc.def(s.n, await this.ev(s.e, sc)); break;
        case 'assign': { const v = await this.ev(s.e, sc), t = s.t;
          if (t.k === 'var') { sc.set(t.n, v, s.L); break; }
          const o = await this.ev(t.o, sc), k = t.k === 'member' ? t.n : await this.ev(t.i, sc);
          if (o === null || typeof o !== 'object') throw new E('cannot change a field of ' + this.fmt(o), s.L);
          if (Array.isArray(o)) { if (typeof k !== 'number' || k < 0 || k > o.length || Math.floor(k) !== k) throw new E('list position ' + this.fmt(k) + ' is out of range (0 to ' + o.length + ')', s.L); o[k] = v; }
          else { if (BAD_KEYS.indexOf(String(k)) >= 0) throw new E('"' + k + '" is a reserved name', s.L); o[String(k)] = v; }
          break; }
        case 'fn': sc.def(s.n, new Fn(s, sc, this)); break;
        case 'export': await this.exec(s.s, sc); this.exports.set(s.s.n, sc.get(s.s.n)); break;
        case 'import': { const path = await this.ev(s.src, sc);
          if (typeof path !== 'string') throw new E('import needs a file name in quotes', s.L);
          const it = await this.load(path, s.L);
          if (s.names) for (const n of s.names) { if (!it.exports.has(n)) throw new E('"' + path + '" does not export "' + n + '"', s.L); sc.def(n, it.exports.get(n)); }
          break; }
        case 'set': { const v = await this.ev(s.e, sc);
          for (const el of this.q(await this.ev(s.sel, sc), s.L)) {
            if (s.prop === 'text') el.textContent = this.fmt(v); else if (s.prop === 'value') el.value = v;
            else throw new E('cannot set "' + s.prop + '" (use text or value)', s.L);
          } break; }
        case 'vis': for (const el of this.q(await this.ev(s.sel, sc), s.L)) {
            if (s.op === 'show' || (s.op === 'toggle' && !this.shown(el))) this.show(el); else el.style.display = 'none';
          } break;
        case 'cls': { const c = await this.ev(s.c, sc);
          for (const el of this.q(await this.ev(s.sel, sc), s.L)) { if (s.op === 'add') el.classList.add(c); else if (s.op === 'remove') el.classList.remove(c); else el.classList.toggle(c); }
          break; }
        case 'fade': { const els = this.q(await this.ev(s.sel, sc), s.L);
          for (const el of els) { el.style.transition = 'opacity .3s'; if (s.dir === 'in') { el.style.opacity = '0'; this.show(el); el.style.opacity = '0'; void el.offsetWidth; el.style.opacity = '1'; } else el.style.opacity = '0'; }
          await sleep(300); if (s.dir === 'out') els.forEach(el => { el.style.display = 'none'; }); break; }
        case 'animate': await this.animate(s, sc); break;
        case 'wait': await sleep(Math.min(Number(await this.ev(s.e, sc)) || 0, 60000)); break;
        case 'log': this.log('log', this.fmt(await this.ev(s.e, sc))); break;
        case 'http': { const url = await this.ev(s.url, sc), body = s.body ? await this.ev(s.body, sc) : null, hd = s.hd ? await this.ev(s.hd, sc) : null;
          const r = await this.send(url, this.mkInit(s.m, body, hd), s.L);
          if (!r.ok) throw new E('request to "' + url + '" returned status ' + r.status, s.L);
          const t = await r.text(); let d = t; try { d = JSON.parse(t); } catch (e) {}
          sc.def(s.n, d); break; }
        case 'fetch': { const url = await this.ev(s.url, sc), o = s.opts ? await this.ev(s.opts, sc) : null;
          if (o !== null && (typeof o !== 'object' || Array.isArray(o))) throw new E('fetch options must be an object like { method: "POST", body: ... }', s.L);
          const r = await this.send(url, this.mkInit(o && o.method, o && o.body, o && o.headers), s.L);
          const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch (e) {}
          const hd = mk(); r.headers.forEach((v, k) => { hd[k] = v; });
          sc.def(s.n, mk({ status: r.status, ok: r.ok, statusText: r.statusText || '', url: r.url || url, headers: hd, text: text, json: json })); break; }
        case 'stream': { const url = await this.ev(s.url, sc), o = s.opts ? await this.ev(s.opts, sc) : null;
          if (o !== null && (typeof o !== 'object' || Array.isArray(o))) throw new E('stream options must be an object like { lines: true }', s.L);
          const r = await this.send(url, this.mkInit(o && o.method, o && o.body, o && o.headers), s.L), lines = !!(o && o.lines);
          if (!r.ok) throw new E('request to "' + url + '" returned status ' + r.status, s.L);
          let stopped = false;
          const give = async chunk => { if (!stopped && await this.loop(s.body, sc, [s.n, chunk])) stopped = true; };
          if (!r.body || !r.body.getReader) { const t = await r.text(); for (const c of (lines ? t.split('\n') : [t])) { await give(c); if (stopped) break; } break; }
          const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '';
          try {
            while (!stopped) {
              const { done, value } = await reader.read(); if (done) break;
              const txt = dec.decode(value, { stream: true });
              if (!lines) { if (txt) await give(txt); continue; }
              const parts = (buf + txt).split('\n'); buf = parts.pop();
              for (const ln of parts) { await give(ln.replace(/\r$/, '')); if (stopped) break; }
            }
            if (!stopped) { buf += dec.decode(); if (lines && buf) await give(buf.replace(/\r$/, '')); else if (!lines && buf) await give(buf); }
          } finally { try { await reader.cancel(); } catch (e) {} }
          break; }
        case 'timer': { const raw = Number(await this.ev(s.d, sc)) || 0, every = s.kind === 'every';
          const d = Math.min(every ? Math.max(16, raw) : Math.max(0, raw), 2147483647), id = ++this.tid;
          const go = () => this.run(s.body, sc, mk({ type: s.kind }), null); let h;
          if (every) h = setInterval(go, d); else h = setTimeout(() => { this.timers.delete(id); go(); }, d);
          this.timers.set(id, { every: every, h: h }); if (s.n) sc.def(s.n, id); break; }
        case 'cancel': { const id = await this.ev(s.e, sc), t = this.timers.get(id); if (t) { (t.every ? clearInterval : clearTimeout)(t.h); this.timers.delete(id); } break; }
        case 'save': { const v = await this.ev(s.e, sc); this.sset(await this.ev(s.key, sc), v, s.L); break; }
        case 'forget': this.sdel(String(await this.ev(s.key, sc))); break;
        case 'clearstore': this.sclear(); break;
        case 'if': if (await this.ev(s.c, sc)) await this.block(s.a, new Scope(sc)); else if (s.b) await this.block(s.b, new Scope(sc)); break;
        case 'repeat': { const n = Math.min(Number(await this.ev(s.n, sc)) || 0, 10000); for (let i = 0; i < n; i++) if (await this.loop(s.body, sc)) break; break; }
        case 'foreach': { const it = await this.ev(s.it, sc); let list;
          if (Array.isArray(it)) list = it.slice(); else if (typeof it === 'string') list = Array.from(it);
          else throw new E('"for each" needs a list or text but got ' + (it === null ? 'null' : typeof it), s.L);
          for (const x of list) if (await this.loop(s.body, sc, [s.n, x])) break; break; }
        case 'break': throw new Brk();
        case 'return': throw new Ret(s.e ? await this.ev(s.e, sc) : null);
        case 'stop': { const h = sc.find('__e'), e = h && h.v.get('__e'); if (e) e.preventDefault(); break; }
        case 'when': await this.bind(s, sc); break;
        case 'call': await this.ev(s.e, sc); break;
        default: throw new E('unknown statement "' + s.k + '"', s.L);
      }
    }
    async ev(e, sc) {
      switch (e.k) {
        case 'lit': return e.v;
        case 'var': return sc.get(e.n, e.L);
        case 'tpl': { let r = ''; for (const p of e.parts) r += typeof p === 'string' ? p : this.fmt(await this.ev(p, sc)); return r; }
        case 'list': { const a = []; for (const x of e.items) a.push(await this.ev(x, sc)); return a; }
        case 'obj': { const o = mk(); for (const [k, x] of e.props) { if (BAD_KEYS.indexOf(k) >= 0) throw new E('"' + k + '" is a reserved name', e.L); o[k] = await this.ev(x, sc); } return o; }
        case 'member': { const o = await this.ev(e.o, sc);
          if (o === null || typeof o !== 'object') throw new E('cannot read "' + e.n + '" of ' + this.fmt(o), e.L);
          return own(o, e.n) ? o[e.n] : null; }
        case 'index': { const o = await this.ev(e.o, sc), i = await this.ev(e.i, sc);
          if (Array.isArray(o) || typeof o === 'string') {
            if (typeof i !== 'number') throw new E('a list or text position must be a number', e.L);
            const j = i < 0 ? o.length + i : i; return j >= 0 && j < o.length && Math.floor(j) === j ? o[j] : null; }
          if (o !== null && typeof o === 'object') return own(o, String(i)) ? o[String(i)] : null;
          throw new E('cannot use [ ] on ' + this.fmt(o), e.L); }
        case 'read': { const el = this.q(await this.ev(e.sel, sc), e.L)[0]; return e.prop === 'value' ? el.value : el.textContent; }
        case 'un': { const v = await this.ev(e.e, sc); if (e.op === 'not') return !v; if (typeof v !== 'number') throw new E('cannot negate a non-number', e.L); return -v; }
        case 'call': { const a = []; for (const x of e.args) a.push(await this.ev(x, sc));
          const s = sc.find(e.n);
          if (s) { const f = s.v.get(e.n); if (f instanceof Fn) return this.callFn(f, a, e.L); throw new E('"' + e.n + '" is not a function', e.L); }
          if (own(this.B, e.n)) { try { return this.B[e.n].apply(null, a); } catch (x) { throw new E(x.message.replace(/^line \d+: /, ''), e.L); } }
          throw new E('unknown function "' + e.n + '"', e.L); }
        case 'bin': {
          if (e.op === 'and') { const l = await this.ev(e.l, sc); return l ? this.ev(e.r, sc) : l; }
          if (e.op === 'or') { const l = await this.ev(e.l, sc); return l ? l : this.ev(e.r, sc); }
          const l = await this.ev(e.l, sc), r = await this.ev(e.r, sc);
          switch (e.op) {
            case '==': return l === r; case '!=': return l !== r;
            case '+': return (typeof l === 'string' || typeof r === 'string') ? this.fmt(l) + this.fmt(r) : l + r;
            case '<': return l < r; case '>': return l > r; case '<=': return l <= r; case '>=': return l >= r;
          }
          if (typeof l !== 'number' || typeof r !== 'number') throw new E('"' + e.op + '" needs two numbers', e.L);
          if (e.op === '-') return l - r; if (e.op === '*') return l * r;
          if (r === 0) throw new E('cannot divide by zero', e.L);
          return e.op === '/' ? l / r : l % r; }
      }
      throw new E('unknown expression "' + e.k + '"');
    }
  };
})(window.Nobelium = window.Nobelium || {});
// Nobelium browser runtime: finds <nobelium> blocks and runs them.
(function (N) {
  N.config = { log: function (l, m) { (l === 'error' ? console.error : console.log)('[nobelium] ' + m); } };
  N.programs = [];
  const st = document.createElement('style'); st.textContent = 'nobelium{display:none}'; (document.head || document.documentElement).appendChild(st);
  N.run = async function (src, o) {
    o = o || {};
    const lg = o.log || function (l, m) { N.config.log(l, (o.label ? o.label + ': ' : '') + m); };
    let ast; try { ast = N.parse(src); } catch (e) { lg('error', e.message); return null; }
    const it = new N.Interpreter({ doc: o.doc || document, log: lg, base: o.base }); N.programs.push(it);
    await it.start(ast); return it;
  };
  N.init = async function () {
    const els = Array.from(document.querySelectorAll('nobelium,script[type="text/nobelium"]')); let i = 0;
    for (const el of els) {
      i++; let src = el.textContent; const url = el.getAttribute('src'); const label = 'block ' + i + (url ? ' (' + url + ')' : '');
      if (url) { try { const r = await fetch(url); if (!r.ok) throw 0; src = await r.text(); } catch (e) { N.config.log('error', label + ': could not load file'); continue; } }
      await N.run(src, { label: label, base: url ? new URL(url, document.baseURI).href : undefined });
    }
  };
  if (!window.NOBELIUM_MANUAL) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', N.init); else N.init(); }
})(window.Nobelium = window.Nobelium || {});
