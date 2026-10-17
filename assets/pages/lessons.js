mount("lessons.html", true);
// Lesson helps: outlines assembled only from this site's data (verified recap quotes, official talk metadata and footnoted scriptures).
// Template-based questions; no talk text and no invented doctrine. Leaders prepare from the official text and the Spirit.
const MODES = {
  fhe: { tab: "Family night", name: "Family home evening", time: "15–20 min", open: "Sing a favorite hymn or Primary song, then ask:", act: "Let each family member share one experience or idea connected to the message. Younger children can draw it.", close: "Choose one small family goal and check in at dinner during the week.", nq: 2, present: "Tonight's talk" },
  eqrs: { tab: "Elders Quorum & Relief Society", name: "Elders Quorum & Relief Society", time: "25 min", timed: true, fmt: "Weekly 25-minute meeting (since Sept. 6, 2026). Begin and end with prayer, start the discussion quickly, and counsel together during the lesson. There is no separate counseling topic beforehand.", conducts: "Presidency", nq: 3, present: "Today's message" },
  youth: { tab: "Youth", name: "Youth classes", sub: "Young Women classes and Aaronic Priesthood quorums", time: "25 min", timed: true, fmt: "Sunday youth classes now study the For the Strength of Youth guide (one chapter a month). Use this outline when leaders choose a conference message, such as a combined class, a fifth Sunday the bishopric assigns, a devotional or an activity.", conducts: "Class or quorum presidency", nq: 3, present: "Today's message" },
  talk: { tab: "Sacrament talk", name: "Sacrament meeting talk", time: "5–8 min", open: "Open with a brief personal experience related to the message, then introduce:", act: "Teach the message using one scripture and one quote, adding your own testimony and experience.", close: "Close by extending the invitation and bearing testimony of Jesus Christ.", nq: 0, present: "My talk" },
};
const LIB_OK = () => !!window.Library;
let mode = MODES[QS.get("mode")] ? QS.get("mode") : "fhe", conf = QS.get("c") || "2026-10", tid = QS.get("t") || CONF.talks[0].id;
if (QS.get("t") && !QS.get("c") && !talkById(tid)) conf = "";   // library talk without a conference: resolved after load
const main = document.getElementById("main");
main.innerHTML = `
  <h1 style="margin-top:38px">Lesson helps</h1>
  <p class="lede" style="margin-top:-4px">A ready outline for any general conference talk: family night, a 25-minute Elders Quorum or Relief Society lesson, youth classes or a sacrament talk.</p>
  <div class="notice"><strong>Starter outline.</strong> Built from this site's summaries, verified quotes and the scriptures each talk cites. The full talk is on the talk page, with text from ChurchofJesusChrist.org. Prepare with that text, and follow the Spirit.</div>
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
      overview: t.summary, overviewSrc: t.official_url ? "Summary written for this site; read the official text for the full message." : "Summary written from news recaps of the talk; not the official text.", big: t.big_idea, ponder: t.ponder,
      quotes: t.quotes, quoteSrc: t.official_url ? "Quoted from the official talk text." : "Quoted in news recaps; confirm the wording with the official text when it's posted.",
      refs: t.scriptures, refSrc: t.official_url ? "From the talk's footnotes and this site's notes." : "As reported in recaps.", invitation: t.invitation, invSrc: "", topics: tags };
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
// ---- 25-minute timed flow (Elders Quorum & Relief Society, youth) ----
// Shape follows the Church's guidance for the 25-minute meetings: a simple welcome and prayer, start the
// discussion quickly, a few principles that build faith in Jesus Christ, counsel together about applying them,
// invitations, closing prayer. One core truth per lesson. Sources: research/rs-eq-25min-guidance.md
const mm = x => `${x}:00`;
function timedPlan(n, mk) {
  const yth = mk === "youth", ref = n.refs.map(ScripRef.first).find(Boolean) || "", quote = n.quotes[0] || n.keyStatement || n.big;
  const core = n.big || n.keyStatement || n.overview;
  const q = [];
  if (ref) q.push(`Read <strong>${esc(ref)}</strong> together. How does it help us understand this truth about following Jesus Christ?`);
  else q.push(`What does this truth teach us about Jesus Christ and how we follow Him?`);
  q.push(yth ? `When have you seen this truth make a difference for someone your age?` : `When have you seen this truth at work in your own life or family?`);
  q.push(yth ? `What would living this look like at school, online or with friends this week?` : `What challenges or opportunities in our ward does this speak to? How could we help one another, including through our ministering and in our homes?`);
  const segs = [
    { a: 0, b: 2, k: "Welcome & prayer", who: MODES[mk].conducts, items: [yth ? "A youth from the class or quorum presidency welcomes everyone and invites someone to pray." : "A simple welcome, then invite someone to give the opening prayer.", "Keep business to what can't wait; no separate counseling topic. Then start right away."] },
    { a: 2, b: 5, k: "Open", who: "Teacher", items: [`Ask: <em>${esc(n.ponder)}</em>`, `Invite someone to read: <q>${esc(quote)}</q>`, "Give a quiet moment to ponder before anyone answers."] },
    { a: 5, b: 20, k: "Discuss one core truth", who: "Everyone", core, items: [
      ...q.slice(0, 2).map((x, i) => `<b>Q${i + 1}.</b> ${i ? esc(x) : x}`),
      `<span class="tl-opt">Optional, about 3 min</span> Turn to someone nearby and share your answer to Q2, then invite two or three people to share with everyone.`,
      `<b>Q3.</b> ${esc(q[2])}`,
      "Let members answer one another. Resist answering every question yourself." ] },
    { a: 20, b: 24, k: "Invite, testify, follow up", who: "Teacher", items: [`From the talk: <strong>${esc(n.invitation)}</strong>`, `Ask: “What do you feel impressed to do?” Give a minute to write it down privately.`, "Bear brief testimony of Jesus Christ and this truth, or invite someone to.", yth ? "Next week, invite one or two youth to share how it went." : "Next week, open by inviting one or two people to share how it went."] },
    { a: 24, b: 25, k: "Closing prayer", who: MODES[mk].conducts, items: ["Invite someone to give the closing prayer. End on time."] },
  ];
  return { segs, q: q.map(x => x.replace(/<[^>]+>/g, "")), ref, quote, core };
}
function renderTimed(n, m, mk) {
  const P = timedPlan(n, mk), out = $("out");
  const bar = `<div class="tl-bar" aria-hidden="true">${P.segs.map(s => `<i style="flex:${s.b - s.a}" title="${esc(s.k)}"><span>${s.b - s.a}</span></i>`).join("")}</div>`;
  const others = n.refs.slice(0, 6).filter(r => (ScripRef.first(r) || r) !== P.ref);
  out.innerHTML = `
    <div class="ls-kicker">${esc(m.name)} · ${esc(m.time)}</div>${m.sub ? `<p class="speaker" style="margin:2px 0 0">${esc(m.sub)}</p>` : ""}
    <h2 style="margin:6px 0 2px">${esc(n.title)}</h2><p class="speaker">${esc(n.speaker)} · ${esc(n.conf)} general conference</p>
    <p class="src" style="margin-top:6px">${esc(m.fmt)}</p>
    <div class="tl-core"><div class="tl-ck">One core truth</div><p>${esc(P.core)}</p></div>
    ${bar}
    <div class="tl-clock no-print"><button class="btn secondary small" id="clk">▶ Start 25-min clock</button><span id="clkv" aria-live="polite"></span></div>
    <ol class="tl">${P.segs.map((s, i) => `<li class="tl-seg" data-a="${s.a}" data-b="${s.b}"><div class="tl-t"><b>${mm(s.a)}–${mm(s.b)}</b><span>${s.b - s.a} min</span></div><div class="tl-body"><h3>${esc(s.k)} <small>${esc(s.who)}</small></h3>${s.core ? `<p class="tl-truth">${esc(s.core)}</p>` : ""}<ul>${s.items.map(x => `<li>${x}</li>`).join("")}</ul></div></li>`).join("")}</ol>
    <details class="tl-prep no-print"><summary>Before Sunday</summary>
      <p>${esc(n.overview)}</p><p class="src">${esc(n.overviewSrc)}</p>
      <ul><li>Read the full talk and pray about what your ${mk === "youth" ? "class" : "quorum or Relief Society"} needs from it.</li><li>Share the talk link a few days early so members come having read it.</li><li>Teach one truth well. Meaningful discussion matters more than covering everything.</li>${others.length ? `<li>Other scriptures the talk cites: ${others.map(esc).join("; ")}</li>` : ""}</ul></details>
    <div class="links">
      <button class="btn gold small" id="present">▶ Present</button>
      <button class="btn secondary small" id="p1">Print this one page</button>
      <button class="btn secondary small" id="ph">Print handout</button>
      <button class="btn secondary small" id="cp">Copy outline</button>
      ${n.local ? `<a class="btn secondary small" href="${esc(n.local)}">Read this talk</a>` : ""}
    </div>
    <p class="src talk-source">Source: <a href="${esc(n.official || n.session)}" rel="noopener">Official text on ChurchofJesusChrist.org</a>${n.local ? ". The full talk is on this site." : ""} Timing follows the Church's 25-minute meeting guidance; adapt it as the Spirit directs.</p>`;
  $("handout").innerHTML = `<div class="ho-head"><div class="ho-k">${esc(m.name)}</div><h2>${esc(n.title)}</h2><p>${esc(n.speaker)} · ${esc(n.conf)} general conference</p></div>
    <h3>One core truth</h3><blockquote>${esc(P.core)}</blockquote>
    <h3>From the talk</h3><blockquote>“${esc(P.quote)}”</blockquote>
    ${P.ref ? `<h3>Scripture</h3><p>${esc(P.ref)}</p>` : ""}
    <h3>To ponder and discuss</h3><ol>${P.q.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <h3>This week</h3><p>${esc(n.invitation)}</p><p>What do I feel impressed to do? ______________________________</p>
    <p class="ho-foot">Talk text from ChurchofJesusChrist.org · Handout from sixmonthsoflight.com (not an official Church site)</p>`;
  $("p1").onclick = () => doPrint("onepage");
  $("ph").onclick = () => doPrint("handout");
  $("cp").onclick = () => navigator.clipboard.writeText([`${m.name} · 25 min`, `${n.title} · ${n.speaker}`, `One core truth: ${P.core}`, ...P.segs.map(s => `${mm(s.a)}–${mm(s.b)} ${s.k} (${s.who}): ` + s.items.map(x => x.replace(/<[^>]+>/g, "")).join(" "))].join("\n")).then(() => window.toast?.("Outline copied"));
  $("present").onclick = () => present([
    [m.present, n.title, n.speaker],
    ["2:00 · Let's ponder", n.ponder, ""], ["Read aloud", "“" + P.quote + "”", n.speaker],
    ["5:00 · One core truth", P.core, P.ref ? "Scripture: " + P.ref : ""],
    ...P.q.map((x, i) => [`Discuss · ${i + 1}`, x, i === 1 ? "Optional: share with someone nearby first." : ""]),
    ["20:00 · This week", n.invitation, "What do you feel impressed to do?"]]);
  clockWire();
}
let clkT = null;
function clockWire() {
  if (clkT) { clearInterval(clkT); clkT = null; }
  const b = $("clk"); if (!b) return;
  b.onclick = () => {
    if (clkT) { clearInterval(clkT); clkT = null; b.textContent = "▶ Start 25-min clock"; $("clkv").textContent = ""; document.querySelectorAll(".tl-seg").forEach(x => x.classList.remove("now", "done")); return; }
    const t0 = Date.now(); b.textContent = "■ Stop clock";
    const tick = () => { const sec = Math.floor((Date.now() - t0) / 1000), min = sec / 60;
      $("clkv").textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} of 25:00`;
      document.querySelectorAll(".tl-seg").forEach(x => { const a = +x.dataset.a, z = +x.dataset.b; x.classList.toggle("now", min >= a && min < z); x.classList.toggle("done", min >= z); }); };
    tick(); clkT = setInterval(tick, 1000);
  };
}
function gen() {
  const n = norm(), m = MODES[mode], out = $("out");
  setURL(`?mode=${mode}&c=${encodeURIComponent(conf)}&t=${encodeURIComponent(tid || "")}${PRINT_VIEW ? "&print=" + PRINT_VIEW : ""}`);
  if (!n) { out.innerHTML = `<p class="empty">Loading talks…</p>`; return; }
  if (m.timed) return renderTimed(n, m, mode);
  clockWire();
  const qs = m.nq ? questions(n, mode) : [], quotes = n.quotes.slice(0, mode === "eqrs" ? 3 : 2), refs = n.refs.slice(0, 8);
  const refList = refs.map(r => `<li>${esc(r)}</li>`).join("") + (n.refs.length > refs.length ? `<li class="speaker">and ${n.refs.length - refs.length} more in the official footnotes</li>` : "");
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
      ${n.local ? `<a class="btn secondary small" href="${esc(n.local)}">Read this talk</a>` : ""}
    </div>
    <p class="src talk-source">Source: <a href="${esc(n.official || n.session)}" rel="noopener">Official text on ChurchofJesusChrist.org</a>${n.local ? ". The full talk is on this site." : ""}</p>`;
  // Class-member handout: one page, big enough to read, no leader notes
  $("handout").innerHTML = `<div class="ho-head"><div class="ho-k">${esc(m.name)}</div><h2>${esc(n.title)}</h2><p>${esc(n.speaker)} · ${esc(n.conf)} general conference</p></div>
    ${quotes.length ? `<h3>Key quotes</h3>${quotes.map(q => `<blockquote>“${esc(q)}”</blockquote>`).join("")}<p class="src">${esc(n.quoteSrc)}</p>` : `<h3>Key statement</h3><blockquote>${esc(n.keyStatement)}</blockquote>`}
    ${refs.length ? `<h3>Scriptures to read</h3><p>${refs.map(r => esc(ScripRef.first(r) || r)).join(" · ")}</p>` : ""}
    ${qs.length ? `<h3>To ponder and discuss</h3><ol>${qs.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    <h3>This week</h3><p>${esc(n.invitation)}</p>
    <p class="ho-foot">Talk text from ChurchofJesusChrist.org · Handout from sixmonthsoflight.com (not an official Church site)</p>`;
  $("cp").onclick = () => navigator.clipboard.writeText(out.innerText).then(() => window.toast?.("Outline copied"));
  $("po").onclick = () => doPrint("outline");
  if ($("ph")) $("ph").onclick = () => doPrint("handout");
  $("present").onclick = () => present([
    [m.present, n.title, n.speaker], ["Let's ponder", n.ponder, ""], ["The big idea", n.big, ""],
    ...(quotes.length ? quotes.map(q => ["Read aloud", "“" + q + "”", n.speaker + (conf === "2026-10" && !OFFICIAL_TEXT() ? " (from the recap)" : "")]) : [["Key statement", n.keyStatement, n.speaker]]),
    ...(refs.length ? [["Scripture", refs.map(r => ScripRef.first(r) || r).slice(0, 3).join(" · "), "Read it together from your scriptures."]] : []),
    ...qs.slice(1).map((x, i) => [`Discuss · ${i + 1}`, x, ""]), [mode === "eqrs" ? "Counsel together" : "Activity", m.act, ""], ["This week", n.invitation, m.close]]);
}
// ---- Printing ----
// Safari (iOS and recent macOS) and Chrome on Android return from print() at once and lay out the page later, so the
// print-mode class must stay on until the print actually ends (afterprint), never be removed on a timer.
// The iOS home-screen app (standalone) ignores print() entirely, so there we open a printable copy in Safari instead.
const PRINT_KINDS = ["onepage", "handout", "outline"], PRINT_VIEW = PRINT_KINDS.includes(QS.get("print")) ? QS.get("print") : "";
const standalone = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
function setPrintMode(kind) { PRINT_KINDS.forEach(k => document.body.classList.toggle("print-" + k, k === kind)); }
function printableUrl(kind) { const u = new URL(location.href); u.searchParams.set("print", kind); return u.href; }
function printFallback(kind) {
  let d = document.getElementById("printHelp"); if (!d) { d = document.createElement("div"); d.id = "printHelp"; d.className = "print-help no-print"; d.setAttribute("role", "status"); $("out").before(d); }
  d.innerHTML = `<strong>Print didn't open?</strong> The home-screen app can't print on some iPhones. <a href="${esc(printableUrl(kind))}" target="_blank" rel="noopener">Open the printable page in Safari</a>, then tap Print (or Share → Print).`;
  d.scrollIntoView({ block: "nearest" });
}
function doPrint(kind) {
  setPrintMode(kind);
  if (standalone() && !PRINT_VIEW) { window.open(printableUrl(kind), "_blank"); printFallback(kind); return; }
  let started = false; const mark = () => { started = true; };
  addEventListener("beforeprint", mark, { once: true });
  try { window.print(); } catch (e) { printFallback(kind); return; }
  setTimeout(() => { if (!started && !matchMedia("print").matches) printFallback(kind); }, 3000);
}
addEventListener("afterprint", () => { if (!PRINT_VIEW) setPrintMode(""); });
// Printable copy (?print=onepage|handout|outline): keep that layout on for the browser's own Print and Share → Print.
if (PRINT_VIEW) {
  setPrintMode(PRINT_VIEW);
  const bar = document.createElement("div"); bar.className = "print-bar no-print";
  bar.innerHTML = `<span>Printable ${PRINT_VIEW === "onepage" ? "one-page lesson" : PRINT_VIEW}</span><button class="btn gold small" id="pvGo">Print</button><a class="btn secondary small" href="${esc(location.href.replace(/([?&])print=[^&]*&?/, "$1").replace(/[?&]$/, ""))}">Back to lesson</a>`;
  main.prepend(bar); $("pvGo").onclick = () => window.print();
  (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(() => { try { window.print(); } catch (e) {} }, 400));
}
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
  if (!conf) { const t = Library.talks.find(x => x.id === tid && !x.local); conf = t ? t.c : "2026-10"; if (!t) tid = CONF.talks[0].id; }
  $("lc").innerHTML = Library.confs.map(c => `<option value="${c.c}" ${c.c === conf ? "selected" : ""}>${esc(c.label)}${c.recap ? " (recaps)" : ""}</option>`).join("");
  talkOptions(); gen();
}).catch(() => {});
