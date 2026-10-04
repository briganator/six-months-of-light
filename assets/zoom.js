// Zoomable insights: all conferences → one conference → one session → one talk, plus Compare and Music.
// Official talks: derived counts from official pages (no talk text). October 2026: this site's recaps, labeled as such.
(function () {
  const esc = window.esc, SITE = CONF.site_url;
  const bar = (label, n, of, sfx = "") => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${Math.max(2, Math.round(n / (of || 1) * 100))}%"></div></div><span class="n">${typeof n === "number" && n % 1 ? n.toFixed(1) : n}${sfx}</span></div>`;
  const short = l => l.replace("October", "Oct").replace("April", "Apr");
  function scopeTalks(LB, z) { if (z.k === "all") return LB.talks; if (z.k === "c") return LB.talks.filter(t => t.c === z.c);
    if (z.k === "s") return LB.talks.filter(t => t.c === z.c && t.se === z.se); return LB.talks.filter(t => t.c === z.c && t.id === z.id); }
  function scopeLabel(LB, z, ts) { if (z.k === "all") return "All conferences, Apr 2021 – Oct 2026"; const cf = LB.confOf(z.c).label;
    if (z.k === "c") return cf + " general conference"; if (z.k === "s") return cf + " · " + (LB.confOf(z.c).sessions[z.se] || "Session"); return ts[0] ? `“${ts[0].t}” · ${ts[0].s}` : cf; }
  const zq = z => z.k === "all" ? "all" : z.k === "c" ? "c:" + z.c : z.k === "s" ? `s:${z.c}:${z.se}` : `t:${z.c}:${z.id}`;
  function parse(LB, v) { const [k, c, x] = String(v || "").split(":"); const ok = c && LB.confOf(c);
    if (k === "c" && ok) return { k, c }; if (k === "s" && ok && LB.confOf(c).sessions[x]) return { k, c, se: x }; if (k === "t" && ok && LB.talks.some(t => t.c === c && t.id === x)) return { k, c, id: x };
    return { k: "all" }; }
  function widgets(LB, z, ts) {
    const S = LB.stats(ts), lab = scopeLabel(LB, z, ts), eyebrow = (z.k === "all" ? "GENERAL CONFERENCE 2021–2026" : (LB.confOf(z.c).label + " · general conference").toUpperCase()).slice(0, 60);
    const url = SITE + "insights.html?z=" + encodeURIComponent(zq(z)) + "#zoom", recapOnly = S.recap === S.n, part = S.recap && !recapOnly;
    const src = recapOnly ? "From this site's recaps (official text not yet posted)" : part ? "Official talks; October 2026 from recaps" : "From official talk pages";
    const W = [], add = (id, kicker, title, html, body, share, note) => W.push({ id, kicker, title, html, note, card: body && { title, kicker: (kicker + (z.k === "s" ? " · " + (LB.confOf(z.c).sessions[z.se] || "").replace(/ Session$/, "") : z.k === "t" && ts[0] ? " · " + ts[0].s.replace(/^(President|Elder|Sister|Bishop)\s+/, "") : "")).slice(0, 44), eyebrow, body, share: share + " #GeneralConference", url, basis: recapOnly ? "Based on recaps" : part ? "Official talk pages + Oct 2026 recaps" : "Counted from official talk pages" } });
    const oneTalk = z.k === "t";
    add("size", "At a glance", oneTalk ? "This talk in numbers" : "The numbers",
      `<div class="z-big"><b>${S.n}</b><span>talk${S.n === 1 ? "" : "s"}</span></div>${S.words ? `<div class="z-big"><b>${S.readMin.toLocaleString()}</b><span>min to read</span></div><div class="z-big"><b>${S.spokenMin.toLocaleString()}</b><span>min spoken (est.)</span></div>` : ""}<div class="z-big"><b>${(S.refs.reduce((a, r) => a + r[1], 0) ? ts.reduce((a, t) => a + t.rf.length, 0) : 0).toLocaleString()}</b><span>scripture refs</span></div>`,
      S.words ? { type: "big", value: S.readMin.toLocaleString() + " min", caption: `to read ${S.n === 1 ? "this talk" : "all " + S.n + " talks"} (about 200 words a minute)` } : null, `${lab}: ${S.readMin} minutes of reading.`);
    if (S.topWords.length) add("words", "Top words", "What it talked about", `<ol class="z-words">${S.topWords.slice(0, 10).map(([w]) => `<li>${esc(w)}</li>`).join("")}</ol>`,
      { type: "words", items: S.topWords.slice(0, 8).map(x => x[0]) }, `Top words in ${lab}: ${S.topWords.slice(0, 5).map(x => x[0]).join(", ")}.`);
    const dens = S.density.filter(x => x[1] > 0).slice(0, 6), dm = dens.length ? dens[0][1] : 1;
    if (dens.length) add("themes", "Topics", "Where the words went", dens.map(([k, v]) => bar(LB.themeName(k), v, dm)).join("") + `<p class="z-note">Topic words per 1,000 words of talk text.</p>`,
      { type: "bars", items: dens.slice(0, 5).map(([k, v]) => ({ label: LB.themeName(k), value: Math.round(v * 10) / 10 })) }, `Most-discussed topics in ${lab}: ${dens.slice(0, 3).map(x => LB.themeName(x[0])).join(", ")}.`);
    else if (S.themes.length) add("themes", "Topics", "Topics in the quotes", S.themes.slice(0, 6).map(([k, n]) => bar(LB.themeName(k), n, S.themes[0][1])).join(""), null, "", "Tagged from verified recap quotes.");
    if (S.works.length) { const wm = S.works[0][1]; add("works", "Scriptures", "Scriptures by book", S.works.map(([k, n]) => bar(k, n, wm)).join("") + (LB.CFM[2026] ? `<p class="z-note">Come, Follow Me: ${LB.CFM[2026][0]} this year, ${LB.CFM[2027][0]} in 2027.</p>` : ""),
      { type: "bars", items: S.works.slice(0, 5).map(([label, value]) => ({ label, value })) }, `Scripture references in ${lab}, by book of scripture.`); }
    if (S.refs.length) add("refs", "Most cited", "Verses cited most", `<ol class="tp-rank">${S.refs.slice(0, 6).map(([r, n]) => `<li><span>${esc(r)}</span><b>${n}</b></li>`).join("")}</ol>`,
      { type: "bars", items: S.refs.slice(0, 4).map(([label, value]) => ({ label, value })) }, `Most-cited verses in ${lab}: ${S.refs.slice(0, 3).map(x => x[0]).join("; ")}.`);
    if (S.titles.length) { const tm = S.titles[0][1]; add("titles", "Names of the Savior", "How He was named", S.titles.slice(0, 7).map(([k, n]) => bar(k, n, tm)).join(""),
      { type: "bars", items: S.titles.slice(0, 5).map(([label, value]) => ({ label, value })) }, `Names and titles of Jesus Christ in ${lab}.`); }
    add("ipq", "Invitations", "Invitations, promises, questions", `<div class="z-big"><b>${S.inv}</b><span>invitations</span></div><div class="z-big"><b>${S.pro}</b><span>promises</span></div><div class="z-big"><b>${S.q}</b><span>questions asked</span></div>`,
      { type: "text", text: `${S.inv} invitations, ${S.pro} promises and ${S.q} questions${oneTalk ? " in this talk" : " across " + S.n + " talks"}.` }, `${lab}: ${S.inv} invitations and ${S.pro} promises.`, recapOnly ? "Counted in the recap quotes only." : "Counted from phrases like “I invite” and “I promise”.");
    if (S.places.length) add("places", "Places", "Places mentioned", `<p class="z-places">${S.places.slice(0, 12).map(([p, n]) => `<span class="pill">${esc(p)}${n > 1 ? " · " + n : ""}</span>`).join(" ")}</p>`,
      { type: "words", items: S.places.slice(0, 8).map(x => x[0]) }, `Places mentioned in ${lab}.`);
    if (z.k === "c" || z.k === "s") { const ses = z.k === "s" ? LB.confOf(z.c).sessions[z.se] : null, mu = LB.music(z.c, ses);
      if (mu.length) { const songs = mu.flatMap(m => m.songs); add("music", "Music", z.k === "s" ? "Music this session" : `${songs.length} songs sung`, `<ol class="z-music">${songs.slice(0, z.k === "s" ? 12 : 10).map(([t, b, n]) => `<li>${LB.hymnLink(t) ? `<a href="${esc(LB.hymnLink(t))}" rel="noopener" target="_blank">${esc(t)}</a>` : esc(t)} <small>${b === "cs" ? "Children's Songbook" : b === "hymns" ? "Hymns" : esc(b)}${n ? " " + n : ""}</small></li>`).join("")}</ol>${songs.length > 10 && z.k === "c" ? `<p class="z-note">and ${songs.length - 10} more.</p>` : ""}`,
        { type: "words", items: songs.slice(0, 8).map(x => x[0]) }, `Music from ${lab}.`, "From the official session music listings."); }
      else if (z.c === "2026-10") add("music", "Music", "Music", `<p><span class="pill pending">Pending</span> Song lists for October 2026 will be added once the official listings are posted.</p>`); }
    if (z.k === "c") { const i = LB.confs.findIndex(c => c.c === z.c), prev = LB.confs[i + 1];
      if (prev) { const top = new Set(LB.stats(LB.talks.filter(t => t.c === prev.c)).topWords.slice(0, 20).map(x => x[0])), fresh = S.topWords.slice(0, 20).filter(([w]) => !top.has(w)).slice(0, 8);
        if (fresh.length) add("new", "What's new", `New in the top 20 since ${short(prev.label)}`, `<ol class="z-words">${fresh.map(([w]) => `<li>${esc(w)}</li>`).join("")}</ol>`,
          { type: "words", items: fresh.map(x => x[0]) }, `Words that rose into the top 20 in ${lab}: ${fresh.slice(0, 4).map(x => x[0]).join(", ")}.`, recapOnly || prev.recap ? "Recap-based on one side; compare again when the official text is posted." : ""); } }
    return { W, src, lab };
  }
  function card(w, LB) { return `<article class="z-card" id="z-${w.id}"><div class="ins-kicker">${esc(w.kicker)}</div><h3>${esc(w.title)}</h3>${w.html}${w.note ? `<p class="z-note">${esc(w.note)}</p>` : ""}
    ${w.card ? `<div class="ins-actions"><button type="button" class="btn gold small" data-card="${esc(w.id)}">Make a card</button></div>` : ""}</article>`; }
  function render(el, LB) {
    let z = parse(LB, QS.get("z"));
    const confOpts = cur => LB.confs.map(c => `<option value="${c.c}" ${c.c === cur ? "selected" : ""}>${esc(c.label)}${c.recap ? " (recap)" : ""}</option>`).join("");
    el.innerHTML = `<div class="z-scope seg" role="group" aria-label="Zoom level">${[["all", "All conferences"], ["c", "Conference"], ["s", "Session"], ["t", "Talk"]].map(([k, l]) => `<button type="button" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="z-sels"><label class="lib-sel" id="zc-l"><span>Conference</span><select id="zc"></select></label><label class="lib-sel" id="zs-l"><span>Session</span><select id="zs"></select></label><label class="lib-sel" id="zt-l"><span>Talk</span><select id="zt"></select></label></div>
      <p class="z-lab" id="zlab" role="status"></p><div class="z-grid" id="zgrid"></div>`;
    const $ = id => el.querySelector("#" + id); let cur = [];
    function draw() {
      el.querySelectorAll(".z-scope button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === z.k));
      if (z.k !== "all" && !z.c) z.c = LB.confs[1] ? LB.confs[1].c : LB.confs[0].c;
      $("zc-l").hidden = z.k === "all"; $("zs-l").hidden = z.k !== "s"; $("zt-l").hidden = z.k !== "t";
      if (z.k !== "all") { $("zc").innerHTML = confOpts(z.c); const cf = LB.confOf(z.c);
        if (z.k === "s") { const ses = Object.keys(cf.sessions).filter(se => LB.talks.some(t => t.c === z.c && t.se === se)).sort(); if (!ses.includes(z.se)) z.se = ses[0];
          $("zs").innerHTML = ses.map(se => `<option value="${se}" ${se === z.se ? "selected" : ""}>${esc(cf.sessions[se])}</option>`).join(""); }
        if (z.k === "t") { const ts = LB.talks.filter(t => t.c === z.c).sort((a, b) => a.se.localeCompare(b.se)); if (!ts.some(t => t.id === z.id)) z.id = ts[0].id;
          $("zt").innerHTML = ts.map(t => `<option value="${esc(t.id)}" ${t.id === z.id ? "selected" : ""}>${esc(t.s.replace(/^(President|Elder|Sister|Bishop)\s+/, ""))}: ${esc(t.t)}</option>`).join(""); } }
      const ts = scopeTalks(LB, z), r = widgets(LB, z, ts); cur = r.W;
      $("zlab").innerHTML = `<b>${esc(r.lab)}</b> · ${esc(r.src)}`;
      $("zgrid").innerHTML = r.W.map(w => card(w, LB)).join("");
      const q = new URLSearchParams(location.search); z.k === "all" ? q.delete("z") : q.set("z", zq(z)); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
    }
    el.addEventListener("click", e => { const b = e.target.closest(".z-scope button"); if (b) { z = { ...z, k: b.dataset.k }; draw(); return; }
      const m = e.target.closest("[data-card]"); if (m) { const w = cur.find(x => x.id === m.dataset.card); if (w && w.card) location.href = LB.zcard({ ...w.card }); } });
    $("zc").addEventListener("change", e => { z = { k: z.k, c: e.target.value }; draw(); });
    $("zs").addEventListener("change", e => { z.se = e.target.value; draw(); });
    $("zt").addEventListener("change", e => { z.id = e.target.value; draw(); });
    draw();
  }
  // ---- Compare two conferences ----
  function compare(el, LB) {
    const off = LB.confs.filter(c => !c.recap);
    el.innerHTML = `<div class="z-sels two"><label class="lib-sel"><span>First</span><select id="ca">${off.map((c, i) => `<option value="${c.c}" ${i === 1 ? "selected" : ""}>${esc(c.label)}</option>`).join("")}</select></label>
      <label class="lib-sel"><span>Second</span><select id="cb">${off.map((c, i) => `<option value="${c.c}" ${i === 0 ? "selected" : ""}>${esc(c.label)}</option>`).join("")}</select></label></div><div id="cout"></div>
      <p class="z-note"><span class="pill pending">October 2026</span> can be compared once its official text is posted; until then it uses recaps, so it isn't offered here.</p>`;
    const go = () => { const a = el.querySelector("#ca").value, b = el.querySelector("#cb").value, A = LB.stats(LB.talks.filter(t => t.c === a)), B = LB.stats(LB.talks.filter(t => t.c === b)), la = short(LB.confOf(a).label), lb = short(LB.confOf(b).label);
      const da = Object.fromEntries(A.density), db = Object.fromEntries(B.density), keys = LB.THEME_KEYS.slice().sort((x, y) => (db[y] + da[y]) - (db[x] + da[x])).slice(0, 8), m = Math.max(...keys.flatMap(k => [da[k], db[k]]));
      const wa = Object.fromEntries(A.works), wb = Object.fromEntries(B.works), works = [...new Set([...A.works, ...B.works].map(x => x[0]))];
      const ta = new Set(A.topWords.slice(0, 20).map(x => x[0])), tb = new Set(B.topWords.slice(0, 20).map(x => x[0]));
      el.querySelector("#cout").innerHTML = `<div class="cmp-head"><span><i class="ka"></i>${esc(la)}</span><span><i class="kb"></i>${esc(lb)}</span></div>
        <div class="tp-two"><section class="z-card"><h3>Size</h3><table class="cmp"><tr><th scope="col">Measure</th><th scope="col">${esc(la)}</th><th scope="col">${esc(lb)}</th></tr>
          <tr><th scope="row">Talks</th><td>${A.n}</td><td>${B.n}</td></tr><tr><th scope="row">Minutes to read</th><td>${A.readMin}</td><td>${B.readMin}</td></tr><tr><th scope="row">Scripture refs</th><td>${A.works.reduce((s, x) => s + x[1], 0)}</td><td>${B.works.reduce((s, x) => s + x[1], 0)}</td></tr>
          <tr><th scope="row">Invitations</th><td>${A.inv}</td><td>${B.inv}</td></tr><tr><th scope="row">Promises</th><td>${A.pro}</td><td>${B.pro}</td></tr></table></section>
        <section class="z-card"><h3>Topics</h3>${keys.map(k => `<div class="cmp-row"><span>${esc(LB.themeName(k))}</span><div class="cmp-bars"><i class="ka" style="width:${da[k] / m * 100}%"></i><i class="kb" style="width:${db[k] / m * 100}%"></i></div></div>`).join("")}<p class="z-note">Topic words per 1,000 words.</p></section>
        <section class="z-card"><h3>Scriptures by book</h3>${works.map(w => `<div class="cmp-row"><span>${esc(w)}</span><div class="cmp-bars"><i class="ka" style="width:${(wa[w] || 0) / Math.max(...Object.values(wa), ...Object.values(wb)) * 100}%"></i><i class="kb" style="width:${(wb[w] || 0) / Math.max(...Object.values(wa), ...Object.values(wb)) * 100}%"></i></div></div>`).join("")}</section>
        <section class="z-card"><h3>Top words</h3><p><b>Only in ${esc(la)}'s top 20:</b> ${[...ta].filter(w => !tb.has(w)).map(esc).join(", ") || "none"}</p><p><b>Only in ${esc(lb)}'s top 20:</b> ${[...tb].filter(w => !ta.has(w)).map(esc).join(", ") || "none"}</p><p><b>Both:</b> ${[...ta].filter(w => tb.has(w)).slice(0, 12).map(esc).join(", ")}</p></section></div>`; };
    el.addEventListener("change", go); go();
  }
  // ---- Music across conferences ----
  function music(el, LB) {
    const all = LB.L.music, cnt = {}, book = {}; all.forEach(m => m.songs.forEach(([t, b, n]) => { cnt[t] = (cnt[t] || 0) + 1; book[t] = [b, n]; }));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12), songs = all.reduce((s, m) => s + m.songs.length, 0), cs = all.reduce((s, m) => s + m.songs.filter(x => x[1] === "cs").length, 0);
    const confs = [...new Set(all.map(m => m.c))];
    el.innerHTML = `<div class="stat-row"><div class="stat"><b>${songs}</b><span>songs listed</span></div><div class="stat"><b>${Object.keys(cnt).length}</b><span>different songs</span></div><div class="stat"><b>${cs}</b><span>from the Children's Songbook</span></div></div>
      <div class="tp-two"><section class="z-card"><h3>Sung most often</h3><ol class="tp-rank">${top.map(([t, n]) => `<li>${LB.hymnLink(t) ? `<a href="${esc(LB.hymnLink(t))}" rel="noopener" target="_blank">${esc(t)}</a>` : esc(t)}<b>${n}×</b></li>`).join("")}</ol>
        <div class="ins-actions"><button type="button" class="btn gold small" id="mcard">Make a card</button></div></section>
      <section class="z-card"><h3>Coverage</h3><p>Official session music listings for ${confs.length} conferences (${esc(short(LB.confOf(confs[0]).label))} to ${esc(short(LB.confOf(confs[confs.length - 1]).label))}), ${all.length} sessions.</p>
        <p><span class="pill pending">October 2026</span> Song lists will be added when the official listings are posted.</p></section></div>`;
    el.querySelector("#mcard").addEventListener("click", () => location.href = LB.zcard({ title: "Songs sung most at general conference", kicker: "Music · " + confs.length + " conferences", eyebrow: "GENERAL CONFERENCE MUSIC 2021–2026",
      body: { type: "bars", items: top.slice(0, 5).map(([label, value]) => ({ label, value })) }, basis: "From official session music listings", share: `The songs sung most often at general conference since ${short(LB.confOf(confs[0]).label)}. #GeneralConference`, url: SITE + "insights.html#music" }));
  }
  window.Zoom = { render, compare, music, widgets, scopeTalks, parse };
})();
