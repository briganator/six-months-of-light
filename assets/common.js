// Shared helpers, header/footer, device storage, and the insight search panel.
// Safari throws after 100 replaceState calls in 10 s (fast slider drags): throttle and never throw.
window.setURL = (() => { let last = 0, t = 0, pend = null; const go = () => { t = 0; last = Date.now(); try { history.replaceState(history.state, "", pend); } catch (e) {} };
  return u => { pend = u; if (t) return; const w = 250 - (Date.now() - last); if (w <= 0) go(); else t = setTimeout(go, w); }; })();
// Cross-page view transitions can be aborted by a quick second tap; swallow those promise rejections (harmless).
["pageswap", "pagereveal"].forEach(ev => addEventListener(ev, e => { const vt = e.viewTransition; if (vt) [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {})); }));
window.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.talkById = id => CONF.talks.find(t => t.id === id);
window.sessionById = id => CONF.sessions.find(s => s.id === id);
window.officialUrl = t => t.official_url || sessionById(t.session).url;
window.slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(elder|sister|president|bishop)\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
window.speakerTalks = sl => CONF.talks.filter(t => slug(t.speaker) === sl);
window.fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
// Lazy-load the multi-conference library (only where it's used).
window.loadLib = () => window.__libP || (window.__libP = ["themes3.js", "library-data.js", "library.js", "scripref.js", "search.js"].filter(f => !(f === "themes3.js" && window.THEMES3) && !(f === "library-data.js" && window.LIB) && !(f === "library.js" && window.Library) && !(f === "scripref.js" && window.ScripRef) && !(f === "search.js" && window.InsightSearch))
  .reduce((p, f) => p.then(() => new Promise((ok, no) => { const s = document.createElement("script"); s.src = (document.querySelector('script[src*="assets/common.js"]')?.getAttribute("src") || "assets/common.js").replace("common.js", "") + f; s.onload = ok; s.onerror = no; document.head.appendChild(s); })), Promise.resolve()).then(() => window.Library));
window.QS = new URLSearchParams(location.search);
// Group links: ?g=smith-family is carried across pages and tags shared posts.
window.GROUP = (QS.get("g") || sessionStorage.getItem("conf-group") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || null;
if (QS.get("g")) sessionStorage.setItem("conf-group", GROUP || "");
if (QS.get("g") === "") sessionStorage.removeItem("conf-group");
window.link = (href) => href; // hook for future path rewriting

// ---- Device-only storage ("My Conference"): never leaves this browser ----
window.Store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem("conf-my-" + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem("conf-my-" + k, JSON.stringify(v)); },
  savedQuotes() { return this.get("quotes", []); },
  toggleQuote(talkId, i) {
    const a = this.savedQuotes(), k = talkId + "#" + i, at = a.indexOf(k);
    at >= 0 ? a.splice(at, 1) : a.push(k); this.set("quotes", a); return at < 0;
  },
  isSaved(talkId, i) { return this.savedQuotes().includes(talkId + "#" + i); },
  note(talkId) { return this.get("notes", {})[talkId] || ""; },
  setNote(talkId, v) { const n = this.get("notes", {}); v ? n[talkId] = v : delete n[talkId]; this.set("notes", n); },
  commitments() { return this.get("commit", []); },
  commit(talkId, text) {
    const a = this.commitments().filter(c => c.talkId !== talkId);
    a.push({ talkId, text, start: new Date().toISOString(), done: [] }); this.set("commit", a);
  },
  checkIn(talkId, day) {
    const a = this.commitments(), c = a.find(x => x.talkId === talkId); if (!c) return;
    c.done.includes(day) ? c.done.splice(c.done.indexOf(day), 1) : c.done.push(day); this.set("commit", a);
  },
  removeCommit(talkId) { this.set("commit", this.commitments().filter(c => c.talkId !== talkId)); },
};
// 7-day reminder as a local calendar file (downloaded to the device; nothing is sent).
window.downloadReminder = (talk, text) => {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0);
  const f = x => x.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//conference-share//EN","BEGIN:VEVENT",
    "UID:" + talk.id + "-" + Date.now() + "@conference-share", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(d),
    "DURATION:PT10M","RRULE:FREQ=DAILY;COUNT=7",
    "SUMMARY:Invitation: " + talk.title.replace(/[,;]/g, ""), "DESCRIPTION:" + text.replace(/[,;\n]/g, " ") + " (" + talk.speaker + ")",
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Conference invitation","TRIGGER:PT0M","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "invitation-reminder.ics"; a.click();
};

