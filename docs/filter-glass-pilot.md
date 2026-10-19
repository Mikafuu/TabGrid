# Liquid glass surfaces and motion

Glassmorphism controls, filter panels, navigation, menus, dialogs, drawers, and
card-size slider surfaces use `@liquid-dom/core` 0.1.1's
`WebGpuGlassCore`, `Scene`, `Container`, and `Glass`. The dependency is pinned and
loaded locally, following the extension's existing node_modules packaging.

The custom wallpaper is drawn into a small padded Canvas2D crop and uploaded as
the core's `backdropTexture`. Crop placement follows the wallpaper's cover sizing,
96 px overscan, transparency, blur, and scroll position. The renderer refracts
that image only; it does not capture cards, controls, or arbitrary HTML. No `Html`
nodes, `layoutsubtree`, or `copyElementImageToTexture` are used.

The native button retains its label, count, click handler, keyboard behavior,
and focus ring. The decorative canvas cannot receive pointer events. Rendering
is event-driven rather than a continuous frame loop. GPU resources are released
when the style/background is no longer eligible; device failures use CSS.
Reduced transparency and forced colors also disable the GPU surface.

The panel uses one glass canvas, a calmer rim, and stronger frost/tint than the
trigger. Inner fields use flat fills and 9 px corners. Dropdown popovers use a stronger tinted glass surface and remain in the browser's top layer, outside the panel clip.

Motion directly uses `@liquid-dom/layout` 0.2.0's live `AnimationManager`,
`spring`, `easing`, and `Easing`. Filters now reaches its expanded height in
180 ms, closes in 140 ms, and settles its corner in 200 ms. Its movement and
control feedback use VideoControlsDemo's spring (`stiffness:700`, `damping:38`). A small DOM bridge applies
those live values to the existing accessible controls; no sampled keyframes
or AutoAnimate effects drive Glassmorphism overlays and disclosures. The panel uses a short vertical
shift instead of scaling its labels. Retargeting preserves the engine's current
state and spring velocity. Animation speed and reduced-motion preferences still
apply. Tab-grid animations retain their existing AutoAnimate owner.

The GPU follows each animation frame to keep the wallpaper registered, then
stops when motion settles. Closed panel GPU resources are released.

## Verification — 2026-10-12

- All 184 automated tests passed; `npm run check` and `git diff --check` passed.
- In-app Chromium fixture: actual WebGPU rendering succeeded while the
  HTML-capture API was unavailable (`webgpu: true`, `htmlCapture: false`).
- No GPU warnings or validation errors in the successful rendering path.
- Verified opening/closing, Space activation, keyboard focus ring, selecting a
  pinned filter, active-count resizing, and clearing filters.
- Inspected light/dark rendering and wallpaper blur. Dark tint was strengthened
  for readable text over light wallpaper; Canvas2D blur accounts for device scale.
- Switching to Flat and back restored GPU rendering without errors.
- A fixture with WebGPU unavailable showed the CSS fallback and usable filters.
- Panel follow-up: verified real WebGPU light/dark panels, quick open/close/open,
  website popover placement and selection, clearing, keyboard collapse, and the
  application's Reduce animations preference. The no-GPU fixture retains the
  flatter fields and functioning disclosure. No GPU errors were logged.
- Native installed-extension execution and other GPU/OS combinations remain
  unverified. OS-level reduced-transparency/forced-colors behavior is implemented
  but was not exercised in this browser run.

## Direct animation engine — 2026-10-13

- All 184 automated tests passed, including live engine settling, interruption,
  speed scaling, and immediate reduced-motion completion.
- Syntax/module checks and whitespace checks passed.
- In-app preview confirmed `liquid-dom` motion with WebGPU frames advancing
  during the transition; rapid close/open retargeting produced no GPU errors.
- This verifies the local preview, not the installed extension.

## Shared surface rollout — 2026-10-13

- `glass-surfaces.mjs` discovers dynamic menus, native dialogs, filter panels,
  drawers, toolbars, and standalone header controls. Category navigation uses a
  subtle outlined track with one glass selection pill. `glass-tabs.mjs` moves
  and resizes that pill with the live spring when the active category changes,
  including when Idle tabs or All results appear. Labels remain stationary. Nested controls
  use quieter CSS fills; native inputs retain their browser semantics.
- One GPU device and `WebGpuGlassCore` pipeline serve all mounted surfaces.
  Hidden/removed surfaces release their output resources; rendering stops at rest.
  This samples wallpaper only, including for overlays; it does not capture the
  controls/cards underneath a menu. CSS handles unavailable WebGPU/backgrounds.
- `liquid-motion.mjs` bridges live library values into native DOM styles. It drives
  overlay entry/exit, UI layout transitions, slider movement, button feedback,
  and switch thumbs. It restores inline styles when finished or cancelled.
- Existing SortableJS card ordering and AutoAnimate card movement remain intact.
- All 188 tests passed, including 180 ms expansion, cancellation/style restoration,
  live intermediate values, and spring completion. Syntax/module checks passed.
- Local Chromium verified light/dark dialogs, root/group Filters, website pickers,
  context menus/submenus, card-size keyboard input, Reduce animations, and changing
  Flat/Glassmorphism styles. No WebGPU validation errors were logged. The no-GPU fixture retained usable
  menus and live motion with the CSS fallback. Scrolling menu decoration stayed
  aligned with its viewport.

## Outermost ownership and draggable categories — 2026-10-13

- Glass ownership now follows the outermost candidate: header, cards/group cards,
  panels, dialogs, menus, standalone buttons, and native text/search/select shells.
  Top-layer popovers start their own layer. Inner controls use transparent tints,
  preserving semantic native controls and the existing tab reorder architecture.
- Header actions inherit header glass. Settings sections have no white backing.
  Group Filters uses the same 44 px minimum height, padding, and pill corners as
  main Filters. Group/last-opened/selection colors tint glass without hiding it.
- Category buttons have no hover fill. Dragging the existing pill chooses the
  nearest visible category on release, with spring settling. Click, keyboard,
  pointer cancellation, and reduced-motion paths remain supported.
- Visible surfaces share one device/pipeline; offscreen surfaces release resources.
  Unchanged surfaces reuse their rendered output during sibling animation.
- 189 tests pass. Live preview verified drag in both directions, transparent hover
  (computed alpha zero), switch tint, one-canvas settings ownership, group Filters,
  dark/light cards, and reduced motion. No GPU validation warnings were logged.

Run `node tests/preview-server.mjs`, then open
`http://127.0.0.1:4173/?liquid` for the synthetic stripe wallpaper, or append
`&no-gpu` to exercise the capability fallback. These options affect only fixture
data, never the installed extension's wallpaper or settings.
