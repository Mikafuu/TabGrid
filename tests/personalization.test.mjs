import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS,PREFS_KEY,validatePreferences,migratePreferences,needsConfirmation,cleanHistory,normalizeHost,siteMatches,validateShortcuts,keyBinding,exportSettings,importSettings } from '../lib/preferences.mjs';
import { openItems, selectedTabs } from '../lib/tab-model.mjs';
import { emptyFilters,textMatches,recentSearches,HistoryFocus } from '../lib/search.mjs';
import { UndoNotice } from '../lib/tab-ui.mjs';
import { inactiveTabIds } from '../lib/tab-library.mjs';
import { restoreView,ViewState } from '../lib/view-state.mjs';
import { PreviewCache } from '../lib/preview-cache.mjs';
import { Personalization } from '../lib/personalization.mjs';
import { fixture } from './chrome-mock.mjs';

const tabs=[{id:1,windowId:1,index:0,title:'Alpha paper',url:'https://one.example/a',groupId:7,lastAccessed:1},{id:2,windowId:1,index:1,title:'Beta',url:'https://two.example/b',groupId:7,pinned:false,audible:true,mutedInfo:{muted:true},lastAccessed:1},{id:3,windowId:1,index:2,title:'Alpha',url:'https://two.example/c',groupId:-1,pinned:true,lastAccessed:1},{id:4,windowId:2,index:0,title:'Elsewhere',url:'https://one.example/d',groupId:-1,lastAccessed:1}];
const groups=[{id:7,windowId:1,title:'Research'}];
function memory(initial={}) {const data=structuredClone(initial);return {data,async get(keys){return keys===null?structuredClone(data):Object.fromEntries([keys].flat().map(k=>[k,structuredClone(data[k])]))},async set(values){Object.assign(data,structuredClone(values));},async remove(keys){for(const key of [keys].flat())delete data[key];},async getBytesInUse(keys){return [keys].flat().reduce((n,k)=>n+(data[k]===undefined?0:Buffer.byteLength(JSON.stringify({[k]:data[k]}))),0)}};}
function previewFixture(){const f=fixture([{id:1,windowId:1,index:0,active:true,url:'https://one.example/a'},{id:2,windowId:1,index:1,url:'https://two.example/b'}]);f.api.storage.local=memory({[PREFS_KEY]:{...DEFAULTS,previewLimit:1}});return f;}

