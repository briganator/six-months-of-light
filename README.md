# Six Months of Light (LOCAL PREVIEW)
*The words of October 2026 General Conference, to carry you to April.*

Live URL: **https://sixmonthsoflight.com/** (GitHub Pages from `briganator/six-months-of-light`, custom domain via `CNAME`). QR codes, canonical URLs, Open Graph tags and card text all point there.

A personal study and sharing site for the 196th Semiannual General Conference (internal folder name: `conference-share`). It is a static site (HTML, CSS and vanilla JS) with no build step, so visitors don't install anything. It's meant for free GitHub Pages hosting. **Nothing has been published.**

> **Not an official Church site.** Every page has a top banner and a footer that say so.
> **Full talks posted Oct 8, 2026, with the Church's permission.** Each October 2026 talk page shows the complete official talk (paragraphs, headings, scriptures, notes, and any illustration in the talk), plus the official audio and video from ChurchofJesusChrist.org. The site still credits the Church and links each official page. Summaries, the 60-second recap, quotes and Card Studio stay as they were. Quotes were checked against the official wording on Oct 5.

## Look and motion
- Palette: midnight, warm gold, dawn rose and cream. Type: Cormorant Garamond for display and Inter for text, both self-hosted under the OFL.
- Logo (`assets/logo-mark.svg`): six rays of dawn light, each longer and brighter than the last, for six months of light growing toward April. In the header the rays draw in one by one.
- Cinematic hero: a rising sun, slowly turning light rays, drifting glows, floating light motes, and generated SVG ridgelines with parallax on scroll. A six-month progress bar runs from Oct 2026 to April 2027, with a count-up of days left (the April date is an estimate, labeled as such).
- Scroll-driven reveals, a soft light sheen across every card, hover lift, a button shine, and fade page transitions (View Transitions where supported).
- `prefers-reduced-motion` turns all of this off. Nothing is loaded from third parties. Everything is CSS, SVG and canvas.
- Speaker pages use initials, not portraits. Card photos are openly licensed, not Church photos. Talk pages hotlink official audio, video and any illustration in the talk; those files stay on the Church's servers.

## Features
**Card Studio** (`builder.html`; `quote.html` redirects here)
- Pick a talk, then a quote. You can **only** choose from verified quotes in `assets/data.js`. The quote can't be typed or edited.
- Choose a background (light rays, dawn mountains, aurora, soft glow), a theme (dusk, midnight, dawn), a font (classic serif, italic serif, modern sans), a size (1:1, 4:5, 9:16), and still or animated.
- Optional personal line, up to 90 characters with links stripped. It's drawn in a separate box labeled "MY TAKEAWAY · ADDED BY THE SHARER, NOT A QUOTE".
- Every card carries the Six Months of Light logo, the site URL, a QR code to the talk, and "Official text, with permission · Not an official Church site".
- Export: PNG in the browser. Animated cards record as **MP4** where the browser's MediaRecorder supports it (recent Chrome/Edge/Safari) or **WebM** otherwise. Where video isn't supported, it falls back to PNG plus a share link. Web Share is used on phones.
- Offline MP4 rendering (frame-accurate, H.264): `python tools/render_assets.py`

**Remember**
- Home: hero, Talk of the Week (one ponder question and one invitation), sessions, feature tiles
- 60-second recap card on each talk (big idea, quote, invitation)
- Animated cards (10 s): light rises, the quote appears line by line with a soft glow, and the card ends on the logo (its rays grow in), the tagline, the URL and a QR code.
- Lesson helps (`lessons.html`) are the first block under the home hero, a start-here tile, a desktop nav item, and a primary button at the top of each talk (`lessons.html?t=<id>`). "Who said it?" (`quiz.html`) sits beside that as a secondary action, on Study, and on each talk (`quiz.html?t=<id>`). Official Church links stay at the bottom of a talk, after the full text.

