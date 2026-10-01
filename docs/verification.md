# TabGrid verification

## Refined Claymorphism material and motion — 2026-10-01

- **Automated: 131 tests pass.** Added a focused Clay case for inner-surface
  layout reflow at 240 ms, unchanged 120 ms reorder, and interrupted offsets.
  Shared material gates and live timing tests include Clay. Existing effect
  ownership, dialog coordinates, preferences, privacy, and worker tests pass.
  Syntax/module and whitespace checks pass.
- **Chrome-hosted HTTP fixture, simulated Chrome APIs: 27 assertions pass.**
  Checked Clay persistence, independent tint/font, quiet autofocus, menu entry/
  exit, immediate inert/focus release, outside-action shielding, native group
  swatches and action exclusions, aligned filters, phrase matching, individual
  results, second-click picker closure, and immediate close/Undo staying in grid.
  Cached preview imagery is synthetic. This is real Chrome rendering and native
  pointer/keyboard input on a local page, not native extension API verification.
- Root pointer sweep produced 3 swaps and 3 interrupted retargets; group
  row-crossing produced 2 swaps and 2 retargets. Both had ghost opacity 0, no
  animated outer slots, and maximum continuity jump 0. Motion-off drag produced
  2 swaps, no shifted surfaces/animated slots, and an immediate 383.2 px step,
  expected with movement disabled. Resize/disclosure created no movement effects.
- Menu/drawer effects measured 240 ms. Keyboard drawer docking remained fixed
  and contained on all four edges, with an untransformed/unblurred group panel.
  Group-header buttons and six root filter controls remained 40 px tall.
- Light/Dark, settings, group, and narrow screenshots were inspected. Nine Light
  and eight Dark base-color contrast samples passed 4.5:1; this is not a complete
  audit of inset shadows, every tint/group color, or screenshot imagery. At
  375×812 the dialog, vertical rail, and panel scrolling remained contained;
  ArrowDown selected the next category. Temporary viewport was reset. No OS
  motion setting or older Chrome binary was changed.
- No fixture console errors/warnings. Measurement-probe corrections (tint ID,
  picker focus/scroll timing, panel selectors, and transient Undo status) are
  recorded separately in browser-checks.json. The fixture retains connect-src
  none; material code/assets remain local. This is **not a physically network-
  disconnected acceptance run**.
- **Native Chrome extension remains pending** under the earlier extension-URL
  policy restriction: actual tab/group APIs, real screenshot capture, browser-wide
  commands, worker suspension/restart, and disconnected acceptance. No bypass
  was attempted. Physical touchscreen checks were not performed; TabGrid is a
  desktop extension. Disposable tabs/server closed; existing user changes
  preserved, no commit/push.

Evidence: output/clay-2026-10-01/browser-checks.json, clay-light.png,
clay-dark.png, clay-group.png, clay-settings.png, and clay-narrow.png.
Earlier sections are historical.

## Refined Neumorphism material and motion — 2026-10-01

- **Automated: 130 tests pass.** Added a focused case for Neumorphism reflow on
  inner surfaces at 200 ms while reorder retains 120 ms. Shared material gates
  and live timing tests now include Neumorphism. Existing interruption, effect
  ownership, dialog coordinates, preferences, privacy, and worker tests pass.
  Syntax/module and whitespace checks pass.
- **Chrome-hosted HTTP fixture, simulated Chrome APIs: 29 assertions pass.**
  Checked Neumorphism persistence, independent tint/font, menu entry/exit and
  immediate inert/focus release, group action exclusions/outside-action shielding,
  aligned filters, phrase matching, flattened matching results, and picker toggle.
  Cached preview imagery is synthetic. This is real Chrome rendering and pointer/
  keyboard input on a local page, not native Chrome extension API verification.
- Pointer drag: root sweep produced 2 swaps and 2 interrupted retargets; group
  row-crossing produced 1 swap/retarget. Both had ghost opacity 0, no animated
  outer slots, and maximum continuity jump 0. Motion-off drag produced 2 swaps,
  no shifted surfaces/animated slots, and an immediate 383.2 px step, expected
  with movement disabled. Disclosure and card resizing created no movement
  effects with that preference off.
- Neumorphism menu/drawer effects measured 200 ms. The group drawer remained
  fixed and contained on all four edges using keyboard docking, with an
  untransformed, unblurred group panel. All group-header buttons and six root
  filter controls remained 40 px tall. Flat retained no surface shadows and
  180 ms effects; Glass retained navigation blur, blur-free cards, and 220 ms.
- Light/Dark and settings/group screenshots were inspected. Eight Light and
  five Dark base-color contrast samples passed 4.5:1. A separate calculated
  check covers text/muted/accent on the matte plane and both convex-gradient
  endpoints in all 44 tint/mode combinations; minimum is 4.56:1. The first
  calculation found 4.47:1 in Cold luxury Light, fixed by reducing the ending
  shade. This is not a pixel-by-pixel contrast audit of inset shadows, every
  group color, or screenshot background.
- At 375×812, the settings dialog, vertical category rail, and contained panel
  scrolling fit; ArrowDown selected the next category. Temporary viewport was
  reset. System-motion gates have focused tests; no OS preference or older
  Chrome binary was changed. Initial measurement-selector corrections are
  recorded separately in browser-checks.json.
- No fixture console errors/warnings. The fixture keeps connect-src none, and
  all material assets/code remain local. This is **not a physically network-
  disconnected acceptance run**.
- **Native Chrome extension remains pending** under the earlier extension-URL
  policy restriction: actual tab/group actions, real screenshot capture,
  browser-wide commands, worker suspension/restart, and disconnected acceptance.
  No bypass was attempted. Physical touchscreen checks were not performed;
  TabGrid remains a desktop extension. Disposable tabs/server closed; existing
  user changes preserved, no commit/push.

Evidence: output/neumorphism-2026-10-01/browser-checks.json,
neumorphism-light.png, neumorphism-dark.png, neumorphism-group.png,
neumorphism-settings.png, and neumorphism-narrow.png. Earlier sections are historical.

## Refined Glassmorphism material and motion — 2026-09-30

