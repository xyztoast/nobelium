// Nobelium interpreter: walks the AST. Nothing is ever passed to eval/Function.
(function (N) {
  const E = N.NobeliumError;
  class Scope {
    constructor(p) { this.v = new Map(); this.p = p || null; }
    find(n) { for (let s = this; s; s = s.p) if (s.v.has(n)) return s; return null; }
    get(n, L) { const s = this.find(n); if (!s) throw new E('"' + n + '" is not defined', L); return s.v.get(n); }
    set(n, x, L) { const s = this.find(n); if (!s) throw new E('"' + n + '" is not defined (create it with let first)', L); s.v.set(n, x); }
    def(n, x) { this.v.set(n, x); }
  }
  class Fn { constructor(d, sc) { this.d = d; this.sc = sc; } }
  class Ret { constructor(v) { this.v = v; } }
  class Stop {}
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const EV = { hover: 'mouseover', leave: 'mouseout', keypress: 'keydown', key: 'keydown' };

  N.Interpreter = class {
    constructor(o) {
      this.doc = o.doc || document; this.log = o.log || function () {};
      this.g = new Scope(); this.off = []; this.depth = 0;
      this.B = {
        len: a => a == null ? 0 : a.length, upper: a => String(a).toUpperCase(), lower: a => String(a).toLowerCase(),
        trim: a => String(a).trim(), num: a => Number(a), str: a => String(a), round: a => Math.round(a),
        contains: (a, b) => String(a).indexOf(String(b)) >= 0,
        random: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
        item: (a, i) => Array.isArray(a) && i >= 0 && i < a.length ? a[i] : null,
        exists: s => this.doc.querySelector(s) !== null
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
    fail(x) { if (x instanceof Stop || x instanceof Ret) return; this.log('error', x instanceof E ? x.message : 'internal error: ' + x.message); }
    async start(ast) {
      for (const s of ast) if (s.k === 'fn') this.g.def(s.n, new Fn(s, this.g));
      for (const s of ast) { if (s.k === 'fn') continue; try { await this.exec(s, this.g); } catch (x) { this.fail(x); } }
    }
    dispose() { this.off.forEach(f => f()); this.off = []; }
    async block(b, sc) { for (const s of b) await this.exec(s, sc); }
    async run(body, parent, ev, e) {
      const sc = new Scope(parent); sc.def('event', ev); sc.def('__e', e || null);
      try { await this.block(body, sc); } catch (x) { this.fail(x); }
    }
    async bind(s, sc) {
      if (s.ev === 'load') { await this.run(s.body, sc, { type: 'load' }); return; }
      const type = EV[s.ev] || s.ev, val = s.sel ? await this.ev(s.sel, sc) : null;
      const sel = s.ev === 'key' ? null : val, key = s.ev === 'key' ? val : null;
      if (sel !== null) { if (typeof sel !== 'string') throw new E('expected a selector string', s.L); try { this.doc.querySelector(sel); } catch (e) { throw new E('"' + sel + '" is not a valid selector', s.L); } }
      const h = e => {
        let t = e.target;
        if (sel !== null) { const hit = t.closest ? t.closest(sel) : null; if (!hit) return; t = hit; }
        if (key !== null && e.key !== key) return;
        if ((s.ev === 'hover' || s.ev === 'leave') && t.contains && t.contains(e.relatedTarget)) return;
        this.run(s.body, sc, { type: s.ev, key: e.key === undefined ? null : e.key, value: t.value === undefined ? null : t.value, text: t.textContent }, e);
      };
      this.doc.addEventListener(type, h); this.off.push(() => this.doc.removeEventListener(type, h));
    }
    async callFn(f, a, L) {
      if (this.depth > 200) throw new E('too many nested function calls', L);
      this.depth++; const sc = new Scope(f.sc);
      f.d.ps.forEach((p, i) => sc.def(p, i < a.length ? a[i] : null));
      try { await this.block(f.d.body, sc); } catch (x) { if (x instanceof Ret) return x.v; throw x; } finally { this.depth--; }
      return null;
    }
    async exec(s, sc) {
      switch (s.k) {
        case 'let': sc.def(s.n, await this.ev(s.e, sc)); break;
        case 'assign': sc.set(s.n, await this.ev(s.e, sc), s.L); break;
        case 'fn': sc.def(s.n, new Fn(s, sc)); break;
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
        case 'wait': await sleep(Math.min(Number(await this.ev(s.e, sc)) || 0, 60000)); break;
        case 'log': this.log('log', this.fmt(await this.ev(s.e, sc))); break;
        case 'get': { const u = await this.ev(s.url, sc); let r;
          try { r = await fetch(u); } catch (e) { throw new E('request to "' + u + '" failed', s.L); }
          if (!r.ok) throw new E('request to "' + u + '" returned status ' + r.status, s.L);
          const t = await r.text(); let d = t; try { d = JSON.parse(t); } catch (e) {}
          sc.def(s.n, d); break; }
        case 'if': if (await this.ev(s.c, sc)) await this.block(s.a, new Scope(sc)); else if (s.b) await this.block(s.b, new Scope(sc)); break;
        case 'repeat': { const n = Math.min(Number(await this.ev(s.n, sc)) || 0, 10000); for (let i = 0; i < n; i++) await this.block(s.body, new Scope(sc)); break; }
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
        case 'member': { const o = await this.ev(e.o, sc);
          if (o === null || typeof o !== 'object') throw new E('cannot read "' + e.n + '" of ' + this.fmt(o), e.L);
          return own(o, e.n) ? o[e.n] : null; }
        case 'read': { const el = this.q(await this.ev(e.sel, sc), e.L)[0]; return e.prop === 'value' ? el.value : el.textContent; }
        case 'un': { const v = await this.ev(e.e, sc); if (e.op === 'not') return !v; if (typeof v !== 'number') throw new E('cannot negate a non-number', e.L); return -v; }
        case 'call': { const a = []; for (const x of e.args) a.push(await this.ev(x, sc));
          const s = sc.find(e.n);
          if (s) { const f = s.v.get(e.n); if (f instanceof Fn) return this.callFn(f, a, e.L); throw new E('"' + e.n + '" is not a function', e.L); }
          if (own(this.B, e.n)) return this.B[e.n].apply(null, a);
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