// Logo: six rays of dawn light, each longer and brighter — six months of light growing toward April.
window.LOGO_RAYS = [[17.73, 39.36, 13.45, 37.97, 0.38, 1.6], [21.73, 33.07, 16.87, 27.89, 0.5, 1.78], [28.27, 29.47, 25.86, 20.08, 0.63, 1.96], [35.73, 29.47, 38.79, 17.56, 0.75, 2.14], [42.27, 33.07, 52.47, 22.2, 0.88, 2.32], [46.27, 39.36, 62.91, 33.96, 1.0, 2.5]];
window.LOGO_MARK = (size = 40) => `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3a693"/><stop offset=".55" stop-color="#f1d394"/><stop offset="1" stop-color="#fff3d1"/></linearGradient></defs><g stroke="url(#lmg)" stroke-linecap="round">${LOGO_RAYS.map(([a,b,c,d,o,w],i) => `<line class="ray r${i}" x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke-opacity="${o}" stroke-width="${w}"/>`).join("")}</g><path d="M21 44a11 11 0 0 1 22 0z" fill="url(#lmg)"/><line x1="6" y1="44" x2="58" y2="44" stroke="url(#lmg)" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="50" x2="46" y2="50" stroke="url(#lmg)" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></svg>`;
window.WORDMARK = () => `<span class="wordmark">${LOGO_MARK(36)}<span class="wm-text">Six Months <em>of</em> Light</span></span>`;
const NAV = [["index.html","Home"],["study.html","Study"],["builder.html","Make a card"],["insights.html","Insights"],["live.html","Live"],["my.html","My Conference"]];
const ICON = { study: '<path d="M4 5.5C6.5 4 9.5 4 12 5.8 14.5 4 17.5 4 20 5.5V19c-2.5-1.4-5.5-1.4-8 .4-2.5-1.8-5.5-1.8-8-.4zM12 5.8v13.6"/>', home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', talks: '<path d="M5 4h10l4 4v12H5zM8 11h8M8 15h8M8 7h5"/>', studio: '<path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18.4 5.6l-2.1 2.1M21 12h-3M7 16a5 5 0 0 1 10 0zM3 19h18"/>', insights: '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-11"/>', me: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"/>' };
const TABS = [["index.html","Home","home"],["study.html","Study","study"],["builder.html","Create","studio"],["insights.html","Insights","insights"],["my.html","Me","me"]];
window.TAB_ICON = ICON;
window.tabbarHTML = (active) => `<nav class="tabbar" aria-label="Quick">${TABS.map(([h,l,i]) => `<a href="${h}" class="${i === "studio" ? "tb-main" : ""}" ${active === h ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[i]}</svg><span>${l}</span></a>`).join("")}</nav>`;
// ---- Live now: session windows (MDT = UTC-6), from 10 minutes before a session until 15 minutes after ----
window.LIVE_WATCH = "https://www.churchofjesuschrist.org/broadcasts?lang=eng";
// After conference: from 4:15 pm MDT on Oct 4, 2026 (when Live mode turns off). ?post=1 / ?post=0 force it for testing.
window.POSTCONF = (() => { const f = new URLSearchParams(location.search).get("post"); if (f === "1") return true; if (f === "0") return false; return Date.now() >= Date.parse("2026-10-04T22:15:00Z"); })();
window.DC138 = { text: "What I the Lord have spoken, I have spoken… whether by mine own voice or by the voice of my servants, it is the same.", ref: "Doctrine and Covenants 1:38", url: "https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/1?lang=eng&id=p38#p38" };
window.LIVE = (() => { const W = { "sat-am": "2026-10-03T16:00:00Z", "sat-pm": "2026-10-03T20:00:00Z", "sun-am": "2026-10-04T16:00:00Z", "sun-pm": "2026-10-04T20:00:00Z" };
  const force = new URLSearchParams(location.search).get("live");
  const now = () => { if (new URLSearchParams(location.search).get("post") === "1") return null; if (force && W[force]) return CONF.sessions.find(s => s.id === force) || null; if (force === "0") return null;
    const t = Date.now(); const id = Object.keys(W).find(k => { const s = Date.parse(W[k]); return t >= s - 6e5 && t <= s + 2 * 36e5 + 9e5; }); return id ? CONF.sessions.find(s => s.id === id) || null : null; };
  const next = () => { const t = Date.now(), id = Object.keys(W).find(k => Date.parse(W[k]) > t); return id ? { s: CONF.sessions.find(x => x.id === id), at: new Date(W[id]) } : null; };
  return { now, next, W }; })();
