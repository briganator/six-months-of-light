mount("builder.html", true);
// Card Builder: quotes come ONLY from verified quotes in CONF data (no free text attributed to a speaker).
const P = QS, S = CardKit.SIZES;
const st = {
  t: talkById(P.get("t")) ? P.get("t") : CONF.talk_of_the_week.talk_id, q: +(P.get("q") || 0),
  bg: CardKit.BGS[P.get("bg")] ? P.get("bg") : "rays", theme: CardKit.THEMES[P.get("theme")] ? P.get("theme") : "dusk",
  font: CardKit.FONTS[P.get("font")] ? P.get("font") : "classic", size: S[P.get("size")] ? P.get("size") : "portrait",
  anim: P.get("anim") === "1", note: "",
};
const seg = (id, opts, cur) => `<div class="seg" id="${id}">${Object.entries(opts).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === cur}">${esc(v)}</button>`).join("")}</div>`;
document.getElementById("main").innerHTML = `
  <div class="section-label">Remember</div>
  <h1 style="margin-top:0">Card Builder</h1>
  <p class="lede">Make a shareable card from a verified quote. Every card carries the Six Months of Light logo, the link and a QR code back to the talk.</p>
  <div class="builder">
    <div class="b-preview"><div class="qc-stage"><div class="qc-wrap"><canvas id="cv" aria-label="Card preview"></canvas></div></div>
      <div class="links b-actions"><button class="btn gold" id="sh">Share card</button><button class="btn secondary" id="dl">Download PNG</button><button class="btn secondary" id="replay" hidden>↻ Replay</button>
        <button class="btn secondary" id="more">More share options</button></div>
      <p class="speaker" id="hint"></p></div>
    <form class="b-controls card" onsubmit="return false">
      <label class="b-label" for="talk">1 · Talk</label>
      <select id="talk">${CONF.sessions.filter(s => CONF.talks.some(t => t.session === s.id)).map(s => `<optgroup label="${esc(s.name)}">${CONF.talks.filter(t => t.session === s.id).map(t => `<option value="${t.id}" ${t.id === st.t ? "selected" : ""}>${esc(t.speaker)} — ${esc(t.title)}</option>`).join("")}</optgroup>`).join("")}</select>
      <div class="b-label">2 · Quote <span class="b-help">verified quotes only · from recaps; confirm with official text</span></div>
      <div id="quotes" class="qpick" role="radiogroup" aria-label="Quote"></div>
      <div class="b-label">3 · Background</div>${seg("bg", CardKit.BGS, st.bg)}
      <div class="b-label">4 · Color theme</div>${seg("theme", { dusk: "Dusk", midnight: "Midnight", dawn: "Dawn" }, st.theme)}
      <div class="b-label">5 · Font style</div>${seg("font", CardKit.FONTS, st.font)}
      <div class="b-label">6 · Size</div>${seg("size", { square: "1:1", portrait: "4:5", story: "9:16" }, st.size)}
      <div class="b-label">7 · Motion</div>${seg("anim", { still: "Still", anim: "Animated" }, st.anim ? "anim" : "still")}
      <label class="b-label" for="note">8 · My takeaway <span class="b-help">optional · your own words, labeled as yours on the card</span></label>
      <input class="field" id="note" maxlength="90" placeholder="e.g. I'll look for lift every morning this week" autocomplete="off">
      <div class="count"><span id="ncnt">0</span>/90</div>
    </form>
  </div>`;
const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
const talk = () => talkById(st.t);
function renderQuotes() {
  const t = talk(); if (st.q >= t.quotes.length) st.q = 0;
  document.getElementById("quotes").innerHTML = t.quotes.map((q, i) => `<label class="qopt ${i === st.q ? "on" : ""}"><input type="radio" name="q" value="${i}" ${i === st.q ? "checked" : ""}><span>“${esc(q)}”</span></label>`).join("");
  document.querySelectorAll("#quotes input").forEach(r => r.addEventListener("change", () => { st.q = +r.value; renderQuotes(); draw(); }));
}
const cleanNote = s => s.replace(/https?:\/\/\S+|www\.\S+/gi, "").replace(/\s+/g, " ").trim().slice(0, 90);
const opts = () => { const t = talk(); return { quote: t.quotes[st.q], speaker: t.speaker, title: t.title, theme: st.theme, bg: st.bg, font: st.font, url: talkUrl(t), note: st.note || "" }; };
let raf, t0;
function render(time) { const [W, H] = S[st.size]; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } CardKit.drawCard(ctx, W, H, opts(), time); }
function play() { cancelAnimationFrame(raf); t0 = performance.now();
  const loop = now => { const s = (now - t0) / 1000; render(Math.min(s, CardKit.TL.total)); if (s < CardKit.TL.total) raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
const videoType = () => window.MediaRecorder && ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(t => MediaRecorder.isTypeSupported(t));
function draw() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("replay").hidden = !st.anim;
  const vt = videoType();
  document.getElementById("dl").textContent = st.anim ? (vt ? `Record ${vt.includes("mp4") ? "MP4" : "WebM"} video` : "Download PNG (video not supported here)") : "Download PNG";
  document.getElementById("hint").textContent = st.anim ? "10-second animation: light rises, the quote appears line by line, then it ends on the logo, link and QR code." : "";
  history.replaceState(null, "", `builder.html?t=${st.t}&q=${st.q}&bg=${st.bg}&theme=${st.theme}&font=${st.font}&size=${st.size}${st.anim ? "&anim=1" : ""}`);
  st.anim && !reduce ? play() : (cancelAnimationFrame(raf), render(Infinity));
}
window.__renderAt = s => { render(s); return true; };
document.getElementById("talk").addEventListener("change", e => { st.t = e.target.value; st.q = 0; renderQuotes(); draw(); });
["bg", "theme", "font", "size", "anim"].forEach(id => document.querySelectorAll(`#${id} button`).forEach(b => b.addEventListener("click", () => {
  st[id] = id === "anim" ? b.dataset.k === "anim" : b.dataset.k;
  document.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); })));
