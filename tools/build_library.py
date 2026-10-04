# Builds assets/library-data.js (window.LIB): a multi-conference study library of DERIVED metadata only.
# Source: official general conference pages on churchofjesuschrist.org, cached by tools/harvest_official.py in
# /workspace/.cache/gc-raw (outside the repo). Stored per talk: title, speaker, calling, session, word count,
# the official one-sentence kicker (a short verified excerpt), scripture references (from footnotes, de-duplicated),
# hymns cited in footnotes, theme-keyword densities, Savior-title and place counts, invitation/promise/question counts,
# and top words. No talk text is stored.     python3 tools/build_library.py
import re, json, html, pathlib, collections, unicodedata
ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = pathlib.Path("/workspace/.cache/gc-raw")
src = open(ROOT / "tools/harvest_official.py").read()
ns = {"__file__": str(ROOT / "tools/harvest_official.py")}
exec(src.split("# ---- taxonomy")[0].split("def get(")[0] + "\n# ---- taxonomy" + src.split("# ---- taxonomy")[1].split("strip = lambda")[0], ns)
THEMES, THEME_RE, STOP, REF_RE, TITLE_RE, PLACE_RE = ns["THEMES"], ns["THEME_RE"], ns["STOP"], ns["REF_RE"], ns["TITLE_RE"], ns["PLACE_RE"]
strip = lambda s: html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("\xa0", " ")
MONTH = {"04": "April", "10": "October"}
# Same person, different official name forms across years
ALIAS = {"Becky Craven": "Rebecca L. Craven"}


def slug(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"^(elder|sister|president|bishop|brother)\s+", "", s); return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
HYMN_RE = re.compile(r"“([^”]{3,80}?)\s*,?\s*”\s*(Hymns\s*—\s*For Home and Church|Hymns|Children’s Songbook)\s*,?\s*(?:no\.\s*)?(\d{1,4})")
BOOKONLY = re.compile(r"^(\d{1,3})(?::(\d{1,3}))?")
SKIP = re.compile(r"sustaining|auditing|statistical|report", re.I)
def sessions_for(conf):
    s = (RAW / f"index-{conf}.html").read_text(); out = []
    for m in re.finditer(r">([A-Z][A-Za-z’' ]{3,40}Session)<", s):
        if m.group(1) not in out: out.append(m.group(1))
    names = {"1": "Saturday Morning Session", "2": "Saturday Afternoon Session", "4": "Sunday Morning Session", "5": "Sunday Afternoon Session"}
    third = [x for x in out if x not in names.values()]
    if third: names["3"] = third[0]
    return names
