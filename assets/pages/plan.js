mount("my.html", true);
// Reading plan to April: the October 2026 talks spread over the weeks until the next general conference. Progress stays on this device.
const APRIL = new Date("2027-04-03T00:00:00-06:00"), DAY = 864e5, main = document.getElementById("main");
const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const fmt = d => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
const talks = CONF.talks.slice().sort((a, b) => CONF.sessions.findIndex(s => s.id === a.session) - CONF.sessions.findIndex(s => s.id === b.session) || a.order - b.order);
const PACE = { april: "Finish by April", christmas: "Finish by Christmas", weekly: "One talk a week" };
function render() {
  const pace = PACE[Store.get("plan-pace")] ? Store.get("plan-pace") : "april", start = monday(Store.get("plan-start") || Date.now() + DAY), done = new Set(Store.get("plan-done", []));
  const end = pace === "christmas" ? new Date("2026-12-21T00:00:00-07:00") : APRIL, weeks = Math.max(1, Math.round((monday(end) - start) / (7 * DAY)));
  const per = pace === "weekly" ? 1 : talks.length / weeks;
  const rows = talks.map((t, i) => { const w = pace === "weekly" ? i : Math.floor(i / Math.max(per, 1e-9)); return { t, w, from: new Date(+start + w * 7 * DAY) }; });
  const nowW = Math.floor((monday(Date.now()) - start) / (7 * DAY)), n = done.size && talks.filter(t => done.has(t.id)).length, pct = Math.round(n / talks.length * 100);
  const behind = rows.filter(r => r.w < nowW && !done.has(r.t.id)).length, thisWeek = rows.filter(r => r.w === nowW);
  const byW = {}; rows.forEach(r => (byW[r.w] = byW[r.w] || []).push(r));
  main.innerHTML = `<p class="crumbs"><a href="my.html">← My Conference</a></p>
    <div class="section-label">Six months, one talk at a time</div><h1 class="lib-h1">Reading plan to April</h1>
    <p class="lib-sub">${talks.length} October 2026 talks so far, spread over the weeks until April general conference (April 3–4, 2027, ${PROMOS_DAYS()} days away). Check off each talk as you read it. Your progress is saved only on this device.</p>
    <div class="seg" id="pace" role="group" aria-label="Pace">${Object.entries(PACE).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === pace}">${v}</button>`).join("")}</div>
    <section class="card plan-top"><div class="plan-prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Plan progress"><i style="width:${pct}%"></i></div>
      <p><b>${n || 0} of ${talks.length}</b> read · ${pct}%${behind ? ` · <span class="plan-behind">${behind} to catch up</span>` : n ? " · on track" : ""}</p>
      ${thisWeek.length ? `<p class="plan-now">This week: ${thisWeek.map(r => `<a href="talks/${r.t.id}.html">${esc(r.t.title)}</a>`).join(", ")}</p>` : nowW < 0 ? `<p>Your plan starts ${fmt(start)}.</p>` : `<p class="plan-now">No new talk this week. Reread a quote you saved, or catch up.</p>`}</section>
    <ol class="plan-list">${Object.entries(byW).map(([w, rs]) => `<li class="${+w === nowW ? "now" : +w < nowW ? "past" : ""}"><div class="plan-wk">Week ${+w + 1} · ${fmt(rs[0].from)}</div>
      ${rs.map(r => `<label class="plan-item"><input type="checkbox" data-id="${r.t.id}" ${done.has(r.t.id) ? "checked" : ""}><span><a href="talks/${r.t.id}.html">${esc(r.t.title)}</a><small>${esc(r.t.speaker)} · ${r.t.official_url ? `<a href="${esc(r.t.official_url)}" rel="noopener">official text ↗</a>` : "official text not posted yet"}</small></span></label>`).join("")}</li>`).join("")}</ol>
    <div class="links"><button class="btn secondary small" id="restart">Restart the plan from this week</button><button class="btn secondary small" id="ics">Weekly reminder (.ics)</button></div>
    <p class="lib-note">Sunday's talks join the plan automatically when they're added to the site. Read the full talks on ChurchofJesusChrist.org.</p>`;
  main.querySelectorAll("[data-id]").forEach(c => c.addEventListener("change", () => { const d = new Set(Store.get("plan-done", [])); c.checked ? d.add(c.dataset.id) : d.delete(c.dataset.id); Store.set("plan-done", [...d]); if (!Store.get("plan-start")) Store.set("plan-start", +start); render(); }));
  main.querySelectorAll("#pace button").forEach(b => b.addEventListener("click", () => { Store.set("plan-pace", b.dataset.k); if (!Store.get("plan-start")) Store.set("plan-start", +start); render(); }));
  document.getElementById("restart").addEventListener("click", () => { Store.set("plan-start", +monday(Date.now() + DAY)); render(); });
  document.getElementById("ics").addEventListener("click", () => { const d = new Date(+monday(Date.now()) + 6 * DAY); const p = x => String(x).padStart(2, "0"), ds = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Six Months of Light//Plan//EN", "BEGIN:VEVENT", "UID:plan-" + ds + "@sixmonthsoflight.com", "DTSTAMP:" + ds + "T120000Z", `DTSTART;VALUE=DATE:${ds}`, "RRULE:FREQ=WEEKLY;UNTIL=20270403T000000Z", "SUMMARY:Read this week's conference talk", "DESCRIPTION:Your reading plan: " + CONF.site_url + "plan.html", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "conference-reading-plan.ics"; a.click(); });
}
const PROMOS_DAYS = () => Math.max(0, Math.ceil((APRIL - new Date()) / DAY));
render();