let nt; document.getElementById("note").addEventListener("input", e => { document.getElementById("ncnt").textContent = e.target.value.length;
  clearTimeout(nt); nt = setTimeout(() => { st.note = cleanNote(e.target.value); draw(); }, 250); });
document.getElementById("replay").addEventListener("click", play);
const fname = ext => `six-months-of-light-${slug(talk().speaker)}-${st.size}${st.anim ? "-animated" : ""}.${ext}`;
document.getElementById("dl").addEventListener("click", () => {
  const vt = videoType();
  if (!st.anim || !vt) { render(Infinity); const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = fname("png"); a.click(); if (st.anim) draw(); return; }
  const rec = new MediaRecorder(cv.captureStream(30), { mimeType: vt, videoBitsPerSecond: 8e6 }), chunks = [];
  const btn = document.getElementById("dl"); btn.disabled = true; btn.textContent = "Recording…";
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(chunks, { type: vt })); a.download = fname(vt.includes("mp4") ? "mp4" : "webm"); a.click(); btn.disabled = false; draw(); };
  rec.start(); play(); setTimeout(() => rec.stop(), CardKit.TL.total * 1000 + 250);
});
const cardFile = () => new Promise(res => { const wasAnim = st.anim; render(Infinity); cv.toBlob(b => { res(new File([b], fname("png").replace("-animated", ""), { type: "image/png" })); if (wasAnim) draw(); }, "image/png"); });
const shareArgs = async () => { const t = talk(); return { url: talkUrl(t), text: `“${t.quotes[st.q]}” — ${t.speaker}. Study the talk on Six Months of Light:`, file: await cardFile() }; };
document.getElementById("sh").addEventListener("click", async () => shareCard(await shareArgs()));
document.getElementById("more").addEventListener("click", async () => openShareSheet(await shareArgs()));
renderQuotes();
document.fonts.load('500 40px "Cormorant Garamond"').then(() => document.fonts.load('italic 500 40px "Cormorant Garamond"')).then(() => document.fonts.load('600 20px Inter')).then(draw);
