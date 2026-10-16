// Accuracy suite for "Make a video" matching. Realistic copy-paste samples generated from the printed talks:
// site copies, ChurchofJesusChrist.org copies (footnote numbers, line breaks), curly/straight quotes, dashes,
// ellipsis omissions, partial words from sloppy selections, long quotes, paragraph-spanning passages, small typos.
// before = old approach (talk known, align against the speech-to-text transcript); after = ClipMatch (talk unknown).
// Run: node tests/clipmatch.test.js
const fs = require("fs"), vm = require("vm"), M = require("../assets/clipmatch.js");
const D = JSON.parse(fs.readFileSync(__dirname + "/../assets/clip-index.json")); M.useIndex(D);
const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(__dirname + "/../assets/clipkit.js", "utf8"), ctx); const K = ctx.window.ClipKit;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const oldClean = t => String(t || "").replace(/\[\d+\]/g, " ").replace(/([A-Za-z.,;:!?”’)])\d{1,2}(?=[\s.,;:!?”’)]|$)/g, "$1").replace(/\s+/g, " ").trim();
const KINDS = {
  site: w => w.join(" "),
  church: w => w.map((x, i) => /[.,;]$/.test(x) && rnd() < .25 ? x + ri(1, 30) : x).join(" ").replace(/([.!?]) /g, (m, p) => rnd() < .4 ? p + "\n\n" : m),
  quoted: w => "“" + w.join(" ") + "”",
  straight: w => '"' + w.join(" ").replace(/[“”]/g, '"').replace(/[’‘]/g, "'") + '"',
  dashes: w => w.join(" ").replace(/—/g, rnd() < .5 ? " -- " : " - "),
  ellipsis: w => w.length > 14 ? w.slice(0, 5).join(" ") + " … " + w.slice(w.length - 5).join(" ") : w.join(" "),
  partial: w => (w[0].length > 4 ? w[0].slice(2) : w[0]) + " " + w.slice(1, -1).join(" ") + " " + (w[w.length - 1].length > 4 ? w[w.length - 1].slice(0, -2) : w[w.length - 1]),
  typo: w => { const v = w.slice(), k = ri(1, Math.max(1, v.length - 2)); v[k] = v[k].length > 3 ? v[k].slice(0, -1) + "x" : v[k]; return v.join(" "); },
  long: w => w.join("\n"),
};
const cases = [];
D.talks.forEach(t => { if (t.w.length < 200) return; Object.keys(KINDS).forEach(kind => { for (let r = 0; r < 2; r++) {
  const L = kind === "long" ? ri(60, 140) : kind === "ellipsis" ? ri(18, 40) : ri(5, 35), p0 = ri(0, t.w.length - L - 1), p1 = p0 + L - 1;
  cases.push({ id: t.id, kind, p0, p1, text: KINDS[kind](t.w.slice(p0, p1 + 1)), m: t.m }); } }); });
(async () => {
  const R = {}; const add = (k, f, v) => { R[k] = R[k] || { n: 0, bE: 0, bN: 0, aT: 0, aE: 0, aN: 0 }; R[k].n += f === "n" ? 1 : 0; if (f !== "n") R[k][f] += v ? 1 : 0; };
  for (const c of cases) { add(c.kind, "n");
    const T = JSON.parse(fs.readFileSync(`${__dirname}/../assets/timings/${c.id}.json`)).words, a = K.align(T, oldClean(c.text)), g0 = c.m[c.p0], g1 = c.m[c.p1];
    add(c.kind, "bE", a && a.i0 === g0 && a.i1 === g1); add(c.kind, "bN", a && Math.abs(a.i0 - g0) <= 1 && Math.abs(a.i1 - g1) <= 1);
    const f = await M.find(c.text); const okT = f && f.talk === c.id; add(c.kind, "aT", okT);
    add(c.kind, "aE", okT && f.p0 === c.p0 && f.p1 === c.p1); add(c.kind, "aN", okT && Math.abs(f.p0 - c.p0) <= 1 && Math.abs(f.p1 - c.p1) <= 1);
    if (process.env.V && !(okT && f.p0 === c.p0 && f.p1 === c.p1)) console.log("MISS", c.kind, c.id, JSON.stringify(c.text.slice(0, 90)), "→", f ? `${f.talk} ${f.p0 - c.p0}/${f.p1 - c.p1}` : "none"); }
  const pct = (a, n) => (100 * a / n).toFixed(1) + "%"; let tot = { n: 0, bE: 0, bN: 0, aT: 0, aE: 0, aN: 0 };
  console.log("kind        n   BEFORE exact  ±1word | AFTER talk  exact  ±1word");
  for (const [k, v] of Object.entries(R)) { Object.keys(tot).forEach(x => tot[x] += v[x]); console.log(k.padEnd(10), String(v.n).padStart(3), pct(v.bE, v.n).padStart(12), pct(v.bN, v.n).padStart(8), "|", pct(v.aT, v.n).padStart(9), pct(v.aE, v.n).padStart(7), pct(v.aN, v.n).padStart(7)); }
  console.log("ALL".padEnd(10), String(tot.n).padStart(3), pct(tot.bE, tot.n).padStart(12), pct(tot.bN, tot.n).padStart(8), "|", pct(tot.aT, tot.n).padStart(9), pct(tot.aE, tot.n).padStart(7), pct(tot.aN, tot.n).padStart(7));
  if (tot.aE / tot.n < .9) process.exitCode = 1;
})();