window.liveBarHTML = active => { const s = LIVE.now(); if (!s || active === "live.html") return "";
  return `<div class="live-bar" role="region" aria-label="Conference is live"><span class="live-dot" aria-hidden="true"></span><a class="lb-main" href="live.html"><b>Conference is live</b> · share a line you just heard →</a><a class="lb-watch" href="${LIVE_WATCH}" target="_blank" rel="noopener">Watch ↗</a></div>`; };
// Pages that hide the bottom tab bar on phones get a visible Home button in the header.
const NOTABS = ["builder.html", "live.html"];
// Keep the Light icon: a small bell giving off three rays of dawn light. Line style to match the tab icons.
window.KEEP_ICON = (size = 22, cls = "") => `<svg class="keep-ic ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6v2.1M6.3 4.9l1.3 1.5M17.7 4.9l-1.3 1.5"/><path d="M7.4 16.2v-4.6a4.6 4.6 0 0 1 9.2 0v4.6l1.6 2.1H5.8z"/><path d="M10.4 20.6a1.7 1.7 0 0 0 3.2 0"/></svg>`;
// Small status message for any page (pages with their own message area, like the Card Studio, keep theirs).
if (!window.toast) window.toast = msg => { let t = document.getElementById("siteToast");
  if (!t) { t = document.createElement("div"); t.id = "siteToast"; t.className = "site-toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("in"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("in"), 4200); };
window.postHeroHTML = () => `<div class="post-hero">
      <div class="eyebrow">October 2026 General Conference</div>
      <h1 class="display post-h"><span class="ph1">The Lord has spoken.</span> <span class="ph2">Now, let’s live it.</span></h1>
      <figure class="post-scrip"><blockquote>“${esc(DC138.text)}”</blockquote><figcaption><a href="${DC138.url}" rel="noopener" target="_blank">${DC138.ref} ↗</a></figcaption></figure>
      <p class="hero-how">Six months to study, apply and share these words before April.</p>
      <div class="post-actions"><a class="btn gold big" href="plan.html">Start studying</a><button type="button" class="btn glass" id="pickInvite">Choose one invitation</button><a class="btn glass btn-keep" href="subscribe.html">${KEEP_ICON(18)}Remind me until April</a></div>
      ${countdownHTML()}
      <a class="hero-link post-share" href="builder.html?ins=spoken">Share this as a card →</a></div>`;
window.headerHTML = (active, small) => `
  <div class="unofficial" role="note">Not an official Church site<span class="uo-more"> · Personal study page · Quotes from recaps; confirm with official text</span></div>
  ${liveBarHTML(active)}
  <div class="sitebar" id="sitebar"><nav class="topbar wrap" aria-label="Main">
      ${NOTABS.includes(active) ? `<a class="sb-home" href="index.html"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg><span>Home</span></a>` : ""}
      <a class="brand" href="index.html" aria-label="Six Months of Light home">${WORDMARK()}</a>
      <div class="navlinks">${NAV.map(([h,l]) => `<a href="${h}" ${active===h?'aria-current="page"':""}>${l}</a>`).join("")}</div>
      ${active === "subscribe.html" ? "" : `<a class="sb-keep" href="subscribe.html" aria-label="Keep the Light: conference reminders">${KEEP_ICON(18)}<span>Keep the Light</span></a>`}
      ${active === "builder.html" ? "" : `<a class="btn gold small sb-cta" href="builder.html">Make a card</a>`}
    </nav></div>
  <header class="hero ${small ? "hero-sm" : "hero-lg"}">
    <div class="hero-sky" aria-hidden="true"><span class="rays"></span><span class="glow g1"></span><span class="glow g2"></span><span class="sun"></span>${LANDSCAPE()}<span class="motes"></span><span class="horizon"></span></div>
    ${small ? "" : `<div class="hero-copy wrap">
      ${active === "index.html" && POSTCONF && !LIVE.now() ? "" : `<div class="eyebrow">${esc(CONF.title)} · October 3–4</div>
      <h1 class="display"><span class="d1">Six Months</span> <em>of</em> <span class="d2">Light</span></h1>
      <p class="tagline">${esc(CONF.tagline)}</p>`}
      ${active === "index.html" && POSTCONF && !LIVE.now() ? postHeroHTML() : LIVE.now() ? `<div class="hero-live"><p class="hl-on"><span class="live-dot" aria-hidden="true"></span>Live now · ${esc(LIVE.now().name)}</p><p class="hero-how">Conference is live, share a line you just heard.</p>
      <div class="hero-actions"><a class="btn gold big" href="live.html">Share a line you heard</a><a class="btn glass" href="${LIVE_WATCH}" target="_blank" rel="noopener">Watch live ↗</a></div></div>` : `<p class="hero-how">Find a line from conference. Make it beautiful. Share it.</p>
      <div class="hero-actions"><a class="btn gold big" href="builder.html">Make a card</a><a class="hero-link" href="${active === "index.html" ? "" : "index.html"}#sessions">or browse the talks ↓</a></div>`}
      ${active === "index.html" && POSTCONF && !LIVE.now() ? "" : countdownHTML()}
    </div>`}
    ${GROUP ? `<p class="grouptag wrap">Group: <strong>${esc(GROUP)}</strong> · <a href="?g=">leave group</a></p>` : ""}
  </header>`;
// Generated landscape art: layered ridgelines catching dawn light (pure SVG, no photos).
window.LANDSCAPE = () => `<svg class="land" viewBox="0 0 1440 320" preserveAspectRatio="none">
  <defs><linearGradient id="l1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a6e" stop-opacity=".55"/><stop offset="1" stop-color="#2a2550" stop-opacity=".9"/></linearGradient>
  <linearGradient id="l2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2f5e" stop-opacity=".85"/><stop offset="1" stop-color="#151a38"/></linearGradient>
  <linearGradient id="l3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d3e"/><stop offset="1" stop-color="#0b1022"/></linearGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6dfa6" stop-opacity="0"/><stop offset=".5" stop-color="#f6dfa6" stop-opacity=".8"/><stop offset="1" stop-color="#f6dfa6" stop-opacity="0"/></linearGradient></defs>
  <path class="ridge r1" d="M0 190 C120 150 220 120 330 140 S540 90 660 120 S880 70 1000 110 S1250 100 1440 140 V320 H0Z" fill="url(#l1)"/>
  <path d="M0 190 C120 150 220 120 330 140 S540 90 660 120 S880 70 1000 110 S1250 100 1440 140" fill="none" stroke="url(#rim)" stroke-width="1.4"/>
  <path class="ridge r2" d="M0 240 C160 200 260 215 380 190 S600 220 740 180 S960 210 1100 175 S1320 200 1440 185 V320 H0Z" fill="url(#l2)"/>
  <path class="ridge r3" d="M0 290 C200 260 340 280 520 255 S860 285 1040 260 S1300 280 1440 265 V320 H0Z" fill="url(#l3)"/></svg>`;
// Six-month progress: October 2026 conference → April 3–4, 2027 conference (dates announced on the Church Newsroom calendar).
window.COUNTDOWN = (() => { const start = new Date("2026-10-04T16:00:00-06:00"), end = new Date("2027-04-03T10:00:00-06:00"), now = new Date();
  const p = Math.max(0, Math.min(1, (now - start) / (end - start))), days = Math.max(0, Math.ceil((end - now) / 864e5)), month = Math.min(6, Math.max(1, Math.ceil(p * 6) || 1));
  return { p, days, month }; })();
window.countdownHTML = () => `<div class="countdown" role="group" aria-label="Six months until April general conference">
  <div class="cd-top"><span class="cd-days"><b data-count="${COUNTDOWN.days}">${COUNTDOWN.days}</b> days until April conference</span><span class="cd-month">Month ${COUNTDOWN.month} of 6</span></div>
  <div class="cd-track"><span class="cd-fill" style="--p:${Math.max(.015, COUNTDOWN.p)}"></span>${[1,2,3,4,5].map(i => `<i style="left:${i/6*100}%"></i>`).join("")}</div>
  <div class="cd-labels"><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span></div>
  <div class="cd-note">April conference: April 3–4, 2027 (announced by the Church).</div></div>`;
window.footerHTML = () => `
  <footer class="site"><div class="wrap">
    <div class="foot-brand">${WORDMARK()}<p>${esc(CONF.tagline)}</p></div>
    <p class="big"><strong>This is not an official website of The Church of Jesus Christ of Latter-day Saints.</strong></p>
    <p>Six Months of Light is a personal study page. It is not affiliated with or endorsed by the Church. For official talks, audio and video, visit <a href="${esc(CONF.conference_url)}" rel="noopener">ChurchofJesusChrist.org</a>.</p>
    <p>Summaries and quotes come from Church News / Church Newsroom recaps; confirm with official text. Full talk text is not reproduced. Your saved quotes, notes and commitments stay on this device.</p>
    <p class="foot-links"><a href="builder.html?src=promo"><strong>Share this site</strong></a> · <a href="quiz.html">Who said it? quiz</a> · <a href="lessons.html">Lesson helps</a> · <a href="challenge.html">Challenge</a> · <a href="groups.html">Family &amp; ward group links</a> · <a href="subscribe.html"><strong>Keep the Light</strong> (reminders)</a> · <a href="credits.html">Photo credits</a> · <a href="privacy.html">Privacy</a></p>
  </div></footer>`;
window.recapNotice = compact => compact ? `<p class="notice-sm" role="note"><span class="pill pending">Recap</span> Quotes and summary from Church News / Newsroom recaps; confirm with official text.</p>` : `<div class="notice" role="note"><strong>Quotes from recaps; confirm with official text.</strong> Official talk text isn't posted yet. Summaries and quotes here come from Church News and Church Newsroom recaps.</div>`;
window.mount = (active, small) => {
  document.body.insertAdjacentHTML("afterbegin", headerHTML(active, small)); if (NOTABS.includes(active)) document.body.classList.add("no-tabs"); if (active === "index.html") document.body.classList.add("home"); if (active === "index.html" && POSTCONF && !LIVE.now()) document.body.classList.add("post");
  document.body.insertAdjacentHTML("beforeend", footerHTML());
  if (active !== "builder.html") { document.body.insertAdjacentHTML("beforeend", tabbarHTML(active)); document.body.classList.add("has-tabbar"); }
  // Sticky header: publish its height (for sticky sub-navs below it) and compact it on scroll (with hysteresis).
  const bar = document.getElementById("sitebar"), root = document.documentElement;
  const setH = () => root.style.setProperty("--hdrH", bar.offsetHeight + "px"); setH();
  if ("ResizeObserver" in window) new ResizeObserver(setH).observe(bar);
  let compact = false; const onScroll = () => { const y = scrollY; if (!compact && y > 64) { compact = true; document.body.classList.add("compact"); } else if (compact && y < 8) { compact = false; document.body.classList.remove("compact"); } };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
};
// Sticky chip navigation for in-page sections (sits directly under the sticky header).
window.subnavHTML = (items, label) => `<nav class="subnav" aria-label="${esc(label)}"><div class="subnav-in">${items.map(([id, l]) => `<a href="#${id}">${esc(l)}</a>`).join("")}</div></nav>`;
window.initSubnav = () => { const links = [...document.querySelectorAll(".subnav a")]; if (!links.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => { const on = a.getAttribute("href") === "#" + e.target.id; a.toggleAttribute("aria-current", on); if (on) a.scrollIntoView({ block: "nearest", inline: "center" }); }); }), { rootMargin: "-30% 0px -60% 0px" });
  links.forEach(a => { const t = document.getElementById(a.getAttribute("href").slice(1)); t && io.observe(t); }); };

