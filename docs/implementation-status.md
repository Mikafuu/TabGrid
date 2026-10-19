# Implementation status

## Refined Claymorphism material — 2026-10-01

Claymorphism now uses floating inflated tiles, rounded molded buttons, outlined
soft fields, individual raised navigation buttons, and sculpted menus/settings.
One outer shadow and two inner shadows follow the codeAdrian/clay.css material
recipe. Light/Dark, fonts, secondary tints, native group colors, and last-opened
priority remain independent. This is original local CSS; no package, remote
texture, runtime asset, or dependency was imported.

Interface settling uses the existing auto-animate owner at 240 ms. Sortable order,
stable outer slots, interrupted inner-surface reorder at 120 ms, and transparent
ghost remain unchanged. Motion settings cancel movement; dialogs only fade so
the fixed drawer retains viewport coordinates. Focus and forced-color fallbacks
remain available.

131 automated tests and 27 Chrome-hosted HTTP-fixture assertions pass. Root/group
rapid reorder measured zero continuity jump; motion-off dragging retained ordering
without movement effects. Four-edge drawer docking, aligned controls, menu focus,
Undo, narrow settings keyboard navigation, and persistence passed. Native extension
and physical disconnected acceptance remain pending. Existing user changes are
preserved. See verification.md and appearance.md.

## Refined Neumorphism material — 2026-10-01

Neumorphism now uses a shared matte canvas, convex card surfaces, consistent
upper-left light, opposing soft shadows, recessed fields/navigation, and raised
action buttons. Settings, filters, menus, previews, and the edge drawer share the
material. Light/Dark, fonts, secondary tints, native group colors, and last-opened
priority remain independent. The local CSS is inspired by adamgiebl/neumorphism;
no generator, React runtime, remote asset, or dependency was imported.

Interface settling uses the existing auto-animate owner at 200 ms. Sortable order,
stable outer slots, interrupted inner-surface reorder at 120 ms, and transparent
ghost remain unchanged. Motion settings cancel movement; dialogs only fade so
fixed drawer coordinates stay intact. Focus rings and forced-color fallbacks remain.

130 automated tests and 29 Chrome-hosted HTTP-fixture assertions pass. Root/group
rapid reorder measured zero continuity jump; motion-off dragging retained ordering
without movement effects. Four-edge group drawer docking, aligned controls, menus,
keyboard/narrow settings, material isolation, and persistence passed. A calculated
44-palette contrast check prompted lighter gradient shading in one Light tint.
Native extension and physical disconnected acceptance remain pending. Existing
user changes are preserved. See verification.md and appearance.md.

## Refined Glassmorphism material — 2026-09-30

Glass now uses translucent frosted panes, luminous beveled rims, pill controls,
a shared navigation lens, etched search fields, and floating menus/settings.
The stationary folded canvas reveals the material without moving the content.
Light/Dark, all secondary tints, bundled fonts, assigned group colors, and
last-opened priority remain independent. This is local CSS inspired by liquidGL;
its GPU renderer and rasterizer are not imported.

Glass interface transitions use the existing auto-animate owner at 220 ms.
The accepted 120 ms interrupted reorder remains unchanged: stable outer slots,
moving inner card surfaces, Sortable-owned ordering, transparent ghost.
Dialogs fade without transforming fixed drawer coordinates. Reduced motion
disables movement, and reduced transparency uses opaque, unblurred surfaces.

129 automated tests and 34 Chrome-hosted HTTP-fixture assertions pass. Root and
group reorder continuity measured zero jump; motion-off dragging had no animated
surfaces. Menus, filter alignment, settings keyboard navigation, pointer/keyboard
drawer docking, persistence, and the simulated opaque CSS fallback passed.
Native extension and physical disconnected acceptance remain pending. Existing
user changes are preserved. See verification.md and appearance.md.

## Refined Flat material — 2026-09-30

Flat now has solid segmented navigation, stronger titles, small crisp corners,
filled controls, squared switches, and matching menus/settings, inspired by
Designmodo Flat UI. Existing layout, fonts, secondary tints, group colors, and
features are preserved. No runtime network assets or new dependencies were added.

Flat interface motion uses the bundled auto-animate for surface entry/exit,
settings changes, card resizing/disclosure reflow, and drawer expansion/docking.
Sortable and the accepted stable-slot/inner-surface reorder architecture retain
ownership. Motion preferences and live system reduction cancel/disable effects.
Native close releases focus and interaction immediately while exit paint fades.

127 automated tests and 34 Chrome-hosted HTTP-fixture assertions pass. Tests cover
interrupted layout captures, scrolled coordinates, effect ownership, reduced
motion, and closing-surface accessibility. Root rapid reorder and group
row-crossing measured zero continuity jump; disabled motion had no active surface
effects. Native extension and physical network-disconnected acceptance remain
pending. See verification.md and appearance.md.

## Search focus and edge-drawer refinements — 2026-09-30

All ten requested refinements are implemented locally. Automatic search focus
keeps history hidden until clicking or typing, independently in root/group panels.
The page menu has inline Show all windows and separate regular/private window
creation. Hidden filters leave space below search. New groups use visible native
color swatches. Existing group choices share color/name labels, including Idle
protection and Add to Group. Exclusion buttons have equal widths, and Settings
closes on an outside backdrop click.

