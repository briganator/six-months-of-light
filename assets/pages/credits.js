mount("credits.html", true);
document.getElementById("main").innerHTML = `
  <div class="section-label">Credits</div><h1 style="margin-top:0">Credits &amp; licenses</h1>
  <p class="lede">Six Months of Light uses only openly licensed photos, original artwork and open-source fonts and code. It uses no Church photos, logos or trademarks.</p>
  <div class="notice"><strong>Not an official Church site.</strong> Temple photos are from Wikimedia Commons under the licenses below. Photos marked CC BY or CC BY-SA need attribution, so each card made with one carries a small credit line. Temple silhouettes, stained glass, scripture paper, hymn sheet, watercolor, olive branch, night sky and landscape looks are drawn in code by this site.</div>
  <h2>Photos (Wikimedia Commons)</h2>
  <div class="credits">${(window.PHOTOS || []).map(p => `<figure class="credit"><img src="${esc(p.thumb)}" alt="${esc(p.name)}" loading="lazy" width="120" height="90">
    <figcaption><b>${esc(p.name)}</b><span>Photo: ${esc(p.author || "Unknown")} · <a href="${esc(p.license_url || p.source)}" rel="noopener">${esc(p.license)}</a> · <a href="${esc(p.source)}" rel="noopener">Source on Wikimedia Commons ↗</a></span>
    <span class="speaker">Resized and converted to WebP for this site${/SA/.test(p.license) ? "; this adapted version is shared under the same license" : ""}.</span></figcaption></figure>`).join("")}</div>
  <h2>Fonts &amp; code</h2>
  <ul><li>Cormorant Garamond and Inter: SIL Open Font License 1.1, self-hosted.</li>
  <li>QR code generator (qrcode-generator by Kazuhiko Arase): MIT License.</li>
  <li>Logo, temple-silhouette illustrations and all card backgrounds: original to Six Months of Light.</li></ul>
  <h2>Words</h2>
  <p>Quotes and summaries come from Church News and Church Newsroom recaps of the October 2026 General Conference. Confirm them with the official text on <a href="${esc(CONF.conference_url)}" rel="noopener">ChurchofJesusChrist.org</a>. Full talk text is not reproduced.</p>`;
