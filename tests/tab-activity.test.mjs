import test from 'node:test';
import assert from 'node:assert/strict';
import { TabActivity } from '../lib/tab-activity.mjs';
import { inactiveTabIds } from '../lib/tab-library.mjs';
import { fixture } from './chrome-mock.mjs';
const grid='chrome-extension://test/grid.html';
const day=86400000, now=100*day;
test('returned recency survives new worker and new browser tab IDs', async () => {
    const f=fixture([{id:1,windowId:1,index:0,lastAccessed:day}]);
    const tracker=new TabActivity(f.api,grid,false);
    assert.equal(inactiveTabIds(f.tabs(),14,await tracker.update([],now),now).size,1);
    await tracker.update([1],now);
    assert.equal(inactiveTabIds(f.tabs(),14,await tracker.update([],now),now).size,0);
    const restarted=fixture([{id:99,windowId:2,index:0,url:'https://example.com/1',lastAccessed:day}]);
    Object.assign(restarted.local,structuredClone(f.local));
    const activity=await new TabActivity(restarted.api,grid,false).update([],now+day);
    assert.equal(activity[99],now);
    assert.equal(inactiveTabIds(restarted.tabs(),14,activity,now+day).size,0);
    assert.equal(inactiveTabIds(restarted.tabs(),14,activity,now+15*day).size,1);
});
test('missing native timestamps age from first observation and exact threshold stays active', async () => {
    const f=fixture([{id:1,windowId:1,index:0}]);
    const tracker=new TabActivity(f.api,grid,false);
    const activity=await tracker.update([],now);
    assert.equal(inactiveTabIds(f.tabs(),14,activity,now+14*day).size,0);
    assert.equal(inactiveTabIds(f.tabs(),14,activity,now+14*day+1).size,1);
    assert.equal((await tracker.update([],now+15*day))[1],now);
});
test('private pages and grid pages never enter activity storage', async () => {
    const f=fixture([{id:1,windowId:1,index:0},{id:2,windowId:2,index:0,incognito:true,url:'https://private.example/'},{id:3,windowId:1,index:1,url:grid}]);
    await new TabActivity(f.api,grid,false).update([2,3],now);
    assert.deepEqual(f.local.tabActivity.map(r=>r.url),['https://example.com/1']);
    const before=structuredClone(f.local);
    assert.deepEqual(await new TabActivity(f.api,grid,true).update([2],now),{});
    assert.deepEqual(f.local,before);
});
test('old closed activity is pruned but current old tabs retain their true age', async () => {
    const f=fixture([{id:1,windowId:1,index:0,lastAccessed:day}]);
    f.local.tabActivity=[{url:'https://closed.example/',at:day},{url:'https://recent.example/',at:199*day}];
    const tracker=new TabActivity(f.api,grid,false);
    assert.equal((await tracker.update([],200*day))[1],day);
    assert.equal(f.local.tabActivity.some(r=>r.url==='https://closed.example/'),false);
    assert.equal(f.local.tabActivity.some(r=>r.url==='https://recent.example/'),true);
});
