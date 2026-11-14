// Nobelium lexer: turns source text into tokens. No eval, no Function().
(function (N) {
  class NobeliumError extends Error {
    constructor(m, line) { super(line ? 'line ' + line + ': ' + m : m); this.name = 'NobeliumError'; this.line = line; }
  }
  N.NobeliumError = NobeliumError;
  const OPS2 = ['==', '!=', '<=', '>='], OPS1 = '+-*/%<>=(){},.';
  N.tokenize = function (src) {
    const out = []; let i = 0, line = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { line++; i++; }
      else if (/\s/.test(c)) i++;
      else if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; }
      else if (/\d/.test(c)) {
        const m = /^\d+(\.\d+)?(ms|s)?/.exec(src.slice(i)); let v = parseFloat(m[0]);
        if (m[2] === 's') v *= 1000;
        out.push({ t: 'num', v: v, line: line }); i += m[0].length;
      }
      else if (c === '"' || c === "'") {
        let s = ''; i++;
        while (i < src.length && src[i] !== c) {
          if (src[i] === '\n') throw new NobeliumError('string is missing its closing quote', line);
          if (src[i] === '\\') { i++; s += src[i] === 'n' ? '\n' : src[i]; } else s += src[i];
          i++;
        }
        if (i >= src.length) throw new NobeliumError('string is missing its closing quote', line);
        i++; out.push({ t: 'str', v: s, line: line });
      }
      else if (/[A-Za-z_]/.test(c)) { const w = /^\w+/.exec(src.slice(i))[0]; out.push({ t: 'id', v: w, line: line }); i += w.length; }
      else if (OPS2.indexOf(src.substr(i, 2)) >= 0) { out.push({ t: 'op', v: src.substr(i, 2), line: line }); i += 2; }
      else if (OPS1.indexOf(c) >= 0) { out.push({ t: 'op', v: c, line: line }); i++; }
      else throw new NobeliumError('unexpected character "' + c + '"', line);
    }
    out.push({ t: 'eof', line: line });
    return out;
  };
})(window.Nobelium = window.Nobelium || {});
