import test from 'node:test';
import assert from 'node:assert/strict';
import {matchSettings} from '../lib/settings-search.mjs';
test('settings search matches label and category words without changing controls',()=>{
    const entries=[{label:'Reduce animations',category:'Appearance'},{label:'Record search history',category:'Search & Filters'}];
    assert.deepEqual(matchSettings(entries,' APPEARANCE reduce '),[entries[0]]);
    assert.deepEqual(matchSettings(entries,'history'),[entries[1]]);
    assert.deepEqual(matchSettings(entries,' '),[]);assert.deepEqual(matchSettings(entries,'missing'),[]);
});
