mount("", true);
// Initials monogram with "painted light" — no official portraits are copied (Church copyright).
const initials = n => n.replace(/^(Elder|Sister|President|Bishop)\s+/, "").split(/\s+/).filter(w => !/^[A-Z]\.$/.test(w)).map(w => w[0]).filter((c, i, a) => i === 0 || i === a.length - 1).join("");
const hue = n => [...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const monogram = (n, big) => `<div class="monogram ${big ? "big" : ""}" style="--h:${hue(n)}" aria-hidden="true"><span>${esc(initials(n))}</span></div>`;
const sl = QS.get("s"), ts = speakerTalks(sl), main = document.getElementById("main");
const OFFICIAL_LEADERS = "https://www.churchofjesuschrist.org/learn/global-leadership-of-the-church?lang=eng";
const SPEAKER_INDEX = "https://www.churchofjesuschrist.org/study/general-conference/speakers?lang=eng";
// Speakers across conferences come from the study library (lazy-loaded: official metadata and footnotes only).
const short = c => (c.slice(5) === "04" ? "April " : "October ") + c.slice(0, 4);
function libSection(LB, sp, name) {
  const all = LB.talks.filter(t => t.sp === sp).sort((a, b) => b.c.localeCompare(a.c));
  if (!all.length) return "";
  const add = (o, x) => (o[x] = (o[x] || 0) + 1, o), tg = {}, rf = {}; all.forEach(t => { t.tg.forEach(k => add(tg, k)); t.rf.forEach(r => add(rf, r)); });
  const sort = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
  return `<section class="card"><h2>Talks across conferences</h2><p class="b-help">${all.length} talk${all.length === 1 ? "" : "s"} from ${LB.coverage.from} to October 2026.</p>
    <ol class="lib-list">${all.map(t => `<li><a class="lib-talk" href="${esc(LB.href(t))}" ${t.local ? "" : 'rel="noopener" target="_blank"'}><span class="lt-title">${esc(t.t)}${t.local ? "" : ' <span class="ext" aria-label="opens ChurchofJesusChrist.org">↗</span>'}</span><span class="lt-meta">${esc(LB.confOf(t.c).label)}${LB.sessName(t) ? " · " + esc(LB.sessName(t).replace(/ Session$/, "")) : ""}${LB.minutes(t) ? " · " + LB.minutes(t) + " min read" : ""}</span></a></li>`).join("")}</ol></section>
  <div class="tp-two"><section class="card"><h2>Recurring topics</h2>${sort(tg).length ? `<ol class="tp-rank">${sort(tg).slice(0, 6).map(([k, n]) => `<li><a href="topic.html?k=${k}">${esc(LB.themeName(k))}</a><b>${n}</b></li>`).join("")}</ol>` : "<p>None counted.</p>"}<p class="b-help">Counted from topic words in each talk; a rough guide.</p></section>
  <section class="card"><h2>Scriptures cited most</h2>${sort(rf).length ? `<ol class="tp-rank">${sort(rf).slice(0, 6).map(([r, n]) => `<li><span>${esc(r)}</span><b>${n}</b></li>`).join("")}</ol>` : "<p>None counted.</p>"}<p class="b-help">From the talks' footnotes.</p></section></div>`;
}
if (!sl) {
  main.innerHTML = `<div class="section-label">Understand</div><h1 style="margin-top:0">Speakers</h1><ol class="talks">${
    [...new Map(CONF.talks.map(t => [slug(t.speaker), t])).values()].map(t => `<li><a class="talkcard s-${sessionById(t.session).color}" href="speaker.html?s=${slug(t.speaker)}">${monogram(t.speaker)}<span class="tc-body"><span class="t-title">${esc(t.speaker)}</span><span class="t-speaker">${esc(t.calling)}</span></span><span class="tc-arrow">→</span></a></li>`).join("")}</ol>`;
  main.insertAdjacentHTML("beforeend", `<p class="lib-note">Looking for past conferences? <a href="study.html?view=speakers&c=all">Browse every speaker in the study library</a>.</p>`);
} else if (!ts.length) {
  main.innerHTML = `<p class="crumbs"><a href="speaker.html">← All speakers</a></p><p class="empty" id="ld">Loading…</p>`;
  loadLib().then(LB => { const x = LB.speakers.find(y => y.sp === sl);
    if (!x) { main.innerHTML = `<p class="crumbs"><a href="study.html?view=speakers&c=all">← All speakers</a></p><p class="empty">We couldn't find that speaker.</p>`; return; }
    document.title = x.s + " · Six Months of Light";
    main.innerHTML = `<p class="crumbs"><a href="study.html?view=speakers&c=all">← All speakers</a></p>
    <article class="card speaker-card"><div class="sp-head">${monogram(x.s, true)}<div><h1 style="margin:0">${esc(x.s)}</h1><p class="speaker">${esc(x.r || "")}</p></div></div>
    <p class="b-help">Calling as listed with the most recent talk here. Official biography: <a href="${OFFICIAL_LEADERS}" rel="noopener">Church leadership on ChurchofJesusChrist.org ↗</a>.</p></article>${libSection(LB, sl, x.s)}`; })
  .catch(() => { document.getElementById("ld").textContent = "The library didn't load. Check your connection and try again."; });
} else {
  const s = ts[0], themes = [...new Set(ts.flatMap(talkThemes))];
  document.title = s.speaker;
  main.innerHTML = `<p class="crumbs"><a href="speaker.html">← All speakers</a></p>
  <article class="card speaker-card">
    <div class="sp-head">${monogram(s.speaker, true)}<div><h1 style="margin:0">${esc(s.speaker)}</h1><p class="speaker">${esc(s.calling)}</p></div></div>
    <dl class="kv">
      <dt>Bio</dt><dd>Only the calling above is included here. For the official biography, see <a href="${OFFICIAL_LEADERS}" rel="noopener">Church leadership on ChurchofJesusChrist.org ↗</a>.</dd>
      <dt>This conference</dt><dd>${ts.map(t => `<a href="talks/${t.id}.html">“${esc(t.title)}”</a> · ${esc(sessionById(t.session).name)}`).join("<br>")}</dd>
      <dt>Themes this weekend</dt><dd>${themes.length ? themes.map(x => `<span class="pill" style="margin:2px">${esc(x)}</span>`).join(" ") : "None noted"}<div class="speaker">From this conference's recap.</div></dd>
    </dl></article>
  <div id="lib"><p class="empty">Loading past talks…</p></div>
  ${askTalksPanel({ label: s.speaker, questions: ["What did this speaker teach this weekend?"],
    answer: () => talkAnswer(ts.map(t => esc(t.big_idea)).join(" "), ts) })}`;
  loadLib().then(LB => { document.getElementById("lib").innerHTML = libSection(LB, sl, s.speaker) || `<p class="b-help">No other talks from ${LB.coverage.from} on. See the <a href="${SPEAKER_INDEX}" rel="noopener">speaker index ↗</a>.</p>`; })
    .catch(() => { document.getElementById("lib").innerHTML = `<p class="b-help">Past talks didn't load. <a href="${SPEAKER_INDEX}" rel="noopener">Speaker index on ChurchofJesusChrist.org ↗</a></p>`; });
}
