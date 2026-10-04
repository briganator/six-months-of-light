mount("", true);
// Initials monogram with "painted light" — no official portraits are copied (Church copyright).
const initials = n => n.replace(/^(Elder|Sister|President|Bishop)\s+/, "").split(/\s+/).filter(w => !/^[A-Z]\.$/.test(w)).map(w => w[0]).filter((c, i, a) => i === 0 || i === a.length - 1).join("");
const hue = n => [...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const monogram = (n, big) => `<div class="monogram ${big ? "big" : ""}" style="--h:${hue(n)}" aria-hidden="true"><span>${esc(initials(n))}</span></div>`;
const sl = QS.get("s"), ts = speakerTalks(sl), main = document.getElementById("main");
const OFFICIAL_LEADERS = "https://www.churchofjesuschrist.org/learn/global-leadership-of-the-church?lang=eng";
const SPEAKER_INDEX = "https://www.churchofjesuschrist.org/study/general-conference/speakers?lang=eng";
if (!ts.length) {
  main.innerHTML = `<div class="section-label">Understand</div><h1 style="margin-top:0">Speakers</h1><ol class="talks">${
    [...new Map(CONF.talks.map(t => [slug(t.speaker), t])).values()].map(t => `<li><a class="talkcard s-${sessionById(t.session).color}" href="speaker.html?s=${slug(t.speaker)}">${monogram(t.speaker)}<span class="tc-body"><span class="t-title">${esc(t.speaker)}</span><span class="t-speaker">${esc(t.calling)}</span></span><span class="tc-arrow">→</span></a></li>`).join("")}</ol>`;
} else {
  const s = ts[0], themes = [...new Set(ts.flatMap(talkThemes))];
  document.title = s.speaker;
  main.innerHTML = `<p class="crumbs"><a href="speaker.html">← All speakers</a></p>
  <article class="card speaker-card">
    <div class="sp-head">${monogram(s.speaker, true)}<div><h1 style="margin:0">${esc(s.speaker)}</h1><p class="speaker">${esc(s.calling)}</p></div></div>
    <div class="slot">🖼️ <strong>Portrait slot</strong> — reserved. Official portraits aren't used here (Church copyright); a photo can be added only if the Church grants permission.</div>
    <dl class="kv">
      <dt>Bio</dt><dd>Only the calling above is included here. For the official biography, see <a href="${OFFICIAL_LEADERS}" rel="noopener">Church leadership on ChurchofJesusChrist.org ↗</a>.</dd>
      <dt>This conference</dt><dd>${ts.map(t => `<a href="talks/${t.id}.html">“${esc(t.title)}”</a> — ${esc(sessionById(t.session).name)}`).join("<br>")}</dd>
      <dt>Recent talks</dt><dd>Past general conference talks: <a href="${SPEAKER_INDEX}" rel="noopener">speaker index on ChurchofJesusChrist.org ↗</a>.
        <div class="stub" style="margin-top:6px">A list of this speaker's recent talks will be pulled from official listings later; none are guessed here.</div></dd>
      <dt>Recurring themes</dt><dd>${themes.length ? themes.map(x => `<span class="pill" style="margin:2px">${esc(x)}</span>`).join(" ") : "—"}
        <div class="speaker">From this conference's recap only. Will include past talks after official text is used.</div></dd>
    </dl></article>
  ${askAIPanel({ label: s.speaker, questions: ["What did this speaker teach this weekend?"],
    answer: () => mockAnswer(ts.map(t => esc(t.big_idea)).join(" ") + " [1]", ["Church News recap (official text pending)"]) })}`;
}
