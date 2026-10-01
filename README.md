# TabGrid

A local Chrome extension with a mobile-style overview of your tabs and native tab groups.

## Install and update

Load this folder as an unpacked extension in Chrome 120 or later. Dependencies
are included; there is no build step. After a code change, reload the extension
in `chrome://extensions` and open it using its toolbar icon. The toolbar uses `tileIcon.png` (extracted losslessly from `tileIcon.ico`) and reuses the
grid in the current window. Switching to a website leaves TabGrid open.

## Your tabs

- Click a tab once to switch to it, or a group once to open its panel. In selection
  mode, one click selects or deselects the card. Enter and Space also work.
- The last activated website in each window has a distinct frame color.
  A group's frame is highlighted when its last opened member is highlighted.
  Inspecting a group panel or context menu does not change that marker.
  Opening TabGrid does not replace that marker. Normal-mode markers survive
  grid reopening and worker suspension within the browser session.
- Group frames use their native Chrome color. The last-opened color takes
  priority. Hover colors the full frame rather than only the footer.
- Groups have a two-by-two preview. Up to four members appear in native tab order;
  larger groups show the first three plus the remaining count (five tabs = `+2`).
  Previews use locally captured images or Chrome favicons; unused tiles stay empty.
- Drag the body of a tab or group card to reorder it. Buttons and checkboxes are
  excluded. Mouse movement must reach 6 px.
  All-window scope and a group-only filter support reordering. Search, other filters,
  and custom sorting allow destination moves only; selection mode disables drag.
  SortableJS owns drag ordering and auto-animate owns layout animation.
- Pinned tabs stay in their own section. **Show all windows** separates
  windows and their pinned tabs in session creation order.
- Search titles and URLs across current tabs and **Recently closed**. Group-name
  and group-member matching can be enabled separately in Settings. Search fills
  the space beside Sort and Card size, with no resizing on focus. The **Card size** slider
  has six stops, from six cards per row to one, shared with group panels.
  Narrow screens cap the layout at two or three columns for readability. Old
  pixel preferences migrate to the closest fitting column count; cards retain 4:3.

## Page menu and settings

The vertical three-dot button to the right of **New tab** contains **Refresh**,
**Show all windows**, **New regular window**, **New incognito window**, **New tab group**, **Select tabs**, **Close tabs in this
window…**, and **Extension settings**. New groups start with one new tab because
Chrome groups need at least one member.

**Extension settings** has seven keyboard-accessible categories on the left. Valid
changes save automatically; invalid values leave the last saved setting intact.

- **General:** independently remember search options, window scope, main/group
  scroll positions, and main/group queries. Queries clear by default; the other
  memory switches default on. Queries and anchored positions last for the current
  Chrome session; preferences survive restarts. Search autofocus defaults on.
  Choose system motion or no movement, and show website addresses and/or last-use
  times (unavailable times are labeled accurately).
- **Search & Filters:** choose title/URL targets and exact-phrase or all-words
  matching. Website and group selectors combine with pinned, audio, and muted
  filters. Multiple choices within a selector use OR; different filters use AND.
  Active filters show individual matching tabs, limit selection/relative closes
  to those results. Only a group restriction permits reordering; other restrictions
  allow destination moves. The Filters disclosure keeps active restrictions visible as a count when collapsed.
  Each filter can also be hidden in settings, clearing its restriction. A group restriction temporarily locks member search on.
- Search history defaults off. When enabled, explicit submissions/result use are
  saved locally, deduplicated, and limited to 20 records. Display 5/10/20 entries;
  remove individual entries, clear all, or set expiry. Turning history off hides
  retained entries without deleting them. Recent searches appear below either search
  field after clicking or typing, with arrows, Enter, and Escape support. Automatic
  focus keeps the history list hidden. Choosing a result records
  the query (if enabled) and clears it unless its keep-query option is on. Matching
  tabs/groups appear only as filtered cards; live suggestions have been removed.
