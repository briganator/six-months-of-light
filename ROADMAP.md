# Six Months of Light: creation studio roadmap

Goal: the best study guide for each conference, plus a creation studio for posts, stories, texts, memes and reels that lead people to the talks.

## Done (branch `quote-clips`, not deployed)
- Speaker photos on talks and cards, with up to 5 official photos per speaker.
- Photo style options: size (small/medium/large/full background), position (by the name, top, any corner), shape (circle, rounded, square, no frame), background mode (soft blur, dimmed, duotone) and a strength slider. These are saved in the share link (`pf=`).
- Quote video clips: curated quotes plus any passage you select or paste. Word timings for every talk, words light up as they're spoken, 3 bundled CC0/public-domain music beds that duck under the speech, 9:16 / 4:5 / 1:1 / 16:9, video look (full, blur, dim, duotone), Share, Save MP4 and Text it.

## Clip editor (this branch)
- **Best moments** (`moments.html`, `assets/moments.json`): one gallery entry per passage already marked in the moments files. Add a talk by appending its array; add a moment at the end of that array so earlier default looks stay put. Rebuild with `python3 tools/build_moments.py <moments-dir>`.
- **Clip editor** (`clip.html`): eight named looks cycle across a talk — Classic gold, Rose pill, Teal pop, Sage lower, Silver serif, Ember pop, Gold pill, Rose lower. Caption styles are word highlight (white words, current word in the theme color), pill (one line, contrasting fill, accent outline), big-word pop (2–4 words, current word in the accent and larger), and lower third (two-line bar on the video). A 1 second title card fades into the speech (the hook, or the talk title with quote marks removed when the hook is too long). The end card links to `https://sixmonthsoflight.com/talks/<id>.html` and shows a QR code. Music follows the look’s mood, with a No music switch. Options are stored in the share link (`st=`) and in `localStorage`.
- **Video hosting still required for the live site.** `window.CLIP_MEDIA_BASE` (see `assets/config.js`) must serve `{talk-id}.mp4` on the same timeline as `assets/timings/<id>.json`. The host must send `Access-Control-Allow-Origin` for this site on GET and HEAD, and answer range requests with 206 so export can read one moment. The Church CDN does not send CORS, so the canvas cannot export from it. Until CORS is on, the editor still shows captions and can download an `.srt`; Save MP4 explains that the video is unreachable and links the official talk. Local preview: put the file at `media/<id>.mp4` and open `clip.html?m=<id>:<moment>&media=media/`.

## Next (highest value first)
1. **Video hosting:** put 480p (or 360p) talk copies on the bucket behind `CLIP_MEDIA_BASE` and turn on CORS plus range requests. Files may already be on that host; the browser still cannot read them until `Access-Control-Allow-Origin` is present. Without that, the clip editor and the quote clip maker cannot draw or export the picture on the live site.
2. **Reel presets:** one-tap "Instagram Reel", "TikTok", "YouTube Short" and "Facebook Story" presets. Safe-zone guides, a title card and an end card with a QR code are in the clip editor; named network presets are not.
3. **Animated text styles for clips:** word highlight, pill, big-word pop and lower third are in the clip editor. Line-by-line fade remains available to older links (`cap=type`) and is not one of the eight starting looks.
4. **Captions:** the clip editor downloads an `.srt` with the official words, timed to the exported speech. Burned-in styles are the four above.
5. **Templates gallery:** 30+ starting points such as quote + photo split, testimony post, "Ponder this" question, scripture pairing, invitation challenge, family night slide and youth theme graphics.
6. **Meme layouts:** top/bottom text, "Expectation vs. reality (gospel edition)", "Me before / after conference", reaction-frame and two-panel layouts. All are respectful and use only verified quotes or the user's own words.
7. **Carousels:** 5 to 10 slide posts made from a talk (cover, 3 to 5 quotes, ponder, invitation, link). Partly exists; add video slides.
8. **Music:** more CC0/public-domain beds such as hymn instrumentals (*Abide with Me*, *Be Still, My Soul*, *Come, Come, Ye Saints*), each with an exact license note. Also a mood filter and beat-synced cuts.
9. **Audio-only clips:** an audiogram (waveform + quote) for podcasts and Stories, using the talk mp3. These are smaller than video.
10. **Text/SMS kits:** a short text with a link-preview card (OG image per quote), "send to my family group", and scheduled daily texts (with Keep the Light).
11. **Personal touches:** add your own photo or a family photo behind a quote, plus a "My takeaway" voice-over recorded in the browser.
12. **Brand kits for wards and stakes:** ward name, colors and a weekly theme. Batch-export a week of posts.
13. **Speed and polish:** WebCodecs export for clips (faster than real time, no dropped frames), progress UI, and remembering the last-used options.

## Guardrails
- Quotes come only from the official text or the user's own clearly labeled words. Every card and clip says "Personal study site · Not an official Church site" and links to the talk.
- Use media only with permission (Brigham has confirmed permission for speaker images and conference video). Keep music licenses documented in `tools/make_music.py` and on the credits page.
