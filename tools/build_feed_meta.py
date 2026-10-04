# Writes assets/feed-meta.json for the "Get a talk" subscriptions (calendar feed, push, email).
# Runs the site's own code in a headless browser so the insight cards and theme tags match what the site shows.
# Talks themselves are read live from assets/data.js and assets/library-data.js by the feed function, so only
# re-run this when the insight cards or theme tags change:  /workspace/.venv-pw/bin/python tools/build_feed_meta.py
import json, pathlib, subprocess, time, sys
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8797", "--bind", "127.0.0.1"], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = r"""() => {
  const txt = c => { const b = c.body || {}; let s = "";
    if (b.type === "words") s = b.items.join(" · ");
    else if (b.type === "bars") s = b.items.slice(0, 6).map(x => `${x.label[0].toUpperCase() + x.label.slice(1)} (${x.value})`).join(", ");
    else if (b.type === "big") s = `${b.value} ${b.caption || ""}`.trim();
    else if (b.type === "list") s = b.items.slice(0, 5).map(x => typeof x === "string" ? x : (x.label || x.text || "")).join("; ");
    else if (Array.isArray(b.items)) s = b.items.slice(0, 6).map(x => typeof x === "string" ? x : `${x.label || x.name || ""}${x.value != null ? " (" + x.value + ")" : ""}`).join(", ");
    return { id: c.id, kicker: c.kicker || "", title: c.title, sub: c.sub || "", text: s, share: c.share || "", foot: c.foot || "", type: b.type || "" }; };
  const list = INSIGHTS.list.filter(c => c.id !== "daily").map(txt);
  const themes = {}; THEMES3.list.filter(t => t.slug !== "all").forEach(t => themes[t.slug] = t.name);
  const themeCards = Object.keys(window.THEMES).map(n => { const c = INSIGHTS.themeCard(n); return c ? Object.assign(txt(c), { theme: slug(n), name: n }) : null; }).filter(Boolean);
  return { built: new Date().toISOString(), themes, quoteTags: THEMES3.quotes, insights: list, themeCards,
           sessions: CONF.sessions.map(s => ({ id: s.id, name: s.name, url: s.url })) };
}"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg = b.new_page()
        pg.goto("http://127.0.0.1:8797/insights.html"); pg.wait_for_function("window.INSIGHTS && window.THEMES3")
        pg.add_script_tag(url="/assets/themes3.js"); pg.wait_for_timeout(500)
        data = pg.evaluate(JS); b.close()
finally:
    srv.terminate()
(root / "assets/feed-meta.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
print("feed-meta.json:", len(data["insights"]), "insights,", len(data["themeCards"]), "theme cards,", len(data["themes"]), "themes")
