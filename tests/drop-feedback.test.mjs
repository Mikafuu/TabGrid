import test from 'node:test';
import assert from 'node:assert/strict';
import {dropFeedbackMode} from '../lib/drop-feedback.mjs';
test('grouping feedback is available only for compatible card and destination pairs',()=>{
    assert.equal(dropFeedbackMode('tab','new'),'group');assert.equal(dropFeedbackMode('tab','7'),'group');
    assert.equal(dropFeedbackMode('tab','ungroup'),'');assert.equal(dropFeedbackMode('group','ungroup'),'ungroup');
    for(const destination of ['new','7',undefined])assert.equal(dropFeedbackMode('group',destination),'');
    assert.equal(dropFeedbackMode('tab',undefined),'');
});

test('feedback reuses stable anchors and cleans up disposable copy effects',async()=>{
    const {createDropFeedback}=await import('../lib/drop-feedback.mjs');const plays=[],cancelled=[];
    const make=()=>({hidden:false,dataset:{},setAttribute(){},children:[],append(el){this.children.push(el);}});
    const doc={createElement:make,body:make(),addEventListener(){}};let ghost={...make(),querySelectorAll:()=>[surface]},surface={};
    const feedback=createDropFeedback({doc,getGhost:()=>ghost,motion:{cancel:t=>cancelled.push(t),play:(...args)=>plays.push(args)},style:()=>({transform:ghost.dataset.dropFeedback==='group'?'scale(.78)':'none',opacity:'1'})});
    feedback.start('tab');feedback.destination('7');assert.equal(ghost.dataset.dropFeedback,'group');assert.equal(plays[0][1],surface);
    const anchor=plays[0][3].anchor;feedback.destination('7');assert.equal(plays.length,1);
    feedback.reset();assert.equal(ghost.dataset.dropFeedback,undefined);assert.ok(cancelled.includes(surface));
    ghost={...make(),querySelectorAll:()=>[surface]};feedback.start('tab');feedback.destination('new');assert.equal(plays.at(-1)[3].anchor,anchor);assert.equal(doc.body.children.length,1);
});

test('overlap shrinks the target while tray feedback keeps shrinking the fallback',async()=>{
    const {createDropFeedback}=await import('../lib/drop-feedback.mjs');const plays=[];
    const make=()=>({dataset:{},setAttribute(){},append(){}}),surface={},targetSurface={};
    const ghost={...make(),querySelectorAll:()=>[surface],querySelector:()=>surface};
    const target={querySelector:()=>targetSurface};
    const feedback=createDropFeedback({doc:{createElement:make,body:make(),addEventListener(){}},getGhost:()=>ghost,motion:{cancel(){},play:(...args)=>plays.push(args)},style:()=>({scale:'1',transform:'none',opacity:'1'})});
    feedback.start('tab',true);assert.equal(ghost.dataset.dragLift,'');
    feedback.direct('7',target);assert.equal(ghost.dataset.dropFeedback,undefined);assert.equal(plays.at(-1)[1],targetSurface);assert.equal(plays.at(-1)[2][1].scale,'.9');
    feedback.direct(null);assert.equal(plays.at(-1)[2][1].scale,'1');
    feedback.destination('7');assert.equal(ghost.dataset.dropFeedback,'group');
    feedback.reset();delete ghost.dataset.dragLift;feedback.start('tab',false);assert.equal(ghost.dataset.dragLift,undefined);
});

test('hold chooses and smoothly lifts the source before a fallback exists, then restores on release',async()=>{
    const {createDropFeedback}=await import('../lib/drop-feedback.mjs');const plays=[];
    const make=()=>({dataset:{},setAttribute(){},append(){}}),surface={};
    const card={...make(),querySelector:()=>surface};let ghost=null;
    const feedback=createDropFeedback({doc:{createElement:make,body:make(),addEventListener(){}},getGhost:()=>ghost,motion:{cancel(){},play:(...args)=>plays.push(args)},style:()=>({scale:'.97'})});
    feedback.choose(card,true);assert.equal(card.dataset.dragLift,'');assert.deepEqual(plays.at(-1)[2],[{scale:'.97'},{scale:.94}]);
    const ghostSurface={};ghost={...make(),querySelector:()=>ghostSurface};feedback.start('tab',true);
    assert.equal(plays.at(-1)[1],ghostSurface);assert.equal(plays.at(-1)[2][0].scale,'.97');
    feedback.unchoose();assert.equal(card.dataset.dragLift,undefined);assert.equal(plays.at(-1)[2][1].scale,1);
    const count=plays.length;feedback.choose(card,false);feedback.unchoose();assert.equal(plays.length,count);
});
