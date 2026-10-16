// Card Studio: "Video clip" mode (prototype). Uses globals from builder.js (st, talk, $) and ClipKit.
(function () {
  const C = window.ClipKit; if (!C) return;
  const cs = { aspect: QS.get("ca") && C.ASPECTS[QS.get("ca")] ? QS.get("ca") : "story", music: QS.get("cm") || "dreamy-flashback", vol: .35, captions: true, vbg: "full", vop: .6, sel: QS.get("sel") || "", dyn: null, key: null, pl: null, busy: false, playing: false };
  const box = document.createElement("section"); box.className = "card clip-panel"; box.id = "clipPanel"; box.hidden = true;
  box.innerHTML = `<div class="clip-head"><div><div class="label">Video clip <span class="pill">new</span></div><h2 style="margin:4px 0 2px">Hear it in their voice</h2>
    <p class="b-help">The moment this quote was spoken, from the official conference video, with the words on screen.</p></div></div>
    <div class="clip-grid"><div class="clip-stage"><canvas id="clipCv" aria-label="Video clip preview"></canvas></div>
    <div class="clip-ctl">
      <div class="b-label">Shape</div><div class="seg" id="clipAspect" role="group" aria-label="Clip shape">${Object.entries(C.ASPECTS).map(([k, a]) => `<button type="button" data-k="${k}">${a[2]}</button>`).join("")}</div>
      <div class="b-label">Background music</div><div class="seg" id="clipMusic" role="group" aria-label="Background music" style="flex-wrap:wrap">${C.MUSIC.map(m => `<button type="button" data-k="${m.id}" title="${esc(m.mood || "")}">${esc(m.name)}${m.mood ? `<small style="display:block;opacity:.7;font-size:11px">${esc(m.mood.split(" · ")[0])}</small>` : ""}</button>`).join("")}</div>
      <label class="b-label" for="clipVol">Music volume <span class="b-help">ducks under the speaker</span></label><input type="range" id="clipVol" min="0" max="80" step="5" value="35">
      <div class="b-label">Video look</div><div class="seg" id="clipVbg" role="group" aria-label="Video look">${[["full", "Full"], ["blur", "Soft blur"], ["dim", "Dimmed"], ["duotone", "Duotone"]].map(([k, n]) => `<button type="button" data-k="${k}">${n}</button>`).join("")}</div>
      <label class="b-label" for="clipVop">Video strength</label><input type="range" id="clipVop" min="10" max="100" step="5" value="60">
      <label class="chk"><input type="checkbox" id="clipCap" checked> Light up words as they're spoken</label>
      <div class="links" style="margin:12px 0 0"><button type="button" class="btn secondary" id="clipPlay">▶ Play</button><button type="button" class="btn gold" id="clipShare">Share clip</button><button type="button" class="btn secondary" id="clipSave">Save MP4</button><button type="button" class="btn secondary" id="clipText">Text it</button></div>
      <p class="b-help" id="clipMsg" aria-live="polite"></p>
      <p class="b-help" id="clipLic"></p>
      <label class="b-label" for="clipSel">Or use any line from this talk</label><textarea id="clipSel" rows="3" maxlength="900" placeholder="Paste or type a passage from the talk; the clip is cut to where it's spoken."></textarea>
      <div class="links" style="margin:8px 0 0"><button type="button" class="btn secondary small" id="clipFind">Find it in the video</button><button type="button" class="btn secondary small" id="clipUseQ">Use the selected quote</button></div>
    </div></div>`;
  document.getElementById("main").appendChild(box);
  const cv = box.querySelector("#clipCv"), ctx = cv.getContext("2d"), msg = t => box.querySelector("#clipMsg").textContent = t;
  const seg = (id, k) => box.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
  let raf;
  const opts = (clip, t) => ({ timed: C.timedQuote(clip, clip.text || t.quotes[clip.q]), speaker: t.speaker, title: t.title, captions: cs.captions, vbg: cs.vbg, vop: cs.vop, musicCredit: (C.MUSIC.find(m => m.id === cs.music) || {}).attr ? C.MUSIC.find(m => m.id === cs.music).credit : "", dur: cs.playing || cs.busy ? clip.dur : 0, fade: clip.fade });
  function frame() { const clip = cur(); if (!clip) return; const t = talk(), [W, H] = C.ASPECTS[cs.aspect]; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    C.draw(ctx, W, H, opts(clip, t), cs.playing ? cs.pl.t() : clip.dur, cs.pl.v); }
  const loop = () => { frame(); if (cs.playing && !cs.busy && cs.pl.ended()) { cs.playing = false; cs.pl.stop(); frame(); return; } if (cs.playing) raf = requestAnimationFrame(loop); };
  const cur = () => cs.dyn && cs.dyn.talk === st.t ? cs.dyn : st.src === "quote" && !st.libT && !(st.ownOn && st.own) ? C.get(st.t, st.q) : null;
  function sync() { const clip = cur(); box.hidden = !clip && !(st.src === "quote"); if (!clip) { if (cs.pl) cs.pl.stop(); cs.playing = false; return; }
    const key = clip.text ? "sel:" + clip.text : st.t + ":" + st.q; if (cs.key !== key) { if (cs.pl) cs.pl.stop(); cs.key = key; cs.pl = C.player(clip); cs.pl.v.addEventListener("seeked", frame); cs.pl.ready().then(() => { cs.pl.v.currentTime = (clip.at0 || 0) + Math.min(clip.dur - .1, clip.speech[1]); }); }
    cs.pl.music = cs.music; cs.pl.vol = cs.vol; seg("clipAspect", cs.aspect); seg("clipMusic", cs.music); seg("clipVbg", cs.vbg);
    const m = C.MUSIC.find(x => x.id === cs.music); box.querySelector("#clipLic").innerHTML = m && m.credit ? `Music: <b>${esc(m.name)}</b> · ${esc(m.credit)}${m.src ? ` · <a href="${esc(m.src)}" rel="noopener" target="_blank">source ↗</a>` : ""} · <a href="${esc(m.lurl)}" rel="noopener" target="_blank">${esc(m.license)}</a>` : ""; frame(); }
  const mc = () => { const m = C.MUSIC.find(x => x.id === cs.music); return m && m.attr ? `\nMusic: ${m.credit}` : ""; };
  window.updateClip = sync;
  async function find(text) { text = String(text || "").replace(/\[\d+\]/g, " ").replace(/([A-Za-z.,;:!?”’)])\d{1,2}(?=[\s.,;:!?”’)]|$)/g, "$1").replace(/\s+/g, " ").trim(); if (!text) return; msg("Finding that passage in the talk…"); box.hidden = false;
    try { cs.dyn = await C.clipFor(st.t, text); msg(`Found it · ${cs.dyn.dur.toFixed(1)} s clip`); sync(); box.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { msg(e.message); } }
  box.querySelector("#clipFind").addEventListener("click", () => find(box.querySelector("#clipSel").value));
  box.querySelector("#clipUseQ").addEventListener("click", () => { cs.dyn = null; box.querySelector("#clipSel").value = ""; cs.key = null; sync(); if (!cur()) find(talk().quotes[st.q]); });
  window.findClip = find;
  box.querySelector("#clipAspect").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cs.aspect = b.dataset.k; sync(); } });
  box.querySelector("#clipMusic").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cs.music = b.dataset.k; sync(); } });
  box.querySelector("#clipVbg").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cs.vbg = b.dataset.k; sync(); } });
  box.querySelector("#clipVop").addEventListener("input", e => { cs.vop = +e.target.value / 100; frame(); });
  // Text/SMS: share the MP4 through the share sheet (Messages on iPhone/Android); otherwise an sms: link with the quote and talk link.
  box.querySelector("#clipText").addEventListener("click", async () => { const t = talk(), c = cur(), q = c && c.text ? c.text : t.quotes[st.q], url = talkUrl(t);
    if (navigator.canShare) { const f = await make(); if (f && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: `“${q}” ${t.speaker} ${url}${mc()}` }); return; } catch (e) { return; } } }
    location.href = "sms:?&body=" + encodeURIComponent(`“${q}” ${t.speaker}\n${url}`); });
  box.querySelector("#clipVol").addEventListener("input", e => { cs.vol = +e.target.value / 100; sync(); });
  box.querySelector("#clipCap").addEventListener("change", e => { cs.captions = e.target.checked; frame(); });
  const play = async () => { if (cs.busy) return; cs.pl.stop(); cs.playing = true; await cs.pl.start(); loop(); cs.pl.v.onended = () => { cs.playing = false; frame(); }; };
  box.querySelector("#clipPlay").addEventListener("click", play);
  async function make() { if (cs.busy) return null; cs.busy = true; const clip = cur(); msg("Recording the clip… (plays once, " + Math.round(clip.dur) + " s)");
    cs.playing = true; loop(); try { const blob = await C.record(cv, cs.pl, clip, p => msg(`Recording… ${Math.round(p * 100)}%`)); cs.playing = false; frame();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm"; msg(`Ready · ${(blob.size / 1048576).toFixed(1)} MB ${ext.toUpperCase()}`);
      return new File([blob], `six-months-of-light-${st.t}-q${st.q + 1}-${cs.aspect}.${ext}`, { type: blob.type }); }
    catch (e) { msg(e.message); return null; } finally { cs.busy = false; cs.playing = false; } }
  window.makeClipFile = make;
  const dl = f => { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4e4); };
  box.querySelector("#clipSave").addEventListener("click", async () => { const f = await make(); if (f) dl(f); });
  box.querySelector("#clipShare").addEventListener("click", async () => { const f = await make(); if (!f) return; const t = talk(), c = cur(), url = talkUrl(t) + (c && c.text ? "" : "#q" + (st.q + 1));
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: `“${c && c.text ? c.text : t.quotes[st.q]}” ${t.speaker} ${url}${mc()}` }); } catch (e) {} } else { dl(f); msg("Saved. Your browser can't share video files directly."); } });
  sync();
  if (cs.sel) { box.querySelector("#clipSel").value = cs.sel; find(cs.sel); }
  else if (!cur() && st.src === "quote") box.hidden = false;
})();
