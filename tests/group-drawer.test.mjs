import test from 'node:test';
import assert from 'node:assert/strict';
import { dockAt, drawerPosition } from '../lib/group-drawer.mjs';
import { validatePreferences, DEFAULTS, importSettings, exportSettings } from '../lib/preferences.mjs';
test('drawer docks by page half regardless of proximity to top/bottom', () => {
    for (const y of [0,400,800]) {assert.equal(dockAt(499,y,1000,800).drawerEdge,'left');assert.equal(dockAt(500,y,1000,800).drawerEdge,'right');}
    assert.equal(dockAt(-20,-20,1000,800).drawerOffset,0);
    assert.equal(dockAt(1000,900,1000,800).drawerOffset,100);
});
test('side drawer stays in viewport and expansion preserves its vertical anchor', () => {
    for(const edge of ['left','right'])for(const offset of [0,50,100]){
        const pos=drawerPosition(edge,offset,125,128,375,812);
        assert.ok(pos.left>=0&&pos.left+125<=375);assert.ok(pos.top>=0&&pos.top+128<=812);
        assert.equal(pos.top,drawerPosition(edge,offset,28,128,375,812).top);
    }
});
test('legacy edge settings migrate and animation speed survives backup validation', () => {
    assert.equal(validatePreferences({...DEFAULTS,drawerEdge:'top',drawerOffset:25}).drawerEdge,'left');
    const migrated=validatePreferences({...DEFAULTS,drawerEdge:'bottom',drawerOffset:75});
    assert.throws(()=>validatePreferences({...DEFAULTS,drawerEdge:'top',drawerOffset:101}));
    assert.equal(migrated.drawerEdge,'right');assert.equal(migrated.drawerOffset,100);
    assert.equal(importSettings(exportSettings({...DEFAULTS,animationSpeed:'smooth'})).animationSpeed,'smooth');
    assert.throws(()=>validatePreferences({...DEFAULTS,animationSpeed:'random'}));
});

test('quick release still docks without a delivered pointermove',async()=>{
    const {drawerDragged}=await import('../lib/group-drawer.mjs');
    assert.equal(drawerDragged({x:0,y:50,moved:false},{clientX:500,clientY:50}),true);
    assert.equal(drawerDragged({x:0,y:50,moved:false},{clientX:3,clientY:52}),false);
});
test('latest drawer placement survives stale settings while writes serialize',async()=>{
    const {drawerPlacement}=await import('../lib/group-drawer.mjs');let prefs={drawerEdge:'left',drawerOffset:20};const writes=[];
    const placement=drawerPlacement(()=>prefs,patch=>new Promise(resolve=>writes.push(()=>{prefs={...prefs,...patch};resolve(prefs);})));
    const first=placement.update({drawerEdge:'right',drawerOffset:30});await Promise.resolve();
    const second=placement.update({drawerEdge:'left',drawerOffset:70});assert.equal(placement.read().drawerOffset,70);
    writes.shift()();await first;assert.equal(placement.read().drawerOffset,70);assert.equal(placement.read().drawerEdge,'left');
    await Promise.resolve();writes.shift()();await second;assert.deepEqual(prefs,{drawerEdge:'left',drawerOffset:70});
});
test('drawer approach uses the same margin for reorder freeze and expansion',async()=>{
    const {nearDrawer}=await import('../lib/group-drawer.mjs');const rect={left:0,top:200,width:28,height:128};
    assert.equal(nearDrawer(rect,80,230),true);assert.equal(nearDrawer(rect,100,230),false);assert.equal(nearDrawer(rect,20,130),false);
});
