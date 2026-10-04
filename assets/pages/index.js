mount("index.html");
const tw = CONF.talk_of_the_week, tt = talkById(tw.talk_id);
let html = `<div class="intro">${recapNotice()}</div>`;
html += `<div class="section-label">Talk of the week</div><h2 class="sr-only">Talk of the Week</h2>
<article class="card totw">
  <div class="label">This week's focus</div>
  <h3><a href="talks/${esc(tt.id)}.html" style="text-decoration:none;color:inherit">${esc(tt.title)}</a></h3>
  <p class="speaker"><a href="speaker.html?s=${slug(tt.speaker)}">${esc(tt.speaker)}</a> · ${esc(tt.calling)}</p>
  <p>${esc(tt.big_idea)}</p>
  <blockquote>“${esc(tt.quotes[2])}”</blockquote>
  <div class="ponder"><div class="label">Ponder</div>${esc(tw.ponder)}</div>
  <div class="invite"><div class="label">Invitation</div>${esc(tw.invitation)}</div>
  <div class="links" style="margin-bottom:0">
    <a class="btn" href="talks/${esc(tt.id)}.html">Study &amp; share</a>
    <a class="btn secondary" href="builder.html?t=${esc(tt.id)}&q=2">Open Card Builder</a>
  </div>
</article>
<div class="hero-cta">
  <a class="tile" href="quiz.html"><span class="ic">🃏</span><b>Who said it?</b><span>Flashcards from Saturday</span></a>
  <a class="tile" href="insights.html"><span class="ic">📊</span><b>Insights</b><span>Themes, words, scriptures</span></a>
  <a class="tile" href="my.html"><span class="ic">🔖</span><b>My Conference</b><span>Saved quotes &amp; private notes</span></a>
  <a class="tile" href="challenge.html"><span class="ic">🌱</span><b>${esc(CONF.challenge.title)}</b><span>7 days · share a story</span></a>
</div>`;
for (const s of CONF.sessions) {
  const ts = CONF.talks.filter(t => t.session === s.id).sort((a,b) => a.order-b.order);
  html += `<section class="session s-${s.color}" ${s.id===CONF.sessions[0].id?'id="sessions"':""}>
   <div class="session-head"><h2><a href="session.html?s=${s.id}" style="color:inherit;text-decoration:none">${esc(s.name)}</a></h2>
   <span class="pill ${s.status==='pending'?'pending':''}">${s.status==='pending'?'Coming soon':ts.length+' talks'}</span></div>
   <div class="when">${esc(s.when)} · <a href="${esc(s.url)}" rel="noopener">Official session page ↗</a></div>`;
  html += ts.length ? `<ol class="talks">` + ts.map(t => `<li><a class="talkcard s-${s.color}" href="talks/${esc(t.id)}.html">
      <span class="num">${t.order}</span>
      <span class="tc-body"><span class="t-title">${esc(t.title)}</span><span class="t-speaker">${esc(t.speaker)}</span><span class="t-idea">${esc(t.big_idea)}</span></span><span class="tc-arrow" aria-hidden="true">→</span></a></li>`).join("") + `</ol>`
    : `<p class="empty">${esc(s.note)}</p>`;
  html += `</section>`;
}
html += `<p class="speaker" style="margin-top:24px">Last updated ${esc(CONF.updated)}.</p>`;
document.getElementById("main").innerHTML = html;
