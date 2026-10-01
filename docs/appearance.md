# Appearance settings

Appearance is the second category in Extension Settings. Changes save immediately
through the shared validated preference model. Existing installations retain their
settings; missing appearance fields default to Classic, Follow system, Calm editorial, and
Geist. Appearance is included in the existing version-1 local JSON backup. Invalid
style/mode/theme/font values reject the whole import before changes are applied.

Color mode and font are independent of the theme. Follow system listens for live
`prefers-color-scheme` changes. Manual Light and Dark override system colors,
including native controls, dialogs, group panels, menus, and primary buttons.
Motion and card-information controls have moved from General to Appearance.
Website address defaults on, last-used time and window identity default off.
Group identity defaults on and appears only in main query results with member
search enabled, rather than in normal group cards or the open group panel.
Reset appearance resets these appearance preferences only.

## Independent visual styles — 2026-09-30

Visual style now precedes Color tint. Classic preserves the previous theme finishes
and is the migration/default choice. The four new styles override those finishes,
so every one of the 22 existing palettes can tint each material in Light or Dark.
The `visualStyle` preference is validated, stored locally, and included in backups.
Reset appearance restores Classic along with the existing appearance defaults.

- Flat: filled navigation and settings categories, bold titles, solid controls,
  squared switches, crisp small radii, and no surface shadows or blur.
- Glassmorphism: translucent frosted cards, beveled light, pill controls, a
  stationary folded canvas, and actual backdrop blur on the shared navigation
  lens and fixed overlays. Group and last-used
  frames stay solid. Reduced-transparency users get opaque surfaces.
- Neumorphism: a shared matte canvas, convex molded cards, opposing soft shadows,
  raised buttons, and recessed inputs/navigation/settings categories.
- Claymorphism: floating inflated tiles, molded buttons, outlined soft fields,
  and individual raised navigation buttons with one outer/two inner shadows.

Material tokens live in materials.css, after appearance.css, with refined styles
in flat.css, glass.css, neumorphism.css, and clay.css. They never transform
outer card slots or introduce another animation system. Chrome group colors,
selected borders, last-opened priority, and reduced-motion behavior remain intact.
All effects are local CSS. No texture images, remote assets, or runtime requests.

The UI/UX Pro Max style guidance informed the neumorphic and clay surface recipes,
with visible focus, readable text, and restrained effects adapted to a dense tab
manager. The supplied
reference images inform the glass layers. These are web styles, not native Apple
materials. Blur is limited to the navigation lens and fixed overlays to avoid
a blur layer for every card.

### Refined Flat material and motion

