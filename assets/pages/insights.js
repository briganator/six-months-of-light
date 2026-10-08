const HASH0 = location.hash; // the hash the page was opened with (the explorer later writes #zoom into the URL)
mount("insights.html", true);
const T = CONF.talks, I = INSIGHTS;
const topWords = I.topWords.slice(0, 45), max = topWords[0][1], min = topWords[topWords.length - 1][1];
const bar = (label, n, of) => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${Math.round(n / of * 100)}%"></div></div><span class="n">${n}</span></div>`;
function donut(obj) {
  const cols = ["#2a2d5c", "#d8a95b", "#e3a693", "#8fb2d6", "#a493cf"], ents = Object.entries(obj).sort((a, b) => b[1] - a[1]), tot = ents.reduce((a, [, n]) => a + n, 0);
  let acc = 0; const R = 54, C = 2 * Math.PI * R;
  const segs = ents.map(([k, n], i) => { const len = n / tot * C, seg = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${cols[i]}" stroke-width="22" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`; acc += len; return seg; }).join("");
  return `<div class="donut-wrap"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Speakers by calling">${segs}
    <text x="70" y="68" text-anchor="middle" font-family="Cormorant Garamond" font-size="34" fill="#18213f">${tot}</text><text x="70" y="88" text-anchor="middle" font-family="Inter" font-size="10" fill="#5f5868">talks</text></svg>
    <ul class="legend">${ents.map(([k, n], i) => `<li><i style="background:${cols[i]}"></i>${esc(k)} · <b>${n}</b></li>`).join("")}</ul></div>`;
}
// HTML mini-preview of each insight card (the real card is drawn in the studio)
function mini(x) {
  const B = x.body; let body = "";
  if (B.type === "big") body = `<b class="ins-big">${esc(B.value)}</b><span class="ins-cap">${esc(B.caption)}</span>`;
  if (B.type === "words") body = `<ol class="ins-words">${B.items.map(w => `<li>${esc(w)}</li>`).join("")}</ol>`;
  if (B.type === "bars") { const m = Math.max(...B.items.map(i => i.value)); body = B.items.slice(0, 4).map(i => bar(i.label, i.value, m)).join(""); }
  if (B.type === "text") body = `<p class="ins-text">${esc(B.text)}</p>`;
  return `<article class="ins-card" id="${esc(x.id)}">
    <div class="ins-kicker">${esc(x.kicker)}</div><h3>${esc(x.title)}</h3>${body}
    <div class="ins-actions"><a class="btn gold small" href="builder.html?ins=${esc(x.id)}">Share this card</a></div></article>`;
}
const QUIZ = [
  ["When life feels heavy, what helps you most?", [["Remembering the Savior", "Jesus Christ & His Atonement"], ["Time in the temple", "Temples & covenants"], ["A quiet prompting", "Holy Ghost & revelation"], ["Holding on and trusting", "Trusting God in trials"]]],
  ["What would you most like to grow in these six months?", [["Serving someone near me", "Ministering & love"], ["Stronger family ties", "Family & generations"], ["Sharing what I believe", "Testimony & missionary work"], ["Following the prophet", "Prophets"]]],
  ["Which invitation would you accept today?", [["Turn to Christ again", "Jesus Christ & His Atonement"], ["Make the temple a habit", "Temples & covenants"], ["Fast and pray with purpose", "Fasting, tithing & self-reliance"], ["See myself as God sees me", "Identity as children of God"]]],
];
const counts = Object.fromEntries(I.themeCounts);
const openCharts = () => { if (/^#(charts|themes|scriptures)$/.test(location.hash)) { const d = document.getElementById("charts"); if (d) d.open = true; } };
addEventListener("hashchange", openCharts);
document.getElementById("main").innerHTML = `
  <div class="section-label">Understand &amp; share</div><h1 style="margin-top:0">Conference Insights</h1>
  <p class="lede">The conference at a glance. Every insight is a card you can share in one tap.</p>
  ${OFFICIAL_TEXT() ? `<div class="notice"><strong>From this site's summaries and official-text quotes.</strong> These counts use the summary and verified quotes of ${SCOPE.of(T.length)}, not every word of the talks. The full talks are on each talk page, posted with the Church's permission. For counts from the full official text and comparisons with past conferences, open <a href="study.html">Study</a>.</div>` : `<div class="notice"><strong>Based on recaps, not official text.</strong> Computed in your browser from the summaries and verified recap quotes for ${SCOPE.of(T.length)}. Numbers will be recomputed from official text once it's posted.</div>`}
  <div class="stat-row">
    <div class="stat"><b data-count="${T.length}">${T.length}</b><span>talks so far</span></div>
    <div class="stat"><b data-count="${I.christMentions}">${I.christMentions}</b><span>mentions of Christ</span></div>
    <div class="stat"><b data-count="${I.refs.length}">${I.refs.length}</b><span>scripture refs</span></div></div>
  ${subnavHTML([["zoom", "Explore"], ["cards", "Cards"], ["theme-quiz", "Quiz"], ["spotlight", "Spotlight"], ["words", "Words"], ["charts", "Charts"], ["ask", "Search"]], "Insights sections")}
  <section class="zoom-sec" id="zoom"><h2>Explore the conferences</h2><p class="b-help">Tap a pill in the sentence to change it, or start from a preset. Every number links to the talks behind it.</p><span id="compare"></span><span id="music"></span><div id="zoomBox"><p class="empty">Loading the library…</p></div></section>
  <h2 id="cards">Shareable insight cards</h2><p class="b-help sw-hint">Swipe for more · tap a card to make it yours</p>
  <div class="ins-grid2">${I.list.map(mini).join("")}</div>
  <section class="card quizbox" id="theme-quiz"><div class="ins-kicker">Quick quiz · 3 taps</div><h2 style="margin-top:4px">Which theme speaks to you?</h2>
    <form id="tq" onsubmit="return false">${QUIZ.map(([q, opts], qi) => `<fieldset><legend>${qi + 1}. ${esc(q)}</legend><div class="tq-opts">${opts.map(([l, th], oi) => `<label class="tq-opt"><input type="radio" name="q${qi}" value="${esc(th)}"><span>${esc(l)}</span></label>`).join("")}</div></fieldset>`).join("")}</form>
    <div id="tq-result" aria-live="polite"></div></section>
  <section class="card" id="spotlight"><div class="ins-kicker">Speaker spotlight</div><h2 style="margin-top:4px">Share a speaker's big idea</h2>
    <div class="spot-row"><select id="spot" class="field" aria-label="Speaker">${T.map(t => `<option value="${t.id}">${esc(t.speaker)} — ${esc(t.title)}</option>`).join("")}</select>
    <a class="btn gold" id="spotgo" href="builder.html?ins=spot-${T[0].id}">Make spotlight card</a></div></section>
  <section class="card cloud-card" id="words"><div class="section-label" style="margin:0 0 6px;color:var(--gold-hi)">Word cloud</div><h2 style="margin-top:0">What ${SCOPE.who === "Saturday" ? "Saturday" : "the conference"} talked about</h2>
    <div class="cloud">${[...topWords].sort((a, b) => a[0].length % 3 - b[0].length % 3 || a[0].localeCompare(b[0])).map(([w, n]) => { const k = (n - min) / (max - min || 1);
      const pal = ["#f6dfa6", "#e3a693", "#fbf3e3", "#c9b8f0", "#d8a95b"]; const col = k > .55 ? "#f6dfa6" : pal[(w.length + n) % pal.length];
      return `<span style="font-size:${(15 + Math.pow(k, .8) * 46).toFixed(0)}px;color:${col};font-style:${k > .4 ? "italic" : "normal"};font-weight:${k > .3 ? 500 : 400}" title="${n}×">${esc(w)}</span>`; }).join("")}</div>
    <p class="speaker">Most frequent meaningful words (common words removed). <a href="builder.html?ins=ten-words">Share as “The conference in 10 words” →</a></p></section>
  <details class="more-sec" id="charts"><summary><span><b>More charts</b><span>Top themes, most-cited scriptures, who spoke</span></span></summary>
  <div class="ins-grid">
  <section class="card" id="themes"><h2 style="margin-top:0">Top themes</h2>${I.themeCounts.filter(x => x[1]).map(([n, c]) => bar(n, c, T.length)).join("")}
    <p class="speaker">Number of talks touching each theme (keyword-based). <a href="builder.html?ins=themes">Share →</a></p></section>
  <section class="card" id="scriptures"><h2 style="margin-top:0">Most-cited scriptures</h2>
    ${Object.entries(I.books).sort((a, b) => b[1] - a[1]).map(([b, n]) => bar(b, n, Math.max(...Object.values(I.books)))).join("")}
    <details><summary class="speaker">All references</summary><ul class="scriptures">${I.refs.map(r => `<li>${esc(r.ref)}${r.allusion ? " <em>(allusion)</em>" : ""} — <a href="talks/${r.t.id}.html">${esc(r.t.speaker)}</a></li>`).join("")}</ul></details>
    <p class="speaker"><a href="builder.html?ins=scriptures">Share →</a></p></section>
  <section class="card"><h2 style="margin-top:0">Who spoke</h2>${donut(I.callings)}<p class="speaker">${SCOPE.tail} <a href="builder.html?ins=who-spoke">Share →</a></p></section>
  </div></details>
  <div id="ask"></div>${askTalksPanel({ label: "the whole conference", questions: ["Which talks taught about the temple?", "Which talks focused on Jesus Christ?"],
    answer: k => { const key = k === 0 ? "Temples & covenants" : "Jesus Christ & His Atonement", ts = T.filter(t => talkThemes(t).includes(key));
      return talkAnswer(`${ts.length} of ${T.length} ${SCOPE.adj}talks touched “${esc(key)}” (keyword-based, ${OFFICIAL_TEXT() ? "from summaries and quotes" : "from recaps"}):`, ts); } })}`;
initSubnav();
const spot = document.getElementById("spot"), go = document.getElementById("spotgo");
spot.addEventListener("change", () => go.href = `builder.html?ins=spot-${spot.value}`);
document.getElementById("tq").addEventListener("change", () => {
  const picks = QUIZ.map((_, i) => document.querySelector(`input[name=q${i}]:checked`)?.value);
  document.querySelectorAll(".tq-opt").forEach(l => l.classList.toggle("on", l.querySelector("input").checked));
  if (picks.some(p => !p)) return;
  const score = {}; picks.forEach((p, i) => score[p] = (score[p] || 0) + 1 + (2 - i) * .01);
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const theme = ranked.find(n => counts[n] > 0) || I.themeCounts[0][0], card = I.themeCard(theme), ts = T.filter(t => talkThemes(t).includes(theme));
  document.getElementById("tq-result").innerHTML = `<div class="tq-res"><div class="ins-kicker">Your theme</div><h3>${esc(theme)}</h3>
    <p class="speaker">${ts.length} of ${T.length} ${SCOPE.adj}talks touched this theme. Start with:</p>
    <ul>${ts.slice(0, 3).map(t => `<li><a href="talks/${t.id}.html">${esc(t.title)}</a> · ${esc(t.speaker)}</li>`).join("")}</ul>
    <a class="btn gold" href="builder.html?ins=${esc(card.id)}">Share my result card</a></div>`;
});

loadLib().then(LB => { Explore.make(document.getElementById("zoomBox"), LB);
  if (["#zoom", "#compare", "#music"].includes(HASH0)) document.getElementById("zoom").scrollIntoView(); })
  .catch(() => { document.getElementById("zoomBox").innerHTML = `<p class="empty">The library didn't load. Check your connection and refresh.</p>`; });
openCharts();
