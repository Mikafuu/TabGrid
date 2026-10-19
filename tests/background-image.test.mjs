import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUND_KEY, MAX_BACKGROUND_BYTES, validateBackground, backgroundDimensions, prepareBackground, applyBackgroundAdjustments } from '../lib/background-image.mjs';
import { DEFAULTS, PREFS_KEY, validatePreferences, exportSettings, importSettings } from '../lib/preferences.mjs';
import { Personalization } from '../lib/personalization.mjs';
import { fixture } from './chrome-mock.mjs';
const image={name:'local photo.webp',dataUrl:'data:image/webp;base64,'+btoa('RIFF0000WEBPtest')};
test('background uploads accept only bounded local WebP assets',()=>{
    assert.deepEqual(validateBackground({...image,extra:'ignore'}),image);
    for(const value of [null,{...image,name:'x'.repeat(161)},{...image,dataUrl:'https://example.com/image.webp'},{...image,dataUrl:'data:image/svg+xml;base64,AAAA'},{...image,dataUrl:'data:image/webp;base64,AAAA'},{...image,dataUrl:'data:image/webp;base64,'+'A'.repeat(MAX_BACKGROUND_BYTES*2)}])assert.throws(()=>validateBackground(value));
});
test('uploaded images preserve aspect ratio and cap dimensions',()=>{
    assert.deepEqual(backgroundDimensions(6000,4000),{width:2560,height:1707});
    assert.deepEqual(backgroundDimensions(800,1200),{width:800,height:1200});
    assert.deepEqual(backgroundDimensions(1,3000),{width:1,height:2560});
    for(const [w,h]of [[0,1],[NaN,1],[Infinity,2],[9000,9000]])assert.throws(()=>backgroundDimensions(w,h));
});
test('invalid upload files fail before image decoding',async()=>{
    for(const file of [null,{type:'image/svg+xml',size:100},{type:'image/png',size:0},{type:'image/jpeg',size:16*1024*1024}])await assert.rejects(prepareBackground(file));
});
test('background adjustment defaults, bounds and backups',()=>{
    const prefs=validatePreferences({});assert.equal(prefs.backgroundTransparency,35);assert.equal(prefs.backgroundBlur,0);
    for(const patch of [{backgroundTransparency:-1},{backgroundTransparency:101},{backgroundBlur:41},{backgroundBlur:1.5},{backgroundTransparency:'20'}])assert.throws(()=>validatePreferences(patch));
    const saved=importSettings(exportSettings({...DEFAULTS,backgroundTransparency:72,backgroundBlur:18,background:image}));assert.equal(saved.backgroundTransparency,72);assert.equal(saved.backgroundBlur,18);assert.equal(saved.background,undefined);
    const vars={};const root={style:{setProperty:(k,v)=>vars[k]=v}};applyBackgroundAdjustments(root,{backgroundTransparency:100,backgroundBlur:40});assert.equal(vars['--background-opacity'],'0');assert.equal(vars['--background-blur'],'40px');
});
test('background storage persists separately, preserves previews, and removes only the image',async()=>{
    const f=fixture([]),url='chrome-extension://test/grid.html',p=new Personalization(f.api,url);await p.ready;
    await f.api.storage.local.set({screenshot_77:'cached',unrelated:'keep'});
    await p.background('set',image);assert.deepEqual(f.local[BACKGROUND_KEY],image);assert.equal(f.local.screenshot_77,'cached');
    const restored=new Personalization(f.api,url);await restored.ready;assert.deepEqual(f.local[BACKGROUND_KEY],image);
    const before=f.local[BACKGROUND_KEY];await assert.rejects(p.background('set',{...image,dataUrl:'bad'}));assert.equal(f.local[BACKGROUND_KEY],before);
    assert.equal(JSON.stringify(f.local[PREFS_KEY]).includes(image.dataUrl),false);
    await p.background('remove');assert.equal(f.local[BACKGROUND_KEY],undefined);assert.equal(f.local.unrelated,'keep');
});
test('Incognito cannot change backgrounds or their adjustments',async()=>{
    const f=fixture([]);f.api.extension.inIncognitoContext=true;const p=new Personalization(f.api,'chrome-extension://test/grid.html');await p.ready;
    await assert.rejects(p.background('set',image),/regular window/);await assert.rejects(p.background('remove'),/regular window/);
    await assert.rejects(p.updatePreferences({backgroundBlur:9}),/regular window/);assert.equal(f.local[BACKGROUND_KEY],undefined);
});
