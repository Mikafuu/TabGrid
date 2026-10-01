# TabGrid visual redesign — 2026-09-29

Direction chosen by the user: calm editorial, with warm neutral surfaces, crisp
typography, and restrained blue accents. The gpt-taste and redesign-existing-projects
skills informed the audit. Their marketing-page, decorative-content, external-image,
and GSAP prescriptions were adapted to this offline tab-management application and
the user's previously accepted Sortable/auto-animate architecture.

## Audit and changes

- The old page gave labels, controls, filters, and navigation similar emphasis.
  A restrained brand line, larger title, source navigation, and a consistent control
  row now establish the order of use.
- A permanent row of multi-select filters consumed substantial vertical space.
  Both grids now use native details/summary disclosures with visible active counts.
  Collapsing the filter controls never removes their restrictions.
- The settings dialog was an undifferentiated list. Semantic fieldsets now group
  related preferences within the existing accessible category tabs.
- Colors, type sizes, menu spacing, borders, focus rings, and elevation now use a
  coordinated warm-neutral palette. Native group colors and last-opened priority
  are retained. Group headers gain a small assigned-color marker.
- The added theme.css layer keeps visual changes separate from functional layout
  rules in grid.css. No framework migration or JavaScript animation dependency
  was introduced. Geist Sans is bundled with its SIL Open Font License in
  assets/fonts; the extension makes no runtime font/CDN request.
- The card grid retains native order, four-to-three frames, discrete column sizes,
  stable outer slots, and inner-surface animation. No dense-flow rearrangement,
  scroll hijacking, or decorative card transform changes hit testing.
- Keyboard focus, disabled/error states, dark colors, reduced-motion handling,
  and a skip-to-tabs link are included. Narrow settings retain the requested
  vertical category rail and their own scrolling region.

## Evidence

All browser screenshots use disposable simulated tabs. See verification.md for
scope and limitations. The desktop grid screenshot uses the existing four-column
size option to show the frames; the default remains six columns. The dark preview
forces the dark CSS branch in the fixture server only, not the system theme.

Font source: https://github.com/vercel/geist-font