test('preferences migrate existing choices and fill offline defaults',()=>{const p=migratePreferences({preferredColumns:3,sortMode:'title',inactiveDays:14,swipeClose:true});assert.equal(p.preferredColumns,3);assert.equal(p.undoMs,5000);assert.equal(p.historyEnabled,false);assert.equal('swipeClose' in p,false);assert.equal(p.rememberRootScroll,true);});
test('invalid preferences cannot disable all search fields or corrupt limits',()=>{for(const patch of [{matchTitle:false,matchUrl:false},{undoSeconds:0},{undoSeconds:1.5},{previewLimit:1025},{inactiveDays:-1},{historyCount:7},{motion:'custom'},{capture:'yes'}])assert.throws(()=>validatePreferences(patch));});
test('site matching normalizes URLs and uses domain boundaries',()=>{assert.equal(normalizeHost('HTTPS://EXAMPLE.COM/path'),'example.com');assert.equal(siteMatches('https://a.example.com/x',['example.com']),true);assert.equal(siteMatches('https://notexample.com',['example.com']),false);for(const host of ['*','file:///tmp/a','bad value','https://user:pass@example.com'])assert.throws(()=>normalizeHost(host));});
test('text matching honors enabled fields and phrase versus words',()=>{const item={title:'Alpha beta',url:'https://example.com/gamma'};assert.equal(textMatches(item,'alpha gamma',{matchMode:'words'}),true);assert.equal(textMatches(item,'alpha gamma',{matchMode:'phrase'}),false);assert.equal(textMatches(item,'example',{matchUrl:false}),false);assert.equal(textMatches(item,'ALPHA',{matchTitle:false}),false);});
test('filters flatten groups and selected IDs exclude nonmatching members',()=>{const items=openItems(tabs,groups,{windowId:1,filters:{...emptyFilters(),audible:'yes'}});assert.deepEqual(items.map(i=>i.key),['tab:2']);assert.deepEqual(selectedTabs(new Set(items.map(i=>i.key)),tabs).map(t=>t.id),[2]);});
test('filter intersection and group-name matching retain only matching members',()=>{const f={...emptyFilters(),websites:['one.example','two.example'],groups:[7],pinned:'no',muted:'yes'};assert.deepEqual(openItems(tabs,groups,{windowId:1,query:'Research',filters:f}).map(i=>i.key),['tab:2']);assert.equal(openItems(tabs,groups,{windowId:1,query:'Research',showGroups:false,filters:f}).length,0);});
test('explicit group filtering searches members with nested option off',()=>{assert.deepEqual(openItems(tabs,groups,{windowId:1,query:'Alpha',nested:false,filters:{...emptyFilters(),groups:[7]}}).map(i=>i.key),['tab:1']);});
test('focused history ignores retired suggestion switches and never exposes private or disabled history',()=>{
    const history=Array.from({length:12},(_,i)=>({query:`Search ${i}`,time:Date.now()}));
    assert.deepEqual(recentSearches(history,DEFAULTS),[]);
    const prefs={...DEFAULTS,historyEnabled:true,suggestHistory:false,suggestTabs:true,suggestGroups:true};
    assert.equal(recentSearches(history,prefs).length,5);
    assert.equal(recentSearches(history,{...prefs,historyCount:10}).length,10);
    assert.deepEqual(recentSearches(history,prefs,true),[]);
    assert.deepEqual(recentSearches([{query:'expired',time:1}],{...prefs,historyDays:7}),[]);
});
test('retired suggestions migrate away while drawer preferences validate and round-trip',()=>{
    const prefs=migratePreferences({[PREFS_KEY]:{...DEFAULTS,suggestTabs:true,suggestGroups:false,suggestHistory:false,historyEnabled:true}});
    assert.equal(prefs.historyEnabled,true);assert.equal('suggestTabs' in prefs,false);
    assert.equal(prefs.drawerEdge,'left');
    assert.equal(importSettings(exportSettings({...prefs,drawerEdge:'bottom',drawerOffset:73})).drawerOffset,73);
    for(const patch of [{drawerEdge:'middle'},{drawerOffset:101},{drawerOffset:-1},{drawerOffset:1.5}])assert.throws(()=>validatePreferences(patch));
});
test('history expires and deduplicates case-insensitively at twenty entries',()=>{const now=1e12;const values=[{query:' Alpha ',time:now},{query:'alpha',time:now-1},{query:'old',time:now-8*86400000},...Array.from({length:30},(_,i)=>({query:`q${i}`,time:now}))];const clean=cleanHistory(values,7,now);assert.equal(clean.length,20);assert.equal(clean[0].query,'Alpha');assert.ok(!clean.some(e=>e.query==='old'));});
test('confirmation policies use actual counts and a strict threshold',()=>{assert.equal(needsConfirmation(0,{closePolicy:'always'}),false);assert.equal(needsConfirmation(1,DEFAULTS),false);assert.equal(needsConfirmation(2,DEFAULTS),true);assert.equal(needsConfirmation(5,{closePolicy:'above',closeThreshold:5}),false);assert.equal(needsConfirmation(6,{closePolicy:'above',closeThreshold:5}),true);});
test('custom Undo timeout is sampled for each notice, preserving active remainder',()=>{let seconds=9,delay;const notice=new UndoNotice({duration:()=>seconds*1000,change(){},schedule(fn,ms){delay=ms;return 1},cancel(){}});notice.observe([]);notice.observe([{id:'a',completedAt:1,tabs:[{state:'closed'}]}]);assert.equal(delay,9000);seconds=3;notice.observe([{id:'a',completedAt:1,tabs:[{state:'closed'}]}]);assert.equal(notice.remaining,9000);notice.observe([{id:'b',completedAt:2,tabs:[{state:'closed'}]}]);assert.equal(delay,3000);});
test('idle website or group protection keeps whole groups active',()=>{const quiet=tabs.map(t=>({...t,audible:false}));assert.ok(inactiveTabIds(quiet,1,{},1e12).has(1));assert.equal(inactiveTabIds(quiet,1,{},1e12,{sites:['one.example']}).has(1),false);assert.equal(inactiveTabIds(quiet,1,{},1e12,{groups:[7]}).has(1),false);});
test('shortcuts reject duplicates and reserved navigation but preserve platform modifiers',()=>{assert.throws(()=>validateShortcuts({...DEFAULTS.shortcuts,select:'/'}),/unique/);assert.throws(()=>validateShortcuts({...DEFAULTS.shortcuts,select:'Mod+W'}),/reserved/);assert.equal(keyBinding({key:'z',metaKey:true},true),'Mod+Z');assert.equal(keyBinding({key:'z',ctrlKey:true},false),'Mod+Z');});
test('backup excludes unknown data, fills missing preferences, and rejects invalid files',()=>{const text=exportSettings({...DEFAULTS,query:'secret',screenshots:['secret']});assert.ok(!text.includes('secret'));assert.equal(importSettings(text).undoMs,5000);assert.equal(importSettings(JSON.stringify({format:'TabGrid settings',version:1,preferences:{undoSeconds:12}})).undoMs,12000);assert.throws(()=>importSettings('{'));assert.throws(()=>importSettings(JSON.stringify({format:'TabGrid settings',version:2,preferences:{}})));});
test('view state restores query and scroll independently for root and groups',()=>{const saved={query:'alpha',position:{key:'tab:1',offset:4,scroll:120}};assert.deepEqual(restoreView(saved,DEFAULTS),{query:'',position:saved.position});assert.deepEqual(restoreView(saved,{...DEFAULTS,rememberGroupQuery:true,rememberGroupScroll:false},true),{query:'alpha',position:null});});
test('session view state isolates windows and private mode',async()=>{const api={storage:{session:memory()}};const a=new ViewState(api,1,false),b=new ViewState(api,2,false),c=new ViewState(api,1,true);await a.set('root',null,{query:'normal'});await a.set('group',7,{query:'group'});await b.load();await c.load();assert.deepEqual(b.data.root,{});assert.deepEqual(c.data.root,{});const reopened=new ViewState(api,1,false);await reopened.load();assert.equal(reopened.data.groups[7].query,'group');});
test('preview eviction removes oldest screenshots without touching unrelated storage',async()=>{const f=previewFixture(),store=f.api.storage.local;await store.set({screenshot_1:'x'.repeat(600000),screenshot_2:'y'.repeat(600000),tabgridPreviewIndex:{screenshot_1:{url:'https://one.example/a',time:1},screenshot_2:{url:'https://two.example/b',time:2}},unrelated:'keep'});const cache=new PreviewCache(f.api,'chrome-extension://test/grid.html');const result=await cache.reconcile();assert.equal(result.count,1);assert.ok(!store.data.screenshot_1);assert.ok(store.data.screenshot_2);assert.equal(store.data.unrelated,'keep');});
test('disabling capture retains previews but excluding a site removes them',async()=>{const f=previewFixture(),store=f.api.storage.local;await store.set({screenshot_1:'image',[PREFS_KEY]:{...DEFAULTS,capture:false}});const c=new PreviewCache(f.api,'chrome-extension://test/grid.html');await c.reconcile();assert.equal(store.data.screenshot_1,'image');await store.set({[PREFS_KEY]:{...DEFAULTS,previewSites:['one.example']}});await c.reconcile();assert.equal(store.data.screenshot_1,undefined);});
test('clearing previews invalidates an in-flight capture',async()=>{const f=previewFixture();let finish,started;const ready=new Promise(r=>started=r);f.api.tabs.captureVisibleTab=()=>{started();return new Promise(r=>finish=r)};const c=new PreviewCache(f.api,'chrome-extension://test/grid.html');const pending=c.capture(1);await ready;await c.clear();finish('late screenshot');await pending;assert.equal(f.api.storage.local.data.screenshot_1,undefined);});
test('capture rechecks exclusions and changed URLs before storing',async()=>{for(const change of ['site','url']){const f=previewFixture();let finish,started;const ready=new Promise(r=>started=r);f.api.tabs.captureVisibleTab=()=>{started();return new Promise(r=>finish=r)};const c=new PreviewCache(f.api,'chrome-extension://test/grid.html');const pending=c.capture(1);await ready;if(change==='site')await f.api.storage.local.set({[PREFS_KEY]:{...DEFAULTS,previewSites:['one.example']}});else await f.api.tabs.update(1,{url:'https://changed.example/'});finish('late image');await pending;assert.equal(f.api.storage.local.data.screenshot_1,undefined);}});
test('oversized previews and private tabs are never captured into storage',async()=>{const f=previewFixture();let calls=0;f.api.tabs.captureVisibleTab=async()=>{calls++;return 'x'.repeat(1100000)};const c=new PreviewCache(f.api,'chrome-extension://test/grid.html');await c.capture(1);assert.equal(f.api.storage.local.data.screenshot_1,undefined);await f.api.tabs.update(1,{incognito:true});await c.capture(1);assert.equal(calls,1);});
test('personalization history preserves hidden entries and import is all-or-nothing',async()=>{const f=previewFixture();const p=new Personalization(f.api,'chrome-extension://test/grid.html');await p.ready;await p.updatePreferences({historyEnabled:true});await p.history('record','Alpha');await p.updatePreferences({historyEnabled:false});assert.equal((await p.history())[0].query,'Alpha');const before=await p.preferences();await assert.rejects(p.import(JSON.stringify({format:'TabGrid settings',version:1,preferences:{undoSeconds:-1}}),true));assert.deepEqual(await p.preferences(),before);});
test('private personalization never exposes history or preview/backup management',async()=>{const f=previewFixture();f.api.extension.inIncognitoContext=true;await f.api.storage.local.set({tabgridSearchHistory:[{query:'regular secret',time:Date.now()}]});const p=new Personalization(f.api,'chrome-extension://test/grid.html');await p.ready;assert.deepEqual(await p.history(),[]);await assert.rejects(p.preview('usage'),/Incognito/);await assert.rejects(p.import(exportSettings(DEFAULTS),true),/Incognito/);});
test('new-after respects stay-in-grid and switch settings after grouping',async()=>{const f=fixture([{id:1,windowId:1,index:0,groupId:7},{id:99,windowId:1,index:1,url:'chrome-extension://test/grid.html',active:true}],[{id:7,windowId:1}]);const tab=await f.actions.newAfter([1],false);assert.equal(f.tabs().find(t=>t.id===99).active,true);assert.equal(f.tabs().find(t=>t.id===tab.id).groupId,7);const next=await f.actions.newAfter([tab.id],true);assert.equal(f.tabs().find(t=>t.id===next.id).active,true);});

