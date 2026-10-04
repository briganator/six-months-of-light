mount("lessons.html");
// Template-based lesson-helps STUB: assembles an outline only from the talk's data on this site.
// Template-based only; no generated text, no invented doctrine. Leaders should prepare from the official text and the Spirit.
const A = {
  fhe: { name: "Family home evening (15–20 min)", open: "Sing a favorite hymn or Primary song, then ask:", act: "Let each family member share one experience or idea connected to the big idea. Younger children can draw it.", close: "Choose one small family goal from the invitation and check in at dinner during the week." },
  youth: { name: "Youth class (25–30 min)", open: "Write the ponder question on the board and give 1 minute of quiet thinking:", act: "In pairs, read a quote and discuss: What does it mean? Where have we seen it in real life? Then share with the class.", close: "Invite each youth to privately write one action they'll take this week." },
  talk: { name: "Sacrament meeting talk (5–8 min)", open: "Open with a brief personal experience related to the theme, then introduce:", act: "Teach the big idea using one scripture and one quote, adding your own testimony and experience.", close: "Close by extending the invitation and bearing testimony of Jesus Christ." },
};
document.getElementById("main").innerHTML = `
  <h1 style="margin-top:38px">Lesson helps</h1>
  <div class="notice"><strong>Starter outline only (stub).</strong> Built from this site's recap data. Prepare from the official talk text once it's posted, and follow the Spirit.</div>
  <div class="card">
    <label class="speaker" for="lt">Talk</label>
    <select id="lt">${CONF.talks.map(t => `<option value="${t.id}">${esc(t.speaker)} — ${esc(t.title)}</option>`).join("")}</select>
    <div class="seg" id="aud">${Object.entries(A).map(([k,v],i) => `<button data-k="${k}" aria-pressed="${i===0}">${v.name.split(" (")[0]}</button>`).join("")}</div>
  </div>
  <article class="card outline" id="out"></article>`;
let aud = "fhe";
function gen() {
  const t = talkById(document.getElementById("lt").value), a = A[aud];
  const scr = t.scriptures.find(s => /\d/.test(s) && !/alludes|echoes|no /i.test(s)) || t.scriptures[0];
  document.getElementById("out").innerHTML = `
    <div class="label" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);font-weight:600">${esc(a.name)}</div>
    <h2 style="margin:4px 0">${esc(t.title)}</h2><p class="speaker">${esc(t.speaker)}</p>
    <h3>1. Open</h3><p>${esc(a.open)} <em>${esc(t.ponder)}</em></p>
    <h3>2. Big idea</h3><p>${esc(t.big_idea)}</p>
    <h3>3. Scripture</h3><p>${esc(scr)}</p>
    <h3>4. Quotes to discuss</h3><ul>${t.quotes.slice(0,2).map(q => `<li>“${esc(q)}” <span class="speaker">(recap)</span></li>`).join("")}</ul>
    <h3>5. Activity</h3><p>${esc(a.act)}</p>
    <h3>6. Invitation</h3><p>${esc(t.invitation)} ${esc(a.close)}</p>
    <div class="links"><button class="btn gold small" id="present">▶ Present${aud === "fhe" ? " to the family" : ""}</button><button class="btn secondary small" id="cp">Copy outline</button><button class="btn secondary small" onclick="print()">Print</button><a class="btn secondary small" href="${esc(officialUrl(t))}">Official text ↗</a></div>`;
  document.getElementById("cp").addEventListener("click", () => navigator.clipboard.writeText(document.getElementById("out").innerText));
  document.getElementById("present").addEventListener("click", () => present([
    ["Tonight's talk", t.title, t.speaker], ["Let's think", t.ponder, a.open.replace(/:$/, "")], ["The big idea", t.big_idea, ""], ["Scripture", scr, "Read it together from your scriptures."],
    ...t.quotes.slice(0, 2).map(q => ["Read aloud", "“" + q + "”", t.speaker + " (from the recap)"]), ["Activity", a.act, ""], ["This week", t.invitation, a.close]]));
}
// Big-type slides for a TV or a phone passed around the room. Arrow keys, swipe or tap the sides; Esc closes.
function present(slides) {
  let i = 0; const ov = document.createElement("div"); ov.className = "present"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Lesson slides");
  ov.innerHTML = `<button class="pr-x" aria-label="Close">×</button><div class="pr-slide" aria-live="polite"></div><div class="pr-nav"><button class="pr-prev" aria-label="Previous">‹</button><span class="pr-n"></span><button class="pr-next" aria-label="Next">›</button></div>`;
  document.body.appendChild(ov); document.body.style.overflow = "hidden";
  const show = () => { const [k, big, small] = slides[i]; ov.querySelector(".pr-slide").innerHTML = `<div class="pr-k">${esc(k)}</div><div class="pr-big ${big.length > 140 ? "long" : ""}">${esc(big)}</div>${small ? `<div class="pr-small">${esc(small)}</div>` : ""}`;
    ov.querySelector(".pr-n").textContent = `${i + 1} / ${slides.length}`; ov.querySelector(".pr-prev").disabled = i === 0; ov.querySelector(".pr-next").textContent = i === slides.length - 1 ? "✓" : "›"; };
  const go = d => { if (i + d >= slides.length) return close(); i = Math.max(0, i + d); show(); };
  const close = () => { ov.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", key); document.getElementById("present")?.focus(); };
  const key = e => { if (e.key === "Escape") close(); if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); go(1); } if (["ArrowLeft", "PageUp"].includes(e.key)) go(-1); };
  document.addEventListener("keydown", key); ov.querySelector(".pr-x").onclick = close; ov.querySelector(".pr-prev").onclick = () => go(-1); ov.querySelector(".pr-next").onclick = () => go(1);
  let x0 = null; ov.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true }); ov.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; });
  ov.requestFullscreen?.().catch(() => {}); show(); ov.querySelector(".pr-next").focus();
}
document.getElementById("lt").addEventListener("change", gen);
document.querySelectorAll("#aud button").forEach(b => b.addEventListener("click", () => { aud = b.dataset.k;
  document.querySelectorAll("#aud button").forEach(x => x.setAttribute("aria-pressed", x === b)); gen(); }));
gen();
