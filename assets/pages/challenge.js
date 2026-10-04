mount("challenge.html", true);
const C = CONF.challenge, CFG = window.CONF_CONFIG;
document.getElementById("main").innerHTML = `
  <h1 style="margin-top:38px">🌱 ${esc(C.title)}</h1>
  <article class="card totw"><p style="font-size:17px;margin-top:0">${esc(C.text)}</p>
    <ol>${["Pick one invitation below and tap “Commit for 7 days” on that talk.","Act on it each day and check off the day in My Conference.","Share a short story of what happened (reviewed before it appears)."].map(x => `<li>${x}</li>`).join("")}</ol>
    <div class="links" style="margin-bottom:0"><a class="btn" href="my.html">My 7 days</a><a class="btn secondary" href="groups.html">Do it as a family or ward</a></div></article>
  <h2>Invitations to choose from</h2>
  ${CONF.talks.slice(0, 18).map(t => `<a class="tile" style="margin:8px 0" href="talks/${t.id}.html#commitbox"><b>${esc(t.invitation)}</b><span>${esc(t.speaker)} — ${esc(t.title)}</span></a>`).join("")}
  <section class="card stuck" style="margin-top:20px"><h2 style="margin-top:0">Shared stories${GROUP ? ` · ${esc(GROUP)}` : ""}</h2>
    <p class="speaker">${esc(C.note)}</p>
    <div id="comments"><p class="empty">Loading…</p></div>
    <form id="f" novalidate>
      <label for="name">Your name <span style="font-weight:400;color:var(--muted)">(optional)</span></label>
      <input type="text" id="name" maxlength="${CFG.nameMaxLength}" placeholder="e.g. Sarah">
      <label for="body">Your story</label>
      <textarea id="body" maxlength="${CFG.maxLength}" placeholder="What happened when you acted on the invitation?"></textarea>
      <div class="count"><span id="cnt">0</span>/${CFG.maxLength}</div>
      <div class="hp" aria-hidden="true"><label for="website">Leave this empty</label><input type="text" id="website" tabindex="-1" autocomplete="off"></div>
      <button class="btn" id="send" type="submit">Share my story</button>
      <div class="msg" id="msg" role="status" aria-live="polite"></div></form></section>`;
setupShare(C.id);