The [Designmodo Flat UI repository](https://github.com/designmodo/Flat-UI) and its
[official demo](https://designmodo.github.io/Flat-UI/) informed Flat's solid color
blocks, clear selected states, compact corners, and strong typography. The
gpt-taste and design-taste-frontend skills were adapted to the existing desktop
utility layout. The selected local font and secondary tint remain independent;
no Flat UI framework, third-party artwork, remote assets, or new dependency was
imported. `flat.css` loads after the shared materials and before drawer geometry.

Flat adds 180 ms interface effects through the existing bundled auto-animate:
menus/history/toasts enter and exit, dialogs fade, settings categories and
conditional rows settle, card-size/disclosure changes move inner card surfaces,
and the edge drawer expands, resizes, and docks smoothly. Direct pointer tracking
stays immediate. Sortable continues to own card order and the accepted interrupted
120 ms reorder effects remain unchanged. Outer card slots never animate. Layout
captures retain the first visible position across synchronous renders and account
for the nearest scroller. Session position restoration remains immediate.

Native closing surfaces become inert and leave the accessibility tree immediately;
discrete CSS preserves only their brief exit paint. Dialogs never transform their
fixed drawer's coordinate system. An open-attribute observer supplies dialog
events on older supported Chrome versions and deduplicates with native events.
Follow system honors live reduced-motion changes;
Disable animations cancels active effects and stops new movement. Glass,
Neumorphism, and Clay use the same effect ownership with their own settling timing;
Classic retains its existing motion treatment.

### Refined Glassmorphism material and motion

The [liquidGL repository](https://github.com/naughtyduk/liquidGL) informed the
beveled rims, translucency, soft frost, and short settling motion. The requested
gpt-taste and design-taste-frontend skills were adapted to the existing utility
layout. Glass has a shared navigation capsule, etched search fields, restrained
stationary reflections, pill controls, and floating glass overlays. `glass.css`
loads after shared materials/Flat and before the drawer's geometry rules.

This is a CSS visual approximation, not liquidGL's WebGPU/WebGL refraction or
self-rasterizer. No renderer, package, remote asset, or new dependency is added.
Cards use transparent film and inset rim light without per-card backdrop filters.
Blur is limited to navigation and fixed overlays. The group panel stays opaque
and unfiltered so its fixed drawer keeps viewport coordinates.

Glass interface effects use 220 ms settling through the bundled auto-animate.
Menus/history/toasts, settings category/conditional changes, resizing/disclosure
reflow, and drawer expansion/docking share the existing owner. Dialogs only fade.
Direct pointer tracking stays immediate. The accepted 120 ms reorder still
captures interrupted surface offsets; Sortable controls order and outer slots
never animate. Flat retains 180 ms interface effects. Motion preference/system
reduction cancels active movement. Reduced transparency removes sheen/blur and
uses opaque surfaces; unsupported blur also has solid CSS defaults.

### Refined Neumorphism material and motion

The [adamgiebl/neumorphism repository](https://github.com/adamgiebl/neumorphism)
and its [official generator](https://neumorphism.io/) informed opposing light and
shadow, convex forms, and pressed surfaces. The gpt-taste and design-taste-frontend
skills were adapted to the existing utility layout. This is original local CSS,
not the generator's React app. No framework, remote asset, or dependency was added.
`neumorphism.css` loads after shared materials/Flat/Glass and before drawer geometry.

A tint-derived matte plane joins cards and canvas. Consistent upper-left lighting
raises cards/buttons, while fields, the navigation tray, preview wells, and active
settings categories are recessed. Circular icon controls and molded switches
complete the treatment. Text contrast, focus rings, group colors, last-opened
priority, selected circles, and the selected local font remain intact. Dark uses
less highlight and deeper ambient shadow. Forced colors remove depth and retain
visible borders/selected states. Calculated plane/gradient endpoint contrast
passes 4.5:1 across all 44 tint/mode combinations, excluding shadow pixels and
arbitrary screenshot imagery.

Menus/history/toasts, category/conditional changes, card resizing/disclosure, and
drawer expansion/docking settle through bundled auto-animate at 200 ms. Direct
pointer tracking remains immediate. Dialogs only fade and never transform fixed
drawer coordinates. Motion preferences/system reduction cancel active effects.
Sortable and the accepted 120 ms interrupted reorder remain unchanged; only inner
card surfaces move, with stable outer slots and a transparent ghost. Flat retains
180 ms, Glass 220 ms. Existing saved preferences and backups need no migration.

### Refined Claymorphism material and motion

The [codeAdrian/clay.css repository](https://github.com/codeAdrian/clay.css) and its
[official demo](https://codeadrian.github.io/clay.css/) informed the inflated forms
and one-outer/two-inner-shadow recipe. The gpt-taste and design-taste-frontend skills
were adapted to the existing desktop utility. This is original local CSS, not an
import of the library or Sass mixin. No package, texture image, remote asset, or
new dependency was added. `clay.css` loads after the other materials and before
the drawer's geometry rules.

Cards float above the canvas rather than sharing Neumorphism's matte plane.
Rounded molded buttons, separate raised source buttons, outlined soft fields,
sculpted overlays, and inset preview wells give Clay its own finish. Selected
circles, native group colors, last-opened priority, focus rings, fonts, and tints
remain intact. Dark lowers the highlight and deepens the ambient shadow. Forced
colors remove depth and retain visible borders/selected states.

Menus/history/toasts, settings categories/conditional rows, card resizing/filter
disclosure, and drawer expansion/docking settle through the existing auto-animate
owner at 240 ms. Direct pointer tracking stays immediate. Dialogs only fade;
their fixed drawer retains viewport coordinates. Motion preferences/system
reduction cancel active effects. Sortable still owns ordering; accepted 120 ms
interrupted reorder moves only inner card surfaces, with stable outer slots and
a transparent ghost. Existing preferences and backups need no migration.

## Theme catalogue and skill mapping

The four requested skills describe competing visual languages. They are offered
as independent aesthetic presets rather than imposing their mutually exclusive
rules on the same page. Named design systems, hero arrangements, and animation
patterns are not additional themes. These presets are not official Material,
Fluent, Apple, or other design-system implementations.

| Family | Themes | Reference |
| --- | --- | --- |
| Editorial | Calm editorial | Existing user-approved design |
| Editorial | Utilitarian minimalism | minimalist-ui: warm monochrome and flat pastel surfaces |
| Editorial | Editorial / magazine | design-taste-frontend aesthetic family |
| Editorial | Editorial luxury | high-end-visual-design archetype |
| Editorial | Warm craft | design-taste-frontend named cream/brass palette, explicit optional choice |
| Structure | Soft structuralism | high-end-visual-design archetype |
| Structure | Bento | design-taste-frontend: tile material, adapted to stable equal tab slots |
| Structure | Brutalism | design-taste-frontend aesthetic family |
| Structure | Kinetic typography | design-taste-frontend: strong typography, preserving existing motion ownership |
| Atmosphere | Cinematic | gpt-taste: depth and tonal atmosphere, adapted to a utility app |
| Atmosphere | Glassmorphism | design-taste-frontend frosted surfaces |
| Atmosphere | Liquid glass | design-taste-frontend: explicitly a web approximation |
| Atmosphere | Ethereal glass | high-end-visual-design archetype |
| Atmosphere | Aurora / mesh | design-taste-frontend aesthetic family |
| Atmosphere | Dark tech / hacker | design-taste-frontend aesthetic family |
| Palettes | Cold luxury; Forest; Black and tan; Cobalt and cream; Terracotta and slate; Olive, brick, and paper; Monochrome + pop | Seven named design-taste-frontend palette alternatives |

All 22 themes have light and dark palettes. Group colors remain Chrome-assigned;
the last-opened state keeps its established blue priority. In Classic, themes change surfaces,
accent colors, outlines, radii, and typographic emphasis. With another visual style,
the theme supplies only its color tint. They do not change card
sizing, tab order, interactions, or the Sortable/auto-animate architecture.

Glass backdrop effects are restricted to the navigation lens and fixed overlays, with nearly opaque surfaces,
solid CSS fallbacks, and reduced-transparency handling. Ambient backgrounds are
stationary. No marketing hero, scroll takeover, marquee, external
image, or additional animation library is introduced into the tab manager.

## Fonts and offline use

Six independent choices: Geist, Outfit, Plus Jakarta Sans, Newsreader, Geist Mono,
and the device's System font. The five named fonts are bundled variable WOFF2
files, with their SIL Open Font License files in assets/fonts. Source URLs and
attribution are in assets/fonts/README.md. Fonts are loaded from the extension,
never a remote font service. Proprietary fonts mentioned by the skills are not
assumed available or redistributed. No runtime network permission or dependency
was added.

The catalogue is grouped in native disclosures. Native radio buttons provide
arrow-key selection, checked states, and focus visibility. A live font sample
and selected-theme label support comparison. The gallery becomes one column on
narrow screens; the settings category rail remains keyboard accessible.

## Group presentation and edge drawer

Use `groupLabel()` from `lib/group-presentation.mjs` for existing group choices:
a native group-color marker followed by the group name (or Untitled group).
Keep the marker decorative and the text accessible. New group and Ungroup remain
neutral. Apply this convention to future group menus, selectors, and settings;
card headers already carry their native group-color dot. New-group creation uses
the shared nine-color native radio palette, with keyboard arrow selection.

The edge drawer is enabled for new installations; explicit saved off choices
remain off. It docks flush to any edge as a half pill. Its end buttons resize the
inactive length (64–320 px); click changes it by 32 px, arrows by 16 px, Home/End
choose the limits, and dragging an end adjusts continuously. Dragging the middle
uses a fixed 128 px full pill. Alt+arrows dock to the corresponding edge. Targets
expand in a horizontal, contained scroll row on every edge. Whole-group drags
show only Ungroup and resolve the group's live members before applying the drop.
These overlay changes leave Sortable and stable-card surface motion unchanged.

Drawer edge geometry takes priority over material radius tokens. Group panels
keep their material tint and sheen; backdrop/drawer blur supplies the glass
finish without creating a different containing block for the fixed group drawer.
