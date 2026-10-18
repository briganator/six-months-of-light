// One place to make something: a video, or a picture card. The name is window.CREATE_NAME.
mount("create.html", true);
(function () {
  const CN = window.CREATE_NAME || "Share light";
  const Q = new URLSearchParams(location.search);
  const main = document.getElementById("main");
  document.title = CN + " · Six Months of Light";
  const talkId = Q.get("t") || "";
  const talk = talkById(talkId);
  const qi = Q.has("q") ? +Q.get("q") : null;
  const sel = (Q.get("sel") || "").replace(/\s+/g, " ").trim();

  function videoHref(q) {
    if (!q) return "moments.html";
    if (q.moment) return "clip.html?m=" + encodeURIComponent(q.talk + ":" + q.moment);
    if (q.text) return "clip.html?t=" + encodeURIComponent(q.talk) + "&sel=" + encodeURIComponent(q.text);
    if (q.talk) return "moments.html?t=" + encodeURIComponent(q.talk);
    return "moments.html";
  }
  function cardHref(q) {
    if (!q) return "builder.html";
    if (q.q != null && q.q >= 0) return "builder.html?t=" + encodeURIComponent(q.talk) + "&q=" + q.q;
    if (q.text) return "builder.html?t=" + encodeURIComponent(q.talk) + "&sel=" + encodeURIComponent(q.text);
    return "builder.html" + (q.talk ? "?t=" + encodeURIComponent(q.talk) : "");
  }

  const state = { quote: null, picks: [] };

  function paint() {
    const q = state.quote;
    const quoteBlock = q ? `<figure class="hub-quote"><q>${esc(q.text)}</q><p>${esc(q.speaker || "")}${q.title ? ` · <a href="talks/${esc(q.talk)}.html">“${esc(q.title)}”</a>` : ""}</p></figure>` : "";
    const picks = state.picks.length > 1 ? `<div class="hub-picks" role="listbox" aria-label="Choose a quote">${state.picks.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${q && p.text === q.text && p.q === q.q}">${esc(p.text)}</button>`).join("")}</div>` : "";
    const v = videoHref(q), c = cardHref(q);
    main.innerHTML = `<section class="hub">
      <p class="crumbs"><a href="index.html">Home</a>${talk ? ` · <a href="talks/${esc(talk.id)}.html">${esc(talk.title)}</a>` : ""}</p>
      <p class="hub-k">Two ways to carry a line</p>
      <h1>${esc(CN)}</h1>
      <p class="hub-lead">${q ? "This line is ready. Choose how you want to share it." : "Make a video with the words on screen, or a picture card for a story or a message."}</p>
      ${quoteBlock}
      ${picks}
      <div class="hub-choices">
        <a class="hub-choice video" id="hubVideo" href="${esc(v)}"><b>Make a video</b><span>${q ? "The moment these words were spoken, with the words on screen." : "Pick a moment from conference and put the words on screen."}</span><span class="hub-go">Open the video →</span></a>
        <a class="hub-choice card" id="hubCard" href="${esc(c)}"><b>Make a picture card</b><span>${q ? "A still image of these words, ready to send." : "Turn a line into a picture for a story, a post, or a message."}</span><span class="hub-go">Open the card →</span></a>
      </div>
      <p class="hub-more"><a href="video.html">Paste a line</a><a href="moments.html${talk ? "?t=" + encodeURIComponent(talk.id) : ""}">Best moments</a><a href="index.html#sessions">Browse the talks</a></p>
      <p class="hub-note">Personal study site · Not an official Church site. Official words stay labeled as the speaker’s. Your own words, if you add any, are labeled as yours.</p>
    </section>`;
    main.querySelectorAll(".hub-picks button").forEach(b => b.addEventListener("click", () => { state.quote = state.picks[+b.dataset.i]; paint(); }));
  }

  function fromTalk() {
    if (sel && talk) {
      state.quote = { text: sel, speaker: talk.speaker, title: talk.title, talk: talk.id };
      paint(); return;
    }
    if (talk && qi != null && talk.quotes[qi]) {
      state.quote = { text: talk.quotes[qi], speaker: talk.speaker, title: talk.title, talk: talk.id, q: qi };
      paint(); return;
    }
    if (talk && talk.quotes && talk.quotes.length) {
      state.picks = talk.quotes.map((text, i) => ({ text, speaker: talk.speaker, title: talk.title, talk: talk.id, q: i }));
      state.quote = state.picks[0];
      paint(); return;
    }
    paint();
  }

  const rawM = Q.get("m") || "";
  if (rawM.includes(":")) {
    const [tid, mid] = rawM.split(":");
    const mt = talkById(tid);
    fetch("assets/moments.json").then(r => r.json()).then(data => {
      const m = ((data.talks || {})[tid] || []).find(x => x.id === mid);
      if (m && mt) state.quote = { text: m.text || m.hook, speaker: mt.speaker, title: mt.title, talk: tid, moment: mid };
      paint();
    }).catch(paint);
  } else fromTalk();
})();