talks, confs = [], []
for idx in sorted(RAW.glob("index-*.html")):
    conf = idx.stem[6:]; y, m = conf.split("-")
    files = sorted(f for f in RAW.glob(f"{conf}-*.json"))
    if not files: continue
    smf = RAW / f"sessions-{conf}.json"   # older conferences (slug URLs): slug -> session key, written by the harvester
    smap = json.loads(smf.read_text()) if smf.exists() else None
    if smap:
        pretty = lambda sl: {"womens-session": "Women’s Session", "general-womens-session": "General Women’s Session"}.get(sl, " ".join(w.capitalize() for w in sl.split("-")))
        sess = {k: pretty(v) for k, v in smap["sessions"].items()}
    else: sess = sessions_for(conf)
    n0 = len(talks)
    for f in files:
        tid = f.stem[len(conf) + 1:]
        try: d = json.loads(f.read_text())
        except Exception: continue
        meta, body = d["meta"], d["content"].get("body", "")
        title = html.unescape(meta.get("title", "")).strip()
        mm = re.search(r'class="author-name"[^>]*>(.*?)</p>', body, re.S); speaker = re.sub(r"^\s*(By|Presented by)\s+", "", strip(mm.group(1))).strip() if mm else ""
        mm = re.search(r'class="author-role"[^>]*>(.*?)</p>', body, re.S); role = strip(mm.group(1)).strip() if mm else ""
        mm = re.search(r'<p class="kicker"[^>]*>(.*?)</p>', body, re.S); kicker = re.sub(r"\s+", " ", strip(mm.group(1))).strip() if mm else ""
        main = re.sub(r"<header>.*?</header>", " ", body, flags=re.S); main = re.sub(r"<(figure|video|aside)[^>]*>.*?</\1>", " ", main, flags=re.S)
        text = re.sub(r"\s+", " ", " ".join(strip(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", main, re.S)))
        low = text.lower().replace("’", "'"); words = re.findall(r"[a-z][a-z'-]+", low)
        if len(words) < 300 or SKIP.search(title) or not speaker or SKIP.search(tid): continue
        cnt = collections.Counter(w.replace("'s", "") for w in words if w.replace("'s", "") not in STOP and len(w) > 3)
        notes = d["content"].get("footnotes") or {}
        refs, hymns = [], []
        for n in (notes.values() if isinstance(notes, dict) else []):
            last = None
            for r in n.get("referenceUris") or []:
                if r.get("type") != "scripture-ref": continue
                t = strip(r.get("text", "")).strip()
                mm = REF_RE.search(t)
                if mm: b, ch, v = mm.groups(); last = "Psalms" if b == "Psalm" else b
                else:
                    mb = BOOKONLY.match(t)
                    if not (mb and last): continue
                    b, (ch, v) = last, mb.groups()
                ref = f"{'Psalms' if b == 'Psalm' else b} {ch}" + (f":{v}" if v else "")
                if ref not in refs: refs.append(ref)
            for t, bk, no in HYMN_RE.findall(strip(n.get("text", ""))):
                key = "cs" if bk.startswith("Children") else "hfhc" if "Home" in bk else "hymns"
                h = [t.strip(), key, int(no)]
                if h not in hymns: hymns.append(h)
        sentences = re.split(r"(?<=[.?!])\s+", text)
        dens = {k: round(len(r.findall(low)) * 1000 / len(words), 1) for k, r in THEME_RE.items()}
        talks.append({"c": conf, "id": tid, "t": title, "s": speaker, "sp": slug(ALIAS.get(speaker, speaker)), "r": role, "se": (smap["talks"].get(tid) if smap else None) or tid[0], "w": len(words), "k": kicker,
                      "d": {k: v for k, v in dens.items() if v}, "rf": refs[:30], "h": hymns,
                      "inv": len(re.findall(r"\bi (?:invite|extend an invitation|encourage you)", low)), "pro": len(re.findall(r"\bi promise", low)),
                      "q": sum(1 for s in sentences if s.strip().endswith("?")),
                      "ti": {k: n for k, r in TITLE_RE.items() if (n := len(r.findall(low)))}, "pl": {k: n for k, r in PLACE_RE.items() if (n := len(r.findall(text)))},
                      "tw": [w for w, _ in cnt.most_common(10)]})
    confs.append({"c": conf, "label": f"{MONTH[m]} {y}", "sessions": sess, "n": len(talks) - n0,
                  "url": f"https://www.churchofjesuschrist.org/study/general-conference/{y}/{m}?lang=eng"})
# theme tags: density well above that theme's corpus mean
mean = {k: sum(t["d"].get(k, 0) for t in talks) / len(talks) for k in THEMES}
for t in talks:
    sc = sorted(((t["d"].get(k, 0) / (mean[k] or 1), k) for k in THEMES), reverse=True)
    t["tg"] = [k for r, k in sc[:3] if r >= 1.8 and t["d"].get(k, 0) >= 2]
music = json.loads((ROOT / "tools/music_sessions.json").read_text())
links = json.loads((ROOT / "tools/hymn_links.json").read_text())
LIB = {"coverage": {"from": confs[0]["label"], "to": confs[-1]["label"], "conferences": len(confs), "talks": len(talks),
                    "note": "Official churchofjesuschrist.org talk pages (metadata, footnotes and derived counts only). October 2026 comes from this site's recaps until official text is posted."},
       "themeMean": {k: round(v, 2) for k, v in mean.items()}, "themeKeys": {k: v["keys"] for k, v in THEMES.items()},
       "titles": ns["TITLES"], "confs": confs, "talks": talks,
       "music": [{"c": s["c"], "se": s["session"], "choir": s["choir"].rstrip("*"), "songs": [[x["t"], x["b"], x["n"]] for x in s["songs"]]} for s in music],
       "hymnLinks": {k: v for k, v in links.items() if v}}
out = "// GENERATED by tools/build_library.py from official churchofjesuschrist.org pages. Derived metadata and counts only; no talk text.\nwindow.LIB = " + json.dumps(LIB, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "assets/library-data.js").write_text(out)
print(len(confs), "conferences", len(talks), "talks", round(len(out) / 1024), "KB")
print(collections.Counter(len(t["tg"]) for t in talks), sum(len(t["h"]) for t in talks), "hymn cites", sum(len(t["rf"]) for t in talks), "refs")
