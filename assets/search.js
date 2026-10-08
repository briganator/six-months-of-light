// "What insight do you want to search?" — keyword/question search across every conference on this site.
// Searches talk titles, official summary lines, top words, topic counts, scripture footnotes, speakers and the verified
// October 2026 quotes. Every result cites and links its talk; counts say exactly what was counted. Nothing is generated.
(function () {
  const LB = window.Library, L = LB.L, SR = window.ScripRef;
  const STOP = new Set("a an the and or but of to in on for with as at by from is are was were be been am it its this that these those we us our you your he his she her they them their i me my mine not no so if than then what whats when where which who whom why how do does did can could should would will shall may might about into over more most some any all just very really there here get got have has had make made find feel know tell talk talks say said teach taught general conference speakers speaker".split(" "));
  const SYN = { spirit: "holy-ghost", ghost: "holy-ghost", revelation: "holy-ghost", inspiration: "holy-ghost", promptings: "holy-ghost", prompting: "holy-ghost",
    savior: "jesus-christ", christ: "jesus-christ", jesus: "jesus-christ", atonement: "jesus-christ", redeemer: "jesus-christ", temples: "temple", temple: "temple", endowment: "temple", sealing: "temple",
    hope: "hope-peace", peace: "hope-peace", joy: "hope-peace", comfort: "hope-peace", healing: "hope-peace", pray: "prayer", prayer: "prayer", prayers: "prayer",
    repentance: "repentance-grace", repent: "repentance-grace", forgiveness: "repentance-grace", forgive: "repentance-grace", grace: "repentance-grace", mercy: "repentance-grace",
    family: "family", families: "family", marriage: "family", parents: "family", children: "family", covenant: "covenants", covenants: "covenants", sacrament: "covenants", baptism: "covenants",
    missionary: "missionary", missionaries: "missionary", mission: "missionary", gathering: "missionary", ministering: "ministering", service: "ministering", serve: "ministering", kindness: "ministering",
    youth: "youth", teens: "youth", scriptures: "scripture-study", scripture: "scripture-study", study: "scripture-study", gratitude: "gratitude", grateful: "gratitude", thanks: "gratitude" };
  const stem = w => w.replace(/'s$/, "").replace(/(ing|ings|ed|es|s)$/, "").replace(/(.)\1$/, "$1");
  const lc = s => String(s || "").toLowerCase().replace(/[’']/g, "'");
  const hasWord = (text, term) => { const t = lc(text); if (term.includes(" ")) return t.includes(term); const s = stem(term); if (s.length < 3) return new RegExp("\\b" + term + "\\b").test(t);
    return (t.match(/[a-z][a-z'-]*/g) || []).some(w => w === term || (stem(w) === s)); };
  const shortConf = c => LB.confOf(c).label.replace(/^(April|October) /, (m, x) => x.slice(0, 3) + " ");
  const octById = id => CONF.talks.find(t => t.id === id);
  function parse(q) {
    const raw = lc(q).trim(), ref = SR && SR.first(q), terms = [...new Set((raw.replace(/[^a-z0-9'\s-]/g, " ").match(/[a-z][a-z'-]+/g) || []).filter(w => !STOP.has(w) && w.length > 2))];
    const themes = [...new Set(terms.map(w => SYN[w] || SYN[stem(w)]).filter(Boolean))];
    Object.entries(L.themeKeys).forEach(([k, v]) => v.filter(p => p.includes(" ")).forEach(p => { if (raw.includes(p) && !themes.includes(k)) themes.push(k); }));
    return { raw, ref, terms: ref ? terms.filter(w => !lc(ref).includes(w)) : terms, themes };
  }
  const refMatch = (rf, ref) => { const a = lc(ref).replace(/[–-]\d+$/, ""); return rf.some(r => { const b = lc(r); return b === a || b.startsWith(a + ":") || b.startsWith(a + "–") || (a.includes(":") && b.startsWith(a)); }); };
  const sentence = (text, terms) => { const parts = String(text || "").split(/(?<=[.!?])\s+/); const hit = parts.find(p => terms.some(w => hasWord(p, w))) || ""; return hit.length > 220 ? hit.slice(0, 210).replace(/\s+\S*$/, "") + "…" : hit; };
  function search(q, full) {
    const P = parse(q); if (!P.terms.length && !P.ref && !P.themes.length) return { P, hits: [], biz: [] };
    const hits = [];
    LB.talks.forEach(t => {
      const o = t.local ? octById(t.id) : null, why = new Set(); let s = 0;
      P.terms.forEach(w => {
        if (hasWord(t.t, w)) { s += 4; why.add("title"); }
        if (hasWord(t.k, w)) { s += 2; why.add(t.local ? "big idea" : "summary line"); }
        if (t.tw.some(x => x === w || stem(x) === stem(w))) { s += 2; why.add("top words"); }
        if (w.length > 3 && lc(t.s).split(/\s+/).includes(w)) { s += 5; why.add("speaker"); }
        if (o && (hasWord(o.summary, w) || o.quotes.some(x => hasWord(x, w)))) { s += 2; why.add(o.official_url ? "summary or quote" : "recap"); }
      });
      let ex = "";
      if (full && full[t.id] && P.terms.some(w => hasWord(full[t.id], w))) {
        const covered = ["title", "summary or quote", "recap", "big idea"].some(k => why.has(k));
        if (!covered) { s += 2; why.add("full text"); ex = sentence(full[t.id], P.terms); }
      }
      if (P.ref && refMatch(t.rf, P.ref)) { s += 6; why.add("cites " + P.ref); }
      P.themes.forEach(k => { if (t.tg.includes(k)) { s += 3; why.add("topic: " + LB.themeName(k)); } else if (!t.recap && (t.d[k] || 0) > 2 * (L.themeMean[k] || 99)) { s += 1; why.add("topic words"); } });
      if (s) hits.push({ t, s, why: [...why], excerpt: ex });
    });
    const biz = [];
    if (full) (CONF.business || []).forEach(b => {
      const text = full[b.id] || "";
      if (!P.terms.some(w => hasWord(b.title + " " + (b.lead || "") + " " + text, w))) return;
      biz.push({ b, excerpt: sentence(text, P.terms) });
    });
    hits.sort((a, b) => b.s - a.s || b.t.c.localeCompare(a.t.c));
    return { P, hits, biz };
  }
  // Quick insight: how often, by whom, trend over conferences
  function insight(R) {
    const { P, hits } = R, confs = LB.confs.slice().reverse(), off = confs.filter(c => !c.recap);
    const theme = P.themes.length === 1 && !P.terms.some(w => !(SYN[w] || SYN[stem(w)])) && !P.ref ? P.themes[0] : null;
    let label, per, unit, basis;
    if (theme) { const tg = LB.talks.filter(t => t.tg.includes(theme));
      per = off.map(c => { const ts = LB.talks.filter(t => t.c === c.c); return [c.c, ts.reduce((a, t) => a + (t.d[theme] || 0), 0) / Math.max(1, ts.length)]; });
      label = `${tg.length} talks lean on ${LB.themeName(theme)}`; unit = "topic words per 1,000 words"; basis = "Counted from official talk pages (topic word lists)"; R.count = tg.length; R.countTalks = tg;
    } else { per = off.map(c => [c.c, hits.filter(h => h.t.c === c.c).length]); label = `${hits.length} talk${hits.length === 1 ? "" : "s"} match${P.ref ? "" : " “" + P.terms.slice(0, 3).join(" ") + "”"}`; unit = "matching talks";
      basis = P.ref ? "Counted from official talk footnotes" : "Matched in titles, summary lines, top words and topics"; R.count = hits.length; R.countTalks = hits.map(h => h.t); }
    const pool = R.countTalks, by = {}; pool.forEach(t => by[t.s] = (by[t.s] || 0) + 1);
    const who = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3), peak = per.slice().sort((a, b) => b[1] - a[1])[0];
    const octN = pool.filter(t => t.recap).length;  // recap-only October 2026 talks (0 once official text posts)
    return { label, per, unit, basis, who, peak, octN, theme, confsN: new Set(pool.map(t => t.c)).size };
  }
  const spark = (per, peak) => { const m = Math.max(...per.map(x => x[1])) || 1;
    return `<div class="srch-spark" role="img" aria-label="Trend across conferences">${per.map(([c, v]) => `<span title="${esc(LB.confOf(c).label)}: ${Math.round(v * 10) / 10}" class="${c === peak[0] ? "pk" : ""}" style="height:${Math.max(4, v / m * 100)}%"></span>`).join("")}</div>
      <div class="srch-axis"><span>${esc(shortConf(per[0][0]))}</span><span>${esc(shortConf(per[per.length - 1][0]))}</span></div>`; };
  function paint(el, q, full) {
    const R = search(q, full), P = R.P;
    if (!R.hits.length && !(R.biz || []).length && !P.themes.length) { el.innerHTML = `<div class="ask-bubble"><p>Nothing on this site matches “${esc(q)}” yet. Try one key word, like <em>hope</em>, <em>temple</em> or a scripture such as <em>Alma 32</em>.</p></div>`; return; }
    const I = insight(R), top = R.hits.slice(0, 8), octQ = [];
    CONF.talks.forEach(t => t.quotes.forEach((x, i) => { if (P.terms.some(w => hasWord(x, w)) || P.themes.some(k => (window.THEMES3?.tagsFor(t.id, i) || []).includes(k))) octQ.push({ t, i, x }); }));
    const sps = P.terms.length ? LB.speakers.filter(s => P.terms.some(w => w.length > 3 && lc(s.s).split(/\s+/).includes(w))).slice(0, 4) : [];
    const refs = {}; (R.countTalks.length ? R.countTalks : top.map(h => h.t)).forEach(t => t.rf.forEach(r => refs[r] = (refs[r] || 0) + 1));
    const topRefs = P.ref ? [[P.ref, R.hits.length]] : Object.entries(refs).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const title = P.ref ? P.ref : P.themes.length === 1 && I.theme ? LB.themeName(I.theme) : P.terms.slice(0, 3).join(" ") || q;
    const card = { title: `“${title}” in general conference`.slice(0, 60), kicker: "Insight search · " + I.confsN + " conferences", eyebrow: `GENERAL CONFERENCE ${LB.coverage.from.slice(-4)}–2026`,
      body: { type: "big", value: I.count, caption: `${I.theme ? "talks leaning on " + LB.themeName(I.theme) : "talks" + (P.ref ? " citing " + P.ref : " matching")} since ${LB.coverage.from}${I.peak && I.peak[1] ? " · most in " + LB.confOf(I.peak[0]).label : ""}` },
      basis: I.basis, share: `How often general conference talks since ${LB.coverage.from} touch “${title}”. #GeneralConference`, url: CONF.site_url + "study.html?c=all&q=" + encodeURIComponent(P.terms[0] || P.ref || "") };
    el.innerHTML = `<div class="srch-res">
      <section class="srch-ins"><div class="ins-kicker">Quick insight</div><h3>${esc(I.label)}${P.ref ? " " + esc(P.ref) : ""}</h3>
        <p class="speaker">${I.confsN} conference${I.confsN === 1 ? "" : "s"}${I.octN ? ` · ${I.octN} from October 2026 recaps` : ""}${I.who.length ? ` · most by ${I.who.map(([s, n]) => `${esc(s.replace(/^(President|Elder|Sister|Bishop|Brother)\s+/, ""))} (${n})`).join(", ")}` : ""}</p>
        ${spark(I.per, I.peak)}<p class="z-note">Trend: ${esc(I.unit)} per official conference${I.peak && I.peak[1] ? `, highest in ${esc(LB.confOf(I.peak[0]).label)}` : ""}. ${LB.confs.some(c => c.recap) ? "October 2026 joins when the official text is posted. " : ""} ${esc(I.basis)}.</p>
        <button class="btn gold small" type="button" data-zcard>Make a card</button></section>
      ${octQ.length ? `<section><h3 class="srch-h">Verified quotes · October 2026</h3><ul class="srch-quotes">${octQ.slice(0, 4).map(o => `<li><blockquote>“${esc(o.x)}”</blockquote><div class="speaker">${esc(o.t.speaker)}, <a href="talks/${esc(o.t.id)}.html">“${esc(o.t.title)}”</a> · ${o.t.official_url ? "official text" : "from recaps"} · <a href="builder.html?t=${esc(o.t.id)}&q=${o.i}">Make a card</a></div></li>`).join("")}</ul></section>` : ""}
      ${(R.biz || []).length ? `<section><h3 class="srch-h">Conference business</h3><ul class="srch-talks">${R.biz.map(x => `<li><a href="talks/${esc(x.b.id)}.html">${esc(x.b.title)}</a><div class="speaker">${esc(x.b.speaker)} · full text</div>${x.excerpt ? `<div class="srch-k">${esc(x.excerpt)}</div>` : ""}</li>`).join("")}</ul></section>` : ""}
      ${top.length ? `<section><h3 class="srch-h">Talks</h3><ol class="srch-talks">${top.map(h => `<li><a href="${esc(LB.href(h.t))}" ${h.t.local ? "" : 'target="_blank" rel="noopener"'}>${esc(h.t.t)}${h.t.recap ? "" : " ↗"}</a><div class="speaker">${esc(h.t.s)} · ${esc(LB.confOf(h.t.c).label)} · <span class="srch-why">${esc(h.why.slice(0, 2).join(", "))}</span></div>${h.excerpt ? `<div class="srch-k">${esc(h.excerpt)}</div>` : h.t.k ? `<div class="srch-k">${esc(h.t.k)}</div>` : ""}</li>`).join("")}</ol>
        ${R.hits.length > top.length ? `<a class="linkish" href="study.html?c=all&q=${encodeURIComponent(P.terms[0] || P.ref || "")}">See more in the Study library →</a>` : ""}</section>` : ""}
      <div class="srch-cols">
      ${P.themes.length ? `<section><h3 class="srch-h">Topics</h3><p>${P.themes.map(k => `<a class="pill" href="topic.html?k=${k}">${esc(LB.themeIcon(k))} ${esc(LB.themeName(k))}</a>`).join(" ")}</p></section>` : ""}
      ${sps.length ? `<section><h3 class="srch-h">Speakers</h3><p>${sps.map(s => `<a class="pill" href="speaker.html?s=${esc(s.sp)}">${esc(s.s)} · ${s.n}</a>`).join(" ")}</p></section>` : ""}
      ${topRefs.length ? `<section><h3 class="srch-h">${P.ref ? "Scripture" : "Scriptures cited most in these talks"}</h3><ul class="srch-refs">${topRefs.map(([r, n]) => `<li>${SR ? SR.linkify(r) : esc(r)} <span class="speaker">· ${n} talk${n === 1 ? "" : "s"}</span></li>`).join("")}</ul></section>` : ""}
      </div>
      <div class="ask-tag">Every result links its talk. Counts come from official talk pages${LB.confs.some(c => c.recap) ? "; October 2026 quotes come from news recaps" : ""}.</div></div>`;
    el.querySelector("[data-zcard]").onclick = () => location.href = LB.zcard(card);
  }
  function render(el, q) {
    const go = full => paint(el, q, full);
    if (window.__ftIndex) return go(window.__ftIndex);
    fetch("assets/fulltext/index.json").then(r => r.ok ? r.json() : {}).then(idx => { window.__ftIndex = idx || {}; go(window.__ftIndex); }).catch(() => go(null));
  }
  window.InsightSearch = { search, render, parse };
})();
