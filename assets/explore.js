// Insights explorer: one sentence-style tool. "Show me [measure] for [subject] in [when], compared with [vs]."
// Subjects: everyone, a speaker, a calling group, a session type, a conference, a topic, a book of scripture, or music.
// Verified data only: official talk pages (metadata, footnotes, derived counts) and official session music listings.
// October 2026 comes from recaps (talks added so far): shown on its own, and as "pending" in comparisons and trends.
(function () {
  const esc = window.esc, SITE = CONF.site_url;
  const short = l => l.replace("October", "Oct").replace("April", "Apr");
  const plain = s => s.replace(/^(President|Elder|Sister|Bishop|Brother)\s+/, "");
  const SESS = { sat: ["Saturday sessions", ["1", "2", "3", "6"]], sun: ["Sunday sessions", ["4", "5"]], 1: ["Saturday morning", ["1"]], 2: ["Saturday afternoon", ["2"]], 3: ["Saturday evening", ["3", "6"]], 4: ["Sunday morning", ["4"]], 5: ["Sunday afternoon", ["5"]] };
  const seKey = name => /Saturday Morning/i.test(name) ? "1" : /Saturday Afternoon/i.test(name) ? "2" : /Sunday Morning/i.test(name) ? "4" : /Sunday Afternoon/i.test(name) ? "5" : "3";
  const MUSIC = { all: ["All music", null], hymns: ["Hymns (1985 hymnbook)", "hymns"], hfhc: ["New hymnbook songs", "hfhc"], cs: ["Children's Songbook", "cs"], choirs: ["Choirs", null] };
  const BOOKLAB = { hymns: "Hymns (1985)", hfhc: "Hymns—For Home and Church", cs: "Children's Songbook", other: "Other music" };
  const choirCat = c => /Tabernacle Choir/i.test(c) ? "The Tabernacle Choir" : /Brigham Young/i.test(c) ? "BYU and BYU–Idaho choirs" : /institute|young single adult/i.test(c) ? "Institute and young adult choirs"
    : /missionary/i.test(c) ? "Missionary choirs" : /child|youth/i.test(c) ? "Children and youth choirs" : /various/i.test(c) ? "Various choirs" : "Stake and multicultural choirs";
  const WORKS = ["Old Testament", "New Testament", "Book of Mormon", "Doctrine and Covenants", "Pearl of Great Price"];
  // ---- measures by subject family ----
  const MEAS = {
    talk: { themes: ["themes", "Topic words per 1,000 words"], words: ["words", "Top words"], scriptures: ["scriptures", "Scripture citations by book of scripture"], savior: ["names of the Savior", "Names and titles of Jesus Christ"], invitations: ["invitations", "Invitations, promises and questions"], callings: ["who spoke", "Talks by calling"] },
    topic: { weight: ["how much it comes up", "Topic words per 1,000 words"], speakers: ["who taught it", "Speakers who leaned on it most"], verses: ["verses cited", "Verses cited most in these talks"], words: ["words", "Top words in these talks"] },
    book: { citations: ["citations", "Citations by book"], verses: ["verses cited", "Verses cited most"], speakers: ["who cites it", "Speakers who cite it most"] },
    music: { songs: ["songs", "Songs sung most"], hymnbooks: ["hymnbooks", "Which songbook the music came from"], choirs: ["choirs", "Choirs that sang"], repeats: ["repeats", "Songs sung at more than one conference"] } };
  const family = s => s.k === "tp" ? "topic" : s.k === "bk" ? "book" : s.k === "mu" ? "music" : "talk";
  const DEFAULT_M = { talk: "themes", topic: "weight", book: "citations", music: "songs" };
  // ---- state <-> URL ----
  const parseSubj = v => { const [k, a] = String(v || "all").split(":"); return ["sp", "g", "se", "c", "tp", "bk", "mu"].includes(k) && a ? { k, a } : { k: "all" }; };
  const subjStr = s => s.k === "all" ? "all" : s.k + ":" + s.a;
  const parseWhen = v => { const p = String(v || "all").split(":"); if (p[0] === "c" && p[1]) return { k: "c", c: p[1] };
    if (p[0] === "r" && p[1]) { const [a, b] = p[1].split(".."); return { k: "r", a, b }; } if (p[0] === "t" && p[2]) return { k: "t", c: p[1], id: p[2] }; return { k: "all" }; };
  const whenStr = w => w.k === "c" ? "c:" + w.c : w.k === "r" ? `r:${w.a}..${w.b}` : w.k === "t" ? `t:${w.c}:${w.id}` : "all";
  function readState() {
    const q = QS, old = q.get("z"); const st = { m: q.get("m"), s: parseSubj(q.get("s")), w: parseWhen(q.get("in")), vs: q.get("vs") || "" };
    if (old && !q.get("in")) { const p = old.split(":"); if (p[0] === "c") st.w = { k: "c", c: p[1] }; if (p[0] === "s") { st.w = { k: "c", c: p[1] }; st.s = { k: "se", a: p[2] }; } if (p[0] === "t") st.w = { k: "t", c: p[1], id: p[2] }; }
    if (location.hash === "#compare" && !q.get("vs")) Object.assign(st, PRESETS.confs.st());
    if (location.hash === "#music" && !q.get("s")) Object.assign(st, PRESETS.music.st());
    return st;
  }
  const PRESETS = {
    thisconf: ["This conference", () => ({ m: "themes", s: { k: "c", a: "2026-10" }, w: { k: "all" }, vs: "" })],
    speaker: ["A speaker over time", () => ({ m: "themes", s: { k: "sp", a: "david-a-bednar" }, w: { k: "all" }, vs: "time" })],
    confs: ["Compare two conferences", () => ({ m: "themes", s: { k: "c", a: "2026-04" }, w: { k: "all" }, vs: "s:c:2025-10" })],
    satsun: ["Saturday vs Sunday", () => ({ m: "themes", s: { k: "se", a: "sat" }, w: { k: "all" }, vs: "s:se:sun" })],
    groups: ["Twelve vs Seventy", () => ({ m: "themes", s: { k: "g", a: "q12" }, w: { k: "all" }, vs: "s:g:sev" })],
    bom: ["Book of Mormon over time", () => ({ m: "citations", s: { k: "bk", a: "Book of Mormon" }, w: { k: "all" }, vs: "time" })],
    music: ["Music vs 5-year average", () => ({ m: "hymnbooks", s: { k: "mu", a: "all" }, w: { k: "c", c: "2026-04" }, vs: "w:r:2021-04..2025-10" })],
    talk: ["One talk", () => ({ m: "themes", s: { k: "all" }, w: { k: "t", c: "2026-04", id: "" }, vs: "" })],
  };
  Object.values(PRESETS).forEach(p => p.st = p[1]);
  function make(el, LB) {
    const GROUPS = LB.GROUPS, groupOf = LB.groupOf;
    const confsAsc = LB.confs.slice().reverse(), offAsc = confsAsc.filter(c => !c.recap);
    const spName = sp => (LB.speakers.find(x => x.sp === sp) || {}).s || sp;
    const subjLabel = s => s.k === "all" ? "everyone" : s.k === "sp" ? spName(s.a) : s.k === "g" ? (GROUPS[s.a] || [, s.a])[1] : s.k === "se" ? (SESS[s.a] || [s.a])[0] + (s.a === "sat" || s.a === "sun" ? "" : " sessions")
      : s.k === "c" ? "the " + LB.confOf(s.a)?.label + " conference" : s.k === "tp" ? "the topic " + LB.themeName(s.a) : s.k === "bk" ? "the " + s.a : (MUSIC[s.a] || MUSIC.all)[0].toLowerCase();
    const subjShort = s => s.k === "sp" ? plain(spName(s.a)) : s.k === "c" ? short(LB.confOf(s.a)?.label || "") : s.k === "g" ? GROUPS[s.a][0] : s.k === "se" ? SESS[s.a][0] : s.k === "tp" ? LB.themeName(s.a) : s.k === "bk" ? s.a : s.k === "mu" ? MUSIC[s.a][0] : "Everyone";
    const whenLabel = w => w.k === "all" ? "all conferences" : w.k === "c" ? LB.confOf(w.c)?.label : w.k === "r" ? `${short(LB.confOf(w.a).label)} – ${short(LB.confOf(w.b).label)}` : (() => { const t = LB.talks.find(x => x.c === w.c && x.id === w.id); return t ? `“${t.t}”` : "one talk"; })();
    const inWhen = (c, w) => w.k === "all" ? true : w.k === "c" || w.k === "t" ? c === w.c : c >= w.a && c <= w.b;
    // Talks (or music sessions) for a subject + time window
    function talksFor(s, w) {
      let ts = LB.talks.filter(t => inWhen(t.c, w));
      if (w.k === "t") ts = ts.filter(t => t.id === w.id);
      if (s.k === "sp") ts = ts.filter(t => t.sp === s.a); if (s.k === "g") ts = ts.filter(t => groupOf(t.r) === s.a);
      if (s.k === "se") ts = ts.filter(t => (SESS[s.a] || [, []])[1].includes(t.se)); if (s.k === "c") ts = ts.filter(t => t.c === s.a);
      return ts;
    }
    const musicFor = (s, w) => LB.L.music.filter(m => inWhen(m.c, s.k === "c" ? { k: "c", c: s.a } : w));
    const songsOf = (ms, s) => ms.flatMap(m => m.songs.filter(x => !MUSIC[s.a][1] || x[1] === MUSIC[s.a][1]).map(x => ({ x, m })));
    // Basis: October 2026 recap talks only stand alone; mixed sets use official talks and say so
    function basis(ts) { const off = ts.filter(t => !t.recap); return off.length ? { ts: off, recapOnly: false, dropped: ts.length - off.length } : { ts, recapOnly: ts.length > 0, dropped: 0 }; }
    const work = r => LB.work(r), book = r => LB.book(r);
    // ---- compute a measure: rows [[key, total]], plus per-talk contributions and a normalised value for comparisons ----
    function compute(m, s, w) {
      const F = family(s);
      if (F === "music") { const ms = musicFor(s, w), nconf = new Set(ms.map(x => x.c)).size || 1, out = {}, beh = {};
        const add = (k, v, b) => { out[k] = (out[k] || 0) + v; (beh[k] = beh[k] || []).push(b); };
        if (m === "choirs") ms.forEach(x => add(choirCat(x.choir), 1, { m: x, text: x.choir }));
        else if (m === "hymnbooks") songsOf(ms, { a: "all" }).forEach(({ x, m: s1 }) => add(BOOKLAB[x[1]] || "Other music", 1, { m: s1, text: x[0] }));
        else if (m === "repeats") { const per = {}; songsOf(ms, s).forEach(({ x, m: s1 }) => { (per[x[0]] = per[x[0]] || new Set()).add(s1.c); (beh[x[0]] = beh[x[0]] || []).push({ m: s1, text: x[0] }); });
          Object.entries(per).forEach(([k, set]) => { if (set.size > 1) out[k] = set.size; }); Object.keys(beh).forEach(k => { if (!out[k]) delete beh[k]; }); }
        else songsOf(ms, s).forEach(({ x, m: s1 }) => add(x[0], 1, { m: s1, text: x[0] }));
        const total = Object.values(out).reduce((a, b) => a + b, 0) || 1;
        return { rows: Object.entries(out).sort((a, b) => b[1] - a[1]), beh, n: ms.length, nLabel: `${ms.length} session${ms.length === 1 ? "" : "s"} · ${nconf} conference${nconf === 1 ? "" : "s"}`, empty: !ms.length,
          norm: (k, v) => m === "hymnbooks" ? v / total * 100 : m === "repeats" ? v : v / nconf, normUnit: m === "hymnbooks" ? "% of songs" : m === "repeats" ? "conferences" : "per conference", unit: m === "repeats" ? "conferences" : m === "choirs" ? "sessions" : "times" };
      }
      if (F === "topic" && m === "weight") { const B = basis(talksFor({ k: "all" }, w)), k = s.a, v = B.ts.reduce((a, t) => a + (t.d[k] || 0), 0) / Math.max(1, B.ts.length);
        const beh = { [LB.themeName(k)]: B.ts.filter(t => (t.d[k] || 0) > 0).map(t => ({ t, v: t.d[k], text: (Math.round(t.d[k] * 10) / 10) + " per 1,000 words" })).sort((a, b) => b.v - a.v) };
        return { rows: [[LB.themeName(k), B.recapOnly ? B.ts.filter(t => t.tg.includes(k)).length : v]], beh, n: B.ts.length, nLabel: talkN(B), recapOnly: B.recapOnly, dropped: B.dropped, norm: (_, x) => x, unit: B.recapOnly ? "talks tagged" : "per 1,000 words", normUnit: "per 1,000 words", oneKey: true };
      }
      if (F === "book" && m === "citations") { const B = basis(talksFor({ k: "all" }, w)), out = {}, beh = {};
        B.ts.forEach(t => { const rs = t.rf.filter(r => work(r) === s.a); rs.forEach(r => { const b = book(r); out[b] = (out[b] || 0) + 1; }); if (rs.length) [...new Set(rs.map(book))].forEach(b => (beh[b] = beh[b] || []).push({ t, v: rs.filter(r => book(r) === b).length, text: rs.filter(r => book(r) === b).join("; ") })); });
        const total = Object.values(out).reduce((a, b) => a + b, 0); beh["All " + s.a] = B.ts.map(t => ({ t, v: t.rf.filter(r => work(r) === s.a).length, text: t.rf.filter(r => work(r) === s.a).join("; ") })).filter(x => x.v).sort((a, b) => b.v - a.v);
        const rows = [["All " + s.a, total], ...Object.entries(out).sort((a, b) => b[1] - a[1])];
        return { rows, beh, n: B.ts.length, nLabel: talkN(B), recapOnly: B.recapOnly, dropped: B.dropped, norm: (_, v) => v / Math.max(1, B.ts.length), unit: "citations", normUnit: "per talk", lead: true };
      }
      // talk-based measures (also topic/book secondary measures over their talk sets)
      let base = talksFor(F === "talk" ? s : { k: "all" }, w);
      if (F === "topic") base = base.filter(t => t.tg.includes(s.a)); if (F === "book") base = base.filter(t => t.rf.some(r => work(r) === s.a));
      const B = basis(base), ts = B.ts, out = {}, beh = {}, add = (k, v, t, text) => { if (!v) return; out[k] = (out[k] || 0) + v; (beh[k] = beh[k] || []).push({ t, v, text }); };
      let norm = (_, v) => v / Math.max(1, ts.length), unit = "", normUnit = "per talk";
      if (m === "themes") { if (B.recapOnly) { ts.forEach(t => t.tg.forEach(k => add(LB.themeName(k), 1, t, "quote tagged"))); unit = "talks tagged (verified quotes)"; norm = (_, v) => v; }
        else { LB.THEME_KEYS.forEach(k => ts.forEach(t => add(LB.themeName(k), t.d[k] || 0, t, (Math.round((t.d[k] || 0) * 10) / 10) + " per 1,000 words"))); Object.keys(out).forEach(k => out[k] /= Math.max(1, ts.length)); unit = "per 1,000 words"; normUnit = unit; norm = (_, v) => v; } }
      if (m === "words") { ts.forEach(t => t.tw.forEach((x, i) => add(x, 1, t, "#" + (i + 1) + " word"))); unit = "talks with it in their top 10"; norm = (_, v) => v / Math.max(1, ts.length) * 100; normUnit = "% of talks"; }
      if (m === "scriptures") { ts.forEach(t => WORKS.concat("Other").forEach(W => { const rs = t.rf.filter(r => work(r) === W); add(W, rs.length, t, rs.join("; ")); })); unit = "citations"; }
      if (m === "savior") { ts.forEach(t => Object.entries(t.ti).forEach(([k, n]) => add(k, n, t, n + "×"))); unit = "mentions"; }
      if (m === "invitations") { ts.forEach(t => { add("Invitations", t.inv, t, t.inv + " “I invite”"); add("Promises", t.pro, t, t.pro + " “I promise”"); add("Questions asked", t.q, t, t.q + " questions"); }); unit = "in total"; }
      if (m === "callings") { ts.forEach(t => add(GROUPS[groupOf(t.r)]?.[0] || "Other", 1, t, t.r)); unit = "talks"; norm = (_, v) => v / Math.max(1, ts.length) * 100; normUnit = "% of talks"; }
      if (m === "speakers") { if (F === "book") ts.forEach(t => add(t.s, t.rf.filter(r => work(r) === s.a).length, t, t.rf.filter(r => work(r) === s.a).length + " citations")); else ts.forEach(t => add(t.s, 1, t, (Math.round((t.d[s.a] || 0) * 10) / 10) + " per 1,000 words")); unit = F === "book" ? "citations" : "talks"; }
      if (m === "verses") { ts.forEach(t => t.rf.filter(r => F !== "book" || work(r) === s.a).forEach(r => add(r, 1, t, r))); unit = "talks"; }
      Object.values(beh).forEach(a => a.sort((x, y) => y.v - x.v));
      return { rows: Object.entries(out).sort((a, b) => b[1] - a[1]), beh, n: ts.length, nLabel: talkN(B), recapOnly: B.recapOnly, dropped: B.dropped, norm, unit, normUnit, empty: !ts.length };
    }
    const talkN = B => `${B.ts.length} talk${B.ts.length === 1 ? "" : "s"}${B.recapOnly ? " · from recaps so far, official text pending" : ""}${B.dropped ? ` · October 2026 pending (${B.dropped} recap talk${B.dropped === 1 ? "" : "s"} not counted)` : ""}`;
    const fmt = v => v >= 100 ? Math.round(v).toLocaleString() : v >= 10 ? (Math.round(v * 10) / 10).toString() : (Math.round(v * 100) / 100).toString().replace(/^0\./, "0.");
    // ---- state ----
    let st = readState(); fix();
    function fix() {
      const F = family(st.s); if (!MEAS[F][st.m]) st.m = DEFAULT_M[F];
      if (st.m === "repeats" && (st.vs || st.w.k === "c")) st.m = "songs";   // repeats only make sense across several conferences
      if (st.s.k === "c") st.w = { k: "all" };
      if (st.w.k === "t") { const ts = LB.talks.filter(t => t.c === st.w.c); if (!ts.length) st.w = { k: "all" }; else if (!ts.some(t => t.id === st.w.id)) st.w.id = ts[0].id; if (F !== "talk") st.w = { k: "all" }; }
      if (st.vs === "time" && (st.w.k === "c" || st.w.k === "t" || st.s.k === "c")) { if (st.s.k === "c") st.s = { k: "all" }; st.w = { k: "all" }; }
      if (st.vs.startsWith("s:") && family(parseSubj(st.vs.slice(2))) !== F) st.vs = "";
      if (st.w.k === "t" && st.vs === "time") st.vs = "";
    }
    const vsSubj = () => st.vs.startsWith("s:") ? parseSubj(st.vs.slice(2)) : null, vsWhen = () => st.vs.startsWith("w:") ? parseWhen(st.vs.slice(2)) : null;
    const vsLabel = () => st.vs === "time" ? "over time" : vsSubj() ? subjLabel(vsSubj()) : vsWhen() ? whenLabel(vsWhen()) : "nothing";
    const url = () => { const q = new URLSearchParams(); q.set("m", st.m); q.set("s", subjStr(st.s)); if (st.w.k !== "all") q.set("in", whenStr(st.w)); if (st.vs) q.set("vs", st.vs); return "insights.html?" + q + "#zoom"; };
    // ---- layout ----
    el.innerHTML = `<div class="xp-presets" role="group" aria-label="Presets">${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip" data-preset="${k}">${esc(p[0])}</button>`).join("")}</div>
      <p class="xp-sentence" id="xpS"></p><div id="xpOut" aria-live="polite"></div>`;
    const $ = id => el.querySelector("#" + id);
    function pill(k, label, hidden) { return hidden ? "" : `<button type="button" class="xp-pill" data-pill="${k}" aria-haspopup="dialog">${esc(label)}<span aria-hidden="true">▾</span></button>`; }
    function draw() {
      fix(); const F = family(st.s);
      $("xpS").innerHTML = `Show me ${pill("m", MEAS[F][st.m][0])}${st.w.k === "t" ? "" : ` for ${pill("s", subjLabel(st.s))}`}${st.s.k === "c" ? "" : ` in ${pill("w", whenLabel(st.w))}`}, ${st.vs === "time" ? "shown" : "compared with"} ${pill("vs", vsLabel())}`;
      setURL(url());
      el.querySelectorAll("[data-preset]").forEach(b => b.setAttribute("aria-pressed", JSON.stringify(PRESETS[b.dataset.preset].st()) === JSON.stringify({ m: st.m, s: st.s, w: st.w, vs: st.vs })));
      results();
    }
    let focusKey = null, cardData = null;
    function results() {
      const out = $("xpOut"), F = family(st.s), md = MEAS[F][st.m], A = compute(st.m, st.s, st.w);
      if (st.vs === "time") return timeView(out, A, md);
      const Bs = vsSubj(), Bw = vsWhen();
      if (Bs || Bw) { const B = compute(st.m, Bs || st.s, Bw || st.w);
        if (Bw) return compareView(out, A, B, md, short(whenLabel(st.w)), short(whenLabel(Bw)), subjShort(st.s) + ": ");
        return compareView(out, A, B, md, subjShort(st.s), subjShort(Bs), st.w.k === "all" ? "" : short(whenLabel(st.w)) + ": "); }
      singleView(out, A, md);
    }
    const pending = (A) => A.recapOnly ? `<p class="z-note"><span class="pill pending">Pending</span> October 2026 uses this site's recaps (talks added so far) until the official text is posted.</p>` : "";
    const head = (title, sub) => `<div class="xp-head"><h3>${esc(title)}</h3><p class="speaker">${sub}</p></div>`;
    const title = (A) => `${A && A.recapOnly && st.m === "themes" ? "Topics tagged in verified quotes" : MEAS[family(st.s)][st.m][1]} · ${st.w.k === "t" ? whenLabel(st.w) : subjShort(st.s) + (st.s.k === "c" || st.w.k === "all" ? "" : " · " + whenLabel(st.w))}`;
    function singleView(out, A, md) {
      if (A.empty || !A.rows.length) { out.innerHTML = head(title(), esc(A.nLabel || "")) + `<p class="empty">${family(st.s) === "music" && LB.confOf("2026-10") && st.w.c === "2026-10" ? '<span class="pill pending">Pending</span> October 2026 music will be added when the official listings are posted.' : "Nothing to count here yet. Try a wider time range."}</p>`; return; }
      const rows = A.rows.slice(0, 10), mx = Math.max(...rows.map(r => r[1])) || 1;
      focusKey = A.beh[focusKey] ? focusKey : rows[0][0];
      out.innerHTML = head(title(A), esc(A.nLabel)) + `<div class="xp-bars">${rows.map(([k, v]) => `<button type="button" class="xp-row ${k === focusKey ? "on" : ""}" data-key="${esc(k)}"><span class="xp-k">${esc(k)}</span><span class="xp-track"><i style="width:${Math.max(2, v / mx * 100)}%"></i></span><b>${fmt(v)}</b></button>`).join("")}</div>
        <p class="z-note">Values: ${esc(A.unit)}. Tap a row to see what's behind it.</p>${pending(A)}${behind(A, [A])}${actions()}`;
      cardData = { title: title(A).slice(0, 60), body: { type: "bars", items: rows.slice(0, 5).map(([label, v]) => ({ label: label.slice(0, 28), value: fmt(v) * 1 || v })) }, note: A.unit };
    }
    function compareView(out, A, B, md, la, lb, pre = "") {
      if (A.recapOnly !== B.recapOnly && (A.recapOnly || B.recapOnly)) { out.innerHTML = head(`${la} vs ${lb}`, "") + `<p class="empty"><span class="pill pending">Pending</span> October 2026 can be compared once its official text is posted. Until then it comes from recaps of Saturday's talks, which wouldn't be a fair comparison.</p>`; return; }
      if ((A.oneKey || A.lead) && A.rows[0] && B.rows[0] && A.rows[0][0] !== B.rows[0][0]) {   // two topics or two books: compare their headline numbers
        const lab = A.oneKey ? "Topic words per 1,000 words" : "Citations per talk"; A = { ...A, rows: [[lab, A.rows[0][1]]], beh: { [lab]: A.beh[A.rows[0][0]] } }; B = { ...B, rows: [[lab, B.rows[0][1]]], beh: { [lab]: B.beh[B.rows[0][0]] } }; }
      const keys = [...new Set([...A.rows.slice(0, 8), ...B.rows.slice(0, 8)].map(r => r[0]))], av = Object.fromEntries(A.rows), bv = Object.fromEntries(B.rows);
      const rows = keys.map(k => [k, A.norm(k, av[k] || 0), B.norm(k, bv[k] || 0)]).sort((x, y) => (y[1] + y[2]) - (x[1] + x[2])).slice(0, 9), mx = Math.max(...rows.flatMap(r => [r[1], r[2]])) || 1;
      if (!rows.length) { out.innerHTML = head(`${pre}${la} vs ${lb}`, "") + `<p class="empty">Nothing to compare for this choice. Try a wider time range.</p>`; return; }
      focusKey = keys.includes(focusKey) ? focusKey : rows[0]?.[0];
      out.innerHTML = head(`${pre}${la} vs ${lb}`, `<span class="xp-key ka"></span>${esc(la)}: ${esc(A.nLabel)}<br><span class="xp-key kb"></span>${esc(lb)}: ${esc(B.nLabel)}`) +
        `<div class="xp-bars two">${rows.map(([k, a, b]) => `<button type="button" class="xp-row ${k === focusKey ? "on" : ""}" data-key="${esc(k)}"><span class="xp-k">${esc(k)}</span><span class="xp-pair"><span class="xp-track"><i class="ka" style="width:${Math.max(1, a / mx * 100)}%"></i></span><span class="xp-track"><i class="kb" style="width:${Math.max(1, b / mx * 100)}%"></i></span></span><b>${fmt(a)}<br>${fmt(b)}</b></button>`).join("")}</div>
        <p class="z-note">Values: ${esc(A.normUnit)}, so groups of different sizes compare fairly. Tap a row to see the talks behind it.</p>${behind(A, [A, B], [la, lb])}${actions()}`;
      cardData = { title: `${pre}${la} vs ${lb}`.slice(0, 60), body: { type: "list", items: rows.slice(0, 5).map(([k, a, b]) => `${k}: ${fmt(a)} vs ${fmt(b)}`) }, note: A.normUnit };
    }
    function timeView(out, A0, md) {
      const s = st.s, w = st.w, hasMu = new Set(LB.L.music.map(m => m.c)), cs = confsAsc.filter(c => inWhen(c.c, w) && (family(s) !== "music" || hasMu.has(c.c) || c.recap)), off = cs.filter(c => !c.recap);
      const per = off.map(c => [c, compute(st.m, s, { k: "c", c: c.c })]);
      const keys = (A0.rows.length ? A0.rows : []).slice(0, A0.oneKey ? 1 : family(s) === "music" ? 5 : 6).map(r => r[0]);
      if (!keys.length) { out.innerHTML = head(title(), "") + `<p class="empty">Nothing to chart for this choice.</p>`; return; }
      focusKey = keys.includes(focusKey) ? focusKey : keys[0];
      const series = keys.map(k => [k, per.map(([c, R]) => { const v = Object.fromEntries(R.rows)[k]; return [c, R.n ? R.norm(k, v || 0) : null]; })]);
      const recapCol = cs.some(c => c.recap) ? `<span class="xp-pend" title="October 2026: pending official text">…</span>` : "";
      out.innerHTML = head(`${MEAS[family(s)][st.m][1]} · ${subjShort(s)} over time`, `${off.length} official conferences${recapCol ? " · October 2026 pending (official text not yet posted)" : ""} · values: ${esc(A0.normUnit)}`) +
        `<div class="xp-time">${series.map(([k, pts]) => { const vals = pts.map(p => p[1]).filter(v => v != null), mx = Math.max(...vals, 0) || 1, first = pts.find(p => p[1] != null), last = [...pts].reverse().find(p => p[1] != null), pk = pts.reduce((a, p) => p[1] != null && (a == null || p[1] > a[1]) ? p : a, null);
          return `<button type="button" class="xp-trow ${k === focusKey ? "on" : ""}" data-key="${esc(k)}"><span class="xp-k">${esc(k)}</span><span class="xp-spark">${pts.map(([c, v]) => v == null ? `<i class="gap" title="${esc(c.label)}: no talks"></i>` : `<i class="${pk && c === pk[0] ? "pk" : ""}" style="height:${Math.max(4, v / mx * 100)}%" title="${esc(c.label)}: ${fmt(v)}"></i>`).join("")}${recapCol}</span><b>${last ? fmt(last[1]) : "–"}</b></button>`; }).join("")}
          <div class="xp-axis"><span>${esc(short(off[0]?.label || ""))}</span><span>${esc(short(off[off.length - 1]?.label || ""))}</span></div></div>
        <p class="z-note">Gold bar = highest. Gaps mean no talks in that conference.</p>${behind(A0, [A0])}${actions()}`;
      cardData = { title: `${subjShort(s)} over time`.slice(0, 60), body: { type: "list", items: series.slice(0, 5).map(([k, pts]) => { const v = pts.filter(p => p[1] != null), pk = v.reduce((a, p) => p[1] > a[1] ? p : a, v[0]); return `${k}: ${fmt(v[0][1])} → ${fmt(v[v.length - 1][1])}${pk ? `, peak ${short(pk[0].label)}` : ""}`; }) }, note: A0.normUnit };
    }
    function behind(A, sets, labels) {
      const k = focusKey; if (!k) return "";
      const lists = sets.map((S, i) => { const items = (S.beh[k] || []).slice(0, 8); if (!items.length) return "";
        return `${labels ? `<div class="xp-bl"><span class="xp-key ${i ? "kb" : "ka"}"></span>${esc(labels[i])}</div>` : ""}<ol class="xp-behind">${items.map(x => x.t ? `<li><a href="${esc(LB.href(x.t))}" ${x.t.local ? "" : 'target="_blank" rel="noopener"'}>${esc(x.t.t)}${x.t.recap ? "" : " ↗"}</a><span class="speaker">${esc(x.t.s)} · ${esc(short(LB.confOf(x.t.c).label))} · ${esc(String(x.text).slice(0, 90))}</span></li>`
          : `<li>${LB.hymnLink(x.text) ? `<a href="${esc(LB.hymnLink(x.text))}" target="_blank" rel="noopener">${esc(x.text)} ↗</a>` : esc(x.text)}<span class="speaker">${esc(short(LB.confOf(x.m.c).label))} · ${esc(x.m.se.replace(/ Session$/, ""))}${x.m.choir && family(st.s) === "music" && st.m !== "choirs" ? " · " + esc(x.m.choir) : ""}</span></li>`).join("")}</ol>${(S.beh[k] || []).length > 8 ? `<p class="z-note">and ${(S.beh[k] || []).length - 8} more.</p>` : ""}`; }).join("");
      return lists ? `<section class="xp-why"><h4>Behind “${esc(k)}”</h4>${lists}</section>` : "";
    }
    const actions = () => `<div class="ins-actions"><button type="button" class="btn gold small" data-xcard>Make a card</button><button type="button" class="btn secondary small" data-xlink>Copy link to this view</button></div>`;
    // ---- bottom sheet / popover for each pill ----
    function sheet(titleText, body, onReady) {
      document.querySelector(".xp-sheet-wrap")?.remove();
      const wrap = document.createElement("div"); wrap.className = "xp-sheet-wrap"; wrap.innerHTML = `<div class="xp-back"></div><div class="xp-sheet" role="dialog" aria-modal="true" aria-label="${esc(titleText)}"><div class="xp-grab" aria-hidden="true"></div><div class="xp-sh-head"><h3>${esc(titleText)}</h3><button type="button" class="xp-x" aria-label="Close">×</button></div><div class="xp-sh-body">${body}</div></div>`;
      document.body.appendChild(wrap); document.body.classList.add("xp-open");
      const close = () => { wrap.remove(); document.body.classList.remove("xp-open"); document.removeEventListener("keydown", key); };
      const key = e => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", key);
      wrap.querySelector(".xp-back").onclick = close; wrap.querySelector(".xp-x").onclick = close;
      onReady(wrap.querySelector(".xp-sh-body"), close); (wrap.querySelector(".xp-sh-body input, .xp-sh-body button.opt") || wrap.querySelector(".xp-x")).focus();
    }
    const opt = (attrs, label, sub, on) => `<button type="button" class="opt ${on ? "on" : ""}" ${attrs}><b>${esc(label)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</button>`;
    const confOpts = (cur, offOnly) => LB.confs.filter(c => !offOnly || !c.recap).map(c => `<option value="${c.c}" ${c.c === cur ? "selected" : ""}>${esc(c.label)}${c.recap ? " (recaps, pending)" : ""}</option>`).join("");
    function subjectPicker(onPick, onlyFamily) {
      const top = LB.speakers.slice().sort((a, b) => b.n - a.n || a.s.localeCompare(b.s)).slice(0, 8);
      const spBtn = (s, cls) => `<button type="button" class="opt ${cls}" data-s="sp:${esc(s.sp)}" data-find="${esc(s.find)}"><b>${esc(s.s)}</b><span>${s.n} talk${s.n === 1 ? "" : "s"} · ${esc(s.r || "")}</span></button>`;
      const sec = (fam, h, items, extra = "") => onlyFamily && onlyFamily !== fam ? "" : `<div class="xp-sec" data-sec ${extra}><h4>${h}</h4>${items}</div>`;
      const body = `<input type="search" class="xp-find" placeholder="Search speakers, groups, topics, books…" aria-label="Search subjects" autocomplete="off">
        <div class="xp-opts">${sec("talk", "Everyone", opt('data-s="all"', "Everyone", "All talks"))}
        ${sec("talk", "Most talks", top.map(s => spBtn(s, "top")).join("") + `<button type="button" class="btn secondary small xp-all" data-allsp>Browse all ${LB.speakers.length} speakers by calling</button>`, 'data-topsec')}
        ${onlyFamily && onlyFamily !== "talk" ? "" : LB.GROUP_ORDER.map(g => { const list = LB.speakers.filter(x => x.g === g); return list.length ? `<div class="xp-sec" data-sec data-spgroup><h4>${esc(GROUPS[g][0])} · ${list.length}</h4>${list.map(x => spBtn(x, "sp")).join("")}</div>` : ""; }).join("")}
        ${sec("talk", "Groups (by calling)", Object.entries(GROUPS).map(([k, g]) => opt(`data-s="g:${k}" data-find="${esc(g[0].toLowerCase())}"`, g[0], "From official speaker titles")).join(""))}
        ${sec("talk", "Sessions", Object.entries(SESS).map(([k, x]) => opt(`data-s="se:${k}" data-find="${esc(x[0].toLowerCase())}"`, x[0], k === "3" ? "Evening, women's or priesthood session" : "")).join(""))}
        ${sec("talk", "Conferences", LB.confs.map(c => opt(`data-s="c:${c.c}" data-find="${esc(c.label.toLowerCase())}"`, c.label, c.recap ? "From recaps so far (pending)" : c.n + " talks")).join(""))}
        ${sec("topic", "Topics", LB.THEME_KEYS.map(k => opt(`data-s="tp:${k}" data-find="${esc(LB.themeName(k).toLowerCase())}"`, LB.themeName(k), "")).join(""))}
        ${sec("book", "Scriptures", WORKS.map(W => opt(`data-s="bk:${W}" data-find="${esc(W.toLowerCase())}"`, W, "Citations in talk footnotes")).join(""))}
        ${sec("music", "Music", Object.entries(MUSIC).map(([k, x]) => opt(`data-s="mu:${k}" data-find="${esc(x[0].toLowerCase())} music"`, x[0], "Official session music listings")).join(""))}</div>`;
      return [body, (b, close) => {
        const inp = b.querySelector(".xp-find"); let all = false;
        const norm = x => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const apply = () => { const words = norm(inp.value).split(/\s+/).filter(Boolean), q = words.length > 0;
          b.querySelectorAll(".opt").forEach(o => { const f = norm(o.dataset.find || o.textContent);
            o.hidden = o.classList.contains("top") ? q || all : q ? !words.every(w => f.includes(w)) : o.classList.contains("sp") && !all; });
          b.querySelectorAll("[data-sec]").forEach(sc => sc.hidden = ![...sc.querySelectorAll(".opt")].some(o => !o.hidden));
          const ts = b.querySelector("[data-topsec]"); if (ts) ts.hidden = q || all; };
        inp.addEventListener("input", apply);
        b.querySelector("[data-allsp]")?.addEventListener("click", () => { all = true; apply(); b.querySelector("[data-spgroup]")?.scrollIntoView({ block: "start" }); });
        apply();
        b.addEventListener("click", e => { const o = e.target.closest("[data-s]"); if (o) { close(); onPick(parseSubj(o.dataset.s)); } });
      }];
    }
    function whenPicker(cur, onPick, opts = {}) {
      const r = cur.k === "r" ? cur : { a: offAsc[0].c, b: offAsc[offAsc.length - 1].c }, c1 = cur.k === "c" || cur.k === "t" ? cur.c : LB.confs[1]?.c;
      const tOpts = c => LB.talks.filter(t => t.c === c).map(t => `<option value="${esc(t.id)}" ${cur.id === t.id ? "selected" : ""}>${esc(plain(t.s))}: ${esc(t.t)}</option>`).join("");
      const body = `${opts.noAll ? "" : opt('data-w="all"', "All conferences", `${offAsc[0].label} – October 2026`, cur.k === "all")}
        <div class="xp-sec"><h4>One conference</h4><select class="xp-sel" data-c1>${confOpts(c1)}</select><button type="button" class="btn secondary small" data-go="c">Use this conference</button></div>
        <div class="xp-sec"><h4>A range</h4><div class="xp-two"><select class="xp-sel" data-ra>${confOpts(r.a, true)}</select><span>to</span><select class="xp-sel" data-rb>${confOpts(r.b, true)}</select></div><button type="button" class="btn secondary small" data-go="r">Use this range</button></div>
        ${opts.talk ? `<div class="xp-sec"><h4>One talk</h4><select class="xp-sel" data-tc>${confOpts(c1)}</select><select class="xp-sel" data-tt>${tOpts(c1)}</select><button type="button" class="btn secondary small" data-go="t">Use this talk</button></div>` : ""}`;
      return [body, (b, close) => {
        b.querySelector("[data-tc]")?.addEventListener("change", e => b.querySelector("[data-tt]").innerHTML = tOpts(e.target.value));
        b.addEventListener("click", e => { const t = e.target.closest("[data-w],[data-go]"); if (!t) return; let w;
          if (t.dataset.w) w = { k: "all" }; else if (t.dataset.go === "c") w = { k: "c", c: b.querySelector("[data-c1]").value };
          else if (t.dataset.go === "r") { let a = b.querySelector("[data-ra]").value, z = b.querySelector("[data-rb]").value; if (a > z) [a, z] = [z, a]; w = a === z ? { k: "c", c: a } : { k: "r", a, b: z }; }
          else w = { k: "t", c: b.querySelector("[data-tc]").value, id: b.querySelector("[data-tt]").value };
          close(); onPick(w); });
      }];
    }
    function openPill(k) {
      const F = family(st.s), go = () => { focusKey = null; draw(); };
      if (k === "m") { const body = Object.entries(MEAS[F]).filter(([m]) => m !== "repeats" || (!st.vs && st.w.k !== "c")).map(([m, x]) => opt(`data-m="${m}"`, x[0][0].toUpperCase() + x[0].slice(1), x[1], m === st.m)).join("");
        return sheet("Show me…", body, (b, close) => b.addEventListener("click", e => { const o = e.target.closest("[data-m]"); if (o) { st.m = o.dataset.m; close(); go(); } })); }
      if (k === "s") { const [body, ready] = subjectPicker(s => { st.s = s; if (family(s) !== F) { st.m = DEFAULT_M[family(s)]; if (st.vs.startsWith("s:")) st.vs = ""; } if (s.k === "mu" && s.a === "choirs") st.m = "choirs"; go(); }); return sheet("For…", body, ready); }
      if (k === "w") { const [body, ready] = whenPicker(st.w, w => { st.w = w; if (st.vs === "time" && w.k !== "all" && w.k !== "r") st.vs = ""; go(); }, { talk: F === "talk" }); return sheet("In…", body, ready); }
      if (k === "vs") { const canTime = st.w.k !== "t";
        const body = opt('data-vs=""', "Nothing", "Just this view", !st.vs) + (canTime ? opt('data-vs="time"', "Over time", "Each conference side by side", st.vs === "time") : "") +
          opt('data-vs="w"', "Another period…", "Same subject, different conference or range", !!vsWhen()) + opt('data-vs="s"', "Another subject…", F === "music" ? "Other music" : F === "talk" ? "Another speaker, group, session or conference" : F === "topic" ? "Another topic" : "Another book of scripture", !!vsSubj());
        return sheet("Compared with…", body, (b, close) => b.addEventListener("click", e => { const o = e.target.closest("[data-vs]"); if (!o) return; const v = o.dataset.vs; close();
          if (v === "" || v === "time") { st.vs = v; if (v === "time" && st.s.k === "c") st.s = { k: "all" }; return go(); }
          if (v === "w") { const [bd, rd] = whenPicker(vsWhen() || { k: "c", c: LB.confs[2]?.c }, w => { st.vs = "w:" + whenStr(w); go(); }, { noAll: false }); return sheet("Compare with which period?", bd, rd); }
          const [bd, rd] = subjectPicker(s => { st.vs = "s:" + subjStr(s); go(); }, F); sheet("Compare with…", bd, rd); })); }
    }
    el.addEventListener("click", e => {
      const p = e.target.closest("[data-pill]"); if (p) return openPill(p.dataset.pill);
      const pr = e.target.closest("[data-preset]"); if (pr) { const P = PRESETS[pr.dataset.preset].st(); st = { ...P }; focusKey = null; return draw(); }
      const r = e.target.closest("[data-key]"); if (r) { focusKey = r.dataset.key; results(); el.querySelector(".xp-why")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
      if (e.target.closest("[data-xlink]")) { navigator.clipboard?.writeText(SITE + url()).then(() => { e.target.textContent = "Link copied ✓"; }).catch(() => {}); return; }
      if (e.target.closest("[data-xcard]") && cardData) location.href = LB.zcard({ title: cardData.title, kicker: "Insights explorer", eyebrow: `GENERAL CONFERENCE ${offAsc[0].c.slice(0, 4)}–2026`, body: cardData.body,
        basis: family(st.s) === "music" ? "From official session music listings" : "Counted from official talk pages" + (cardData.note ? " · " + cardData.note : ""), share: `${cardData.title}. #GeneralConference`, url: SITE + url() });
    });
    draw();
  }
  window.Explore = { make };
})();
