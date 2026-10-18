// Best moments gallery. Each card opens the clip editor with that moment's own default look.
mount("moments.html", true);
(function () {
  const C = window.ClipKit, Y = window.ClipStyle, Q = new URLSearchParams(location.search);
  const main = document.getElementById("main");
  main.innerHTML = `<section class="mm-page"><p class="crumbs"><a href="index.html">Home</a> · <a href="video.html">Make a video</a></p>
    <h1>Best moments</h1>
    <p class="mm-lead">Short passages from the October 2026 talks, in the speaker’s own words. Each one opens in the clip editor with a different starting look. You can change all of it.</p>
    <div class="mm-bar"><label>Session <select id="mmSess" aria-label="Session"><option value="">All sessions</option></select></label>
      <button type="button" id="mmMore" aria-pressed="false">Also show other moments</button>
      <span class="mm-count" id="mmCount"></span></div>
    <div id="mmList"><p class="empty">Loading moments…</p></div></section>`;
  const sessSel = document.getElementById("mmSess");
  CONF.sessions.forEach(s => { const o = document.createElement("option"); o.value = s.id; o.textContent = s.name; sessSel.appendChild(o); });
  if (Q.get("s")) sessSel.value = Q.get("s");
  let DATA = null, showMaybe = Q.get("more") === "1";
  document.getElementById("mmMore").setAttribute("aria-pressed", showMaybe);
  document.getElementById("mmMore").addEventListener("click", () => { showMaybe = !showMaybe; document.getElementById("mmMore").setAttribute("aria-pressed", showMaybe); render(); });
  sessSel.addEventListener("change", render);

  function poster(canvas, talk, moment) {
    const list = (DATA.talks[talk.id] || []).filter(m => m.score === "strong" || showMaybe);
    const salt = Y.baseSalt(DATA.talks[talk.id], moment.id);
    const p = Y.mix(moment.id, salt);
    const ctx = canvas.getContext("2d");
    C.draw(ctx, canvas.width, canvas.height, { phase: "poster", cap: p.cap, theme: p.theme, font: p.font, hook: moment.hook, speaker: talk.speaker, title: talk.title, scale: 1 }, 0, null);
  }
  function render() {
    const sess = sessSel.value, focus = Q.get("t");
    const list = document.getElementById("mmList"); list.innerHTML = "";
    let shown = 0, talks = 0;
    let lastSess = "";
    CONF.talks.forEach(talk => {
      const rows = (DATA.talks[talk.id] || []).filter(m => showMaybe ? m.score !== "skip" : m.score === "strong");
      if (!rows.length || (sess && talk.session !== sess)) return;
      if (talk.session !== lastSess) { lastSess = talk.session; const h = document.createElement("h2"); h.className = "mm-sess"; h.textContent = sessionById(talk.session).name; list.appendChild(h); }
      talks++;
      const sec = document.createElement("section"); sec.className = "mm-talk"; sec.id = "t-" + talk.id;
      sec.innerHTML = `<div class="mm-head">${talk.photo ? `<img src="${esc(talk.photo)}" alt="">` : ""}<div><h2><a href="talks/${esc(talk.id)}.html">${esc(talk.title)}</a></h2><p>${esc(talk.speaker)}</p></div></div><div class="mm-row"></div>`;
      const row = sec.querySelector(".mm-row");
      rows.forEach(m => {
        shown++;
        const a = document.createElement("a"); a.className = "mm"; a.href = "clip.html?m=" + encodeURIComponent(talk.id + ":" + m.id);
        const secs = Math.max(1, Math.round((m.b || 0) - (m.a || 0)));
        a.innerHTML = `<canvas width="180" height="320" aria-hidden="true"></canvas><q>${esc(m.hook)}</q><small>${secs}s · ${esc(m.score === "strong" ? "Top moment" : "Also consider")}</small>${m.why ? `<p class="mm-why">${esc(m.why)}</p>` : ""}`;
        row.appendChild(a);
      });
      list.appendChild(sec);
    });
    document.getElementById("mmCount").textContent = shown + " moment" + (shown === 1 ? "" : "s") + " · " + talks + " talk" + (talks === 1 ? "" : "s");
    if (!shown) list.innerHTML = `<div class="card mm-miss"><p>No moments in this view yet. More talks can be added to <code>assets/moments.json</code>.</p></div>`;
    const cards = [...list.querySelectorAll(".mm canvas")];
    const draw = c => { if (c.dataset.drew) return; c.dataset.drew = "1"; const card = c.closest(".mm"), talkId = card.href.split("m=")[1]; 
      try { const key = decodeURIComponent(talkId.split("?")[0]); const [id, mid] = key.split(":"); const talk = talkById(id), moment = (DATA.talks[id] || []).find(m => m.id === mid); if (talk && moment) poster(c, talk, moment); } catch (e) {} };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { draw(en.target); io.unobserve(en.target); } }), { rootMargin: "400px" });
      cards.forEach(c => io.observe(c));
    } else cards.forEach(draw);
    const jump = document.getElementById("t-" + focus); if (jump) jump.scrollIntoView({ block: "start" });
  }
  fetch("assets/moments.json").then(r => { if (!r.ok) throw new Error("missing"); return r.json(); }).then(d => { DATA = d; render(); }).catch(() => {
    document.getElementById("mmList").innerHTML = `<div class="card"><p>The moments list didn’t load. <a href="video.html">Make a video from a quote</a> instead.</p></div>`;
  });
})();
