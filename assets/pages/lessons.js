mount("lessons.html", true);
// Lesson helps: outlines assembled only from this site's data (verified recap quotes, official talk metadata and footnoted scriptures).
// Template-based questions; no talk text and no invented doctrine. Leaders prepare from the official text and the Spirit.
const MODES = {
  fhe: { tab: "Family night", name: "Family home evening", time: "15–20 min", open: "Sing a favorite hymn or Primary song, then ask:", act: "Let each family member share one experience or idea connected to the message. Younger children can draw it.", close: "Choose one small family goal and check in at dinner during the week.", nq: 2, present: "Tonight's talk" },
  eqrs: { tab: "Elders Quorum & Relief Society", name: "Elders Quorum & Relief Society", time: "about 45 min", fmt: "For second- and fourth-Sunday lessons that counsel together about a recent general conference message.", open: "Welcome everyone, invite someone to read the key quote, then give a minute to ponder:", act: "In small groups, take one question each, then share what you discussed with everyone.", close: "Consider how members could help one another act on it this week, including through ministering.", nq: 5, present: "Today's message" },
  youth: { tab: "Youth", name: "Youth classes", sub: "Young Women classes and Aaronic Priesthood quorums", time: "25–30 min", open: "Write the ponder question on the board and give 1 minute of quiet thinking:", act: "In pairs, read a quote and discuss: What does it mean? Where have we seen it in real life? Then share with the class.", close: "Invite each youth to privately write one action they'll take this week.", nq: 3, present: "Today's message" },
  talk: { tab: "Sacrament talk", name: "Sacrament meeting talk", time: "5–8 min", open: "Open with a brief personal experience related to the message, then introduce:", act: "Teach the message using one scripture and one quote, adding your own testimony and experience.", close: "Close by extending the invitation and bearing testimony of Jesus Christ.", nq: 0, present: "My talk" },
};
const LIB_OK = () => !!window.Library;
let mode = MODES[QS.get("mode")] ? QS.get("mode") : "fhe", conf = QS.get("c") || "2026-10", tid = QS.get("t") || CONF.talks[0].id;
if (QS.get("t") && !QS.get("c") && !talkById(tid)) conf = "";   // library talk without a conference: resolved after load
const main = document.getElementById("main");
main.innerHTML = `
  <h1 style="margin-top:38px">Lesson helps</h1>
  <p class="lede" style="margin-top:-4px">A ready outline for any general conference talk: family night, Elders Quorum and Relief Society, youth classes or a sacrament talk.</p>
  <div class="notice"><strong>Starter outline.</strong> Built from this site's data: verified quotes, the scriptures each talk cites and its official summary line. Prepare from the official talk text, and follow the Spirit.</div>
  <div class="card no-print">
    <div class="ls-pick">
      <label><span class="speaker">Conference</span><select id="lc"><option value="2026-10">October 2026</option></select></label>
      <label><span class="speaker">Talk</span><select id="lt"></select></label>
    </div>
    <div class="seg" id="aud" role="group" aria-label="Who is the lesson for?">${Object.entries(MODES).map(([k, v]) => `<button data-k="${k}" aria-pressed="${k === mode}">${v.tab}</button>`).join("")}</div>
  </div>
  <article class="card outline" id="out"></article>
  <section class="handout" id="handout" aria-hidden="true"></section>`;
