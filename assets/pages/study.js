mount("study.html", true);
// Study library: every general conference talk in the library (see LIB.coverage) in one place.
// Official talks: title, speaker, session, footnote references and derived counts only (no talk text). October 2026: this site's recaps.
const LB = Library, main = document.getElementById("main");
const st = { view: ["talks", "topics", "speakers"].includes(QS.get("view")) ? QS.get("view") : "talks", c: QS.get("c") || "2026-10", topic: QS.get("topic") || "", sp: QS.get("sp") || "", se: QS.get("se") || "", sort: QS.get("sort") === "n" ? "n" : "calling", q: QS.get("q") || "", n: 30 };
if (st.c !== "all" && !LB.confOf(st.c)) st.c = "2026-10";
if (st.topic && !LB.THEME_KEYS.includes(st.topic)) st.topic = "";
if (st.sp && !LB.speakers.some(x => x.sp === st.sp)) st.sp = "";
if (st.sp && !QS.get("c")) st.c = "all";
const opt = (v, label, cur) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(label)}</option>`;
const cov = LB.coverage;
const confRow = (href, num, title, speaker) => `<a class="conf-row" href="${esc(href)}"><span class="conf-num">${esc(num)}</span><span class="conf-body"><b>${esc(title)}</b><span>${esc(speaker)}</span></span></a>`;
const confDrop = CONF.sessions.map((s, i) => {
  const biz = (CONF.business || []).filter(b => b.session === s.id);
  const ts = CONF.talks.filter(t => t.session === s.id).sort((a, b) => a.order - b.order);
  const n = biz.length + ts.length;
  const rows = biz.map(b => confRow("talks/" + b.id + ".html", "S", b.title, b.speaker)).join("") + ts.map(t => confRow("talks/" + t.id + ".html", String(t.order), t.title, t.speaker)).join("");
  return `<details class="conf-sess" ${i === 0 ? "open" : ""}><summary><span class="conf-name">${esc(s.name.replace(/ Session$/, ""))}</span><span class="pill">${n}</span></summary><div class="conf-rows">${rows}</div></details>`;
}).join("");
main.innerHTML = `
  <div class="section-label">Study</div>
  <section class="conf-drop" aria-labelledby="oct-h">
    <h2 class="lib-h2" id="oct-h">October 2026 talks</h2>
    <p class="conf-lead">The latest general conference. Open a session and tap a talk. Each one opens on this site.</p>
    ${confDrop}
  </section>
  <h2 class="lib-h2" id="search-h">Search all talks</h2>
  <p class="lib-sub">${cov.talks + CONF.talks.length} talks from ${cov.conferences + 1} general conferences, ${cov.from} to October 2026. Search, or filter by session, topic, speaker or conference. New here? Try the <a href="plan.html">reading plan to April</a>.</p>
  <p class="lib-acts"><a class="btn gold small" href="lessons.html">Build a lesson</a><a class="btn secondary small" href="quiz.html">Who said it? quiz</a></p>
  <div class="lib-views seg" role="group" aria-label="Browse by">${[["talks", "Talks"], ["topics", "Topics"], ["speakers", "Speakers"]].map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${st.view === k}">${v}</button>`).join("")}</div>
  <div class="lib-bar" id="bar">
    <label class="lib-search"><span class="sr-only">Search talks</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16 16l5 5"/></svg>
      <input id="q" type="search" placeholder="Search titles, speakers, scriptures…" value="${esc(st.q)}" autocomplete="off" enterkeyhint="search"></label>
    <div class="lib-filters">
      <label class="lib-sel"><span>Conference</span><select id="c">${opt("all", "All conferences", st.c)}${LB.confs.map(x => opt(x.c, x.label, st.c)).join("")}</select></label>
      <label class="lib-sel"><span>Session</span><select id="se"></select></label>
      <label class="lib-sel"><span>Topic</span><select id="topic">${opt("", "Any topic", st.topic)}${LB.THEME_KEYS.map(k => opt(k, LB.themeName(k), st.topic)).join("")}</select></label>
      <label class="lib-sel"><span>Speaker</span><select id="sp">${opt("", "Any speaker", st.sp)}${LB.GROUP_ORDER.map(g => { const l = LB.speakers.filter(x => x.g === g); return l.length ? `<optgroup label="${esc(LB.GROUPS[g][0])}">${l.map(x => opt(x.sp, x.s.replace(/^(President|Elder|Sister|Bishop|Brother)\s+/, "") + " (" + x.n + ")", st.sp)).join("")}</optgroup>` : ""; }).join("")}</select></label>
    </div>
    <div class="lib-chips" id="chips" aria-live="polite"></div>
  </div>
  <div id="out"></div>
  <p class="lib-note">October 2026 talks open on this site. Earlier conferences open on ChurchofJesusChrist.org, because those talks are not hosted here. Topics come from counting topic words in each talk (a rough guide, not a judgment). <a href="credits.html">About the data</a>.</p>`;
const $ = id => document.getElementById(id);
function sessMap() { const c = st.c !== "all" && LB.confOf(st.c) ? st.c : "2026-10"; return (LB.confOf(c) || {}).sessions || {}; }
function fillSe() { const sessions = sessMap(), keys = Object.keys(sessions); if (st.se && !keys.includes(st.se)) st.se = "";
  $("se").innerHTML = opt("", "Any session", st.se) + keys.map(k => opt(k, String(sessions[k]).replace(/ Session$/, ""), st.se)).join(""); }
function sync() { const q = new URLSearchParams(); if (st.view !== "talks") q.set("view", st.view); if (st.c !== "2026-10") q.set("c", st.c); if (st.topic) q.set("topic", st.topic); if (st.sp) q.set("sp", st.sp); if (st.se) q.set("se", st.se); if (st.q) q.set("q", st.q);
  setURL("study.html" + (q.toString() ? "?" + q : "")); }
const confLabel = c => c === "all" ? "All conferences" : LB.confOf(c).label;
function chips() { const a = [];
  if (st.c !== "2026-10") a.push(["c", confLabel(st.c)]); if (st.se) a.push(["se", (sessMap()[st.se] || "Session").replace(/ Session$/, "")]); if (st.topic) a.push(["topic", LB.themeName(st.topic)]); if (st.sp) a.push(["sp", LB.speakers.find(x => x.sp === st.sp).s]); if (st.q) a.push(["q", "“" + st.q + "”"]);
  $("chips").innerHTML = a.map(([k, v]) => `<button type="button" class="chip" data-k="${k}" aria-label="Remove filter ${esc(v)}">${esc(v)} <span aria-hidden="true">×</span></button>`).join("") + (a.length > 1 ? `<button type="button" class="linkish" data-k="all">Clear all</button>` : ""); }
const talkRow = t => { const cf = LB.confOf(t.c), mins = LB.minutes(t), ext = !t.local;
  return `<li><a class="lib-talk" href="${esc(LB.href(t))}" ${ext ? 'rel="noopener" target="_blank"' : ""}>
    <span class="lt-title">${esc(t.t)}${ext ? ' <span class="ext" aria-label="opens ChurchofJesusChrist.org">↗</span>' : ""}</span>
    <span class="lt-meta">${esc(t.s)} · ${esc(cf.label)}${LB.sessName(t) ? " · " + esc(LB.sessName(t).replace(/ Session$/, "")) : ""}${mins ? ` · ${mins} min read` : t.recap ? " · recap" : ""}</span>
    ${t.tg.length ? `<span class="lt-tags">${t.tg.map(k => `<span class="pill">${esc(LB.themeName(k))}</span>`).join("")}</span>` : ""}</a>${makeLink(t)}</li>`; };
const makeLink = t => { if (t.local) { const r = talkById(t.id); return r && r.quotes.length ? `<a class="lib-make" href="builder.html?t=${esc(t.id)}&q=0">Make a card</a>` : ""; }
  return `<a class="lib-make" href="builder.html?lt=${esc(t.c)}/${esc(t.id)}" aria-label="Make a card for ${esc(t.t)}">Make a card</a>`; };
function render() { sync(); chips();
  document.querySelectorAll(".lib-views button").forEach(b => { b.setAttribute("aria-pressed", b.dataset.v === st.view); });
  const list = LB.filter({ c: st.c, topic: st.topic, sp: st.sp, q: st.q, se: st.se || undefined });
  if (st.view === "talks") {
    $("out").innerHTML = `<p class="lib-count" role="status">${list.length} talk${list.length === 1 ? "" : "s"}${st.c === "2026-10" && !st.topic && !st.sp && !st.se && !st.q ? " in October 2026 · choose <b>All conferences</b> to search all " + LB.talks.length : ""}</p>
      ${list.length ? `<ol class="lib-list">${list.slice(0, st.n).map(talkRow).join("")}</ol>${list.length > st.n ? `<button type="button" class="btn secondary" id="more">Show ${Math.min(30, list.length - st.n)} more</button>` : ""}` : `<p class="empty">No talks match. Try All conferences or a shorter search.</p>`}`;
    $("more")?.addEventListener("click", () => { st.n += 30; render(); });
  } else if (st.view === "topics") {
    const by = {}; list.forEach(t => t.tg.forEach(k => by[k] = (by[k] || 0) + 1));
    $("out").innerHTML = `<p class="lib-count">Topics in ${list.length} talks${st.c !== "all" ? " · " + esc(confLabel(st.c)) : ""}</p><div class="lib-grid">${LB.THEME_KEYS.map(k => [k, by[k] || 0]).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
      `<a class="lib-topic" href="topic.html?k=${k}"><i aria-hidden="true">${LB.themeIcon(k)}</i><b>${esc(LB.themeName(k))}</b><small>${n} talk${n === 1 ? "" : "s"}</small></a>`).join("")}</div>`;
  } else {
    const m = new Map(); list.forEach(t => { const x = m.get(t.sp) || { sp: t.sp, s: t.s, r: t.r, n: 0 }; x.n++; m.set(t.sp, x); });
    const byN = st.sort === "n", sps = [...m.values()].map(x => ({ ...x, g: LB.groupOf(x.r) }));
    sps.sort((a, b) => byN ? b.n - a.n || a.s.localeCompare(b.s) : LB.GROUP_ORDER.indexOf(a.g) - LB.GROUP_ORDER.indexOf(b.g) || LB.surname(a.s).localeCompare(LB.surname(b.s)));
    const row = x => `<li><a class="lib-talk" href="speaker.html?s=${x.sp}"><span class="lt-title">${esc(x.s)}</span><span class="lt-meta">${esc(x.r || "")} · ${x.n} talk${x.n === 1 ? "" : "s"}</span></a></li>`;
    $("out").innerHTML = `<p class="lib-count">${sps.length} speakers${st.c !== "all" ? " · " + esc(confLabel(st.c)) : ""}</p>
      <div class="seg lib-sort" role="group" aria-label="Sort speakers"><button type="button" data-sort="calling" aria-pressed="${!byN}">By calling</button><button type="button" data-sort="n" aria-pressed="${byN}">Most talks</button></div>
      ${byN ? `<ol class="lib-list sp">${sps.map(row).join("")}</ol>` : LB.GROUP_ORDER.map(g => { const l = sps.filter(x => x.g === g); return l.length ? `<h3 class="lib-gh">${esc(LB.GROUPS[g][0])} <small>${l.length}</small></h3><ol class="lib-list sp">${l.map(row).join("")}</ol>` : ""; }).join("")}`;
    $("out").querySelectorAll("[data-sort]").forEach(b => b.onclick = () => { st.sort = b.dataset.sort; render(); });
  } }
["c", "se", "topic", "sp"].forEach(id => $(id).addEventListener("change", e => { st[id] = e.target.value; st.n = 30; if (id === "c") fillSe(); if (id === "sp" && st.sp && st.c === "2026-10") { st.c = "all"; $("c").value = "all"; fillSe(); } render(); }));
let qt; $("q").addEventListener("input", e => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim(); st.n = 30; render(); }, 160); });
$("q").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
$("chips").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
  if (k === "all" || k === "c") st.c = "2026-10"; if (k === "all" || k === "se") st.se = ""; if (k === "all" || k === "topic") st.topic = ""; if (k === "all" || k === "sp") st.sp = ""; if (k === "all" || k === "q") st.q = "";
  $("c").value = st.c; fillSe(); $("topic").value = st.topic; $("sp").value = st.sp; $("q").value = st.q; render(); });
document.querySelectorAll(".lib-views button").forEach(b => b.addEventListener("click", () => { st.view = b.dataset.v; render(); }));
fillSe();
render();
