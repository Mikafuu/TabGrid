import test from 'node:test';
import assert from 'node:assert/strict';
import { windowLabel, relativeTabIds, siteOrigins, anchoredMenuLayout } from '../lib/tab-menu.mjs';
import { fixture } from './chrome-mock.mjs';

test('window labels use the first native tab and the remaining count', () => {
    assert.equal(windowLabel([{index:1,title:'Second'}, {index:0,title:'Heading'}, {index:2,title:'Third'}]), 'Heading and 2 Other Tabs');
    assert.equal(windowLabel([{index:0,title:'Only'}]), 'Only');
    assert.equal(windowLabel([]), 'Empty Window');
});
test('relative closes preserve selections, pins, and unrelated windows', () => {
    const tabs = [
        {id:1,index:0,windowId:1}, {id:2,index:1,windowId:1}, {id:3,index:2,windowId:1},
        {id:4,index:3,windowId:1,pinned:true}, {id:5,index:4,windowId:1},
        {id:6,index:0,windowId:2}, {id:7,index:1,windowId:2}, {id:8,index:0,windowId:3}
    ];
    assert.deepEqual(relativeTabIds(tabs,[2,3,6],'after'),[5,7]);
    assert.deepEqual(relativeTabIds(tabs,[2,3,6],'others'),[1,5,7]);
    assert.deepEqual(relativeTabIds(tabs,[],'after'),[]);
});
test('site sound deduplicates web origins and excludes privileged pages', () => {
    assert.deepEqual(siteOrigins([{url:'https://example.com/a'},{url:'https://example.com/b'},{url:'chrome://settings'},{url:'file:///tmp/a'},{pendingUrl:'http://localhost:4173/a'},{url:'bad'}]),['https://example.com','http://localhost:4173']);
});
test('new tab follows the last selected member and joins its group', async () => {
    const f=fixture([{id:1,index:0,windowId:1},{id:2,index:1,windowId:1,groupId:7},{id:3,index:2,windowId:1,groupId:7},{id:4,index:3,windowId:1}], [{id:7,windowId:1}]);
    const added=await f.actions.newAfter([3,1,2]);
    assert.equal(added.index,3);
    assert.equal(f.tabs().find(t=>t.id===added.id).groupId,7);
    assert.equal(f.tabs().find(t=>t.id===4).index,4);
});
test('new-after and duplicate reject or ignore unrelated/private/grid targets', async () => {
    const f=fixture([{id:1,index:0,windowId:1},{id:2,index:0,windowId:2},{id:3,index:1,windowId:1,incognito:true},{id:4,index:2,windowId:1,url:'chrome-extension://test/grid.html'}]);
    await assert.rejects(f.actions.newAfter([1,2]), /one window/);
    await assert.rejects(f.actions.newAfter([3,4]), /one window/);
    const duplicated=[];f.api.tabs.duplicate=async id=>duplicated.push(id);
    await f.actions.duplicate([1,3,4]); assert.deepEqual(duplicated,[1]);
});
test('site sound requires permission, applies once per site, and reads the same state', async () => {
    const f=fixture([{id:1,index:0,windowId:1},{id:2,index:1,windowId:1},{id:3,index:2,windowId:1,url:'https://other.example/a'}]);
    let granted=false;f.api.permissions={contains:async()=>granted};
    const rules=new Map(),calls=[];
    f.api.contentSettings={sound:{get:async p=>({setting:rules.get(new URL(p.primaryUrl).origin)||'allow'}),set:async p=>{calls.push(p);rules.set(new URL(p.primaryPattern).origin,p.setting);}}};
    assert.equal(await f.actions.siteSoundSnapshot([1]),null);
    await assert.rejects(f.actions.setSiteSound([1],true),/permission/);
    granted=true;
    assert.deepEqual(await f.actions.setSiteSound([1,2,3],true),{count:2,error:null});
    assert.equal(calls[0].scope,'regular'); assert.equal(calls[0].primaryPattern,'https://example.com/*');
    assert.deepEqual(await f.actions.siteSoundSnapshot([1,3]),{muted:true});
    await f.actions.setSiteSound([1],false);
    assert.deepEqual(await f.actions.siteSoundSnapshot([1,3]),{muted:false});
});
test('site sound reports unsupported versions, partial failures, and private scope', async () => {
    const f=fixture([{id:1,index:0,windowId:1,incognito:true},{id:2,index:1,windowId:1,incognito:true,url:'https://other.example/'},{id:3,index:2,windowId:1}]);
    f.actions.private=true;f.api.permissions={contains:async()=>true};
    await assert.rejects(f.actions.setSiteSound([1],true),/does not support/);
    const calls=[];f.api.contentSettings={sound:{set:async p=>{calls.push(p);if(p.primaryPattern.includes('other'))throw Error('Denied');}}};
    const result=await f.actions.setSiteSound([1,2,3],true);
    assert.equal(result.count,1);assert.match(result.error,/1 site/);
    assert.equal(calls.length,2);assert.ok(calls.every(p=>p.scope==='incognito_session_only'));
});

test('tall menus scroll without overlapping their opener, including near viewport edges', () => {
    for (const rect of [
        {left:370,right:420,top:402,bottom:438},
        {left:1100,right:1140,top:10,bottom:46},
        {left:25,right:60,top:740,bottom:776}
    ]) {
        const m=anchoredMenuLayout(rect,320,600,1200,800);
        assert.ok(m.top>=8 && m.top+m.height<=792);
        assert.ok(m.top>=rect.bottom+4 || m.top+m.height<=rect.top-4);
        assert.ok(m.left>=8 && m.left+320<=1192);
    }
});
