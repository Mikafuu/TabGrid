import test from 'node:test';
import assert from 'node:assert/strict';
import {matchingFilterOptions,groupColors} from '../lib/filter-picker.mjs';
const items=[{value:'one',label:'example.com'},{value:'two',label:'sub.example.com'},{value:'three',label:'Research'},{value:'four',label:'Research'}];
test('filter picker uses trimmed case-insensitive phrase matching within names',()=>{assert.deepEqual(matchingFilterOptions(items,' EXAMPLE.COM '),items.slice(0,2));assert.deepEqual(matchingFilterOptions(items,'exam'),items.slice(0,2));assert.deepEqual(matchingFilterOptions(items,'otherexample.com'),[]);});
test('filter picker lists all options for an empty query and preserves duplicate group identities',()=>{assert.deepEqual(matchingFilterOptions(items,''),items);assert.deepEqual(matchingFilterOptions(items,'research'),items.slice(2));assert.equal(Object.keys(groupColors).length,9);});
