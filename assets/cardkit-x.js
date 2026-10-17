// CardKit X: card studio overhaul (filters, text effects, ornaments, "Your colors" background).
// Loaded after cardkit-plus.js and before the builder. Everything is driven by o.fmt keys so
// URLs, caches, PNG and MP4 exports all pick the new settings up automatically:
//   flt (filter id), fls (filter strength 0..1), tfx (text effect), stk (ornament id), sp (ornament spot), sz (ornament size), so (ornament opacity),
//   bg1 / bg2 (hex, "Your colors"), gd (gradient direction)
(function () {
  const K = window.CardKit; if (!K) return;
  const TAU = Math.PI * 2, c01 = x => Math.max(0, Math.min(1, x)), ease = x => 1 - Math.pow(1 - c01(x), 3);
  const hex = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16) || 0);
  const lum = h => { const [r, g, b] = hex(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

  // ---------- filters (background only, so text stays crisp) ----------
  const FILTERS = { none: "Original", warm: "Warm", golden: "Golden hour", soft: "Soft light", cool: "Cool", bw: "Black & white", sepia: "Sepia", faded: "Faded film", vivid: "Vivid", dusk: "Dusk" };
  function applyFilter(c, id, s) {
    if (!id || id === "none" || !FILTERS[id]) return; const W = c.canvas.width, H = c.canvas.height; s = s == null ? 1 : c01(s);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const fill = (op, col, a = 1) => { c.globalCompositeOperation = op; c.globalAlpha = a * s; c.fillStyle = col; c.fillRect(0, 0, W, H); };
    if (id === "warm") fill("soft-light", "rgb(255,160,80)", .55);
    if (id === "golden") { fill("overlay", "rgb(255,196,110)", .45); const g = c.createRadialGradient(W * .5, H * .15, 0, W * .5, H * .15, Math.max(W, H) * .8); g.addColorStop(0, "rgba(255,226,160,.45)"); g.addColorStop(1, "rgba(255,226,160,0)"); c.globalCompositeOperation = "screen"; c.globalAlpha = s; c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (id === "soft") fill("screen", "rgb(255,246,232)", .22);
    if (id === "cool") fill("soft-light", "rgb(80,140,255)", .5);
    if (id === "bw") fill("saturation", "#808080", 1);
    if (id === "sepia") { fill("saturation", "#808080", 1); fill("color", "rgb(170,120,70)", .75); }
    if (id === "faded") { fill("lighten", "rgb(58,52,64)", .9); fill("saturation", "#808080", .35); fill("screen", "rgb(255,240,225)", .08); }
    if (id === "vivid") { c.globalCompositeOperation = "soft-light"; c.globalAlpha = .6 * s; c.drawImage(c.canvas, 0, 0); }
    if (id === "dusk") { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgb(70,60,140)"); g.addColorStop(1, "rgb(240,140,110)"); c.globalCompositeOperation = "soft-light"; c.globalAlpha = .6 * s; c.fillStyle = g; c.fillRect(0, 0, W, H); }
    c.restore(); }

  // ---------- "Your colors" background ----------
  let curFmt = {};
  K.LOOKS.custom = { name: "Your colors", group: "Your colors", ov: 0, get dark() { return lum(curFmt.bg1 || "#1d2340") * .6 + lum(curFmt.bg2 || curFmt.bg1 || "#5a3a5e") * .4 < .55 ? 1 : 0; },
    paint(c, W, H, P, t, o) { const f = (o && o.fmt) || {}, a = f.bg1 || "#1d2340", b = f.bg2 || a, d = f.gd || "v";
      const g = d === "r" ? c.createRadialGradient(W / 2, H * .42, 0, W / 2, H * .42, Math.max(W, H) * .75) : d === "d" ? c.createLinearGradient(0, 0, W, H) : c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H); } };

  // wrap every look's painter so the filter lands on the background layer (also inside the blur pass)
  const wrapLook = L => { if (!L || L.__x) return; const p = L.paint; L.paint = function (c, W, H, P, t, o, look) { p.call(this, c, W, H, P, t, o, look); const f = (o && o.fmt) || {}; if (f.flt) applyFilter(c, f.flt, f.fls); }; L.__x = 1; };
  Object.values(K.LOOKS).forEach(wrapLook);

  // ---------- ornaments ----------
  const ORN = { none: "None", dove: "Dove", olive: "Olive branch", rays: "Sunburst", star: "Star", heart: "Heart", book: "Open book", spire: "Temple spire", laurel: "Laurel", flourish: "Flourish", lily: "Lily" };
  const SPOTS = { top: "Top", tl: "Top left", tr: "Top right", mid: "Above quote", bl: "Bottom left", br: "Bottom right" };
  function ornament(c, id, x, y, r, col) {
    c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = Math.max(1.5, r * .06);
    const B = () => c.beginPath(), leaf = (lx, ly, l, w, a) => { c.save(); c.translate(lx, ly); c.rotate(a); B(); c.moveTo(0, 0); c.quadraticCurveTo(l * .5, -w, l, 0); c.quadraticCurveTo(l * .5, w, 0, 0); c.fill(); c.restore(); };
    if (id === "dove") { B(); c.moveTo(-r, r * .05); c.bezierCurveTo(-r * .5, -r * .25, -r * .1, -r * .05, r * .15, -r * .1); c.bezierCurveTo(r * .35, -r * .35, r * .65, -r * .3, r * .7, -r * .15); c.lineTo(r, -r * .1); c.lineTo(r * .7, 0); c.bezierCurveTo(r * .6, r * .35, r * .1, r * .45, -r * .35, r * .3); c.lineTo(-r * .85, r * .45); c.lineTo(-r * .55, r * .18); c.closePath(); c.fill();
      B(); c.moveTo(-r * .1, -r * .05); c.bezierCurveTo(-r * .45, -r * .9, r * .05, -r * 1.05, r * .3, -r * .75); c.bezierCurveTo(r * .2, -r * .45, r * .15, -r * .2, r * .15, -r * .1); c.closePath(); c.fill(); }
    if (id === "olive") { c.save(); c.rotate(-.35); B(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -r * .2, r, 0); c.stroke(); for (let i = 0; i < 6; i++) { const t = -0.8 + i * .32; leaf(t * r, -Math.abs(t) * r * .05 - r * .05, r * .42, r * .12, -.8 - (i % 2) * -.1); leaf(t * r + r * .1, r * .02, r * .38, r * .11, .7); } c.beginPath(); c.arc(r * .55, r * .2, r * .09, 0, TAU); c.fill(); c.beginPath(); c.arc(-r * .2, r * .22, r * .08, 0, TAU); c.fill(); c.restore(); }
    if (id === "rays") { for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, l = i % 2 ? r * .75 : r; B(); c.moveTo(Math.cos(a) * r * .38, Math.sin(a) * r * .38); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke(); } B(); c.arc(0, 0, r * .26, 0, TAU); c.fill(); }
    if (id === "star") { B(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .4 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); }
    if (id === "heart") { B(); c.moveTo(0, r * .85); c.bezierCurveTo(-r * 1.2, 0, -r * .7, -r * .95, 0, -r * .35); c.bezierCurveTo(r * .7, -r * .95, r * 1.2, 0, 0, r * .85); c.fill(); }
    if (id === "book") { for (const s of [-1, 1]) { B(); c.moveTo(0, -r * .35); c.quadraticCurveTo(s * r * .5, -r * .6, s * r, -r * .45); c.lineTo(s * r, r * .45); c.quadraticCurveTo(s * r * .5, r * .3, 0, r * .55); c.closePath(); c.globalAlpha = .9; c.fill(); }
      c.globalAlpha = 1; c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = Math.max(1, r * .03); for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { B(); const yy = -r * .2 + i * r * .17; c.moveTo(s * r * .15, yy); c.quadraticCurveTo(s * r * .5, yy - r * .15, s * r * .85, yy - r * .08); c.stroke(); } }
    if (id === "spire") { B(); c.moveTo(0, -r); c.lineTo(r * .12, -r * .35); c.lineTo(r * .22, -r * .35); c.lineTo(r * .22, r * .15); c.lineTo(r * .45, r * .15); c.lineTo(r * .45, r); c.lineTo(-r * .45, r); c.lineTo(-r * .45, r * .15); c.lineTo(-r * .22, r * .15); c.lineTo(-r * .22, -r * .35); c.lineTo(-r * .12, -r * .35); c.closePath(); c.fill();
      c.beginPath(); c.arc(0, -r * 1.05, r * .06, 0, TAU); c.fill(); }
    if (id === "laurel") { for (const s of [-1, 1]) { c.save(); c.scale(s, 1); B(); c.arc(0, r * .1, r * .85, Math.PI * .55, Math.PI * 1.25); c.stroke(); for (let i = 0; i < 7; i++) { const a = Math.PI * (.6 + i * .095), px = Math.cos(a) * r * .85, py = r * .1 + Math.sin(a) * r * .85; leaf(px, py, r * .32, r * .1, a + Math.PI * .75); } c.restore(); } }
    if (id === "flourish") { B(); c.moveTo(-r * 1.4, 0); c.bezierCurveTo(-r, -r * .35, -r * .5, r * .35, -r * .12, 0); c.moveTo(r * 1.4, 0); c.bezierCurveTo(r, -r * .35, r * .5, r * .35, r * .12, 0); c.stroke(); B(); c.moveTo(0, -r * .16); c.lineTo(r * .14, 0); c.lineTo(0, r * .16); c.lineTo(-r * .14, 0); c.closePath(); c.fill(); }
    if (id === "lily") { for (const a of [-.55, 0, .55]) leaf(0, r * .3, r * .95, r * .3, -Math.PI / 2 + a); B(); c.moveTo(0, r * .3); c.lineTo(0, r); c.stroke(); leaf(0, r * .75, r * .45, r * .12, -.4); }
    c.restore(); }
  function spotXY(sp, W, H, u) { const m = u * .13; return { top: [W / 2, u * .068], tl: [m, m], tr: [W - m, m], mid: [W / 2, H * .3], bl: [m, H - u * .3], br: [W - m, H - u * .3] }[sp] || [W / 2, u * .068]; }

  // ---------- text effects (applied to text drawn after the background) ----------
  const TFX = { none: "None", shadow: "Soft shadow", lift: "Lifted", glow: "Glow", outline: "Outline", emboss: "Engraved" };
  let bgDone = false; const origPaints = new Set();
  Object.values(K.LOOKS).forEach(L => { const p = L.paint; L.paint = function () { const r = p.apply(this, arguments); bgDone = true; return r; }; });

  const origDraw = K.drawCard;
  K.drawCard = function (ctx, W, H, o, time) {
    const f = (o && o.fmt) || {}; curFmt = f;
    const tfx = TFX[f.tfx] && f.tfx !== "none" ? f.tfx : null;
    let restore = null;
    if (tfx) { const ft = ctx.fillText, u = Math.min(W, H); bgDone = false;
      ctx.fillText = function (s, x, y, mw) {
        if (!bgDone) return mw === undefined ? ft.call(this, s, x, y) : ft.call(this, s, x, y, mw);
        const call = () => mw === undefined ? ft.call(this, s, x, y) : ft.call(this, s, x, y, mw);
        this.save(); const fs = parseFloat((/(\d+(\.\d+)?)px/.exec(this.font) || [0, 30])[1]), dark = lum(String(this.fillStyle).startsWith("#") ? this.fillStyle : "#ffffff") > .5;
        if (tfx === "shadow") { this.shadowColor = dark ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.25)"; this.shadowBlur = fs * .35; this.shadowOffsetY = fs * .06; call(); }
        else if (tfx === "lift") { this.shadowColor = dark ? "rgba(0,0,0,.7)" : "rgba(60,40,20,.35)"; this.shadowBlur = 0; this.shadowOffsetX = fs * .04; this.shadowOffsetY = fs * .05; call(); }
        else if (tfx === "glow") { this.shadowColor = dark ? "rgba(255,236,190,.85)" : "rgba(255,255,255,.95)"; this.shadowBlur = fs * .5; call(); this.shadowBlur = fs * .2; call(); }
        else if (tfx === "outline") { this.lineWidth = Math.max(1, fs * .09); this.lineJoin = "round"; this.strokeStyle = dark ? "rgba(10,12,24,.85)" : "rgba(255,255,255,.9)"; mw === undefined ? this.strokeText(s, x, y) : this.strokeText(s, x, y, mw); call(); }
        else if (tfx === "emboss") { const fsS = this.fillStyle; this.fillStyle = dark ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.8)"; mw === undefined ? ft.call(this, s, x, y + fs * .035) : ft.call(this, s, x, y + fs * .035, mw); this.fillStyle = fsS; call(); }
        else call();
        this.restore(); };
      restore = () => { delete ctx.fillText; if (ctx.fillText !== ft) ctx.fillText = ft; }; }
    try { origDraw.call(this, ctx, W, H, o, time); } finally { restore && restore(); }
    // ornament on top (fades in with animated cards)
    if (f.stk && ORN[f.stk] && f.stk !== "none") { const u = Math.min(W, H), L = K.LOOKS[o.look] || {}, P = K.PALETTES[o.palette] || K.PALETTES.gold;
      const col = f.acc || (L.dark ? P.acc : P.dk), r = u * .055 * (f.sz || 1), [x, y] = spotXY(f.sp, W, H, u);
      const a = (f.so == null ? .9 : f.so) * (isFinite(time) && o.anim && o.anim !== "none" ? ease(((time % 10) - .3) / 1.2) : 1);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.shadowColor = L.dark ? "rgba(0,0,0,.35)" : "rgba(0,0,0,.12)"; ctx.shadowBlur = r * .3; ornament(ctx, f.stk, x, y, r, col); ctx.restore(); }
  };
  // fillText is an own property only while patched; prototype method otherwise
  K.X = { FILTERS, TFX, ORN, SPOTS, ornament, applyFilter, lum };
})();
