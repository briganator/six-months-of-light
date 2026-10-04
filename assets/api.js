// Tiny backend adapter: Supabase REST (no SDK needed) or a localStorage mock.
(function () {
  const C = window.CONF_CONFIG;
  const headers = { apikey: C.supabaseKey, "Content-Type": "application/json" };
  async function rpc(fn, body) {
    const r = await fetch(`${C.supabaseUrl}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("Network error (" + r.status + ")");
    return r.json();
  }
  const supabase = {
    async listApproved(talkId, group) {
      let q = talkId ? `&talk_id=eq.${encodeURIComponent(talkId)}` : "";
      q += group ? `&group_tag=eq.${encodeURIComponent(group)}` : "&group_tag=is.null";
      const r = await fetch(`${C.supabaseUrl}/rest/v1/approved_comments?select=id,talk_id,name,body,group_tag,created_at&order=created_at.desc&limit=200${q}`, { headers });
      if (!r.ok) throw new Error("Could not load");
      return r.json();
    },
    submit: (talkId, name, body, website, group) => rpc("submit_comment", { p_talk_id: talkId, p_name: name, p_body: body, p_website: website || "", p_group: group || null }),
    adminList: (password, status) => rpc("admin_list_comments", { p_password: password, p_status: status }),
    adminSet: (password, id, status) => rpc("admin_set_status", { p_password: password, p_id: id, p_status: status }),
    // shared card images (per-card share links)
    adminCards: async (password) => { try { return { ok: true, items: await rpc("admin_list_cards", { p_password: password, p_limit: 120 }) }; } catch (e) { return { ok: false, error: "Wrong password or network error." }; } },
    adminDeleteCard: async (password, id) => { const r = await fetch(`${C.supabaseUrl}/functions/v1/card`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id, password }) }); return { ok: r.ok }; },
    // "Heard it live" wall (moderated; anon can only submit and read approved rows)
    liveSubmit: (session, talkId, speaker, body, website) => rpc("submit_live_quote", { p_session: session, p_talk_id: talkId || null, p_speaker: speaker, p_body: body, p_website: website || "" }),
    liveApproved: async () => { const r = await fetch(`${C.supabaseUrl}/rest/v1/approved_live_quotes?select=id,session_id,talk_id,speaker,body,created_at&conf=eq.2026-10&order=created_at.desc&limit=300`, { headers }); if (!r.ok) throw new Error("Could not load"); return r.json(); },
    adminLive: (password, status) => rpc("admin_list_live", { p_password: password, p_status: status }),
    adminLiveSet: (password, id, status) => rpc("admin_set_live_status", { p_password: password, p_id: id, p_status: status }),
    cardImage: id => `${C.supabaseUrl}/storage/v1/object/public/cards/${id}.png`,
  };
  // ---- Local mock (same rules, stored in this browser only) ----
  const KEY = "conf-share-mock-v1", MOCK_PASSWORD = "preview";
  const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const save = (a) => localStorage.setItem(KEY, JSON.stringify(a));
  const local = {
    async listApproved(talkId, group) { return load().filter(c => c.status === "approved" && (!talkId || c.talk_id === talkId) && (c.group_tag || null) === (group || null)).reverse(); },
    async submit(talkId, name, body, website, group) {
      if (website) return { ok: true };
      body = (body || "").replace(/\s+/g, " ").trim();
      if (body.length < 3) return { ok: false, error: "Please write a little more." };
      if (body.length > C.maxLength) return { ok: false, error: `Please keep it to ${C.maxLength} characters.` };
      if (/(https?:\/\/|www\.)/i.test(body)) return { ok: false, error: "Links are not allowed." };
      const a = load(), recent = a.filter(c => Date.now() - Date.parse(c.created_at) < 600000);
      if (recent.length >= 3) return { ok: false, error: "Thanks! You have shared a lot recently. Please try again later." };
      a.push({ id: Date.now(), talk_id: talkId, name: (name || "").trim().slice(0, C.nameMaxLength) || null, body, group_tag: group || null, status: "pending", created_at: new Date().toISOString() });
      save(a); return { ok: true };
    },
    async adminList(pw, status) {
      if (pw !== MOCK_PASSWORD) return { ok: false, error: "Wrong password." };
      return { ok: true, items: load().filter(c => status === "all" || c.status === status).reverse() };
    },
    async adminSet(pw, id, status) {
      if (pw !== MOCK_PASSWORD) return { ok: false, error: "Wrong password." };
      const a = load(); const c = a.find(x => x.id === id); if (c) c.status = status; save(a); return { ok: !!c };
    },
  };
  window.ConfAPI = C.backend === "local" ? local : supabase;
  window.ConfAPI.mode = C.backend;
})();
