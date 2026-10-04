mount("builder.html", true);
// Card Studio. Quotes come ONLY from verified quotes in CONF data; insight cards only from computed recap data.
document.body.classList.add("studio-page");
const P = QS, K = CardKit, S = K.SIZES, L = K.LOOKS;
const ALLQ = INSIGHTS.ALLQ, isPhone = matchMedia("(max-width: 899px)").matches;
const st = {
  ins: INSIGHTS.get(P.get("ins")) ? P.get("ins") : null, layout: K.LAYOUTS[P.get("layout")] ? P.get("layout") : "classic",
  promo: PROMOS.get(P.get("promo")) ? P.get("promo") : "study", hl: +(P.get("hl") || 0), invite: "", cap: "", capEdited: false,
  t: talkById(P.get("t")) ? P.get("t") : CONF.talk_of_the_week.talk_id, q: +(P.get("q") || 0),
  look: L[P.get("look")] ? P.get("look") : "sunrise", pal: K.PALETTES[P.get("pal")] ? P.get("pal") : "gold",
  font: K.FONTS[P.get("font")] ? P.get("font") : "classic", align: P.get("align") === "left" ? "left" : "center",
  size: S[P.get("size")] ? P.get("size") : (isPhone ? "story" : "portrait"), ov: P.has("ov") ? Math.min(.85, Math.max(0, +P.get("ov") / 100)) : null,
  anim: K.ANIMS[P.get("anim")] ? P.get("anim") : P.get("anim") === "1" ? "fade" : "none", sticker: P.get("ig") === "1", note: "", tab: ["quote", "look", "size", "text", "share"].includes(P.get("tab")) ? P.get("tab") : (P.has("t") ? "look" : "quote"), src: P.get("src") === "promo" || P.has("promo") ? "promo" : P.get("ins") ? "ins" : "quote", filter: "", scope: "conf", mode: "still", libT: null, libNote: "", theme: THEMES3.get(P.get("theme")) ? THEMES3.get(P.get("theme")).slug : "all",
};
// Advanced formatting: fx=size:1.1;ls:0.05;box:glass ... (whitelisted keys and values)
const FMT_NUM = { size: [.6, 1.5], lh: [.8, 1.6], ls: [0, .25], vig: [0, 1], grain: [0, 1], blur: [0, 6], dx: [-.3, .3], dy: [-.3, .3] };
const FMT_OPT = { weight: ["300", "400", "500", "600", "700", "800"], cs: ["upper", "lower", "title"], qm: ["curly", "none", "guillemet", "straight", "bar"], box: ["none", "glass", "solid", "band", "outline"], border: ["corners", "none", "thin", "double", "rounded", "ornate"] };
const parseFmt = v => { const f = {}; String(v || "").split(";").forEach(kv => { const [k, x] = kv.split(":"); if (FMT_NUM[k]) { const n = +x; if (isFinite(n)) f[k] = Math.min(FMT_NUM[k][1], Math.max(FMT_NUM[k][0], n)); }
  else if (FMT_OPT[k] && FMT_OPT[k].includes(x)) f[k] = x; else if ((k === "ink" || k === "acc") && /^[0-9a-f]{6}$/i.test(x)) f[k] = "#" + x.toLowerCase(); }); return f; };
