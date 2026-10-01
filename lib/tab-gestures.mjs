export function dropTabIds(items) {
    const keys = items.map(item => item.dataset.key);
    if (!keys.length || keys.some(key => !/^tab:\d+$/.test(key)) || new Set(keys).size !== keys.length) throw new Error('Only distinct tabs can be dropped into a group.');
    return keys.map(key => Number(key.slice(4)));
}

// A group card can only land on Ungroup. Resolve live members before any mutation.
export async function dropTargetTabIds(items, destination, queryGroup) {
    const keys = items.map(item => item.dataset.key);
    if (!keys.length || new Set(keys).size !== keys.length || keys.some(key => !/^(tab|group):\d+$/.test(key))) throw Error('Drop distinct tab or group cards.');
    if (keys.some(key => key.startsWith('group:')) && destination !== 'ungroup') throw Error('Groups can only be dropped on Ungroup.');
    const ids = [];
    for (const key of keys) {
        if (key.startsWith('tab:')) ids.push(Number(key.slice(4)));
        else {
            const groupId = Number(key.slice(6)), members = await queryGroup(groupId);
            if (!members.length || members.some(tab => tab.groupId !== groupId || !Number.isInteger(tab.id) || tab.id < 0)) throw Error('The group no longer has available tabs.');
            ids.push(...members.sort((a,b) => a.index-b.index).map(tab => tab.id));
        }
    }
    if (new Set(ids).size !== ids.length) throw Error('Drop distinct tabs without overlapping groups.');
    return ids;
}
