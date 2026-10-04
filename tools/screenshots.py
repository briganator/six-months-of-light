# Local preview screenshots (headless Chrome via Playwright).
#   python tools/screenshots.py [base_url] [admin_password]
# With no password, uses the browser-only mock backend (?mock=1, password "preview").
import sys, pathlib
from playwright.sync_api import sync_playwright
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765"
pw = sys.argv[2] if len(sys.argv) > 2 else "preview"
m = "&mock=1" if pw == "preview" else ""
out = pathlib.Path(__file__).resolve().parent.parent / "screenshots"
talk = "sat-pm-7-kearon"
VPS = [("mobile-390", {"width": 390, "height": 844}, True), ("desktop-1280", {"width": 1280, "height": 900}, False)]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for label, vp, mobile in VPS:
        ctx = b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
        pg = ctx.new_page()
        def shot(url, name, wait=900, full=True):
            pg.goto(f"{base}/{url}{m}"); pg.wait_for_timeout(wait)
            pg.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))"); pg.wait_for_timeout(900)
            pg.screenshot(path=str(out / f"{name}-{label}.png"), full_page=full)
        shot("index.html?x=1", "01-home")
        pg.goto(f"{base}/index.html?x=1{m}"); pg.wait_for_timeout(3200); pg.screenshot(path=str(out / f"00-home-hero-{label}.png"))
        pg.goto(f"{base}/talks/{talk}.html?x=1{m}"); pg.wait_for_timeout(2500)
        pg.click("[data-save='2']"); pg.click("#commit"); pg.fill("#note", "Look for lift this week.")
        pg.wait_for_timeout(800)
        shot(f"talks/{talk}.html?x=1", "02-talk", 2500)
        pg.goto(f"{base}/builder.html?t=sat-pm-2-farnes&q=2&bg=mountains&theme=dusk&font=classic&size=portrait{m}"); pg.wait_for_timeout(1200)
        pg.fill("#note", "Pray each morning to notice one person to help."); pg.wait_for_timeout(900)
        pg.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))"); pg.wait_for_timeout(900)
        pg.screenshot(path=str(out / f"03-card-builder-{label}.png"), full_page=True)
        pg.click("#more"); pg.wait_for_selector(".sheet"); pg.wait_for_timeout(700)
        pg.screenshot(path=str(out / f"03b-share-sheet-{label}.png"))
        shot("insights.html?x=1", "04-insights")
        shot("quiz.html?x=1", "05-quiz")
        shot("my.html?x=1", "06-my-conference")
        shot(f"speaker.html?s=patrick-kearon", "07-speaker")
        shot("lessons.html?x=1", "08-lesson-helps")
        shot("challenge.html?x=1", "09-challenge", 2500)
        pg.goto(f"{base}/moderate.html?x=1{m}"); pg.fill("#pw", pw); pg.click("#lf button")
        pg.wait_for_selector("#queue:not([hidden])", timeout=15000); pg.wait_for_timeout(800)
        pg.screenshot(path=str(out / f"10-admin-queue-{label}.png"), full_page=True)
        ctx.close()
    b.close()
print("saved to", out)
