// Six Months of Light: card links (v4).
//  GET  ?id=XXXX -> 301 to the site's static share page (q/<talk>-<n>.html for quotes). Those pages are real text/html on
//                   GitHub Pages with their own og:image, which link-preview crawlers read reliably. (Supabase serves function
//                   and Storage HTML as text/plain with a sandbox CSP, so og tags served from here can't be relied on.)
//  POST {action:"delete", password, id} -> admin removes a previously stored card (record + image).
// New card uploads are retired: phones share the card image itself, and link posts use the static share pages.
const URL0 = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default;
const SITE = "https://sixmonthsoflight.com/";
const ORIGINS = ["https://sixmonthsoflight.com", "https://briganator.github.io", "http://127.0.0.1:8765", "http://localhost:8765"];
const cors = (origin: string | null) => ({ "Access-Control-Allow-Origin": origin && ORIGINS.includes(origin) ? origin : SITE.slice(0, -1), "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" });
const json = (o: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(o), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
const rpc = (fn: string, args: unknown) => fetch(`${URL0}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
const go = (to: string, status = 302) => new Response(null, { status, headers: { Location: to, "Cache-Control": "public, max-age=3600" } });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin"), url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method === "GET" || req.method === "HEAD") {
    const id = (url.searchParams.get("id") ?? "").toLowerCase();
    if (!/^[a-z0-9]{10}$/.test(id)) return go(SITE);
    const r = await rpc("card_get", { p_id: id }); const rows = r.ok ? await r.json() : [];
    if (!rows.length) return go(SITE);
    const t = String(rows[0].target), m = /^https:\/\/sixmonthsoflight\.com\/talks\/([a-z0-9-]+)\.html#q(\d+)$/.exec(t);
    return go(m ? `${SITE}q/${m[1]}-${m[2]}.html` : t.startsWith(SITE) ? t : SITE, 301);
  }
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);
  const b = (req.headers.get("content-type") ?? "").includes("application/json") ? await req.json().catch(() => ({})) : {};
  if (b.action !== "delete") return json({ error: "Card uploads are retired. Link posts use the site's share pages." }, 410, origin);
  if (!/^[a-z0-9]{10}$/.test(b.id ?? "")) return json({ error: "bad request" }, 400, origin);
  const r = await rpc("admin_delete_card", { p_password: String(b.password ?? ""), p_id: b.id });
  if (!r.ok || (await r.json()) !== true) return json({ error: "not authorized" }, 403, origin);
  await fetch(`${URL0}/storage/v1/object/cards/${b.id}.png`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  return json({ ok: true }, 200, origin);
});
