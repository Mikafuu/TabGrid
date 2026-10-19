import { createLiquidMotion } from './liquid-motion.mjs';
import autoAnimate from '../node_modules/@formkit/auto-animate/index.mjs';

export const UI_TIMING = { duration: 180, easing: 'cubic-bezier(.2,.75,.25,1)' };
export const GLASS_TIMING = { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' };
export const NEUMORPHIC_TIMING = { duration: 200, easing: 'cubic-bezier(.25,.75,.25,1)' };
export const CLAY_TIMING = { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' };
const settling = { glass: GLASS_TIMING, neumorphic: NEUMORPHIC_TIMING, clay: CLAY_TIMING };
export function materialTiming(style, speed = 'standard') { const timing = settling[style] || UI_TIMING; return {...timing, duration: Math.round(timing.duration * ({efficient:.65,standard:1,smooth:1.6}[speed] ?? 1))}; }
export function materialMotionAllowed(style, preference, systemReduced) {
    return ['classic','flat','glass','neumorphic','clay'].includes(style) && preference !== 'off' && !systemReduced;
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
export function createMaterialMotion({ doc = document, allowed, timing = () => UI_TIMING, animate = autoAnimate, Effect = KeyframeEffect, style = getComputedStyle, Observer = globalThis.MutationObserver, liquid = () => false } = {}) {
    const liquidMotion = typeof requestAnimationFrame === 'function' ? createLiquidMotion({allowed:()=>liquid()&&allowed(),speed:()=>timing().duration/220}) : null;
    const owners = new Map(), effects = new WeakSet(), targets = new Set();
    function cancel(target) {
        targets.delete(target);
        liquidMotion?.cancel(target);
        for (const record of owners.values()) for (const [anchor, plan] of record.plans) if (plan.target === target) record.plans.delete(anchor);
        for (const animation of target.getAnimations()) if (effects.has(animation.effect)) animation.cancel();
    }
    function owner(container) {
        if (owners.has(container)) return owners.get(container);
        const plans = new Map();
        const plugin = element => {
            // Nested popovers can already belong to the parent's auto-animate
            // observer. Consume their plan through that observer as well.
            const source = [...owners.values()].find(record => record.plans.has(element));
            const plan = source?.plans.get(element); source?.plans.delete(element);
            const effect = new Effect(plan?.target || element, plan && allowed() ? plan.frames : [], plan && allowed() ? (plan.effectTiming || timing()) : { duration: 0 });
            effects.add(effect);
            if(plan?.onFinish)queueMicrotask(()=>{
                // auto-animate constructs/plays the Animation after this plugin
                // returns. Tie cleanup to its real finish, not a guessed timer.
                const animation=plan.target.getAnimations().find(a=>a.effect===effect);
                animation?.addEventListener('finish',plan.onFinish,{once:true});
            });
            return [effect, { styleReset: false }];
        };
        const record = { plans, cue: null, controller: animate(container, plugin) };
        owners.set(container, record); return record;
    }
    function play(container, target, frames, { anchor = target, duration = .18, effectTiming, onFinish } = {}) {
        if (!frames || !allowed() || !target.isConnected) { cancel(target); return; }
        if (liquid() && liquidMotion && !effectTiming) {
            liquidMotion.play(target,frames[0],frames[frames.length-1],{duration});return;
        }
        const record = owner(container); record.plans.set(anchor, {target, frames, effectTiming, onFinish}); targets.add(target);
        const cue = doc.createElement('span'); cue.hidden = true; cue.dataset.motionCue = '';
        container.append(cue); record.cue?.remove(); record.cue = cue;
    }
    function reveal(target, opening, container = target, anchor = target) {
        if (!allowed() || (opening && !target.getClientRects().length)) return;
        const current = style(target), interrupted = liquidMotion?.has(target) || target.getAnimations().some(a => effects.has(a.effect) && a.playState === 'running');
        const transform = target.tagName !== 'DIALOG' && target.getAttribute?.('role') !== 'menu';
        const live = { opacity: current.opacity, ...(transform ? { transform: current.transform } : {}) };
        cancel(target);
        const base = style(target).transform;
        // Dialogs contain fixed-position drawers/toasts. Never establish a
        // transformed containing block on them, including during entry.
        const rest = { opacity: 1, ...(transform ? { transform: base } : {}) };
        const away = { opacity: 0, ...(transform ? { transform: `translateY(6px) ${base === 'none' ? '' : base}`.trim() } : {}) };
        play(container, target, opening ? [interrupted ? live : away, rest] : [live, away], {anchor, duration:opening ? .18 : .22});
    }
    function capture(containers) {
        if (!allowed()) return () => {};
        const snapshots = new Map();
        for (const container of containers) {
            owner(container);
            for (const child of container.children) if (!child.hidden && child.getClientRects().length && !child.hasAttribute('data-motion-cue') && !child.classList?.contains('filter-glass-surface')) snapshots.set(child, child.getBoundingClientRect());
        }
        return () => {for (const container of containers) for (const child of [...container.children]) {
            if (child.hidden || !child.getClientRects().length || (child.hasAttribute('data-motion-cue') || child.classList?.contains('filter-glass-surface'))) continue;
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
        const before = target.getBoundingClientRect(); cancel(target); const result = change();
        if (revealOnly) reveal(target, true);
        else play(target, target, layoutFrames(before, target.getBoundingClientRect(), resize));
        return result;
    }
    function disclose(target, opening, container) {
        const before = {height: `${target.getBoundingClientRect().height}px`, opacity: style(target).opacity};
        cancel(target);
        target.toggleAttribute('data-collapsed', !opening);
        target.inert = !opening;
        target.setAttribute('aria-hidden', String(!opening));
        const after = {height: `${target.getBoundingClientRect().height}px`, opacity: style(target).opacity};
        // The heading remains visible even when the content's final height is zero.
        play(container, target, [before, after], {anchor: container});
    }
    function sync() {
        liquidMotion?.sync();
        if (allowed()) return;
        for (const target of targets) cancel(target);
        for (const record of owners.values()) record.plans.clear();
    }
    function native(surface, { transition } = {}) {
        // Keep native popup animation observers away from their dynamic content.
        // Inserting a nested submenu must never re-animate its parent.
        const driver=doc.createElement('div');driver.hidden=true;doc.body.append(driver);
        owner(driver);
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
            queueMicrotask(() => {
                if (lastState !== opening) return;
                if (!transition?.(opening, driver)) reveal(surface, opening, driver, driver);
            });
        }
        surface.addEventListener('beforetoggle', event => toggle(event.newState === 'open'));
        // Dialog toggle events arrived in Chrome 132. Attribute observation
        // preserves Chrome 120+ behavior and deduplicates with newer events.
        if (surface.tagName === 'DIALOG' && Observer) {
            new Observer(() => toggle(surface.open)).observe(surface, { attributes: true, attributeFilter: ['open'] });
        }
    }
    return { play, reveal, capture, layout, move, sync, native, cancel, disclose };
}
