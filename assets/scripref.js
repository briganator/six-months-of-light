// Scripture references -> links to the scriptures on ChurchofJesusChrist.org (book slugs checked against the live site).
(function () {
  const B = { ot: "Genesis:gen|Exodus:ex|Leviticus:lev|Numbers:num|Deuteronomy:deut|Joshua:josh|Judges:judg|Ruth:ruth|1 Samuel:1-sam|2 Samuel:2-sam|1 Kings:1-kgs|2 Kings:2-kgs|1 Chronicles:1-chr|2 Chronicles:2-chr|Ezra:ezra|Nehemiah:neh|Esther:esth|Job:job|Psalms:ps|Psalm:ps|Proverbs:prov|Ecclesiastes:eccl|Song of Solomon:song|Isaiah:isa|Jeremiah:jer|Lamentations:lam|Ezekiel:ezek|Daniel:dan|Hosea:hosea|Joel:joel|Amos:amos|Obadiah:obad|Jonah:jonah|Micah:micah|Nahum:nahum|Habakkuk:hab|Zephaniah:zeph|Haggai:hag|Zechariah:zech|Malachi:mal",
    nt: "Matthew:matt|Mark:mark|Luke:luke|John:john|Acts:acts|Romans:rom|1 Corinthians:1-cor|2 Corinthians:2-cor|Galatians:gal|Ephesians:eph|Philippians:philip|Colossians:col|1 Thessalonians:1-thes|2 Thessalonians:2-thes|1 Timothy:1-tim|2 Timothy:2-tim|Titus:titus|Philemon:philem|Hebrews:heb|James:james|1 Peter:1-pet|2 Peter:2-pet|1 John:1-jn|2 John:2-jn|3 John:3-jn|Jude:jude|Revelation:rev",
    bofm: "1 Nephi:1-ne|2 Nephi:2-ne|3 Nephi:3-ne|4 Nephi:4-ne|Jacob:jacob|Enos:enos|Jarom:jarom|Omni:omni|Words of Mormon:w-of-m|Mosiah:mosiah|Alma:alma|Helaman:hel|Mormon:morm|Ether:ether|Moroni:moro",
    "dc-testament": "Doctrine and Covenants:dc|D&C:dc",
    pgp: "Moses:moses|Abraham:abr|Joseph Smith—Matthew:js-m|Joseph Smith—History:js-h|Joseph Smith–History:js-h|Joseph Smith-History:js-h|Articles of Faith:a-of-f" };
  const M = {}; Object.entries(B).forEach(([v, s]) => s.split("|").forEach(p => { const [n, k] = p.split(":"); M[n] = v + "/" + k; }));
  const names = Object.keys(M).sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const RE = new RegExp("(^|[^A-Za-z])(" + names.join("|") + ")\\s+(\\d+)(?::(\\d+))?([–-]\\d+)?", "g");
  const url = (book, ch, v) => `https://www.churchofjesuschrist.org/study/scriptures/${M[book]}/${ch}?lang=eng${v ? `&id=p${v}#p${v}` : ""}`;
  // HTML-escaped text with every recognised reference turned into a link
  const linkify = s => { let out = "", last = 0; String(s).replace(RE, (m, pre, book, ch, v, rng, at) => { const st = at + pre.length; out += esc(s.slice(last, st)); const ref = m.slice(pre.length);
    out += `<a href="${esc(url(book, ch, v))}" target="_blank" rel="noopener">${esc(ref)}</a>`; last = st + ref.length; return m; }); return out + esc(String(s).slice(last)); };
  const first = s => { RE.lastIndex = 0; const m = RE.exec(String(s)); RE.lastIndex = 0; return m ? m[0].slice(m[1].length) : null; };
  window.ScripRef = { linkify, first, url, M };
})();
