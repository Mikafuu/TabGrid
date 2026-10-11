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
