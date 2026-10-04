mount("live.html", true);
// "Heard it live": during a live session, make a card from a line you just heard. The card is drawn on this device
// and labeled "As heard live" (not verified text). Posting to the Live wall is optional and moderated before it shows.
document.body.classList.add("live-page");
const K = CardKit, $ = id => document.getElementById(id);
const sess = LIVE.now(), nxt = LIVE.next();
let lastSess = sess || [...CONF.sessions].reverse().find(s => CONF.talks.some(t => t.session === s.id)) || CONF.sessions[0];
let sTalks = CONF.talks.filter(t => t.session === (sess || lastSess).id);
const LOOKS = ["sunrise", "mountains", "morning", "aurora", "night", "temple_dusk"].filter(k => K.LOOKS[k]);
const MAX = 220, BAD = /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|dick|pussy|asshole\w*|bastard\w*|damn\w*|whore\w*|slut\w*|nigg\w*|fag\w*|retard\w*)\b/i;
const st = { mode: "still", sp: "", talk: null, line: "", look: LOOKS[0], size: matchMedia("(max-width: 899px)").matches ? "story" : "portrait" };
const fmtT = d => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" }) + " MT";
document.getElementById("main").innerHTML = `
  <section class="live-top">
    <p class="hl-on">${sess ? `<span class="live-dot" aria-hidden="true"></span>Live now · ${esc(sess.name)}` : nxt ? `Next session: ${esc(nxt.s.name)} at ${fmtT(nxt.at)}` : "Conference sessions are over"}</p>
    <h1 class="live-h">Heard it live</h1>
    <p class="b-help">Share a line you just heard. Your card is made on this phone right away and marked <b>“As heard live”</b>, so friends know it's not the official text. <a href="${LIVE_WATCH}" target="_blank" rel="noopener">Watch on churchofjesuschrist.org ↗</a></p>
  </section>
  <div class="live-grid">
    <form class="live-form" id="lf" autocomplete="off" onsubmit="return false">
      <label class="b-label" for="sp"><span class="stepn">1</span> Who said it?</label>
      <div class="live-sp" id="spChips" role="group" aria-label="Speakers in ${esc((sess || lastSess).name)}"></div>
      <input class="field" id="sp" maxlength="60" list="spList" placeholder="Speaker's name, e.g. Elder …" aria-label="Speaker's name" enterkeyhint="next">
      <datalist id="spList"></datalist>
      <p class="b-help">Not sure? Leave it blank and the card says “Speaker”.</p>
      <label class="b-label" for="line"><span class="stepn">2</span> The line you heard <span class="b-help" id="cnt">0/${MAX}</span></label>
      <textarea class="field live-line" id="line" maxlength="${MAX}" rows="3" placeholder="Type or paste the words you heard"></textarea>
      <p class="msg err" id="err" role="alert"></p>
      <div class="b-label"><span class="stepn">3</span> Pick a look</div>
      <div class="live-looks" role="group" aria-label="Card look">${LOOKS.map(k => `<button type="button" class="look" data-look="${k}" aria-pressed="${k === st.look}" aria-label="${esc(K.LOOKS[k].name)}"><canvas width="60" height="80" data-thumb="${k}"></canvas></button>`).join("")}
        <div class="seg live-size" role="group" aria-label="Card size">${[["story", "Story"], ["portrait", "Post"]].map(([k, v]) => `<button type="button" data-size="${k}" aria-pressed="${k === st.size}">${v}</button>`).join("")}</div></div>
      <input type="text" id="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
    </form>
    <div class="live-prev"><canvas id="cv" width="1080" height="1920" role="img" aria-label="Card preview"></canvas>
      <div class="live-btns"><div class="seg st-mode live-mode" id="shMode" role="group" aria-label="Share as"><button type="button" data-k="still" aria-pressed="true">Still</button><button type="button" data-k="anim" aria-pressed="false">Animated</button></div><button type="button" class="btn gold big" id="share">Share card</button><button type="button" class="btn secondary" id="wall">Post to the Live wall</button></div>
      <p class="b-help" id="status" role="status">Cards are made on your device. The Live wall is reviewed before anything appears.</p></div>
  </div>
  <section class="card live-wall" id="wallSec"><h2>Live wall</h2><p class="b-help">Lines people heard, reviewed before they appear. As heard live, not verified text; check the official talk when it's posted.</p><div id="wallList"><p class="empty">Loading…</p></div></section>
  <section class="card" id="sessTalks" hidden></section>`;
