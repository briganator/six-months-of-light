// CardKit v4 — Six Months of Light card studio renderer.
// drawCard(ctx, W, H, opts, time): time in seconds; Infinity = final still frame.
// opts: { kind: "quote"|"insight", quote, speaker, title, note, ins:{...}, look, palette, font, align, overlay, url }
(function () {
  const SERIF = '"Cormorant Garamond", Georgia, serif', SANS = 'Inter, system-ui, sans-serif';
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
  const easeIO = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const c01 = x => Math.max(0, Math.min(1, x));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function wrap(ctx, text, maxW) {
    const words = String(text).split(" "), lines = []; let l = "";
    for (const w of words) { const t = l ? l + " " + w : w; if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; }
    lines.push(l); return lines;
  }
  function spaced(ctx, s, x, y, sp, align = "center") {
    const w = [...s].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + sp * (s.length - 1);
    let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; const prev = ctx.textAlign; ctx.textAlign = "left";
    for (const ch of s) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; } ctx.textAlign = prev; return w;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ---------- palettes (accent colors; tint for some looks) ----------
  const PALETTES = {
    gold:   { name: "Gold",   acc: "#f1d394", acc2: "#d8a95b", dk: "#8a5f1f", tint: [241, 211, 148] },
    rose:   { name: "Rose",   acc: "#f4bfb0", acc2: "#d98a78", dk: "#9a4634", tint: [227, 166, 147] },
    sky:    { name: "Sky",    acc: "#c3dbf4", acc2: "#86afd8", dk: "#33608e", tint: [143, 178, 214] },
    sage:   { name: "Sage",   acc: "#d6e6c0", acc2: "#9fbb84", dk: "#4a6534", tint: [159, 187, 132] },
    silver: { name: "Silver", acc: "#ecebf3", acc2: "#b9b4c8", dk: "#4f4b5e", tint: [200, 196, 214] },
  };
  const textTheme = (look, P) => look.dark
    ? { dark: 1, ink: "#fffaf0", sub: "rgba(255,246,228,.8)", gold: P.acc, gold2: P.acc2, qr: ["#0d1326", "#fffaf0"], sun: hex(P.acc) }
    : { dark: 0, ink: "#1d1b2e", sub: "rgba(29,27,46,.74)", gold: P.dk, gold2: P.acc2, qr: ["#1d1b2e", "#fffdf8"], sun: [255, 250, 236] };

  // ---------- painters ----------
  const SKY = {
    dusk: { sky: ["#070b18", "#141c3c", "#2a2d5c", "#5a3a5e", "#b06f68", "#e7a983"], sun: [255, 228, 180] },
    midnight: { sky: ["#03060f", "#0a1128", "#141c3c", "#1f2350", "#2f2a55", "#4b3459"], sun: [246, 214, 160] },
    dawn: { sky: ["#fdf8f0", "#f9ecdc", "#f4dcc7", "#eec5b2", "#e3a693", "#d68f80"], sun: [255, 250, 236] },
  };
  function grad(ctx, W, H, stops) { const g = ctx.createLinearGradient(0, 0, 0, H); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function glow(ctx, x, y, r, c, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(.4, rgba(c, a * .35)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function sky(ctx, W, H, sk, t, bg, light) {
    grad(ctx, W, H, sk.sky); const D = Math.max(W, H), sx = W / 2, sy = H * 1.02;
    if (bg === "aurora") aurora(ctx, W, H, t);
    if (bg !== "aurora") { ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * .02);
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, w = .022 + (i % 3) * .008;
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, D * 1.05); rg.addColorStop(0, rgba(sk.sun, .16)); rg.addColorStop(.55, rgba(sk.sun, .035)); rg.addColorStop(1, rgba(sk.sun, 0));
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, D * 1.05, a - w, a + w); ctx.closePath(); ctx.fill(); }
      ctx.restore(); }
    [[.95, .7], [.55, .42], [.26, .7]].forEach(([r, a]) => glow(ctx, sx, sy, D * r, sk.sun, a));
    [[.18, .2, .32, [150, 140, 235]], [.85, .32, .28, [227, 166, 147]], [.6, .08, .22, [246, 223, 166]]].forEach(([x, y, r, c], i) =>
      glow(ctx, W * (x + Math.sin(t * .25 + i * 2) * .04), H * (y + Math.cos(t * .2 + i) * .025), D * r, c, .18));
    if (bg === "mountains") ridges(ctx, W, H, sk, t, light);
    vignette(ctx, W, H, light ? "rgba(120,70,50,.12)" : "rgba(0,0,0,.35)");
  }
  function vignette(ctx, W, H, col) { const D = Math.max(W, H), v = ctx.createRadialGradient(W / 2, H * .45, D * .3, W / 2, H * .45, D * .85); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, col); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  function ridges(ctx, W, H, sk, t, light) {
    const layers = [[.72, .05, light ? "rgba(196,124,108,.35)" : "rgba(107,74,110,.55)"], [.8, .035, light ? "rgba(160,96,90,.45)" : "rgba(42,37,80,.85)"], [.88, .025, light ? "rgba(120,70,70,.5)" : "rgba(11,16,34,.92)"]];
    layers.forEach(([base, amp, col], li) => { const off = t * (4 + li * 6); ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += W / 60) { const u = (x + off) / W; ctx.lineTo(x, H * (base - amp * (Math.sin(u * 7 + li * 2) * .6 + Math.sin(u * 17 + li) * .25 + Math.sin(u * 3.1) * .5))); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      if (li === 0) { ctx.strokeStyle = rgba(sk.sun, .45); ctx.lineWidth = Math.max(1, W / 800); ctx.stroke(); } });
  }
  function aurora(ctx, W, H, t) {
    [[.28, [150, 140, 235]], [.4, [227, 166, 147]], [.52, [246, 223, 166]]].forEach(([y, c], i) => {
      ctx.beginPath(); ctx.moveTo(0, H * y);
      for (let x = 0; x <= W; x += W / 40) ctx.lineTo(x, H * y + Math.sin(x / W * 5 + t * .5 + i) * H * .05);
      ctx.lineTo(W, H * y + H * .18); ctx.lineTo(0, H * y + H * .18); ctx.closePath();
      const g = ctx.createLinearGradient(0, H * y - H * .05, 0, H * y + H * .2); g.addColorStop(0, rgba(c, 0)); g.addColorStop(.35, rgba(c, .22)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fill(); });
  }
  function stars(ctx, W, H, t, n, maxY, seed = 7) {
    const r = rng(seed), u = Math.min(W, H);
    for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * maxY, s = r(), tw = .55 + .45 * Math.sin(t * (1 + s * 2) + i);
      ctx.fillStyle = `rgba(255,248,230,${(.25 + s * .7) * tw})`; ctx.beginPath(); ctx.arc(x, y, u * (.0008 + s * s * .0028), 0, 7); ctx.fill(); }
  }
  function nightSky(ctx, W, H, P, t) {
    grad(ctx, W, H, ["#03050d", "#0a1030", "#172350", "#2a2f5e"]);
    ctx.save(); ctx.translate(W * .5, H * .45); ctx.rotate(-.5); const D = Math.max(W, H);
    for (let i = 0; i < 6; i++) { const g = ctx.createRadialGradient(0, (i - 3) * D * .08, 0, 0, (i - 3) * D * .08, D * .3); g.addColorStop(0, "rgba(190,180,255,.07)"); g.addColorStop(1, "rgba(190,180,255,0)"); ctx.fillStyle = g; ctx.fillRect(-D, -D, D * 2, D * 2); }
    ctx.restore();
    stars(ctx, W, H, t, Math.round(W * H / 2600), 1, 11);
    glow(ctx, W * .5, H * 1.05, Math.max(W, H) * .5, P.tint, .22);
    ctx.fillStyle = "#05070f"; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += W / 50) ctx.lineTo(x, H * (.93 - .025 * Math.sin(x / W * 6) - .015 * Math.sin(x / W * 17)));
    ctx.lineTo(W, H); ctx.fill();
  }
  // Original temple silhouette (drawn here; not a copy of any specific building's plans).
  function temple(ctx, cx, base, h, fill, win, edge) {
    const P = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * h, base - y * h) : ctx.moveTo(cx + x * h, base - y * h)); ctx.closePath(); };
    ctx.fillStyle = fill;
    // steps + main hall
    P([[-.72, 0], [.72, 0], [.72, .03], [-.72, .03]]); ctx.fill();
    P([[-.58, .03], [.58, .03], [.58, .34], [-.58, .34]]); ctx.fill();
    // side towers with spires
    for (const s of [-1, 1]) { P([[s * .36, .34], [s * .5, .34], [s * .5, .52], [s * .465, .55], [s * .43, .66], [s * .395, .55], [s * .36, .52]]); ctx.fill(); }
    // central tower, belfry and spire
    P([[-.12, .34], [.12, .34], [.12, .6], [.09, .6], [.09, .72], [.05, .74], [0, 1], [-.05, .74], [-.09, .72], [-.09, .6], [-.12, .6]]); ctx.fill();
    if (edge) { ctx.save(); ctx.strokeStyle = edge; ctx.lineWidth = h * .004; ctx.stroke(); ctx.restore(); }
    // arched windows
    ctx.fillStyle = win; const arch = (x, y, w, hh) => { ctx.beginPath(); ctx.moveTo(cx + (x - w / 2) * h, base - y * h); ctx.lineTo(cx + (x - w / 2) * h, base - (y + hh - w / 2) * h); ctx.arc(cx + x * h, base - (y + hh - w / 2) * h, w / 2 * h, Math.PI, 0); ctx.lineTo(cx + (x + w / 2) * h, base - y * h); ctx.closePath(); ctx.fill(); };
    [-.47, -.27, -.17, .17, .27, .47].forEach(x => arch(x, .09, .05, .17)); arch(0, .4, .06, .14); arch(0, .07, .09, .2);
    for (const s of [-1, 1]) arch(s * .43, .4, .035, .09);
  }
  function templeScene(ctx, W, H, P, t, v, o) {
    const u = Math.min(W, H), D = Math.max(W, H);
    if (v === "dawn") grad(ctx, W, H, ["#fdf7ee", "#f9e9d6", "#f3d4bd", "#eab89f"]);
    else if (v === "night") grad(ctx, W, H, ["#02040c", "#08102c", "#121c46", "#1d2858"]);
    else grad(ctx, W, H, ["#0a0f24", "#232a58", "#5a3d66", "#b8746a", "#eaa67f"]);
    if (v === "night") stars(ctx, W, H, t, Math.round(W * H / 3500), .75, 3);
    const tall = H / W > 1.3, h = (tall ? W * .78 : u * .72) * (W / H > 1.3 ? .9 : 1), base = H - u * .2;
    glow(ctx, W / 2, base - h * .45, D * .55, v === "night" ? [246, 214, 160] : P.tint, v === "dawn" ? .5 : .32);
    if (v !== "dawn") { ctx.save(); ctx.translate(W / 2, base - h * .4); ctx.rotate(t * .015); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; ctx.fillStyle = rgba(P.tint, .045); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, D, a - .03, a + .03); ctx.fill(); } ctx.restore(); }
    const winA = v === "night" ? .55 + .1 * Math.sin(t * 1.3) : .3;
    if (v === "dawn") temple(ctx, W / 2, base, h, "rgba(255,255,255,.62)", "rgba(216,169,91,.18)", "rgba(168,122,53,.3)");
    else temple(ctx, W / 2, base, h, v === "night" ? "rgba(40,50,96,.72)" : "rgba(30,24,58,.62)", `rgba(255,222,160,${winA})`, rgba(P.tint, .35));
    ctx.fillStyle = v === "dawn" ? "rgba(214,160,130,.55)" : "rgba(6,8,20,.85)"; ctx.fillRect(0, base, W, H - base);
    const hg = ctx.createLinearGradient(0, 0, W, 0); hg.addColorStop(0, rgba(P.tint, 0)); hg.addColorStop(.5, rgba(P.tint, .7)); hg.addColorStop(1, rgba(P.tint, 0)); ctx.fillStyle = hg; ctx.fillRect(0, base, W, Math.max(1, u / 600));
  }
  function stained(ctx, W, H, P, t) {
    const r = rng(42), u = Math.min(W, H), n = W / H > 1.3 ? 9 : 6, cell = W / n, rows = Math.ceil(H / cell) + 1;
    const jewel = [[38, 64, 140], [140, 30, 52], [196, 146, 52], [40, 110, 84], [92, 56, 140], [26, 100, 150], P.tint];
    const pts = []; for (let y = 0; y <= rows; y++) { pts.push([]); for (let x = 0; x <= n; x++) pts[y].push([x * cell + (x % n ? (r() - .5) * cell * .6 : 0), y * cell + (y ? (r() - .5) * cell * .6 : 0)]); }
    const lx = W / 2 + Math.sin(t * .3) * W * .1, ly = H * .25;
    for (let y = 0; y < rows; y++) for (let x = 0; x < n; x++) {
      const a = pts[y][x], b = pts[y][x + 1], c = pts[y + 1][x + 1], d = pts[y + 1][x];
      for (const tri of (r() > .5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]])) {
        const col = jewel[Math.floor(r() * jewel.length)], mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const L = 1.25 - Math.hypot(mx - lx, my - ly) / Math.max(W, H) * 1.1;
        ctx.fillStyle = `rgb(${col.map(v => Math.min(255, Math.round(v * L + 20 * L))).join(",")})`;
        ctx.beginPath(); ctx.moveTo(...tri[0]); ctx.lineTo(...tri[1]); ctx.lineTo(...tri[2]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#17120d"; ctx.lineWidth = u * .007; ctx.lineJoin = "round"; ctx.stroke();
      }
    }
    glow(ctx, lx, ly, Math.max(W, H) * .6, [255, 240, 200], .18);
  }
  function paperBase(ctx, W, H, seed, c1, c2) {
    grad(ctx, W, H, [c1, c2]); const r = rng(seed), u = Math.min(W, H);
    for (let i = 0; i < W * H / 900; i++) { ctx.fillStyle = `rgba(120,90,50,${r() * .06})`; ctx.fillRect(r() * W, r() * H, u * .002 * (1 + r()), u * .002 * (1 + r())); }
    vignette(ctx, W, H, "rgba(120,84,40,.22)");
  }
  function paper(ctx, W, H, P) {
    paperBase(ctx, W, H, 5, "#f8f0de", "#efe1c4"); const u = Math.min(W, H), m = u * .085, gut = W / 2;
    ctx.strokeStyle = "rgba(110,80,40,.16)"; ctx.lineWidth = Math.max(1, u / 900);
    ctx.beginPath(); ctx.moveTo(gut, m * 1.6); ctx.lineTo(gut, H - m * 1.6); ctx.stroke();
    const r = rng(9); ctx.fillStyle = "rgba(60,40,20,.055)";
    for (let y = m * 1.8; y < H - m * 1.8; y += u * .026) for (const [x0, x1] of [[m * 1.2, gut - u * .03], [gut + u * .03, W - m * 1.2]]) { const w = (x1 - x0) * (.7 + r() * .3); ctx.fillRect(x0, y, w, u * .006); }
    ctx.fillStyle = rgba(hex(P.dk), .5); ctx.font = `600 ${u * .022}px ${SERIF}`; ctx.textAlign = "center";
  }
  function hymn(ctx, W, H, P, t) {
    paperBase(ctx, W, H, 13, "#fbf5e8", "#f1e6cf"); const u = Math.min(W, H), r = rng(21), sp = u * .016;
    ctx.strokeStyle = "rgba(60,40,30,.14)"; ctx.fillStyle = "rgba(60,40,30,.13)"; ctx.lineWidth = Math.max(1, u / 800);
    for (let y0 = u * .1; y0 < H - u * .12; y0 += u * .17) {
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(u * .07, y0 + k * sp); ctx.lineTo(W - u * .07, y0 + k * sp); ctx.stroke(); }
      for (let x = u * .16; x < W - u * .1; x += u * (.06 + r() * .05)) { const y = y0 + Math.floor(r() * 9) * sp / 2;
        ctx.save(); ctx.translate(x, y); ctx.rotate(-.35); ctx.beginPath(); ctx.ellipse(0, 0, sp * .62, sp * .44, 0, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillRect(x + sp * .5, y - sp * 3, Math.max(1, u / 700), sp * 3); }
      ctx.beginPath(); ctx.moveTo(W - u * .07, y0); ctx.lineTo(W - u * .07, y0 + 4 * sp); ctx.stroke();
    }
    glow(ctx, W / 2, H * .45, Math.max(W, H) * .5, [255, 250, 238], .55);
  }
  function watercolor(ctx, W, H, P) {
    ctx.fillStyle = "#fdfaf4"; ctx.fillRect(0, 0, W, H); const r = rng(77), D = Math.max(W, H);
    const cols = [P.tint, [227, 166, 147], [164, 147, 207], [143, 178, 214]];
    for (let i = 0; i < 26; i++) { const c = cols[i % cols.length], x = r() * W, y = (r() < .5 ? r() * .3 : .7 + r() * .3) * H, R = D * (.12 + r() * .22);
      const g = ctx.createRadialGradient(x, y, R * .2, x, y, R); g.addColorStop(0, rgba(c, .16)); g.addColorStop(.85, rgba(c, .1)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); }
    const r2 = rng(3); for (let i = 0; i < W * H / 1500; i++) { ctx.fillStyle = `rgba(90,70,60,${r2() * .035})`; ctx.fillRect(r2() * W, r2() * H, 2, 2); }
    glow(ctx, W / 2, H * .45, D * .42, [253, 250, 244], .8);
  }
  function oliveBranch(ctx, x, y, len, ang, s, r, leafCol, oliveCol) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = "rgba(70,60,40,.9)"; ctx.lineWidth = len * .012; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -len * .08, len, 0); ctx.stroke();
    for (let i = 1; i < 13; i++) { const k = i / 13, px = len * k, py = -len * .08 * 4 * k * (1 - k) * .5, side = i % 2 ? 1 : -1, L = len * (.17 - k * .05);
      ctx.save(); ctx.translate(px, py); ctx.rotate(side * (.6 + r() * .3) + Math.sin(s + i) * .03); ctx.fillStyle = leafCol[i % leafCol.length];
      ctx.beginPath(); ctx.ellipse(L * .5, 0, L * .5, L * .12, 0, 0, 7); ctx.fill(); ctx.restore();
      if (i % 4 === 2) { ctx.fillStyle = oliveCol; ctx.beginPath(); ctx.ellipse(px, py + len * .035, len * .022, len * .03, 0, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  function olive(ctx, W, H, P, t) {
    grad(ctx, W, H, ["#0f1a12", "#1c2b1d", "#2d3b25", "#43482c"]); const u = Math.min(W, H), r = rng(31);
    glow(ctx, W * .72, H * .14, Math.max(W, H) * .45, [236, 230, 200], .22);
    ctx.fillStyle = "rgba(240,236,214,.85)"; ctx.beginPath(); ctx.arc(W * .72, H * .14, u * .045, 0, 7); ctx.fill();
    const leaves = ["rgba(150,170,120,.85)", "rgba(110,135,95,.85)", "rgba(185,195,160,.75)"];
    oliveBranch(ctx, -u * .02, H * .3, u * .62, -.35 + Math.sin(t * .4) * .015, t, r, leaves, "rgba(40,45,30,.95)");
    oliveBranch(ctx, W + u * .02, H * .78, u * .7, Math.PI + .3 + Math.sin(t * .35) * .015, t, r, leaves, "rgba(40,45,30,.95)");
    vignette(ctx, W, H, "rgba(0,0,0,.4)");
  }
  function nature(ctx, W, H, P, t) {
    grad(ctx, W, H, ["#0c1428", "#26345e", "#6b6386", "#d6a98b", "#f1cf9e"]); const u = Math.min(W, H), r = rng(55), hz = H * .74;
    glow(ctx, W * .5, hz, Math.max(W, H) * .6, P.tint, .45);
    const layer = (base, hgt, col, seed) => { const rr = rng(seed); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = -u * .05; x < W + u * .05; x += u * (.035 + rr() * .03)) { const th = hgt * (.6 + rr() * .5); ctx.lineTo(x, base); ctx.lineTo(x + u * .02, base - th); ctx.lineTo(x + u * .04, base); }
      ctx.lineTo(W, hz); ctx.closePath(); ctx.fill(); };
    layer(hz, u * .14, "rgba(52,48,84,.7)", 1); layer(hz, u * .1, "rgba(20,22,44,.92)", 2);
    const g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, "rgba(214,169,139,.55)"); g.addColorStop(1, "rgba(12,16,34,.95)"); ctx.fillStyle = g; ctx.fillRect(0, hz, W, H - hz);
    ctx.strokeStyle = rgba(P.tint, .35); ctx.lineWidth = Math.max(1, u / 500);
    for (let i = 0; i < 9; i++) { const y = hz + (H - hz) * (i + 1) / 11, w = W * (.08 + r() * .2), x = W / 2 - w / 2 + Math.sin(t * .6 + i) * u * .02; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); }
  }
  function minimal(dark) { return (ctx, W, H, P) => {
    const u = Math.min(W, H);
    if (dark) grad(ctx, W, H, ["#12141c", "#1b1e2a"]); else { const c = P.tint; grad(ctx, W, H, [rgba([253, 251, 246], 1), rgba(c.map(v => Math.round(v * .18 + 253 * .82)), 1)]); }
    ctx.fillStyle = dark ? P.acc2 : P.dk; ctx.globalAlpha = .9; ctx.fillRect(W / 2 - u * .04, H - u * .045 - 1, u * .08, Math.max(2, u / 360)); ctx.globalAlpha = 1;
  }; }
  // ---------- v3 original drawn looks (all drawn here in code; no outside artwork) ----------
  const TAU = Math.PI * 2, LP = t => isFinite(t) ? t / 10 * TAU : 1.9; // loop phase: everything repeats every 10s
  function raysAt(ctx, x, y, D, col, a, n, t) { ctx.save(); ctx.translate(x, y); ctx.rotate(LP(t) * .02); for (let i = 0; i < n; i++) { const an = i / n * TAU, w = .025 + (i % 3) * .01;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, D); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, D, an - w, an + w); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  function tomb(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H), tall = H / W > 1.3;
    grad(ctx, W, H, ["#0d1330", "#28305e", "#6d4a6a", "#d4876c", "#f4c88f"]);
    const sx = W * .28, sy = H * (tall ? .8 : .78);
    raysAt(ctx, sx, sy, D * 1.1, [255, 226, 176], .13, 26, t); glow(ctx, sx, sy, D * .55, [255, 222, 170], .55); glow(ctx, sx, sy, u * .08, [255, 245, 220], .9);
    // hillside with the garden tomb (right)
    ctx.fillStyle = "#1b1426"; ctx.beginPath(); ctx.moveTo(W * .38, H); ctx.bezierCurveTo(W * .45, H * .84, W * .55, H * .72, W * .78, H * .7); ctx.quadraticCurveTo(W * .95, H * .69, W * 1.02, H * .72); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(P.tint, .4); ctx.lineWidth = Math.max(1, u / 500); ctx.stroke();
    const ox = W * .7, oy = H * .9, ow = u * .15, oh = u * .19;
    ctx.fillStyle = "#06040b"; ctx.beginPath(); ctx.moveTo(ox - ow / 2, oy); ctx.lineTo(ox - ow / 2, oy - oh + ow / 2); ctx.arc(ox, oy - oh + ow / 2, ow / 2, Math.PI, 0); ctx.lineTo(ox + ow / 2, oy); ctx.closePath(); ctx.fill();
    glow(ctx, ox, oy - oh * .35, ow * .9, [255, 226, 180], .28 + .06 * Math.sin(LP(t)));
    const rx = W * .88, ry = oy - u * .085, rr = u * .095; ctx.fillStyle = "#2b2236"; ctx.beginPath(); ctx.arc(rx, ry, rr, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(P.tint, .55); ctx.lineWidth = Math.max(1.5, u / 400); ctx.beginPath(); ctx.arc(rx, ry, rr, Math.PI * .85, Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = "#0d0a14"; ctx.fillRect(0, oy, W, H - oy);
    const r = rng(12); ctx.strokeStyle = "rgba(12,10,20,.9)"; ctx.lineWidth = Math.max(1, u / 600);
    for (let i = 0; i < 70; i++) { const x = r() * W, h = u * (.015 + r() * .035); ctx.beginPath(); ctx.moveTo(x, oy + 2); ctx.quadraticCurveTo(x + h * .3, oy - h * .6, x + h * (r() - .3), oy - h); ctx.stroke(); }
    vignette(ctx, W, H, "rgba(0,0,0,.35)");
  }
  function candle(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H), tall = H / W > 1.3, ph = LP(t);
    grad(ctx, W, H, ["#07060c", "#120d18", "#211626", "#2c1c20"]);
    const ch = u * (tall ? .26 : .19), cw = u * .075, cx = tall ? W * .82 : W * .5, base = H * .975, top = base - ch;
    const fl = 1 + .06 * Math.sin(ph * 9) + .04 * Math.sin(ph * 23), fy = top - u * .045;
    glow(ctx, cx, fy, D * .62 * fl, [255, 190, 110], .3); glow(ctx, cx, fy, u * .2, [255, 214, 150], .35);
    const g = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0); g.addColorStop(0, "#c9b28f"); g.addColorStop(.45, "#fbf0da"); g.addColorStop(1, "#b39874");
    ctx.fillStyle = g; roundRect(ctx, cx - cw / 2, top, cw, ch, cw * .12); ctx.fill();
    ctx.fillStyle = "rgba(255,240,210,.5)"; ctx.beginPath(); ctx.ellipse(cx, top + u * .004, cw / 2, cw * .14, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#2a1f18"; ctx.lineWidth = Math.max(1.5, u / 450); ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, top - u * .015); ctx.stroke();
    const sway = Math.sin(ph * 5) * u * .004, fh = u * .07 * fl, fw = u * .02;
    const fg = ctx.createRadialGradient(cx, fy + fh * .25, 0, cx, fy, fh); fg.addColorStop(0, "rgba(255,255,240,1)"); fg.addColorStop(.35, "rgba(255,226,150,.95)"); fg.addColorStop(1, "rgba(255,150,60,0)");
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(cx, top - u * .012); ctx.bezierCurveTo(cx + fw * 1.4, top - fh * .35, cx + fw * .4 + sway, top - fh * .8, cx + sway * 2, top - fh * 1.15); ctx.bezierCurveTo(cx - fw * .4 + sway, top - fh * .8, cx - fw * 1.4, top - fh * .35, cx, top - u * .012); ctx.fill();
    ctx.fillStyle = "rgba(20,14,12,.9)"; ctx.beginPath(); ctx.ellipse(cx, base, cw * 1.5, cw * .28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(P.tint, .5); ctx.lineWidth = Math.max(1, u / 600); ctx.stroke();
    vignette(ctx, W, H, "rgba(0,0,0,.45)");
  }
  function book(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H), ph = LP(t);
    grad(ctx, W, H, ["#0a0c1b", "#181a33", "#30284a", "#523a4c"]);
    const bw = Math.min(W * .86, u * .95), cx = W / 2, by = H * .965, bh = bw * .3;
    // light rising from the pages
    ctx.save(); ctx.translate(cx, by - bh * .7); for (let i = 0; i < 13; i++) { const a = -Math.PI / 2 + (i - 6) * .09 + Math.sin(ph + i) * .01;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, D * .9); g.addColorStop(0, rgba(P.tint, .2)); g.addColorStop(1, rgba(P.tint, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, D * .9, a - .025, a + .025); ctx.closePath(); ctx.fill(); } ctx.restore();
    glow(ctx, cx, by - bh, u * .5, [255, 236, 196], .4);
    const page = s => { ctx.beginPath(); ctx.moveTo(cx, by - bh * .55); ctx.bezierCurveTo(cx + s * bw * .18, by - bh * 1.05, cx + s * bw * .36, by - bh * .95, cx + s * bw * .5, by - bh * .8);
      ctx.lineTo(cx + s * bw * .5, by - bh * .05); ctx.bezierCurveTo(cx + s * bw * .36, by - bh * .2, cx + s * bw * .18, by - bh * .25, cx, by); ctx.closePath(); };
    for (const s of [-1, 1]) { ctx.fillStyle = "#4a2c22"; ctx.save(); ctx.translate(0, u * .012); page(s); ctx.fill(); ctx.restore();
      const g = ctx.createLinearGradient(cx, 0, cx + s * bw * .5, 0); g.addColorStop(0, "#d9c7a4"); g.addColorStop(.25, "#fbf3e1"); g.addColorStop(1, "#efe1c3"); ctx.fillStyle = g; page(s); ctx.fill();
      ctx.strokeStyle = "rgba(110,80,40,.22)"; ctx.lineWidth = Math.max(1, u / 900);
      for (let k = 1; k < 7; k++) { const f = k / 7; ctx.beginPath(); ctx.moveTo(cx + s * bw * .06, by - bh * (.62 - .07 * k) ); ctx.quadraticCurveTo(cx + s * bw * .28, by - bh * (.98 - .1 * k), cx + s * bw * .45, by - bh * (.8 - .1 * k)); ctx.globalAlpha = .7 - f * .3; ctx.stroke(); } ctx.globalAlpha = 1; }
    const r = rng(4); for (let i = 0; i < 26; i++) { const x = cx + (r() - .5) * bw * .8, y0 = r() * H, y = ((y0 - (isFinite(t) ? t / 10 : .3) * H * .5) % H + H) % H;
      ctx.fillStyle = rgba(P.tint, .25 + .4 * r()); ctx.beginPath(); ctx.arc(x, y, u * (.002 + r() * .003), 0, TAU); ctx.fill(); }
    vignette(ctx, W, H, "rgba(0,0,0,.4)");
  }
  function person(ctx, x, base, h, child) { const hr = h * (child ? .14 : .12);
    ctx.beginPath(); ctx.arc(x, base - h + hr, hr, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - h * .1, base - h + hr * 2.3); ctx.lineTo(x + h * .1, base - h + hr * 2.3); ctx.lineTo(x + h * .13, base - h * .42); ctx.lineTo(x + h * .06, base - h * .42); ctx.lineTo(x + h * .05, base); ctx.lineTo(x - h * .05, base); ctx.lineTo(x - h * .06, base - h * .42); ctx.lineTo(x - h * .13, base - h * .42); ctx.closePath(); ctx.fill(); }
  function family(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H);
    grad(ctx, W, H, ["#fdf5e8", "#f9e2c6", "#f3c9a3", "#e9a985"]);
    const hz = H * .86; glow(ctx, W * .5, hz, D * .6, [255, 236, 200], .7); raysAt(ctx, W * .5, hz, D, [255, 246, 226], .12, 22, t);
    ctx.fillStyle = "rgba(196,120,100,.35)"; ctx.beginPath(); ctx.moveTo(0, hz); for (let x = 0; x <= W; x += W / 40) ctx.lineTo(x, hz - u * .03 * Math.sin(x / W * 4 + 1)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = "#5b3a3c"; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, hz + u * .05); ctx.quadraticCurveTo(W * .55, hz - u * .02, W, hz + u * .06); ctx.lineTo(W, H); ctx.fill();
    const fx = W * .78, gb = hz + u * .025, s = u * .19; ctx.fillStyle = "#3b2530"; ctx.strokeStyle = "#3b2530"; ctx.lineWidth = s * .035; ctx.lineCap = "round";
    const fam = [[-.55, 1, 0], [-.18, .58, 1], [.12, .5, 1], [.45, .93, 0]];
    fam.forEach(([dx, k, c]) => person(ctx, fx + dx * s, gb, s * k, c));
    for (let i = 0; i < 3; i++) { const a = fam[i], b = fam[i + 1], y1 = gb - s * a[1] * .5, y2 = gb - s * b[1] * .5; ctx.beginPath(); ctx.moveTo(fx + a[0] * s + s * a[1] * .12, y1); ctx.quadraticCurveTo(fx + (a[0] + b[0]) / 2 * s, Math.max(y1, y2) + s * .04, fx + b[0] * s - s * b[1] * .12, y2); ctx.stroke(); }
  }
  function path(ctx, W, H, P, t) {
    sky(ctx, W, H, SKY.dusk, t, "mountains"); const u = Math.min(W, H), hz = H * .74;
    ctx.fillStyle = "rgba(8,12,26,.96)"; ctx.fillRect(0, H * .86, W, H * .14);
    const pt = k => { const y = hz + (H - hz) * k * k, x = W / 2 + Math.sin(k * 7.5) * W * .18 * k; return [x, y, u * (.008 + .2 * k * k)]; };
    ctx.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y, w] = pt(i / 40); i ? ctx.lineTo(x - w, y) : ctx.moveTo(x - w, y); } for (let i = 40; i >= 0; i--) { const [x, y, w] = pt(i / 40); ctx.lineTo(x + w, y); }
    const g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, rgba(P.tint, .85)); g.addColorStop(1, rgba(P.tint, .25)); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = "#0a0d1c"; const k = .55, [x, y] = pt(k), s = u * .07; person(ctx, x - s * .18, y, s, 0); person(ctx, x + s * .2, y + s * .02, s * .96, 0);
  }
  function dove(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H), ph = LP(t);
    grad(ctx, W, H, ["#f4f7fc", "#e7edf6", "#efe6dc", "#f4dcc4"]);
    raysAt(ctx, W * .5, -H * .05, D * 1.2, [255, 236, 190], .16, 30, t); glow(ctx, W * .5, 0, D * .5, [255, 246, 220], .7);
    const tall = H / W > 1.3, s = u * (tall ? .17 : .11), x = tall ? W * .17 : W * .87, y = (tall ? H * .8 : u * .13) + Math.sin(ph) * u * .008;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.12); ctx.shadowColor = "rgba(120,110,160,.25)"; ctx.shadowBlur = s * .15; ctx.fillStyle = "#ffffff";
    const fl = Math.sin(ph * 2) * .05;
    ctx.beginPath(); ctx.moveTo(-s * .05, -s * .02); ctx.bezierCurveTo(-s * .3, -s * (.55 + fl), -s * .75, -s * (.62 + fl), -s * 1.0, -s * (.5 + fl)); ctx.bezierCurveTo(-s * .7, -s * .35, -s * .45, -s * .1, -s * .05, s * .06); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * .05, -s * .02); ctx.bezierCurveTo(s * .25, -s * (.6 + fl), s * .65, -s * (.75 + fl), s * .95, -s * (.7 + fl)); ctx.bezierCurveTo(s * .65, -s * .45, s * .4, -s * .12, s * .05, s * .06); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, s * .05, s * .32, s * .12, -.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * .32, -s * .03, s * .08, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * .28, s * .06); ctx.lineTo(-s * .55, s * .2); ctx.lineTo(-s * .5, s * .02); ctx.closePath(); ctx.fill();
    ctx.shadowColor = "transparent"; ctx.fillStyle = "#c79a4b"; ctx.beginPath(); ctx.moveTo(s * .39, -s * .04); ctx.lineTo(s * .47, -s * .01); ctx.lineTo(s * .39, s * .01); ctx.fill();
    ctx.fillStyle = "#2b2a3a"; ctx.beginPath(); ctx.arc(s * .34, -s * .05, s * .012, 0, TAU); ctx.fill();
    oliveBranch(ctx, s * .45, 0, s * .32, .5, ph, rng(3), ["rgba(120,150,95,.95)", "rgba(150,170,110,.9)"], "rgba(70,80,50,.95)");
    ctx.restore();
  }
  function wheat(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H), ph = LP(t), hz = H * .8;
    grad(ctx, W, H, ["#1b1530", "#46304c", "#9b5c5c", "#e09d66", "#f4c67e"]);
    glow(ctx, W * .5, hz, D * .6, [255, 214, 150], .55); glow(ctx, W * .5, hz, u * .07, [255, 244, 214], .95);
    ctx.fillStyle = "#5b3524"; ctx.fillRect(0, hz, W, H - hz);
    const r = rng(8), n = Math.round(W / u * 46);
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < n; i++) {
      const x = r() * W, h = u * (layer ? .22 : .15) * (.75 + r() * .4), b = H + u * .02, sw = Math.sin(ph + x / W * 6) * u * .012 * (layer + 1), tx = x + sw, ty = b - h;
      ctx.strokeStyle = layer ? "rgba(120,70,30,.95)" : "rgba(150,95,50,.7)"; ctx.lineWidth = Math.max(1, u / 650); ctx.beginPath(); ctx.moveTo(x, b); ctx.quadraticCurveTo(x, b - h * .5, tx, ty); ctx.stroke();
      ctx.fillStyle = layer ? "rgba(214,160,80,.98)" : "rgba(230,184,110,.75)";
      for (let k = 0; k < 7; k++) { const gy = ty - k * u * .011, gx = tx + sw * .1 * k; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(gx + sd * u * .005, gy, u * .0045, u * .009, sd * .45, 0, TAU); ctx.fill(); } }
    }
  }
  function hearth(ctx, W, H, P, t) {
    const u = Math.min(W, H), D = Math.max(W, H), ph = LP(t), hz = H * .84;
    grad(ctx, W, H, ["#050817", "#0d1736", "#1f2a55", "#3f3a63"]); stars(ctx, W, H, t, Math.round(W * H / 4200), .7, 21);
    ctx.fillStyle = "#0b1022"; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, hz + u * .04); ctx.quadraticCurveTo(W * .5, hz - u * .05, W, hz + u * .02); ctx.lineTo(W, H); ctx.fill();
    const cx = W * .72, s = u * .2, by = hz + u * .005;
    glow(ctx, cx, by - s * .3, D * .35, [255, 200, 130], .35);
    ctx.fillStyle = "#151a30"; ctx.fillRect(cx - s * .5, by - s * .55, s, s * .55);
    ctx.beginPath(); ctx.moveTo(cx - s * .62, by - s * .53); ctx.lineTo(cx, by - s * 1.0); ctx.lineTo(cx + s * .62, by - s * .53); ctx.closePath(); ctx.fill();
    ctx.fillRect(cx + s * .22, by - s * 1.0, s * .1, s * .3);
    const win = `rgba(255,214,150,${.85 + .08 * Math.sin(ph * 3)})`; ctx.fillStyle = win;
    ctx.fillRect(cx - s * .38, by - s * .42, s * .2, s * .17); ctx.fillRect(cx + s * .16, by - s * .42, s * .2, s * .17); ctx.fillRect(cx - s * .07, by - s * .3, s * .14, s * .3);
    glow(ctx, cx, by - s * .32, s * .7, [255, 210, 140], .25);
    for (let i = 0; i < 5; i++) { const k = ((i / 5 + (isFinite(t) ? t / 10 : .2)) % 1), sx = cx + s * .27 + Math.sin(k * 6 + i) * s * .12 * k, sy = by - s * 1.02 - k * s * 1.4;
      ctx.fillStyle = `rgba(200,200,220,${.18 * (1 - k)})`; ctx.beginPath(); ctx.arc(sx, sy, s * (.05 + k * .12), 0, TAU); ctx.fill(); }
  }
  const IMG = {};
  function photoPaint(ctx, W, H, P, t, o, look) {
    const img = IMG[look.photo];
    if (!img || !img.complete || !img.naturalWidth) { grad(ctx, W, H, ["#151a30", "#3a3550"]); return; }
    const s0 = Math.max(W / img.naturalWidth, H / img.naturalHeight), z = isFinite(t) && o && o.anim === "zoom" ? 1 + .12 * easeIO(c01(t / 10)) : 1, s = s0 * z;
    const w = img.naturalWidth * s, h = img.naturalHeight * s, fx = look.fx ?? .5, fy = look.fy ?? .45;
    ctx.drawImage(img, (W - w) * fx, (H - h) * fy, w, h);
  }

  const LOOKS = {
    sunrise:      { name: "Sunrise rays", group: "Light", dark: 1, paint: (c, W, H, P, t) => sky(c, W, H, SKY.dusk, t, "rays") },
    mountains:    { name: "Dawn mountains", group: "Light", dark: 1, paint: (c, W, H, P, t) => sky(c, W, H, SKY.dusk, t, "mountains") },
    morning:      { name: "Morning light", group: "Light", dark: 0, paint: (c, W, H, P, t) => sky(c, W, H, SKY.dawn, t, "mountains", true) },
    aurora:       { name: "Aurora", group: "Light", dark: 1, paint: (c, W, H, P, t) => sky(c, W, H, SKY.midnight, t, "aurora") },
    night:        { name: "Night sky", group: "Light", dark: 1, paint: nightSky },
    temple_dusk:  { name: "Temple at dusk", group: "Temple art", dark: 1, paint: (c, W, H, P, t, o) => templeScene(c, W, H, P, t, "dusk", o) },
    temple_dawn:  { name: "Temple at dawn", group: "Temple art", dark: 0, paint: (c, W, H, P, t, o) => templeScene(c, W, H, P, t, "dawn", o) },
    temple_night: { name: "Temple at night", group: "Temple art", dark: 1, paint: (c, W, H, P, t, o) => templeScene(c, W, H, P, t, "night", o) },
    stained:      { name: "Stained glass", group: "Sacred art", dark: 1, ov: .64, paint: stained },
    paper:        { name: "Scripture paper", group: "Sacred art", dark: 0, paint: paper },
    hymn:         { name: "Hymn sheet", group: "Sacred art", dark: 0, paint: hymn },
    watercolor:   { name: "Watercolor", group: "Sacred art", dark: 0, paint: watercolor },
    olive:        { name: "Olive branch", group: "Gethsemane & nature", dark: 1, paint: olive },
    nature:       { name: "Pines at first light", group: "Gethsemane & nature", dark: 1, ov: .1, paint: nature },
    tomb:         { name: "Empty tomb at sunrise", group: "Light", dark: 1, ov: .12, paint: tomb },
    candle:       { name: "Candle light", group: "Sacred art", dark: 1, paint: candle },
    book:         { name: "Open scriptures", group: "Sacred art", dark: 1, paint: book },
    dove:         { name: "Dove of peace", group: "Sacred art", dark: 0, paint: dove },
    family:       { name: "Family at sunset", group: "Home & journey", dark: 0, paint: family },
    hearth:       { name: "Home at night", group: "Home & journey", dark: 1, paint: hearth },
    path:         { name: "Missionary path", group: "Home & journey", dark: 1, ov: .1, paint: path },
    wheat:        { name: "Wheat at harvest", group: "Home & journey", dark: 1, ov: .15, paint: wheat },
    minimal:      { name: "Minimal", group: "Simple", dark: 0, paint: minimal(false) },
    minimal_dark: { name: "Minimal dark", group: "Simple", dark: 1, paint: minimal(true) },
  };
  (window.PHOTOS || []).forEach(p => { LOOKS["photo-" + p.id] = { name: p.name, group: p.group === "temple" ? "Temple photos" : p.group === "art" ? "Christ in art (public domain)" : "Gethsemane & nature", dark: 1, ov: p.ov ?? .5, photo: p.id, fx: p.fx, fy: p.fy, credit: p, paint: photoPaint }; });
  const base = () => window.CARDKIT_BASE || "";
  function prepare(o) { const L = LOOKS[o.look]; if (!L || !L.photo) return Promise.resolve();
    if (IMG[L.photo] && IMG[L.photo].complete) return Promise.resolve();
    return new Promise(res => { const im = IMG[L.photo] || new Image(); IMG[L.photo] = im; im.onload = im.onerror = () => res(); if (!im.src) im.src = base() + L.credit.file; }); }

  // ---------- brand pieces ----------
  const RAYS = [[17.73, 39.36, 13.45, 37.97, 0.38, 1.6], [21.73, 33.07, 16.87, 27.89, 0.5, 1.78], [28.27, 29.47, 25.86, 20.08, 0.63, 1.96], [35.73, 29.47, 38.79, 17.56, 0.75, 2.14], [42.27, 33.07, 52.47, 22.2, 0.88, 2.32], [46.27, 39.36, 62.91, 33.96, 1.0, 2.5]];
  function mark(ctx, cx, cy, size, th, a = 1) {
    const s = size / 64; ctx.save(); ctx.globalAlpha = a; ctx.translate(cx - 32 * s, cy - 32 * s); ctx.scale(s, s);
    const g = ctx.createLinearGradient(0, 0, 64, 64);
    if (th.dark) { g.addColorStop(0, "#e3a693"); g.addColorStop(.55, "#f1d394"); g.addColorStop(1, "#fff3d1"); } else { g.addColorStop(0, "#b8664f"); g.addColorStop(.55, "#b8862f"); g.addColorStop(1, "#8a5f1f"); }
    ctx.strokeStyle = g; ctx.fillStyle = g; ctx.lineCap = "round";
    RAYS.forEach(([x1, y1, x2, y2, o, w]) => { ctx.globalAlpha = a * o; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
    ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(32, 44, 11, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, 44); ctx.lineTo(58, 44); ctx.stroke();
    ctx.globalAlpha = a * .55; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(18, 50); ctx.lineTo(46, 50); ctx.stroke();
    ctx.restore();
  }
  function wordmark(ctx, x, y, fs, th, align = "center") {
    ctx.save(); ctx.textAlign = "left";
    const parts = [["Six Months ", `500 ${fs}px ${SERIF}`, th.ink], ["of", `italic 500 ${fs}px ${SERIF}`, th.gold], [" Light", `500 ${fs}px ${SERIF}`, th.ink]];
    const w = parts.reduce((s, [t, f]) => { ctx.font = f; return s + ctx.measureText(t).width; }, 0);
    let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    parts.forEach(([t, f, c]) => { ctx.font = f; ctx.fillStyle = c; ctx.fillText(t, cx, y); cx += ctx.measureText(t).width; });
    ctx.restore(); return w;
  }
  function qr(ctx, text, x, y, size, th, a = 1) {
    const q = qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount(), pad = size * .1, cell = (size - pad * 2) / n;
    ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = size * .12; ctx.shadowOffsetY = size * .03;
    ctx.fillStyle = th.qr[1]; roundRect(ctx, x, y, size, size, size * .1); ctx.fill(); ctx.shadowColor = "transparent";
    ctx.fillStyle = th.qr[0];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
    ctx.restore();
  }
  function frame(ctx, W, H, th, a = 1) {
    const u = Math.min(W, H), m = u * .045, L = u * .05; ctx.save(); ctx.globalAlpha = .4 * a; ctx.strokeStyle = th.gold; ctx.lineWidth = Math.max(1, u / 1000);
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); ctx.globalAlpha = .85 * a; ctx.lineWidth = Math.max(1.5, u / 600);
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke(); });
    ctx.restore();
  }
    function overlay(ctx, W, H, look, ov) {
    if (!ov) return; const g = ctx.createLinearGradient(0, 0, 0, H), c = look.dark ? "8,10,22" : "255,252,245";
    g.addColorStop(0, `rgba(${c},${ov * .75})`); g.addColorStop(.45, `rgba(${c},${ov})`); g.addColorStop(1, `rgba(${c},${Math.min(.92, ov * 1.15)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ---------- layout ----------
  const SIZES = { story: [1080, 1920, "Story 9:16"], portrait: [1080, 1350, "Post 4:5"], square: [1080, 1080, "Square 1:1"], pin: [1000, 1500, "Pinterest 2:3"], wide: [1920, 1080, "Wide 16:9"], link: [1200, 630, "Link 1.91:1"], wallpaper: [1170, 2532, "Phone wallpaper"] };
  const TL = { start: .7, gap: .32, dur: .9, footer: 5.6, total: 10 };
  function geom(W, H) {
    const u = Math.min(W, H), r = H / W, kind = r < .8 ? "wide" : r > 2 ? "wall" : r > 1.6 ? "story" : r > 1.1 ? "portrait" : "square";
    const cw = kind === "wide" ? W * .6 : W - u * .24;
    const eyeY = kind === "story" ? H * .085 : kind === "wall" ? H * .25 : u * .115;
    const footTop = kind === "story" ? H - u * .6 : kind === "wall" ? H - u * .46 : H - u * .25;
    return { u, kind, cw, x0: (W - cw) / 2, eyeY, top: eyeY + u * .05, bottom: footTop - u * .03 };
  }
  const FONTS = { classic: "Classic serif", italic: "Italic serif", bold: "Bold serif", modern: "Modern sans" };
  const FONTF = { classic: f => `500 ${f}px ${SERIF}`, italic: f => `italic 500 ${f}px ${SERIF}`, bold: f => `600 ${f * 1.02}px ${SERIF}`, modern: f => `400 ${f * .8}px ${SANS}` };

  // ---------- formatting (Advanced panel). o.fmt = { size, weight, lh, ls, cs, qm, box, border, vig, grain, blur, ink, acc, dx, dy } ----------
  const F0 = {};
  const fmtOf = o => o.fmt || F0;
  function fontFor(o) { const f = fmtOf(o), base = FONTF[o.font] || FONTF.classic;
    return fs => { let s = base(fs * (f.size || 1)); if (f.weight) s = s.replace(/^(italic )?\d{3}/, (m, it) => (it || "") + f.weight); return s; }; }
  const caseOf = (o, s) => { const c = fmtOf(o).cs; return c === "upper" ? s.toUpperCase() : c === "lower" ? s.toLowerCase() : c === "title" ? s.replace(/\b([a-z])/g, m => m.toUpperCase()) : s; };
  const setLS = (ctx, o, fs) => { const ls = fmtOf(o).ls; if ("letterSpacing" in ctx) ctx.letterSpacing = ls ? (ls * fs).toFixed(1) + "px" : "0px"; };
  const QM = { curly: ["“", "”"], none: ["", ""], small: ["“", "”"], guillemet: ["«\u202f", "\u202f»"], straight: ['"', '"'], bar: ["", ""] };
  function fmtTheme(th, o) { const f = fmtOf(o); if (!f.ink && !f.acc) return th; return { ...th, ink: f.ink || th.ink, gold: f.acc || th.gold, gold2: f.acc || th.gold2, sun: f.acc ? hex(f.acc) : th.sun }; }
  let NOISE = null;
  function grain(ctx, W, H, a) { if (!a) return; if (!NOISE) { NOISE = document.createElement("canvas"); NOISE.width = NOISE.height = 200; const n = NOISE.getContext("2d"), d = n.createImageData(200, 200), r = rng(3);
      for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } n.putImageData(d, 0, 0); }
    ctx.save(); ctx.globalAlpha = a * .22; ctx.globalCompositeOperation = "overlay"; ctx.fillStyle = ctx.createPattern(NOISE, "repeat"); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function vig(ctx, W, H, a) { if (!a) return; const D = Math.max(W, H), v = ctx.createRadialGradient(W / 2, H / 2, D * .25, W / 2, H / 2, D * .78); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${.75 * a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  // background with optional blur (downscale works in every browser) and animation transforms (pan / parallax)
  let BLUR = null;
  function paintBG(ctx, W, H, look, P, t, o, A, still) {
    const b = fmtOf(o).blur || 0, FXA = FX[A];
    const doPaint = (c, w, h) => { c.save(); if (FXA && FXA.pre && !still) FXA.pre(c, w, h, t, look); look.paint(c, w, h, P, still ? 3 : t, o, look); c.restore(); };
    if (!b) return doPaint(ctx, W, H);
    const k = 1 / (1 + b * .9), w = Math.max(16, Math.round(W * k)), h = Math.max(16, Math.round(H * k));
    if (!BLUR) BLUR = document.createElement("canvas"); BLUR.width = w; BLUR.height = h; const bc = BLUR.getContext("2d"); doPaint(bc, w, h);
    ctx.save(); ctx.imageSmoothingQuality = "high"; ctx.drawImage(BLUR, -W * .02, -H * .02, W * 1.04, H * 1.04); ctx.restore(); }
  function textBox(ctx, o, th, x0, y, w, h, u, W) { const bx = fmtOf(o).box; if (!bx || bx === "none") return; const p = u * .05; ctx.save();
    if (bx === "glass") { ctx.fillStyle = th.dark ? "rgba(10,12,28,.42)" : "rgba(255,255,255,.55)"; roundRect(ctx, x0 - p, y - p, w + 2 * p, h + 2 * p, u * .03); ctx.fill(); ctx.strokeStyle = th.dark ? "rgba(255,255,255,.18)" : "rgba(29,27,46,.12)"; ctx.lineWidth = Math.max(1, u / 900); ctx.stroke(); }
    if (bx === "solid") { ctx.fillStyle = th.dark ? "rgba(8,10,22,.82)" : "rgba(255,253,248,.92)"; roundRect(ctx, x0 - p, y - p, w + 2 * p, h + 2 * p, u * .02); ctx.fill(); }
    if (bx === "band") { ctx.fillStyle = th.dark ? "rgba(8,10,22,.55)" : "rgba(255,255,255,.65)"; ctx.fillRect(0, y - p, W, h + 2 * p); }
    if (bx === "outline") { ctx.strokeStyle = th.gold; ctx.lineWidth = Math.max(1.5, u / 450); roundRect(ctx, x0 - p, y - p, w + 2 * p, h + 2 * p, u * .015); ctx.stroke(); }
    ctx.restore(); }
  function border(ctx, W, H, th, a, o) { const s = fmtOf(o).border; if (!s || s === "corners") return frame(ctx, W, H, th, a); if (s === "none") return;
    const u = Math.min(W, H), m = u * .045; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = th.gold; ctx.lineWidth = Math.max(1.5, u / 500);
    if (s === "thin") ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    if (s === "double") { ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); ctx.lineWidth = Math.max(1, u / 900); ctx.strokeRect(m + u * .012, m + u * .012, W - 2 * m - u * .024, H - 2 * m - u * .024); }
    if (s === "rounded") { roundRect(ctx, m, m, W - 2 * m, H - 2 * m, u * .05); ctx.stroke(); }
    if (s === "ornate") { ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); ctx.lineWidth = Math.max(1, u / 900); ctx.strokeRect(m + u * .016, m + u * .016, W - 2 * m - u * .032, H - 2 * m - u * .032);
      [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = th.gold; ctx.fillRect(-u * .014, -u * .014, u * .028, u * .028); ctx.restore(); });
      ctx.fillStyle = th.gold; ctx.beginPath(); ctx.arc(W / 2, m, u * .012, 0, TAU); ctx.arc(W / 2, H - m, u * .012, 0, TAU); ctx.fill(); }
    ctx.restore(); }
  const FX = {};   // animation effect registry: FX[name] = { pre(ctx,W,H,t,look), mid(ctx,W,H,t,u,th,P,look), post(ctx,W,H,t,u,th,P,look), text: "float"|"letters" }
  // Rows: [{h, draw(y, x, align)}] built at scale k; shrink k until they fit.
  function quoteRows(ctx, G, o, th, k) {
    const u = G.u, FONT = fontFor(o), rows = [], f = fmtOf(o), qm = QM[f.qm] || QM.curly, LH = 1.2 * (f.lh || 1), qtext = caseOf(o, o.quote);
    let fs = u * ({ story: .086, wall: .084, wide: .07 }[G.kind] || .078) * k;
    ctx.font = FONT(fs); setLS(ctx, o, fs); let lines = wrap(ctx, qm[0] && f.qm && f.qm !== "curly" ? qm[0] + qtext : qtext, G.cw);
    let mw = G.cw; while (mw > G.cw * .62) { const l2 = wrap(ctx, qm[0] && f.qm && f.qm !== "curly" ? qm[0] + qtext : qtext, mw - u * .02); if (l2.length > lines.length) break; mw -= u * .02; lines = l2; }
    if (f.qm === "bar") rows.push({ h: u * .03 * k, draw(y, x, al) { ctx.fillStyle = th.gold; const bw = u * .08; ctx.fillRect(al === "left" ? x : x - bw / 2, y + u * .01, bw, Math.max(3, u / 300)); } });
    if (!f.qm || f.qm === "curly") rows.push({ h: u * .11 * k, draw(y, x, al) { ctx.save(); ctx.font = `500 ${u * .24 * k}px ${SERIF}`; const g = ctx.createLinearGradient(0, y - u * .05, 0, y + u * .1); g.addColorStop(0, th.gold); g.addColorStop(1, th.gold2); ctx.fillStyle = g; ctx.textAlign = al; ctx.fillText("“", al === "left" ? x - u * .01 : x, y + u * .165 * k); ctx.restore(); } });
    const close = !f.qm || f.qm === "curly" ? "”" : qm[1];
    ctx.letterSpacing && setLS(ctx, o, 0);
    lines.forEach((l, i) => rows.push({ h: fs * LH, line: 1, txt: l + (i === lines.length - 1 ? close : ""), font: FONT(fs), color: th.ink, by: fs * .95, ls: f.ls ? f.ls * fs : 0, draw(y, x, al) { ctx.font = FONT(fs); setLS(ctx, o, fs); ctx.fillStyle = th.ink; ctx.textAlign = al; ctx.fillText(l + (i === lines.length - 1 ? close : ""), x, y + fs * .95); setLS(ctx, o, 0); } }));
    rows.push({ h: u * .17 * k, draw(y, x, al) {
      const lw = u * .14, lx = al === "left" ? x : x - lw / 2; const lg = ctx.createLinearGradient(lx, 0, lx + lw, 0);
      lg.addColorStop(0, al === "left" ? th.gold : "rgba(216,169,91,0)"); lg.addColorStop(.5, th.gold); lg.addColorStop(1, "rgba(216,169,91,0)");
      ctx.fillStyle = lg; ctx.fillRect(lx, y + u * .04 * k, lw, Math.max(2, u / 520));
      ctx.fillStyle = th.ink; ctx.font = `600 ${u * .025 * k}px ${SANS}`; spaced(ctx, o.speaker.toUpperCase(), x, y + u * .1 * k, u * .005, al);
      ctx.fillStyle = th.sub; ctx.font = `italic 500 ${u * .042 * k}px ${SERIF}`; ctx.textAlign = al; ctx.fillText(o.title, x, y + u * .152 * k); } });
    if (o.note) { ctx.font = `italic 400 ${u * .03 * k}px ${SANS}`; const nl = wrap(ctx, o.note, G.cw * .9).slice(0, 2), nh = u * (.075 + nl.length * .042) * k;
      rows.push({ h: nh + u * .02, draw(y, x, al) {
        const bw = Math.min(G.cw, u * .9), bx = al === "left" ? x : x - bw / 2;
        ctx.fillStyle = th.dark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.55)"; roundRect(ctx, bx, y + u * .01, bw, nh, u * .02); ctx.fill();
        const tx = al === "left" ? bx + u * .03 : x;
        ctx.fillStyle = th.gold; ctx.font = `600 ${u * .018 * k}px ${SANS}`; spaced(ctx, "MY TAKEAWAY · ADDED BY THE SHARER, NOT A QUOTE", tx, y + u * .05 * k, u * .003, al);
        ctx.fillStyle = th.ink; ctx.font = `italic 400 ${u * .03 * k}px ${SANS}`; ctx.textAlign = al; nl.forEach((l, i) => ctx.fillText(l, tx, y + u * (.095 + i * .042) * k)); } }); }
    return rows;
  }
  function insightRows(ctx, G, o, th, k) {
    const u = G.u, I = o.ins, rows = [], cw = G.cw;
    const text = (str, font, color, lh, maxW = cw) => { ctx.font = font; return wrap(ctx, str, maxW).map(l => ({ h: lh, line: 1, txt: l, font, color, by: lh * .8, draw(y, x, al) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = al; ctx.fillText(l, x, y + lh * .8); } })); };
    if (I.kicker) rows.push({ h: u * .05 * k, draw(y, x, al) { ctx.fillStyle = th.gold; ctx.font = `600 ${u * .022 * k}px ${SANS}`; spaced(ctx, I.kicker.toUpperCase(), x, y + u * .03 * k, u * .006, al); } });
    rows.push(...text(I.title, `500 ${u * .072 * k}px ${SERIF}`, th.ink, u * .08 * k));
    if (I.sub) rows.push(...text(I.sub, `400 ${u * .028 * k}px ${SANS}`, th.sub, u * .04 * k));
    rows.push({ h: u * .035 * k, draw() {} });
    const B = I.body || {};
    if (B.type === "big") {
      rows.push({ h: u * .25 * k, draw(y, x, al) { ctx.save(); ctx.font = `500 ${u * .27 * k}px ${SERIF}`; const g = ctx.createLinearGradient(0, y, 0, y + u * .22 * k); g.addColorStop(0, th.gold); g.addColorStop(1, th.gold2); ctx.fillStyle = g; ctx.textAlign = al; ctx.fillText(String(B.value), x, y + u * .21 * k); ctx.restore(); } });
      if (B.caption) rows.push(...text(B.caption, `italic 500 ${u * .042 * k}px ${SERIF}`, th.ink, u * .052 * k));
    }
    if (B.type === "bars") { const max = Math.max(...B.items.map(i => i.value)) || 1;
      B.items.forEach(it => rows.push({ h: u * .085 * k, draw(y, x, al) {
        const x0 = al === "left" ? x : x - cw / 2; ctx.textAlign = "left"; ctx.fillStyle = th.ink; ctx.font = `500 ${u * .03 * k}px ${SANS}`; ctx.fillText(it.label, x0, y + u * .035 * k);
        ctx.textAlign = "right"; ctx.fillStyle = th.gold; ctx.font = `600 ${u * .04 * k}px ${SERIF}`; ctx.fillText(String(it.value), x0 + cw, y + u * .037 * k);
        ctx.fillStyle = th.dark ? "rgba(255,255,255,.12)" : "rgba(29,27,46,.1)"; roundRect(ctx, x0, y + u * .052 * k, cw, u * .013 * k, u * .007 * k); ctx.fill();
        const g = ctx.createLinearGradient(x0, 0, x0 + cw, 0); g.addColorStop(0, th.gold2); g.addColorStop(1, th.gold); ctx.fillStyle = g;
        roundRect(ctx, x0, y + u * .052 * k, Math.max(u * .015, cw * it.value / max * (it.p ?? 1)), u * .013 * k, u * .007 * k); ctx.fill(); } })); }
    if (B.type === "words") { const cols = 2, per = Math.ceil(B.items.length / cols), colW = cw / cols;
      for (let r = 0; r < per; r++) rows.push({ h: u * .078 * k, draw(y, x, al) { const x0 = al === "left" ? x : x - cw / 2;
        for (let c = 0; c < cols; c++) { const i = c * per + r, w = B.items[i]; if (!w) continue; const cx = x0 + c * colW + (al === "left" ? 0 : u * .04);
          ctx.textAlign = "left"; ctx.fillStyle = th.gold; ctx.font = `600 ${u * .026 * k}px ${SANS}`; ctx.fillText(String(i + 1).padStart(2, "0"), cx, y + u * .055 * k);
          ctx.fillStyle = th.ink; ctx.font = `500 ${u * .058 * k}px ${SERIF}`; ctx.fillText(w, cx + u * .06 * k, y + u * .058 * k); } } }); }
    if (B.type === "text") rows.push(...text(B.text, `italic 500 ${u * .046 * k}px ${SERIF}`, th.ink, u * .058 * k));
    if (B.type === "list") B.items.forEach(s => { ctx.font = `500 ${u * .036 * k}px ${SERIF}`; wrap(ctx, "· " + s, cw).forEach(l => rows.push({ h: u * .05 * k, draw(y, x, al) { ctx.font = `500 ${u * .036 * k}px ${SERIF}`; ctx.fillStyle = th.ink; ctx.textAlign = al; ctx.fillText(l, x, y + u * .04 * k); } })); });
    if (I.quote) { rows.push({ h: u * .04 * k, draw() {} }); rows.push(...text("“" + I.quote.text + "”", `italic 500 ${u * .04 * k}px ${SERIF}`, th.ink, u * .05 * k));
      rows.push({ h: u * .05 * k, draw(y, x, al) { ctx.fillStyle = th.gold; ctx.font = `600 ${u * .021 * k}px ${SANS}`; spaced(ctx, "— " + I.quote.by.toUpperCase(), x, y + u * .035 * k, u * .004, al); } }); }
    if (I.foot) { rows.push({ h: u * .03 * k, draw() {} }); rows.push(...text(I.foot, `400 ${u * .021 * k}px ${SANS}`, th.sub, u * .03 * k)); }
    if (I.note) { ctx.font = `italic 400 ${u * .03 * k}px ${SANS}`; const nl = wrap(ctx, I.note, G.cw * .9).slice(0, 2), nh = u * (.075 + nl.length * .042) * k;
      rows.push({ h: nh + u * .04, draw(y, x, al) { const bw = Math.min(G.cw, u * .9), bx = al === "left" ? x : x - bw / 2, yy = y + u * .03;
        ctx.fillStyle = th.dark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.6)"; roundRect(ctx, bx, yy, bw, nh, u * .02); ctx.fill(); const tx = al === "left" ? bx + u * .03 : x;
        ctx.fillStyle = th.gold; ctx.font = `600 ${u * .018 * k}px ${SANS}`; spaced(ctx, "MY INVITE · ADDED BY THE SHARER", tx, yy + u * .045 * k, u * .003, al);
        ctx.fillStyle = th.ink; ctx.font = `italic 400 ${u * .03 * k}px ${SANS}`; ctx.textAlign = al; nl.forEach((l, i) => ctx.fillText(l, tx, yy + u * (.09 + i * .042) * k)); } }); }
    return rows;
  }
  // ---------- v3 layout templates (quote cards). Every layout keeps the small wordmark, domain and QR. ----------
  const HAND = '"Caveat", "Segoe Print", cursive';
  function fit(ctx, text, fontFn, maxW, maxH, fs0, lh = 1.18, min = 10) {
    let fs = fs0, lines;
    for (let i = 0; i < 40; i++) { ctx.font = fontFn(fs); lines = wrap(ctx, text, maxW); if (lines.length * fs * lh <= maxH || fs <= min) break; fs *= .94; }
    return { lines, fs, h: lines.length * fs * lh, lh };
  }
  function block(ctx, F, fontFn, x, y, al, color) { ctx.font = fontFn(F.fs); ctx.fillStyle = color; ctx.textAlign = al; F.lines.forEach((l, i) => ctx.fillText(l, x, y + F.fs * (i * F.lh + .95))); }
  const TH_LIGHT = P => textTheme({ dark: 0 }, P);
  function byline(ctx, o, x, y, al, th, u, s = 1) {
    ctx.fillStyle = th.gold; ctx.font = `600 ${u * .024 * s}px ${SANS}`; spaced(ctx, String(o.speaker || "").toUpperCase(), x, y, u * .005 * s, al);
    if (o.title) { ctx.fillStyle = th.sub; ctx.font = `italic 500 ${u * .036 * s}px ${SERIF}`; ctx.textAlign = al; ctx.fillText(o.title, x, y + u * .05 * s); }
  }
  function slideNo(ctx, W, u, o, th) { if (!o.slide) return; ctx.save(); ctx.fillStyle = th.gold; ctx.font = `600 ${u * .024}px ${SANS}`; ctx.textAlign = "right"; ctx.fillText(`${o.slide[0]} / ${o.slide[1]}`, W - u * .08, u * .1); ctx.restore(); }
  function noteBox(ctx, o, x, y, w, u, th, al) { if (!o.note) return 0; ctx.font = `italic 400 ${u * .028}px ${SANS}`; const nl = wrap(ctx, o.note, w - u * .06).slice(0, 2), nh = u * (.07 + nl.length * .04);
    const bx = al === "left" ? x : x - w / 2; ctx.fillStyle = th.dark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.6)"; roundRect(ctx, bx, y, w, nh, u * .02); ctx.fill();
    const tx = al === "left" ? bx + u * .03 : x; ctx.fillStyle = th.gold; ctx.font = `600 ${u * .017}px ${SANS}`; spaced(ctx, "MY TAKEAWAY · ADDED BY THE SHARER, NOT A QUOTE", tx, y + u * .038, u * .003, al);
    ctx.fillStyle = th.ink; ctx.font = `italic 400 ${u * .028}px ${SANS}`; ctx.textAlign = al; nl.forEach((l, i) => ctx.fillText(l, tx, y + u * (.08 + i * .04))); return nh + u * .02; }
  // Compact brand: wordmark + domain bottom-left, QR bottom-right (same spot on every layout)
  function brand(ctx, W, H, u, th, o, p, look) {
    const fx = W > H * 1.3 ? W * .07 : u * .09, by = H - u * .15, dom = (window.CONF && CONF.domain) || "sixmonthsoflight.com";
    ctx.save(); ctx.globalAlpha = p; if (look && (look.photo || look.ov)) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = u * .014; }
    mark(ctx, fx + u * .035, by - u * .016, u * .075, th, p); wordmark(ctx, fx + u * .085, by, u * .042, th, "left");
    ctx.textAlign = "left"; ctx.fillStyle = th.ink; ctx.font = `600 ${u * .025}px ${SANS}`; ctx.fillText(dom, fx + u * .087, by + u * .042);
    const qs = u * .145; qr(ctx, o.url, W - fx - qs, by - qs * .66, qs, th, p); ctx.restore();
  }
  function textArea(W, H, u) { const top = u * .17, bottom = H - u * .27; return { top, bottom, h: bottom - top }; }
  const LAYOUTS = {
    classic:  { name: "Classic" },
    bigquote: { name: "Big quote", draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H), R = textArea(W, H, u), cw = W - u * .2;
      ctx.save(); ctx.globalAlpha = .22 * A; ctx.fillStyle = th.gold; ctx.font = `600 ${u * .95}px ${SERIF}`; ctx.textAlign = "left"; ctx.fillText("“", u * .02, R.top + u * .62); ctx.restore();
      const ff = f => `600 ${f}px ${SERIF}`, F = fit(ctx, o.quote, ff, cw, R.h - u * .2, u * .12, 1.08);
      const y = R.top + (R.h - u * .2 - F.h) / 2; ctx.globalAlpha = A; block(ctx, F, ff, W / 2, y, "center", th.ink);
      byline(ctx, o, W / 2, y + F.h + u * .07, "center", th, u); ctx.globalAlpha = 1; } },
    editorial: { name: "Editorial", ov: .5, draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H), R = textArea(W, H, u), x = u * .11, cw = W - u * .22;
      ctx.globalAlpha = A; ctx.fillStyle = th.gold; ctx.fillRect(x, R.top, u * .12, Math.max(3, u / 260));
      ctx.font = `600 ${u * .02}px ${SANS}`; spaced(ctx, "THE CONFERENCE ISSUE · OCTOBER 2026", x, R.top + u * .055, u * .006, "left");
      const ff = f => `italic 500 ${f}px ${SERIF}`, F = fit(ctx, o.quote + "”", ff, cw - u * .17, R.h - u * .32, u * .085, 1.15);
      const dc = u * .26; ctx.fillStyle = th.gold; ctx.font = `600 ${dc}px ${SERIF}`; ctx.textAlign = "left"; ctx.fillText("“", x - u * .01, R.top + u * .1 + dc * .62);
      block(ctx, F, ff, x + u * .17, R.top + u * .1, "left", th.ink);
      const yb = R.top + u * .1 + Math.max(F.h, dc) + u * .05; ctx.fillStyle = th.sub; ctx.fillRect(x, yb, cw, Math.max(1, u / 700));
      byline(ctx, o, x, yb + u * .06, "left", th, u); ctx.globalAlpha = 1; } },
    polaroid: { name: "Polaroid", own: 1, light: 1, draw(ctx, W, H, o, th, P, look, A, t) {
      const u = Math.min(W, H), wide = W > H * 1.2; grad(ctx, W, H, ["#efe6d6", "#e2d4bd"]); vignette(ctx, W, H, "rgba(90,60,30,.25)");
      const tall = H / W > 1.5, fh = wide ? H * .72 : Math.min(H * (tall ? .66 : .7), W * .8 * (tall ? 1.5 : 1.22)), fw = wide ? fh * .82 : W * .8, fx = wide ? W * .07 : (W - fw) / 2, fy = wide ? H * .07 : u * .09;
      ctx.save(); ctx.translate(fx + fw / 2, fy + fh / 2); ctx.rotate(-.025); ctx.translate(-fw / 2, -fh / 2);
      ctx.shadowColor = "rgba(40,30,20,.35)"; ctx.shadowBlur = u * .04; ctx.shadowOffsetY = u * .012; ctx.fillStyle = "#fdfcf8"; ctx.fillRect(0, 0, fw, fh); ctx.shadowColor = "transparent";
      const m = fw * .06, pw = fw - 2 * m, ph = wide ? fh * .78 : fh * .55; ctx.save(); ctx.beginPath(); ctx.rect(m, m, pw, ph); ctx.clip(); ctx.translate(m, m); look.paint(ctx, pw, ph, P, t, o, look); ctx.restore();
      const LT = TH_LIGHT(P), cy = m + ph + fh * .025, ch = fh - ph - m - fh * .03, ff = f => `500 ${f}px ${HAND}`;
      ctx.globalAlpha = A;
      if (!wide) { const F = fit(ctx, "“" + o.quote + "”", ff, pw, ch - u * .06, u * .075, 1.05); block(ctx, F, ff, fw / 2, cy, "center", "#2a2433"); ctx.fillStyle = LT.gold; ctx.font = `600 ${u * .02}px ${SANS}`; spaced(ctx, "— " + String(o.speaker).toUpperCase(), fw / 2, cy + F.h + u * .035, u * .004, "center"); }
      else { ctx.fillStyle = "#2a2433"; ctx.font = `500 ${u * .05}px ${HAND}`; ctx.textAlign = "center"; ctx.fillText(o.speaker, fw / 2, cy + ch * .55); }
      ctx.restore();
      if (wide) { const x0 = fx + fw + W * .06, cw = W - x0 - W * .07, sf = f => `500 ${f}px ${SERIF}`, F = fit(ctx, "“" + o.quote + "”", sf, cw, H - u * .5, u * .075, 1.15), y = u * .12 + Math.max(0, (H - u * .5 - F.h) / 2);
        block(ctx, F, sf, x0, y, "left", LT.ink); byline(ctx, o, x0, y + F.h + u * .06, "left", LT, u, .9); }
      ctx.globalAlpha = 1; } },
    split:    { name: "Split photo", own: 1, light: 1, draw(ctx, W, H, o, th, P, look, A, t) {
      const u = Math.min(W, H), side = W >= H; const LT = TH_LIGHT(P);
      const pw = side ? W * .46 : W, ph = side ? H : H * .42, px = side ? W - pw : 0;
      ctx.fillStyle = "#fbf6ec"; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.rect(px, 0, pw, ph); ctx.clip(); ctx.translate(px, 0); look.paint(ctx, pw, ph, P, t, o, look); ctx.restore();
      ctx.fillStyle = LT.gold; side ? ctx.fillRect(px, 0, Math.max(3, u / 250), H) : ctx.fillRect(0, ph, W, Math.max(3, u / 250));
      const x = side ? u * .08 : u * .1, cw = side ? px - u * .14 : W - u * .2, top = side ? u * .12 : ph + u * .07, bottom = H - u * .27;
      const ff = f => `500 ${f}px ${SERIF}`, F = fit(ctx, "“" + o.quote + "”", ff, cw, bottom - top - u * .13, u * .075, 1.15);
      ctx.globalAlpha = A; const y = top + Math.max(0, (bottom - top - u * .13 - F.h) / 2); block(ctx, F, ff, x, y, "left", LT.ink); byline(ctx, o, x, y + F.h + u * .06, "left", LT, u, .9); ctx.globalAlpha = 1; } },
    bold:     { name: "Bold type", ov: .62, draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H), R = textArea(W, H, u), x = u * .1, cw = W - u * .2;
      const ff = f => `800 ${f}px ${SANS}`, F = fit(ctx, o.quote.toUpperCase(), ff, cw, R.h - u * .14, u * .1, 1.04);
      const y = R.top + (R.h - u * .14 - F.h) / 2; ctx.globalAlpha = A; ctx.font = ff(F.fs); ctx.textAlign = "left";
      F.lines.forEach((l, i) => { ctx.fillStyle = i === F.lines.length - 1 ? th.gold : th.ink; ctx.fillText(l, x, y + F.fs * (i * F.lh + .9)); });
      ctx.fillStyle = th.gold; ctx.fillRect(x, y + F.h + u * .03, u * .1, Math.max(3, u / 200)); byline(ctx, o, x, y + F.h + u * .1, "left", th, u); ctx.globalAlpha = 1; } },
    note:     { name: "Handwritten note", draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H), R = textArea(W, H, u), nw = Math.min(W * .84, u * .9), nh = Math.min(R.h + u * .02, nw * 1.15), nx = (W - nw) / 2, ny = R.top + (R.h - nh) / 2;
      ctx.save(); ctx.translate(W / 2, ny + nh / 2); ctx.rotate(.018); ctx.translate(-nw / 2, -nh / 2);
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = u * .035; ctx.shadowOffsetY = u * .01; ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, nw, nh); ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(120,150,190,.35)"; ctx.lineWidth = Math.max(1, u / 800); for (let y = u * .12; y < nh - u * .03; y += u * .058) { ctx.beginPath(); ctx.moveTo(u * .03, y); ctx.lineTo(nw - u * .03, y); ctx.stroke(); }
      ctx.strokeStyle = "rgba(200,90,90,.35)"; ctx.beginPath(); ctx.moveTo(u * .09, 0); ctx.lineTo(u * .09, nh); ctx.stroke();
      ctx.fillStyle = "rgba(240,225,180,.75)"; ctx.save(); ctx.translate(nw / 2, 0); ctx.rotate(-.04); ctx.fillRect(-u * .09, -u * .025, u * .18, u * .05); ctx.restore();
      const ff = f => `500 ${f}px ${HAND}`, F = fit(ctx, o.quote, ff, nw - u * .17, nh - u * .22, u * .085, 1.05);
      ctx.globalAlpha = A; block(ctx, F, ff, u * .12, u * .07, "left", "#24304d");
      ctx.fillStyle = "#7a4a2a"; ctx.font = `600 ${F.fs * .75}px ${HAND}`; ctx.textAlign = "right"; ctx.fillText("— " + o.speaker, nw - u * .05, u * .07 + F.h + F.fs * .9); ctx.restore(); ctx.globalAlpha = 1; } },
    margin:   { name: "Scripture margin", own: 1, light: 1, draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H); paperBase(ctx, W, H, 17, "#f7efdd", "#ecdfc2"); const r = rng(5), m = u * .08, col = W * (H / W > 1.5 ? .5 : .6);
      ctx.fillStyle = "rgba(60,40,20,.08)"; for (let y = m * 1.5; y < H - u * .3; y += u * .03) { const w = (col - m * 2) * (.75 + r() * .25); ctx.fillRect(m, y, w, u * .007); }
      ctx.fillStyle = "rgba(110,80,40,.22)"; ctx.fillRect(col, m, Math.max(1, u / 700), H - u * .38);
      const hy = m * 1.5 + u * .03 * Math.floor(4 + r() * 6); ctx.fillStyle = "rgba(230,190,90,.35)"; ctx.fillRect(m - u * .01, hy - u * .012, (col - m * 2) * .8, u * .03); ctx.fillRect(m - u * .01, hy + u * .018, (col - m * 2) * .55, u * .03);
      ctx.strokeStyle = "rgba(170,60,50,.7)"; ctx.lineWidth = Math.max(2, u / 300); ctx.beginPath(); ctx.moveTo(col - u * .03, hy - u * .02); ctx.quadraticCurveTo(col - u * .01, hy + u * .02, col - u * .03, hy + u * .06); ctx.stroke();
      const x = col + u * .035, cw = W - x - u * .06, ff = f => `500 ${f}px ${HAND}`, F = fit(ctx, o.quote, ff, cw, H - u * .55, u * .078, 1.05);
      ctx.globalAlpha = A; block(ctx, F, ff, x, m * 1.3, "left", "#8a2f25"); const SF = fit(ctx, "— " + o.speaker, f => `600 ${f}px ${HAND}`, cw, F.fs * 2.2, F.fs * .8, 1.05); block(ctx, SF, f => `600 ${f}px ${HAND}`, x, m * 1.3 + F.h + F.fs * .2, "left", "#5a3a2a"); ctx.globalAlpha = 1; } },
    lineart:  { name: "Line art", own: 1, draw(ctx, W, H, o, th, P, look, A, t) {
      const u = Math.min(W, H), dk = look.dark; grad(ctx, W, H, dk ? ["#10131f", "#191d2c"] : ["#fbf8f1", "#f3ece0"]);
      const cx = W / 2, by = u * .36, s = u * .26; ctx.strokeStyle = th.gold; ctx.lineWidth = Math.max(2, u / 400); ctx.lineCap = ctx.lineJoin = "round";
      ctx.beginPath(); ctx.arc(cx, by - s * .1, s * .28, Math.PI, 0); ctx.stroke();
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i + .5) / 7 * Math.PI; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * s * .38, by - s * .1 + Math.sin(a) * s * .38); ctx.lineTo(cx + Math.cos(a) * s * .5, by - s * .1 + Math.sin(a) * s * .5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - s * 1.3, by); ctx.lineTo(cx - s * .55, by - s * .45); ctx.lineTo(cx - s * .2, by - s * .15); ctx.lineTo(cx + s * .25, by - s * .55); ctx.lineTo(cx + s * 1.3, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s * 1.5, by); ctx.lineTo(cx + s * 1.5, by); ctx.stroke();
      const top = by + u * .07, bottom = H - u * .27, ff = f => `500 ${f}px ${SERIF}`, F = fit(ctx, "“" + o.quote + "”", ff, W - u * .24, bottom - top - u * .12, u * .07, 1.18);
      ctx.globalAlpha = A; const y = top + Math.max(0, (bottom - top - u * .12 - F.h) / 2); block(ctx, F, ff, W / 2, y, "center", th.ink); byline(ctx, o, W / 2, y + F.h + u * .06, "center", th, u, .9); ctx.globalAlpha = 1; } },
    stat:     { name: "Quote + stat", draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H), R = textArea(W, H, u), cw = W - u * .22, S = o.stat || {};
      const ff = f => `500 ${f}px ${SERIF}`, F = fit(ctx, "“" + o.quote + "”", ff, cw, R.h - u * .42, u * .068, 1.16);
      ctx.globalAlpha = A; block(ctx, F, ff, W / 2, R.top, "center", th.ink); byline(ctx, o, W / 2, R.top + F.h + u * .05, "center", th, u, .85);
      const py = R.top + F.h + u * .15, ph = Math.max(u * .16, Math.min(R.bottom - py, u * .24)); if (S.value != null) {
        ctx.save(); ctx.shadowColor = "transparent"; ctx.fillStyle = th.dark ? "rgba(10,12,26,.55)" : "rgba(255,255,255,.75)"; roundRect(ctx, W / 2 - cw / 2, py, cw, ph, u * .03); ctx.fill(); ctx.strokeStyle = th.gold; ctx.globalAlpha *= .5; ctx.lineWidth = Math.max(1, u / 600); ctx.stroke(); ctx.restore();
        ctx.fillStyle = th.gold; ctx.font = `600 ${ph * .66}px ${SERIF}`; ctx.textAlign = "left"; ctx.fillText(String(S.value), W / 2 - cw / 2 + u * .05, py + ph * .62);
        const vx = W / 2 - cw / 2 + u * .07 + ctx.measureText(String(S.value)).width; ctx.fillStyle = th.ink; const lf = f => `500 ${f}px ${SANS}`, LF = fit(ctx, S.label, lf, cw - (vx - (W / 2 - cw / 2)) - u * .05, ph * .62, u * .034, 1.25);
        block(ctx, LF, lf, vx, py + (ph - LF.h) / 2, "left", th.ink); ctx.fillStyle = th.sub; ctx.font = `${u * .017}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText(S.basis || "Counted from the recaps", W / 2, py + ph + u * .03); }
      ctx.globalAlpha = 1; } },
    daily:    { name: "Today’s thought", draw(ctx, W, H, o, th, P, look, A) {
      const u = Math.min(W, H), R = textArea(W, H, u), cw = W - u * .24, d = o.daily || {};
      ctx.globalAlpha = A; ctx.fillStyle = th.gold; ctx.font = `600 ${u * .022}px ${SANS}`; spaced(ctx, "TODAY’S THOUGHT", W / 2, R.top + u * .02, u * .008, "center");
      ctx.fillStyle = th.ink; ctx.font = `500 ${u * .05}px ${SERIF}`; ctx.textAlign = "center"; ctx.fillText(d.date || "", W / 2, R.top + u * .1);
      ctx.fillStyle = th.gold; ctx.fillRect(W / 2 - u * .05, R.top + u * .135, u * .1, Math.max(2, u / 400));
      const ff = f => `italic 500 ${f}px ${SERIF}`, F = fit(ctx, "“" + o.quote + "”", ff, cw, R.h - u * .38, u * .075, 1.16), y = R.top + u * .19 + Math.max(0, (R.h - u * .38 - F.h) / 2);
      block(ctx, F, ff, W / 2, y, "center", th.ink); byline(ctx, o, W / 2, y + F.h + u * .06, "center", th, u, .85);
      if (d.line) { ctx.fillStyle = th.sub; ctx.font = `500 ${u * .024}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText(d.line, W / 2, R.bottom - u * .01); } ctx.globalAlpha = 1; } },
  };
  // ---------- animation styles (every style is a 10 s clip that loops cleanly) ----------
  const ANIMS = { fade: "Soft fade", rays: "Light rays sweep", words: "Word-by-word reveal", zoom: "Gentle zoom", stars: "Drifting stars", shimmer: "Golden shimmer", sunrise: "Sunrise glow", typewriter: "Typewriter", none: "None (still)" };
  function drawCard(ctx, W, H, o, time = Infinity) {
    const T = TL.total, a = o.anim || "fade";
    if (!isFinite(time) || a === "none") return drawFrame(ctx, W, H, o, Infinity);
    const tt = ((time % T) + T) % T || (time >= T ? T : 0);
    drawFrame(ctx, W, H, o, tt);
    // clean loop: the last 0.7 s dissolves back into the opening frame
    const e = tt - (T - .7);
    if (e > 0) { ctx.save(); ctx.globalAlpha = easeIO(c01(e / .7)); drawFrame(ctx, W, H, o, 0); ctx.restore(); }
  }
  function partial(ctx, r, y, x, al, f, caret, th) {
    ctx.font = r.font; ctx.fillStyle = r.color; const full = ctx.measureText(r.txt).width, sx = al === "center" ? x - full / 2 : x;
    const words = r.txt.split(" "), mode = r.mode, n = mode === "words" ? words.length : r.txt.length, k = Math.floor(f * n + 1e-6);
    const str = mode === "words" ? words.slice(0, k).join(" ") : r.txt.slice(0, k);
    ctx.textAlign = "left"; ctx.fillText(str, sx, y + r.by);
    if (mode === "words" && k < n) { const nx = sx + ctx.measureText(str + (k ? " " : "")).width, fr = f * n - k; ctx.save(); ctx.globalAlpha *= easeIO(fr); ctx.fillText(words[k], nx, y + r.by); ctx.restore(); }
    if (caret) { const w = ctx.measureText(str).width, fsz = parseFloat(/(\d+(\.\d+)?)px/.exec(r.font)[1]); ctx.fillStyle = th.gold; ctx.fillRect(sx + w + fsz * .06, y + r.by - fsz * .78, Math.max(2, fsz * .06), fsz * .9); }
  }
  function drawFrame(ctx, W, H, o, time) {
    const G = geom(W, H), u = G.u, look = LOOKS[o.look] || LOOKS.sunrise, P = PALETTES[o.palette] || PALETTES.gold, th = fmtTheme(textTheme(look, P), o), fm = fmtOf(o);
    const still = !isFinite(time), t = still ? 3 : time, A = still ? "none" : (o.anim || "fade"), al = o.align === "left" ? "left" : "center", D = Math.max(W, H), x = (al === "left" ? G.x0 : W / 2) + (fm.dx || 0) * W, FXA = FX[A];
    const LY = o.kind === "quote" && LAYOUTS[o.layout] && LAYOUTS[o.layout].draw ? LAYOUTS[o.layout] : null;
    if (LY) return drawLayout(ctx, W, H, o, time, LY, G, look, P, th, still, t, A, D);
    ctx.save(); ctx.textBaseline = "alphabetic";
    if (A === "zoom" && !look.photo) { const z = 1 + .1 * easeIO(c01(t / T10)); ctx.translate(W / 2, H * .45); ctx.scale(z, z); ctx.translate(-W / 2, -H * .45); }
    paintBG(ctx, W, H, look, P, t, o, A, still); ctx.restore();
    if (A === "sunrise") { const p = easeIO(c01(t / 5)); glow(ctx, W / 2, H * (1.15 - .4 * p), D * (.45 + .4 * p), P.tint, .45 * p); glow(ctx, W / 2, H * (1.15 - .4 * p), D * .2, [255, 248, 228], .35 * p); }
    overlay(ctx, W, H, look, o.overlay ?? look.ov ?? 0); vig(ctx, W, H, fm.vig);
    if (FXA && FXA.mid) { ctx.save(); FXA.mid(ctx, W, H, t, u, th, P, look); ctx.restore(); }
    if (A === "rays") { const p = easeIO(c01((t - .3) / 6.5)), bx = -W * .6 + p * W * 2.2; ctx.save(); ctx.globalCompositeOperation = look.dark ? "lighter" : "source-over";
      const g = ctx.createLinearGradient(bx - W * .35, 0, bx + W * .35, H * .25); g.addColorStop(0, rgba(P.tint, 0)); g.addColorStop(.5, rgba(look.dark ? P.tint : [255, 255, 255], look.dark ? .22 : .45)); g.addColorStop(1, rgba(P.tint, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.translate(W / 2, -H * .08); ctx.globalAlpha = .9 * Math.sin(Math.PI * c01(t / 9.3)); for (let i = 0; i < 9; i++) { const an = Math.PI / 2 + (i - 4) * .16 + Math.sin(t * .4) * .05; const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, D * 1.1); rg.addColorStop(0, rgba(look.dark ? P.tint : [255, 250, 236], .16)); rg.addColorStop(1, rgba(P.tint, 0)); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, D * 1.1, an - .03, an + .03); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    if (A === "stars") { const r = rng(99), n = 70; for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, sp = 1 + Math.floor(r() * 2), s0 = r();
      const y = ((y0 - (t / 10) * H * sp) % H + H) % H, xx = x0 + Math.sin(t / 10 * TAU * sp + i) * u * .015, tw = .5 + .5 * Math.sin(t / 10 * TAU * (2 + i % 3) + i);
      ctx.fillStyle = look.dark ? `rgba(255,246,220,${(.25 + .6 * s0) * tw})` : rgba(hex(P.dk), (.2 + .4 * s0) * tw); ctx.beginPath(); ctx.arc(xx, y, u * (.0016 + s0 * .0032), 0, TAU); ctx.fill(); } }
    border(ctx, W, H, th, still || A === "none" ? 1 : ease(c01(t / 1.2)), o);
    ctx.save(); if (look.photo || look.ov) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = u * .018; }
    ctx.globalAlpha = still ? 1 : ease(c01((t - .2) / .8)); ctx.fillStyle = th.gold; ctx.font = `600 ${u * .021}px ${SANS}`;
    spaced(ctx, o.eyebrow || "OCTOBER 2026 · GENERAL CONFERENCE", x, G.eyeY, u * .007, al); ctx.globalAlpha = 1;
    const avail = G.bottom - G.top; let k = 1, rows, total;
    for (let i = 0; i < 14; i++) { rows = o.kind === "insight" ? insightRows(ctx, G, o, th, k) : quoteRows(ctx, G, o, th, k); total = rows.reduce((s, r) => s + r.h, 0); if (total <= avail) break; k *= .93; }
    // per-row timing
    const rev = A === "words" || A === "typewriter" ? A : null;
    let tc = TL.start; const units = rows.reduce((s, r) => s + (rev && r.line ? (rev === "words" ? r.txt.split(" ").length : r.txt.length) : 0), 0);
    const rate = rev ? Math.min(rev === "words" ? .26 : .045, 4.6 / Math.max(1, units)) : 0;
    rows.forEach(r => { r.t0 = tc; if (rev && r.line) { r.mode = rev; r.dur = (rev === "words" ? r.txt.split(" ").length : r.txt.length) * rate; tc += r.dur; } else { r.dur = TL.dur; tc += rev ? .25 : TL.gap; } });
    const y0 = G.top + Math.max(0, (avail - total) / 2), slack = G.u * .03; let y = y0 + Math.max(G.top - y0 - slack * 2, Math.min(Math.max(0, G.bottom - y0 - total) + slack, (fm.dy || 0) * H));
    { const bp = still || A === "none" ? 1 : ease(c01((t - TL.start + .3) / .8)); if (bp > 0) { ctx.save(); ctx.globalAlpha = bp; ctx.shadowColor = "transparent"; textBox(ctx, o, th, al === "left" ? x : x - G.cw / 2, y, G.cw, total, u, W); ctx.restore(); } }
    let ri = 0;
    rows.forEach(r => { ri++; if (still || A === "none") { r.draw(y, x, al); y += r.h; return; }
      const raw = (t - r.t0) / r.dur;
      if (FXA && FXA.text === "letters" && r.line) { const f2 = c01((t - r.t0) / (r.dur * 1.6)); if (f2 > 0) { ctx.save(); letters(ctx, r, y, x, al, f2, u); ctx.restore(); } y += r.h; return; }
      if (FXA && FXA.text === "float") { const p = ease(c01(raw)); if (p > 0) { ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * u * .09 + Math.sin(t / 10 * TAU * 2 + ri) * u * .004); r.draw(y, x, al); ctx.restore(); } y += r.h; return; }
      if (r.mode) { if (raw > 0) { ctx.save(); if (raw >= 1) r.draw(y, x, al); else partial(ctx, r, y, x, al, c01(raw), r.mode === "typewriter", th); ctx.restore(); } }
      else { const p = ease(c01(raw)); if (p > 0) { ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * u * .02); r.draw(y, x, al); ctx.restore(); } }
      y += r.h; });
    ctx.restore();
    if (A === "shimmer") { const sweep = (s0) => { const p = c01((t - s0) / 1.6); if (p <= 0 || p >= 1) return; const bx = G.x0 - u * .3 + p * (G.cw + u * .6);
        ctx.save(); ctx.globalCompositeOperation = look.dark ? "lighter" : "source-over"; const g = ctx.createLinearGradient(bx - u * .12, G.top, bx + u * .12, G.top + u * .2);
        g.addColorStop(0, rgba(hex(P.acc), 0)); g.addColorStop(.5, rgba(hex(P.acc), look.dark ? .28 : .35)); g.addColorStop(1, rgba(hex(P.acc), 0)); ctx.fillStyle = g; ctx.fillRect(0, G.top, W, G.bottom - G.top); ctx.restore(); };
      sweep(3.2); sweep(6.6); const r = rng(5);
      for (let i = 0; i < 16; i++) { const sx = r() * W, sy = G.top + r() * (G.bottom - G.top), ph0 = r() * 10, f = Math.max(0, Math.sin((t - ph0) / 10 * TAU * 2)), s = u * (.008 + r() * .012) * f;
        if (s < .5) continue; ctx.save(); ctx.translate(sx, sy); ctx.fillStyle = rgba(hex(P.acc), .9 * f); ctx.beginPath(); ctx.moveTo(0, -s * 2); ctx.quadraticCurveTo(0, 0, s * 2, 0); ctx.quadraticCurveTo(0, 0, 0, s * 2); ctx.quadraticCurveTo(0, 0, -s * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 2); ctx.fill(); ctx.restore(); } }
    slideNo(ctx, W, u, o.ins && o.ins.slide ? { slide: o.ins.slide } : o, th);
    const fp = still || A === "none" ? 1 : ease(c01((t - Math.min(TL.footer, tc + .4)) / 1));
    if (fp > 0) footer(ctx, W, H, G, th, o, fp, look);
    // disclaimer + photo credit (credit sits under the frame line)
    ctx.save(); ctx.globalAlpha = .9; ctx.textAlign = "center"; ctx.fillStyle = th.sub; ctx.font = `${u * .0175}px ${SANS}`;
    if (look.photo || look.ov) { ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = u * .01; }
    ctx.fillText((o.kind === "insight" ? (o.ins && o.ins.basis) || "Based on recaps" : "Quoted from recap") + " · Personal study site · Not an official Church site", W / 2, H - u * .068);
    if (look.credit) { ctx.font = `${u * .0145}px ${SANS}`; ctx.fillText(creditLine(look.credit), W / 2, H - u * .018); }
    ctx.restore(); grain(ctx, W, H, fm.grain);
    if (FXA && FXA.post && !still) { ctx.save(); FXA.post(ctx, W, H, t, u, th, P, look); ctx.restore(); }
  }
  const creditLine = c => c.group === "art" ? `Painting: ${String(c.name).slice(0, 40)} · ${String(c.author).slice(0, 40)} · Public domain` : `Photo: ${String(c.author).slice(0, 48)} · ${c.license} · Wikimedia Commons`;
  // per-letter float-in (each character rises into place)
  function letters(ctx, r, y, x, al, f, u) { ctx.font = r.font; ctx.fillStyle = r.color; ctx.textAlign = "left"; const full = ctx.measureText(r.txt).width, sx = al === "center" ? x - full / 2 : x, n = r.txt.length;
    let cx = sx; for (let i = 0; i < n; i++) { const ch = r.txt[i], w = ctx.measureText(r.txt.slice(0, i + 1)).width, lp = c01(f * 1.6 - (i / n) * .6); if (lp > 0) { ctx.globalAlpha = ease(lp); ctx.fillText(ch, sx + (w - ctx.measureText(ch).width), y + r.by + (1 - ease(lp)) * u * .05); } cx = sx + w; } }
  const T10 = 10;
  function fx(ctx, W, H, o, look, P, t, A, D, u, pre) {
    if (pre && A === "sunrise") { const p = easeIO(c01(t / 5)); glow(ctx, W / 2, H * (1.15 - .4 * p), D * (.45 + .4 * p), P.tint, .45 * p); glow(ctx, W / 2, H * (1.15 - .4 * p), D * .2, [255, 248, 228], .35 * p); }
    if (!pre && A === "rays") { const p = easeIO(c01((t - .3) / 6.5)), bx = -W * .6 + p * W * 2.2; ctx.save(); ctx.globalCompositeOperation = look.dark ? "lighter" : "source-over";
      const g = ctx.createLinearGradient(bx - W * .35, 0, bx + W * .35, H * .25); g.addColorStop(0, rgba(P.tint, 0)); g.addColorStop(.5, rgba(look.dark ? P.tint : [255, 255, 255], look.dark ? .2 : .4)); g.addColorStop(1, rgba(P.tint, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (!pre && A === "stars") { const r = rng(99); for (let i = 0; i < 60; i++) { const x0 = r() * W, y0 = r() * H, sp = 1 + Math.floor(r() * 2), s0 = r(), y = ((y0 - (t / 10) * H * sp) % H + H) % H, tw = .5 + .5 * Math.sin(t / 10 * TAU * (2 + i % 3) + i);
      ctx.fillStyle = look.dark ? `rgba(255,246,220,${(.25 + .6 * s0) * tw})` : rgba(hex(P.dk), (.2 + .4 * s0) * tw); ctx.beginPath(); ctx.arc(x0 + Math.sin(t / 10 * TAU * sp + i) * u * .015, y, u * (.0016 + s0 * .0032), 0, TAU); ctx.fill(); } }
    if (!pre && A === "shimmer") { const p = c01((t - 3.2) / 1.8); if (p > 0 && p < 1) { const bx = -W * .2 + p * W * 1.4; ctx.save(); ctx.globalCompositeOperation = look.dark ? "lighter" : "source-over"; const g = ctx.createLinearGradient(bx - u * .15, 0, bx + u * .15, u * .3); g.addColorStop(0, rgba(hex(P.acc), 0)); g.addColorStop(.5, rgba(hex(P.acc), .25)); g.addColorStop(1, rgba(hex(P.acc), 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  }
  function drawLayout(ctx, W, H, o, time, LY, G, look, P, th, still, t, A, D) {
    const u = G.u, th2 = fmtTheme(LY.light ? TH_LIGHT(P) : th, o), fm = fmtOf(o), FXA = FX[A];
    ctx.save(); if (A === "zoom") { const z = 1 + .08 * easeIO(c01(t / T10)); ctx.translate(W / 2, H * .45); ctx.scale(z, z); ctx.translate(-W / 2, -H * .45); }
    if (!LY.own) paintBG(ctx, W, H, look, P, t, o, A, still); ctx.restore();
    if (!LY.own) { fx(ctx, W, H, o, look, P, t, A, D, u, true); overlay(ctx, W, H, look, o.overlay ?? Math.max(look.ov || 0, LY.ov || 0)); vig(ctx, W, H, fm.vig); if (FXA && FXA.mid) { ctx.save(); FXA.mid(ctx, W, H, t, u, th2, P, look); ctx.restore(); } }
    const a = still || A === "none" ? 1 : ease(c01((t - TL.start) / 1.4));
    ctx.save(); if (!LY.own && (look.photo || look.ov)) { ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = u * .014; } LY.draw(ctx, W, H, o, th2, P, look, a, still ? 3 : t); ctx.restore();
    if (o.note && !LY.own) { const R = textArea(W, H, u); }
    slideNo(ctx, W, u, o, th2); fx(ctx, W, H, o, look, P, t, A, D, u, false);
    border(ctx, W, H, th2, !still && A !== "none" ? ease(c01(t / 1.2)) : 1, o);
    const fp = still || A === "none" ? 1 : ease(c01((t - 3.2) / 1)); if (fp > 0) brand(ctx, W, H, u, th2, o, fp, LY.own ? null : look);
    ctx.save(); ctx.globalAlpha = .9; ctx.textAlign = "center"; ctx.fillStyle = th2.sub; ctx.font = `${u * .0175}px ${SANS}`;
    const dx = LY === LAYOUTS.split && W >= H ? W * .27 : W / 2; ctx.fillText("Quoted from recap · Personal study site · Not an official Church site", dx, H - u * .068);
    if (look.credit && (LY.own ? LY.light && LY !== LAYOUTS.margin : true) && LY !== LAYOUTS.lineart && LY !== LAYOUTS.margin) { ctx.font = `${u * .0145}px ${SANS}`; ctx.fillText(creditLine(look.credit), dx, H - u * .018); }
    ctx.restore(); grain(ctx, W, H, fm.grain);
    if (FXA && FXA.post && !still) { ctx.save(); FXA.post(ctx, W, H, t, u, th2, P, look); ctx.restore(); }
  }
  function footer(ctx, W, H, G, th, o, p, look) {
    const u = G.u, dom = (window.CONF && CONF.domain) || "sixmonthsoflight.com"; ctx.save(); ctx.globalAlpha = p; if (look.photo || look.ov) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = u * .016; }
    if (G.kind === "story" || G.kind === "wall") {
      const y0 = H - u * (G.kind === "story" ? .55 : .42);
      mark(ctx, W / 2, y0, u * .1, th, p); wordmark(ctx, W / 2, y0 + u * .095, u * .06, th, "center");
      ctx.textAlign = "center"; ctx.fillStyle = th.ink; ctx.font = `600 ${u * .036}px ${SANS}`; ctx.fillText(dom, W / 2, y0 + u * .155);
      let y = y0 + u * .19;
      if (G.kind === "story" && o.sticker) { const zw = u * .5, zh = u * .085, zx = W / 2 - zw / 2; ctx.shadowColor = "transparent";
        ctx.fillStyle = th.dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.5)"; roundRect(ctx, zx, y, zw, zh, zh / 2); ctx.fill();
        ctx.setLineDash([u * .012, u * .01]); ctx.strokeStyle = th.gold; ctx.globalAlpha = p * .6; ctx.lineWidth = Math.max(1.5, u / 700); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = p * .85; ctx.fillStyle = th.sub; ctx.font = `500 ${u * .026}px ${SANS}`; ctx.fillText("Link sticker here", W / 2, y + zh * .5 + u * .009); ctx.globalAlpha = p; y += zh + u * .03; }
      const qs = u * (G.kind === "wall" ? .13 : o.sticker ? .13 : .16); qr(ctx, o.url, W / 2 - qs / 2, y, qs, th, p);
    } else {
      const fx = G.kind === "wide" ? W * .07 : u * .1, by = H - u * .15;
      mark(ctx, fx + u * .04, by - u * .018, u * .085, th, p); wordmark(ctx, fx + u * .095, by, u * .046, th, "left");
      ctx.textAlign = "left"; ctx.fillStyle = th.ink; ctx.font = `600 ${u * .027}px ${SANS}`; ctx.fillText(dom, fx + u * .097, by + u * .045);
      const qs = u * .145; qr(ctx, o.url, W - fx - qs, by - qs * .66, qs, th, p);
    }
    ctx.restore();
  }
  // Background-only thumbnail for the look picker.
  function drawThumb(ctx, W, H, lookId, palette) { const look = LOOKS[lookId], P = PALETTES[palette] || PALETTES.gold; ctx.save(); look.paint(ctx, W, H, P, 3, {}, look); ctx.restore(); overlay(ctx, W, H, look, look.ov || 0); }
  // Open Graph link-preview image (1200x630)
  function drawOG(ctx, W, H, o) {
    const th = textTheme({ dark: 1 }, PALETTES.gold); sky(ctx, W, H, SKY.dusk, 3, "mountains"); frame(ctx, W, H, th);
    const x = W * .085; ctx.textAlign = "left";
    mark(ctx, x + 26, H * .2, 56, th); wordmark(ctx, x + 64, H * .2 + 10, 32, th, "left");
    ctx.fillStyle = th.gold; ctx.font = `600 15px ${SANS}`; spaced(ctx, "OCTOBER 2026 GENERAL CONFERENCE", W - x, H * .2 + 6, 3, "right");
    let fs = 78; ctx.font = `500 ${fs}px ${SERIF}`; let lines = wrap(ctx, o.title, W * .8);
    while (lines.length > 2) { fs *= .92; ctx.font = `500 ${fs}px ${SERIF}`; lines = wrap(ctx, o.title, W * .8); }
    ctx.fillStyle = th.ink; lines.forEach((l, i) => ctx.fillText(l, x, H * .43 + i * fs * 1.02));
    const y = H * .43 + (lines.length - 1) * fs * 1.02 + 46;
    ctx.fillStyle = th.gold; ctx.font = `600 18px ${SANS}`; spaced(ctx, o.speaker.toUpperCase(), x, y, 3, "left");
    ctx.fillStyle = th.sub; ctx.font = `italic 500 29px ${SERIF}`; wrap(ctx, o.bigIdea, W * .8).slice(0, 2).forEach((l, i) => ctx.fillText(l, x, y + 44 + i * 34));
    ctx.font = `14px ${SANS}`; ctx.fillStyle = th.sub; ctx.fillText("Personal study site · Not an official Church site · Quotes from recaps", x, H * .92);
  }
  const H_ = { grad, glow, sky, SKY, vignette, ridges, aurora, stars, rgba, hex, rng, TAU, LP, raysAt, temple, oliveBranch, person, wrap, roundRect, paperBase, ease, easeIO, c01, SERIF, SANS };
  window.CardKit = { LOOKS, LAYOUTS, PALETTES, FONTS, FONTF, SIZES, TL, ANIMS, FX, H: H_, drawCard, drawThumb, drawOG, prepare, IMG };
})();
