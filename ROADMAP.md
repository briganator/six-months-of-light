# Six Months of Light: creation studio roadmap

Goal: the best study guide for each conference, plus a creation studio for posts, stories, texts, memes and reels that lead people to the talks.

## Done (branch `quote-clips`, not deployed)
- Speaker photos on talks and cards, with up to 5 official photos per speaker.
- Photo style options: size (small/medium/large/full background), position (by the name, top, any corner), shape (circle, rounded, square, no frame), background mode (soft blur, dimmed, duotone) and a strength slider. These are saved in the share link (`pf=`).
- Quote video clips: curated quotes plus any passage you select or paste. Word timings for every talk, words light up as they're spoken, 3 bundled CC0/public-domain music beds that duck under the speech, 9:16 / 4:5 / 1:1 / 16:9, video look (full, blur, dim, duotone), Share, Save MP4 and Text it.

## Next (highest value first)
1. **Video hosting:** put 480p (or 360p) talk copies on a CORS-enabled bucket (Cloudflare R2 or Supabase Storage) and set `window.CLIP_MEDIA_BASE`. Without this, only the curated clips work on the live site.
2. **Reel presets:** one-tap "Instagram Reel", "TikTok", "YouTube Short" and "Facebook Story" presets, each with safe zones drawn, a hook title card (0.8 s), the clip, then an end card with a QR code and link.
3. **Animated text styles for clips:** karaoke highlight (done), word pop, line-by-line fade, typewriter, and big-word emphasis on key words.
4. **Captions:** an SRT/VTT export with each clip, and a burned-in caption style picker (pill, outline, lower third).
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
