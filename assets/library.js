// Study library: official multi-conference metadata (assets/library-data.js, derived counts only)
// + October 2026 from this site's recaps (assets/data.js). No talk text anywhere.
(function () {
  const L = window.LIB, T3 = window.THEMES3;
  const SE = { "sat-am": "1", "sat-pm": "2", "sat-eve": "3", "sun-am": "4", "sun-pm": "5" };
  const lowc = s => s.toLowerCase().replace(/[’']/g, "'");
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const THEME_RE = Object.fromEntries(Object.entries(L.themeKeys).map(([k, v]) => [k, new RegExp("\\b(" + v.map(reEsc).join("|") + ")\\b", "g")]));
  const TITLE_RE = Object.fromEntries(Object.entries(L.titles).map(([k, v]) => [k, new RegExp("\\b" + v + "\\b", "g")]));
  const STOP = new Set("a an the and or but of to in on for with as at by from is are was were be been being it its this that these those we us our you your he his she her they them their i me my not no so if than then there here who whom which what when where how all any can could will would should may might must do does did have has had also into about through more most such only own same very just even each other some one two him after before over under again further once both few many much because while upon out up down off whether yet still let like way things thing get make made said says say every always never shall unto thee thy thou know time life people great good".split(" "));
  const count = (re, s) => (s.match(re) || []).length;
  const recapCorpus = t => [t.summary, t.big_idea, t.invitation, ...t.quotes].join(" ");
  const octSess = Object.fromEntries(CONF.sessions.map(s => [SE[s.id] || s.id, s.name]));
  const oct = CONF.talks.map(t => {
    const txt = recapCorpus(t), low = lowc(txt), words = low.match(/[a-z][a-z'-]+/g) || [];
    const tw = {}; words.forEach(w => { w = w.replace(/'s$/, ""); if (w.length > 3 && !STOP.has(w)) tw[w] = (tw[w] || 0) + 1; });
    const qs = t.quotes.join(" ").toLowerCase();
    return { c: "2026-10", id: t.id, t: t.title, s: t.speaker, sp: slug(t.speaker), r: t.calling, se: SE[t.session] || "1", w: 0, k: t.big_idea,
      rf: (t.scriptures || []).map(s => s.replace(/\s*\(.*$/, "")).filter(s => /\d/.test(s)), h: [],
      d: Object.fromEntries(Object.entries(THEME_RE).map(([k, r]) => [k, count(r, low)]).filter(x => x[1])),
      tg: [...new Set(t.quotes.flatMap((_, i) => T3.tagsFor(t.id, i)))].slice(0, 3),
      inv: count(/\bi (invite|extend an invitation|encourage you)/g, qs), pro: count(/\bi promise/g, qs), q: (t.quotes.join(" ").match(/\?/g) || []).length,
      ti: Object.fromEntries(Object.entries(TITLE_RE).map(([k, r]) => [k, count(r, low)]).filter(x => x[1])), pl: {},
      tw: Object.entries(tw).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]), recap: 1, local: "talks/" + t.id + ".html" };
  });
  const confs = [{ c: "2026-10", label: "October 2026", sessions: octSess, n: oct.length, recap: 1, url: CONF.conference_url }, ...L.confs.slice().reverse()];
  const talks = [...oct, ...L.talks.slice().sort((a, b) => b.c.localeCompare(a.c) || a.id.localeCompare(b.id))];
  const confOf = c => confs.find(x => x.c === c);
  const official = t => t.recap ? (talkById(t.id)?.official_url || null) : `https://www.churchofjesuschrist.org/study/general-conference/${t.c.slice(0, 4)}/${t.c.slice(5)}/${t.id}?lang=eng`;
  const href = t => t.local || official(t);
  const sessName = t => (confOf(t.c)?.sessions || {})[t.se] || "";
  const minutes = t => t.w ? Math.max(1, Math.round(t.w / 200)) : null;      // reading at ~200 wpm
  const spoken = t => t.w ? Math.max(1, Math.round(t.w / 130)) : null;       // speaking at ~130 wpm (estimate)
  const themeName = k => (T3.get(k) || {}).name || k;
  const themeIcon = k => (T3.get(k) || {}).icon || "✦";
  const THEME_KEYS = Object.keys(L.themeKeys);
  const OT = "Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth Samuel Kings Chronicles Ezra Nehemiah Esther Job Psalms Proverbs Ecclesiastes Solomon Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi".split(" ");
  const NT = "Matthew Mark Luke John Acts Romans Corinthians Galatians Ephesians Philippians Colossians Thessalonians Timothy Titus Philemon Hebrews James Peter Jude Revelation".split(" ");
  const BOM = "Nephi Jacob Enos Jarom Omni Mormon Mosiah Alma Helaman Ether Moroni".split(" ");
  const book = r => r.replace(/\s+\d+(:\d+)?.*$/, "");
  const work = r => { const b = book(r), last = b.split(" ").pop(); if (/Doctrine and Covenants/.test(b)) return "Doctrine and Covenants"; if (/Moses|Abraham|Joseph Smith|Articles of Faith/.test(b)) return "Pearl of Great Price";
    if (BOM.includes(last) || /Words of Mormon/.test(b)) return "Book of Mormon"; if (NT.includes(last)) return "New Testament"; if (OT.includes(last)) return "Old Testament"; return "Other"; };
  // Come, Follow Me: 2026 Old Testament, 2027 New Testament (Church Newsroom, July 31, 2026)
  const CFM = { 2026: ["Old Testament", "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026?lang=eng"], 2027: ["New Testament", "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-new-testament-2027?lang=eng"] };
  const filter = ({ c, topic, sp, q, se } = {}) => {
    const terms = (q || "").toLowerCase().split(/\s+/).filter(Boolean);
    return talks.filter(t => (!c || c === "all" || t.c === c) && (!se || t.se === se) && (!topic || t.tg.includes(topic)) && (!sp || t.sp === sp) &&
      (!terms.length || terms.every(w => [t.t, t.s, t.k, t.r, t.rf.join(" "), t.tg.map(themeName).join(" "), confOf(t.c).label].join(" ").toLowerCase().includes(w))));
  };
  // Calling groups from official speaker titles (the calling shown on each talk page at the time of the talk)
  const GROUPS = { fp: ["First Presidency", "the First Presidency", /First Presidency|^President of The Church/i], q12: ["Quorum of the Twelve", "the Quorum of the Twelve", /Quorum of the Twelve/i],
    sev: ["Seventy", "the Seventy", /Seventy/i], pb: ["Presiding Bishopric", "the Presiding Bishopric", /Presiding Bishop/i],
    rsywp: ["Relief Society, Young Women & Primary", "Relief Society, Young Women and Primary leaders", /Relief Society|Young Women|Primary/i],
    ymss: ["Young Men & Sunday School", "Young Men and Sunday School leaders", /Young Men|Sunday School/i], other: ["Other speakers", "other speakers", /$^/] };
  const groupOf = r => (Object.entries(GROUPS).find(([k, g]) => k !== "other" && g[2].test(r || "")) || ["other"])[0];
  const GROUP_ORDER = Object.keys(GROUPS);
  const surname = n => n.replace(/,?\s+(Jr\.|Sr\.|II|III)$/, "").split(/\s+/).pop();
  // Every speaker with a talk in the library: latest name/calling (talks are newest first), talk count, first and last conference
  // Older official pages list some auxiliary leaders without a title; add the conventional one to the search text only
  const implied = x => /^(President|Elder|Sister|Bishop|Brother)\s/.test(x.s) ? "" : /Relief Society|Young Women|Primary/i.test(x.r) ? "sister " : /Young Men|Sunday School/i.test(x.r) ? "brother " : "";
  const speakers = (() => { const m = new Map(); talks.forEach(t => { const x = m.get(t.sp) || { sp: t.sp, s: t.s, r: t.r, n: 0, last: t.c, first: t.c }; x.n++; (x.ti = x.ti || new Set()).add((t.s.match(/^(President|Elder|Sister|Bishop|Brother)\s/) || [""])[0]); if (t.c < x.first) x.first = t.c; if (t.c > x.last) Object.assign(x, { last: t.c, s: t.s, r: t.r }); m.set(t.sp, x); });
    return [...m.values()].map(x => ({ ...x, g: groupOf(x.r), find: (implied(x) + [...(x.ti || [])].join(" ") + " " + x.s + " " + x.r).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") }))
      .sort((a, b) => GROUP_ORDER.indexOf(a.g) - GROUP_ORDER.indexOf(b.g) || surname(a.s).localeCompare(surname(b.s)) || a.s.localeCompare(b.s)); })();
  // Type-ahead: every word typed must appear (partial names, "elder", "sister", "president", calling words)
  const findSpeakers = q => { const w = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(Boolean); return w.length ? speakers.filter(x => w.every(t => x.find.includes(t))) : speakers; };
  // Related talks: shared tags + shared scripture refs, different talk, newest first among ties
  const related = (t, n = 5) => talks.filter(x => x !== t && !(x.c === t.c && x.id === t.id)).map(x => {
    const tagS = x.tg.filter(k => t.tg.includes(k)).length * 2, refS = x.rf.filter(r => t.rf.includes(r)).length * 3, spS = x.sp === t.sp ? 1 : 0;
    return [tagS + refS + spS, refS, x]; }).filter(z => z[0] >= 3).sort((a, b) => b[0] - a[0] || b[2].c.localeCompare(a[2].c)).slice(0, n).map(z => ({ t: z[2], sharedRefs: z[2].rf.filter(r => t.rf.includes(r)) }));
  // Aggregate stats for any set of talks (the "zoom" scopes)
  const stats = ts => {
    const off = ts.filter(t => !t.recap), words = off.reduce((s, t) => s + t.w, 0), add = (o, k, n = 1) => (o[k] = (o[k] || 0) + n, o);
    const tw = {}, refs = {}, books = {}, works = {}, ti = {}, pl = {}, hy = {}, th = {};
    ts.forEach(t => { t.tw.forEach((w, i) => add(tw, w, 10 - i)); t.rf.forEach(r => { add(refs, r); add(books, book(r)); add(works, work(r)); }); Object.entries(t.ti).forEach(([k, n]) => add(ti, k, n)); Object.entries(t.pl).forEach(([k, n]) => add(pl, k, n)); t.h.forEach(h => add(hy, h[0])); t.tg.forEach(k => add(th, k)); });
    const dens = THEME_KEYS.map(k => [k, ts.length ? ts.reduce((s, t) => s + (t.w ? (t.d[k] || 0) : 0), 0) / Math.max(1, off.length) : 0]);
    const sort = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
    return { n: ts.length, recap: ts.filter(t => t.recap).length, words, readMin: Math.round(words / 200), spokenMin: Math.round(words / 130),
      topWords: sort(tw).slice(0, 20), refs: sort(refs).slice(0, 12), books: sort(books).slice(0, 10), works: sort(works), titles: sort(ti), places: sort(pl).slice(0, 15), hymnsCited: sort(hy),
      themes: sort(th), density: dens.sort((a, b) => b[1] - a[1]), inv: ts.reduce((s, t) => s + t.inv, 0), pro: ts.reduce((s, t) => s + t.pro, 0), q: ts.reduce((s, t) => s + t.q, 0) };
  };
  const music = (c, seName) => L.music.filter(m => m.c === c && (!seName || m.se === seName));
  const hymnLink = title => L.hymnLinks[title] || null;
  // "Make a card" from any computed widget: store the card locally, open the studio with it.
  const zcard = card => { const id = "z-" + Date.now().toString(36); card.id = id;
    try { Object.keys(localStorage).filter(k => k.startsWith("zcard:")).sort().slice(0, -20).forEach(k => localStorage.removeItem(k)); localStorage.setItem("zcard:" + id, JSON.stringify(card)); } catch (e) {}
    return "builder.html?ins=" + id; };
  window.Library = { zcard, L, talks, confs, confOf, official, href, sessName, minutes, spoken, themeName, themeIcon, THEME_KEYS, filter, speakers, findSpeakers, GROUPS, GROUP_ORDER, groupOf, surname, related, stats, music, hymnLink, work, book, CFM, coverage: L.coverage };
})();
