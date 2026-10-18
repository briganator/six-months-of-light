// LessonPDF: real, vector PDF files for the lesson print buttons (iPhone Safari can't be trusted with window.print()).
// Uses pdf-lib (MIT, assets/vendor/pdf-lib.min.js) with the built-in PDF fonts, so text stays sharp and files stay small.
// build(model) -> Uint8Array. Model: { kicker, title, byline, blocks: [{ t: "h"|"p"|"li"|"q"|"core"|"seg"|"src"|"line", text, time, who }], foot, fit }
// fit: true = shrink the type until everything fits on one page (one-page lesson and handouts).
(function () {
  const W = 612, H = 792, M = 48;                        // US Letter, 2/3-inch margins
  const GOLD = [0.66, 0.48, 0.21], INK = [0.11, 0.1, 0.13], MUTED = [0.35, 0.34, 0.4];
  // Built-in PDF fonts only cover WinAnsi; keep accents we can, fold the rest (e.g. ʻokina, macrons) to the nearest letter.
  const WIN = /[\u0020-\u007e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026]/;
  const safe = s => [...String(s || "").replace(/[\u02bb\u02bc]/g, "'").replace(/\s+/g, " ").trim()].map(c => WIN.test(c) ? c : (c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\u0020-\u007e]/g, "") || "")).join("");
  function wrap(text, font, size, width) {
    const words = safe(text).split(" "), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (font.widthOfTextAtSize(t, size) <= width || !cur) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur); return lines;
  }
  async function build(model) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const col = a => rgb(a[0], a[1], a[2]);
    const plan = async (k, draw) => {          // k = type scale; returns pages used
      const doc = draw ? await PDFDocument.create() : null;
      const F = draw ? { sans: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), serif: await doc.embedFont(StandardFonts.TimesRoman), serifI: await doc.embedFont(StandardFonts.TimesRomanItalic), serifB: await doc.embedFont(StandardFonts.TimesRomanBold) } : fontsM;
      let page = draw ? doc.addPage([W, H]) : null, y = H - M, pages = 1;
      const need = h => { if (y - h < M + 24) { pages++; if (draw) page = doc.addPage([W, H]); y = H - M; } };
      const text = (s, x, size, font, color) => { if (draw) page.drawText(s, { x, y: y - size, size, font, color: col(color) }); };
      const para = (s, { font = F.sans, size = 10.5 * k, color = INK, x = M, width = W - 2 * M, lead = 1.32, gap = 3 * k, bullet = "" } = {}) => {
        const bw = bullet ? font.widthOfTextAtSize(bullet + " ", size) : 0;
        wrap(s, font, size, width - bw).forEach((ln, i) => { need(size * lead); if (bullet && i === 0) text(bullet, x, size, font, color); text(ln, x + bw, size, font, color); y -= size * lead; });
        y -= gap;
      };
      if (model.kicker) para(model.kicker.toUpperCase(), { font: F.bold, size: 8.5 * k, color: GOLD, gap: 2 * k });
      para(model.title, { font: F.serifB, size: 20 * k, lead: 1.15, gap: 2 * k });
      if (model.byline) para(model.byline, { size: 10 * k, color: MUTED, gap: 6 * k });
      if (draw) page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.2, color: col(GOLD) }); y -= 8 * k;
      for (const b of model.blocks) {
        if (b.t === "h") { y -= 4 * k; need(30 * k); para(b.text.toUpperCase(), { font: F.bold, size: 9 * k, color: GOLD, gap: 2 * k }); }
        else if (b.t === "core") { y -= 2 * k; para("ONE CORE TRUTH", { font: F.bold, size: 8 * k, color: GOLD, gap: 1 }); para(b.text, { font: F.serifB, size: 13.5 * k, lead: 1.2, gap: 6 * k }); }
        else if (b.t === "seg") { y -= 3 * k; need(40 * k); const tw = 74 * k, top = y;
          para(b.time, { font: F.bold, size: 10.5 * k, width: tw, gap: 0 }); const yAfterTime = y; y = top;
          para(b.text + (b.who ? "  ·  " + b.who : ""), { font: F.serifB, size: 12.5 * k, x: M + tw, width: W - 2 * M - tw, gap: 1 * k });
          for (const it of b.items || []) para(it, { size: 9.8 * k, x: M + tw, width: W - 2 * M - tw, bullet: "•", gap: 1.5 * k });
          y = Math.min(y, yAfterTime) - 2 * k;
          if (draw) page.drawLine({ start: { x: M, y: y + 1 }, end: { x: W - M, y: y + 1 }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) }); y -= 3 * k; }
        else if (b.t === "q") para("“" + b.text.replace(/^“|”$/g, "") + "”", { font: F.serifI, size: 12 * k, x: M + 10, width: W - 2 * M - 10, lead: 1.25, gap: 4 * k });
        else if (b.t === "li") para(b.text, { size: 10.5 * k, x: M + 4, width: W - 2 * M - 4, bullet: b.n ? b.n + "." : "•", gap: 2.5 * k });
        else if (b.t === "src") para(b.text, { size: 8 * k, color: MUTED, gap: 3 * k });
        else if (b.t === "line") { y -= 6 * k; para(b.text + "  ________________________________________", { size: 10.5 * k, gap: 4 * k }); }
        else para(b.text, { size: 10.5 * k, gap: 4 * k });
      }
      if (draw) { const foot = safe(model.foot || ""); doc.getPages().forEach(pg => { pg.drawLine({ start: { x: M, y: M + 14 }, end: { x: W - M, y: M + 14 }, thickness: 0.4, color: rgb(0.75, 0.75, 0.75) }); pg.drawText(foot, { x: M, y: M, size: 7.5, font: F.sans, color: col(MUTED) }); });
        doc.setTitle(safe(model.title)); doc.setAuthor("Six Months of Light"); doc.setCreator("sixmonthsoflight.com"); doc.setSubject(safe(model.kicker || ""));
        return doc.save(); }
      return pages;
    };
    // Measure with real font metrics (from a scratch document), then draw at the largest scale that fits.
    const scratch = await PDFDocument.create();
    var fontsM = { sans: await scratch.embedFont(StandardFonts.Helvetica), bold: await scratch.embedFont(StandardFonts.HelveticaBold), serif: await scratch.embedFont(StandardFonts.TimesRoman), serifI: await scratch.embedFont(StandardFonts.TimesRomanItalic), serifB: await scratch.embedFont(StandardFonts.TimesRomanBold) };
    let k = 1; if (model.fit) while (k > 0.62 && (await plan(k, false)) > 1) k -= 0.04;
    return plan(k, true);
  }
  let libP = null;
  const ready = () => libP || (libP = window.PDFLib ? Promise.resolve() : new Promise((ok, bad) => { const s = document.createElement("script"); s.src = "assets/vendor/pdf-lib.min.js"; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }));
  window.LessonPDF = { build, ready, safe };
})();
