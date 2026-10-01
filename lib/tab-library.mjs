import { siteMatches } from './preferences.mjs';
// A group becomes inactive as one unit. Unknown ages, active, pinned, and audible
// tabs stay visible. Returning a tab/group starts a fresh inactivity period.
export function inactiveTabIds(tabs, days, returned = {}, now = Date.now(), exceptions = {}) {
    if (!days) return new Set();
    const cutoff = now - days * 86400000;
    const stale = t => !siteMatches(t.url, exceptions.sites || []) && !(exceptions.groups || []).includes(t.groupId) && !t.active && !t.pinned && !t.audible && (Math.max(t.lastAccessed || 0, returned[t.id] || 0) || now) < cutoff;
    const grouped = new Map();
    for (const t of tabs) if (t.groupId !== -1) { const members = grouped.get(t.groupId) || []; members.push(t); grouped.set(t.groupId, members); }
    return new Set(tabs.filter(t => t.groupId === -1 ? stale(t) : grouped.get(t.groupId).every(stale)).map(t => t.id));
}

export class TabLibrary {
    constructor(actions) { this.actions = actions; this.api = actions.api; }
    guard() { if (this.actions.private) throw new Error('Bookmarks and reading lists are unavailable in Incognito.'); }
    async addLinks(ids, destination, title = 'Saved tabs', bookmarkOptions = {}) {
        this.guard();
        if (!['bookmarks', 'readingList'].includes(destination)) throw new Error('Unknown destination.');
        if (!await this.api.permissions.contains({ permissions: [destination] })) throw new Error('Permission was not granted.');
        const tabs = await this.actions.live(ids);
        const unique = [...new Map(tabs.filter(t => /^https?:\/\//.test(t.url || '')).map(t => [t.url, t])).values()];
        if (!unique.length) throw new Error('Select tabs with web addresses first.');
        const errors = []; let count = 0, folder;
        let parentId;
        if (destination === 'bookmarks') {
            const folders = bookmarkFolders(await this.api.bookmarks.getTree());
            parentId = bookmarkOptions.parentId;
            if (!folders.some(f => f.id === parentId)) throw new Error('The bookmark folder is no longer writable. Choose another destination.');
            const name = bookmarkOptions.newFolderTitle?.trim();
            if (bookmarkOptions.newFolderTitle !== undefined && !name) throw new Error('Enter a name for the new folder.');
            if (name) { folder = await this.api.bookmarks.create({ parentId, title: name }); parentId = folder.id; }
        }
        for (const tab of unique) {
            try {
                if (destination === 'bookmarks') await this.api.bookmarks.create({ parentId, title: tab.title || tab.url, url: tab.url });
                else if (!(await this.api.readingList.query({ url: tab.url })).length) await this.api.readingList.addEntry({ url: tab.url, title: tab.title || tab.url, hasBeenRead: false });
                count++;
            } catch (error) { errors.push(error.message); }
        }
        let preferenceError;
        if (destination === 'bookmarks' && count) {
            try { await this.api.storage.local.set({ bookmarkParentId: parentId }); }
            catch { preferenceError = 'Bookmarks were saved, but the destination preference could not be remembered.'; }
        }
        if (folder && !count) await this.api.bookmarks.remove(folder.id).catch(() => {});
        const skipped = tabs.filter(t => !/^https?:\/\//.test(t.url || '')).length;
        return { count, error: errors.length ? `${count} saved; ${errors.length} failed. ${errors[0]}` : preferenceError || (skipped ? `${count} saved; ${skipped} non-web page(s) skipped.` : null) };
    }
}

// Include writable built-in folders, but never the root or a managed subtree.
export function bookmarkFolders(tree) {
    const folders = [];
    function walk(nodes, path = []) {
        for (const node of nodes) {
            if (node.unmodifiable) continue;
            if (node.url) continue;
            const parts = node.parentId === undefined ? path : [...path, node.title || 'Untitled folder'];
            if (node.parentId !== undefined) folders.push({ id: node.id, path: parts.join(' / '), folderType: node.folderType });
            walk(node.children || [], parts);
        }
    }
    walk(tree);
    return folders;
}
