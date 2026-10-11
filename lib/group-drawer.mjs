import { layoutFrames } from './material-motion.mjs';
// Drawer placement never changes the grid layout or Sortable's card geometry.
export function dockAt(x, y, width, height) {
    return { drawerEdge: x < width / 2 ? 'left' : 'right', drawerOffset: Math.round(Math.max(0, Math.min(100, y / Math.max(1, height) * 100))) };
}
export function drawerPosition(edge, offset, width, height, viewWidth, viewHeight) {
    const maxX = Math.max(0, viewWidth - width), maxY = Math.max(0, viewHeight - height);
    return {
        left: edge === 'right' ? maxX : 0,
        top: maxY * offset / 100
    };
}
// Keep the latest local drop authoritative while storage notifications catch up.
export function drawerPlacement(getPrefs, save, onError = () => {}) {
    let pending = null, revision = 0, queue = Promise.resolve();
    return {
        read: () => ({...getPrefs(), ...pending}),
        update(value) {
            const own = ++revision;
            pending = {...pending, ...value};
            const patch = {...pending};
            queue = queue.then(() => save(patch)).catch(onError).finally(() => {
                if (own === revision) pending = null;
            });
            return queue;
        }
    };
}
export const drawerDragged = (start, end) => Boolean(start.moved || Math.hypot(end.clientX - start.x, end.clientY - start.y) >= 6);
export function nearDrawer(rect, x, y, margin = 64) {
    return x >= rect.left - margin && x <= rect.left + rect.width + margin && y >= rect.top - margin && y <= rect.top + rect.height + margin;
}
export function mountGroupDrawer(tray, { getPrefs, save, dragging, announce, motion }) {
    const grip = document.createElement('div'); grip.className = 'drawer-grip';
    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'drawer-handle'; handle.textContent = '';
    handle.setAttribute('aria-label', 'Group destinations'); handle.title = 'Group destinations · Drag to the left or right half to move';
    const list = document.createElement('div'); list.className = 'drawer-list'; list.id = `${tray.id}-list`; list.hidden = true;
    handle.setAttribute('aria-controls', list.id); handle.setAttribute('aria-expanded', 'false');
    const help = document.createElement('span'); help.id = `${tray.id}-help`; help.className = 'sr-only';
    help.textContent = 'Drag to the left or right half of the page to dock. Alt plus Left or Right docks there. Enter shows destinations.';
    handle.setAttribute('aria-describedby', help.id);
    let expanded = false, moving = null, suppressClick = false, lastPointer = null;
    const placement = drawerPlacement(getPrefs, save, error => announce(error.message, true));
    grip.append(handle); tray.append(grip, list, help);
    function place() {
        if (moving?.moved || tray.hidden) return;
        const prefs = placement.read(); tray.dataset.edge = prefs.drawerEdge === 'right' ? 'right' : 'left';

        const point = drawerPosition(prefs.drawerEdge, prefs.drawerOffset, tray.offsetWidth, tray.offsetHeight, innerWidth, innerHeight);
        if (expanded) {
            const collapsed = drawerPosition(prefs.drawerEdge, prefs.drawerOffset, tray.offsetWidth, Math.min(128, innerHeight * .85), innerWidth, innerHeight);
            point.top = Math.max(0, Math.min(innerHeight - tray.offsetHeight, collapsed.top + (Math.min(128, innerHeight * .85) - tray.offsetHeight) / 2));
        }
        tray.style.left = `${point.left}px`; tray.style.top = `${point.top}px`;
    }
    function expand(value) {
        if (expanded === value) return;
        if (!value && list.contains(document.activeElement)) handle.focus({ preventScroll: true });
        const change=()=>{expanded = value; list.hidden = !value; tray.classList.toggle('expanded', value); handle.setAttribute('aria-expanded', String(value));place();};
        if(motion)motion.move(tray,change,{resize:true});else change();
        if(value)motion?.reveal(list,true,tray);
    }
    function persist(value, before = tray.getBoundingClientRect()) {
        motion?.cancel(tray);
        const saved = placement.update(value);
        tray.classList.remove('drawer-moving');
        place();
        motion?.play(tray, tray, layoutFrames(before, tray.getBoundingClientRect(), true));
        // Reconcile only after the queued saves. Never replay a previous drop's motion.
        saved.then(() => { if (!moving) place(); });
    }
    handle.addEventListener('click', e => { if (suppressClick) { suppressClick = false; e.preventDefault(); return; } expand(!expanded); });
    handle.addEventListener('keydown', e => {
        const edge = { ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
        if (e.altKey && edge) { e.preventDefault(); persist({ drawerEdge: edge }); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); expand(false); }
    });
    handle.addEventListener('pointerdown', e => {
        if (e.button !== 0 || dragging()) return;
        const visual=tray.getBoundingClientRect(); motion?.cancel(tray); tray.style.left=`${visual.left}px`;tray.style.top=`${visual.top}px`; suppressClick = false; moving = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', e => {
        if (!moving || moving.id !== e.pointerId) return;
        if (!moving.moved && Math.hypot(e.clientX - moving.x, e.clientY - moving.y) < 6) return;
        moving.moved = true; expand(false); motion?.cancel(tray); tray.classList.add('drawer-moving');
        // The same fixed-height handle follows the pointer during docking.
        tray.style.left = `${Math.max(0, Math.min(innerWidth - tray.offsetWidth, e.clientX - tray.offsetWidth / 2))}px`;
        tray.style.top = `${Math.max(0, Math.min(innerHeight - tray.offsetHeight, e.clientY - tray.offsetHeight / 2))}px`;
    });
    function finish(e) {
        if (!moving || moving.id !== e.pointerId) return;
        const moved = e.type === 'pointerup' ? drawerDragged(moving, e) : moving.moved, before = tray.getBoundingClientRect(); moving = null;
        if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
        suppressClick = moved;
        if (moved && e.type === 'pointerup') persist(dockAt(e.clientX, e.clientY, innerWidth, innerHeight),before); else { tray.classList.remove('drawer-moving'); motion?.cancel(tray); place(); }
    }
    handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish); handle.addEventListener('lostpointercapture', finish);
    tray.addEventListener('pointerleave', () => { if (!dragging() && !moving && !tray.contains(document.activeElement)) expand(false); });
    tray.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) { e.preventDefault(); e.stopPropagation(); expand(false); } });
    tray.addEventListener('focusout', e => { if (!tray.contains(e.relatedTarget) && !dragging() && !moving) expand(false); });
    function isNear(x = lastPointer?.x, y = lastPointer?.y) {
        // Use layout bounds, not the animated surface, so approach never flickers.
        return !tray.hidden && nearDrawer({left:tray.offsetLeft,top:tray.offsetTop,width:tray.offsetWidth,height:tray.offsetHeight}, x, y);
    }
    function approach(x, y) {
        lastPointer = { x, y };
        if (!dragging() || moving || tray.hidden) return;
        expand(isNear(x, y));
    }
    document.addEventListener('pointermove', e => approach(e.clientX, e.clientY));
    // Sortable's desktop fallback listens to mouse events too.
    document.addEventListener('mousemove', e => approach(e.clientX, e.clientY));
    window.addEventListener('resize', place);
    return { list, isNear, sync: () => { place(); if (dragging() && lastPointer) approach(lastPointer.x, lastPointer.y); }, collapse: () => expand(false) };
}
