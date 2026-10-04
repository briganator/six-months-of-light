mount("credits.html", true);
document.getElementById("main").innerHTML = `
  <div class="section-label">Credits</div><h1 style="margin-top:0">Credits &amp; licenses</h1>
  <p class="lede">Six Months of Light uses only openly licensed photos, original artwork and open-source fonts and code. It uses no Church photos, logos, trademarks or modern Church artwork; paintings of the Savior are nineteenth-century public-domain works.</p>
  <div class="notice"><strong>Not an official Church site.</strong> Temple photos are from Wikimedia Commons under the licenses below. Photos marked CC BY or CC BY-SA need attribution, so each card made with one carries a small credit line. Temple silhouettes, stained glass, scripture paper, hymn sheet, watercolor, olive branch, night sky, landscape and topic looks (Sacred Grove, golden plates, pioneer trail, family tree and others) are drawn in code by this site.</div>
  <h2>Paintings of the Savior (public domain)</h2>
  <p>Nineteenth-century paintings by Carl Bloch (1834–1890) and Heinrich Hofmann (1824–1911). The works are in the public domain; the reproductions come from Wikimedia Commons, where each file is marked public domain.</p>
  <div class="credits">${(window.PHOTOS || []).filter(p => p.group === "art").map(p => `<figure class="credit"><img src="${esc(p.thumb)}" alt="${esc(p.name)}" loading="lazy" width="120" height="90">
    <figcaption><b>${esc(p.name)}</b><span>Painting: ${esc(p.author)} · Public domain · <a href="${esc(p.source)}" rel="noopener">Source on Wikimedia Commons ↗</a></span>
    <span class="speaker">Resized and converted to WebP for this site.</span></figcaption></figure>`).join("")}</div>
  <h2>Photos (Wikimedia Commons)</h2>
  <div class="credits">${(window.PHOTOS || []).filter(p => p.group !== "art").map(p => `<figure class="credit"><img src="${esc(p.thumb)}" alt="${esc(p.name)}" loading="lazy" width="120" height="90">
    <figcaption><b>${esc(p.name)}</b><span>Photo: ${esc(p.author || "Unknown")} · <a href="${esc(p.license_url || p.source)}" rel="noopener">${esc(p.license)}</a> · <a href="${esc(p.source)}" rel="noopener">Source on Wikimedia Commons ↗</a></span>
    <span class="speaker">Resized and converted to WebP for this site${/SA/.test(p.license) ? "; this adapted version is shared under the same license" : ""}.</span></figcaption></figure>`).join("")}</div>
  <h2>Fonts &amp; code</h2>
  <ul><li>Cormorant Garamond and Inter: SIL Open Font License 1.1, self-hosted.</li>
  <li>Card Studio fonts (Playfair Display, Lora, EB Garamond, Libre Baskerville, Cinzel, DM Serif Display, Merriweather, Abril Fatface, Montserrat, Raleway, Josefin Sans, Poppins, Great Vibes, Dancing Script): Google Fonts, SIL Open Font License 1.1, self-hosted and loaded only when chosen. See <a href="assets/fonts/g/OFL-NOTICE.txt">the license notice</a>.</li>
  <li>QR code generator (qrcode-generator by Kazuhiko Arase): MIT License.</li>
  <li>Logo, temple-silhouette illustrations and all card backgrounds: original to Six Months of Light.</li></ul>
  <h2>Words</h2>
  <p>Quotes and summaries come from Church News and Church Newsroom recaps of the October 2026 General Conference. Confirm them with the official text on <a href="${esc(CONF.conference_url)}" rel="noopener">ChurchofJesusChrist.org</a>. Full talk text is not reproduced.</p>`;
