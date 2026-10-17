"""Pre-build the lesson print PDFs for every October 2026 talk (assets/lesson-pdf/<mode>-<talk>-<kind>.pdf).
Phones link straight to these files (iPhone Safari opens them in its PDF viewer; Share -> Print works there).
Uses the page's own PDF builder (assets/lessonpdf.js + pdf-lib) in headless Chrome, so the files match what the
site would make. Run after changing lesson text, talk data or the PDF layout, then bump PDF_V in assets/pages/lessons.js.
  python3 -m http.server 8765 &  then  /workspace/.venv-pw/bin/python tools/build_lesson_pdfs.py
"""
import asyncio, base64, os, sys
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://localhost:8765/")
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "lesson-pdf")
KINDS = {m: ["outline", "handout", "onepage"] for m in ["fhe", "eqrs", "youth", "talk"]}
async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = await b.new_page()
        await pg.goto(BASE + "lessons.html"); await pg.wait_for_selector("#out h2")
        ids = await pg.evaluate("CONF.talks.map(t => t.id)"); n = 0
        for mode, kinds in KINDS.items():
            for tid in ids:
                await pg.goto(f"{BASE}lessons.html?mode={mode}&c=2026-10&t={tid}"); await pg.wait_for_selector("#out h2")
                for kind in kinds:
                    data = base64.b64decode(await pg.evaluate("k => window.__lessonPdf(k)", kind))
                    open(os.path.join(OUT, f"{mode}-{tid}-{kind}.pdf"), "wb").write(data); n += 1
        await b.close()
    print(n, "PDFs in", os.path.normpath(OUT))
asyncio.run(main())
