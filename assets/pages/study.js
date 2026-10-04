mount("study.html", true);
// Study library: every general conference talk from April 2021 to October 2026 in one place.
// Official talks: title, speaker, session, footnote references and derived counts only (no talk text). October 2026: this site's recaps.
const LB = Library, main = document.getElementById("main");
const st = { view: ["talks", "topics", "speakers"].includes(QS.get("view")) ? QS.get("view") : "talks", c: QS.get("c") || "2026-10", topic: QS.get("topic") || "", sp: QS.get("sp") || "", q: QS.get("q") || "", n: 30 };
if (st.c !== "all" && !LB.confOf(st.c)) st.c = "2026-10";
if (st.topic && !LB.THEME_KEYS.includes(st.topic)) st.topic = "";
if (st.sp && !LB.speakers.some(x => x.sp === st.sp)) st.sp = "";
const opt = (v, label, cur) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(label)}</option>`;
const cov = LB.coverage;
main.innerHTML = `
  <div class="section-label">Study</div>
  <h1 class="lib-h1">Study library</h1>
  <p class="lib-sub">${cov.talks + CONF.talks.length} talks from ${cov.conferences + 1} general conferences, April 2021 to October 2026. Find a talk by conference, topic, speaker or a word. New here? Try the <a href="plan.html">reading plan to April</a>.</p>
  <div class="lib-views seg" role="group" aria-label="Browse by">${[["talks", "Talks"], ["topics", "Topics"], ["speakers", "Speakers"]].map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${st.view === k}">${v}</button>`).join("")}</div>
  <div class="lib-bar" id="bar">
    <label class="lib-search"><span class="sr-only">Search talks</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16 16l5 5"/></svg>
      <input id="q" type="search" placeholder="Search titles, speakers, scriptures…" value="${esc(st.q)}" autocomplete="off" enterkeyhint="search"></label>
    <div class="lib-filters">
      <label class="lib-sel"><span>Conference</span><select id="c">${opt("all", "All conferences", st.c)}${LB.confs.map(x => opt(x.c, x.label, st.c)).join("")}</select></label>
      <label class="lib-sel"><span>Topic</span><select id="topic">${opt("", "Any topic", st.topic)}${LB.THEME_KEYS.map(k => opt(k, LB.themeName(k), st.topic)).join("")}</select></label>
      <label class="lib-sel"><span>Speaker</span><select id="sp">${opt("", "Any speaker", st.sp)}${LB.speakers.map(x => opt(x.sp, x.s.replace(/^(President|Elder|Sister|Bishop)\s+/, "") + " (" + x.n + ")", st.sp)).join("")}</select></label>
    </div>
    <div class="lib-chips" id="chips" aria-live="polite"></div>
  </div>
  <div id="out"></div>
  <p class="lib-note">Official talks link to ChurchofJesusChrist.org. Topics come from counting topic words in each talk (a rough guide, not a judgment). October 2026 entries use this site's recap until the official text is posted. <a href="credits.html">About the data</a>.</p>`;
const $ = id => document.getElementById(id);
function sync() { const q = new URLSearchParams(); if (st.view !== "talks") q.set("view", st.view); if (st.c !== "2026-10") q.set("c", st.c); if (st.topic) q.set("topic", st.topic); if (st.sp) q.set("sp", st.sp); if (st.q) q.set("q", st.q);
  history.replaceState(null, "", "study.html" + (q.toString() ? "?" + q : "")); }
const confLabel = c => c === "all" ? "All conferences" : LB.confOf(c).label;
function chips() { const a = [];
  if (st.c !== "2026-10") a.push(["c", confLabel(st.c)]); if (st.topic) a.push(["topic", LB.themeName(st.topic)]); if (st.sp) a.push(["sp", LB.speakers.find(x => x.sp === st.sp).s]); if (st.q) a.push(["q", "“" + st.q + "”"]);
  $("chips").innerHTML = a.map(([k, v]) => `<button type="button" class="chip" data-k="${k}" aria-label="Remove filter ${esc(v)}">${esc(v)} <span aria-hidden="true">×</span></button>`).join("") + (a.length > 1 ? `<button type="button" class="linkish" data-k="all">Clear all</button>` : ""); }
const talkRow = t => { const cf = LB.confOf(t.c), mins = LB.minutes(t), ext = !t.local;
  return `<li><a class="lib-talk" href="${esc(LB.href(t))}" ${ext ? 'rel="noopener" target="_blank"' : ""}>
    <span class="lt-title">${esc(t.t)}${ext ? ' <span class="ext" aria-label="opens ChurchofJesusChrist.org">↗</span>' : ""}</span>
    <span class="lt-meta">${esc(t.s)} · ${esc(cf.label)}${LB.sessName(t) ? " · " + esc(LB.sessName(t).replace(/ Session$/, "")) : ""}${mins ? ` · ${mins} min read` : t.recap ? " · recap" : ""}</span>
    ${t.tg.length ? `<span class="lt-tags">${t.tg.map(k => `<span class="pill">${esc(LB.themeName(k))}</span>`).join("")}</span>` : ""}</a></li>`; };
function render() { sync(); chips();
  document.querySelectorAll(".lib-views button").forEach(b => { b.setAttribute("aria-pressed", b.dataset.v === st.view); });
  const list = LB.filter({ c: st.c, topic: st.topic, sp: st.sp, q: st.q });
  if (st.view === "talks") {
    $("out").innerHTML = `<p class="lib-count" role="status">${list.length} talk${list.length === 1 ? "" : "s"}${st.c === "2026-10" && !st.topic && !st.sp && !st.q ? " in October 2026 · choose <b>All conferences</b> to search all " + LB.talks.length : ""}</p>
      ${list.length ? `<ol class="lib-list">${list.slice(0, st.n).map(talkRow).join("")}</ol>${list.length > st.n ? `<button type="button" class="btn secondary" id="more">Show ${Math.min(30, list.length - st.n)} more</button>` : ""}` : `<p class="empty">No talks match. Try All conferences or a shorter search.</p>`}`;
    $("more")?.addEventListener("click", () => { st.n += 30; render(); });
  } else if (st.view === "topics") {
    const by = {}; list.forEach(t => t.tg.forEach(k => by[k] = (by[k] || 0) + 1));
    $("out").innerHTML = `<p class="lib-count">Topics in ${list.length} talks${st.c !== "all" ? " · " + esc(confLabel(st.c)) : ""}</p><div class="lib-grid">${LB.THEME_KEYS.map(k => [k, by[k] || 0]).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
      `<a class="lib-topic" href="topic.html?k=${k}"><i aria-hidden="true">${LB.themeIcon(k)}</i><b>${esc(LB.themeName(k))}</b><small>${n} talk${n === 1 ? "" : "s"}</small></a>`).join("")}</div>`;
  } else {
    const m = new Map(); list.forEach(t => { const x = m.get(t.sp) || { sp: t.sp, s: t.s, r: t.r, n: 0 }; x.n++; m.set(t.sp, x); });
    const sps = [...m.values()].sort((a, b) => b.n - a.n || a.s.localeCompare(b.s));
    $("out").innerHTML = `<p class="lib-count">${sps.length} speakers${st.c !== "all" ? " · " + esc(confLabel(st.c)) : ""}</p><ol class="lib-list sp">${sps.map(x => `<li><a class="lib-talk" href="speaker.html?s=${x.sp}"><span class="lt-title">${esc(x.s)}</span><span class="lt-meta">${esc(x.r || "")} · ${x.n} talk${x.n === 1 ? "" : "s"}</span></a></li>`).join("")}</ol>`;
  } }
["c", "topic", "sp"].forEach(id => $(id).addEventListener("change", e => { st[id] = e.target.value; st.n = 30; render(); }));
let qt; $("q").addEventListener("input", e => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim(); st.n = 30; render(); }, 160); });
$("q").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
$("chips").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
  if (k === "all" || k === "c") st.c = "2026-10"; if (k === "all" || k === "topic") st.topic = ""; if (k === "all" || k === "sp") st.sp = ""; if (k === "all" || k === "q") st.q = "";
  $("c").value = st.c; $("topic").value = st.topic; $("sp").value = st.sp; $("q").value = st.q; render(); });
document.querySelectorAll(".lib-views button").forEach(b => b.addEventListener("click", () => { st.view = b.dataset.v; render(); }));
render();
