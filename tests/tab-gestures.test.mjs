import test from 'node:test';
import assert from 'node:assert/strict';
import { dropTabIds, dropTargetTabIds } from '../lib/tab-gestures.mjs';
import { fixture } from './chrome-mock.mjs';
test('drop keys reject groups, duplicates, and malformed IDs', () => {
    const item = key => ({dataset:{key}});
    assert.deepEqual(dropTabIds([item('tab:1'),item('tab:2')]),[1,2]);
    for(const keys of [[],['group:1'],['tab:1','tab:1'],['tab:NaN']]) assert.throws(()=>dropTabIds(keys.map(item)),/distinct tabs/);
});
test('group drop supports multiple tabs and ungrouping while rejecting stale or pinned targets', async () => {
    const f=fixture([{id:1,windowId:1,index:0},{id:2,windowId:1,index:1},{id:3,windowId:1,index:2,groupId:7},{id:4,windowId:1,index:3,pinned:true},{id:5,windowId:2,index:0}], [{id:7,windowId:1,title:'Research',color:'green'}]);
    await f.actions.dropIntoGroup([1,2],7,1);
    assert.equal(f.tabs().filter(t=>t.groupId===7).length,3);
    assert.equal(f.groups()[0].title,'Research');
    await f.actions.dropIntoGroup([1,2],'ungroup',1);
    assert.equal(f.tabs().filter(t=>t.groupId===-1).length,4);
    const id=await f.actions.dropIntoGroup([1,2],'new',1);
    assert.equal(f.tabs().filter(t=>t.groupId===id).length,2);
    assert.ok(f.local.tabActivity.find(r=>r.url === 'https://example.com/1').at >= Date.now() - 1000);
    await assert.rejects(f.actions.dropIntoGroup([4],7,1),/changed/);
    await assert.rejects(f.actions.dropIntoGroup([1,99],7,1),/changed/);
    await assert.rejects(f.actions.dropIntoGroup([1,1],7,1),/changed/);
    await assert.rejects(f.actions.dropIntoGroup([1],999,1),/No group/);
    assert.equal(f.tabs().find(t=>t.id===1).groupId,id);
    await f.actions.dropIntoGroup([1,5],7,1);
    assert.equal(f.tabs().find(t=>t.id===5).windowId,1);
    assert.equal(f.tabs().find(t=>t.id===5).groupId,7);
});

test('group cards resolve live ordered members only for Ungroup', async () => {
    const f=fixture([{id:1,windowId:1,index:1,groupId:7},{id:2,windowId:1,index:0,groupId:7},{id:3,windowId:1,index:2}], [{id:7,windowId:1,color:'blue'}]);
    const item=key=>({dataset:{key}}),query=id=>f.api.tabs.query({groupId:id});
    const ids=await dropTargetTabIds([item('group:7')],'ungroup',query);assert.deepEqual(ids,[2,1]);
    for(const dest of ['new','7'])await assert.rejects(dropTargetTabIds([item('group:7')],dest,query),/only/);
    await assert.rejects(dropTargetTabIds([item('group:99')],'ungroup',query),/no longer/);
    await assert.rejects(dropTargetTabIds([item('group:7'),item('tab:1')],'ungroup',query),/overlapping/);
    await assert.rejects(dropTargetTabIds([item('group:7')],'ungroup',async()=>[{id:1,groupId:8}]),/no longer/);
    await f.actions.dropIntoGroup(ids,'ungroup',1);assert.equal(f.tabs().every(t=>t.groupId===-1),true);assert.equal(f.tabs().find(t=>t.id===3).index,2);
});
