mount("index.html");
const tw = CONF.talk_of_the_week, tt = talkById(tw.talk_id);
const D = INSIGHTS.daily;
let html = `<section class="today" aria-labelledby="today-h">
  <div class="today-k"><span>Today's light</span><span>Day ${INSIGHTS.dayIdx + 1} · ${COUNTDOWN.days} days to April</span></div>
  <h2 id="today-h" class="sr-only">Today's quote</h2>
  <blockquote>“${esc(D.q)}”</blockquote>
  <p class="today-by">${esc(D.t.speaker)} · <a href="talks/${esc(D.t.id)}.html">${esc(D.t.title)}</a></p>
  <div class="today-actions"><a class="btn gold big" href="builder.html?t=${esc(D.t.id)}&q=${D.i}">Share this quote</a></div>
  <p class="today-note">Quoted from recap; confirm with official text.</p>
</section>
`;
const LN = LIVE.now(), NX = LIVE.next();
const liveSub = LN ? "Live now · share a line you heard" : POSTCONF ? "Lines people heard this weekend" : NX ? `Next session ${NX.at.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "Share a line during each session";
const ENTRY = [["builder.html", "Make a card", "Turn a line into a card for your story or feed", "studio"], ["study.html", "Study", "Every talk, by session, topic or speaker", "study"], ["insights.html", "Insights", "Themes, words and scriptures at a glance", "insights"], ["live.html", "Live", liveSub, "live"]];
html = `<nav class="entry" aria-label="Start here">${ENTRY.map(([h, t, d, i]) => `<a class="entry-i ${i === "live" && LN ? "is-live" : ""}" href="${h}"><span class="entry-ic" aria-hidden="true">${i === "live" ? '<span class="live-dot"></span>' : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TAB_ICON[i]}</svg>`}</span><b>${t}</b><span>${esc(d)}</span></a>`).join("")}</nav>` + html;
html += `<div id="search"></div>${askTalksPanel()}`;
html += `<div class="section-label" id="totw">Talk of the week</div><h2 class="sr-only">Talk of the Week</h2>
<article class="card totw">
  <div class="label">This week's focus</div>
  <h3><a href="talks/${esc(tt.id)}.html" style="text-decoration:none;color:inherit">${esc(tt.title)}</a></h3>
  <p class="speaker"><a href="speaker.html?s=${slug(tt.speaker)}">${esc(tt.speaker)}</a> · ${esc(tt.calling)}</p>
  <p>${esc(tt.big_idea)}</p>
  <blockquote>“${esc(tt.quotes[2])}”</blockquote>
  <div class="ponder"><div class="label">Ponder</div>${esc(tw.ponder)}</div>
  <div class="invite"><div class="label">Invitation</div>${esc(tw.invitation)}</div>
  <div class="links" style="margin-bottom:0">
    <a class="btn" href="talks/${esc(tt.id)}.html">Study this talk</a>
    <a class="txt-link" href="builder.html?t=${esc(tt.id)}&q=2">Make a card →</a>
  </div>
</article>
`;
const withTalks = CONF.sessions.filter(s => CONF.talks.some(t => t.session === s.id)), openId = (withTalks[withTalks.length - 1] || {}).id;
html += `<div class="section-label" id="sessions">Talks by session</div>`;
for (const s of CONF.sessions) {
  const ts = CONF.talks.filter(t => t.session === s.id).sort((a,b) => a.order-b.order);
  const pill = ts.length ? `${ts.length} talk${ts.length === 1 ? "" : "s"}${s.status === "pending" ? " so far" : ""}` : "Coming soon";
  html += `<details class="session s-${s.color}" id="s-${s.id}" ${s.id === openId ? "open" : ""}>
   <summary class="session-head"><h2>${esc(s.name)}</h2><span class="pill ${ts.length ? "" : "pending"}">${pill}</span></summary>
   <div class="when">${esc(s.when)} · <a href="session.html?s=${s.id}">Session page</a> · <a href="${esc(s.url)}" rel="noopener">Official ↗</a></div>`;
  html += ts.length ? `<ol class="talks">` + ts.map(t => `<li><a class="talkcard s-${s.color}" href="talks/${esc(t.id)}.html">
      <span class="num">${t.order}</span>
      <span class="tc-body"><span class="t-title">${esc(t.title)}</span><span class="t-speaker">${esc(t.speaker)}</span><span class="t-idea">${esc(t.big_idea)}</span></span><span class="tc-arrow" aria-hidden="true">→</span></a></li>`).join("") + `</ol>`
    : `<p class="empty">${esc(s.note)}</p>`;
  html += `</details>`;
}
html += `<div class="section-label">More</div><nav class="more-links" aria-label="More">${[["plan.html", "Reading plan"], ["lessons.html", "Lesson helps"], ["quiz.html", "Who said it? quiz"], ["my.html", "My Conference"], ["challenge.html", esc(CONF.challenge.title)], ["builder.html?src=promo", "Share this site"]].map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</nav>`;
html += `<div class="intro">${recapNotice()}</div><p class="speaker" style="margin-top:24px">Last updated ${esc(CONF.updated)}.</p>`;
document.getElementById("main").innerHTML = html;


// ---- After conference: "Choose one invitation" (saved on this device) + a six-month reminder card ----
const INV_KEY = "six-month-invite", invTalks = () => CONF.talks.filter(t => t.invitation);
const invCard = () => { const v = Store.get(INV_KEY, null), t = v && talkById(v.id); if (!t) return "";
  const day = Math.max(1, Math.floor((Date.now() - Date.parse(v.start)) / 864e5) + 1), month = Math.min(6, Math.ceil(day / 30.5));
  return `<section class="inv-card" aria-labelledby="inv-h"><div class="inv-k"><span id="inv-h">My invitation</span><span>Month ${month} of 6 · ${COUNTDOWN.days} days to April</span></div>
    <p class="inv-text">${esc(t.invitation)}</p><p class="inv-by">From ${esc(t.speaker)} · <a href="talks/${esc(t.id)}.html">${esc(t.title)}</a></p>
    <div class="inv-track" aria-hidden="true"><span style="--p:${Math.min(1, day / 182)}"></span></div>
    <div class="inv-actions"><a class="btn gold" href="builder.html?ins=invite">Make it a card</a><button type="button" class="btn secondary" data-inv-change>Change</button></div>
    <p class="inv-note">Saved only on this device. Come back any day; it stays here until April.</p></section>`; };
const placeInv = () => { document.querySelector(".inv-card")?.remove(); const h = invCard(); if (h) document.querySelector(".entry")?.insertAdjacentHTML("afterend", h); };
function openInvPicker() {
  const cur = (Store.get(INV_KEY, null) || {}).id, el = document.createElement("div"); el.className = "sheet-backdrop"; el.id = "invsheet";
  const bySess = CONF.sessions.map(s => [s, invTalks().filter(t => t.session === s.id).sort((a, b) => a.order - b.order)]).filter(([, ts]) => ts.length);
  el.innerHTML = `<div class="sheet inv-sheet" role="dialog" aria-modal="true" aria-labelledby="invsheet-h"><div class="sheet-grip"></div>
    <h2 id="invsheet-h">Choose one invitation</h2><p class="speaker">Pick one thing to act on until April. It's saved on this device, with a reminder on the home page.</p>
    <div class="inv-list">${bySess.map(([s, ts]) => `<div class="b-label">${esc(s.name)}</div>${ts.map(t => `<button type="button" class="inv-opt" data-inv="${esc(t.id)}" aria-pressed="${t.id === cur}"><span class="inv-o-t">${esc(t.invitation)}</span><span class="inv-o-s">${esc(t.speaker)} · ${esc(t.title)}</span></button>`).join("")}`).join("")}</div>
    <button type="button" class="btn secondary" data-inv-close style="width:100%;margin-top:12px">Close</button></div>`;
  const close = () => { el.remove(); document.removeEventListener("keydown", onKey); document.getElementById("pickInvite")?.focus(); };
  const onKey = e => { if (e.key === "Escape") close(); };
  el.addEventListener("click", e => { if (e.target === el || e.target.closest("[data-inv-close]")) return close();
    const b = e.target.closest("[data-inv]"); if (!b) return; Store.set(INV_KEY, { id: b.dataset.inv, start: new Date().toISOString() }); close(); placeInv();
    const c = document.querySelector(".inv-card"); if (c) { c.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); c.classList.add("inv-new"); } });
  document.addEventListener("keydown", onKey); document.body.appendChild(el); el.querySelector(".inv-opt")?.focus({ preventScroll: true });
}
document.addEventListener("click", e => { if (e.target.closest("#pickInvite, [data-inv-change]")) openInvPicker(); });
if (POSTCONF) placeInv();