Group destinations default on for new installations, preserving saved off choices.
The flush-edge half pill is movable as a fixed full pill, resizable at its ends,
and expands horizontally on every edge. Whole-group drags show only Ungroup;
dropping resolves live members without losing tabs. A fast-drag timing issue found
in the fixture was fixed by checking pointer proximity when dragging starts.
The accepted stable-card Sortable/auto-animate implementation is unchanged.

114 automated tests and 54 Chrome-hosted HTTP-fixture assertions pass. The fixture
uses simulated Chrome APIs; native extension acceptance and disconnected acceptance
remain pending. Physical touchscreen checks were not performed. See verification.md.

## Desktop usability refinements — 2026-09-30

Implemented all 22 requested refinements, including the follow-up clarification:
Search remains beside Sort/Card size and fills only the remaining row width.
The earlier five material styles and secondary tints remain available.

- Drag/reorder now works across all-window sections and within a group-only
  filter. Cross-window tab and whole-group drops preserve the landing position.
  Other restrictions allow destination moves without reordering and show a reset
  tip. Sortable still owns order; auto-animate still moves only card surfaces.
- Website/group pickers use phrase matching and toggle on a second arrow click.
  Main member/name options moved to Settings; All windows moved to the page menu.
  History supplies phrase-matching recommendations with the configured maximum.
  Result activation respects independent retained queries.
- Default sizing is four columns, preserving saved sizes. Window labels compact
  on close; creation events and session storage track new windows. The initial
  already-open window set uses Chrome enumeration order, as historic creation
  timestamps are unavailable. Card window/group details are independently optional;
  group identity appears only in main member-search results.
- Stay-in-grid creation scrolls to the new tab/group. Selected cards use a filled
  top-left circle. Swipe closure, its preference, listeners, and styles are removed.
- Matching targets are one dropdown. History/custom duration/closing threshold/
  capture exclusions unfold only when applicable. Website exclusions use add/remove
  items; protected groups use switches. Undo stores milliseconds (default 5,000);
  old seconds migrate without changing duration. Keyboard hints are at the top,
  reset has spacing, and the backup chooser matches the other controls.

110 automated tests pass: seven focused tests were added and three obsolete swipe
checks removed. 27 Chrome-hosted HTTP-fixture assertions passed with simulated
Chrome APIs. Browser testing caught and fixed cross-window append-only positioning
and a CSS specificity conflict on the selection circles. Native extension access
was denied by URL protocol policy; no bypass was attempted. See verification.md.

## Material styles and compact controls — 2026-09-30

Completed the searchable Website/Group pickers (exact text matches, native favicon
or group-color marker, expand-all, keyboard selection), uniform 40 px filters and
group-header buttons, switch presentation for boolean controls, and native-colored
group drawer targets with neutral New group/Ungroup destinations.

Added independent Classic / Flat / Glassmorphism / Neumorphism / Claymorphism
styles in Appearance. Existing 22 themes are secondary color tints when a new
material is selected. Light/Dark/System and bundled fonts remain independent.
Existing installations retain Classic. Backups validate and preserve the style.

106 tests pass. In-app-browser fixture checks cover controls, material rendering
in both modes, persistence, and narrow settings. This pass does not claim native
Chrome or pointer/drag verification; see verification.md for explicit limits.


## Appearance personalization - 2026-09-29

Added an Appearance category with Light, Dark, and Follow system; 22 theme presets
covering the requested skills' named aesthetic and palette families; and six font
choices (five locally bundled fonts plus System font). Mode, theme, and font are
independent, persist locally, and round-trip through validated settings backups.
Motion and card details moved into Appearance. Existing choices migrate safely.

103 automated tests pass. Chrome-hosted simulated fixtures exercised all 44
light/dark theme combinations, six font choices, reload persistence, keyboard
navigation, 375 px settings, and reorder with motion enabled/disabled. Native
extension and physical touchscreen checks remain pending. See appearance.md for
the complete catalogue, offline font attribution, and adaptation of the skills.


## Calm editorial UI redesign — 2026-09-29

The user-selected warm-neutral direction is implemented in theme.css, with a
locally bundled Geist font, clearer page hierarchy, coordinated menus/cards,
assigned group-color dots, grouped settings fieldsets, dark palette, and narrow
layouts. Live filters now use native disclosures that retain active restrictions
and show their count while collapsed. A skip-to-tabs link improves keyboard access.

97 automated tests pass. Fixture checks cover local font loading, filters and
collapsed active counts, settings changes/category keys, shared group menus,
card resizing, skip navigation, 375 px layouts, and both motion settings. Rapid
reorder still reports no animated slots and no jump with movement enabled.
Dark styling was checked through fixture CSS emulation. Native Chrome extension
and physical touch checks remain pending. No remote runtime assets or new animation
library was added; existing changes and the accepted reorder ownership are preserved.
See design-notes.md and verification.md for evidence and adaptation of the skills.

## Menu, history, and group-drawer refinements — 2026-09-29