// ---- "What insight do you want to search?": keyword/question search across every conference (assets/search.js),
// plus optional quick questions about this page. Every answer cites and links its talk; nothing is generated or invented.
window.SEARCH_EXAMPLES = ["hope", "temples", "How do I feel the Spirit?", "Alma 32", "ministering", "forgiveness"];
window.askTalksPanel = (scope = {}) => {
  const id = "ask" + Math.random().toString(36).slice(2, 7);
  setTimeout(() => {
    const root = document.getElementById(id); if (!root) return;
    const out = root.querySelector(".ask-answer"), inp = root.querySelector("input");
    const run = q => { q = (q || "").trim(); if (!q) { inp.focus(); return; } inp.value = q; out.innerHTML = `<p class="speaker">Searching every conference…</p>`;
      loadLib().then(() => { InsightSearch.render(out, q); out.querySelector(".srch-res")?.scrollIntoView?.({ block: "nearest" }); })
        .catch(() => out.innerHTML = `<p class="speaker">Search couldn't load. Check your connection and try again.</p>`); };
    inp.addEventListener("focus", () => loadLib().catch(() => {}), { once: true });
    root.querySelector("form").addEventListener("submit", e => { e.preventDefault(); root.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", "false")); run(inp.value); });
    root.querySelectorAll(".chip[data-ex]").forEach(b => b.addEventListener("click", () => run(b.dataset.ex)));
    root.querySelectorAll(".chip[data-qi]").forEach(b => b.addEventListener("click", () => {
      root.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === b)); out.innerHTML = scope.answer(+b.dataset.qi); }));
    const pre = QS.get("find"); if (pre && !document.querySelector(".ask[data-ran]")) { root.dataset.ran = 1; run(pre); }
  });
  return `<section class="card ask search" id="${id}" aria-labelledby="${id}-h">
    <h2 id="${id}-h" class="ask-title">What insight do you want to search?</h2>
    <form class="srch-form" role="search"><label class="sr-only" for="${id}-q">Search talks, quotes, topics, speakers and scriptures</label>
      <input id="${id}-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Type a question or key word, e.g. hope, temples, how do I feel the Spirit?">
      <button class="btn gold" type="submit">Search</button></form>
    <div class="chips" aria-label="Examples">${SEARCH_EXAMPLES.map(q => `<button class="chip" type="button" data-ex="${esc(q)}">${esc(q)}</button>`).join("")}</div>
    ${scope.questions ? `<p class="speaker srch-scope">Or ask about ${esc(scope.label)}:</p><div class="chips">${scope.questions.map((q, i) => `<button class="chip" type="button" data-qi="${i}" aria-pressed="false">${esc(q)}</button>`).join("")}</div>` : ""}
    <p class="speaker srch-help">Searches talks, verified quotes, topics, speakers and scriptures from every general conference in the study library (2015 to today). Every result links its talk.</p>
    <div class="ask-answer" aria-live="polite"></div>
  </section>`;
};
// talks: array of talk objects cited by this answer (linked to the talk page and its recap source)
window.talkAnswer = (html, talks) => `<div class="ask-bubble"><p>${html}</p>
  <ol class="cites">${talks.map(t => `<li><a href="talks/${esc(t.id)}.html">${esc(t.speaker)}, “${esc(t.title)}”</a> · <a href="${esc(t.official_url || t.recap_url)}" rel="noopener">${t.official_url ? "official text" : "recap source"} ↗</a></li>`).join("")}</ol>
  <div class="ask-tag">From recaps on this site; confirm with the official text.</div></div>`;

