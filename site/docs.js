// Docs viewer: loads documentation/*.md and renders it. Used by docs.html.
(function () {
  var PAGES = [['README', 'Overview'], ['getting-started', 'Getting started'], ['language-reference', 'Language reference'], ['strings-and-data', 'Strings, lists, objects'], ['events', 'Events'], ['statements', 'Statements'], ['http', 'HTTP and streaming'], ['storage', 'Saving data'], ['timers', 'Timers'], ['animation', 'Animation'], ['modules', 'Importing files'], ['dom', 'Elements, tabs, accordions'], ['testing', 'Testing'], ['expressions', 'Expressions and built-ins'], ['errors', 'Errors and debugging'], ['api', 'JavaScript API'], ['architecture', 'Architecture'], ['examples', 'Examples'], ['roadmap', 'Roadmap']];
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inl(t) {
    t = esc(t); var codes = [];
    t = t.replace(/`([^`]+)`/g, function (m, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, a, u) {
      var h = /^([\w-]+)\.md(#.*)?$/.exec(u);
      if (h) return '<a href="docs/' + (h[1] === 'README' ? '' : h[1]) + (h[2] || '') + '" data-doc="' + h[1] + '">' + a + '</a>';
      return '<a href="' + u + '">' + a + '</a>';
    });
    return t.replace(/\u0000(\d+)\u0000/g, function (m, i) { return '<code>' + codes[i] + '</code>'; });
  }
  function md(s) {
    var L = s.split('\n'), o = [], i = 0, start = /^(```|#{1,4} |\||- |\d+\. )/;
    while (i < L.length) {
      var l = L[i], m;
      if (/^```/.test(l)) { var c = []; i++; while (i < L.length && !/^```/.test(L[i])) c.push(L[i++]); i++; o.push('<pre><code>' + esc(c.join('\n')) + '</code></pre>'); }
      else if ((m = /^(#{1,4}) (.*)/.exec(l))) { o.push('<h' + m[1].length + ' id="' + slug(m[2]) + '">' + inl(m[2]) + '</h' + m[1].length + '>'); i++; }
      else if (/^\|/.test(l)) {
        var r = []; while (i < L.length && /^\|/.test(L[i])) r.push(L[i++]);
        var rows = r.filter(function (x, k) { return k !== 1; }).map(function (x) { return x.replace(/^\||\|\s*$/g, '').split('|'); });
        o.push('<div class="scroll"><table>' + rows.map(function (cells, k) { return '<tr>' + cells.map(function (x) { return (k ? '<td>' : '<th>') + inl(x.trim()) + (k ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</table></div>');
      }
      else if (/^(- |\d+\. )/.test(l)) {
        var ord = /^\d/.test(l), it = []; while (i < L.length && /^(- |\d+\. )/.test(L[i])) it.push(L[i++].replace(/^(- |\d+\. )/, ''));
        o.push((ord ? '<ol>' : '<ul>') + it.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + (ord ? '</ol>' : '</ul>'));
      }
      else if (!l.trim()) i++;
      else { var p = []; while (i < L.length && L[i].trim() && !start.test(L[i])) p.push(L[i++]); o.push('<p>' + inl(p.join(' ')) + '</p>'); }
    }
    return o.join('\n');
  }
  window.NobeliumDocs = { md: md, pages: PAGES };
  if (typeof document === 'undefined' || !document.getElementById('doc')) return;
  // ---- routing: real paths like docs/events (history api) ----
  function valid(n) { return PAGES.filter(function (p) { return p[0] === n; })[0]; }
  function current() {
    var q = new URLSearchParams(location.search).get('p'), m = /\/docs\/([\w-]*)\/?$/.exec(location.pathname), n = '';
    if (q !== null) n = q; else if (m) n = m[1]; else if (valid(location.hash.slice(1))) n = location.hash.slice(1);
    return valid(n) ? n : 'README';
  }
  function url(name) { return new URL(name === 'README' ? 'docs/' : 'docs/' + name, document.baseURI).href; }
  function render() {
    var name = current(), page = valid(name);
    document.getElementById('side').innerHTML = PAGES.map(function (p) { return '<a href="docs/' + (p[0] === 'README' ? '' : p[0]) + '" data-doc="' + p[0] + '"' + (p[0] === name ? ' class="on"' : '') + '>' + p[1] + '</a>'; }).join('');
    fetch('documentation/' + name + '.md').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      document.getElementById('doc').innerHTML = md(t); document.title = 'Nobelium docs - ' + page[1];
      var target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    }).catch(function () { document.getElementById('doc').innerHTML = '<p>could not load <code>documentation/' + name + '.md</code>. Make sure the documentation folder is in your repo, and open this page through a web server (github pages), not by double-clicking the file.</p>'; });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-doc]') : null;
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var name = a.getAttribute('data-doc'), hash = new URL(a.href).hash;
    history.pushState({}, '', url(name) + hash); render();
  });
  window.addEventListener('popstate', render);
  // turn docs.html#name, docs.html?p=name (from 404.html) into docs/name
  var first = current(), keep = location.hash && (new URLSearchParams(location.search).get('p') !== null || /\/docs\//.test(location.pathname)) ? location.hash : '';
  history.replaceState({}, '', url(first) + keep);
  render();
})();
