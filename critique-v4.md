# Critique v4: study library, zoom insights, extras (Oct 4, 2026)

Reviewed on a 390×844 phone (Chromium, touch) and desktop at 1024 and 1280 px.

## Fixed in this pass
| # | Finding | Fix |
|---|---------|-----|
| 1 | Facebook link posts relied on a Supabase function page. Supabase serves function HTML **and** Storage HTML as `text/plain` with `nosniff` and a sandbox CSP (verified with curl), so crawlers may ignore the og tags. | Link posts and Copy link now use the static share pages (`/q/<talk>-<n>.html`, `/i/<id>.html`) on GitHub Pages: real `text/html`, https og:image that returns 200 image/jpeg. Old card links 301 there. Card uploads retired (less to moderate). Phones still share the exact card image. |
| 2 | Study filter row clipped on phones (horizontal scroll hid the Speaker filter). | Two-column grid on phones, Speaker full width; native selects open the phone's own picker. |
| 3 | Conference option text truncated ("October 2026 (r…"). | Recap note moved out of the option label. |
| 4 | Zoom scope switch wrapped "Talk" onto a second line on phones. | 4-column compact switch. |
| 5 | Zoom cards: kicker overflowed the card width; footer said "Based on recaps" on official data. | Short kicker (scope in the eyebrow); per-card source line ("Counted from official talk pages", "From official session music listings", or "Based on recaps"). |
| 6 | Talk study panel linked "Faith"/"Love" to a topic page that has no data for them. | Pills link only for the 13 library topics. |
| 7 | "Find related talks" searched by speaker surname (noisy). | Now "More talks on <topic>". |
| 8 | Printed talk summary: sections invisible (scroll-reveal opacity) and the recap box washed out. | Print CSS forces visibility, plain recap box, hides nav/forms/buttons; two pages. |
| 9 | Study view switch used tab roles without tab panels. | Plain toggle group with aria-pressed. |
| 10 | Home page didn't surface the new study tools. | "Keep studying" strip: reading plan, study library, zoom insights, family night. |
| 11 | Reading plan started on a past Monday when opened on Sunday. | Plans start the next Monday when begun on a Sunday. |
| 12 | No sitemap. | `sitemap.xml` + `robots.txt` (https only), from `tools/build_sitemap.py`. |
| 13 | `loadLib` used a relative path that would break if a page lived outside the root. | Base path taken from the page's own `common.js` script tag. |

## Known limits (labeled on the site)
- October 2026 has 18 talks so far (Saturday); Sunday joins when added. Its numbers come from recaps and are labeled "recap" / "Pending" until the official text is posted.
- Topics are keyword counts per 1,000 words (a rough guide). Places and invitation/promise counts are phrase matches.
- Music: official session listings for 11 conferences (Apr 2021 to Apr 2026); October 2026 marked Pending.
- Compare offers official conferences only.
- Facebook's Sharing Debugger needs a login; verified instead with curl as `facebookexternalhit/1.1` (HTML 200 + og:image 200 image/jpeg).

## Next ideas (not done)
- Per-talk official word counts for October 2026 once posted (rebuild with `tools/build_library.py`).
- Offline caching of the library file for study on the go.

## Results after fixes (Oct 4, 2026)
- Test suite: qa.py 18 pages x 2 viewports, 0 problems; share flows (WebKit iPhone 13, Chromium Pixel 5) no errors; QR 91 checks 0 fails; Facebook desktop sharer opens with the q-page URL; studio and extras tests pass.
- Lighthouse, live, mobile (Perf / A11y / BP / SEO): home 89/100/100/92 (canonical flag only because /index.html was tested; it correctly points to /), study 89/100/100/100, insights 92/100/100/100, talk 80/100/100/100, builder 82/100/100/100, plan 95/100/100/100.
- Late fixes: compare table row/column headers, icon contrast, plan pace labels shortened for phones, thousands separator on scripture refs.

## Round 5 (Oct 4, 2026, morning): lesson helps, insight search, explorer

### Lesson helps (Elders Quorum & Relief Society, Youth)
- Modes: Family night · Elders Quorum & Relief Society · Youth (Young Women classes and Aaronic Priesthood quorums) · Sacrament talk. These work for any talk: the 18 October 2026 recap talks plus 374 official talks since April 2021.
- EQ & RS outline: talk overview, open, key quotes (verified recap quotes, or the official summary line for library talks), scriptures cited with links (all 79 book slugs checked against the live scripture pages), 3–5 discussion questions, "counsel together", suggested invitation, a one-page member handout, and present mode.
- Questions are fill-in templates (ponder question, first quote, topic, a cited verse, ministering), so no doctrine is invented. Library talks get "Read the full talk and choose one invitation…" rather than a made-up invitation.
- Fixed in critique: lowercase "jesus christ" in a question became "the Savior's help". Lessons now uses the small header, so the hero no longer buries the tool. "Browse the talks" on non-home pages now points to index.html#sessions.
- Priesthood review: the "Priesthood" card style theme sat next to "Relief Society" as if it named an organization, so it was renamed "Elders Quorum" (old ?theme=priesthood links still work). Left as accurate doctrinal or historical wording: the "Priesthood keys" background, official talk titles and summary lines, a recap summary ("priesthood responsibility to serve missions"), "Aaronic Priesthood quorums" (the correct youth name), "Young Men General President" (an official calling), and April 2021's official "Priesthood Session" name.

### Insight search ("What insight do you want to search?")
- Replaces every "Ask the Talks" label (panel, insights subnav, promo slide, README). It is the prominent field on the home page and on talk, speaker, session and insights pages, with example chips.
- Keyword or question → stop-words removed, topic synonyms (e.g. "Spirit" → Holy Ghost) → talks (title, official summary line, top words, topics, speaker, footnote citations), verified quotes, topics, speakers and scriptures. A quick insight shows the count, the top speakers and a per-conference trend, with October 2026 marked pending. One tap makes a card.
- Limit: no full text, so a word counts only if it appears in the title, summary line, top 10 words or topic lists. The UI says so.

### Explorer (Zoom + Compare + Music folded into one sentence)
- "Show me [measure] for [subject] in [when], compared with [nothing / over time / another period / another subject]". Each pill opens a bottom sheet on phones (a centred dialog on desktop). Subject search is type-ahead across speakers, calling groups, session types, conferences, topics, books of scripture and music.
- Only measures that fit the subject are offered: speakers, groups and sessions get themes, words, scriptures, names of the Savior, invitations and who spoke; topics get how much, who taught it, verses and words; scriptures get citations, verses and who cites it; music gets songs, hymnbooks, choirs and repeats.
- Comparisons are normalised (per talk, per 1,000 words, % of talks, per conference), so groups of different sizes compare fairly. In comparisons and trends, October 2026 is shown as pending, never mixed in.
- Presets: This conference · A speaker over time · Compare two conferences · Saturday vs Sunday · Twelve vs Seventy · Book of Mormon over time · Music vs 5-year average · One talk. State lives in the URL (m, s, in, vs); old ?z= links and #compare/#music still land correctly.
- Critique fixes: "compared with each conference (over time)" became "shown over time". Same-subject comparisons no longer repeat the speaker's name on both sides. Session names are capitalized. One-talk views drop the meaningless "for everyone". "Repeats" is hidden where it can't mean anything (one conference, comparisons). Empty comparisons explain themselves. The help text no longer refers to "underlined" parts.
- Tested 144 measure × subject × when × compare combinations on a phone: no NaN or undefined, no script errors, and every empty state explains itself.
