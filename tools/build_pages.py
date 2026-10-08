# Generates static per-talk pages (talks/<id>.html) with Open Graph tags so link previews work
# on Facebook/Messages/WhatsApp (crawlers don't run JS). Run after editing tools/talks_source.py.
import json, pathlib, html
root = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((root / "assets/data.js").read_text().split("window.CONF = ", 1)[1].rstrip().rstrip(";"))
site = d["site_url"]
(root / "talks").mkdir(exist_ok=True)
for t in d["talks"]:
    e = lambda s: html.escape(s, quote=True)
    title = f'{t["title"]} — {t["speaker"]}'
    desc = t["big_idea"] + " Six Months of Light: summary, scriptures, quote cards & ponder questions. Not an official Church site."
    url = f'{site}talks/{t["id"]}.html'; img = f'{site}assets/og/{t["id"]}.jpg'
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<base href="../">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} · Six Months of Light</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Six Months of Light">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(t["title"])} by {e(t["speaker"])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d1326">
<link rel="icon" href="assets/logo-mark.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/CormorantGaramond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<main class="wrap" id="main"></main>
<script>window.TALK_ID = {json.dumps(t["id"])};</script>
<script src="assets/config.js"></script>
<script src="assets/api.js"></script>
<script src="assets/data.js"></script>
<script src="assets/common.js"></script>
<script src="assets/pages/share.js"></script>
<script src="assets/pages/talk.js"></script>
</body>
</html>
'''
    (root / "talks" / f'{t["id"]}.html').write_text(page)
for b in d.get("business") or []:
    e = lambda s: html.escape(s, quote=True)
    title = b["title"]
    desc = b.get("lead") or title
    desc = (desc[:180] + "…") if len(desc) > 180 else desc
    url = f'{site}talks/{b["id"]}.html'
    img = f'{site}assets/og/site.jpg'
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<base href="../">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} · Six Months of Light</title>
<meta name="description" content="{e(desc)} Not an official Church site.">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Six Months of Light">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d1326">
<link rel="icon" href="assets/logo-mark.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/CormorantGaramond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<main class="wrap" id="main"></main>
<script>window.TALK_ID = {json.dumps(b["id"])};</script>
<script src="assets/config.js"></script>
<script src="assets/api.js"></script>
<script src="assets/data.js"></script>
<script src="assets/common.js"></script>
<script src="assets/pages/share.js"></script>
<script src="assets/pages/talk.js"></script>
</body>
</html>
'''
    (root / "talks" / f'{b["id"]}.html').write_text(page)
print("wrote", len(d["talks"]), "talk pages,", len(d.get("business") or []), "business pages")

# ---- v3 share pages: q/<talk>-<n>.html (one per verified quote) and i/<insight>.html, each with its own
# link-preview image (tools/render_share.py). They forward people to the quote on the talk page.
idx_f = root / "tools/share_index.json"
if idx_f.exists():
    idx = json.loads(idx_f.read_text()); talks = {t["id"]: t for t in d["talks"]}
    def share_page(path, title, desc, img, alt, target, label):
        e = lambda s: html.escape(s, quote=True); url = site + path
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} · Six Months of Light</title>
<meta name="description" content="{e(desc)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Six Months of Light">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}"><meta property="og:image" content="{e(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{e(alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}"><meta name="twitter:image" content="{e(img)}">
<meta name="robots" content="noindex,follow"><link rel="icon" href="../assets/logo-mark.svg" type="image/svg+xml">
<meta http-equiv="refresh" content="0; url={e(target)}">
<style>body{{font:16px/1.5 system-ui,sans-serif;background:#0d1326;color:#fffaf0;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}}a{{color:#f1d394}}</style>
</head><body><main><p>{e(label)}</p><p><a href="{e(target)}">Continue to Six Months of Light →</a></p><p style="font-size:13px;opacity:.75">Not an official Church site · Personal study page</p></main>
<script>location.replace({json.dumps(target)});</script></body></html>
'''
    (root / "q").mkdir(exist_ok=True); (root / "i").mkdir(exist_ok=True)
    for q in idx["quotes"]:
        t = talks[q["t"]]; qt = t["quotes"][q["n"] - 1]; short = qt if len(qt) < 110 else qt[:qt.rfind(" ", 0, 105)] + "…"
        (root / "q" / f'{q["t"]}-{q["n"]}.html').write_text(share_page(f'q/{q["t"]}-{q["n"]}.html', f'“{short}” — {t["speaker"]}',
            (f'From “{t["title"]}” (October 2026 General Conference). Read the talk and make your own quote card.' if t.get("official_url") else f'From “{t["title"]}” (October 2026 General Conference, as quoted in recaps). Read the recap and make your own quote card.'),
            f'{site}assets/og/q/{q["t"]}-{q["n"]}.jpg', f'Quote card: {short} — {t["speaker"]}', f'../talks/{q["t"]}.html#q{q["n"]}', f'Opening the quote from {t["speaker"]}…'))
    for x in idx["insights"]:
        (root / "i" / f'{x["id"]}.html').write_text(share_page(f'i/{x["id"]}.html', f'{x["title"]} · October 2026 General Conference', (x["share"] or x["sub"]) + ("" if all(t.get("official_url") for t in talks.values()) else " Based on recaps."),
            f'{site}assets/og/i/{x["id"]}.jpg', x["title"], f'../insights.html#{x["id"]}', "Opening the insight…"))
    (root / "assets/share-pages.js").write_text("// GENERATED by tools/build_pages.py: insight ids that have a share page (i/<id>.html)\nwindow.SHARE_PAGES = " + json.dumps([x["id"] for x in idx["insights"]]) + ";\n")
    print("share pages:", len(idx["quotes"]), "quotes,", len(idx["insights"]), "insights")
