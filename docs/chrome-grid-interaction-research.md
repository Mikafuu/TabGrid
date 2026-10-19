# Chrome mobile tab-grid behavior

References checked 2026-10-15; current TabGrid behavior updated 2026-10-18.

This comparison concerns Chrome on Android. It is based on Google's current help and Chromium's current main-branch implementation, not a promise that every release or platform behaves identically. The comparison informed the implementation update on 2026-10-16.

## Official user-facing documentation

[Google Chrome Help: Manage tabs on Android](https://support.google.com/chrome/answer/2391819?co=GENIE.Platform%3DAndroid&hl=en) documents holding a tab and dragging it onto another tab/group, naming and coloring a newly created group, and reordering by dragging. To remove a tab from a group, it describes a dedicated bottom “Remove from group” area.

## Implementation details

[TabGridItemTouchHelperCallback.java](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/android/features/tab_ui/java/src/org/chromium/chrome/browser/tasks/tab_management/TabGridItemTouchHelperCallback.java) evaluates the hovered merge target during drag and commits the merge when the interaction returns to idle. Its merge path has no fixed target dwell. The group dialog activates its ungroup bar when the dragged card's midpoint reaches the bottom threshold and ungroups on release.

[TabListRecyclerView.java](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/android/features/tab_ui/java/src/org/chromium/chrome/browser/tasks/tab_management/TabListRecyclerView.java), `getHoveredCardIndex` / `isOverlap`, uses the intersection area of the dragged and target card rectangles. It compares that area with the smaller width × smaller height × configured merge threshold. The previous pointer-in-central-60%-rectangle check tested the pointer rather than card overlap; it has now been replaced.

[TabListCoordinator.java](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/android/features/tab_ui/java/src/org/chromium/chrome/browser/tasks/tab_management/TabListCoordinator.java) sets `PERCENTAGE_AREA_OVERLAP_MERGE_THRESHOLD` to `0.5f`.

TabGrid now applies that strict 50% overlap rule using the dragged card footprint and the original grab offset. Eligible targets highlight immediately; releasing commits the group operation. New groups still open the name/color dialog. The previous center-pointer test and 350 ms dwell were removed. Reordering remains owned by Sortable.

Inside a TabGrid group, a bottom “Remove from group” area appears during dragging. Moving the pointer into its rectangle arms removal; moving back cancels it. Card overlap alone does not arm removal. The panel stays open for remaining members and closes when the group disappears. The area uses desktop sizing (64 CSS px), rather than copying Android density-independent dimensions.

At the user's request, TabGrid also retains its desktop continuation gesture: hold the pointer outside the panel by 24 px (adapted to available viewport space) for 450 ms to close the panel and continue dragging on the main grid. A continued drop can join another group or ungroup on empty space. Re-entry cancels the hold; side/top release before the hold completes cancels the drop. This continuation is a TabGrid feature, not a claim about Android's documented behavior. That restoration initially left main-grid grouping unchanged; the subsequent authorized update below coordinates grouping with reorder boundaries.

## 2026-10-16 — Group versus reorder boundary

Chromium's [ItemTouchHelper2.chooseDropTarget](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/androidx/local_modifications/recyclerview/java/org/chromium/ui/recyclerview/widget/ItemTouchHelper2.java) checks whether the dragged bounding box passes the target’s corresponding far edge in the movement direction. TabGrid now uses this directional check against stable slots before allowing Sortable insertion. Approaching and overlapping an eligible card leaves its slot in place; exceeding half overlap highlights grouping. Passing the far edge clears grouping and allows the reorder. A completed Sortable insertion clears stale merge feedback, and later decisions use the new slot positions.

Sortable still owns DOM ordering, and auto-animate owns card movement. Pinned cards, group-panel reorders, and grouping-disabled mode keep their ordinary reorder behavior. Views where manual ordering is unavailable retain overlap grouping rather than suppressing it at an unreachable reorder boundary. This matches the decision rules, not a claim that the desktop extension reproduces every native Android animation or gesture detail.

## Current touchpad behavior

Touchpad swipe-to-close has been removed. Swipe to close uses mouse dragging only;
there is no device-choice setting. Holding first enters reorder/group mode.
Horizontal pixel-wheel input below the category header switches the visible
categories, with a 56 px accumulated threshold and horizontal-direction guard.
A committed gesture locks until a 250 ms quiet gap or a reported transition from
momentum to physical input. Dialogs, popovers, editable controls, and active drags
exclude category switching.

[Wheel-event momentum](https://chromestatus.com/feature/6631012282007552) is used
when supplied; ordinary wheel events do not guarantee a finger-up notification
or identify a physical touchpad. There is no longer a partially displaced card
waiting for a touchpad release. Real-device momentum still requires separate
validation from synthetic wheel tests.

## 2026-10-17 — Desktop grid boundary correction

Copying all four directional comparisons independently allowed premature reorder on diagonal approaches in the desktop grid. TabGrid now evaluates only the ordering axis between the source and target slots: horizontal when their vertical overlap exceeds half the smaller height, vertical otherwise. Crossings must exceed 1 CSS px to avoid fractional layout noise. This is a deliberate desktop-grid adaptation of the far-edge distinction, not an exact copy of every Chromium condition.

## 2026-10-17 — Group opening and closing

Chromium's [TabGridDialogView.java, pinned revision](https://chromium.googlesource.com/chromium/src/+/15ef0750482972d738ff7b8d278950ff3d02ee29/chrome/android/features/tab_ui/java/src/org/chromium/chrome/browser/tasks/tab_management/TabGridDialogView.java) defines a 400 ms card-to-dialog expansion with emphasized easing. A source-card visual fades out in the first half, while the dialog content fades in during the second half. Closing reverses the geometry and crossfade; a missing source uses a fade. This is an implementation reference, not a claim of device-tested parity with every Chrome release.

TabGrid now adapts that choreography to its desktop panel: a temporary inert card snapshot, source-anchored panel expansion/collapse, and staged content crossfade. The original card slot is untouched. The animation follows the user's speed preference and skips motion when reduced animations are requested. Rapid reversal samples the current pose. Deleted/filtered/offscreen source cards use a fade. Normal closing retains the native modal until the motion owner reports completion, then closes and restores keyboard focus. This avoids a disappearing top-layer surface cutting off the reverse morph. The source group card stays visible. Fixed drawers are hidden while the panel transforms. During drag-out continuation, the actual modal closes to release pointer interaction, while an inert copy and backdrop complete the reverse morph below the dragged card. The group preview temporarily omits the departing tab and is reconciled when the drag completes or is cancelled. TabGrid uses a faster 260 ms base duration: 169 ms Efficient, 260 ms Standard, and 416 ms Smooth. These are desktop adaptations of the 400 ms reference, not native timing parity.


### Cursor-based desktop removal refinement

At the user's request, the desktop remove bar now tests the pointer inside its full rectangle, including its bottom boundary, instead of Chrome Android's card-midpoint test. Outside-panel continuation already used the pointer and retains its 450 ms hold and safety margin. A card may overlap the bar or extend beyond the dialog without activating either action while the pointer remains inside the panel. This intentionally differs from the native Android removal threshold while preserving the main-grid card-overlap grouping rule.
