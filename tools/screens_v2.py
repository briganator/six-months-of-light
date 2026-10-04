# v2 screenshots into screenshots/v2/. Usage: python tools/screens_v2.py [base_url]
import sys, pathlib
from playwright.sync_api import sync_playwright
B = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765").rstrip("/") + "/"
out = pathlib.Path(__file__).resolve().parent.parent / "screenshots/v2"; out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    m = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.goto(B); m.wait_for_timeout(2800); m.screenshot(path=str(out / "01-home-mobile-390.png"))
    m.evaluate("scrollTo(0, document.querySelector('#totw').offsetTop - 40)"); m.wait_for_timeout(900); m.screenshot(path=str(out / "02-home-mobile-sticky-header-subnav.png"))
    m.goto(B + "builder.html"); m.wait_for_timeout(2500); m.screenshot(path=str(out / "03-studio-mobile-quote-tab.png"))
    m.click("#tab-look"); m.wait_for_timeout(500); m.evaluate("scrollTo(0, 900)"); m.wait_for_timeout(500)
    m.click("button.look[data-look='photo-dc-dusk']"); m.wait_for_timeout(1500); m.screenshot(path=str(out / "04-studio-mobile-pinned-preview-share-bar.png"))
    m.click("#igBtn"); m.wait_for_timeout(400); m.screenshot(path=str(out / "05-studio-mobile-ready-instagram-tip.png"))
    m.goto(B + "insights.html"); m.wait_for_timeout(2000); m.evaluate("scrollTo(0, document.querySelector('#cards').offsetTop - 120)"); m.wait_for_timeout(800); m.screenshot(path=str(out / "06-insights-mobile-cards.png"))
    d = b.new_page(viewport={"width": 1440, "height": 900})
    d.goto(B + "builder.html?t=sat-am-1-gong&q=0&look=photo-slc&size=portrait"); d.wait_for_timeout(2800); d.screenshot(path=str(out / "07-studio-desktop-1440.png"))
    d.click("#share"); d.wait_for_timeout(900); d.screenshot(path=str(out / "08-share-sheet-desktop-fallback.png"))
    d.goto(B); d.wait_for_timeout(2500); d.screenshot(path=str(out / "09-home-desktop-1440.png"))
    b.close()
print("ok")
