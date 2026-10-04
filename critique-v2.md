# Six Months of Light: design critique (v2)

*Reviewer stance: a web and app design critic, testing mainly on a 390×844 phone. Written Oct 3, 2026, before the v2 changes.*

## Verdict
The look is strong: editorial type, warm light, a calm brand. The product is harder to use than it looks. The site has one job most visitors come for (find a line, make it beautiful, send it to someone), and that path is buried under ten pages of equal weight.

## Top issues (ranked), and the v2 fix for each
1. **Sharing is hard to find after a card is built (Brigham on his phone).** "Share card" sits under a tall preview with three other buttons of equal weight, and nothing says "your card is ready." There's no hint for Instagram Stories, where most of these cards will go.
   **Fix:** a big gold **Share** button that's always visible, pinned to the bottom of the screen. Under it, clear **Save image** and **Copy link** buttons. A short "Your card is ready, tap Share" step with an Instagram Stories tip (save, then add it in Stories). On desktop it falls back to download, copy link and the share sheet.
2. **On a phone you can't see the card while changing options.** The preview isn't sticky below 980px, so every change means scrolling up to look, then back down.
   **Fix:** a compact live preview pinned at the top of the studio, with the options in a scrollable panel underneath. Every change updates in view.
3. **No single clear path.** The navigation has seven links of equal weight that scroll sideways on phones. The home page leads with a notice and a long "Talk of the week" card before any action.
   **Fix:** one primary path, **Pick a quote → Style it → Share**. The studio is the hero action. A bottom tab bar on phones (Home · Talks · Studio · Insights · Me) sits within thumb reach, and the secondary pages move to "More."
4. **Unclear on the first visit.** A newcomer doesn't learn what they can do here within 5 seconds.
   **Fix:** the hero says it in one line ("Find a line from conference. Make it beautiful. Share it.") and shows a "Today's quote" card with a one-tap Share.
5. **Picking a quote takes too many taps.** You choose a talk from a long select and then a quote. There's no search, shuffle or browse-by-feeling.
   **Fix:** a searchable list of every verified quote, plus Shuffle and theme filter chips.
6. **The card looks are thin.** 4 backgrounds × 3 color themes, mostly variations on the same gradient. No temple imagery, no texture, no wide or wallpaper sizes, no alignment or overlay control.
   **Fix:** a gallery of looks (openly licensed temple photos, original temple silhouettes, stained glass, scripture paper, watercolor, night sky, olive/Gethsemane, hymn sheet, minimalist, nature), 5 sizes, palettes, alignment, overlay darkness and fonts.
7. **Insights can be read but not shared.** The page is a good dashboard, but nothing on it can leave the page.
   **Fix:** every insight becomes a card with a Share button, using the same studio, looks and share flow.
8. **Load and performance.** Inter and Cormorant are shipped as duplicate files per weight (the same variable font three times, about 96 KB wasted). Sky animation, parallax and count-ups start at once. All 18 talk OG images live in the repo but are never needed by pages, which is fine.
   **Fix:** one font file per family with a weight range. Card code and photos load only in the studio. Photos are WebP (~1600px) with 240px thumbnails, loaded only when picked. Decorative motion starts after first paint and is off under reduced motion.
9. **Accessibility.** Gold-on-cream small text falls below 4.5:1 in places (pills, `.speaker` on cream is borderline). Segmented buttons do use `aria-pressed`, which is good. Focus outlines are inconsistent. The canvas preview has no text alternative describing the card. The share sheet doesn't trap or restore focus.
   **Fix:** darker muted text, a visible `:focus-visible` ring everywhere, a live `aria-label` on the preview, the sheet focuses its first button and returns focus on close, and all 44px+ tap targets in the studio.
10. **Friction in the share flow.** Native share sent the file, but the text and link could be lost on some apps, and "More share options" was a second dialog of the same weight.
    **Fix:** one Share button (file + text + link), with secondary actions shown inline instead of hidden behind a dialog.

## Keep
The brand, the honest "recap / not official" labels, verified-only quotes, the labeled personal line, moderated comments and device-only storage.