Implemented all six follow-up tweaks. Open menus suppress unrelated card hover
styles while retaining selected/last-opened/source colors. Group destinations now
use a narrow fixed drawer, collapsed by default, expanding near a dragged tab and
collapsing after a drop. Its handle can be dragged to any edge; edge/offset persist
locally, are validated, and are included in settings backup. Keyboard docking and
selected-tab destination actions are available. No grid layout moves during expansion.

Removed live tab/group suggestions and their settings. Enabled search history is
shown independently below both search fields on focus. Result activation records
the query when opted in, clears the field, and saves the cleared session state,
including when query memory is enabled. History remains off by default and absent
in private mode; existing retained records and expiry/count settings are preserved.

Both group-menu entry points share their name/color editor and action builder.
Group menus omit Reload, Duplicate, Pin/Unpin, and Mute/Unmute Site. The panel menu
also omits both relative-close actions and retains filtered close boundaries.

97 automated tests and syntax/whitespace checks pass. Chrome-hosted fixture checks
cover root/group result consumption, history reuse/opt-out, shared menus, drawer
docking/reload, drag expansion/drop, selected-tab grouping, narrow bounds, and
stable reorder continuity. These use simulated Chrome APIs. Native extension
access and physical touch/trackpad acceptance remain pending. Existing changes
are preserved; no commit or push was made.

## Offline personalization — 2026-09-29

The approved 17-item settings plan is implemented locally. Extension Settings now
has six vertical categories: General, Search & Filters, Tabs & Groups, Previews &
Storage, Keyboard, and Backup. Preferences have a versioned shared model,
validation, legacy migration, worker serialization, and live subscriptions.

Implemented behavior includes independent query/scroll/scope memory, anchored
session restoration, phrase/all-words matching, individually hidden live filters,
filtered selection/actions, local opt-in history and keyboard-accessible
suggestions, new-tab activation preferences, blank-space selection, shared close
confirmation policies, custom Undo/Idle durations, site/group idle protections,
card information and motion settings, page shortcuts/help, local preview budgets
and exclusions, capture-race invalidation, and validated settings backup with an
explicit Apply step and a value-by-value change summary.

Preferences/history use local storage. Root view state is keyed by window; group
view state is keyed by group, so it follows window moves. Both use session storage
with separate private namespaces. Private history/captures are never recorded;
normal history, cache management, and backup controls are disabled in private UI.
No cloud/server service or remote asset was added; connection requests are denied
by the extension CSP.

Verification found and fixed hidden tabs entering filtered relative/window close
commands, a header-collapse shift at drag start, stale duration-preset labels,
and per-window group-state storage. The accepted stable-slot/inner-surface
Sortable/auto-animate architecture remains intact.

93 automated tests pass. Syntax and whitespace checks pass. Chrome-hosted fixture
checks cover settings persistence/validation, independent query and group scroll
restoration, filters/selection, shortcut editing, new-tab modes, close boundaries,
private controls, 375 px category navigation, and both motion preferences.
A loaded fixture also passed settings/search/cached-preview/close/Undo/local JSON
creation checks after its HTTP server was stopped, under a no-connect CSP.

**Native acceptance is still pending**, including a genuinely disconnected Chrome
extension run, browser-wide shortcuts, real screenshot capture, worker suspension
and restart, and physical touchscreen/trackpad behavior. The browser tool blocks
native extension-page access. Backup file-picker execution is additionally blocked
by the browser-control extension's missing file-URL permission; import validation,
preview/apply separation, and round-trip behavior pass automated tests. See
[verification.md](verification.md) for the exact scope. Existing user changes,
including the prior icon deletion, are preserved. No commit or push was made.


## Group panel actions — 2026-09-28

New tab in group and Group options now sit before the close button in the panel
header. Group options separates editing, selection, and deletion. Edit Group
opens a name/color form; Select Tabs reveals the existing selection toolbar;
Delete Group retains confirmation and Undo. Shared menu focus containment and
second-click dismissal are reused. Desktop and 375 px Chrome-hosted fixture
checks pass; these simulate Chrome APIs, not native extension acceptance.

## Icon and context-menu refinements — 2026-09-28

The extension/action/page icon now uses the supplied `tileIcon.ico`. Menus use
manual dismissal with captured outside input and contained keyboard focus.
Second opener clicks close the menu; placement keeps openers exposed and scrolls
long menus when needed. Selection mode adds unselected cards on right-click and
uses Edit / Done labels. Tab, group, and selection menus share the requested
native-style action sections, including new-after-selection, duplicate, site
sound, Reading List, and relative closes. Window choices separate New Window
from existing windows named by their first tab and remaining count.

The accepted reorder animation is unchanged and recorded in the requested memory
note. 63 tests, syntax checks, and whitespace checks pass. Chrome-hosted fixture
checks cover outside-click suppression, repeat-click dismissal, Tab wrapping,
submenu Escape, root/group right-click selection, new grouped-tab placement,
site-sound menu state, window labels, narrow-screen bounds, and ICO decoding.
A tall-menu overlap regression was found and fixed during these checks.

These are simulated Chrome APIs. Real icon registration, permission prompts,
site sound enforcement, tab-strip changes, and physical touchscreen acceptance
remain unverified because native extension-page access is blocked by browser
policy. Existing user changes are preserved; no commit or push was made.

## Drag animation stability fix — 2026-09-28

