mount("insights.html");
const T = CONF.talks;
const STOP = new Set(("a an the and or but of to in on for with as at by from is are was were be been being it its this that these those we us our you your he his she her they them their i me my not no so if than then there here who whom which what when where how all any can could will would should may might must do does did have has had also into about through more most such only own same very just even each other some one two his him who after before over under again further once both few many much because while upon out up down off whether yet still—it's let us hearts hearts' “ ” ‘ ’ don't isn't can't we're it's like even way things thing get make made said says say every always never").split(/\s+/));
const corpusSource = T.map(t => [t.summary, ...t.quotes].join(" ")).join(" ").toLowerCase().replace(/[’']/g, "'");
const words = corpusSource.match(/[a-z][a-z'-]{2,}/g) || [];
const norm = w => ({ covenants: "covenant", temples: "temple", prophets: "prophet", apostles: "apostle", promises: "promise", trials: "trial", families: "family", children: "child", miracles: "miracle", testimonies: "testimony" }[w] || w.replace(/'s$/, ""));
const freq = {}; for (const w0 of words) { const w = norm(w0); if (!STOP.has(w) && w.length > 3) freq[w] = (freq[w] || 0) + 1; }
const topWords = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 45);
const max = topWords[0][1], min = topWords[topWords.length-1][1];
// Scriptures: count references by book across talks' "key scriptures" (recap-reported)
const BOOKS = ["Doctrine and Covenants","Helaman","Mosiah","Isaiah","Mark","Luke","John","Jacob","Numbers","Malachi","Hebrews","Hymns"];
const books = {}; const refs = [];
T.forEach(t => t.scriptures.forEach(s => BOOKS.forEach(b => { const re = new RegExp(b.replace(/ /g,"\\s") + "(\\s[\\d:–-]+)?", "g"); let m; while ((m = re.exec(s))) { books[b] = (books[b]||0)+1; refs.push({ ref: m[0].trim(), t, allusion: /alludes|echoes|cf\./i.test(s) }); } })));
const themeCounts = Object.keys(THEMES).map(n => [n, T.filter(t => talkThemes(t).includes(n)).length]).sort((a,b) => b[1]-a[1]);
const bar = (label, n, of, href) => `<div class="bar"><span>${href ? `<a href="${href}">${esc(label)}</a>` : esc(label)}</span><div class="track"><div class="fill" style="width:${Math.round(n/of*100)}%"></div></div><span class="n">${n}</span></div>`;
const callings = {}; T.forEach(t => { const c = /Twelve/.test(t.calling) ? "Quorum of the Twelve" : /First Presidency/.test(t.calling) ? "First Presidency" : /Seventy/.test(t.calling) ? "General Authority Seventies" : "General officers & Presiding Bishopric"; callings[c] = (callings[c]||0)+1; });
function donut(obj) {
  const cols = ["#2a2d5c", "#d8a95b", "#e3a693", "#8fb2d6", "#a493cf"], ents = Object.entries(obj).sort((a,b)=>b[1]-a[1]), tot = ents.reduce((a,[,n])=>a+n,0);
  let acc = 0; const R = 54, C = 2 * Math.PI * R;
  const segs = ents.map(([k,n],i) => { const len = n / tot * C, seg = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${cols[i]}" stroke-width="22" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><animate attributeName="stroke-dasharray" from="0 ${C}" to="${len - 2} ${C - len + 2}" dur="1.2s" fill="freeze"/></circle>`; acc += len; return seg; }).join("");
  return `<div class="donut-wrap"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Speakers by calling">${segs}
    <text x="70" y="68" text-anchor="middle" font-family="Cormorant Garamond" font-size="34" fill="#18213f">${tot}</text><text x="70" y="88" text-anchor="middle" font-family="Inter" font-size="10" fill="#787181">talks</text></svg>
    <ul class="legend">${ents.map(([k,n],i) => `<li><i style="background:${cols[i]}"></i>${esc(k)} · <b>${n}</b></li>`).join("")}</ul></div>`;
}
document.getElementById("main").innerHTML = `
  <div class="section-label">Understand</div><h1 style="margin-top:0">Conference Insights</h1>
  <div class="notice"><strong>Based on recaps, not official text.</strong> Computed in your browser from the summaries and recap quotes for Saturday's ${T.length} talks. Numbers will be recomputed from official text once it's posted.</div>
  <div class="stat-row">
    <div class="stat"><b>${T.length}</b><span>talks so far</span></div>
    <div class="stat"><b>${new Set(T.map(t=>t.speaker)).size}</b><span>speakers</span></div>
    <div class="stat"><b>${refs.length}</b><span>scripture refs (recaps)</span></div></div>
  <section class="card cloud-card"><div class="section-label" style="margin:0 0 6px;color:var(--gold-hi)">Word cloud</div><h2 style="margin-top:0">What Saturday talked about</h2>
    <div class="cloud">${topWords.sort(() => .5 - Math.random()).map(([w,n]) => { const k = (n-min)/(max-min||1);
      const pal = ["#f6dfa6","#e3a693","#fbf3e3","#c9b8f0","#d8a95b"]; const col = k > .55 ? "#f6dfa6" : pal[(w.length + n) % pal.length];
      return `<span style="font-size:${(15 + Math.pow(k,.8)*46).toFixed(0)}px;color:${col};opacity:${(.6 + k*.4).toFixed(2)};font-style:${k>.4?"italic":"normal"};font-weight:${k>.3?500:400}" title="${n}×">${esc(w)}</span>`; }).join("")}</div>
    <p class="speaker">Most frequent meaningful words (common words removed).</p></section>
  <div class="ins-grid">
  <section class="card"><h2 style="margin-top:0">Top themes</h2>
    ${themeCounts.filter(x=>x[1]).map(([n,c]) => bar(n, c, T.length)).join("")}
    <p class="speaker">Number of talks touching each theme (keyword-based).</p></section>
  <section class="card"><h2 style="margin-top:0">Most-cited scriptures</h2>
    ${Object.entries(books).sort((a,b)=>b[1]-a[1]).map(([b,n]) => bar(b, n, Math.max(...Object.values(books)))).join("")}
    <details><summary class="speaker">All references</summary><ul class="scriptures">${refs.map(r => `<li>${esc(r.ref)}${r.allusion ? " <em>(allusion)</em>" : ""} — <a href="talks/${r.t.id}.html">${esc(r.t.speaker)}</a></li>`).join("")}</ul></details>
  </section>
  <section class="card"><h2 style="margin-top:0">Top words</h2>
    ${Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w,n]) => bar(w, n, max)).join("")}</section>
  <section class="card"><h2 style="margin-top:0">Who spoke</h2>${donut(callings)}
    <p class="speaker">Saturday sessions only. Sunday pending.</p></section>
  </div>
  <section class="card"><h2 style="margin-top:0">Compared with past conferences</h2>
    <div class="stub"><strong>Coming after official text is posted.</strong> This will compare theme and word frequencies with the official text of recent conferences (e.g., April 2026 and October 2025). No comparison numbers are shown yet, so nothing here is guessed.</div></section>
  ${askAIPanel({ label: "the whole conference", questions: ["What themes repeated most on Saturday?", "Which talks mentioned the temple?"],
    answer: k => k === 0 ? mockAnswer("By keyword count in recaps: " + themeCounts.slice(0,3).map(x => esc(x[0]) + " (" + x[1] + " talks)").join(", ") + ".", ["Computed from recap summaries on this site"])
      : mockAnswer(T.filter(t => talkText(t).includes("temple")).map(t => `<a href="talks/${t.id}.html">${esc(t.speaker)}</a>`).join(", ") + ".", ["Recap summaries and quotes on this site"]) })}`;
