import test from 'node:test';
import assert from 'node:assert/strict';
import {dragPolicy} from '../lib/drag-policy.mjs';
import {WindowOrder,numberedWindow} from '../lib/window-order.mjs';
import {DEFAULTS,validatePreferences,migratePreferences,PREFS_KEY,exportSettings,importSettings} from '../lib/preferences.mjs';
import {emptyFilters,recentSearches} from '../lib/search.mjs';
import {fixture} from './chrome-mock.mjs';
test('drag and reorder policies distinguish group-only scope from hidden intervening slots',()=>{
    for(const groups of [[],[7]])assert.deepEqual(dragPolicy({filters:{...emptyFilters(),groups}}),{drag:true,reorder:true,tip:''});
    for(const patch of [{websites:['example.com']},{pinned:'yes'},{audible:'no'},{muted:'yes'}]){const p=dragPolicy({filters:{...emptyFilters(),...patch}});assert.equal(p.drag,true);assert.equal(p.reorder,false);assert.match(p.tip,/Clear search/);}
    assert.equal(dragPolicy({query:'Research'}).reorder,false);assert.equal(dragPolicy({query:'Research'}).drag,true);
    assert.equal(dragPolicy({sort:'title'}).reorder,false);assert.equal(dragPolicy({selecting:true}).drag,false);assert.equal(dragPolicy({view:'recent'}).drag,false);
});
test('defaults and backups migrate milliseconds without discarding saved card sizing',()=>{
    assert.equal(DEFAULTS.preferredColumns,4);assert.equal(DEFAULTS.undoMs,5000);
    const prefs=migratePreferences({[PREFS_KEY]:{undoSeconds:13,preferredColumns:6,swipeClose:true}});
    assert.equal(prefs.undoMs,13000);assert.equal(prefs.preferredColumns,6);assert.equal('swipeClose' in prefs,false);assert.equal('undoSeconds' in prefs,false);
    assert.equal(importSettings(exportSettings({...prefs,undoMs:7250,showWindow:true,showGroup:false})).undoMs,7250);
    for(const undoMs of [0,300001,1.5])assert.throws(()=>validatePreferences({undoMs}));
});
test('history recommendations use a phrase before limiting results and stay private',()=>{
    const entries=[{query:'Unrelated',time:Date.now()},...Array.from({length:12},(_,i)=>({query:`Research paper ${i}`,time:Date.now()}))],prefs={...DEFAULTS,historyEnabled:true,historyCount:5};
    assert.equal(recentSearches(entries,prefs,false,'research paper').length,5);
    assert.equal(recentSearches(entries,prefs,false,'paper 10')[0].query,'Research paper 10');
    assert.deepEqual(recentSearches(entries,prefs,true,'Research'),[]);
});
test('window numbering survives worker recreation, compacts on close and isolates private windows',async()=>{
    const f=fixture([{id:1,windowId:91,index:0},{id:2,windowId:44,index:0},{id:3,windowId:17,index:0,incognito:true}]);
    const order=new WindowOrder(f.api);assert.deepEqual(await order.snapshot(),[91,44]);
    const win=await f.api.windows.create();await order.created(win);assert.deepEqual(await new WindowOrder(f.api).snapshot(),[91,44,win.id]);
    f.removeWindow(91);await order.removed(91);const ids=await order.snapshot();assert.equal(numberedWindow(44,ids),'Window 1');assert.equal(numberedWindow(win.id,ids),'Window 2');
    assert.deepEqual(await new WindowOrder(f.api,true).snapshot(),[17]);
});
test('cross-window drop lands a tab before or after the chosen card',async()=>{
    for(const after of [false,true]){const f=fixture([{id:1,windowId:1,index:0},{id:2,windowId:2,index:0},{id:3,windowId:2,index:1}]);await f.actions.dropAt({keys:['tab:1'],windowId:2,anchor:'tab:2',after});
        assert.deepEqual(f.tabs().filter(t=>t.windowId===2).sort((a,b)=>a.index-b.index).map(t=>t.id),after?[2,1,3]:[1,2,3]);}
});
test('cross-window drop keeps a whole group and its assigned metadata',async()=>{
    const f=fixture([{id:1,windowId:1,index:0,groupId:7},{id:2,windowId:1,index:1,groupId:7},{id:3,windowId:2,index:0},{id:4,windowId:2,index:1}],[{id:7,windowId:1,title:'Research',color:'green',collapsed:true}]);
    await f.actions.dropAt({keys:['group:7'],windowId:2,anchor:'tab:4'});
    assert.deepEqual(f.tabs().filter(t=>t.windowId===2).sort((a,b)=>a.index-b.index).map(t=>t.id),[3,1,2,4]);assert.equal(f.groups()[0].windowId,2);assert.equal(f.groups()[0].color,'green');assert.equal(f.groups()[0].collapsed,true);
});
test('drop requests reject stale anchors, overlapping identities and browsing-mode changes before moving tabs',async()=>{
    const f=fixture([{id:1,windowId:1,index:0,groupId:7},{id:2,windowId:1,index:1,groupId:7},{id:3,windowId:2,index:0,incognito:true}],[{id:7,windowId:1}]);
    for(const args of [{keys:['tab:1'],windowId:1,anchor:'tab:99'},{keys:['tab:1','group:7'],windowId:1},{keys:['tab:1'],windowId:2},{keys:['tab:1'],windowId:1,pinned:true}])await assert.rejects(f.actions.dropAt(args));
    assert.equal(f.calls.filter(c=>c[0]==='move').length,0);assert.equal(f.tabs().find(t=>t.id===1).windowId,1);
});
