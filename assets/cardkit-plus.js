// CardKit Plus: more backgrounds, animation effects and studio fonts. Loaded after cardkit.js.
// Every animation repeats exactly every 10 s (integer cycles of the loop phase), so videos loop cleanly.
(function () {
  const K = window.CardKit; if (!K) return;
  const { grad, glow, rgba, hex, rng, TAU, stars, paperBase, vignette, ease, easeIO, c01, SKY, ridges } = K.H;
  const ph = t => (isFinite(t) ? t : 3) / 10;            // 0..1 over the 10 s loop
  const lin = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g; };
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };
  const hills = (c, W, H, base, amp, col, seed, n = 5) => { const r = rng(seed), k = []; for (let i = 0; i < n; i++) k.push([r() * TAU, 1 + Math.floor(r() * 3), r()]);
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += W / 60) { let y = 0; k.forEach(([p, f, a]) => y += Math.sin(x / W * TAU * f * .5 + p) * a); c.lineTo(x, H * base - y * H * amp / n * 2); } c.lineTo(W, H); c.fill(); };
  const pine = (c, x, y, h, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 4; i++) { const yy = y - h * (i * .22), w = h * (.32 - i * .06); c.moveTo(x - w, yy); c.lineTo(x, yy - h * .42); c.lineTo(x + w, yy); } c.fill(); c.fillRect(x - h * .025, y, h * .05, h * .08); };
  const rays = (c, x, y, D, col, a, n, spread, rot) => { c.save(); c.translate(x, y); c.globalCompositeOperation = "lighter"; for (let i = 0; i < n; i++) { const an = Math.PI / 2 + (i - (n - 1) / 2) * spread + rot, w = spread * (.25 + (i % 3) * .1);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, D); g.addColorStop(0, rgba(col, a)); g.addColorStop(.6, rgba(col, a * .25)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, D, an - w, an + w); c.closePath(); c.fill(); } c.restore(); };
  const flower = (c, x, y, r, col, n = 5, rot = 0) => { c.fillStyle = col; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; ell(c, x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .5, r * .3, a); c.fill(); } };
  const leaf = (c, x, y, l, w, rot, col) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * .5, -w, l, 0); c.quadraticCurveTo(l * .5, w, 0, 0); c.fill(); c.restore(); };
  const clouds = (c, W, H, y, col, seed, n, sc, t) => { const r = rng(seed), u = Math.min(W, H); for (let i = 0; i < n; i++) { const x = ((r() * 1.4 - .2) * W + ph(t) * W * .06 * (1 + i % 2)), yy = y * H + (r() - .5) * H * .12, s = u * sc * (.6 + r() * .8);
      for (let j = 0; j < 7; j++) { const px = x + (j - 3) * s * .45, py = yy - Math.sin(j / 6 * Math.PI) * s * .3, rr = s * (.5 + r() * .25), g = c.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, col); g.addColorStop(.55, col.replace(/[\d.]+\)$/, m => (parseFloat(m) * .6) + ")")); g.addColorStop(1, col.replace(/[\d.]+\)$/, "0)")); c.fillStyle = g; c.save(); c.translate(px, py); c.scale(1.6, .7); c.translate(-px, -py); c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill(); c.restore(); } } };
  const water = (c, W, H, y0, top, bot, t, gl) => { c.fillStyle = lin(c, 0, H * y0, 0, H, [[0, top], [1, bot]]); c.fillRect(0, H * y0, W, H * (1 - y0)); const r = rng(5), p = ph(t);
    for (let i = 0; i < 70; i++) { const yy = H * y0 + Math.pow(r(), 1.6) * H * (1 - y0), w = W * (.03 + r() * .12) * (1 + (yy / H - y0) * 2), x = (r() * W + Math.sin(p * TAU + i) * W * .01); c.fillStyle = rgba(gl, .08 + r() * .14); c.fillRect(x - w / 2, yy, w, Math.max(1, H * .002)); } };
  const P = (name, group, dark, paint, extra) => Object.assign({ name, group, dark, paint }, extra || {});

  // ---------- paints ----------
  function grove(c, W, H, Pl, t, o, L, dawn) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, dawn ? ["#f6ecd2", "#cfdcb0", "#6f8e5a", "#2b3d22"] : ["#0e1a12", "#1c3020", "#2c4a2c", "#16241a"]);
    rays(c, W * .22, -H * .05, Math.max(W, H) * 1.3, dawn ? [255, 246, 210] : [246, 228, 170], dawn ? .3 : .2, 7, .09, -.38 + Math.sin(p * TAU) * .02);
    glow(c, W * .25, H * .05, u * .7, [255, 240, 200], dawn ? .45 : .22);
    const r = rng(11); for (let i = 0; i < 16; i++) { const x = r() * W, w = u * (.02 + r() * .05), d = r(); c.fillStyle = dawn ? `rgba(40,52,30,${.35 + d * .5})` : `rgba(8,14,9,${.5 + d * .45})`; c.fillRect(x, 0, w, H); c.fillStyle = `rgba(255,240,200,${.05 + d * .05})`; c.fillRect(x, 0, w * .25, H); }
    for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H * .45; leaf(c, x, y, u * (.02 + r() * .03), u * .01, r() * TAU, dawn ? `rgba(70,100,50,${.25 + r() * .3})` : `rgba(20,40,22,${.4 + r() * .4})`); }
    c.fillStyle = dawn ? "rgba(52,70,34,.7)" : "rgba(6,12,7,.85)"; c.fillRect(0, H * .9, W, H * .1); vignette(c, W, H, "rgba(0,0,0,.35)"); }
  function restoration(c, W, H, Pl, t, o, L) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, ["#121c16", "#22352a", "#2f4733", "#121a12"]);
    rays(c, W * .5, -H * .1, Math.max(W, H) * 1.3, [255, 246, 220], .28, 11, .05, Math.sin(p * TAU) * .015);
    const g = c.createLinearGradient(W * .38, 0, W * .62, 0); g.addColorStop(0, "rgba(255,250,230,0)"); g.addColorStop(.5, `rgba(255,250,230,${.42 + .06 * Math.sin(p * TAU * 2)})`); g.addColorStop(1, "rgba(255,250,230,0)"); c.fillStyle = g; c.fillRect(W * .38, 0, W * .24, H * .75);
    glow(c, W * .5, H * .62, u * .55, [255, 244, 214], .5);
    const r = rng(21); for (let i = 0; i < 18; i++) { let x = r() * W; if (Math.abs(x - W / 2) < W * .16) x += (x < W / 2 ? -1 : 1) * W * .16; const w = u * (.02 + r() * .05); c.fillStyle = `rgba(6,12,8,${.6 + r() * .35})`; c.fillRect(x, 0, w, H); }
    c.fillStyle = "rgba(6,12,7,.8)"; c.fillRect(0, H * .88, W, H * .12); vignette(c, W, H, "rgba(0,0,0,.4)"); }
  function plates(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, ["#1a0f0a", "#2a1810", "#160c08"]); glow(c, W / 2, H * .9, u * .9, [255, 200, 110], .28);
    const cx = W / 2, cy = H * .97, pw = u * .66, phh = u * .4;
    for (let i = 7; i >= 0; i--) { const y = cy - i * u * .011; c.fillStyle = lin(c, cx - pw / 2, 0, cx + pw / 2, 0, [[0, "#7a5520"], [.3, "#e8c56e"], [.55, "#b8862e"], [.8, "#f2d488"], [1, "#6e4a18"]]);
      c.beginPath(); c.moveTo(cx - pw / 2, y); c.lineTo(cx + pw / 2, y); c.lineTo(cx + pw / 2 + u * .05, y - phh * .25); c.lineTo(cx - pw / 2 + u * .05, y - phh * .25); c.closePath(); c.fill(); c.fillStyle = "rgba(60,36,10,.6)"; c.fillRect(cx - pw / 2, y, pw, u * .006); }
    const ty = cy - 8 * u * .011; c.fillStyle = lin(c, 0, ty - phh * .25, 0, ty, [[0, "#f6dc96"], [1, "#c8973c"]]); c.beginPath(); c.moveTo(cx - pw / 2, ty); c.lineTo(cx + pw / 2, ty); c.lineTo(cx + pw / 2 + u * .05, ty - phh * .25); c.lineTo(cx - pw / 2 + u * .05, ty - phh * .25); c.closePath(); c.fill();
    c.strokeStyle = "rgba(110,70,20,.55)"; c.lineWidth = Math.max(1, u / 700); for (let j = 0; j < 4; j++) { c.beginPath(); for (let x = 0; x < pw * .8; x += u * .012) c.lineTo(cx - pw * .38 + x + j * u * .012, ty - phh * (.05 + j * .045) + Math.sin(x * 9 / u + j) * u * .002); c.stroke(); }
    [-.28, 0, .28].forEach(k => { c.strokeStyle = "#d9b25c"; c.lineWidth = u * .008; ell(c, cx + pw * k + u * .025, ty - phh * .12, u * .025, u * .06); c.stroke(); });
    glow(c, cx + u * .1, ty - phh * .2, u * .25, [255, 236, 170], .22 + .08 * Math.sin(p * TAU * 2)); vignette(c, W, H, "rgba(0,0,0,.5)"); }
  function pioneer(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, ["#2a2340", "#6e4a5e", "#c47a5a", "#f0b878", "#f7d9a0"]); glow(c, W * .7, H * .6, u * .7, [255, 220, 160], .5);
    clouds(c, W, H, .2, "rgba(255,210,180,.12)", 4, 5, .12, t);
    hills(c, W, H, .66, .04, "#5a4040", 3); hills(c, W, H, .74, .03, "#3a2a26", 8);
    c.fillStyle = "#2a1e18"; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * .78); c.quadraticCurveTo(W * .5, H * .74, W, H * .8); c.lineTo(W, H); c.fill();
    c.strokeStyle = "rgba(240,190,130,.35)"; c.lineWidth = u * .006; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(W * .5 + s * W * .45, H); c.quadraticCurveTo(W * .5 + s * W * .1, H * .86, W * .62 + s * u * .01, H * .77); c.stroke(); });
    const hx = W * .64, hy = H * .772, s = u * .075; c.fillStyle = "#1a120e"; c.fillRect(hx - s, hy - s * .5, s * 1.4, s * .35); c.strokeStyle = "#1a120e"; c.lineWidth = s * .08;
    [hx - s * .6, hx + s * .2].forEach(x => { c.beginPath(); c.arc(x, hy - s * .1, s * .32, 0, TAU); c.stroke(); }); c.beginPath(); c.moveTo(hx + s * .4, hy - s * .4); c.lineTo(hx + s * 1.1, hy - s * .7); c.stroke();
    c.beginPath(); c.arc(hx + s * 1.25, hy - s * 1.25, s * .16, 0, TAU); c.fill(); c.fillRect(hx + s * 1.13, hy - s * 1.1, s * .24, s * .9);
    const r = rng(9); for (let i = 0; i < 120; i++) { const x = r() * W, y = H * (.8 + r() * .2); c.strokeStyle = `rgba(230,180,110,${.15 + r() * .25})`; c.lineWidth = Math.max(1, u / 900); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(p * TAU + i) * u * .006, y - u * (.02 + r() * .03)); c.stroke(); } }
  function globe(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t), cx = W / 2, cy = H * .55, R = u * .42;
    grad(c, W, H, ["#050a1c", "#0c1838", "#08102a"]); stars(c, W, H, t, 120, 1, 31); glow(c, cx, cy, R * 1.6, Pl.tint, .2);
    c.fillStyle = lin(c, cx - R, cy - R, cx + R, cy + R, [[0, "#1b3a6e"], [1, "#081a3a"]]); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip(); c.strokeStyle = rgba(Pl.tint, .3); c.lineWidth = Math.max(1, u / 800);
    for (let i = -3; i <= 3; i++) { ell(c, cx, cy + i * R * .26, Math.sqrt(1 - Math.pow(i * .26, 2)) * R, R * .06); c.stroke(); }
    for (let i = 0; i < 8; i++) { const a = (i / 8 + p * .125) * Math.PI, rx = Math.abs(Math.cos(a)) * R; ell(c, cx, cy, rx, R); c.stroke(); }
    const r = rng(14); for (let i = 0; i < 46; i++) { const lon = r() * TAU, lat = (r() - .5) * 2.4, x = Math.sin(lon + p * Math.PI * .25 * 2) * Math.cos(lat * .6), z = Math.cos(lon + p * Math.PI * .25 * 2); if (z < 0) continue;
      const px = cx + x * R, py = cy + Math.sin(lat * .6) * R, a = .4 + .6 * Math.abs(Math.sin(p * TAU * 2 + i)); glow(c, px, py, u * .025, [255, 230, 170], .55 * a * z); c.fillStyle = `rgba(255,244,214,${.9 * z})`; c.beginPath(); c.arc(px, py, u * .004, 0, TAU); c.fill(); }
    c.restore(); c.fillStyle = lin(c, cx - R, 0, cx + R, 0, [[0, "rgba(255,255,255,.08)"], [.5, "rgba(0,0,0,0)"], [1, "rgba(0,0,10,.5)"]]); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); }
  function baptism(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, ["#eaf4f8", "#c4e0ea", "#8cc0d2"]); glow(c, W / 2, H * .1, u * .9, [255, 255, 240], .6);
    water(c, W, H, .55, "#7fb6c9", "#2e6f8c", t, [255, 255, 255]);
    c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 5; i++) { const rr = ((i / 5 + p) % 1), a = (1 - rr) * .35; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = Math.max(1, u / 500); ell(c, W / 2, H * .74, u * (.05 + rr * .55), u * (.012 + rr * .12)); c.stroke(); } c.restore();
    rays(c, W / 2, -H * .1, Math.max(W, H) * 1.2, [255, 255, 245], .16, 9, .06, Math.sin(p * TAU) * .02); }
  function sacrament(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, ["#f8f5ef", "#ece6da"]); glow(c, W * .3, H * .1, u, [255, 252, 240], .6);
    const ty = H * .7; c.fillStyle = lin(c, 0, ty, 0, H, [[0, "#ffffff"], [1, "#e4ded2"]]); c.fillRect(0, ty, W, H - ty);
    c.strokeStyle = "rgba(160,150,130,.25)"; c.lineWidth = Math.max(1, u / 900); for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(W * i / 6, ty); c.lineTo(W * i / 6 + (i - 3) * W * .05, H); c.stroke(); }
    const bx = W * .33, by = ty + u * .1; c.fillStyle = "rgba(0,0,0,.08)"; ell(c, bx, by + u * .03, u * .17, u * .04); c.fill(); c.fillStyle = "#d8d6d2"; ell(c, bx, by, u * .17, u * .045); c.fill(); c.fillStyle = "#efeeec"; ell(c, bx, by - u * .006, u * .15, u * .037); c.fill();
    const r = rng(2); for (let i = 0; i < 9; i++) { c.fillStyle = `hsl(36,${45 + r() * 15}%,${70 + r() * 10}%)`; c.fillRect(bx - u * .1 + r() * u * .17, by - u * .03 + r() * u * .03, u * .03, u * .022); }
    const tx = W * .67; c.fillStyle = "#cfcdc9"; ell(c, tx, by, u * .17, u * .045); c.fill();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, cx = tx + Math.cos(a) * u * .1, cy = by - u * .01 + Math.sin(a) * u * .022; c.fillStyle = "rgba(220,235,240,.95)"; c.fillRect(cx - u * .009, cy - u * .028, u * .018, u * .028); c.fillStyle = "rgba(160,200,215,.6)"; c.fillRect(cx - u * .009, cy - u * .012, u * .018, u * .012); }
    glow(c, W / 2, ty - u * .05, u * .4, [255, 250, 230], .3 + .05 * Math.sin(p * TAU)); }
  function keys(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t);
    grad(c, W, H, ["#0b1230", "#162050", "#0a1028"]); glow(c, W / 2, H * .5, u * .8, Pl.tint, .18 + .04 * Math.sin(p * TAU));
    const key = (x, y, s, rot) => { c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = rgba(Pl.tint, .2); c.fillStyle = rgba(Pl.tint, .2); c.lineWidth = s * .05;
      c.beginPath(); c.arc(0, -s * .55, s * .2, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, -s * .55, s * .09, 0, TAU); c.stroke(); c.fillRect(-s * .03, -s * .35, s * .06, s * .85); c.fillRect(s * .03, s * .3, s * .14, s * .05); c.fillRect(s * .03, s * .42, s * .1, s * .05); c.restore(); };
    key(W / 2 - u * .1, H * .55, u * .8, -.5); key(W / 2 + u * .1, H * .55, u * .8, .5);
    c.strokeStyle = rgba(Pl.tint, .12); c.lineWidth = Math.max(1, u / 900); for (let i = 1; i < 6; i++) { c.beginPath(); c.arc(W / 2, H * .5, u * i * .1, 0, TAU); c.stroke(); } vignette(c, W, H, "rgba(0,0,0,.5)"); }
  function roses(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); paperBase(c, W, H, 41, "#fbf3ee", "#f2e2da");
    const rose = (x, y, s) => { for (let i = 5; i >= 0; i--) { c.fillStyle = `hsla(350,${38 + i * 4}%,${86 - i * 4.5}%,.9)`; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + i * .7; ell(c, x + Math.cos(a) * s * i * .07, y + Math.sin(a) * s * i * .07, s * (.2 + i * .05), s * (.14 + i * .03), a); c.fill(); } } };
    const r = rng(17), spots = [[.08, .08], [.92, .1], [.06, .92], [.94, .9], [.2, .02], [.8, .98], [.02, .5], [.98, .52]];
    spots.forEach(([x, y], i) => { for (let j = 0; j < 4; j++) leaf(c, W * x, H * y, u * .12, u * .035, r() * TAU, `rgba(110,150,100,${.5 + r() * .3})`); rose(W * x, H * y, u * (.14 + (i % 3) * .03)); });
    for (let i = 0; i < 18; i++) { const x = r() * W, y = ((r() + p * (1 + i % 2)) % 1) * H; c.fillStyle = "rgba(225,140,150,.35)"; ell(c, x, y, u * .01, u * .006, p * TAU + i); c.fill(); } }
  function familytree(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); paperBase(c, W, H, 51, "#f7efdc", "#eadbbb");
    const r = rng(23), col = "rgba(90,66,40,.75)";
    const br = (x, y, a, l, w, d) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2 + Math.sin(a) * l * .1, (y + y2) / 2, x2, y2); c.stroke();
      if (d === 0) { c.fillStyle = `hsla(${90 + r() * 40},35%,${42 + r() * 15}%,.55)`; c.beginPath(); c.arc(x2, y2, u * .03 * (.7 + r() * .6), 0, TAU); c.fill(); c.strokeStyle = rgba(hex(Pl.dk), .5); c.lineWidth = Math.max(1, u / 600); c.beginPath(); c.arc(x2, y2, u * .014, 0, TAU); c.stroke(); return; }
      br(x2, y2, a - .38 - r() * .1, l * .74, w * .68, d - 1); br(x2, y2, a + .38 + r() * .1, l * .74, w * .68, d - 1); };
    c.save(); c.globalAlpha = .42; br(W / 2, H * .95, -Math.PI / 2, u * .26, u * .03, 6);
    c.strokeStyle = col; for (let i = 0; i < 6; i++) { c.lineWidth = u * .012; c.beginPath(); c.moveTo(W / 2, H * .95); c.quadraticCurveTo(W / 2 + (i - 2.5) * u * .08, H * .98, W / 2 + (i - 2.5) * u * .16, H * 1.02); c.stroke(); } c.restore();
    glow(c, W / 2, H * .3, u * .6, [255, 236, 190], .2 + .05 * Math.sin(p * TAU)); }
  function secondcoming(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t), D = Math.max(W, H);
    grad(c, W, H, ["#1a1a30", "#3b3555", "#7b6a7a", "#d4b48c", "#f4e2bc"]);
    clouds(c, W, H, .12, "rgba(40,36,60,.6)", 2, 8, .16, t); clouds(c, W, H, .32, "rgba(90,76,96,.55)", 6, 7, .14, t);
    glow(c, W / 2, H * .22, u * .55, [255, 248, 220], .75 + .08 * Math.sin(p * TAU)); rays(c, W / 2, H * .22, D * 1.1, [255, 244, 210], .22, 15, .1, Math.sin(p * TAU) * .03);
    clouds(c, W, H, .78, "rgba(50,40,56,.6)", 13, 6, .2, t); hills(c, W, H, .9, .02, "#1c1626", 4); }
  function ocean(c, W, H, Pl, t) { const u = Math.min(W, H); grad(c, W, H, ["#1d2a52", "#5d5f8a", "#e6a184", "#f8d1a0"]); glow(c, W / 2, H * .55, u * .5, [255, 224, 170], .7);
    c.fillStyle = "#ffe6b6"; c.beginPath(); c.arc(W / 2, H * .55, u * .07, Math.PI, 0); c.fill(); water(c, W, H, .55, "#4d5f8a", "#121a38", t, [255, 214, 160]);
    c.fillStyle = "rgba(255,220,160,.35)"; for (let i = 0; i < 30; i++) { const y = H * (.56 + i * .014), w = u * (.14 - i * .003) * (1 + .3 * Math.sin(ph(t) * TAU + i)); c.fillRect(W / 2 - w / 2, y, w, H * .004); } }
  function desert(c, W, H, Pl, t) { grad(c, W, H, ["#2b2a55", "#8a5a7a", "#e88d6a", "#fcd29a"]); glow(c, W * .3, H * .66, Math.min(W, H) * .6, [255, 226, 170], .6);
    hills(c, W, H, .68, .02, "#a0566a", 2, 3); const m = (x, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w * .6, H * .72); c.lineTo(x - w * .4, H * .72 - h); c.lineTo(x + w * .4, H * .72 - h); c.lineTo(x + w * .6, H * .72); c.fill(); };
    m(W * .72, W * .3, H * .14, "#7a3c4c"); m(W * .2, W * .18, H * .08, "#843f50"); hills(c, W, H, .76, .025, "#5a2c3c", 7); hills(c, W, H, .86, .02, "#3a1c2a", 12); }
  function snowpines(c, W, H, Pl, t) { const u = Math.min(W, H); grad(c, W, H, ["#0c1430", "#23315c", "#4c5d8a", "#9aa8c8"]); stars(c, W, H, t, 80, .5, 3); glow(c, W * .78, H * .18, u * .1, [240, 244, 255], .7);
    hills(c, W, H, .78, .03, "#d8e0f0", 5); const r = rng(8); for (let i = 0; i < 22; i++) { const x = r() * W, h = u * (.12 + r() * .2), y = H * (.8 + r() * .14); pine(c, x, y, h, `rgba(14,26,40,${.75 + r() * .25})`); c.fillStyle = "rgba(240,246,255,.5)"; c.fillRect(x - h * .2, y - h * .2, h * .4, h * .015); }
    c.fillStyle = "#e8eef8"; c.fillRect(0, H * .94, W, H * .06); }
  function milkyway(c, W, H, Pl, t) { const u = Math.min(W, H), D = Math.max(W, H); grad(c, W, H, ["#02030c", "#080c22", "#141a3a"]);
    c.save(); c.translate(W / 2, H / 2); c.rotate(-.6); const r = rng(77); for (let i = 0; i < 26; i++) glow(c, (r() - .5) * D, (r() - .5) * u * .2, u * (.1 + r() * .2), i % 3 ? [180, 170, 230] : [250, 220, 190], .14);
    for (let i = 0; i < 900; i++) { const x = (r() - .5) * D * 1.2, y = (r() + r() + r() - 1.5) * u * .16; c.fillStyle = `rgba(255,250,240,${r() * .7})`; c.fillRect(x, y, u * .0018, u * .0018); } c.restore();
    stars(c, W, H, t, 160, 1, 12); hills(c, W, H, .92, .03, "#03040a", 9); }
  function rosegold(c, W, H, Pl, t) { const p = ph(t); c.fillStyle = lin(c, 0, 0, W, H, [[0, "#f7dcd2"], [.5, "#eab8a8"], [1, "#f8e4da"]]); c.fillRect(0, 0, W, H);
    const x = (Math.sin(p * TAU) * .5 + .5) * W; c.fillStyle = lin(c, x - W * .4, 0, x + W * .4, H * .3, [[0, "rgba(255,255,255,0)"], [.5, "rgba(255,255,255,.35)"], [1, "rgba(255,255,255,0)"]]); c.fillRect(0, 0, W, H); }
  function marble(c, W, H) { const u = Math.min(W, H); grad(c, W, H, ["#f6f4f0", "#ebe8e2"]); const r = rng(61);
    for (let i = 0; i < 14; i++) { c.strokeStyle = `rgba(${130 + r() * 40},${125 + r() * 30},${120 + r() * 30},${.12 + r() * .25})`; c.lineWidth = u * (.001 + r() * .004); c.beginPath(); let x = r() * W, y = 0; c.moveTo(x, y);
      while (y < H) { x += (r() - .45) * u * .08; y += u * (.02 + r() * .05); c.lineTo(x, y); } c.stroke(); }
    for (let i = 0; i < 4; i++) { c.strokeStyle = "rgba(196,160,96,.45)"; c.lineWidth = u * .002; c.beginPath(); let x = r() * W, y = 0; c.moveTo(x, y); while (y < H) { x += (r() - .5) * u * .1; y += u * .04; c.lineTo(x, y); } c.stroke(); } }
  function linen(c, W, H) { grad(c, W, H, ["#f4efe6", "#e9e1d3"]); const u = Math.min(W, H), s = Math.max(2, u / 320); for (let y = 0; y < H; y += s) { c.fillStyle = `rgba(150,130,100,${.04 + (y / s % 3) * .015})`; c.fillRect(0, y, W, s * .4); }
    for (let x = 0; x < W; x += s) { c.fillStyle = `rgba(150,130,100,${.03 + (x / s % 2) * .02})`; c.fillRect(x, 0, s * .4, H); } }
  function parchment(c, W, H) { paperBase(c, W, H, 71, "#f1e2bf", "#e2c994"); const u = Math.min(W, H), r = rng(72);
    for (let i = 0; i < 20; i++) glow(c, r() * W, r() * H, u * (.08 + r() * .2), [150, 100, 40], .08); vignette(c, W, H, "rgba(110,70,20,.45)"); }
  function botanical(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); grad(c, W, H, ["#f3f5ee", "#e3ead9"]); const r = rng(81);
    const fern = (x, y, a, l) => { c.strokeStyle = "rgba(70,110,70,.6)"; c.lineWidth = u * .004; c.beginPath(); c.moveTo(x, y); const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineTo(x2, y2); c.stroke();
      for (let i = 1; i < 14; i++) { const k = i / 14, px = x + Math.cos(a) * l * k, py = y + Math.sin(a) * l * k, s = l * .2 * (1 - k * .8); leaf(c, px, py, s, s * .25, a - 1, `rgba(${70 + r() * 30},${120 + r() * 30},80,.55)`); leaf(c, px, py, s, s * .25, a + 1, `rgba(${70 + r() * 30},${120 + r() * 30},80,.55)`); } };
    const sw = Math.sin(p * TAU) * .03; fern(0, H * .1, .5 + sw, u * .6); fern(W, H * .05, Math.PI - .6 - sw, u * .65); fern(0, H, -.7 + sw, u * .6); fern(W, H * .95, Math.PI + .7 - sw, u * .55); }
  function geometric(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); grad(c, W, H, ["#0c0c14", "#16151f", "#0b0b10"]); c.strokeStyle = rgba(Pl.tint, .3); c.lineWidth = Math.max(1, u / 700);
    const s = u * .12; for (let y = -s; y < H + s; y += s) for (let x = -s; x < W + s; x += s) { c.beginPath(); c.moveTo(x, y + s / 2); c.lineTo(x + s / 2, y); c.lineTo(x + s, y + s / 2); c.lineTo(x + s / 2, y + s); c.closePath(); c.stroke(); c.beginPath(); c.arc(x + s / 2, y + s / 2, s * .18, 0, TAU); c.stroke(); }
    glow(c, W / 2, H / 2, u * .7, [0, 0, 0], .0); const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .6); g.addColorStop(0, "rgba(12,12,20,.92)"); g.addColorStop(.6, "rgba(12,12,20,.5)"); g.addColorStop(1, "rgba(12,12,20,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const x = ((p * 2) % 1) * W * 1.6 - W * .3; c.fillStyle = lin(c, x - W * .2, 0, x + W * .2, H * .2, [[0, "rgba(255,230,170,0)"], [.5, "rgba(255,230,170,.08)"], [1, "rgba(255,230,170,0)"]]); c.fillRect(0, 0, W, H); }
  function bokehbg(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); grad(c, W, H, ["#120a1e", "#24143a", "#0e0a1a"]); const r = rng(91); c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 40; i++) { const x = r() * W + Math.sin(p * TAU + i) * u * .02, y = r() * H + Math.cos(p * TAU + i * 2) * u * .015, s = u * (.03 + r() * .1), col = [[255, 210, 150], [255, 170, 190], [190, 170, 255], Pl.tint][i % 4];
      c.fillStyle = rgba(col, .07 + r() * .12); c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); c.strokeStyle = rgba(col, .12); c.lineWidth = s * .05; c.stroke(); } c.restore(); }
  function sunsetclouds(c, W, H, Pl, t) { const u = Math.min(W, H); grad(c, W, H, ["#2b2450", "#7a4870", "#e0786a", "#f9b878", "#fde0a8"]); glow(c, W / 2, H * .82, u * .7, [255, 220, 160], .7);
    clouds(c, W, H, .2, "rgba(255,170,150,.25)", 3, 7, .14, t); clouds(c, W, H, .42, "rgba(255,190,150,.3)", 5, 7, .16, t); clouds(c, W, H, .62, "rgba(120,60,90,.35)", 7, 6, .18, t); hills(c, W, H, .92, .02, "#2a1830", 6); }
  function lake(c, W, H, Pl, t) { const u = Math.min(W, H), pal = { sky: ["#141a3a", "#3a3f6e", "#8a7aa0", "#e9b8a0", "#f6d8b8"], sun: [255, 230, 190] };
    grad(c, W, H, pal.sky.map(x => x)); glow(c, W / 2, H * .55, u * .6, pal.sun, .45); hills(c, W, H, .56, .07, "#4a4570", 4); hills(c, W, H, .6, .05, "#2c2a4c", 10);
    c.save(); c.translate(0, H * 1.2); c.scale(1, -1); c.globalAlpha = .45; hills(c, W, H, .56 + .04, .07, "#4a4570", 4); c.restore();
    water(c, W, H, .6, "rgba(60,60,110,.65)", "#121430", t, [255, 220, 190]); for (let i = 0; i < 8; i++) pine(c, W * (i < 4 ? .02 + i * .05 : .8 + (i - 4) * .05), H * .62, u * (.1 + (i % 3) * .04), "#0e0e20"); }
  function blossoms(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); grad(c, W, H, ["#fdf3f4", "#f8e0e6", "#eef2fa"]); const r = rng(101);
    const branch = (x, y, a, l, w, d) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.strokeStyle = "#5a4044"; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
      for (let i = 0; i < 3; i++) flower(c, x + (x2 - x) * r(), y + (y2 - y) * r() + (r() - .5) * u * .02, u * (.018 + r() * .014), `rgba(${240 + r() * 15},${170 + r() * 40},${190 + r() * 30},.9)`, 5, r() * TAU);
      if (d) { branch(x2, y2, a - .5, l * .7, w * .7, d - 1); branch(x2, y2, a + .4, l * .7, w * .7, d - 1); } };
    branch(-u * .02, H * .08, .35, u * .35, u * .02, 4); branch(W + u * .02, H * .9, Math.PI + .3, u * .3, u * .018, 3);
    for (let i = 0; i < 26; i++) { const x = (r() * W + p * W * (1 + i % 2)) % W, y = ((r() + p * (1 + i % 2)) % 1) * H; c.fillStyle = "rgba(240,170,190,.7)"; ell(c, x, y, u * .008, u * .005, p * TAU * 2 + i); c.fill(); } }
  function autumn(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); grad(c, W, H, ["#2a1408", "#4a2410", "#6a3414", "#2a1408"]); glow(c, W * .7, H * .2, u * .7, [255, 180, 90], .3); const r = rng(111);
    for (let i = 0; i < 70; i++) { const x = r() * W, y = ((r() + p * (1 + i % 2)) % 1) * H * 1.1 - H * .05, s = u * (.03 + r() * .04), hue = 10 + r() * 35; leaf(c, x + Math.sin(p * TAU * 2 + i) * u * .02, y, s, s * .45, r() * TAU + p * TAU * (i % 2 ? 1 : -1), `hsla(${hue},80%,${40 + r() * 15}%,${.5 + r() * .4})`); } }
  function lighthouse(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t), D = Math.max(W, H); grad(c, W, H, ["#070b1e", "#141c40", "#26305a", "#3c4470"]); stars(c, W, H, t, 90, .6, 19);
    const lx = W * .72, ly = H * .5; const a = p * TAU * 2; c.save(); c.translate(lx, ly); c.globalCompositeOperation = "lighter"; [a, a + Math.PI].forEach(b => { const g = c.createRadialGradient(0, 0, 0, 0, 0, D); g.addColorStop(0, "rgba(255,240,190,.5)"); g.addColorStop(1, "rgba(255,240,190,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, D, b - .09, b + .09); c.closePath(); c.fill(); }); c.restore();
    glow(c, lx, ly, u * .12, [255, 240, 190], .9); c.fillStyle = "#0a0e1e"; c.beginPath(); c.moveTo(lx - u * .045, ly + u * .03); c.lineTo(lx - u * .065, H * .78); c.lineTo(lx + u * .065, H * .78); c.lineTo(lx + u * .045, ly + u * .03); c.fill(); c.fillRect(lx - u * .05, ly - u * .04, u * .1, u * .015);
    c.fillStyle = "rgba(255,255,255,.12)"; for (let i = 0; i < 3; i++) c.fillRect(lx - u * .06, ly + u * (.08 + i * .1), u * .12, u * .03);
    hills(c, W, H, .8, .02, "#05070f", 4); water(c, W, H, .84, "#141c3c", "#05070f", t, [255, 230, 180]); }
  function rainbow(c, W, H, Pl, t) { const u = Math.min(W, H), D = Math.max(W, H); grad(c, W, H, ["#8aa6c4", "#c4d4e2", "#eef0f0"]); clouds(c, W, H, .12, "rgba(120,130,150,.35)", 4, 6, .16, t);
    c.save(); c.globalAlpha = .38; ["#e8545a", "#f29b4a", "#f4d35e", "#7cc47a", "#5aa0d8", "#7a6ac8"].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = u * .025; c.beginPath(); c.arc(W / 2, H * 1.05, D * .62 - i * u * .025, Math.PI, 0); c.stroke(); }); c.restore();
    hills(c, W, H, .86, .03, "#6e8a68", 3); hills(c, W, H, .92, .02, "#4e6a4a", 6); glow(c, W * .2, 0, u * .6, [255, 255, 240], .5); }
  function lilies(c, W, H, Pl, t) { const u = Math.min(W, H), p = ph(t); grad(c, W, H, ["#f5f7ee", "#e7eedd"]); glow(c, W / 2, H * .3, u * .8, [255, 252, 230], .6);
    const lily = (x, y, s, rot) => { c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = "rgba(80,120,70,.8)"; c.lineWidth = s * .05; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .2, s * 1.4, 0, s * 3); c.stroke();
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i / 6 * TAU); c.fillStyle = `rgba(255,255,250,.95)`; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .35, -s * .45, 0, -s); c.quadraticCurveTo(-s * .35, -s * .45, 0, 0); c.fill(); c.strokeStyle = "rgba(200,190,150,.4)"; c.lineWidth = s * .015; c.stroke(); c.restore(); }
      c.fillStyle = "#e8b84a"; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .5; c.beginPath(); c.arc(Math.cos(a) * s * .3, Math.sin(a) * s * .3, s * .04, 0, TAU); c.fill(); } c.restore(); };
    const sw = Math.sin(p * TAU) * .03; lily(W * .1, H * .82, u * .1, -.3 + sw); lily(W * .9, H * .8, u * .11, .3 - sw); lily(W * .2, H * .95, u * .08, -.1 + sw); lily(W * .82, H * .96, u * .08, .1 - sw);
    for (let i = 0; i < 10; i++) leaf(c, W * (i < 5 ? .05 + i * .04 : .75 + (i - 5) * .045), H, u * .25, u * .03, -Math.PI / 2 + (i % 5 - 2) * .25, "rgba(90,140,80,.5)"); }
  const solid = (top, bot, glowc) => (c, W, H) => { grad(c, W, H, [top, bot]); if (glowc) glow(c, W / 2, H * .35, Math.min(W, H) * .8, glowc, .25); };
  const light = (c, W, H, Pl, t) => { const u = Math.min(W, H), D = Math.max(W, H), p = ph(t); grad(c, W, H, ["#fffdf6", "#fbf1dc", "#f2dfbd"]); glow(c, W / 2, -H * .05, D * .9, [255, 236, 180], .65); rays(c, W / 2, -H * .08, D * 1.2, [255, 226, 160], .16, 13, .08, Math.sin(p * TAU) * .02); };

  const NEW = {
    restoration: P("Restoration light", "Latter-day Saint themes", 1, restoration, { ov: .12 }),
    grove: P("Sacred Grove", "Latter-day Saint themes", 1, (c, W, H, Pl, t, o, L) => grove(c, W, H, Pl, t, o, L, 0), { ov: .15 }),
    grove_dawn: P("Grove at morning", "Latter-day Saint themes", 0, (c, W, H, Pl, t, o, L) => grove(c, W, H, Pl, t, o, L, 1), { ov: .35 }),
    plates: P("Golden plates", "Latter-day Saint themes", 1, plates, { ov: .1 }),
    pioneer: P("Pioneer trail", "Latter-day Saint themes", 1, pioneer, { ov: .22 }),
    globe: P("Into all the world", "Latter-day Saint themes", 1, globe, { ov: .18 }),
    baptism: P("Waters of baptism", "Latter-day Saint themes", 0, baptism, { ov: .3 }),
    sacrament: P("Sacrament table", "Latter-day Saint themes", 0, sacrament, { ov: .25 }),
    keys: P("Priesthood keys", "Latter-day Saint themes", 1, keys, { ov: .1 }),
    roses: P("Charity never faileth", "Latter-day Saint themes", 0, roses),
    familytree: P("Family tree", "Latter-day Saint themes", 0, familytree, { ov: .3 }),
    secondcoming: P("Light through the clouds", "Latter-day Saint themes", 1, secondcoming, { ov: .2 }),
    lilies: P("Easter lilies", "Latter-day Saint themes", 0, lilies),
    heaven: P("Light from above", "Light", 0, light),
    ocean: P("Ocean at dawn", "Earth & sky", 1, ocean, { ov: .2 }),
    desert: P("Desert sunrise", "Earth & sky", 1, desert, { ov: .2 }),
    snowpines: P("Winter pines", "Earth & sky", 1, snowpines, { ov: .15 }),
    milkyway: P("Milky Way", "Earth & sky", 1, milkyway, { ov: .1 }),
    sunsetclouds: P("Sunset clouds", "Earth & sky", 1, sunsetclouds, { ov: .22 }),
    lake: P("Mountain lake", "Earth & sky", 1, lake, { ov: .18 }),
    lighthouse: P("Lighthouse", "Earth & sky", 1, lighthouse, { ov: .12 }),
    rainbow: P("After the storm", "Earth & sky", 0, rainbow, { ov: .3 }),
    blossoms: P("Spring blossoms", "Earth & sky", 0, blossoms, { ov: .15 }),
    autumn: P("Autumn leaves", "Earth & sky", 1, autumn, { ov: .25 }),
    botanical: P("Botanical ferns", "Textures & patterns", 0, botanical),
    marble: P("Marble", "Textures & patterns", 0, marble),
    linen: P("Linen", "Textures & patterns", 0, linen),
    parchment: P("Parchment", "Textures & patterns", 0, parchment),
    rosegold: P("Rose gold", "Textures & patterns", 0, rosegold),
    geometric: P("Gold geometry", "Textures & patterns", 1, geometric),
    bokeh: P("Bokeh lights", "Textures & patterns", 1, bokehbg),
    navy: P("Deep navy", "Simple", 1, solid("#0e1630", "#060a18", [120, 140, 220])),
    sage_s: P("Soft sage", "Simple", 0, solid("#eef3e8", "#dbe6d0")),
    blush: P("Blush", "Simple", 0, solid("#fbf0ee", "#f2dcd8")),
    charcoal: P("Charcoal", "Simple", 1, solid("#222228", "#121216", [240, 210, 150]))
  };
  // Keep photo looks last: rebuild LOOKS in order (procedural first, then new groups, then photos).
  const L = K.LOOKS, photos = Object.keys(L).filter(k => L[k].photo), keep = {}; photos.forEach(k => { keep[k] = L[k]; delete L[k]; });
  Object.assign(L, NEW, keep);

  // ---------- animation effects ----------
  const A = K.ANIMS, FX = K.FX, none = A.none; delete A.none;
  const field = (n, seed) => { const r = rng(seed), out = []; for (let i = 0; i < n; i++) out.push([r(), r(), r(), r(), 1 + Math.floor(r() * 2)]); return out; };
  const MOTES = field(60, 5), SNOW = field(110, 6), BOKEH = field(18, 7), FLIES = field(32, 8), PETALS = field(30, 9), RIP = field(1, 1);
  const lit = th => th.dark; let INK = null;
  Object.assign(FX, {
    motes: { mid(c, W, H, t, u, th, Pl) { const p = ph(t); c.globalCompositeOperation = lit(th) ? "lighter" : "source-over"; MOTES.forEach(([x0, y0, s, w, k], i) => { const y = H * 1.05 - ((y0 + p * k) % 1) * H * 1.1, x = x0 * W + Math.sin((p * k + w) * TAU) * u * .03, a = .25 + .5 * s;
        glow(c, x, y, u * (.012 + s * .02), lit(th) ? [255, 240, 200] : hex(Pl.dk), a * (lit(th) ? .7 : .35)); }); } },
    snow: { mid(c, W, H, t, u) { const p = ph(t); c.fillStyle = "#fff"; SNOW.forEach(([x0, y0, s, w, k]) => { const y = ((y0 + p * k) % 1) * H * 1.06 - H * .03, x = x0 * W + Math.sin((p * 2 + w) * TAU) * u * .02; c.globalAlpha = .35 + .55 * s; c.beginPath(); c.arc(x, y, u * (.002 + s * .005), 0, TAU); c.fill(); }); } },
    ink: { post(c, W, H, t, u, th) { const f = c01(t / 2.6); if (f >= 1) return; const cv = INK || (INK = document.createElement("canvas")); cv.width = W; cv.height = H; const g = cv.getContext("2d");
        g.fillStyle = th.dark ? "#0b0d18" : "#f7f1e6"; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "destination-out"; const r = rng(4), D = Math.hypot(W, H);
        for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, d = r() * .5, rr = D * .26 * easeIO(c01((f - d * .6) / .6)); if (rr <= 0) continue; for (let j = 0; j < 6; j++) { g.beginPath(); g.arc(x + Math.cos(j * 1.1 + i) * rr * .4, y + Math.sin(j * 1.3 + i) * rr * .4, rr * (.5 + .1 * (j % 3)), 0, TAU); g.fill(); } }
        c.drawImage(cv, 0, 0); } },
    pan: { pre(c, W, H, t) { const p = ph(t); c.translate(W / 2, H / 2); c.scale(1.12, 1.12); c.translate(-W / 2 - Math.sin(p * TAU) * W * .045, -H / 2); } },
    parallax: { pre(c, W, H, t) { const p = ph(t); c.translate(W / 2, H / 2); c.scale(1.08, 1.08); c.translate(-W / 2 + Math.sin(p * TAU) * W * .03, -H / 2 + Math.cos(p * TAU) * H * .012); },
      mid(c, W, H, t, u, th) { const p = ph(t); MOTES.slice(0, 24).forEach(([x0, y0, s]) => { const x = x0 * W - Math.sin(p * TAU) * W * .07 * (1 + s), y = y0 * H - Math.cos(p * TAU) * H * .02; glow(c, x, y, u * (.02 + s * .03), lit(th) ? [255, 236, 200] : [255, 255, 255], .22); }); } },
    pulse: { mid(c, W, H, t, u, th, Pl) { const p = ph(t), a = .5 + .5 * Math.sin(p * TAU * 3 - Math.PI / 2); c.globalCompositeOperation = lit(th) ? "lighter" : "source-over"; glow(c, W / 2, H * .48, Math.max(W, H) * .55, lit(th) ? Pl.tint : [255, 255, 255], .12 + .2 * a); } },
    letters: { text: "letters" },
    float: { text: "float", mid(c, W, H, t, u, th) { const p = ph(t); MOTES.slice(0, 16).forEach(([x0, y0, s, w]) => glow(c, x0 * W, y0 * H + Math.sin((p + w) * TAU) * u * .02, u * (.01 + s * .015), lit(th) ? [255, 240, 210] : [255, 255, 255], .3)); } },
    pageturn: { post(c, W, H, t, u, th) { const f = easeIO(c01((t - .1) / 1.7)); if (f >= 1) return; const x = W * (1 - f) * 1.05, curl = u * .12 * Math.sin(f * Math.PI) + u * .02;
        c.fillStyle = th.dark ? "#141626" : "#faf5ea"; c.beginPath(); c.moveTo(0, 0); c.lineTo(x, 0); c.quadraticCurveTo(x - curl, H / 2, x - curl * .4, H); c.lineTo(0, H); c.fill();
        const g = c.createLinearGradient(x - curl, 0, x + u * .08, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(.6, "rgba(0,0,0,.22)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(x - curl, 0, curl + u * .08, H);
        c.strokeStyle = th.dark ? "rgba(255,255,255,.15)" : "rgba(120,100,70,.25)"; c.lineWidth = Math.max(1, u / 600); c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x - curl, H / 2, x - curl * .4, H); c.stroke(); } },
    bokeh: { mid(c, W, H, t, u, th, Pl) { const p = ph(t); c.globalCompositeOperation = lit(th) ? "lighter" : "source-over"; BOKEH.forEach(([x0, y0, s, w, k], i) => { const x = (x0 + Math.sin((p * k + w) * TAU) * .04) * W, y = (y0 + Math.cos((p + w) * TAU) * .03) * H, a = .5 + .5 * Math.sin((p * k * 2 + w) * TAU);
        c.fillStyle = rgba(i % 2 ? Pl.tint : [255, 236, 210], (lit(th) ? .09 : .16) * (.4 + a)); c.beginPath(); c.arc(x, y, u * (.04 + s * .08), 0, TAU); c.fill(); }); } },
    fireflies: { mid(c, W, H, t, u, th) { const p = ph(t); c.globalCompositeOperation = lit(th) ? "lighter" : "source-over"; FLIES.forEach(([x0, y0, s, w, k]) => { const x = (x0 + .06 * Math.sin((p * k + w) * TAU)) * W, y = (.3 + y0 * .7 + .05 * Math.sin((p * (3 - k) + s) * TAU)) * H, b = Math.max(0, Math.sin((p * (2 + k) + w) * TAU));
        glow(c, x, y, u * .03, [255, 230, 120], .6 * b); c.fillStyle = `rgba(255,250,200,${b})`; c.beginPath(); c.arc(x, y, u * .003, 0, TAU); c.fill(); }); } },
    petals: { mid(c, W, H, t, u) { const p = ph(t); PETALS.forEach(([x0, y0, s, w, k]) => { const y = ((y0 + p * k) % 1) * H * 1.1 - H * .05, x = ((x0 + p * .2 * k + Math.sin((p * 2 + w) * TAU) * .02) % 1) * W; c.fillStyle = `rgba(242,${160 + s * 40},${180 + s * 20},${.55 + s * .35})`; ell(c, x, y, u * (.008 + s * .006), u * (.005 + s * .003), (p * k * 2 + w) * TAU); c.fill(); }); } },
    heaven: { mid(c, W, H, t, u, th) { const p = ph(t), D = Math.max(W, H); glow(c, W / 2, -H * .05, D * .6, [255, 246, 220], .25 + .1 * Math.sin(p * TAU * 2)); rays(c, W / 2, -H * .1, D * 1.2, [255, 244, 214], lit(th) ? .1 : .14, 9, .07, Math.sin(p * TAU) * .04); } },
    ripple: { mid(c, W, H, t, u, th) { const p = ph(t); c.globalCompositeOperation = lit(th) ? "lighter" : "source-over"; for (let i = 0; i < 4; i++) { const r = (i / 4 + p * 2) % 1; c.strokeStyle = lit(th) ? `rgba(255,240,210,${.25 * (1 - r)})` : `rgba(255,255,255,${.5 * (1 - r)})`; c.lineWidth = Math.max(1, u / 500); ell(c, W / 2, H * .5, u * (.05 + r * .9), u * (.05 + r * .9) * .35); c.stroke(); } } }
  });
  Object.assign(A, { motes: "Light motes", snow: "Gentle snow", ink: "Ink reveal", pan: "Slow pan", parallax: "Parallax", pulse: "Glow pulse", letters: "Letter float", float: "Float up", pageturn: "Page turn",
    bokeh: "Bokeh", fireflies: "Fireflies", petals: "Falling petals", heaven: "Light from above", ripple: "Water ripples", none });

  // ---------- fonts (SIL Open Font License, self-hosted in assets/fonts/g/) ----------
  const NF = {
    playfair: ["Playfair Display", "Playfair", 500, 1, ""], playfair_i: ["Playfair Display", "Playfair italic", 500, 1, "italic "], lora: ["Lora", "Lora", 500, .92, ""], lora_i: ["Lora", "Lora italic", 500, .92, "italic "],
    garamond: ["EB Garamond", "EB Garamond", 500, 1.02, ""], baskerville: ["Libre Baskerville", "Baskerville", 400, .82, ""], cinzel: ["Cinzel", "Cinzel caps", 500, .82, ""], dmserif: ["DM Serif Display", "DM Serif", 400, .96, ""],
    merriweather: ["Merriweather", "Merriweather", 400, .8, ""], abril: ["Abril Fatface", "Abril", 400, .9, ""], montserrat: ["Montserrat", "Montserrat", 500, .8, ""], raleway: ["Raleway", "Raleway", 500, .84, ""],
    josefin: ["Josefin Sans", "Josefin", 400, .9, ""], poppins: ["Poppins", "Poppins", 400, .8, ""], greatvibes: ["Great Vibes", "Great Vibes script", 400, 1.42, ""], dancing: ["Dancing Script", "Dancing script", 500, 1.08, ""]
  };
  Object.entries(NF).forEach(([k, [fam, label, w, sc, it]]) => { K.FONTS[k] = label; K.FONTF[k] = f => `${it}${w} ${f * sc}px "${fam}", Georgia, serif`; });
  let cssDone = false;
  K.fontReady = o => { const d = NF[o && o.font]; if (!d || typeof document === "undefined" || !document.fonts) return Promise.resolve();
    if (!cssDone) { cssDone = true; if (!document.querySelector('link[data-studio-fonts]')) { const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.studioFonts = "1";
      const s = [...document.scripts].find(x => /cardkit-plus\.js/.test(x.src)); l.href = s ? s.src.replace(/cardkit-plus\.js.*$/, "fonts/studio-fonts.css") : "assets/fonts/studio-fonts.css"; document.head.appendChild(l); } }
    const spec = `${d[4]}${d[2]} 40px "${d[0]}"`; return Promise.race([document.fonts.load(spec, "Aa“”"), new Promise(r => setTimeout(r, 4000))]).catch(() => {}); };
  K.STUDIO_FONTS = NF;
})();
(function () { const K = window.CardKit; if (!K || !K.fontReady) return; const prep = K.prepare; K.prepare = o => Promise.all([prep(o), K.fontReady(o)]); })();
