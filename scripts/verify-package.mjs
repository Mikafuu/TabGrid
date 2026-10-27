// Check the extracted artifact, not dependencies in the development checkout.
import {readFile, readdir, stat} from 'node:fs/promises';
import {resolve, relative, dirname, extname, sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2] || 'dist/TabGrid');
const paths=[];
async function walk(directory){
    for(const item of await readdir(directory,{withFileTypes:true})){
        const path=resolve(directory,item.name);
        if(item.isDirectory())await walk(path);else paths.push(path);
    }
}
await walk(root);
const portable=new Set();
for(const path of paths){
    const name=relative(root,path).split(sep).join('/');
    assert(!/[<>:"\\|?*]/.test(name),`Nonportable archive path: ${name}`);
    assert(!portable.has(name.toLowerCase()),`Case-insensitive collision: ${name}`);
    portable.add(name.toLowerCase());
    if(extname(path)==='.json')JSON.parse(await readFile(path,'utf8'));
    if(!['.js','.mjs','.html','.css'].includes(extname(path)))continue;
    const source=await readFile(path,'utf8');
    const pattern=extname(path)==='.html'?/\b(?:src|href)="([^"]+)"/g:extname(path)==='.css'?/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g:/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;
    for(const [,ref] of source.matchAll(pattern)){
        if(/^(?:[a-z]+:|#)/i.test(ref))continue;
        const dependency=resolve(dirname(path),decodeURI(ref.split(/[?#]/)[0]));
        assert(dependency.startsWith(root+sep),`Dependency outside package: ${name}: ${ref}`);
        assert((await stat(dependency)).isFile(),`Missing dependency: ${name}: ${ref}`);
    }
}
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
for(const entry of [manifest.background.service_worker,'grid.html','preview-activity.js',...Object.values(manifest.icons),'_locales/en/messages.json','_locales/zh_CN/messages.json','_locales/ja/messages.json','CREDITS.md','LICENSE'])assert((await stat(resolve(root,entry))).isFile(),`Missing entry: ${entry}`);
console.log(`Verified ${paths.length} packaged files: imports, assets, locales, and portable paths (${process.platform}).`);