- **Tabs & Groups:** choose whether new tabs switch away from the grid, blank-space
  selection behavior, closing confirmations, and a 1–300,000 millisecond Undo timeout
  (default 5,000). Idle defaults to Never, supports presets/custom days and website
  exclusions, and can protect open groups for this Chrome session. Any protected
  member keeps its group out of Idle. Nothing closes automatically. Group
  drop targets default on for new installations; saved off choices are retained. Swipe-to-close has been removed. Group destinations live
  in a narrow edge drawer: drag a tab nearby to expand it, or open its handle to
  move selected tabs. Drag the middle to any edge; its position is saved locally. The inactive half pill
  has end controls for resizing; moving uses a fixed full pill. Targets expand
  horizontally, and whole-group drags offer only Ungroup. Alt plus an arrow key
  also docks it to that edge.
- **Previews & Storage:** disable new captures while retaining previews, exclude
  websites and their subdomains, clear previews, inspect usage, and set a 1–1,024
  MiB limit (default 100). Oldest previews are evicted first. HTTP(S) tab menus also
  offer website preview controls and clearing the current preview.
- **Keyboard:** record, clear, or reset page shortcuts for search, sorting, Undo,
  window scope, card size, and selection. Defaults are `/` for search and Ctrl/Cmd+Z
  for Undo outside editable fields. Duplicate/reserved bindings are rejected.
  The browser-wide Open TabGrid binding is assigned in Chrome's shortcut editor.
  A reference is available; optional action hints default off.
- **Backup:** export/import a versioned local JSON settings file. Imports validate
  completely and show proposed changes before Apply. Backups exclude history,
  screenshots, open tabs, queries/positions, Undo, and session group protections.

The selection toolbar appears after **Select tabs**, a card's **Select** action,
or Ctrl/Cmd-click or Shift-click. It provides a count, Select all, Clear, **Edit**, and **Done**.
Right-clicking an unselected card in selection mode adds it to the selection and
opens Edit without clearing the other selected cards.
Selection hides per-card action buttons and disables dragging. Arrow keys
navigate cards; Shift+Arrow extends selection; Delete closes selected/focused tabs.

## Tab menus

Tab, group, and selection menus share grouped actions: new tab after the last
selected tab, grouping/window moves, reload/duplicate/pin/site sound, Reading List,
link actions, and closing. New tabs after a grouped member join that group.
Window choices separate **New Window** from existing windows, labeled by their
first tab and remaining tab count. Relative close actions preserve pinned tabs
and operate only in windows containing selected tabs.

An open menu contains keyboard focus and blocks outside actions. An outside click
only dismisses it; clicking its opener again closes it. Tall menus scroll without
covering the opener. Escape closes a submenu first, then its parent menu.

**Mute Site** requests optional `contentSettings` permission on first use and sets
sound for the selected web origins, including other tabs on those sites. Private
rules use Incognito session scope. If Chrome does not expose site sound settings,
TabGrid reports that limitation. See Chrome's [content settings API](https://developer.chrome.com/docs/extensions/reference/api/contentSettings).

## Groups, closing, and Undo

Group panels have fixed headers, a contained scrolling area, Escape/backdrop
dismissal, and focus restoration. New tab in group and the three-dot Group options
button sit immediately before the close button. Group options uses the same
name/color editor and categorized actions as the outer group-card menu, excluding
relative closes. Group menus omit Reload, Duplicate, Pin, and Mute Site; member-tab
menus retain them. Other cards do not respond visually to hover while a menu is open.
Group **Close** follows the chosen closing-confirmation policy. In a filtered
group panel, **Close Matching Tabs** affects only visible matches.

**Close tabs in this window…** excludes pinned tabs, and respects active filters.
TabGrid pages are always excluded. All close paths share the confirmation policy
(default: more than one tab). An Undo toast appears after regular-mode closes;
hovering or focusing it pauses dismissal. Undo restores group metadata, tab order,
windows, pinning, and mute state, then returns focus to the requesting TabGrid page.
This also applies to partial restores. Its ten-operation journal lasts for the
browser session; the native Recently Closed list remains available after the toast
expires. Chrome's Ctrl/Cmd+Shift+T shortcut is unchanged.