const encFmt = f => Object.entries(f).filter(([, v]) => v !== undefined && v !== "" && v !== null).map(([k, v]) => k + ":" + (typeof v === "number" ? +v.toFixed(3) : String(v).replace("#", ""))).join(";");
st.fmt = parseFmt(P.get("fx")); st.mode = st.anim !== "none" ? "anim" : "still";
const PRESETS = [
  ["Classic", "classic", {}], ["Elegant", "playfair_i", { border: "double" }], ["Bold statement", "abril", { size: 1.08, box: "band", border: "none" }],
  ["Modern clean", "montserrat", { weight: "600", ls: .02, border: "none", qm: "bar" }], ["Script", "greatvibes", { size: 1.1, border: "rounded" }],
  ["Engraved", "cinzel", { cs: "upper", ls: .06, border: "ornate" }], ["Journal", "lora_i", { box: "solid", border: "none" }],
  ["Frosted glass", "dmserif", { box: "glass", blur: 3, border: "none" }], ["Film", "garamond", { grain: .8, vig: .6 }], ["Soft & airy", "raleway", { weight: "300", lh: 1.2, ls: .03, border: "thin" }]
];
{ const nq = (talkById(st.t).quotes || []).length; if (!(st.q >= 0 && st.q < nq && Number.isInteger(st.q))) st.q = 0; }
const T3 = THEMES3, inTheme = (x, th = st.theme) => th === "all" || T3.open(th) || T3.tagsFor(x.t.id, x.i).includes(th);
const resolveLooks = th => { const out = []; (T3.looks[th] || []).forEach(k => { if (k.startsWith("photo:")) Object.entries(L).filter(([, l]) => l.photo && l.credit.group === k.slice(6)).forEach(([id]) => out.push(id)); else if (L[k]) out.push(k); }); return [...new Set(out)]; };
if (!P.has("t") && !P.has("ins")) { const d = INSIGHTS.daily; st.t = d.t.id; st.q = d.i; }
const seg = (id, opts, cur, label) => `<div class="seg" id="${id}" role="group" aria-label="${label}">${Object.entries(opts).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === cur}">${esc(v)}</button>`).join("")}</div>`;
const groups = [...new Set(Object.values(L).map(l => l.group))];
// Look picker: one row of style chips filters a single grid; "Popular" shows the first look of each style.
const POPULAR = groups.map(g => Object.keys(L).find(id => L[id].group === g)).filter(Boolean);
const lookCat0 = POPULAR.includes(st.look) || !L[st.look] ? "Popular" : L[st.look].group;
const PLAT = [["igstory", "Instagram Story", "story"], ["igpost", "Instagram post", "portrait"], ["facebook", isPhone ? "Share card to Facebook" : "Facebook", isPhone ? "portrait" : "link"], ["whatsapp", "WhatsApp", null], ["sms", "Messages", null], ["x", "X", "wide"], ["pinterest", "Pinterest", "pin"], ["threads", "Threads", null], ["email", "Email", null], ["copy", "Copy link", null]];
const lookBtn = id => { const l = L[id]; return `<button type="button" class="look" data-look="${id}" aria-pressed="${id === st.look}" aria-label="${esc(l.name)}">${l.photo ? `<img src="${esc(l.credit.thumb)}" alt="" loading="lazy" decoding="async">` : `<canvas width="72" height="96" data-thumb="${id}"></canvas>`}<span>${esc(l.name)}</span></button>`; };
document.getElementById("main").innerHTML = `
  <h1 class="st-title">Card Studio <span>Pick a quote · style it · share</span></h1>
  <div class="studio">
    <div class="st-preview" id="stPrev">
      <div class="st-canvas"><canvas id="cv" role="img" aria-label="Card preview" width="${S[st.size][0]}" height="${S[st.size][1]}"></canvas></div>
      <div class="st-actions" id="actions">
        <div class="st-ready" id="ready" role="status"><span class="dot"></span><span id="readyTxt">Your card is ready. Tap <b>Share</b>.</span>
          <button type="button" class="linkish" id="igBtn" aria-expanded="false" aria-controls="igTip">Instagram Stories?</button></div>
        <div class="st-tip" id="igTip" hidden><b>To post to Instagram Stories:</b> tap <b>Save image</b> (on iPhone you can also tap Share → <i>Save Image</i>). Open Instagram → <b>+</b> → <b>Story</b> and pick the card from your photos. Add a <b>Link</b> sticker with the copied link so friends can open the quote. Tip: the <b>Instagram Story preset</b> (Size tab) marks the sticker spot and copies the link when you save.</div>
        <div class="st-btns"><div class="seg st-mode" id="shMode" role="group" aria-label="Share as"><button type="button" data-k="still" aria-pressed="${st.anim === "none"}">Still</button><button type="button" data-k="anim" aria-pressed="${st.anim !== "none"}">Animated</button></div><button class="btn gold st-share" id="share"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3l4.5 4.5-1.4 1.4L13 6.8V15h-2V6.8L8.9 8.9 7.5 7.5zM5 13h2v6h10v-6h2v8H5z"/></svg><span id="shareTxt">Share</span></button>
          <button class="btn secondary" id="save">Save image</button><button class="btn secondary" id="copy">More ways</button></div>
        <button type="button" class="linkish st-linkonly" id="shareLink">Share link only</button>
      </div>
    </div>
    <div class="st-panel">
      <div class="st-tabs" role="tablist" id="tabs">${[["quote", "Quote"], ["look", "Look"], ["size", "Size"], ["text", "Motion"], ["share", "Share"]].map(([k, v]) => `<button role="tab" type="button" id="tab-${k}" aria-controls="p-${k}" aria-selected="${st.tab === k}">${v}</button>`).join("")}</div>
      <section class="st-pane" id="p-quote" role="tabpanel" aria-labelledby="tab-quote">
        ${seg("src", { quote: "Quotes", ins: "Insights", promo: "Share the site" }, st.src, "Card type")}
        <div id="srcQuote">
          <div class="qs-top"><input class="field qs-find" id="qsearch" type="search" placeholder="Search quotes, talks or speakers" aria-label="Search quotes, talks or speakers" enterkeyhint="search" autocomplete="off">
            ${seg("qscope", { conf: "This conference", all: "All conferences" }, "conf", "Search in")}</div>
          <div class="qs-chips" id="qthemes" role="group" aria-label="Theme">${T3.list.map(th => `<button type="button" class="thm thm-chip" data-th="${th.slug}" aria-pressed="${th.slug === st.theme}"><i aria-hidden="true">${th.icon}</i>${esc(th.slug === "all" ? "All themes" : th.name)}</button>`).join("")}</div>
          <p class="b-help qs-note"><span id="thmNote"></span><span class="qs-ver"> Verified quotes only (from recaps; confirm with official text).</span></p>
          <div id="qbrowse"></div><div id="qresults" hidden></div>
          <button type="button" class="btn secondary small car-btn" id="carQ">Save this talk as a carousel</button><p class="b-help" id="carQh"></p></div>
        <div id="srcPromo" hidden><p class="b-help">Invite friends to Six Months of Light. Each card links to the site with a QR code.</p>
          <div id="promolist" class="qlist"></div>
          <label class="b-label" for="hlSel">Headline</label><select id="hlSel" class="field"></select>
          <label class="b-label" for="invite">My invite line <span class="b-help">optional · shown as yours on the card</span></label>
          <input class="field" id="invite" maxlength="90" placeholder="e.g. This has helped our family study. Try it!" autocomplete="off">
          <button type="button" class="btn secondary small car-btn" id="carP" hidden>Save the feature carousel</button></div>
        <div id="srcIns" hidden><div id="inslist" class="qlist"></div>
          <label class="b-label" for="spotSel">Speaker spotlight</label><select id="spotSel" class="field"><option value="">Choose a speaker…</option>${CONF.talks.map(t => `<option value="spot-${t.id}">${esc(t.speaker)}</option>`).join("")}</select>
          <label class="b-label" for="themeSel">Theme card</label><select id="themeSel" class="field"><option value="">Choose a theme…</option>${INSIGHTS.themeCounts.filter(x => x[1]).map(([n]) => `<option value="theme-${INSIGHTS.themeSlug(n)}">${esc(n)}</option>`).join("")}</select></div>
      </section>
      <section class="st-pane" id="p-look" role="tabpanel" aria-labelledby="tab-look">
        <div id="lookSug"></div>
        <div class="b-label">Background</div>
        <div class="look-cats" id="lookCats" role="group" aria-label="Background style">${["Popular", ...groups].map(g => `<button type="button" class="thm-chip" data-cat="${esc(g)}" aria-pressed="${g === lookCat0}">${esc(g)}</button>`).join("")}</div>
        <div class="looks" data-grp="Popular" ${lookCat0 === "Popular" ? "" : "hidden"}>${POPULAR.map(lookBtn).join("")}</div>
        ${groups.map(g => `<div class="looks" data-grp="${esc(g)}" ${g === lookCat0 ? "" : "hidden"}>${Object.keys(L).filter(id => L[id].group === g).map(lookBtn).join("")}</div>`).join("")}
        <div class="b-label">Layout <span class="b-help" id="layHelp"></span></div>
        <div class="anims layouts" id="layout" role="group" aria-label="Layout">${Object.entries(K.LAYOUTS).map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${k === st.layout}">${esc(l.name)}</button>`).join("")}</div>
        <details class="fine"><summary>Fine-tune color and darkness</summary>
        <div class="b-label">Color palette</div><div class="pals" id="pal" role="group" aria-label="Color palette">${Object.entries(K.PALETTES).map(([k, p]) => `<button type="button" data-k="${k}" aria-pressed="${k === st.pal}"><i style="background:linear-gradient(135deg,${p.acc},${p.acc2})"></i>${p.name}</button>`).join("")}</div>
        <label class="b-label" for="ov">Overlay darkness <span class="b-help" id="ovv"></span></label><input type="range" id="ov" min="0" max="85" step="5">
        </details>
        <p class="b-help"><a href="credits.html">Photo credits &amp; licenses</a> · temple art is original</p>
      </section>
      <section class="st-pane" id="p-size" role="tabpanel" aria-labelledby="tab-size">
        <button type="button" class="igpreset" id="igPreset" aria-pressed="${st.sticker}"><b>Instagram Story preset</b><span>9:16 story with a “Link sticker here” guide. Saving copies the link for your sticker.</span></button>
        <label class="chk" id="stickRow" ${st.sticker ? "" : "hidden"}><input type="checkbox" id="sticker" ${st.sticker ? "checked" : ""}> Show the “Link sticker here” guide on the card</label>
        <div class="sizes" id="size" role="group" aria-label="Size">${Object.entries(S).map(([k, [w, h, n]]) => `<button type="button" data-k="${k}" aria-pressed="${k === st.size}"><i style="aspect-ratio:${w}/${h}"></i><b>${n}</b><span>${w}×${h}</span></button>`).join("")}</div>
        <p class="b-help">Story is best for Instagram/Facebook Stories, 4:5 for feed posts, 16:9 for slides and YouTube, wallpaper for your lock screen.</p>
      </section>
      <section class="st-pane" id="p-share" role="tabpanel" aria-labelledby="tab-share" hidden>
        <div class="b-label">Share to</div>
        <div class="plats" id="plats">${PLAT.map(([k, n, sz]) => `<button type="button" class="plat plat-${k}" data-p="${k}"><b>${esc(n)}</b>${sz ? `<small>${esc(S[sz][2])}</small>` : `<small>${{ whatsapp: isPhone ? "Card + link" : "Message + link", sms: isPhone ? "Card + link" : "Text + link", threads: "Post + link", email: "Email + link", copy: "Just the link" }[k]}</small>`}</button>`).join("")}</div>
        <label class="b-label" for="caption">Caption <span class="b-help">edit before sharing · the link is included</span></label>
        <textarea class="field caption" id="caption" rows="5"></textarea>
        <div class="cap-row"><button type="button" class="btn secondary small" id="capReset">Reset caption</button><button type="button" class="btn secondary small" id="capCopy">Copy caption</button></div>
        <p class="b-help">Phones open your share sheet with the image. Facebook, X, Pinterest and Threads open their own share pages with a link preview.</p>
      </section>
      <section class="st-pane" id="p-text" role="tabpanel" aria-labelledby="tab-text">
        <div class="b-label">Quick styles <span class="b-help">a font and finish in one tap</span></div>
        <div class="seg presets" id="presets" role="group" aria-label="Quick styles">${PRESETS.map(([n], i) => `<button type="button" data-i="${i}">${esc(n)}</button>`).join("")}</div>
        <div class="b-label">Font</div>${seg("font", K.FONTS, st.font, "Font").replace('class="seg"', 'class="seg fonts"')}
        <details class="adv" id="adv"><summary>Advanced formatting</summary>
          <div class="adv-grid">
            <label>Text size <input type="range" id="f-size" min="0.6" max="1.5" step="0.02"></label>
            <label>Line spacing <input type="range" id="f-lh" min="0.8" max="1.6" step="0.02"></label>
            <label>Letter spacing <input type="range" id="f-ls" min="0" max="0.25" step="0.005"></label>
            <label>Weight <select id="f-weight"><option value="">Font default</option>${FMT_OPT.weight.map(w => `<option>${w}</option>`).join("")}</select></label>
            <label>Letter case <select id="f-cs"><option value="">As written</option><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Title Case</option></select></label>
            <label>Quote marks <select id="f-qm"><option value="">“Curly”</option><option value="none">None</option><option value="guillemet">« Guillemets »</option><option value="straight">"Straight"</option><option value="bar">Side bar</option></select></label>
            <label>Text box <select id="f-box"><option value="">None</option><option value="glass">Frosted glass</option><option value="solid">Solid card</option><option value="band">Full-width band</option><option value="outline">Outline</option></select></label>
            <label>Border <select id="f-border"><option value="">Corners</option><option value="none">None</option><option value="thin">Thin line</option><option value="double">Double line</option><option value="rounded">Rounded</option><option value="ornate">Ornate</option></select></label>
            <label>Background blur <input type="range" id="f-blur" min="0" max="6" step="0.25"></label>
            <label>Vignette <input type="range" id="f-vig" min="0" max="1" step="0.05"></label>
            <label>Film grain <input type="range" id="f-grain" min="0" max="1" step="0.05"></label>
            <label>Move left / right <input type="range" id="f-dx" min="-0.3" max="0.3" step="0.005"></label>
            <label>Move up / down <input type="range" id="f-dy" min="-0.3" max="0.3" step="0.005"></label>
            <label class="adv-color">Text color <input type="color" id="f-ink"> <button type="button" class="linkish" data-auto="ink">Auto</button></label>
            <label class="adv-color">Accent color <input type="color" id="f-acc"> <button type="button" class="linkish" data-auto="acc">Auto</button></label>
          </div>
          <label class="adv-drag"><input type="checkbox" id="f-drag"> Drag the text on the preview to move it</label>
          <button type="button" class="btn secondary small" id="f-reset">Reset formatting</button>
        </details>
        <div class="b-label">Alignment</div>${seg("align", { center: "Centered", left: "Left" }, st.align, "Alignment")}
        <label class="b-label" for="note">My takeaway <span class="b-help">optional · your own words, labeled as yours on the card</span></label>
        <input class="field" id="note" maxlength="90" placeholder="e.g. I'll look for lift every morning this week" autocomplete="off"><div class="count"><span id="ncnt">0</span>/90</div>
        <div class="b-label">Animation <span class="b-help">pick one to save a 10-second looping video</span></div>
        <div class="anims" id="anim" role="group" aria-label="Animation style">${Object.entries(K.ANIMS).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === st.anim}">${esc(v)}</button>`).join("")}</div>
        <p class="b-help" id="hint"></p><button class="btn secondary small" id="replay" hidden>↻ Replay animation</button>
      </section>
    </div>
  </div>`;
const $ = id => document.getElementById(id), cv = $("cv"), ctx = cv.getContext("2d");
const talk = () => talkById(st.t);
// Older talks have no verified quotes on this site: the card shows the official title and speaker, plus an optional personal takeaway.
const libLabel = T => (window.Library && Library.confOf(T.c)?.label) || T.c;
const libIns = () => { const T = st.libT, lab = libLabel(T);
  return { id: "lib-" + T.c + "-" + T.id, eyebrow: lab.toUpperCase() + " · GENERAL CONFERENCE", kicker: T.s, title: T.t, sub: T.r || "",
    body: st.libNote ? { type: "text", text: "My takeaway: " + st.libNote } : undefined,
    basis: st.libNote ? "Official title · takeaway is personal" : "Official talk title and speaker",
    url: `https://www.churchofjesuschrist.org/study/general-conference/${T.c.slice(0, 4)}/${T.c.slice(5)}/${T.id}?lang=eng`,
    share: `“${T.t}” by ${T.s} (${lab} General Conference)${st.libNote ? ". My takeaway: " + st.libNote : ""}` }; };
