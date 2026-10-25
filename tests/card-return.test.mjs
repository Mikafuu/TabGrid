import test from 'node:test';
import assert from 'node:assert/strict';
import {returnFrames} from '../lib/card-return.mjs';
test('card return preserves the released center and shrink scale before settling in its slot',()=>{
 const to={left:100,top:200,width:200,height:120};
 const frames=returnFrames({left:306,top:263.6,width:188,height:112.8},to);
 assert.equal(frames[0].translate,'200px 60px');assert.equal(frames[0].scale,'0.94 0.94');
 assert.deepEqual(frames.at(-1),{translate:'0px 0px',scale:'1 1'});
 assert.equal(returnFrames(to,to),null);assert.equal(returnFrames(to,{...to,width:0}),null);
});

test('drop return reserves the surface immediately through persistence and releases it on finish',async()=>{
 const {createCardReturn}=await import('../lib/card-return.mjs');let release,plan;
 const rect={left:200,top:100,width:100,height:80};
 const surface={style:{translate:'',scale:'',transform:''},getAnimations:()=>[]};
 const card={isConnected:true,dataset:{key:'tab:1'},querySelector:()=>surface,getBoundingClientRect:()=>({left:50,top:100,width:100,height:80})};
 const doc={body:{append(){}},createElement:()=>({}),addEventListener(type,fn){release=fn;}};
 const start=createCardReturn({doc,getGhost:()=>({querySelector:()=>({getBoundingClientRect:()=>rect})}),motion:{cancel(){},play(...args){plan=args;}}});
 release();start(card);
 assert.equal(card.dataset.cardReturn,'');assert.equal(surface.style.translate,'150px 0px');
 assert.equal(plan[3].effectTiming.fill,'forwards');plan[3].onFinish();
 assert.equal(card.dataset.cardReturn,undefined);assert.equal(surface.style.translate,'');
});