- **Automated: 129 tests pass.** New cases verify live material-specific settling
  timing and that Glass layout reflow does not change accepted reorder timing.
  Existing effect ownership, interruption, dialog-coordinate, motion-gating,
  preference, privacy, and worker tests pass. Syntax/module and whitespace checks pass.
- **Chrome-hosted HTTP fixture, simulated Chrome APIs: 34 assertions pass.**
  Checked material persistence, independent tint/font choices, aligned filters,
  phrase picker matching, flattened results, second-click closure, outside-action
  shielding, immediate dialog focus restoration, history, close/Undo, and Flat
  timing after switching styles. The fixture contains synthetic cached previews.
- Actual pointer drag in the fixture: root sweep had 2 swaps and 2 interrupted
  retargets; group row crossing had 1 swap/retarget and 4 displaced surfaces.
  Both measured maximum continuity jump 0, ghost opacity 0, and no animated
  outer slots. Motion-off dragging had 2 swaps, no animated surfaces/slots, and
  a 287.4 px immediate step, expected when movement is disabled.
- Glass UI effects measured 220 ms; Flat remains 180 ms and reorder remains
  120 ms. Reflow animates only inner card surfaces. Closed overlays retain exit
  paint while becoming inert immediately. Pointer drawer docking retained the
  128×36 px moving full pill; keyboard expansion at all four edges stayed fixed
  to the viewport inside the group panel. Group controls remain 40 px tall.
- Light/Dark were visually inspected. Sampled navigation, primary button,
  sort, normal-card and last-opened text met 4.5:1. Translucent color calculations
  composite against the base canvas; this is a limited sample, not a complete
  audit of every tint or background pixel. At 375×812, settings and navigation
  remained contained and category arrow navigation passed. Viewport was reset.
- The `opaque` fixture forces the reduced-transparency **CSS** branch. It passed
  opaque fills, no sheen/blur, and operable menus. The OS preference was not
  changed. System motion gates have focused tests; no OS-level reduction change
  or older Chrome binary was tested in this run. Initial measurement-probe
  corrections are recorded in the evidence JSON.
- No fixture console warnings/errors. All material code/assets remain local;
  no liquidGL package, remote texture, shader rasterizer, or new dependency was
  introduced. The fixture keeps connect-src none. This is **not a physically
  network-disconnected acceptance run**.
- **Native Chrome extension remains pending** under the previously observed
  extension-URL policy restriction: actual tab/group actions, screenshot capture,
  browser-wide commands, worker suspension/restart, and disconnected acceptance.
  Physical touchscreen checks were not performed; this is a desktop extension.
  Disposable tabs/server were closed; existing user changes preserved, no commit/push.

Evidence: output/glass-2026-09-30/browser-checks.json, glass-light.png,
glass-dark.png, glass-group.png, glass-settings.png, and glass-narrow.png.
Earlier sections are historical.

## Refined Flat material and motion — 2026-09-30

- **Automated: 127 tests pass.** Thirteen added tests cover Flat/system motion gates,
  auto-animate effect ownership/cancellation, interrupted visibility, fixed-dialog
  coordinates, immediate inert/accessibility state, card reflow, successive-render
  snapshots, root/group scroller coordinates, and older-Chrome dialog event fallback. Syntax/module and whitespace
  checks pass.
- **Chrome-hosted HTTP fixture, simulated Chrome APIs: 34 assertions pass.**
  Checked Flat persistence after reopening, phrase filter pickers and flattened
  results, menu second-click closure, outside-action protection, close/Undo staying
  in the grid, group controls/menu contents, and immediate focus restoration.
  A second tint and bundled Outfit font remained independent of Flat.
- Actual pointer reorder in the fixture: root sweep had 2 swaps, 1 interrupted
  retarget, ghost opacity 0, no animated outer slots, and maximum jump 0. A group
  row-crossing displaced 4 surfaces with 1 interrupted retarget and maximum jump 0.
  With motion disabled, 2 swaps produced no animated surfaces or slots; the
  measured 287.4 px immediate step is expected with movement turned off.