**Understand**
- Conference Insights (`insights.html`): word cloud, top words, top themes, most-cited scriptures and speakers by calling. It's computed in the browser from the recap data and labeled "based on recaps." The comparison with past conferences is a labeled stub with no numbers.
- Speaker pages (`speaker.html?s=…`): calling (from the doc only), talks at this conference, recurring themes and links to the official bio and speaker index. No invented biographical facts.
- **“What insight do you want to search?”** panel (home, talk, speaker, session and insights pages): type a question or key word; searches talks, verified quotes, topics, speakers and scriptures across all 12 conferences, with a quick insight (count, speakers, trend) that can become a card (`assets/search.js`). Page-specific quick questions remain under it. Tap a question; the answer is assembled from this site's talk data and cites the talk on this site. Nothing is generated or invented.

**Apply** (stored only on the device, in localStorage)
- Commit to an invitation for 7 days, with day check-ins and a downloadable `.ics` reminder that repeats daily for 7 days
- My Conference (`my.html`): saved quotes, private notes per talk, commitments and a JSON export
- Lesson helps (`lessons.html`): a template-based outline **stub** for FHE, youth classes and sacrament talks, built only from the talk data; nothing is generated.

**Share**
- "What stuck with me" under each talk: optional name and one line (up to 280 characters), moderated
- Conference challenge (`challenge.html`): 7-day invitation plus shared stories, moderated
- Group links (`groups.html`): `?g=smith-family` tags posts so they show only on that group's view. These links are unlisted, **not private**.
- Each talk has a static page (`talks/<id>.html`) with Open Graph and Twitter tags and a 1200×630 preview image (`assets/og/<id>.jpg`), so links unfurl properly in Messages, Facebook and WhatsApp.
- Official video and audio: each talk page plays the Church's own mp4 and mp3 (nothing from third parties). `video_embed` stays empty. If a file fails to load, the page links the official talk instead.

## Structure
```
index.html, builder.html, quiz.html, insights.html, speaker.html, session.html,
my.html, lessons.html, challenge.html, groups.html   pages (thin shells)
talks/<id>.html          generated per-talk pages with OG tags (<base href="../">)
talk.html                redirects ?t=<id> to talks/<id>.html
moderate.html            admin moderation queue (noindex, password)
assets/data.js           GENERATED content (from tools/talks_source.py)
assets/fulltext/<id>.json  GENERATED official talk text (one file per talk; search index at index.json)
tools/official/*.json    official language-page responses used to build the full text
live.html                redirects to the home page (the live wall was removed after conference)
assets/config.js         backend config (Supabase URL + publishable key; ?mock=1 = local mock)
assets/api.js            backend adapter (Supabase REST, or localStorage mock)
assets/common.js         header/footer, device storage, insight search panel, themes, motion
assets/cardkit.js        canvas renderer: cards (backgrounds, fonts, takeaway line), animation, OG images
assets/logo-mark.svg     logo mark (favicon too)
assets/pages/*.js        page logic
assets/styles.css, assets/fonts.css, assets/fonts/   Cormorant Garamond + Inter (OFL, self-hosted)
assets/vendor/qrcode.js  QR generator (MIT, Kazuhiko Arase)
assets/og/*.jpg          generated link-preview images
supabase/001_schema.sql, 002_group_links.sql   database (already applied)
tools/talks_source.py    SOURCE OF TRUTH for talk content -> assets/data.js
tools/build_pages.py     -> talks/<id>.html
tools/build_shells.py    -> page shells (titles, canonical, OG)
tools/render_assets.py   -> OG images, sample stills, sample MP4s (headless Chrome + ffmpeg)
tools/screenshots.py     -> screenshots/*.png
tools/render.html        internal render surface (not linked from the site)
```

## Content rules
- Content is transcribed from the Google Doc "October 2026 General Conference — Study Guide," Saturday sessions. **Personal application sections, private notes and the personal-lens section are excluded.** Ponder questions that named family members or the stake were not used.
- All 54 quotes were checked to be verbatim substrings of the doc. The one editorial bracket is "[Fasting and prayer]" in Elder Soares's second quote.
- The official talk URLs weren't posted yet, so each talk links to its **official session page**. When the URLs post, set `official_url` in `tools/talks_source.py`.
- Updating: edit `tools/talks_source.py` (keep `full_text_permitted` true), then run
  `python3 tools/talks_source.py && python3 tools/build_shells.py && python3 tools/build_pages.py && python3 tools/build_sitemap.py`
  `talks_source.py` also rebuilds `assets/fulltext/` from `tools/official/`. The sustaining of Church officers is `CONF.business`, not a sermon.

