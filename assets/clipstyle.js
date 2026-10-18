// ClipStyle: default looks, share-link state, and SRT cues for the clip editor.
// Captions stay official words. A hook that is not part of the official passage is marked as the sharer's own words.
(function (root) {
  const CAPS = ["highlight", "pill", "pop", "lower", "type"];
  const THEMES = ["midnight", "rose", "teal", "sage", "silver", "ember", "gold", "dawn", "cream", "grove", "slate"];
  const FONTS = ["serif", "italic", "sans"];
  const LOOKS = ["full", "blur", "dim", "duotone"];
  const ASPECTS = ["story", "post", "square", "wide"];
  // Same beds as ClipKit.MUSIC, minus "No music".
  const BEDS = ["meditation-impromptu", "dreamy-flashback", "touching-moments", "lasting-hope", "heartwarming", "long-note", "amazing-grace-strings", "nearer-my-god", "eternal-father", "canon-strings", "ode-to-joy-band", "comfortable-mystery", "frozen-star", "moonlight-hall", "water-lily", "daybreak", "gymnopedie", "enchanted-journey", "bittersweet", "clean-soul", "serene", "gymnopedie-3", "deliberate-thought", "floating-cities", "healing"];
  // Eight starting looks. Each pairs a caption style, a color theme, Cormorant (serif) or Inter (sans), and a video tone.
  // beds[0] is the mood match; later cycles of the same look take the next bed so a long talk doesn't repeat one track.
  const NAMED = [
    ["Classic gold", { look: "classic-gold", cap: "highlight", theme: "midnight", font: "serif", vbg: "full", music: "lasting-hope", beds: ["lasting-hope", "dreamy-flashback"], zoom: 1 }],
    ["Rose pill", { look: "rose-pill", cap: "pill", theme: "rose", font: "sans", vbg: "dim", music: "heartwarming", beds: ["heartwarming", "touching-moments"], zoom: 1 }],
    ["Teal pop", { look: "teal-pop", cap: "pop", theme: "teal", font: "sans", vbg: "full", music: "daybreak", beds: ["daybreak", "serene"], zoom: 1 }],
    ["Sage lower", { look: "sage-lower", cap: "lower", theme: "sage", font: "sans", vbg: "full", music: "meditation-impromptu", beds: ["meditation-impromptu", "nearer-my-god"], zoom: 1 }],
    ["Silver serif", { look: "silver-serif", cap: "highlight", theme: "silver", font: "serif", vbg: "dim", music: "long-note", beds: ["long-note", "canon-strings"], zoom: 1 }],
    ["Ember pop", { look: "ember-pop", cap: "pop", theme: "ember", font: "serif", vbg: "duotone", music: "amazing-grace-strings", beds: ["amazing-grace-strings", "eternal-father"], zoom: 1 }],
    ["Gold pill", { look: "gold-pill", cap: "pill", theme: "gold", font: "serif", vbg: "dim", music: "touching-moments", beds: ["touching-moments", "gymnopedie"], zoom: 1 }],
    ["Rose lower", { look: "rose-lower", cap: "lower", theme: "rose", font: "serif", vbg: "blur", music: "healing", beds: ["healing", "heartwarming"], zoom: 1 }],
  ];
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // salt is the moment's place in its talk (0, 1, 2…). Looks cycle in NAMED order. Shuffle adds 1.
  function mix(id, salt) {
    const n = NAMED.length, s = salt | 0, i = ((s % n) + n) % n, look = NAMED[i][1];
    const beds = look.beds && look.beds.length ? look.beds : [look.music];
    const music = beds[Math.floor(Math.abs(s) / n) % beds.length];
    return { cap: look.cap, theme: look.theme, font: look.font, vbg: look.vbg, music, zoom: look.zoom || 1, look: look.look };
  }
  function lookName(salt) { const n = NAMED.length, s = salt | 0; return NAMED[((s % n) + n) % n][0]; }
  // File order. Appending a moment at the end of a talk leaves earlier looks unchanged.
  function baseSalt(list, id) { const i = (list || []).findIndex(m => m.id === id); return i < 0 ? 0 : i; }
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  function ownWords(hook, text) { const h = norm(hook); return !!h && !norm(text).includes(h); }
  const TITLE_DUR = 1, TITLE_FADE = .35, END_DUR = 2.7;
  function titleDur() { return TITLE_DUR; }
  // A hook that cannot sit on a 1 second card in about three lines is too long: use the talk title, quotes removed.
  function cardLine(hook, title) {
    const h = String(hook || "").replace(/\s+/g, " ").trim();
    const words = h ? h.split(" ") : [];
    const long = !h || words.length > 12 || h.length > 72;
    if (!long) return h;
    return String(title || h).replace(/[“”„«»"]/g, "").replace(/\s+/g, " ").trim();
  }
  function srtTime(t) {
    let sec = Math.max(0, Math.floor(+t || 0)), ms = Math.round(((+t || 0) - Math.floor(+t || 0)) * 1000);
    if (ms >= 1000) { sec++; ms = 0; }
    const p = (n, w = 2) => String(n).padStart(w, "0");
    return p(Math.floor(sec / 3600)) + ":" + p(Math.floor(sec % 3600 / 60)) + ":" + p(sec % 60) + "," + p(ms, 3);
  }
  function srt(words, lead) {
    const cues = [], cur = [], off = +lead || 0;
    const flush = () => { if (!cur.length) return; cues.push({ s: cur[0].s + off, e: cur[cur.length - 1].e + off, t: cur.map(w => w.t).join(" ") }); cur.length = 0; };
    (words || []).forEach(w => {
      const text = cur.concat([w]).map(x => x.t).join(" "), gap = cur.length ? w.s - cur[cur.length - 1].e : 0;
      if (cur.length && (text.length > 42 || gap > .7 || w.e - cur[0].s > 4.2)) flush();
      cur.push(w);
    });
    flush();
    return cues.map((c, i) => (i + 1) + "\n" + srtTime(c.s) + " --> " + srtTime(Math.max(c.e, c.s + .35)) + "\n" + c.t + "\n").join("\n");
  }
  const NUM = { vol: [0, .8], vop: [.1, 1], scale: [.7, 1.7], tx: [-.2, .2], ty: [-.4, .3], zoom: [1, 1.8], panX: [0, 1], panY: [0, 1], salt: [0, 400], p0: [0, 100000], p1: [0, 100000] };
  function clampStyle(s) {
    const o = s || {}, n = (k, d) => { const v = +o[k]; if (!isFinite(v)) return d; return Math.min(NUM[k][1], Math.max(NUM[k][0], v)); };
    const pan = k => (o[k] == null || o[k] === "" || !isFinite(+o[k])) ? null : n(k, null);
    return {
      cap: CAPS.includes(o.cap) ? o.cap : "highlight",
      theme: THEMES.includes(o.theme) ? o.theme : "midnight",
      font: FONTS.includes(o.font) ? o.font : "serif",
      vbg: LOOKS.includes(o.vbg) ? o.vbg : "full",
      music: o.music === "none" || BEDS.includes(o.music) ? o.music : "dreamy-flashback",
      vol: n("vol", .35), vop: n("vop", .62), aspect: ASPECTS.includes(o.aspect) ? o.aspect : "story",
      scale: n("scale", 1), tx: n("tx", 0), ty: n("ty", 0), zoom: n("zoom", 1), panX: pan("panX"), panY: pan("panY"),
      titleOn: !(o.titleOn === false || o.titleOn === 0 || o.titleOn === "0"),
      endOn: !(o.endOn === false || o.endOn === 0 || o.endOn === "0"),
      hook: String(o.hook || "").slice(0, 280), speaker: String(o.speaker || "").slice(0, 80),
      salt: n("salt", 0) | 0, p0: n("p0", 0) | 0, p1: n("p1", 0) | 0,
    };
  }
  function encode(s) {
    const c = clampStyle(s), p = new URLSearchParams();
    ["cap", "theme", "font", "music", "aspect", "hook", "speaker"].forEach(k => p.set(k, c[k]));
    ["vol", "vop", "scale", "tx", "ty", "zoom", "salt", "p0", "p1"].forEach(k => p.set(k, String(Math.round(c[k] * 1000) / 1000)));
    if (c.panX != null) p.set("panX", String(Math.round(c.panX * 1000) / 1000));
    if (c.panY != null) p.set("panY", String(Math.round(c.panY * 1000) / 1000));
    p.set("titleOn", c.titleOn ? "1" : "0"); p.set("endOn", c.endOn ? "1" : "0");
    return p.toString();
  }
  function decode(str) {
    const p = new URLSearchParams(str || ""), o = {};
    p.forEach((v, k) => { o[k] = v; });
    Object.keys(NUM).forEach(k => { if (o[k] != null && o[k] !== "") o[k] = +o[k]; });
    if (o.titleOn != null) o.titleOn = o.titleOn === "1" || o.titleOn === "true";
    if (o.endOn != null) o.endOn = o.endOn === "1" || o.endOn === "true";
    return o;
  }
  root.ClipStyle = { CAPS, THEMES, FONTS, LOOKS, ASPECTS, BEDS, NAMED, hash, mix, lookName, baseSalt, ownWords, titleDur, TITLE_DUR, TITLE_FADE, cardLine, END_DUR, srt, srtTime, encode, decode, clampStyle };
})(typeof globalThis !== "undefined" ? globalThis : this);
