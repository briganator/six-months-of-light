# Harvests DERIVED statistics from official general conference talk pages on churchofjesuschrist.org
# (publicly readable). Raw responses are cached outside the repo (/workspace/.cache/gc-raw); only derived stats
# (word counts, top words, theme keyword counts, scripture citations, hymn citations, speaker/title/link) are written
# to assets/compare-data.js. No talk text is stored in the repo.
#   python3 tools/harvest_official.py            (polite: ~1.5 s between requests, backoff on errors)
import re, json, time, html, pathlib, urllib.request, urllib.error, collections, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path("/workspace/.cache/gc-raw"); CACHE.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "SixMonthsOfLight/1.0 (personal study site; https://sixmonthsoflight.com; derived statistics only)"}
CONFS = [(y, m) for y in range(2021, 2027) for m in ("04", "10") if (y, m) <= (2026, "10")]
MONTH = {"04": "April", "10": "October"}
def get(url, cache_name, delay=1.5):
    f = CACHE / cache_name
    if f.exists(): return f.read_text()
    for k in range(7):
        time.sleep(delay + k * k * 3)
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode("utf-8", "replace")
            f.write_text(data); return data
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            print("  retry", e.code, url, flush=True)
        except Exception as e: print("  retry", e, url, flush=True)
    return None
# ---- taxonomy (keep in sync with assets/themes3.js) ----
THEMES = json.loads((ROOT / "tools/themes3.json").read_text())
THEME_RE = {k: re.compile(r"\b(" + "|".join(re.escape(w) for w in v["keys"]) + r")\b") for k, v in THEMES.items()}
STOP = set("""a an the and or but of to in on for with as at by from is are was were be been being it its this that these those we us our you your he his she her they them their i me my not no so if than then there here who whom which what when where how all any can could will would should may might must do does did have has had also into about through more most such only own same very just even each other some one two him after before over under again further once both few many much because while upon out up down off whether yet still let don't isn't can't we're it's like way things thing get make made said says say every always never am im ive youre dont theyre those whose shall unto thee thy thou hath ye go come came know knew see saw want time day days year years many also lives life people others ever really something someone well back first new may great good""".split())
BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Psalm","Proverbs","Ecclesiastes","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
 "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation",
 "1 Nephi","2 Nephi","Jacob","Enos","Jarom","Omni","Words of Mormon","Mosiah","Alma","Helaman","3 Nephi","4 Nephi","Mormon","Ether","Moroni","Doctrine and Covenants","Moses","Abraham","Joseph Smith—Matthew","Joseph Smith—History","Articles of Faith"]
