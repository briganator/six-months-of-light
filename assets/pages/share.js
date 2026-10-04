// Moderated sharing form used by talk + challenge pages.
window.setupShare = (talkId) => {
  const box = document.getElementById("comments");
  async function loadComments() {
    try {
      const items = await ConfAPI.listApproved(talkId, GROUP);
      box.innerHTML = items.length ? items.map(c => `<div class="comment"><div>${esc(c.body)}</div>
        <div class="who">— ${esc(c.name || "Anonymous")} · ${fmtDate(c.created_at)}</div></div>`).join("")
        : `<p class="empty">Be the first to share.</p>`;
    } catch (e) { box.innerHTML = `<p class="empty">Shared thoughts couldn't load right now.</p>`; }
  }
  loadComments();
  const body = document.getElementById("body"), cnt = document.getElementById("cnt"), msg = document.getElementById("msg"), send = document.getElementById("send");
  body.addEventListener("input", () => cnt.textContent = body.value.length);
  const opened = Date.now();
  document.getElementById("f").addEventListener("submit", async (e) => {
    e.preventDefault(); msg.className = "msg"; msg.textContent = "";
    const text = body.value.trim();
    if (text.length < 3) { msg.className = "msg err"; msg.textContent = "Please write a little more."; return; }
    const hp = document.getElementById("website").value || (Date.now() - opened < 2000 ? "fast" : ""); // honeypot + too-fast check
    send.disabled = true;
    try {
      const r = await ConfAPI.submit(talkId, document.getElementById("name").value, text, hp, GROUP);
      if (r.ok) { msg.className = "msg ok"; msg.textContent = "Thank you! It was received and will appear after review."; body.value = ""; cnt.textContent = "0"; }
      else { msg.className = "msg err"; msg.textContent = r.error || "Something went wrong."; }
    } catch (err) { msg.className = "msg err"; msg.textContent = "Couldn't send right now. Please try again."; }
    send.disabled = false;
  });
};
