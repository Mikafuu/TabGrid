export function restoreView(saved = {}, prefs, group = false) {
    return {
        query: prefs[group ? 'rememberGroupQuery' : 'rememberRootQuery'] && typeof saved.query === 'string' ? saved.query : '',
        position: prefs[group ? 'rememberGroupScroll' : 'rememberRootScroll'] ? saved.position : null
    };
}

export class ViewState {
    constructor(api, windowId, privateMode) {
        this.api = api;
        const mode = privateMode ? 'private' : 'regular';
        this.key = `tabgridView:${mode}:${windowId}`;
        this.groupPrefix = `tabgridGroupView:${mode}:`;
        this.data = { root: {}, groups: {} };
        this.queue = Promise.resolve();
    }
    async load() {
        const stored = await this.api.storage.session.get(null);
        const value = stored[this.key];
        this.data = { root: value?.root || {}, groups: { ...value?.groups } };
        for (const [key, state] of Object.entries(stored)) {
            if (key.startsWith(this.groupPrefix)) this.data.groups[key.slice(this.groupPrefix.length)] = state;
        }
        return this.data;
    }
    async group(id) {
        const key = `${this.groupPrefix}${id}`;
        const stored = (await this.api.storage.session.get(key))[key];
        if (stored) this.data.groups[id] = stored;
        return this.data.groups[id] || {};
    }
    set(scope, groupId, value) {
        if (scope === 'root') this.data.root = value;
        else this.data.groups[groupId] = value;
        // Separate keys avoid overwriting another open window's group state.
        const key = scope === 'root' ? this.key : `${this.groupPrefix}${groupId}`;
        const data = structuredClone(scope === 'root' ? { root: value } : value);
        this.queue = this.queue.catch(() => {}).then(() => this.api.storage.session.set({ [key]: data }));
        return this.queue;
    }
    prune(ids) {
        for (const id of Object.keys(this.data.groups)) if (!ids.includes(Number(id))) delete this.data.groups[id];
    }
}