Fixed the animated-hit-box feedback loop. Sortable moves stable outer card slots;
auto-animate animates an inner surface through its plugin hook. Before each native
Sortable insertion, current visual offsets are captured so interrupted slides
continue from their visible position. Temporary copies, the invisible placeholder,
and the grid container receive no effects. Reordering is not delayed while a
slide is running. Card surfaces survive refreshes so index updates do not cut off
an active animation. Existing colors, controls, and sizing are retained.

55 tests and syntax/whitespace checks pass. Chrome-hosted fixture checks cover
fast forward/reverse moves and multi-row group reordering. DOM measurements found
zero animated hit boxes and no position discontinuity at insertion in those runs.
This is simulated Chrome data; native extension and physical touch checks remain
unverified. See the latest verification entry for scope and evidence.

## Latest scope — eight further refinements, 2026-09-27

Implemented top-left preview favicons, focus-expanding search/options with the
Search groups label, activation-only last-opened tracking, matching selected/hover
colors, context-menu scroll locking and retained frame color, six discrete sizing
levels shared across grids, and invisible drag placeholders with auto-animate
neighbor movement. Narrow layouts cap columns at three (900 px) or two (650 px).

Browser checks caught and fixed search focus dismissal and temporary Sortable
copy reconciliation during animated drag. Both root and group reorder passed
after those fixes. 51 automated tests, syntax checks, and whitespace checks pass.
Browser evidence uses simulated Chrome APIs only; native and physical touchscreen
acceptance remain pending. Existing user changes are preserved; no commit/push.

## Previous scope — nine refinements, 2026-09-27

The latest nine requested changes are implemented locally:

1. Removed the separate saved-group library and Other Devices UI, worker actions,
   and remote-session calls. Chrome's own open native groups remain supported.
   Old saved-copy storage is untouched. All UI dependencies/assets are local.
2. Added a last-opened marker per window for a website or group. Opening TabGrid
   leaves that marker intact; a highlighted member also highlights its group.
3. Hover now colors the entire card frame.
4. Whole group frames use the native group color, overridden by last-opened color.
5. Added two-by-two group previews with empty slots and an exact remainder tile
   (five tabs show three members plus `+2`).
6. Added the top-right vertical-dot menu with Refresh, New Incognito window,
   New tab group, Close tabs in this window, Select tabs, and Extension settings.
   The settings modal contains optional gestures and the Idle threshold.
7. Removed the redundant Open tabs heading and renamed its navigation item Tabs.
8. Fixed the first-click regression: window blur was registered in capture mode,
   so focus changes between buttons cancelled clicks. Window blur now listens
   without capture. Pointer jitter tolerance is 6 px, rendering waits until the
   pointer gesture finishes, and card-body activation uses a stable card handler.
9. Undo returns to the requesting grid tab/window, including after partial failure.
   The worker obtains that identity from the message sender.

Validation: 50 automated tests plus current Chrome-hosted **simulated** fixture
checks pass. No native acceptance result is inferred from them. The browser tool
still prohibits `chrome-extension://` access; physical touchscreen checks remain
unperformed. No commit or push was made. See the latest entry in verification.md.

## Historical implementation before the latest scope change

All seven stages from the original workflow are implemented locally, including
stage 7's optional gestures. Native-extension acceptance checks remain separate.

| Stage | Implementation |
| --- | --- |
| 1. Dependable tab actions | Shared selection/actions, live refresh, structured close/undo, worker serialization |
| 2. Everyday grid controls | Selection toolbar in both grids, pinned section, explicit window-wide close policy |
| 3. Search and sessions | Open/Recently Closed/Other Devices, session restore, local copies of remote tabs |
| 4. Idle tabs | Configurable age, whole-group classification, return to active, restart-safe recency fallback |
| 5. Saved groups | Durable save, verified save-and-close, reopen/resume, delete saved copy |
| 6. Bookmark/read-later/share | On-demand permissions, bookmarks, Reading List deduplication, copy links |
| 7. Private mode and gestures | Split Incognito/privacy guards, opt-in group drop targets and touch swipe-to-close |

Requested refinements: anchored context menus with grouped functions, flyout group/
window choices, inline group name/color editing, and 4:3 cards across sizes.

Both gesture settings default off. Automatic idle-tab closing and native Chrome
saved-group synchronization are outside the implemented workflow. No automatic close
schedule or imitation of native group sync has been added.

Validation: 46 automated tests plus browser UI sandbox checks. See
[verification.md](verification.md) for exact evidence and native/hardware checks still
needed. Tests in the sandbox use simulated Chrome data and do not validate Chrome's
permission prompts, real sync, or real private-window isolation.


## Approved UX refinement plan

All 11 requested refinements are implemented locally. The original seven-stage
work remains in this checkout; unrelated images, `.DS_Store`, and output files were
not changed as part of this refinement.

- Tab and group cards drag from their bodies; controls are excluded and pointer
  intent suppresses accidental activation. Selection disables drag/swipe.
- Selection uses a grouped More menu and hides per-card action buttons.
- Group panels have fixed headers, backdrop dismissal, contained scrolling, and
  explicit Delete group confirmation.
