import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryFrames,createCategoryTransition} from '../lib/category-transition.mjs';
test('category transition follows navigation direction and ends in place',()=>{
    assert.equal(categoryFrames(1)[0].transform,'translateX(40px)');
    assert.equal(categoryFrames(-1)[0].transform,'translateX(-40px)');
    assert.deepEqual(categoryFrames(1)[1],{transform:'translateX(0px)',opacity:1});
});
test('category transition cancels interrupted content effects and skips hidden content',()=>{
    const plays=[],cancelled=[];const visible={closest:()=>false,getClientRects:()=>[1]},hidden={closest:()=>true};
    const doc={createElement:()=>({append(){}}),body:{append(){}}};
    const run=createCategoryTransition({doc,content:{querySelectorAll:()=>[visible,hidden]},motion:{cancel:t=>cancelled.push(t),play:(...args)=>plays.push(args)}});
    run(1);run(-1);assert.equal(plays.length,2);assert.deepEqual(cancelled,[visible]);assert.equal(plays[1][2][0].transform,'translateX(-40px)');
});
