// Six Months of Light: "Get a talk" content engine. Shared by the calendar feed, push and email.
// Uses only the site's own verified data: talk recaps and recap quotes (assets/data.js), official talk metadata
// (assets/library-data.js), the insight cards (assets/feed-meta.json) and the lesson-help templates (same wording
// as assets/pages/lessons.js). Nothing is written or invented here; every item links back to its source.
export const SITE = "https://sixmonthsoflight.com/";
export const KINDS = ["insight", "talk", "quote", "review", "lesson"] as const;
export const MODES: Record<string, { name: string; time: string; open: string; act: string; close: string; nq: number }> = {
  fhe: { name: "Family home evening", time: "15–20 min", open: "Sing a favorite hymn or Primary song, then ask:", act: "Let each family member share one experience or idea connected to the message. Younger children can draw it.", close: "Choose one small family goal and check in at dinner during the week.", nq: 2 },
  eqrs: { name: "Elders Quorum & Relief Society", time: "about 45 min", open: "Welcome everyone, invite someone to read the key quote, then give a minute to ponder:", act: "In small groups, take one question each, then share what you discussed with everyone.", close: "Consider how members could help one another act on it this week, including through ministering.", nq: 5 },
  youth: { name: "Youth classes", time: "25–30 min", open: "Write the ponder question on the board and give 1 minute of quiet thinking:", act: "In pairs, read a quote and discuss: What does it mean? Where have we seen it in real life? Then share with the class.", close: "Invite each youth to privately write one action they'll take this week.", nq: 3 },
  talk: { name: "Sacrament meeting talk", time: "5–8 min", open: "Open with a brief personal experience related to the message, then introduce:", act: "Teach the message using one scripture and one quote, adding your own testimony and experience.", close: "Close by extending the invitation and bearing testimony of Jesus Christ.", nq: 0 },
};
export const START = Date.UTC(2026, 9, 5);   // Mon Oct 5, 2026: day 0 of the rotation

export type Prefs = { f: "daily" | "weekly"; d: number; k: string[]; lm: string[]; s: "oct" | "all"; tp: string; sp: string; h: number };
export type Item = { kind: string; title: string; text: string; lines: string[]; url: string; image: string | null; card: string | null; reflect: string; label: string };

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(elder|sister|president|bishop)\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clip = (s: string, n: number) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;

export function parsePrefs(q: URLSearchParams | Record<string, unknown>): Prefs {
  const g = (k: string) => q instanceof URLSearchParams ? q.get(k) : (q as Record<string, unknown>)[k] as string | null;
  const list = (v: unknown) => (Array.isArray(v) ? v : String(v || "").split(",")).map(x => String(x).trim()).filter(Boolean);
  let k = list(g("k")).filter(x => (KINDS as readonly string[]).includes(x)); if (!k.length) k = ["talk"];
  let lm = list(g("lm")).filter(x => x in MODES); if (k.includes("lesson") && !lm.length) lm = ["fhe"];
  const d = Math.min(6, Math.max(0, parseInt(String(g("d") ?? "0")) || 0)), h = Math.min(23, Math.max(0, parseInt(String(g("h") ?? "7")) || 7));
  return { f: g("f") === "weekly" ? "weekly" : "daily", d, k, lm, s: g("s") === "all" ? "all" : "oct", tp: slug(String(g("tp") || "")), sp: slug(String(g("sp") || "")), h };
}
export const prefsQuery = (p: Prefs) => new URLSearchParams({ f: p.f, ...(p.f === "weekly" ? { d: String(p.d) } : {}), k: p.k.join(","), ...(p.lm.length ? { lm: p.lm.join(",") } : {}), s: p.s, ...(p.tp ? { tp: p.tp } : {}), ...(p.sp ? { sp: p.sp } : {}), h: String(p.h) }).toString();

