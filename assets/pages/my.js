mount("my.html");
function render() {
  const saved = Store.savedQuotes().map(k => { const [id, i] = k.split("#"); const t = talkById(id); return t && { t, i: +i, q: t.quotes[+i] }; }).filter(Boolean);
  const notes = Object.entries(Store.get("notes", {})).map(([id, n]) => ({ t: talkById(id), n })).filter(x => x.t);
  const cs = Store.commitments().map(c => ({ ...c, t: talkById(c.talkId) })).filter(c => c.t);
  const dayOf = c => Math.min(7, Math.floor((Date.now() - Date.parse(c.start)) / 864e5) + 1);
  document.getElementById("main").innerHTML = `
  <h1 style="margin-top:38px">My Conference</h1>
  <div class="notice" style="background:#eef3f8;border-color:#d3deea;color:#2f3e55">🔒 Everything here is stored <strong>only on this device</strong> (browser storage). It isn't sent anywhere, and clearing your browser data erases it.</div>
  <section class="card"><h2 style="margin-top:0">My invitations</h2>
    ${cs.length ? cs.map(c => `<div class="comment"><b><a href="talks/${c.t.id}.html">${esc(c.t.title)}</a></b>
      <div>${esc(c.text)}</div><div class="who">Day ${dayOf(c)} of 7 · tap each day you acted</div>
      <div class="days">${[1,2,3,4,5,6,7].map(d => `<button class="${c.done.includes(d)?"on":""}" data-c="${c.t.id}" data-d="${d}">${d}</button>`).join("")}</div>
      <div class="qrow"><button data-ics="${c.t.id}">📅 7-day reminder</button><button data-rm="${c.t.id}">Remove</button></div></div>`).join("")
      : `<p class="empty">No commitments yet. Open a talk and tap “Commit for 7 days.”</p>`}</section>
  <section class="card"><h2 style="margin-top:0">Saved quotes</h2>
    ${saved.length ? saved.map(x => `<blockquote>“${esc(x.q)}”<div class="who" style="font-family:var(--sans);font-size:13px;color:var(--muted)">— ${esc(x.t.speaker)} · <a href="builder.html?t=${x.t.id}&q=${x.i}">quote card</a></div></blockquote>`).join("")
      : `<p class="empty">Tap ☆ Save under any quote.</p>`}</section>
  <section class="card"><h2 style="margin-top:0">Private notes</h2>
    ${notes.length ? notes.map(x => `<div class="comment"><b><a href="talks/${x.t.id}.html">${esc(x.t.title)}</a></b><div style="white-space:pre-wrap">${esc(x.n)}</div></div>`).join("")
      : `<p class="empty">Notes you write on talk pages appear here.</p>`}
    <div class="links"><button class="btn secondary small" id="exp">Export my data (.json)</button></div></section>`;
  document.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { Store.checkIn(b.dataset.c, +b.dataset.d); render(); }));
  document.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { Store.removeCommit(b.dataset.rm); render(); }));
  document.querySelectorAll("[data-ics]").forEach(b => b.addEventListener("click", () => { const c = cs.find(x => x.t.id === b.dataset.ics); downloadReminder(c.t, c.text); }));
  document.getElementById("exp").addEventListener("click", () => { const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ quotes: Store.savedQuotes(), notes: Store.get("notes", {}), commitments: Store.commitments() }, null, 2)], { type: "application/json" }));
    a.download = "my-conference.json"; a.click(); });
}
render();
