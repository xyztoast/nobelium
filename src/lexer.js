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
