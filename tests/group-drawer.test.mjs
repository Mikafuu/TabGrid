import test from 'node:test';
import assert from 'node:assert/strict';
import { dockAt, drawerPosition, resizeDrawer } from '../lib/group-drawer.mjs';
test('drawer snaps to each nearest edge and clamps its offset', () => {
    for (const [x,y,edge] of [[0,400,'left'],[1000,400,'right'],[500,0,'top'],[500,800,'bottom']]) assert.equal(dockAt(x,y,1000,800).drawerEdge,edge);
    assert.equal(dockAt(-20,-20,1000,800).drawerOffset,0);
    assert.equal(dockAt(1000,900,1000,800).drawerOffset,100);
});
test('expanded drawers remain within a narrow viewport at every dock edge', () => {
    for(const edge of ['left','right','top','bottom'])for(const offset of [0,50,100]){
        const pos=drawerPosition(edge,offset,168,380,375,812);
        assert.ok(pos.left>=0&&pos.left+168<=375);assert.ok(pos.top>=0&&pos.top+380<=812);
    }
});

test('expanding a side drawer leaves its handle anchored when space is available', () => {
    assert.equal(drawerPosition('left',35,28,128,1246,842).top,drawerPosition('left',35,350,128,1246,842).top);
});

test('drawer resize clamps both ends and docking stays flush', () => {
    assert.equal(resizeDrawer(128,32),160);assert.equal(resizeDrawer(128,-500),64);assert.equal(resizeDrawer(128,500),320);
    assert.equal(drawerPosition('right',50,300,128,375,812).left,75);
    assert.equal(drawerPosition('bottom',100,320,28,375,812).top,784);
});
