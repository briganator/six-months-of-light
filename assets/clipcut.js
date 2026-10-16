// ClipCut: frame-exact "Make a video" export, no real-time recording.
// Reads only the needed bytes of the talk MP4 (HTTP Range), decodes the exact segment with WebCodecs,
// draws each output frame from the decoded source frame at that media time, renders the speech + music mix
// offline (OfflineAudioContext) from the decoded source audio, and muxes H.264 + AAC (Opus where AAC
// encoding isn't available) into one MP4. Video and audio come from the same source timestamps, so they stay in sync.
(function () {
  const FPS = 30, SR = 48000;
  const u32 = (d, o) => d.getUint32(o), u64 = (d, o) => d.getUint32(o) * 4294967296 + d.getUint32(o + 4);
  const typ = (d, o) => String.fromCharCode(d.getUint8(o), d.getUint8(o + 1), d.getUint8(o + 2), d.getUint8(o + 3));
  function boxes(d, s, e) { const out = []; let o = s; while (o + 8 <= e) { let sz = u32(d, o), h = 8; const t = typ(d, o + 4);
      if (sz === 1) { sz = u64(d, o + 8); h = 16; } else if (sz === 0) sz = e - o; if (sz < h) break; out.push({ t, s: o + h, e: Math.min(e, o + sz), o }); o += sz; } return out; }
  const kid = (d, b, t) => boxes(d, b.s, b.e).find(x => x.t === t);
  const path = (d, b, ...ts) => ts.reduce((x, t) => x && kid(d, x, t), b);
  async function range(url, a, b) { const r = await fetch(url, { headers: { Range: `bytes=${a}-${b}` } }); if (r.status !== 206 && !(r.status === 200 && a === 0)) throw new Error("range " + r.status);
    const buf = await r.arrayBuffer(); return r.status === 200 ? buf.slice(0, b - a + 1) : buf; }
  // Parse one track's sample table into flat arrays (presentation times in seconds, edit list applied).
  function track(d, trak, mvTS) {
    const mdia = kid(d, trak, "mdia"), hdlr = kid(d, mdia, "hdlr"), kind = typ(d, hdlr.s + 8), mdhd = kid(d, mdia, "mdhd"), v = d.getUint8(mdhd.s);
    const ts = v ? u32(d, mdhd.s + 20) : u32(d, mdhd.s + 12), stbl = path(d, mdia, "minf", "stbl");
    let shift = 0, delay = 0; const elst = path(d, trak, "edts", "elst");
    if (elst) { const ev = d.getUint8(elst.s), n = u32(d, elst.s + 4); let o = elst.s + 8;
      for (let i = 0; i < n; i++) { const dur = ev ? u64(d, o) : u32(d, o), mt = ev ? Number(d.getBigInt64(o + 8)) : d.getInt32(o + 4); o += ev ? 20 : 12;
        if (mt === -1) delay += dur / mvTS; else { shift = mt; break; } } }
    const stsd = kid(d, stbl, "stsd"), ent = boxes(d, stsd.s + 8, stsd.e)[0]; let codec, desc, extra = {};
    if (kind === "vide") { const c = boxes(d, ent.s + 78, ent.e).find(x => x.t === "avcC"); desc = new Uint8Array(d.buffer, c.s, c.e - c.s).slice();
      codec = "avc1." + [1, 2, 3].map(i => desc[i].toString(16).padStart(2, "0")).join(""); extra = { w: d.getUint16(ent.s + 24), h: d.getUint16(ent.s + 26) }; }
    else if (kind === "soun") { const ch = d.getUint16(ent.s + 16), sr = u32(d, ent.s + 24) >>> 16, es = boxes(d, ent.s + 28, ent.e).find(x => x.t === "esds");
      let o = es.s + 4; const len = () => { let n = 0, b; do { b = d.getUint8(o++); n = n << 7 | b & 127; } while (b & 128); return n; };
      let oti = 0x40; while (o < es.e) { const tag = d.getUint8(o++), l = len();
        if (tag === 3) { const f = d.getUint8(o + 2); o += 3 + (f & 128 ? 2 : 0) + (f & 64 ? 1 + d.getUint8(o + 3) : 0) + (f & 32 ? 2 : 0); }
        else if (tag === 4) { oti = d.getUint8(o); o += 13; } else if (tag === 5) { desc = new Uint8Array(d.buffer, o, l).slice(); break; } else o += l; }
      const aot = desc ? desc[0] >> 3 : 2; codec = "mp4a.40." + (aot || 2); extra = { ch, sr }; }
    else return null;
    const n = u32(d, kid(d, stbl, "stsz").s + 8), fixed = u32(d, kid(d, stbl, "stsz").s + 4), size = new Uint32Array(n);
    for (let i = 0; i < n; i++) size[i] = fixed || u32(d, kid(d, stbl, "stsz").s + 12 + i * 4);
    const dts = new Float64Array(n), pts = new Float64Array(n), dur = new Float64Array(n); { const b = kid(d, stbl, "stts"); let k = 0, t = 0;
      for (let e = 0, m = u32(d, b.s + 4); e < m; e++) { const c = u32(d, b.s + 8 + e * 8), dl = u32(d, b.s + 12 + e * 8); for (let j = 0; j < c && k < n; j++, k++) { dts[k] = t; dur[k] = dl; t += dl; } } }
    const ctts = kid(d, stbl, "ctts"), co = new Float64Array(n); if (ctts) { const cv = d.getUint8(ctts.s); let k = 0;
      for (let e = 0, m = u32(d, ctts.s + 4); e < m; e++) { const c = u32(d, ctts.s + 8 + e * 8), off = cv ? d.getInt32(ctts.s + 12 + e * 8) : u32(d, ctts.s + 12 + e * 8); for (let j = 0; j < c && k < n; j++) co[k++] = off; } }
    for (let i = 0; i < n; i++) { pts[i] = (dts[i] + co[i] - shift) / ts + delay; dur[i] /= ts; }
    const key = new Uint8Array(n); const stss = kid(d, stbl, "stss"); if (stss) for (let e = 0, m = u32(d, stss.s + 4); e < m; e++) key[u32(d, stss.s + 8 + e * 4) - 1] = 1; else key.fill(1);
    const stco = kid(d, stbl, "stco") || kid(d, stbl, "co64"), big = stco.t === "co64", nc = u32(d, stco.s + 4), chunk = i => big ? u64(d, stco.s + 8 + i * 8) : u32(d, stco.s + 8 + i * 4);
    const stsc = kid(d, stbl, "stsc"), ns = u32(d, stsc.s + 4), off = new Float64Array(n); let k = 0;
    for (let e = 0; e < ns; e++) { const first = u32(d, stsc.s + 8 + e * 12) - 1, per = u32(d, stsc.s + 12 + e * 12), last = e + 1 < ns ? u32(d, stsc.s + 20 + e * 12) - 1 : nc;
      for (let c = first; c < last && k < n; c++) { let o = chunk(c); for (let j = 0; j < per && k < n; j++) { off[k] = o; o += size[k]; k++; } } }
    return { kind, codec, desc, ...extra, n, size, pts, dur, key, off };
  }
  const MOOV = {};
  async function moov(url) { if (MOOV[url]) return MOOV[url];
    return (MOOV[url] = (async () => { let head = new DataView(await range(url, 0, 65535)), top = boxes(head, 0, head.byteLength), m = top.find(x => x.t === "moov");
      let d, b; if (m && m.e - m.o <= 65536 && u32(head, m.o) <= head.byteLength - m.o) { d = head; b = m; }
      else { let o = 0, mo = null, ms = 0; while (true) { const h = new DataView(await range(url, o, o + 15)); let sz = u32(h, 0); const t = typ(h, 4); if (sz === 1) sz = u64(h, 8); if (t === "moov") { mo = o; ms = sz; break; } if (!sz) throw new Error("no moov"); o += sz; }
        d = new DataView(await range(url, mo, mo + ms - 1)); b = { t: "moov", s: 8, e: ms, o: 0 }; }
      const mvhd = kid(d, b, "mvhd"), mvTS = d.getUint8(mvhd.s) ? u32(d, mvhd.s + 20) : u32(d, mvhd.s + 12);
      const tr = boxes(d, b.s, b.e).filter(x => x.t === "trak").map(t => track(d, t, mvTS)).filter(Boolean);
      return { v: tr.find(t => t.kind === "vide"), a: tr.find(t => t.kind === "soun") }; })().catch(e => { delete MOOV[url]; throw e; })); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let muxP; const loadMux = () => muxP || (muxP = window.Mp4Muxer ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement("script");
    s.src = (window.CARDKIT_BASE || "") + "assets/vendor/mp4-muxer.min.js"; s.onload = res; s.onerror = () => { muxP = null; rej(new Error("muxer")); }; document.head.appendChild(s); }));
  async function avcCfg(W, H) { for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.640032", "avc1.42e032"]) { const c = { codec, width: W, height: H, bitrate: 6e6, framerate: FPS, avc: { format: "avc" } };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) return c; } catch (e) {} } return null; }
  async function audCfg() { for (const [codec, mux] of [["mp4a.40.2", "aac"], ["opus", "opus"]]) { const c = { codec, sampleRate: SR, numberOfChannels: 2, bitrate: 128000 };
      try { if ((await AudioEncoder.isConfigSupported(c)).supported) return { c, mux }; } catch (e) {} } return null; }
  let SUP; function supported() { return SUP || (SUP = (async () => { if (!(window.VideoDecoder && window.VideoEncoder && window.AudioDecoder && window.AudioEncoder && window.OfflineAudioContext && window.VideoFrame && window.AudioData)) return false;
      return !!(await avcCfg(1080, 1920)) && !!(await audCfg()); })().catch(() => false)); }
  // Decode source audio covering [t0, t0 + len] into planar Float32 at the source rate.
  async function speech(url, A, buf, base, t0, len) { const sr = A.sr || SR, ch = Math.min(2, A.ch || 2), N = Math.ceil(len * sr), out = [...Array(ch)].map(() => new Float32Array(N)); let err = null;
    const dec = new AudioDecoder({ output: ad => { try { const s0 = Math.round((ad.timestamp / 1e6 - t0) * sr), n = ad.numberOfFrames, tmp = new Float32Array(n);
        for (let c = 0; c < ch; c++) { ad.copyTo(tmp, { planeIndex: Math.min(c, ad.numberOfChannels - 1), format: "f32-planar" }); for (let j = 0; j < n; j++) { const k = s0 + j; if (k >= 0 && k < N) out[c][k] = tmp[j]; } } } finally { ad.close(); } }, error: e => err = e });
    dec.configure({ codec: A.codec, sampleRate: sr, numberOfChannels: A.ch || 2, description: A.desc });
    for (let i = 0; i < A.n; i++) { if (A.pts[i] + A.dur[i] < t0 - .1 || A.pts[i] > t0 + len + .05) continue;
      dec.decode(new EncodedAudioChunk({ type: "key", timestamp: Math.round(A.pts[i] * 1e6), duration: Math.round(A.dur[i] * 1e6), data: new Uint8Array(buf, A.off[i] - base, A.size[i]) })); }
    await dec.flush(); dec.close(); if (err) throw err; return { sr, ch, out }; }
  // Measure the encoder+decoder delay on this device: encode a click at 0.25 s, decode it, see where it lands.
  const PRIME = {}; async function priming(cfg) { if (cfg.codec in PRIME) return PRIME[cfg.codec];
    let d = 0; try { const n = SR, x = new Float32Array(n * 2), at = SR / 4; for (let j = 0; j < 48; j++) { x[at + j] = x[n + at + j] = Math.sin(j / 48 * Math.PI) * .9; }
      const chunks = []; let meta = null; const e = new AudioEncoder({ output: (c, m) => { chunks.push(c); if (m && m.decoderConfig) meta = m.decoderConfig; }, error: () => {} }); e.configure(cfg);
      for (let s = 0; s < n; s += 1024) { const k = Math.min(1024, n - s), pl = new Float32Array(k * 2); pl.set(x.subarray(s, s + k)); pl.set(x.subarray(n + s, n + s + k), k);
        const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: k, numberOfChannels: 2, timestamp: Math.round(s * 1e6 / SR), data: pl }); e.encode(ad); ad.close(); }
      await e.flush(); e.close(); if (!meta) meta = { codec: cfg.codec, sampleRate: SR, numberOfChannels: 2 };
      const out = []; const dc = new AudioDecoder({ output: ad => { const t = new Float32Array(ad.numberOfFrames); ad.copyTo(t, { planeIndex: 0, format: "f32-planar" }); out.push(t); ad.close(); }, error: () => {} });
      dc.configure(meta); chunks.forEach(c => dc.decode(c)); await dc.flush(); dc.close();
      const y = new Float32Array(out.reduce((a, t) => a + t.length, 0)); let o = 0; out.forEach(t => { y.set(t, o); o += t.length; });
      let bi = 0, bv = 0; for (let j = 0; j < y.length; j++) if (Math.abs(y[j]) > bv) { bv = Math.abs(y[j]); bi = j; }
      // Peak of the click is at at + 24; codecs that trim their own delay (Opus with pre-skip in the MP4) land at ~0.
      d = cfg.codec === "opus" ? 0 : Math.max(0, Math.min(4096, bi - (at + 24))); } catch (e) { d = 0; }
    return (PRIME[cfg.codec] = d); }
  // make({ src, clip, W, H, draw(ctx, W, H, t, frame), mix(octx, speechBuffer) -> Promise, onP })
  async function make({ src, clip, W, H, draw, mix, onP = () => {} }) {
    await loadMux(); const M = await moov(src), V = M.v, A = M.a, at0 = clip.at0, dur = clip.dur, vEnd = clip.vEnd ?? dur;
    const vc = await avcCfg(W, H), ac = await audCfg(); if (!vc || !ac) throw new Error("unsupported");
    // Video samples: from the keyframe at/before at0 to just past the last needed frame.
    let k0 = 0; for (let i = 0; i < V.n; i++) if (V.key[i] && V.pts[i] <= at0 + 1e-3) k0 = i; else if (V.pts[i] > at0 + 2) break;
    const vLast = at0 + vEnd + .1; let k1 = k0; while (k1 + 1 < V.n && !(V.key[k1 + 1] && V.pts[k1 + 1] > vLast)) { k1++; if (V.pts[k1] > vLast + .5) break; }
    const aIdx = []; for (let i = 0; i < A.n; i++) if (A.pts[i] + A.dur[i] >= at0 - .1 && A.pts[i] <= at0 + dur + .05) aIdx.push(i);
    let lo = Infinity, hi = 0; for (let i = k0; i <= k1; i++) { lo = Math.min(lo, V.off[i]); hi = Math.max(hi, V.off[i] + V.size[i]); }
    aIdx.forEach(i => { lo = Math.min(lo, A.off[i]); hi = Math.max(hi, A.off[i] + A.size[i]); });
    onP(.02); const buf = await range(src, lo, hi - 1); onP(.15);
    // Audio: decode the exact segment, then the offline mix (speech gain envelope + music ducking).
    const sp = await speech(src, A, buf, lo, at0, dur), octx = new OfflineAudioContext(2, Math.ceil(dur * SR), SR), sb = octx.createBuffer(sp.ch, sp.out[0].length, sp.sr);
    sp.out.forEach((x, c) => sb.copyToChannel(x, c)); await mix(octx, sb); const mixed = await octx.startRendering(); onP(.25);
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), fastStart: "in-memory", firstTimestampBehavior: "offset",
      video: { codec: "avc", width: W, height: H }, audio: { codec: ac.mux, numberOfChannels: 2, sampleRate: SR } });
    let err = null; const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => err = e }); ve.configure(vc);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d");
    // Source frames are kept as they are (no frame-rate conversion): each decoded frame is drawn once at its own
    // presentation time minus at0, so the picture can't drift from the audio. After vEnd the last frame is held.
    let n = 0, last = -1, prev = null, started = false; const step = V.dur[k0] || 1 / FPS;
    const emit = (f, t) => { if (t <= last + 1e-4) return; draw(ctx, W, H, t, f); const vf = new VideoFrame(cv, { timestamp: Math.round(t * 1e6) }); ve.encode(vf, { keyFrame: n % (FPS * 2) === 0 }); vf.close(); n++; last = t; onP(.25 + .7 * Math.min(1, t / dur)); };
    const vd = new VideoDecoder({ output: f => { try { const t = f.timestamp / 1e6 - at0;
        if (t <= 1e-4) { if (prev) prev.close(); prev = f; return; }
        if (!started) { started = true; emit(prev || f, 0); }
        if (t <= vEnd + 1e-4 && t < dur) emit(f, t); if (prev) prev.close(); prev = f; } catch (e) { err = e; f.close(); } }, error: e => err = e });
    vd.configure({ codec: V.codec, description: V.desc, codedWidth: V.w, codedHeight: V.h });
    for (let s = k0; s <= k1; s++) { if (err) throw err; vd.decode(new EncodedVideoChunk({ type: V.key[s] ? "key" : "delta", timestamp: Math.round(V.pts[s] * 1e6), duration: Math.round(V.dur[s] * 1e6), data: new Uint8Array(buf, V.off[s] - lo, V.size[s]) }));
      while ((vd.decodeQueueSize > 2 || ve.encodeQueueSize > 3) && !err) await sleep(2); if (s % 8 === 0) await sleep(0); }
    await vd.flush(); if (prev) { if (!started) emit(prev, 0); for (let t = last + step; t < dur - 1e-3; t += step) emit(prev, t); prev.close(); } vd.close(); if (err) throw err;
    // Audio: encode the rendered mix in 1024-frame blocks, timestamps from the sample count.
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => err = e }); ae.configure(ac.c);
    const pre = await priming(ac.c), L0 = mixed.getChannelData(0), R0 = mixed.getChannelData(1), T = mixed.length;
    // The encoder's own start-up delay (AAC priming) would push the sound late, and the MP4 has no edit list to undo it,
    // so the input is advanced by that many samples (measured on this device by encoding a click and decoding it).
    const L = new Float32Array(T), R = new Float32Array(T); L.set(L0.subarray(pre)); R.set(R0.subarray(pre));
    for (let s = 0; s < T; s += 1024) { const n = Math.min(1024, T - s), pl = new Float32Array(n * 2); pl.set(L.subarray(s, s + n), 0); pl.set(R.subarray(s, s + n), n);
      const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(s * 1e6 / SR), data: pl }); ae.encode(ad); ad.close();
      if (ae.encodeQueueSize > 8) await sleep(1); }
    await ve.flush(); await ae.flush(); ve.close(); ae.close(); if (err) throw err; muxer.finalize(); onP(1);
    return new Blob([muxer.target.buffer], { type: "video/mp4" }); }
  window.ClipCut = { supported, make, moov };
})();