## Preview locally
```
cd /workspace/projects/conference-share && python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/   (add ?mock=1 for a browser-only backend; mock admin password: "preview")
```

## Backend and moderation (Supabase free tier, $0)
- New project **`conference-share`** (ref `yrofrjdmhnudqbuvukqm`, us-west-1) in the "Momentum Development" org. Creation cost was checked as **$0/month** before creating it. The existing Momentum Development project was not touched.
- Tables live in a non-exposed `private` schema with RLS on and no policies, so the public key can't read or write them directly. The public API exposes only:
  - `approved_comments` view: approved posts only (no status or IP data)
  - `submit_comment()`: honeypot field (plus a client check that rejects submissions under 2 s), 3–280 characters, name up to 40, no links, rate limit of **3 per 10 min and 15 per day per hashed IP** (raw IPs are never stored), and a cap of 300 pending posts
  - `admin_list_comments()` / `admin_set_status()`: check a bcrypt-hashed admin password server-side and lock out after 10 failed tries in 15 min per IP
- **How moderation works:** every post starts as `pending` and stays invisible. Open `moderate.html`, enter the admin password, and **Approve** (it goes live), **Hide**, or move it back to pending. The password is kept only in that browser tab's sessionStorage.
- Change the admin password in the Supabase SQL editor (never commit it):
  ```sql
  insert into private.settings (key, value)
  values ('admin_password_hash', extensions.crypt('NEW-PASSWORD', extensions.gen_salt('bf')))
  on conflict (key) do update set value = excluded.value;
  ```
- Optionally rename `moderate.html` to a secret slug (for example `moderate-7f3k.html`) for a secret URL as well as the password.
- The publishable key in `assets/config.js` is safe to publish. **Never** put a service_role key in the site.
- Free-tier note: Supabase pauses free projects after about a week with no activity. Restore them from the dashboard.
- Supabase advisors flag the definer view and the anon-callable definer functions. That's intentional: this is the safe gateway design described above.

## Insight search: rules (keyword search is built; no generated answers)
Answer **only** from official talk text on ChurchofJesusChrist.org. Cite the talk and paragraph for every claim. Say "I don't know" when the text doesn't answer the question. Never speak for the Church or give doctrinal rulings. Show the "not an official Church site" notice. No paid API is wired in. If it's added later, use a free or self-hosted option behind a rate limit.

## Publishing (done Oct 2026)
- Repo: `briganator/six-months-of-light` (public). Pages deploys from `main` / root. `CNAME` = `sixmonthsoflight.com`; `.nojekyll` is present.
- To update: edit, rebuild (`python3 tools/talks_source.py && python3 tools/build_shells.py && python3 tools/build_pages.py`, then `tools/render_assets.py` for cards/OG), commit, push.
- The admin password lives only in `.admin-password.txt` on the build machine (gitignored); its bcrypt hash is in `private.settings`.
- DNS at Porkbun: apex A records 185.199.108.153 / 109.153 / 110.153 / 111.153 (optional AAAA 2606:50c0:8000::153 / 8001::153 / 8002::153 / 8003::153) and `www` CNAME `briganator.github.io`.

## Launch plan
- **This week:** Card Studio (still and animated), 60-second recaps, talk pages, quiz, insights (labeled "based on recaps"), What stuck with me plus moderation, challenge, group links.
- **Done Oct 5, 2026 — when official text posts (Mon/Tue):** replace recap quotes with official wording, set `official_url` and `video_embed`, remove the recap banners, recompute insights, add Sunday talks, rerender cards and OG images.
- **After official text posts:** consider letting insight search take free-text questions under the rules above (free-tier or self-hosted only), add the past-conference comparisons, and fill in speakers' recent talks from official listings.

## Test data
The preview test comments and admin-attempt rows were deleted before launch.

