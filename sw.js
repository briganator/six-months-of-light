// Six Months of Light: service worker for Keep the Light reminder notifications only.
// It does not cache HTML, CSS or JS, so pages always load fresh from the network.
// SW_VERSION is bumped when the worker script changes so installed workers update.
self.SW_VERSION = "8";
const SB = "https://yrofrjdmhnudqbuvukqm.supabase.co", KEY = "sb_publishable_CTdJCpH-2P34ANI0Qq3SrQ_9ZbQ-KqB";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const title = d.title || "Six Months of Light", url = d.url || "https://sixmonthsoflight.com/";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "Today's conference light is ready.", icon: d.icon || "assets/icon-192.png", badge: d.badge || "assets/icon-badge.png",
    image: d.image || undefined, tag: d.tag || "sml", data: { url, manage: d.manage || "https://sixmonthsoflight.com/subscribe.html" },
    actions: [{ action: "open", title: "Open" }, { action: "stop", title: "Stop these" }] }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const { url, manage } = e.notification.data || {};
  if (e.action === "stop") {
    e.waitUntil((async () => { const sub = await self.registration.pushManager.getSubscription();
      if (sub) { await fetch(SB + "/rest/v1/rpc/push_unsubscribe", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_endpoint: sub.endpoint }) }).catch(() => {}); await sub.unsubscribe(); }
      await self.registration.showNotification("Notifications stopped", { body: "You won't get any more from Six Months of Light. Turn them back on any time on the Keep the Light page.", icon: "assets/icon-192.png", tag: "sml-stopped", data: { url: manage } });
    })()); return;
  }
  e.waitUntil((async () => { const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if (c.url === url && "focus" in c) return c.focus();
    return self.clients.openWindow(url || "https://sixmonthsoflight.com/"); })());
});
// If the browser rotates the push address, save the new one with the same choices.
self.addEventListener("pushsubscriptionchange", e => {
  e.waitUntil((async () => { const old = e.oldSubscription; if (!old) return;
    const st = await fetch(SB + "/rest/v1/rpc/push_status", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_endpoint: old.endpoint }) }).then(r => r.json()).catch(() => null);
    const sub = e.newSubscription || await self.registration.pushManager.subscribe(old.options); if (!st || !sub) return; const j = sub.toJSON();
    await fetch(SB + "/rest/v1/rpc/push_subscribe", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_prefs: st.prefs, p_tz: st.tz, p_hour: st.hour }) });
    await fetch(SB + "/rest/v1/rpc/push_unsubscribe", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_endpoint: old.endpoint }) });
  })());
});
