// "Make a video": paste any quote -> we find the talk and the exact words -> preview -> Share.
mount("video.html", true);
(function () {
  const C = window.ClipKit, M = window.ClipMatch, Q = new URLSearchParams(location.search), $ = s => document.querySelector(s);
  if (Q.get("sel")) {
    const u = new URL("clip.html", location.href);
    if (Q.get("t")) u.searchParams.set("t", Q.get("t"));
    u.searchParams.set("sel", Q.get("sel"));
    location.replace(u.pathname.replace(/^\//, "") + u.search);
    return;
  }
  const FL = [["off", "Off"], ["short", "Short"], ["medium", "Medium"], ["long", "Long"]], FV = C.FADES;
  const S = { m: null, p0: 0, p1: 0, clip: null, pl: null, aspect: "story", music: "dreamy-flashback", vol: .35, captions: true, vbg: "full",
    f: { vin: "short", vout: "medium", min: "short", mout: "medium" }, link: true, playing: false, busy: false, file: null, tok: 0 };
  const segH = (id, items, label) => `<div class="seg" id="${id}" role="group" aria-label="${label}">${items.map(([k, n]) => `<button type="button" data-k="${k}">${n}</button>`).join("")}</div>`;
  document.getElementById("main").innerHTML = `
  <section class="mv">
    <h1 class="mv-h">Paste a line</h1>
    <p class="mv-sub">Paste a line from any October 2026 talk. We'll find it and open it in the video editor. To choose a video or a picture card, start at <a href="create.html">${esc(window.CREATE_NAME || "Share light")}</a>.</p>
    <div class="mv-in"><textarea id="mvQ" rows="3" placeholder="Paste a quote here…" aria-label="Quote"></textarea>
      <div class="mv-in-btns"><button type="button" class="btn secondary small" id="mvPaste">Paste</button><button type="button" class="btn secondary small" id="mvClear">Clear</button></div></div>
    <p class="mv-msg" id="mvMsg" aria-live="polite"></p>
    <div id="mvRes" hidden>
      <div class="mv-src" id="mvSrc"></div>
      <div class="mv-stage"><canvas id="mvCv" aria-label="Video preview"></canvas><button type="button" class="mv-play" id="mvPlay" aria-label="Play preview">▶</button></div>
      <div class="mv-act"><button type="button" class="btn gold big" id="mvMake">Make video</button></div>
      <div class="mv-act" id="mvDone" hidden><button type="button" class="btn gold big" id="mvShare">Share</button><button type="button" class="btn secondary" id="mvSave">Save</button></div>
      <div class="mv-words"><div class="b-label">Words in the video</div><p id="mvText" class="mv-text"></p>
        <div class="mv-nudge"><span>Start</span><button type="button" data-n="s-">− word</button><button type="button" data-n="s+">+ word</button>
          <span>End</span><button type="button" data-n="e-">− word</button><button type="button" data-n="e+">+ word</button></div></div>
      <details class="mv-more"><summary>More options</summary>
        <div class="b-label">Shape</div>${segH("mvAspect", Object.entries(C.ASPECTS).map(([k, a]) => [k, a[2]]), "Shape")}
        <div class="b-label">Music</div>${segH("mvMusic", C.MUSIC.map(m => [m.id, esc(m.name)]), "Music")}
        <label class="b-label" for="mvVol">Music volume</label><input type="range" id="mvVol" min="0" max="80" step="5" value="35">
        <div class="b-label">Video fade in</div>${segH("mvFvin", FL, "Video fade in")}
        <div class="b-label">Video fade out</div>${segH("mvFvout", FL, "Video fade out")}
        <label class="chk"><input type="checkbox" id="mvLink" checked> Music fades match the video</label>
        <div id="mvMF" hidden><div class="b-label">Music fade in</div>${segH("mvFmin", FL, "Music fade in")}<div class="b-label">Music fade out</div>${segH("mvFmout", FL, "Music fade out")}</div>
        <div class="b-label">Video look</div>${segH("mvVbg", [["full", "Full"], ["blur", "Soft blur"], ["dim", "Dimmed"], ["duotone", "Duotone"]], "Video look")}
        <label class="chk"><input type="checkbox" id="mvCap" checked> Light up words as they're spoken</label>
        <p class="b-help" id="mvLic"></p></details>
    </div>
  </section>`;
  const cv = $("#mvCv"), ctx = cv.getContext("2d"), msg = t => $("#mvMsg").textContent = t;
  const fades = () => { const f = S.f, mi = S.link ? f.vin : f.min, mo = S.link ? f.vout : f.mout; return { fin: FV[f.vin], fout: FV[f.vout] || .3, mfin: FV[mi], mfout: FV[mo] || .3 }; };
  const mus = () => C.MUSIC.find(m => m.id === S.music) || {};
  const opts = () => { const t = talkById(S.m.talk); return { timed: S.clip.timed, speaker: t.speaker, title: t.title, captions: S.captions, vbg: S.vbg, vop: .6, musicCredit: mus().attr ? mus().credit : "", dur: S.clip.dur, fin: S.clip.fin, fout: S.clip.fout }; };
  function frame() { if (!S.clip) return; const [W, H] = C.ASPECTS[S.aspect]; if (cv.width !== W) { cv.width = W; cv.height = H; } if (cv.height !== H) cv.height = H;
    C.draw(ctx, W, H, opts(), S.playing ? S.pl.t() : S.clip.speech[1], S.pl && S.pl.v); }
  const loop = () => { frame(); if (S.playing && !S.busy && S.pl.ended()) { S.playing = false; S.pl.stop(); $("#mvPlay").hidden = false; frame(); return; } if (S.playing) requestAnimationFrame(loop); };
  const seg = (id, k) => document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
  function ui() { seg("mvAspect", S.aspect); seg("mvMusic", S.music); seg("mvVbg", S.vbg); ["vin", "vout", "min", "mout"].forEach(k => seg("mvF" + k, S.f[k])); $("#mvMF").hidden = S.link;
    const m = mus(); $("#mvLic").innerHTML = m.credit ? `Music: <b>${esc(m.name)}</b> · ${esc(m.credit)} · <a href="${esc(m.lurl)}" target="_blank" rel="noopener">${esc(m.license)}</a>` : ""; }
  function showText() { const w = S.m.words, a = Math.max(0, S.p0 - 8), b = Math.min(w.length - 1, S.p1 + 8);
    $("#mvText").innerHTML = (a > 0 ? "… " : "") + esc(w.slice(a, S.p0).join(" ")) + ` <mark>${esc(w.slice(S.p0, S.p1 + 1).join(" "))}</mark> ` + esc(w.slice(S.p1 + 1, b + 1).join(" ")) + (b < w.length - 1 ? " …" : ""); }
  // (Re)build the clip from the current printed-word span. Keeps the player when the talk is the same.
  async function build() { const tok = ++S.tok; S.file = null; $("#mvDone").hidden = true; $("#mvMake").hidden = false; showText();
    let c; try { c = await C.clipForSpan(S.m, S.p0, S.p1, fades()); } catch (e) { msg(e.message); return; } if (tok !== S.tok) return;
    const same = S.pl && S.clip && S.clip.talk === c.talk; if (S.pl) S.pl.stop(); S.playing = false; S.clip = c;
    if (!same) { S.pl = C.player(c); S.pl.v.addEventListener("seeked", frame); } else S.pl = C.player(c);
    S.pl.music = S.music; S.pl.vol = S.vol; const pl = S.pl; pl.ready().then(() => { if (S.pl === pl && !S.playing) pl.seekTo(c.at0 + Math.min(c.vEnd - .1, c.speech[1])).then(frame); });
    S.pl.v.addEventListener("seeked", frame); $("#mvPlay").hidden = false; msg(`${c.dur.toFixed(1)} s video`); ui(); frame(); }
  async function find(text) { text = String(text || "").trim(); if (!text) { $("#mvRes").hidden = true; msg(""); return; }
    msg("Finding it…"); const tok = ++S.tok, m = await M.find(text, { base: window.CARDKIT_BASE || "", talk: Q.get("t") && Q.get("sel") === text ? Q.get("t") : null }).catch(() => null); if (tok !== S.tok) return;
    if (!m) { $("#mvRes").hidden = true; msg("We couldn't find that in an October 2026 talk. Try copying it again, or a shorter part."); return; }
    const t = talkById(m.talk); S.m = m; S.p0 = m.p0; S.p1 = m.p1; $("#mvRes").hidden = false;
    $("#mvSrc").innerHTML = `<span class="mv-found">Found it</span> ${esc(t.speaker)} · <a href="${esc(talkUrl(t))}">“${esc(t.title)}”</a>${m.score < .8 ? ` <span class="b-help">(close match. Check the words below.)</span>` : ""}`;
    await build(); }
  const q = $("#mvQ"); let deb; q.addEventListener("paste", () => setTimeout(() => { const c = M.clean(q.value); if (c !== q.value.trim()) q.value = c; }, 0));
  q.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => find(q.value), 450); });
  $("#mvPaste").addEventListener("click", async () => { try { q.value = M.clean(await navigator.clipboard.readText()); find(q.value); } catch (e) { q.focus(); msg("Tap and hold in the box, then choose Paste."); } });
  $("#mvClear").addEventListener("click", () => { q.value = ""; find(""); q.focus(); });
  document.querySelector(".mv-nudge").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || !S.m) return; const n = S.m.words.length, k = b.dataset.n;
    if (k === "s-") S.p0 = Math.max(0, S.p0 - 1); if (k === "s+") S.p0 = Math.min(S.p1, S.p0 + 1); if (k === "e-") S.p1 = Math.max(S.p0, S.p1 - 1); if (k === "e+") S.p1 = Math.min(n - 1, S.p1 + 1); build(); });
  const play = async () => { if (S.busy || !S.pl) return; S.pl.stop(); S.playing = true; $("#mvPlay").hidden = true; try { await S.pl.start(); } catch (e) { S.playing = false; $("#mvPlay").hidden = false; msg("Couldn't play: " + e.message); return; } loop(); };
  $("#mvPlay").addEventListener("click", play); cv.addEventListener("click", () => S.playing ? (S.pl.stop(), S.playing = false, $("#mvPlay").hidden = false) : play());
  const on = (id, f) => $("#" + id).addEventListener("click", e => { const b = e.target.closest("button"); if (b) f(b.dataset.k); });
  on("mvAspect", k => { S.aspect = k; ui(); frame(); }); on("mvMusic", k => { S.music = k; if (S.pl) S.pl.music = k; S.file = null; $("#mvDone").hidden = true; $("#mvMake").hidden = false; ui(); frame(); });
  on("mvVbg", k => { S.vbg = k; ui(); frame(); });
  ["vin", "vout", "min", "mout"].forEach(x => on("mvF" + x, k => { S.f[x] = k; if (S.link && x[0] === "v") S.f["m" + x.slice(1)] = k; build(); }));
  $("#mvLink").addEventListener("change", e => { S.link = e.target.checked; build(); });
  $("#mvVol").addEventListener("input", e => { S.vol = +e.target.value / 100; if (S.pl) S.pl.vol = S.vol; });
  $("#mvCap").addEventListener("change", e => { S.captions = e.target.checked; frame(); });
  // Two taps on purpose: recording takes as long as the clip, and phones only allow the share sheet right after a tap.
  $("#mvMake").addEventListener("click", async () => { if (S.busy || !S.clip) return; S.busy = true; S.pl.stop(); $("#mvPlay").hidden = true; $("#mvMake").disabled = true;
    try { const onP = p => msg(`Making your video… ${Math.round(p * 100)}%`); let blob = null;
      try { blob = await C.exportExact(S.clip, { W: cv.width, H: cv.height, opts: opts(), music: S.music, vol: S.vol, onP }); } catch (e) { console.warn("exact export failed, recording instead", e); blob = null; }
      if (!blob) { S.playing = true; loop(); blob = await C.record(cv, S.pl, S.clip, onP); } const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      S.file = new File([blob], `six-months-of-light-${S.clip.talk}.${ext}`, { type: blob.type }); msg(`Ready · ${(blob.size / 1048576).toFixed(1)} MB`); $("#mvMake").hidden = true; $("#mvDone").hidden = false; }
    catch (e) { msg(e.message); } finally { S.busy = false; S.playing = false; $("#mvMake").disabled = false; $("#mvPlay").hidden = false; frame(); } });
  const dl = f => { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4e4); };
  $("#mvSave").addEventListener("click", () => S.file && dl(S.file));
  $("#mvShare").addEventListener("click", async () => { const f = S.file; if (!f) return; const t = talkById(S.clip.talk), m = mus();
    const text = `“${S.clip.text}” ${t.speaker} ${talkUrl(t)}${m.attr ? "\nMusic: " + m.credit : ""}`;
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text }); } catch (e) {} } else { dl(f); msg("Saved. This browser can't share video files directly."); } });
  ui(); const pre = Q.get("sel") || Q.get("q"); if (pre) { q.value = pre; find(pre); } else if (!matchMedia("(pointer:coarse)").matches) q.focus();
})();
