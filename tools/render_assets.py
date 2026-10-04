# Renders: Open Graph images (assets/og/*.png), sample still quote cards (1:1, 4:5, 9:16),
# and sample animated 9:16 MP4s — all locally with headless Chrome + ffmpeg.
#   python tools/render_assets.py [base_url]     (serve the project root first)
import sys, base64, subprocess, pathlib
from playwright.sync_api import sync_playwright
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765"
root = pathlib.Path(__file__).resolve().parent.parent
og = root / "assets/og"; og.mkdir(parents=True, exist_ok=True)
cards = root / "screenshots/cards"; cards.mkdir(parents=True, exist_ok=True)
SAMPLES_STILL = [("sat-pm-7-kearon", 2, "dusk", {"bg": "rays"}), ("sat-am-3-causse", 2, "dawn", {"bg": "mountains"}),
                 ("sat-pm-8-dunn", 0, "midnight", {"bg": "aurora", "font": "italic"}),
                 ("sat-pm-2-farnes", 2, "dusk", {"bg": "mountains", "font": "modern", "note": "Pray each morning to notice one person to help."})]
SAMPLES_VIDEO = [("sat-pm-7-kearon", 2, "dusk", {"bg": "rays"}), ("sat-am-3-causse", 2, "dawn", {"bg": "mountains"})]
FPS, SECS = 30, 10
dec = lambda u: base64.b64decode(u.split(",", 1)[1])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(); pg.goto(f"{base}/tools/render.html"); pg.evaluate("window.ready")
    ids = pg.evaluate("CONF.talks.map(t => t.id)")
    for i in ids: (og / f"{i}.jpg").write_bytes(dec(pg.evaluate("id => og(id)", i)))
    (og / "site.jpg").write_bytes(dec(pg.evaluate("ogSite()")))
    print("OG images:", len(ids) + 1)
    for tid, q, th, ex in SAMPLES_STILL:
        for size in ["square", "portrait", "story"]:
            tag = "-note" if ex.get("note") else ""
            (cards / f"{tid}-q{q}-{size}-{th}-{ex['bg']}{tag}.png").write_bytes(dec(pg.evaluate("a => card(...a)", [tid, q, size, th, None, ex])))
    print("stills done")
    for tid, q, th, ex in SAMPLES_VIDEO:
        out = cards / f"{tid}-q{q}-story-{th}-{ex['bg']}-animated.mp4"
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
        for f in range(FPS * SECS):
            ff.stdin.write(dec(pg.evaluate("a => card(...a)", [tid, q, "story", th, f / FPS, ex])))
        ff.stdin.close(); ff.wait(); print("video:", out.name, ff.returncode)
    b.close()
