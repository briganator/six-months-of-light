mount("builder.html", true);
// Card Studio. Quotes come ONLY from verified quotes in CONF data; insight cards only from computed recap data.
document.body.classList.add("studio-page");
const P = QS, K = CardKit, S = K.SIZES, L = K.LOOKS;
const ALLQ = INSIGHTS.ALLQ, isPhone = matchMedia("(max-width: 899px)").matches;
const st = {
  ins: INSIGHTS.get(P.get("ins")) ? P.get("ins") : null,
  t: talkById(P.get("t")) ? P.get("t") : CONF.talk_of_the_week.talk_id, q: +(P.get("q") || 0),
  look: L[P.get("look")] ? P.get("look") : "sunrise", pal: K.PALETTES[P.get("pal")] ? P.get("pal") : "gold",
  font: K.FONTS[P.get("font")] ? P.get("font") : "classic", align: P.get("align") === "left" ? "left" : "center",
  size: S[P.get("size")] ? P.get("size") : (isPhone ? "story" : "portrait"), ov: P.has("ov") ? Math.min(.85, Math.max(0, +P.get("ov") / 100)) : null,
  anim: P.get("anim") === "1", note: "", tab: ["quote", "look", "size", "text"].includes(P.get("tab")) ? P.get("tab") : (P.has("t") ? "look" : "quote"), src: P.get("ins") ? "ins" : "quote", filter: "", theme: "",
};
if (!P.has("t") && !P.has("ins")) { const d = INSIGHTS.daily; st.t = d.t.id; st.q = d.i; }
const seg = (id, opts, cur, label) => `<div class="seg" id="${id}" role="group" aria-label="${label}">${Object.entries(opts).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === cur}">${esc(v)}</button>`).join("")}</div>`;
const groups = [...new Set(Object.values(L).map(l => l.group))];
const themeChips = Object.keys(THEMES).filter(n => ALLQ.some(x => talkThemes(x.t).includes(n)));
document.getElementById("main").innerHTML = `
  <h1 class="st-title">Card Studio <span>Pick a quote · style it · share</span></h1>
  <div class="studio">
    <div class="st-preview" id="stPrev">
      <div class="st-canvas"><canvas id="cv" role="img" aria-label="Card preview" width="${S[st.size][0]}" height="${S[st.size][1]}"></canvas></div>
      <div class="st-actions" id="actions">
        <div class="st-ready" id="ready" role="status"><span class="dot"></span><span id="readyTxt">Your card is ready. Tap <b>Share</b>.</span>
          <button type="button" class="linkish" id="igBtn" aria-expanded="false" aria-controls="igTip">Instagram Stories?</button></div>
        <div class="st-tip" id="igTip" hidden><b>To post to Instagram Stories:</b> tap <b>Save image</b> (on iPhone you can also tap Share → <i>Save Image</i>). Open Instagram → <b>+</b> → <b>Story</b> and pick the card from your photos. Add the <b>Link</b> sticker on the “Tap the link” spot so friends can open the talk.</div>
        <div class="st-btns"><button class="btn gold st-share" id="share"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3l4.5 4.5-1.4 1.4L13 6.8V15h-2V6.8L8.9 8.9 7.5 7.5zM5 13h2v6h10v-6h2v8H5z"/></svg>Share</button>
          <button class="btn secondary" id="save">Save image</button><button class="btn secondary" id="copy">Copy link</button></div>
      </div>
    </div>
    <div class="st-panel">
      <div class="st-tabs" role="tablist" id="tabs">${[["quote", "Quote"], ["look", "Look"], ["size", "Size"], ["text", "Text & motion"]].map(([k, v]) => `<button role="tab" type="button" id="tab-${k}" aria-controls="p-${k}" aria-selected="${st.tab === k}">${v}</button>`).join("")}</div>
      <section class="st-pane" id="p-quote" role="tabpanel" aria-labelledby="tab-quote">
        ${seg("src", { quote: "Quotes", ins: "Insight cards" }, st.src, "Card type")}
        <div id="srcQuote"><div class="q-tools"><input class="field" id="qsearch" type="search" placeholder="Search quotes, speakers, words…" aria-label="Search quotes"><button type="button" class="btn secondary small" id="shuffle">Shuffle</button></div>
          <div class="chiprow" id="qthemes"><button type="button" class="chip" data-th="" aria-pressed="true">All</button>${themeChips.map(n => `<button type="button" class="chip" data-th="${esc(n)}" aria-pressed="false">${esc(n)}</button>`).join("")}</div>
          <p class="b-help">Verified quotes only · from recaps; confirm with official text</p>
          <div id="qlist" class="qlist"></div></div>
        <div id="srcIns" hidden><div id="inslist" class="qlist"></div>
          <label class="b-label" for="spotSel">Speaker spotlight</label><select id="spotSel" class="field"><option value="">Choose a speaker…</option>${CONF.talks.map(t => `<option value="spot-${t.id}">${esc(t.speaker)}</option>`).join("")}</select>
          <label class="b-label" for="themeSel">Theme card</label><select id="themeSel" class="field"><option value="">Choose a theme…</option>${INSIGHTS.themeCounts.filter(x => x[1]).map(([n]) => `<option value="theme-${INSIGHTS.themeSlug(n)}">${esc(n)}</option>`).join("")}</select></div>
      </section>
      <section class="st-pane" id="p-look" role="tabpanel" aria-labelledby="tab-look">
        ${groups.map(g => `<div class="b-label">${esc(g)}</div><div class="looks">${Object.entries(L).filter(([, l]) => l.group === g).map(([id, l]) => `<button type="button" class="look" data-look="${id}" aria-pressed="${id === st.look}" aria-label="${esc(l.name)}">${l.photo ? `<img src="${esc(l.credit.thumb)}" alt="" loading="lazy" decoding="async">` : `<canvas width="72" height="96" data-thumb="${id}"></canvas>`}<span>${esc(l.name)}</span></button>`).join("")}</div>`).join("")}
        <div class="b-label">Color palette</div><div class="pals" id="pal" role="group" aria-label="Color palette">${Object.entries(K.PALETTES).map(([k, p]) => `<button type="button" data-k="${k}" aria-pressed="${k === st.pal}"><i style="background:linear-gradient(135deg,${p.acc},${p.acc2})"></i>${p.name}</button>`).join("")}</div>
        <label class="b-label" for="ov">Overlay darkness <span class="b-help" id="ovv"></span></label><input type="range" id="ov" min="0" max="85" step="5">
        <p class="b-help"><a href="credits.html">Photo credits &amp; licenses</a> · temple art is original</p>
      </section>
      <section class="st-pane" id="p-size" role="tabpanel" aria-labelledby="tab-size">
        <div class="sizes" id="size" role="group" aria-label="Size">${Object.entries(S).map(([k, [w, h, n]]) => `<button type="button" data-k="${k}" aria-pressed="${k === st.size}"><i style="aspect-ratio:${w}/${h}"></i><b>${n}</b><span>${w}×${h}</span></button>`).join("")}</div>
        <p class="b-help">Story is best for Instagram/Facebook Stories, 4:5 for feed posts, 16:9 for slides and YouTube, wallpaper for your lock screen.</p>
      </section>
      <section class="st-pane" id="p-text" role="tabpanel" aria-labelledby="tab-text">
        <div class="b-label">Font</div>${seg("font", K.FONTS, st.font, "Font")}
        <div class="b-label">Alignment</div>${seg("align", { center: "Centered", left: "Left" }, st.align, "Alignment")}
        <label class="b-label" for="note">My takeaway <span class="b-help">optional · your own words, labeled as yours on the card</span></label>
        <input class="field" id="note" maxlength="90" placeholder="e.g. I'll look for lift every morning this week" autocomplete="off"><div class="count"><span id="ncnt">0</span>/90</div>
        <div class="b-label">Motion</div>${seg("anim", { still: "Still image", anim: "Animated video" }, st.anim ? "anim" : "still", "Motion")}
        <p class="b-help" id="hint"></p><button class="btn secondary small" id="replay" hidden>↻ Replay animation</button>
      </section>
    </div>
  </div>`;
const $ = id => document.getElementById(id), cv = $("cv"), ctx = cv.getContext("2d");
const talk = () => talkById(st.t), ins = () => st.ins && INSIGHTS.get(st.ins);
// ---- quote list ----
function renderQuotes() {
  const f = st.filter.toLowerCase();
  const items = ALLQ.filter(x => (!st.theme || talkThemes(x.t).includes(st.theme)) && (!f || (x.q + " " + x.t.speaker + " " + x.t.title).toLowerCase().includes(f)));
  $("qlist").innerHTML = items.length ? items.map(x => `<button type="button" class="qitem" data-t="${x.t.id}" data-q="${x.i}" aria-pressed="${!st.ins && x.t.id === st.t && x.i === st.q}"><span class="qq">“${esc(x.q)}”</span><span class="qs">${esc(x.t.speaker)} · ${esc(x.t.title)}</span></button>`).join("") : `<p class="empty">No quotes match. Try another word.</p>`;
}
function renderIns() { $("inslist").innerHTML = INSIGHTS.list.map(x => `<button type="button" class="qitem" data-ins="${x.id}" aria-pressed="${st.ins === x.id}"><span class="qq">${esc(x.title)}</span><span class="qs">${esc(x.kicker)}</span></button>`).join(""); }
$("qlist").addEventListener("click", e => { const b = e.target.closest(".qitem"); if (!b) return; st.ins = null; st.t = b.dataset.t; st.q = +b.dataset.q; renderQuotes(); draw(true); });
$("inslist").addEventListener("click", e => { const b = e.target.closest(".qitem"); if (!b) return; st.ins = b.dataset.ins; renderIns(); draw(true); });
["spotSel", "themeSel"].forEach(id => $(id).addEventListener("change", e => { if (e.target.value) { st.ins = e.target.value; renderIns(); draw(true); } }));
let qt; $("qsearch").addEventListener("input", e => { clearTimeout(qt); qt = setTimeout(() => { st.filter = e.target.value; renderQuotes(); }, 120); });
$("qthemes").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; st.theme = b.dataset.th; $("qthemes").querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c === b)); renderQuotes(); });
$("shuffle").addEventListener("click", () => { const pool = ALLQ.filter(x => !st.theme || talkThemes(x.t).includes(st.theme)); const x = pool[Math.floor(Math.random() * pool.length)]; st.ins = null; st.t = x.t.id; st.q = x.i; renderQuotes(); draw(true); document.querySelector(".qitem[aria-pressed=true]")?.scrollIntoView({ block: "nearest" }); });
// ---- tabs ----
function setTab(k) { st.tab = k; document.querySelectorAll("#tabs [role=tab]").forEach(b => b.setAttribute("aria-selected", b.id === "tab-" + k)); document.querySelectorAll(".st-pane").forEach(p => p.hidden = p.id !== "p-" + k); if (k === "look") thumbs();
  const panel = document.querySelector(".st-panel"), ph = isPhone ? $("stPrev").offsetHeight + $("sitebar").offsetHeight : 0, top = panel.getBoundingClientRect().top;
  if (top < ph) window.scrollTo({ top: top + scrollY - ph, behavior: "instant" }); }
document.querySelectorAll("#tabs [role=tab]").forEach(b => b.addEventListener("click", () => setTab(b.id.slice(4))));
$("tabs").addEventListener("keydown", e => { if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return; const ks = ["quote", "look", "size", "text"], i = (ks.indexOf(st.tab) + (e.key === "ArrowRight" ? 1 : 3)) % 4; setTab(ks[i]); $("tab-" + ks[i]).focus(); });
// ---- segmented controls ----
const setSrc = v => { st.src = v; $("srcQuote").hidden = v !== "quote"; $("srcIns").hidden = v !== "ins"; if (v === "ins" && !st.ins) st.ins = INSIGHTS.list[0].id; if (v === "quote") st.ins = null; renderIns(); renderQuotes(); };
["src", "font", "align", "anim", "size", "pal"].forEach(id => document.querySelectorAll(`#${id} button`).forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute("aria-pressed", x === b));
  if (id === "src") { setSrc(b.dataset.k); return draw(true); }
  st[id === "pal" ? "pal" : id] = id === "anim" ? b.dataset.k === "anim" : b.dataset.k; draw(true); })));
