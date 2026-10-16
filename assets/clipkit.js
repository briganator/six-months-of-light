// ClipKit (prototype): quote video clips. Clips are pre-cut on the build machine (tools/build_clips.py) from the
// official talk video, with per-word timings from speech-to-text. In the browser we only composite:
// video frame + quote text (words light up as they're spoken) + brand, mixed with optional background music
// that ducks under the speech. Export = canvas.captureStream + WebAudio stream -> MediaRecorder (real time).
(function () {
  const K = window.CardKit, SERIF = '"Cormorant Garamond", Georgia, serif', SANS = "Inter, system-ui, sans-serif";
  const ASPECTS = { story: [1080, 1920, "9:16 vertical"], square: [1080, 1080, "1:1 square"], post: [1080, 1350, "4:5 post"], wide: [1920, 1080, "16:9 wide"] };
  const MUSIC = [
    { id: "none", name: "No music" },
    { id: "morning-light", name: "Morning Light (ambient)", file: "assets/music/morning-light.m4a", lic: "Original, CC0" },
    { id: "amazing-grace", name: "Amazing Grace (piano)", file: "assets/music/amazing-grace.m4a", lic: "Tune NEW BRITAIN, public domain; arrangement CC0" },
    { id: "ode-to-joy", name: "Joyful, Joyful (piano)", file: "assets/music/ode-to-joy.m4a", lic: "Beethoven 1824, public domain; arrangement CC0" },
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
  function align(words, text) { const q = text.split(/\s+/).map(norm).filter(Boolean), t = words.map(w => norm(w[0])); const n = q.length, m = t.length; if (!n) return null;
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1), sp = new Int32Array(m + 1), sc = new Int32Array(m + 1), best = 0, bj = 0, bs = 0;
    for (let i = 1; i <= n; i++) { cur[0] = 0; sc[0] = 0;
      for (let j = 1; j <= m; j++) { const d = prev[j - 1] + (q[i - 1] === t[j - 1] ? 2 : -1), up = prev[j] - 1, lf = cur[j - 1] - 1; let v = 0, st = j;
        if (d >= up && d >= lf && d > 0) { v = d; st = prev[j - 1] > 0 ? sp[j - 1] : j; } else if (up >= lf && up > 0) { v = up; st = sp[j]; } else if (lf > 0) { v = lf; st = sc[j - 1]; }
        cur[j] = v; sc[j] = st; if (v > best) { best = v; bj = j; bs = st; } }
      [prev, cur] = [cur, prev]; [sp, sc] = [sc, sp]; }
    return best > 0 ? { i0: bs - 1, i1: bj - 1, score: best / (2 * n) } : null; }
  const MAX_DUR = 60, PAD0 = .45, PAD1 = .7;
  async function clipFor(id, text) { const T = await timings(id), a = align(T.words, text); if (!a || a.score < .55) throw new Error("Couldn't find that passage in the talk audio. Try a shorter selection.");
    const w = T.words.slice(a.i0, a.i1 + 1), s0 = w[0][1], e0 = w[w.length - 1][2]; if (e0 - s0 > MAX_DUR) throw new Error("That passage is over 60 seconds. Pick a shorter part.");
    const at0 = Math.max(0, s0 - PAD0);
    return { talk: id, src: MEDIA_BASE() + id + ".mp4", at0, dur: +(e0 + PAD1 - at0).toFixed(2), speech: [s0 - at0, e0 - at0], score: a.score, text,
      words: w.map(x => ({ w: x[0], s: x[1] - at0, e: x[2] - at0 })) }; }
  const TH = { ink: "#fffaf0", sub: "rgba(255,246,228,.82)", gold: "#f1d394", gold2: "#d8a95b", dark: 1 };
  function wrapWords(ctx, words, maxW) { const lines = []; let cur = [], w = 0, sp = ctx.measureText(" ").width;
    words.forEach((x, i) => { const ww = ctx.measureText(x.t).width; if (cur.length && w + sp + ww > maxW) { lines.push(cur); cur = []; w = 0; } cur.push({ ...x, i, ww }); w += (cur.length > 1 ? sp : 0) + ww; }); if (cur.length) lines.push(cur); return lines; }
  // Quote words (official text) mapped onto spoken word timings by position.
  function timedQuote(clip, quote) { const qw = quote.split(/\s+/).filter(Boolean), sw = clip.words, n = qw.length, m = sw.length;
    return qw.map((t, i) => { const j = Math.min(m - 1, Math.floor(i * m / n)); return { t, s: sw[j].s, e: sw[j].e }; }); }
  function draw(ctx, W, H, o, time, video) {
    const u = Math.min(W, H); ctx.save(); ctx.fillStyle = "#0d1326"; ctx.fillRect(0, 0, W, H);
    if (video && video.videoWidth) { const vw = video.videoWidth, vh = video.videoHeight, story = H > W * 1.3;
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
    ctx.globalAlpha = .75; ctx.fillStyle = TH.sub; ctx.font = `${u * .015}px ${SANS}`; ctx.fillText("Video and text from ChurchofJesusChrist.org · Personal study site · Not an official Church site", W / 2, H - u * .018);
    ctx.restore();
  }
  // Player: one <video>, one AudioContext. Music gain ducks while the speaker talks.
  function player(clip) {
    const v = document.createElement("video"); v.src = /^(https?:)?\/\//.test(clip.src) || clip.src.startsWith(base() + "media/") ? clip.src : base() + clip.src; const at0 = clip.at0 || 0; v.preload = "auto"; v.playsInline = true; v.crossOrigin = "anonymous";
    let ac, dest, vNode, mGain, mSrc, buf = {}, music = "none", vol = .35;
    const audio = () => { if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)(); dest = ac.createMediaStreamDestination();
      vNode = ac.createMediaElementSource(v); vNode.connect(ac.destination); vNode.connect(dest); mGain = ac.createGain(); mGain.connect(ac.destination); mGain.connect(dest); };
    async function loadMusic(id) { const m = MUSIC.find(x => x.id === id); if (!m || !m.file) return null; if (!buf[id]) { const r = await fetch(base() + m.file); buf[id] = await ac.decodeAudioData(await r.arrayBuffer()); } return buf[id]; }
    function duck(t0) { const g = mGain.gain, [s, e] = clip.speech, low = vol * .22; g.cancelScheduledValues(t0); g.setValueAtTime(vol, t0); g.linearRampToValueAtTime(low, t0 + Math.max(.05, s - .15));
      g.setValueAtTime(low, t0 + e); g.linearRampToValueAtTime(vol, t0 + e + .4); g.linearRampToValueAtTime(0, t0 + clip.dur); }
    async function start() { audio(); await ac.resume(); if (mSrc) { try { mSrc.stop(); } catch (e) {} mSrc = null; }
      const b = await loadMusic(music); v.currentTime = at0; await new Promise(r => v.seeking ? v.addEventListener("seeked", r, { once: true }) : r()); await v.play(); const t0 = ac.currentTime;
      if (b) { mSrc = ac.createBufferSource(); mSrc.buffer = b; mSrc.connect(mGain); mSrc.start(t0); duck(t0); } }
    function stop() { v.pause(); if (mSrc) { try { mSrc.stop(); } catch (e) {} mSrc = null; } }
    return { v, start, stop, set music(x) { music = x; }, get music() { return music; }, set vol(x) { vol = x; }, stream: () => (audio(), dest.stream), t: () => v.currentTime - at0, at0, ended: () => v.ended || v.currentTime - at0 >= clip.dur - .03, ready: () => new Promise(r => v.readyState >= 2 ? r() : v.addEventListener("loadeddata", r, { once: true })) };
  }
  const recType = () => ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1,opus", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  // Real-time export: plays the clip once while recording the canvas + mixed audio.
  async function record(cv, pl, clip, onP = () => {}) {
    const type = recType(); if (!type) throw new Error("This browser can't record video.");
    const st = cv.captureStream(30); pl.stream().getAudioTracks().forEach(t => st.addTrack(t));
    const rec = new MediaRecorder(st, { mimeType: type, videoBitsPerSecond: 6e6, audioBitsPerSecond: 128e3 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r); await pl.start(); if (Math.abs(pl.t()) > 1.5) { pl.stop(); throw new Error("The video server did not allow seeking (needs HTTP range requests)."); } rec.start(250);
    await new Promise(r => { const iv = setInterval(() => { onP(Math.min(1, pl.t() / clip.dur)); if (pl.ended()) { clearInterval(iv); r(); } }, 100); });
    pl.stop(); rec.stop(); await done; return new Blob(chunks, { type: type.split(";")[0] });
  }
  window.ClipKit = { ASPECTS, MUSIC, get, clipFor, align, timings, timedQuote, draw, player, record, recType };
})();