// ---- data (cached per function instance for 20 minutes) ----
type Data = { conf: any; lib: any; meta: any };
let cache: { at: number; data: Data } | null = null;
const grabJSON = async (path: string, js: boolean) => { const r = await fetch((Deno.env.get("FEED_DATA_BASE") || SITE) + path + "?v=" + Math.floor(Date.now() / 6e5)); if (!r.ok) throw new Error(path + " " + r.status); const s = await r.text(); return JSON.parse(js ? s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1) : s); };
export async function loadData(): Promise<Data> {
  if (cache && Date.now() - cache.at < 12e5) return cache.data;
  const [conf, lib, meta] = await Promise.all([grabJSON("assets/data.js", true), grabJSON("assets/library-data.js", true), grabJSON("assets/feed-meta.json", false)]);
  cache = { at: Date.now(), data: { conf, lib, meta } }; return cache.data;
}

// One shape for October 2026 recaps and the official library (same rules as lessons.js)
type Talk = { id: string; c: string; conf: string; title: string; speaker: string; sp: string; overview: string; big: string; ponder: string; quotes: string[]; refs: string[]; invitation: string; topics: string[]; url: string; official: string | null; image: string | null; oct: boolean; session: string };
function talks(D: Data, scope: string): Talk[] {
  const tags = D.meta.quoteTags || {}, names = D.meta.themes || {};
  const oct: Talk[] = D.conf.talks.map((t: any) => ({ id: t.id, c: "2026-10", conf: "October 2026", title: t.title, speaker: t.speaker, sp: slug(t.speaker), overview: t.summary, big: t.big_idea, ponder: t.ponder,
    quotes: t.quotes || [], refs: t.scriptures || [], invitation: t.invitation, topics: [...new Set((t.quotes || []).flatMap((_: string, i: number) => tags[t.id + "#" + i] || []))] as string[],
    url: SITE + "talks/" + t.id + ".html", official: t.official_url || null, image: SITE + "assets/og/" + t.id + ".jpg", oct: true, session: t.session }));
  if (scope !== "all") return oct;
  const confs = Object.fromEntries(D.lib.confs.map((c: any) => [c.c, c]));
  const lib: Talk[] = D.lib.talks.filter((t: any) => t.c !== "2026-10").map((t: any) => {
    const t0 = names[t.tg?.[0]] || "", tp = !t0 ? "the gospel of Jesus Christ" : t0 === "Jesus Christ" ? "following Jesus Christ" : /^(Holy Ghost|Book of Mormon)$/.test(t0) ? "the " + t0 : t0.toLowerCase().replace(" & ", " and ").replace(/^temple$/, "the temple").replace(/^youth$/, "the youth");
    const off = `https://www.churchofjesuschrist.org/study/general-conference/${t.c.slice(0, 4)}/${t.c.slice(5)}/${t.id}?lang=eng`;
    return { id: t.id, c: t.c, conf: confs[t.c]?.label || t.c, title: t.t, speaker: t.s, sp: t.sp, overview: t.k, big: t.k, ponder: `As you read this talk, what is one thing you feel prompted to do about ${tp}?`,
      quotes: [], refs: t.rf || [], invitation: `Read the full talk and choose one invitation from ${t.s} to act on this week.`, topics: t.tg || [], url: off, official: off, image: null, oct: false, session: t.se };
  });
  return oct.concat(lib);
}

