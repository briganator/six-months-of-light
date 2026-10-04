# Renders static link-preview images for share pages (assets/og/q, assets/og/pin, assets/og/i) and writes
# tools/share_index.json for tools/build_pages.py. Serve the project root first: python3 -m http.server 8765
import sys, base64, json, pathlib
from playwright.sync_api import sync_playwright
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765"
root = pathlib.Path(__file__).resolve().parent.parent
d = {k: root / "assets/og" / k for k in ("q", "pin", "i")}; [p.mkdir(parents=True, exist_ok=True) for p in d.values()]
dec = lambda u: base64.b64decode(u.split(",", 1)[1])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"]); pg = b.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); pg.goto(f"{base}/tools/render.html"); pg.evaluate("window.ready")
    talks = pg.evaluate("CONF.talks.map(t => [t.id, t.quotes.length])"); idx = {"quotes": [], "insights": []}
    for tid, n in talks:
        for qi in range(n):
            og, look = pg.evaluate("a => shareImg(...a)", [tid, qi, "og"]); (d["q"] / f"{tid}-{qi+1}.jpg").write_bytes(dec(og))
            pin, _ = pg.evaluate("a => shareImg(...a)", [tid, qi, "pin"]); (d["pin"] / f"{tid}-{qi+1}.jpg").write_bytes(dec(pin))
            idx["quotes"].append({"t": tid, "n": qi + 1, "look": look})
    for x in pg.evaluate("shareIns()"):
        (d["i"] / f"{x['id']}.jpg").write_bytes(dec(pg.evaluate("id => insImg(id)", x["id"]))); idx["insights"].append(x)
    (root / "tools/share_index.json").write_text(json.dumps(idx, indent=1, ensure_ascii=False))
    print("quote images:", len(idx["quotes"]), "x2 · insight images:", len(idx["insights"]), "· errors:", errs); b.close()