const ins = () => st.libT ? libIns() : st.ins && INSIGHTS.get(st.ins);
// ---- quote list ----
const norm = x => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "'");
const SESS_ORDER = CONF.sessions.map(x => x.id);
const isOn = (t, i) => !st.ins && !st.libT && t.id === st.t && i === st.q;
const qcard = x => `<article class="qcard ${isOn(x.t, x.i) ? "on" : ""}" role="listitem"><p class="qq">“${esc(x.q)}”</p><p class="qs"><b>${esc(x.t.speaker)}</b> · ${esc(x.t.title)}</p>
  <button type="button" class="btn ${isOn(x.t, x.i) ? "secondary" : "gold"} small qs-use" data-t="${x.t.id}" data-q="${x.i}" aria-pressed="${isOn(x.t, x.i)}" aria-label="${isOn(x.t, x.i) ? "On your card" : "Use this quote"}: ${esc(x.t.speaker)}">${isOn(x.t, x.i) ? "✓ On your card" : "Use this"}</button></article>`;
let qview = null; // null = results list; {c, id} = one talk
function renderQuotes() {
  const words = norm(st.filter).split(/\s+/).filter(w => w.length > 1), q = words.length > 0;
  $("qbrowse").hidden = q || !!qview; $("qresults").hidden = !q && !qview;
  if (!q && !qview) { // browse: newest session first, newest talks first, swipe sideways
    const bySess = SESS_ORDER.slice().reverse().map(sid => ({ s: CONF.sessions.find(x => x.id === sid), items: ALLQ.filter(x => x.t.session === sid && inTheme(x)) })).filter(g => g.items.length);
    bySess.forEach(g => { const ord = [...new Set(g.items.map(x => x.t.id))].reverse(); g.items.sort((a, b) => ord.indexOf(a.t.id) - ord.indexOf(b.t.id) || a.i - b.i); });
    $("qbrowse").innerHTML = (st.scope === "all" ? `<p class="b-help">Type above to search every conference since ${window.Library ? Library.coverage.from : "April 2015"}.</p>` : "") +
      (bySess.length ? bySess.map(g => `<section class="qs-sess"><h3>${esc(g.s.name)} <small>${g.items.length} quote${g.items.length === 1 ? "" : "s"} · swipe →</small></h3><div class="qcar" role="list">${g.items.map(qcard).join("")}</div></section>`).join("") : `<p class="empty">No quotes for this theme yet. Try All themes.</p>`);
    return; }
  if (qview) return renderTalkView();
  const has = s => words.every(w => norm(s).includes(w));
  const qs = ALLQ.filter(x => inTheme(x) && has(x.q + " " + x.t.speaker + " " + x.t.title)).slice(0, 40);
  let talks = CONF.talks.filter(t => has(t.title + " " + t.speaker)).map(t => ({ c: "2026-10", id: t.id, t: t.title, s: t.speaker, n: t.quotes.length, recap: 1 }));
  let more = "";
  if (st.scope === "all") { if (window.Library) talks = talks.concat(Library.talks.filter(t => !t.recap && has(t.t + " " + t.s + " " + t.r + " " + (t.k || "") + " " + (t.tw || []).join(" ") + " " + libLabel(t))).slice(0, 60).map(t => ({ c: t.c, id: t.id, t: t.t, s: t.s, n: 0 })));
    else { more = `<p class="b-help">Loading all conferences…</p>`; loadLib().then(() => renderQuotes()).catch(() => {}); } }
  const tRow = t => `<button type="button" class="qs-talk" data-ct="${t.c}|${esc(t.id)}"><b>${esc(t.t)}</b><span>${esc(t.s)} · ${t.recap ? "October 2026" : esc(window.Library ? libLabel(t) : t.c)} · ${t.recap ? `${t.n} verified quote${t.n === 1 ? "" : "s"}` : "official summary"}</span></button>`;
  $("qresults").innerHTML = `<h3 class="qs-h">Quotes <small>${qs.length}${qs.length === 40 ? "+" : ""}</small></h3>${qs.length ? `<div class="qlistv" role="list">${qs.map(qcard).join("")}</div>` : `<p class="empty">No verified quotes match${st.theme !== "all" ? " in this theme" : ""}.</p>`}
    <h3 class="qs-h">Talks <small>${talks.length}${st.scope === "conf" ? " · this conference" : ""}</small></h3>${more}${talks.length ? `<div class="qs-talks">${talks.map(tRow).join("")}</div>` : more ? "" : `<p class="empty">No talks match.${st.scope === "conf" ? ` <button type="button" class="linkish" data-scope-all>Search all conferences</button>` : ""}</p>`}`;
}
function renderTalkView() { const { c, id } = qview, back = `<button type="button" class="linkish qs-back" data-back>← Back to results</button>`;
  if (c === "2026-10") { const t = talkById(id); $("qresults").innerHTML = `${back}<h3 class="qs-h">${esc(t.title)} <small>${esc(t.speaker)}</small></h3><div class="qlistv" role="list">${t.quotes.map((q, i) => qcard({ t, i, q })).join("")}</div>`; return; }
  const T = Library.talks.find(x => x.c === c && x.id === id); if (!T) { qview = null; return renderQuotes(); }
  const on = st.libT && st.libT.id === T.id && st.libT.c === T.c;
  $("qresults").innerHTML = `${back}<div class="qs-old"><p class="eyebrow-s">${esc(libLabel(T))} · General Conference</p><h3>${esc(T.t)}</h3><p class="qs-by">${esc(T.s)}${T.r ? " · " + esc(T.r) : ""}</p>
    ${T.k ? `<p class="qs-sum">${esc(T.k)}</p><p class="b-help">Official summary line</p>` : ""}<p><a href="${esc(Library.official(T))}" target="_blank" rel="noopener">Read the talk on churchofjesuschrist.org ↗</a></p>
    <p class="b-help">This site has no verified quotes for this talk, so its words don't go on cards. You can still make a card:</p>
    <div class="qs-old-btns"><button type="button" class="btn ${on && !st.libNote ? "secondary" : "gold"}" data-lib="title">${on && !st.libNote ? "✓ Title card" : "Use the title"}</button><button type="button" class="btn secondary" data-lib="note">Add your own takeaway</button></div>
    <div class="qs-note-box" id="libNoteBox" ${on && st.libNote ? "" : "hidden"}><label class="b-label" for="libNote">Your takeaway <span class="b-help">labeled “My takeaway” on the card, so it's clearly personal</span></label>
      <textarea class="field" id="libNote" maxlength="90" rows="2" placeholder="What you want to remember from this talk">${esc(st.libNote)}</textarea></div></div>`; }
