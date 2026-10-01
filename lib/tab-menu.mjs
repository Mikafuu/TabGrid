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