- Idle defaults to Never; saved thresholds and size preferences are retained.
- Bookmark destinations support existing folders and new subfolders.
- A continuous 220–450 px slider preserves 4:3 cards.
- One transient, operation-specific Undo toast works in both grid contexts.
- All-window views have separate window/pinned sections and shared selection.

Verification on 2026-09-26: 46 unit/action tests and syntax checks pass. Browser
fixture checks found and resolved an Undo timer receiver error. Window sections,
selection menu/hidden controls/drag rejection, whole-card tab/group reorder,
bookmark destination persistence, Idle Never default, 450→449 px resizing,
modal Undo, backdrop dismissal, and group scroll containment were verified with
simulated tabs. See verification.md for remaining native and touch checks.

Next unfinished step: complete native Chrome acceptance and physical touchscreen
tests. Native results must not be inferred
from the simulated fixture. No commit or remote push was made for these refinements.

Follow-up on 2026-09-27: all 46 tests, syntax checks, and whitespace checks still
pass. Additional Chrome-hosted fixture checks passed for a 375 px light-mode
layout, group-card Enter/Space activation, Escape focus restoration, and simulated
scroll containment at both group boundaries. The user subsequently completed
reload/setup, and Chrome inventory confirmed the native TabGrid page exists.
Opening that page was explicitly blocked by the browser tool's URL policy, which
allows only HTTP/HTTPS and prohibits alternate-control workarounds. Native checks
therefore require user-operated Chrome testing, not another reload.
Native acceptance, dark/reduced-motion execution, and physical input
checks remain pending. No production code was changed in this follow-up. See the
dated verification entry for evidence and limits.

Icon follow-up: unpacked Chrome toolbar icons require PNG. The ICO's original
embedded PNG is now extracted losslessly as `tileIcon.png`, and all active icon
references use it. The earlier fixture's ICO decoding did not certify toolbar
compatibility. Native appearance remains pending extension reload/verification.

### 2026-10-08 — Small navigation refinements

Idle navigation now follows the configured duration and falls back to Tabs when disabled. Main-page actions and settings category tabs use bundled, licensed Google Material outlined icons. Group New tab shares primary action colors across material styles. All-window sections put the current window first without changing window numbering or the remaining creation order.

### 2026-10-08 — Drawer, headers, and motion controls

Simplified the group destination drawer to a blank fixed-height handle, left/right docking by page half, and wrapped targets capped at one-third of viewport width. Expanded height grows with rows, with overflow scrolling for long lists. Legacy top/bottom placements migrate to a side.

Title/action headers remain visible in the page and group panel; search/filters scroll, with source categories beneath them. The search shortcut scrolls the relevant field into view. Removed the redundant favicon in the corner of full group-member previews. Appearance now offers Reduce animations and Efficient/Standard/Smooth speed choices with visual symbols. Standard preserves existing reorder timing; speed changes retain Sortable/auto-animate ownership. Group entry and other UI reveals now also work in Classic; system reduced motion remains respected.

### 2026-10-09 — Menus, settings search, and window sections

Submenu hover waits 160 ms for the first opening and switches immediately when a submenu is already open; keyboard and click opening remain immediate. Menu reveals use opacity only. The page menu follows its sticky header, whose background spans the viewport. Only main-grid tab/group menus fold the header away. Returning from Recently closed uses card fades without stale layout travel; applying a live-tab filter there returns to Tabs.

Settings now has a sidebar search with setting/category results, keyboard navigation, and focus/scroll to the selected control. All-window sections have tinted, keyboard-operable accordion headings; collapsed sections are excluded from visible selection. The existing Sortable and stable-card motion architecture is preserved.

### 2026-10-10 — Motion follow-up (Classic verification)

The sticky header now keeps a stationary animation anchor and moves only its visual surface, so folding still animates below the page top. A single foreground border spans the entire header edge. Window accordions animate measured height and opacity while collapsed content becomes inert immediately. Group entry and its asynchronous session restoration use fade-only card effects; card-size track progress animates between values without a preference-save notification cancelling it.

Expanded drawer height follows its rows. Docking applies immediately and serializes persistence, with the latest local placement protecting against stale notifications; quick pointer releases are recognized even without an intermediate move. Drawer proximity suspends grid insertions while leaving group receivers available and restores reordering outside the approach area. Fallback tab copies shrink over group targets; group copies lose their frame and spread four preview tiles over Ungroup. Single-tab drags hide Ungroup. All feedback leaves live Sortable slots untouched and uses reusable auto-animate anchors.

### 2026-10-10 — Control and popup interaction polish

Drag outlines now belong to the moving card surface: they shrink with grouping feedback and fade with the group frame over Ungroup. The range input retains native mouse/keyboard behavior, while a foreground knob and track share one animated progress value. Tint families use accessible disclosure buttons, measured collapse/expand effects, and the same rotating downward triangle as Filters. Animation speed has space above its legend.

Submenu hover uses a short first-open delay and immediate switching once a submenu is open. The browser-only timer receiver error that prevented hovering has been corrected and covered by a regression test. Group creation from the page, context menu, dropped cards, or selected drawer cards uses the name/color dialog; drawer paths do not mutate tabs until submission. Action dialogs dismiss on a complete outside click, preserve inside interactions, and restore focus. Existing menus, filters, group panels, and settings retain outside dismissal.

