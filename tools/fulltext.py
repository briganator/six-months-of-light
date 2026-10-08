# Builds assets/fulltext/<id>.json from the official October 2026 talk JSON in tools/official/.
# The Church has permitted this site to post the talks. Text is taken from the official
# language-page API responses (preferred over any earlier scrape when they differ).
# No wording is added inside the talk. Run via tools/talks_source.py.
import html, json, re
from html.parser import HTMLParser

OFFICIAL_DIR = "tools/official"
OUT_DIR = "assets/fulltext"
CHURCH = "https://www.churchofjesuschrist.org"
VOID = {"img", "source", "br", "meta", "link", "input"}
SKIP_TAGS = {"video", "source", "script", "style"}


class TreeParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {"tag": "root", "attrs": {}, "children": []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {"tag": tag, "attrs": {k: html.unescape(v) for k, v in attrs}, "children": []}
        self.stack[-1]["children"].append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i]["tag"] == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        if data:
            self.stack[-1]["children"].append(data)


def parse(fragment):
    p = TreeParser()
    p.feed(fragment)
    p.close()
    return p.root


def classes(node):
    return set((node.get("attrs") or {}).get("class", "").split())


def squash(s):
    return re.sub(r"[ \t\n\r\f\v]+", " ", s).strip()


def node_text(node):
    if isinstance(node, str):
        return node
    tag = node["tag"]
    if tag in SKIP_TAGS or tag == "img":
        return ""
    if tag == "br":
        return " "
    if tag == "sup" and "marker" in classes(node):
        return node["attrs"].get("data-value", "")
    return "".join(node_text(c) for c in node["children"])


def collect_blocks(node, notes=False, blocks=None):
    """Visible paragraphs, headings, lines and list items, in order. Skips the title, byline and video."""
    if blocks is None:
        blocks = []
    if isinstance(node, str):
        return blocks
    tag, cls = node["tag"], classes(node)
    if tag in SKIP_TAGS or tag in ("img", "br") or tag == "h1":
        return blocks
    if tag == "div" and "byline" in cls:
        return blocks
    if tag == "footer" and "notes" in cls:
        for c in node["children"]:
            if isinstance(c, dict):
                collect_blocks(c, notes=True, blocks=blocks)
        return blocks
    if tag == "p" and "title" in cls and notes:
        return blocks
    if tag == "li":
        text = squash(node_text(node))
        if text:
            blocks.append(text)
        return blocks
    if tag in ("p", "h2", "h3"):
        text = squash(node_text(node))
        if text:
            blocks.append(text)
        return blocks
    for c in node["children"]:
        if isinstance(c, dict):
            collect_blocks(c, notes=notes, blocks=blocks)
    return blocks


def esc(s):
    return html.escape(s if s is not None else "", quote=True)


def abs_url(href):
    href = (href or "").strip()
    if href.startswith("/"):
        return CHURCH + href
    if href.startswith("https://") or href.startswith("http://"):
        return href
    return None


_warned = set()


def inline(node):
    parts = []
    for c in node["children"]:
        if isinstance(c, str):
            parts.append(esc(c))
            continue
        tag, cls, attrs = c["tag"], classes(c), c["attrs"]
        if tag in ("i", "em"):
            parts.append(f"<em>{inline(c)}</em>")
        elif tag == "strong":
            parts.append(f"<strong>{inline(c)}</strong>")
        elif tag == "cite":
            parts.append(f"<cite>{inline(c)}</cite>")
        elif tag == "br":
            parts.append("<br>")
        elif tag == "sup" and "marker" in cls:
            parts.append(esc(attrs.get("data-value", "")))
        elif tag == "a":
            href = attrs.get("href", "")
            if "note-ref" in cls:
                n = href.replace("#note", "").strip() or attrs.get("data-value", "")
                sup = next((x for x in c["children"] if isinstance(x, dict) and x["tag"] == "sup"), None)
                n = (sup["attrs"].get("data-value") if sup else None) or n
                parts.append(f'<a class="fn" href="#fn-{esc(n)}" data-n="{esc(n)}" aria-label="Note {esc(n)}">{esc(n)}</a>')
            else:
                url = abs_url(href)
                kind = "ft-ref" if "scripture-ref" in cls else "ft-xref"
                inner = inline(c)
                if url:
                    parts.append(f'<a class="{kind}" href="{esc(url)}" rel="noopener" target="_blank">{inner}</a>')
                else:
                    parts.append(inner)
        elif tag == "span":
            parts.append(inline(c))
        else:
            if tag not in _warned and tag not in ("p",):
                _warned.add(tag)
            parts.append(inline(c))
    return "".join(parts)