function renderSession() {
  const chips = $("spChips"), cur = st.talk, ses = sess || lastSess;
  chips.innerHTML = sTalks.map(t => `<button type="button" class="chip" data-t="${esc(t.id)}" aria-pressed="${t.id === cur}">${esc(t.speaker)}</button>`).join("");
  chips.hidden = !sTalks.length; $("sp").placeholder = sTalks.length ? "Or type a name" : "Speaker's name, e.g. Elder …";
  $("spList").innerHTML = [...new Set(CONF.talks.map(t => t.speaker))].sort().map(s => `<option value="${esc(s)}">`).join("");
  const box = $("sessTalks"); box.hidden = !sTalks.length;
  box.innerHTML = sTalks.length ? `<h2>${esc(ses.name)}: talks so far</h2>${sess ? `<p class="b-help">Added as the official speaker list and recaps come in. Most recent: <b>${esc(sTalks[sTalks.length - 1].speaker)}</b>.</p>` : ""}
    <ol class="lib-list">${sTalks.map(t => `<li><a class="lib-talk" href="${talkUrl(t)}"><span class="lt-title">${esc(t.title)}</span><span class="lt-meta">${esc(t.speaker)}</span></a></li>`).join("")}</ol>` : ""; }
renderSession();
// The live-updates routine adds talks to data.js during the day: pick them up without a reload.
async function refreshTalks() { try { const r = await fetch("assets/data.js?ts=" + Date.now(), { cache: "no-store" }); if (!r.ok) return;
  const txt = await r.text(), a = txt.indexOf("{"), b = txt.lastIndexOf("}"); const C = JSON.parse(txt.slice(a, b + 1));
  const known = new Set(CONF.talks.map(t => t.id)); const added = C.talks.filter(t => !known.has(t.id)); if (!added.length) return;
  CONF.talks.push(...added); if (!sess) lastSess = [...CONF.sessions].reverse().find(s => CONF.talks.some(t => t.session === s.id)) || lastSess;
  sTalks = CONF.talks.filter(t => t.session === (sess || lastSess).id); renderSession(); } catch (e) {} }
