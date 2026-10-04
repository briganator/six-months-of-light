// Six Months of Light: "Get a talk" delivery (deploy with verify_jwt = false).
//  GET  ?vapid=1                       -> {publicKey} for the site's push sign-up (key pair made once, private half stays in the DB)
//  POST {action:"test", endpoint}      -> sends today's item now to a subscribed browser (the "Send one now" button)
//  POST (header x-cron-key)            -> every 15 min from pg_cron: sends whatever is due (push now; email once switched on)
//  POST {action:"email_subscribe", email, prefs, tz, hour} -> double opt-in (returns 503 "coming soon" while email is off)
//  GET  ?confirm=<token>               -> confirms an email subscription, then back to the site
//  GET|POST ?unsub=<token>             -> one-click unsubscribe (deletes the address), also used by List-Unsubscribe-Post
import postgres from "npm:postgres@3.4.5";
import { itemFor, parsePrefs, prefsQuery, pushText, isDeliveryDay, SITE, type Prefs } from "../_shared/content.ts";
import { newVapidKeys, sendPush } from "../_shared/webpush.ts";
import { EMAIL, sendEmail } from "../_shared/email-config.ts";
import { deliveryEmail, confirmEmail } from "../_shared/email-templates.ts";
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 3, prepare: false });
const FN = (Deno.env.get("SUPABASE_URL") || "https://yrofrjdmhnudqbuvukqm.supabase.co") + "/functions/v1/deliver";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "content-type, x-cron-key, apikey, authorization" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "content-type": "application/json" } });
const go = (path: string) => new Response(null, { status: 303, headers: { ...CORS, Location: SITE + path } });
const cfg = async (k: string) => (await sql`select value from private.app_config where key = ${k}`)[0]?.value as string | undefined;
async function vapid() {
  let jwk = await cfg("vapid_private_jwk"), pub = await cfg("vapid_public");
  if (!jwk || !pub) { const k = await newVapidKeys();
    await sql`insert into private.app_config (key, value) values ('vapid_private_jwk', ${k.jwk}), ('vapid_public', ${k.pub}) on conflict (key) do nothing`;
    jwk = await cfg("vapid_private_jwk"); pub = await cfg("vapid_public"); }
  return { jwk: jwk!, pub: pub!, subject: (await cfg("vapid_subject")) || SITE };
}
const emailOn = async () => (await cfg("email_enabled")) === "true" && !!EMAIL.apiKey();
const localNow = (tz: string) => { let p: Record<string, string>;
  try { p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(x => [x.type, x.value])); }
  catch { return localNow("America/Denver"); }
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour }; };
const prefsOf = (row: any): Prefs => ({ ...parsePrefs(row.prefs || {}), h: row.hour });
const pushData = async (p: Prefs, date: string) => { const it = await itemFor(p, date), t = pushText(it);
  return { ...t, icon: SITE + "assets/icon-192.png", badge: SITE + "assets/icon-badge.png", tag: "sml-" + date, manage: SITE + "subscribe.html" }; };

