// VideoKit: turns an animated card into a short looping MP4 (H.264) on the device.
// 1) WebCodecs VideoEncoder + mp4-muxer (frame by frame, faster than real time, clean loop, no dropped frames)
// 2) fallback: MediaRecorder in real time (video/mp4 where supported, WebM only where MP4 isn't)
(function () {
  const FPS = 30, DUR = 8, BITRATE = 5e6;           // 8 s · 30 fps · ~5 MB
  let muxP;
  const loadMux = () => muxP || (muxP = new Promise((res, rej) => { if (window.Mp4Muxer) return res();
    const s = document.createElement("script"); s.src = (window.CARDKIT_BASE || "") + "assets/vendor/mp4-muxer.min.js"; s.onload = res; s.onerror = () => { muxP = null; rej(new Error("muxer")); }; document.head.appendChild(s); }));
  const even = n => Math.max(2, Math.round(n / 2) * 2);
  // Videos are at most 1080 px wide (platform-friendly; Story 1080x1920, feed 1080x1350)
  const sizeFor = (W, H) => W > 1080 ? [1080, even(H * 1080 / W)] : [even(W), even(H)];
  const cfgCache = {};
  async function avcConfig(W, H) {
    const k = W + "x" + H; if (k in cfgCache) return cfgCache[k];
    let out = null;
    if (window.VideoEncoder && window.VideoFrame) for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.640032", "avc1.42e032"]) {
      const c = { codec, width: W, height: H, bitrate: BITRATE, framerate: FPS, avc: { format: "avc" } };
      try { const s = await VideoEncoder.isConfigSupported(c); if (s && s.supported) { out = c; break; } } catch (e) {} }
    return (cfgCache[k] = out); }
  const recType = () => window.MediaRecorder && ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } });
  // Fast (non real time) encoding available? Used to decide whether to pre-render in the background.
  const fast = async (W = 1080, H = 1920) => !!(await avcConfig(...sizeFor(W, H)));
  const supported = async (W, H) => (await fast(W, H)) || !!recType();
  const tick = () => new Promise(r => setTimeout(r, 0));
  // draw(ctx, W, H, cardTime): the card's own 10 s timeline is played in DUR seconds, so the clip still loops cleanly.
  async function make({ W, H, draw, cardT = 10, dur = DUR, onProgress = () => {}, signal } = {}) {
    [W, H] = sizeFor(W, H);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d");
    const N = Math.round(dur * FPS), cfg = await avcConfig(W, H);
    if (cfg) {
      await loadMux();
      const M = window.Mp4Muxer, muxer = new M.Muxer({ target: new M.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS }, fastStart: "in-memory" });
      let err = null; const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { err = e; } });
      enc.configure(cfg);
      for (let i = 0; i < N; i++) {
        if (signal && signal.aborted) { try { enc.close(); } catch (e) {} throw new DOMException("aborted", "AbortError"); }
        draw(ctx, W, H, i / FPS * cardT / dur);
        const f = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        enc.encode(f, { keyFrame: i % (FPS * 2) === 0 }); f.close();
        while (enc.encodeQueueSize > 3) await new Promise(r => setTimeout(r, 4));
        if (err) throw err;
        if (i % 6 === 0) { onProgress(i / N); await tick(); }
      }
      await enc.flush(); enc.close(); muxer.finalize(); onProgress(1);
      return new Blob([muxer.target.buffer], { type: "video/mp4" });
    }
    const type = recType(); if (!type) throw new Error("This browser can't make videos.");
    // Real-time fallback: the canvas must be painted live while recording.
    cv.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px"; document.body.appendChild(cv);
    const stream = cv.captureStream(FPS), rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: BITRATE }), chunks = [];
    rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r);
    draw(ctx, W, H, 0); rec.start(250); const t0 = performance.now();
    await new Promise(res => { const loop = () => { const s = (performance.now() - t0) / 1000;
      if (s >= dur || (signal && signal.aborted)) { res(); return; } draw(ctx, W, H, s * cardT / dur); onProgress(s / dur); requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    rec.stop(); stream.getTracks().forEach(t => t.stop()); await done; cv.remove(); onProgress(1);
    if (signal && signal.aborted) throw new DOMException("aborted", "AbortError");
    return new Blob(chunks, { type: type.split(";")[0] });
  }
  const ext = blob => blob.type.includes("mp4") ? "mp4" : "webm";
  // Small progress ring over a preview: "Making your video… 6s"
  function progress(host) {
    const el = document.createElement("div"); el.className = "vk-prog"; el.setAttribute("role", "status");
    el.innerHTML = `<svg viewBox="0 0 44 44" width="56" height="56" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="4"/><circle class="vk-arc" cx="22" cy="22" r="19" fill="none" stroke="#f1d394" stroke-width="4" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="119.4" transform="rotate(-90 22 22)"/></svg><span>Making your video…</span>`;
    host.appendChild(el); const t0 = performance.now(), arc = el.querySelector(".vk-arc"), txt = el.querySelector("span");
    return { set(p) { arc.setAttribute("stroke-dashoffset", String(119.4 * (1 - p))); const el2 = (performance.now() - t0) / 1000, left = p > .04 ? Math.max(1, Math.round(el2 / p - el2)) : null;
        txt.textContent = left ? `Making your video… ${left}s` : "Making your video…"; }, done() { el.remove(); } }; }
  window.VideoKit = { make, supported, fast, sizeFor, ext, progress, FPS, DUR };
})();