Native sessions are preferred for restore. Expired sessions fall back to reopening
URLs, which cannot recover form contents or page navigation history.

## Local features and privacy

TabGrid uses bundled assets and local Chrome data; its interface and organization
features do not depend on network or account sync. Opening or reloading a website
still follows that website's normal connectivity requirements.

The separate saved-group library and Other Devices feature have been removed.
Use Chrome's own saved groups; TabGrid continues to display their open native
groups. It does not call the remote-session API or implement a second saved-group
store. Previously stored TabGrid saved copies are left untouched, but are no
longer exposed in the interface.

**Bookmark tabs** and **Add to Reading List** request their optional permissions
only when used. Bookmark destinations include writable folders and new subfolders;
managed folders are excluded. The last successful destination is remembered.
Reading List deduplicates URLs. **Copy links** has a selectable-text fallback.

Enable **Allow in Incognito** in Chrome's extension details for the private grid.
Regular and private tabs remain separate, including all-window views and moves.
Private pages do not save previews, recency, bookmarks, Reading List items, or Undo
records. Last-opened markers in private mode stay only in the split worker's memory
and may reset when it suspends. Preferences are shared, but private queries and
view state use separate session keys. No private search history is recorded;
normal history, preview-cache management, and backup controls are disabled there.

Normal recency is stored locally and survives browser restarts. Closed URL records
expire after 120 days, with a 5,000-record limit; all currently open URLs are retained.

## Development and verification

- `grid.js`, `grid.html`, `grid.css`: shared UI, live refresh, menus, dialogs, rendering.
- `theme.css`, `assets/fonts`: editorial light/dark styling and bundled offline typography.
- `lib/preferences.mjs`, `lib/personalization.mjs`: versioned validation, migration,
  local history, and worker settings operations.
- `lib/settings-panel.mjs`, `lib/grid-personalization.mjs`: categorized controls,
  filters, recent-search history, page shortcuts, and view restoration.
- `lib/group-drawer.mjs`: narrow group destinations and persistent edge docking.
- `lib/preview-cache.mjs`, `lib/view-state.mjs`: preview budgets/invalidation and
  isolated session state.
- `lib/tab-actions.mjs`: serialized tab/group actions and close/Undo restoration.
- `lib/tab-focus.mjs`: last-opened tracking and group-preview layout.
- `lib/tab-model.mjs`: selection, ordering, search, and local session models.
- `lib/tab-library.mjs`: idle classification and optional bookmark/Reading List actions.
- `lib/tab-activity.mjs`: normal-mode recency persistence.
- `lib/tab-ui.mjs`, `lib/tab-gestures.mjs`: click intent, preferences, Undo notification,
  and group-drop identity validation.

Run `npm test`, `npm run check`, and `git diff --check`.
Run `node tests/preview-server.mjs` and open `http://127.0.0.1:4173` for the browser
fixture. `?large` adds a 32-tab group, `?previews` adds a five-tab green group, and
`?private` previews the private interface; `?offline` seeds a synthetic cached preview.
Fixture preferences/history persist locally across reloads; simulated tabs reset. Fixture actions use simulated Chrome
APIs and never modify real tabs or bookmarks.

See [verification.md](docs/verification.md) for evidence and native/hardware limits.

Group preview tiles and tabs inside a group panel show a top-left favicon.
Selection, hover, and open-context-menu frames share the same color, preserving
native group colors and giving the last-activated marker priority. Context menus
lock page and group-panel scrolling. During drag, the in-grid placeholder is
transparent and auto-animate moves neighboring card surfaces while their drag
targets stay fixed. Rapid moves continue from the current visual position.
SortableJS owns ordering.

## Appearance

