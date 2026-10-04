// Six Months of Light: "Get a talk" calendar feed (deploy with verify_jwt = false; it's public and holds no personal data).
//  GET ?f=daily|weekly&d=0-6&k=insight,talk,quote,review,lesson&lm=fhe,eqrs,youth,talk&s=oct|all&tp=<topic>&sp=<speaker>&h=7
//      -> text/calendar: one event per delivery day from a week ago to ~4 months ahead (calendar apps refresh daily).
//  Same params + &fmt=json[&date=YYYY-MM-DD] -> today's item as JSON (the push service worker and the sign-up preview use this).
// The choices live only in the URL; nothing is stored.
import { itemFor, parsePrefs, prefsQuery, plain, isDeliveryDay, SITE } from "../_shared/content.ts";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const out: string[] = []; let cur = ""; for (const ch of line) { if (new TextEncoder().encode(cur + ch).length > 73) { out.push(cur); cur = " " + ch; } else cur += ch; } out.push(cur); return out.join("\r\n"); };
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const hashStr = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
const KIND_NAME: Record<string, string> = { insight: "insight", talk: "talk", quote: "quote card", review: "summary review", lesson: "lesson outline" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const q = new URL(req.url).searchParams, p = parsePrefs(q);
  try {
    if (q.get("fmt") === "json") {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || "") ? q.get("date")! : ymd(new Date(Date.now() - 6 * 36e5));
      const it = await itemFor(p, date);
      return new Response(JSON.stringify({ date, ...it }), { headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=900" } });
    }
    const today = new Date(Date.now() - 6 * 36e5), key = hashStr(prefsQuery(p));
    const what = p.k.map(k => KIND_NAME[k]).join(", ");
    const name = `Six Months of Light · ${p.f === "daily" ? "Daily" : "Weekly"} ${p.k.length === 1 ? KIND_NAME[p.k[0]] : "conference study"}`;
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Six Months of Light//Get a talk//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:" + esc(name), "X-WR-CALDESC:" + esc(`A ${p.f} ${what} from October 2026 General Conference, from sixmonthsoflight.com (not an official Church site).`),
      "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D"];
    const days = p.f === "daily" ? 120 : 126, stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    for (let i = -7; i <= days; i++) {
      const d = new Date(today.getTime() + i * 864e5), iso = ymd(d);
      if (!isDeliveryDay(p, iso) || iso < "2026-10-05") continue;
      const it = await itemFor(p, iso), dt = iso.replace(/-/g, ""), hh = String(p.h).padStart(2, "0");
      L.push("BEGIN:VEVENT", `UID:${dt}-${key}@sixmonthsoflight.com`, "DTSTAMP:" + stamp,
        `DTSTART:${dt}T${hh}0000`, `DTEND:${dt}T${hh}1500`,     // floating local time: shows at the chosen hour wherever you are
        "SUMMARY:" + esc(`${it.label}: ${it.title}`), "DESCRIPTION:" + esc(plain(it)), "URL:" + it.url, "TRANSP:TRANSPARENT", "END:VEVENT");
    }
    L.push("END:VCALENDAR");
    const body = L.map(fold).join("\r\n") + "\r\n";
    const dl = q.get("dl") === "1";
    return new Response(body, { headers: { ...CORS, "content-type": "text/calendar; charset=utf-8", "cache-control": "public, max-age=3600", ...(dl ? { "content-disposition": 'attachment; filename="six-months-of-light.ics"' } : {}) } });
  } catch (e) {
    return new Response("Feed temporarily unavailable: " + (e as Error).message, { status: 503, headers: { ...CORS, "content-type": "text/plain" } });
  }
});
