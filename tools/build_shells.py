# Writes the thin HTML shells for each page (titles, meta, script order).
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
import json
SITE = json.loads((root / "assets/data.js").read_text().split("window.CONF = ", 1)[1].rstrip().rstrip(";"))["site_url"]  # from tools/talks_source.py
NAME, TAG = "Six Months of Light", "The words of October 2026 General Conference, to carry you to April."
pages = {
 "index": ("Six Months of Light · October 2026 General Conference", ["share"], ["insights-data.js"]),
 "builder": ("Card Studio · Six Months of Light", [], ["themes3.js", "insights-data.js", "photos.js", "vendor/qrcode.js", "cardkit.js", "promos.js", "share-pages.js"]),
 "quiz": ("Who said it? · Six Months of Light", [], []),
 "insights": ("Conference Insights · Six Months of Light", [], ["insights-data.js"]),
 "credits": ("Credits & licenses · Six Months of Light", [], ["photos.js"]),
 "speaker": ("Speakers · Six Months of Light", [], []),
 "session": ("Session · Six Months of Light", [], []),
 "my": ("My Conference · Six Months of Light", [], []),
 "lessons": ("Lesson helps · Six Months of Light", [], []),
 "challenge": ("Conference challenge · Six Months of Light", ["share"], []),
 "groups": ("Group links · Six Months of Light", [], []),
}
for name, (title, pre, libs) in pages.items():
    scripts = ["assets/config.js", "assets/api.js", "assets/data.js", "assets/common.js"] + [f"assets/{l}" for l in libs] + [f"assets/pages/{e}.js" for e in pre] + [f"assets/pages/{name}.js"]
    url = SITE + ("" if name == "index" else f"{name}.html")
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title.replace("&", "&amp;")}</title>
<meta name="description" content="{TAG} Talk summaries, quote cards, ponder questions and what stuck with us from the October 2026 General Conference. Not an official Church site.">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Six Months of Light">
<meta property="og:title" content="{title.replace("&", "&amp;")}">
<meta property="og:description" content="{TAG} Not an official Church site.">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}assets/og/site.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d1326">
<link rel="icon" href="assets/logo-mark.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/CormorantGaramond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<main class="wrap" id="main"></main>
''' + "\n".join(f'<script src="{s}"></script>' for s in scripts) + "\n</body>\n</html>\n"
    (root / f"{name}.html").write_text(html)
print("shells written")
