mount("quiz.html");
const pool = CONF.talks.flatMap(t => t.quotes.map((q, i) => ({ t, q })));
const speakers = [...new Set(CONF.talks.map(t => t.speaker))];
let score = 0, n = 0, mode = "quiz", cur;
const rnd = a => a[Math.floor(Math.random() * a.length)];
const main = document.getElementById("main");
main.innerHTML = `${recapNotice()}<h1 style="margin-top:38px">Who said it?</h1>
  <p class="speaker">Quotes from Saturday's talks (as reported in recaps).</p>
  <div class="seg" id="mode"><button data-k="quiz" aria-pressed="true">Quiz</button><button data-k="flash" aria-pressed="false">Flashcards</button></div>
  <div class="flash"><div class="inner" id="card"></div></div><div id="opts"></div>
  <div class="links"><button class="btn" id="nx">Next</button><span class="speaker" id="sc" style="align-self:center"></span></div>`;
function next() {
  cur = rnd(pool);
  const card = document.getElementById("card"), opts = document.getElementById("opts");
  card.innerHTML = `<div class="q">“${esc(cur.q)}”</div>`;
  if (mode === "quiz") {
    const choices = [cur.t.speaker]; while (choices.length < 4) { const s = rnd(speakers); if (!choices.includes(s)) choices.push(s); }
    choices.sort(() => Math.random() - .5);
    opts.innerHTML = `<div class="opts">${choices.map(c => `<button class="opt">${esc(c)}</button>`).join("")}</div>`;
    opts.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
      if (opts.dataset.done) return; opts.dataset.done = 1; n++;
      const ok = b.textContent === cur.t.speaker; if (ok) score++;
      opts.querySelectorAll(".opt").forEach(x => { if (x.textContent === cur.t.speaker) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      opts.insertAdjacentHTML("beforeend", `<p class="speaker">From <a href="talks/${cur.t.id}.html">“${esc(cur.t.title)}”</a></p>`);
      document.getElementById("sc").textContent = `Score: ${score}/${n}`;
    }));
    delete opts.dataset.done;
  } else {
    opts.innerHTML = `<button class="btn secondary" id="flip">Reveal speaker</button>`;
    document.getElementById("flip").addEventListener("click", () => opts.innerHTML =
      `<div class="card"><b>${esc(cur.t.speaker)}</b><br><span class="speaker">“${esc(cur.t.title)}” · ${esc(cur.t.calling)}</span></div>`);
  }
}
document.getElementById("nx").addEventListener("click", next);
document.querySelectorAll("#mode button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.k;
  document.querySelectorAll("#mode button").forEach(x => x.setAttribute("aria-pressed", x === b)); next(); }));
next();
