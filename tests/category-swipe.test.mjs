import test from 'node:test';
import assert from 'node:assert/strict';
import {mountCategorySwipe} from '../lib/category-swipe.mjs';
function fixture({idle=true,search=false}={}){
    let time=0,view='open',enabled=true,bottom=100;const changes=[],handlers={};
    const buttons=[['all',!search],['open',false],['inactive',!idle],['recent',false]].map(([view,hidden])=>({dataset:{view},hidden}));
    mountCategorySwipe({nav:{getBoundingClientRect:()=>({bottom}),querySelectorAll:()=>buttons},available:()=>enabled,getView:()=>view,change:v=>{view=v;changes.push(v);},doc:{addEventListener:(name,fn)=>handlers[name]=fn},now:()=>time});
    const wheel=(dx,options={})=>{time+=options.gap??20;const e={deltaX:dx,deltaY:0,deltaMode:0,clientY:150,target:{closest:()=>false},preventDefault(){this.prevented=true;},...options};handlers.wheel(e);return e;};
    return {wheel,changes,handlers,get view(){return view;},disable:()=>enabled=false,scrollPastHeader:()=>bottom=-100};
}
test('deliberate swipe advances one visible category and absorbs the tail',()=>{
    const f=fixture();for(let i=0;i<20;i++)assert.equal(f.wheel(20).prevented,true);
    assert.deepEqual(f.changes,['inactive']);f.wheel(100,{gap:300});assert.equal(f.view,'recent');
    f.wheel(100,{gap:300});assert.equal(f.view,'recent');f.wheel(-100,{gap:300});assert.equal(f.view,'inactive');
});
test('hidden Idle is skipped, search All results participates, edges do not wrap',()=>{
    const f=fixture({idle:false,search:true});f.wheel(-100);assert.equal(f.view,'all');
    f.wheel(-100,{gap:300});assert.equal(f.changes.length,1);
    f.wheel(100,{gap:300});f.wheel(100,{gap:300});assert.equal(f.view,'recent');
});
test('header boundary, vertical scrolling, zoom, controls and unavailable UI are ignored',()=>{
    for(const options of [{clientY:100},{clientY:90},{deltaY:90},{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true},{deltaMode:1},{target:{closest:()=>true}}]){
        const f=fixture();assert.equal(f.wheel(100,options).prevented,undefined);assert.deepEqual(f.changes,[]);
    }
    const f=fixture();f.disable();assert.equal(f.wheel(100).prevented,undefined);assert.deepEqual(f.changes,[]);
});
test('partial gestures expire, can reverse, and never switch on momentum alone',()=>{
    const f=fixture();f.wheel(30);f.wheel(30,{gap:300});assert.deepEqual(f.changes,[]);
    f.wheel(-20);f.wheel(-20);assert.deepEqual(f.changes,[]);
    f.wheel(200,{momentum:true});assert.deepEqual(f.changes,[]);
    f.wheel(100,{momentum:false});assert.equal(f.view,'inactive');
    f.wheel(200,{momentum:true});f.wheel(200,{momentum:true,gap:400});assert.equal(f.view,'inactive');
});
test('scrolling past the header still allows category navigation; pointer input cancels partials',()=>{
    const f=fixture();f.scrollPastHeader();f.wheel(30);f.handlers.pointerdown();f.wheel(30);assert.deepEqual(f.changes,[]);
    f.wheel(40);assert.equal(f.view,'inactive');
});
