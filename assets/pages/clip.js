// Canva-style clip editor. Reuses ClipKit for timings, drawing, music, and export.
(function () {
  const C = window.ClipKit, Y = window.ClipStyle, Q = new URLSearchParams(location.search);
  if (!C || !Y) return;
  const mediaQ = Q.get("media");
  if (mediaQ) { try { window.CLIP_MEDIA_BASE = new URL(mediaQ, location.href).href; } catch (e) {} }
  document.body.classList.add("ce-on");
  const $ = id => document.getElementById(id);
  const S = {
    talkId: "", momentId: "", moment: null, talk: null, selWords: null,
    p0: 0, p1: 0, clip: null, pl: null, view: "speech", playing: false, busy: false, exporting: false,
    mediaOk: false, mediaMsg: "", guides: false, tok: 0, tool: null,
    cap: "highlight", theme: "midnight", font: "serif", music: "none", vol: .35, vbg: "full", vop: .62,
    aspect: "story", scale: 1, tx: 0, ty: 0, zoom: 1, panX: null, panY: null,
    titleOn: true, endOn: true, hook: "", speaker: "", salt: 0,
  };
  const IC = { back: "M15 6l-6 6 6 6M9 12h12", undo: "M9 7H4V2M4.5 7a8 8 0 1 1 1.5 10", redo: "M15 7h5V2M19.5 7a8 8 0 1 0-1.5 10" };
  const svg = d => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const TOOLS = [["style", "Style"], ["text", "Text"], ["color", "Color"], ["music", "Music"], ["look", "Look"], ["trim", "Trim"], ["size", "Size"]];
  const root = document.createElement("div"); root.id = "ce"; root.className = "ce";
  root.innerHTML = `
    <header class="ce-top">
      <a class="ce-ic" href="moments.html" aria-label="Best moments">${svg(IC.back)}</a>
      <button type="button" class="ce-ic" id="ceUndo" aria-label="Undo" disabled>${svg(IC.undo)}</button>
      <button type="button" class="ce-ic" id="ceRedo" aria-label="Redo" disabled>${svg(IC.redo)}</button>
      <div class="ce-name"><b id="ceName">Clip</b><span>Personal study site · Not an official Church site</span></div>
      <button type="button" class="ce-shuffle" id="ceShuffle">Shuffle</button>
    </header>
    <div class="ce-main">
      <div class="ce-stage" id="ceStage">
        <div class="ce-wrap" id="ceWrap"><canvas id="ceCv" aria-label="Clip preview"></canvas><button type="button" class="ce-play" id="cePlay" aria-label="Play preview">▶</button></div>
        <div class="ce-miss" id="ceMiss" hidden></div>
        <div class="ce-toast" id="ceToast" role="status" aria-live="polite"></div>
        <div class="ce-prog" id="ceProg" hidden><b id="ceProgT">Saving…</b><span><i id="ceProgI"></i></span></div>
      </div>
      <div class="ce-side">
        <div class="ce-phase" id="cePhase" role="group" aria-label="Which part to preview">
          <button type="button" data-ph="title">Title</button><button type="button" data-ph="speech" aria-pressed="true">Moment</button><button type="button" data-ph="end">End</button>
        </div>
        <div class="ce-strip" id="ceStrip" role="group" aria-label="Presets"></div>
        <nav class="ce-tools" id="ceTools" aria-label="Tools">${TOOLS.map(([k, n]) => `<button type="button" data-tool="${k}">${n}</button>`).join("")}</nav>
        <section class="ce-sheet" id="ceSheet" hidden aria-labelledby="ceShT"><div class="ce-sh-h"><b id="ceShT">Style</b><button type="button" id="ceShX">Done</button></div><div class="ce-sh-b" id="ceShB"></div></section>
      </div>
    </div>
    <footer class="ce-bar">
      <button type="button" id="ceSrt">SRT</button>
      <button type="button" id="ceLink">Copy link</button>
      <button type="button" class="gold" id="ceSave">Save MP4</button>
    </footer>`;
  document.body.appendChild(root);
  const cv = $("ceCv"), ctx = cv.getContext("2d");
  let bed = null, undo = [], redo = [], curSnap = "", pending = null, lastCh = 0, restoring = false, drag = null;
  const swatch = (set, label, inner) => `<button type="button" class="ce-sw" data-set="${set}">${inner}<span>${esc(label)}</span></button>`;
  const dot = (bg) => `<i class="ez-dot ce-dot" style="background:${bg}"></i>`;
  const THEME_DOT = { midnight: "#0d1326", rose: "#3a1c28", teal: "#0c2428", sage: "#1a261c", silver: "#8aa0b8", ember: "#e15a32", gold: "#c4963a", dawn: "linear-gradient(135deg,#2a1840,#e38b78)", cream: "#f6efe2", grove: "#14241c", slate: "#1c2430" };
  function flat() {
    return { cap: S.cap, theme: S.theme, font: S.font, music: S.music, vol: S.vol, vbg: S.vbg, vop: S.vop, aspect: S.aspect, scale: S.scale, tx: S.tx, ty: S.ty, zoom: S.zoom, panX: S.panX, panY: S.panY, titleOn: S.titleOn, endOn: S.endOn, hook: S.hook, speaker: S.speaker, salt: S.salt, p0: S.p0, p1: S.p1 };
  }
  function apply(raw, keepTrim) {
    const c = Y.clampStyle(raw);
    const trim = keepTrim ? { p0: S.p0, p1: S.p1, hook: S.hook, speaker: S.speaker, aspect: S.aspect, titleOn: S.titleOn, endOn: S.endOn, salt: S.salt } : null;
    Object.assign(S, c);
    if (trim) Object.assign(S, trim, { cap: c.cap, theme: c.theme, font: c.font, vbg: c.vbg, music: c.music, zoom: c.zoom, tx: 0, ty: 0, scale: 1, panX: null, panY: null });
  }
  function storageKey() { return "sol-clip:" + S.talkId + ":" + (S.momentId || "sel"); }
  function saveLocal() { try { localStorage.setItem(storageKey(), Y.encode(flat())); } catch (e) {} }
  function writeUrl() {
    const u = new URL(location.href);
    if (S.momentId) u.searchParams.set("m", S.talkId + ":" + S.momentId);
    u.searchParams.set("st", Y.encode(flat()));
    history.replaceState(null, "", u);
  }
  function shareHref() { const u = new URL(location.href); u.searchParams.delete("media"); if (S.momentId) u.searchParams.set("m", S.talkId + ":" + S.momentId); u.searchParams.set("st", Y.encode(flat())); return u.href; }
  function touch() {
    const s = Y.encode(flat()); if (s === curSnap) { paint(); return; }
    if (!restoring && pending == null) pending = curSnap;
    curSnap = s; lastCh = Date.now(); saveLocal(); writeUrl(); paint(); sync();
  }
  setInterval(() => { if (pending != null && Date.now() - lastCh > 420) { if (pending && pending !== curSnap) { undo.push(pending); if (undo.length > 50) undo.shift(); redo.length = 0; } pending = null; sync(); } }, 160);
  function restore(encoded) { restoring = true; const prev = S.p0 + ":" + S.p1; apply(Y.decode(encoded), false); curSnap = Y.encode(flat()); restoring = false; saveLocal(); writeUrl(); sync(); if (S.clip) paint(); if (prev !== S.p0 + ":" + S.p1) scheduleRebuild(); }
  function mus() { return C.MUSIC.find(m => m.id === S.music) || { id: "none", name: "No music" }; }
  function talkLink() { return (window.CONF && CONF.site_url ? CONF.site_url : "https://sixmonthsoflight.com/") + "talks/" + S.talkId + ".html"; }
  function words() { return S.moment ? S.moment.text.split(/\s+/).filter(Boolean) : (S.selWords || []); }
  function own() { return Y.ownWords(S.hook, S.moment ? S.moment.text : words().join(" ")); }
  function audioLead() { return S.titleOn ? +(Y.TITLE_DUR - Y.TITLE_FADE).toFixed(2) : 0; }
  function lead() { return audioLead(); }
  function tail() { return S.endOn ? Y.END_DUR : 0; }
  function baseOpts() {
    const m = mus();
    return { speaker: S.speaker || (S.talk && S.talk.speaker) || "", title: S.talk ? S.talk.title : "", cap: S.cap, theme: S.theme, font: S.font, scale: S.scale, tx: S.tx, ty: S.ty, zoom: S.zoom, panX: S.panX, panY: S.panY, vbg: S.vbg, vop: S.vop, musicCredit: m.attr ? m.credit : "", hook: S.hook, own: own(), url: talkLink(), guides: S.guides && !S.exporting && !S.playing };
  }
  function speechOpts() { return Object.assign(baseOpts(), { timed: S.clip ? S.clip.timed : [], captions: true, dur: S.clip ? S.clip.dur : 0, fin: S.clip && S.clip.fin, fout: S.clip && S.clip.fout, phase: null }); }
  function toast(msg) { const t = $("ceToast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 3200); }
  function fit() {
    const [W, H] = C.ASPECTS[S.aspect] || C.ASPECTS.story;
    const st = $("ceStage"), maxW = Math.max(80, st.clientWidth), maxH = Math.max(80, st.clientHeight), r = W / H;
    let w = maxW, h = w / r; if (h > maxH) { h = maxH; w = h * r; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.max(2, Math.round(w * dpr)), ch = Math.max(2, Math.round(h * dpr));
    if (cv.width !== cw) cv.width = cw; if (cv.height !== ch) cv.height = ch;
    $("ceWrap").style.width = Math.round(w) + "px"; $("ceWrap").style.height = Math.round(h) + "px";
  }
  function paintAt(phase, time) {
    if (!S.clip && phase === "speech") { ctx.fillStyle = "#0d1326"; ctx.fillRect(0, 0, cv.width || 1080, cv.height || 1920); return; }
    fit();
    const video = S.mediaOk && S.pl ? S.pl.v : null;
    if (phase === "title") C.draw(ctx, cv.width, cv.height, Object.assign(baseOpts(), { phase: "title" }), 0, null);
    else if (phase === "end") C.draw(ctx, cv.width, cv.height, Object.assign(baseOpts(), { phase: "end" }), 0, null);
    else C.draw(ctx, cv.width, cv.height, speechOpts(), time == null ? (S.clip ? Math.min(S.clip.speech[1], S.clip.dur * .35) : 0) : time, video);
  }
  function paint() { if (S.playing) return; paintAt(S.view, S.view === "speech" && S.clip ? Math.min(S.clip.speech[1], Math.max(S.clip.speech[0] + .2, S.clip.dur * .35)) : 0); }
  function sync() {
    $("ceUndo").disabled = !undo.length; $("ceRedo").disabled = !redo.length;
    document.querySelectorAll("#cePhase button").forEach(b => b.setAttribute("aria-pressed", b.dataset.ph === S.view));
    document.querySelectorAll("#ceTools button").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === S.tool));
    document.querySelectorAll("#ceStrip .ce-t").forEach(b => {
      if (b.dataset.kind === "moment") b.setAttribute("aria-pressed", String(S.salt === (S._baseSalt || 0) && S.cap === S._base.cap));
      else { const p = Y.NAMED[+b.dataset.i][1]; b.setAttribute("aria-pressed", p.cap === S.cap && p.theme === S.theme && p.font === S.font && p.vbg === S.vbg); }
    });
    document.querySelectorAll("[data-set]").forEach(b => { const [k, v] = b.dataset.set.split("="); b.setAttribute("aria-pressed", String(S[k]) === v); });
    const lic = $("ceLic"); if (lic) { const m = mus(); lic.innerHTML = m.credit ? `Music: <b>${esc(m.name)}</b> · ${esc(m.credit)} · <a href="${esc(m.lurl)}" target="_blank" rel="noopener">${esc(m.license)}</a>` : "No background music."; }
    const mute = $("ceMute"); if (mute) mute.checked = S.music === "none";
    const ownEl = $("ceOwn"); if (ownEl) ownEl.hidden = !own();
    const marked = $("ceMarked"); if (marked) {
      const w = words(), a = Math.max(0, S.p0), b = Math.min(w.length - 1, S.p1);
      marked.innerHTML = esc(w.slice(Math.max(0, a - 6), a).join(" ")) + " <mark>" + esc(w.slice(a, b + 1).join(" ")) + "</mark> " + esc(w.slice(b + 1, Math.min(w.length, b + 8)).join(" "));
    }
  }
  function sheetHTML(k) {
    if (k === "style") return ["Caption style", `<p class="ce-help">Official words only. Word highlight uses white words, with the current word in the theme color.</p><div class="ce-row">
      ${swatch("cap=highlight", "Word highlight", "Aa")}${swatch("cap=pill", "Pill", "▢")}${swatch("cap=pop", "Big word", "A")}${swatch("cap=lower", "Lower third", "▬")}</div>`];
    if (k === "text") return ["Text", `<label class="ce-chk"><input type="checkbox" id="ceTitle" ${S.titleOn ? "checked" : ""}> 1 second title card, fading into the talk</label>
      <label class="ce-field">Hook on the title card<textarea id="ceHook" rows="3" maxlength="280">${esc(S.hook)}</textarea></label>
      <p class="ce-help">A short hook is shown. If it is too long for a one-second card, the talk title is shown instead, without quote marks.</p>
      <p class="ce-own" id="ceOwn" ${own() ? "" : "hidden"}>Your own words · added by the sharer, not a quote. It is labeled on the title card when the hook fits.</p>
      <label class="ce-field">Speaker<input id="ceSpeaker" type="text" maxlength="80" value="${esc(S.speaker)}"></label>
      <h3>Font</h3><div class="ce-row">${swatch("font=serif", "Serif", `<span style="font-family:var(--serif);font-size:20px">Aa</span>`)}${swatch("font=italic", "Italic", `<span style="font-family:var(--serif);font-style:italic;font-size:20px">Aa</span>`)}${swatch("font=sans", "Sans", `<span style="font-size:18px">Aa</span>`)}</div>
      <label class="ce-field">Text size <input id="ceScale" type="range" min="70" max="170" value="${Math.round(S.scale * 100)}"></label>
      <p class="ce-help">Drag the words on the preview. Guides show the Reels and TikTok safe zone.</p>`];
    if (k === "color") return ["Color theme", `<div class="ce-row">${Y.THEMES.map(id => swatch("theme=" + id, id[0].toUpperCase() + id.slice(1), dot(THEME_DOT[id]))).join("")}</div>`];
    if (k === "music") return ["Music", `<p class="ce-help">Each look starts with a bed that fits its mood. Music ducks under the speaker. CC BY lines are burned into the video and listed on the credits page.</p>
      <label class="ce-chk"><input type="checkbox" id="ceMute" ${S.music === "none" ? "checked" : ""}> No music</label>
      <div class="ce-row">${C.MUSIC.filter(m => m.id !== "none").map(m => `<button type="button" class="ce-sw ce-mus" data-set="music=${m.id}"><span>♪</span><span>${esc(m.name.replace(/\s*\(synth\)/, ""))}</span><small>${esc((m.mood || "").split(" · ")[0])}</small><b class="ce-hear" data-hear="${m.id}" aria-label="Preview ${esc(m.name)}">▶</b></button>`).join("")}</div>
      <label class="ce-field">Volume <input id="ceVol" type="range" min="0" max="80" step="5" value="${Math.round(S.vol * 100)}"></label><p class="ce-lic" id="ceLic"></p>`];
    if (k === "look") return ["Video look", `<div class="ce-row">${[["full", "Full"], ["blur", "Soft blur"], ["dim", "Dimmed"], ["duotone", "Duotone"]].map(([id, n]) => swatch("vbg=" + id, n, "▣")).join("")}</div>
      <label class="ce-field">Look strength <input id="ceVop" type="range" min="10" max="100" step="5" value="${Math.round(S.vop * 100)}"></label>
      <label class="ce-field">Zoom <input id="ceZoom" type="range" min="100" max="180" value="${Math.round(S.zoom * 100)}"></label>
      <label class="ce-field">Crop sideways <input id="cePanX" type="range" min="0" max="100" value="${Math.round((S.panX == null ? .5 : S.panX) * 100)}"></label>
      <label class="ce-field">Crop up and down <input id="cePanY" type="range" min="0" max="100" value="${Math.round((S.panY == null ? .4 : S.panY) * 100)}"></label>
      <p class="ce-help">The safe-zone guides are for Reels and TikTok. They are not saved into the video.</p>`];
    if (k === "trim") return ["Trim", `<p class="ce-help">Start and end snap to official words. ${S.clip ? S.clip.dur.toFixed(1) + " s of speech." : ""}</p><div class="ce-words" id="ceMarked"></div>
      <div class="ce-nudge"><button type="button" data-n="s-">Start − word</button><button type="button" data-n="s+">Start + word</button><button type="button" data-n="e-">End − word</button><button type="button" data-n="e+">End + word</button></div>`];
    if (k === "size") return ["Shape", `<div class="ce-row">${Object.entries(C.ASPECTS).map(([k, a]) => swatch("aspect=" + k, a[2], a[2].split(" ")[0])).join("")}</div>
      <label class="ce-chk"><input type="checkbox" id="ceEnd" ${S.endOn ? "checked" : ""}> End card with the talk link and QR</label>
      <p class="ce-help">End card links to ${esc(talkLink())}.</p>
      <h3>Video hosting</h3><p class="ce-help">The editor reads <code>{talk-id}.mp4</code> from <code>window.CLIP_MEDIA_BASE</code> (set in assets/config.js), on the same timeline as the word timings. The bucket allows https://sixmonthsoflight.com, https://www.sixmonthsoflight.com, and http://localhost:8000, and it answers range requests. Other origins, including 127.0.0.1, are refused. The Church CDN does not send CORS, so a canvas export cannot use it. Another origin can pass <code>?media=media/</code> for a same-origin folder.</p>`];
    return ["Style", ""];
  }
  function openTool(k) {
    if (S.tool === k) { closeTool(); return; }
    S.tool = k; S.guides = k === "text" || k === "look" || k === "size";
    const [title, html] = sheetHTML(k); $("ceShT").textContent = title; $("ceShB").innerHTML = html; $("ceSheet").hidden = false; sync(); paint();
  }
  function refreshTool() { if (!S.tool) return; const [title, html] = sheetHTML(S.tool); $("ceShT").textContent = title; $("ceShB").innerHTML = html; sync(); }
  function closeTool() { S.tool = null; S.guides = false; $("ceSheet").hidden = true; sync(); paint(); }
  function presetStrip() {
    const moment = `<button type="button" class="ce-t" data-kind="moment"><i style="background:#0d1326"></i><span>This moment</span></button>`;
    $("ceStrip").innerHTML = moment + Y.NAMED.map(([n, p], i) => `<button type="button" class="ce-t" data-kind="named" data-i="${i}"><i style="background:${THEME_DOT[p.theme] || "#0d1326"}"></i><span>${esc(n)}</span></button>`).join("");
  }
  let rebuildT = 0;
  function scheduleRebuild() { clearTimeout(rebuildT); rebuildT = setTimeout(rebuild, 60); }
  function wireMedia() {
    S.mediaOk = false; const v = S.pl && S.pl.v; if (!v) return;
    const fail = (why) => { if (S.mediaOk) return; S.mediaMsg = why; showMiss(); paint(); };
    v.addEventListener("error", () => fail("error"));
    v.addEventListener("loadeddata", () => { if (v.videoWidth) { S.mediaOk = true; $("ceMiss").hidden = true; paint(); if (!S.didAuto && !matchMedia("(prefers-reduced-motion: reduce)").matches) { S.didAuto = true; play(); } } });
    S.pl.ready().then(() => { if (v.videoWidth) { S.mediaOk = true; $("ceMiss").hidden = true; const at = S.clip.at0 + Math.min(S.clip.dur * .35, S.clip.speech[1]); S.pl.seekTo(at).then(() => { if (!S.playing) paint(); }); } }).catch(() => fail("timeout"));
    setTimeout(() => { if (!S.mediaOk && v.readyState < 2) fail("timeout"); }, 7000);
  }
  function showMiss() {
    const off = S.talk && S.talk.official_url;
    $("ceMiss").hidden = false;
    $("ceMiss").innerHTML = `<b>The talk video isn’t reachable from this browser.</b> Captions and the SRT file still use the official words. Export needs a CORS-enabled copy of <code>${esc(S.talkId)}.mp4</code> at <code>CLIP_MEDIA_BASE</code>, with the same timeline as the timings and HTTP range requests. ${off ? `<a href="${esc(off)}" target="_blank" rel="noopener">Watch the official talk</a> · ` : ""}<a href="${esc(talkLink())}">This talk on Six Months of Light</a>`;
  }
  async function rebuild() {
    const tok = ++S.tok, w = words(); if (!w.length) return;
    S.p0 = Math.max(0, Math.min(S.p0, w.length - 1)); S.p1 = Math.max(S.p0, Math.min(S.p1 | 0, w.length - 1));
    const fades = { fin: .35, fout: .45, mfin: .35, mfout: .55 };
    let clip;
    try {
      if (S.moment && S.moment.idx && S.moment.idx.length === w.length) clip = await C.clipForSpan({ talk: S.talkId, words: w, map: S.moment.idx }, S.p0, S.p1, fades, 100);
      else clip = await C.clipFor(S.talkId, w.slice(S.p0, S.p1 + 1).join(" "), fades, 100);
    } catch (e) { toast(e.message || "Couldn’t cut that passage."); return; }
    if (tok !== S.tok) return;
    if (S.pl) S.pl.stop();
    S.clip = clip; S.pl = C.player(clip); S.pl.music = "none"; S.pl.vol = 0; wireMedia(); sync(); paint();
  }
  function stopPlay() { S.playing = false; if (S.pl) S.pl.stop(); if (bed) { bed.pause(); } $("cePlay").hidden = false; }
  function ensureBed() {
    const m = mus(); if (!m.file) { if (bed) bed.pause(); return null; }
    if (!bed || bed.dataset.id !== m.id) { if (bed) bed.pause(); bed = new Audio(m.file); bed.dataset.id = m.id; bed.loop = true; bed.preload = "auto"; }
    return bed;
  }
  function duck(speechT, on) {
    if (!bed) return; if (!on) { bed.volume = S.vol; return; }
    const ws = (S.clip && S.clip.words) || []; let speaking = false;
    for (let i = 0; i < ws.length; i++) if (speechT >= ws[i].s - .05 && speechT <= ws[i].e + .08) { speaking = true; break; }
    bed.volume = speaking ? S.vol * .2 : S.vol * .45;
  }
  function runFor(sec, draw) { return new Promise(resolve => { const t0 = performance.now(); const loop = () => { const t = (performance.now() - t0) / 1000; if (!S.playing || t >= sec) return resolve(); draw(t); requestAnimationFrame(loop); }; loop(); }); }
  function paintTitleOver(alpha) {
    if (alpha <= .01) return; ctx.save(); ctx.globalAlpha = alpha;
    C.draw(ctx, cv.width, cv.height, Object.assign(baseOpts(), { phase: "title", guides: false }), 0, null); ctx.restore();
  }
  async function play(opts) {
    const again = opts && opts.again;
    if (S.busy || !S.clip) return;
    if (!again) { stopPlay(); S.playing = true; $("cePlay").hidden = true; S.guides = false;
      ensureBed(); if (bed && S.music !== "none") { try { bed.currentTime = 0; bed.volume = S.vol; await bed.play(); } catch (e) {} } }
    const pre = again ? 0 : audioLead(), fade = !again && S.titleOn ? Y.TITLE_FADE : 0;
    if (!again && S.titleOn && pre > 0) await runFor(pre, () => paintAt("title", 0));
    if (!S.playing) return;
    if (S.mediaOk) { try { if (again) await S.pl.seekTo(S.pl.at0); await S.pl.start(); } catch (e) { toast(e.message || "Couldn’t play the video."); stopPlay(); paint(); return; } }
    else if (!again) toast("Playing captions only. The talk video isn’t reachable.");
    if (fade > 0) await runFor(fade, t => { const st = S.mediaOk ? S.pl.t() : t; duck(st, true); paintAt("speech", st); paintTitleOver(1 - t / fade); });
    if (!S.playing) return;
    if (S.mediaOk) {
      await new Promise(resolve => { const loop = () => { if (!S.playing) return resolve(); const t = S.pl.t(); duck(t, true); paintAt("speech", t); if (S.pl.ended() || t >= S.clip.dur - .02) return resolve(); requestAnimationFrame(loop); }; loop(); });
      if (S.pl) S.pl.stop();
    } else await runFor(Math.max(0, Math.min(8, S.clip.dur) - fade), t => { duck(t + fade, true); paintAt("speech", t + fade); });
    if (S.endOn && S.playing && !again) await runFor(Math.min(1.15, tail()), t => { if (bed) bed.volume = S.vol * Math.max(0, 1 - t / Math.min(1.15, tail())); paintAt("end", 0); });
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (S.playing && S.mediaOk && !S.exporting && !reduce) return play({ again: true });
    stopPlay(); paint();
  }
  async function mixAudio(octx, sb, pre, post) {
    const speechDur = S.clip.dur, vEnd = S.clip.vEnd ?? speechDur, outDur = pre + speechDur + post;
    const s = octx.createBufferSource(), vg = octx.createGain(); s.buffer = sb; s.connect(vg); vg.connect(octx.destination);
    const g = vg.gain; g.setValueAtTime(0, 0); g.setValueAtTime(0, Math.max(0, pre)); g.linearRampToValueAtTime(1, pre + .08); g.setValueAtTime(1, pre + Math.max(.12, vEnd - .25)); g.linearRampToValueAtTime(0, pre + vEnd); s.start(Math.max(0, pre));
    const m = mus(); if (!m.file) return;
    const ab = await (await fetch(m.file)).arrayBuffer(), mb = await octx.decodeAudioData(ab.slice(0)), ms = octx.createBufferSource(), mg = octx.createGain();
    ms.buffer = mb; ms.loop = true; ms.connect(mg); mg.connect(octx.destination);
    const vol = S.vol, low = vol * .2, gg = mg.gain, ws = S.clip.words || [];
    const s0 = ws.length ? ws[0].s : .2, e0 = ws.length ? ws[ws.length - 1].e : speechDur;
    gg.setValueAtTime(0, 0); gg.linearRampToValueAtTime(vol, Math.min(.55, Math.max(.2, pre || .4))); gg.setValueAtTime(vol, pre); gg.linearRampToValueAtTime(low, pre + Math.max(.08, s0));
    for (let i = 1; i < ws.length; i++) { const gap = ws[i].s - ws[i - 1].e; if (gap > .7) { const a = pre + ws[i - 1].e; gg.setValueAtTime(low, a); gg.linearRampToValueAtTime(vol * .45, a + Math.min(.35, gap / 2)); gg.linearRampToValueAtTime(low, pre + ws[i].s - .05); } }
    gg.setValueAtTime(low, pre + Math.min(e0, speechDur)); gg.linearRampToValueAtTime(vol * .65, Math.min(outDur - .25, pre + speechDur + .2)); gg.linearRampToValueAtTime(0, Math.max(.05, outDur - .02));
    ms.start(0);
  }
  function drawExport(c, w, h, t, frame) {
    const pre = audioLead(), fade = S.titleOn ? Y.TITLE_FADE : 0, titleEnd = pre + fade, dur = S.clip.dur;
    if (S.endOn && t > pre + dur - .001) { C.draw(c, w, h, Object.assign(baseOpts(), { phase: "end", guides: false }), 0, null); return; }
    if (t + 1e-4 >= pre) C.draw(c, w, h, Object.assign(speechOpts(), { guides: false }), Math.max(0, t - pre), frame);
    if (S.titleOn && t < titleEnd - .001) {
      const u = t <= pre ? 0 : Math.min(1, (t - pre) / Math.max(.05, fade));
      c.save(); c.globalAlpha = 1 - u; C.draw(c, w, h, Object.assign(baseOpts(), { phase: "title", guides: false }), 0, null); c.restore();
    }
  }
  async function exportMp4() {
    if (S.busy || !S.clip) return null;
    if (!S.mediaOk) { toast("Can’t export until the talk video loads. You can still download the SRT."); showMiss(); return null; }
    S.busy = true; S.exporting = true; stopPlay(); $("ceProg").hidden = false; $("ceSave").disabled = true;
    const [W, H] = C.ASPECTS[S.aspect];
    const setP = p => { $("ceProg").hidden = false; $("ceProgT").textContent = "Saving… " + Math.round(p * 100) + "%"; $("ceProgI").style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + "%"; };
    try {
      let blob = null;
      if (window.ClipCut && await ClipCut.supported()) {
        try { blob = await ClipCut.make({ src: S.clip.src, clip: S.clip, W, H, lead: lead(), tail: tail(), draw: drawExport, mix: (octx, sb) => mixAudio(octx, sb, lead(), tail()), onP: setP }); }
        catch (e) { console.warn("exact export failed", e); blob = null; }
      }
      if (!blob) {
        setP(0); S.pl.music = S.music; S.pl.vol = S.vol; S.playing = true;
        const loop = () => { if (S.playing) { paintAt("speech", S.pl.t()); requestAnimationFrame(loop); } };
        loop(); blob = await C.record(cv, S.pl, S.clip, setP); S.playing = false; S.pl.music = "none";
        toast("Saved the spoken moment in real time. Title and end cards need the faster exporter.");
      }
      return blob;
    } catch (e) { toast(e.message || "Export failed."); return null; }
    finally { S.busy = false; S.exporting = false; $("ceProg").hidden = true; $("ceSave").disabled = false; paint(); }
  }
  function download(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
  function srtText() { if (!S.clip) return ""; return Y.srt(S.clip.timed, lead()); }
  function fileBase() { return "six-months-of-light-" + S.talkId + (S.momentId ? "-" + S.momentId : "") + "-" + S.aspect; }

  root.addEventListener("click", e => {
    const tool = e.target.closest("[data-tool]"); if (tool) { openTool(tool.dataset.tool); return; }
    const ph = e.target.closest("[data-ph]"); if (ph) { stopPlay(); S.view = ph.dataset.ph; sync(); paint(); return; }
    const named = e.target.closest(".ce-t"); if (named) {
      if (named.dataset.kind === "moment" && S._base) { const b = S._base; S.cap = b.cap; S.theme = b.theme; S.font = b.font; S.vbg = b.vbg; S.music = b.music; S.zoom = b.zoom; S.salt = S._baseSalt; S.tx = 0; S.ty = 0; S.scale = 1; S.panX = null; S.panY = null; }
      else if (named.dataset.i != null) { const p = Y.NAMED[+named.dataset.i][1]; Object.assign(S, p); S.tx = 0; S.ty = 0; S.scale = 1; S.panX = null; S.panY = null; toast(Y.NAMED[+named.dataset.i][0]); }
      touch(); refreshTool(); return;
    }
    const hear = e.target.closest("[data-hear]"); if (hear) { e.preventDefault(); e.stopPropagation(); const m = C.MUSIC.find(x => x.id === hear.dataset.hear); if (m && m.file) { if (window.__bedPrev) window.__bedPrev.pause(); const a = window.__bedPrev = new Audio(m.file); a.volume = .8; a.play().catch(() => {}); setTimeout(() => { if (window.__bedPrev === a) a.pause(); }, 9000); } return; }
    const set = e.target.closest("[data-set]"); if (set && set.closest("#ceSheet")) { const [k, v] = set.dataset.set.split("="); S[k] = v; if (k === "music" && v !== "none") S.musicWas = v; if (k === "aspect") fit(); touch(); sync(); return; }
    const n = e.target.closest("[data-n]"); if (n) { const w = words(), k = n.dataset.n;
      if (k === "s-") S.p0 = Math.max(0, S.p0 - 1); if (k === "s+") S.p0 = Math.min(S.p1, S.p0 + 1);
      if (k === "e-") S.p1 = Math.max(S.p0, S.p1 - 1); if (k === "e+") S.p1 = Math.min(w.length - 1, S.p1 + 1);
      touch(); scheduleRebuild(); return; }
  });
  root.addEventListener("input", e => {
    const t = e.target;
    if (t.id === "ceHook") S.hook = t.value.slice(0, 280);
    else if (t.id === "ceSpeaker") S.speaker = t.value.slice(0, 80);
    else if (t.id === "ceScale") S.scale = +t.value / 100;
    else if (t.id === "ceVol") { S.vol = +t.value / 100; if (bed && !S.playing) bed.volume = S.vol; }
    else if (t.id === "ceVop") S.vop = +t.value / 100;
    else if (t.id === "ceZoom") S.zoom = +t.value / 100;
    else if (t.id === "cePanX") S.panX = +t.value / 100;
    else if (t.id === "cePanY") S.panY = +t.value / 100;
    else return;
    touch();
  });
  root.addEventListener("change", e => {
    if (e.target.id === "ceTitle") { S.titleOn = e.target.checked; touch(); }
    if (e.target.id === "ceEnd") { S.endOn = e.target.checked; touch(); }
    if (e.target.id === "ceMute") {
      if (e.target.checked) { if (S.music !== "none") S.musicWas = S.music; S.music = "none"; }
      else S.music = S.musicWas || (S._base && S._base.music) || "lasting-hope";
      touch(); sync();
    }
  });
  $("ceShX").addEventListener("click", closeTool);
  $("ceUndo").addEventListener("click", () => { if (pending != null) { undo.push(pending); pending = null; } if (!undo.length) return; redo.push(Y.encode(flat())); restore(undo.pop()); });
  $("ceRedo").addEventListener("click", () => { if (!redo.length) return; undo.push(Y.encode(flat())); restore(redo.pop()); });
  $("ceShuffle").addEventListener("click", () => { S.salt = (S.salt | 0) + 1; const p = Y.mix(S.momentId || S.hook || S.talkId, S.salt); Object.assign(S, p); S.tx = 0; S.ty = 0; S.scale = 1; toast(Y.lookName(S.salt)); touch(); refreshTool(); });
  $("cePlay").addEventListener("click", play);
  cv.addEventListener("click", e => { if (drag && drag.moved) return; S.playing ? stopPlay() || paint() : play(); });
  cv.addEventListener("pointerdown", e => { if (S.playing) return; drag = { x: e.clientX, y: e.clientY, tx: S.tx, ty: S.ty, moved: false }; S.guides = true; try { cv.setPointerCapture(e.pointerId); } catch (err) {} paint(); });
  cv.addEventListener("pointermove", e => { if (!drag) return; const r = cv.getBoundingClientRect(); const dx = (e.clientX - drag.x) / r.width, dy = (e.clientY - drag.y) / r.height; if (Math.abs(dx) + Math.abs(dy) < .004) return; drag.moved = true; S.tx = Math.max(-.2, Math.min(.2, drag.tx + dx)); S.ty = Math.max(-.4, Math.min(.3, drag.ty + dy)); if (Math.abs(S.tx) < .012) S.tx = 0; paint(); });
  const endDrag = () => { if (!drag) return; const moved = drag.moved; drag = null; if (!S.tool) S.guides = false; if (moved) touch(); else paint(); };
  cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  $("ceSrt").addEventListener("click", () => { if (!S.clip) return; download(new Blob([srtText()], { type: "text/plain" }), fileBase() + ".srt"); toast("Captions downloaded"); });
  $("ceLink").addEventListener("click", async () => { const href = shareHref(); try { await navigator.clipboard.writeText(href); toast("Link copied"); } catch (e) { toast(href); } });
  $("ceSave").addEventListener("click", async () => { const blob = await exportMp4(); if (!blob) return; const ext = blob.type.includes("mp4") ? "mp4" : "webm"; download(blob, fileBase() + "." + ext); toast("Saved · " + (blob.size / 1048576).toFixed(1) + " MB"); });
  addEventListener("keydown", e => { const meta = e.metaKey || e.ctrlKey; if (!meta) return; if (e.key === "z" && !e.shiftKey) { e.preventDefault(); $("ceUndo").click(); } if (e.key === "z" && e.shiftKey || e.key === "y") { e.preventDefault(); $("ceRedo").click(); } });
  new ResizeObserver(fit).observe($("ceStage"));
  addEventListener("resize", () => { if (matchMedia("(min-width: 980px)").matches && !S.tool) openTool("style"); });

  function bootStyle(base) {
    S._base = base; S._baseSalt = base.salt;
    let next = Object.assign({}, base);
    const local = (() => { try { return localStorage.getItem(storageKey()); } catch (e) { return null; } })();
    if (!Q.get("st") && local) next = Object.assign(next, Y.decode(local));
    if (Q.get("st")) next = Object.assign(next, Y.decode(Q.get("st")));
    apply(next, false);
    if (!S.hook) S.hook = base.hook;
    if (!S.speaker) S.speaker = base.speaker;
  }
  async function start() {
    const raw = Q.get("m") || "";
    const [tid, mid] = raw.split(":");
    const sel = Q.get("sel") || "";
    S.talkId = tid || Q.get("t") || "";
    S.momentId = mid || "";
    S.talk = talkById(S.talkId);
    if (!S.talk) { $("ceName").textContent = "Pick a moment"; $("ceMiss").hidden = false; $("ceMiss").innerHTML = `Choose a moment from the <a href="moments.html">gallery</a>, or <a href="video.html">paste a quote</a>.`; return; }
    let data = null;
    try { data = await (await fetch("assets/moments.json")).json(); } catch (e) { data = { talks: {} }; }
    const list = (data.talks && data.talks[S.talkId]) || [];
    S.moment = list.find(m => m.id === S.momentId) || null;
    if (!S.moment && sel) { S.selWords = sel.replace(/\s+/g, " ").trim().split(" ").filter(Boolean); S.momentId = ""; }
    if (!S.moment && !S.selWords) { location.href = "moments.html?t=" + encodeURIComponent(S.talkId); return; }
    const w = words();
    const salt = S.moment ? Y.baseSalt(list, S.moment.id) : 0;
    const look = Y.mix(S.moment ? S.moment.id : (S.talkId + ":" + (S.selWords || []).slice(0, 8).join(" ")), salt);
    const base = Object.assign({ vol: .35, vop: .62, aspect: "story", scale: 1, tx: 0, ty: 0, panX: null, panY: null, titleOn: true, endOn: true, salt, p0: 0, p1: Math.max(0, w.length - 1), hook: S.moment ? S.moment.hook : w.slice(0, 18).join(" "), speaker: S.talk.speaker }, look);
    bootStyle(base);
    if (S.p1 < S.p0) S.p1 = w.length - 1;
    $("ceName").textContent = S.talk.speaker.split(" ").slice(-1)[0] + " · " + (S.hook || S.talk.title);
    document.title = (S.hook || "Clip").slice(0, 72) + " · Six Months of Light";
    presetStrip(); curSnap = Y.encode(flat()); writeUrl();
    if (matchMedia("(min-width: 980px)").matches) openTool("style");
    await document.fonts.ready.catch(() => {});
    await rebuild();
    window.ClipEditor = { exportMp4, srt: srtText, state: () => Object.assign(flat(), { mediaOk: S.mediaOk, talkId: S.talkId, momentId: S.momentId, dur: S.clip && S.clip.dur }) };
  }
  start().catch(e => toast(e.message || "Couldn’t open this clip."));
})();