document.querySelectorAll(".look").forEach(b => b.addEventListener("click", () => { st.look = b.dataset.look; st.ov = null; document.querySelectorAll(".look").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(true); }));
$("ov").addEventListener("input", e => { st.ov = +e.target.value / 100; draw(); });
let nt; $("note").addEventListener("input", e => { $("ncnt").textContent = e.target.value.length; clearTimeout(nt); nt = setTimeout(() => { st.note = cleanNote(e.target.value); draw(); }, 200); });
const cleanNote = s => s.replace(/https?:\/\/\S+|www\.\S+/gi, "").replace(/\s+/g, " ").trim().slice(0, 90);
let thumbsDone = false;
function thumbs() { if (thumbsDone) return; thumbsDone = true; const cs = [...document.querySelectorAll("canvas[data-thumb]")]; let i = 0;
  const step = () => { const c = cs[i++]; if (!c) return; K.drawThumb(c.getContext("2d"), c.width, c.height, c.dataset.thumb, st.pal); (window.requestIdleCallback || setTimeout)(step); }; step(); }
// ---- rendering ----
const opts = () => { const x = ins(), t = talk();
  const base = { look: st.look, palette: st.pal, font: st.font, align: st.align, overlay: st.ov ?? undefined };
  if (x) return { ...base, kind: "insight", ins: x, eyebrow: x.id === "daily" ? "SIX MONTHS OF LIGHT · DAILY" : "OCTOBER 2026 · CONFERENCE INSIGHT", url: x.id.startsWith("spot-") ? talkUrl(talkById(x.id.slice(5))) : CONF.site_url + "insights.html" };
  return { ...base, kind: "quote", quote: t.quotes[st.q], speaker: t.speaker, title: t.title, url: talkUrl(t), note: st.note }; };
