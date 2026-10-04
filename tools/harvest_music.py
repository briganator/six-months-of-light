"""Harvest the published session music listings (Liahona conference-issue contents pages on
churchofjesuschrist.org). Stores only titles / hymnbook numbers / choir names (public program facts)."""
import json, os, re, time, html, urllib.request
UA = "SixMonthsOfLight/1.0 (personal study site; sixmonthsoflight.com)"
CACHE = "/workspace/.cache/gc-raw"
OUT = os.path.join(os.path.dirname(__file__), "music_sessions.json")
API = "https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri="
ISSUES = [(y, m) for y in range(2021, 2027) for m in ("05", "11")]
CONF = {"05": "04", "11": "10"}

def get(uri):
    fn = os.path.join(CACHE, "liahona-" + uri.strip("/").replace("/", "-") + ".json")
    if os.path.exists(fn):
        return json.load(open(fn))
    for a in range(5):
        try:
            req = urllib.request.Request(API + uri, headers={"User-Agent": UA})
            d = json.load(urllib.request.urlopen(req, timeout=30))
            json.dump(d, open(fn, "w")); time.sleep(1.5); return d
        except Exception as e:
            code = getattr(e, "code", None)
            if code == 404: return None
            time.sleep(4 * (a + 1))
    return None

SONG = re.compile(r"“([^”]+?)[,.]?”\s*,?\s*([^;“]*)")
def parse_song(title, rest):
    title = title.strip().rstrip(",")
    rest = rest.strip().rstrip(".;,")
    book, num, arr = "", None, ""
    m = re.search(r"arr\.\s*(.+)$", rest)
    if m: arr = m.group(1).strip(); rest = rest[:m.start()].strip().rstrip(",")
    if re.match(r"Hymns\s*(—|-|–)?\s*For Home and Church|Hymns for Home and Church", rest, re.I):
        book = "hfhc"
        n = re.search(r"no\.\s*(\d+)", rest); num = int(n.group(1)) if n else None
    elif rest.startswith("Hymns"):
        book = "hymns"; n = re.search(r"no\.\s*(\d+)", rest); num = int(n.group(1)) if n else None
    elif rest.startswith("Children"):
        book = "cs"; n = re.search(r"(\d+)", rest); num = int(n.group(1)) if n else None
    else:
        book = "other"; rest_c = rest
    return {"t": title, "b": book, "n": num, "by": rest if book == "other" else "", "arr": arr}

def parse(text, conf):
    out = []
    blocks = re.split(r"\n(?=[A-Z][A-Za-z’' ]*Session,\s+[A-Z][a-z]+ \d+, \d{4})", text)
    for b in blocks[1:]:
        lines = b.split("\n")
        head = lines[0].strip()
        sess = head.split(",")[0].strip()
        body = " ".join(l.strip() for l in lines[1:])
        body = re.sub(r"\s+", " ", body)
        for mk in ("Conference Talks Available", "On the Cover", "Speaker Index", "Conference Photography"):
            if mk in body: body = body[:body.index(mk)]
        rec = {"c": conf, "session": sess, "date": head.split(",", 1)[1].strip()}
        for k, lab in (("conducting", "Conducting"), ("invocation", "Invocation"), ("benediction", "Benediction")):
            m = re.search(lab + r":\s*(.+?)(?= Invocation:| Benediction:| Music| Conducting:|$)", body)
            if m: rec[k] = m.group(1).strip()
        m = re.search(r"Music (?:by|provided by) (.+?):\s*(“.+?)(?=(?: [A-Z][A-Za-z’' ]*Session,)|$)", body)
        if m:
            credit = m.group(1)
            rec["choir"] = credit.split(";")[0].strip()
            rec["credit"] = credit.strip()
            songs = []
            for sm in SONG.finditer(m.group(2)):
                songs.append(parse_song(sm.group(1), sm.group(2)))
            rec["songs"] = songs
        out.append(rec)
    return out

def main():
    allrecs = []
    for y, m in ISSUES:
        d = get(f"/liahona/{y}/{m}/contents")
        if not d: print("missing", y, m); continue
        b = d["content"]["body"]
        t = html.unescape(re.sub(r"<[^>]+>", "\n", b)).replace("\xa0", " "); t = re.sub(r"\n\s*\n+", "\n", t)
        i = t.find("General Conference\n")
        recs = parse(t, f"{y}-{CONF[m]}")
        print(y, m, len(recs), sum(len(r.get("songs", [])) for r in recs))
        allrecs += recs
    json.dump(allrecs, open(OUT, "w"), indent=1, ensure_ascii=False)
main()
