// Default looks, share-link round trip, and SRT cues for the clip editor.
// Run: node tests/clipstyle.test.js
const fs = require("fs"), vm = require("vm");
const ctx = { console, URLSearchParams };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + "/../assets/clipstyle.js", "utf8"), ctx);
const Y = ctx.globalThis.ClipStyle;
const moments = JSON.parse(fs.readFileSync(__dirname + "/../assets/moments.json", "utf8"));
let fail = 0;
const eq = (a, b, msg) => { if (a !== b) { console.log("FAIL", msg, JSON.stringify(a), JSON.stringify(b)); fail++; } };
const ok = (v, msg) => { if (!v) { console.log("FAIL", msg); fail++; } };

eq(Y.NAMED.length, 8, "eight named looks");
eq(Y.NAMED.map(x => x[1].look).join(","), "classic-gold,rose-pill,teal-pop,sage-lower,silver-serif,ember-pop,gold-pill,rose-lower", "look ids");
const caps = new Set(Y.NAMED.map(x => x[1].cap));
ok(caps.has("highlight") && caps.has("pill") && caps.has("pop") && caps.has("lower"), "four caption styles in the strip");
eq(Y.TITLE_DUR, 1, "title card is 1 second");
eq(Y.titleDur(), 1, "titleDur");

const oaks = moments.talks["sun-am-9-oaks"];
ok(oaks && oaks.length >= 8, "oaks moments");
const looks = oaks.map(m => Y.mix(m.id, Y.baseSalt(oaks, m.id)));
for (let i = 0; i < 8; i++) eq(looks[i].look, Y.NAMED[i][1].look, "cycle " + i);
ok(looks[0].music !== looks[8].music || looks[0].look !== looks[8].look, "ninth moment does not repeat the first bed and look together");
eq(looks[8].look, "classic-gold", "ninth wraps");
eq(looks[8].music, "dreamy-flashback", "ninth uses the next mood bed");
for (let i = 1; i < looks.length; i++) ok(looks[i].cap !== looks[i - 1].cap || looks[i].theme !== looks[i - 1].theme, "neighbors differ");

eq(Y.cardLine("His grace is for all.", "The Gospel of Jesus Christ Is for All"), "His grace is for all.", "short hook stays");
eq(Y.cardLine("“A very long hook that will not fit on a one second title card at all really.”", "The Gospel of Jesus Christ Is for All"), "The Gospel of Jesus Christ Is for All", "long hook uses the talk title");
eq(Y.cardLine("too many words here for the card to hold in one breath today friends", "“The Gospel”"), "The Gospel", "quotes stripped from the title");
ok(Y.ownWords("added by me", "His grace is for all."), "own words");
ok(!Y.ownWords("His grace is for all.", "His grace is for all. The rest of the sentence."), "official hook");

const round = Y.clampStyle(Y.decode(Y.encode({ cap: "pill", theme: "rose", font: "sans", vbg: "dim", music: "none", vol: .2, aspect: "square", titleOn: false, endOn: true, hook: "His grace is for all.", speaker: "President Dallin H. Oaks", salt: 3, p0: 2, p1: 9, tx: .1, ty: -.2, zoom: 1.2 })));
eq(round.cap, "pill", "round cap");
eq(round.theme, "rose", "round theme");
eq(round.music, "none", "round music none");
eq(round.titleOn, false, "round title off");
eq(round.aspect, "square", "round aspect");
eq(round.p0, 2, "round trim");
eq(round.hook, "His grace is for all.", "round hook");

const srt = Y.srt([{ t: "His", s: 0.2, e: 0.5 }, { t: "grace", s: 0.5, e: 0.9 }], 0.65);
ok(srt.startsWith("1\n00:00:00,850 --> "), "srt starts after the title hold: " + srt.split("\n")[1]);
ok(srt.includes("His grace"), "srt words");

if (fail) { console.log(fail + " failed"); process.exit(1); }
console.log("clipstyle ok · " + oaks.length + " oaks moments cycle the eight looks");
