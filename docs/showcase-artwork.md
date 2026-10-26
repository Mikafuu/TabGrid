# README showcase artwork

These three illustrations were created on 2026-10-26 using the built-in image generation tool. They are promotional interpretations of TabGrid, not pixel-exact screenshots or evidence of native Chrome behavior. Titles, URLs, and webpage thumbnails are synthetic examples.

The overview reference was captured from the current local UI fixture (`tests/preview-server.mjs`, `/?design&previews`) in a disposable headless Chrome profile. The expanded-filter and appearance references came from earlier local fixture captures; the controls and available styles were checked against the current source. No personal browsing data was used.

The README gallery shares these English-language images across the English, Chinese, and Japanese editions, with translated surrounding captions and descriptive alt text. Artwork lives in `images/showcase/`; it is documentation only and does not change the extension runtime.

## Generation prompts

### `overview.png`

```text
Use case: ads-marketing
Asset type: wide 16:10 README product showcase for the desktop Chrome extension TabGrid.
Primary request: Create a beautiful, polished editorial product showcase grounded in the attached real TabGrid screenshot. Use the screenshot as the UI reference, not as a literal full-bleed screenshot. Keep the actual design language: 'Your tabs' header, search row, Sort and Card size, Filters, Tabs and Recently closed, rounded tab cards, blue Research group and green Design references group with tiled previews.
Composition: refined pale warm-gray studio background, large crisp text upper left, one large nearly front-facing desktop app panel below occupying most of the canvas, subtle grounded shadow and thin border. No laptop hardware. Plenty of breathing room, clean sophisticated typography. Give cards illustrative generic webpage thumbnails (editorial article, abstract landscape, code documentation) with no third-party branding or personal data. Use a compact plausible sample arrangement with no pinned section so cards fill two rows; preserve authentic hierarchy and controls.
Text verbatim outside the app: 'TabGrid' small; 'Your tabs. One clear view.' large headline; 'Browse tabs and groups at a glance.' small subtitle. Within the app retain 'Your tabs', 'Search titles or URLs', 'Tab order', 'Filters', 'Tabs', 'Recently closed'; use generic sample card titles. Tiny footer 'Illustrative showcase · Sample tabs'.
Color palette: off-white, ink charcoal, restrained cornflower blue and sage group accents; match the real UI. No neon, no exaggerated 3D, no extra feature badges, no fabricated cloud/AI/sidebar features. Make the app itself legible.
```

