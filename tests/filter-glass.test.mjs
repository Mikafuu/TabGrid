import test from 'node:test';
import assert from 'node:assert/strict';
import {coverImageRect} from '../lib/filter-glass.mjs';

test('wallpaper sampling matches centered cover for wide and tall uploads', () => {
    assert.deepEqual(coverImageRect(2000,1000,{left:-96,top:-96,width:1000,height:1000}),
        {x:-596,y:-96,width:2000,height:1000});
    assert.deepEqual(coverImageRect(1000,2000,{left:-96,top:-96,width:1000,height:1000}),
        {x:-96,y:-596,width:1000,height:2000});
});
test('wallpaper sampling preserves the overscan offset at non-square viewport sizes', () => {
    const rect=coverImageRect(1200,900,{left:-96,top:-96,width:992,height:1092});
    assert.equal(rect.height,1092);
    assert.equal(rect.y,-96);
    assert.ok(Math.abs(rect.x+rect.width/2-400)<1e-9);
});
