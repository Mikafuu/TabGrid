import test from 'node:test';
import assert from 'node:assert/strict';
import {mountNoticePopover} from '../lib/notice-popover.mjs';
test('notice exit holds its final frame and cannot hide a newer notice',()=>{
 const plans=[];let open=false,hides=0;
 const body={append(el){el.parentElement=this;}},doc={body,createElement:()=>({}),querySelectorAll:()=>[]};
 const element={setAttribute(){},showPopover(){open=true;},hidePopover(){open=false;hides++;},matches:()=>open};
 const motion={cancel(){},play(...args){plans.push(args);}};
 const notice=mountNoticePopover(element,{doc,motion,timing:()=>({duration:10}),allowed:()=>true});
 notice.set(true);notice.set(false);const exit=plans.at(-1)[3];
 assert.equal(exit.effectTiming.fill,'forwards');assert.equal(open,true);
 notice.set(true);exit.onFinish();assert.equal(open,true);assert.equal(hides,0);
 notice.set(false);plans.at(-1)[3].onFinish();assert.equal(open,false);assert.equal(hides,1);
});
