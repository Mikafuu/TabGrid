import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestCategory} from '../lib/glass-tabs.mjs';
test('dragging chooses the nearest visible category with unequal label widths',()=>{
    const tabs=[{id:'tabs',left:4,width:82},{id:'idle',left:88,width:91},{id:'recent',left:181,width:136}];
    assert.equal(nearestCategory(tabs,40).id,'tabs');assert.equal(nearestCategory(tabs,140).id,'idle');assert.equal(nearestCategory(tabs,280).id,'recent');
    assert.equal(nearestCategory(tabs,-100).id,'tabs');assert.equal(nearestCategory(tabs,999).id,'recent');assert.equal(nearestCategory([],50),null);
});

test('pill bounds match fractional title button sizes and scroll coordinates',async()=>{
    const {pillBounds,dragPillBounds}=await import('../lib/glass-tabs.mjs');
    assert.deepEqual(pillBounds({clientLeft:1,clientTop:1,scrollLeft:20,scrollTop:0,getBoundingClientRect:()=>({left:50,top:100})},{getBoundingClientRect:()=>({left:155.5,top:105,width:137.25,height:39.5})}),{left:124.5,top:4,width:137.25,height:39.5});
    const items=[{left:4,width:82},{left:88,width:137.25}];
    assert.deepEqual(dragPillBounds(items,160),{left:88,width:137.25});
    assert.deepEqual(dragPillBounds(items,-20),{left:4,width:82});
});
