// Shared helpers, header/footer, device storage, and the mocked "Ask AI" panel.
window.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.talkById = id => CONF.talks.find(t => t.id === id);
window.sessionById = id => CONF.sessions.find(s => s.id === id);
window.officialUrl = t => t.official_url || sessionById(t.session).url;
window.slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(elder|sister|president|bishop)\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
window.speakerTalks = sl => CONF.talks.filter(t => slug(t.speaker) === sl);
window.fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
const NAV = [["index.html","Home"],["builder.html","Card Builder"],["insights.html","Insights"],["quiz.html","Quiz"],["my.html","My Conference"],["lessons.html","Lesson helps"],["challenge.html","Challenge"]];
window.headerHTML = (active, small) => `
  <div class="unofficial" role="note">Not an official Church site · Personal study page · Quotes from recaps; confirm with official text</div>
  <header class="hero ${small ? "hero-sm" : "hero-lg"}">
    <div class="hero-sky" aria-hidden="true"><span class="rays"></span><span class="glow g1"></span><span class="glow g2"></span><span class="sun"></span>${LANDSCAPE()}<span class="motes"></span><span class="horizon"></span></div>
    <nav class="topbar wrap" aria-label="Main">
      <a class="brand" href="index.html" aria-label="Six Months of Light home">${WORDMARK()}</a>
      <div class="navlinks">${NAV.map(([h,l]) => `<a href="${h}" ${active===h?'aria-current="page"':""}>${l}</a>`).join("")}</div>
    </nav>
    ${small ? "" : `<div class="hero-copy wrap">
      <div class="eyebrow">${esc(CONF.title)} · October 3–4</div>
      <h1 class="display"><span class="d1">Six Months</span> <em>of</em> <span class="d2">Light</span></h1>
      <p class="tagline">${esc(CONF.tagline)}</p>
      ${countdownHTML()}
      <div class="hero-actions"><a class="btn gold" href="talks/${CONF.talk_of_the_week.talk_id}.html">This week's talk</a><a class="btn glass" href="#sessions">Browse all talks</a></div>
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
// Six-month progress: October 2026 conference → April 2027 conference (date estimated; confirm when announced).
window.COUNTDOWN = (() => { const start = new Date("2026-10-04T16:00:00-06:00"), end = new Date("2027-04-03T10:00:00-06:00"), now = new Date();
  const p = Math.max(0, Math.min(1, (now - start) / (end - start))), days = Math.max(0, Math.ceil((end - now) / 864e5)), month = Math.min(6, Math.max(1, Math.ceil(p * 6) || 1));
  return { p, days, month }; })();
window.countdownHTML = () => `<div class="countdown" role="group" aria-label="Six months until April general conference">
  <div class="cd-top"><span class="cd-days"><b data-count="${COUNTDOWN.days}">${COUNTDOWN.days}</b> days until April conference</span><span class="cd-month">Month ${COUNTDOWN.month} of 6</span></div>
  <div class="cd-track"><span class="cd-fill" style="--p:${Math.max(.015, COUNTDOWN.p)}"></span>${[1,2,3,4,5].map(i => `<i style="left:${i/6*100}%"></i>`).join("")}</div>
  <div class="cd-labels"><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span></div>
  <div class="cd-note">April date estimated; confirm when announced.</div></div>`;
window.footerHTML = () => `
  <footer class="site"><div class="wrap">
    <div class="foot-brand">${WORDMARK()}<p>${esc(CONF.tagline)}</p></div>
    <p class="big"><strong>This is not an official website of The Church of Jesus Christ of Latter-day Saints.</strong></p>
    <p>Six Months of Light is a personal study page. It is not affiliated with or endorsed by the Church. For official talks, audio and video, visit <a href="${esc(CONF.conference_url)}" rel="noopener">ChurchofJesusChrist.org</a>.</p>
    <p>Summaries and quotes come from Church News / Church Newsroom recaps; confirm with official text. Full talk text is not reproduced. Your saved quotes, notes and commitments stay on this device.</p>
    <p><a href="groups.html">Family &amp; ward group links</a></p>
  </div></footer>`;
window.recapNotice = () => `<div class="notice" role="note"><strong>Quotes from recaps; confirm with official text.</strong> Official talk text isn't posted yet. Summaries and quotes here come from Church News and Church Newsroom recaps.</div>`;
window.mount = (active, small) => {
  document.body.insertAdjacentHTML("afterbegin", headerHTML(active, small));
  document.body.insertAdjacentHTML("beforeend", footerHTML());
};

// ---- "Ask AI" — UI MOCKUP ONLY. No AI service is connected. ----
// Design rules for the future live version (see README): answer ONLY from official talk text
// on ChurchofJesusChrist.org, cite talk + paragraph for every claim, say "I don't know" when the
// text doesn't answer, never speak for the Church or give doctrinal rulings.
window.askAIPanel = (scope) => {
  const id = "ai" + Math.random().toString(36).slice(2, 7);
  const qs = scope.questions;
  setTimeout(() => {
    document.querySelectorAll(`#${id} .chip`).forEach((b, i) => b.addEventListener("click", () => {
      document.querySelector(`#${id} .ai-answer`).innerHTML = scope.answer(i);
    }));
  });
  return `<section class="card ai" id="${id}" aria-labelledby="${id}-h">
    <div class="ai-head"><h2 id="${id}-h">Ask AI</h2><span class="pill pending">Preview mockup · not live</span></div>
    <p class="speaker">Ask about ${esc(scope.label)}. When live, answers will come <strong>only from the official talk text</strong>, with citations, and will never speak for the Church.</p>
    <div class="chips">${qs.map(q => `<button class="chip" type="button">${esc(q)}</button>`).join("")}</div>
    <div class="ai-input"><input type="text" disabled placeholder="Available after official text is posted"><button class="btn small" disabled>Ask</button></div>
    <div class="ai-answer"></div>
  </section>`;
};
window.mockAnswer = (text, cites) => `<div class="ai-bubble"><div class="ai-tag">Mock answer (built from this page's recap data, not AI)</div>
  <p>${text}</p><ol class="cites">${cites.map(c => `<li>${c}</li>`).join("")}</ol></div>`;

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
    </div>
    <p class="speaker sheet-note">Links open the talk page directly. Facebook and X share the link; download the card to post the image.</p>
    <button class="btn secondary small" data-act="close">Close</button></div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
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
