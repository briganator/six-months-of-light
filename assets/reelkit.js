// ReelKit: one-tap "reel" from an animated card: 10 s H.264 MP4 with a soft music bed (AAC), made on the device.
// Music: public-domain / CC0 tracks only (no attribution needed on the video). Falls back to a silent loop (VideoKit).
(function () {
  const SR = 48000, FPS = 30;
  const TRACKS = (window.ClipKit && ClipKit.MUSIC ? ClipKit.MUSIC : []).filter(m => m.file && !m.attr);
  const base = () => window.CARDKIT_BASE || "";
  let audCfgP;
  const audCfg = () => audCfgP || (audCfgP = (async () => { if (!(window.AudioEncoder && window.AudioData && window.OfflineAudioContext)) return null;
    try { const c = { codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 128000 }; if ((await AudioEncoder.isConfigSupported(c)).supported) return c; } catch (e) {} return null; })());
  async function mixMusic(id, dur, vol = .8) {
    const m = TRACKS.find(x => x.id === id); if (!m) return null;
    const ab = await (await fetch(base() + m.file)).arrayBuffer(), o = new OfflineAudioContext(2, Math.ceil(dur * SR), SR), b = await o.decodeAudioData(ab);
    const s = o.createBufferSource(), g = o.createGain(); s.buffer = b; s.connect(g); g.connect(o.destination);
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(vol, .8); g.gain.setValueAtTime(vol, Math.max(.9, dur - 1.6)); g.gain.linearRampToValueAtTime(0, dur - .05);
    s.start(0, Math.min(2, Math.max(0, b.duration - dur - .1))); return o.startRendering(); }
  async function make({ W, H, draw, music = "none", dur = 10, onProgress = () => {}, signal } = {}) {
    [W, H] = VideoKit.sizeFor(W, H);
    const ac = music !== "none" ? await audCfg() : null;
    if (!ac || !window.VideoEncoder) { const b = await VideoKit.make({ W, H, draw, dur, cardT: 10, onProgress, signal }); b.silent = music !== "none"; return b; }
    const vc = await (async () => { for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028"]) { const c = { codec, width: W, height: H, bitrate: 5e6, framerate: FPS, avc: { format: "avc" } }; try { if ((await VideoEncoder.isConfigSupported(c)).supported) return c; } catch (e) {} } return null; })();
    if (!vc) { const b = await VideoKit.make({ W, H, draw, dur, cardT: 10, onProgress, signal }); b.silent = true; return b; }
    if (!window.Mp4Muxer) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = base() + "assets/vendor/mp4-muxer.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const mixed = await mixMusic(music, dur); onProgress(.08);
    const M = window.Mp4Muxer, muxer = new M.Muxer({ target: new M.ArrayBufferTarget(), fastStart: "in-memory", firstTimestampBehavior: "offset", video: { codec: "avc", width: W, height: H }, audio: { codec: "aac", numberOfChannels: 2, sampleRate: SR } });
    let err = null; const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => err = e }); ve.configure(vc);
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => err = e }); ae.configure(ac);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d"), N = Math.round(dur * FPS);
    const L = mixed ? mixed.getChannelData(0) : null, R = mixed ? mixed.getChannelData(1) : null, T = mixed ? mixed.length : 0, per = Math.round(SR / FPS);
    let a = 0; const pushAudio = upto => { while (a < Math.min(upto, T)) { const n = Math.min(1024, T - a), pl = new Float32Array(n * 2); pl.set(L.subarray(a, a + n), 0); pl.set(R.subarray(a, a + n), n);
      const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(a * 1e6 / SR), data: pl }); ae.encode(ad); ad.close(); a += n; } };
    for (let i = 0; i < N; i++) {
      if (signal && signal.aborted) { try { ve.close(); ae.close(); } catch (e) {} throw new DOMException("aborted", "AbortError"); }
      draw(ctx, W, H, i / FPS * 10 / dur); const f = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) }); ve.encode(f, { keyFrame: i % (FPS * 2) === 0 }); f.close();
      if (mixed) pushAudio((i + 1) * per);
      while (ve.encodeQueueSize > 3 && !err) await new Promise(r => setTimeout(r, 4)); if (err) throw err;
      if (i % 6 === 0) { onProgress(.08 + .9 * i / N); await new Promise(r => setTimeout(r, 0)); } }
    if (mixed) pushAudio(T);
    await ve.flush(); await ae.flush(); ve.close(); ae.close(); if (err) throw err; muxer.finalize(); onProgress(1);
    return new Blob([muxer.target.buffer], { type: "video/mp4" }); }
  window.ReelKit = { make, TRACKS, audCfg };
})();
