// Six Months of Light: per-card share links.
//  POST (multipart: file=PNG, kind, t, q, note, title, target)  -> stores the site's rendered card, returns a share link
//  GET  ?id=XXXX  -> link-preview crawlers get og:image/twitter:image tags; people are redirected (302) to the site page
//  POST {action:"delete", password, id}  -> admin removes a card (record + image)
// Uploads are validated (real PNG, known card sizes, <= 2 MB), rate-limited per IP in the database, and only accepted for
// verified quotes (checked against the site's own data.js) or site insight/promo cards. The personal line is length-limited and filtered.
const URL0 = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default;
const SITE = "https://sixmonthsoflight.com/";
const SELF = `${URL0}/functions/v1/card`;
const ORIGINS = ["https://sixmonthsoflight.com", "http://sixmonthsoflight.com", "https://briganator.github.io", "http://127.0.0.1:8765", "http://localhost:8765"];
const SIZES = [[1080, 1080], [1080, 1350], [1080, 1920], [1200, 630], [1600, 900], [1000, 1500], [1170, 2532], [1080, 1440]];
const BAD = /\b(f+u+c+k+\w*|sh[i1]+t+\w*|b[i1]tch\w*|c+u+n+t+\w*|asshole\w*|bastard\w*|d[i1]ck\w*|cock\w*|puss(y|ies)|wh[o0]re\w*|slut\w*|n[i1]gg\w*|fag\w*|retard\w*|porn\w*|sex\w*|nude\w*|kill\s+(yourself|urself)|kys)\b/i;
const cors = (origin: string | null) => ({ "Access-Control-Allow-Origin": origin && ORIGINS.includes(origin) ? origin : SITE.slice(0, -1), "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" });
const json = (o: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(o), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
const rpc = (fn: string, args: unknown) => fetch(`${URL0}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
let DATA: any = null, DATA_AT = 0;
async function siteData() {
  if (DATA && Date.now() - DATA_AT < 600_000) return DATA;
  const r = await fetch("https://raw.githubusercontent.com/briganator/six-months-of-light/main/assets/data.js");
  const s = await r.text(); DATA = JSON.parse(s.split("window.CONF = ")[1].trim().replace(/;\s*$/, "")); DATA_AT = Date.now(); return DATA;
}
async function ipHash(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sml-cards:" + ip));
  return [...new Uint8Array(d)].slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
}
const newId = () => { const a = "abcdefghijkmnpqrstuvwxyz23456789", r = crypto.getRandomValues(new Uint8Array(10)); return [...r].map(b => a[b % a.length]).join(""); };
const CRAWLER = /facebookexternalhit|facebot|twitterbot|slackbot|discordbot|linkedinbot|whatsapp|telegrambot|pinterest|redditbot|applebot|skypeuripreview|embedly|iframely|google|bingbot|vkshare|threads|meta-externalagent|bot|crawler|spider|preview/i;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin"), url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method === "GET") {
    const id = (url.searchParams.get("id") ?? "").toLowerCase();
    if (!/^[a-z0-9]{10}$/.test(id)) return Response.redirect(SITE, 302);
    const r = await rpc("card_get", { p_id: id }); const rows = r.ok ? await r.json() : [];
    if (!rows.length) return Response.redirect(SITE, 302);
    const c = rows[0], img = `${URL0}/storage/v1/object/public/cards/${id}.png`;
    if (!CRAWLER.test(req.headers.get("user-agent") ?? "")) return Response.redirect(c.target, 302);
    const title = c.title.length > 110 ? c.title.slice(0, 107) + "…" : c.title;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta property="og:type" content="article"><meta property="og:site_name" content="Six Months of Light">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="Study the October 2026 General Conference and make your own card. Not an official Church site.">
<meta property="og:url" content="${SELF}?id=${id}"><meta property="og:image" content="${img}"><meta property="og:image:secure_url" content="${img}"><meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${c.w}"><meta property="og:image:height" content="${c.h}"><meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:image" content="${img}">
<meta http-equiv="refresh" content="0;url=${esc(c.target)}"><link rel="canonical" href="${esc(c.target)}"></head>
<body><a href="${esc(c.target)}">${esc(title)}</a></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
  }
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {   // admin delete
    const b = await req.json().catch(() => ({}));
    if (b.action !== "delete" || !/^[a-z0-9]{10}$/.test(b.id ?? "")) return json({ error: "bad request" }, 400, origin);
    const r = await rpc("admin_delete_card", { p_password: String(b.password ?? ""), p_id: b.id });
    if (!r.ok || (await r.json()) !== true) return json({ error: "not authorized" }, 403, origin);
    await fetch(`${URL0}/storage/v1/object/cards/${b.id}.png`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    return json({ ok: true }, 200, origin);
  }
  if (!origin || !ORIGINS.includes(origin)) return json({ error: "origin" }, 403, origin);
  const len = +(req.headers.get("content-length") ?? 0); if (len > 2_300_000) return json({ error: "too large" }, 413, origin);
  const fd = await req.formData().catch(() => null); if (!fd) return json({ error: "bad form" }, 400, origin);
  const file = fd.get("file"); if (!(file instanceof File) || file.size > 2_097_152 || file.size < 2000) return json({ error: "file" }, 400, origin);
  const buf = new Uint8Array(await file.arrayBuffer()), sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buf[i] === b) || String.fromCharCode(...buf.slice(12, 16)) !== "IHDR") return json({ error: "not a png" }, 400, origin);
  const dv = new DataView(buf.buffer), w = dv.getUint32(16), h = dv.getUint32(20);
  if (!SIZES.some(([a, b]) => a === w && b === h)) return json({ error: "size" }, 400, origin);
  const kind = String(fd.get("kind") ?? ""), note = String(fd.get("note") ?? "").replace(/https?:\/\/\S+|www\.\S+/gi, "").trim();
  if (note.length > 90 || BAD.test(note)) return json({ error: "note" }, 400, origin);
  let title = "", target = "", talk: string | null = null, q: number | null = null;
  if (kind === "quote") {
    const D = await siteData(), t = D.talks.find((x: any) => x.id === String(fd.get("t") ?? "")), qi = Number(fd.get("q"));
    if (!t || !Number.isInteger(qi) || qi < 0 || qi >= t.quotes.length) return json({ error: "quote" }, 400, origin);
    talk = t.id; q = qi; title = `“${t.quotes[qi]}” — ${t.speaker}`; target = `${SITE}talks/${t.id}.html#q${qi + 1}`;
  } else if (kind === "insight" || kind === "promo") {
    title = String(fd.get("title") ?? "").trim().slice(0, 200); target = String(fd.get("target") ?? "");
    if (!title || BAD.test(title) || !target.startsWith(SITE) || /[<>"\s]/.test(target) || target.length > 300) return json({ error: "card" }, 400, origin);
  } else return json({ error: "kind" }, 400, origin);
  const id = newId();
  const reg = await rpc("card_register", { p_id: id, p_kind: kind, p_talk: talk, p_q: q, p_title: title, p_note: note, p_target: target, p_w: w, p_h: h, p_ip: await ipHash(req) });
  const st = reg.ok ? await reg.json() : "error";
  if (st !== "ok") return json({ error: st === "rate" ? "Too many cards right now. Try again in a few minutes." : "busy" }, 429, origin);
  const up = await fetch(`${URL0}/storage/v1/object/cards/${id}.png`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "image/png", "Cache-Control": "max-age=3600", "x-upsert": "false" }, body: buf });
  if (!up.ok) return json({ error: "upload", detail: (await up.text()).slice(0, 200) }, 502, origin);
  return json({ id, url: `${SELF}?id=${id}`, image: `${URL0}/storage/v1/object/public/cards/${id}.png` }, 200, origin);
});
