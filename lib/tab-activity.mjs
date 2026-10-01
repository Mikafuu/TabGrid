import { isGridUrl } from './tab-model.mjs';

// Normal-mode recency is keyed by URL so restored tabs with new IDs retain it.
// Sharing recency between copies of a URL conservatively keeps them active.
export class TabActivity {
    constructor(api, gridUrl, privateMode) { this.api = api; this.gridUrl = gridUrl; this.private = privateMode; }
    async update(ids = [], now = Date.now()) {
        if (this.private) return {};
        const tabs = (await this.api.tabs.query({})).filter(t => !t.incognito && (t.url || t.pendingUrl) && !isGridUrl(t.url || t.pendingUrl, this.gridUrl));
        const { tabActivity = [] } = await this.api.storage.local.get('tabActivity');
        const ledger = new Map(tabActivity.filter(r => typeof r.url === 'string' && Number.isFinite(r.at)).map(r => [r.url, r.at]));
        const touched = new Set(ids);
        const openUrls = new Set(tabs.map(t => t.url || t.pendingUrl));
        for (const tab of tabs) {
            const url = tab.url || tab.pendingUrl;
            const native = Number.isFinite(tab.lastAccessed) ? Math.min(tab.lastAccessed, now) : 0;
            const at = touched.has(tab.id) ? now : Math.max(native, ledger.get(url) || 0) || now;
            ledger.set(url, at);
        }
        const records = [...ledger].filter(([url, at]) => openUrls.has(url) || now - at < 120 * 86400000)
            .sort((a,b) => Number(openUrls.has(b[0])) - Number(openUrls.has(a[0])) || b[1] - a[1]).slice(0, Math.max(5000, openUrls.size)).map(([url, at]) => ({ url, at }));
        if (JSON.stringify(records) !== JSON.stringify(tabActivity)) await this.api.storage.local.set({ tabActivity: records });
        return Object.fromEntries(tabs.map(t => [t.id, ledger.get(t.url || t.pendingUrl)]));
    }
}
