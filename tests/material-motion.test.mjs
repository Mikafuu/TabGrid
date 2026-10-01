import test from 'node:test';
import assert from 'node:assert/strict';
import {createMaterialMotion,materialMotionAllowed,materialTiming,layoutFrames} from '../lib/material-motion.mjs';
class Effect {constructor(target,frames,timing){Object.assign(this,{target,frames,timing});}}
function fixture(options={}){
    let enabled=true;const plugins=new Map();
    const doc={createElement:()=>({dataset:{},remove(){}})};
    const target={tagName:'DIV',isConnected:true,children:[],getAnimations(){return this.animations||[];},append(){},getBoundingClientRect(){return this.rect;},getClientRects(){return [this.rect];},hasAttribute(){return false;}};
    const style=el=>el.current||{opacity:'1',transform:'none'};
    const motion=createMaterialMotion({doc,allowed:()=>enabled,Effect,style,animate:(el,plugin)=>{plugins.set(el,plugin);return {};},...options});
    return {motion,target,plugins,disable:()=>{enabled=false;}};
}
test('refined material motion respects both the page preference and live system reduction',()=>{
    for(const style of ['classic','flat','glass','neumorphic','clay'])for(const preference of ['off','system'])for(const reduced of [false,true])assert.equal(materialMotionAllowed(style,preference,reduced),['flat','glass','neumorphic','clay'].includes(style)&&preference==='system'&&!reduced);
});
test('material changes sample the current settling curve without replacing effect ownership',()=>{
    let material='glass';const {motion,target,plugins}=fixture({timing:()=>materialTiming(material)});motion.reveal(target,true);
    assert.equal(plugins.get(target)(target)[0].timing.duration,220);material='flat';motion.reveal(target,true);
    assert.equal(plugins.get(target)(target)[0].timing.duration,180);
    material='neumorphic';motion.reveal(target,true);assert.equal(plugins.get(target)(target)[0].timing.duration,200);
    material='clay';motion.reveal(target,true);assert.equal(plugins.get(target)(target)[0].timing.duration,240);
});
test('layout effects retarget from visible bounds and scale only when requested',()=>{
    const before={left:12,top:30,width:120,height:60},after={left:42,top:20,width:60,height:120};
    assert.equal(layoutFrames(before,after)[0].transform,'translate(-30px, 10px) scale(1, 1)');
    assert.equal(layoutFrames(before,after,true)[0].transform,'translate(-30px, 10px) scale(2, 0.5)');
    assert.equal(layoutFrames(after,after,true),null);assert.equal(layoutFrames(before,{...after,width:0},true),null);
});
test('auto-animate owns planned UI effects and unrelated children stay stationary',()=>{
    const {motion,target,plugins}=fixture();motion.reveal(target,true);
    const [effect]=plugins.get(target)(target);assert.equal(effect.target,target);assert.equal(effect.timing.duration,180);assert.equal(effect.frames[0].opacity,0);
    assert.equal(plugins.get(target)({})[0].timing.duration,0);assert.equal(plugins.get(target)(target)[0].timing.duration,0);
});
test('a preference change discards a queued effect before auto-animate creates it',()=>{
    const {motion,target,plugins,disable}=fixture();motion.reveal(target,true);disable();assert.equal(plugins.get(target)(target)[0].timing.duration,0);
});
test('disabling motion cancels only effects created by the UI controller',()=>{
    const {motion,target,plugins,disable}=fixture();motion.reveal(target,true);const [effect]=plugins.get(target)(target);let own=0,other=0;
    target.animations=[{effect,cancel:()=>own++},{effect:{},cancel:()=>other++}];disable();motion.sync();assert.equal(own,1);assert.equal(other,0);
});
test('rapid visibility reversal starts at the live effect and preserves base transforms',()=>{
    const {motion,target,plugins}=fixture();target.current={opacity:'.4',transform:'matrix(1,0,0,1,0,3)'};motion.reveal(target,true);const [first]=plugins.get(target)(target);
    target.animations=[{effect:first,playState:'running',cancel(){target.current={opacity:'1',transform:'translateX(-50%)'};}}];motion.reveal(target,true);const [effect]=plugins.get(target)(target);
    assert.deepEqual(effect.frames[0],{opacity:'.4',transform:'matrix(1,0,0,1,0,3)'});assert.equal(effect.frames[1].transform,'translateX(-50%)');
});
test('dialog entry never transforms the coordinate system of fixed drawers',()=>{
    const {motion,target,plugins}=fixture();target.tagName='DIALOG';motion.reveal(target,true);const [effect]=plugins.get(target)(target);assert.ok(effect.frames.every(f=>!('transform'in f)));
});
test('native exit retains paint without retaining interaction or accessibility',()=>{
    const {motion,target}=fixture();let toggle;const attributes=new Map();target.addEventListener=(_,fn)=>{toggle=fn;};target.setAttribute=(k,v)=>attributes.set(k,v);target.removeAttribute=k=>attributes.delete(k);
    motion.native(target);toggle({newState:'closed'});assert.equal(target.inert,true);assert.equal(attributes.get('aria-hidden'),'true');toggle({newState:'open'});assert.equal(target.inert,false);assert.equal(attributes.has('aria-hidden'),false);
});
test('dialog attribute fallback handles missing toggle events without duplicating modern events',async()=>{
    let observe,toggle,observed,options;let writes=0;
    class Observer {constructor(fn){observe=fn;}observe(target,opts){observed=target;options=opts;}}
    const {motion,target}=fixture({Observer});target.tagName='DIALOG';target.open=false;
    target.addEventListener=(_,fn)=>{toggle=fn;};target.setAttribute=()=>{writes++;};target.removeAttribute=()=>{writes++;};
    motion.native(target);assert.equal(observed,target);assert.deepEqual(options,{attributes:true,attributeFilter:['open']});
    target.open=true;observe();assert.equal(target.inert,false);assert.equal(writes,1);
    toggle({newState:'open'});assert.equal(writes,1);
    target.open=false;observe();assert.equal(target.inert,true);assert.equal(writes,2);
    toggle({newState:'closed'});assert.equal(writes,2);
    await Promise.resolve();
});