## Screenshots
`screenshots/` holds the current version. Older versions are in `screenshots/archive-v1-study-and-share/`.
- `00-home-hero-*`, `01-home-*`, `02-talk-*`, `03-card-builder-*`, `04-insights-*`, `05-quiz-*`, `06-my-conference-*`, `07-speaker-*`, `08-lesson-helps-*`, `09-challenge-*`, `10-admin-queue-*`. Each comes in `-mobile-390` and `-desktop-1280`.
- `screenshots/cards/`: sample stills at 1:1, 4:5 and 9:16 across backgrounds and themes, including one with a takeaway line, plus two animated MP4s.

## Domain, cards and sharing (update)

- **Domain is one setting.** In `tools/talks_source.py`: `DOMAIN = "sixmonthsoflight.com"` and `DOMAIN_LIVE = True` (live). If it were `False`, cards show the wordmark plus "Find it at Six Months of Light", and no URL text appears on any card. After the domain is bought: set `DOMAIN_LIVE = True`, run `python3 tools/talks_source.py && python3 tools/build_shells.py && python3 tools/build_pages.py`, then `/workspace/.venv-pw/bin/python tools/render_assets.py`. Cards will then print `sixmonthsoflight.com`, and canonical, OG and QR links will move to the domain.
- **QR code** is small and secondary on every card (bottom corner on 1:1 and 4:5, below the link zone on 9:16).
- **9:16 story cards** have a subtle dashed "Tap the link ↗" zone where the Instagram link sticker goes. The animated MP4/WebM ends on that zone.
- **Share flow** (Card Studio and talk pages): "Share card" uses the Web Share API to send the PNG file plus text with a tappable deep link to the talk (`talks/<id>.html`). If file sharing isn't supported, it shares the text and link. "More options" opens a sheet with Copy link, Download card, Facebook, X and Text message (sms:).


## v2 (Oct 4, 2026): simpler, more shareable
See `critique-v2.md` for the design critique that drove these changes.
- **One clear path:** Pick a quote, style it, share it. On phones a bottom tab bar (Home · Talks · Studio · Insights · Me) keeps everything within thumb reach. The home page opens with “Today's light” and a one-tap **Share this quote**.
- **Card Studio (`builder.html`):**
  - On phones the live preview is pinned at the top, the options scroll underneath in four tabs (Quote · Look · Size · Text & motion), and the **Share** bar is pinned to the bottom.
  - **Share** sends the image file plus text and link through the phone's share sheet (`navigator.share` with files). **Save image** downloads a PNG (or records a video when Animated is on). **Copy link** copies the deep link.
  - A “Your card is ready. Tap Share.” status shows after each change, with an Instagram Stories tip (save, then add it in Stories with the Link sticker).
  - On desktop, Share opens a sheet with copy link, download, Facebook, X, text message and email.
  - **26 looks:** sunrise rays, dawn mountains, morning light, aurora, night sky; temple at dusk/dawn/night (original silhouettes drawn in code); stained glass, scripture paper, hymn sheet, watercolor; olive branch, pines at first light; minimal and minimal dark; and openly licensed temple photos from Wikimedia Commons.
  - **Other options:** 5 palettes, 4 fonts, centered or left alignment, overlay darkness, an optional takeaway labeled as the sharer's own words, and still or animated output.
  - **Sizes:** Story 9:16, Post 4:5, Square 1:1, Wide 16:9, Phone wallpaper.
- **Shareable insights** (`assets/insights-data.js`, computed only from recap data): The conference in 10 words, Most-used words, Christ at the center, Top themes, Themes by session, Scriptures cited, Who spoke, Today's light (daily quote + countdown), Speaker spotlights (one per talk), and a “Which theme speaks to you?” quiz with a shareable result card.
- **Photos:** `assets/photos/*.webp` (about 1600px plus 240px thumbnails), listed with author and license on `credits.html`. Cards made with a photo carry a small credit line. Regenerate `assets/photos.js` with `python3 tools/build_photos.py`.
- **Performance:** one variable font file per family, card code and photos load only in the studio, and look thumbnails render when the Look tab opens.
- **QA:** `tools/render_assets.py` renders sample cards, 2 MP4s and a contact-sheet matrix of every look × size into `screenshots/v2/`.
