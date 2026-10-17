// Card Studio overhaul UI: templates, filters, text effects, ornaments, your colors, undo/redo, shuffle, drafts.
// Runs after builder.js and uses its exposed state (window.__studio) and draw (window.__draw).
(function () {
  const st = window.__studio, draw = window.__draw, K = CardKit, X = K.X; if (!st || !draw || !X) return;
  const $ = id => document.getElementById(id), PAGE = location.pathname.split("/").pop() || "builder.html";
  // keep the address bar on this page (the preview page reuses the live studio script)
  if (PAGE !== "builder.html") { const rs = history.replaceState.bind(history); history.replaceState = (s, t, u) => rs(s, t, typeof u === "string" ? u.replace(/^builder\.html/, PAGE) : u); }
  // ---- restore the new fmt keys from the link (builder.js only keeps its own keys) ----
  const XNUM = { fls: [0, 1], sz: [.5, 2.5], so: [.1, 1] }, XOPT = { flt: Object.keys(X.FILTERS), tfx: Object.keys(X.TFX), stk: Object.keys(X.ORN), sp: Object.keys(X.SPOTS), gd: ["v", "d", "r"] };
  String(new URLSearchParams(location.search).get("fx") || "").split(";").forEach(kv => { const [k, v] = kv.split(":");
    if (XNUM[k] && isFinite(+v)) st.fmt[k] = Math.min(XNUM[k][1], Math.max(XNUM[k][0], +v)); else if (XOPT[k] && XOPT[k].includes(v)) st.fmt[k] = v; else if ((k === "bg1" || k === "bg2") && /^[0-9a-f]{6}$/i.test(v)) st.fmt[k] = "#" + v.toLowerCase(); });

  // ---- templates: full designs in one tap ----
  const TPL = [
    ["Morning light", { look: "sunrise", layout: "classic", font: "classic", pal: "gold", fmt: { tfx: "shadow", stk: "rays", sp: "top", sz: .8 } }],
    ["Sacred Grove", { look: "grove_dawn", layout: "classic", font: "garamond", pal: "sage", fmt: { flt: "golden", fls: .6, tfx: "shadow", border: "thin" } }],
    ["Temple at dusk", { look: "temple_dusk", layout: "bigquote", font: "cinzel", pal: "gold", fmt: { cs: "upper", ls: .04, tfx: "glow", flt: "dusk", fls: .4 } }],
    ["Gentle dove", { look: "minimal", layout: "classic", font: "playfair_i", pal: "sky", fmt: { stk: "dove", sp: "top", sz: 1.1, border: "double" } }],
    ["Scripture page", { look: "parchment", layout: "editorial", font: "baskerville", pal: "gold", fmt: { stk: "book", sp: "top", sz: .9, flt: "warm", fls: .5, border: "ornate" } }],
    ["Christ in art", { look: "photo-art-consolator", layout: "classic", font: "classic", pal: "gold", fmt: { flt: "soft", tfx: "lift", box: "glass", blur: 1 } }],
    ["Olive & laurel", { look: "olive", layout: "classic", font: "lora_i", pal: "sage", fmt: { stk: "laurel", sp: "top", sz: 1.2, flt: "faded", fls: .5 } }],
    ["Bold statement", { look: "charcoal", layout: "bold", font: "abril", pal: "gold", fmt: { tfx: "lift", stk: "flourish", sp: "mid", sz: .8 } }],
    ["Black & white", { look: "photo-slc-vintage", layout: "classic", font: "dmserif", pal: "silver", fmt: { flt: "bw", tfx: "shadow", vig: .5 } }],
    ["Journal note", { look: "linen", layout: "note", font: "lora_i", pal: "rose", fmt: { stk: "heart", sp: "br", sz: .6 } }],
    ["Night sky", { look: "milkyway", layout: "classic", font: "raleway", pal: "silver", fmt: { weight: "300", ls: .03, stk: "star", sp: "top", sz: .6, tfx: "glow" } }],
    ["Easter lilies", { look: "lilies", layout: "classic", font: "greatvibes", pal: "rose", fmt: { size: 1.1, stk: "lily", sp: "top", sz: .9, tfx: "shadow" } }],
    ["Modern clean", { look: "navy", layout: "split", font: "montserrat", pal: "gold", fmt: { weight: "600", qm: "bar", border: "none" } }],
    ["Sepia memory", { look: "photo-kirtland", layout: "polaroid", font: "garamond", pal: "gold", fmt: { flt: "sepia", grain: .6 } }],
    ["Your colors", { look: "custom", layout: "classic", font: "playfair", pal: "gold", fmt: { bg1: "#1d2a4a", bg2: "#7a4e6a", gd: "d", stk: "spire", sp: "top", sz: .8, tfx: "shadow" } }],
  ].filter(([, t]) => K.LOOKS[t.look] && K.LAYOUTS[t.layout] && K.FONTS[t.font]);
  const KEEP = ["size", "dx", "dy"]; // a template keeps where you've moved the text
  const applyTpl = t => { const keep = {}; KEEP.forEach(k => { if (st.fmt[k] != null && k !== "size") keep[k] = st.fmt[k]; });
    push(); st.look = t.look; st.layout = t.layout; st.font = t.font; st.pal = t.pal; st.ov = null; st.fmt = { ...t.fmt, ...keep }; syncAll(); draw(true); };

  // ---- inject UI ----
  const chip = (attr, k, v, on) => `<button type="button" ${attr}="${k}" aria-pressed="${on}">${esc(v)}</button>`;
  $("tab-look").textContent = "Design"; $("tab-text").textContent = "Text & motion";
  $("p-look").insertAdjacentHTML("afterbegin", `
    <div class="b-label">Templates <span class="b-help">a full design in one tap · your quote stays</span></div>
    <div class="cx-tpls" id="cxTpl" role="group" aria-label="Templates">${TPL.map(([n], i) => `<button type="button" class="cx-tpl" data-i="${i}" aria-label="${esc(n)}"><canvas width="108" height="135"></canvas><span>${esc(n)}</span></button>`).join("")}</div>
    <div class="b-label">Filter <span class="b-help">changes the background, not the words</span></div>
    <div class="cx-chips" id="cxFlt" role="group" aria-label="Filter">${Object.entries(X.FILTERS).map(([k, v]) => chip("data-flt", k, v, (st.fmt.flt || "none") === k)).join("")}</div>
    <label class="b-label" for="cxFls">Filter strength</label><input type="range" id="cxFls" min="0.1" max="1" step="0.05">
    <details class="adv" id="cxColors"><summary>Your colors background</summary>
      <div class="adv-grid"><label class="adv-color">Top color <input type="color" id="cxBg1"></label><label class="adv-color">Bottom color <input type="color" id="cxBg2"></label>
      <label>Blend <select id="cxGd"><option value="v">Top to bottom</option><option value="d">Diagonal</option><option value="r">Soft glow</option></select></label></div>
      <button type="button" class="btn secondary small" id="cxUseColors">Use my colors</button></details>`);
  $("p-text").insertAdjacentHTML("afterbegin", `
    <div class="b-label">Text effect</div>
    <div class="cx-chips" id="cxTfx" role="group" aria-label="Text effect">${Object.entries(X.TFX).map(([k, v]) => chip("data-tfx", k, v, (st.fmt.tfx || "none") === k)).join("")}</div>
    <div class="b-label">Ornament <span class="b-help">a small, quiet accent</span></div>
    <div class="cx-orns" id="cxOrn" role="group" aria-label="Ornament">${Object.entries(X.ORN).map(([k, v]) => `<button type="button" data-stk="${k}" aria-pressed="${(st.fmt.stk || "none") === k}" aria-label="${esc(v)}"><canvas width="56" height="56"></canvas><span>${esc(v)}</span></button>`).join("")}</div>
    <div id="cxOrnOpts"><div class="cx-chips" id="cxSp" role="group" aria-label="Ornament position">${Object.entries(X.SPOTS).map(([k, v]) => chip("data-sp", k, v, (st.fmt.sp || "top") === k)).join("")}</div>
    <div class="adv-grid"><label>Ornament size <input type="range" id="cxSz" min="0.5" max="2.5" step="0.05"></label><label>Ornament opacity <input type="range" id="cxSo" min="0.1" max="1" step="0.05"></label></div></div>`);
  $("tabs").insertAdjacentHTML("afterend", `<div class="cx-bar" role="toolbar" aria-label="Card tools">
    <button type="button" id="cxUndo" aria-label="Undo" disabled>↶ Undo</button><button type="button" id="cxRedo" aria-label="Redo" disabled>↷ Redo</button>
    <button type="button" id="cxShuffle">✦ Shuffle style</button><button type="button" id="cxSave">Save draft</button><button type="button" id="cxDrafts" aria-expanded="false">Drafts <b id="cxN"></b></button></div>
    <div class="cx-drafts" id="cxDraftBox" hidden></div>`);
  const css = document.createElement("style"); css.textContent = `
  .cx-tpls{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
  .cx-tpl{flex:0 0 auto;width:96px;border:1.5px solid rgba(29,27,46,.12);border-radius:12px;background:#fff;padding:4px;scroll-snap-align:start;cursor:pointer;font:500 11.5px var(--sans);color:var(--ink-2)}
  .cx-tpl canvas{width:100%;height:auto;border-radius:8px;display:block;background:#eee}.cx-tpl span{display:block;margin-top:4px;line-height:1.2;min-height:2.4em}
  .cx-tpl[aria-pressed=true],.cx-tpl:active{border-color:var(--gold);box-shadow:0 0 0 3px rgba(216,169,91,.25)}
  .cx-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.cx-chips button,.cx-bar button{border:1px solid rgba(29,27,46,.14);background:#fff;border-radius:999px;padding:8px 12px;font:500 13px var(--sans);color:var(--ink-2);cursor:pointer;min-height:36px}
  .cx-chips button[aria-pressed=true]{background:#fbefd6;border-color:var(--gold);color:var(--ink)}
  .cx-orns{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;margin:4px 0 10px}.cx-orns button{border:1px solid rgba(29,27,46,.14);background:#1d2340;border-radius:10px;padding:4px;cursor:pointer;color:#fff;font:500 10.5px var(--sans)}
  .cx-orns canvas{width:40px;height:40px;display:block;margin:0 auto}.cx-orns button[aria-pressed=true]{outline:3px solid var(--gold)}
  .cx-bar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;-webkit-overflow-scrolling:touch}.cx-bar button{flex:0 0 auto;padding:6px 11px;min-height:34px;font-size:12.5px}.cx-bar button:disabled{opacity:.4}
  .cx-drafts{display:flex;gap:8px;overflow-x:auto;padding:4px 0 10px}.cx-d{flex:0 0 auto;width:84px;text-align:center;font:11px var(--sans);color:var(--ink-2)}.cx-d img{width:84px;border-radius:8px;display:block;cursor:pointer;border:1px solid rgba(0,0,0,.1)}
  .cx-d button.x{border:0;background:none;color:var(--rose-deep);font:11px var(--sans);cursor:pointer;padding:4px}`;
  document.head.appendChild(css);

  // ---- ornament + template thumbnails ----
  document.querySelectorAll("#cxOrn button").forEach(b => { const c = b.querySelector("canvas"), x = c.getContext("2d"); if (b.dataset.stk !== "none") X.ornament(x, b.dataset.stk, 28, 28, 18, "#f1d394"); else { x.strokeStyle = "rgba(255,255,255,.5)"; x.lineWidth = 2; x.beginPath(); x.arc(28, 28, 14, 0, 7); x.moveTo(18, 38); x.lineTo(38, 18); x.stroke(); } });
  const curQuote = () => { const t = talkById(st.t); return st.ownOn && st.own ? { q: st.own, s: st.ownSp || t.speaker, ti: st.ownTi } : { q: t.quotes[st.q] || t.quotes[0], s: t.speaker, ti: t.title }; };
  const big = document.createElement("canvas"); big.width = 540; big.height = 675;
  let thumbGen = 0;
  async function tplThumbs() { const g = ++thumbGen, cq = curQuote();
    for (const [i, [, t]] of TPL.entries()) { if (g !== thumbGen) return; const o = { kind: "quote", quote: cq.q, speaker: cq.s, title: cq.ti, url: CONF.site_url, look: t.look, palette: t.pal, font: t.font, layout: t.layout, fmt: t.fmt, anim: "none", align: "center" };
      try { await K.prepare(o); K.drawCard(big.getContext("2d"), 540, 675, o, Infinity); const c = document.querySelectorAll("#cxTpl canvas")[i]; c.getContext("2d").drawImage(big, 0, 0, 108, 135); } catch (e) {}
      await new Promise(r => (window.requestIdleCallback || setTimeout)(r, 30)); } }

  // ---- sync UI from state ----
  function syncAll() { const f = st.fmt;
    const press = (sel, key, val) => document.querySelectorAll(sel).forEach(b => b.setAttribute("aria-pressed", b.dataset[key] === val));
    press("#cxFlt button", "flt", f.flt || "none"); press("#cxTfx button", "tfx", f.tfx || "none"); press("#cxOrn button", "stk", f.stk || "none"); press("#cxSp button", "sp", f.sp || "top");
    $("cxFls").value = f.fls ?? 1; $("cxFls").disabled = !f.flt || f.flt === "none"; $("cxSz").value = f.sz ?? 1; $("cxSo").value = f.so ?? .9; $("cxOrnOpts").hidden = !f.stk || f.stk === "none";
    $("cxBg1").value = f.bg1 || "#1d2a4a"; $("cxBg2").value = f.bg2 || "#7a4e6a"; $("cxGd").value = f.gd || "v";
    ["font", "align", "anim", "size", "pal", "layout"].forEach(id => document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute("aria-pressed", b.dataset.k === st[id])));
    document.querySelectorAll(".look").forEach(b => b.setAttribute("aria-pressed", b.dataset.look === st.look));
    ["size", "lh", "ls", "blur", "vig", "grain", "dx", "dy"].forEach(k => { const el = $("f-" + k); if (el) el.value = f[k] ?? ({ size: 1, lh: 1 }[k] ?? 0); });
    ["weight", "cs", "qm", "box", "border"].forEach(k => { const el = $("f-" + k); if (el) el.value = f[k] && f[k] !== "curly" && f[k] !== "corners" ? f[k] : ""; });
    TPL.forEach(([, t], i) => document.querySelectorAll(".cx-tpl")[i].setAttribute("aria-pressed", t.look === st.look && t.layout === st.layout && t.font === st.font));
    const sh = $("shMode"); if (sh) { st.mode = st.anim !== "none" ? (st.mode || "anim") : "still"; } }
  const setF = (k, v) => { push(); if (v === null || v === undefined || v === "none") delete st.fmt[k]; else st.fmt[k] = v; syncAll(); draw(); };
  $("cxTpl").addEventListener("click", e => { const b = e.target.closest(".cx-tpl"); if (b) applyTpl(TPL[+b.dataset.i][1]); });
  $("cxFlt").addEventListener("click", e => { const b = e.target.closest("[data-flt]"); if (b) setF("flt", b.dataset.flt); });
  $("cxTfx").addEventListener("click", e => { const b = e.target.closest("[data-tfx]"); if (b) setF("tfx", b.dataset.tfx); });
  $("cxOrn").addEventListener("click", e => { const b = e.target.closest("[data-stk]"); if (b) setF("stk", b.dataset.stk); });
  $("cxSp").addEventListener("click", e => { const b = e.target.closest("[data-sp]"); if (b) setF("sp", b.dataset.sp); });
  let rT; const slide = (id, k) => { $(id).addEventListener("pointerdown", () => push()); $(id).addEventListener("input", e => { st.fmt[k] = +e.target.value; clearTimeout(rT); rT = setTimeout(() => draw(), 60); }); };
  slide("cxFls", "fls"); slide("cxSz", "sz"); slide("cxSo", "so");
  const colors = () => { st.fmt.bg1 = $("cxBg1").value; st.fmt.bg2 = $("cxBg2").value; st.fmt.gd = $("cxGd").value; if (st.look !== "custom") { st.look = "custom"; st.ov = null; } syncAll(); draw(); };
  ["cxBg1", "cxBg2"].forEach(id => $(id).addEventListener("input", () => { clearTimeout(rT); rT = setTimeout(colors, 80); })); $("cxGd").addEventListener("change", () => { push(); colors(); });
  $("cxUseColors").addEventListener("click", () => { push(); colors(); });

  // ---- undo / redo (design only; the quote itself is chosen on the Quote tab) ----
  const snap = () => JSON.stringify({ look: st.look, layout: st.layout, font: st.font, pal: st.pal, align: st.align, size: st.size, anim: st.anim, ov: st.ov, fmt: st.fmt });
  const undo = [], redo = []; let lastSnap = snap();
  function push() { const s = snap(); if (undo[undo.length - 1] !== s) { undo.push(s); if (undo.length > 50) undo.shift(); } redo.length = 0; btns(); }
  // changes made with the original controls are recorded too
  ["#p-look", "#p-text", "#p-size", "#shMode"].forEach(sel => document.querySelector(sel)?.addEventListener("pointerdown", e => { if (e.target.closest("button,input,select") && !e.target.closest("#cxTpl,#cxFlt,#cxTfx,#cxOrn,#cxSp")) { const s = snap(); setTimeout(() => { if (snap() !== s) { undo.push(s); redo.length = 0; btns(); } }, 400); } }, true));
  const restoreSnap = s => { const o = JSON.parse(s); Object.assign(st, o); st.fmt = { ...o.fmt }; syncAll(); draw(true); };
  const btns = () => { $("cxUndo").disabled = !undo.length; $("cxRedo").disabled = !redo.length; };
  $("cxUndo").addEventListener("click", () => { if (!undo.length) return; redo.push(snap()); restoreSnap(undo.pop()); btns(); });
  $("cxRedo").addEventListener("click", () => { if (!redo.length) return; undo.push(snap()); restoreSnap(redo.pop()); btns(); });

  // ---- shuffle style ----
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const SHUF_LOOKS = Object.keys(K.LOOKS).filter(k => !["custom"].includes(k) && !/^photo-art-(rich|temple)/.test(k));
  const SHUF_FONTS = ["classic", "italic", "playfair_i", "lora_i", "garamond", "baskerville", "cinzel", "dmserif", "raleway", "montserrat"].filter(f => K.FONTS[f]);
  $("cxShuffle").addEventListener("click", () => { push(); st.look = pick(SHUF_LOOKS); st.font = pick(SHUF_FONTS); st.layout = pick(["classic", "classic", "bigquote", "editorial", "bold", "split"].filter(l => K.LAYOUTS[l])); st.pal = pick(Object.keys(K.PALETTES)); st.ov = null;
    const keep = {}; ["dx", "dy"].forEach(k => st.fmt[k] != null && (keep[k] = st.fmt[k]));
    st.fmt = { ...keep, flt: pick(["none", "none", "warm", "golden", "soft", "faded", "cool"]), tfx: pick(["none", "shadow", "shadow", "lift", "glow"]), ...(Math.random() < .45 ? { stk: pick(["dove", "rays", "star", "laurel", "flourish", "olive", "spire"]), sp: "top", sz: .8 } : {}) };
    if (st.fmt.flt === "none") delete st.fmt.flt; if (st.fmt.tfx === "none") delete st.fmt.tfx; syncAll(); draw(true); });

  // ---- drafts (saved on this device only) ----
  const DK = "cardDrafts.v1", load = () => { try { return JSON.parse(localStorage.getItem(DK) || "[]"); } catch (e) { return []; } }, save = a => { try { localStorage.setItem(DK, JSON.stringify(a.slice(0, 24))); return true; } catch (e) { return false; } };
  const cnt = () => { const n = load().length; $("cxN").textContent = n ? "(" + n + ")" : ""; };
  function renderDrafts() { const a = load(); $("cxDraftBox").innerHTML = a.length ? a.map((d, i) => `<div class="cx-d"><img src="${d.img}" alt="Draft from ${esc(d.when)}" data-open="${i}"><span>${esc(d.when)}</span><button type="button" class="x" data-del="${i}" aria-label="Delete draft">Delete</button></div>`).join("") : `<p class="b-help">No drafts yet. Tap <b>Save draft</b> to keep this card on this device.</p>`; }
  $("cxSave").addEventListener("click", () => { const cv = $("cv"), t = document.createElement("canvas"), r = cv.height / cv.width; t.width = 168; t.height = Math.round(168 * r); t.getContext("2d").drawImage(cv, 0, 0, t.width, t.height);
    const d = { img: t.toDataURL("image/jpeg", .7), when: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), s: snap(), t: st.t, q: st.q, src: st.src, ins: st.ins, own: st.ownOn ? { own: st.own, sp: st.ownSp, ti: st.ownTi } : null, note: st.note };
    const ok = save([d, ...load()]); cnt(); if (!$("cxDraftBox").hidden) renderDrafts(); $("readyTxt").innerHTML = ok ? "Draft saved on this device ✓" : "Couldn't save: this browser's storage is full."; });
  $("cxDrafts").addEventListener("click", () => { const b = $("cxDraftBox"), open = b.hidden; b.hidden = !open; $("cxDrafts").setAttribute("aria-expanded", open); if (open) renderDrafts(); });
  $("cxDraftBox").addEventListener("click", e => { const del = e.target.closest("[data-del]"), op = e.target.closest("[data-open]");
    if (del) { const a = load(); a.splice(+del.dataset.del, 1); save(a); cnt(); renderDrafts(); return; }
    if (op) { const d = load()[+op.dataset.open]; if (!d) return; push();
      if (d.src === "quote" || !d.src) { st.src = "quote"; st.ins = null; st.libT = null; if (talkById(d.t)) { st.t = d.t; st.q = d.q; }
        if (d.own) { st.own = d.own.own; st.ownSp = d.own.sp; st.ownTi = d.own.ti; st.ownOn = true; st.attrTouched = true; if ($("ownQ")) { $("ownQ").value = st.own; $("ownSp").value = st.ownSp; $("ownTi").value = st.ownTi; } } else st.ownOn = false; }
      st.note = d.note || ""; if ($("note")) $("note").value = st.note; restoreSnap(d.s); $("readyTxt").innerHTML = "Draft opened ✓"; } });
  cnt();

  // refresh template previews when the quote changes
  let lastQ = ""; setInterval(() => { const k = JSON.stringify(curQuote()); if (k !== lastQ && !document.hidden) { lastQ = k; tplThumbs(); } }, 1200);
  syncAll(); btns(); draw(true);
  window.__cx = { TPL, applyTpl, undo, redo };
})();
