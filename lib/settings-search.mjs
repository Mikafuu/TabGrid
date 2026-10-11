export function matchSettings(entries, query) {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? entries.filter(entry => words.every(word => `${entry.label} ${entry.category}`.toLocaleLowerCase().includes(word))).slice(0,40) : [];
}
export function mountSettingsSearch(sidebar, { entries, choose }) {
    const label=document.createElement('label');label.className='settings-search';label.textContent='Search settings';
    const input=document.createElement('input');input.type='search';input.placeholder='Find a setting';input.autocomplete='off';label.append(input);
    const results=document.createElement('div');results.className='settings-search-results';results.hidden=true;results.setAttribute('aria-label','Matching settings');
    const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');label.append(status);sidebar.prepend(label,results);
    function clear(){input.value='';results.hidden=true;results.replaceChildren();status.textContent='';}
    function draw(){const found=matchSettings(entries(),input.value);results.replaceChildren();results.hidden=!input.value.trim();status.textContent=results.hidden?'':`${found.length} matching settings`;
        for(const entry of found){const b=document.createElement('button');b.type='button';const name=document.createElement('span'),category=document.createElement('small');name.textContent=entry.label;category.textContent=entry.category;b.append(name,category);b.onclick=()=>choose(entry);results.append(b);}
        if(!results.hidden&&!found.length){const p=document.createElement('p');p.textContent='No matching settings';results.append(p);}
    }
    input.addEventListener('input',draw);
    input.addEventListener('keydown',e=>{if(['ArrowDown','Enter'].includes(e.key)&&results.querySelector('button')){e.preventDefault();if(e.key==='Enter')results.querySelector('button').click();else results.querySelector('button').focus();}if(e.key==='Escape'&&input.value){e.preventDefault();e.stopPropagation();clear();}});
    results.addEventListener('keydown',e=>{const buttons=[...results.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();clear();input.focus();}});
    return {clear};
}
