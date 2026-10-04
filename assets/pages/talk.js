mount("", true);
const CFG = window.CONF_CONFIG, t = talkById(window.TALK_ID || QS.get("t")), main = document.getElementById("main");
if (!t) { main.innerHTML = `<div class="card"><p>Talk not found. <a href="index.html">See all talks</a>.</p></div>`; }
else {
  const s = sessionById(t.session), ts = CONF.talks.filter(x => x.session === t.session).sort((a,b)=>a.order-b.order);
  const i = ts.findIndex(x => x.id === t.id), prev = ts[i-1], next = ts[i+1];
  document.title = `${t.title} · ${t.speaker}`;
  const committed = Store.commitments().find(c => c.talkId === t.id);
  main.innerHTML = `
  <p class="crumbs"><a href="index.html">← All talks</a> · <a href="session.html?s=${s.id}">${esc(s.name)}</a>, talk ${t.order}</p>
  ${recapNotice()}
  <article class="card talk-main s-${s.color}">
    <div class="talk-head"><span class="chip-session s-${s.color}">${esc(s.name)} · Talk ${t.order}</span><h1>${esc(t.title)}</h1>
      <p class="speaker"><a href="speaker.html?s=${slug(t.speaker)}">${esc(t.speaker)}</a> · ${esc(t.calling)}</p></div>
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
      <dt>Quotes <span style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted)">(from recaps; confirm with official text)</span></dt>
      <dd>${t.quotes.map((q,qi)=>`<blockquote id="q${qi+1}" class="qanchor" tabindex="-1">“${esc(q)}”</blockquote>
        <div class="qrow"><button type="button" data-save="${qi}" aria-pressed="${Store.isSaved(t.id,qi)}">${Store.isSaved(t.id,qi)?"★ Saved":"☆ Save"}</button>
        <a href="builder.html?t=${t.id}&q=${qi}">Make a card</a></div>`).join("")}</dd>
    </dl>
    <div class="invite"><div class="label">Invitation</div>${esc(t.invitation)}
      <div id="commitbox" style="margin-top:8px">${committed ? `✓ You committed on ${fmtDate(committed.start)}. <a href="my.html">Track your 7 days</a>`
        : `<button class="btn ok small" id="commit">Commit for 7 days</button>`}</div></div>
    <div class="ponder"><div class="label">Ponder</div>${esc(t.ponder)}</div>
    <div class="links">
      <a class="btn" href="${esc(officialUrl(t))}" rel="noopener">${t.official_url ? "Official talk" : "Official session page"} ↗</a>
      <a class="btn secondary" href="${esc(t.recap_url)}" rel="noopener">Church News recap ↗</a>
    </div>
    ${t.official_url ? "" : `<p class="speaker">The official talk page isn't posted yet; this links to the session page on ChurchofJesusChrist.org.</p>`}
    ${t.video_embed ? `<div class="video"><iframe src="${esc(t.video_embed)}" title="Official video: ${esc(t.title)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
      : `<div class="slot">🎬 <strong>Official video</strong> — will be embedded here only where the Church permits embedding (e.g., the official General Conference YouTube video). Until then, use the official link above.</div>`}
    ${t.full_text_permitted ? `<div id="fulltext"></div>` : `<div class="slot">📄 <strong>Full talk text</strong> — not reproduced here (Church copyright). This space is reserved in case permission is granted; read the full talk on ChurchofJesusChrist.org.</div>`}
  </article>
  <section class="card study-panel" id="studyPanel" aria-labelledby="sp-h"><h2 id="sp-h" style="margin-top:0">Study this talk</h2><p class="empty">Loading…</p></section>
  <section class="card"><h2 style="margin-top:0">Share this talk</h2>
    <p class="speaker">Quote cards include a QR code that links back to this page.</p>
    <div class="links" style="margin-bottom:0">
      <a class="btn" href="builder.html?t=${t.id}&q=0&size=portrait">Make a card</a>
      <a class="btn secondary" href="builder.html?t=${t.id}&q=0&anim=1">▶ Animated story</a>
      <button class="btn secondary" id="cplink">Share link</button></div></section>

  <section class="card"><h2 style="margin-top:0">My private note</h2>
    <p class="speaker">Saved only on this device. Never shared.</p>
    <textarea class="note" id="note" placeholder="Impressions, promptings, what I'll do…">${esc(Store.note(t.id))}</textarea>
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
    answer: k => talkAnswer([esc(t.big_idea), "Recaps report: " + esc(t.scriptures.join("; ")), esc(t.invitation)][k], [t]) })}
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
  // deep link from cards / QR codes: talks/<id>.html#q2 highlights that quote
  const hm = /^#q(\d)$/.exec(location.hash), qa = hm && document.getElementById("q" + hm[1]);
  if (qa) { qa.classList.add("qhit"); requestAnimationFrame(() => { qa.scrollIntoView({ block: "center" }); qa.focus({ preventScroll: true }); }); }
}

// ---- Study panel: topics, scriptures with Come, Follow Me tie-in, structure, taught before, print summary ----
if (t) loadLib().then(LB => {
  const me = LB.talks.find(x => x.recap && x.id === t.id), el = document.getElementById("studyPanel"); if (!me || !el) return;
  const cfm = r => { const w = LB.work(r); return w === "Old Testament" ? `<span class="pill">In Come, Follow Me 2026</span>` : w === "New Testament" ? `<span class="pill pending">Come, Follow Me 2027</span>` : ""; };
  const rel = LB.related(me, 4).filter(x => !x.t.recap), before = LB.talks.filter(x => x.sp === me.sp && !x.recap).slice(0, 3);
  const dens = Object.entries(me.d).sort((a, b) => b[1] - a[1]).slice(0, 4);
  el.innerHTML = `<h2 id="sp-h" style="margin-top:0">Study this talk</h2>
    <div class="sp-grid">
      <div><h3>Topics</h3><p>${(me.tg.length ? me.tg : dens.map(x => x[0])).map(k => LB.THEME_KEYS.includes(k) ? `<a class="pill" href="topic.html?k=${k}">${esc(LB.themeName(k))}</a>` : `<span class="pill">${esc(LB.themeName(k))}</span>`).join(" ") || "None tagged yet."}</p>
        <h3>Structure</h3><ul class="sp-facts"><li>${t.quotes.length} verified quote${t.quotes.length === 1 ? "" : "s"}</li><li>${t.scriptures.length} key scripture${t.scriptures.length === 1 ? "" : "s"} in the recap</li><li>1 invitation · 1 ponder question</li></ul></div>
      <div><h3>Scriptures to study</h3><ul class="sp-refs">${t.scriptures.map(r => `<li><span>${esc(r)}</span> ${cfm(r)}</li>`).join("")}</ul>
        <p class="z-note">This year's Come, Follow Me is the ${esc(LB.CFM[2026][0])}; 2027 is the ${esc(LB.CFM[2027][0])}. <a href="${esc(LB.CFM[2026][1])}" rel="noopener">Manual ↗</a></p></div>
    </div>
    ${rel.length ? `<h3>Taught before</h3><ul class="sp-rel">${rel.map(x => `<li><a href="${esc(LB.href(x.t))}" rel="noopener" target="_blank">${esc(x.t.t)} ↗</a> <span class="speaker">${esc(x.t.s)} · ${esc(LB.confOf(x.t.c).label)}${x.sharedRefs.length ? " · also cites " + esc(x.sharedRefs.slice(0, 2).join(", ")) : ""}</span></li>`).join("")}</ul>` : ""}
    ${before.length ? `<h3>Earlier from ${esc(t.speaker.replace(/^(President|Elder|Sister|Bishop)\s+/, ""))}</h3><ul class="sp-rel">${before.map(x => `<li><a href="${esc(LB.href(x))}" rel="noopener" target="_blank">${esc(x.t)} ↗</a> <span class="speaker">${esc(LB.confOf(x.c).label)}</span></li>`).join("")}</ul><a class="linkish" href="speaker.html?s=${me.sp}">All talks by this speaker</a>` : ""}
    <div class="links no-print"><a class="btn secondary small" href="lessons.html?mode=eqrs&c=2026-10&t=${esc(t.id)}">Lesson helps: EQ & RS, youth, family</a><button type="button" class="btn secondary small" id="printBtn">Print a one-page summary</button>${(() => { const k = me.tg.find(x => LB.THEME_KEYS.includes(x)) || (dens[0] || [])[0]; return k ? `<a class="btn secondary small" href="study.html?c=all&topic=${k}">More talks on ${esc(LB.themeName(k))}</a>` : ""; })()}</div>`;
  document.getElementById("printBtn").addEventListener("click", () => window.print());
}).catch(() => { const el = document.getElementById("studyPanel"); if (el) el.remove(); });