test('hostname validation rejects malformed labels and permits local hosts and IPv6',()=>{
    for(const host of ['https://.','-bad.example','bad-.example','a..example','https://bad_.example'])assert.throws(()=>normalizeHost(host));
    assert.equal(normalizeHost('localhost:8080'),'localhost');
    assert.equal(normalizeHost('http://[::1]:8080/'),'[::1]');
});
test('reserved tab switching and window closing shortcuts are rejected',()=>{
    for(const binding of ['Mod+1','Ctrl+9','Alt+F4','Ctrl+F4','Alt+D','Mod+K','Mod+Alt+I','Mod+M','Mod+Shift+T'])assert.throws(()=>validateShortcuts({...DEFAULTS.shortcuts,select:binding}),/reserved/);
});
test('preview write rechecks active identity after an asynchronous capture',async()=>{
    const f=previewFixture();let finish,started;const ready=new Promise(r=>started=r);
    f.api.tabs.captureVisibleTab=()=>{started();return new Promise(r=>finish=r)};
    const cache=new PreviewCache(f.api,'chrome-extension://test/grid.html');const pending=cache.capture(1);await ready;
    await f.api.tabs.update(2,{active:true});finish('wrong visible tab');await pending;
    assert.equal(f.api.storage.local.data.screenshot_1,undefined);
});
test('backup preview does not apply changes and malformed apply arguments are rejected',async()=>{
    const f=previewFixture(),p=new Personalization(f.api,'chrome-extension://test/grid.html');await p.ready;
    const backup=exportSettings({...DEFAULTS,undoMs:19000});assert.equal((await p.import(backup,false)).undoMs,19000);
    assert.equal((await p.preferences()).undoMs,5000);await assert.rejects(p.import(backup,'yes'),/Invalid/);
    await p.import(backup,true);assert.equal((await p.preferences()).undoMs,19000);
});
test('preferences, search, cached previews and backup survive service recreation without network APIs',async()=>{
    const fetchBefore=globalThis.fetch;globalThis.fetch=()=>{throw Error('Network disabled in acceptance fixture');};
    try{
        const f=previewFixture(),url='chrome-extension://test/grid.html';let p=new Personalization(f.api,url);await p.ready;
        await p.updatePreferences({undoMs:17000,historyEnabled:true});await p.history('record','Alpha');
        await f.api.storage.local.set({screenshot_1:'data:image/png;base64,cached'});
        p=new Personalization(f.api,url);await p.ready;
        const prefs=await p.preferences();assert.equal(prefs.undoMs,17000);
        assert.equal(openItems(tabs,groups,{windowId:1,query:'Alpha',preferences:prefs}).length,2);
        assert.equal((await p.preview('usage')).count,1);assert.equal(f.api.storage.local.data.screenshot_1,'data:image/png;base64,cached');
        const backup=exportSettings(prefs);await p.import(backup,true);assert.equal((await p.history())[0].query,'Alpha');
        const closed=await f.actions.close([2]);assert.equal(closed.count,1);
    }finally{globalThis.fetch=fetchBefore;}
});
test('group session state follows a group between windows without overwriting other groups',async()=>{
    const api={storage:{session:memory()}};
    const first=new ViewState(api,1,false),second=new ViewState(api,2,false),privateView=new ViewState(api,2,true);
    await first.set('group',7,{query:'research',position:{key:'tab:1',offset:10,scroll:20}});
    await second.set('group',8,{query:'different group'});
    assert.equal((await second.group(7)).query,'research');
    assert.equal((await privateView.group(7)).query,undefined);
    const reopened=new ViewState(api,3,false);await reopened.load();
    assert.equal(reopened.data.groups[7].query,'research');assert.equal(reopened.data.groups[8].query,'different group');
});

test('automatic search focus stays quiet until a click or typing, independently per panel', () => {
    const root=new HistoryFocus(),group=new HistoryFocus();root.automatic();group.automatic();
    assert.equal(root.allowed,false);assert.equal(group.allowed,false);
    // A late history refresh reads the same gate and cannot expose entries.
    assert.equal(root.allowed,false);root.interact();assert.equal(root.allowed,true);assert.equal(group.allowed,false);
    group.interact();assert.equal(group.allowed,true);root.automatic();assert.equal(root.allowed,false);root.blur();assert.equal(root.allowed,true);
});
test('new drawer defaults are on but existing off and saved lengths survive migration and backup', () => {
    assert.equal(migratePreferences({}).dropGroups,true);assert.equal(migratePreferences({dropGroups:false}).dropGroups,false);
    const prefs=migratePreferences({[PREFS_KEY]:{dropGroups:false,drawerLength:256}});assert.equal(prefs.drawerLength,256);assert.equal(prefs.dropGroups,false);
    assert.equal(importSettings(exportSettings(prefs)).drawerLength,256);
    for(const length of [0,63,321,128.5])assert.throws(()=>validatePreferences({drawerLength:length}));
});
