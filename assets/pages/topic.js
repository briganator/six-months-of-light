mount("study.html", true);
// One topic across conferences: trend, the talks that dwell on it most, scriptures, speakers, and October 2026 quotes.
const LB = Library, main = document.getElementById("main"), k = QS.get("k");
const short = c => (c.slice(5) === "04" ? "Apr " : "Oct ") + c.slice(2, 4);
if (!LB.THEME_KEYS.includes(k)) {
  main.innerHTML = `<p class="crumbs"><a href="study.html">← Study library</a></p><h1 class="lib-h1">Topics</h1><div class="lib-grid">${LB.THEME_KEYS.map(x => `<a class="lib-topic" href="topic.html?k=${x}"><i aria-hidden="true">${LB.themeIcon(x)}</i><b>${esc(LB.themeName(x))}</b></a>`).join("")}</div>`;
} else {
  const name = LB.themeName(k); document.title = name + " across conferences · Six Months of Light";
  const off = LB.talks.filter(t => !t.recap), confs = LB.confs.filter(c => !c.recap).slice().reverse();
  const trend = confs.map(c => { const ts = off.filter(t => t.c === c.c); return [c.c, ts.length ? ts.reduce((s, t) => s + (t.d[k] || 0), 0) / ts.length : 0, ts.filter(t => t.tg.includes(k)).length, ts.length]; });
  const max = Math.max(...trend.map(x => x[1])) || 1, W = 100 / trend.length;
  const tagged = LB.talks.filter(t => t.tg.includes(k));
  const top = off.filter(t => t.d[k]).sort((a, b) => b.d[k] - a.d[k]).slice(0, 10);
  const add = (o, x) => (o[x] = (o[x] || 0) + 1, o), refs = {}, sps = {};
  tagged.forEach(t => { t.rf.forEach(r => add(refs, r)); add(sps, t.sp); });
  const sort = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
  const T3Q = Object.entries(THEMES3.quotes).filter(([, tags]) => tags.includes(k)).map(([id]) => { const [tid, i] = id.split("#"); return [talkById(tid), +i]; }).filter(x => x[0]);
  const spName = sp => LB.speakers.find(x => x.sp === sp)?.s || sp;
  const peak = trend.reduce((a, b) => b[1] > a[1] ? b : a);
  main.innerHTML = `<p class="crumbs"><a href="study.html?view=topics">← Topics</a></p>
  <div class="section-label">Topic</div>
  <h1 class="lib-h1"><span class="tp-ic" aria-hidden="true">${LB.themeIcon(k)}</span> ${esc(name)}</h1>
  <p class="lib-sub">${tagged.length} talks across ${LB.confs.length} conferences lean on this topic. Most attention: <b>${esc(LB.confOf(peak[0]).label)}</b>.</p>
  <section class="card tp-trend"><h2>How often it comes up</h2>
    <p class="b-help">Average mentions of ${esc(name.toLowerCase())} words per 1,000 words of talk text, by conference.</p>
    <svg viewBox="0 0 100 44" class="spark" role="img" aria-label="Bar chart of ${esc(name)} by conference">${trend.map(([c, v], i) => `<rect x="${i * W + W * .15}" y="${40 - v / max * 36}" width="${W * .7}" height="${Math.max(.6, v / max * 36)}" rx=".8" class="${c === peak[0] ? "pk" : ""}"><title>${esc(LB.confOf(c).label)}: ${v.toFixed(1)} per 1,000 words</title></rect>`).join("")}</svg>
    <div class="spark-x" style="grid-template-columns:repeat(${trend.length},1fr)">${trend.map(([c]) => `<span>${short(c)}</span>`).join("")}</div>
    <p class="b-help"><span class="pill pending">October 2026</span> joins this chart when the official text is posted.</p></section>
  ${T3Q.length ? `<section><h2>October 2026 quotes</h2><ul class="tp-quotes">${T3Q.map(([t, i]) => `<li><blockquote>“${esc(t.quotes[i])}”</blockquote><p class="speaker">${esc(t.speaker)} · <a href="talks/${t.id}.html#q${i + 1}">${esc(t.title)}</a> · <a href="builder.html?t=${t.id}&q=${i}&theme=${k}">Make a card</a></p></li>`).join("")}</ul></section>` : ""}
  <section><h2>Talks that dwell on it most</h2><ol class="lib-list">${top.map(t => `<li><a class="lib-talk" href="${esc(LB.href(t))}" rel="noopener" target="_blank"><span class="lt-title">${esc(t.t)} <span class="ext" aria-label="opens ChurchofJesusChrist.org">↗</span></span><span class="lt-meta">${esc(t.s)} · ${esc(LB.confOf(t.c).label)} · ${t.d[k].toFixed(1)} per 1,000 words</span></a></li>`).join("")}</ol>
    <a class="btn secondary" href="study.html?c=all&topic=${k}">See all ${tagged.length} in the Study library</a></section>
  <div class="tp-two">
    <section class="card"><h2>Scriptures cited with it</h2><ol class="tp-rank">${sort(refs).slice(0, 10).map(([r, n]) => `<li><span>${esc(r)}</span><b>${n}</b></li>`).join("") || "<li>None counted yet.</li>"}</ol><p class="b-help">From the footnotes of talks on this topic.</p></section>
    <section class="card"><h2>Speakers who return to it</h2><ol class="tp-rank">${sort(sps).slice(0, 8).map(([sp, n]) => `<li><a href="speaker.html?s=${sp}">${esc(spName(sp))}</a><b>${n}</b></li>`).join("")}</ol></section>
  </div>
  <p class="lib-note">Counts come from topic words in each talk and its footnotes, a rough guide only. Read the talks themselves on ChurchofJesusChrist.org.</p>`;
}
