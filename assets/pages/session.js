mount("", true);
const s = sessionById(QS.get("s")) || CONF.sessions[0], ts = CONF.talks.filter(t => t.session === s.id).sort((a,b)=>a.order-b.order);
document.title = s.name;
document.getElementById("main").innerHTML = `<p class="crumbs"><a href="index.html">← Home</a></p>
  <h1 style="margin-top:38px">${esc(s.name)}</h1>
  <p class="speaker">${esc(s.when)} · ${esc(s.note)} · <a href="${esc(s.url)}" rel="noopener">Official session page ↗</a></p>
  ${ts.length ? ts.map(t => `<a class="card tile" style="margin:10px 0" href="talks/${t.id}.html"><b>${t.order}. ${esc(t.title)}</b><span>${esc(t.speaker)}</span>
    <p style="margin:6px 0 0;font-size:15px">${esc(t.big_idea)}</p></a>`).join("") : `<div class="stub">Talks will be added after the session.</div>`}
  ${ts.length ? askAIPanel({ label: "this session", questions: ["Summarize this session in three lines"],
    answer: () => mockAnswer(ts.slice(0,3).map(t => esc(t.speaker) + ": " + esc(t.big_idea)).join("<br>") + " …", ["Church News recaps (official text pending)"]) }) : ""}`;