// Simple theme buckets used by Insights, speaker pages and lesson helps.
window.THEMES = {
  "Jesus Christ & His Atonement": ["christ", "savior", "redeemer", "atonement", "jesus", "deliver"],
  "Temples & covenants": ["temple", "covenant", "covenants", "ordinances", "holy house"],
  "Holy Ghost & revelation": ["holy ghost", "spirit", "revelation", "comfort"],
  "Trusting God in trials": ["trial", "trials", "suffering", "hard", "waiting", "trust", "storm", "afflictions"],
  "Ministering & love": ["minister", "compassion", "love", "kindness"],
  "Family & generations": ["family", "families", "children", "parents", "grandparents", "generational"],
  "Testimony & missionary work": ["testimony", "witness", "mission", "missionar"],
  "Prophets": ["prophet", "apostle", "oracles"],
  "Fasting, tithing & self-reliance": ["fast", "tithing", "offerings", "gambling", "debt", "saving"],
  "Identity as children of God": ["child of god", "identity", "children of god", "labels"],
};
window.talkText = t => [t.title, t.summary, t.big_idea, t.invitation, ...t.quotes].join(" ").toLowerCase();
window.talkThemes = t => { const x = talkText(t); return Object.entries(THEMES).filter(([, ks]) => ks.some(k => x.includes(k))).map(([n]) => n); };
// Gentle reveal-on-scroll motion (respects reduced-motion via CSS).
window.addEventListener("load", () => {
  const els = document.querySelectorAll("main .card, main .session, main .tile, main h2, .recap60, main .stat, ol.talks li");
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -5% 0px" }) : null;
  els.forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--i", i % 7); el.style.transitionDelay = Math.min(i, 6) * 40 + "ms"; io ? io.observe(el) : el.classList.add("in"); });
});
window.talkUrl = t => CONF.site_url + "talks/" + t.id + ".html";

