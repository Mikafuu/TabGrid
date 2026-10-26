<p align="center">
  <img src="images/Preview image.png" alt="Preview Image" width="500">
</p>

# TabGrid

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

A desktop Chrome extension that brings your tabs and tab groups into one visual grid. Search, organize, and personalize your workspace—all locally, with no account required.

## A closer look

![TabGrid overview with tab previews and color-coded groups](images/showcase/overview.png)

**Find your way through open tabs.** Browse page previews and groups in one grid, then search titles or URLs and narrow the results with filters.

![TabGrid search and filters for website, group, pinned tabs, playing audio, and muted tabs](images/showcase/search-filters.png)

**Make the workspace yours.** Choose Classic, Flat, or Glassmorphism, switch between light and dark, and personalize fonts, colors, and backgrounds.

![TabGrid glass appearance with Classic, Flat, and Glassmorphism style choices](images/showcase/appearance.png)

*AI-generated illustrative showcases based on the interface, with sample tabs and thumbnails. These are not exact screenshots. [Artwork details](docs/showcase-artwork.md).*

## Install

Requires **Chrome 120 or later**. The release package includes dependencies and fonts; no terminal commands or build step are needed.

1. Download [**TabGrid.zip** from the latest release](https://github.com/Morikana39/TabGrid/releases/latest/download/TabGrid.zip), or open the [Releases page](https://github.com/Morikana39/TabGrid/releases/latest) and choose **TabGrid.zip** under **Assets**. Choose this installation package, not GitHub’s **Source code** archives or **Code → Download ZIP**.
2. Extract `TabGrid.zip` and keep the extracted folder somewhere permanent.
3. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Open Chrome’s Extensions menu (the puzzle icon) and pin **TabGrid**.
6. Click the extension’s icon to open TabGrid.

For illustrated instructions, see [Chrome’s installation guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

**Updating:** download the latest `TabGrid.zip` from the release link above, extract it, and replace the files in your existing installation folder with its contents. Keep the same folder, click **Reload** for TabGrid at `chrome://extensions`, then reopen TabGrid.

The release package contains runtime files and license notices, excluding development fixtures, screenshots, source maps, and unused dependency files. To build it from source, see [Development](#development).

## Use TabGrid

- **Open tabs and groups:** click a tab to switch to it; click a group to browse its tabs. Group colors match Chrome, and the last-opened tab or group is highlighted.
- **Find a tab:** type in Search. Expand **Filters** to narrow results by website, group, pinned status, playing audio, or muted status. Use **Sort** and **Card size** to arrange the view.
- **Move cards:** drag to reorder. Drag a card over another tab or group until it highlights, then release to group. Keep dragging past the target’s far edge to reorder instead. Inside a group, drag to the bottom **Remove from group** area and release to ungroup, or hold the card outside the panel to continue dragging on the main grid. Reordering requires **Tab order** with text search and non-group filters cleared. Grouping by dragging is on by default; the optional group drop-target drawer is off by default.
- **Swipe to close:** enable it in **Settings → Tabs & Groups**, then drag a card left or right with the mouse. Short or mostly vertical drags are ignored. Click and hold to reorder or group. Confirmation and Undo still apply.
- **Switch categories:** swipe horizontally with two fingers below the category bar to move between Tabs, Idle tabs (when enabled), and Recently closed. Search also includes All results. Each swipe moves one category; vertical scrolling remains available.
- **Work across windows:** enable **⋮ → Show all windows**. Drag cards between window sections to move tabs or groups.
- **Manage several tabs:** choose **⋮ → Select tabs**, select cards, then open **Edit**. Right-click a card or use its three-dot button for individual actions.
- **Close and restore:** use **×** to close a tab or group. In regular windows, choose **Undo** to restore a recent close, or browse **Recently closed**. **Idle tabs** separates older tabs without automatically closing them.

In regular windows, grouping and ungrouping also support **Undo**, shown at the bottom center. Click a muted card’s speaker icon to unmute it. With search history enabled, use the **×** beside an entry to remove it, or highlight an entry with the arrow keys and press **Delete**.

Press **/** to focus Search, **Ctrl+Z** (Windows/Linux) or **⌘Z** (Mac) to undo outside text fields, and **Escape** to dismiss a menu or dialog.

Opening TabGrid from its toolbar icon or Chrome shortcut reuses an existing grid in the same regular/Incognito context, even in another window. Manually duplicated or restored grids stay open: closing them automatically would add new entries to Chrome’s recently closed history and cause a restore loop. Chrome provides no supported extension API to exclude these closures from that history. In **Settings → Tabs & Groups**, the optional **Close TabGrid after switching to a tab** setting closes the grid only after a tab-card selection. It is off by default, retains a session-only view snapshot for the next opening, and keeps the grid open while Undo is available. These optional closures can also appear in Chrome’s recently closed history.

## Make it yours

Open **⋮ → Extension settings**. Valid changes save automatically.

- **General:** choose English, Simplified Chinese, Japanese, or Follow browser; remember queries, scroll positions, and window scope; control search focus.
- **Appearance:** choose Light, Dark, or Follow system; pick a material style, color tint, and font; adjust motion and card details.
- **Search & Filters:** choose what to search, visible filters, and optional local search history (off by default).
- **Tabs & Groups:** customize new-tab behavior, closing confirmations, Undo duration, and idle exclusions.
- **Custom background:** in Appearance, choose a local JPG, PNG, or WebP image up to 1 GB, then drag the preview to reposition it, zoom to crop, and adjust transparency and blur. Large images are resized to a maximum 2,560-pixel edge and saved as a compact WebP; the original file is unchanged. Replace, reset, or remove it anytime.
- **Previews & Storage:** control screenshot capture, choose Low / Standard / High quality, exclude websites, clear previews, and set a storage limit. Quality changes apply to future captures; Standard is the default.
- **Keyboard:** customize page shortcuts or open Chrome’s shortcut editor to assign **Open TabGrid**.
- **Backup:** export settings to a local JSON file or preview and apply an import. Backups exclude browsing history, tab URLs, screenshots, and custom background images.

## Privacy and offline use

TabGrid’s interface, settings, fonts, and tab organization work locally without a server or cloud sync. Visiting websites still requires whatever connectivity those websites need.

Previews refresh when an ordinary tab opens, becomes active, or finishes loading, and after scrolling or interaction settles. A visible, focused webpage also refreshes about every 15 seconds; a 30-second background alarm provides a fallback while Chrome is running. Opening TabGrid through its toolbar icon or Chrome shortcut captures the current page before switching (up to 250 ms for ordinary websites, up to 1 second for restricted pages). This explicit action lets Chrome grant temporary `activeTab` access for pages such as the New Tab page, Chrome pages, and the Chrome Web Store. Chrome may still refuse some captures; a website icon remains the fallback. File pages also require Chrome’s file-access permission. No page script is injected into restricted pages.

Switching directly to an existing TabGrid tab uses the latest saved preview. After a successful explicit capture, TabGrid can retry automatic refresh for that same restricted tab and exact URL during the current browser session. Chrome must still permit each capture. Navigation, closure, clearing previews, or a rejected capture retires this remembered eligibility. Merely visiting several New Tab pages and then switching directly to the TabGrid tab does not grant screenshot access; invoke TabGrid through its toolbar icon or assigned Chrome shortcut while the page you want to capture is active. Captures are resized to fit 960 × 600 pixels without upscaling; this reduces future local preview storage, independently of the extension’s installation size. Website exclusions and the Incognito restrictions below still apply.

TabGrid uses Chrome permissions to manage tabs/groups, show recent closures, and capture previews. It stores previews and its own browsing-related data in local Chrome storage. Bookmark, Reading List, and site-muting permissions are requested only when used.

For private browsing, enable **Allow in Incognito** in the extension’s Chrome details. Regular and private tabs stay separate; Incognito does not save screenshots, search history, or TabGrid Undo records.

The interface follows Chrome’s language by default and supports English, Simplified Chinese (including browsers configured for other Chinese variants), and Japanese. Choose a language in **Settings → General → Language**; changing it reloads the view. Tab titles, group names, searches, and website addresses are never translated. Chrome’s extension-list description and command name follow Chrome’s own language setting.

## Credits

Thank you to the open-source projects behind TabGrid:

- [Material Design motion](https://m3.material.io/styles/motion) — reference for restrained card-return motion, implemented through the existing AutoAnimate effects.
- [Google Material Design Icons](https://github.com/google/material-design-icons) — bundled menu and settings icons ([Apache 2.0](assets/icons/material/LICENSE)).
- [SortableJS](https://github.com/SortableJS/Sortable) — drag-and-drop ordering ([MIT](node_modules/sortablejs/LICENSE)).
- [AutoAnimate by FormKit](https://github.com/formkit/auto-animate) — interface and card animations ([MIT](node_modules/@formkit/auto-animate/LICENSE)).
- [Liquid DOM](https://github.com/AndrewPrifer/liquid-dom) — WebGPU wallpaper refraction for controls, filter panels, menus, dialogs, and slider surfaces, plus live springs and easing for Glassmorphism interactions ([MIT](assets/licenses/liquid-dom.txt)). Uses a local image texture, so the experimental HTML-in-Canvas flag is not required; CSS is used when WebGPU or a custom background is unavailable.
- [Geist / Geist Mono](https://github.com/vercel/geist-font), [Outfit](https://github.com/Outfitio/Outfit-Fonts), [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), and [Newsreader](https://github.com/productiontype/Newsreader) — bundled fonts (SIL Open Font License).
- [Chromium / Chrome for Android](https://chromium.googlesource.com/chromium/src/) — reference for tab-overlap grouping, reorder boundaries, and group-panel animation. [Reference notes and desktop adaptations](docs/chrome-grid-interaction-research.md); [Chromium license](https://chromium.googlesource.com/chromium/src/+/main/LICENSE).
- [taste-skill by Leonxlnx](https://github.com/Leonxlnx/taste-skill) — frontend layout and styling ([MIT](assets/licenses/taste-skill.txt)).

The material styles draw visual inspiration from [Flat UI](https://github.com/designmodo/Flat-UI), [liquidGL](https://github.com/naughtyduk/liquidGL), [neumorphism](https://github.com/adamgiebl/neumorphism), and [clay.css](https://github.com/codeAdrian/clay.css). These styles are implemented in TabGrid’s own CSS; those projects’ runtimes are not bundled.

Keep the bundled dependency license files when packaging the extension, including the separate Liquid DOM layout notice. Third-party license notices are included with the libraries, [bundled fonts](assets/fonts/README.md), and [Material Design icons](assets/icons/material/README.md).

Restricted-page capture uses Chrome’s documented [captureVisibleTab](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab) and [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) APIs. [Tab Thumbnails](https://chromewebstore.google.com/detail/tab-thumbnails/adcmjkdmkpfdlhinedckkklaklijifpo) was inspected as a behavioral reference; no code or assets from it are included. Its inspected distribution did not contain a reuse license.

## Development

Run `npm test` and `npm run check`. For a local UI fixture, run `node tests/preview-server.mjs` and open `http://127.0.0.1:4173`. The fixture uses simulated tabs. See [verification notes](docs/verification.md) for tested behavior and remaining native-browser checks.

Run `npm run package` with Node.js 20 or later to create `dist/TabGrid/` and `dist/TabGrid.zip`. The packager follows local runtime imports and keeps third-party notices; no additional build dependencies are required. Translations live in `locales/`, with Chrome metadata in `_locales/`. Keep placeholder numbers aligned between languages and use translated text only for interface messages, never for user content.
