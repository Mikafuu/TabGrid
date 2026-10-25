import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './chrome-mock.mjs';
import {UndoNotice} from '../lib/tab-ui.mjs';
const tabs=[{id:1,windowId:1,index:0,groupId:7},{id:2,windowId:1,index:1,groupId:7},{id:3,windowId:1,index:2},{id:4,windowId:2,index:0}];
const groups=[{id:7,windowId:1,title:'Original',color:'blue',collapsed:true}];
test('undo a newly created group restores membership and tab order',async()=>{
 const f=fixture(tabs,groups);await f.actions.group([2,3],null,'New','red');
 assert.equal(f.storage.tabgridUndo.length,1);assert.ok(f.storage.tabgridUndo[0].completedAt);
 await f.actions.undo();assert.equal(f.tabs().find(t=>t.id===2).groupId,7);assert.equal(f.tabs().find(t=>t.id===3).groupId,-1);
 assert.deepEqual(f.tabs().filter(t=>t.windowId===1).sort((a,b)=>a.index-b.index).map(t=>t.id),[1,2,3]);assert.equal(f.storage.tabgridUndo.length,0);
});
test('undo complete ungrouping recreates original title, color, collapsed state and membership',async()=>{
 const f=fixture(tabs,groups);await f.actions.ungroup([1,2]);assert.equal(f.groups().length,0);
 await f.actions.undo();const group=f.groups()[0];assert.deepEqual({...group,id:7},groups[0]);assert.ok(f.tabs().filter(t=>[1,2].includes(t.id)).every(t=>t.groupId===group.id));
});
test('cross-window group drop journals once and undo returns original window/group',async()=>{
 const f=fixture(tabs,groups);await f.actions.dropIntoGroup([2], 'new',2,{title:'Target'});
 assert.equal(f.storage.tabgridUndo.length,1);await f.actions.undo();const tab=f.tabs().find(t=>t.id===2);assert.equal(tab.windowId,1);assert.equal(tab.groupId,7);
});
test('grouping undo never resurrects subsequently closed tabs or duplicates tabs on retry',async()=>{
 const f=fixture(tabs,groups);await f.actions.ungroup([1,2]);await f.api.tabs.remove(2);f.fail.move=true;
 const first=await f.actions.undo();assert.ok(first.error);assert.equal(f.tabs().length,3);
 f.fail.move=false;await f.actions.undo();assert.equal(f.tabs().length,3);assert.ok(!f.tabs().some(t=>t.id===2));assert.equal(f.storage.tabgridUndo.length,0);
});
test('no-op and rejected group changes do not leave an undo entry',async()=>{
 const f=fixture(tabs,groups);await f.actions.group([1,2],7);assert.equal(f.storage.tabgridUndo.length,0);
 await assert.rejects(f.actions.group([1,4],null));assert.equal(f.storage.tabgridUndo.length,0);
});
test('partial grouping failure still offers undo of changed membership',async()=>{
 const f=fixture(tabs,groups);const update=f.api.tabGroups.update;f.api.tabGroups.update=async()=>{throw Error('locked');};
 await assert.rejects(f.actions.group([3],null,'New'));assert.equal(f.storage.tabgridUndo[0].tabs[0].state,'changed');
 f.api.tabGroups.update=update;await f.actions.undo();assert.equal(f.tabs().find(t=>t.id===3).groupId,-1);
});
test('private group actions remain out of the regular undo journal',async()=>{
 const f=fixture(tabs.map(t=>({...t,incognito:true})),groups);f.actions.private=true;await f.actions.ungroup([1,2]);assert.equal(f.storage.tabgridUndo,undefined);
});
test('Undo notice recognizes grouping records and dismisses after restore',()=>{
 const seen=[],notice=new UndoNotice({change:e=>seen.push(e),schedule:()=>1,cancel:()=>{}});notice.observe([]);
 const entry={id:'group',kind:'grouping',completedAt:1,tabs:[{state:'changed'}]};notice.observe([entry]);assert.equal(notice.entry.id,'group');notice.observe([]);assert.equal(notice.entry,null);
});
