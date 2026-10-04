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
const liveSub = LN ? "Live now · share a line you heard" : NX ? `Next session ${NX.at.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "Share a line during each session";
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

