import {AnimationManager, spring, easing, Easing} from '../node_modules/@liquid-dom/layout/dist/animation.js';

// Use liquid-dom's live animation engine, not sampled CSS/WAAPI keyframes.
// Timings and spring constants come from its MIT-licensed MenuDemo.
export function createFilterPanelAnimation() {
    const manager = new AnimationManager();
    const state = {height: 0, opacity: 0, y: -6, radius: 28, angle: 0};
    const timeScaleRef = {current: 1};
    function target(open, height) { return {height: open ? height : 0, opacity: open ? 1 : 0, y: open ? 0 : -6, radius: open ? 18 : 28, angle: open ? -180 : 0}; }
    return {state, manager, timeScaleRef,
        set(open, height, instant = false) {
            const next = target(open, height);
            if (instant) { manager.stop(state); Object.assign(state, next); return; }
            const options = {timeScaleRef};
            manager.animate(state, {height: next.height}, easing({duration: open ? .18 : .14,
                ease: Easing.easeOut}), options);
            manager.animate(state, {opacity: next.opacity}, easing({duration: open ? .14 : .1, ease: Easing.easeOut}), options);
            manager.animate(state, {y: next.y}, spring({stiffness:700, damping:38}), options);
            manager.animate(state, {radius: next.radius}, easing({duration:.2, ease:Easing.easeOut}), options);
            manager.animate(state, {angle: next.angle}, easing({duration:.25, ease:Easing.easeOut}), options);
        }
    };
}

export function mountFilterPanelMotion(content, summary, getPrefs) {
    const panel = content.querySelector('.live-filters'), arrow = summary.querySelector('.disclosure-chevron');
    const animation = createFilterPanelAnimation(), {state, manager, timeScaleRef} = animation;
    const root = document.documentElement, reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let open = false, frame = 0, previousTime = 0, measuredHeight = 0;
    const height = () => panel.offsetHeight + (parseFloat(getComputedStyle(panel).marginTop) || 0);
    const allowed = () => getPrefs().visualStyle === 'glass' && getPrefs().motion !== 'off' && !reduced.matches && !document.hidden;
    function paint() {
        content.style.height = `${Math.max(0,state.height)}px`;
        content.style.opacity = String(state.opacity);
        panel.style.transform = `translateY(${state.y}px)`;
        panel.style.borderRadius = `${state.radius}px`;
        arrow.style.transform = `rotate(${state.angle}deg)`;
        content.dispatchEvent(new Event('liquid-glass-frame', {bubbles:true}));
    }
    function finish() {
        cancelAnimationFrame(frame); frame = 0; previousTime = 0;
        content.style.removeProperty('height'); content.style.removeProperty('opacity');
        panel.style.removeProperty('transform'); panel.style.removeProperty('border-radius');
        arrow.style.removeProperty('transform');
        content.dataset.liquidMotion = 'idle';
        content.dispatchEvent(new Event('liquid-glass-frame', {bubbles:true}));
    }
    function tick(time) {
        frame = 0;
        timeScaleRef.current = 1 / ({efficient:.65,standard:1,smooth:1.6}[getPrefs().animationSpeed] ?? 1);
        manager.tick(previousTime ? time - previousTime : 0); previousTime = time;
        paint();
        if (manager.active) frame = requestAnimationFrame(tick); else finish();
    }
    function settle() {
        if (!manager.active) return;
        animation.set(open,height(),true); finish();
    }
    function set(next) {
        if (!manager.active) {
            const wasOpen = !content.hasAttribute('data-collapsed');
            state.height = content.getBoundingClientRect().height;
            state.opacity = wasOpen ? 1 : 0;
            state.y = wasOpen ? 0 : -6; state.radius = wasOpen ? 18 : 28; state.angle = wasOpen ? -180 : 0;
        }
        open = next; measuredHeight = height();
        content.toggleAttribute('data-collapsed',!open); content.inert = !open;
        content.setAttribute('aria-hidden',String(!open));
        content.dataset.liquidMotionEngine = 'liquid-dom';
        animation.set(open, measuredHeight, !allowed());
        if (!manager.active) { finish(); return; }
        content.dataset.liquidMotion = 'running'; paint();
        if (!frame) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
        const next = height();
        if (next !== measuredHeight && open && manager.active) animation.set(true,next);
        measuredHeight = next;
    });
    resize.observe(panel);
    const preferences = new MutationObserver(() => { if (!allowed()) settle(); });
    preferences.observe(root,{attributes:true,attributeFilter:['class','data-visual-style']});
    reduced.addEventListener('change',settle);
    document.addEventListener('visibilitychange',settle);
    return {set, destroy() { animation.set(open,height(),true); finish(); resize.disconnect(); preferences.disconnect(); reduced.removeEventListener('change',settle); document.removeEventListener('visibilitychange',settle); }};
}
