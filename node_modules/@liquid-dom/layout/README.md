# @liquid-dom/layout

## Description

`@liquid-dom/layout` is a renderer-agnostic TypeScript layout engine inspired by SwiftUI's two-step layout model: parents propose a size, children report a size, then parents place children into rectangles.

It does not render UI. It gives you mutable layout nodes with stable ids, layout properties, measurement caching, and calculated geometry written directly to each node. Your DOM, Canvas, SVG, WebGL, native, or custom renderer owns the visual objects and reads `node.layout`.

## Install

```sh
pnpm add @liquid-dom/layout
```

## Quick Start

```ts
import { LayoutEngine, Frame, HStack, Leaf, Spacer, type ProposedSize } from '@liquid-dom/layout'

class TextLeaf extends Leaf {
  constructor(private readonly size: { width: number; height: number }) {
    super()
  }

  protected override measureLeaf(_proposal: ProposedSize) {
    return this.size
  }
}

const label = new TextLeaf({ width: 82, height: 28 })
const button = new TextLeaf({ width: 68, height: 34 })

const row = new HStack({ spacing: 12, alignment: 'center' }).append(label, new Spacer(), button)
const root = new Frame({ width: 320, height: 56 }).append(row)

const engine = new LayoutEngine({ root })
const stats = engine.layout({ width: 320, height: 56 })

console.log(stats.measureCalls)
console.log(label.layout?.rect)

row.spacing = 20
engine.layout({ width: 320, height: 56 })
```

## API Overview

### Layout Engine

```ts
import { LayoutEngine } from '@liquid-dom/layout'

const engine = new LayoutEngine({
  root,
  onInvalidate: () => requestAnimationFrame(render),
  maxCachedMeasurements: 50_000,
})

engine.root = root
const stats = engine.layout({ width: 800 })
engine.dispose()
```

`layout(proposal)` throws until `root` is assigned. It mutates reachable nodes by writing `node.layout`, then returns debug stats. Set `maxCachedMeasurements: 0` to disable measurement caching while profiling.

`new LayoutEngine(options)` accepts `LayoutEngineOptions`:

| Option | Type | Description |
| --- | --- | --- |
| `root` | `LayoutNode` | Optional initial root. |
| `onInvalidate` | `(invalidation: LayoutInvalidation) => void` | Called when a node mutation invalidates layout. |
| `dev` | `boolean` | Enables development-oriented runtime checks. |
| `maxCachedMeasurements` | `number` | Maximum measurement cache entries. Use `0` to disable caching. |

`LayoutEngine` exposes `root`, `layout(proposal)`, `getDebugStats()`, and `dispose()`. `LayoutDebugStats` includes `measureCalls`, `cacheHits`, `cacheMisses`, `invalidations`, and `nodes`.

### Layout Nodes

Nodes are mutable objects. Public classes such as `HStack`, `VStack`, `Frame`, `Padding`, and `Leaf` create node instances with stable generated ids and property setters. Constructors take config only; attach children explicitly with node mutation methods.

```ts
const row = new HStack({ spacing: 8 }).append(title, new Spacer(), button)

row.spacing = 16
engine.layout({ width: 800 })
```

A node has one parent. Appending it to another parent automatically detaches it from the old parent, matching DOM parenting.

Every node exposes:

- `id`, `kind`, `parent`, `children`, and `layout`
- `isLayoutActive()`
- `append`, `prepend`, `insertBefore`, `replaceChildren`, `remove`, and `dispose`

`layout.rect` is relative to the parent layout node. `layout.absoluteRect` is accumulated through layout ancestors and relative to the current `LayoutEngine.root`. Detached nodes keep their last layout until they are laid out again.

