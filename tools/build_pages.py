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
print("wrote", len(d["talks"]), "talk pages")
