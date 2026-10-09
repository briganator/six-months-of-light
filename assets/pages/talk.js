mount("", true);
const CFG = window.CONF_CONFIG, tid = window.TALK_ID || QS.get("t");
const t = talkById(tid) || (CONF.business || []).find(b => b.id === tid);
const main = document.getElementById("main");
if (!t) { main.innerHTML = `<div class="card"><p>Talk not found. <a href="index.html">See all talks</a>.</p></div>`; }
else if (t.kind === "business") {
  const s = sessionById(t.session);
  document.title = t.title;
  main.innerHTML = `
  <p class="crumbs"><a href="index.html">← All talks</a> · <a href="session.html?s=${s.id}">${esc(s.name)}</a></p>
  <article class="card talk-main s-${s.color}" id="summary">
    <div class="talk-head"><span class="chip-session s-${s.color}">${esc(s.name)} · Business</span><h1>${esc(t.title)}</h1>
      <p class="speaker">${esc(t.speaker)} · ${esc(t.calling)}</p></div>
    <p>${esc(t.lead)}</p>
    <div class="links">
      <a class="btn secondary" href="#fulltext">Read the full text</a>
    </div>
    <div id="fulltext"></div>
  </article>
  ${sourceLine(t)}
  <nav class="links"><a class="btn secondary small" href="session.html?s=${s.id}">← ${esc(s.name)}</a></nav>`;
  loadFull(t);
} else {
  const s = sessionById(t.session), ts = CONF.talks.filter(x => x.session === t.session).sort((a,b)=>a.order-b.order);
  const i = ts.findIndex(x => x.id === t.id), prev = ts[i-1], next = ts[i+1];
  document.title = `${t.title} · ${t.speaker}`;
  const committed = Store.commitments().find(c => c.talkId === t.id);
  main.innerHTML = `
  <p class="crumbs"><a href="index.html">← All talks</a> · <a href="session.html?s=${s.id}">${esc(s.name)}</a>, talk ${t.order}</p>
  ${recapNotice(true, t)}
  <article class="card talk-main s-${s.color}" id="summary">
    <div class="talk-head"><span class="chip-session s-${s.color}">${esc(s.name)} · Talk ${t.order}</span><h1>${esc(t.title)}</h1>
      <p class="speaker"><a href="speaker.html?s=${slug(t.speaker)}">${esc(t.speaker)}</a> · ${esc(t.calling)}</p></div>
    <div class="talk-actions">
      <a class="btn gold" href="lessons.html?t=${esc(t.id)}">Build a lesson from this talk</a>
      <a class="btn secondary" href="quiz.html?t=${esc(t.id)}">Quiz yourself</a>
    </div>
    <section class="recap60" aria-label="60-second recap">
      <div class="label">60-second recap</div>
      <div class="big">${esc(t.big_idea)}</div>
      <blockquote>“${esc(t.quotes[0])}”</blockquote>
      <div class="inv"><b>Invitation:</b> ${esc(t.invitation)}</div>
    </section>
    <p>${esc(t.summary)}</p>
    <dl class="kv">
      <dt>Key scriptures</dt>
      <dd><ul class="scriptures">${t.scriptures.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></dd>
      <dt>Quotes <span style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted)">(${t.official_url ? "from the official talk text" : "from recaps; confirm with official text"})</span></dt>
      <dd>${t.quotes.map((q,qi)=>`<blockquote id="q${qi+1}" class="qanchor" tabindex="-1">“${esc(q)}”</blockquote>
        <div class="qrow"><button type="button" data-save="${qi}" aria-pressed="${Store.isSaved(t.id,qi)}">${Store.isSaved(t.id,qi)?"★ Saved":"☆ Save"}</button>
        <a class="qmake" href="builder.html?t=${t.id}&q=${qi}">Make a card</a></div>`).join("")}</dd>
    </dl>
    <div class="invite"><div class="label">Invitation</div>${esc(t.invitation)}
      <div id="commitbox" style="margin-top:8px">${committed ? `✓ You committed on ${fmtDate(committed.start)}. <a href="my.html">Track your 7 days</a>`
        : `<button class="btn ok small" id="commit">Commit for 7 days</button>`}</div></div>
    <div class="ponder"><div class="label">Ponder</div>${esc(t.ponder)}</div>
    ${t.full_text_permitted ? `<p class="links" style="margin-bottom:0"><a class="txt-link" href="#fulltext">Read the full talk</a></p>` : ""}
    ${t.video_embed ? `<div class="video"><iframe src="${esc(t.video_embed)}" title="Official video: ${esc(t.title)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>` : ""}
    ${t.full_text_permitted ? `<div id="fulltext"></div>` : `<p class="speaker">Full talk text isn't reproduced here (Church copyright); read it on ChurchofJesusChrist.org.</p>`}
  </article>
  <section class="card study-panel" id="studyPanel" aria-labelledby="sp-h"><h2 id="sp-h" style="margin-top:0">Study this talk</h2><p class="empty">Loading…</p></section>
  ${sourceLine(t)}
  <section class="card"><h2 style="margin-top:0">Share this talk</h2>
    <p class="speaker">Quote cards include a QR code that links back to this page.</p>
    <div class="links" style="margin-bottom:0">
      <a class="btn" href="builder.html?t=${t.id}&q=0&size=portrait">Make a card</a>
      <a class="btn secondary" href="builder.html?t=${t.id}&q=0&anim=1">▶ Animated story</a>
      <button class="btn secondary" id="cplink">Share link</button></div></section>

  <section class="card"><h2 style="margin-top:0">My private note</h2>
    <p class="speaker">Saved only on this device. Never shared.</p>
    <textarea class="note" id="note" aria-label="My notes on this talk (saved on this device)" placeholder="Impressions, promptings, what I'll do…">${esc(Store.note(t.id))}</textarea>
    <div class="msg" id="notemsg"></div></section>

  <section class="card stuck" aria-labelledby="stuck-h">
    <h2 id="stuck-h">What stuck with me</h2>
    <p class="speaker">Share one line, quote or impression${GROUP ? ` with <strong>${esc(GROUP)}</strong>` : ""}. Posts appear after they're reviewed.</p>
    <div id="comments"><p class="empty">Loading…</p></div>
    <form id="f" novalidate>
      <label for="name">Your name <span style="font-weight:400;color:var(--muted)">(optional)</span></label>
      <input type="text" id="name" maxlength="${CFG.nameMaxLength}" autocomplete="given-name" placeholder="e.g. Sarah">
      <label for="body">What stuck with you?</label>
      <textarea id="body" maxlength="${CFG.maxLength}" required placeholder="One line, quote or impression"></textarea>
      <div class="count"><span id="cnt">0</span>/${CFG.maxLength}</div>
      <div class="hp" aria-hidden="true"><label for="website">Leave this empty</label><input type="text" id="website" tabindex="-1" autocomplete="off"></div>
      <button class="btn" id="send" type="submit">Share</button>
      <div class="msg" id="msg" role="status" aria-live="polite"></div>
    </form>
  </section>
  ${askTalksPanel({ label: "this talk", questions: ["What is the main message?", "Which scriptures are cited?", "What does it invite me to do?"],
    answer: k => talkAnswer([esc(t.big_idea), (t.official_url ? "Key scriptures: " : "Recaps report: ") + esc(t.scriptures.join("; ")), esc(t.invitation)][k], [t]) })}
  <nav class="links">
    ${prev ? `<a class="btn secondary small" href="talks/${esc(prev.id)}.html">← ${esc(prev.speaker)}</a>` : ""}
    ${next ? `<a class="btn secondary small" href="talks/${esc(next.id)}.html">${esc(next.speaker)} →</a>` : ""}
  </nav>`;
  main.querySelectorAll("[data-save]").forEach(b => b.addEventListener("click", () => {
    const on = Store.toggleQuote(t.id, +b.dataset.save); b.setAttribute("aria-pressed", on); b.textContent = on ? "★ Saved" : "☆ Save"; }));
  const cb = document.getElementById("commit");
  if (cb) cb.addEventListener("click", () => {
    Store.commit(t.id, t.invitation);
    document.getElementById("commitbox").innerHTML = `✓ Committed! <a href="my.html">Track your 7 days</a> · <button class="btn secondary small" id="ics">Add 7-day reminder to my calendar</button>`;
    document.getElementById("ics").addEventListener("click", () => downloadReminder(t, t.invitation));
  });
  let nt; document.getElementById("note").addEventListener("input", e => { clearTimeout(nt); nt = setTimeout(() => { Store.setNote(t.id, e.target.value.trim()); document.getElementById("notemsg").textContent = "Saved on this device."; }, 400); });
  document.getElementById("cplink").addEventListener("click", () => shareCard({ url: talkUrl(t), text: shareText(t) }));
  setupShare(t.id);
  const hm = /^#q(\d)$/.exec(location.hash), qa = hm && document.getElementById("q" + hm[1]);
  if (qa) { qa.classList.add("qhit"); requestAnimationFrame(() => { qa.scrollIntoView({ block: "center" }); qa.focus({ preventScroll: true }); }); }
  loadFull(t);
}

// Official full text, audio and video. The JSON is this talk only, so the page stays small until it's opened.
function loadFull(talk) {
  const slot = document.getElementById("fulltext");
  if (!slot || !talk.full_text_permitted) return;
  fetch("assets/fulltext/" + talk.id + ".json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(ft => renderFull(slot, talk, ft)).catch(() => {
    slot.innerHTML = `<p class="speaker">The full talk couldn’t load just now. <a href="${esc(talk.official_url || officialUrl(talk))}" rel="noopener">Read it on ChurchofJesusChrist.org ↗</a></p>`;
  });
}
function sourceLine(t) {
  const off = t.official_url || officialUrl(t);
  const recap = t.recap_url ? ` · <a href="${esc(t.recap_url)}" rel="noopener">Church News recap</a>` : "";
  return `<p class="talk-source">Source: <a href="${esc(off)}" rel="noopener">${t.official_url ? "Official talk" : "Official session"} on ChurchofJesusChrist.org</a>${recap}. Talk text from ChurchofJesusChrist.org · Personal study site · Not an official Church site.</p>`;
}
function mediaBlock(ft, talk) {
  const v = ft.video, a = ft.audio;
  if (!v && !a) return "";
  return `<div class="ft-media no-print">
    ${v ? `<video controls playsinline preload="none" aria-label="Official video"><source src="${esc(v.src)}" type="video/mp4"></video>` : ""}
    ${a ? `<audio controls preload="none" src="${esc(a)}" aria-label="Official audio"></audio>` : ""}
    <p class="speaker">Official ${v && a ? "video and audio" : v ? "video" : "audio"} from ChurchofJesusChrist.org.${v && v.duration ? " · " + esc(v.duration) : ""}</p>
  </div>`;
}
function renderFull(slot, talk, ft) {
  const notes = ft.notes || [];
  slot.innerHTML = `<section class="fulltext" aria-labelledby="ft-h">
    <nav class="ft-tools no-print" aria-label="In this talk">
      ${talk.kind === "business" ? "" : `<a href="#summary">Summary</a>`}
      <a href="#fulltext">Full talk</a>
      ${notes.length ? `<a href="#ft-notes">Notes</a>` : ""}
    </nav>
    <h2 id="ft-h">${talk.kind === "business" ? "Full text" : "Full talk"}</h2>
    <p class="ft-perm">Talk text from ChurchofJesusChrist.org. Personal study site, not an official Church site.</p>
    ${mediaBlock(ft, talk)}
    <div class="ft-body">${ft.body || ""}</div>
    ${notes.length ? `<details class="ft-notes" id="ft-notes"><summary>Notes (${notes.length})</summary><ol>${notes.map(n => `<li id="fn-${esc(n.n)}" value="${esc(n.n)}">${n.html}</li>`).join("")}</ol></details>` : ""}
  </section>`;
  slot.querySelectorAll(".ft-body a[href*='churchofjesuschrist.org'], .ft-notes a[href*='churchofjesuschrist.org']").forEach(a => {
    const s = document.createElement("span"); if (a.className) s.className = a.className; s.innerHTML = a.innerHTML; a.replaceWith(s);
  });
  slot.querySelectorAll("img").forEach(img => img.addEventListener("error", () => { const fig = img.closest("figure"); if (fig) fig.classList.add("ft-fig-miss"); img.remove(); }));
  slot.querySelectorAll("video, audio").forEach(el => el.addEventListener("error", () => {
    const p = document.createElement("p"); p.className = "speaker";
    p.innerHTML = `This ${el.tagName === "VIDEO" ? "video" : "audio"} didn’t load. <a href="${esc(talk.official_url || officialUrl(talk))}" rel="noopener">Play it on ChurchofJesusChrist.org ↗</a>`;
    el.replaceWith(p);
  }, true));
  let pop = null;
  const close = () => { pop?.remove(); pop = null; };
  const openNote = a => {
    const n = a.getAttribute("data-n"), li = document.getElementById("fn-" + n); if (!li) return;
    close();
    pop = document.createElement("div"); pop.className = "fn-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Note " + n);
    pop.innerHTML = `<div class="fn-pop-h"><span>Note ${esc(n)}</span><button type="button" class="fn-x" aria-label="Close">Close</button></div><div class="fn-pop-b">${li.innerHTML}</div><a class="fn-more" href="#fn-${esc(n)}">See in notes</a>`;
    document.body.appendChild(pop);
    if (innerWidth >= 700) { const r = a.getBoundingClientRect(); pop.style.top = Math.max(8, Math.min(r.bottom + 8, innerHeight - 240)) + "px"; pop.style.left = Math.max(8, Math.min(r.left, innerWidth - 440)) + "px"; }
    else pop.classList.add("fn-sheet");
    pop.querySelector(".fn-x").addEventListener("click", close);
    pop.querySelector(".fn-more").addEventListener("click", () => { const d = document.getElementById("ft-notes"); if (d) d.open = true; close(); });
  };
  slot.addEventListener("click", e => { const a = e.target.closest("a.fn"); if (!a) return; e.preventDefault(); e.stopPropagation(); openNote(a); });
  document.addEventListener("click", e => { if (pop && !pop.contains(e.target) && !e.target.closest("a.fn")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  const bar = document.createElement("div"); bar.className = "readbar no-print"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<span></span>"; document.body.appendChild(bar);
  const tick = () => { const el = slot.querySelector(".ft-body"); if (!el) return; const r = el.getBoundingClientRect(), total = Math.max(1, el.offsetHeight - innerHeight * .35), seen = Math.min(Math.max(-r.top + innerHeight * .2, 0), total); bar.firstChild.style.width = (seen / total * 100) + "%"; };
  addEventListener("scroll", tick, { passive: true }); tick();
  addEventListener("beforeprint", () => { const d = document.getElementById("ft-notes"); if (d) d.open = true; });
  if (/^#fn-\d+$/.test(location.hash)) { const d = document.getElementById("ft-notes"); if (d) d.open = true; }
}

// ---- Study panel: topics, scriptures with Come, Follow Me tie-in, structure, taught before, print summary ----
const whenNear = (id, fn) => { const el = document.getElementById(id); let done = false; const go = () => { if (!done) { done = true; fn(); } };
  if (el && "IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "600px" }); io.observe(el); }
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(go, { timeout: 4000 }); if (!el) go(); };
if (t && t.kind !== "business") whenNear("studyPanel", () => loadLib().then(LB => {
  const me = LB.talks.find(x => x.local && x.id === t.id), el = document.getElementById("studyPanel"); if (!me || !el) return;
  const cfm = r => { const w = LB.work(r); return w === "Old Testament" ? `<span class="pill">In Come, Follow Me 2026</span>` : w === "New Testament" ? `<span class="pill pending">Come, Follow Me 2027</span>` : ""; };
  const rel = LB.related(me, 4).filter(x => !x.t.local), before = LB.talks.filter(x => x.sp === me.sp && !x.local).slice(0, 3);
  const dens = Object.entries(me.d).sort((a, b) => b[1] - a[1]).slice(0, 4);
  el.innerHTML = `<h2 id="sp-h" style="margin-top:0">Study this talk</h2>
    <div class="sp-grid">
      <div><h3>Topics</h3><p>${(me.tg.length ? me.tg : dens.map(x => x[0])).map(k => LB.THEME_KEYS.includes(k) ? `<a class="pill" href="topic.html?k=${k}">${esc(LB.themeName(k))}</a>` : `<span class="pill">${esc(LB.themeName(k))}</span>`).join(" ") || "None tagged yet."}</p>
        <h3>Structure</h3><ul class="sp-facts"><li>${t.quotes.length} verified quote${t.quotes.length === 1 ? "" : "s"}</li><li>${t.scriptures.length} key scripture${t.scriptures.length === 1 ? "" : "s"}${t.official_url ? "" : " in the recap"}</li><li>1 invitation · 1 ponder question</li></ul></div>
      <div><h3>Scriptures to study</h3><ul class="sp-refs">${t.scriptures.map(r => `<li><span>${esc(r)}</span> ${cfm(r)}</li>`).join("")}</ul>
        <p class="z-note">This year's Come, Follow Me is the ${esc(LB.CFM[2026][0])}; 2027 is the ${esc(LB.CFM[2027][0])}.</p></div>
    </div>
    ${rel.length ? `<h3>Taught before</h3><ul class="sp-rel">${rel.map(x => `<li><a href="${esc(LB.href(x.t))}" rel="noopener" target="_blank">${esc(x.t.t)} ↗</a> <span class="speaker">${esc(x.t.s)} · ${esc(LB.confOf(x.t.c).label)}${x.sharedRefs.length ? " · also cites " + esc(x.sharedRefs.slice(0, 2).join(", ")) : ""}</span></li>`).join("")}</ul>` : ""}
    ${before.length ? `<h3>Earlier from ${esc(t.speaker.replace(/^(President|Elder|Sister|Bishop)\s+/, ""))}</h3><ul class="sp-rel">${before.map(x => `<li><a href="${esc(LB.href(x))}" rel="noopener" target="_blank">${esc(x.t)} ↗</a> <span class="speaker">${esc(LB.confOf(x.c).label)}</span></li>`).join("")}</ul><a class="linkish" href="speaker.html?s=${me.sp}">All talks by this speaker</a>` : ""}
    <div class="links no-print"><a class="btn secondary small" href="lessons.html?t=${esc(t.id)}">Build a lesson from this talk</a><button type="button" class="btn secondary small" id="printBtn">Print a one-page summary</button>${(() => { const k = me.tg.find(x => LB.THEME_KEYS.includes(x)) || (dens[0] || [])[0]; return k ? `<a class="btn secondary small" href="study.html?c=all&topic=${k}">More talks on ${esc(LB.themeName(k))}</a>` : ""; })()}</div>`;
  document.getElementById("printBtn").addEventListener("click", () => window.print());
}).catch(() => { const el = document.getElementById("studyPanel"); if (el) el.remove(); }));