A node is layout-active while it is reachable from at least one active `LayoutEngine.root`. `Layout` subclasses can override `onLayoutActive()` and `onLayoutInactive()` to start and stop external resources such as DOM observers. Activity hooks fire synchronously with each tree mutation. Reparenting an active subtree can therefore produce a transient inactive/active pair even when the subtree is reachable again after the move; use these hooks for resources that tolerate immediate stop/start, not as debounced final-topology notifications.

Core geometry and layout types:

| Type | Shape |
| --- | --- |
| `ProposedSize` | `{ width?: number; height?: number }` |
| `Size` | `{ width: number; height: number }` |
| `Rect` | `{ x: number; y: number; width: number; height: number }` |
| `NodeLayout` | `{ rect: Rect; absoluteRect: Rect }` |
| `Length` | `number \| 'infinity'` |
| `Insets` | `{ top: number; right: number; bottom: number; left: number }` |
| `InsetsInput` | `number`, partial edge insets, or `{ horizontal?: number; vertical?: number }` |
| `ChildInput` | A node, an array of optional nodes, `null`, `false`, or `undefined`. |

Alignment types:

| Type | Values |
| --- | --- |
| `Axis` | `'horizontal'`, `'vertical'` |
| `StackAlignment` | `'start'`, `'center'`, `'end'`, `'leading'`, `'trailing'`, `'top'`, `'bottom'` |
| `Alignment` | `'center'`, edge/corner strings such as `'topLeading'`, or `{ x?: 'start' \| 'center' \| 'end'; y?: 'start' \| 'center' \| 'end' }` |

### Leaves

Subclass `Leaf` for renderer-owned leaves. Leaves define their own measurement behavior with `measureLeaf`.

```ts
class TitleLeaf extends Leaf {
  protected override measureLeaf(proposal: ProposedSize) {
    return {
      width: proposal.width ?? 180,
      height: 32,
    }
  }
}

const title = new TitleLeaf()
```

Use typed properties and `invalidateMeasure()` when measurement behavior changes.

```ts
class ModelTitleLeaf extends Leaf {
  constructor(private model: TitleModel) {
    super({ measureKey: model.version })
  }

  setModel(model: TitleModel) {
    if (this.model === model) return
    this.model = model
    this.measureKey = model.version
    this.invalidateMeasure('model')
  }

  protected override measureLeaf(proposal: ProposedSize) {
    return {
      width: proposal.width ?? 180,
      height: 32,
    }
  }
}

title.invalidateMeasure('manual')
```

`LeafOptions` fields:

| Field | Type | Description |
| --- | --- | --- |
| `measureKey` | `unknown` | Cache identity for measurement behavior. |

`LeafNode` extends `LayoutNode` with `measureKey` and `invalidateMeasure(cause?)`.

### Built-In Layouts

```ts
import {
  Background,
  Frame,
  HStack,
  Leaf,
  Layout,
  Noop,
  Overlay,
  Padding,
  Spacer,
  VStack,
  ZStack,
} from '@liquid-dom/layout'
```

- `HStack` and `VStack` place children along one axis with fixed spacing and cross-axis alignment.
- `ZStack` sizes to the maximum child width and height, then aligns each child inside that shared bounds.
- `Frame` proposes constraints to its child, clamps the reported size, and aligns the child inside the frame.
- `Padding` subtracts insets before measuring the child and adds them back to its own size.
- `Spacer` expands in finite proposals.
- `Noop` forwards the same proposal to its single child.
- `Background` and `Overlay` place decorations in the content bounds without affecting parent layout.
- Custom layouts subclass `Layout` and override `measureSelf` and `placeChildren`.

Built-in option types:

