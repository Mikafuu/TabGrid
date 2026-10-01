import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './chrome-mock.mjs';
import { TabActions } from '../lib/tab-actions.mjs';
import { mergeVisibleOrder } from '../lib/tab-model.mjs';
import { inactiveTabIds } from '../lib/tab-library.mjs';
const initial = [
    { id: 1, windowId: 1, index: 0, title: 'One', groupId: 7 },
    { id: 2, windowId: 1, index: 1, title: 'Two', groupId: 7 }
];
const groups = [{ id: 7, windowId: 1, title: 'Research', color: 'blue' }];
test('inactive groups move together, with active/pinned/audio/unknown ages protected', () => {
    const now = 30 * 86400000, old = 86400000;
    const tabs = [
        { id: 1, groupId: 7, lastAccessed: old }, { id: 2, groupId: 7, lastAccessed: now },
        { id: 3, groupId: -1, lastAccessed: old }, { id: 4, groupId: -1, lastAccessed: old, pinned: true },
        { id: 5, groupId: -1, lastAccessed: old, audible: true }, { id: 6, groupId: -1, lastAccessed: old, active: true },
        { id: 7, groupId: -1 }, { id: 8, groupId: -1, lastAccessed: old }
    ];
    assert.deepEqual([...inactiveTabIds(tabs, 14, { 8: now }, now)], [3]);
    tabs[1].lastAccessed = old;
    assert.deepEqual([...inactiveTabIds(tabs, 14, {}, now)], [1, 2, 3, 8]);
    assert.equal(inactiveTabIds(tabs, 0, {}, now).size, 0);
});
test('private actions cannot save links, restore history, or persist close records', async () => {
    const f = fixture([...initial, { id: 3, windowId: 2, index: 0, incognito: true }], groups);
    f.api.extension.inIncognitoContext = true;
    const actions = new TabActions(f.api, 'chrome-extension://test/grid.html');
    await assert.rejects(actions.addLinks([3], 'bookmarks'), /Incognito/);
    await assert.rejects(actions.restoreSession('s3'), /Incognito/);
    await assert.rejects(actions.move([3], 1), /browsing mode/);
    const result = await actions.close([1,3]);
    assert.equal(result.count, 1);
    assert.deepEqual(f.tabs().map(t => t.id), [1,2]);
    assert.deepEqual(f.local, {}); assert.deepEqual(f.storage, {});
});
test('normal actions exclude private tabs and reject private move destinations', async () => {
    const f = fixture([...initial, { id: 3, windowId: 2, index: 0, incognito: true }], groups);
    await assert.rejects(f.actions.move([1], 2), /browsing mode/);
    await f.actions.close([3]);
    assert.equal(f.tabs().length, 3);
});
test('Reading List deduplicates links and existing entries; permissions are required', async () => {
    const f = fixture([...initial, { id: 3, windowId: 1, index: 2, url: 'https://example.com/1' }], groups);
    f.api.permissions = { async contains() { return false; } };
    await assert.rejects(f.actions.addLinks([1,2,3], 'readingList'), /Permission/);
    f.api.permissions.contains = async () => true;
    const added = [];
    f.api.readingList = { async query({url}) { return url.endsWith('/1') ? [{}] : []; }, async addEntry(entry) { added.push(entry); } };
    const result = await f.actions.addLinks([1,2,3], 'readingList');
    assert.equal(result.count, 2); assert.equal(added.length, 1);
    assert.equal(added[0].hasBeenRead, false);
});
test('bookmark errors report partial results and skip unsupported pages', async () => {
    const f = fixture([...initial, { id: 3, windowId: 1, index: 2, url: 'chrome://settings/' }], groups);
    f.api.permissions = { async contains() { return true; } };
    const created = [];
    f.api.bookmarks = { async getTree() { return [{ id: 'root', children: [{ id: 'parent', parentId: 'root', title: 'Other' }] }]; }, async create(p) { if (p.url?.endsWith('/2')) throw new Error('Failed'); created.push(p); return {id:'folder'}; } };
    const result = await f.actions.addLinks([1,2,3], 'bookmarks', 'Research', { parentId: 'parent', newFolderTitle: 'Research' });
    assert.equal(result.count, 1); assert.match(result.error, /1 failed/);
    assert.equal(created[1].parentId, 'folder');
});

test('visible reorder retains hidden inactive group slots and rejects stale keys', async () => {
    const all = ['tab:1', 'group:7', 'tab:4'];
    assert.deepEqual(mergeVisibleOrder(all, ['tab:4', 'tab:1']), ['tab:4', 'group:7', 'tab:1']);
    assert.throws(() => mergeVisibleOrder(all, ['tab:1', 'tab:1']), /changed/);
    const f = fixture([
        {id:1,windowId:1,index:0}, {id:2,windowId:1,index:1,groupId:7},
        {id:3,windowId:1,index:2,groupId:7}, {id:4,windowId:1,index:3}
    ], groups);
    await f.actions.reorder({ keys: mergeVisibleOrder(all, ['tab:4', 'tab:1']), windowId: 1, groupId: null, pinned: false });
    assert.deepEqual(f.tabs().sort((a,b)=>a.index-b.index).map(t=>t.id), [4,2,3,1]);
});
