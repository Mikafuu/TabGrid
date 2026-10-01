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
