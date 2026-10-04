"""Verify official Gospel Library music page for each song title (title must match). Cached."""
import json, os, re, time, urllib.request, html, unicodedata
D = os.path.dirname(__file__)
OUT = os.path.join(D, "hymn_links.json")
UA = "Mozilla/5.0 (compatible; SixMonthsOfLight/1.0; sixmonthsoflight.com)"
def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    t = re.sub(r"['’]", "", t.lower()); t = re.sub(r"[^a-z0-9]+", "-", t).strip("-"); return t
def norm(t): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", t.replace("’", "'")).encode("ascii","ignore").decode().lower())
cache = json.load(open(OUT)) if os.path.exists(OUT) else {}
titles = set()
for r in json.load(open(os.path.join(D, "music_sessions.json"))):
    for s in r.get("songs", []): titles.add(s["t"])
extra = os.path.join(D, "hymn_titles_extra.json")
if os.path.exists(extra): titles |= set(json.load(open(extra)))
for t in sorted(titles):
    if t in cache: continue
    u = f"https://www.churchofjesuschrist.org/media/music/songs/{slug(t)}?lang=eng"
    ok = None
    try:
        h = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=30).read().decode("utf8", "ignore")
        m = re.search(r"<title>([^<]*)", h); got = html.unescape(m.group(1)) if m else ""
        ok = norm(got) == norm(t)
    except Exception as e:
        print("err", t, e)
    cache[t] = u if ok else None
    print(t, "->", "OK" if ok else "no")
    json.dump(cache, open(OUT, "w"), indent=1, ensure_ascii=False)
    time.sleep(2)
