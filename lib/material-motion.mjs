import autoAnimate from '../node_modules/@formkit/auto-animate/index.mjs';

export const UI_TIMING = { duration: 180, easing: 'cubic-bezier(.2,.75,.25,1)' };
export const GLASS_TIMING = { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' };
export const NEUMORPHIC_TIMING = { duration: 200, easing: 'cubic-bezier(.25,.75,.25,1)' };
export const CLAY_TIMING = { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' };
const settling = { glass: GLASS_TIMING, neumorphic: NEUMORPHIC_TIMING, clay: CLAY_TIMING };
export function materialTiming(style) { return settling[style] || UI_TIMING; }
export function materialMotionAllowed(style, preference, systemReduced) {
    return ['flat','glass','neumorphic','clay'].includes(style) && preference !== 'off' && !systemReduced;
}
export function layoutFrames(before, after, resize = false) {
    if (!before || !after || !after.width || !after.height) return null;
    const x = before.left - after.left, y = before.top - after.top;
    const sx = resize ? before.width / after.width : 1, sy = resize ? before.height / after.height : 1;
    if (Math.abs(x) + Math.abs(y) + Math.abs(sx - 1) + Math.abs(sy - 1) < .01) return null;
    return [{ transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})` },
        { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' }];
}

// Native dialogs/popovers and hidden settings rows change attributes rather than
// child order. A hidden cue tells auto-animate to run their planned effects.
// It never enters a card grid; Sortable and gridMotion retain exclusive ownership.
export function createMaterialMotion({ doc = document, allowed, timing = () => UI_TIMING, animate = autoAnimate, Effect = KeyframeEffect, style = getComputedStyle, Observer = globalThis.MutationObserver } = {}) {
    const owners = new Map(), effects = new WeakSet(), targets = new Set();
    function cancel(target) {
        for (const animation of target.getAnimations()) if (effects.has(animation.effect)) animation.cancel();
    }
    function owner(container) {
        if (owners.has(container)) return owners.get(container);
        const plans = new Map();
        const plugin = element => {
            const plan = plans.get(element); plans.delete(element);
            const effect = new Effect(element, plan && allowed() ? plan : [], plan && allowed() ? timing() : { duration: 0 });
            effects.add(effect);
            return [effect, { styleReset: false }];
        };
        const record = { plans, cue: null, controller: animate(container, plugin) };
        owners.set(container, record); return record;
    }
    function play(container, target, frames) {
        if (!frames || !allowed() || !target.isConnected) { cancel(target); return; }
        const record = owner(container); record.plans.set(target, frames); targets.add(target);
        const cue = doc.createElement('span'); cue.hidden = true; cue.dataset.motionCue = '';
        container.append(cue); record.cue?.remove(); record.cue = cue;
    }
    function reveal(target, opening, container = target) {
        if (!allowed() || (opening && !target.getClientRects().length)) return;
        const current = style(target), interrupted = target.getAnimations().some(a => effects.has(a.effect) && a.playState === 'running');
        const live = { opacity: current.opacity, ...(target.tagName !== 'DIALOG' ? { transform: current.transform } : {}) };
        cancel(target);
        const base = style(target).transform;
        // Dialogs contain fixed-position drawers/toasts. Never establish a
        // transformed containing block on them, including during entry.
        const transform = target.tagName !== 'DIALOG';
        const rest = { opacity: 1, ...(transform ? { transform: base } : {}) };
        const away = { opacity: 0, ...(transform ? { transform: `translateY(6px) ${base === 'none' ? '' : base}`.trim() } : {}) };
        play(container, target, opening ? [interrupted ? live : away, rest] : [live, away]);
    }
    function capture(containers) {
        if (!allowed()) return () => {};
        const snapshots = new Map();
        for (const container of containers) {
            owner(container);
            for (const child of container.children) if (!child.hidden && child.getClientRects().length && !child.hasAttribute('data-motion-cue')) snapshots.set(child, child.getBoundingClientRect());
        }
        return () => {for (const container of containers) for (const child of [...container.children]) {
            if (child.hidden || !child.getClientRects().length || child.hasAttribute('data-motion-cue')) continue;
            const before = snapshots.get(child); cancel(child);
            if (before) play(container, child, layoutFrames(before, child.getBoundingClientRect()));
            else reveal(child, true, container);
        }};
    }
    function layout(containers, change) {
        const finish=capture(containers),result=change();finish();return result;
    }
    function move(target, change, { resize = false, revealOnly = false } = {}) {
        if (!allowed() || !target.getClientRects().length) return change();
        const before = target.getBoundingClientRect(); const result = change(); cancel(target);
        if (revealOnly) reveal(target, true);
        else play(target, target, layoutFrames(before, target.getBoundingClientRect(), resize));
        return result;
    }
    function sync() {
        if (allowed()) return;
        for (const target of targets) cancel(target);
        for (const record of owners.values()) record.plans.clear();
    }
    function native(surface) {
        owner(surface);
        let lastState;
        function toggle(opening) {
            if (lastState === opening) return;
            lastState = opening;
            // Discrete display keeps the exit visible, so remove the closed
            // surface from input and accessibility immediately, not after paint.
            surface.inert = !opening;
            if(opening)surface.removeAttribute('aria-hidden');else surface.setAttribute('aria-hidden','true');
            // Let native visibility and the menu's final anchored position settle
            // in this task. Closing surfaces retain paint via discrete CSS only.
            queueMicrotask(() => reveal(surface, opening));
        }
        surface.addEventListener('beforetoggle', event => toggle(event.newState === 'open'));
        // Dialog toggle events arrived in Chrome 132. Attribute observation
        // preserves Chrome 120+ behavior and deduplicates with newer events.
        if (surface.tagName === 'DIALOG' && Observer) {
            new Observer(() => toggle(surface.open)).observe(surface, { attributes: true, attributeFilter: ['open'] });
        }
    }
    return { play, reveal, capture, layout, move, sync, native, cancel };
}
