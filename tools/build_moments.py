#!/usr/bin/env python3
"""Build assets/moments.json from per-talk moments files.

Each input folder is <talk-id>/moments.json (a list of moment objects from the
clip pass: verbatim hook and text, source-video times, spoken-word indexes).

  python3 tools/build_moments.py /path/to/moments-dir

More talks: drop in another <talk-id>/moments.json and rerun, or append a talk
array to assets/moments.json by hand. Keep new moments at the end of a talk so
existing default looks stay put. "skip" rows are left out. Captions in the
editor use `text` (official words) and `idx` (indexes into assets/timings).
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def talk_order():
    text = (ROOT / "assets/data.js").read_text()
    return re.findall(r'\n   "id": "((?:sat|sun)-[^"]+)"', text)


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "tools/moments-src")
    if not src.is_dir():
        sys.exit(f"no moments directory: {src}")
    order = talk_order()
    rank = {i: n for n, i in enumerate(order)}
    folders = [p for p in src.iterdir() if (p / "moments.json").is_file()]
    folders.sort(key=lambda p: (rank.get(p.name, 10_000), p.name))
    talks, problems = {}, []
    for folder in folders:
        rows = json.loads((folder / "moments.json").read_text())
        out = []
        for m in rows:
            if m.get("score") == "skip":
                continue
            text = re.sub(r"\s+", " ", m.get("text") or "").strip()
            words = text.split(" ") if text else []
            idx = m.get("idx") or []
            if idx and len(idx) != len(words):
                problems.append(f"{folder.name}:{m.get('id')} words={len(words)} idx={len(idx)}")
            out.append({
                "id": m["id"],
                "score": m.get("score") or "maybe",
                "hook": re.sub(r"\s+", " ", m.get("hook") or "").strip(),
                "text": text,
                "why": re.sub(r"\s+", " ", m.get("why") or "").strip(),
                "a": m.get("a"),
                "b": m.get("b"),
                "i0": int(idx[0]) if idx else None,
                "i1": int(idx[-1]) if idx else None,
                "idx": [int(i) for i in idx],
            })
        if out:
            talks[folder.name] = out
    doc = {
        "v": 1,
        "conference": "October 2026",
        "note": "Verbatim official words only (hook and text). a/b are source-video seconds. idx maps each printed word to a spoken-word index in assets/timings/<talk-id>.json. Append a new talk id when more moments are ready; add moments at the end of a talk so earlier default looks stay put. The clip editor cycles eight looks by each moment's position in this list. score is strong or maybe.",
        "talks": talks,
    }
    dest = ROOT / "assets/moments.json"
    dest.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n")
    n = sum(len(v) for v in talks.values())
    strong = sum(1 for v in talks.values() for m in v if m["score"] == "strong")
    print(f"wrote {dest} · {len(talks)} talks · {n} moments · {strong} strong · {dest.stat().st_size} bytes")
    for p in problems:
        print("WARN", p)


if __name__ == "__main__":
    main()