$("qresults").addEventListener("click", e => {
  if (e.target.closest("[data-back]")) { qview = null; renderQuotes(); return; }
  if (e.target.closest("[data-scope-all]")) { setScope("all"); return; }
  const tb = e.target.closest(".qs-talk"); if (tb) { const [c, id] = tb.dataset.ct.split("|"); qview = { c, id }; renderQuotes(); $("qresults").scrollIntoView({ block: "nearest" }); return; }
  const lb = e.target.closest("[data-lib]"); if (lb) { const T = Library.talks.find(x => x.c === qview.c && x.id === qview.id);
    st.ins = null; st.libT = { c: T.c, id: T.id, t: T.t, s: T.s, r: T.r }; if (lb.dataset.lib === "title") st.libNote = "";
    renderTalkView(); if (lb.dataset.lib === "note") { $("libNoteBox").hidden = false; $("libNote").focus(); } draw(true); } });
let lnT; $("qresults").addEventListener("input", e => { if (e.target.id !== "libNote") return; clearTimeout(lnT); lnT = setTimeout(() => { st.libNote = cleanNote(e.target.value); draw(true); }, 250); });
const setScope = v => { st.scope = v; $("qscope").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === v)); if (v === "all") loadLib().then(() => renderQuotes()).catch(() => {}); renderQuotes(); };
$("qscope").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (b) setScope(b.dataset.k); });
const useQuote = (t, q) => { st.ins = null; st.libT = null; st.t = t; st.q = q; renderQuotes(); draw(true); };
function renderIns() { $("inslist").innerHTML = INSIGHTS.list.map(x => `<button type="button" class="qitem" data-ins="${x.id}" aria-pressed="${st.ins === x.id}"><span class="qq">${esc(x.title)}</span><span class="qs">${esc(x.kicker)}</span></button>`).join(""); }
document.getElementById("srcQuote").addEventListener("click", e => { const b = e.target.closest(".qs-use"); if (b) useQuote(b.dataset.t, +b.dataset.q); });
$("inslist").addEventListener("click", e => { const b = e.target.closest(".qitem"); if (!b) return; st.libT = null; st.ins = b.dataset.ins; renderIns(); draw(true); });
["spotSel", "themeSel"].forEach(id => $(id).addEventListener("change", e => { if (e.target.value) { st.ins = e.target.value; renderIns(); draw(true); } }));
let qt; $("qsearch").addEventListener("input", e => { clearTimeout(qt); qt = setTimeout(() => { st.filter = e.target.value; qview = null; renderQuotes(); }, 150); });
function renderSug() { const ids = resolveLooks(st.theme), th = T3.get(st.theme);
  $("lookSug").innerHTML = st.theme === "all" ? "" : `<div class="b-label">Suggested for ${esc(th.name)}</div><div class="looks sug">${ids.map(lookBtn).join("")}</div>`;
  $("lookSug").querySelectorAll("canvas[data-thumb]").forEach(c => K.drawThumb(c.getContext("2d"), c.width, c.height, c.dataset.thumb, st.pal));
  $("thmNote").textContent = st.theme === "all" ? "" : `${th.name}:`; }
function pickTheme(slug, auto) { st.theme = slug; $("qthemes").querySelectorAll(".thm").forEach(c => c.setAttribute("aria-pressed", c.dataset.th === slug)); renderSug();
  if (slug !== "all" && (!auto || !P.has("look"))) { const ids = resolveLooks(slug); if (ids.length && (auto ? !ids.includes(st.look) : ids[0] !== st.look)) { st.look = ids[0]; st.ov = null; }
    const cur = ALLQ.find(x => x.t.id === st.t && x.i === st.q); if (!st.ins && (!cur || !inTheme(cur)) && (!auto || !P.has("t"))) { const f = ALLQ.find(x => inTheme(x)); if (f) { st.t = f.t.id; st.q = f.i; } } syncLooks(); }
  renderQuotes(); if (!auto) draw(true); }
