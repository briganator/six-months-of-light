mount("", true);
document.getElementById("main").innerHTML = `
  <h1 style="margin-top:38px">Family &amp; ward group links</h1>
  <p>Make a link for your family, class or ward. Everyone who opens it sees the same site, but “What stuck with me” posts and challenge stories made through the link are grouped together and shown only on that group's view.</p>
  <div class="card">
    <label class="speaker" for="gn">Group name</label>
    <input class="field" id="gn" maxlength="40" placeholder="e.g. Smith family, Maple Ward youth">
    <div class="links"><button class="btn" id="mk">Create link</button></div>
    <div id="res"></div>
  </div>
  <div class="stub"><strong>Good to know:</strong> group links are <em>unlisted, not private</em> — anyone with the link can view. All posts still go through moderation. No accounts or personal data are collected.</div>`;
document.getElementById("mk").addEventListener("click", () => {
  const g = slug(document.getElementById("gn").value).slice(0, 40); if (!g) return;
  const url = new URL("index.html?g=" + g, location.href).href;
  document.getElementById("res").innerHTML = `<p>Share this link:</p><input class="field" readonly value="${esc(url)}" onclick="this.select()">
    <div class="links"><button class="btn secondary small" id="cp">Copy link</button><a class="btn secondary small" href="${esc(url)}">Open group view</a></div>`;
  document.getElementById("cp").addEventListener("click", () => navigator.clipboard.writeText(url));
});