async function runDue() {
  const out = { push: 0, pushGone: 0, email: 0, emailOff: false };
  const v = await vapid();
  const rows = await sql`select id, endpoint, p256dh, auth, prefs, tz, hour, last_sent from private.push_subs where fails < 5 limit 5000`;
  const due = rows.map(r => ({ r, now: localNow(r.tz) })).filter(({ r, now }) => now.date >= "2026-10-05" && now.hour >= r.hour && String(r.last_sent || "") !== now.date && isDeliveryDay(prefsOf(r), now.date));
  for (let i = 0; i < due.length; i += 20) await Promise.all(due.slice(i, i + 20).map(async ({ r, now }) => {
    try { const st = await sendPush(r as any, await pushData(prefsOf(r), now.date), v);
      if (st === 404 || st === 410) { await sql`delete from private.push_subs where id = ${r.id}`; out.pushGone++; }
      else if (st >= 200 && st < 300) { await sql`update private.push_subs set last_sent = ${now.date}, fails = 0 where id = ${r.id}`; out.push++; }
      else await sql`update private.push_subs set fails = fails + 1 where id = ${r.id}`;
    } catch (_) { await sql`update private.push_subs set fails = fails + 1 where id = ${r.id}`; }
  }));
  if (!(await emailOn())) { out.emailOff = true; return out; }
  const er = await sql`select id, email, prefs, tz, hour, last_sent, unsub_token from private.email_subs where status = 'confirmed' limit 2000`;
  for (const r of er) { const now = localNow(r.tz), p = prefsOf(r);
    if (now.date < "2026-10-05" || now.hour < r.hour || String(r.last_sent || "") === now.date || !isDeliveryDay(p, now.date)) continue;
    const unsub = `${FN}?unsub=${r.unsub_token}`, m = deliveryEmail(await itemFor(p, now.date), unsub, SITE + "subscribe.html?" + prefsQuery(p));
    try { await sendEmail(r.email, m.subject, m.html, m.text, { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
      await sql`update private.email_subs set last_sent = ${now.date} where id = ${r.id}`; out.email++; } catch (_) { /* try again next run */ }
  }
  return out;
}
const SUMMARY: Record<string, string> = { insight: "insights", talk: "talks", quote: "quote cards", review: "summary reviews", lesson: "lesson outlines" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const u = new URL(req.url), q = u.searchParams;
  try {
    if (q.get("vapid")) return json({ publicKey: (await vapid()).pub });
    if (q.get("unsub")) { const t = q.get("unsub")!;
      if (/^[0-9a-f-]{36}$/.test(t)) await sql`delete from private.email_subs where unsub_token = ${t}::uuid`;
      return req.method === "POST" ? json({ ok: true }) : go("subscribe.html?email=stopped"); }
    if (q.get("confirm")) { const t = q.get("confirm")!;
      const r = /^[0-9a-f-]{36}$/.test(t) ? await sql`update private.email_subs set status = 'confirmed', confirmed_at = now() where confirm_token = ${t}::uuid and status = 'pending' returning id` : [];
      return go("subscribe.html?email=" + (r.length ? "confirmed" : "link-used")); }
    if (req.method !== "POST") return json({ error: "Not found" }, 404);
    const key = req.headers.get("x-cron-key");
    if (key) { if (key !== (await cfg("cron_key"))) return json({ error: "no" }, 403); return json(await runDue()); }
    const b = await req.json().catch(() => ({}));
    if (b.action === "test") {
      const r = (await sql`select endpoint, p256dh, auth, prefs, tz, hour from private.push_subs where endpoint = ${String(b.endpoint || "")}`)[0];
      if (!r) return json({ error: "This browser isn't subscribed yet." }, 404);
      const now = localNow(r.tz), st = await sendPush(r as any, { ...(await pushData(prefsOf(r), now.date)), tag: "sml-test" }, await vapid());
      return json({ ok: st >= 200 && st < 300, status: st });
    }
    if (b.action === "email_subscribe") {
      if (!(await emailOn())) return json({ error: "Email is coming soon. Calendar and phone notifications work today." }, 503);
      const email = String(b.email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ error: "Please check the email address." }, 400);
      if ((await sql`select count(*)::int n from private.email_subs where created_at > now() - interval '1 hour'`)[0].n > 200) return json({ error: "Lots of sign-ups right now; please try again later." }, 429);
      const p = parsePrefs(b.prefs || {}), prefs = { f: p.f, d: p.d, k: p.k.join(","), lm: p.lm.join(","), s: p.s, tp: p.tp, sp: p.sp };
      const ex = (await sql`select status, created_at from private.email_subs where email = ${email}`)[0];
      if (ex?.status === "confirmed") return json({ ok: true, already: true });
      if (ex && Date.now() - new Date(ex.created_at).getTime() < 10 * 60e3) return json({ ok: true, sent: true });
      const row = (await sql`insert into private.email_subs (email, prefs, tz, hour) values (${email}, ${sql.json(prefs)}, ${String(b.tz || "America/Denver").slice(0, 63)}, ${Math.min(23, Math.max(0, +b.hour || 7))})
        on conflict (email) do update set prefs = excluded.prefs, tz = excluded.tz, hour = excluded.hour, confirm_token = gen_random_uuid(), created_at = now() returning confirm_token`)[0];
      const m = confirmEmail(`${FN}?confirm=${row.confirm_token}`, `${p.f} ${p.k.map(k => SUMMARY[k]).join(", ")}`);
      await sendEmail(email, m.subject, m.html, m.text);
      return json({ ok: true, sent: true });
    }
    return json({ error: "Unknown request" }, 400);
  } catch (e) { return json({ error: (e as Error).message }, 500); }
});