// Deterministic order: the same date and choices always give the same item, and a pool is walked without repeats.
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const order = <T>(arr: T[], key: (x: T) => string, seed: string) => arr.map(x => [hash(seed + key(x)), x] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
export const dayIndex = (dateISO: string) => Math.floor((Date.parse(dateISO + "T00:00:00Z") - START) / 864e5);
export const isDeliveryDay = (p: Prefs, dateISO: string) => p.f === "daily" || new Date(dateISO + "T00:00:00Z").getUTCDay() === p.d;

function questions(n: Talk, m: string, names: Record<string, string>) {
  const t0 = names[n.topics[0]] || "", tp = t0 === "Jesus Christ" ? "the Savior's help" : /^(Holy Ghost|Book of Mormon|Restoration|Second Coming|Christmas|Easter|Relief Society|Elders Quorum)$/.test(t0) ? t0.replace(/^(Restoration|Second Coming)$/, "the $1") : t0.toLowerCase().replace(" & ", " and ").replace(/^temple$/, "the temple").replace(/^youth$/, "the youth");
  const ref = n.refs[0];
  const q = [n.ponder];
  q.push(n.quotes.length ? "Read the first quote together. What stands out to you, and why?" : `The talk's key message is “${n.big}” What does that mean to you?`);
  if (tp) q.push(m === "youth" ? `Where do you see ${tp} make a difference in the lives of people your age?` : tp === "the Savior's help" ? "When have you seen the Savior's help bless someone in your family or ward?" : `When have you seen ${tp} bless someone in your family or ward?`);
  if (ref) q.push(`Read ${ref}. How does it connect to the talk's message?`);
  q.push(m === "eqrs" ? "How can we help one another act on this, including in our ministering?" : m === "youth" ? "What is one small thing you could do this week because of this message?" : "What will we try as a family this week?");
  return q.slice(0, m === "fhe" ? 2 : m === "youth" ? 4 : 5);
}

const KIND_LABEL: Record<string, string> = { insight: "Insight", talk: "Talk", quote: "Quote card", review: "Summary review", lesson: "Lesson outline" };

// Build the item for one delivery (n = rotation step). Kinds rotate in the order chosen.
export async function itemFor(p: Prefs, dateISO: string): Promise<Item> {
  const D = await loadData();
  const step = p.f === "weekly" ? Math.floor(dayIndex(dateISO) / 7) : dayIndex(dateISO);
  const n = Math.max(0, step), seed = prefsQuery(p);
  const names: Record<string, string> = D.meta.themes || {};
  const tpWord = p.tp.split("-")[0];
  let all = talks(D, p.s);
  const filt = (ts: Talk[]) => { let r = ts; if (p.sp) { const x = r.filter(t => t.sp === p.sp); if (x.length) r = x; } if (p.tp) { const x = r.filter(t => t.topics.includes(p.tp)); if (x.length) r = x; } return r; };
  const pools: Record<string, () => Item[]> = {
    talk: () => order(filt(all), t => t.c + t.id, seed).map(t => ({ kind: "talk", label: KIND_LABEL.talk, title: t.title, text: `${t.speaker} · ${t.conf}`,
      lines: [t.overview, t.oct ? "Summary written from news recaps of the talk; read the official text for the full message." : "The summary line from the talk's official page."],
      url: t.url, image: t.image, card: t.oct ? SITE + "builder.html?t=" + t.id : null, reflect: t.ponder })),
    quote: () => { const oct = filt(talks(D, "oct")); const qs = oct.flatMap(t => t.quotes.map((q, i) => ({ t, q, i }))).filter(x => !p.tp || ((D.meta.quoteTags || {})[x.t.id + "#" + x.i] || []).includes(p.tp) || !oct.some(t => t.topics.includes(p.tp)));
      return order(qs, x => x.t.id + x.i, seed).map(({ t, q, i }) => ({ kind: "quote", label: KIND_LABEL.quote, title: `“${clip(q, 150)}”`, text: `${t.speaker} · ${t.title}`,
        lines: [`“${q}”`, `${t.speaker}, “${t.title},” October 2026 general conference. Quoted in news recaps; confirm the wording with the official text.`],
        url: `${SITE}q/${t.id}-${i + 1}.html`, image: `${SITE}assets/og/q/${t.id}-${i + 1}.jpg`, card: `${SITE}q/${t.id}-${i + 1}.html`, reflect: t.ponder })); },
    insight: () => { const tc = (D.meta.themeCards || []).filter((c: any) => !p.tp || c.theme.includes(tpWord));
      const list = (p.tp && tc.length ? tc : []).concat(D.meta.insights || [], p.tp ? [] : D.meta.themeCards || []);
      return list.map((c: any) => ({ kind: "insight", label: KIND_LABEL.insight, title: c.title, text: c.kicker || "Conference insight", lines: [c.text, c.sub, c.foot].filter(Boolean),
        url: SITE + "insights.html", image: c.theme ? null : SITE + "assets/og/i/" + c.id + ".jpg", card: SITE + "builder.html?ins=" + c.id, reflect: "Which talk behind this would you like to read again this week?" }));
      },
    review: () => { const oct = talks(D, "oct"), sess = (D.meta.sessions || []).filter((s: any) => oct.some(t => t.session === s.id));
      const recaps: Item[] = sess.map((s: any) => { const ts = oct.filter(t => t.session === s.id);
        return { kind: "review", label: KIND_LABEL.review, title: `${s.name} in review`, text: `${ts.length} talks · October 2026`, lines: ts.map(t => `${t.speaker}, “${t.title}”: ${t.big}`),
          url: SITE + "session.html?s=" + s.id, image: null, card: null, reflect: "Which of these messages do you want to carry into this week?" }; });
      const themes = (D.meta.insights || []).filter((c: any) => c.id === "themes" || c.id === "themes-by-session").map((c: any) => ({ kind: "review", label: KIND_LABEL.review, title: "This conference's themes", text: c.title,
        lines: [c.text, c.foot].filter(Boolean), url: SITE + "insights.html", image: SITE + "assets/og/i/" + c.id + ".jpg", card: SITE + "builder.html?ins=" + c.id, reflect: "Which theme is the Lord inviting you to focus on until April?" }));
      return order(recaps.concat(themes), x => x.title, seed); },
    lesson: () => order(filt(all), t => t.c + t.id, seed).map((t, j) => { const mk = p.lm[(Math.floor(n / Math.max(1, p.k.length)) + j) % p.lm.length] || "fhe", m = MODES[mk];
      const qs = m.nq ? questions(t, mk, names) : [], quotes = t.quotes.slice(0, mk === "eqrs" ? 3 : 2), refs = t.refs.slice(0, 5);
      const L = [`${m.name} · ${m.time}`, `Overview: ${t.overview}`, `Open: ${m.open} ${t.ponder}`,
        quotes.length ? "Key quotes: " + quotes.map(q => `“${q}”`).join(" ") : `Key statement: ${t.big}`,
        refs.length ? "Scriptures: " + refs.join("; ") : "", qs.length ? "Discuss: " + qs.map((x, i) => `${i + 1}) ${x}`).join(" ") : "",
        `${mk === "eqrs" ? "Counsel together" : "Activity"}: ${m.act}`, `Invitation: ${t.invitation} ${m.close}`].filter(Boolean);
      return { kind: "lesson", label: `${KIND_LABEL.lesson} · ${m.name}`, title: t.title, text: `${t.speaker} · ${t.conf} · ${m.name}`, lines: L,
        url: `${SITE}lessons.html?mode=${mk}&c=${t.c}&t=${encodeURIComponent(t.id)}`, image: t.image, card: null, reflect: t.ponder }; }),
  };
  const kinds = p.k.filter(k => pools[k]);
  for (let tries = 0; tries < kinds.length; tries++) {
    const kind = kinds[(n + tries) % kinds.length], pool = pools[kind]();
    if (pool.length) return pool[Math.floor(n / kinds.length) % pool.length];
  }
  all = talks(D, "oct"); return pools.talk()[n % D.conf.talks.length];
}

export const plain = (it: Item) => [it.label + ": " + it.title, it.text, "", ...it.lines, "", "Reflect: " + it.reflect, "", "Open: " + it.url, ...(it.card && it.card !== it.url ? ["Make it a card: " + it.card] : []), "", "Six Months of Light · not an official Church site"].join("\n");
export const pushText = (it: Item) => ({ title: it.kind === "quote" ? `Quote card · ${it.text.split(" · ")[0]}` : `${it.label}: ${clip(it.title, 70)}`, body: clip(it.kind === "quote" ? it.title : it.lines[0] && it.kind !== "lesson" ? it.lines[0] : it.text, 170), url: it.url, image: it.image });
