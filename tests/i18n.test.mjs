import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { catalogs, resolveLanguage, setLanguage, tr, translateError } from '../lib/i18n.mjs';
import { DEFAULTS, validatePreferences, exportSettings, importSettings } from '../lib/preferences.mjs';

test('language selection resolves browser variants and falls back to English',()=>{
    assert.equal(resolveLanguage('auto','zh-TW'),'zh-CN');
    assert.equal(resolveLanguage('auto','ja-JP'),'ja');
    assert.equal(resolveLanguage('auto','de-DE'),'en');
    assert.equal(resolveLanguage('en','ja-JP'),'en');
    assert.equal(resolveLanguage('unknown','ja-JP'),'en');
});
test('language preference survives backups and old settings default to browser language',()=>{
    assert.equal(validatePreferences({}).language,'auto');
    for(const language of ['auto','en','zh-CN','ja'])assert.equal(importSettings(exportSettings({...DEFAULTS,language})).language,language);
    assert.throws(()=>validatePreferences({language:'invalid'}));
});
test('translation catalogs have matching keys and preserve every interpolation',()=>{
    assert.deepEqual(Object.keys(catalogs.ja).sort(),Object.keys(catalogs['zh-CN']).sort());
    const slots=text=>[...text.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
    for(const [locale,catalog]of Object.entries(catalogs))for(const [key,value]of Object.entries(catalog)){
        assert.ok(value.trim(),`${locale}: ${key}`);assert.deepEqual(slots(value),slots(key),`${locale}: ${key}`);
    }
});
test('messages interpolate user strings literally without translating titles or HTML',()=>{
    try{
        setLanguage('ja');assert.equal(tr('Close {0}',['Tabs <script>']), 'Tabs <script>を閉じる');
        assert.equal(tr('New custom user title'),'New custom user title');
        assert.equal(tr('{0} more tabs',['{1}']), 'ほか {1} 個のタブ');
        assert.equal(translateError('Invalid choice for language.'),'language の選択肢が無効です。');
        assert.equal(translateError('Unknown native Chrome error'),'Unknown native Chrome error');
        setLanguage('zh-CN');assert.equal(tr('Language'),'语言');
    }finally{setLanguage('en');}
});
test('all explicit interface message keys and static HTML labels have translations',()=>{
    const files=['grid.js',...readdirSync(new URL('../lib/',import.meta.url)).filter(n=>n.endsWith('.mjs')&&n!=='i18n.mjs').map(n=>'lib/'+n)];
    for(const file of files){const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');for(const match of source.matchAll(/\btr\(\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g)){
        const key=match[1][0]==='"'?JSON.parse(match[1]):match[1].slice(1,-1).replace(/\\'/g,"'");
        assert.ok(key in catalogs.ja,`${file}: ${key}`);
    }}
    const html=readFileSync(new URL('../grid.html',import.meta.url),'utf8');
    for(const match of html.matchAll(/>([^<>]+)</g)){const text=match[1].trim();if(!/[a-z]/i.test(text)||text==='TabGrid')continue;assert.ok(text in catalogs.ja,`HTML: ${text}`);}
    for(const match of html.matchAll(/(?:aria-label|placeholder|aria-valuetext)="([^"]+)"/g))assert.ok(match[1] in catalogs.ja,`HTML attribute: ${match[1]}`);
});