BK = sorted(BOOKS, key=len, reverse=True)
REF_RE = re.compile(r"(?<![\w])(" + "|".join(re.escape(b) for b in BK) + r")\s+(\d{1,3})(?::(\d{1,3}))?")
TITLES = {"Jesus Christ": r"jesus christ", "Savior": r"(?:the )?savior", "Redeemer": r"redeemer", "the Lord": r"the lord", "Messiah": r"messiah", "Lamb of God": r"lamb of god", "Only Begotten": r"only begotten", "Good Shepherd": r"good shepherd", "Prince of Peace": r"prince of peace", "Holy One of Israel": r"holy one of israel", "Jehovah": r"jehovah", "Son of God": r"son of god", "Master": r"the master", "Light of the World": r"light of the world", "Mediator": r"mediator", "Advocate": r"advocate with the father", "Creator": r"creator", "Deliverer": r"deliverer", "Immanuel": r"[ie]mmanuel", "Bread of Life": r"bread of life"}
TITLE_RE = {k: re.compile(r"\b" + v + r"\b") for k, v in TITLES.items()}
COUNTRIES = json.loads((ROOT / "tools/places.json").read_text())  # name -> [lat, lon]
PLACE_RE = {k: re.compile(r"\b" + re.escape(k) + r"\b") for k in COUNTRIES}
HYMN_RE = re.compile(r"“([^”]{3,80}?),?”\s*(?:<[^>]+>\s*)*(?:<em>|<i>)?\s*Hymns(?:</em>|</i>)?,?\s*no\.\s*(\d{1,4})")
strip = lambda s: html.unescape(re.sub(r"<[^>]+>", " ", s))
def talk_stats(conf, tid, d):
    meta, body = d["meta"], d["content"].get("body", "")
    m = re.search(r'class="author-name"[^>]*>(.*?)</p>', body, re.S); speaker = re.sub(r"^\s*By\s+", "", strip(m.group(1))).strip() if m else ""
    m = re.search(r'class="author-role"[^>]*>(.*?)</p>', body, re.S); role = strip(m.group(1)).strip() if m else ""
    main = re.sub(r"<header>.*?</header>", " ", body, flags=re.S); main = re.sub(r"<(figure|video|aside)[^>]*>.*?</\1>", " ", main, flags=re.S)
    paras = [strip(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", main, re.S)]
    text = " ".join(paras); low = text.lower().replace("’", "'")
    words = re.findall(r"[a-z][a-z'-]+", low)
    cnt = collections.Counter(w.replace("'s", "") for w in words if w.replace("'s", "") not in STOP and len(w) > 3)
    notes = d["content"].get("footnotes") or {}
    notes_txt = " ".join(n.get("text", "") for n in notes.values()) if isinstance(notes, dict) else ""
    refs = collections.Counter()
    for src in (strip(notes_txt), text):
        for b, ch, v in REF_RE.findall(src): refs[f"{'Psalms' if b == 'Psalm' else b} {ch}" + (f":{v}" if v else "")] += 1
    books = collections.Counter(); [books.update({r.rsplit(" ", 1)[0]: n}) for r, n in refs.items()]
    hymns = collections.Counter(f"{n}|{html.unescape(re.sub('<[^>]+>', '', t)).strip()}" for t, n in HYMN_RE.findall(notes_txt))
    sentences = re.split(r"(?<=[.?!])\s+", text)
    return {"c": conf, "id": tid, "t": meta.get("title", "").strip(), "s": speaker, "r": role,
            "w": len(words), "top": cnt.most_common(25),
            "th": {k: len(r.findall(low)) for k, r in THEME_RE.items() if r.search(low)},
            "refs": refs.most_common(40), "books": dict(books), "hymns": dict(hymns),
            "inv": len(re.findall(r"\bi (?:invite|extend an invitation)", low)), "pro": len(re.findall(r"\bi promise", low)),
            "q": sum(1 for s in sentences if s.strip().endswith("?")),
            "ti": {k: len(r.findall(low)) for k, r in TITLE_RE.items() if r.search(low)},
            "pl": {k: len(r.findall(text)) for k, r in PLACE_RE.items() if r.search(text)}}
SKIP = re.compile(r"sustaining|auditing|statistical|report|session", re.I)
all_talks = []
for y, m in CONFS:
    conf = f"{y}-{m}"
    idx = get(f"https://www.churchofjesuschrist.org/study/general-conference/{y}/{m}?lang=eng", f"index-{conf}.html")
    if not idx: print(conf, "no index"); continue
    ids = []
    for tid in re.findall(rf'href="/study/general-conference/{y}/{m}/(\d{{2}}[a-z0-9-]+)\?lang=eng"', idx):
        if tid not in ids and not SKIP.search(tid): ids.append(tid)
    print(conf, len(ids), "talks", flush=True)
    for tid in ids:
        raw = get(f"https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri=/general-conference/{y}/{m}/{tid}", f"{conf}-{tid}.json")
        if not raw: print("  missing", tid); continue
        try: d = json.loads(raw)
        except Exception: print("  bad json", tid); continue
        st = talk_stats(conf, tid, d)
        if st["w"] < 300 or SKIP.search(st["t"]) or not st["s"]: continue
        all_talks.append(st)
json.dump(all_talks, open("/workspace/.cache/gc-derived.json", "w"))
print("talks:", len(all_talks))
