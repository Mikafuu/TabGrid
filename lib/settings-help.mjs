// One top-layer tooltip for each description keeps help out of the form layout
// while retaining its existing IDs for accessible control descriptions.
export function mountSettingsHelp(dialog) {
    let active=null, closeTimer, nextId=0;
    function hide(){clearTimeout(closeTimer);if(!active)return;active.tip.hidePopover();active=null;}
    function show(entry){
        clearTimeout(closeTimer);if(active===entry)return;hide();active=entry;
        entry.tip.showPopover();
        const r=entry.button.getBoundingClientRect(),box=entry.tip.getBoundingClientRect();
        const right=r.right+8,left=r.left-box.width-8;
        const beside=right+box.width<=innerWidth-8||left>=8;
        entry.tip.style.left=`${Math.max(8,Math.min(right+box.width<=innerWidth-8?right:left>=8?left:r.left,innerWidth-box.width-8))}px`;
        entry.tip.style.top=`${Math.max(8,Math.min(beside?(r.top+r.bottom-box.height)/2:r.bottom+8,innerHeight-box.height-8))}px`;
    }
    function leave(entry){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(active===entry&&!entry.button.matches(':hover,:focus-visible')&&!entry.tip.matches(':hover'))hide();},100);}
    dialog.addEventListener('pointerdown',e=>{if(active&&!active.button.contains(e.target)&&!active.tip.contains(e.target))hide();},true);
    dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();e.stopPropagation();hide();}},true);
    dialog.addEventListener('close',hide);
    dialog.addEventListener('change',hide);
    dialog.addEventListener('scroll',e=>{if(active&&!active.tip.contains(e.target))hide();},true);
    window.addEventListener('resize',hide);
    return function addHelp(anchor,content,label=anchor.textContent.trim()){
        const tip=typeof content==='string'?document.createElement('div'):content;
        if(typeof content==='string')tip.textContent=content;
        tip.id ||= `settings-help-${++nextId}`;tip.className='settings-help-tip';tip.setAttribute('role','tooltip');tip.setAttribute('popover','manual');
        const button=document.createElement('button');button.type='button';button.className='settings-help-button';button.setAttribute('aria-label',`About ${label}`);button.setAttribute('aria-describedby',tip.id);
        const icon=document.createElement('span');icon.textContent='i';icon.setAttribute('aria-hidden','true');button.append(icon);
        // Existing setting rows use wrapping labels; keep their input association
        // explicit so the added button cannot become the label's control.
        const caption=document.createElement('span');caption.id=`${tip.id}-caption`;caption.append(...anchor.childNodes);anchor.append(caption);
        const row=anchor.closest('label');if(row){const input=row.querySelector('input,select,textarea');if(input?.id)row.htmlFor=input.id;if(input&&!input.hasAttribute('aria-label'))input.setAttribute('aria-labelledby',caption.id);}
        if(anchor.tagName==='LEGEND')anchor.parentElement.setAttribute('aria-labelledby',caption.id);
        if(/^H[1-6]$/.test(anchor.tagName))anchor.setAttribute('aria-label',label);
        anchor.classList.add('settings-help-anchor');anchor.append(button);dialog.append(tip);
        const entry={button,tip};button.addEventListener('pointerenter',()=>show(entry));button.addEventListener('pointerleave',()=>leave(entry));
        button.addEventListener('focus',()=>show(entry));button.addEventListener('blur',()=>leave(entry));
        button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show(entry);});
        tip.addEventListener('pointerenter',()=>clearTimeout(closeTimer));tip.addEventListener('pointerleave',()=>leave(entry));
        return button;
    };
}