$("qthemes").addEventListener("click", e => { const b = e.target.closest(".thm"); if (b) pickTheme(b.dataset.th); });
const syncLooks = () => document.querySelectorAll(".look").forEach(x => x.setAttribute("aria-pressed", x.dataset.look === st.look));
// ---- tabs ----
// Phones: focusing the quote search lifts it to just under the sticky step tabs, so results get the screen.
$("qsearch")?.addEventListener("focus", () => { if (innerWidth > 899) return; const tb = $("tabs").getBoundingClientRect(), r = $("qsearch").getBoundingClientRect(); const dy = r.top - tb.bottom - 8; if (Math.abs(dy) > 4) scrollBy({ top: dy, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
function setTab(k) { st.tab = k; document.body.classList.toggle("st-picking", k === "quote"); requestAnimationFrame(() => typeof setPrevH === "function" && setPrevH()); document.querySelectorAll("#tabs [role=tab]").forEach(b => b.setAttribute("aria-selected", b.id === "tab-" + k)); document.querySelectorAll(".st-pane").forEach(p => p.hidden = p.id !== "p-" + k); if (k === "look") thumbs();
  const panel = document.querySelector(".st-panel"), ph = isPhone ? $("stPrev").offsetHeight + $("sitebar").offsetHeight : 0, top = panel.getBoundingClientRect().top;
  if (top < ph) window.scrollTo({ top: top + scrollY - ph, behavior: "instant" }); }
document.querySelectorAll("#tabs [role=tab]").forEach(b => b.addEventListener("click", () => setTab(b.id.slice(4))));
$("tabs").addEventListener("keydown", e => { if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return; const ks = ["quote", "look", "size", "text", "share"], i = (ks.indexOf(st.tab) + (e.key === "ArrowRight" ? 1 : 4)) % 5; setTab(ks[i]); $("tab-" + ks[i]).focus(); });
// ---- segmented controls ----
const setSrc = v => { st.src = v; $("srcQuote").hidden = v !== "quote"; $("srcIns").hidden = v !== "ins"; $("srcPromo").hidden = v !== "promo"; if (v === "ins" && !st.ins) st.ins = INSIGHTS.list[0].id; if (v !== "ins") st.ins = null; if (v !== "quote") st.libT = null; renderIns(); renderQuotes(); renderPromo(); };
function renderPromo() { $("promolist").innerHTML = PROMOS.list.map(p => `<button type="button" class="qitem" data-promo="${p.id}" aria-pressed="${st.promo === p.id}"><span class="qq">${esc(p.headlines[0])}</span><span class="qs">${esc(p.kicker)}${p.carousel ? " · carousel" : ""}</span></button>`).join("");
  const pr = PROMOS.get(st.promo); $("hlSel").innerHTML = pr.headlines.map((h, i) => `<option value="${i}" ${i === st.hl ? "selected" : ""}>${esc(h)}</option>`).join(""); $("carP").hidden = !pr.carousel; }
$("promolist").addEventListener("click", e => { const b = e.target.closest(".qitem"); if (!b) return; st.promo = b.dataset.promo; st.hl = 0; renderPromo(); draw(true); });
$("hlSel").addEventListener("change", e => { st.hl = +e.target.value; draw(); });
let it; $("invite").addEventListener("input", e => { clearTimeout(it); it = setTimeout(() => { st.invite = cleanNote(e.target.value); draw(); }, 200); });
// ---- advanced formatting ----
const FDEF = { size: 1, lh: 1, ls: 0, blur: 0, vig: 0, grain: 0, dx: 0, dy: 0 };
function syncFmt() { Object.keys(FDEF).forEach(k => { $("f-" + k).value = st.fmt[k] ?? FDEF[k]; }); Object.keys(FMT_OPT).forEach(k => { $("f-" + k).value = st.fmt[k] && st.fmt[k] !== (k === "qm" ? "curly" : k === "border" ? "corners" : "") ? st.fmt[k] : ""; });
  ["ink", "acc"].forEach(k => { $("f-" + k).value = st.fmt[k] || (k === "ink" ? "#ffffff" : "#f1d394"); $("f-" + k).closest("label").classList.toggle("auto", !st.fmt[k]); });
  document.querySelectorAll("#font button").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === st.font)); }
let fT; const fmtChanged = () => { clearTimeout(fT); fT = setTimeout(() => draw(), 60); };
Object.keys(FDEF).forEach(k => $("f-" + k).addEventListener("input", e => { const v = +e.target.value; if (Math.abs(v - FDEF[k]) < 1e-6) delete st.fmt[k]; else st.fmt[k] = v; fmtChanged(); }));
Object.keys(FMT_OPT).forEach(k => $("f-" + k).addEventListener("change", e => { if (e.target.value) st.fmt[k] = e.target.value; else delete st.fmt[k]; draw(); }));
["ink", "acc"].forEach(k => $("f-" + k).addEventListener("input", e => { st.fmt[k] = e.target.value; e.target.closest("label").classList.remove("auto"); fmtChanged(); }));
document.querySelectorAll("#adv [data-auto]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); delete st.fmt[b.dataset.auto]; syncFmt(); draw(); }));
$("f-reset").addEventListener("click", () => { st.fmt = {}; syncFmt(); draw(true); });
$("presets").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const [, font, f] = PRESETS[+b.dataset.i]; st.font = font; st.fmt = { ...f }; syncFmt(); draw(true); });
{ let drag = null; const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  cv.addEventListener("pointerdown", e => { if (!$("f-drag").checked) return; drag = { p: pt(e), dx: st.fmt.dx || 0, dy: st.fmt.dy || 0 }; cv.setPointerCapture(e.pointerId); e.preventDefault(); });
  cv.addEventListener("pointermove", e => { if (!drag) return; const [x, y] = pt(e), c = (v, a) => Math.max(-.3, Math.min(.3, v));
    st.fmt.dx = +c(drag.dx + x - drag.p[0]).toFixed(3); st.fmt.dy = +c(drag.dy + y - drag.p[1]).toFixed(3); $("f-dx").value = st.fmt.dx; $("f-dy").value = st.fmt.dy; if (!raf || st.anim === "none" || reduce) render(Infinity); });
  const end = () => { if (drag) { drag = null; draw(); } }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  $("f-drag").addEventListener("change", e => cv.classList.toggle("dragging", e.target.checked)); }
syncFmt();
["src", "font", "align", "anim", "size", "pal", "layout"].forEach(id => document.querySelectorAll(`#${id} button`).forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute("aria-pressed", x === b));
  if (id === "src") { setSrc(b.dataset.k); return draw(true); }
  if (id === "size") setSticker(false);
  st[id] = b.dataset.k; if (id === "anim") { st.mode = st.anim === "none" ? "still" : "anim"; syncMode(); } draw(true); })));
// Still / Animated: what Share and Save send. Animated = a looping 8-second MP4 made on this device.
function syncMode() { $("shMode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === st.mode));
  $("shareTxt").textContent = st.mode === "anim" ? "Share video" : "Share"; $("save").textContent = st.mode === "anim" ? "Save video" : "Save image"; }
$("shMode").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (!b) return; st.mode = b.dataset.k;
  if (st.mode === "anim" && st.anim === "none") { st.anim = "fade"; document.querySelectorAll("#anim button").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === "fade")); }
  syncMode(); draw(true); });
function setSticker(on) { st.sticker = on; $("igPreset").setAttribute("aria-pressed", on); $("stickRow").hidden = !on; $("sticker").checked = on; }
$("igPreset").addEventListener("click", () => { const on = $("igPreset").getAttribute("aria-pressed") !== "true"; setSticker(on); if (on) { st.size = "story"; document.querySelectorAll("#size button").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === "story")); } draw(true); });
$("sticker").addEventListener("change", e => { st.sticker = e.target.checked; draw(); });
document.addEventListener("click", e => { const c = e.target.closest("#lookCats [data-cat]"); if (!c) return;
  document.querySelectorAll("#lookCats [data-cat]").forEach(x => x.setAttribute("aria-pressed", x === c));
  document.querySelectorAll("#p-look .looks[data-grp]").forEach(g => g.hidden = g.dataset.grp !== c.dataset.cat); });
document.addEventListener("click", e => { const b = e.target.closest(".look"); if (!b) return; st.look = b.dataset.look; st.ov = null; syncLooks(); draw(true); });
$("ov").addEventListener("input", e => { st.ov = +e.target.value / 100; draw(); });
let nt; $("note").addEventListener("input", e => { $("ncnt").textContent = e.target.value.length; clearTimeout(nt); nt = setTimeout(() => { st.note = cleanNote(e.target.value); draw(); }, 200); });
const cleanNote = s => { const c = s.replace(/https?:\/\/\S+|www\.\S+/gi, "").replace(/\s+/g, " ").trim().slice(0, 90);
  if (BAD_NOTE.test(c)) { toast("Please keep your line kind. It wasn't added to the card."); return ""; } return c; };
let thumbsDone = false;
function thumbs() { if (thumbsDone) return; thumbsDone = true; const cs = [...document.querySelectorAll("canvas[data-thumb]")]; let i = 0;
  const step = () => { const c = cs[i++]; if (!c) return; K.drawThumb(c.getContext("2d"), c.width, c.height, c.dataset.thumb, st.pal); (window.requestIdleCallback || setTimeout)(step); }; step(); }
// ---- rendering ----
const startDay = new Date("2026-10-04T00:00:00-06:00");
const dailyInfo = () => { const now = new Date(), n = Math.max(1, Math.floor((now - startDay) / 864e5) + 1);
  return { date: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), line: `Day ${n} of six months of light · ${PROMOS.daysTo()} days to April conference` }; };
const statFor = t => { const tags = {}; t.quotes.forEach((q, i) => T3.tagsFor(t.id, i).forEach(g => tags[g] = (tags[g] || 0) + 1));
  const top = Object.entries(tags).sort((a, b) => b[1] - a[1])[0];
  if (!top) return { value: t.quotes.length, label: "verified quotes from this talk on Six Months of Light", basis: "Counted from the verified quotes on this site" };
  const n = CONF.talks.filter(x => x.quotes.some((q, i) => T3.tagsFor(x.id, i).includes(top[0]))).length;
  return { value: n, label: `of ${CONF.talks.length} talks so far had a quote about ${T3.get(top[0]).name}`, basis: "Counted from the verified quotes on this site, tagged by theme" }; };
