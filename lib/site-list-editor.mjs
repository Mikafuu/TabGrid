import { normalizeHost } from './preferences.mjs';
export function mountSiteList(host,{key,label,getPrefs,save,act,disabled=false}) {
    const box=document.createElement('div');box.className='site-list-setting';
    const title=document.createElement('span');title.id=`label-${key}`;title.textContent=label;box.append(title);
    const row=document.createElement('div');row.className='site-add-row';
    const input=document.createElement('input');input.type='text';input.placeholder='example.com';input.setAttribute('aria-label',`Website to exclude from ${key==='idleSites'?'Idle':'previews'}`);input.disabled=disabled;
    const add=document.createElement('button');add.type='button';add.textContent='+';add.setAttribute('aria-label',`Add website excluded from ${key==='idleSites'?'Idle':'previews'}`);add.disabled=disabled;
    const list=document.createElement('ul');list.className='site-list';list.setAttribute('aria-labelledby',title.id);row.append(input,add);box.append(row,list);host.append(box);
    const submit=()=>act(async()=>{const value=normalizeHost(input.value);await save({[key]:[...new Set([...getPrefs()[key],value])]});input.value='';input.removeAttribute('aria-invalid');sync();input.focus();});
    add.onclick=()=>{input.setAttribute('aria-invalid','false');submit().then(result=>{if(result===null)input.setAttribute('aria-invalid','true');});};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add.click();}};
    function sync(){list.replaceChildren();for(const value of getPrefs()[key]){const item=document.createElement('li'),text=document.createElement('span'),remove=document.createElement('button');text.textContent=value;remove.type='button';remove.textContent='−';remove.setAttribute('aria-label',`Remove exclusion ${value}`);remove.disabled=disabled;remove.onclick=()=>act(async()=>{await save({[key]:getPrefs()[key].filter(h=>h!==value)});sync();});item.append(text,remove);list.append(item);}}
    sync();return {box,sync};
}
