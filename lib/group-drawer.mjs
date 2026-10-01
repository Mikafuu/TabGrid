// Drawer placement never changes the grid layout or Sortable's card geometry.
export function dockAt(x, y, width, height) {
    const distances = { left: x, right: width - x, top: y, bottom: height - y };
    const edge = Object.keys(distances).reduce((a, b) => distances[a] <= distances[b] ? a : b);
    const vertical = edge === 'left' || edge === 'right';
    return { drawerEdge: edge, drawerOffset: Math.round(Math.max(0, Math.min(100, (vertical ? y / height : x / width) * 100))) };
}
export function drawerPosition(edge, offset, width, height, viewWidth, viewHeight) {
    const maxX = Math.max(0, viewWidth - width), maxY = Math.max(0, viewHeight - height);
    return {
        left: edge === 'left' ? 0 : edge === 'right' ? maxX : maxX * offset / 100,
        top: edge === 'top' ? 0 : edge === 'bottom' ? maxY : maxY * offset / 100
    };
}
export function resizeDrawer(length, delta) { return Math.round(Math.max(64, Math.min(320, length + delta))); }
export function mountGroupDrawer(tray, { getPrefs, save, dragging, announce, motion }) {
    const grip = document.createElement('div'); grip.className = 'drawer-grip';
    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'drawer-handle'; handle.textContent = '▤';
    handle.setAttribute('aria-label', 'Group destinations'); handle.title = 'Group destinations · Drag to an edge to move';
    const list = document.createElement('div'); list.className = 'drawer-list'; list.id = `${tray.id}-list`; list.hidden = true;
    handle.setAttribute('aria-controls', list.id); handle.setAttribute('aria-expanded', 'false');
    const help = document.createElement('span'); help.id = `${tray.id}-help`; help.className = 'sr-only';
    help.textContent = 'Drag the middle to an edge. Alt plus an arrow docks there. Enter shows destinations. Use the end buttons to resize.';
    handle.setAttribute('aria-describedby', help.id);
    let expanded = false, moving = null, resizing = null, previewLength = null, suppressClick = false, lastPointer = null;
    const caps = [-1, 1].map(direction => {
        const cap = document.createElement('button'); cap.type = 'button'; cap.className = 'drawer-resize';
        cap.setAttribute('aria-label', `${direction < 0 ? 'Shorten' : 'Lengthen'} group drawer`); cap.title = 'Click or drag to resize';
        cap.textContent = direction < 0 ? '−' : '+';
        cap.addEventListener('click', e => { if (suppressClick) { suppressClick = false; e.preventDefault(); return; } persist({ drawerLength: resizeDrawer(getPrefs().drawerLength, direction * 32) }); });
        cap.addEventListener('keydown', e => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault(); persist({ drawerLength: e.key === 'Home' ? 64 : e.key === 'End' ? 320 : resizeDrawer(getPrefs().drawerLength, ['ArrowUp','ArrowLeft'].includes(e.key) ? -16 : 16) });
        });
        cap.addEventListener('pointerdown', e => {
            if (e.button !== 0 || dragging() || expanded) return;
            suppressClick = false; const vertical = ['left','right'].includes(getPrefs().drawerEdge);
            resizing = { id: e.pointerId, start: vertical ? e.clientY : e.clientX, length: getPrefs().drawerLength, vertical, direction, moved: false };
            cap.setPointerCapture(e.pointerId);
        });
        cap.addEventListener('pointermove', e => {
            if (!resizing || resizing.id !== e.pointerId) return;
            const delta = ((resizing.vertical ? e.clientY : e.clientX) - resizing.start) * resizing.direction;
            if (!resizing.moved && Math.abs(delta) < 4) return;
            resizing.moved = true; previewLength = resizeDrawer(resizing.length, delta); motion?.cancel(tray); place();
        });
        const finishResize = e => {
            if (!resizing || resizing.id !== e.pointerId) return;
            const moved = resizing.moved, value = previewLength; resizing = null; previewLength = null;
            suppressClick = moved; if (cap.hasPointerCapture(e.pointerId)) cap.releasePointerCapture(e.pointerId);
            if (moved && e.type === 'pointerup') persist({ drawerLength: value }); else place();
        };
        cap.addEventListener('pointerup', finishResize); cap.addEventListener('pointercancel', finishResize); cap.addEventListener('lostpointercapture', finishResize);
        return cap;
    });
    grip.append(caps[0], handle, caps[1]); tray.append(grip, list, help);
    function place() {
        if (moving?.moved || tray.hidden) return;
        const prefs = getPrefs(); tray.dataset.edge = prefs.drawerEdge;
        tray.style.setProperty('--drawer-length', `${previewLength ?? prefs.drawerLength}px`);
        const point = drawerPosition(prefs.drawerEdge, prefs.drawerOffset, tray.offsetWidth, tray.offsetHeight, innerWidth, innerHeight);
        if (expanded && ['left','right'].includes(prefs.drawerEdge)) {
            const length = previewLength ?? prefs.drawerLength;
            const collapsed = drawerPosition(prefs.drawerEdge, prefs.drawerOffset, tray.offsetWidth, length + 2, innerWidth, innerHeight);
            point.top = Math.max(0, Math.min(innerHeight - tray.offsetHeight, collapsed.top + (length + 2 - tray.offsetHeight) / 2));
        }
        tray.style.left = `${point.left}px`; tray.style.top = `${point.top}px`;
    }
    function expand(value) {
        if (expanded === value) return;
        if (!value && list.contains(document.activeElement)) handle.focus({ preventScroll: true });
        const change=()=>{expanded = value; list.hidden = !value; tray.classList.toggle('expanded', value); handle.setAttribute('aria-expanded', String(value));caps.forEach(cap => { cap.disabled = value || dragging(); }); place();};
        if(motion)motion.move(tray,change,{resize:true});else change();
        if(value)motion?.reveal(list,true,tray);
    }
    async function persist(value,before=tray.getBoundingClientRect()) { motion?.cancel(tray);try { await save(value); } catch (error) { announce(error.message, true); } place();if(motion){const after=tray.getBoundingClientRect();if(after.width&&after.height)motion.play(tray,tray,[{transformOrigin:'0 0',transform:`translate(${before.left-after.left}px,${before.top-after.top}px) scale(${before.width/after.width},${before.height/after.height})`},{transformOrigin:'0 0',transform:'translate(0,0) scale(1,1)'}]);} }
    handle.addEventListener('click', e => { if (suppressClick) { suppressClick = false; e.preventDefault(); return; } expand(!expanded); });
    handle.addEventListener('keydown', e => {
        const edge = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'top', ArrowDown: 'bottom' }[e.key];
        if (e.altKey && edge) { e.preventDefault(); persist({ drawerEdge: edge }); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); expand(false); }
    });
    handle.addEventListener('pointerdown', e => {
        if (e.button !== 0 || dragging()) return;
        suppressClick = false; moving = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', e => {
        if (!moving || moving.id !== e.pointerId) return;
        if (!moving.moved && Math.hypot(e.clientX - moving.x, e.clientY - moving.y) < 6) return;
        moving.moved = true; expand(false); motion?.cancel(tray); tray.classList.add('drawer-moving');
        // A constant 128px pill follows the pointer; docking restores the saved size.
        tray.style.left = `${Math.max(0, Math.min(innerWidth - tray.offsetWidth, e.clientX - tray.offsetWidth / 2))}px`;
        tray.style.top = `${Math.max(0, Math.min(innerHeight - tray.offsetHeight, e.clientY - tray.offsetHeight / 2))}px`;
    });
    function finish(e) {
        if (!moving || moving.id !== e.pointerId) return;
        const moved = moving.moved,before=tray.getBoundingClientRect(); moving = null; tray.classList.remove('drawer-moving');
        if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
        suppressClick = moved;
        if (moved && e.type === 'pointerup') persist(dockAt(e.clientX, e.clientY, innerWidth, innerHeight),before); else place();
    }
    handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish); handle.addEventListener('lostpointercapture', finish);
    tray.addEventListener('pointerleave', () => { if (!dragging() && !moving && !resizing && !tray.contains(document.activeElement)) expand(false); });
    tray.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) { e.preventDefault(); e.stopPropagation(); expand(false); } });
    tray.addEventListener('focusout', e => { if (!tray.contains(e.relatedTarget) && !dragging() && !moving && !resizing) expand(false); });
    function approach(x, y) {
        lastPointer = { x, y };
        if (!dragging() || moving || resizing || tray.hidden) return;
        const rect = tray.getBoundingClientRect(), margin = 64;
        expand(x >= rect.left - margin && x <= rect.right + margin && y >= rect.top - margin && y <= rect.bottom + margin);
    }
    document.addEventListener('pointermove', e => approach(e.clientX, e.clientY));
    // Sortable's desktop fallback listens to mouse events too.
    document.addEventListener('mousemove', e => approach(e.clientX, e.clientY));
    window.addEventListener('resize', place);
    return { list, sync: () => { caps.forEach(cap => { cap.disabled = expanded || dragging(); }); place(); if (dragging() && lastPointer) approach(lastPointer.x, lastPointer.y); }, collapse: () => expand(false) };
}
