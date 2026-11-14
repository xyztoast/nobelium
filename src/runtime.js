// Nobelium browser runtime: finds <nobelium> blocks and runs them.
(function (N) {
  N.config = { log: function (l, m) { (l === 'error' ? console.error : console.log)('[nobelium] ' + m); } };
  N.programs = [];
  const st = document.createElement('style'); st.textContent = 'nobelium{display:none}'; (document.head || document.documentElement).appendChild(st);
  N.run = async function (src, o) {
    o = o || {};
    const lg = o.log || function (l, m) { N.config.log(l, (o.label ? o.label + ': ' : '') + m); };
    let ast; try { ast = N.parse(src); } catch (e) { lg('error', e.message); return null; }
    const it = new N.Interpreter({ doc: o.doc || document, log: lg }); N.programs.push(it);
    await it.start(ast); return it;
  };
  N.init = async function () {
    const els = Array.from(document.querySelectorAll('nobelium,script[type="text/nobelium"]')); let i = 0;
    for (const el of els) {
      i++; let src = el.textContent; const url = el.getAttribute('src'); const label = 'block ' + i + (url ? ' (' + url + ')' : '');
      if (url) { try { const r = await fetch(url); if (!r.ok) throw 0; src = await r.text(); } catch (e) { N.config.log('error', label + ': could not load file'); continue; } }
      await N.run(src, { label: label });
    }
  };
  if (!window.NOBELIUM_MANUAL) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', N.init); else N.init(); }
})(window.Nobelium = window.Nobelium || {});
