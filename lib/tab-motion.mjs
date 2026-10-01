// Sortable owns the stable outer slots. Auto-animate runs effects only on the
// inner surfaces, so animation never changes Sortable's hit-test rectangles.
export function scrolledBounds(element) {
    const rect=element.getBoundingClientRect();let parent=element.parentElement,x=0,y=0;
    // Match auto-animate's nearest scrolling ancestor coordinate space.
    while(parent){if(parent.scrollLeft||parent.scrollTop){x=parent.scrollLeft||0;y=parent.scrollTop||0;break;}parent=parent.parentElement;}
    return {left:rect.left+x,top:rect.top+y,width:rect.width,height:rect.height};
}
export function gridMotion(container, { reducedMotion = () => false, layoutTiming = () => ({duration:180,easing:'cubic-bezier(.2,.75,.25,1)'}), Effect = globalThis.KeyframeEffect } = {}) {
    const offsets = new Map();
    const layout = new Map();
    return {
        capture() {
            layout.clear();
            offsets.clear();
            for (const card of container.children) {
                if (!card.itemModel || card.matches('.sortable-ghost, .sortable-fallback, .sortable-drag')) continue;
                const surface = card.querySelector('.card-surface');
                if (!surface) continue;
                const slot = card.getBoundingClientRect(), visual = surface.getBoundingClientRect();
                offsets.set(card, { x: visual.left - slot.left, y: visual.top - slot.top });
            }
        },
        captureLayout() {
            if (reducedMotion()) {layout.clear();return;}
            for (const card of container.children) {
                if (!card.itemModel || card.matches('.sortable-ghost, .sortable-fallback, .sortable-drag') || !card.getClientRects().length) continue;
                const surface = card.querySelector('.card-surface');
                // Multiple synchronous renders share the first visible position.
                // A later render must not replace it before the plugin consumes it.
                if (surface && !layout.has(card)) layout.set(card, scrolledBounds(surface));
            }
        },
        plugin(element, action, before, after) {
            const offset = offsets.get(element) || { x: 0, y: 0 };
            offsets.delete(element);
            const surface = element.querySelector('.card-surface');
            const live = element.matches('.card[data-key]') && element.itemModel;
            const temporary = element.matches('.sortable-ghost, .sortable-fallback, .sortable-drag');
            const visual = layout.get(element); layout.delete(element);
            if (!live || !surface || temporary || reducedMotion()) {
                return [new Effect(element, [], { duration: 0 }), { styleReset: false }];
            }
            if (action === 'remain' && before && after) {
                if (visual && after.width && after.height) {
                    const x=visual.left-after.left,y=visual.top-after.top,sx=visual.width/after.width,sy=visual.height/after.height;
                    const timing=layoutTiming();
                    return new Effect(surface,[{transformOrigin:'0 0',transform:`translate(${x}px, ${y}px) scale(${sx}, ${sy})`},{transformOrigin:'0 0',transform:'translate(0, 0) scale(1, 1)'}],{...timing,duration:Math.abs(x)+Math.abs(y)+Math.abs(sx-1)+Math.abs(sy-1)>.01?timing.duration:0});
                }
                // Capture ran before Sortable's insertion and auto-animate's
                // cancellation. Continue interrupted motion from its visible
                // position instead of snapping back to the previous slot.
                const x = before.left - after.left + offset.x;
                const y = before.top - after.top + offset.y;
                return new Effect(surface, [
                    { transform: `translate(${x}px, ${y}px)` },
                    { transform: 'translate(0, 0)' }
                ], { duration: Math.abs(x) + Math.abs(y) > 0.5 ? 120 : 0, easing: 'ease-out' });
            }
            return new Effect(surface, action === 'add' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-out' });
        }
    };
}