const $ = id => document.getElementById(id);
const octList = () => CONF.talks.map(t => ({ id: t.id, label: `${t.speaker} — ${t.title}` }));
function talkOptions() {
  const list = conf === "2026-10" ? octList() : (LIB_OK() ? Library.talks.filter(t => t.c === conf).map(t => ({ id: t.id, label: `${t.s} — ${t.t}` })) : []);
  if (!list.some(x => x.id === tid)) tid = list[0]?.id;
  $("lt").innerHTML = list.map(x => `<option value="${esc(x.id)}" ${x.id === tid ? "selected" : ""}>${esc(x.label)}</option>`).join("");
}
// One shape for both sources
function norm() {
  if (conf === "2026-10") { const t = talkById(tid); if (!t) return null;
    const tags = window.THEMES3 ? [...new Set(t.quotes.flatMap((_, i) => THEMES3.tagsFor(t.id, i)))].map(k => THEMES3.get(k)?.name).filter(Boolean) : [];
    return { title: t.title, speaker: t.speaker, calling: t.calling, conf: "October 2026", official: t.official_url, session: officialUrl(t), local: `talks/${t.id}.html`,
      overview: t.summary, overviewSrc: "Summary written from news recaps of the talk; not the official text.", big: t.big_idea, ponder: t.ponder,
      quotes: t.quotes, quoteSrc: "Quoted in news recaps; confirm the wording with the official text when it's posted.",
      refs: t.scriptures, refSrc: "As reported in recaps.", invitation: t.invitation, invSrc: "", topics: tags };
  }
  const t = LIB_OK() && Library.talks.find(x => x.c === conf && x.id === tid); if (!t) return null;
  const topics = (t.tg.length ? t.tg : Object.entries(t.d || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0])).map(Library.themeName);
  const t0 = topics[0], tp = !t0 ? "the gospel of Jesus Christ" : t0 === "Jesus Christ" ? "following Jesus Christ" : /^(Holy Ghost|Book of Mormon)$/.test(t0) ? "the " + t0 : t0.toLowerCase().replace(" & ", " and ").replace(/^temple$/, "the temple").replace(/^youth$/, "the youth");
  return { title: t.t, speaker: t.s, calling: t.r, conf: Library.confOf(t.c).label, official: Library.official(t), session: Library.official(t), local: null,
    overview: t.k, overviewSrc: "The summary line from the talk's official page.", big: t.k,
    ponder: `As you read this talk, what is one thing you feel prompted to do about ${tp}?`,
    quotes: [], keyStatement: t.k, quoteSrc: "Read more quotes in the official talk text.",
    refs: t.rf, refSrc: `${t.rf.length} scripture${t.rf.length === 1 ? "" : "s"} cited in the talk's footnotes.`,
    invitation: `Read the full talk and choose one invitation from ${t.s} to act on this week.`,
    invSrc: t.inv ? `The talk has ${t.inv} direct “I invite” statement${t.inv === 1 ? "" : "s"}; find ${t.inv === 1 ? "it" : "them"} in the official text.` : "", topics };
}
function questions(n, m) {
  const t0 = n.topics[0] || "", tp = t0 === "Jesus Christ" ? "the Savior's help" : /^(Holy Ghost|Book of Mormon|Restoration|Second Coming|Christmas|Easter|Relief Society|Elders Quorum)$/.test(t0) ? t0.replace(/^(Restoration|Second Coming)$/, "the $1") : t0.toLowerCase().replace(" & ", " and ").replace(/^temple$/, "the temple").replace(/^youth$/, "the youth"), ref = n.refs.map(ScripRef.first).find(Boolean);
  const q = [n.ponder];
  if (n.quotes.length) q.push(`Read the first quote together. What stands out to you, and why?`);
  else q.push(`The talk's key message is “${n.keyStatement}” What does that mean to you?`);
  if (tp) q.push(m === "youth" ? `Where do you see ${tp} make a difference in the lives of people your age?` : tp === "the Savior's help" ? `When have you seen the Savior's help bless someone in your family or ward?` : `When have you seen ${tp} bless someone in your family or ward?`);
  if (ref) q.push(`Read ${ref}. How does it connect to the talk's message?`);
  q.push(m === "eqrs" ? `How can we help one another act on this, including in our ministering?` : m === "youth" ? `What is one small thing you could do this week because of this message?` : `What will we try as a family this week?`);
  return q.slice(0, m === "fhe" ? 2 : m === "youth" ? 4 : 5);
}
function gen() {
  const n = norm(), m = MODES[mode], out = $("out");
  setURL(`?mode=${mode}&c=${encodeURIComponent(conf)}&t=${encodeURIComponent(tid || "")}`);
  if (!n) { out.innerHTML = `<p class="empty">Loading talks…</p>`; return; }
  const qs = m.nq ? questions(n, mode) : [], quotes = n.quotes.slice(0, mode === "eqrs" ? 3 : 2), refs = n.refs.slice(0, 8);
  const refList = refs.map(r => `<li>${ScripRef.linkify(r)}</li>`).join("") + (n.refs.length > refs.length ? `<li class="speaker">and ${n.refs.length - refs.length} more in the official footnotes</li>` : "");
  const quoteBlock = quotes.length ? `<ul>${quotes.map(q => `<li>“${esc(q)}”</li>`).join("")}</ul><p class="src">${esc(n.quoteSrc)}</p>`
    : `<blockquote class="ls-key">${esc(n.keyStatement)}</blockquote><p class="src">From the talk's official page. ${esc(n.quoteSrc)}</p>`;
  let s = 0; const h = t => `<h3>${++s}. ${t}</h3>`;
  out.innerHTML = `
    <div class="ls-kicker">${esc(m.name)} · ${esc(m.time)}</div>${m.sub ? `<p class="speaker" style="margin:2px 0 0">${esc(m.sub)}</p>` : ""}
    <h2 style="margin:6px 0 2px">${esc(n.title)}</h2><p class="speaker">${esc(n.speaker)} · ${esc(n.conf)} general conference</p>
    ${m.fmt ? `<p class="src" style="margin-top:6px">${esc(m.fmt)}</p>` : ""}
    ${h("Talk overview")}<p>${esc(n.overview)}</p><p class="src">${esc(n.overviewSrc)}</p>
    ${h("Open")}<p>${esc(m.open)} <em>${esc(n.ponder)}</em></p>
    ${h(quotes.length ? "Key quotes" : "Key statement")}${quoteBlock}
    ${h("Scriptures cited")}${refs.length ? `<ul class="ls-refs">${refList}</ul><p class="src">${esc(n.refSrc)}</p>` : `<p>No verse reported yet.</p>`}
    ${qs.length ? `${h("Discussion questions")}<ol class="ls-q">${qs.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    ${h(mode === "eqrs" ? "Counsel together" : "Activity")}<p>${esc(m.act)}</p>
    ${h("Suggested invitation")}<p><strong>${esc(n.invitation)}</strong> ${esc(m.close)}</p>${n.invSrc ? `<p class="src">${esc(n.invSrc)}</p>` : ""}
    <div class="links">
      <button class="btn gold small" id="present">▶ Present</button>
      ${mode !== "talk" ? `<button class="btn secondary small" id="ph">Print handout</button>` : ""}
      <button class="btn secondary small" id="po">Print outline</button>
      <button class="btn secondary small" id="cp">Copy outline</button>
      ${n.official ? `<a class="btn secondary small" href="${esc(n.official)}" target="_blank" rel="noopener">Official text ↗</a>` : `<a class="btn secondary small" href="${esc(n.session)}" target="_blank" rel="noopener">Session on ChurchofJesusChrist.org ↗</a>`}
      ${n.local ? `<a class="btn secondary small" href="${esc(n.local)}">Talk page</a>` : ""}
    </div>`;
  // Class-member handout: one page, big enough to read, no leader notes
  $("handout").innerHTML = `<div class="ho-head"><div class="ho-k">${esc(m.name)}</div><h2>${esc(n.title)}</h2><p>${esc(n.speaker)} · ${esc(n.conf)} general conference</p></div>
    ${quotes.length ? `<h3>Key quotes</h3>${quotes.map(q => `<blockquote>“${esc(q)}”</blockquote>`).join("")}<p class="src">${esc(n.quoteSrc)}</p>` : `<h3>Key statement</h3><blockquote>${esc(n.keyStatement)}</blockquote>`}
    ${refs.length ? `<h3>Scriptures to read</h3><p>${refs.map(r => esc(ScripRef.first(r) || r)).join(" · ")}</p>` : ""}
    ${qs.length ? `<h3>To ponder and discuss</h3><ol>${qs.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    <h3>This week</h3><p>${esc(n.invitation)}</p>
    <p class="ho-foot">Read the full talk at ChurchofJesusChrist.org · Handout from sixmonthsoflight.com (not an official Church site)</p>`;
  $("cp").onclick = () => navigator.clipboard.writeText(out.innerText).then(() => window.toast?.("Outline copied"));
  $("po").onclick = () => print();
  if ($("ph")) $("ph").onclick = () => { document.body.classList.add("print-handout"); print(); setTimeout(() => document.body.classList.remove("print-handout"), 500); };
  $("present").onclick = () => present([
    [m.present, n.title, n.speaker], ["Let's ponder", n.ponder, ""], ["The big idea", n.big, ""],
    ...(quotes.length ? quotes.map(q => ["Read aloud", "“" + q + "”", n.speaker + (conf === "2026-10" ? " (from the recap)" : "")]) : [["Key statement", n.keyStatement, n.speaker]]),
    ...(refs.length ? [["Scripture", refs.map(r => ScripRef.first(r) || r).slice(0, 3).join(" · "), "Read it together from your scriptures."]] : []),
    ...qs.slice(1).map((x, i) => [`Discuss · ${i + 1}`, x, ""]), [mode === "eqrs" ? "Counsel together" : "Activity", m.act, ""], ["This week", n.invitation, m.close]]);
}
window.addEventListener("afterprint", () => document.body.classList.remove("print-handout"));
// Big-type slides for a TV or a phone passed around the room. Arrow keys, swipe or tap the sides; Esc closes.
function present(slides) {
  let i = 0; const ov = document.createElement("div"); ov.className = "present"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Lesson slides");
  ov.innerHTML = `<button class="pr-x" aria-label="Close">×</button><div class="pr-slide" aria-live="polite"></div><div class="pr-nav"><button class="pr-prev" aria-label="Previous">‹</button><span class="pr-n"></span><button class="pr-next" aria-label="Next">›</button></div>`;
  document.body.appendChild(ov); document.body.style.overflow = "hidden";
  const show = () => { const [k, big, small] = slides[i]; ov.querySelector(".pr-slide").innerHTML = `<div class="pr-k">${esc(k)}</div><div class="pr-big ${big.length > 140 ? "long" : ""}">${esc(big)}</div>${small ? `<div class="pr-small">${esc(small)}</div>` : ""}`;
    ov.querySelector(".pr-n").textContent = `${i + 1} / ${slides.length}`; ov.querySelector(".pr-prev").disabled = i === 0; ov.querySelector(".pr-next").textContent = i === slides.length - 1 ? "✓" : "›"; };
  const go = d => { if (i + d >= slides.length) return close(); i = Math.max(0, i + d); show(); };
  const close = () => { ov.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", key); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); $("present")?.focus(); };
  const key = e => { if (e.key === "Escape") close(); if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); go(1); } if (["ArrowLeft", "PageUp"].includes(e.key)) go(-1); };
  document.addEventListener("keydown", key); ov.querySelector(".pr-x").onclick = close; ov.querySelector(".pr-prev").onclick = () => go(-1); ov.querySelector(".pr-next").onclick = () => go(1);
  let x0 = null; ov.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true }); ov.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; });
  ov.requestFullscreen?.().catch(() => {}); show(); ov.querySelector(".pr-next").focus();
}
$("lc").onchange = e => { conf = e.target.value; tid = null; talkOptions(); tid = $("lt").value; gen(); };
$("lt").onchange = e => { tid = e.target.value; gen(); };
document.querySelectorAll("#aud button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.k;
  document.querySelectorAll("#aud button").forEach(x => x.setAttribute("aria-pressed", x === b)); gen(); }));
if (conf === "2026-10") { talkOptions(); gen(); } else gen();
// Every official conference in the study library (loaded after first paint)
loadLib().then(() => {
  if (!conf) { const t = Library.talks.find(x => x.id === tid && !x.recap); conf = t ? t.c : "2026-10"; if (!t) tid = CONF.talks[0].id; }
  $("lc").innerHTML = Library.confs.map(c => `<option value="${c.c}" ${c.c === conf ? "selected" : ""}>${esc(c.label)}${c.recap ? " (recaps)" : ""}</option>`).join("");
  talkOptions(); gen();
}).catch(() => {});