def render_img(node):
    attrs = node["attrs"]
    src = attrs.get("src", "")
    if not (src.startswith(CHURCH + "/") or src.startswith("https://assets.churchofjesuschrist.org/")):
        return ""
    w, h = attrs.get("data-width") or attrs.get("width") or "", attrs.get("data-height") or attrs.get("height") or ""
    wh = f' width="{esc(w)}" height="{esc(h)}"' if str(w).isdigit() and str(h).isdigit() else ""
    return f'<img src="{esc(src)}" alt="{esc(attrs.get("alt", ""))}" loading="lazy" decoding="async"{wh}>'


def child_html(node, notes_acc):
    """Render children, keeping whitespace that sits between block elements (a newline becomes a space when text is read back)."""
    parts = []
    for c in node["children"]:
        if isinstance(c, str):
            if c.strip():
                parts.append(esc(c))
            elif parts:
                parts.append("\n")
        else:
            parts.append(render_blocks(c, notes_acc))
    return "".join(parts)


def render_blocks(node, notes_acc):
    if isinstance(node, str):
        return ""
    tag, cls = node["tag"], classes(node)
    if tag in SKIP_TAGS or tag == "h1" or (tag == "div" and "byline" in cls):
        return ""
    if tag == "footer" and "notes" in cls:
        for c in node["children"]:
            if isinstance(c, dict) and c["tag"] == "ol":
                for li in c["children"]:
                    if not isinstance(li, dict) or li["tag"] != "li":
                        continue
                    n = (li["attrs"].get("id") or "").replace("note", "") or li["attrs"].get("data-marker", "").rstrip(".")
                    body = child_html(li, notes_acc)
                    if not body:
                        text = squash(node_text(li))
                        body = f"<p>{esc(text)}</p>" if text else ""
                    if body:
                        notes_acc.append({"n": str(n), "html": body})
        return ""
    if tag == "p" and "title" in cls:
        return ""
    if tag == "p":
        kind = "ft-kicker" if "kicker" in cls else "ft-sub" if "subtitle" in cls else "ft-line" if "line" in cls else "ft-credit" if "credit" in cls or (node.get("_credit")) else ""
        # credit class is on the wrapping div; the p itself has no credit class
        cls_attr = f' class="{kind}"' if kind else ""
        inner = inline(node)
        if not squash(re.sub(r"<[^>]+>", " ", inner)):
            return ""
        return f"<p{cls_attr}>{inner}</p>"
    if tag in ("h2", "h3"):
        return f'<{tag} class="ft-h">{inline(node)}</{tag}>'
    if tag == "ul":
        items = []
        for li in node["children"]:
            if isinstance(li, dict) and li["tag"] == "li":
                inner = child_html(li, notes_acc)
                if inner.strip():
                    items.append(f"<li>{inner}</li>")
        return f'<ul class="ft-list">{"".join(items)}</ul>' if items else ""
    if tag == "img":
        img = render_img(node)
        return f'<figure class="ft-fig">{img}</figure>' if img else ""
    if tag == "figure":
        bits = []
        for c in node["children"]:
            if isinstance(c, str):
                continue
            if c["tag"] == "img":
                bits.append(render_img(c))
            elif "credit" in classes(c):
                for p in c["children"]:
                    if isinstance(p, dict) and p["tag"] == "p":
                        bits.append(f'<p class="ft-credit">{inline(p)}</p>')
            else:
                bits.append(render_blocks(c, notes_acc))
        return f'<figure class="ft-fig">{"".join(bits)}</figure>' if any(bits) else ""
    if tag == "div" and "poetry" in cls:
        return f'<div class="ft-poem">{child_html(node, notes_acc)}</div>'
    if tag == "div" and "stanza" in cls:
        return f'<div class="ft-stanza">{child_html(node, notes_acc)}</div>'
    if tag == "section":
        return f'<section class="ft-sec">{child_html(node, notes_acc)}</section>'
    return child_html(node, notes_acc)


