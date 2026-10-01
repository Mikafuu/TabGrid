import { groupLabel } from './group-presentation.mjs';
export { groupColors } from './group-presentation.mjs';
export function matchingFilterOptions(entries,query){const q=query.trim().toLocaleLowerCase();return q?entries.filter(e=>e.label.toLocaleLowerCase().includes(q)):entries;}
export function mountFilterPicker(select,{id,label,kind,api,getGroups,motion}){
    const wrap=document.createElement('div');wrap.className='filter-picker';
    const input=document.createElement('input');input.type='text';input.id=id;input.placeholder='Any';input.setAttribute('role','combobox');input.setAttribute('aria-label',label);input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.autocomplete='off';
    const toggle=document.createElement('button');toggle.type='button';toggle.className='filter-expand';toggle.setAttribute('aria-hidden','false');toggle.setAttribute('aria-label',`Show all ${kind==='groups'?'groups':'websites'}`);toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-haspopup','listbox');
    const list=document.createElement('div');list.className='filter-picker-list';list.id=`${id}-list`;list.popover='auto';list.setAttribute('role','listbox');list.setAttribute('aria-label',label+' choices');input.setAttribute('aria-controls',list.id);toggle.setAttribute('aria-controls',list.id);
    select.hidden=true;select.removeAttribute('aria-label');wrap.append(input,toggle,list);select.after(wrap);
    motion?.native(list);
    let entries=[],matches=[],index=-1,lastValue='',selectedValue='',editing=false;
    const isOpen=()=>list.matches(':popover-open');
    function close(){if(isOpen())list.hidePopover();input.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');editing=false;input.value=lastValue;}
    list.addEventListener('toggle',()=>{const open=isOpen();input.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-expanded',String(open));if(!open){editing=false;input.value=lastValue;input.removeAttribute('aria-activedescendant');}});
    function choose(value){for(const o of select.options)o.selected=String(o.value)===String(value);close();select.dispatchEvent(new Event('change',{bubbles:true}));input.focus({preventScroll:true});}
    function draw(){
        matches=matchingFilterOptions(entries,input.value);index=-1;input.removeAttribute('aria-activedescendant');list.replaceChildren();
        const choices=input.value.trim()?matches:[{value:'',label:'Any'},...matches];matches=choices;
        for(const [i,entry]of choices.entries()){
            const row=document.createElement('div');row.id=`${id}-option-${i}`;row.setAttribute('role','option');row.setAttribute('aria-selected',String(String(entry.value)===selectedValue));row.className='filter-picker-option';
            if(entry.value!==''){
                if(kind==='groups'){row.append(groupLabel(getGroups().find(g=>String(g.id)===String(entry.value))||{title:entry.label}));}
                else{const icon=document.createElement('img');icon.alt='';icon.width=16;icon.height=16;const url=new URL(api.runtime.getURL('/_favicon/'));url.searchParams.set('pageUrl',`https://${entry.value}`);url.searchParams.set('size','16');icon.src=url.href;icon.onerror=()=>{icon.onerror=null;icon.src=api.runtime.getURL('tileIcon.png');};row.append(icon);}
            }
            if(kind!=='groups'||entry.value===''){const text=document.createElement('span');text.textContent=entry.label;row.append(text);}row.onpointerdown=e=>e.preventDefault();row.onclick=()=>choose(entry.value);list.append(row);
        }
        if(!choices.length){const empty=document.createElement('p');empty.textContent='No matching websites or groups';empty.setAttribute('role','status');list.append(empty);}
    }
    function open(all=false){editing=true;if(all)input.value='';draw();if(!isOpen())list.showPopover();const r=wrap.getBoundingClientRect();list.style.width=`${r.width}px`;list.style.left=`${Math.max(8,Math.min(r.left,innerWidth-r.width-8))}px`;const below=innerHeight-r.bottom-12,above=r.top-12,up=below<160&&above>below;list.style.maxHeight=`${Math.max(40,Math.min(220,up?above:below))}px`;list.style.top=up?'auto':`${r.bottom+4}px`;list.style.bottom=up?`${innerHeight-r.top+4}px`:'auto';input.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');}
    input.oninput=()=>{open();};
    input.onkeydown=e=>{if(['ArrowDown','ArrowUp','Enter','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Escape'){close();return;}if(e.key==='Enter'){if(isOpen()&&matches[index<0?0:index])choose(matches[index<0?0:index].value);return;}if(!isOpen())open(true);if(!matches.length)return;index=index<0?(e.key==='ArrowDown'?0:matches.length-1):(index+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;[...list.querySelectorAll('[role=option]')].forEach((row,i)=>row.setAttribute('aria-selected',String(i===index)));const active=list.querySelectorAll('[role=option]')[index];input.setAttribute('aria-activedescendant',active.id);active.scrollIntoView({block:'nearest'});}};
    let wasOpen=false;toggle.onpointerdown=()=>{wasOpen=isOpen();};toggle.onclick=e=>{if(isOpen()||(e.detail>0&&wasOpen)){close();wasOpen=false;}else{input.focus({preventScroll:true});open(true);}};
    wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close();});
    window.addEventListener('resize',close);document.addEventListener('scroll',e=>{if(!list.contains(e.target))close();},true);
    return {sync(){entries=[...select.options].map(o=>({value:o.value,label:o.textContent}));lastValue=select.selectedOptions[0]?.textContent||'';selectedValue=select.selectedOptions[0]?.value||'';if(!editing)input.value=lastValue;if(select.closest('.filter-field').hidden)close();else if(isOpen())draw();},close};
}
