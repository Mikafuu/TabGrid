import test from 'node:test';
import assert from 'node:assert/strict';
import {disclosureIndicator} from '../lib/disclosure.mjs';
test('disclosure rotates counterclockwise and reverses while preserving accessibility state',()=>{
    const attrs={},icon={setAttribute(){}};
    const button={append(){},getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v};
    const effects=[],motion={cancel(){},play:(container,target,frames)=>effects.push(frames)};
    const indicator=disclosureIndicator(button,{createElement:()=>icon},()=>({transform:'none'}));
    indicator.set(false);indicator.set(true,motion);
    assert.equal(attrs['aria-expanded'],'true');assert.equal(effects[0][1].transform,'rotate(-180deg)');
    indicator.set(false,motion);assert.equal(effects[1][1].transform,'rotate(0deg)');
    assert.equal(attrs['aria-expanded'],'false');
});