### 2026-10-10 — Hover-only submenu revision

Supersedes the earlier delayed-opening behavior: submenus now open immediately on hover, without a click or ArrowRight opening path. The parent item and its submenu form one hover region, so actions remain reachable. Leaving both starts the existing opacity exit immediately; there is no dismissal timer. Async submenu population still checks its revision and cannot reopen a dismissed menu.

### 2026-10-10 — Submenu visual dismissal and delayed entry

Supersedes the immediate-opening revision above: every hover entry now waits 150 ms, including switching between submenu items. Leaving the parent/submenu region starts dismissal without a timer. Quick pointer passes and closing the parent menu cancel pending entry. Clicks still do not toggle submenus.

Fixed the actual visual dismissal bug: auto-animate had already assigned the nested submenu to its parent observer, so its opacity plan was never consumed by the submenu observer. The parent observer can now consume the nested surface's plan. This preserves auto-animate ownership and opacity-only fades while eliminating the fully opaque hold during the native popover's discrete exit.

### 2026-10-11 — Fresher tab previews

The toolbar and extension shortcut now attempt a final capture before activating TabGrid, with a 1-second upper bound on the extra wait and cancellation of expired work. A user tab switch during that wait is respected. Direct switches to an already-open grid retain the latest cached preview.

An idempotent, isolated-world script attaches to active HTTP(S) tabs, including tabs open when the extension reloads. It sends only an activity signal after 400 ms of settled scrolling/input/clicking/resizing, at most once every 2 seconds, while visible and focused. It does not read keystrokes, field values, or page content, and stops pending work when hidden or capture is disabled/excluded. Incognito is excluded. There is no idle polling, tab reactivation, new permission, or network service.

Activation, load completion, and window focus continue to refresh eligible tabs. Screenshot calls are serialized across windows with at least 600 ms between starts; requests wait rather than disappearing under the old per-window throttle. Active-tab/URL checks, invalidation tokens, preferences, deadlines, and storage limits are rechecked. Frequent writes trim using index metadata and byte counts rather than rereading every cached image.

### 2026-10-11 — Faster opening with fresh previews

The extra pre-open capture budget is now 250 ms instead of 1 second, including initialization and freshness checks. Last-opened bookkeeping no longer blocks opening behind unrelated queued actions. A saved preview can be reused for 1.5 seconds only when a top-frame activity query confirms the same document instance and interaction revision. Revisions change immediately on events, before the settled/throttled capture signal. If tracking is missing or the query takes more than 50 ms, freshness is unconfirmed and the normal bounded capture path applies.

Screenshot acquisition and source-tab validation now finish separately from serial saving/eviction. Once confirmed, those pixels may save after TabGrid opens; ordinary activation invalidates unfinished acquisition only. Clear, navigation, preference changes, exclusion, and closed-tab checks still prevent invalid pending saves. Thumbnail quality remains JPEG 40. Direct tab switching still uses the latest cached preview.

### 2026-10-11 — Screenshot quality preference

- Added Screenshot quality under Previews & Storage, shown when Capture screenshots is enabled. Low / Standard / High map to JPEG quality 20 / 40 / 80; Standard preserves the previous capture setting.
- Each future capture reads the saved quality. Existing previews remain unchanged until refreshed. Validation, legacy preference defaults, backup export/import, settings search and regular-window-only management include the new preference.

### 2026-10-12 — Custom backgrounds

- Appearance now offers local JPG / PNG / WebP uploads, an image preview, replacement/removal, and live background transparency (0–100%) and blur (0–40 px) controls. Reset appearance removes the image and restores adjustment defaults in regular windows.
- Background images are separate from preferences and excluded from settings backups. Uploads are re-encoded to WebP without original metadata, limited to 15 MiB input / 40 million pixels, downscaled to a 2560 px longest edge, and capped at 4 MiB stored. No remote uploads or new permissions.
- The fixed decorative layer ignores pointer input and leaves existing cards, dialogs, menus and headers intact. Background changes sync through Chrome storage events. Management is disabled in Incognito. Forced colors and reduced transparency hide the decorative background.
- User's existing manifest edits were preserved byte-for-byte.

### 2026-10-14 control refinements

Added shared hover-state transitions, including interpolated glass tint for wallpaper-backed cards; repaired group color radios and selected-card hit-surface fills. Unified searchable filter fields and arrow focus handling, rounded filter toggles, padded tint headings, made the glass header span the viewport with four rounded corners, and styled drawer targets/status tips translucently. Grid focus outlines now follow selection mode. Show all windows clears collapsed state when enabled. Window press feedback is restrained, closed filters lose their focus tint, and Flat category hover text remains readable. No GPU optimization or submenu intent changes were made in this pass, per request.

### 2026-10-14 — Glass performance, crop controls, and menu travel