let raf, t0;
function render(time) { const [W, H] = S[st.size]; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } K.drawCard(ctx, W, H, opts(), time); }
function play() { cancelAnimationFrame(raf); t0 = performance.now(); const loop = now => { const s = (now - t0) / 1000; render(Math.min(s, K.TL.total)); if (s < K.TL.total) raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
const videoType = () => window.MediaRecorder && ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(t => MediaRecorder.isTypeSupported(t));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let readyT;
async function draw(changed) {
  const look = L[st.look]; $("ov").value = Math.round((st.ov ?? look.ov ?? 0) * 100); $("ovv").textContent = $("ov").value + "%";
  const vt = videoType();
  $("replay").hidden = !st.anim; $("save").textContent = st.anim && vt ? "Save video" : "Save image";
  $("hint").textContent = st.anim ? (vt ? `10-second video (${vt.includes("mp4") ? "MP4" : "WebM"}): light rises, the words appear line by line, then the logo, link and QR code.${reduce ? " Preview is paused because your device asks for reduced motion; tap Replay to watch." : ""}` : "This browser can't record video; Save will download a still image.") : "";
  const x = ins(), t = talk();
  cv.setAttribute("aria-label", x ? `Card preview: ${x.title}. ${look.name}, ${S[st.size][2]}.` : `Card preview: “${t.quotes[st.q]}” by ${t.speaker}. ${look.name}, ${S[st.size][2]}.`);
  const q = new URLSearchParams(x ? { ins: st.ins } : { t: st.t, q: st.q }); q.set("look", st.look); if (st.pal !== "gold") q.set("pal", st.pal); if (st.font !== "classic") q.set("font", st.font); if (st.align !== "center") q.set("align", "left"); q.set("size", st.size); if (st.ov != null) q.set("ov", Math.round(st.ov * 100)); if (st.anim) q.set("anim", "1");
  history.replaceState(null, "", "builder.html?" + q);
  await K.prepare(opts());
  st.anim && !reduce ? play() : (cancelAnimationFrame(raf), render(Infinity));
  if (changed) { const r = $("ready"); r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); }
}
window.__renderAt = s => { render(s); return true; };
window.__studio = st; window.__draw = draw;
$("replay").addEventListener("click", play);
// ---- share / save / copy ----
const fname = ext => `six-months-of-light-${ins() ? st.ins : slug(talk().speaker)}-${st.size}.${ext}`;
const cardFile = () => new Promise(res => { cancelAnimationFrame(raf); render(Infinity); cv.toBlob(b => res(new File([b], fname("png"), { type: "image/png" })), "image/png"); });
const shareInfo = () => { const x = ins(), t = talk(), o = opts();
  return { url: o.url, text: x ? `${x.share} From Six Months of Light:` : `“${t.quotes[st.q]}” — ${t.speaker}, “${t.title}.” Study the talk on Six Months of Light:` }; };
const toast = msg => { $("readyTxt").innerHTML = msg; clearTimeout(readyT); readyT = setTimeout(() => $("readyTxt").innerHTML = "Your card is ready. Tap <b>Share</b>.", 4000); };
const download = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
$("share").addEventListener("click", async () => {
  const { url, text } = shareInfo(), file = await cardFile();
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Six Months of Light", text: `${text} ${url}` }); toast("Shared ✓"); return; }
    if (navigator.share && isPhone) { await navigator.share({ title: "Six Months of Light", text, url }); toast("Link shared ✓ · tap <b>Save image</b> to post the picture"); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  openShareSheet({ url, text, file });
  if (st.anim) draw();
});
$("save").addEventListener("click", async () => {
  const vt = videoType(), btn = $("save");
  if (!st.anim || !vt) { download(await cardFile(), fname("png")); toast("Image saved ✓ · now add it to your post or Story"); if (st.anim) draw(); return; }
  const rec = new MediaRecorder(cv.captureStream(30), { mimeType: vt, videoBitsPerSecond: 8e6 }), chunks = [];
  btn.disabled = true; btn.textContent = "Recording… 10s";
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = () => { download(new Blob(chunks, { type: vt }), fname(vt.includes("mp4") ? "mp4" : "webm")); btn.disabled = false; toast("Video saved ✓"); draw(); };
  rec.start(); play(); setTimeout(() => rec.stop(), K.TL.total * 1000 + 250);
});
$("copy").addEventListener("click", async () => { const { url } = shareInfo(); try { await navigator.clipboard.writeText(url); } catch { prompt("Copy this link:", url); } $("copy").textContent = "Copied ✓"; setTimeout(() => $("copy").textContent = "Copy link", 2000); });
$("igBtn").addEventListener("click", () => { const tip = $("igTip"), open = tip.hidden; tip.hidden = !open; $("igBtn").setAttribute("aria-expanded", open); });
// keep the tab bar pinned just under the sticky preview on phones
const setPrevH = () => document.documentElement.style.setProperty("--prevH", $("stPrev").offsetHeight + "px");
new ResizeObserver(setPrevH).observe($("stPrev"));
setSrc(st.src); setTab(st.tab);
Promise.all(['500 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '600 20px Inter', '400 20px Inter'].map(f => document.fonts.load(f))).then(() => draw()).catch(() => draw());