Extension Settings > Appearance offers Light, Dark, or Follow system, 22 themes,
and six independent font choices. Changes save immediately and are included in
local settings backups. All fonts and styles work offline. The current Calm
editorial style remains the default. See [the theme catalogue](docs/appearance.md)
for the full list, font sources, and design references.

### Visual styles and color tints

Appearance now separates **Visual style** (Classic, Flat, Glassmorphism,
Neumorphism, Claymorphism) from **Color tint** (the existing 22 themes).
Light/Dark/Follow system and font choices stay independent. Classic preserves
existing appearances; all materials work offline and round-trip through local
settings backup. See [appearance settings](docs/appearance.md).

Flat uses filled navigation, solid controls, bold titles, squared switches, and
crisp corners inspired by [Designmodo Flat UI](https://github.com/designmodo/Flat-UI).
Its menus, dialogs, settings changes, card resizing, and edge drawer use brief
auto-animate effects. System reduced motion and Disable animations stop movement.
The accepted stable-card reorder method, selected fonts, and color tints remain
independent. No additional framework or network asset is required.

Glass uses frosted panes, beveled rims, a navigation lens, pill controls, and
floating overlays inspired by [liquidGL](https://github.com/naughtyduk/liquidGL).
This local CSS treatment keeps fonts/tints independent and uses 220 ms interface
settling through auto-animate, preserving the accepted reorder method. Reduced
motion stops movement; reduced transparency supplies an opaque fallback. No GPU
renderer, remote asset, or additional dependency is required.

Neumorphism uses a matte canvas, molded convex cards, raised buttons, recessed
fields/navigation, and opposing light/shadow inspired by
[adamgiebl/neumorphism](https://github.com/adamgiebl/neumorphism). Its 200 ms
interface settling uses the existing auto-animate owner; the accepted reorder
method, group colors, secondary tints, and fonts stay independent. Motion settings
stop movement. No generator runtime, remote texture, or new dependency is required.

Claymorphism uses floating inflated tiles, molded buttons, and outlined soft fields
inspired by [codeAdrian/clay.css](https://github.com/codeAdrian/clay.css). One outer
and two inner shadows sculpt the surfaces. Its 240 ms interface settling uses
the existing auto-animate owner; reorder, group colors, tints, and fonts remain
independent. Motion settings stop movement. No library import or remote asset
is required.

Website and group filters use compact searchable dropdowns: type the full name
for a case-insensitive phrase match or expand to browse choices. Boolean controls are switches,
and group drawer targets carry their assigned group colors.


### Desktop usability refinements — 2026-09-30

- Search fills the remaining space beside Sort and Card size, with no resizing on
  focus. Member/group-name search options live in Settings. All windows is in the
  main page menu. Fresh installations default to four cards per row; saved sizes
  stay unchanged. Window labels use session creation order and compact on close.
  Already-open windows are initially seeded in Chrome enumeration order because
  Chrome does not expose their past creation times.
- All-window grids support tab/group drops into another window at the landing
  position. A group-only restriction permits member reordering. Text, website,
  pinned, audio, and muted restrictions permit destination moves without
  reordering; a tip explains how to restore ordering. Tab order is required for
  reorder. The accepted stable-card animation remains unchanged.
- Search history supplies phrase-matching recommendations up to the chosen count.
  Result use records the search and clears it unless the respective main/group
  keep-query preference is enabled. Website/group picker arrows toggle open/closed.
- Appearance includes optional window identity and group identity on main query
  results when member search is enabled. Selection uses a filled circle at each
  card's top left. New tabs scroll into view when switching to them is disabled.
- Settings use a combined title/URL target selector, conditional custom/threshold
  controls, add/remove website lists, group-protection switches, consistently
  inset dropdown arrows, spaced keyboard controls, and a styled backup file chooser.
  Legacy Undo seconds migrate to milliseconds without changing their duration.

See docs/verification.md for current automated and browser-fixture results and
remaining native-extension/offline acceptance limits.
