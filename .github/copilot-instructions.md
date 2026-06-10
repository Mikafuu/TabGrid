# Copilot / AI Agent Instructions — ChromeGridView

Purpose
- Quick, actionable guidance for AI agents editing the ChromeGridView extension.

Big picture
- Extension manifest: [manifest.json](manifest.json). MV3 service worker is `background.js` and UI is `grid.html` + `grid.js`.
- Responsibilities:
  - `background.js`: service worker; captures visible tabs, stores screenshots in `chrome.storage.local`, and opens the grid UI when the action icon is clicked.
  - `grid.js`: reads tabs via `chrome.tabs.query`, reads screenshots from `chrome.storage.local`, renders the grid, and handles user interactions (switch/close/create tab).
  - `grid.html`: single-file UI (styles + markup) that relies on CSS variable `--card-min-width` for size switching.

Key data flows & patterns (examples)
- Screenshot storage: background saves data under keys named `screenshot_${tabId}` (see `captureTab` in `background.js`).
- Grid consumes screenshots by calling `chrome.storage.local.get(null, ...)` and checking `allData['screenshot_'+tab.id]` (see `grid.js`).
- Icon retrieval: `getIconUrl(tab)` in `grid.js` uses chrome.runtime.getURL('/_favicon/') and sets `pageUrl`, `size`, `scaleFactor` query params — prefer this over external favicon fetching.
- UI interactions: clicking a card calls `chrome.tabs.update(tab.id,{active:true})` and `chrome.windows.update(tab.windowId,{focused:true})`; close uses `chrome.tabs.remove(tab.id)`.

Permissions & integration points
- `manifest.json` requests: `tabs`, `storage`, `scripting`, `favicon`, `unlimitedStorage`, plus `host_permissions: <all_urls>` and `web_accessible_resources` for `_favicon/*`.
- Note: `chrome.tabs.captureVisibleTab` will fail on restricted pages (e.g., chrome://) — code already catches and logs "Capture skipped for restricted or inactive page." Keep that behavior.

Developer workflows
- Load extension for development: open Chrome → `chrome://extensions` → enable Developer mode → "Load unpacked" → choose repo folder.
- Reload extension after edits: click "Reload" on the extension card in `chrome://extensions` or click the service worker "Update" for background changes.
- Inspect background service worker: open `chrome://extensions`, find the extension, click "service worker" → Inspect to open DevTools for `background.js`.
- Inspect UI: open the `grid.html` page launched by the extension (or open it directly via `chrome.runtime.getURL('grid.html')`) and use DevTools to view console, DOM, and network.
- Inspect storage: run `chrome.storage.local.get(null, console.log)` in the page/service worker console.

Project-specific conventions
- Storage keys: `screenshot_${tabId}` for images, `preferredSize` for saved UI size.
- CSS variable: `--card-min-width` controls tile size — changed by size buttons and persisted to storage.
- Add-card pattern: element uses class `add-card` to represent the new tab card.
- Avoid changing capture frequency or removing `setTimeout` in `onActivated` without verifying screenshots behavior across windows (used to let the tab settle before capture).

When editing
- If you change background capture logic, test against ordinary web pages and restricted pages; verify storage cleanup on `tabs.onRemoved` remains intact.
- For UI changes, prefer modifying `grid.html`/`grid.js` together; there is no build step — edits are loaded directly by Chrome when reloaded.
- When adding permissions, update `manifest.json` and test reload; adding host or web_accessible entries often requires reloading the extension.

Files to inspect first
- [background.js](background.js)
- [grid.js](grid.js)
- [grid.html](grid.html)
- [manifest.json](manifest.json)

No automated tests present — changes should be verified manually via the Chrome extension dev workflow above.

If something in this guide is unclear or missing, tell me which area to expand (architecture, storage keys, dev workflow, or debugging tips).
