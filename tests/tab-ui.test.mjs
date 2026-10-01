import test from 'node:test';
import assert from 'node:assert/strict';
import { CardIntent, UndoNotice, cardSize, cardColumns, idleDays, selectionActive, acceptsGroupDrop, windowSections } from '../lib/tab-ui.mjs';
import { bookmarkFolders } from '../lib/tab-library.mjs';
import { fixture } from './chrome-mock.mjs';

const start = { id: 1, key: 'tab:1', x: 20, y: 20, time: 0 };
test('click intent permits short clicks and tolerates small pointer jitter and rejects drags, holds and outside release', () => {
    const intent = new CardIntent();
    const end = change => { intent.begin(start); return intent.end({ ...start, time: 100, ...change }); };
    assert.equal(end({ x: 21 }), false);
    assert.equal(end({ x: 22 }), false);
    assert.equal(end({ x: 25 }), false);
    assert.equal(end({ x: 26 }), true);
    assert.equal(end({ time: 499 }), false);
    assert.equal(end({ time: 500 }), true);
    assert.equal(end({ key: 'tab:2' }), true);
    assert.equal(end({ key: undefined }), true);
    intent.begin(start); intent.move({ ...start, x: 50 });
    assert.equal(intent.end({ ...start, time: 150 }), true, 'returning to origin is still a drag');
    intent.begin({ ...start, type: 'touch' });
    assert.equal(intent.end({ ...start, time: 250 }), true);
    intent.begin(start); intent.cancel();
    assert.equal(intent.end({ ...start, time: 100 }), true);
    intent.begin(start);
    assert.equal(intent.end({ ...start, id: 2, time: 100 }), false);
    assert.ok(intent.pointer, 'unrelated pointer does not finish the gesture');
});
test('selection blocks drag even after clearing cards, and groups never enter tab drop targets', () => {
    assert.equal(selectionActive(true, new Set()), true);
    assert.equal(selectionActive(false, new Set(['tab:1'])), true);
    assert.equal(selectionActive(false, new Set()), false);
    assert.equal(acceptsGroupDrop({ dataset: { kind: 'tab', key: 'tab:1' } }), true);
    for (const dataset of [{kind:'group',key:'group:1'},{kind:'tab',key:'group:1'},{kind:'tab',key:'tab:NaN'}]) assert.equal(acceptsGroupDrop({dataset}), false);
});
test('size preferences migrate and clamp; idle defaults to Never without discarding explicit choices', () => {
    assert.equal(cardSize('300px'), 300); assert.equal(cardSize('327px'), 327);
    assert.equal(cardSize('bad'), 220); assert.equal(cardSize(900), 450); assert.equal(cardSize(100), 220);
    for (const days of [0,7,14,30]) assert.equal(idleDays(days), days);
    assert.equal(idleDays(undefined), 0); assert.equal(idleDays(-1), 0);
});
test('window sections put current window first and retain per-window item order', () => {
    const items = [{key:'tab:2',windowId:2},{key:'group:7',windowId:1},{key:'tab:3',windowId:2},{key:'tab:9',windowId:9}];
    const result = windowSections(items, 2);
    assert.deepEqual(result.map(s => s.windowId), [2,1,9]);
    assert.deepEqual(result[0].items.map(i => i.key), ['tab:2','tab:3']);
});
function noticeFixture() {
    let time = 0, next = 0; const timers = new Map(), changes = [];
    const notice = new UndoNotice({ change: e => changes.push(e?.id || null), now: () => time,
        schedule: (fn, delay) => { timers.set(++next, { fn, at: time + delay }); return next; }, cancel: id => timers.delete(id) });
    return { notice, changes, tick(ms) { time += ms; for (const [id,t] of [...timers]) if(t.at <= time) {timers.delete(id); t.fn();} } };
}
const entry = (id, state = 'closed') => ({ id, completedAt: 123, tabs: [{state}] });
test('Undo ignores history and pending writes, dismisses after 5 seconds, and does not revive older entries', () => {
    const {notice, tick, changes} = noticeFixture();
    const old = entry('old'), fresh = entry('new'); notice.observe([old]); assert.equal(notice.entry, null);
    notice.observe([old, {...fresh, completedAt: undefined}]); assert.equal(notice.entry, null);
    notice.observe([old,fresh]); tick(4999); assert.equal(notice.entry.id,'new'); tick(1); assert.equal(notice.entry,null);
    notice.observe([old,fresh]); notice.observe([old]); assert.equal(notice.entry,null);
    assert.deepEqual(changes,['new',null]);
});
test('Undo pauses for hover and focus, resets for a new close, and hides after restore', () => {
    const {notice,tick} = noticeFixture(); notice.observe([]); notice.observe([entry('a')]); tick(1000);
    notice.pause('hover'); notice.pause('focus'); tick(10000); notice.resume('hover'); tick(10000);
    assert.equal(notice.entry.id,'a'); notice.resume('focus'); tick(3999); assert.equal(notice.entry.id,'a'); tick(1); assert.equal(notice.entry,null);
    notice.observe([entry('a'),entry('b')]); tick(4000); notice.observe([entry('a'),entry('b'),entry('c')]); tick(4000);
    assert.equal(notice.entry.id,'c'); notice.observe([entry('a'),entry('b'),entry('c','restored')]); assert.equal(notice.entry,null);
});
test('explicit toast dismissal stays dismissed on refresh', () => {
    const {notice}=noticeFixture(); notice.observe([]); notice.observe([entry('a')]); notice.dismiss(); notice.observe([entry('a')]); assert.equal(notice.entry,null);
});
test('close completion is recorded only after removals and Undo targets the displayed operation', async () => {
    const f=fixture([{id:1,windowId:1,index:0},{id:2,windowId:1,index:1}]);
    const remove=f.api.tabs.remove;
    f.api.tabs.remove=async id=>{ assert.equal(f.storage.tabgridUndo.at(-1).completedAt, undefined); return remove(id); };
    await f.actions.close([1]); const id=f.storage.tabgridUndo[0].id;
    assert.equal(typeof f.storage.tabgridUndo[0].completedAt,'number');
    await f.actions.close([2]); const other=f.storage.tabgridUndo[1].id;
    await f.actions.undo(id); assert.deepEqual(f.storage.tabgridUndo.map(e=>e.id),[other]);
    const count=f.tabs().length; await f.actions.undo(id); assert.equal(f.tabs().length,count);
});
const tree = [{id:'0',children:[
    {id:'bar',parentId:'0',title:'Bookmarks bar',folderType:'bookmarks-bar',children:[{id:'sub',parentId:'bar',title:'Research',children:[]}]},
    {id:'managed',parentId:'0',title:'Managed',unmodifiable:'managed',children:[{id:'locked',parentId:'managed',title:'Locked'}]},
    {id:'link',parentId:'0',title:'Page',url:'https://example.com'}
]}];
function bookmarksFixture() {
    const f=fixture([{id:1,windowId:1,index:0},{id:2,windowId:1,index:1}]); const created=[],removed=[];
    f.api.permissions={contains:async()=>true};
    f.api.bookmarks={getTree:async()=>structuredClone(tree),create:async p=>{created.push(p);return{id:'new',...p};},remove:async id=>removed.push(id)};
    return {...f,created,removed};
}
test('bookmark folder choices include built-ins and paths but exclude root, URLs and managed descendants', () => {
    assert.deepEqual(bookmarkFolders(tree).map(f=>[f.id,f.path]),[['bar','Bookmarks bar'],['sub','Bookmarks bar / Research']]);
});
test('bookmark saves directly into the chosen folder and remembers it', async () => {
    const f=bookmarksFixture(); const r=await f.actions.addLinks([1,2],'bookmarks','Tabs',{parentId:'sub'});
    assert.equal(r.count,2); assert.ok(f.created.every(p=>p.parentId==='sub'&&p.url)); assert.equal(f.local.bookmarkParentId,'sub');
});
test('bookmark new subfolder is created under the chosen parent; invalid destinations never write', async () => {
    const f=bookmarksFixture();
    for(const parentId of ['0','managed','locked','missing']) await assert.rejects(f.actions.addLinks([1],'bookmarks','Tabs',{parentId}),/writable/);
    await assert.rejects(f.actions.addLinks([1],'bookmarks','Tabs',{parentId:'sub',newFolderTitle:'  '}),/name/);
    assert.equal(f.created.length,0);
    await f.actions.addLinks([1],'bookmarks','Tabs',{parentId:'sub',newFolderTitle:'Saved research'});
    assert.deepEqual(f.created[0],{parentId:'sub',title:'Saved research'}); assert.equal(f.created[1].parentId,'new');
});
test('failed bookmark writes remove only a new empty folder and preference failure reports saved count', async () => {
    const f=bookmarksFixture(), create=f.api.bookmarks.create;
    f.api.bookmarks.create=async p=>{if(p.url)throw new Error('Write failed');return create(p);};
    const result=await f.actions.addLinks([1],'bookmarks','Tabs',{parentId:'sub',newFolderTitle:'New'});
    assert.equal(result.count,0); assert.deepEqual(f.removed,['new']);
    f.api.bookmarks.create=create; f.api.storage.local.set=async()=>{throw new Error('Storage failed');};
    const saved=await f.actions.addLinks([1],'bookmarks','Tabs',{parentId:'sub'});
    assert.equal(saved.count,1); assert.match(saved.error,/were saved/);
});

test('column sizing has six discrete levels and migrates old pixel preferences', () => {
    for (let n = 1; n <= 6; n++) assert.equal(cardColumns(n), n);
    assert.equal(cardColumns(0), 1); assert.equal(cardColumns(9), 6);
    assert.equal(cardColumns(2.6), 3); assert.equal(cardColumns(undefined), 4);
    assert.equal(cardColumns(undefined, '300px', 1260), 4);
    assert.equal(cardColumns(undefined, '450px', 343), 1);
    assert.equal(cardColumns(2, '220px', 1260), 2);
});
