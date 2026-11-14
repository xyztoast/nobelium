// Nobelium interpreter: walks the AST. Nothing is ever passed to eval/Function.
(function (N) {
  const E = N.NobeliumError;
  N.files = N.files || {};          // virtual files for import: { "name.nbm": "source" }
  N.modules = new Map();            // imported modules, shared by the whole page
  const MEM = new Map(), MEMS = new Map();   // fallbacks when storage is unavailable
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
  class Cnt {}
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

  const LM = { push: (a, x) => { a.push(x); return a; }, pop: a => a.length ? a.pop() : null, shift: a => a.length ? a.shift() : null, unshift: (a, x) => { a.unshift(x); return a; }, reverse: a => a.reverse(),
    sort: a => a.sort((x, y) => x < y ? -1 : x > y ? 1 : 0), index: (a, x) => a.indexOf(x), join: (a, s) => a.join(s === undefined ? ',' : String(s)), slice: (a, x, y) => a.slice(x, y), contains: (a, x) => a.indexOf(x) >= 0, len: a => a.length };
  const TM = { upper: t => t.toUpperCase(), lower: t => t.toLowerCase(), trim: t => t.trim(), split: (t, s) => t.split(String(s)), replace: (t, a, b) => t.split(String(a)).join(String(b)),
    starts: (t, p) => t.indexOf(String(p)) === 0, ends: (t, p) => t.endsWith(String(p)), contains: (t, p) => t.indexOf(String(p)) >= 0, slice: (t, x, y) => t.slice(x, y), index: (t, p) => t.indexOf(String(p)), len: t => t.length };
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
        saved: (k, w) => this.sget(String(k), w === 'session'),
        cookie: n => { const p = encodeURIComponent(String(n)) + '=', c = this.doc.cookie.split('; ').filter(x => x.indexOf(p) === 0)[0]; return c ? decodeURIComponent(c.slice(p.length)) : null; },
        date: x => { const d = x === undefined ? new Date() : new Date(x); if (isNaN(d)) return null;
          return mk({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), weekday: d.getDay(), weekday_name: d.toLocaleDateString(undefined, { weekday: 'long' }), hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds(), time: d.getTime(), iso: d.toISOString(), date: d.toLocaleDateString(), clock: d.toLocaleTimeString() }); }
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
      if (x instanceof Cnt) { this.log('error', '"continue" can only be used inside a loop'); return; }
      this.log('error', x instanceof E ? x.message : 'internal error: ' + x.message);
    }
    // ---- storage (localStorage / sessionStorage, falls back to memory) ----
    store(sess) {
      const k = sess ? '_ss' : '_st';
      if (this[k] === undefined) {
        try { const s = sess ? this.win().sessionStorage : this.win().localStorage; s.setItem('__nbm', '1'); s.removeItem('__nbm'); this[k] = s; }
        catch (e) { this[k] = null; if (!this._note) { this._note = 1; this.log('log', 'note: browser storage is not available here, saved values are kept in memory only'); } }
      }
      return this[k];
    }
    sget(k, sess) {
      const s = this.store(sess), M = sess ? MEMS : MEM, raw = s ? s.getItem('nobelium:' + k) : (M.has(k) ? M.get(k) : null);
      if (raw === null) return null; try { return JSON.parse(raw); } catch (e) { return raw; }
    }
    sset(k, v, L, sess) {
      if (typeof k !== 'string' || !k) throw new E('save needs a name in quotes, like save count as "count"', L);
      if (v instanceof Fn) throw new E('cannot save a function', L);
      const raw = JSON.stringify(v), s = this.store(sess);
      if (!s) { (sess ? MEMS : MEM).set(k, raw); return; }
      try { s.setItem('nobelium:' + k, raw); } catch (e) { throw new E('could not save "' + k + '" (storage is full or blocked)', L); }
    }
    sdel(k, sess) { const s = this.store(sess); if (s) s.removeItem('nobelium:' + k); else (sess ? MEMS : MEM).delete(k); }
    sclear(sess) {
      const s = this.store(sess); if (!s) { (sess ? MEMS : MEM).clear(); return; }
      const ks = []; for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k.indexOf('nobelium:') === 0) ks.push(k); }
      ks.forEach(k => s.removeItem(k));
    }
    fill(el, o, L) {
      if (o === null) return;
      if (typeof o !== 'object' || Array.isArray(o)) throw new E('options must be an object like { text: "hi", class: "row" }', L);
      Object.keys(o).forEach(k => {
        const v = o[k];
        if (k === 'text') el.textContent = this.fmt(v); else if (k === 'value') el.value = v; else if (k === 'class') el.className = String(v);
        else {
          if (/^on/i.test(k) || (/^(href|src|action|formaction)$/i.test(k) && /^\s*javascript:/i.test(String(v)))) throw new E('"' + k + '" is not allowed (event handlers and javascript: links are blocked)', L);
          el.setAttribute(k, String(v));
        }
      });
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
      try { await this.block(f.d.body, sc); } catch (x) { if (x instanceof Ret) return x.v; if (x instanceof Brk || x instanceof Cnt) throw new E('"break" and "continue" can only be used inside a loop', L); throw x; } finally { this.depth--; }
      return null;
    }
    async loop(body, sc, vars) {   // runs one loop pass; returns true if "break" was used
      const c = new Scope(sc); if (vars) c.def(vars[0], vars[1]);
      try { await this.block(body, c); } catch (x) { if (x instanceof Brk) return true; if (x instanceof Cnt) return false; throw x; }
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
          const it = await this.load(path, s.L); if (s.alias) sc.def(s.alias, mk(Object.fromEntries(it.exports)));
          if (s.names) for (const n of s.names) { if (!it.exports.has(n)) throw new E('"' + path + '" does not export "' + n + '"', s.L); sc.def(n, it.exports.get(n)); }
          break; }
        case 'set': {
          if (s.prop === 'cookie') {
            const n = await this.ev(s.sel, sc), cv = await this.ev(s.e, sc), d = s.days ? Number(await this.ev(s.days, sc)) : 0;
            if (typeof n !== 'string' || !n) throw new E('set cookie needs a name in quotes', s.L);
            this.doc.cookie = encodeURIComponent(n) + '=' + encodeURIComponent(this.fmt(cv)) + '; path=/; SameSite=Lax' + (d > 0 ? '; expires=' + new Date(Date.now() + d * 864e5).toUTCString() : ''); break;
          }
          const v = await this.ev(s.e, sc);
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
        case 'save': { const v = await this.ev(s.e, sc); this.sset(await this.ev(s.key, sc), v, s.L, s.sess); break; }
        case 'forget': this.sdel(String(await this.ev(s.key, sc)), s.sess); break;
        case 'delcookie': this.doc.cookie = encodeURIComponent(String(await this.ev(s.key, sc))) + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; break;
        case 'clearstore': this.sclear(s.sess); break;
        case 'while': { let n = 0; while (await this.ev(s.c, sc)) { if (++n > 10000) throw new E('"while" ran more than 10000 times (infinite loop?)', s.L); if (await this.loop(s.body, sc)) break; } break; }
        case 'continue': throw new Cnt();
        case 'group': {
          const hs = await this.ev(s.a, sc), ps = await this.ev(s.b, sc); this.q(hs, s.L); this.q(ps, s.L);
          const tabs = s.kind === 'tabs', cls = tabs ? 'active' : 'open', all = x => Array.from(this.doc.querySelectorAll(x));
          const apply = (i, click) => { const H = all(hs); all(ps).forEach((p, j) => { const was = this.shown(p);
            const open = tabs ? j === i : (j === i ? (click ? !was : was) : (s.only ? false : was));
            if (open) this.show(p); else p.style.display = 'none'; if (H[j]) H[j].classList.toggle(cls, open); }); };
          if (tabs) { const a = all(hs).findIndex(h => h.classList.contains('active')); apply(a < 0 ? 0 : a, false); }
          else { all(ps).forEach(p => { p.style.display = 'none'; }); all(hs).forEach(h => h.classList.remove('open')); }
          const h = e => { const hit = e.target && e.target.closest ? e.target.closest(hs) : null; if (!hit) return; const i = all(hs).indexOf(hit); if (i >= 0) apply(i, true); };
          this.doc.addEventListener('click', h, true); this.off.push(() => this.doc.removeEventListener('click', h, true)); break; }
        case 'create': { const tag = await this.ev(s.tag, sc);
          if (typeof tag !== 'string' || !/^[a-z][a-z0-9-]*$/i.test(tag) || /^(script|iframe|object|embed)$/i.test(tag)) throw new E('"' + this.fmt(tag) + '" cannot be created (use a normal tag name; script, iframe, object and embed are blocked)', s.L);
          const o = s.opts ? await this.ev(s.opts, sc) : null;
          for (const par of this.q(await this.ev(s.into, sc), s.L)) { const el = this.doc.createElement(tag); this.fill(el, o, s.L); par.appendChild(el); } break; }
        case 'copy': { const src = this.q(await this.ev(s.from, sc), s.L)[0], o = s.opts ? await this.ev(s.opts, sc) : null;
          if (o !== null && (typeof o !== 'object' || Array.isArray(o))) throw new E('options must be an object like { title: "hi" }', s.L);
          for (const par of this.q(await this.ev(s.into, sc), s.L)) {
            let frag; if (src.content) frag = src.content.cloneNode(true); else { frag = this.doc.createDocumentFragment(); const c = src.cloneNode(true); c.removeAttribute('id'); frag.appendChild(c); }
            if (o) Object.keys(o).forEach(k => frag.querySelectorAll('[data-slot="' + k.replace(/[^\w-]/g, '') + '"]').forEach(n => { n.textContent = this.fmt(o[k]); }));
            par.appendChild(frag);
          } break; }
        case 'empty': for (const el of this.q(await this.ev(s.sel, sc), s.L)) el.textContent = ''; break;
        case 'rmel': for (const el of this.q(await this.ev(s.sel, sc), s.L)) el.remove(); break;
        case 'test': (this.tests || (this.tests = [])).push({ name: this.fmt(await this.ev(s.name, sc)), body: s.body, sc: sc }); break;
        case 'assert': if (!(await this.ev(s.c, sc))) throw new E(s.m ? this.fmt(await this.ev(s.m, sc)) : 'assertion failed', s.L); break;
        case 'trigger': { const t = EV[s.ev] || s.ev, W = this.win(), mouse = /^(click|dblclick|mousedown|mouseup|mouseover|mouseout|mousemove|contextmenu)$/.test(t);
          for (const el of this.q(await this.ev(s.sel, sc), s.L)) el.dispatchEvent(mouse ? new W.MouseEvent(t, { bubbles: true, cancelable: true }) : new W.Event(t, { bubbles: true, cancelable: true }));
          await sleep(20); break; }
        case 'runtests': { let ok = 0, bad = 0;
          for (const t of (this.tests || [])) {
            try { await this.block(t.body, new Scope(t.sc)); ok++; this.log('log', 'test passed: ' + t.name); }
            catch (x) { if (x instanceof Ret) { ok++; this.log('log', 'test passed: ' + t.name); } else { bad++; this.log('error', 'test FAILED: ' + t.name + ' - ' + x.message); } }
          }
          this.log(bad ? 'error' : 'log', ok + ' passed, ' + bad + ' failed'); break; }
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
        case 'mcall': { const o = await this.ev(e.o, sc), a = []; for (const x of e.args) a.push(await this.ev(x, sc));
          if (o !== null && typeof o === 'object' && !Array.isArray(o)) { const f = own(o, e.n) ? o[e.n] : null; if (f instanceof Fn) return this.callFn(f, a, e.L); throw new E('"' + e.n + '" is not a function', e.L); }
          const M = Array.isArray(o) ? LM : typeof o === 'string' ? TM : null;
          if (!M || !own(M, e.n)) throw new E('cannot call .' + e.n + '() on ' + (o === null ? 'null' : Array.isArray(o) ? 'a list' : typeof o), e.L);
          try { return M[e.n].apply(null, [o].concat(a)); } catch (x) { throw new E(x.message, e.L); } }
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