const promoObj = slide => PROMOS.build(PROMOS.get(st.promo), st.hl, st.invite, slide);
const opts = () => { const x = ins(), t = talk();
  const base = { look: st.look, palette: st.pal, font: st.font, align: st.align, overlay: st.ov ?? undefined, anim: st.anim === "none" ? "fade" : st.anim, sticker: st.sticker && st.size === "story", layout: st.layout, fmt: st.fmt };
  if (st.src === "promo") { const pr = PROMOS.get(st.promo), o = promoObj(pr.carousel ? 0 : null); return { ...base, kind: "insight", ins: o, eyebrow: o.eyebrow, url: o.url }; }
  if (x) return { ...base, kind: "insight", ins: x, eyebrow: x.eyebrow || (x.id === "daily" ? "SIX MONTHS OF LIGHT · DAILY" : "OCTOBER 2026 · CONFERENCE INSIGHT"), url: x.url || (x.id.startsWith("spot-") ? talkUrl(talkById(x.id.slice(5))) : CONF.site_url + "insights.html#" + x.id) };
  return { ...base, kind: "quote", quote: t.quotes[st.q], speaker: t.speaker, title: t.title, url: talkUrl(t) + "#q" + (st.q + 1), note: st.note, stat: st.layout === "stat" ? statFor(t) : null, daily: st.layout === "daily" ? dailyInfo() : null }; };
