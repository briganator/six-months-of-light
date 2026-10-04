mount("subscribe.html", true);
// Keep the Light: a gentle daily or weekly reminder of conference until April, by email, phone notification or calendar.
// Everything sent comes from this site's own pages: talk recaps, verified recap quotes, insight cards and lesson helps.
const C = CONF_CONFIG, $ = id => document.getElementById(id);
const KINDS = [["talk", "A talk", "Recap and link"], ["quote", "A quote card", "A line to share"], ["insight", "An insight", "Themes at a glance"],
  ["review", "A summary", "A session or the week's themes"], ["lesson", "A lesson outline", "Family night, EQ & RS, Youth or a Sacrament talk"]];
const KIC = { talk: '<path d="M4 5.5C6.5 4 9.5 4 12 5.8 14.5 4 17.5 4 20 5.5V19c-2.5-1.4-5.5-1.4-8 .4-2.5-1.8-5.5-1.8-8-.4zM12 5.8v13.6"/>', quote: '<path d="M5 18c0-4 1-7 5-9M14 18c0-4 1-7 5-9"/><circle cx="7" cy="16" r="2.2"/><circle cx="16" cy="16" r="2.2"/>',
  insight: '<path d="M5 20V11M10 20V6M15 20v-7M20 20V9M3 20h18"/>', review: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/>',
  lesson: '<path d="M3 5h18v11H3zM8 20l4-4 4 4"/><path d="M7 9h6M7 12h9"/>' };
