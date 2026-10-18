// ClipKit (prototype): quote video clips. Clips are pre-cut on the build machine (tools/build_clips.py) from the
// official talk video, with per-word timings from speech-to-text. In the browser we only composite:
// video frame + quote text (words light up as they're spoken) + brand, mixed with optional background music
// that ducks under the speech. Export = canvas.captureStream + WebAudio stream -> MediaRecorder (real time).
(function () {
  const K = window.CardKit, SERIF = '"Cormorant Garamond", Georgia, serif', SANS = "Inter, system-ui, sans-serif";
  const ASPECTS = { story: [1080, 1920, "9:16 vertical"], square: [1080, 1080, "1:1 square"], post: [1080, 1350, "4:5 post"], wide: [1920, 1080, "16:9 wide"] };
  // Background music (assets/music). Sources and licenses: LICENSES-music.md. attr = CC BY, so the credit is burned into the clip and added to the share text.
  const MUSIC = [
 {
  "id": "none",
  "name": "No music"
 },
 {
  "id": "meditation-impromptu",
  "name": "Meditation Impromptu",
  "mood": "Calm · solo piano",
  "file": "assets/music/meditation-impromptu.m4a",
  "lic": "“Meditation Impromptu 02” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Meditation Impromptu 02” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "dreamy-flashback",
  "name": "Dreamy Flashback",
  "mood": "Reflective · piano and strings",
  "file": "assets/music/dreamy-flashback.m4a",
  "lic": "“Dreamy Flashback” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Dreamy Flashback” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamy%20Flashback.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "touching-moments",
  "name": "Touching Moments",
  "mood": "Tender · piano, strings",
  "file": "assets/music/touching-moments.m4a",
  "lic": "“Touching Moments Two - Higher” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Touching Moments Two - Higher” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Touching%20Moments%20Two%20-%20Higher.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "lasting-hope",
  "name": "Lasting Hope",
  "mood": "Uplifting · cinematic",
  "file": "assets/music/lasting-hope.m4a",
  "lic": "“Lasting Hope” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Lasting Hope” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lasting%20Hope.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "heartwarming",
  "name": "Heartwarming",
  "mood": "Warm · gentle orchestral",
  "file": "assets/music/heartwarming.m4a",
  "lic": "“Heartwarming” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Heartwarming” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "long-note",
  "name": "Long Note",
  "mood": "Ambient · soft pads",
  "file": "assets/music/long-note.m4a",
  "lic": "“Long Note Two” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Long Note Two” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Two.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "amazing-grace-strings",
  "name": "Amazing Grace",
  "mood": "Hymn · string ensemble",
  "file": "assets/music/amazing-grace-strings.m4a",
  "lic": "U.S. Air Force Band Strolling Strings, arr. Cleveland Chandler · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band Strolling Strings, arr. Cleveland Chandler · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "attr": false
 },
 {
  "id": "nearer-my-god",
  "name": "Nearer, My God, to Thee",
  "mood": "Hymn · concert band",
  "file": "assets/music/nearer-my-god.m4a",
  "lic": "U.S. Air Force Band · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Nearer_My_God_to_Thee_-_Concert_Band_-_United_States_Air_Force_Band.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Nearer_My_God_to_Thee_-_Concert_Band_-_United_States_Air_Force_Band.mp3",
  "attr": false
 },
 {
  "id": "eternal-father",
  "name": "Eternal Father, Strong to Save",
  "mood": "Hymn · reverent",
  "file": "assets/music/eternal-father.m4a",
  "lic": "“The President’s Own” U.S. Marine Band · Public domain (U.S. government work)",
  "credit": "“The President’s Own” U.S. Marine Band · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Eternal_Father,_Strong_to_Save_-_U.S._Marine_Band.ogg",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Eternal_Father,_Strong_to_Save_-_U.S._Marine_Band.ogg",
  "attr": false
 },
 {
  "id": "canon-strings",
  "name": "Canon in D",
  "mood": "Peaceful · strings (Pachelbel)",
  "file": "assets/music/canon-strings.m4a",
  "lic": "U.S. Air Force Band Strolling Strings, arr. Frank Hudson · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band Strolling Strings, arr. Frank Hudson · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Canon_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Canon_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "attr": false
 },
 {
  "id": "ode-to-joy-band",
  "name": "Joyful, Joyful (Ode to Joy)",
  "mood": "Joyful · concert band",
  "file": "assets/music/ode-to-joy-band.m4a",
  "lic": "U.S. Air Force Band of the Rockies · Public domain (U.S. government work)",
  "credit": "U.S. Air Force Band of the Rockies · Public domain (U.S. government work)",
  "src": "https://commons.wikimedia.org/wiki/File:Ode_to_Joy_-_Concert_Band_-_United_States_Air_Force_Band_of_the_Rockies.mp3",
  "license": "Public domain",
  "lurl": "https://commons.wikimedia.org/wiki/File:Ode_to_Joy_-_Concert_Band_-_United_States_Air_Force_Band_of_the_Rockies.mp3",
  "attr": false
 },
 {
  "id": "comfortable-mystery",
  "name": "Comfortable Mystery",
  "mood": "Calm · piano",
  "file": "assets/music/comfortable-mystery.m4a",
  "lic": "“Comfortable Mystery” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Comfortable Mystery” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comfortable%20Mystery.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "frozen-star",
  "name": "Frozen Star",
  "mood": "Still · ambient",
  "file": "assets/music/frozen-star.m4a",
  "lic": "“Frozen Star” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Frozen Star” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Frozen%20Star.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "moonlight-hall",
  "name": "Moonlight Hall",
  "mood": "Gentle · piano",
  "file": "assets/music/moonlight-hall.m4a",
  "lic": "“Moonlight Hall” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Moonlight Hall” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Moonlight%20Hall.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "water-lily",
  "name": "Water Lily",
  "mood": "Tender · piano",
  "file": "assets/music/water-lily.m4a",
  "lic": "“Water Lily” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Water Lily” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Water%20Lily.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "daybreak",
  "name": "Daybreak",
  "mood": "Dawn · cinematic",
  "file": "assets/music/daybreak.m4a",
  "lic": "“Daybreak” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Daybreak” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Daybreak.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "gymnopedie",
  "name": "Gymnopédie No. 1",
  "mood": "Peaceful · solo piano",
  "file": "assets/music/gymnopedie.m4a",
  "lic": "“Gymnopedie No 1” Kevin MacLeod (incompetech.com) · CC BY 4.0 · Satie, public domain",
  "credit": "“Gymnopedie No 1” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "enchanted-journey",
  "name": "Enchanted Journey",
  "mood": "Hopeful · strings",
  "file": "assets/music/enchanted-journey.m4a",
  "lic": "“Enchanted Journey” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Enchanted Journey” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Enchanted%20Journey.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "bittersweet",
  "name": "Bittersweet",
  "mood": "Reflective · piano",
  "file": "assets/music/bittersweet.m4a",
  "lic": "“Bittersweet” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Bittersweet” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bittersweet.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "clean-soul",
  "name": "Clean Soul",
  "mood": "Warm · ambient",
  "file": "assets/music/clean-soul.m4a",
  "lic": "“Clean Soul” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Clean Soul” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Clean%20Soul.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "serene",
  "name": "Serene",
  "mood": "Quiet · piano",
  "file": "assets/music/serene.m4a",
  "lic": "“Serene” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Serene” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Serene.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "gymnopedie-3",
  "name": "Gymnopédie No. 3",
  "mood": "Soft · solo piano",
  "file": "assets/music/gymnopedie-3.m4a",
  "lic": "“Gymnopedie No 3” Kevin MacLeod (incompetech.com) · CC BY 4.0 · Satie, public domain",
  "credit": "“Gymnopedie No 3” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%203.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "deliberate-thought",
  "name": "Deliberate Thought",
  "mood": "Thoughtful · piano",
  "file": "assets/music/deliberate-thought.m4a",
  "lic": "“Deliberate Thought” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Deliberate Thought” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Deliberate%20Thought.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "floating-cities",
  "name": "Floating Cities",
  "mood": "Airy · ambient",
  "file": "assets/music/floating-cities.m4a",
  "lic": "“Floating Cities” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Floating Cities” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Floating%20Cities.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 },
 {
  "id": "healing",
  "name": "Healing",
  "mood": "Tender · cinematic",
  "file": "assets/music/healing.m4a",
  "lic": "“Healing” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "credit": "“Healing” Kevin MacLeod (incompetech.com) · CC BY 4.0",
  "src": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Healing.mp3",
  "license": "CC BY 4.0",
  "lurl": "https://creativecommons.org/licenses/by/4.0/",
  "attr": true
 }
];
  const base = () => window.CARDKIT_BASE || "";
  const get = (t, q) => (window.CLIPS || {})[t + ":" + q] || null;
  // ---- any-text clips: word timings per talk (assets/timings/<id>.json) + self-hosted talk video ----
  // MEDIA_BASE must be same-origin or send CORS headers (the Church CDN doesn't, and a tainted canvas can't be recorded).
  const MEDIA_BASE = () => window.CLIP_MEDIA_BASE || base() + "media/";
  const TIM = {};
  const timings = id => TIM[id] || (TIM[id] = fetch(base() + "assets/timings/" + id + ".json").then(r => { if (!r.ok) throw new Error("no timings"); return r.json(); }));
  const norm = w => String(w).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]/g, "");
  // Local alignment (Smith-Waterman) of the selected words against the transcript; returns best span.
  // Contractions are expanded on both sides ("you've" = "you have"), so speech-to-text spelling doesn't break a match.
  const EXP = { ve: "have", re: "are", ll: "will", m: "am", d: "would" };
  const toks = w => { const s = String(w).toLowerCase().replace(/’/g, "'"); let m;
    if ((m = /^(.*)n't$/.exec(s))) return [norm(m[1] === "won" ? "will" : m[1] === "can" ? "can" : m[1]), "not"];
    if ((m = /^(.*)'(ve|re|ll|m|d)$/.exec(s))) return [norm(m[1]), EXP[m[2]]];
    const n = norm(s); return n ? [n] : []; };
  // Local alignment (Smith-Waterman) of the selected words against the transcript; returns the best span (word indexes).
  function align(words, text) { const q = text.split(/\s+/).flatMap(toks), t = [], ti = [];
    words.forEach((w, k) => toks(w[0]).forEach(x => { t.push(x); ti.push(k); }));
    const n = q.length, m = t.length; if (!n) return null; const MA = 2, MI = -.6, GA = -.7;
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1), sp = new Int32Array(m + 1), sc = new Int32Array(m + 1), qp = new Int32Array(m + 1), qc = new Int32Array(m + 1), best = 0, bj = 0, bs = 0, bi = 0, bq = 1;
    for (let i = 1; i <= n; i++) { cur[0] = 0; sc[0] = 1; qc[0] = i;
      for (let j = 1; j <= m; j++) { const d = prev[j - 1] + (q[i - 1] === t[j - 1] ? MA : MI), up = prev[j] + GA, lf = cur[j - 1] + GA; let v = 0, st = j, sq = i;
        if (d >= up && d >= lf && d > 0) { v = d; if (prev[j - 1] > 0) { st = sp[j - 1]; sq = qp[j - 1]; } } else if (up >= lf && up > 0) { v = up; st = sp[j]; sq = qp[j]; } else if (lf > 0) { v = lf; st = sc[j - 1]; sq = qc[j - 1]; }
        cur[j] = v; sc[j] = st; qc[j] = sq; if (v > best) { best = v; bj = j; bs = st; bi = i; bq = sq; } }
      [prev, cur] = [cur, prev]; [sp, sc] = [sc, sp]; [qp, qc] = [qc, qp]; }
    if (best <= 0) return null;
    // If the last few selected words weren't recognized, extend to cover them (never past 3 words).
    const p3 = x => x.slice(0, 3), restE = q.slice(bi).map(p3), restS = q.slice(0, bq - 1).map(p3);
    let j1 = bj - 1; for (let k = 0; k < Math.min(3, restE.length) && j1 + 1 < m; k++) { if (restE.includes(p3(t[j1 + 1]))) j1++; else if (j1 + 2 < m && restE.includes(p3(t[j1 + 2]))) j1 += 2; else break; }
    let j0 = bs - 1; for (let k = 0; k < Math.min(3, restS.length) && j0 > 0; k++) { if (restS.includes(p3(t[j0 - 1]))) j0--; else if (j0 > 1 && restS.includes(p3(t[j0 - 2]))) j0 -= 2; else break; }
    return { i0: ti[j0], i1: ti[j1], score: best / (MA * n) }; }
  const MAX_DUR = 60, LEAD = .2, TAIL = .3, FADE = .3;
  // Fades (seconds). Video fades are visual (from/to dark); the speech itself is never faded inside the quote.
  // A fade-out longer than the natural tail holds the last frame, so the last word isn't cut short.
  const FADES = { off: 0, short: .5, medium: 1, long: 2 };
  function applyFades(c, f = {}) { const n = x => x == null ? null : +x; c.fin = n(f.fin) ?? 0; c.fout = n(f.fout) ?? FADE; c.mfin = n(f.mfin) ?? .5; c.mfout = n(f.mfout) ?? .6;
    c.dur = +(c.vEnd + Math.max(0, Math.max(c.fout, c.mfout) - TAIL)).toFixed(2); c.fade = c.fout; return c; }
  function cut(T, i0, i1, id, maxDur) { const limit = maxDur || MAX_DUR; const w = T.words.slice(i0, i1 + 1), s0 = w[0][1], e0 = w[w.length - 1][2]; if (e0 - s0 > limit) throw new Error(limit > 60 ? "That passage is over " + Math.round(limit) + " seconds. Pick a shorter part." : "That passage is over 60 seconds. Pick a shorter part.");
    // Start just before the first word (never inside the previous word); end at the last word's end plus a short
    // tail, cut before the next word begins. Word ends are snapped to silence by tools/refine_timings.py.
    const prev = T.words[i0 - 1], next = T.words[i1 + 1];
    const at0 = Math.max(0, prev ? Math.max(prev[2] + .02, s0 - LEAD) : s0 - LEAD);
    const end = Math.max(w[w.length - 1][1] + .15, Math.min(e0 + TAIL, next ? next[1] - .06 : e0 + TAIL));
    return { talk: id, src: MEDIA_BASE() + id + ".mp4", at0, vEnd: +(end - at0).toFixed(2), dur: +(end - at0).toFixed(2), fade: FADE, i0, i1, last: w[w.length - 1][0], nextWord: next && next[0], speech: [s0 - at0, e0 - at0],
      words: w.map(x => ({ w: x[0], s: x[1] - at0, e: x[2] - at0 })) }; }
  async function clipFor(id, text, fades, maxDur) { const T = await timings(id), a = align(T.words, text); if (!a || a.score < .55) throw new Error("Couldn't find that passage in the talk audio. Try a shorter selection.");
    return applyFades(Object.assign(cut(T, a.i0, a.i1, id, maxDur), { score: a.score, text }), fades); }
  // Printed-text span (from ClipMatch) -> clip. Printed words keep their own timings via the printed->spoken map.
  async function clipForSpan(m, p0, p1, fades, maxDur) { const T = await timings(m.talk), map = m.map, i0 = map[p0], i1 = Math.max(i0, map[p1]);
    const c = cut(T, i0, i1, m.talk, maxDur), pw = m.words.slice(p0, p1 + 1); c.text = pw.join(" "); c.p0 = p0; c.p1 = p1; c.score = m.score;
    c.timed = pw.map((t, k) => { const w = T.words[Math.min(i1, Math.max(i0, map[p0 + k]))]; return { t, s: w[1] - c.at0, e: w[2] - c.at0 }; });
    return applyFades(c, fades); }
  const TH = { ink: "#fffaf0", sub: "rgba(255,246,228,.82)", gold: "#f1d394", gold2: "#d8a95b", dark: 1 };
  // Themes for the clip editor. Midnight matches TH so older clips stay the same when no theme is set.
  const THEMES = {
    midnight: { bg: "#0d1326", ink: "#fffaf0", sub: "rgba(255,246,228,.82)", gold: "#f1d394", gold2: "#d8a95b", dark: 1, veil: "13,19,38", pill: "#fffaf0", pillInk: "#1c160e", line: "#e2b34d" },
    rose: { bg: "#3a1c28", ink: "#fff5f2", sub: "rgba(255,228,222,.86)", gold: "#f3a8b8", gold2: "#c45b74", dark: 1, veil: "58,28,40", pill: "#fff6f4", pillInk: "#3a1c28", line: "#e07088" },
    teal: { bg: "#0c2428", ink: "#f3fffc", sub: "rgba(210,245,238,.86)", gold: "#7ddecb", gold2: "#1f8f86", dark: 1, veil: "12,36,40", pill: "#f3fffc", pillInk: "#0c2428", line: "#2aafa0" },
    sage: { bg: "#1a261c", ink: "#f4f7f1", sub: "rgba(220,232,214,.86)", gold: "#d5e4a8", gold2: "#6e8f62", dark: 1, veil: "26,38,28", pill: "#f7f6ef", pillInk: "#1a261c", line: "#7ea06a" },
    silver: { bg: "#1c2128", ink: "#f7f8fa", sub: "rgba(220,226,232,.84)", gold: "#c5d4e6", gold2: "#8e98a4", dark: 1, veil: "28,33,40", pill: "#f7f8fa", pillInk: "#1c2128", line: "#8aa0b8" },
    ember: { bg: "#2a140e", ink: "#fff6f0", sub: "rgba(255,220,200,.86)", gold: "#ffb07a", gold2: "#e15a32", dark: 1, veil: "42,20,14", pill: "#fff6f0", pillInk: "#2a140e", line: "#ff7a3c" },
    gold: { bg: "#16120c", ink: "#fffaf0", sub: "rgba(255,236,200,.84)", gold: "#f6d37a", gold2: "#c4963a", dark: 1, veil: "22,18,12", pill: "#fff8e8", pillInk: "#241c10", line: "#e2b34a" },
    dawn: { bg: "#2a1840", ink: "#fff6ee", sub: "rgba(255,230,214,.88)", gold: "#f0b89a", gold2: "#e38b78", dark: 1, veil: "42,24,64", pill: "#fff6ee", pillInk: "#2a1840", line: "#e38b78" },
    cream: { bg: "#f6efe2", ink: "#2a241c", sub: "rgba(42,36,28,.72)", gold: "#8a5f1f", gold2: "#a87a35", dark: 0, veil: "246,239,226", pill: "#2a241c", pillInk: "#fffaf0", line: "#8a5f1f" },
    grove: { bg: "#14241c", ink: "#f3f7f1", sub: "rgba(220,235,214,.84)", gold: "#d6e2a8", gold2: "#9fbb84", dark: 1, veil: "20,36,28", pill: "#f3f7f1", pillInk: "#14241c", line: "#9fbb84" },
    slate: { bg: "#1c2430", ink: "#f4f7fb", sub: "rgba(220,228,238,.84)", gold: "#f1d394", gold2: "#c9b48a", dark: 1, veil: "28,36,48", pill: "#f4f7fb", pillInk: "#1c2430", line: "#d8a95b" },
  };
  const CAPS = ["highlight", "pill", "pop", "lower", "type"];
  const pal = o => (o && THEMES[o.theme]) || THEMES.midnight;
  const face = (fs, font) => font === "sans" ? `600 ${fs}px ${SANS}` : font === "italic" ? `italic 500 ${fs}px ${SERIF}` : `500 ${fs}px ${SERIF}`;
  const calm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  function rr(ctx, x, y, w, h, r) { const rad = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad); ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath(); }
  function wrapPlain(ctx, text, maxW) { const words = String(text || "").split(/\s+/).filter(Boolean), lines = []; let cur = "";
    words.forEach(w => { const t = cur ? cur + " " + w : w; if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  // Switch on the spoken onset. A 40 ms early bias read as the caption leading the voice.
  function wordAt(words, time) { let i = -1; for (let k = 0; k < words.length; k++) if (time + 1e-3 >= words[k].s) i = k; return i; }
  const BREAK_AFTER = /[.!?;:,]$/;
  const CONJ = { and: 1, but: 1, or: 1, so: 1, because: 1, that: 1, which: 1, when: 1, while: 1, if: 1, as: 1 };
  // 2–5 words, broken on punctuation, a pause, or before a conjunction. A one-word line joins its neighbor.
  function phraseBlocks(words) {
    const lines = []; let cur = [];
    const flush = () => { if (cur.length) { lines.push(cur); cur = []; } };
    words.forEach((w, i) => {
      const bare = String(w.t || "").replace(/[“”"'’]/g, "");
      const gap = i > 0 && w.s - words[i - 1].e > .26;
      if (gap && cur.length >= 2) flush();
      cur.push({ ...w, k: i });
      const next = words[i + 1];
      const nextConj = next && CONJ[String(next.t).toLowerCase().replace(/[^a-z]/g, "")];
      if (cur.length >= 5 || (BREAK_AFTER.test(bare) && cur.length >= 2) || (cur.length >= 3 && nextConj)) flush();
    });
    flush();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length !== 1) continue;
      if (i > 0 && lines[i - 1].length < 5) { lines[i - 1] = lines[i - 1].concat(lines[i]); lines.splice(i, 1); i--; }
      else if (i + 1 < lines.length && lines[i].length + lines[i + 1].length <= 5) { lines[i + 1] = lines[i].concat(lines[i + 1]); lines.splice(i, 1); i--; }
      else if (i > 0 && lines[i - 1].length > 2) lines[i] = [lines[i - 1].pop()].concat(lines[i]);
      else if (i + 1 < lines.length && lines[i + 1].length > 2) lines[i] = lines[i].concat([lines[i + 1].shift()]);
    }
    return lines;
  }
  function activePhrase(words, time) {
    const lines = phraseBlocks(words), cur = Math.max(0, wordAt(words, time));
    let li = lines.findIndex(L => L.some(w => w.k === cur)); if (li < 0) li = 0;
    return { line: lines[li] || [], cur };
  }
  function inkWord(ctx, text, x, y, fs, fill) {
    ctx.lineJoin = "round"; ctx.miterLimit = 2; ctx.lineWidth = Math.max(3, fs * .14);
    ctx.strokeStyle = "rgba(0,0,0,.78)"; ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }
  function fitLines(ctx, words, maxW, font, fs0, avail) { let fs = fs0, lines; for (let k = 0; k < 28; k++) { ctx.font = face(fs, font); lines = wrapWords(ctx, words, maxW); if (lines.length * fs * 1.22 <= avail || fs < 18) break; fs *= .94; } return { fs, lines }; }
  function paintQr(ctx, text, x, y, size) { if (typeof qrcode !== "function" || !text) return; const q = qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount(), pad = size * .08, cell = (size - pad * 2) / n; ctx.save(); ctx.fillStyle = "#fffdf8"; rr(ctx, x, y, size, size, size * .08); ctx.fill(); ctx.fillStyle = "#1d1b2e";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell)); ctx.restore(); }
  function drawGuides(ctx, W, H) { const story = H > W * 1.15, top = H * (story ? .13 : .08), bot = H * (story ? .2 : .1), left = W * (story ? .06 : .04), right = W * (story ? .14 : .05);
    ctx.save(); ctx.fillStyle = "rgba(240,168,208,.16)"; ctx.fillRect(0, 0, W, top); ctx.fillRect(0, H - bot, W, bot); ctx.fillRect(0, top, left, H - top - bot); ctx.fillRect(W - right, top, right, H - top - bot);
    ctx.strokeStyle = "rgba(246,223,166,.9)"; ctx.setLineDash([14, 10]); ctx.lineWidth = Math.max(2, W / 360); ctx.strokeRect(left, top, W - left - right, H - top - bot); ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(240,168,208,.85)"; ctx.beginPath(); ctx.moveTo(W / 2, top); ctx.lineTo(W / 2, H - bot); ctx.moveTo(left, H / 2); ctx.lineTo(W - right, H / 2); ctx.stroke();
    ctx.font = `600 ${Math.max(16, W * .02)}px ${SANS}`; ctx.fillStyle = "rgba(255,246,228,.88)"; ctx.textAlign = "left"; ctx.fillText("Safe zone", left + 14, top + Math.max(26, W * .032)); ctx.restore(); }
  function drawVideo(ctx, W, H, o, video, P) {
    const u = Math.min(W, H); ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    const vw0 = video && (video.videoWidth || video.displayWidth); if (!vw0) return;
    const vw = vw0, vh = video.videoHeight || video.displayHeight, story = H > W * 1.3, cover = !!o.cap, bh = cover ? H : (story ? H * .56 : H);
    const z = Math.max(1, Math.min(2.2, +o.zoom || 1)), moved = z !== 1 || o.panX != null || o.panY != null;
    const s = Math.max(W / vw, bh / vh) * (moved ? z : 1); let dw = vw * s, dh = vh * s, dx = (W - dw) / 2, dy = cover ? (H - dh) / 2 : (story ? H * .07 : (H - dh) / 2);
    if (moved) { const px = o.panX == null ? .5 : Math.max(0, Math.min(1, +o.panX)), py = o.panY == null ? .4 : Math.max(0, Math.min(1, +o.panY));
      dx = -(Math.max(0, dw - W) * px); dy = story ? H * .07 - Math.max(0, dh - bh) * py : -(Math.max(0, dh - H) * py); }
    const vb = o.vbg || "full"; ctx.save(); if (vb !== "full") ctx.globalAlpha = o.vop ?? .6;
    if (vb === "blur") ctx.filter = `blur(${Math.round(u * .015)}px)`; else if (vb === "duotone") ctx.filter = "grayscale(1) contrast(1.15)"; else if (vb === "dim") ctx.filter = "brightness(.55)";
    ctx.drawImage(video, dx, dy, dw, dh); ctx.filter = "none";
    if (vb === "duotone") { ctx.globalAlpha = 1; ctx.globalCompositeOperation = "color"; ctx.fillStyle = P.gold2; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; } ctx.restore();
    const veil = P.veil, storyG = story && !cover;
    if (cover) { const g = ctx.createLinearGradient(0, H * .42, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(.55, "rgba(0,0,0,.28)"); g.addColorStop(1, "rgba(0,0,0,.62)"); ctx.fillStyle = g; ctx.fillRect(0, H * .42, W, H * .58); }
    else if (storyG) { const g = ctx.createLinearGradient(0, H * .07, 0, H * .63); g.addColorStop(0, `rgba(${veil},0)`); g.addColorStop(.75, `rgba(${veil},.35)`); g.addColorStop(1, `rgba(${veil},1)`); ctx.fillStyle = g; ctx.fillRect(0, H * .07, W, H * .56);
      const g2 = ctx.createLinearGradient(0, 0, 0, H * .12); g2.addColorStop(0, `rgba(${veil},1)`); g2.addColorStop(1, `rgba(${veil},0)`); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * .12); }
    else { const wide = W > H * 1.3, g = ctx.createLinearGradient(0, H * (wide ? .3 : .25), 0, H); g.addColorStop(0, `rgba(${veil},0)`); g.addColorStop(.55, `rgba(${veil},.78)`); g.addColorStop(1, `rgba(${veil},.95)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  }
  function drawBrand(ctx, W, H, o, P, yAfter) {
    const u = Math.min(W, H), story = H > W * 1.3; ctx.globalAlpha = 1; ctx.shadowColor = P.dark ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.2)"; ctx.shadowBlur = u * .008; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    if (yAfter && o.cap !== "pop" && o.cap !== "lower" && o.speaker) {
      ctx.fillStyle = P.gold; ctx.font = `600 ${u * .022}px ${SANS}`; ctx.fillText(String(o.speaker).toUpperCase().split("").join("\u200a"), W / 2, yAfter + u * .02);
      if (o.title) { ctx.fillStyle = P.sub; ctx.font = `italic 500 ${u * .03}px ${SERIF}`; ctx.fillText(o.title, W / 2, yAfter + u * .062); } }
    const by = H - u * (story ? .1 : .06); if (K && K.wordmark) K.wordmark(ctx, W / 2, by, u * .034, P, "center");
    ctx.fillStyle = P.ink; ctx.font = `600 ${u * .02}px ${SANS}`; ctx.fillText((window.CONF && CONF.domain) || "sixmonthsoflight.com", W / 2, by + u * .032);
    ctx.globalAlpha = .8; ctx.fillStyle = P.sub; ctx.font = `${u * .015}px ${SANS}`;
    ctx.fillText("Video and text from ChurchofJesusChrist.org · Personal study site · Not an official Church site", W / 2, H - u * (o.musicCredit ? .04 : .018));
    if (o.musicCredit) ctx.fillText("Music: " + o.musicCredit, W / 2, H - u * .018); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  function tagged(words) { return (words || []).map((w, k) => ({ ...w, k })); }
  // One centered line of words that includes the current word and fits maxW.
  function oneLine(ctx, words, cur, maxW) {
    const all = tagged(words), sp = ctx.measureText(" ").width, c = Math.max(0, Math.min(all.length - 1, cur));
    for (let n = Math.min(8, all.length); n >= 1; n--) {
      const a = Math.max(0, Math.min(c - Math.floor((n - 1) / 2), all.length - n)), slice = all.slice(a, a + n);
      const width = slice.reduce((s, w) => s + ctx.measureText(w.t).width, 0) + sp * Math.max(0, slice.length - 1);
      if (width <= maxW && slice.some(w => w.k === c)) return { slice, width, sp };
    }
    const w = all[c]; return { slice: [w], width: ctx.measureText(w.t).width, sp: 0 };
  }
  // Up to `want` lines, centered on the current word.
  function takeLines(ctx, words, cur, maxW, want) {
    const all = tagged(words), c = Math.max(0, Math.min(all.length - 1, cur)); let best = null;
    for (let n = Math.min(all.length, 2); n <= Math.min(all.length, want * 7); n++) {
      const a = Math.max(0, Math.min(c - Math.floor(n / 2), all.length - n)), slice = all.slice(a, a + n);
      const lines = wrapWords(ctx, slice, maxW);
      if (!lines.some(L => L.some(w => w.k === c))) continue;
      if (lines.length <= want) best = lines;
      if (lines.length === want) return lines;
    }
    return best || wrapWords(ctx, all.slice(Math.max(0, c - 4), Math.min(all.length, c + 6)), maxW).slice(0, want);
  }
  function drawHighlight(ctx, W, H, o, time, P) {
    const words = o.timed || []; if (!words.length) return H * .7;
    const u = Math.min(W, H), sc = o.scale || 1, phrase = activePhrase(words, time), line = phrase.line, cur = phrase.cur;
    let fs = u * (H > W ? .078 : .064) * sc;
    const maxW = W * .88;
    const layout = () => {
      ctx.font = `800 ${fs}px ${SANS}`;
      const sp = ctx.measureText(" ").width;
      const widths = line.map(w => ctx.measureText(w.t).width);
      return { sp, widths, width: widths.reduce((a, b) => a + b, 0) + sp * Math.max(0, line.length - 1) };
    };
    let lay = layout();
    while (lay.width > maxW && fs > u * .04) { fs *= .92; lay = layout(); }
    const y = H * (H > W * 1.3 ? .72 : .64) + (o.ty || 0) * H;
    let x = (W - lay.width) / 2 + (o.tx || 0) * W;
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.font = `800 ${fs}px ${SANS}`;
    line.forEach((w, i) => {
      const hot = w.k === cur && o.captions !== false;
      const dur = Math.max(.08, (w.e || w.s + .2) - w.s);
      const p = hot ? Math.max(0, Math.min(1, (time - w.s) / dur)) : (time >= w.s ? 1 : 0);
      const ww = lay.widths[i];
      ctx.save();
      inkWord(ctx, w.t, x, y, fs, "rgba(255,250,240,.92)");
      if (hot && p > 0 && !calm()) {
        ctx.beginPath(); ctx.rect(x - fs * .08, y - fs * 1.15, ww * p + fs * .16, fs * 1.45); ctx.clip();
        inkWord(ctx, w.t, x, y, fs, P.gold);
      } else if (hot) inkWord(ctx, w.t, x, y, fs, P.gold);
      ctx.restore();
      x += ww + lay.sp;
    });
    return y + fs * .2;
  }
  function drawPill(ctx, W, H, o, time, P) {
    const src = o.timed || []; if (!src.length) return H * .7;
    const u = Math.min(W, H), story = H > W * 1.3, wide = W > H * 1.3, font = o.font || "sans", sc = o.scale || 1;
    const phrase = activePhrase(src, time), cur = phrase.cur, maxW = wide ? W * .78 : W - u * .18;
    let fs = u * (story ? .062 : .054) * sc; ctx.font = `800 ${fs}px ${SANS}`;
    let line = { slice: phrase.line, sp: ctx.measureText(" ").width, width: 0 };
    line.width = line.slice.reduce((s, w) => s + ctx.measureText(w.t).width, 0) + line.sp * Math.max(0, line.slice.length - 1);
    while (line.width > maxW && fs > u * .034) { fs *= .92; ctx.font = `800 ${fs}px ${SANS}`; line.sp = ctx.measureText(" ").width; line.width = line.slice.reduce((s, w) => s + ctx.measureText(w.t).width, 0) + line.sp * Math.max(0, line.slice.length - 1); }
    const bh = fs * 1.55, bw = Math.min(W * .9, Math.max(u * .34, line.width + u * .09));
    const x0 = (W - bw) / 2 + (o.tx || 0) * W, y0 = (story ? H * .62 : H * (wide ? .58 : .54)) + (o.ty || 0) * H;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = u * .016; ctx.fillStyle = P.pill || "#fffaf0"; rr(ctx, x0, y0, bw, bh, bh / 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(4, u * .008); ctx.strokeStyle = P.line || P.gold; ctx.stroke(); ctx.restore();
    let x = x0 + (bw - line.width) / 2; const y = y0 + fs * 1.05; ctx.font = `800 ${fs}px ${SANS}`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.shadowBlur = 0;
    line.slice.forEach(w => { const on = time + 1e-3 >= w.s; ctx.globalAlpha = on ? 1 : .45; ctx.fillStyle = w.k === cur ? (P.line || P.gold) : (P.pillInk || P.ink); ctx.fillText(w.t, x, y); x += ctx.measureText(w.t).width + line.sp; });
    ctx.globalAlpha = 1; return y0 + bh;
  }
  function drawPop(ctx, W, H, o, time, P) {
    const src = o.timed || []; if (!src.length) return H * .72; const phrase = activePhrase(src, time), cur = phrase.cur;
    const u = Math.min(W, H), sc = o.scale || 1, maxW = W * .88;
    let fs = u * (H > W ? .1 : .084) * sc, chosen = null;
    {
      const slice = phrase.line.length ? phrase.line : [{ t: "", s: 0, e: 0, k: cur }];
      ctx.font = `800 ${fs}px ${SANS}`; const sp = ctx.measureText(" ").width;
      const width = slice.reduce((s, w) => s + ctx.measureText(w.t).width * (w.k === cur ? 1.12 : 1), 0) + sp * Math.max(0, slice.length - 1);
      chosen = { slice, sp, width };
    }
    if (!chosen) return H * .72;
    while (chosen.width > maxW && fs > u * .045) {
      fs *= .9; ctx.font = `800 ${fs}px ${SANS}`; const sp = ctx.measureText(" ").width;
      chosen.sp = sp; chosen.width = chosen.slice.reduce((s, w) => s + ctx.measureText(w.t).width * (w.k === cur ? 1.12 : 1), 0) + sp * Math.max(0, chosen.slice.length - 1);
    }
    const cy = H * (H > W * 1.3 ? .66 : .58) + (o.ty || 0) * H, xStart = (W - chosen.width) / 2 + (o.tx || 0) * W;
    let x = xStart; ctx.textBaseline = "middle"; ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = u * .02;
    chosen.slice.forEach(w => {
      const hot = w.k === cur, age = Math.max(0, time - w.s), grow = hot ? (calm() ? 1.08 : 1 + .22 * Math.exp(-age / .1)) : 1;
      const ww = ctx.measureText(w.t).width;
      ctx.save(); ctx.translate(x + ww * grow / 2, cy); ctx.scale(grow, grow); ctx.font = `800 ${fs}px ${SANS}`; ctx.textAlign = "center"; ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, fs * .12); ctx.strokeStyle = "rgba(0,0,0,.72)"; ctx.strokeText(w.t, 0, 0); ctx.fillStyle = hot ? P.gold : "#fffaf0"; ctx.fillText(w.t, 0, 0); ctx.restore();
      x += ww * (hot ? grow : 1) + chosen.sp;
    });
    ctx.shadowBlur = 0; return cy + fs * .6;
  }
  function drawLower(ctx, W, H, o, time, P) {
    const src = o.timed || []; if (!src.length) return H * .8;
    const u = Math.min(W, H), story = H > W * 1.3, sc = o.scale || 1;
    const phrase = activePhrase(src, time), cur = phrase.cur, words = phrase.line.length ? phrase.line : [src[cur] || src[0]];
    const mid = words.length > 3 ? Math.ceil(words.length / 2) : words.length;
    const lines = words.length > 3 ? [words.slice(0, mid), words.slice(mid)] : [words];
    let fs = u * (story ? .056 : .048) * sc, maxW = W * .86;
    const measure = () => { ctx.font = `800 ${fs}px ${SANS}`; const sp = ctx.measureText(" ").width;
      return { sp, rows: lines.map(L => ({ L, w: L.reduce((a, w) => a + ctx.measureText(w.t).width, 0) + sp * Math.max(0, L.length - 1) })) }; };
    let lay = measure();
    while (lay.rows.some(r => r.w > maxW) && fs > u * .032) { fs *= .9; lay = measure(); }
    const bh = lines.length * fs * 1.42 + u * .05;
    const y0 = (story ? H * .7 : H * .62) + (o.ty || 0) * H, x0 = W * .04 + (o.tx || 0) * W, bw = W * .92;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = u * .02; ctx.fillStyle = "rgba(8,10,16,.86)"; rr(ctx, x0, y0, bw, bh, u * .018); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = P.gold; ctx.fillRect(x0, y0, bw, Math.max(5, u * .008)); ctx.restore();
    let y = y0 + fs * 1.18; ctx.font = `800 ${fs}px ${SANS}`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    lay.rows.forEach(row => { let x = x0 + Math.max(u * .02, (bw - row.w) / 2);
      row.L.forEach(w => { const hot = w.k === cur, on = time + 1e-3 >= w.s, ww = ctx.measureText(w.t).width;
        ctx.globalAlpha = on ? 1 : .42; inkWord(ctx, w.t, x, y, fs, hot ? P.gold : "#fffaf0"); x += ww + lay.sp; });
      y += fs * 1.42; });
    ctx.globalAlpha = 1; return y0 + bh;
  }
  function drawType(ctx, W, H, o, time, P) {
    const src = o.timed || []; if (!src.length) return H * .7; const words = src.map((w, i) => ({ ...w, k: i }));
    const u = Math.min(W, H), font = o.font || "italic", sc = o.scale || 1, cw = W * .84;
    const fit = fitLines(ctx, words, cw, font, u * .054 * sc, H * .3), fs = fit.fs, lines = fit.lines; if (!lines.length) return H * .7;
    let li = 0; lines.forEach((L, i) => { if (time + 1e-3 >= L[0].s) li = i; });
    const show = li > 0 ? [lines[li - 1], lines[li]] : [lines[li]];
    let y = H * (H > W ? .64 : .58) + (o.ty || 0) * H + fs; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.shadowColor = P.dark ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.35)"; ctx.shadowBlur = u * .01; ctx.font = face(fs, font);
    show.forEach(L => { const isCur = L === lines[li]; let alpha = 1, text;
      if (!isCur) { alpha = calm() ? .4 : Math.max(.25, 1 - Math.max(0, time - lines[li][0].s) / 1.15); text = L.map(w => w.t).join(" "); }
      else if (calm()) text = L.map(w => w.t).join(" ");
      else { const parts = []; L.forEach(w => { if (time >= w.e) parts.push(w.t); else if (time + 1e-3 >= w.s) { const p = Math.max(0, Math.min(1, (time - w.s) / Math.max(.12, (w.e - w.s) || .2))); parts.push(w.t.slice(0, Math.max(1, Math.ceil(w.t.length * p)))); } }); text = parts.join(" "); }
      ctx.globalAlpha = alpha; ctx.fillStyle = isCur ? P.gold : P.ink; ctx.fillText(text, W / 2 + (o.tx || 0) * W, y); y += fs * 1.28; });
    ctx.globalAlpha = 1; return y;
  }
  function drawStyled(ctx, W, H, o, time, video) {
    const P = pal(o); ctx.save(); drawVideo(ctx, W, H, o, video, P); let y;
    if (o.cap === "pill") y = drawPill(ctx, W, H, o, time, P); else if (o.cap === "pop") y = drawPop(ctx, W, H, o, time, P);
    else if (o.cap === "lower") y = drawLower(ctx, W, H, o, time, P); else if (o.cap === "type") y = drawType(ctx, W, H, o, time, P); else y = drawHighlight(ctx, W, H, o, time, P);
    drawBrand(ctx, W, H, o, P, y); ctx.restore();
  }
  function drawCardPhase(ctx, W, H, o) {
    const P = pal(o), u = Math.min(W, H), story = H > W * 1.3; ctx.save(); ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * .5, H * .3, u * .02, W * .5, H * .42, u * 1.15); g.addColorStop(0, P.dark ? "rgba(241,211,148,.24)" : "rgba(168,122,53,.16)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    if (o.phase === "end") {
      ctx.fillStyle = P.gold; ctx.font = `600 ${u * .02}px ${SANS}`; ctx.fillText("WATCH THE FULL TALK", W / 2, H * .15);
      ctx.fillStyle = P.ink; let fs = u * .05; ctx.font = `500 ${fs}px ${SERIF}`; let lines = wrapPlain(ctx, o.title || "", W * .82);
      while (lines.length > 3 && fs > u * .03) { fs *= .92; ctx.font = `500 ${fs}px ${SERIF}`; lines = wrapPlain(ctx, o.title || "", W * .82); }
      let y = H * .21; lines.forEach(l => { ctx.fillText(l, W / 2, y); y += fs * 1.12; });
      ctx.fillStyle = P.gold; ctx.font = `600 ${u * .022}px ${SANS}`; ctx.fillText(String(o.speaker || "").toUpperCase(), W / 2, y + u * .02);
      const url = o.url || "", qs = u * (story ? .28 : .22), qx = (W - qs) / 2, qy = y + u * .045; paintQr(ctx, url, qx, qy, qs);
      const shown = String(url).replace(/^https?:\/\//, ""), cut = shown.indexOf("/");
      const host = cut < 0 ? shown : shown.slice(0, cut), path = cut < 0 ? "" : shown.slice(cut + 1);
      ctx.fillStyle = P.sub; ctx.font = `500 ${u * .02}px ${SANS}`;
      ctx.fillText(host, W / 2, qy + qs + u * .05);
      if (path) { ctx.fillStyle = P.ink; ctx.font = `600 ${u * .02}px ${SANS}`; ctx.fillText(path, W / 2, qy + qs + u * .078); }
    } else {
      let hook = String(o.hook || "").replace(/\s+/g, " ").trim(), own = !!o.own;
      let fs = u * (story ? .078 : .062) * (o.scale || 1);
      const fitHook = text => { let size = fs, lines = []; ctx.font = `800 ${size}px ${SANS}`; lines = wrapPlain(ctx, text, W * .84);
        while (lines.length > 3 && size > u * .04) { size *= .9; ctx.font = `800 ${size}px ${SANS}`; lines = wrapPlain(ctx, text, W * .84); } return { size, lines }; };
      let laid = fitHook(hook);
      if (!hook || laid.lines.length > 3) { hook = String(o.title || hook).replace(/[“”„«»"]/g, "").replace(/\s+/g, " ").trim(); own = false; laid = fitHook(hook); }
      fs = laid.size; const lines = laid.lines;
      const ruleY = H * (story ? .2 : .16);
      ctx.strokeStyle = P.gold; ctx.globalAlpha = .85; ctx.lineWidth = Math.max(2, u * .003); ctx.beginPath(); ctx.moveTo(W * .32, ruleY); ctx.lineTo(W * .68, ruleY); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = P.gold; ctx.font = `700 ${u * .02}px ${SANS}`;
      ctx.fillText(own ? "YOUR OWN WORDS" : "A MOMENT FROM CONFERENCE", W / 2, ruleY - u * .02);
      if (own) { ctx.fillStyle = P.sub; ctx.font = `500 ${u * .016}px ${SANS}`; ctx.fillText("Added by the sharer, not a quote", W / 2, ruleY + u * .028); }
      const words = []; lines.forEach(l => l.split(" ").forEach(w => words.push(w)));
      const hot = Math.max(0, words.length - 1);
      let n = 0, y = H * (story ? .38 : .34);
      ctx.font = `800 ${fs}px ${SANS}`; ctx.textAlign = "left"; ctx.lineJoin = "round";
      lines.forEach(l => {
        const parts = l.split(" "), sp = ctx.measureText(" ").width, widths = parts.map(w => ctx.measureText(w).width);
        const lw = widths.reduce((a, b) => a + b, 0) + sp * Math.max(0, parts.length - 1); let x = (W - lw) / 2;
        parts.forEach((w, i) => { const fill = n === hot ? P.gold : (P.dark ? "#fffaf0" : P.ink); if (P.dark) inkWord(ctx, w, x, y, fs, fill); else { ctx.fillStyle = fill; ctx.fillText(w, x, y); } x += widths[i] + sp; n++; });
        y += fs * 1.16;
      });
      ctx.textAlign = "center";
      const sy = Math.max(y + u * .06, H * (story ? .72 : .68));
      ctx.fillStyle = P.gold; ctx.font = `700 ${u * .022}px ${SANS}`; ctx.fillText(String(o.speaker || "").toUpperCase(), W / 2, sy);
      if (o.title) { ctx.fillStyle = P.sub; ctx.font = `italic 500 ${u * .03}px ${SERIF}`; wrapPlain(ctx, o.title, W * .8).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, sy + u * .042 + i * u * .036)); }
    }
    const by = H - u * (story ? .09 : .065); if (K && K.wordmark) K.wordmark(ctx, W / 2, by, u * .032, P, "center");
    ctx.globalAlpha = .82; ctx.fillStyle = P.sub; ctx.font = `${u * .015}px ${SANS}`; ctx.textAlign = "center";
    ctx.fillText("Personal study site · Not an official Church site", W / 2, H - u * (o.musicCredit ? .038 : .018));
    if (o.musicCredit) ctx.fillText("Music: " + o.musicCredit, W / 2, H - u * .016);
    ctx.restore();
  }
  function wrapWords(ctx, words, maxW) { const lines = []; let cur = [], w = 0, sp = ctx.measureText(" ").width;
    words.forEach((x, i) => { const ww = ctx.measureText(x.t).width; if (cur.length && w + sp + ww > maxW) { lines.push(cur); cur = []; w = 0; } cur.push({ ...x, i, ww }); w += (cur.length > 1 ? sp : 0) + ww; }); if (cur.length) lines.push(cur); return lines; }
  // Quote words (official text) mapped onto spoken word timings by position.
  function timedQuote(clip, quote) { if (clip.timed && (!quote || quote === clip.text)) return clip.timed; const qw = quote.split(/\s+/).filter(Boolean), sw = clip.words, n = qw.length, m = sw.length;
    return qw.map((t, i) => { const j = Math.min(m - 1, Math.floor(i * m / n)); return { t, s: sw[j].s, e: sw[j].e }; }); }
  function draw(ctx, W, H, o, time, video) {
    if (o && (o.phase === "title" || o.phase === "end" || o.phase === "poster")) { drawCardPhase(ctx, W, H, o); if (o.guides) drawGuides(ctx, W, H); return; }
    drawInner(ctx, W, H, o, time, video); const D = o.dur, F = o.fout ?? o.fade ?? .3, I = o.fin || 0; let a = 0;
    if (D && isFinite(time) && F > 0 && time > D - F) a = Math.min(1, (time - (D - F)) / F);
    if (D && isFinite(time) && I > 0 && time < I) a = Math.max(a, 1 - Math.max(0, time) / I);
    if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#0d1326"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (o && o.guides) drawGuides(ctx, W, H); }
  function drawInner(ctx, W, H, o, time, video) {
    if (o && o.cap) { drawStyled(ctx, W, H, o, time, video); return; }
    const u = Math.min(W, H); ctx.save(); ctx.fillStyle = "#0d1326"; ctx.fillRect(0, 0, W, H);
    const vw0 = video && (video.videoWidth || video.displayWidth); if (vw0) { const vw = vw0, vh = video.videoHeight || video.displayHeight, story = H > W * 1.3;
      // vertical: video sits in the upper part, cover-cropped around the speaker; others: full-bleed cover
      const bh = story ? H * .56 : H, s = Math.max(W / vw, bh / vh), dw = vw * s, dh = vh * s;
      const vb = o.vbg || "full"; ctx.save(); if (vb !== "full") ctx.globalAlpha = o.vop ?? .6;
      if (vb === "blur") ctx.filter = `blur(${Math.round(u * .015)}px)`; else if (vb === "duotone") ctx.filter = "grayscale(1) contrast(1.15)"; else if (vb === "dim") ctx.filter = "brightness(.55)";
      ctx.drawImage(video, (W - dw) / 2, story ? H * .07 : (H - dh) / 2, dw, dh); ctx.filter = "none";
      if (vb === "duotone") { ctx.globalAlpha = 1; ctx.globalCompositeOperation = "color"; ctx.fillStyle = "#d8a95b"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; } ctx.restore();
      if (story) { const g = ctx.createLinearGradient(0, H * .07, 0, H * .63); g.addColorStop(0, "rgba(13,19,38,.0)"); g.addColorStop(.75, "rgba(13,19,38,.35)"); g.addColorStop(1, "rgba(13,19,38,1)"); ctx.fillStyle = g; ctx.fillRect(0, H * .07, W, H * .56);
        const g2 = ctx.createLinearGradient(0, 0, 0, H * .12); g2.addColorStop(0, "rgba(13,19,38,1)"); g2.addColorStop(1, "rgba(13,19,38,0)"); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * .12); } }
    const story = H > W * 1.3, wide = W > H * 1.3;
    if (!story) { const g = ctx.createLinearGradient(0, H * (wide ? .3 : .25), 0, H); g.addColorStop(0, "rgba(13,19,38,0)"); g.addColorStop(.55, "rgba(13,19,38,.78)"); g.addColorStop(1, "rgba(13,19,38,.95)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // quote, words light up as spoken
    const words = o.timed, cw = wide ? W * .78 : W - u * .16, top = story ? H * .6 : H * (wide ? .52 : .46), avail = (story ? H * .78 : H * .82) - top;
    let fs = u * (story ? .062 : wide ? .052 : .056), lines; for (let k = 0; k < 30; k++) { ctx.font = `500 ${fs}px ${SERIF}`; lines = wrapWords(ctx, words, cw); if (lines.length * fs * 1.18 <= avail) break; fs *= .94; }
    let y = top + Math.max(0, (avail - lines.length * fs * 1.18) / 2) + fs; ctx.textBaseline = "alphabetic"; ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = u * .012;
    const sp = ctx.measureText(" ").width;
    lines.forEach(L => { const lw = L.reduce((a, x) => a + x.ww, 0) + sp * (L.length - 1); let x = (W - lw) / 2;
      L.forEach(w => { const on = time + 1e-3 >= w.s, p = Math.max(0, Math.min(1, (time - w.s) / .22));
        ctx.globalAlpha = o.captions ? (on ? .45 + .55 * p : .4) : 1; ctx.fillStyle = on && o.captions && p < 1 ? TH.gold : TH.ink; ctx.textAlign = "left"; ctx.fillText(w.t, x, y); x += w.ww + sp; }); y += fs * 1.18; });
    ctx.globalAlpha = 1; ctx.shadowBlur = u * .008;
    ctx.fillStyle = TH.gold; ctx.font = `600 ${u * .022}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText(String(o.speaker).toUpperCase().split("").join(String.fromCharCode(8202)), W / 2, y + u * .03);
    ctx.fillStyle = TH.sub; ctx.font = `italic 500 ${u * .032}px ${SERIF}`; ctx.fillText(o.title, W / 2, y + u * .075);
    // brand
    const by = H - u * (story ? .1 : .06); if (K && K.wordmark) { K.wordmark(ctx, W / 2, by, u * .036, TH, "center"); }
    ctx.fillStyle = TH.ink; ctx.font = `600 ${u * .022}px ${SANS}`; ctx.fillText((window.CONF && CONF.domain) || "sixmonthsoflight.com", W / 2, by + u * .035);
    ctx.globalAlpha = .75; ctx.fillStyle = TH.sub; ctx.font = `${u * .015}px ${SANS}`; ctx.fillText("Video and text from ChurchofJesusChrist.org · Personal study site · Not an official Church site", W / 2, H - u * (o.musicCredit ? .042 : .018));
    if (o.musicCredit) ctx.fillText("Music: " + o.musicCredit, W / 2, H - u * .018);
    ctx.restore();
  }
  function duckOn(g, clip, vol, t0) { const low = vol * .2, D = clip.dur, F = clip.mfout ?? clip.fade ?? .3, MI = clip.mfin ?? .5; g.cancelScheduledValues(t0); g.setValueAtTime(0, t0);
      const ws = clip.words || [], s0 = ws.length ? ws[0].s : clip.speech[0], e0 = ws.length ? ws[ws.length - 1].e : clip.speech[1];
      g.linearRampToValueAtTime(Math.min(vol, low * 2), t0 + Math.max(.05, MI ? Math.min(MI, Math.max(.05, s0 - .05)) : .02)); g.linearRampToValueAtTime(low, t0 + Math.max(.1, s0));
      for (let i = 1; i < ws.length; i++) { const gap = ws[i].s - ws[i - 1].e; if (gap > .7) { const a = t0 + ws[i - 1].e; g.setValueAtTime(low, a); g.linearRampToValueAtTime(vol * .45, a + Math.min(.4, gap / 2)); g.linearRampToValueAtTime(low, t0 + ws[i].s - .05); } }
      const tail = Math.max(e0 + .05, D - Math.max(F, .05)); g.setValueAtTime(low, t0 + Math.min(e0, tail)); g.linearRampToValueAtTime(vol * .5, t0 + tail); g.linearRampToValueAtTime(0, t0 + D); }
  // Player: one <video>, one AudioContext. Music gain ducks while the speaker talks.
  function player(clip) {
    const v = document.createElement("video"); const at0 = clip.at0 || 0, SRC = /^(https?:)?\/\//.test(clip.src) || clip.src.startsWith(base() + "media/") ? clip.src : base() + clip.src;
    // crossOrigin must be set before src. The media fragment (#t=) makes iOS Safari fetch the frame at the quote
    // (it ignores preload=auto and won't load data until asked), and is a fallback if a seek is dropped.
    v.crossOrigin = "anonymous"; v.playsInline = true; v.setAttribute("playsinline", ""); v.muted = false; v.preload = "auto"; v.src = SRC + "#t=" + at0.toFixed(2); try { v.load(); } catch (e) {}
    const once = (ev, ms) => new Promise(r => { let done = false; const f = () => { if (!done) { done = true; v.removeEventListener(ev, f); r(true); } }; v.addEventListener(ev, f); if (ms) setTimeout(() => { if (!done) { done = true; v.removeEventListener(ev, f); r(false); } }, ms); });
    const meta = async () => { if (v.readyState >= 1) return; if (v.networkState !== 2) { try { v.load(); } catch (e) {} } await once("loadedmetadata", 15000); };
    // Seek and confirm. iOS Safari silently drops a currentTime set before metadata, or resets it on play(); retry, then reload with #t=.
    async function seekTo(t) { await meta(); for (let k = 0; k < 4; k++) { if (Math.abs(v.currentTime - t) < .25 && !v.seeking) return true;
        const p = once("seeked", 8000); try { v.currentTime = t; } catch (e) {} await p; if (Math.abs(v.currentTime - t) < .25) return true;
        if (k === 1) { v.src = SRC + "#t=" + t.toFixed(2); v.load(); await meta(); } }
      return Math.abs(v.currentTime - t) < .5; }
    let ac, dest, vNode, vGain, mGain, mSrc, buf = {}, music = "none", vol = .35;
    const audio = () => { if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)(); dest = ac.createMediaStreamDestination();
      vNode = ac.createMediaElementSource(v); vGain = ac.createGain(); vNode.connect(vGain); vGain.connect(ac.destination); vGain.connect(dest); mGain = ac.createGain(); mGain.connect(ac.destination); mGain.connect(dest); };
    async function loadMusic(id) { const m = MUSIC.find(x => x.id === id); if (!m || !m.file) return null; if (!buf[id]) { const r = await fetch(base() + m.file); buf[id] = await ac.decodeAudioData(await r.arrayBuffer()); } return buf[id]; }
    // Music: fade in, duck under speech (lifts a little in pauses > .7 s), swell slightly after the last word, fade out.
    const duck = t0 => duckOn(mGain.gain, clip, vol, t0);
    async function start() { audio(); await ac.resume(); if (mSrc) { try { mSrc.stop(); } catch (e) {} mSrc = null; }
      const b = await loadMusic(music); const F = clip.fade || .3; if (!(await seekTo(at0))) throw new Error("Couldn't jump to that moment in the talk video. Check your connection and try again."); const playT = () => Promise.race([v.play(), new Promise((_, j) => setTimeout(() => j(new Error("The talk video didn't start. Tap Play again.")), 15000))]);
      await playT();
      // iOS can restart from 0 or the fragment start when play() begins; one guarded re-seek fixes it.
      if (Math.abs(v.currentTime - at0) > 1.5) { v.pause(); await seekTo(at0); await playT(); }
      if (Math.abs(v.currentTime - at0) > 1.5) { v.pause(); throw new Error("Couldn't jump to that moment in the talk video. Check your connection and try again."); } const t0 = ac.currentTime; T0 = performance.now() - (v.currentTime - at0) * 1000; const VE = clip.vEnd ?? clip.dur, vg = vGain.gain; vg.cancelScheduledValues(t0); vg.setValueAtTime(0, t0); vg.linearRampToValueAtTime(1, t0 + .08); vg.setValueAtTime(1, t0 + Math.max(.1, VE - .3)); vg.linearRampToValueAtTime(0, t0 + VE);
      clearInterval(stopIv); stopIv = setInterval(() => { if (v.currentTime - at0 >= VE) { v.pause(); clearInterval(stopIv); } }, 15);
      if (b) { mSrc = ac.createBufferSource(); mSrc.buffer = b; mSrc.loop = true; mSrc.connect(mGain); mSrc.start(t0); duck(t0); } }
    let stopIv, T0 = null; function stop() { T0 = null; clearInterval(stopIv); v.pause(); if (mSrc) { try { mSrc.stop(); } catch (e) {} mSrc = null; } }
    // Caption time follows the media clock, so a stalled frame does not leave the words running ahead.
    return { v, start, stop, set music(x) { music = x; }, get music() { return music; }, set vol(x) { vol = x; }, stream: () => (audio(), dest.stream), t: () => v.currentTime - at0, at0, ended: () => v.currentTime - at0 >= (clip.vEnd ?? clip.dur) - .02, ready: () => v.readyState >= 2 ? Promise.resolve() : (meta(), once("loadeddata")), seekTo };
  }
  const recType = () => ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1,opus", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  // Real-time export: plays the clip once while recording the canvas + mixed audio.
  async function record(cv, pl, clip, onP = () => {}) {
    const type = recType(); if (!type) throw new Error("This browser can't record video.");
    const st = cv.captureStream(30); pl.stream().getAudioTracks().forEach(t => st.addTrack(t));
    const rec = new MediaRecorder(st, { mimeType: type, videoBitsPerSecond: 6e6, audioBitsPerSecond: 128e3 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r); await pl.start(); if (Math.abs(pl.t()) > 1.5) { pl.stop(); throw new Error("The talk video started at the wrong spot. Please tap Make video again."); } rec.start(250);
    await new Promise(r => { const iv = setInterval(() => { onP(Math.min(1, pl.t() / clip.dur)); if (pl.ended()) { clearInterval(iv); r(); } }, 100); });
    pl.stop(); rec.stop(); await done; return new Blob(chunks, { type: type.split(";")[0] });
  }
  // Frame-exact export straight from the source MP4 (see clipcut.js). Returns null when the browser can't (caller falls back to record()).
  async function exportExact(clip, { W, H, opts, music = "none", vol = .35, onP } = {}) {
    if (!window.ClipCut || !(await ClipCut.supported())) return null;
    const src = /^(https?:)?\/\//.test(clip.src) ? clip.src : new URL(clip.src.startsWith(base()) ? clip.src : base() + clip.src, location.href).href, VE = clip.vEnd ?? clip.dur;
    return ClipCut.make({ src, clip, W, H, onP, draw: (ctx, w, h, t, f) => draw(ctx, w, h, opts, t, f),
      mix: async (octx, sb) => { const s = octx.createBufferSource(), vg = octx.createGain(); s.buffer = sb; s.connect(vg); vg.connect(octx.destination);
        const g = vg.gain; g.setValueAtTime(0, 0); g.linearRampToValueAtTime(1, .08); g.setValueAtTime(1, Math.max(.1, VE - .3)); g.linearRampToValueAtTime(0, VE); s.start(0);
        const m = MUSIC.find(x => x.id === music); if (m && m.file) { const ab = await (await fetch(base() + m.file)).arrayBuffer(), mb = await octx.decodeAudioData(ab), ms = octx.createBufferSource(), mg = octx.createGain();
          ms.buffer = mb; ms.loop = true; ms.connect(mg); mg.connect(octx.destination); duckOn(mg.gain, clip, vol, 0); ms.start(0); } } }); }
  window.ClipKit = { exportExact, ASPECTS, MUSIC, FADES, THEMES, CAPS, applyFades, get, clipFor, clipForSpan, align, timings, timedQuote, draw, player, record, recType, phraseBlocks };
})();
