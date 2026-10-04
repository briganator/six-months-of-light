// Shareable insight cards. Every number is computed in the browser from the verified recap data in assets/data.js.
// Nothing here is invented: counts come from recap summaries and verified recap quotes only.
(function () {
  const T = CONF.talks, N = T.length;
  const STOP = new Set(("a an the and or but of to in on for with as at by from is are was were be been being it its this that these those we us our you your he his she her they them their i me my not no so if than then there here who whom which what when where how all any can could will would should may might must do does did have has had also into about through more most such only own same very just even each other some one two him after before over under again further once both few many much because while upon out up down off whether yet still let hearts don't isn't can't we're it's like way things thing get make made said says say every always never").split(/\s+/));
  const corpus = t => [t.summary, ...t.quotes].join(" ").toLowerCase().replace(/[’']/g, "'");
  const norm = w => ({ covenants: "covenant", temples: "temple", prophets: "prophet", apostles: "apostle", promises: "promise", trials: "trial", families: "family", children: "child", miracles: "miracle", testimonies: "testimony" }[w] || w.replace(/'s$/, ""));
  const freq = {}; T.forEach(t => (corpus(t).match(/[a-z][a-z'-]{2,}/g) || []).forEach(w0 => { const w = norm(w0); if (!STOP.has(w) && w.length > 3) freq[w] = (freq[w] || 0) + 1; }));
  const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const BOOKS = ["Doctrine and Covenants", "Helaman", "Mosiah", "Isaiah", "Mark", "Luke", "John", "Jacob", "Numbers", "Malachi", "Hebrews", "Hymns"];
  const books = {}, refs = [];
  T.forEach(t => t.scriptures.forEach(s => BOOKS.forEach(b => { const re = new RegExp(b.replace(/ /g, "\\s") + "(\\s[\\d:–-]+)?", "g"); let m; while ((m = re.exec(s))) { books[b] = (books[b] || 0) + 1; refs.push({ ref: m[0].trim(), t, allusion: /alludes|echoes|cf\./i.test(s) }); } })));
  const themeCounts = Object.keys(THEMES).map(n => [n, T.filter(t => talkThemes(t).includes(n)).length]).sort((a, b) => b[1] - a[1]);
  const CHRIST = /\b(jesus|christ|christ's|savior|saviour|redeemer)\b/g;
  const christMentions = T.reduce((s, t) => s + (corpus(t).match(CHRIST) || []).length, 0), christTalks = T.filter(t => CHRIST.test(corpus(t)) | (CHRIST.lastIndex = 0)).length;
  const callings = {}; T.forEach(t => { const c = /Twelve/.test(t.calling) ? "Quorum of the Twelve" : /First Presidency/.test(t.calling) ? "First Presidency" : /Seventy/.test(t.calling) ? "Seventies" : "General officers"; callings[c] = (callings[c] || 0) + 1; });
  const ALLQ = T.flatMap(t => t.quotes.map((q, i) => ({ t, q, i })));
  const day0 = new Date("2026-10-04T00:00:00-06:00"), dayIdx = Math.max(0, Math.floor((Date.now() - day0) / 864e5));
  const daily = ALLQ[dayIdx % ALLQ.length];
  // Scope wording follows the data: "Saturday" while only Saturday talks exist, then "so far", then the whole conference.
  const hasSun = T.some(t => /^sun/.test(t.session)), allDone = CONF.sessions.every(x => x.status !== "pending");
  const SC = window.SCOPE = !hasSun ? { of: n => `Saturday's ${n} talks`, adj: "Saturday ", kick: "Saturday sessions", who: "Saturday", on: "on Saturday", tail: "Saturday sessions only. Sunday pending.", gc: "Saturday of General Conference", gc26: "Saturday of October 2026 General Conference", ses: "Saturday session" }
    : allDone ? { of: n => `all ${n} talks`, adj: "", kick: "The whole conference", who: "the conference", on: "in all", tail: "All four sessions.", gc: "General Conference", gc26: "October 2026 General Conference", ses: "session" }
    : { of: n => `the first ${n} talks`, adj: "", kick: "Conference so far", who: "the conference", on: "so far", tail: "Sessions so far; more as talks are added.", gc: "General Conference so far", gc26: "October 2026 General Conference so far", ses: "session so far" };
  const FOOT = `Based on recaps of ${SC.of(N)} · confirm with official text`;
  const sessShort = id => ({ "sat-am": "Sat morning", "sat-pm": "Sat afternoon", "sun-am": "Sun morning", "sun-pm": "Sun afternoon" }[id] || id);
  const bySession = CONF.sessions.filter(s => T.some(t => t.session === s.id)).flatMap(s => {
    const ts = T.filter(t => t.session === s.id);
    return Object.keys(THEMES).map(n => [n, ts.filter(t => talkThemes(t).includes(n)).length]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, c]) => ({ label: `${sessShort(s.id)} · ${n}`, value: c }));
  });
  const themeSlug = n => slug(n);
  const themeByslug = s => Object.keys(THEMES).find(n => themeSlug(n) === s);
  function themeCard(name) {
    const ts = T.filter(t => talkThemes(t).includes(name)), ks = THEMES[name];
    let pick = null; for (const t of ts) { const i = t.quotes.findIndex(q => ks.some(k => q.toLowerCase().includes(k))); if (i >= 0) { pick = { t, i }; break; } }
    if (!pick && ts[0]) pick = { t: ts[0], i: 0 };
    return { id: "theme-" + themeSlug(name), kicker: "The theme that speaks to me", title: name, sub: `${ts.length} of ${N} ${SC.adj}talks touched this theme`,
      body: { type: "list", items: ts.slice(0, 3).map(t => `${t.title} (${t.speaker.replace(/^(Elder|Sister|President|Bishop) /, "")})`) },
      quote: pick ? { text: pick.t.quotes[pick.i], by: pick.t.speaker } : null, foot: FOOT, share: `The conference theme that speaks to me: ${name}.` };
  }
  const daysLeft = (typeof COUNTDOWN !== "undefined") ? COUNTDOWN.days : null;
  const list = [
    { id: "ten-words", kicker: SC.kick, title: "The conference in 10 words", sub: `Most-used meaningful words in the recaps of ${SC.of(N)}`, body: { type: "words", items: topWords.slice(0, 10).map(([w]) => w[0].toUpperCase() + w.slice(1)) }, foot: FOOT, share: `${SC.gc26} in 10 words.` },
    { id: "top-words", kicker: "Most-used words", title: `What ${SC.who} kept saying`, body: { type: "bars", items: topWords.slice(0, 6).map(([w, n]) => ({ label: w, value: n })) }, foot: FOOT + " · counts of each word", share: `The words ${SC.gc} kept coming back to.` },
    { id: "christ", kicker: "Christ at the center", title: "He was named again and again", body: { type: "big", value: christMentions, caption: `mentions of Jesus Christ by name or title (Jesus, Christ, Savior, Redeemer), in ${christTalks} of ${N} talks` }, foot: FOOT, share: `Jesus Christ was named ${christMentions} times in recaps of ${christTalks} of ${N} ${SC.adj}talks.` },
    { id: "themes", kicker: "Top themes", title: "What the talks were about", body: { type: "bars", items: themeCounts.filter(x => x[1]).slice(0, 6).map(([n, c]) => ({ label: n, value: c })) }, foot: FOOT + " · talks per theme (keyword-based)", share: `The top themes from ${SC.gc}.` },
    { id: "themes-by-session", kicker: "Themes by session", title: "Each session's focus", body: { type: "bars", items: bySession }, foot: FOOT + " · talks per theme", share: `The leading themes in each ${SC.ses}.` },
    { id: "scriptures", kicker: "Scriptures cited", title: "Back to the scriptures", body: { type: "big", value: refs.length, caption: "scripture references reported in recaps. Most cited: " + Object.entries(books).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b, n]) => `${b} (${n})`).join(", ") }, foot: FOOT, share: `${refs.length} scripture references in recaps of ${SC.of(N)}.` },
    { id: "who-spoke", kicker: "Who spoke", title: `${N} talks ${SC.on}`, body: { type: "bars", items: Object.entries(callings).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ label: l, value: v })) }, foot: FOOT, share: SC.on === "on Saturday" ? "Who spoke on Saturday of General Conference." : `Who spoke at ${SC.gc}.` },
    { id: "daily", kicker: daysLeft != null ? `${daysLeft} days to April conference` : "Quote of the day", title: "Today's light", sub: `Day ${dayIdx + 1} of six months between conferences`, body: { type: "text", text: "“" + daily.q + "”" }, quote: null, foot: `— ${daily.t.speaker}, “${daily.t.title}” · quoted from recap`, share: `Today's light from General Conference: “${daily.q}” — ${daily.t.speaker}` },
  ];
  const spot = t => ({ id: "spot-" + t.id, kicker: "Speaker spotlight", title: t.speaker, sub: `“${t.title}” · ${t.calling}`, body: { type: "text", text: t.big_idea }, foot: "Big idea summarized from recaps · confirm with official text", share: `${t.speaker}: “${t.title}”` });
  function get(id) {
    if (!id) return null;
    if (id.startsWith("z-")) { try { return JSON.parse(localStorage.getItem("zcard:" + id)); } catch (e) { return null; } }
    if (id === "spoken") return { id, kicker: "October 2026 General Conference", title: "The Lord has spoken. Now, let\u2019s live it.", sub: "Six months to study, apply and share these words before April.", body: { type: "text", text: "\u201c" + DC138.text + "\u201d" }, foot: DC138.ref, share: `The Lord has spoken. Now, let\u2019s live it. \u201c${DC138.text}\u201d (${DC138.ref}) #GeneralConference` };
    if (id === "invite") { let v = null; try { v = JSON.parse(localStorage.getItem("conf-my-six-month-invite")); } catch (e) {} const t = v && talkById(v.id); if (!t) return null;
      return { id, kicker: "My invitation for the next six months", title: "I\u2019m choosing to act", sub: `From ${t.speaker}, \u201c${t.title}\u201d`, body: { type: "text", text: t.invitation }, foot: "Invitation summarized from recaps \u00b7 until April conference", share: `My invitation from General Conference for the next six months: ${t.invitation} (${t.speaker}, \u201c${t.title}\u201d)` }; }
    if (id.startsWith("spot-")) { const t = talkById(id.slice(5)); return t ? spot(t) : null; }
    if (id.startsWith("theme-")) { const n = themeByslug(id.slice(6)); return n ? themeCard(n) : null; }
    return list.find(x => x.id === id) || null;
  }
  window.INSIGHTS = { list, get, spot, themeCard, themeSlug, daily, dayIdx, topWords, freq, refs, books, themeCounts, callings, christMentions, christTalks, ALLQ, FOOT };
})();
