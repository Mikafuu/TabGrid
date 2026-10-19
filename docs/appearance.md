# Appearance settings

Current behavior, updated 2026-10-18. Appearance is the second category in
Extension settings. Changes save immediately through the validated local
preference model and are included in settings backups. Invalid values reject
the import before changes are applied. Custom background image data is local to
this computer and excluded from backups.

## Styles, color tints, and fonts

Three visual styles are available: **Classic**, **Flat**, and **Glassmorphism**.
Classic preserves the tint's original finishes; Flat uses solid color blocks and
compact controls; Glassmorphism uses translucent surfaces, rim light, and
wallpaper refraction where supported. Neumorphism and Claymorphism are retired;
saved values migrate to Classic. Their historical inspiration credits remain
in the README, but they are not available settings.

The visual-style cards precede color mode and font controls. The selected color
tint is shown beneath the Color tint heading, followed by the tint families.
Custom background settings follow the tint choices. Info icons expose contextual
help on hover, keyboard focus, or click without permanent explanatory paragraphs.
Settings search focuses the actual visible control, excluding these help icons.

Color mode is independent of style and tint. Follow system listens for color-mode
changes; Light and Dark override it. Fonts are Geist, Outfit, Plus Jakarta Sans,
Newsreader, Geist Mono, and System. The five named font families are bundled
locally with OFL notices and source links in `assets/fonts/README.md`.

Backgrounds can be cropped with the zoom control and repositioned by dragging
the preview or using its arrow-key controls. Transparency and blur are separate
preferences. A quiet backing keeps main search/sort/size labels readable against
arbitrary wallpapers, and glass window headings retain a strong surface tint.
The image opacity preference itself is not changed by these readability layers.

Reset appearance restores Classic, Follow system, Calm editorial, Geist,
system-aware motion, Standard animation speed, and default card details. Outside
incognito it also removes the custom image and resets its adjustments. It does
not reset tab behavior, filters, history, or keyboard shortcuts.

## Rendering and motion

Sortable owns card ordering and stable outer `.card` slots. Grid motion uses
inner `.card-surface` elements and the existing auto-animate owner, including
interrupted-movement offsets. Direct pointer tracking remains immediate.

Classic/Flat interface timing defaults to 180 ms, Glass to 220 ms; Efficient,
Standard, and Smooth apply speed factors of 0.65, 1, and 1.6. Glass interactions
can use Liquid DOM springs/easing; staged group morphs retain explicit keyframes
through the existing motion owner. Motion preferences and system reduced motion
cancel or skip effects.

Group panels expand from the source group card and collapse back to it, with a
staged preview/content crossfade and a dim/blur backdrop transition. The source
card stays visible. Base morph duration is 260 ms (169/260/416 ms by speed);
missing, filtered, or offscreen sources use a fade. Normal closing keeps the
native modal until the animation completes. During drag-out continuation, a
noninteractive copy finishes the close animation while the actual modal releases
the drag to the main grid. Fixed drawers are hidden during the morph. See
[the interaction reference](chrome-grid-interaction-research.md) for geometry,
thresholds, and intentional differences from Chrome Android.

Glass uses bundled `@liquid-dom/core` and `@liquid-dom/layout` for supported
WebGPU surfaces and interactions. The renderer samples a local wallpaper
texture, not live HTML-in-Canvas; no experimental browser flag is needed for that
path. CSS supplies the fallback without WebGPU or a custom image. Wallpaper
textures are reused; controls use shared rendering infrastructure. Reduced
transparency and forced colors use opaque/accessible fallbacks. Glass can use
more graphics power; its settings info tip makes the battery tradeoff explicit.

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

## Group presentation and drop targets

Existing group choices use `groupLabel()`: a decorative Chrome group-color marker
and the name (or Untitled group). New-group creation uses the native nine-color
radio palette. Keep names and keyboard access intact when styling these controls.

Show group drop targets defaults **off**; saved choices are retained. When enabled,
the drawer docks to the left or right viewport edge and contains horizontally
scrollable destinations. Whole-group drags expose Ungroup. Pinned-tab drags hide
the drawer and cannot be accepted as grouping drops; selection-based attempts
explain that the tabs must first be unpinned. Pinned tabs can still move between
matching pinned areas in different windows. Empty pinned areas appear only for
that drag and stay hidden at rest.

Group tabs by dragging defaults **on**, independently of the drawer. Swipe to
close defaults **off** and uses mouse dragging only; holding first enters reorder
or grouping mode. Horizontal pixel-wheel gestures below the category header
navigate categories instead of closing cards. Card-size preferences persist,
while the displayed per-row count follows responsive limits (three columns at
900 px and two at 650 px).

## Wallpaper captions and crop

The search/sort/card-size row has no wallpaper backing. Its bare captions and
per-row count choose light or dark text by sampling the locally rendered
wallpaper, including opacity and crop, with a subtle text shadow for mixed areas.
Sampling is event-driven; no image is sent anywhere. Native control text keeps
its normal surface colors. Forced colors and reduced transparency use the
normal theme fallback.

At 100% zoom the image uses the minimum cover fit, with no hidden overscan
enlargement. Only cropping required by the screen/image aspect-ratio difference
remains. Both sliders and preview dragging use the same visible-viewport pan
range; a fully visible axis has no further area to pan. Website and Group
pickers keep their glass decoration outside the scrolling options, so their
content cannot extend the scroll range.
