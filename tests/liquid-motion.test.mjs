import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiquidMotion} from '../lib/liquid-motion.mjs';
function fixture() {
    let queued,enabled=true;const values=new Map([['opacity','.8']]);
    const target={isConnected:true,dataset:{},style:{getPropertyValue:k=>values.get(k)||'',setProperty:(k,v)=>values.set(k,String(v)),removeProperty:k=>values.delete(k)},removeAttribute(){}};
    const motion=createLiquidMotion({allowed:()=>enabled,raf:fn=>{queued=fn;return 1;},caf(){queued=null;},doc:{hidden:false,dispatchEvent(){}}});
    return {target,motion,values,disable(){enabled=false;motion.sync();},async step(t){const fn=queued;queued=null;fn?.(t);await Promise.resolve();}};
}
test('liquid DOM drives intermediate DOM values and restores existing inline styles',async()=>{
    const f=fixture();f.motion.play(f.target,{opacity:0,height:'0px'},{opacity:1,height:'200px'});
    await f.step(1);await f.step(91);assert.ok(Number(f.values.get('opacity'))>0&&Number(f.values.get('opacity'))<1);
    await f.step(201);await f.step(301);await f.step(401);assert.equal(f.motion.has(f.target),false);assert.equal(f.values.get('opacity'),'.8');assert.equal(f.values.has('height'),false);
});
test('cancellation removes transient overrides without touching unrelated styles',async()=>{
    const f=fixture();f.values.set('left','42px');f.motion.play(f.target,{opacity:0},{opacity:1});await f.step(1);await f.step(50);f.disable();
    assert.equal(f.values.get('opacity'),'.8');assert.equal(f.values.get('left'),'42px');assert.equal(f.motion.has(f.target),false);
});
test('live control spring settles to a persistent custom property endpoint',async()=>{
    const f=fixture();f.motion.play(f.target,{'--liquid-switch':'0px'},{'--liquid-switch':'14px'},{springMotion:true,persist:true});
    for(let t=1;t<1200;t+=16)await f.step(t);
    assert.equal(f.values.get('--liquid-switch'),'14px');assert.equal(f.motion.has(f.target),false);
});
