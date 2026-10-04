# Critique v3 (round 3, Oct 4, 2026)

Goal: the most incredible site for **finding, studying and sharing** the messages of general conference, with no clutter and the main path always obvious.

## What works
- Sharing is the strongest part. The Card Studio offers 11 layouts, 47 looks (23 licensed photos), 9 animation styles, 10 one-tap platform buttons with correct sizes, static OG images for every quote, carousels and promo cards. QR codes decode on every look (0 failures in 47 looks × 6 configurations).
- Trust signals are clear and consistent: "Not an official Church site", "Quoted from recap", verified quotes only, and credits for every photo.
- Phone ergonomics: bottom tab bar, the big Studio button, and a 9:16 default on phones.

## What's weak (found in this round)
1. **The site only knows one conference.** People study conference as a body of teaching over years ("What has been said about the temple?", "What has Elder Kearon taught before?"). The "Talks" tab only jumps to a section of the home page. There is no library, no search and no filter.
2. **The bottom-nav "Talks" goes to `index.html#sessions`.** It isn't a real destination and never shows as active.
3. **Insights are fixed to one scope.** You can't zoom from "all conferences" down to "this talk", and the comparison block is still a stub.
4. **Talk pages end at the quotes.** There's no structure, no scriptures from the official footnotes, no "taught before" and no related talks across years, so study stops where it should deepen.
5. **No daily habit.** Six months is long. Without a reading plan with saved progress, most people stop after week one.
6. **Printing and teaching.** Lesson helps exist but are hidden in the nav. There's no one-page printable summary for a class or family night.
7. **Home is long on a phone** (about 7,700 px). The "Make a card" path is clear; the "study" path isn't.
8. **Payload.** Pages that load all data at once would get heavy as the library grows. Library data must load only where needed.
9. **HTTPS regression (found while verifying live).** sixmonthsoflight.com currently serves GitHub's `*.github.io` certificate (name mismatch), and the Pages API shows `https_enforced:false`. HTTP works. The certificate looks like it's being re-provisioned. Pages settings were not touched in this round; the parent's enforce loop is still retrying.

## Redesign decisions for this round
- **One "Study" page** (`study.html`) replaces the fake "Talks" tab. It has a single filter bar: Conference (defaults to October 2026), Topic, Speaker and search. Selections become combinable chips. On a phone, one "Filters" button opens one sheet.
  - Results are talk rows: title, speaker, session, minutes and topic chips.
  - October 2026 rows open this site's talk pages; earlier talks open the official page and their speaker and topic pages here.
- **Speaker and topic pages across conferences** (`speaker.html?s=`, `topic.html?t=`), built from official metadata and derived counts only.
- **Insight zoom:** one scope switch (All conferences / a conference / a session / a talk) drives the same widgets: top words, themes, scriptures, names of the Savior, invitations and promises, and music.
- **Talk micro panel:** themes, scriptures, invitations, reading time, structure, and "related talks across the years".
- **Study plan to April:** one talk every few days, with progress saved on the device. It lives on Me and Home, not as a new tab.
- **Printable one-page summary** on each talk (print stylesheet), plus a link to the existing lesson helps.
- **Come, Follow Me tie-in:** only where a talk's own cited scriptures fall in the current-year course book.
- **Kept out on purpose:** accounts, comments everywhere, and any feature that pushes the find → study → share path down the page.

## Coverage chosen
Official talk metadata for **April 2021 – April 2026** (11 conferences, 374 talks), plus October 2026 from this site's recaps until the official text is posted. The plan is to expand backward once the library UI proves itself.
