// ClipKit (prototype): quote video clips. Clips are pre-cut on the build machine (tools/build_clips.py) from the
// official talk video, with per-word timings from speech-to-text. In the browser we only composite:
// video frame + quote text (words light up as they're spoken) + brand, mixed with optional background music
// that ducks under the speech. Export = canvas.captureStream + WebAudio stream -> MediaRecorder (real time).
(function () {
  const K = window.CardKit, SERIF = '"Cormorant Garamond", Georgia, serif', SANS = "Inter, system-ui, sans-serif";
  const ASPECTS = { story: [1080, 1920, "9:16 vertical"], square: [1080, 1080, "1:1 square"], post: [1080, 1350, "4:5 post"], wide: [1920, 1080, "16:9 wide"] };
  // Background music (assets/music). Sources and licenses: LICENSES-music.md. attr = CC BY, so the credit is burned into the clip and added to the share text.
  const MUSIC = [
 {
  "id": "none",
  "name": "No music"
 },
 {
  "id": "meditation-impromptu",
  "name": "Meditation Impromptu",
  "mood": "Calm · solo piano",
  "file": "assets/music/meditation-impromptu.m4a",
  "lic": "“Meditation Impromptu 02” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Meditation Impromptu 02” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "dreamy-flashback",
  "name": "Dreamy Flashback",
  "mood": "Reflective · piano and strings",
  "file": "assets/music/dreamy-flashback.m4a",
  "lic": "“Dreamy Flashback” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Dreamy Flashback” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamy%20Flashback.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "touching-moments",
  "name": "Touching Moments",
  "mood": "Tender · piano, strings",
  "file": "assets/music/touching-moments.m4a",
  "lic": "“Touching Moments Two - Higher” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Touching Moments Two - Higher” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Touching%20Moments%20Two%20-%20Higher.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "lasting-hope",
  "name": "Lasting Hope",
  "mood": "Uplifting · cinematic",
  "file": "assets/music/lasting-hope.m4a",
  "lic": "“Lasting Hope” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Lasting Hope” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lasting%20Hope.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "heartwarming",
  "name": "Heartwarming",
  "mood": "Warm · gentle orchestral",
  "file": "assets/music/heartwarming.m4a",
  "lic": "“Heartwarming” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Heartwarming” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "long-note",
  "name": "Long Note",
  "mood": "Ambient · soft pads",
  "file": "assets/music/long-note.m4a",
  "lic": "“Long Note Two” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Long Note Two” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Two.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "amazing-grace-strings",
  "name": "Amazing Grace",
  "mood": "Hymn · string ensemble",
  "file": "assets/music/amazing-grace-strings.m4a",
  "lic": "U.S. Air Force Band Strolling Strings, arr. Cleveland Chandler · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band Strolling Strings, arr. Cleveland Chandler · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "attr": false
 },
 {
  "id": "nearer-my-god",
  "name": "Nearer, My God, to Thee",
  "mood": "Hymn · concert band",
  "file": "assets/music/nearer-my-god.m4a",
  "lic": "U.S. Air Force Band · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Nearer_My_God_to_Thee_-_Concert_Band_-_United_States_Air_Force_Band.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Nearer_My_God_to_Thee_-_Concert_Band_-_United_States_Air_Force_Band.mp3",
  "attr": false
 },
 {
  "id": "eternal-father",
  "name": "Eternal Father, Strong to Save",
  "mood": "Hymn · reverent",
  "file": "assets/music/eternal-father.m4a",
  "lic": "“The President’s Own” U.S. Marine Band · Public domain (U.S. government work)",
  "credit": "“The President’s Own” U.S. Marine Band · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Eternal_Father,_Strong_to_Save_-_U.S._Marine_Band.ogg",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Eternal_Father,_Strong_to_Save_-_U.S._Marine_Band.ogg",
  "attr": false
 },
 {
  "id": "canon-strings",
  "name": "Canon in D",
  "mood": "Peaceful · strings (Pachelbel)",
  "file": "assets/music/canon-strings.m4a",
  "lic": "U.S. Air Force Band Strolling Strings, arr. Frank Hudson · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band Strolling Strings, arr. Frank Hudson · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Canon_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Canon_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "attr": false
 },
 {
  "id": "ode-to-joy-band",
  "name": "Joyful, Joyful (Ode to Joy)",
  "mood": "Joyful · concert band",
  "file": "assets/music/ode-to-joy-band.m4a",
  "lic": "U.S. Air Force Band of the Rockies · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band of the Rockies · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Ode_to_Joy_-_Concert_Band_-_United_States_Air_Force_Band_of_the_Rockies.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Ode_to_Joy_-_Concert_Band_-_United_States_Air_Force_Band_of_the_Rockies.mp3",
  "attr": false
 },
 {
  "id": "morning-light",
  "name": "Morning Light (synth)",
  "mood": "Calm · ambient (original)",
  "file": "assets/music/morning-light.m4a",
  "lic": "Original, Six Months of Light · CC0",
  "credit": "Original, Six Months of Light · CC0",
  "src": "",
  "license": "CC0",
  "lurl": "https://creativecommons.org/publicdomain/zero/1.0/",
  "attr": false
 },
 {
  "id": "chorale-of-faith",
  "name": "Chorale of Faith (synth)",
  "mood": "Reverent · hymn-style (original)",
  "file": "assets/music/chorale-of-faith.m4a",
  "lic": "Original, Six Months of Light · CC0",
  "credit": "Original, Six Months of Light · CC0",
  "src": "",
  "license": "CC0",
  "lurl": "https://creativecommons.org/publicdomain/zero/1.0/",
  "attr": false
 }
];
  const base = () => window.CARDKIT_BASE || "";
  const get = (t, q) => (window.CLIPS || {})[t + ":" + q] || null;
  // ---- any-text clips: word timings per talk (assets/timings/<id>.json) + self-hosted talk video ----
  // MEDIA_BASE must be same-origin or send CORS headers (the Church CDN doesn't, and a tainted canvas can't be recorded).
  const MEDIA_BASE = () => window.CLIP_MEDIA_BASE || base() + "media/";
  const TIM = {};
  const timings = id => TIM[id] || (TIM[id] = fetch(base() + "assets/timings/" + id + ".json").then(r => { if (!r.ok) throw new Error("no timings"); return r.json(); }));
  const norm = w => String(w).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]/g, "");
  // Local alignment (Smith-Waterman) of the selected words against the transcript; returns best span.
  // Contractions are expanded on both sides ("you've" = "you have"), so speech-to-text spelling doesn't break a match.
  const EXP = { ve: "have", re: "are", ll: "will", m: "am", d: "would" };
  const toks = w => { const s = String(w).toLowerCase().replace(/’/g, "'"); let m;
    if ((m = /^(.*)n't$/.exec(s))) return [norm(m[1] === "won" ? "will" : m[1] === "can" ? "can" : m[1]), "not"];
    if ((m = /^(.*)'(ve|re|ll|m|d)$/.exec(s))) return [norm(m[1]), EXP[m[2]]];
    const n = norm(s); return n ? [n] : []; };
  // Local alignment (Smith-Waterman) of the selected words against the transcript; returns the best span (word indexes).
  function align(words, text) { const q = text.split(/\s+/).flatMap(toks), t = [], ti = [];
    words.forEach((w, k) => toks(w[0]).forEach(x => { t.push(x); ti.push(k); }));
    const n = q.length, m = t.length; if (!n) return null; const MA = 2, MI = -.6, GA = -.7;
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1), sp = new Int32Array(m + 1), sc = new Int32Array(m + 1), qp = new Int32Array(m + 1), qc = new Int32Array(m + 1), best = 0, bj = 0, bs = 0, bi = 0, bq = 1;
    for (let i = 1; i <= n; i++) { cur[0] = 0; sc[0] = 1; qc[0] = i;
      for (let j = 1; j <= m; j++) { const d = prev[j - 1] + (q[i - 1] === t[j - 1] ? MA : MI), up = prev[j] + GA, lf = cur[j - 1] + GA; let v = 0, st = j, sq = i;
        if (d >= up && d >= lf && d > 0) { v = d; if (prev[j - 1] > 0) { st = sp[j - 1]; sq = qp[j - 1]; } } else if (up >= lf && up > 0) { v = up; st = sp[j]; sq = qp[j]; } else if (lf > 0) { v = lf; st = sc[j - 1]; sq = qc[j - 1]; }
        cur[j] = v; sc[j] = st; qc[j] = sq; if (v > best) { best = v; bj = j; bs = st; bi = i; bq = sq; } }
      [prev, cur] = [cur, prev]; [sp, sc] = [sc, sp]; [qp, qc] = [qc, qp]; }
    if (best <= 0) return null;
    // If the last few selected words weren't recognized, extend to cover them (never past 3 words).
    const p3 = x => x.slice(0, 3), restE = q.slice(bi).map(p3), restS = q.slice(0, bq - 1).map(p3);
    let j1 = bj - 1; for (let k = 0; k < Math.min(3, restE.length) && j1 + 1 < m; k++) { if (restE.includes(p3(t[j1 + 1]))) j1++; else if (j1 + 2 < m && restE.includes(p3(t[j1 + 2]))) j1 += 2; else break; }
    let j0 = bs - 1; for (let k = 0; k < Math.min(3, restS.length) && j0 > 0; k++) { if (restS.includes(p3(t[j0 - 1]))) j0--; else if (j0 > 1 && restS.includes(p3(t[j0 - 2]))) j0 -= 2; else break; }
    return { i0: ti[j0], i1: ti[j1], score: best / (MA * n) }; }
  const MAX_DUR = 60, LEAD = .2, TAIL = .3, FADE = .3;
  // Fades (seconds). Video fades are visual (from/to dark); the speech itself is never faded inside the quote.
  // A fade-out longer than the natural tail holds the last frame, so the last word isn't cut short.
  const FADES = { off: 0, short: .5, medium: 1, long: 2 };
  function applyFades(c, f = {}) { const n = x => x == null ? null : +x; c.fin = n(f.fin) ?? 0; c.fout = n(f.fout) ?? FADE; c.mfin = n(f.mfin) ?? .5; c.mfout = n(f.mfout) ?? .6;
    c.dur = +(c.vEnd + Math.max(0, Math.max(c.fout, c.mfout) - TAIL)).toFixed(2); c.fade = c.fout; return c; }
  function cut(T, i0, i1, id) { const w = T.words.slice(i0, i1 + 1), s0 = w[0][1], e0 = w[w.length - 1][2]; if (e0 - s0 > MAX_DUR) throw new Error("That passage is over 60 seconds. Pick a shorter part.");
    // Start just before the first word (never inside the previous word); end at the last word's end plus a short
    // tail, cut before the next word begins. Word ends are snapped to silence by tools/refine_timings.py.
    const prev = T.words[i0 - 1], next = T.words[i1 + 1];
    const at0 = Math.max(0, prev ? Math.max(prev[2] + .02, s0 - LEAD) : s0 - LEAD);
    const end = Math.max(w[w.length - 1][1] + .15, Math.min(e0 + TAIL, next ? next[1] - .06 : e0 + TAIL));
    return { talk: id, src: MEDIA_BASE() + id + ".mp4", at0, vEnd: +(end - at0).toFixed(2), dur: +(end - at0).toFixed(2), fade: FADE, i0, i1, last: w[w.length - 1][0], nextWord: next && next[0], speech: [s0 - at0, e0 - at0],
      words: w.map(x => ({ w: x[0], s: x[1] - at0, e: x[2] - at0 })) }; }
  async function clipFor(id, text, fades) { const T = await timings(id), a = align(T.words, text); if (!a || a.score < .55) throw new Error("Couldn't find that passage in the talk audio. Try a shorter selection.");
    return applyFades(Object.assign(cut(T, a.i0, a.i1, id), { score: a.score, text }), fades); }
  // Printed-text span (from ClipMatch) -> clip. Printed words keep their own timings via the printed->spoken map.
  async function clipForSpan(m, p0, p1, fades) { const T = await timings(m.talk), map = m.map, i0 = map[p0], i1 = Math.max(i0, map[p1]);
    const c = cut(T, i0, i1, m.talk), pw = m.words.slice(p0, p1 + 1); c.text = pw.join(" "); c.p0 = p0; c.p1 = p1; c.score = m.score;
    c.timed = pw.map((t, k) => { const w = T.words[Math.min(i1, Math.max(i0, map[p0 + k]))]; return { t, s: w[1] - c.at0, e: w[2] - c.at0 }; });
    return applyFades(c, fades); }
  const TH = { ink: "#fffaf0", sub: "rgba(255,246,228,.82)", gold: "#f1d394", gold2: "#d8a95b", dark: 1 };
  function wrapWords(ctx, words, maxW) { const lines = []; let cur = [], w = 0, sp = ctx.measureText(" ").width;
    words.forEach((x, i) => { const ww = ctx.measureText(x.t).width; if (cur.length && w + sp + ww > maxW) { lines.push(cur); cur = []; w = 0; } cur.push({ ...x, i, ww }); w += (cur.length > 1 ? sp : 0) + ww; }); if (cur.length) lines.push(cur); return lines; }
  // Quote words (official text) mapped onto spoken word timings by position.
  function timedQuote(clip, quote) { if (clip.timed && (!quote || quote === clip.text)) return clip.timed; const qw = quote.split(/\s+/).filter(Boolean), sw = clip.words, n = qw.length, m = sw.length;
    return qw.map((t, i) => { const j = Math.min(m - 1, Math.floor(i * m / n)); return { t, s: sw[j].s, e: sw[j].e }; }); }
  function draw(ctx, W, H, o, time, video) { drawInner(ctx, W, H, o, time, video); const D = o.dur, F = o.fout ?? o.fade ?? .3, I = o.fin || 0; let a = 0;
    if (D && isFinite(time) && F > 0 && time > D - F) a = Math.min(1, (time - (D - F)) / F);
    if (D && isFinite(time) && I > 0 && time < I) a = Math.max(a, 1 - Math.max(0, time) / I);
    if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#0d1326"; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  function drawInner(ctx, W, H, o, time, video) {
    const u = Math.min(W, H); ctx.save(); ctx.fillStyle = "#0d1326"; ctx.fillRect(0, 0, W, H);
    const vw0 = video && (video.videoWidth || video.displayWidth); if (vw0) { const vw = vw0, vh = video.videoHeight || video.displayHeight, story = H > W * 1.3;
      // vertical: video sits in the upper part, cover-cropped around the speaker; others: full-bleed cover
      const bh = story ? H * .56 : H, s = Math.max(W / vw, bh / vh), dw = vw * s, dh = vh * s;
      const vb = o.vbg || "full"; ctx.save(); if (vb !== "full") ctx.globalAlpha = o.vop ?? .6;
      if (vb === "blur") ctx.filter = `blur(${Math.round(u * .015)}px)`; else if (vb === "duotone") ctx.filter = "grayscale(1) contrast(1.15)"; else if (vb === "dim") ctx.filter = "brightness(.55)";
      ctx.drawImage(video, (W - dw) / 2, story ? H * .07 : (H - dh) / 2, dw, dh); ctx.filter = "none";
      if (vb === "duotone") { ctx.globalAlpha = 1; ctx.globalCompositeOperation = "color"; ctx.fillStyle = "#d8a95b"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; } ctx.restore();
      if (story) { const g = ctx.createLinearGradient(0, H * .07, 0, H * .63); g.addColorStop(0, "rgba(13,19,38,.0)"); g.addColorStop(.75, "rgba(13,19,38,.35)"); g.addColorStop(1, "rgba(13,19,38,1)"); ctx.fillStyle = g; ctx.fillRect(0, H * .07, W, H * .56);
        const g2 = ctx.createLinearGradient(0, 0, 0, H * .12); g2.addColorStop(0, "rgba(13,19,38,1)"); g2.addColorStop(1, "rgba(13,19,38,0)"); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * .12); } }
    const story = H > W * 1.3, wide = W > H * 1.3;
    if (!story) { const g = ctx.createLinearGradient(0, H * (wide ? .3 : .25), 0, H); g.addColorStop(0, "rgba(13,19,38,0)"); g.addColorStop(.55, "rgba(13,19,38,.78)"); g.addColorStop(1, "rgba(13,19,38,.95)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // quote, words light up as spoken
    const words = o.timed, cw = wide ? W * .78 : W - u * .16, top = story ? H * .6 : H * (wide ? .52 : .46), avail = (story ? H * .78 : H * .82) - top;
    let fs = u * (story ? .062 : wide ? .052 : .056), lines; for (let k = 0; k < 30; k++) { ctx.font = `500 ${fs}px ${SERIF}`; lines = wrapWords(ctx, words, cw); if (lines.length * fs * 1.18 <= avail) break; fs *= .94; }
    let y = top + Math.max(0, (avail - lines.length * fs * 1.18) / 2) + fs; ctx.textBaseline = "alphabetic"; ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = u * .012;
    const sp = ctx.measureText(" ").width;
    lines.forEach(L => { const lw = L.reduce((a, x) => a + x.ww, 0) + sp * (L.length - 1); let x = (W - lw) / 2;
      L.forEach(w => { const on = time >= w.s - .05, p = Math.max(0, Math.min(1, (time - w.s + .05) / .25));
        ctx.globalAlpha = o.captions ? (on ? .45 + .55 * p : .4) : 1; ctx.fillStyle = on && o.captions && p < 1 ? TH.gold : TH.ink; ctx.textAlign = "left"; ctx.fillText(w.t, x, y); x += w.ww + sp; }); y += fs * 1.18; });
    ctx.globalAlpha = 1; ctx.shadowBlur = u * .008;
    ctx.fillStyle = TH.gold; ctx.font = `600 ${u * .022}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText(String(o.speaker).toUpperCase().split("").join(String.fromCharCode(8202)), W / 2, y + u * .03);
    ctx.fillStyle = TH.sub; ctx.font = `italic 500 ${u * .032}px ${SERIF}`; ctx.fillText(o.title, W / 2, y + u * .075);
    // brand
    const by = H - u * (story ? .1 : .06); if (K && K.wordmark) { K.wordmark(ctx, W / 2, by, u * .036, TH, "center"); }
    ctx.fillStyle = TH.ink; ctx.font = `600 ${u * .022}px ${SANS}`; ctx.fillText((window.CONF && CONF.domain) || "sixmonthsoflight.com", W / 2, by + u * .035);
    ctx.globalAlpha = .75; ctx.fillStyle = TH.sub; ctx.font = `${u * .015}px ${SANS}`; ctx.fillText("Video and text from ChurchofJesusChrist.org · Personal study site · Not an official Church site", W / 2, H - u * (o.musicCredit ? .042 : .018));
    if (o.musicCredit) ctx.fillText("Music: " + o.musicCredit, W / 2, H - u * .018);
    ctx.restore();
  }
  function duckOn(g, clip, vol, t0) { const low = vol * .2, D = clip.dur, F = clip.mfout ?? clip.fade ?? .3, MI = clip.mfin ?? .5; g.cancelScheduledValues(t0); g.setValueAtTime(0, t0);
      const ws = clip.words || [], s0 = ws.length ? ws[0].s : clip.speech[0], e0 = ws.length ? ws[ws.length - 1].e : clip.speech[1];
      g.linearRampToValueAtTime(Math.min(vol, low * 2), t0 + Math.max(.05, MI ? Math.min(MI, Math.max(.05, s0 - .05)) : .02)); g.linearRampToValueAtTime(low, t0 + Math.max(.1, s0));
      for (let i = 1; i < ws.length; i++) { const gap = ws[i].s - ws[i - 1].e; if (gap > .7) { const a = t0 + ws[i - 1].e; g.setValueAtTime(low, a); g.linearRampToValueAtTime(vol * .45, a + Math.min(.4, gap / 2)); g.linearRampToValueAtTime(low, t0 + ws[i].s - .05); } }
      const tail = Math.max(e0 + .05, D - Math.max(F, .05)); g.setValueAtTime(low, t0 + Math.min(e0, tail)); g.linearRampToValueAtTime(vol * .5, t0 + tail); g.linearRampToValueAtTime(0, t0 + D); }
  // Player: one <video>, one AudioContext. Music gain ducks while the speaker talks.
  function player(clip) {
    const v = document.createElement("video"); const at0 = clip.at0 || 0, SRC = /^(https?:)?\/\//.test(clip.src) || clip.src.startsWith(base() + "media/") ? clip.src : base() + clip.src;
    // crossOrigin must be set before src. The media fragment (#t=) makes iOS Safari fetch the frame at the quote
    // (it ignores preload=auto and won't load data until asked), and is a fallback if a seek is dropped.
    v.crossOrigin = "anonymous"; v.playsInline = true; v.setAttribute("playsinline", ""); v.muted = false; v.preload = "auto"; v.src = SRC + "#t=" + at0.toFixed(2); try { v.load(); } catch (e) {}
    const once = (ev, ms) => new Promise(r => { let done = false; const f = () => { if (!done) { done = true; v.removeEventListener(ev, f); r(true); } }; v.addEventListener(ev, f); if (ms) setTimeout(() => { if (!done) { done = true; v.removeEventListener(ev, f); r(false); } }, ms); });
    const meta = async () => { if (v.readyState >= 1) return; if (v.networkState !== 2) { try { v.load(); } catch (e) {} } await once("loadedmetadata", 15000); };
    // Seek and confirm. iOS Safari silently drops a currentTime set before metadata, or resets it on play(); retry, then reload with #t=.
    async function seekTo(t) { await meta(); for (let k = 0; k < 4; k++) { if (Math.abs(v.currentTime - t) < .25 && !v.seeking) return true;
        const p = once("seeked", 8000); try { v.currentTime = t; } catch (e) {} await p; if (Math.abs(v.currentTime - t) < .25) return true;
        if (k === 1) { v.src = SRC + "#t=" + t.toFixed(2); v.load(); await meta(); } }
      return Math.abs(v.currentTime - t) < .5; }
    let ac, dest, vNode, vGain, mGain, mSrc, buf = {}, music = "none", vol = .35;
    const audio = () => { if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)(); dest = ac.createMediaStreamDestination();
      vNode = ac.createMediaElementSource(v); vGain = ac.createGain(); vNode.connect(vGain); vGain.connect(ac.destination); vGain.connect(dest); mGain = ac.createGain(); mGain.connect(ac.destination); mGain.connect(dest); };
    async function loadMusic(id) { const m = MUSIC.find(x => x.id === id); if (!m || !m.file) return null; if (!buf[id]) { const r = await fetch(base() + m.file); buf[id] = await ac.decodeAudioData(await r.arrayBuffer()); } return buf[id]; }
    // Music: fade in, duck under speech (lifts a little in pauses > .7 s), swell slightly after the last word, fade out.
    const duck = t0 => duckOn(mGain.gain, clip, vol, t0);
    async function start() { audio(); await ac.resume(); if (mSrc) { try { mSrc.stop(); } catch (e) {} mSrc = null; }
      const b = await loadMusic(music); const F = clip.fade || .3; if (!(await seekTo(at0))) throw new Error("Couldn't jump to that moment in the talk video. Check your connection and try again."); const playT = () => Promise.race([v.play(), new Promise((_, j) => setTimeout(() => j(new Error("The talk video didn't start. Tap Play again.")), 15000))]);
      await playT();
      // iOS can restart from 0 or the fragment start when play() begins; one guarded re-seek fixes it.
      if (Math.abs(v.currentTime - at0) > 1.5) { v.pause(); await seekTo(at0); await playT(); }
      if (Math.abs(v.currentTime - at0) > 1.5) { v.pause(); throw new Error("Couldn't jump to that moment in the talk video. Check your connection and try again."); } const t0 = ac.currentTime; T0 = performance.now() - (v.currentTime - at0) * 1000; const VE = clip.vEnd ?? clip.dur, vg = vGain.gain; vg.cancelScheduledValues(t0); vg.setValueAtTime(0, t0); vg.linearRampToValueAtTime(1, t0 + .08); vg.setValueAtTime(1, t0 + Math.max(.1, VE - .3)); vg.linearRampToValueAtTime(0, t0 + VE);
      clearInterval(stopIv); stopIv = setInterval(() => { if (v.currentTime - at0 >= VE) { v.pause(); clearInterval(stopIv); } }, 15);
      if (b) { mSrc = ac.createBufferSource(); mSrc.buffer = b; mSrc.loop = true; mSrc.connect(mGain); mSrc.start(t0); duck(t0); } }
    let stopIv, T0 = null; function stop() { T0 = null; clearInterval(stopIv); v.pause(); if (mSrc) { try { mSrc.stop(); } catch (e) {} mSrc = null; } }
    return { v, start, stop, set music(x) { music = x; }, get music() { return music; }, set vol(x) { vol = x; }, stream: () => (audio(), dest.stream), t: () => T0 == null ? v.currentTime - at0 : (performance.now() - T0) / 1000, at0, ended: () => T0 == null || (performance.now() - T0) / 1000 >= clip.dur, ready: () => v.readyState >= 2 ? Promise.resolve() : (meta(), once("loadeddata")), seekTo };
  }
  const recType = () => ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1,opus", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  // Real-time export: plays the clip once while recording the canvas + mixed audio.
  async function record(cv, pl, clip, onP = () => {}) {
    const type = recType(); if (!type) throw new Error("This browser can't record video.");
    const st = cv.captureStream(30); pl.stream().getAudioTracks().forEach(t => st.addTrack(t));
    const rec = new MediaRecorder(st, { mimeType: type, videoBitsPerSecond: 6e6, audioBitsPerSecond: 128e3 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r); await pl.start(); if (Math.abs(pl.t()) > 1.5) { pl.stop(); throw new Error("The talk video started at the wrong spot. Please tap Make video again."); } rec.start(250);
    await new Promise(r => { const iv = setInterval(() => { onP(Math.min(1, pl.t() / clip.dur)); if (pl.ended()) { clearInterval(iv); r(); } }, 100); });
    pl.stop(); rec.stop(); await done; return new Blob(chunks, { type: type.split(";")[0] });
  }
  // Frame-exact export straight from the source MP4 (see clipcut.js). Returns null when the browser can't (caller falls back to record()).
  async function exportExact(clip, { W, H, opts, music = "none", vol = .35, onP } = {}) {
    if (!window.ClipCut || !(await ClipCut.supported())) return null;
    const src = /^(https?:)?\/\//.test(clip.src) ? clip.src : new URL(clip.src.startsWith(base()) ? clip.src : base() + clip.src, location.href).href, VE = clip.vEnd ?? clip.dur;
    return ClipCut.make({ src, clip, W, H, onP, draw: (ctx, w, h, t, f) => draw(ctx, w, h, opts, t, f),
      mix: async (octx, sb) => { const s = octx.createBufferSource(), vg = octx.createGain(); s.buffer = sb; s.connect(vg); vg.connect(octx.destination);
        const g = vg.gain; g.setValueAtTime(0, 0); g.linearRampToValueAtTime(1, .08); g.setValueAtTime(1, Math.max(.1, VE - .3)); g.linearRampToValueAtTime(0, VE); s.start(0);
        const m = MUSIC.find(x => x.id === music); if (m && m.file) { const ab = await (await fetch(base() + m.file)).arrayBuffer(), mb = await octx.decodeAudioData(ab), ms = octx.createBufferSource(), mg = octx.createGain();
          ms.buffer = mb; ms.loop = true; ms.connect(mg); mg.connect(octx.destination); duckOn(mg.gain, clip, vol, 0); ms.start(0); } } }); }
  window.ClipKit = { exportExact, ASPECTS, MUSIC, FADES, applyFades, get, clipFor, clipForSpan, align, timings, timedQuote, draw, player, record, recType };
})();
