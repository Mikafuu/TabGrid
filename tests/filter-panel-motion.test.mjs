import test from 'node:test';
import assert from 'node:assert/strict';
import {createFilterPanelAnimation} from '../lib/filter-panel-motion.mjs';
const settle = engine => { for(let i=0;i<240&&engine.manager.active;i++) engine.manager.tick(1000/60); assert.equal(engine.manager.active,false); };

test('the live liquid-dom engine advances and settles to exact open and closed geometry',()=>{
    const engine=createFilterPanelAnimation();engine.set(true,180);
    assert.equal(engine.manager.active,true);assert.equal(engine.state.height,0);
    engine.manager.tick(100);assert.ok(engine.state.height>0&&engine.state.height<180);
    settle(engine);assert.deepEqual(engine.state,{height:180,opacity:1,y:0,radius:18,angle:-180});
    engine.set(false,180);settle(engine);assert.deepEqual(engine.state,{height:0,opacity:0,y:-6,radius:28,angle:0});
});
test('rapid retargeting retains live values without jumping to an endpoint',()=>{
    const engine=createFilterPanelAnimation();engine.set(true,200);engine.manager.tick(120);
    const before={...engine.state};engine.set(false,200);assert.deepEqual(engine.state,before);
    engine.manager.tick(40);assert.ok(engine.state.height<before.height);
    const closing={...engine.state};engine.set(true,260);assert.deepEqual(engine.state,closing);
    settle(engine);assert.equal(engine.state.height,260);assert.equal(engine.state.angle,-180);
});
test('reduced motion snaps and removes active work; speed changes affect the same engine',()=>{
    const engine=createFilterPanelAnimation();engine.set(true,180);engine.manager.tick(30);
    engine.set(false,180,true);assert.equal(engine.manager.active,false);assert.equal(engine.state.height,0);
    const fast=createFilterPanelAnimation(),slow=createFilterPanelAnimation();
    fast.timeScaleRef.current=2;slow.timeScaleRef.current=.5;
    fast.set(true,180);slow.set(true,180);fast.manager.tick(100);slow.manager.tick(100);
    assert.ok(fast.state.height>slow.state.height);
    engine.set(true,180,true);assert.equal(engine.state.height,180);assert.equal(engine.manager.active,false);
});
test('expanded geometry arrives within 180 ms at standard speed',()=>{
    const engine=createFilterPanelAnimation();engine.set(true,200);engine.manager.tick(180);
    assert.equal(engine.state.height,200);assert.equal(engine.state.opacity,1);
});
