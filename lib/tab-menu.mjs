export function windowLabel(tabs) {
    const ordered = [...tabs].sort((a, b) => a.index - b.index);
    const title = ordered[0]?.title || ordered[0]?.url || 'Empty Window';
    const others = ordered.length - 1;
    return others > 0 ? `${title} and ${others} Other ${others === 1 ? 'Tab' : 'Tabs'}` : title;
}

export function relativeTabIds(tabs, ids, mode) {
    const selected = new Set(ids);
    const ends = new Map();
    for (const tab of tabs) if (selected.has(tab.id)) ends.set(tab.windowId, Math.max(ends.get(tab.windowId) ?? -1, tab.index));
    return tabs.filter(tab => ends.has(tab.windowId) && !selected.has(tab.id) && !tab.pinned &&
        (mode === 'others' || tab.index > ends.get(tab.windowId))).map(tab => tab.id);
}

export function siteOrigins(tabs) {
    return [...new Set(tabs.flatMap(tab => {
        try { const url = new URL(tab.url || tab.pendingUrl); return /^https?:$/.test(url.protocol) ? [url.origin] : []; }
        catch { return []; }
    }))];
}

// Leave the opener exposed: tall menus scroll on the side with more space.
export function anchoredMenuLayout(rect, width, height, viewportWidth, viewportHeight, align = 'left') {
    const below = viewportHeight - rect.bottom - 12, above = rect.top - 12;
    const downward = height <= below || below >= above;
    height = Math.min(height, Math.max(0, downward ? below : above));
    return {
        height,
        left: Math.max(8, Math.min(align === 'right' ? rect.right - width : rect.left, viewportWidth - width - 8)),
        top: downward ? rect.bottom + 4 : rect.top - height - 4
    };
}

// Hover owns visibility; pointer and mouse compatibility events are deduplicated.
export function bindSubmenuHover(trigger, {
    active, open, close, contains = node => trigger.contains(node), delay = 150,
    schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id)
}) {
    let inside=false, pending=null;
    const reset=()=>{inside=false;if(pending!==null)cancel(pending);pending=null;};
    const enter=event=>{
        if(contains(event.relatedTarget)||inside||trigger.disabled)return;
        inside=true;
        if(active())pending=schedule(()=>{
            pending=null;
            if(inside&&!trigger.disabled&&active())open();
        },delay);
    };
    const leave=event=>{
        if(contains(event.relatedTarget))return;
        if(!inside)return;
        reset();close();
    };
    for(const type of ['pointerover','mouseover'])trigger.addEventListener(type,enter);
    for(const type of ['pointerout','mouseout'])trigger.addEventListener(type,leave);
    return {leave, reset};
}
