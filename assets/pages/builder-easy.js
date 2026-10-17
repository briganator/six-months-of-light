// Card Studio "easy" mode (preview): Canva / Reels-style flow on top of the existing studio engine (builder.js).
// Full-screen canvas, template strip, tap-to-edit text, drag / pinch, bottom tools with visual sheets, Magic, one-tap reel.
(function () {
  const st = window.__studio, draw = window.__draw, K = CardKit, X = K.X; if (!st || !draw || !X) return;
  const $ = id => document.getElementById(id), PAGE = location.pathname.split("/").pop() || "builder.html";
  if (PAGE !== "builder.html") { const rs = history.replaceState.bind(history); history.replaceState = (s, t, u) => rs(s, t, typeof u === "string" ? u.replace(/^builder\.html/, PAGE) : u); }
  // restore the new fmt keys from the link (builder.js keeps only its own)
  const XNUM = { fls: [0, 1], sz: [.5, 2.5], so: [.1, 1], ox: [0, 1], oy: [0, 1] }, XOPT = { flt: Object.keys(X.FILTERS), tfx: Object.keys(X.TFX), stk: Object.keys(X.ORN), sp: Object.keys(X.SPOTS), gd: ["v", "d", "r"] };
  String(new URLSearchParams(location.search).get("fx") || "").split(";").forEach(kv => { const i = kv.indexOf(":"), k = kv.slice(0, i), v = kv.slice(i + 1);
    if (XNUM[k] && isFinite(+v)) st.fmt[k] = Math.min(XNUM[k][1], Math.max(XNUM[k][0], +v)); else if (XOPT[k] && XOPT[k].includes(v)) st.fmt[k] = v;
    else if (["bg1", "bg2", "oc"].includes(k) && /^[0-9a-f]{6}$/i.test(v)) st.fmt[k] = "#" + v.toLowerCase(); else if (k === "hl" && /^[a-z'\-,à-ÿ]{1,120}$/.test(v)) st.fmt.hl = v; });
  st.mode = "still";
  let lastOpts = null; { const d = K.drawCard; K.drawCard = function (c, W, H, o, t) { if (c.canvas && c.canvas.id === "cv") lastOpts = o; return d.apply(this, arguments); }; }
  const rerender = () => window.__renderAt && window.__renderAt(Infinity);
  let dT; const redraw = (now) => { clearTimeout(dT); if (now) return draw(); dT = setTimeout(() => draw(), 120); };

  // ---------- templates ----------
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
  const applyTpl = t => { const keep = {}; ["dx", "dy", "hl"].forEach(k => st.fmt[k] != null && (keep[k] = st.fmt[k]));
    st.look = t.look; st.layout = t.layout; st.font = t.font; st.pal = t.pal; st.ov = null; st.fmt = { ...t.fmt, ...keep }; sync(); draw(true); };

  // ---------- page shell ----------
  document.body.classList.add("easy");
  { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "assets/fonts/studio-fonts.css"; document.head.appendChild(l); }
  const IC = {
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', undo: '<path d="M9 7H4V2M4.5 7A8 8 0 1 1 6 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    redo: '<path d="M15 7h5V2M19.5 7A8 8 0 1 0 18 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    tpl: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>', text: '<path d="M5 4h14v3h-2V6h-4v12h2v2H9v-2h2V6H7v1H5z"/>',
    bg: '<path d="M3 4h18v16H3zM5 18h14l-4.5-6-3.5 4.5-2.5-3z" fill-rule="evenodd"/>', el: '<path d="M12 2l2.6 6.2L21 9l-5 4.4L17.5 20 12 16.7 6.5 20 8 13.4 3 9l6.4-.8z"/>',
    motion: '<path d="M8 5v14l11-7z"/>', size: '<path d="M4 4h7v2H6v5H4zM20 20h-7v-2h5v-5h2z"/>', more: '<circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/>',
    share: '<path d="M12 3l4.5 4.5-1.4 1.4L13 6.8V15h-2V6.8L8.9 8.9 7.5 7.5zM5 13h2v6h10v-6h2v8H5z"/>' };
  const svg = (k, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${IC[k]}</svg>`;
  const TOOLS = [["tpl", "Templates"], ["text", "Text"], ["bg", "Background"], ["el", "Elements"], ["motion", "Motion"], ["size", "Size"], ["more", "More"]];
  const ez = document.createElement("div"); ez.id = "ez"; ez.className = "ez";
  ez.innerHTML = `
  <header class="ez-top"><a class="ez-ic" href="index.html" aria-label="Home">${svg("home")}</a>
    <button type="button" class="ez-ic" id="ezUndo" aria-label="Undo" disabled>${svg("undo")}</button><button type="button" class="ez-ic" id="ezRedo" aria-label="Redo" disabled>${svg("redo")}</button>
    <span class="ez-grow"></span><button type="button" class="ez-save" id="ezSave">Save</button><button type="button" class="ez-share" id="ezShare">${svg("share", 18)}<span>Share</span></button></header>
  <div class="ez-stage" id="ezStage"><div class="ez-wrap" id="ezWrap"><div class="ez-sel" id="ezSel" hidden></div><i class="ez-gv" id="ezGv" hidden></i><i class="ez-gh" id="ezGh" hidden></i></div>
    <div class="ez-toast" id="ezToast" role="status" aria-live="polite"></div></div>
  <div class="ez-dock" id="ezDock"><div class="ez-low" id="ezLow">
    <div class="ez-acts"><button type="button" id="ezMagic" class="ez-pill">✦ Magic</button><button type="button" id="ezReel" class="ez-pill gold">▶ Make it a reel</button></div>
    <div class="ez-strip" id="ezStrip" role="group" aria-label="Templates">${TPL.map(([n], i) => `<button type="button" class="ez-t" data-i="${i}" aria-label="${esc(n)}"><canvas width="120" height="150"></canvas><span>${esc(n)}</span></button>`).join("")}</div></div>
  <div class="ez-float" id="ezFloat" hidden></div></div>
  <section class="ez-sheet" id="ezSheet" hidden aria-labelledby="ezShT"><div class="ez-sh-h"><b id="ezShT"></b><button type="button" id="ezShX" class="ez-done">Done</button></div><div class="ez-sh-b" id="ezShB"></div></section>
  <nav class="ez-tools" id="ezTools" aria-label="Tools">${TOOLS.map(([k, n]) => `<button type="button" data-tool="${k}">${svg(k)}<span>${n}</span></button>`).join("")}</nav>`;
  document.body.appendChild(ez);
  const cv = $("cv"); $("ezWrap").prepend(cv); cv.style.touchAction = "none";
  // the original panel (quote picker, advanced controls, captions, platforms) is kept and moved into sheets
  const quotePane = $("p-quote"), panel = document.querySelector(".st-panel"); $("tab-quote").hidden = true;
  const keepHome = document.createElement("div"); keepHome.hidden = true; document.body.appendChild(keepHome); keepHome.append(quotePane, panel);

  // ---------- toast (mirrors the studio's status line) ----------
  let tT; const toast = m => { const t = $("ezToast"); t.innerHTML = m; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 3200); };
  new MutationObserver(() => { const s = $("readyTxt").innerHTML; if (!/Your card is ready/.test(s)) toast(s); }).observe($("readyTxt"), { childList: true, characterData: true, subtree: true });

  // ---------- template thumbnails (live, with the current quote) ----------
  const curQuote = () => { const t = talkById(st.t); return st.ownOn && st.own ? { q: st.own, s: st.ownSp || t.speaker, ti: st.ownTi } : { q: t.quotes[st.q] || t.quotes[0], s: t.speaker, ti: t.title }; };
  const big = document.createElement("canvas"); big.width = 480; big.height = 600; const thumbs = []; let tg = 0;
  async function tplThumbs() { const g = ++tg, cq = curQuote(); const kind = lastOpts && lastOpts.kind === "insight" ? lastOpts : null;
    for (const [i, [, t]] of TPL.entries()) { if (g !== tg) return;
      const o = kind ? { ...kind, look: t.look, palette: t.pal, font: t.font, layout: t.layout, fmt: { ...t.fmt, hl: st.fmt.hl }, anim: "none" } : { kind: "quote", quote: cq.q, speaker: cq.s, title: cq.ti, url: CONF.site_url, look: t.look, palette: t.pal, font: t.font, layout: t.layout, fmt: { ...t.fmt, hl: st.fmt.hl }, anim: "none", align: "center" };
      try { await K.prepare(o); K.drawCard(big.getContext("2d"), 480, 600, o, Infinity); const c = thumbs[i] || (thumbs[i] = document.createElement("canvas")); c.width = 120; c.height = 150; c.getContext("2d").drawImage(big, 0, 0, 120, 150);
        document.querySelectorAll(`canvas[data-tp="${i}"], #ezStrip .ez-t[data-i="${i}"] canvas`).forEach(x => x.getContext("2d").drawImage(c, 0, 0, x.width, x.height)); } catch (e) {}
      await new Promise(r => (window.requestIdleCallback || setTimeout)(r, 20)); } }
  $("ezStrip").addEventListener("click", e => { const b = e.target.closest(".ez-t"); if (b) { applyTpl(TPL[+b.dataset.i][1]); toast(esc(TPL[+b.dataset.i][0]) + " ✓"); } });

  // ---------- sync visual state ----------
  function sync() { const f = st.fmt;
    ["font", "align", "anim", "size", "pal", "layout"].forEach(id => document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute("aria-pressed", b.dataset.k === st[id])));
    document.querySelectorAll(".look").forEach(b => b.setAttribute("aria-pressed", b.dataset.look === st.look));
    ["size", "lh", "ls", "blur", "vig", "grain", "dx", "dy"].forEach(k => { const el = $("f-" + k); if (el) el.value = f[k] ?? ({ size: 1, lh: 1 }[k] ?? 0); });
    ["weight", "cs", "qm", "box", "border"].forEach(k => { const el = $("f-" + k); if (el) el.value = f[k] && f[k] !== "curly" && f[k] !== "corners" ? f[k] : ""; });
    document.querySelectorAll("#ezStrip .ez-t, .ez-tg").forEach(b => { const t = TPL[+b.dataset.i][1]; b.setAttribute("aria-pressed", t.look === st.look && t.layout === st.layout && t.font === st.font); });
    document.querySelectorAll("[data-set]").forEach(b => { const [k, v] = b.dataset.set.split("="); const cur = k.startsWith("f.") ? (f[k.slice(2)] ?? "") : st[k]; b.setAttribute("aria-pressed", String(cur) === v); });
    $("ezUndo").disabled = !undo.length; $("ezRedo").disabled = !redo.length; }

  // ---------- undo / redo: design AND quote changes, whatever control made them ----------
  const QK = ["look", "layout", "font", "pal", "align", "size", "anim", "ov", "t", "q", "src", "ins", "ownOn", "own", "ownSp", "ownTi", "note", "sp", "pi", "promo", "hl"];
  const snap = () => JSON.stringify([QK.map(k => st[k]), st.fmt, st.libT]);
  const undo = [], redo = []; let cur = snap(), pend = null, lastCh = 0, restoring = false;
  setInterval(() => { const s = snap(); if (s !== cur) { if (!restoring) { if (pend === null) pend = cur; lastCh = Date.now(); } cur = s; restoring = false; }
    if (pend !== null && Date.now() - lastCh > 450) { if (pend !== cur) { undo.push(pend); if (undo.length > 60) undo.shift(); redo.length = 0; } pend = null; sync(); } }, 150);
  function restore(s) { const [vals, fmt, libT] = JSON.parse(s); QK.forEach((k, i) => st[k] = vals[i]); st.fmt = { ...fmt }; st.libT = libT; restoring = true; cur = s;
    if ($("ownQ")) { $("ownQ").value = st.ownOn ? st.own : ""; $("ownSp").value = st.ownSp || ""; $("ownTi").value = st.ownTi || ""; } if ($("note")) $("note").value = st.note || "";
    const sel = $("pickTalk"); if (sel) sel.value = st.t; sync(); draw(true); }
  $("ezUndo").addEventListener("click", () => { if (pend !== null) { undo.push(pend); pend = null; } if (!undo.length) return; redo.push(snap()); restore(undo.pop()); sync(); });
  $("ezRedo").addEventListener("click", () => { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); sync(); });

  // ---------- sheets ----------
  const sw = (set, label, inner, extra = "") => `<button type="button" class="ez-sw" data-set="${set}" ${extra}>${inner}<span>${esc(label)}</span></button>`;
  const INK = [["", "Auto", "linear-gradient(135deg,#fff 50%,#1d1b2e 50%)"], ["#ffffff", "White", "#fff"], ["#fff4dc", "Cream", "#fff4dc"], ["#f1d394", "Gold", "#f1d394"], ["#1d1b2e", "Ink", "#1d1b2e"], ["#2c3e63", "Navy", "#2c3e63"], ["#7a2e3a", "Wine", "#7a2e3a"], ["#3f5a36", "Olive", "#3f5a36"]];
  const ACC = [["", "Auto", "linear-gradient(135deg,#f1d394 50%,#8a5f1f 50%)"], ["#f1d394", "Gold", "#f1d394"], ["#d8a95b", "Amber", "#d8a95b"], ["#f4bfb0", "Rose", "#f4bfb0"], ["#c3dbf4", "Sky", "#c3dbf4"], ["#9fbb84", "Sage", "#9fbb84"], ["#8a5f1f", "Bronze", "#8a5f1f"], ["#9a4634", "Brick", "#9a4634"]];
  const dot = c => `<i class="ez-dot" style="background:${c}"></i>`;
  const fontSw = () => Object.keys(K.FONTS).map(k => `<button type="button" class="ez-font" data-set="font=${k}" style="font:${K.FONTF[k](20).replace(/"/g, "'")}">Aa<span>${esc(K.FONTS[k])}</span></button>`).join("");
  const fxSw = () => Object.entries(X.TFX).map(([k, n]) => `<button type="button" class="ez-fx fx-${k}" data-set="f.tfx=${k === "none" ? "" : k}">Aa<span>${esc(n)}</span></button>`).join("");
  const SHEETS = {
    tpl: () => ["Templates", `<p class="ez-help">One tap applies a whole design. Your quote stays.</p><div class="ez-grid3">${TPL.map(([n], i) => `<button type="button" class="ez-tg" data-i="${i}"><canvas data-tp="${i}" width="120" height="150"></canvas><span>${esc(n)}</span></button>`).join("")}</div>
      <h4>Layout</h4><div class="ez-row">${Object.entries(K.LAYOUTS).map(([k, l]) => sw("layout=" + k, l.name, "", 'data-click="#layout button[data-k=' + k + ']"')).join("")}</div>`],
    text: () => ["Text", `<button type="button" class="ez-pill" data-goq>✎ Change the quote</button><h4>Font</h4><div class="ez-row">${fontSw()}</div><h4>Text color</h4><div class="ez-row">${INK.map(([v, n, c]) => sw("f.ink=" + v, n, dot(c))).join("")}</div>
      <h4>Accent color <small>highlighted words and ornaments</small></h4><div class="ez-row">${ACC.map(([v, n, c]) => sw("f.acc=" + v, n, dot(c))).join("")}</div>
      <h4>Effect</h4><div class="ez-row">${fxSw()}</div><p class="ez-help">Tip: tap the words on your card, then tap a word to color it.</p><h4>Quote</h4><div id="ezQuoteHost"></div>`],
    bg: () => { const groups = [...new Set(Object.values(K.LOOKS).map(l => l.group))];
      return ["Background", `<h4>Filter</h4><div class="ez-row" id="ezFlt">${Object.entries(X.FILTERS).map(([k, n]) => `<button type="button" class="ez-sw ez-flt" data-set="f.flt=${k === "none" ? "" : k}"><canvas width="56" height="70" data-flt="${k}"></canvas><span>${esc(n)}</span></button>`).join("")}</div>
      <h4>Your colors</h4><div class="ez-row">${[["#1d2a4a", "#7a4e6a"], ["#0d1326", "#2a3d6b"], ["#f8efe0", "#e6c9a8"], ["#22352a", "#9fbb84"], ["#3a1f2b", "#d98a78"], ["#ffffff", "#e9e4f2"], ["#2b2b2b", "#6b5a3e"]].map(([a, b]) => `<button type="button" class="ez-sw" data-colors="${a},${b}"><i class="ez-dot" style="background:linear-gradient(180deg,${a},${b})"></i><span>&nbsp;</span></button>`).join("")}
        <label class="ez-sw ez-pick"><input type="color" id="ezC1" value="${st.fmt.bg1 || "#1d2a4a"}"><span>Top</span></label><label class="ez-sw ez-pick"><input type="color" id="ezC2" value="${st.fmt.bg2 || "#7a4e6a"}"><span>Bottom</span></label></div>
      ${groups.map(g => `<h4>${esc(g)}</h4><div class="ez-row">${Object.keys(K.LOOKS).filter(id => K.LOOKS[id].group === g).map(id => { const l = K.LOOKS[id]; return `<button type="button" class="look ez-look" data-look="${id}" aria-label="${esc(l.name)}">${l.photo ? `<img src="${esc(l.credit.thumb)}" alt="" loading="lazy">` : `<canvas width="56" height="70" data-thumb2="${id}"></canvas>`}<span>${esc(l.name)}</span></button>`; }).join("")}</div>`).join("")}
      <p class="ez-help"><a href="credits.html">Photo credits</a> · art is public domain; temple art is original</p>`]; },
    el: () => ["Elements", `<h4>Ornament</h4><div class="ez-row ez-orns">${Object.entries(X.ORN).map(([k, n]) => `<button type="button" class="ez-sw ez-orn" data-set="f.stk=${k === "none" ? "" : k}"><canvas width="48" height="48" data-orn="${k}"></canvas><span>${esc(n)}</span></button>`).join("")}</div>
      <p class="ez-help">Drag the ornament on your card to move it. Pinch to resize.</p>
      <h4>Frame</h4><div class="ez-row">${[["", "Corners"], ["none", "None"], ["thin", "Thin"], ["double", "Double"], ["rounded", "Rounded"], ["ornate", "Ornate"]].map(([v, n]) => sw("f.border=" + v, n, `<i class="ez-frame fr-${v || "corners"}"></i>`)).join("")}</div>
      <h4>Speaker photo</h4><div class="ez-row">${sw("sp=true", "Show", "<i class='ez-dot' style='background:#d8a95b'></i>")}${sw("sp=false", "Hide", "<i class='ez-dot' style='background:#ddd'></i>")}</div>`],
    motion: () => ["Motion", `<button type="button" class="ez-big" data-reel>▶ Make it a reel <small>10-second video with music</small></button>
      <h4>Music</h4><div class="ez-row">${[{ id: "none", name: "No music" }, ...ReelKit.TRACKS].map(m => `<button type="button" class="ez-sw ez-mus" data-mus="${m.id}" aria-pressed="${m.id === music}"><i class="ez-dot ez-note">${m.id === "none" ? "–" : "♪"}</i><span>${esc(m.name.replace(/\s*\(synth\)/, ""))}</span></button>`).join("")}</div>
      <h4>Animation</h4><div class="ez-row">${Object.entries(K.ANIMS).map(([k, n]) => sw("anim=" + k, n.replace(/ \(still\)/, ""), `<i class="ez-dot ez-note">${k === "none" ? "■" : "✧"}</i>`, `data-click="#anim button[data-k=${k}]"`)).join("")}</div>`],
    size: () => ["Size", `<div class="ez-row ez-sizes">${Object.entries(K.SIZES).map(([k, [w, h, n]]) => sw("size=" + k, n, `<i class="ez-shape" style="aspect-ratio:${w}/${h}"></i>`, `data-click="#size button[data-k=${k}]"`)).join("")}</div>`],
    more: () => ["More", `<div class="ez-row"><button type="button" class="ez-pill" id="ezDraftSave">Save as draft</button><button type="button" class="ez-pill" id="ezTips">Show tips</button></div><div id="ezDrafts" class="ez-drafts"></div>
      <h4>All controls</h4><div id="ezPanelHost"></div>`],
  };
  let openK = null;
  function openSheet(k) { closeSel(); if (openK === k) return closeSheet(); openK = k; const [title, html] = SHEETS[k]();
    $("ezShT").textContent = title; $("ezShB").innerHTML = html; $("ezSheet").hidden = false; $("ezDock").hidden = true;
    document.querySelectorAll("#ezTools button").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === k));
    if (k === "text") $("ezQuoteHost").appendChild(quotePane), quotePane.hidden = false;
    if (k === "more") { $("ezPanelHost").appendChild(panel); renderDrafts(); if (!document.querySelector("#tabs [aria-selected=true]:not([hidden])")) $("tab-look").click(); }
    if (k === "tpl") thumbs.forEach((c, i) => { const x = document.querySelector(`canvas[data-tp="${i}"]`); x && c && x.getContext("2d").drawImage(c, 0, 0); });
    if (k === "bg") { document.querySelectorAll("canvas[data-thumb2]").forEach((c, i) => setTimeout(() => K.drawThumb(c.getContext("2d"), c.width, c.height, c.dataset.thumb2, st.pal), i * 8)); fltThumbs(); }
    if (k === "el") document.querySelectorAll("canvas[data-orn]").forEach(c => { const x = c.getContext("2d"); if (c.dataset.orn !== "none") X.ornament(x, c.dataset.orn, 24, 24, 15, "#f1d394"); else { x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 2; x.beginPath(); x.arc(24, 24, 12, 0, 7); x.moveTo(15, 33); x.lineTo(33, 15); x.stroke(); } });
    sync(); fit(); $("ezShB").scrollTop = 0; }
  function closeSheet() { if (quotePane.parentNode !== keepHome) keepHome.appendChild(quotePane); if (panel.parentNode !== keepHome) keepHome.appendChild(panel);
    openK = null; $("ezSheet").hidden = true; $("ezDock").hidden = false; document.querySelectorAll("#ezTools button").forEach(b => b.setAttribute("aria-pressed", "false")); fit(); }
  $("ezTools").addEventListener("click", e => { const b = e.target.closest("[data-tool]"); if (b) openSheet(b.dataset.tool); });
  $("ezShX").addEventListener("click", closeSheet);
  function fltThumbs() { const c0 = document.createElement("canvas"); c0.width = 56; c0.height = 70; K.drawThumb(c0.getContext("2d"), 56, 70, st.look, st.pal);
    document.querySelectorAll("canvas[data-flt]").forEach(c => { const x = c.getContext("2d"); x.drawImage(c0, 0, 0); X.applyFilter(x, c.dataset.flt, 1); }); }
  // one handler for every swatch
  $("ezSheet").addEventListener("click", e => {
    const tg = e.target.closest(".ez-tg"); if (tg) { applyTpl(TPL[+tg.dataset.i][1]); return; }
    if (e.target.closest("[data-goq]")) { $("ezQuoteHost").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (e.target.closest("[data-reel]")) { closeSheet(); makeReel(); return; }
    const mu = e.target.closest("[data-mus]"); if (mu) { music = mu.dataset.mus; Store.set("ez-music", music); document.querySelectorAll("[data-mus]").forEach(b => b.setAttribute("aria-pressed", b === mu)); previewMusic(music); return; }
    const co = e.target.closest("[data-colors]"); if (co) { const [a, b] = co.dataset.colors.split(","); st.fmt.bg1 = a; st.fmt.bg2 = b; st.fmt.gd = st.fmt.gd || "v"; st.look = "custom"; st.ov = null; sync(); draw(true); return; }
    const b = e.target.closest("[data-set]"); if (!b || b.closest("#ezPanelHost,#ezQuoteHost")) return;
    if (b.dataset.click) { const t = document.querySelector(b.dataset.click); if (t) t.click(); setTimeout(sync, 50); return; }
    const [k, v] = b.dataset.set.split("=");
    if (k === "sp") { if (String(st.sp) !== v) $("spPhoto").click(); setTimeout(sync, 50); return; }
    if (k.startsWith("f.")) { const fk = k.slice(2); if (v === "") delete st.fmt[fk]; else st.fmt[fk] = v; if (fk === "stk" && v) { st.fmt.sz = st.fmt.sz || .9; } }
    else { const t = document.querySelector(`#${k} button[data-k="${v}"]`); if (t) { t.click(); setTimeout(sync, 50); return; } st[k] = v; }
    sync(); draw(); });
  $("ezSheet").addEventListener("input", e => { if (e.target.id === "ezC1" || e.target.id === "ezC2") { st.fmt.bg1 = $("ezC1").value; st.fmt.bg2 = $("ezC2").value; st.look = "custom"; st.ov = null; redraw(); } });

  // ---------- canvas fit ----------
  function fit() { const s = $("ezStage"), w = s.clientWidth - 24, h = s.clientHeight - 20, r = cv.width / cv.height; let cw = w, ch = w / r; if (ch > h) { ch = h; cw = h * r; }
    $("ezWrap").style.width = Math.round(cw) + "px"; $("ezWrap").style.height = Math.round(ch) + "px"; placeSel(); }
  new ResizeObserver(fit).observe($("ezStage")); new MutationObserver(fit).observe(cv, { attributes: true, attributeFilter: ["width", "height"] });

  // ---------- selection, floating toolbar ----------
  let sel = null; // "text" | "orn"
  const BRAND = /six months|sixmonthsoflight|not an official|personal study|general conference|^elder |^president |^sister |^bishop /i;
  const nrm = x => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const quoteLines = () => { const T = K.HITS.text.filter(h => !BRAND.test(h.s)); if (!T.length) return []; const o = lastOpts || {};
    const qt = nrm(o.kind === "quote" ? o.quote : o.ins ? [o.ins.title, o.ins.sub, o.ins.kicker].join(" ") : "");
    const M = qt ? T.filter(h => { const n = nrm(h.s); return n.length >= 2 && qt.includes(n); }) : [];
    if (M.length) { const m = Math.max(...M.map(h => h.fs)); return M.filter(h => h.fs >= m * .7); }
    const m = Math.max(...T.map(h => h.fs)); return T.filter(h => h.fs >= m * .7); };
  const toCss = () => { const r = cv.getBoundingClientRect(), w = $("ezWrap").getBoundingClientRect(); return { k: r.width / cv.width, ox: r.left - w.left, oy: r.top - w.top }; };
  function bounds() { if (sel === "orn") { const o = K.HITS.orn; return o && { x0: o.x - o.r, x1: o.x + o.r, y0: o.y - o.r, y1: o.y + o.r }; }
    const L = quoteLines(); if (!L.length) return null; return { x0: Math.min(...L.map(h => h.x0)), x1: Math.max(...L.map(h => h.x1)), y0: Math.min(...L.map(h => h.y0)), y1: Math.max(...L.map(h => h.y1)) }; }
  function placeSel() { const b = sel && bounds(), el = $("ezSel"); if (!b) { el.hidden = true; return; } const { k } = toCss(), p = 8;
    Object.assign(el.style, { left: (b.x0 * k - p) + "px", top: (b.y0 * k - p) + "px", width: ((b.x1 - b.x0) * k + p * 2) + "px", height: ((b.y1 - b.y0) * k + p * 2) + "px" }); el.hidden = false; }
  setInterval(() => sel && placeSel(), 300);
  const FL = {
    text: () => `<div class="ez-fl-row"><button data-fl="font">Aa Font</button><button data-fl="color"><i class="ez-dot sm" style="background:${st.fmt.ink || "linear-gradient(135deg,#fff 50%,#1d1b2e 50%)"}"></i>Color</button><button data-fl="smaller" aria-label="Smaller">A−</button><button data-fl="bigger" aria-label="Bigger">A+</button><button data-fl="align" aria-label="Align">${st.align === "left" ? "⟸ Left" : "≡ Center"}</button><button data-fl="fx">✧ Effect</button><button data-fl="words">✎ Quote</button><button data-fl="done">✓ Done</button></div><div class="ez-fl-sub" id="ezFlSub"></div><p class="ez-fl-tip">Drag to move · pinch to resize · tap a word to color it${st.fmt.hl ? ` · <button data-fl="clearhl" class="ez-link">clear colored words</button>` : ""}</p>`,
    orn: () => `<div class="ez-fl-row"><button data-fl="swap">↻ Change</button><button data-fl="osmaller">−</button><button data-fl="obigger">+</button><button data-fl="ofade">${(st.fmt.so ?? .9) > .6 ? "◐ Softer" : "● Stronger"}</button><button data-fl="ocenter">⊕ Center</button><button data-fl="odel">✕ Remove</button><button data-fl="done">✓ Done</button></div><p class="ez-fl-tip">Drag to move · pinch to resize</p>` };
  function select(k) { sel = k; const f = $("ezFloat"); if (!k) { f.hidden = true; $("ezSel").hidden = true; $("ezLow").hidden = false; return; } if (openK) closeSheet(); f.innerHTML = FL[k](); f.hidden = false; $("ezLow").hidden = true; placeSel(); }
  function closeSel() { select(null); }
  $("ezFloat").addEventListener("click", e => { const b = e.target.closest("[data-fl], [data-set]"); if (!b) return;
    if (b.dataset.set) { const [k, v] = b.dataset.set.split("="); if (k.startsWith("f.")) { if (v === "") delete st.fmt[k.slice(2)]; else st.fmt[k.slice(2)] = v; } else { const t = document.querySelector(`#${k} button[data-k="${v}"]`); t ? t.click() : (st[k] = v); }
      $("ezFlSub").querySelectorAll("[data-set]").forEach(x => x.setAttribute("aria-pressed", x === b)); redraw(true); return; }
    const a = b.dataset.fl, f = st.fmt, sub = $("ezFlSub");
    const toggleSub = (key, html) => { if (sub.dataset.k === key) { sub.innerHTML = ""; sub.dataset.k = ""; return; } sub.dataset.k = key; sub.innerHTML = `<div class="ez-row">${html}</div>`; sync(); };
    if (a === "done") { closeSel(); return; }
    if (a === "font") toggleSub("font", fontSw());
    if (a === "color") toggleSub("color", INK.map(([v, n, c]) => sw("f.ink=" + v, n, dot(c))).join("") + ACC.slice(1).map(([v, n, c]) => sw("f.acc=" + v, "Accent " + n.toLowerCase(), dot(c))).join(""));
    if (a === "fx") toggleSub("fx", fxSw());
    if (a === "smaller" || a === "bigger") { f.size = Math.min(1.5, Math.max(.6, +((f.size || 1) + (a === "bigger" ? .08 : -.08)).toFixed(2))); if (Math.abs(f.size - 1) < .01) delete f.size; redraw(true); }
    if (a === "align") { $("align").querySelector(`button[data-k="${st.align === "left" ? "center" : "left"}"]`).click(); setTimeout(() => select("text"), 60); }
    if (a === "words") { closeSel(); openSheet("text"); setTimeout(() => $("ezQuoteHost").scrollIntoView({ block: "start" }), 50); }
    if (a === "clearhl") { delete f.hl; redraw(true); setTimeout(() => select("text"), 60); }
    if (a === "swap") { closeSel(); openSheet("el"); }
    if (a === "osmaller" || a === "obigger") { f.sz = Math.min(2.5, Math.max(.5, +((f.sz || 1) * (a === "obigger" ? 1.15 : .87)).toFixed(2))); redraw(true); }
    if (a === "ofade") { f.so = (f.so ?? .9) > .6 ? .45 : .95; select("orn"); redraw(true); }
    if (a === "ocenter") { f.ox = .5; delete f.oy; delete f.ox; f.sp = "top"; redraw(true); }
    if (a === "odel") { delete f.stk; delete f.ox; delete f.oy; closeSel(); redraw(true); } });

  // ---------- touch: tap, drag, pinch, snap guides ----------
  const P = new Map(); let g = null;
  const ptC = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cv.width, y: (e.clientY - r.top) / r.height * cv.height, cx: e.clientX, cy: e.clientY }; };
  const hitTest = p => { const o = K.HITS.orn; if (o && Math.hypot(p.x - o.x, p.y - o.y) < o.r * 1.3) return "orn"; const b = (() => { const s = sel; sel = "text"; const r = bounds(); sel = s; return r; })(); const pad = Math.min(cv.width, cv.height) * .03;
    return b && p.x > b.x0 - pad && p.x < b.x1 + pad && p.y > b.y0 - pad && p.y < b.y1 + pad ? "text" : null; };
  const guides = (v, h) => { $("ezGv").hidden = !v; $("ezGh").hidden = !h; };
  const live = () => { if (st.anim === "none" || matchMedia("(prefers-reduced-motion: reduce)").matches) rerender(); };
  cv.addEventListener("pointerdown", e => { try { cv.setPointerCapture(e.pointerId); } catch (x) {} const p = ptC(e); P.set(e.pointerId, p);
    if (P.size === 1) { const t = hitTest(p); g = { t, p0: p, moved: false, dx: st.fmt.dx || 0, dy: st.fmt.dy || 0, ox: st.fmt.ox, oy: st.fmt.oy, o0: K.HITS.orn && { ...K.HITS.orn } }; }
    if (P.size === 2 && g) { const [a, b] = [...P.values()]; g.pinch = { d: Math.hypot(a.cx - b.cx, a.cy - b.cy), size: st.fmt.size || 1, sz: st.fmt.sz || 1 }; g.moved = true; if (!g.t) g.t = sel || "text"; }
    e.preventDefault(); });
  cv.addEventListener("pointermove", e => { if (!P.has(e.pointerId) || !g) return; const p = ptC(e); P.set(e.pointerId, p); const f = st.fmt;
    if (g.pinch && P.size >= 2) { const [a, b] = [...P.values()], k = Math.hypot(a.cx - b.cx, a.cy - b.cy) / g.pinch.d;
      if (g.t === "orn") f.sz = +Math.min(2.5, Math.max(.5, g.pinch.sz * k)).toFixed(3); else f.size = +Math.min(1.5, Math.max(.6, g.pinch.size * k)).toFixed(3); live(); placeSel(); return; }
    const dX = p.x - g.p0.x, dY = p.y - g.p0.y; if (!g.moved && Math.hypot(p.cx - g.p0.cx, p.cy - g.p0.cy) < 7) return; if (!g.moved) { g.moved = true; if (g.t && sel !== g.t) select(g.t); }
    if (g.t === "text") { let dx = g.dx + dX / cv.width, dy = g.dy + dY / cv.height; const sv = Math.abs(dx) < .02, sh = Math.abs(dy) < .02; if (sv) dx = 0; if (sh) dy = 0; guides(sv, sh);
      f.dx = +Math.max(-.3, Math.min(.3, dx)).toFixed(3); f.dy = +Math.max(-.3, Math.min(.3, dy)).toFixed(3); if (!f.dx) delete f.dx; if (!f.dy) delete f.dy; live(); placeSel(); }
    if (g.t === "orn" && g.o0) { let ox = (g.o0.x + dX) / cv.width, oy = (g.o0.y + dY) / cv.height; const sv = Math.abs(ox - .5) < .025, sh = Math.abs(oy - .5) < .025; if (sv) ox = .5; if (sh) oy = .5; guides(sv, sh);
      f.ox = +Math.max(.04, Math.min(.96, ox)).toFixed(3); f.oy = +Math.max(.04, Math.min(.96, oy)).toFixed(3); live(); placeSel(); } });
  const end = e => { if (!P.has(e.pointerId)) return; const p = P.get(e.pointerId); P.delete(e.pointerId); if (P.size) return; guides(false, false); const G = g; g = null; if (!G) return;
    if (G.moved) { draw(); setTimeout(placeSel, 80); return; }
    if (G.t === "text" && sel === "text") { const L = quoteLines().find(h => p.y >= h.y0 && p.y <= h.y1) , w = L && L.xs.find(x => p.x >= x.a - 4 && p.x <= x.b + 4);
      if (w && w.w.length > 1) { const s = new Set(String(st.fmt.hl || "").split(",").filter(Boolean)); s.has(w.w) ? s.delete(w.w) : s.add(w.w); const a = [...s].slice(-8); if (a.length) st.fmt.hl = a.join(","); else delete st.fmt.hl;
        draw(); toast(s.has(w.w) ? `“${esc(w.w)}” colored ✓` : `“${esc(w.w)}” back to normal`); setTimeout(() => select("text"), 60); return; } }
    if (G.t) select(G.t); else if (sel) closeSel(); else if (openK) closeSheet(); };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  $("ezStage").addEventListener("pointerdown", e => { if (e.target === $("ezStage")) { closeSel(); } });

  // ---------- Magic ----------
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const MAG_LOOKS = Object.keys(K.LOOKS).filter(k => k !== "custom" && !/^photo-art-(rich|temple)/.test(k)), MAG_FONTS = ["classic", "italic", "playfair_i", "lora_i", "garamond", "baskerville", "cinzel", "dmserif", "raleway", "montserrat"].filter(f => K.FONTS[f]);
  $("ezMagic").addEventListener("click", () => { st.look = pick(MAG_LOOKS); st.font = pick(MAG_FONTS); st.layout = pick(["classic", "classic", "bigquote", "editorial", "bold", "split"].filter(l => K.LAYOUTS[l])); st.pal = pick(Object.keys(K.PALETTES)); st.ov = null;
    const keep = {}; ["dx", "dy", "hl"].forEach(k => st.fmt[k] != null && (keep[k] = st.fmt[k]));
    st.fmt = { ...keep, ...(Math.random() < .6 ? { flt: pick(["warm", "golden", "soft", "faded", "cool"]), fls: .6 } : {}), ...(Math.random() < .7 ? { tfx: pick(["shadow", "shadow", "lift", "glow"]) } : {}), ...(Math.random() < .45 ? { stk: pick(["dove", "rays", "star", "laurel", "flourish", "olive", "spire"]), sp: "top", sz: .8 } : {}) };
    sync(); draw(true); });

  // ---------- Share / Save (still image, native share sheet) ----------
  $("ezShare").addEventListener("click", () => { st.mode = "still"; $("share").click(); });
  $("ezSave").addEventListener("click", () => { st.mode = "still"; $("save").click(); });

  // ---------- Make it a reel ----------
  let music = Store.get("ez-music", null) || (ReelKit.TRACKS[0] && ReelKit.TRACKS[0].id) || "none", aud = null;
  function previewMusic(id) { try { if (aud) { aud.pause(); aud = null; } const m = ReelKit.TRACKS.find(x => x.id === id); if (!m) return; aud = new Audio(m.file); aud.volume = .6; aud.play().catch(() => {}); setTimeout(() => { if (aud) { aud.pause(); aud = null; } }, 6000); } catch (e) {} }
  let reelBusy = false;
  async function makeReel() { if (reelBusy || !lastOpts) return; reelBusy = true; if (aud) { aud.pause(); aud = null; }
    const [W, H] = K.SIZES[st.size], o = { ...lastOpts, anim: st.anim === "none" ? "words" : st.anim };
    if (!(await VideoKit.supported(W, H))) { reelBusy = false; toast("This browser can't make videos. Tap Share for the image."); return; }
    const ui = VideoKit.progress($("ezStage"));
    try { await K.prepare(o); const b = await ReelKit.make({ W, H, music, draw: (c, w, h, t) => K.drawCard(c, w, h, o, t), onProgress: p => ui.set(p) }); ui.done();
      const f = new File([b], `six-months-of-light-reel-${st.size}.${VideoKit.ext(b)}`, { type: b.type }); reelReady(f, b.silent); }
    catch (e) { ui.done(); toast("Couldn't make the reel here. Tap Share for the image."); }
    finally { reelBusy = false; } }
  $("ezReel").addEventListener("click", makeReel);
  function reelReady(f, silent) { document.getElementById("ezReelBox")?.remove(); const u = URL.createObjectURL(f), d = document.createElement("div"); d.id = "ezReelBox"; d.className = "ez-pop"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Your reel");
    d.innerHTML = `<div class="ez-pop-in"><video src="${u}" autoplay loop playsinline ${silent ? "muted" : ""} controls></video><b>Your reel is ready</b>${silent ? `<p class="ez-help">This browser made it without music.</p>` : ""}
      <div class="ez-row c"><button type="button" class="ez-share" data-go>${svg("share", 18)}<span>Share reel</span></button><button type="button" class="ez-save" data-dl>Save</button><button type="button" class="ez-done" data-x>Close</button></div><p class="ez-help">The caption and link are copied when you share.</p></div>`;
    document.body.appendChild(d);
    d.addEventListener("click", async e => { const cap = $("caption").value;
      if (e.target.closest("[data-go]")) { try { navigator.clipboard.writeText(cap).catch(() => {}); } catch (x) {}
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).then(() => toast("Reel shared ✓ · caption copied")).catch(() => {}); else { const a = document.createElement("a"); a.href = u; a.download = f.name; a.click(); toast("Reel saved ✓"); } }
      if (e.target.closest("[data-dl]")) { const a = document.createElement("a"); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); toast("Reel saved ✓"); }
      if (e.target.closest("[data-x]")) { d.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } }); }

  // ---------- drafts (this device only) ----------
  const DK = "cardDrafts.v1", load = () => { try { return JSON.parse(localStorage.getItem(DK) || "[]"); } catch (e) { return []; } }, save = a => { try { localStorage.setItem(DK, JSON.stringify(a.slice(0, 24))); return true; } catch (e) { return false; } };
  function renderDrafts() { const box = $("ezDrafts"); if (!box) return; const a = load();
    box.innerHTML = a.length ? a.map((d, i) => `<div class="ez-d"><img src="${d.img}" alt="Draft from ${esc(d.when)}" data-open="${i}"><span>${esc(d.when)}</span><button type="button" class="ez-link" data-del="${i}">Delete</button></div>`).join("") : `<p class="ez-help">Drafts you save stay on this device.</p>`; }
  document.addEventListener("click", e => { if (e.target.id === "ezDraftSave") { const t = document.createElement("canvas"), r = cv.height / cv.width; t.width = 168; t.height = Math.round(168 * r); t.getContext("2d").drawImage(cv, 0, 0, t.width, t.height);
      const ok = save([{ img: t.toDataURL("image/jpeg", .7), when: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), s2: snap() }, ...load()]); renderDrafts(); toast(ok ? "Draft saved on this device ✓" : "Couldn't save: storage is full."); }
    if (e.target.id === "ezTips") { closeSheet(); tips(true); }
    const del = e.target.closest("#ezDrafts [data-del]"), op = e.target.closest("#ezDrafts [data-open]");
    if (del) { const a = load(); a.splice(+del.dataset.del, 1); save(a); renderDrafts(); }
    if (op) { const d = load()[+op.dataset.open]; if (!d) return;
      if (d.s2) restore(d.s2); else if (d.s) { const o = JSON.parse(d.s); Object.assign(st, o); st.fmt = { ...o.fmt }; if (d.t && talkById(d.t)) { st.t = d.t; st.q = d.q; } sync(); draw(true); } // drafts from the first preview
      closeSheet(); toast("Draft opened ✓"); } });

  // ---------- first-run tips (3 steps) ----------
  function tips(force) { if (!force && Store.get("ez-tips", 0)) return; Store.set("ez-tips", 1); const d = document.createElement("div"); d.className = "ez-pop ez-tips"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "How it works");
    d.innerHTML = `<div class="ez-pop-in"><b>Make a card in three taps</b><ol><li><span>1</span>Pick a <b>template</b> at the bottom.</li><li><span>2</span>Tap the <b>words</b> to style them. Tap a word to color it. Drag to move.</li><li><span>3</span>Tap <b>Share</b>, or <b>Make it a reel</b> for a video with music.</li></ol><button type="button" class="ez-share" data-x><span>Got it</span></button></div>`;
    document.body.appendChild(d); d.addEventListener("click", e => { if (e.target.closest("[data-x]") || e.target === d) d.remove(); }); }

  // ---------- start ----------
  let lastQ = ""; setInterval(() => { const k = JSON.stringify([curQuote(), st.src, st.ins, st.fmt.hl]); if (k !== lastQ && !document.hidden) { lastQ = k; tplThumbs(); } }, 1000);
  sync(); fit(); draw(true); setTimeout(() => tips(false), 900);
  window.__ez = { TPL, applyTpl, undo, redo, select, openSheet, closeSheet, makeReel, get sel() { return sel; } };
})();