const kic = k => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${KIC[k]}</svg>`;
const MODES = [["fhe", "Family night"], ["eqrs", "Elders Quorum & Relief Society"], ["youth", "Youth"], ["talk", "Sacrament talk"]];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const saved = Store.get("get-a-talk", null);
const P = (() => { const q = new URLSearchParams(location.search), has = q.has("k");
  const b = has ? { f: q.get("f"), d: +q.get("d") || 0, k: (q.get("k") || "").split(","), lm: (q.get("lm") || "").split(","), s: q.get("s"), tp: q.get("tp") || "", sp: q.get("sp") || "", h: +(q.get("h") ?? 7) } : saved || {};
  return { f: b.f === "weekly" ? "weekly" : "daily", d: b.d ?? 0, k: (b.k || ["talk"]).filter(k => KINDS.some(x => x[0] === k)), lm: (b.lm || []).filter(m => MODES.some(x => x[0] === m)), s: b.s === "all" ? "all" : "oct", tp: b.tp || "", sp: b.sp || "", h: Number.isFinite(b.h) ? b.h : 7 }; })();
if (!P.k.length) P.k = ["talk"];
const hourLabel = h => new Date(2026, 0, 1, h).toLocaleTimeString([], { hour: "numeric" });
const qs = () => { const o = { f: P.f, k: P.k.join(","), s: P.s, h: P.h }; if (P.f === "weekly") o.d = P.d; if (P.k.includes("lesson")) o.lm = (P.lm.length ? P.lm : ["fhe"]).join(","); if (P.tp) o.tp = P.tp; if (P.sp) o.sp = P.sp; return new URLSearchParams(o).toString(); };
const feed = () => `${C.feedUrl}?${qs()}`;
const summary = () => `${P.f === "daily" ? "Every day" : "Every " + new Date(2026, 9, 4 + P.d).toLocaleDateString([], { weekday: "long" })} at ${hourLabel(P.h)}`;
const flash = { confirmed: "You're subscribed. Your first email arrives at the time you chose.", stopped: "Done. You won't get any more emails from us.", "link-used": "That link was already used or has expired.", }[new URLSearchParams(location.search).get("email")];

const main = $("main");
const HOW0 = Store.get("keep-how", C.emailOpen ? "email" : "push");
main.innerHTML = `
  <section class="keep-hero">
    <span class="kh-ic">${KEEP_ICON(34)}</span>
    <h1>Keep the Light</h1>
    <p class="kh-lede">A gentle reminder of conference, daily or weekly, until April.</p>
    <p class="kh-sub">Choose what you'd like (an insight, a talk, a quote card, a summary or a lesson outline) and get it by email, on your phone or in your calendar.</p>
  </section>
  ${flash ? `<div class="notice" role="status">${esc(flash)}</div>` : ""}
  <section class="sub-card" aria-labelledby="s1"><h2 id="s1"><span class="sub-n">1</span>What would you like?</h2>
    <p class="sub-hint">Pick one or more. We'll take turns.</p>
    <div class="sub-kinds" role="group" aria-label="What would you like?">${KINDS.map(([k, t, d]) => `<label class="sub-kind sk-${k}"><input type="checkbox" value="${k}" ${P.k.includes(k) ? "checked" : ""}><span class="sk-ic">${kic(k)}</span><span class="sk-t"><strong>${t}</strong><small>${d}</small></span><span class="sk-check" aria-hidden="true"></span></label>`).join("")}</div>
    <div id="lmw" class="sub-lm" ${P.k.includes("lesson") ? "" : "hidden"}><p class="sub-hint">Lesson outline for</p>
      <div class="seg" id="lm" role="group" aria-label="Lesson outline for">${MODES.map(([k, t]) => `<button type="button" data-k="${k}" aria-pressed="${(P.lm.length ? P.lm : ["fhe"]).includes(k)}">${t}</button>`).join("")}</div></div>
  </section>
  <section class="sub-card" aria-labelledby="s2"><h2 id="s2"><span class="sub-n">2</span>How often?</h2>
    <div class="seg seg-wide" id="freq" role="group" aria-label="How often"><button type="button" data-k="daily" aria-pressed="${P.f === "daily"}">Every day</button><button type="button" data-k="weekly" aria-pressed="${P.f === "weekly"}">Once a week</button></div>
    <div class="seg seg-days" id="day" role="group" aria-label="Which day" ${P.f === "weekly" ? "" : "hidden"}>${DAYS.map((d, i) => `<button type="button" data-k="${i}" aria-pressed="${P.d === i}">${d}</button>`).join("")}</div>
    <label class="sub-time"><span>at</span><select id="hour" aria-label="Time of day">${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${P.h === h ? "selected" : ""}>${hourLabel(h)}</option>`).join("")}</select><span class="sub-hint" style="margin:0">your time</span></label>
    <details class="sub-more" ${P.tp || P.sp || P.s === "all" ? "open" : ""}><summary>Narrow it down <span>optional · topic, speaker, past conferences</span></summary>
      <div class="seg" id="scope" role="group" aria-label="Talks from"><button type="button" data-k="oct" aria-pressed="${P.s === "oct"}">This conference</button><button type="button" data-k="all" aria-pressed="${P.s === "all"}">All since 2015</button></div>
      <div class="sub-row">
        <label><span class="sub-hint">Topic</span><select id="tp"><option value="">Any topic</option>${THEMES3.list.filter(t => t.slug !== "all").map(t => `<option value="${t.slug}" ${P.tp === t.slug ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
        <label><span class="sub-hint">Favorite speaker</span><select id="sp"><option value="">Any speaker</option></select></label>
      </div>
      <p class="sub-hint" id="focusNote">Quote cards, insights and summaries come from October 2026. Talks and lesson outlines can come from any conference.</p>
    </details>
  </section>
  <section class="sub-preview" aria-live="polite"><div class="sp-k">Your first reminder</div><div id="pv"><p class="empty">Loading a preview…</p></div></section>
  <section class="sub-card" aria-labelledby="s4"><h2 id="s4"><span class="sub-n">3</span>How should it reach you?</h2><p class="sub-hint" id="sumline"></p>
    <div class="sub-tabs" role="tablist" aria-label="How should it reach you?">
      ${[["email", "Email"], ["push", "Phone"], ["cal", "Calendar"]].map(([k, t]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="w-${k}" aria-selected="${HOW0 === k}">${t}</button>`).join("")}</div>
    <div class="sub-ways">
      <article class="sub-way" id="w-email" role="tabpanel" aria-labelledby="tab-email" ${HOW0 === "email" ? "" : "hidden"}><div id="mailBox"></div></article>
      <article class="sub-way" id="w-push" role="tabpanel" aria-labelledby="tab-push" ${HOW0 === "push" ? "" : "hidden"}><div id="pushBox"></div></article>
      <article class="sub-way" id="w-cal" role="tabpanel" aria-labelledby="tab-cal" ${HOW0 === "cal" ? "" : "hidden"}><p>Each reminder shows up as an event with the full item in its notes and a link to open it. Your calendar keeps it up to date.</p>
        <div class="links"><a class="btn gold small" id="calApple">Apple / iPhone</a><a class="btn secondary small" id="calGoogle" target="_blank" rel="noopener">Google</a><a class="btn secondary small" id="calOutlook" target="_blank" rel="noopener">Outlook</a><button class="btn secondary small" id="calCopy" type="button">Copy link</button></div>
        <p class="sub-hint">Your choices live in the link itself; nothing about you is stored. To stop, remove the calendar.</p></article>
    </div>
  </section>
  <p class="sub-hint sub-foot">What we keep and why: <a href="privacy.html">Privacy</a>. Everything links back to this site and ChurchofJesusChrist.org. Not an official Church site.</p>`;
document.querySelector(".sub-tabs").addEventListener("click", e => { const b = e.target.closest("[role=tab]"); if (!b) return; const k = b.id.slice(4);
  document.querySelectorAll(".sub-tabs [role=tab]").forEach(x => x.setAttribute("aria-selected", x === b)); document.querySelectorAll(".sub-way").forEach(x => x.hidden = x.id !== "w-" + k); Store.set("keep-how", k); });
const keepOn = how => Store.set("keep-on", { how, at: Date.now() });

// ---- choices ----
function speakers() {
  const sel = $("sp"), cur = P.sp;
  let list = CONF.talks.map(t => ({ sp: slug(t.speaker), s: t.speaker }));
  if (P.s === "all" && window.Library) list = list.concat(Library.speakers.map(x => ({ sp: x.sp, s: x.s })));
  const seen = new Set(); list = list.filter(x => !seen.has(x.sp) && seen.add(x.sp)).sort((a, b) => a.s.replace(/^(President|Elder|Sister|Bishop|Brother) /, "").split(" ").pop().localeCompare(b.s.replace(/^(President|Elder|Sister|Bishop|Brother) /, "").split(" ").pop()));
  sel.innerHTML = `<option value="">Any speaker</option>` + list.map(x => `<option value="${esc(x.sp)}" ${x.sp === cur ? "selected" : ""}>${esc(x.s)}</option>`).join("");
  if (cur && !list.some(x => x.sp === cur)) P.sp = "";
}
let libLoading = null;
const loadLibrary = () => libLoading || (libLoading = ["assets/library-data.js", "assets/library.js"].reduce((p, src) => p.then(() => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.body.appendChild(s); })), Promise.resolve()));
const segPick = (id, multi, fn) => $(id).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return;
  if (multi) { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); if (![...$(id).querySelectorAll("button")].some(x => x.getAttribute("aria-pressed") === "true")) b.setAttribute("aria-pressed", "true"); }
  else $(id).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
  fn(b.dataset.k); changed(); });