- Drawer pointer/keyboard docking and horizontal expansion passed at all four
  edges. Card resizing moved only inner surfaces. Menu entry/exit effects measured
  180 ms; closed menus/dialogs retained exit paint while immediately becoming
  inert and leaving accessibility snapshots. Disabled motion produced no nonzero
  UI effects during resize/drawer operations. System reduction is covered by
  focused tests and the live listener, not an OS preference change in this run.
  The attribute-observer fallback preserves Chrome 120+ dialog behavior; no old
  Chrome binary was run. Dialog toggle events arrived in Chrome 132, per the
  [official release documentation](https://developer.chrome.com/blog/new-in-chrome-132).
- Light/Dark were visually inspected. Four sampled Dark foreground/background
  pairs (source button, primary button, sort, card title) met 4.5:1; this is not a
  full contrast audit. At 375×812, dialog/panel widths remained contained and
  ArrowDown selected the next settings category. Temporary viewport was reset.
- No fixture console warnings/errors. Cached preview evidence is synthetic.
  The fixture retains connect-src none and all new assets are local. This is
  **not a physically network-disconnected acceptance run**.
- **Native Chrome extension remains pending** under the previously observed
  extension-URL policy restriction: actual tab/group actions, screenshot capture,
  browser-wide commands, worker suspension/restart, and disconnected acceptance.
  Physical touchscreen checks were not performed; the product remains desktop.
  Existing user changes are preserved; no commit/push.

Evidence: output/flat-2026-09-30/browser-checks.json, flat-light.png, flat-dark.png,
flat-group.png, flat-settings.png, and flat-narrow.png. Earlier sections are historical.

## Search focus and edge-drawer refinements — 2026-09-30

- **Automated: 114 tests pass.** New cases cover independent quiet autofocus,
  drawer defaults/migration/backup, resize limits, and live group Ungroup identities,
  ordering, stale groups, and overlapping drops. Syntax/module/whitespace checks pass.
- **Chrome-hosted HTTP fixture, simulated Chrome APIs: 54 assertions pass.**
  Root/group automatic focus hides retained histories; clicking shows them and
  typing filters by phrase. Checked inline Show all windows, root/group spacing
  with all filters hidden, equal exclusion buttons, Settings backdrop dismissal,
  native-radio palette arrow navigation, chosen color persistence in created groups,
  colored Add to Group/Idle protection/drawer labels, and regular/private window
  requests from both normal and private fixtures.
- Pointer drags docked the drawer, resized its end, and observed its moving grip
  at 36×128 px (side) / 128×36 px (top/bottom), with full-pill radius 999 px.
  Click/keyboard resizing and reload persistence passed. Destinations expanded
  horizontally at all four edges; a 375×812 viewport kept them inside the viewport,
  including with maximum saved drawer length. Settings panels did not overflow.
- A whole-group pointer drop exposed only Ungroup and retained both Research
  members as individual tabs. The first very fast attempt missed expansion; the
  start-of-drag proximity check fixed the timing and the retest passed. These are
  disposable fixture records, not native Chrome tabs.
- Material regression checks preserved the half-pill shape across all five styles.
  Glass group-panel drawers remained clickable on all four viewport edges. A
  discovered blurred-ancestor coordinate shift was fixed: the group panel keeps
  its tint/sheen, while blur remains on the backdrop and drawer.
- Reorder retest: normal motion had 2 swaps / 2 interrupted retargets, ghost opacity
  0, no animated outer slots, max jump 0. Disabled motion had 2 swaps, no animated
  surfaces/slots, ghost opacity 0; the 191.6 px immediate step is expected without
  animation. No fixture console warnings/errors were recorded.
- Native extension acceptance was not retried after the earlier URL-policy denial.
  Actual window creation, group Ungroup, screenshot capture, browser-wide shortcuts,
  service-worker restart and a physically disconnected run remain unverified.
  No remote assets or processing were added. Physical touchscreen testing was not
  performed and touch compatibility is outside the current desktop scope.

Evidence: output/drawer-2026-09-30/browser-checks.json, drawer.png,
group-palette.png, narrow-settings.png. Browser viewport reset; disposable tabs
and server closed. Existing user changes preserved; no commit/push.

## Desktop usability refinements — 2026-09-30

- **Automated: 110 tests pass.** Seven new tests cover drag policy, milliseconds/
  sizing migration, phrase history limits, session window ordering/compaction,
  cross-window tab/group positioning, and invalid/stale/private drop requests.
  Three obsolete swipe tests were removed with the feature. Module/syntax and
  whitespace checks pass.
- **Chrome-hosted HTTP fixture; simulated Chrome APIs:** 27 assertions passed.
  Checked conditional history/custom/confirmation/capture fields, URL normalization
  and exclusion removal, root retention versus independent group clearing, default
  activation clearing/recording, phrase history, picker second-click closure,
  group-only reorder, main group/window metadata, circular selection, persisted
  preferences on reload, four-column fresh defaults, and category keyboard navigation.
- Actual pointer drags in the fixture moved a tab before a destination card and a
  whole group between two destination cards across windows. A group-only filter
  reordered its five members. Text-query dragging preserved in-window order and
  still moved a member into another window. A discovered append-only bug was fixed
  by resolving reorder eligibility before entering the busy state. These operations
  mutate disposable fixture records, **not native Chrome tabs**.
- Motion on: a sweep had 2 swaps / 2 interrupted-animation retargets, ghost opacity
  0, no animated outer slots, and maximum continuity jump 0. Motion off: 2 swaps,
  no animated surfaces or slots, ghost opacity 0; immediate layout changes produced
  a measured 191.6 px step, as expected with animation disabled.
- A new tab in a 32-member group scrolled into view with switching disabled. Root
  new-tab creation also stayed in the grid. The shared helper covers root, group,
  new-group, and New Tab After Selected entry points; the latter two were inspected
  but were not separately exercised through the UI in this pass.
- The clarified desktop Search/Sort/Card-size row measured Search 786.6 px and
  Sort 155 px, sharing the same top position. Search width stayed unchanged on
  focus. At 375 × 812, Search & Filters and Backup panels had no horizontal overflow.
  Category Home/arrow navigation worked; the temporary viewport was reset.
- No fixture console warnings/errors. No remote assets were added. This is not a
  physically network-disconnected acceptance run. Backup validation remains covered
  by automated tests; the new chooser's layout was inspected, not an OS file upload.
- **Native Chrome extension remains pending:** attempting to inspect its installed
  grid was denied by the browser URL protocol policy (only HTTP(S) allowed). No
  workaround was used. Actual cross-window tab/group moves, browser-wide shortcuts,
  real screenshot capture, worker suspension/restart, and disconnected acceptance
  still require native verification. Physical touch was not tested; swipe closure
  was intentionally removed and touchscreen compatibility is outside current scope.
- Window order: new creation/closure and worker recreation pass mock tests. On first
  use, pre-existing windows are seeded from Chrome enumeration order; their historic
  creation times are unavailable. Native enumeration/creation timing is unverified.

Evidence: output/usability-2026-09-30/browser-checks.json, grid.png, selection.png,
backup.png, and narrow-settings.png. Earlier sections below are historical.

## Material styles and compact controls — 2026-09-30

- Automated: **106 tests pass**, module/syntax and whitespace checks pass. Added
  exact-match filter tests and style migration, validation, tint independence,
  and backup checks across all 5 styles × 22 tints × 2 modes.
- **In-app browser, HTTP fixture with simulated Chrome APIs**: keyboard-operated
  website exact match (`EXAMPLE.COM` → `example.com`), root group restriction,
  Arrow Up choosing the last group, Enter selection, clearing restrictions,
  and the independent group-panel website picker passed. Root group restriction
  rendered the five Design reference members with their group identity.
- All six filter controls measured 40 px high with identical bottom positions.
  All three group-header actions measured 40 px. Existing group destinations
  rendered blue/green native tints; New group and Ungroup had no group color.
- Four new materials × Light/Dark applied distinct radius/shadow/blur treatments,
  with no settings-panel horizontal overflow. Glass alone used 20 px backdrop
  blur. Warm craft tint stayed selected when switching material. Neumorphism
  survived page reload. At 375 × 812, page width was 375 px and panel client/scroll
  widths were both 234 px. Temporary viewport override was reset.
- Fixture console warning/error list was empty. New surface treatments use only
  local CSS; the fixture retains connect-src none. This is not a physically
  network-disconnected acceptance run.
- Pointer automation repeatedly returned without activating controls, including
  a correctly hit-tested, non-inert Clear filters button. Keyboard actions worked.
  Therefore pointer selection, pointer dismissal, and rapid drag/reorder with both
  motion preferences remain **unverified in this pass**. No reorder implementation
  was changed; previous fixture continuity results are historical, not rerun here.
- Native installed Chrome extension, worker restart, actual OS color-mode change,
  reduced-transparency OS setting, and physical touch remain pending. No blocked
  extension URL access was bypassed.

Screenshots: output/materials-2026-09-30/appearance.png and clay-grid.png.


## Appearance personalization - 2026-09-29

- Automated: **103 tests pass**. New tests cover old-preference migration, all
  theme/font backup combinations, invalid import values, manual/system resolution,
  token replacement, font assets/licenses, and palette contrast. All 44 palettes
  meet 4.5:1 for text, muted text, and accents on canvas/surface/selection, and for
  primary-button text. Syntax and whitespace checks pass.
- Chrome HTTP fixture with **simulated Chrome APIs**: selected all 22 themes in
  Light and Dark (44 combinations); each applied the requested mode without errors
  or settings-panel horizontal overflow. Six font choices applied; font readiness
  and local loading checks passed. Ethereal glass / Dark / Plus Jakarta Sans
  survived a page reload.
- Category End/Home/ArrowDown navigation includes the new seventh category. Native
  theme radio ArrowRight updated both selection and focus. Reset restored Calm
  editorial, Geist, Follow system, and system motion. At 375 x 812, page width was
  375 px and panel client/scroll widths were both 234 px, including Newsreader and
  Liquid glass. Viewport overrides were reset after testing.
- A group reorder sweep reported ghost opacity 0, one retargeted swap, no animated
  outer slots, and maxJump 0. Motion disabled reported no shifted-card animations
  and maxJump 189, the expected immediate slot move. The effect ownership is intact.
- Final fixture console warning/error list was empty. All fonts are bundled;
  the HTTP fixture retained connect-src none. No runtime remote assets were added.

Follow-system resolution is automated-tested and its change listener is wired.
An actual operating-system theme change, installed native extension behavior,
service-worker restart propagation, physical touchscreen input, and a real
network-disconnected acceptance run were not performed in this pass. Previously
blocked native extension access was not bypassed. Simulated tab operations above
are not native Chrome verification.

Screenshots: [light](../output/appearance-2026-09-29/settings-light.png),
[dark](../output/appearance-2026-09-29/settings-dark.png),
[narrow](../output/appearance-2026-09-29/settings-narrow.png).


## Calm editorial redesign — 2026-09-29

- Automated: **97 tests pass**; syntax and whitespace checks pass.
- The local Geist WOFF2 loaded successfully in the Chrome fixture. All stylesheet
  and font paths are bundled; the fixture retains its no-connect CSP.
- Expanding Filters, choosing Playing audio = Yes, then collapsing it retained
  only Music and displayed “1 active.” Clear filters restored the original cards.
- Grouped settings still save checkbox changes. ArrowDown switches category and
  updates aria-selected. Both group menus retain the shared requested actions.
- Four-column sizing produced four equal 269.4 px tracks; the fixture was restored
  to six columns afterward. Skip to tabs moved focus to the main tab area.
- At 375 × 812, page width remained 375 px; settings panels measured 234 px client
  and scroll width, expanded filters 339/339 px, and group content 339/339 px.
  Narrow group cards retained a 147.5 × 110.625 px four-to-three frame.
- A rapid two-insertion reorder with two retargeted movements recorded ghost
  opacity 0, animatedSlots [], maxJump 0. With animations disabled, reverse reorder
  had no shifted-card animations and immediate placement, as expected.
- A fixture-only server option forced dark CSS branches for visual inspection.
  Group surfaces measured rgb(41,45,44) with text rgb(232,234,228). This is CSS
  emulation, not a native system-theme-switch test. No console warnings/errors
  were reported in the final fixture check. Temporary viewport overrides were reset.

All tab/Chrome operations above are **simulated APIs in an HTTP fixture**. Native
extension, physical touchscreen/trackpad, real disconnected operation, capture,
worker lifecycle, and previously noted backup/shortcut acceptance limits remain.

Evidence: [desktop grid](../output/redesign-2026-09-29/grid.png),
[settings](../output/redesign-2026-09-29/settings.png),
[narrow settings](../output/redesign-2026-09-29/settings-narrow.png),
[narrow group](../output/redesign-2026-09-29/group-narrow.png),
[dark group](../output/redesign-2026-09-29/group-dark.png).

## Menu, history, and drawer follow-up — 2026-09-29

- Automated: **97 passed, 0 failed**; syntax and whitespace checks pass. Added
  coverage for removed suggestion preference migration, opt-in/private/expired
  history display, drawer preference validation/backup, edge snapping, narrow
  bounds, and stationary handle anchoring when the drawer expands.
- Chrome-hosted HTTP fixture, **simulated Chrome APIs**: root Music and group
  Reference article result clicks cleared their respective search fields and
  placed the queries in recent history. This worked with both query-memory
  switches enabled. ArrowDown/Enter reused Music and filtered to its card.
  With recording off, Reading queue still cleared after activation but was not
  recorded or displayed; previously retained history reappeared when enabled.
- Suggestion switches are absent from settings. Outer and inner group menus
  share name/color controls and action sections; Reload, Duplicate, Pin, and
  Mute Site are absent. Only the outer menu has the two relative-close actions.
  Second opener clicks continue to dismiss menus.
- Drawer: 44 px collapsed, 176 px expanded on desktop; 168.75 px at a 375 px
  viewport, with no horizontal page overflow. Dragging its handle from right to
  left changed its edge/offset and survived a reload. Alt+Arrow docking and
  bottom-edge bounds were also checked. The drawer remains usable inside the
  modal group panel and in selection mode.
- Dragging Music near the collapsed drawer expanded it, dropped into New group,
  and collapsed it afterward. Moving selected Music into existing Research
  produced a 33-member group. These are mock tab-strip changes only.
- With movement enabled, a fast two-insertion reorder included one interrupted
  slide: ghost opacity 0, animatedSlots [], maxJump 0. A drawer drop also reported
  maxJump 0 and effects confined to card surfaces. With movement disabled, the
  drawer drop passed and cards moved immediately (a nonzero positional step is
  expected). Sortable remains the DOM owner and auto-animate the effect owner.

Native extension behavior is **not certified**: the previously documented
extension-page access restriction remains. Physical touch dragging/swiping and
trackpad edge scrolling require hardware checks. Existing offline/native preview,
worker restart, browser-wide shortcut, and backup-picker acceptance limitations
remain unchanged. Screenshots below are disposable fixture data, not user tabs.

Evidence: [drawer](../output/usability-tweaks-2026-09-29/drawer.png),
[history](../output/usability-tweaks-2026-09-29/history.png),
[group menu](../output/usability-tweaks-2026-09-29/group-menu.png).

## Offline personalization acceptance — 2026-09-28–29

### Automated checks

`npm test`: **93 passed, 0 failed**. `npm run check` and `git diff --check` pass.
Thirty new personalization tests cover defaults/migration, valid hostnames and
subdomain boundaries, search fields/modes and filter intersections, filtered
selection, history expiry/deduplication/retention, strict confirmation thresholds,
future-only Undo timing, idle exceptions, shortcut conflicts/reserved combinations,
backup validation/preview/apply separation, root/private session isolation and
cross-window group state, preview eviction, and clear/exclusion/navigation/active-
tab capture races. An integration test recreates the personalization service and
exercises management/search/preferences/cached previews/backup with `fetch`
replaced by a throwing network-disabled stub. This is a data-layer simulation,
not a real extension-worker restart or browser network-disconnection test.

### Chrome-hosted fixture observations — simulated Chrome APIs

- A normally typed 12-second Undo timeout survived reload. Zero was rejected with
  an explanation and `aria-invalid`; the previous saved value remained intact.
  The browser tool's direct `fill` operation did not produce the native numeric
  change commit, so numeric checks use real typing and Tab. Fixture RPC calls now
  serialize like the worker.
- Root `Research` and group `scroll test 2` queries restored independently. Group
  scrolling restored at 545.5 px across repeated close/reopen while autofocus stayed
  on search. A later `Reference article` query survived page reload with the new
  group-specific session keys. Cross-window group-state sharing has unit coverage.
- Playing-audio filtering produced only Music; Select all selected one tab.
  Hiding a filter cleared its restriction. Explicit group selection produced 32
  member cards, locked Search inside groups in both the page and settings, and
  restored its previous unchecked value after Clear filters.
- Relative-close commands were disabled when Music was the only filtered result.
  The implementation also limits filtered window/group close actions to matches.
  Single-click empty grid space cleared the selection while retaining selection
  mode; double-click exited it.
- Submitted searches appeared as history suggestions. `/` duplicated onto another
  action was rejected; recording `S` for Select tabs worked, and `/` returned focus
  to search outside editable fields. Category ArrowDown selected and focused the
  next vertical tab.
- Stop previews for Music's website changed its next menu to Allow previews. The
  exclusion appeared in settings; cache usage reflected stored previews. The
  cache/race tests use synthetic image data, never actual screenshots of user tabs.
- Stay-in-grid behavior retained the simulated TabGrid tab for root new-tab,
  group creation, and New tab in group. Switching mode activated the created root
  tab. New Tab After Selected activation/group placement is covered by action tests.
- Always-confirm opened a one-tab confirmation. Group deletion showed 32 affected
  tabs, relative-after close 34, window close 35 (excluding the pinned tab), and
  explicit Select all close 36 (including that selected pinned tab). Those dialogs
  were cancelled. Keyboard Delete/Undo closed/restored Music. Swipe recognition
  remains covered by gesture unit tests; physical gestures were not performed.
- Private fixture settings disabled normal history recording, screenshot capture,
  cache clearing, and backup import/export. Closing its two-member group stated
  that Incognito closes cannot be undone. This does not certify native split-mode
  storage isolation; service-level privacy guards have separate unit coverage.
- At 375 × 812, the settings dialog fit between x=17 and x=358; its content had zero
  horizontal overflow. The group panel also had zero overflow and retained a
  283.8 px scrolling area below its filters. The viewport override was reset.
- A rapid two-insertion reorder initially exposed a 23.5 px shift when the search
  header collapsed during a card gesture. Deferring that collapse until release
  fixed it. Retest: ghost opacity 0, two swaps, one interrupted slide, no animated
  outer slots, maximum insertion discontinuity **0 px**. With motion off, two
  reverse swaps restored order with no movement effects or animated slots; cards
  intentionally jump directly to their final slots in this mode. No animation
  owner or Sortable ordering change was introduced.
- Final inspected browser console logs had no warnings/errors.

### Offline fixture run and remaining limits

Loaded `?offline`, which seeds a bundled synthetic 640 px cached preview, under
`connect-src 'none'` and local-only asset rules. Stopped the fixture HTTP server
before testing: settings remained usable, preview usage showed one cached image,
search returned Research notes/Research, Music could close and Undo, and Export
created a version-1 JSON Blob with only `format`, `preferences`, and `version` at
the top level. The fixture observes Blob creation without changing export logic.
No server was available for these operations. This verifies the already-loaded
fixture's independence from its origin service; the computer's Internet connection
was not disabled and this is **not native disconnected-extension acceptance**.

Browser download completion could not be confirmed through the download event
(wait timed out). Import through the file chooser was explicitly blocked because
the browser-control extension lacks Allow access to file URLs. No permission was
changed or bypass attempted. Backup content, defaults, rejection, no-partial-write,
and explicit Apply semantics pass automated tests, but the full UI file round trip
remains pending.

Native `chrome-extension://` access remains blocked by the previously reported
browser URL policy. Outstanding native checks: the browser-wide command and its
actual assigned binding, screenshot capture and exclusion races with real pages,
service-worker suspension/restart, live tab/group persistence and cross-window
view restoration, real split-Incognito isolation, and a browser disconnected from
the network for management/settings/search/cached previews/backup. Physical touch
hold/swipe/scroll/multi-touch and trackpad behavior still require hardware testing.
OS reduced-motion-following and dark-mode runtime acceptance are not newly claimed.

Evidence: [settings](../output/personalization-2026-09-28/settings.png),
[narrow settings](../output/personalization-2026-09-28/settings-narrow.png),
[server-disconnected fixture](../output/personalization-2026-09-28/offline-fixture.png).
Existing user changes were preserved; no commit or push was made.


## Automated checks

Run `npm test`, `npm run check`, and `git diff --check`.

93 tests currently cover typed selection, scope/search, native API simulations,
close/undo failures and recovery, groups/windows/pinning, activity persistence,
Reading List, swipe intent, last-opened tracking, Undo focus restoration, and the UX refinements. New cases cover
click/hold/movement thresholds, selection drag eligibility, group-drop rejection,
size/idle preference migration, window ordering, timed/paused/dismissed Undo,
operation-specific restore, writable bookmark paths, folder validation, partial
writes, and failed destination-preference persistence.

## Browser fixture evidence — 2026-09-26

Start `node tests/preview-server.mjs` and open `http://127.0.0.1:4173`.
The fixture uses simulated Chrome data; actions do not affect real user tabs or
bookmarks. `?large` supplies a 32-tab group for scroll checks, and `?private`
previews the Incognito interface. Reload resets simulated tabs; fixture preferences/history persist locally and
view state persists in session storage.

Verified through browser interaction:

- All windows produces separate current-window/other-window sections with pinned
  cards inside their own window. Cross-window Select all counts seven fixture tabs.
- Selection shows Done selecting, count, Select all, Clear, and More; card action
  buttons disappear. More uses organized sections and disables invalid grouping.
- Dragging in selection mode leaves card order and selection unchanged. Leaving
  selection restores whole-card dragging.
- Dragging a tab preview changes order. Dragging a group preview moves its members
  together, preserves their order, and does not open the group.
- Bookmark destination offers writable paths, saves into the chosen folder, and
  remembers it the next time the picker opens.
- Idle defaults to Never. Card slider produces 450 × 337.5 px cards and responds
  to a one-pixel decrement with a 449 px width.
- Closing a tab inside a group displays the shared toast above the dialog; Undo
  restores it. Main-grid closes use the same toast. Dismiss + Refresh does not
  resurrect the notification.
- A 32-tab group scrolls to its bottom while the header remains fixed. Further
  scrolling leaves background scrollY unchanged at 226.5 px. Inside blank space
  keeps the dialog open; clicking the outside backdrop dismisses it, unlocks the
  page, and returns focus to its group card.

The browser checks caught an Illegal invocation from unbound timer functions in
UndoNotice. Default timers now use wrappers, and the modal/main-grid notification
checks passed after the fix. Node-only timers did not reveal this browser issue.

## Remaining acceptance checks

These are not confirmed by the fixture or unit tests:

1. Reload the unpacked extension in Chrome and use disposable tabs in a separate
   test window. Confirm whole-card tab/group moves persist in the native tab strip,
   keeping group names/colors/member order and pinned boundaries.
2. Confirm pointer holds, drag cancellation, and release outside do not activate
   native tabs; keyboard Enter/Space still activates normally.
3. On a physical touchscreen, verify 250 ms hold-to-drag versus quick swipe-to-close
   and vertical scrolling, including multi-touch cancellation and selection mode.
4. Exercise real optional bookmark permission denial/grant, writable and managed
   folder choices, destination removal during the picker, and native bookmark writes.
5. Close/Undo a disposable group and a cross-window selection. Verify restored
   native group metadata, positions, pinned/muted state, and session-history recovery
   after the five-second toast expires. Private closes never create Undo records.
6. Verify narrow/light/dark/reduced-motion layouts, keyboard focus, and scroll
   containment with trackpad and touch at both group scroll boundaries.
7. Confirm live external tab/group changes, last-opened markers across grid/worker
   recreation, and real split-Incognito isolation. Saved-group-library and remote
   session checks were retired when those features were removed.

Earlier attempts to automate Chrome's extension-management page were denied by
browser tooling. Do not bypass that restriction through another control channel;
the user must perform extension reload/setup when required. Record native results
separately, including any steps that still require user/device access.

## Follow-up verification — 2026-09-27

### Automated and simulated results

- Re-ran `npm test`: 46 passed, 0 failed. `npm run check` and
  `git diff --check` passed.
- Opened `http://127.0.0.1:4173/?large` in the connected Chrome browser. This
  still uses **simulated Chrome APIs**, not the installed extension.
- At a temporary 375 × 812 CSS-pixel viewport, the light-mode page had no
  horizontal overflow (`scrollWidth === innerWidth === 375`). Main-grid and
  pinned cards measured 220 × 165 px, preserving 4:3.
- The 32-tab group dialog fit inside that viewport (327 px wide), placed initial
  focus on Close group panel, and advanced Tab to New tab in group. Enter and
  Space on the group card opened it; Escape closed it and returned focus to the
  group card. These checks do not prove native tab activation or full focus-cycle
  behavior through browser chrome.
- Browser-generated scrolling reached both group-content boundaries (0 and
  5383.5 px). Additional scrolling at each boundary left background scrollY at
  951.5 px and the group header at y = 74.078125 px. Body overflow was hidden
  while the dialog was open and returned to visible when closed. This is not a
  physical trackpad or touchscreen test.
- Screenshot: [narrow fixture group](../output/verification-2026-09-27/fixture-narrow-group.png).
  The temporary viewport override was reset after testing.

### Native Chrome status: setup complete; extension-page access blocked

Ordinary Chrome page access works in this chat. The connected browser inventory
contained an IANA page and the temporary fixture page, but no native TabGrid page.
The user was asked to reload the unpacked extension and open it in a separate
window with disposable tabs. No extension-management restriction was bypassed.

After the user confirmed setup was ready, browser inventory showed the native
TabGrid page at `chrome-extension://jnoldienpoaboejiaffjjclafmojinfc/grid.html`
and a group named `testgroup`. Attempting to select the native grid was explicitly
rejected by the browser URL policy: only `http:` and `https:` are allowed. The
rejection also prohibits alternate control surfaces, indirect execution, or other
workarounds. No such workaround was attempted. Setup is no longer the blocker;
native acceptance now requires the user to operate Chrome and report results.
Inventory visibility confirms the page exists, not that its behavior works.

**No native-extension acceptance item is newly marked passed.** Native tab/group
ordering, pointer activation/cancellation, permission denial/grant and bookmark
writes, close/Undo and session recovery, live external changes, saved-group resume,
remote sessions, and split-Incognito isolation remain unverified. No real user
tabs, groups, bookmarks, or extension preferences were modified in these checks.
No production-code regression was established, so no speculative code fix was
made; existing working-tree changes were preserved.

Dark-mode and reduced-motion execution remain unverified (both media queries
were false during the fixture checks). Physical touch hold-to-drag, quick swipe,
vertical scrolling, multi-touch cancellation, selection-mode suppression, and
physical trackpad boundary behavior require user/device testing. A narrow
viewport and synthetic input cannot certify those hardware behaviors.


## Latest nine-refinement checks — 2026-09-27

This entry supersedes earlier feature descriptions of the removed saved-group
library and Other Devices view. Their three dedicated saved-library tests were
retired; seven new focus, preview, Undo, and event-propagation tests were added.
The current total is **50 tests**, all passing, with syntax and whitespace checks
also passing.

### Browser fixture results (simulated Chrome APIs)

- Reproduced first-click loss when moving focus from one card to another. The
  window blur listener was catching descendant element blur in capture mode.
  After changing it, one click activates a simulated tab, opens a different
  group, activates a group member, and selects each card in selection mode.
  A regression harness also checks that real window blur still cancels clicks.
- The complete page menu is reachable, New tab group creates a named group with
  one new tab, Select tabs reveals the toolbar, and single clicks select cards.
- Extension settings opens as a modal with Idle and gesture preferences. Changing
  Never to 7 days moves the old simulated group into Idle. Escape restores focus
  to the page-menu button. The private fixture omits the inactive/history views.
- Two-member groups render two previews and two empty cells. Five-member groups
  render three previews and `+2`; all four cells occupy the two-by-two layout.
  Group frames use blue/green native colors. Opening a group or member applies
  the last-opened frame; selecting another website restores the group's color.
- Dragging a group preview reordered its members as a block without opening the
  group or changing the highlighted website. SortableJS still owns the drag.
- Closing a simulated tab and using Undo restores it. Action tests simulate
  Chrome session activation and assert that the grid tab and its window regain
  focus, including partial restoration failure. Native focus behavior is pending.
- At 375 × 812, the 450 px size preference produced 343 × 257.25 px cards: 4:3,
  no horizontal overflow, and both header actions inside the viewport. The
  viewport override was reset afterward. Browser console showed no warnings or
  errors during the final private-fixture check.

Evidence: [grid and page menu](../output/refinements-2026-09-27/grid-and-menu.png),
[settings modal](../output/refinements-2026-09-27/settings.png).
These screenshots use simulated tabs and placeholder favicons, not user tabs.

### What is not certified

The native extension URL remains blocked by browser-tool policy. Native tab-strip
persistence, real permission prompts/bookmark writes, actual session activation
and return to the grid, service-worker lifecycle, native saved-group compatibility,
and split-Incognito isolation require user-operated Chrome checks after reloading
this version. Offline operation is supported by local dependencies/assets and
removal of remote-session calls; no real disconnected-Chrome run was performed.

Physical touchscreen hold/swipe/vertical scroll/multi-touch cancellation and
trackpad gesture behavior remain unperformed. Dark-mode and reduced-motion runtime
checks are also pending; the fixture checks above used light mode. Existing user
images and unrelated working-tree files were preserved.


## Eight further refinements — 2026-09-27

All 51 automated tests, syntax checks, and whitespace checks pass. The new test
covers six column levels, clamping, and migration from old pixel preferences.

Chrome-hosted HTTP fixture results below use **simulated Chrome APIs**:

- Search expands from 320 px to about 830 px at the tested desktop viewport.
  Search inside groups and Search groups appear on focus, remain available during
  checkbox clicks, and hide after focus leaves. A premature focusout collapse was
  caught and fixed by allowing the next control to receive focus first.
- Activating TabGrid project, opening/closing Research, and opening/closing its
  context menu leaves `tab:2` highlighted. No group inspection records activation.
- Top-left favicons appear in group tiles and member-card previews. Group member
  icons measured 6 px from the preview's top and left edges.
- Selected Research retains its blue native group tint; the selected last-opened
  tab retains dark blue (`rgb(79, 95, 152)`) while hovered.
- Context-menu opening retains the source-card frame and sets page overflow to
  hidden. Browser-generated scrolling leaves scrollY unchanged at 62 px. Menus
  inside group panels also set the group scrolling region's overflow to hidden.
  Escape closes menus, returns focus, and releases the appropriate scroll lock.
- Slider endpoints render six desktop columns and one full-width column. Three
  columns are shared by root and group grids. At 375 x 812, the responsive cap
  renders two columns; the page scrollWidth remains 375 px and group panel width
  is 327 px. Physical input is not inferred from this viewport simulation.
- Root group dragging reordered `[tab:2, group:7, tab:5, tab:6, group:200]` to
  `[tab:2, tab:5, tab:6, group:7, group:200]` without opening a dialog. Group-member
  dragging reordered `[tab:3, tab:4]` to `[tab:4, tab:3]`. Fixture DOM observation
  recorded ghost opacity `0` and transform animations on neighboring cards.
- Re-enabling drag animations exposed temporary Sortable copies retained by
  auto-animate during refresh. Copies now lack live identity where possible,
  reconciliation/order persistence require a real card model, and root fallback
  previews live outside the animated grid. Group fallback previews remain inside
  the modal so they are visible above its backdrop. Both drag checks passed with
  no status errors; the final console check reported no warnings/errors.

Evidence: [updated fixture](../output/further-refinements-2026-09-27/grid.png).
The temporary viewport was reset and the disposable fixture tab/server closed.
No native extension acceptance is claimed: extension-page access remains blocked
by browser-tool policy. Physical touchscreen/trackpad, real Chrome activation and
persistence, and dark/reduced-motion runtime checks remain unperformed.


## Drag animation stability — 2026-09-28

The prior eight-refinement checks established that animations ran, but did not
establish continuity during interrupted shifts. This follow-up addresses the
reported glitch rather than treating those earlier checks as sufficient.

Implementation now keeps Sortable hit boxes stationary and animates only inner
card surfaces through auto-animate's plugin API. Rapid insertions reuse current
visual offsets instead of restarting from a previous layout position. Temporary
copies, the placeholder, and the container are excluded. The inner surface also
survives card-content refreshes after native index updates. Sortable still owns
DOM reordering; auto-animate creates and controls all movement effects.

55 unit/action tests, syntax checks, and whitespace checks pass. Four new motion
cases cover temporary-copy exclusion, effects targeting surfaces rather than
slots, live reduced-motion preference handling, and interrupted-slide continuity.

Observed in Chrome using the **simulated HTTP fixture**:

- A fast rightward group drag moved Research across Music, Reading queue, and
  Design references. A reverse sweep restored the original ordering. Each sweep
  performed two insertions, including one while the preceding slide was active.
- A 32-tab group allowed a member to move across multiple cards and then into the
  next row, preserving all 32 card identities and their simulated native order.
- Fixture instrumentation recorded placeholder opacity 0, effects only on
  displaced surfaces, zero transformed outer slots, and a maximum discontinuity
  of 0 CSS px immediately across the observed insertions. The instrumentation
  panel now has fixed height so its changing diagnostics cannot move the grid.
- No dialog opened from dragging; no refresh error appeared. A normal click still
  activates a simulated tab, group panels still open, and a group context menu
  preserves the root last-opened marker, group tint, and scroll lock.
- The final browser console check reported no warnings/errors.

Evidence: [fixture after drag checks](../output/drag-stability-2026-09-28/fixture.png).
The disposable tab/server were closed and viewport reset. These observations do
not certify physical pointer smoothness, touch/trackpad behavior, or native Chrome
tab persistence. Native extension access remains blocked by browser-tool policy.
Dark/reduced-motion runtime checks remain pending; reduced-motion handling was
covered by a unit test only. Existing user changes were preserved; no commit/push.


## Icon and native-style menus — 2026-09-28

63 unit/action tests, syntax checks, and whitespace checks pass. Eight added
regression cases cover window labels, relative close boundaries, web-origin
filtering, grouped new-after placement, privacy/grid filtering for duplication,
site sound permission/state/failure/private-scope handling, and menu positioning.
The accepted Sortable/auto-animate movement implementation was not changed.

Observed in Chrome using the **HTTP fixture with simulated Chrome APIs**:

- Clicking New tab while a tab menu is open dismisses the menu and leaves the
  count at six. The equivalent group-panel click leaves Research at two members.
- Second clicks close card, Edit, and page menus. During testing a tall Edit menu
  covered its own opener and intercepted a second click as Ungroup. Placement now
  keeps that button exposed; the retest retained both selected cards and the
  intact Research group. Long menus scroll within the available space.
- Shift+Tab from the first action wraps to the last; Tab wraps back. Escape closes
  a window submenu while retaining its parent and focusing the submenu trigger.
- Right-clicking Research adds its two members to an existing one-tab selection.
  Right-click inside its group panel likewise adds a second member. Labels read
  Edit and Done. Existing selections remain checked after menu dismissal.
- New Tab After Selected inserts a new member between Research notes and
  Reference article, increasing the group from two to three members.
- Simulated Mute Site changes to Unmute Site on reopening. The mock records site
  settings; this does not prove native permission prompts or sound enforcement.
- Move Tab to Another Window contains New Window, a separator, and
  “Second window notes and 1 Other Tab”. Native-style menu sections omit the three
  excluded actions and retain existing extension link/selection actions.
- The icon preview decodes with natural dimensions 256 × 256. Direct navigation
  to the ICO was blocked as a non-page response; an image preview in the fixture
  verified decoding. This is not extension/action icon registration acceptance.
- At a confirmed 375 px viewport, menu bounds were left 47 / right 367 and
  top 8 / bottom 414.625 px. Page scrollWidth remained 375 px, and clicking the
  exposed opener dismissed the menu without changing the six-tab count.
- The browser console reported no warnings or errors during the desktop checks.

Evidence: [updated menus](../output/menu-refinements-2026-09-28/menus.png).
Disposable tabs/server were closed and viewport overrides reset. Native extension
access remains blocked by browser-tool policy. Real permission prompts, site
sound enforcement, window/tab persistence, icon registration, and physical
touchscreen/trackpad checks remain unperformed. No native result is inferred
from these fixture tests. No commit or push was made.

### Icon follow-up — unpacked-extension format correction

The prior HTTP image-decode test did not establish toolbar compatibility. Chrome's
[action API documentation](https://developer.chrome.com/docs/extensions/reference/api/action#icon)
requires PNG images for unpacked extensions, although packed extensions accept ICO.
The supplied ICO declares 256×256 but embeds a 512×472 PNG. That original PNG was
extracted byte-for-byte to `tileIcon.png`, with all PNG chunk checksums validated;
the source ICO and artwork were not altered. Manifest, page favicon, fallback,
and fixture references now use PNG. Syntax and whitespace checks pass. Native
icon appearance still needs confirmation after reloading the unpacked extension.


## Group panel actions — 2026-09-28

Chrome-hosted fixture checks (simulated Chrome APIs) verified:

- Header order is New tab in group, Group options, Close group panel.
- The options menu separates Edit Group, Select Tabs, and Delete Group.
- Outside clicks dismiss the menu without closing the group panel; the opener's
  second click closes it, and Shift+Tab wraps within its actions.
- Select Tabs reveals the group selection toolbar; Done hides it again.
- Edit Group saves the simulated group name/color and returns focus to Group
  options. Delete Group opens confirmation; Cancel preserves the group. New tab
  in group increased the simulated member count from two to three.
- At 375 px, panel clientWidth and scrollWidth both measured 325 px. All three
  header buttons remained in order within the panel; menu bounds were 47–367 px.
- No browser console warnings/errors were reported. The viewport was reset and
  the disposable tab/server closed.

Evidence: [group menu](../output/group-menu-2026-09-28/group-menu.png).
Syntax checks and the existing 63 tests pass. Native Chrome and physical touch
behavior remain unverified; the accepted reorder implementation is unchanged.