let raf, t0;
function render(time) { const [W, H] = S[st.size]; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } K.drawCard(ctx, W, H, opts(), time); }
// preview loops forever (the clip loops cleanly); once = play a single pass (reduced-motion replay, recording)
function play(once) { cancelAnimationFrame(raf); t0 = performance.now(); const loop = now => { const s = (now - t0) / 1000; if (once && s >= K.TL.total) { render(Infinity); return; } render(once ? s : s % K.TL.total); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
const videoType = () => window.MediaRecorder && ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(t => MediaRecorder.isTypeSupported(t));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let readyT;
async function draw(changed) {
  const look = L[st.look]; $("ov").value = Math.round((st.ov ?? look.ov ?? 0) * 100); $("ovv").textContent = $("ov").value + "%";
  const vt = videoType();
  const an = st.anim !== "none";
  $("replay").hidden = !an; syncMode();
  $("hint").innerHTML = an ? (vt || window.VideoEncoder ? `${K.ANIMS[st.anim]}: with <b>Animated</b> on (next to Share), <b>Share video</b> sends an 8-second MP4 that loops cleanly, made on your device. It ends on the site name and a QR code that opens this quote. Choose <b>Still</b> to share the image instead.${reduce ? " The preview stays still because your device asks for reduced motion; tap Replay to watch once." : ""}` : "This browser can't record video; Save will download a still image.") : "Saves a still image. Choose an animation above for a video.";
  const x = ins(), t = talk();
  if (st.src === "promo") cv.setAttribute("aria-label", `Card preview: ${promoObj(null).title}. ${look.name}, ${S[st.size][2]}.`); else cv.setAttribute("aria-label", x ? `Card preview: ${x.title}. ${look.name}, ${S[st.size][2]}.` : `Card preview: “${t.quotes[st.q]}” by ${t.speaker}. ${look.name}, ${S[st.size][2]}.`);
  const q = new URLSearchParams(st.libT ? { lt: st.libT.c + "/" + st.libT.id } : x ? { ins: st.ins } : { t: st.t, q: st.q }); if (st.libT && st.libNote) q.set("ln", st.libNote); q.set("look", st.look); if (st.pal !== "gold") q.set("pal", st.pal); if (st.font !== "classic") q.set("font", st.font); if (st.align !== "center") q.set("align", "left"); q.set("size", st.size); if (st.ov != null) q.set("ov", Math.round(st.ov * 100)); if (st.anim !== "none") q.set("anim", st.anim); if (st.sticker && st.size === "story") q.set("ig", "1"); if (st.theme !== "all") q.set("theme", st.theme); if (st.layout !== "classic") q.set("layout", st.layout); { const fx = encFmt(st.fmt); if (fx) q.set("fx", fx); }
  if (st.src === "promo") { q.delete("t"); q.delete("q"); q.set("promo", st.promo); if (st.hl) q.set("hl", st.hl); }
  $("layHelp").textContent = st.src === "quote" ? (st.layout !== "classic" && st.note ? "· your takeaway shows on the Classic layout" : "") : "· layouts apply to quote cards";
  $("carQ").hidden = !!st.libT; $("carQh").hidden = !!st.libT; $("carQh").textContent = `${talk().quotes.length + 2} slides: a cover, ${talk().quotes.length} quotes in your layout, and a closing slide.`;
  if (!st.capEdited) $("caption").value = defaultCaption();
  setURL("builder.html?" + q);
  if (["note", "margin", "polaroid"].includes(st.layout)) await document.fonts.load('500 40px "Caveat"').catch(() => {});
  await K.prepare(opts());
  an && !reduce ? play() : (cancelAnimationFrame(raf), render(Infinity));
  prerender(); prerenderVideo(); if (changed) document.getElementById("shReady")?.remove();
  if (changed) { const r = $("ready"); r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); }
}
window.__renderAt = s => { render(s); return true; };
window.__studio = st; window.__draw = draw;
$("replay").addEventListener("click", () => play(true));
// ---- share / save / copy ----
const fname = ext => `six-months-of-light-${ins() ? ins().id : slug(talk().speaker)}-${st.size}.${ext}`;
// Cards are PRE-RENDERED whenever they change (debounced), so the file is ready before the tap.
// iOS Safari only allows navigator.share() inside the tap; generating the PNG after the tap is what used to drop the image.
const off = document.createElement("canvas"), offCtx = off.getContext("2d"), cache = new Map(); let preT, gen = 0;
const optsFor = (sz, sticker) => ({ ...opts(), sticker: !!sticker && sz === "story" });
const keyFor = (sz, sticker) => JSON.stringify([optsFor(sz, sticker), sz]);
const fnameFor = (sz, ext) => `six-months-of-light-${ins() ? (ins().id.startsWith("z-") ? "insight" : ins().id) : st.src === "promo" ? "promo-" + st.promo : slug(talk().speaker)}-${sz}.${ext}`;
async function renderFile(sz = st.size, sticker = st.sticker) {
  const key = keyFor(sz, sticker); if (cache.has(key)) return cache.get(key);
  const o = optsFor(sz, sticker), [W, H] = S[sz]; await K.prepare(o); off.width = W; off.height = H; K.drawCard(offCtx, W, H, o, Infinity);
  const b = await new Promise(r => off.toBlob(r, "image/png")), f = new File([b], fnameFor(sz, "png"), { type: "image/png" });
  cache.set(key, f); while (cache.size > 10) cache.delete(cache.keys().next().value); return f; }
const readyFile = (sz = st.size, sticker = st.sticker) => cache.get(keyFor(sz, sticker)) || null;
function prerender() { clearTimeout(preT); const g = ++gen; preT = setTimeout(async () => {
  try { await renderFile(); window.__ready = true;
    if (isPhone) for (const [sz, stk] of [["story", true], ["portrait", false]]) { if (g !== gen) return; await new Promise(r => (window.requestIdleCallback || setTimeout)(r, 50)); await renderFile(sz, stk); }
  } catch (e) {} }, 250); }
const cardFile = () => renderFile();
// ---- video (Animated): made in the background when possible, so the Share tap is instant ----
const vcache = new Map(); let vbusy = null, vT;
async function makeVideo(onP) { const sz = st.size, stk = st.sticker, key = keyFor(sz, stk); if (vcache.has(key)) return vcache.get(key);
  if (vbusy && vbusy.key === key) { if (onP) vbusy.onP = onP; return vbusy.p; }
  if (vbusy) vbusy.ac.abort();
  const o = optsFor(sz, stk), [W, H] = S[sz], ac = new AbortController(), job = { key, ac, onP };
  job.p = (async () => { await K.prepare(o);
    const b = await VideoKit.make({ W, H, draw: (c, w, h, t) => K.drawCard(c, w, h, o, t), onProgress: p => job.onP && job.onP(p), signal: ac.signal });
    const f = new File([b], fnameFor(sz, VideoKit.ext(b)), { type: b.type }); vcache.set(key, f); while (vcache.size > 3) vcache.delete(vcache.keys().next().value); window.__video = { name: f.name, type: f.type, size: f.size }; return f; })()
    .finally(() => { if (vbusy === job) vbusy = null; });
  vbusy = job; return job.p; }
function prerenderVideo() { clearTimeout(vT); if (st.mode !== "anim" || (navigator.connection && navigator.connection.saveData)) return;
  vT = setTimeout(async () => { const [W, H] = S[st.size]; if (await VideoKit.fast(W, H)) makeVideo().catch(() => {}); }, 1800); }
async function shareVideo(copy, ok = "Video shared ✓ · Link copied, paste it in your caption") {
  const ready = vcache.get(keyFor(st.size, st.sticker)); if (ready) return shareFiles([ready], { copy, ok });
  const [W, H] = S[st.size];
  if (!(await VideoKit.supported(W, H))) { toast("This browser can't make videos, so here's the still card."); return shareFiles([await renderFile()], { copy }); }
  const ui = VideoKit.progress(document.querySelector(".st-canvas")), t0 = performance.now(); $("share").disabled = true;
  try { const f = await makeVideo(p => ui.set(p)); ui.done();
    // the tap's permission usually runs out while encoding: one more tap shares it
    if (performance.now() - t0 > 3000) readyPrompt([f], { copy, ok }); else shareFiles([f], { copy, ok }); }
  catch (e) { ui.done(); if (!e || e.name !== "AbortError") toast("Couldn't make the video here. Choose Still to share the image."); }
  finally { $("share").disabled = false; } }
// Share links: per-quote / per-insight pages carry their own link-preview image (generated at build time).
const SHARE_I = window.SHARE_PAGES || [];
const shareUrl = () => { const x = ins(), t = talk();
  if (st.src === "promo") return promoObj(null).url;
  if (x) return SHARE_I.includes(x.id) ? CONF.site_url + "i/" + x.id + ".html" : opts().url;
  return CONF.site_url + "q/" + t.id + "-" + (st.q + 1) + ".html"; };
// Link posts use the static share pages above (served as real HTML by GitHub Pages, each with its own card preview image),
// which every link-preview crawler reads reliably. Phones share the exact card image itself through the share sheet.
const BAD_NOTE = /\b(f+u+c+k+\w*|sh[i1]+t+\w*|b[i1]tch\w*|c+u+n+t+\w*|asshole\w*|bastard\w*|d[i1]ck\w*|cock\w*|puss(y|ies)|wh[o0]re\w*|slut\w*|n[i1]gg\w*|fag\w*|retard\w*|porn\w*|sex\w*|nude\w*|kys)\b/i;
const pinMedia = () => { const x = ins(), t = talk(); if (st.src === "promo") return CONF.site_url + "assets/og/site.jpg";
  if (x) return CONF.site_url + (SHARE_I.includes(x.id) ? "assets/og/i/" + x.id + ".jpg" : "assets/og/site.jpg"); return CONF.site_url + "assets/og/pin/" + t.id + "-" + (st.q + 1) + ".jpg"; };
const baseText = () => { const x = ins(), t = talk(); if (st.src === "promo") return promoObj(null).share; if (x) return x.share;
  return `“${t.quotes[st.q]}” — ${t.speaker}, “${t.title}” (October 2026 General Conference)`; };
const defaultCaption = () => `${baseText()}\n\n${st.src === "promo" ? "Take a look" : ins() ? "See more" : "Read the recap and make your own card"}: ${shareUrl()}\n#GeneralConference`;
const caption = () => { const c = $("caption").value.trim(); return c.includes(shareUrl()) ? c : `${c}\n${shareUrl()}`; };
const shareInfo = () => ({ url: shareUrl(), text: caption().replace(shareUrl(), "").replace(/\n{3,}/g, "\n\n").trim() });
const toast = msg => { $("readyTxt").innerHTML = msg; clearTimeout(readyT); readyT = setTimeout(() => $("readyTxt").innerHTML = "Your card is ready. Tap <b>Share</b>.", 4000); };
// Share = the image file ONLY (no text/url: many share targets keep the text and drop the image).
// The caption + link go to the clipboard in the same tap. If the device can't share files, show the image full screen
// (press and hold to save/share works reliably on iPhone). Never silently fall back to text only.
const canShareFiles = files => !!(navigator.share && navigator.canShare && (() => { try { return navigator.canShare({ files }); } catch (e) { return false; } })());
function shareFiles(files, { copy, ok } = {}) {
  if (copy) { try { navigator.clipboard.writeText(copy).catch(() => {}); } catch (e) {} }
  window.__lastShare = { files: files.map(f => ({ name: f.name, type: f.type, size: f.size })), copy: copy || "" };
  if (!canShareFiles(files)) { viewer(files, copy); return; }
  navigator.share({ files }).then(() => toast(ok || (copy ? "Card shared ✓ · Link copied, paste it in your caption" : "Card shared ✓")))
    .catch(e => { if (e && e.name === "AbortError") return; if (e && e.name === "NotAllowedError") return readyPrompt(files, { copy, ok }); viewer(files, copy); });
}
// When the tap's permission ran out (e.g. a new size had to be drawn first), one more tap shares it.
function readyPrompt(files, o) { document.getElementById("shReady")?.remove(); const d = document.createElement("div"); d.id = "shReady"; d.className = "sh-ready"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Card ready");
  const vid = files[0].type.startsWith("video"), src = URL.createObjectURL(files[0]);
  d.innerHTML = `${vid ? `<video src="${src}" muted autoplay loop playsinline></video>` : `<img alt="" src="${src}">`}<div><b>${files.length > 1 ? files.length + " slides ready" : vid ? "Your video is ready, tap to share" : "Your card is ready"}</b><button type="button" class="btn gold" data-go>Share ${files.length > 1 ? "slides" : vid ? "video" : "card"}</button><button type="button" class="linkish" data-x>Cancel</button></div>`;
  document.body.appendChild(d); d.querySelector("[data-go]").focus();
  d.addEventListener("click", e => { if (e.target.closest("[data-go]")) { d.remove(); shareFiles(files, o); } else if (e.target.closest("[data-x]")) d.remove(); }); }
function viewer(files, copy) { document.getElementById("shView")?.remove(); const v = document.createElement("div"); v.id = "shView"; v.className = "sh-view"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Save your card");
  const urls = files.map(f => URL.createObjectURL(f)), touch = matchMedia("(pointer: coarse)").matches;
  const vid = files[0].type.startsWith("video");
  v.innerHTML = `<div class="shv-top"><b>${vid ? (touch ? "Tap Save video, then post it from your photos or files" : "Save the video, then upload it to your post") : touch ? "Press and hold the image to save or share it" : "Right-click the image to copy it, or download"}</b><button type="button" class="shv-x" data-x aria-label="Close">✕</button></div>
    <div class="shv-imgs">${urls.map((u, i) => vid ? `<video src="${u}" controls autoplay muted loop playsinline aria-label="Your card video"></video>` : `<img src="${u}" alt="Your card${files.length > 1 ? `, slide ${i + 1} of ${files.length}` : ""}">`).join("")}</div>
    <div class="shv-acts"><button type="button" class="btn gold small" data-link>Copy link</button>${copy ? `<button type="button" class="btn secondary small" data-cap>Copy caption</button>` : ""}<button type="button" class="btn secondary small" data-dl>${vid ? "Save video" : "Download" + (files.length > 1 ? " all" : "")}</button></div>
    ${copy ? `<p class="shv-note">Caption and link are already copied: paste them into your post.</p>` : ""}`;
  document.body.appendChild(v); const prev = document.activeElement; v.querySelector("[data-x]").focus();
  const close = () => { v.remove(); urls.forEach(u => setTimeout(() => URL.revokeObjectURL(u), 1000)); prev?.focus?.(); };
  v.addEventListener("click", async e => { const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.x !== undefined) close();
    if (b.dataset.link !== undefined) { await copyText(shareUrl(), "Copy this link:"); b.textContent = "Link copied ✓"; }
    if (b.dataset.cap !== undefined) { await copyText(copy, "Copy this caption:"); b.textContent = "Caption copied ✓"; }
    if (b.dataset.dl !== undefined) for (const f of files) { download(f, f.name); await new Promise(r => setTimeout(r, 300)); } });
  v.addEventListener("keydown", e => { if (e.key === "Escape") close(); }); }
const download = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
// Share: uses the pre-rendered file synchronously inside the tap.
async function shareCurrent(sz = st.size, sticker = st.sticker, copy = caption(), ok) {
  if (st.mode === "anim" && sz === st.size) return shareVideo(copy);
  const f = readyFile(sz, sticker);
  if (f) return shareFiles([f], { copy, ok });
  const file = await renderFile(sz, sticker); shareFiles([file], { copy, ok }); }   // not ready yet: NotAllowedError -> one-more-tap prompt
