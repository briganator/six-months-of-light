// ClipMatch: find which talk a pasted/selected passage comes from, and exactly which printed words it covers.
// Matching runs against the printed talk text (what people copy) from assets/clip-index.json; each printed word
// maps to a spoken word in the talk's timings, so the clip is cut where those words were said.
(function (root) {
  const fold = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const norm = w => fold(w).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^a-z0-9]/g, "");
  // Clean what people paste: smart quotes, dashes, ellipses, footnote markers (word,3 / word.[3] / superscripts),
  // line breaks, bullets, "(see ...)" kept as words (they're printed).
  function clean(text) {
    return String(text || "").replace(/[\u00a0\u2000-\u200b]/g, " ")
      .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, " ").replace(/\[\d{1,3}\]/g, " ")
      .replace(/([A-Za-z.,;:!?”’"')\]])\d{1,3}(?=[\s.,;:!?”’"')]|$)/g, "$1")
      .replace(/(^|\s)\d{1,3}(?=\s+[A-Z“"])/g, "$1")          // stray footnote number before a new sentence
      .replace(/\s+/g, " ").trim(); }
  const ELL = /\s*(?:…|\.\s?\.\s?\.)\s*/;
  const words = t => t.split(/[\s\u2014\u2013]+|(?<=\w)-{2,}(?=\w)/).filter(w => norm(w));
  let IDX = null;
  function load(base = "") { return IDX || (IDX = fetch(base + "assets/clip-index.json").then(r => r.json()).then(prep)); }
  function prep(d) { const df = {}; d.talks.forEach(t => { t.n = t.w.map(norm); t.set = new Set(t.n); t.set.forEach(x => df[x] = (df[x] || 0) + 1); });
    d.idf = x => Math.log(1 + d.talks.length / (df[x] || .5)); return d; }
  function useIndex(d) { IDX = Promise.resolve(prep(d)); return IDX; }
  // Smith-Waterman, token level. Partial first/last query words (from a sloppy selection) match by prefix/suffix.
  function sw(q, t) { const n = q.length, m = t.length, MA = 2, MI = -.6, GA = -.7;
    const eq = (i, j) => { const a = q[i], b = t[j]; if (a === b) return true; if (a.length >= 2 && i === n - 1 && b.startsWith(a)) return true; if (a.length >= 2 && i === 0 && b.endsWith(a)) return true; return false; };
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1), sp = new Int32Array(m + 1), sc = new Int32Array(m + 1), best = 0, bj = 0, bs = 0;
    for (let i = 0; i < n; i++) { cur[0] = 0;
      for (let j = 1; j <= m; j++) { const d = prev[j - 1] + (eq(i, j - 1) ? MA : MI), up = prev[j] + GA, lf = cur[j - 1] + GA; let v = 0, st = j;
        if (d >= up && d >= lf && d > 0) { v = d; if (prev[j - 1] > 0) st = sp[j - 1]; } else if (up >= lf && up > 0) { v = up; st = sp[j]; } else if (lf > 0) { v = lf; st = sc[j - 1]; }
        cur[j] = v; sc[j] = st; if (v > best) { best = v; bj = j; bs = st; } }
      [prev, cur] = [cur, prev]; [sp, sc] = [sc, sp]; }
    return best > 0 ? { p0: bs - 1, p1: bj - 1, score: best / (MA * n) } : null; }
  // Rank talks by shared distinctive words, then align in the best few.
  function candidates(d, q, only) { const L = [...new Set(q)];
    return d.talks.filter(t => !only || t.id === only).map(t => ({ t, k: L.reduce((a, x) => a + (t.set.has(x) ? d.idf(x) : 0), 0) })).sort((a, b) => b.k - a.k).slice(0, only ? 1 : 8); }
  async function find(text, opt = {}) { const d = await load(opt.base || ""); const c = clean(text); if (!c) return null;
    const segs = c.split(ELL).map(s => words(s).map(norm)).filter(s => s.length); if (!segs.length) return null;
    const all = segs.flat(); let best = null;
    for (const { t } of candidates(d, all, opt.talk)) {
      // Each segment after an ellipsis must come after (and near) the previous one.
      const parts = []; let from = 0;
      for (const s of segs) { const win = parts.length ? t.n.slice(from, from + 600) : t.n, p = sw(s, win); if (!p) break;
        parts.push({ p0: p.p0 + from, p1: p.p1 + from, score: p.score }); from = p.p1 + from + 1; }
      if (parts.length < segs.length) continue;
      const p0 = parts[0].p0, p1 = parts[parts.length - 1].p1; if (p1 < p0) continue;
      const score = parts.reduce((a, p, i) => a + p.score * segs[i].length, 0) / all.length;
      if (!best || score > best.score) best = { talk: t.id, p0, p1, score, t }; }
    if (!best || best.score < .5) return null;
    // Trim: never start/end on words the paste didn't include (alignment edges are already exact matches).
    return { talk: best.talk, p0: best.p0, p1: best.p1, score: +best.score.toFixed(3), words: best.t.w, map: best.t.m }; }
  const api = { clean, norm, words, find, load, useIndex, sw };
  root.ClipMatch = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
