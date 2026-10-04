# Renders OG images (assets/og/*.jpg), v2 sample cards + MP4s (screenshots/v2/cards), and a QA matrix of every
# look x size (screenshots/v2/matrix/*.jpg contact sheets). Serve the project root first.
#   python tools/render_assets.py [base_url] [--no-matrix] [--no-video]
import sys, base64, subprocess, pathlib, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
args = [a for a in sys.argv[1:] if not a.startswith("--")]
base = args[0] if args else "http://127.0.0.1:8765"
root = pathlib.Path(__file__).resolve().parent.parent
og = root / "assets/og"; og.mkdir(parents=True, exist_ok=True)
cards = root / "screenshots/v2/cards"; cards.mkdir(parents=True, exist_ok=True)
mat = root / "screenshots/v2/matrix"; mat.mkdir(parents=True, exist_ok=True)
SAMPLES = [
  ("kearon-temple-dc-story", {"t": "sat-pm-7-kearon", "q": 2, "look": "photo-dc-dusk"}, "story"),
  ("gong-temple-slc-portrait", {"t": "sat-am-1-gong", "q": 0, "look": "photo-slc"}, "portrait"),
  ("causse-temple-dawn-square", {"t": "sat-am-3-causse", "q": 2, "look": "temple_dawn", "palette": "rose"}, "square"),
  ("farnes-stained-story-note", {"t": "sat-pm-2-farnes", "q": 2, "look": "stained", "note": "Pray each morning to notice one person to help."}, "story"),
  ("dunn-paper-portrait-left", {"t": "sat-pm-8-dunn", "q": 0, "look": "paper", "align": "left", "font": "italic"}, "portrait"),
  ("kearon-hymn-square", {"t": "sat-pm-7-kearon", "q": 0, "look": "hymn"}, "square"),
  ("olive-wide", {"t": "sat-am-1-gong", "q": 1, "look": "olive", "palette": "sage"}, "wide"),
  ("night-wallpaper", {"t": "sat-pm-7-kearon", "q": 2, "look": "temple_night"}, "wallpaper"),
  ("insight-ten-words-story", {"ins": "ten-words", "look": "watercolor", "palette": "sky"}, "story"),
  ("insight-christ-portrait", {"ins": "christ", "look": "sunrise"}, "portrait"),
  ("insight-themes-square", {"ins": "themes", "look": "minimal_dark"}, "square"),
  ("insight-scriptures-portrait", {"ins": "scriptures", "look": "paper"}, "portrait"),
  ("insight-daily-story", {"ins": "daily", "look": "night"}, "story"),
  ("insight-spotlight-portrait", {"ins": "spot-sat-pm-7-kearon", "look": "photo-provo-night"}, "portrait"),
  ("insight-theme-result-story", {"ins": "theme-temples-covenants", "look": "temple_dusk"}, "story"),
  ("insight-by-session-wide", {"ins": "themes-by-session", "look": "mountains"}, "wide"),
]
VIDEOS = [("kearon-temple-dusk-story-animated", {"t": "sat-pm-7-kearon", "q": 2, "look": "temple_dusk"}), ("ten-words-story-animated", {"ins": "ten-words", "look": "night"})]
FPS, SECS = 30, 10
dec = lambda u: base64.b64decode(u.split(",", 1)[1])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{base}/tools/render.html"); pg.evaluate("window.ready")
    ids = pg.evaluate("CONF.talks.map(t => t.id)")
    for i in ids: (og / f"{i}.jpg").write_bytes(dec(pg.evaluate("id => og(id)", i)))
    (og / "site.jpg").write_bytes(dec(pg.evaluate("ogSite()")))
    print("OG images:", len(ids) + 1)
    for name, spec, size in SAMPLES:
        (cards / f"{name}.png").write_bytes(dec(pg.evaluate("a => card(...a)", [spec, size, None])))
    print("samples:", len(SAMPLES))
    if "--no-matrix" not in sys.argv:
        looks = pg.evaluate("looks()")
        for size in ["story", "portrait", "square", "wide", "wallpaper"]:
            ims = []
            for li, lk in enumerate(looks):
                spec = {"t": "sat-pm-7-kearon", "q": 2, "look": lk} if li % 2 == 0 else {"ins": ["ten-words", "christ", "themes", "daily"][li // 2 % 4], "look": lk}
                ims.append((lk, Image.open(io.BytesIO(dec(pg.evaluate("a => card(...a)", [spec, size, None, None, .25]))))))
            w, h = ims[0][1].size; cols = 8 if size != "wide" else 5; rows = (len(ims) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * (w + 8), rows * (h + 24)), "white"); d = ImageDraw.Draw(sheet)
            for i, (lk, im) in enumerate(ims):
                x, y = (i % cols) * (w + 8), (i // cols) * (h + 24); sheet.paste(im, (x, y)); d.text((x + 2, y + h + 4), lk, fill="black")
            sheet.save(mat / f"matrix-{size}.jpg", quality=82)
        print("matrix:", len(looks), "looks x 5 sizes")
    if "--no-video" not in sys.argv:
        for name, spec in VIDEOS:
            out = cards / f"{name}.mp4"
            ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                                   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "21", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
            for f in range(FPS * SECS): ff.stdin.write(dec(pg.evaluate("a => card(...a)", [spec, "story", f / FPS, "image/jpeg"])))
            ff.stdin.close(); ff.wait(); print("video:", out.name, ff.returncode)
    print("page errors:", errs)
    b.close()
