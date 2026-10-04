# QA: load every page at 390x844 and 1440x900, collect console/page errors, failed requests, broken images,
# and crawl every internal link. Usage: python tools/qa.py [base_url]
import sys, urllib.request, urllib.parse
from playwright.sync_api import sync_playwright
B = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765").rstrip("/") + "/"
PAGES = ["", "builder.html", "builder.html?ins=ten-words", "builder.html?ins=theme-temples-covenants&look=photo-slc&size=wide", "insights.html", "talks/sat-pm-7-kearon.html", "talks/sat-am-1-gong.html",
         "credits.html", "quiz.html", "my.html", "speaker.html?s=patrick-kearon", "session.html?s=sat-am", "lessons.html", "challenge.html", "groups.html", "moderate.html", "talk.html?t=sat-am-1-gong", "quote.html"]
links, problems = set(), []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    for vw, vh, tag in [(390, 844, "mobile"), (1440, 900, "desktop")]:
        pg = b.new_page(viewport={"width": vw, "height": vh}, is_mobile=tag == "mobile", has_touch=tag == "mobile")
        pg.on("pageerror", lambda e: problems.append(f"[{tag}] pageerror {pg.url}: {e}"))
        pg.on("console", lambda m: m.type == "error" and problems.append(f"[{tag}] console {pg.url}: {m.text}"))
        pg.on("response", lambda r: r.status >= 400 and problems.append(f"[{tag}] HTTP {r.status} {r.url}"))
        for u in PAGES:
            pg.goto(B + u); pg.wait_for_timeout(1200)
            for h in pg.eval_on_selector_all("a[href]", "as => as.map(a => a.href)"): links.add(h.split("#")[0])
            bad = pg.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map(i => i.src)")
            if bad: problems.append(f"[{tag}] broken images on {u}: {bad}")
            ow = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            if ow > 1: problems.append(f"[{tag}] horizontal overflow {ow}px on {u}")
        pg.close()
    b.close()
internal = sorted(l for l in links if l.startswith(B))
for l in internal:
    try: urllib.request.urlopen(l).read(1)
    except Exception as e: problems.append(f"broken link {l}: {e}")
print(f"pages: {len(PAGES)} x 2 viewports; internal links checked: {len(internal)}; external links seen: {len([l for l in links if not l.startswith(B)])}")
print("problems:", len(problems)); [print(" -", x) for x in problems]
