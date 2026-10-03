# TabGrid

A desktop Chrome extension that brings your tabs and tab groups into one visual grid. Search, organize, and personalize your workspace—all locally, with no account required.

## Install

Requires **Chrome 120 or later**. Dependencies and fonts are included; no terminal commands or build step are needed.

1. On this repository’s GitHub page, choose **Code → Download ZIP**.
2. Extract the ZIP and keep the extracted folder somewhere permanent.
3. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Open Chrome’s Extensions menu (the puzzle icon) and pin **Tab Grid View**.
6. Click the extension’s icon to open TabGrid.

For illustrated instructions, see [Chrome’s installation guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

**Updating:** replace the files in your installed folder with the latest download, click **Reload** for Tab Grid View at `chrome://extensions`, then reopen TabGrid.

## Use TabGrid

- **Open tabs and groups:** click a tab to switch to it; click a group to browse its tabs. Group colors match Chrome, and the last-opened tab or group is highlighted.
- **Find a tab:** type in Search. Expand **Filters** to narrow results by website, group, pinned status, playing audio, or muted status. Use **Sort** and **Card size** to arrange the view.
- **Move cards:** drag to reorder, or drag toward the edge drawer to group or ungroup tabs. Reordering requires **Tab order** with text search and non-group filters cleared.
- **Work across windows:** enable **⋮ → Show all windows**. Drag cards between window sections to move tabs or groups.
- **Manage several tabs:** choose **⋮ → Select tabs**, select cards, then open **Edit**. Right-click a card or use its three-dot button for individual actions.
- **Close and restore:** use **×** to close a tab or group. In regular windows, choose **Undo** to restore a recent close, or browse **Recently closed**. **Idle tabs** separates older tabs without automatically closing them.

Press **/** to focus Search, **Ctrl+Z** (Windows/Linux) or **⌘Z** (Mac) to undo outside text fields, and **Escape** to dismiss a menu or dialog.

## Make it yours

Open **⋮ → Extension settings**. Valid changes save automatically.

- **General:** remember queries, scroll positions, and window scope; control search focus.
- **Appearance:** choose Light, Dark, or Follow system; pick a material style, color tint, and font; adjust motion and card details.
- **Search & Filters:** choose what to search, visible filters, and optional local search history (off by default).
- **Tabs & Groups:** customize new-tab behavior, closing confirmations, Undo duration, and idle exclusions.
- **Previews & Storage:** control screenshot capture, exclude websites, clear previews, and set a storage limit.
- **Keyboard:** customize page shortcuts or open Chrome’s shortcut editor to assign **Open TabGrid**.
- **Backup:** export settings to a local JSON file or preview and apply an import. Backups exclude browsing history, tab URLs, and screenshots.

## Privacy and offline use

TabGrid’s interface, settings, fonts, and tab organization work locally without a server or cloud sync. Visiting websites still requires whatever connectivity those websites need.

TabGrid uses Chrome permissions to manage tabs/groups, show recent closures, and capture previews. It stores previews and its own browsing-related data in local Chrome storage. Bookmark, Reading List, and site-muting permissions are requested only when used.

For private browsing, enable **Allow in Incognito** in the extension’s Chrome details. Regular and private tabs stay separate; Incognito does not save screenshots, search history, or TabGrid Undo records.

## Credits

Thank you to the open-source projects behind TabGrid:

- [SortableJS](https://github.com/SortableJS/Sortable) — drag-and-drop ordering (MIT).
- [AutoAnimate by FormKit](https://github.com/formkit/auto-animate) — interface and card animations (MIT).
- [Geist / Geist Mono](https://github.com/vercel/geist-font), [Outfit](https://github.com/Outfitio/Outfit-Fonts), [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), and [Newsreader](https://github.com/productiontype/Newsreader) — bundled fonts (SIL Open Font License).
- [taste-skill by Leonxlnx](https://github.com/Leonxlnx/taste-skill) - frontend layout and styling (MIT). 

The material styles draw visual inspiration from [Flat UI](https://github.com/designmodo/Flat-UI), [liquidGL](https://github.com/naughtyduk/liquidGL), [neumorphism](https://github.com/adamgiebl/neumorphism), and [clay.css](https://github.com/codeAdrian/clay.css). These styles are implemented in TabGrid’s own CSS; those projects’ runtimes are not bundled.

Third-party license notices are included with the libraries and in [assets/fonts](assets/fonts/README.md).

## Development

Run `npm test` and `npm run check`. For a local UI fixture, run `node tests/preview-server.mjs` and open `http://127.0.0.1:4173`. The fixture uses simulated tabs. See [verification notes](docs/verification.md) for tested behavior and remaining native-browser checks.
