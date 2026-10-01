import { groupLabel } from './group-presentation.mjs';
import { mountSiteList } from './site-list-editor.mjs';
import { mountAppearance } from './appearance-panel.mjs';
import { DEFAULTS, SHORTCUTS, keyBinding, exportSettings } from './preferences.mjs';
const node=(tag,text='')=>{const e=document.createElement(tag);e.textContent=text;return e;};
const categories=[['general','General'],['appearance','Appearance'],['search','Search & Filters'],['tabs','Tabs & Groups'],['previews','Previews & Storage'],['keyboard','Keyboard'],['backup','Backup']];
const definitions={
 general:[
 ['rememberOptions','Remember search options'],['rememberScope','Remember current/all-window scope'],['rememberRootScroll','Remember main-grid scroll position'],['rememberGroupScroll','Remember group scroll positions'],
 ['rememberRootQuery','Keep main search query'],['rememberGroupQuery','Keep group search queries'],['autofocus','Focus search when opening or returning to TabGrid'],['selectQuery','Select existing text when focusing search']],
 appearance:[['motion','Movement animations',[['system','Follow system'],['off','Disable animations']]],['showAddress','Show website address on cards'],['showLastUsed','Show last-used time on cards'],['showWindow','Show window on cards'],['showGroup','Show group on main search results']],
 search:[
 ['matchTargets','Match',[['both','Match tab titles & URLs'],['title','Match tab titles'],['url','Match URLs']]],['matchMode','Matching',[['phrase','Exact phrase'],['words','All words']]],['nested','Search inside groups'],['searchGroups','Search groups'],
 ['filterWebsite','Show website filter'],['filterGroup','Show group filter'],['filterPinned','Show pinned filter'],['filterAudible','Show playing audio filter'],['filterMuted','Show muted filter'],
 ['historyEnabled','Record search history'],['historyCount','History entries displayed',[[5,'5'],[10,'10'],[20,'20']]],['historyDays','History expiry',[0,3650]]],
 tabs:[
 ['switchNewTab','Switch to newly created tabs'],['blankClear','Click blank space to clear selection'],['blankExit','Double-click blank space to exit selection mode'],
 ['closePolicy','Confirm before closing',[['always','Always'],['multiple','Multiple tabs'],['above','Above a chosen count']]],['closeThreshold','Confirm when count exceeds',[1,100000]],['undoMs','Undo timeout (milliseconds)',[1,300000]],
 ['inactiveDays','Move to Idle after',[0,3650]],['idleSites','Websites excluded from Idle','sites'],['dropGroups','Show group drop targets']],
 previews:[['capture','Capture screenshots'],['previewSites','Websites excluded from previews','sites'],['previewLimit','Preview storage limit (MiB)',[1,1024]]]
};
export function mountSettings({dialog,privateMode,getPrefs,save,rpc,getGroups,getProtected,setProtected,isNestedForced=()=>false,onApplied,motion}) {
    const body=node('div');body.className='settings-layout';const rail=node('div');rail.className='settings-tabs';rail.setAttribute('role','tablist');rail.setAttribute('aria-label','Settings categories');rail.setAttribute('aria-orientation','vertical');
    const panels=node('div');panels.className='settings-panels';body.append(rail,panels);dialog.append(body);
    const controls=new Map(),presetsByKey=new Map(),siteEditors=new Map(),fieldRows=new Map(),customKeys=new Set(),sections=new Map(),error=node('p');error.id='settings-error';error.setAttribute('role','alert');dialog.append(error);
    const act=async work=>{error.textContent='';try{return await work();}catch(e){error.textContent=e.message;return null;}};
    const button=(text,handler)=>{const b=node('button',text);b.type='button';b.onclick=handler;return b;};
    let active='general';
    function show(id,focus=false){const change=()=>{active=id;for(const b of rail.children){b.setAttribute('aria-selected',String(b.dataset.section===id));b.tabIndex=b.dataset.section===id?0:-1;}for(const [key,p]of sections)p.hidden=key!==id;};if(motion&&dialog.open)motion.layout([panels],change);else change();if(focus)rail.querySelector(`[data-section=${id}]`).focus();if(id==='previews')usage();if(id==='search')history();if(id==='keyboard')bindings();}
    for(const [id,label]of categories){const b=button(label,()=>show(id));b.dataset.section=id;b.id=`settings-tab-${id}`;b.setAttribute('role','tab');b.setAttribute('aria-controls',`settings-panel-${id}`);rail.append(b);const p=node('section');p.id=`settings-panel-${id}`;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.append(node('h3',label));sections.set(id,p);panels.append(p);}
    rail.onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const i=categories.findIndex(([id])=>id===active);show(categories[e.key==='Home'?0:e.key==='End'?categories.length-1:(i+(e.key==='ArrowDown'?1:-1)+categories.length)%categories.length][0],true);};
    const groupDefinitions={
        general:[['Remember your place',['rememberOptions','rememberScope','rememberRootScroll','rememberGroupScroll','rememberRootQuery','rememberGroupQuery']],['Search focus',['autofocus','selectQuery']]],
        appearance:[['Motion and card details',['motion','showAddress','showLastUsed','showWindow','showGroup']]],
        search:[['Matching',['matchTargets','matchMode','nested','searchGroups']],['Visible filters',['filterWebsite','filterGroup','filterPinned','filterAudible','filterMuted']],['Search history',['historyEnabled','historyCount','historyDays']]],
        tabs:[['Opening and selection',['switchNewTab','blankClear','blankExit']],['Closing and undo',['closePolicy','closeThreshold','undoMs']],['Idle tabs',['inactiveDays','idleSites']],['Group destinations',['dropGroups']]],
        previews:[['Capture',['capture','previewSites']],['Storage',['previewLimit']]]
    };
    const fieldGroups=new Map();
    for(const [section,groups]of Object.entries(groupDefinitions))for(const [title,keys]of groups){
        const fieldset=node('fieldset');fieldset.className='settings-group';fieldset.append(node('legend',title));sections.get(section).append(fieldset);for(const key of keys)fieldGroups.set(key,fieldset);
    }
    for(const [section,fields]of Object.entries(definitions))for(const [key,label,kind]of fields){
        const restricted=privateMode&&(['historyEnabled','historyCount','historyDays','idleSites','inactiveDays','capture','previewSites','previewLimit'].includes(key));
        if(kind==='sites'){const editor=mountSiteList(fieldGroups.get(key),{key,label,getPrefs,save,act,disabled:restricted});siteEditors.set(key,editor);fieldRows.set(key,editor.box);continue;}
        const wrap=node('label'),input=node(kind==='sites'?'textarea':Array.isArray(kind)&&Array.isArray(kind[0])?'select':'input');input.id=`pref-${key}`;input.setAttribute('aria-describedby','settings-error');
        if(!kind){input.type='checkbox';input.setAttribute('role','switch');wrap.className='checkbox-label';}
        else if(kind==='sites'){input.rows=4;input.placeholder='example.com';}
        else if(input.tagName==='SELECT')for(const [value,text]of kind){const opt=node('option',text);opt.value=value;input.append(opt);}
        else{input.type='number';input.min=kind[0];input.max=kind[1];input.step='1';input.required=true;}
        wrap.append(node('span',label),input);fieldGroups.get(key).append(wrap);controls.set(key,input);fieldRows.set(key,wrap);input.disabled=restricted;
        input.onchange=()=>act(async()=>{
            if(!input.checkValidity()){input.setAttribute('aria-invalid','true');throw Error(`Enter a whole number between ${input.min} and ${input.max}.`);}
            const value=!kind?input.checked:kind==='sites'?input.value.split(/\n/).map(v=>v.trim()).filter(Boolean):typeof DEFAULTS[key]==='number'?Number(input.value):input.value;
            try{await save(key==='matchTargets'?{matchTitle:value!=='url',matchUrl:value!=='title'}:{[key]:value});input.removeAttribute('aria-invalid');sync();if(key==='historyEnabled')await history();}catch(e){input.setAttribute('aria-invalid','true');throw e;}
        });
        if(['historyDays','inactiveDays'].includes(key)){
            const presets=node('select');presets.setAttribute('aria-label',key==='historyDays'?'History expiry preset':'Idle duration preset');
            for(const value of key==='historyDays'?[0,7,30,90,'custom']:[0,7,14,30,'custom']){const o=node('option',value==='custom'?'Custom':value===0?'Never':`${value} days`);o.value=value;presets.append(o);}
            presetsByKey.set(key,presets);presets.disabled=restricted;presets.onchange=()=>act(async()=>{if(presets.value==='custom'){customKeys.add(key);const unfold=()=>{input.hidden=false;};if(motion)motion.layout([fieldGroups.get(key)],unfold);else unfold();if(Number(input.value)===0)input.value='7';input.focus();return;}customKeys.delete(key);await save({[key]:Number(presets.value)});input.removeAttribute('aria-invalid');sync();});input.min=1;input.setAttribute('aria-label',key==='historyDays'?'Custom history expiry (days)':'Custom Idle duration (days)');wrap.insertBefore(presets,input);
        }
    }
    const appearance=mountAppearance(sections.get('appearance'),{getPrefs,save,act});
    sections.get('general').append(node('p','Queries and scroll positions last for the current Chrome session. Preferences remain saved after Chrome restarts.'));
    const groupProtection=node('fieldset');groupProtection.className='settings-group group-protection';groupProtection.append(node('legend','Protect open groups from Idle (current Chrome session)'));const groupList=node('div');groupProtection.append(groupList);fieldGroups.get('idleSites').append(groupProtection);
    function syncGroups(){groupList.replaceChildren();for(const g of getGroups()){const label=node('label'),input=node('input');label.className='checkbox-label';input.type='checkbox';input.setAttribute('role','switch');input.setAttribute('aria-label',`Protect ${g.title||'Untitled group'} from Idle`);input.checked=getProtected().includes(g.id);input.disabled=privateMode;label.append(groupLabel(g),input);input.onchange=()=>act(async()=>{const ids=new Set(getProtected());if(input.checked)ids.add(g.id);else ids.delete(g.id);await setProtected([...ids]);});groupList.append(label);}}
    const historyList=node('div'),historyClear=button('Clear all search history',()=>act(async()=>{await rpc('searchHistory','clear');await history();}));historyClear.disabled=privateMode;sections.get('search').append(historyClear,historyList);
    sections.get('search').append(node('p','History is recorded only when you submit a search or use a result. Turning it off retains entries, hidden until enabled or cleared.'));
    async function history(){historyList.replaceChildren();if(privateMode||!getPrefs().historyEnabled)return;const entries=await act(()=>rpc('searchHistory'));if(!entries)return;for(const entry of entries){const row=node('div');row.className='settings-history-row';row.append(node('span',entry.query),button('Remove',()=>act(async()=>{await rpc('searchHistory','remove',entry.query);history();})));row.lastChild.setAttribute('aria-label',`Remove search ${entry.query}`);historyList.append(row);}}
    const usageText=node('p'),clearPreviews=button('Clear stored previews',()=>act(async()=>{await rpc('preview','clearAll');await usage();}));clearPreviews.disabled=privateMode;sections.get('previews').append(usageText,clearPreviews,node('p','Disabling capture keeps existing previews. Website exclusions include subdomains and remove matching previews. Oldest previews are removed first when the limit is reached.'));
    async function usage(){if(privateMode){usageText.textContent='Preview management is unavailable in Incognito.';return;}const value=await act(()=>rpc('preview','usage'));if(value)usageText.textContent=`${(value.bytes/1048576).toFixed(2)} MiB used by ${value.count} previews · limit ${value.limit/1048576} MiB`;}
    const keyboard=sections.get('keyboard'),openBinding=node('p');keyboard.append(openBinding,button('Change Open TabGrid shortcut in Chrome',()=>act(()=>chrome.tabs.create({url:'chrome://extensions/shortcuts'}))));
    const mac=/Mac|iPhone|iPad/.test(navigator.platform),rows=new Map();let recording=null;
    const display=value=>value.replace(/Mod/g,mac?'⌘':'Ctrl');
    async function bindings(){const commands=await chrome.commands?.getAll().catch(()=>[])||[];openBinding.textContent=`Open TabGrid: ${commands.find(c=>c.name==='_execute_action')?.shortcut||'Unassigned (configured in Chrome)'}`;for(const [key,control]of rows)if(recording!==key)control.textContent=display(getPrefs().shortcuts[key])||'Record shortcut';}
    for(const [key,label]of Object.entries(SHORTCUTS)){
        const row=node('div');row.className='shortcut-row';const record=button('Record shortcut',()=>{recording=key;record.textContent='Press keys… (Escape cancels)';record.focus();});record.setAttribute('aria-label',`Record shortcut: ${label}`);rows.set(key,record);
        record.onblur=()=>{if(recording===key){recording=null;bindings();}};
        record.onkeydown=e=>{if(recording!==key)return;e.preventDefault();e.stopPropagation();if(e.key==='Escape'){recording=null;bindings();return;}const binding=keyBinding(e,mac);if(!binding)return;act(async()=>{await save({shortcuts:{...getPrefs().shortcuts,[key]:binding}});recording=null;await bindings();});};
        const clear=button('Clear',()=>act(async()=>{await save({shortcuts:{...getPrefs().shortcuts,[key]:''}});bindings();}));clear.setAttribute('aria-label',`Clear shortcut: ${label}`);
        row.append(node('span',label),record,clear);keyboard.append(row);
    }
    const resetShortcuts=button('Reset page shortcuts',()=>act(async()=>{await save({shortcuts:DEFAULTS.shortcuts});bindings();}));resetShortcuts.className='reset-shortcuts';keyboard.append(resetShortcuts);
    const hintLabel=node('label','Show shortcut hints beside actions'),hints=node('input');hints.type='checkbox';hints.setAttribute('role','switch');hintLabel.className='checkbox-label';hintLabel.append(hints);hints.onchange=()=>act(()=>save({shortcutHints:hints.checked}));controls.set('shortcutHints',hints);const hintGroup=node('fieldset');hintGroup.className='settings-group';hintGroup.append(hintLabel);keyboard.children[0].after(hintGroup);keyboard.append(node('p','Reference: arrows navigate cards; Shift+arrows extend selection; Ctrl/Cmd+A selects all; Delete closes the selection; Escape dismisses menus. Text editing and Chrome’s restore shortcut stay unchanged.'));
    const backup=sections.get('backup'),file=node('input');file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','Import settings file');file.disabled=privateMode;file.hidden=true;const fileLabel=node('span','No file chosen');fileLabel.className='import-file-name';const chooseFile=button('Choose settings file',()=>file.click());chooseFile.disabled=privateMode;
    const summary=node('pre'),apply=button('Apply imported settings',()=>act(async()=>{if(!pending)return;const p=await rpc('importSettings',pending,true);pending=null;apply.disabled=true;file.value='';fileLabel.textContent='No file chosen';summary.textContent='Settings imported.';onApplied(p);sync();}));let pending=null;apply.disabled=true;
    file.onchange=()=>act(async()=>{pending=null;apply.disabled=true;summary.textContent='';const f=file.files[0];fileLabel.textContent=f?.name||'No file chosen';if(!f)return;if(f.size>1048576)throw Error('Choose a file smaller than 1 MiB.');const text=await f.text(),p=await rpc('importSettings',text,false);pending=text;
        const labels=new Map(Object.values(definitions).flat().map(([key,label])=>[key,label]));
        const describe=(key,value)=>key==='shortcuts'?Object.entries(value).filter(([,binding])=>binding).map(([action,binding])=>`${SHORTCUTS[action]}: ${display(binding)}`).join('; ')||'None':Array.isArray(value)?value.join(', ')||'None':typeof value==='boolean'?value?'On':'Off':String(value);
        const changes=Object.keys(p).filter(key=>key!=='version'&&JSON.stringify(p[key])!==JSON.stringify(getPrefs()[key]));
        summary.textContent=`Ready to replace settings: ${changes.length} changes\n\n${changes.map(key=>`${labels.get(key)||({colorMode:'Color mode',theme:'Theme',font:'Interface font',preferredColumns:'Cards per row',sortMode:'Sort order',shortcutHints:'Shortcut hints',shortcuts:'Page shortcuts'})[key]||key}: ${describe(key,getPrefs()[key])} → ${describe(key,p[key])}`).join('\n')}\n\nMissing preferences use defaults. Browser-wide shortcuts and browsing data are not included.`;apply.disabled=false;});
    const exp=button('Export settings',()=>{const url=URL.createObjectURL(new Blob([exportSettings(getPrefs())],{type:'application/json'})),a=node('a');a.href=url;a.download='tabgrid-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});exp.disabled=privateMode;
    backup.append(node('p','Back up preferences, website exclusions, and page shortcuts locally. Search history, screenshots, open tabs, and session state are excluded.'));const backupActions=node('div');backupActions.className='backup-actions';backupActions.append(exp,chooseFile,fileLabel,file);backup.append(backupActions,summary,apply);
    if(privateMode)for(const key of ['search','tabs','previews','backup'])sections.get(key).append(node('p','History, idle protection, previews, and backup are managed in regular windows.'));
    function sync(){const change=()=>{
        appearance.sync();const prefs=getPrefs();
        for(const [key,input]of controls){if(input===document.activeElement)continue;if(input.type==='checkbox')input.checked=prefs[key];else input.value=key==='matchTargets'?(prefs.matchTitle?(prefs.matchUrl?'both':'title'):'url'):prefs[key];}
        for(const [key,preset]of presetsByKey){if(!customKeys.has(key))preset.value=[...preset.options].some(o=>o.value===String(prefs[key]))?String(prefs[key]):'custom';controls.get(key).hidden=preset.value!=='custom';}
        controls.get('nested').disabled=isNestedForced();if(isNestedForced())controls.get('nested').checked=true;
        fieldRows.get('closeThreshold').hidden=prefs.closePolicy!=='above';
        for(const key of ['historyCount','historyDays'])fieldRows.get(key).hidden=!prefs.historyEnabled;
        historyClear.hidden=!prefs.historyEnabled;historyList.hidden=!prefs.historyEnabled;
        siteEditors.get('previewSites').box.hidden=!prefs.capture;siteEditors.get('idleSites').box.hidden=!prefs.inactiveDays;
        groupProtection.hidden=!prefs.inactiveDays;for(const editor of siteEditors.values())editor.sync();syncGroups();bindings();
        for(const key of ['closePolicy','inactiveDays','capture'])fieldRows.get(key).classList.add('connected-setting');fieldRows.get('closeThreshold').classList.add('dependent-setting');
    };if(motion&&dialog.open)motion.layout([...new Set(fieldGroups.values())],change);else change();}
    show(active);return {open(){error.textContent='';sync();show(active);dialog.showModal();rail.querySelector('[aria-selected=true]').focus();},sync};
}
