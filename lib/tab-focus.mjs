import { isGridUrl } from './tab-model.mjs';

// Remember the last website or opened group per window; opening TabGrid does not
// replace it. Incognito state stays in the split worker's memory, never storage.
export class TabFocus {
    constructor(api, gridUrl) {
        this.api = api; this.gridUrl = gridUrl;
        this.private = Boolean(api.extension?.inIncognitoContext); this.records = {};
    }
    async tabs() {
        return (await this.api.tabs.query({})).filter(t => Boolean(t.incognito) === this.private && !isGridUrl(t.url || t.pendingUrl, this.gridUrl));
    }
    async read() { return this.private ? this.records : (await this.api.storage.session.get('tabgridLastOpened')).tabgridLastOpened || {}; }
    async remember(key) {
        if (!/^(tab|group):\d+$/.test(key)) return;
        const [kind, raw] = key.split(':'); const id = Number(raw);
        const tabs = await this.tabs();
        const tab = tabs.find(t => kind === 'tab' ? t.id === id : t.groupId === id);
        if (!tab) return;
        const records = await this.read();
        for (const windowId of Object.keys(records)) if (!tabs.some(t => t.windowId === Number(windowId))) delete records[windowId];
        records[tab.windowId] = key;
        if (this.private) this.records = records;
        else await this.api.storage.session.set({ tabgridLastOpened: records });
    }
    async snapshot() {
        const tabs = await this.tabs(), records = await this.read(), result = {};
        for (const windowId of new Set(tabs.map(t => t.windowId))) {
            const pool = tabs.filter(t => t.windowId === windowId), key = records[windowId];
            if (pool.some(t => key === `tab:${t.id}` || key === `group:${t.groupId}`)) result[windowId] = key;
            else {
                const last = pool.find(t => t.active) || pool.filter(t => t.lastAccessed > 0).sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
                if (last) result[windowId] = `tab:${last.id}`;
            }
        }
        return result;
    }
}

export function isLastOpened(item, records) {
    const key = records[item.windowId];
    return key === item.key || Boolean(item.members?.some(t => key === `tab:${t.id}`));
}

export function groupPreviewTiles(members) {
    const ordered = [...members].sort((a, b) => a.index - b.index);
    const shown = ordered.slice(0, ordered.length > 4 ? 3 : 4).map(tab => ({ tab }));
    if (ordered.length > 4) shown.push({ remaining: ordered.length - 3 });
    while (shown.length < 4) shown.push({});
    return shown;
}