setInterval(() => { if (!document.hidden) refreshTalks(); }, 120000);
window.__liveRefresh = refreshTalks;
document.querySelectorAll("canvas[data-thumb]").forEach(c => K.drawThumb(c.getContext("2d"), c.width, c.height, c.dataset.thumb, "gold"));
const cv = $("cv"), ctx = cv.getContext("2d");
const clean = s => s.replace(/\s+/g, " ").replace(/^["“”']+|["“”']+$/g, "").trim();
const speaker = () => clean($("sp").value) || "Speaker";
const opts = () => ({ kind: "quote", layout: "classic", look: st.look, palette: "gold", font: "classic", align: "center", anim: "fade", fmt: {},
  quote: clean(st.line) || "Type the line you heard…", speaker: "As heard live · " + speaker(), title: "October 2026 General Conference", url: CONF.site_url + "live.html", foot: "As heard live, not verified text" });
const problem = () => { const l = clean(st.line); if (l.length < 8) return "Type the line you heard (at least a few words)."; if (BAD.test(l + " " + $("sp").value)) return "Please keep it clean."; if (/(https?:\/\/|www\.)/i.test(l)) return "Links can't go on a card."; return ""; };
let file = null, pt, vfile = null, vjob = null, vT, raf, t0 = performance.now();
const reduceMo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const loop = now => { const [W, H] = K.SIZES[st.size]; K.drawCard(ctx, W, H, opts(), ((now - t0) / 1000) % K.TL.total); raf = requestAnimationFrame(loop); };
function draw() { const [W, H] = K.SIZES[st.size]; cv.width = W; cv.height = H; cancelAnimationFrame(raf); K.drawCard(ctx, W, H, opts(), Infinity);
  if (st.mode === "anim" && !reduceMo) { t0 = performance.now(); raf = requestAnimationFrame(loop); }
  file = null; vfile = null; if (vjob) { vjob.ac.abort(); vjob = null; } clearTimeout(pt); clearTimeout(vT);
  pt = setTimeout(() => { if (problem()) return; const c = document.createElement("canvas"); c.width = W; c.height = H; K.drawCard(c.getContext("2d"), W, H, opts(), Infinity);
    c.toBlob(b => { file = new File([b], `six-months-of-light-heard-live-${slug(speaker()) || "speaker"}.png`, { type: "image/png" }); }, "image/png"); }, 300);
  if (st.mode === "anim") vT = setTimeout(async () => { if (!problem() && await VideoKit.fast(W, H)) makeVid().catch(() => {}); }, 2000); }
// Animated: an 8-second looping MP4 made on this phone (pre-made in the background so Share is instant)
function makeVid(onP) { if (vfile) return Promise.resolve(vfile); if (vjob) { if (onP) vjob.onP = onP; return vjob.p; }
  const o = opts(), [W, H] = K.SIZES[st.size], ac = new AbortController(), job = { ac, onP };
  job.p = VideoKit.make({ W, H, draw: (c, w, h, t) => K.drawCard(c, w, h, o, t), onProgress: p => job.onP && job.onP(p), signal: ac.signal })
    .then(b => { if (vjob !== job) throw new DOMException("stale", "AbortError"); vfile = new File([b], `six-months-of-light-heard-live-${slug(speaker()) || "speaker"}.${VideoKit.ext(b)}`, { type: b.type }); window.__video = { name: vfile.name, type: vfile.type, size: vfile.size }; return vfile; })
    .finally(() => { if (vjob === job) vjob = null; });
  vjob = job; return job.p; }
const setMode = m => { st.mode = m; $("shMode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === m)); $("share").textContent = m === "anim" ? "Share video" : "Share card"; draw(); };
$("shMode").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (b) setMode(b.dataset.k); });
$("spChips").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; const on = b.getAttribute("aria-pressed") !== "true";
  document.querySelectorAll("#spChips .chip").forEach(x => x.setAttribute("aria-pressed", x === b && on)); st.talk = on ? b.dataset.t : null; $("sp").value = on ? b.textContent : ""; draw(); });
$("sp").addEventListener("input", () => { const t = sTalks.find(x => x.speaker === $("sp").value.trim()); st.talk = t ? t.id : null; document.querySelectorAll("#spChips .chip").forEach(x => x.setAttribute("aria-pressed", !!t && x.dataset.t === t.id)); draw(); });
$("line").addEventListener("input", e => { st.line = e.target.value; $("cnt").textContent = `${e.target.value.length}/${MAX}`; $("err").textContent = ""; draw(); });
document.querySelector(".live-looks").addEventListener("click", e => { const l = e.target.closest("[data-look]"), z = e.target.closest("[data-size]");
  if (l) { st.look = l.dataset.look; document.querySelectorAll("[data-look]").forEach(x => x.setAttribute("aria-pressed", x === l)); }
  if (z) { st.size = z.dataset.size; document.querySelectorAll("[data-size]").forEach(x => x.setAttribute("aria-pressed", x === z)); } if (l || z) draw(); });
