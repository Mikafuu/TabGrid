import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {THEMES,FONTS,STYLES,resolveAppearance,applyAppearance} from '../lib/appearance.mjs';
import {DEFAULTS,PREFS_KEY,migratePreferences,validatePreferences,exportSettings,importSettings} from '../lib/preferences.mjs';
function contrast(a,b){const luminance=c=>{const rgb=c.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('appearance migrates old preferences without changing saved behavior',()=>{const prefs=migratePreferences({[PREFS_KEY]:{version:1,preferredColumns:3,motion:'off',showLastUsed:true}});assert.equal(prefs.colorMode,'system');assert.equal(prefs.theme,'calm');assert.equal(prefs.font,'geist');assert.equal(prefs.motion,'off');assert.equal(prefs.preferredColumns,3);assert.equal(prefs.showLastUsed,true);});
test('manual modes override the system, while automatic mode follows both states',()=>{for(const system of [false,true]){assert.equal(resolveAppearance({...DEFAULTS,colorMode:'light'},system).mode,'light');assert.equal(resolveAppearance({...DEFAULTS,colorMode:'dark'},system).mode,'dark');assert.equal(resolveAppearance(DEFAULTS,system).mode,system?'dark':'light');}});
test('every theme supports readable light and dark control palettes',()=>{assert.equal(new Set(THEMES.map(t=>t.id)).size,THEMES.length);for(const theme of THEMES)for(const mode of ['light','dark']){const p=theme[mode];for(const surface of ['bg','surface','selected'])for(const text of ['text','muted','accent'])assert.ok(contrast(p[text],p[surface])>=4.5,`${theme.id} ${mode} ${text}/${surface}: ${contrast(p[text],p[surface])}`);assert.ok(contrast(p.accent,mode==='dark'?'#18221e':'#ffffff')>=4.5,`${theme.id} ${mode} primary`);}});
test('themes and fonts round-trip through local backup and reject invalid values atomically',()=>{for(const theme of THEMES)for(const font of FONTS){const p=importSettings(exportSettings({...DEFAULTS,theme:theme.id,font:font.id,colorMode:'dark'}));assert.equal(p.theme,theme.id);assert.equal(p.font,font.id);assert.equal(p.colorMode,'dark');}for(const patch of [{theme:'remote'},{font:'https://fonts.example/font'},{colorMode:'auto'},{theme:null},{font:4}])assert.throws(()=>validatePreferences(patch));assert.throws(()=>importSettings(JSON.stringify({format:'TabGrid settings',version:1,preferences:{theme:'missing',undoSeconds:20}})));});
test('applying consecutive themes replaces prior tokens and leaves motion and group ownership alone',()=>{const values=new Map(),root={dataset:{},style:{setProperty:(key,value)=>values.set(key,value)}};for(const theme of THEMES){applyAppearance(root,{...DEFAULTS,theme:theme.id,colorMode:'dark',font:'outfit'});assert.equal(root.dataset.theme,theme.id);assert.equal(root.dataset.colorMode,'dark');assert.equal(values.get('--bg'),theme.dark.bg);assert.equal(values.get('--last-opened'),'#b1c5e7');assert.equal(values.get('--group-tint'),'24%');assert.equal(values.get('--ui-font'),FONTS[1].family);assert.ok(!values.has('--group-color'));}applyAppearance(root,DEFAULTS,false);assert.equal(root.style.colorScheme,'light');assert.equal(root.dataset.finish,'soft');assert.equal(root.dataset.font,'geist');assert.equal(values.get('--group-tint'),'36%');});
test('all bundled font choices have local WOFF2 files and licenses',()=>{for(const name of ['Geist','Outfit','PlusJakartaSans','Newsreader','GeistMono'])assert.equal(readFileSync(new URL(`../assets/fonts/${name}-Variable.woff2`,import.meta.url)).subarray(0,4).toString(),'wOF2');for(const file of ['OFL.txt','Outfit-OFL.txt','PlusJakartaSans-OFL.txt','Newsreader-OFL.txt'])assert.match(readFileSync(new URL(`../assets/fonts/${file}`,import.meta.url),'utf8'),/SIL OPEN FONT LICENSE/i);});

test('material styles migrate safely and combine with every tint without changing its palette',()=>{
    assert.equal(migratePreferences({[PREFS_KEY]:{theme:'liquid-glass',font:'outfit'}}).visualStyle,'classic');
    const root={dataset:{},style:{setProperty(){}}};
    for(const style of STYLES)for(const theme of THEMES)for(const colorMode of ['light','dark']){
        const prefs={...DEFAULTS,visualStyle:style.id,theme:theme.id,colorMode};
        const restored=importSettings(exportSettings(prefs));
        assert.equal(restored.visualStyle,style.id);assert.equal(restored.theme,theme.id);
        const resolved=resolveAppearance(restored);assert.equal(resolved.style.id,style.id);assert.deepEqual(resolved.palette,theme[colorMode]);
        applyAppearance(root,restored);assert.equal(root.dataset.visualStyle,style.id);assert.equal(root.dataset.finish,style.id==='classic'?theme.finish:'material');
    }
    for(const visualStyle of ['remote',null,3])assert.throws(()=>validatePreferences({visualStyle}));
    applyAppearance(root,DEFAULTS);assert.equal(root.dataset.finish,'soft');assert.equal(root.dataset.visualStyle,'classic');
});