$("share").addEventListener("click", () => shareCurrent());
$("shareLink").addEventListener("click", async () => { const url = shareUrl(), text = baseText() + "\n#GeneralConference";
  if (navigator.share) { try { await navigator.share({ text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  await copyText(url, "Copy this link:"); toast("Link copied ✓"); });
$("save").addEventListener("click", async () => {
  const btn = $("save"), ig = st.sticker && st.size === "story";
  if (ig) { try { await navigator.clipboard.writeText(shareInfo().url); } catch {} }
  const done = what => toast(ig ? `${what} saved ✓ · Link copied — paste it in a Link sticker` : `${what} saved ✓ · now add it to your post or Story`);
  const [W, H] = S[st.size];
  if (st.mode !== "anim" || !(await VideoKit.supported(W, H))) { download(await cardFile(), fname("png")); done("Image"); return; }
  const ui = VideoKit.progress(document.querySelector(".st-canvas")); btn.disabled = true;
  try { const vf = await makeVideo(p => ui.set(p)); ui.done(); download(vf, vf.name); done("Video"); }
  catch (e) { ui.done(); if (!e || e.name !== "AbortError") toast("Couldn't make the video here. Saving the still image instead."), download(await cardFile(), fname("png")); }
  finally { btn.disabled = false; }
});
$("copy").addEventListener("click", () => { setTab("share"); $("plats").querySelector("button").focus({ preventScroll: true }); });
const copyText = async (txt, label) => { try { await navigator.clipboard.writeText(txt); return true; } catch { prompt(label || "Copy this:", txt); return false; } };
$("caption").addEventListener("input", () => { st.capEdited = true; });
$("capReset").addEventListener("click", () => { st.capEdited = false; $("caption").value = defaultCaption(); });
$("capCopy").addEventListener("click", async () => { await copyText(caption(), "Copy this caption:"); toast("Caption copied ✓"); });
const setSize = sz => { st.size = sz; document.querySelectorAll("#size button").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === sz)); };
const enc = encodeURIComponent, popup = u => window.open(u, "_blank", "noopener,noreferrer,width=680,height=640");
async function platform(k) {
  const url = shareUrl(), cap = caption(), noUrl = cap.replace(url, "").trim(), def = PLAT.find(p => p[0] === k);
  // intent pages open right away (inside the tap) so popup blockers allow them
  if (k === "facebook" && !isPhone) { popup(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`); toast("Opening Facebook · the link post previews this quote's card"); return; }
  if (k === "x") popup(`https://x.com/intent/tweet?text=${enc(cap)}`);
  if (k === "pinterest") popup(`https://www.pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(pinMedia())}&description=${enc(noUrl)}`);
  if (k === "threads") popup(`https://www.threads.net/intent/post?text=${enc(cap)}`);
  if (k === "email") { location.href = `mailto:?subject=${enc(st.src === "promo" ? "Six Months of Light" : "A line from general conference")}&body=${enc(cap)}`; }
  if (k === "copy") { await copyText(url, "Copy this link:"); toast("Link copied ✓ · its preview shows this quote's card"); return; }
  if (!isPhone && k === "whatsapp") { popup(`https://wa.me/?text=${enc(cap)}`); toast("Opened WhatsApp ✓"); return; }
  if (!isPhone && k === "sms") { location.href = `sms:?&body=${enc(cap)}`; return; }
  if (["x", "pinterest", "threads", "email"].includes(k)) { if (def[2]) { setSize(def[2]); setSticker(false); draw(true); } toast(`Opened ${def[1]} · the card is sized for it if you want to add the image`); return; }
  // Phone targets: share the image FILE (pre-rendered for Story and post sizes), caption/link to clipboard in the same tap
  const sz = def[2] || st.size, stk = k === "igstory" ? true : def[2] ? false : st.sticker, copy = k === "igstory" ? url : cap;
  const ok = k === "facebook" ? "Card shared ✓ · Caption copied, paste it in your post" : k === "igstory" ? "Card shared ✓ · Link copied, paste it in a Link sticker" : k === "igpost" ? "Card shared ✓ · Caption copied, paste it in Instagram" : "Card shared ✓ · Link copied, paste it in your message";
  const f = readyFile(sz, stk);
  if (def[2]) { setSize(sz); setSticker(stk); draw(true); }
  if (f) return shareFiles([f], { copy, ok });
  shareFiles([await renderFile(sz, stk)], { copy, ok });
}
$("plats").addEventListener("click", e => { const b = e.target.closest(".plat"); if (b) platform(b.dataset.p); });
// ---- carousels (numbered set of slides) ----
function carouselOpts() { const base = { look: st.look, palette: st.pal, font: st.font, align: st.align, overlay: st.ov ?? undefined, anim: "fade" };
  if (st.src === "promo") { const n = PROMOS.slides.length + 2; return [...Array(n)].map((_, i) => { const o = promoObj(i); return { ...base, kind: "insight", ins: o, eyebrow: o.eyebrow, url: o.url }; }); }
  const t = talk(), n = t.quotes.length + 2, url = talkUrl(t);
  const cover = { ...base, kind: "insight", eyebrow: "OCTOBER 2026 · GENERAL CONFERENCE", url, ins: { kicker: t.speaker, title: t.title, sub: t.big_idea, body: { type: "text", text: `Swipe for ${t.quotes.length} key quotes →` }, slide: [1, n] } };
  const qs = t.quotes.map((q, i) => ({ ...base, kind: "quote", layout: st.layout, quote: q, speaker: t.speaker, title: t.title, url: url + "#q" + (i + 1), slide: [i + 2, n], stat: st.layout === "stat" ? statFor(t) : null, daily: st.layout === "daily" ? dailyInfo() : null }));
  const end = { ...base, kind: "insight", eyebrow: "SIX MONTHS OF LIGHT", url, ins: { kicker: "KEEP GOING", title: "Study the whole talk", sub: "Recap, scriptures, ponder questions and the official talk link", body: { type: "text", text: "Scan the code or visit sixmonthsoflight.com" }, slide: [n, n] } };
  return [cover, ...qs, end]; }
async function exportCarousel() { cancelAnimationFrame(raf); const [W, H] = S[st.size], list = carouselOpts(), files = [];
  for (let i = 0; i < list.length; i++) { await K.prepare(list[i]); cv.width = W; cv.height = H; K.drawCard(ctx, W, H, list[i], Infinity);
    const b = await new Promise(r => cv.toBlob(r, "image/png")); files.push(new File([b], `six-months-of-light-${st.src === "promo" ? "promo" : slug(talk().speaker)}-${String(i + 1).padStart(2, "0")}-of-${list.length}.png`, { type: "image/png" })); }
  draw();
  if (canShareFiles(files)) return shareFiles(files, { copy: caption(), ok: `Carousel shared ✓ (${files.length} slides) · Caption copied` });
  if (isPhone) return viewer(files, caption());
  for (const f of files) { download(f, f.name); await new Promise(r => setTimeout(r, 350)); }
  toast(`${files.length} slides saved ✓ · post them in order as a carousel`); }
window.__carousel = carouselOpts;
$("carQ").addEventListener("click", exportCarousel); $("carP").addEventListener("click", exportCarousel);
$("igBtn").addEventListener("click", () => { const tip = $("igTip"), open = tip.hidden; tip.hidden = !open; $("igBtn").setAttribute("aria-expanded", open); });
// keep the tab bar pinned just under the sticky preview on phones
const setPrevH = () => document.documentElement.style.setProperty("--prevH", $("stPrev").offsetHeight + "px");
new ResizeObserver(setPrevH).observe($("stPrev"));
if (P.get("lt") && /^\d{4}-\d{2}\/[\w-]{1,80}$/.test(P.get("lt"))) loadLib().then(LB => { const [c, id] = P.get("lt").split("/"), T = LB.talks.find(x => x.c === c && x.id === id && !x.recap); if (!T) return;
  st.libT = { c, id, t: T.t, s: T.s, r: T.r }; st.libNote = cleanNote(P.get("ln") || ""); st.scope = "all"; $("qscope").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === "all")); qview = { c, id }; renderQuotes(); draw(true); }).catch(() => {});
setSrc(st.src); setTab(st.src === "promo" && !P.has("tab") ? "quote" : st.tab); pickTheme(st.theme, true);
Promise.all(['500 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '600 20px Inter', '400 20px Inter'].map(f => document.fonts.load(f))).then(() => draw()).catch(() => draw());