const say = m => { $("status").innerHTML = m; };
const canShare = f => !!(navigator.canShare && (() => { try { return navigator.canShare({ files: [f] }); } catch (e) { return false; } })());
const saveFile = f => { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
async function shareFile(f) { window.__lastShare = { files: [{ name: f.name, type: f.type, size: f.size }] };
  if (canShare(f)) { try { await navigator.share({ files: [f] }); say(f.type.startsWith("video") ? "Video shared ✓" : "Card shared ✓"); return; }
    catch (e) { if (e && e.name === "AbortError") return; if (e && e.name === "NotAllowedError") return tapToShare(f); } }
  saveFile(f); say(f.type.startsWith("video") ? "Video saved to your device ✓ Post it from your photos or files." : "Card saved to your device ✓ Post it anywhere."); }
function tapToShare(f) { say(`<b>Your video is ready, tap to share.</b> <button type="button" class="btn gold small" id="tapShare">Share video</button>`);
  $("tapShare").onclick = () => shareFile(f); $("tapShare").focus(); }
$("share").addEventListener("click", async () => { const p = problem(); if (p) { $("err").textContent = p; $("line").focus(); return; }
  if (st.mode === "anim") { const [W, H] = K.SIZES[st.size];
    if (vfile) return shareFile(vfile);
    if (await VideoKit.supported(W, H)) { const ui = VideoKit.progress(document.querySelector(".live-prev")), t0 = performance.now(); $("share").disabled = true;
      try { const f = await makeVid(x => ui.set(x)); ui.done(); return performance.now() - t0 > 3000 ? tapToShare(f) : shareFile(f); }
      catch (e) { ui.done(); if (e && e.name === "AbortError") return; say("Couldn't make the video here, so here's the still card."); }
      finally { $("share").disabled = false; } } }
  const f = file || await new Promise(r => cv.toBlob(b => r(new File([b], "six-months-of-light-heard-live.png", { type: "image/png" })), "image/png"));
  shareFile(f); });
$("wall").addEventListener("click", async () => { const p = problem(); if (p) { $("err").textContent = p; return; }
  const sid = (sess || lastSess).id; $("wall").disabled = true; say("Sending…");
  const r = await ConfAPI.liveSubmit(sid, st.talk, speaker(), clean(st.line), $("website").value).catch(e => ({ ok: false, error: e.message }));
  $("wall").disabled = false; say(r.ok ? "Thanks! Your line will appear on the Live wall after a quick review." : esc(r.error || "Could not send. Your card still works."));
  if (r.ok) $("wall").textContent = "Sent for review ✓"; });
async function loadWall() { if (!ConfAPI.liveApproved) { $("wallList").innerHTML = `<p class="empty">The Live wall isn't available in preview mode.</p>`; return; }
  try { const rows = await ConfAPI.liveApproved(); if (!rows.length) { $("wallList").innerHTML = `<p class="empty">No lines yet. Be the first: share what you heard above.</p>`; return; }
    const g = new Map(); rows.forEach(r => { const t = r.talk_id && talkById(r.talk_id), k = t ? t.id : "sp:" + r.speaker.toLowerCase(); const x = g.get(k) || { t, sp: t ? t.speaker : r.speaker, ses: r.session_id, rows: [] }; x.rows.push(r); g.set(k, x); });
    $("wallList").innerHTML = [...g.values()].map(x => `<div class="lw-group"><h3>${esc(x.sp)}${x.t ? ` · <a href="${talkUrl(x.t)}">${esc(x.t.title)}</a>` : ""} <small>${esc((CONF.sessions.find(s => s.id === x.ses) || {}).name || "")}</small></h3>
      <ul>${x.rows.map(r => `<li>“${esc(r.body)}”</li>`).join("")}</ul></div>`).join("");
  } catch (e) { $("wallList").innerHTML = `<p class="empty">Couldn't load the Live wall right now.</p>`; } }
loadWall(); if (sess) setInterval(() => { if (!document.hidden) loadWall(); }, 60000);
document.fonts.ready.then(draw); draw();
VideoKit.fast(...K.SIZES[st.size]).then(ok => { if (ok) setMode("anim"); });
