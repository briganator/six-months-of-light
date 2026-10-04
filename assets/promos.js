/* "Share the site" promo cards. Every number here is computed from site data at render time. */
(function () {
  const C = window.CONF, I = window.INSIGHTS, K = window.CardKit;
  const nTalks = C.talks.length, nQuotes = I.ALLQ.length, nLooks = K ? Object.keys(K.LOOKS).length : 0, nLayouts = K ? Object.keys(K.LAYOUTS).length : 0;
  const april = new Date("2027-04-03T10:00:00-06:00");
  const daysTo = () => Math.max(0, Math.ceil((april - new Date()) / 864e5));
  const tw = I.get("ten-words");
  const P = [
    { id: "study", headlines: ["Study the October 2026 talks", "Carry conference with you", "Every talk, in 60 seconds"], kicker: "SIX MONTHS OF LIGHT",
      sub: () => `${nTalks} talks so far · recaps, scriptures, ponder questions`, body: () => ({ type: "list", items: ["A 60-second recap of every talk", "Verified quotes, linked to the official talks", "Ponder questions and invitations to try"] }) },
    { id: "quiz", headlines: ["Take the conference quiz", "Who said it?", "How well were you listening?"], kicker: "CONFERENCE QUIZ", url: "quiz.html",
      sub: () => `Match ${nQuotes} quotes to the speakers who said them`, body: () => ({ type: "text", text: "A quick, friendly quiz for families, classes and friends." }) },
    { id: "tenwords", headlines: ["See the conference in 10 words", "Conference in 10 words"], kicker: "CONFERENCE INSIGHTS", url: "insights.html",
      sub: () => tw ? tw.sub : "", body: () => tw ? tw.body : { type: "text", text: "" } },
    { id: "card", headlines: ["Make your own quote card", "Share a line that lifted you", "Turn a quote into a card"], kicker: "CARD STUDIO", url: "builder.html",
      sub: () => `${nQuotes} verified quotes · ${nLooks} looks · ${nLayouts} layouts`, body: () => ({ type: "list", items: ["Pick a theme: Christ, temple, family and more", "Stories, posts, wallpapers and videos", "Free, with a link back to the talk"] }) },
    { id: "countdown", headlines: ["Carry the light to April", "Six months of light", "Until we meet again in April"], kicker: "APRIL 3–4, 2027",
      sub: () => "Days until April general conference", body: () => ({ type: "big", value: daysTo(), caption: "Let these words carry you there." }) },
    { id: "showcase", headlines: ["Six Months of Light", "A home for October 2026 conference"], kicker: "WHAT YOU'LL FIND", carousel: 1,
      sub: () => "October 2026 General Conference, to carry you to April", body: () => ({ type: "list", items: ["Talk recaps", "Quote cards", "Insights", "Quiz", "Ask the Talks"] }) },
  ];
  const SLIDES = [
    { title: "Talk recaps", sub: () => `${nTalks} talks · 60-second recaps, scriptures and ponder questions`, url: "index.html#sessions" },
    { title: "Quote cards", sub: () => `${nQuotes} verified quotes · ${nLooks} looks · ${nLayouts} layouts`, url: "builder.html" },
    { title: "Insights", sub: () => "Themes, top words, scriptures and comparisons with past conferences", url: "insights.html" },
    { title: "Who said it?", sub: () => "A quote quiz for families and classes", url: "quiz.html" },
    { title: "Ask the Talks", sub: () => "Bring a question, find what the speakers taught", url: "index.html" },
  ];
  const build = (p, hi, note, slide) => {
    const site = C.site_url, url = site + (p.url || "");
    if (slide != null && p.carousel) { const n = SLIDES.length + 2;
      if (slide === 0) return { id: "promo-" + p.id, kicker: p.kicker, title: p.headlines[hi] || p.headlines[0], sub: p.sub(), body: { type: "text", text: "Swipe to see what's inside →" }, url: site, eyebrow: "SHARE THE LIGHT", basis: "Free study site", slide: [1, n] };
      if (slide <= SLIDES.length) { const s = SLIDES[slide - 1]; return { id: "promo-" + p.id, kicker: `${slide} · ${p.kicker}`, title: s.title, sub: s.sub(), body: { type: "text", text: "sixmonthsoflight.com" }, url: site + s.url, eyebrow: "SHARE THE LIGHT", basis: "Free study site", slide: [slide + 1, n] }; }
      return { id: "promo-" + p.id, kicker: "FREE · NO SIGN-UP", title: "Visit sixmonthsoflight.com", sub: "Scan the code or tap the link", body: { type: "text", text: "" }, note, url: site, eyebrow: "SHARE THE LIGHT", basis: "Free study site", slide: [n, n] }; }
    return { id: "promo-" + p.id, kicker: p.kicker, title: p.headlines[hi] || p.headlines[0], sub: p.sub(), body: p.body(), note, url, eyebrow: "SHARE THE LIGHT", basis: "Free study site",
      share: `${p.headlines[hi] || p.headlines[0]} — Six Months of Light, a free study site for October 2026 General Conference.` };
  };
  window.PROMOS = { list: P, slides: SLIDES, get: id => P.find(p => p.id === id), build, daysTo };
})();