// Count-up numbers + smooth page-exit fade (view transitions where supported).
window.addEventListener("load", () => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-count]").forEach(el => { if (reduce) return; const to = +el.dataset.count, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  if (!reduce && !("onpagereveal" in window)) document.addEventListener("click", e => {
    const a = e.target.closest("a[href]"); if (!a || a.target || e.metaKey || e.ctrlKey || a.origin !== location.origin || a.getAttribute("href").startsWith("#")) return;
    e.preventDefault(); document.body.classList.add("leaving"); setTimeout(() => location.href = a.href, 220); });
  // parallax for landscape layers
  if (!reduce) { const rs = document.querySelectorAll(".ridge"); addEventListener("scroll", () => { const y = scrollY; rs.forEach((r, i) => r.style.transform = `translateY(${y * (0.08 + i * 0.06)}px)`); }, { passive: true }); }
});
window.addEventListener("pageshow", () => document.body.classList.remove("leaving"));

// ---- Share flow: Web Share (image file + text with a tappable deep link), with fallbacks ----
window.shareText = t => `“${t.title}” — ${t.speaker}. Study the talk on Six Months of Light:`;
window.openShareSheet = ({ url, text, file }) => {
  document.getElementById("sharesheet")?.remove();
  const enc = encodeURIComponent, body = `${text} ${url}`;
  const el = document.createElement("div"); el.id = "sharesheet"; el.className = "sheet-backdrop";
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-h">
    <div class="sheet-grip"></div><h2 id="sh-h">Share</h2><p class="speaker">${esc(text)}</p>
    <div class="sheet-grid">
      ${navigator.share ? `<button class="sheet-btn" data-act="native"><span>📤</span>Share…</button>` : ""}
      <button class="sheet-btn" data-act="copy"><span>🔗</span>Copy link</button>
      ${file ? `<button class="sheet-btn" data-act="download"><span>⬇️</span>Download card</button>` : ""}
      <a class="sheet-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${enc(url)}"><span>f</span>Facebook</a>
      <a class="sheet-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}"><span>𝕏</span>X</a>
      <a class="sheet-btn" href="sms:?&body=${enc(body)}"><span>💬</span>Text message</a>
      <a class="sheet-btn" href="mailto:?subject=${enc("From Six Months of Light")}&body=${enc(body)}"><span>✉️</span>Email</a>
    </div>
    <p class="speaker sheet-note">Links open the talk page directly. Facebook and X share the link only, so download the card to post the picture. For Instagram Stories: download, then add it in Stories with the Link sticker.</p>
    <button class="btn secondary small" data-act="close">Close</button></div>`;
  const prevFocus = document.activeElement;
  document.body.appendChild(el); el.querySelector(".sheet-btn")?.focus();
  const close = () => { el.remove(); prevFocus?.focus?.(); };
  el.addEventListener("click", async e => {
    if (e.target === el) return close();
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "close") close();
    if (act === "copy") { await navigator.clipboard.writeText(url).catch(() => {}); b.lastChild.textContent = "Copied ✓"; }
    if (act === "download" && file) { const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); }
    if (act === "native") navigator.share({ title: "Six Months of Light", text, url }).catch(() => {});
  });
  document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
};
// Primary Share button: try sending the image file + text/link natively; otherwise open the sheet.
window.shareCard = async ({ url, text, file }) => {
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Six Months of Light", text: `${text} ${url}` }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  openShareSheet({ url, text, file });
};