| Class | Option type | Options | Node properties |
| --- | --- | --- | --- |
| `HStack`, `VStack` | `StackOptions` | `spacing?: number`, `alignment?: StackAlignment` | `StackNode.spacing`, `StackNode.alignment` |
| `ZStack` | `ZStackOptions` | `alignment?: Alignment` | `ZStackNode.alignment` |
| `Frame` | `FrameOptions` | `width`, `height`, `minWidth`, `minHeight`, `idealWidth`, `idealHeight`, `maxWidth`, `maxHeight`, `alignment` | Matching `FrameNode` properties |
| `Padding` | `PaddingOptions` or `InsetsInput` | `insets?: InsetsInput` | `PaddingNode.insets` |
| `Background`, `Overlay` | `DecorationOptions` | `alignment?: Alignment` | `DecorationNode.alignment` |
| `Spacer` | `SpacerOptions` | `minLength?: number` | `SpacerNode.minLength` |

Children are never constructor arguments. Use `append`, `prepend`, `insertBefore`, or `replaceChildren`.

### Custom Layouts

```ts
class FlowLayout extends Layout {
  constructor() {
    super('flow')
  }

  override measureSelf({ children, proposal }: LayoutMeasureInput): Size {
    const sizes = children.map((child) => child.measure(proposal))
    return {
      width: sizes.reduce((sum, size) => sum + size.width, 0),
      height: Math.max(0, ...sizes.map((size) => size.height)),
    }
  }

  override placeChildren({ bounds, children, proposal }: LayoutPlaceInput): void {
    let x = bounds.x
    for (const child of children) {
      const size = child.measure(proposal)
      child.place({ x, y: bounds.y, width: size.width, height: size.height }, size)
      x += size.width
    }
  }
}

const flow = new FlowLayout().append(first, second)
```

`placeChildren` is command-style: call `child.place(...)` directly. `bounds` is in the layout node's own local coordinate space, so direct child placements are parent-local rects.

`LayoutMeasureInput` contains `proposal`, `children`, and `node`. `LayoutPlaceInput` contains `bounds`, `proposal`, `children`, and `node`. Each `LayoutChild` exposes `node`, `id`, `kind`, `isSpacer`, `measure(proposal)`, and `place(bounds, proposal?)`.

### DOM Helpers

The `@liquid-dom/layout/dom` subpath provides `DomLeaf`, `measureDomElement`, and `subscribeDomElement` for HTML element measurement.

```ts
import { DomLeaf } from '@liquid-dom/layout/dom'

const node = new DomLeaf({
  element,
  sizing: 'intrinsic',
})
```

DOM helper API:

| API | Description |
| --- | --- |
| `DomLeaf` | A `Leaf` subclass measured from an `HTMLElement`. It observes DOM changes only while reachable from an active `LayoutEngine.root`. |
| `measureDomElement(element, proposal?, options?)` | Measures an element clone using the selected sizing mode. |
| `subscribeDomElement(element, notify)` | Subscribes to resize, class/style/content mutation, image load/error, and font-load changes. |
| `DomLeafSizing` | `'intrinsic'`, `'constrained-width'`, or `'fill'`. |
| `DomMeasureOptions` | `{ sizing?: DomLeafSizing }` |
| `DomLeafOptions` | `{ element: HTMLElement; sizing?: DomLeafSizing; measureKey?: unknown }` |

## Integration Notes

Keep render metadata outside layout nodes. A UI object can hold a reference to its layout node:

```ts
type View = {
  element: HTMLElement
  layoutNode: import('@liquid-dom/layout').LayoutNode
}

function applyViewLayout(view: View) {
  const layout = view.layoutNode.layout
  if (!layout) return

  Object.assign(view.element.style, {
    position: 'absolute',
    left: '0px',
    top: '0px',
    transform: `translate3d(${layout.rect.x}px, ${layout.rect.y}px, 0)`,
    width: `${layout.rect.width}px`,
    height: `${layout.rect.height}px`,
  })
}
```

If your renderer skips layout-only intermediary nodes, use `layout.absoluteRect` for root-local geometry, or attach render groups to the intermediary layout nodes that own those coordinate boundaries.

## Local Development

```sh
pnpm --filter @liquid-dom/layout build
pnpm --filter @liquid-dom/layout test
pnpm --filter @liquid-dom/layout typecheck
```