- Glass lenses share cached wallpaper textures at each render resolution. Wallpaper blur and upload happen only when the image, crop, appearance, or viewport changes; lenses copy their region on the GPU. Scrolling temporarily caps resolution at 1x and restores the normal cap after 145 ms. Idle rendering still stops, and hidden surfaces release their resources.
- Context submenus retain the 150 ms hover opening delay. A directional triangle toward the visible submenu permits diagonal travel across neighboring items for up to 350 ms; leaving that route or leaving the submenu closes it immediately. Destructive actions retain their red text in all materials.
- Background preview matches the page aspect ratio and supports pointer dragging, arrow-key positioning, 100–300% zoom, horizontal/vertical position sliders, and Reset crop. Changes are nondestructive preferences; uploading a replacement resets the crop. Incognito cannot change these settings.
- Settings search results and speed choices use glass-compatible tints; result rows have 8 px corners. Classic/Flat Filters use the theme surface background. Available styles are Classic, Flat, and Glassmorphism; saved Neumorphism/Claymorphism choices migrate to Classic. Historical source styles and credits remain intact.
- All windows initially expand. User collapse choices now survive scope toggles and reloads in the same TabGrid session. Expanded window content reserves 6 px beyond its clipping edge for card rings; closed sections remain clipped.
- Root overscroll is disabled so a short page cannot expose wallpaper above the header. The header still paints its background above the surface.

## 2026-10-15 — Card gestures and menu refinements

- Website icons have a neutral light backing, including group tiles and missing-preview icons, so transparent dark artwork stays visible in dark themes.
- Color tint options sit immediately below the current tint summary, before custom backgrounds. Glassmorphism displays a battery-use note.
- Native context menus use a fixed optical frame and a bounded inner scroller. Native popup fades have independent auto-animate drivers, avoiding parent replay on first submenu insertion. Arrow Right opens a submenu for keyboard users; pointer timing/corridor behavior remains unchanged.
- Settings search jump highlights clear on outside pointer presses and dialog close.
- Swipe-to-close defaults off. Mouse, touchpad, or both are independently selectable. Mouse dragging starts after a 250 ms hold when mouse swiping is enabled. A close requires horizontal dominance of 1.6:1, at least 60 ms, and 35% of card width clamped to 96–160 px. Touchpad momentum cannot close another card until 180 ms of wheel inactivity. Close confirmation and Undo use the existing tab-action path.
- Group tabs by dragging defaults on. Holding over the central 60% of a compatible card for 350 ms arms grouping. Pinned/self/same-group drops are excluded. Dropping onto an ungrouped tab opens the existing new-group dialog.
- Leaving a group panel by 24 px (reduced to half the available margin on narrow viewports) offers ungrouping. After 450 ms outside, the panel closes and the Sortable fallback copy moves to the main page; the live slot stays under Sortable's ownership. A continued drop can join another group or land in main-grid order. Escape/blur cancels the final mutation.
- Show group drop targets now defaults off. Explicit saved on/off choices remain intact.
- Gesture choices are validated and included in settings import/export. The local manifest edit and README credits are preserved.

## 2026-10-15 — Touchpad swipe follow-up

- Horizontal wheel input moves the card in content direction and suppresses page scrolling, including trailing momentum. Partial swipes persist across idle pauses and can be continued or reversed; Escape, an outside click, vertical scrolling, or losing focus resets them.
- Removed the background indicator. The moving surface fades to zero opacity at the close distance and its slot stacks above neighboring cards; expanded window sections no longer clip its sideways movement.
- Successful closes no longer animate back before removal. Confirmation/failure restores cards that remain open. Layout effects leave parked swipes under their gesture controller's ownership.
- Native tab-index changes update card models without rebuilding their preview contents. Activity and preview snapshots load concurrently, reducing unnecessary work before neighboring cards move.

## 2026-10-15 — Compact settings help and close-layout correction

- Instructional settings tips now appear through adjacent info buttons and themed top-layer tooltips. Hover, focus and click reveal help; Escape, outside interaction, settings scrolling and closing dismiss it. Setting labels retain explicit accessible associations; info clicks do not toggle their settings. Dynamic status/error text and descriptive style/color labels remain visible.
- Classic/Flat tips follow their surface tokens; Glass uses a small translucent blurred surface without an extra optical canvas.
- Fixed two close-reflow causes: retired nodes reinserted by auto-animate temporarily occupied grid slots, and an ignored mutation batch left stale captured coordinates for the next refresh. Retired nodes now stay out of flow, and captures expire at the next frame. Sortable and auto-animate retain their existing responsibilities.
- Touchpad momentum now resets unfinished swipes and cannot trigger a close. A pause without momentum still cannot identify whether fingers are touching the pad; see `chrome-grid-interaction-research.md`.

## Android-style grouping and swipe rearming — 2026-10-16

Direct grouping uses Chromium's strict 50% card-overlap threshold and highlights immediately, without the prior 350 ms dwell. Grab offsets are preserved. Group panels show a bottom removal area during dragging; release there ungroups and re-entry cancels. New groups retain name/color setup; remaining group members keep their panel open. Outside-panel continuation was restored in the follow-up below.

### 2026-10-16 — Settings alignment and restored group continuation

- Settings help buttons are 18 px with a 12 px icon, aligned with their caption and separated by 4 px. Tooltips prefer the right side, with viewport-aware left/below fallback; themed surfaces and keyboard dismissal remain intact.
- The live “Color tint: …” summary is immediately below the Color tint legend and above the palette families.
- Holding a dragged group member beyond the panel margin for 450 ms closes the panel and continues the same drag on the main grid. Only the fallback copy moves to the page; Sortable retains ownership of live card slots. Re-entry cancels the hold, Escape cancels the operation, and continued drops can join groups or ungroup on empty space.
- Main-grid grouping detection is unchanged in this follow-up, pending discussion of the native Chrome interaction.