def video_info(root):
    def find(node):
        if isinstance(node, str):
            return None
        if node["tag"] == "video":
            return node
        for c in node["children"]:
            if isinstance(c, dict):
                hit = find(c)
                if hit:
                    return hit
        return None
    vid = find(root)
    if not vid:
        return None
    poster = vid["attrs"].get("poster") or ""
    if not poster.startswith(CHURCH + "/"):
        poster = ""
    src720 = src360 = None
    for c in vid["children"]:
        if not isinstance(c, dict) or c["tag"] != "source":
            continue
        src = c["attrs"].get("src", "")
        if "assets.churchofjesuschrist.org" not in src or not src.endswith(".mp4"):
            continue
        if "-720p-" in src:
            src720 = src
        elif "-360p-" in src:
            src360 = src
    src = src720 or src360
    if not src:
        return None
    return {"src": src, "poster": poster or None, "duration": vid["attrs"].get("data-duration-string") or None}


def audio_url(meta):
    for a in meta.get("audio") or []:
        url = a.get("mediaUrl") or ""
        if a.get("variant") == "audio" and url.startswith("https://assets.churchofjesuschrist.org/") and url.endswith(".mp3"):
            return url
    return None


def official_page(meta):
    canon = (meta.get("canonicalUrl") or "").strip()
    if canon.startswith("/"):
        return CHURCH + "/study" + canon
    return canon or None


def generated_blocks(body_html, notes):
    wrapped = body_html + "<ol>" + "".join(f'<li id="fn-{esc(n["n"])}">{n["html"]}</li>' for n in notes) + "</ol>"
    return collect_blocks(parse(wrapped))


def soft(s):
    s = s.replace("\u00a0", " ").replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("—", "-").replace("–", "-")
    return re.sub(r"\s+", " ", s)


def build(root, talks, official_ids, business_specs):
    """Write per-talk JSON and a search index. Returns business records for data.js."""
    src_dir = root / OFFICIAL_DIR
    out_dir = root / OUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    by_official = {v: k for k, v in official_ids.items()}
    talk_by_id = {t["id"]: t for t in talks}
    index = {}
    business = []
    specs = [{"id": by_official[oid], "official_id": oid, "kind": "talk"} for oid in official_ids.values()]
    specs += business_specs
    missing = [s["official_id"] for s in specs if not (src_dir / f'{s["official_id"]}.json').exists()]
    if missing:
        raise SystemExit("missing official JSON: " + ", ".join(missing))
    for spec in specs:
        raw = json.loads((src_dir / f'{spec["official_id"]}.json').read_text())
        meta, content = raw["meta"], raw["content"]
        tree = parse(content.get("body") or "")
        expected = collect_blocks(tree)
        notes = []
        body = render_blocks(tree, notes)
        got = generated_blocks(body, notes)
        if got != expected:
            for i, (a, b) in enumerate(zip(got, expected)):
                if a != b:
                    raise SystemExit(f'{spec["official_id"]} block {i} differs\nOURS: {a[:400]!r}\nOFFICIAL: {b[:400]!r}')
            raise SystemExit(f'{spec["official_id"]} block count {len(got)} != {len(expected)}')
        doc = {
            "id": spec["id"],
            "audio": audio_url(meta),
            "video": video_info(tree),
            "body": body,
            "notes": notes,
        }
        (out_dir / f'{spec["id"]}.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n")
        plain = "\n".join(expected)
        index[spec["id"]] = plain
        page = official_page(meta)
        if spec["kind"] == "talk":
            t = talk_by_id[spec["id"]]
            if page and t.get("official_url") and t["official_url"] != page:
                print("note: official url", spec["id"], t["official_url"], "->", page)
                t["official_url"] = page
            blob = soft(plain)
            for q in t.get("quotes") or []:
                if soft(q) not in blob:
                    print("quote not in full text:", spec["id"], q[:90])
        else:
            name = role = ""
            def walk_byline(node):
                nonlocal name, role
                if isinstance(node, str):
                    return
                cls = classes(node)
                if node["tag"] == "p" and "author-name" in cls:
                    name = squash(node_text(node))
                elif node["tag"] == "p" and "author-role" in cls:
                    role = squash(node_text(node))
                else:
                    for c in node["children"]:
                        if isinstance(c, dict):
                            walk_byline(c)
            walk_byline(tree)
            lead = expected[0] if expected else ""
            business.append({
                "id": spec["id"],
                "session": spec["session"],
                "kind": "business",
                "speaker": name,
                "calling": role,
                "title": (meta.get("title") or "").strip(),
                "lead": lead,
                "official_url": page,
                "full_text_permitted": True,
            })
        print(f'{spec["id"]}: {len(expected)} blocks, {len(notes)} notes, audio={bool(doc["audio"])}, video={bool(doc["video"])}')
    (out_dir / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n")
    print("index bytes", (out_dir / "index.json").stat().st_size)
    return business
