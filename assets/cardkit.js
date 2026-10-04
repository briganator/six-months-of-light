// CardKit v3 — Six Months of Light. One renderer for still quote cards, the animated 9:16 card and OG images.
// drawCard(ctx, W, H, opts, time): time in seconds; Infinity = final still frame.
(function () {
  const SERIF = '"Cormorant Garamond", Georgia, serif', SANS = 'Inter, system-ui, sans-serif';
  const THEMES = {
    dusk:     { sky: ["#070b18", "#141c3c", "#2a2d5c", "#5a3a5e", "#b06f68", "#e7a983"], sun: [255, 228, 180], ink: "#fffaf0", sub: "rgba(255,246,228,.74)", gold: "#f1d394", gold2: "#d8a95b", qr: ["#0d1326", "#fffaf0"] },
    midnight: { sky: ["#03060f", "#0a1128", "#141c3c", "#1f2350", "#2f2a55", "#4b3459"], sun: [246, 214, 160], ink: "#fbf3e3", sub: "rgba(251,243,227,.7)", gold: "#f6dfa6", gold2: "#c9a45c", qr: ["#0d1326", "#fbf3e3"] },
    dawn:     { sky: ["#fdf8f0", "#f9ecdc", "#f4dcc7", "#eec5b2", "#e3a693", "#d68f80"], sun: [255, 250, 236], ink: "#1d1b2e", sub: "rgba(29,27,46,.7)", gold: "#a87a35", gold2: "#c4925a", qr: ["#1d1b2e", "#fffdf8"] },
  };
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
  const easeIO = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const c01 = x => Math.max(0, Math.min(1, x));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function wrap(ctx, text, maxW) {
    const words = text.split(" "), lines = []; let l = "";
    for (const w of words) { const t = l ? l + " " + w : w; if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; }
    lines.push(l); return lines;
  }
  function spaced(ctx, s, x, y, sp, align = "center") {
    const w = [...s].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + sp * (s.length - 1);
    let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; const prev = ctx.textAlign; ctx.textAlign = "left";
    for (const ch of s) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; } ctx.textAlign = prev; return w;
  }
  // ---- background: sky, sunrise glow, light rays, orbs, vignette, frame ----
  function sky(ctx, W, H, th, t, sunP = 1, bg = "rays") {
    const g = ctx.createLinearGradient(0, 0, 0, H); th.sky.forEach((c, i) => g.addColorStop(i / (th.sky.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const D = Math.max(W, H);
    const sx = W / 2, sy = H * (1.12 - .1 * sunP);
    if (bg === "aurora") aurora(ctx, W, H, th, t);
    // rays
    if (bg === "rays" || bg === "mountains") { ctx.save(); ctx.translate(sx, sy); ctx.rotate((isFinite(t) ? t : 3) * .02);
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, w = .022 + (i % 3) * .008;
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, D * 1.05);
      rg.addColorStop(0, rgba(th.sun, .16 * sunP)); rg.addColorStop(.55, rgba(th.sun, .035 * sunP)); rg.addColorStop(1, rgba(th.sun, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, D * 1.05, a - w, a + w); ctx.closePath(); ctx.fill();
    }
    ctx.restore(); }
    // sun glow layers
    [[.95, .75], [.55, .45], [.26, .75]].forEach(([r, a]) => {
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, D * r);
      rg.addColorStop(0, rgba(th.sun, a * sunP)); rg.addColorStop(.35, rgba(th.sun, a * .35 * sunP)); rg.addColorStop(1, rgba(th.sun, 0));
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    });
    // drifting orbs
    const tt = isFinite(t) ? t : 3;
    [[.18, .2, .32, [150, 140, 235]], [.85, .32, .28, [227, 166, 147]], [.6, .08, .22, [246, 223, 166]]].forEach(([x, y, r, c], i) => {
      const cx = W * (x + Math.sin(tt * .25 + i * 2) * .04), cy = H * (y + Math.cos(tt * .2 + i) * .025), R = D * r;
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); rg.addColorStop(0, rgba(c, .18)); rg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    });
    if (bg === "mountains") ridges(ctx, W, H, th, t);
    // vignette
    const v = ctx.createRadialGradient(W / 2, H * .45, D * .3, W / 2, H * .45, D * .85);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, th === THEMES.dawn ? "rgba(120,70,50,.12)" : "rgba(0,0,0,.35)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // horizon line
    const hy = H * .985; const hg = ctx.createLinearGradient(0, 0, W, 0);
    hg.addColorStop(0, rgba(th.sun, 0)); hg.addColorStop(.5, rgba(th.sun, .5 * sunP)); hg.addColorStop(1, rgba(th.sun, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, hy, W, Math.max(1, W / 900));
  }
  // generated landscape: three ridgelines with a rim of dawn light (slow parallax drift when animated)
  function ridges(ctx, W, H, th, t) {
    const tt = isFinite(t) ? t : 0, dawn = th === THEMES.dawn;
    const layers = [[.70, .05, dawn ? "rgba(196,124,108,.35)" : "rgba(107,74,110,.55)"], [.78, .035, dawn ? "rgba(160,96,90,.45)" : "rgba(42,37,80,.85)"], [.87, .025, dawn ? "rgba(120,70,70,.5)" : "rgba(11,16,34,.92)"]];
    layers.forEach(([base, amp, col], li) => {
      const off = tt * (4 + li * 6);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += W / 60) { const u = (x + off) / W; ctx.lineTo(x, H * (base - amp * (Math.sin(u * 7 + li * 2) * .6 + Math.sin(u * 17 + li) * .25 + Math.sin(u * 3.1) * .5))); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      if (li === 0) { ctx.strokeStyle = rgba(th.sun, .45); ctx.lineWidth = Math.max(1, W / 800); ctx.stroke(); }
    });
  }
  // soft aurora ribbons of light
  function aurora(ctx, W, H, th, t) {
    const tt = isFinite(t) ? t : 2;
    [[.28, [150, 140, 235]], [.4, [227, 166, 147]], [.52, [246, 223, 166]]].forEach(([y, c], i) => {
      ctx.beginPath(); ctx.moveTo(0, H * y);
      for (let x = 0; x <= W; x += W / 40) ctx.lineTo(x, H * y + Math.sin(x / W * 5 + tt * .5 + i) * H * .05);
      ctx.lineTo(W, H * y + H * .18); ctx.lineTo(0, H * y + H * .18); ctx.closePath();
      const g = ctx.createLinearGradient(0, H * y - H * .05, 0, H * y + H * .2); g.addColorStop(0, rgba(c, 0)); g.addColorStop(.35, rgba(c, .22)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fill();
    });
  }
  function frame(ctx, W, H, th, a = 1) {
    const m = W * .045, L = W * .05; ctx.save(); ctx.globalAlpha = .45 * a; ctx.strokeStyle = th.gold; ctx.lineWidth = Math.max(1, W / 1000);
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.globalAlpha = .9 * a; ctx.lineWidth = Math.max(1.5, W / 600);
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke(); });
    ctx.restore();
  }
  // ---- logo mark (same geometry as assets/logo-mark.svg) ----
  const RAYS = [[17.73, 39.36, 13.45, 37.97, 0.38, 1.6], [21.73, 33.07, 16.87, 27.89, 0.5, 1.78], [28.27, 29.47, 25.86, 20.08, 0.63, 1.96], [35.73, 29.47, 38.79, 17.56, 0.75, 2.14], [42.27, 33.07, 52.47, 22.2, 0.88, 2.32], [46.27, 39.36, 62.91, 33.96, 1.0, 2.5]];
  function mark(ctx, cx, cy, size, th, a = 1, grow = 1) {
    const s = size / 64; ctx.save(); ctx.globalAlpha = a; ctx.translate(cx - 32 * s, cy - 32 * s); ctx.scale(s, s);
    const g = ctx.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, "#e3a693"); g.addColorStop(.55, "#f1d394"); g.addColorStop(1, "#fff3d1");
    const glow = ctx.createRadialGradient(32, 44, 0, 32, 44, 30); glow.addColorStop(0, "rgba(246,223,166,.5)"); glow.addColorStop(1, "rgba(246,223,166,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = g; ctx.fillStyle = g; ctx.lineCap = "round";
    RAYS.forEach(([x1, y1, x2, y2, o, w], i) => { const k = Math.max(0, Math.min(1, grow * 6 - i)); if (!k) return;
      ctx.globalAlpha = a * o * k; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); ctx.stroke(); });
    ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(32, 44, 11, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, 44); ctx.lineTo(58, 44); ctx.stroke();
    ctx.globalAlpha = a * .55; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(18, 50); ctx.lineTo(46, 50); ctx.stroke();
    ctx.restore();
  }
  function wordmark(ctx, x, y, fs, th, align = "center", a = 1) {
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left";
    const parts = [["Six Months ", `500 ${fs}px ${SERIF}`, th.ink], ["of", `italic 500 ${fs}px ${SERIF}`, th.gold], [" Light", `500 ${fs}px ${SERIF}`, th.ink]];
    const w = parts.reduce((s, [t, f]) => { ctx.font = f; return s + ctx.measureText(t).width; }, 0);
    let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    parts.forEach(([t, f, c]) => { ctx.font = f; ctx.fillStyle = c; ctx.fillText(t, cx, y); cx += ctx.measureText(t).width; });
    ctx.restore(); return w;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function qr(ctx, text, x, y, size, th, a = 1) {
    const q = qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount(), pad = size * .09, cell = (size - pad * 2) / n;
    ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = size * .12; ctx.shadowOffsetY = size * .03;
    ctx.fillStyle = th.qr[1]; roundRect(ctx, x, y, size, size, size * .1); ctx.fill(); ctx.shadowColor = "transparent";
    ctx.fillStyle = th.qr[0];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
    ctx.restore();
  }
  // Visible brand line: the short domain once it's live (single config in tools/talks_source.py), otherwise a findable phrase.
  // No github.io or placeholder URLs are ever printed on a card; the QR code carries the deep link.
  const findLine = () => (window.CONF && CONF.domain_live) ? CONF.domain : "Find it at Six Months of Light";

  // ---- timeline (seconds) ----
  const TL = { sun: 1.4, lineStart: 1.0, lineGap: .55, lineDur: 1.1, endAt: 6.6, total: 10 };

  function drawCard(ctx, W, H, o, time = Infinity) {
    const th = THEMES[o.theme || "dusk"], still = !isFinite(time), story = H / W > 1.6, portrait = !story && H / W > 1.1;
    const sunP = still ? 1 : easeIO(c01(time / TL.sun));
    sky(ctx, W, H, th, time, (.35 + .65 * sunP) * (still && !story ? .8 : 1), o.bg || "rays");
    frame(ctx, W, H, th, still ? 1 : ease(c01(time / 1.2)));
    const pad = W * .13, maxW = W - pad * 2;
    const endP = still ? 0 : easeIO(c01((time - TL.endAt) / 1.2));
    // footer geometry (stills: bottom brand row; animated: centered end card)
    const discY = H - W * .07;
    const footTop = story ? H - W * .76 : H - W * (portrait ? .31 : .29);
    const topY = W * (story ? .2 : .14);
    ctx.textAlign = "center";
    // eyebrow
    ctx.globalAlpha = (still ? 1 : ease(c01((time - .3) / 1))) * (1 - endP);
    ctx.fillStyle = th.gold; ctx.font = `600 ${W * .021}px ${SANS}`;
    spaced(ctx, "OCTOBER 2026 · GENERAL CONFERENCE", W / 2, topY, W * .007);
    ctx.globalAlpha = 1;
    // fit quote
    const FONT = { classic: f => `500 ${f}px ${SERIF}`, italic: f => `italic 500 ${f}px ${SERIF}`, modern: f => `400 ${f * .8}px ${SANS}` }[o.font || "classic"];
    const noteLines = []; if (o.note) { ctx.font = `italic 400 ${W * .03}px ${SANS}`; noteLines.push(...wrap(ctx, o.note, maxW * .92).slice(0, 2)); }
    const noteH = noteLines.length ? W * (.07 + noteLines.length * .042) : 0;
    const attrH = W * .22 + noteH, avail = footTop - W * .05 - attrH - (topY + W * .1);
    let fs = W * (story ? .088 : .08), lines;
    do { ctx.font = FONT(fs); lines = wrap(ctx, o.quote, maxW); if (lines.length * fs * 1.22 <= avail) break; fs *= .95; } while (fs > 18);
    let mw = maxW; while (mw > maxW * .62) { const l2 = wrap(ctx, o.quote, mw - W * .02); if (l2.length > lines.length) break; mw -= W * .02; lines = l2; }
    const lh = fs * 1.2, blockH = lines.length * lh;
    const qTop = topY + W * .1 + Math.max(0, (avail - blockH) / 2);
    const lift = endP * W * .08;
    // decorative quote glyph
    const gA = (still ? 1 : ease(c01((time - .6) / 1.2))) * (1 - endP);
    ctx.save(); ctx.globalAlpha = .9 * gA; ctx.font = `500 ${W * .26}px ${SERIF}`;
    const gg = ctx.createLinearGradient(0, qTop - W * .16, 0, qTop + W * .02); gg.addColorStop(0, th.gold); gg.addColorStop(1, th.gold2);
    ctx.fillStyle = gg; ctx.fillText("“", W / 2, qTop + W * .09 - lift); ctx.restore();
    // quote lines
    ctx.font = FONT(fs);
    lines.forEach((l, i) => {
      const p = still ? 1 : ease(c01((time - TL.lineStart - i * TL.lineGap) / TL.lineDur));
      ctx.save(); ctx.globalAlpha = p * (1 - endP);
      if (!still && p < 1) { ctx.shadowColor = rgba(th.sun, .6 * (1 - p)); ctx.shadowBlur = fs * .6 * (1 - p); }
      ctx.fillStyle = th.ink; ctx.fillText(l + (i === lines.length - 1 ? "”" : ""), W / 2, qTop + W * .1 + fs * .9 + i * lh + (1 - p) * fs * .4 - lift);
      ctx.restore();
    });
    // attribution
    const aT = TL.lineStart + lines.length * TL.lineGap + .4, aP = still ? 1 : ease(c01((time - aT) / 1));
    const ay = qTop + W * .1 + blockH + W * .06 - lift;
    ctx.globalAlpha = aP * (1 - endP);
    const lg = ctx.createLinearGradient(W / 2 - W * .07, 0, W / 2 + W * .07, 0); lg.addColorStop(0, rgba([216, 169, 91], 0)); lg.addColorStop(.5, th.gold); lg.addColorStop(1, rgba([216, 169, 91], 0));
    ctx.fillStyle = lg; ctx.fillRect(W / 2 - W * .07, ay, W * .14, Math.max(2, W / 520));
    ctx.fillStyle = th.ink; ctx.font = `600 ${W * .025}px ${SANS}`; spaced(ctx, o.speaker.toUpperCase(), W / 2, ay + W * .065, W * .005);
    ctx.fillStyle = th.sub; ctx.font = `italic 500 ${W * .042}px ${SERIF}`; ctx.fillText(o.title, W / 2, ay + W * .118);
    // optional personal line — clearly labeled as the sharer's own words, styled apart from the quote
    if (noteLines.length) {
      const nP = still ? 1 : ease(c01((time - aT - .8) / 1)); ctx.globalAlpha = nP * (1 - endP);
      const ny = ay + W * .19, bw = maxW * .98, bh = noteH - W * .02;
      ctx.fillStyle = th === THEMES.dawn ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.08)"; roundRect(ctx, W / 2 - bw / 2, ny - W * .045, bw, bh, W * .02); ctx.fill();
      ctx.fillStyle = th.gold; ctx.font = `600 ${W * .018}px ${SANS}`; spaced(ctx, "MY TAKEAWAY · ADDED BY THE SHARER, NOT A QUOTE", W / 2, ny - W * .005, W * .003);
      ctx.fillStyle = th.ink; ctx.font = `italic 400 ${W * .03}px ${SANS}`; noteLines.forEach((l, i) => ctx.fillText(l, W / 2, ny + W * .043 + i * W * .042));
    }
    ctx.globalAlpha = 1;
    // brand footer
    if (still) {
      if (story) endCard(ctx, W, H, th, o, 1, H - W * .64, true);
      else {
        const by = H - W * .16;
        mark(ctx, W * .1 + W * .04, by - W * .018, W * .085, th);
        wordmark(ctx, W * .1 + W * .095, by, W * .046, th, "left");
        ctx.textAlign = "left"; ctx.fillStyle = th.sub; ctx.font = `500 ${W * .021}px ${SANS}`;
        ctx.fillText(findLine(), W * .1 + W * .097, by + W * .038);
        const qs = W * .095; qr(ctx, o.url, W * .9 - qs, by - qs * .62, qs, th, .85);
        ctx.textAlign = "center";
      }
    } else if (endP > 0) endCard(ctx, W, H, th, o, endP, H * .28);
    // disclaimer
    ctx.fillStyle = th.sub; ctx.font = `${W * .0175}px ${SANS}`; ctx.globalAlpha = .85; ctx.textAlign = "center";
    ctx.fillText("Quoted from recap · Personal study site · Not an official Church site", W / 2, discY);
    ctx.globalAlpha = 1;
  }
  // centered end card: logo + wordmark + tagline + find line, a "Tap the link" zone for the Instagram link sticker (9:16),
  // and a small, secondary QR code.
  function endCard(ctx, W, H, th, o, p, top, compact) {
    const story = H / W > 1.6, s = .94 + .06 * p, y0 = top + (1 - p) * W * .04;
    ctx.save(); ctx.translate(W / 2, y0); ctx.scale(s, s); ctx.translate(-W / 2, -y0); ctx.textAlign = "center";
    mark(ctx, W / 2, y0, W * .16, th, p, p);
    wordmark(ctx, W / 2, y0 + W * .145, W * .075, th, "center", p);
    ctx.globalAlpha = p; ctx.fillStyle = th.sub; ctx.font = `italic 500 ${W * .032}px ${SERIF}`;
    const tg = compact ? 0 : W * .09;
    if (!compact) { ctx.fillText("The words of October 2026 General Conference,", W / 2, y0 + W * .2); ctx.fillText("to carry you to April.", W / 2, y0 + W * .24); }
    ctx.fillStyle = th.ink; ctx.font = `500 ${W * .026}px ${SANS}`; ctx.fillText(findLine(), W / 2, y0 + W * .21 + tg);
    let y = y0 + W * .255 + tg;
    if (story) {  // subtle zone sized for the Instagram link sticker
      const zw = W * .56, zh = W * .11, zx = W / 2 - zw / 2;
      ctx.save(); ctx.globalAlpha = p * .9; ctx.fillStyle = th === THEMES.dawn ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.09)";
      roundRect(ctx, zx, y, zw, zh, zh / 2); ctx.fill();
      ctx.setLineDash([W * .012, W * .01]); ctx.strokeStyle = th.gold; ctx.globalAlpha = p * .55; ctx.lineWidth = Math.max(1.5, W / 700); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = p; ctx.fillStyle = th.ink; ctx.font = `600 ${W * .03}px ${SANS}`; ctx.fillText("Tap the link  ↗", W / 2, y + zh * .5 + W * .011);
      ctx.restore(); y += zh + W * .05;
    }
    const qs = W * .11; qr(ctx, o.url, W / 2 - qs / 2, y, qs, th, p * .85);
    if (!compact) { ctx.globalAlpha = p * .8; ctx.fillStyle = th.sub; ctx.font = `${W * .018}px ${SANS}`; ctx.fillText("or scan for the talk", W / 2, y + qs + W * .035); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // Open Graph link-preview image (1200x630)
  function drawOG(ctx, W, H, o) {
    const th = THEMES.dusk; sky(ctx, W, H, th, 3, 1, "mountains"); frame(ctx, W, H, th);
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
  window.CardKit = { BGS: { rays: "Light rays", mountains: "Dawn mountains", aurora: "Aurora", plain: "Soft glow" }, FONTS: { classic: "Classic serif", italic: "Italic serif", modern: "Modern sans" }, drawCard, drawOG, THEMES, TL, SIZES: { square: [1080, 1080, "1:1 post"], portrait: [1080, 1350, "4:5 post"], story: [1080, 1920, "9:16 story"] } };
})();