Touchpad input re-arms immediately after momentum returns to physical input, with a quiet-gap fallback for delayed timers. No click, pointer exit or vertical scroll is needed to unlock a returned swipe. Browsers still cannot reliably distinguish fingers resting motionless from fingers lifted without inertia; no guessed timeout resets a parked partial swipe.

## 2026-10-16 — Coordinated grouping and reordering

Main-grid drags now keep eligible target cards stationary through the approach and grouping overlap. Crossing the target’s far edge permits Sortable to reorder and clears the group highlight. Releasing during the overlap groups; releasing after a reorder preserves the changed order. Current stable slots determine subsequent and reversed moves. Grouping-disabled, pinned, and inside-group reorder behavior is preserved, as is the 450 ms outside-group continuation. Settings help and README explain the distinction.

## 2026-10-17 — Prevent premature edge-entry reordering

The far-edge gate now uses horizontal bounds for targets in the same row and vertical bounds for targets in another row. Previously, a diagonal approach could cross the target’s side edge before reaching its vertical reorder boundary, which authorized an early Sortable insertion. A 1 CSS px tolerance ignores fractional layout differences. The decision still runs in Sortable’s pre-insertion callback, using stable slots; no DOM-ordering or animation ownership changed.

## 2026-10-17 — Touchpad category navigation

Removed touchpad card closing and the Swipe using selector. Swipe to close remains off by default and now controls mouse dragging only; obsolete input preferences are ignored when settings are loaded or imported. Existing hold-to-reorder/group and close confirmation/Undo remain intact.

Horizontal pixel-wheel gestures below the category bar now switch one visible category at a time after 96 px of accumulated horizontal movement. Hidden categories are skipped; search includes All results. Edges do not wrap. Vertical scrolling, zoom/modifier gestures, open menus/dialogs, form fields, drawers, and active dragging are excluded. A quiet-gap lock absorbs the remaining gesture; reported momentum cannot initiate another switch. Category buttons retain the same click and keyboard behavior.

## 2026-10-17 — Category, settings and drag visual refinements

- Category navigation now has a direction-aware 40 px horizontal content entry through the existing material-motion controller. The horizontal wheel threshold is 56 px, down from 96 px; one-category locking and below-header gating remain. Reduced motion skips the effect.
- Appearance uses 16 px spacing on both sides of the Visual style heading; the current tint label has a 12 px indent. Swipe help describes mouse release, the hold-to-drag lift, and independent touchpad category navigation. Filter radii follow each material (Classic 8 px, Flat 6 px, Glass pill).
- Group popup entry fades and slides its inner header/controls/grid up 12 px, without transforming the dialog or changing fixed drawer positioning.
- Overlap grouping shrinks the destination surface to 90% while a stationary slot outline retains its size. The fallback card shrinks to 94% only when swipe-to-close is enabled. Drop-target tray grouping keeps its original 78% fallback treatment.
- Glass category geometry uses fractional title-button bounds. During pill dragging, width follows the nearest category title; release settles to the selected title's exact bounds.

### 2026-10-17 — Hold feedback and source-anchored groups

- Removed the selected redundant swipe-close tooltip text, retaining the opening sentence.
- Sortable's choose/unchoose lifecycle now animates the held source surface at the 250 ms drag-mode threshold, before movement. Releasing without dragging restores its size; fallback copies continue the current scale. Shrinking remains conditional on swipe-to-close.
- Replaced the group content slide with Chromium Android-inspired card-to-panel expansion and reverse collapse, including staged crossfades, source fallback, interrupted-motion cleanup, and reduced-motion support. The existing outside-panel drag continuation bypasses the close effect.

- Follow-up: group removal now requires the cursor within the remove bar; the existing outside-panel hold remains cursor-based. The fallback card layers above the bar, and in-panel status/help text has no raised background.
- The source group card remains visible during opening. Normal close waits for the animation owner's finish event before native dismissal, preventing a clipped reverse morph, including Classic style. Escape/backdrop/done use the same close path; drag handoff stays immediate.

### 2026-10-18 — Group motion and drag handoff refinements

- Group morphs now take 169 / 260 / 416 ms for Efficient / Standard / Smooth. The temporary card snapshot has no duplicate border, outline, or rounded inner edge.
- All styles transition group backdrop dimming and blur with the morph; reduced motion disables that transition.
- Hover-out continuation releases the native modal for main-grid hit testing while an inert copy completes the reverse morph below the dragged card. Its backdrop fades from the captured visible shade. This replaces the earlier immediate visual dismissal.
- The source group preview omits the departing tab immediately during handoff; cancellation restores it, and completed operations reconcile against refreshed membership.
- Drag start refreshes surface layout baselines, avoiding stale coordinates captured during the scaled group-opening animation.
- Glassmorphism's remove bar uses a translucent surface/tint, the existing glass sheen and edge, and local blur. Reduced-transparency preferences retain an opaque surface.