document.querySelector(".sub-kinds").addEventListener("change", e => { const boxes = [...document.querySelectorAll(".sub-kinds input")];
  if (!boxes.some(x => x.checked)) e.target.checked = true;
  P.k = boxes.filter(x => x.checked).map(x => x.value); $("lmw").hidden = !P.k.includes("lesson"); changed(); });
segPick("lm", true, () => { P.lm = [...$("lm").querySelectorAll("button[aria-pressed=true]")].map(b => b.dataset.k); });
segPick("scope", false, k => { P.s = k; if (k === "all") loadLibrary().then(() => { speakers(); }).catch(() => {}); else speakers(); });
segPick("freq", false, k => { P.f = k; $("day").hidden = k !== "weekly"; });
segPick("day", false, k => { P.d = +k; });
$("tp").onchange = e => { P.tp = e.target.value; changed(); };
$("sp").onchange = e => { P.sp = e.target.value; changed(); };
$("hour").onchange = e => { P.h = +e.target.value; changed(); };
speakers(); if (P.s === "all") loadLibrary().then(speakers).catch(() => {});

// ---- preview (the same item the calendar, notification and email would carry) ----
let pvT, pvN = 0;
function preview() {
  clearTimeout(pvT); pvT = setTimeout(async () => { const n = ++pvN;
    const today = new Date(), first = new Date(Math.max(Date.UTC(2026, 9, 5), Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
    if (P.f === "weekly") while (first.getUTCDay() !== P.d) first.setUTCDate(first.getUTCDate() + 1);
    try { const r = await fetch(`${feed()}&fmt=json&date=${first.toISOString().slice(0, 10)}`); const it = await r.json(); if (n !== pvN) return;
      $("pv").innerHTML = `<p class="sub-pv-when">${esc(first.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }))} · ${esc(hourLabel(P.h))}</p>
        <div class="sub-pv">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<div><div class="sp-label">${esc(it.label)}</div><h3>${esc(it.title)}</h3><p class="speaker">${esc(it.text)}</p>
        <p>${esc((it.lines[0] || "").slice(0, 260))}${(it.lines[0] || "").length > 260 ? "…" : ""}</p><a class="txt-link" href="${esc(it.url.replace("https://sixmonthsoflight.com/", ""))}">Open →</a></div></div>`;
    } catch { if (n === pvN) $("pv").innerHTML = `<p class="empty">Preview isn't available right now, but your choices are saved.</p>`; }
  }, 250);
}

// ---- calendar ----
function calendar() {
  const https = feed(), webcal = https.replace(/^https:/, "webcal:");
  $("calApple").href = webcal; ["calApple", "calGoogle", "calOutlook"].forEach(id => $(id).onclick = () => keepOn("calendar reminder"));
  $("calGoogle").href = "https://calendar.google.com/calendar/render?cid=" + encodeURIComponent(webcal);
  $("calOutlook").href = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent("Six Months of Light")}`;
  $("calCopy").onclick = () => navigator.clipboard.writeText(https).then(() => window.toast?.("Calendar link copied. Paste it into “Subscribe to calendar” or “From URL”."));
}

// ---- web push ----
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const PUSH_OK = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const b64 = s => Uint8Array.from(atob((s + "===".slice((s.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const api = (fn, body) => fetch(`${C.supabaseUrl}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: C.supabaseKey, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error("Network error (" + r.status + ")"); return r.json(); });
const prefsObj = () => Object.fromEntries(new URLSearchParams(qs()));
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
let pushSub = null, pushSaved = null;
async function currentSub() { if (!PUSH_OK) return null; const reg = await navigator.serviceWorker.getRegistration("./"); return reg ? reg.pushManager.getSubscription() : null; }
async function pushUI() {
  const box = $("pushBox");
  if (IOS && !STANDALONE) { box.innerHTML = `<p>On iPhone and iPad, notifications work from the Home Screen app:</p>
    <ol class="sub-ios"><li>Tap <strong>Share</strong> <span aria-hidden="true">⬆︎</span> in Safari.</li><li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li><li>Open <strong>Six Months of Light</strong> from your Home Screen, come back to <strong>Keep the Light</strong> and tap <strong>Turn on phone reminders</strong>.</li></ol>
    <p class="src">Needs iOS 16.4 or later. Or use the calendar option above; it works everywhere.</p>`; return; }
  if (!PUSH_OK) { box.innerHTML = `<p>This browser can't show notifications from websites. The calendar option works everywhere.</p>`; return; }
  if (Notification.permission === "denied") { box.innerHTML = `<p>Notifications are blocked for this site. Allow them in your browser's site settings, then reload this page.</p>`; return; }
  pushSub = await currentSub().catch(() => null);
  pushSaved = pushSub ? await api("push_status", { p_endpoint: pushSub.endpoint }).catch(() => null) : null;
  if (pushSub && pushSaved) {
    const norm = o => JSON.stringify([o.f === "weekly" ? "weekly" : "daily", o.f === "weekly" ? String(o.d ?? 0) : "", o.k || "talk", String(o.k || "").includes("lesson") ? (o.lm || "fhe") : "", o.s === "all" ? "all" : "oct", o.tp || "", o.sp || "", String(o.h)]);
    const same = norm(prefsObj()) === norm(Object.assign({}, pushSaved.prefs || {}, { h: pushSaved.hour }));
    box.innerHTML = `<p class="sub-on"><span aria-hidden="true">✓</span> Reminders are on for this device.</p>
      <div class="links">${same ? "" : `<button class="btn gold small" id="pushSave" type="button">Use these new choices</button>`}<button class="btn secondary small" id="pushTest" type="button">Send one now</button><button class="btn secondary small" id="pushOff" type="button">Stop notifications</button></div>
      <p class="src">${same ? "Sending with the choices above." : "You've changed your choices; tap “Use these new choices” to update."}</p>`;
    $("pushOff").onclick = pushOff; $("pushTest").onclick = pushTest; if ($("pushSave")) $("pushSave").onclick = pushOn;
  } else {
    box.innerHTML = `<p>A notification at the time you chose, with the item and a link to open it. Stop any time with one tap.</p>
      <div class="links"><button class="btn gold small" id="pushOn" type="button">Turn on phone reminders</button></div>`;
    $("pushOn").onclick = pushOn;
  }
}
async function pushOn() {
  const btn = $("pushOn") || $("pushSave"); if (btn) { btn.disabled = true; btn.textContent = "Turning on…"; }
  try {
    const reg = await navigator.serviceWorker.register("sw.js", { scope: "./" });
    const perm = await Notification.requestPermission(); if (perm !== "granted") throw new Error("Notifications weren't allowed.");
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(C.vapidPublicKey) });
    const j = sub.toJSON();
    await api("push_subscribe", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_prefs: prefsObj(), p_tz: tz(), p_hour: P.h });
    keepOn("phone reminder"); window.toast?.(`Reminders on. ${summary()}.`);
  } catch (e) { window.toast?.(e.message || "Couldn't turn on notifications."); }
  pushUI();
}
async function pushOff() {
  try { const sub = await currentSub(); if (sub) { await api("push_unsubscribe", { p_endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); } if ((Store.get("keep-on", {}) || {}).how === "phone reminder") localStorage.removeItem("conf-my-keep-on"); window.toast?.("Notifications stopped."); }
  catch { window.toast?.("Couldn't stop notifications; try again."); }
  pushUI();
}
async function pushTest() {
  const b = $("pushTest"); b.disabled = true; b.textContent = "Sending…";
  try { const r = await fetch(C.deliverUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", endpoint: pushSub.endpoint }) }).then(r => r.json());
    window.toast?.(r.ok ? "Sent. It should appear in a few seconds." : (r.error || "Couldn't send right now.")); }
  catch { window.toast?.("Couldn't send right now."); }
  b.disabled = false; b.textContent = "Send one now";
}

// ---- email (opens once sending is set up) ----
function mailUI() {
  const box = $("mailBox");
  if (!C.emailOpen) { box.innerHTML = `<p>Coming soon: the same choices by email, with the card image, a link to the talk and a short question to ponder. Every email has a one-click unsubscribe.</p><p class="src">Calendar and phone notifications work today.</p>`; return; }
  box.innerHTML = `<p>Your reminder arrives with the card image, a link and a short question to ponder. We'll send a confirmation link first, and every email has a one-click unsubscribe.</p>
    <form id="mailForm" class="sub-mail"><label class="sr-only" for="em">Email address</label><input id="em" type="email" autocomplete="email" required placeholder="you@example.com"><button class="btn gold small">Send me reminders</button></form><p class="src" id="mailMsg"></p>`;
  $("mailForm").onsubmit = async e => { e.preventDefault(); const msg = $("mailMsg"); msg.textContent = "Sending…";
    try { const r = await fetch(C.deliverUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "email_subscribe", email: $("em").value, prefs: prefsObj(), tz: tz(), hour: P.h }) }).then(r => r.json());
      if (r.ok) keepOn("email reminder"); msg.textContent = r.already ? "You're already subscribed. Use “Change what you get” in any email to update." : r.ok ? "Check your inbox and tap the confirmation link." : (r.error || "Something went wrong."); }
    catch { msg.textContent = "Something went wrong; please try again."; } };
}

function changed() {
  Store.set("get-a-talk", { ...P, lm: P.k.includes("lesson") ? (P.lm.length ? P.lm : ["fhe"]) : [] });
  $("sumline").textContent = `${summary()}: ${P.k.map(k => KINDS.find(x => x[0] === k)[1].replace(/^An? /, "")).join(", ")}${P.k.length > 1 ? ", taking turns" : ""}.`;
  calendar(); preview(); if (pushSub && pushSaved) pushUI();
}
changed(); pushUI(); mailUI();
