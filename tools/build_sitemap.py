# Writes sitemap.xml and robots.txt (https only) from the pages on disk.
import pathlib, json, datetime
root = pathlib.Path(__file__).resolve().parent.parent
SITE = json.loads((root / "assets/data.js").read_text().split("window.CONF = ", 1)[1].rstrip().rstrip(";"))["site_url"]
assert SITE.startswith("https://")
skip = {"moderate.html", "404.html", "live.html", "quote.html", "talk.html"}   # the last three only redirect
pages = [p for p in sorted(root.glob("*.html")) if p.name not in skip and not p.name.startswith("_")] + sorted((root / "talks").glob("*.html"))
today = datetime.date.today().isoformat()
urls = [SITE + ("" if p.name == "index.html" and p.parent == root else str(p.relative_to(root))) for p in pages]
(root / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n")
(root / "robots.txt").write_text(f"User-agent: *\nDisallow: /moderate.html\nSitemap: {SITE}sitemap.xml\n")
print("sitemap urls:", len(urls))
