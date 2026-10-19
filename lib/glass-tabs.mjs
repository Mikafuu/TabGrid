import {createLiquidMotion} from './liquid-motion.mjs';

export function nearestCategory(items,center) {
    return items.reduce((best,item)=>!best||Math.abs(item.left+item.width/2-center)<Math.abs(best.left+best.width/2-center)?item:best,null);
}

// Fractional button bounds avoid rounded offsetWidth drift at browser zoom.
export function pillBounds(nav,button) {
    const n=nav.getBoundingClientRect(),b=button.getBoundingClientRect();
    return {left:b.left-n.left-nav.clientLeft+nav.scrollLeft,top:b.top-n.top-nav.clientTop+nav.scrollTop,width:b.width,height:b.height};
}
export function dragPillBounds(items,center) {
    const target=nearestCategory(items,center);if(!target)return null;
    return {left:Math.max(items[0].left,Math.min(items.at(-1).left+items.at(-1).width-target.width,center-target.width/2)),width:target.width};
}

export function mountGlassTabs(nav,getPrefs) {
    const pill=document.createElement('span');pill.className='liquid-tab-indicator';pill.setAttribute('aria-hidden','true');nav.prepend(pill);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const allowed=()=>getPrefs().visualStyle==='glass'&&getPrefs().motion!=='off'&&!reduced.matches;
    const motion=createLiquidMotion({allowed,speed:()=>({efficient:.65,standard:1,smooth:1.6}[getPrefs().animationSpeed]||1)});
    let initialized=false,frame=0,last='',drag=null,suppressClick=false;
    function sync() {
        frame=0;
        if(drag)return;
        const selected=nav.querySelector('button[aria-current=page]:not([hidden])');
        if(!selected||getPrefs().visualStyle!=='glass'){motion.cancel(pill);if(!pill.hidden)pill.hidden=true;initialized=false;return;}
        if(pill.hidden)pill.hidden=false;
        const bounds=pillBounds(nav,selected);
        const next={'--liquid-tab-x':`${bounds.left}px`,'--liquid-tab-y':`${bounds.top}px`,'--liquid-tab-width':`${bounds.width}px`,'--liquid-tab-height':`${bounds.height}px`};
        const signature=Object.values(next).join(':');
        if(signature===last&&initialized&&allowed())return;
        const current=getComputedStyle(pill),from=Object.fromEntries(Object.keys(next).map(key=>[key,current.getPropertyValue(key).trim()||next[key]]));
        last=signature;
        if(initialized&&allowed())motion.play(pill,from,next,{springMotion:true,persist:true});
        else{motion.cancel(pill);for(const [key,value]of Object.entries(next))pill.style.setProperty(key,value);document.dispatchEvent(new Event('liquid-glass-frame'));}
        initialized=true;
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(sync);};
    const buttons=()=>[...nav.querySelectorAll('button:not([hidden])')];
    function down(event) {
        if(event.button!==0||getPrefs().visualStyle!=='glass')return;
        const selected=nav.querySelector('button[aria-current=page]');
        if(!selected)return;
        const hit=pill.getBoundingClientRect();if(event.clientX<hit.left||event.clientX>hit.right||event.clientY<hit.top||event.clientY>hit.bottom)return;
        const current=getComputedStyle(pill),x=parseFloat(current.getPropertyValue('--liquid-tab-x'))||selected.offsetLeft;
        const width=parseFloat(current.getPropertyValue('--liquid-tab-width'))||selected.offsetWidth;
        drag={id:event.pointerId,start:event.clientX,x,width,moved:false,selected};
        motion.cancel(pill);pill.style.setProperty('--liquid-tab-x',`${x}px`);pill.style.setProperty('--liquid-tab-width',`${width}px`);
        nav.setPointerCapture(event.pointerId);
    }
    function move(event) {
        if(!drag||event.pointerId!==drag.id)return;
        const dx=event.clientX-drag.start;if(!drag.moved&&Math.abs(dx)<4)return;
        drag.moved=true;nav.setAttribute('data-pill-dragging','');event.preventDefault();
        const items=buttons().map(button=>({button,...pillBounds(nav,button)}));
        const bounds=dragPillBounds(items,drag.x+drag.width/2+dx);
        pill.style.setProperty('--liquid-tab-x',`${bounds.left}px`);pill.style.setProperty('--liquid-tab-width',`${bounds.width}px`);document.dispatchEvent(new Event('liquid-glass-frame'));
    }
    function finish(event) {
        if(!drag||event.pointerId!==drag.id)return;
        const current=drag;drag=null;nav.removeAttribute('data-pill-dragging');
        if(nav.hasPointerCapture(event.pointerId))nav.releasePointerCapture(event.pointerId);
        if(current.moved&&event.type==='pointerup') {
            const x=parseFloat(pill.style.getPropertyValue('--liquid-tab-x'));
            const width=parseFloat(pill.style.getPropertyValue('--liquid-tab-width'));
            const target=nearestCategory(buttons().map(button=>({button,...pillBounds(nav,button)})),x+width/2)?.button;
            suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
            if(target){target.click();target.focus({preventScroll:true});}
        }
        last='';schedule();
    }
    const click=event=>{if(suppressClick&&event.isTrusted){event.preventDefault();event.stopImmediatePropagation();}};
    nav.addEventListener('pointerdown',down);nav.addEventListener('pointermove',move);
    for(const name of ['pointerup','pointercancel','lostpointercapture'])nav.addEventListener(name,finish);
    nav.addEventListener('click',click,true);
    const mutations=new MutationObserver(schedule);mutations.observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-current','hidden']});
    const prefs=new MutationObserver(schedule);prefs.observe(document.documentElement,{attributes:true,attributeFilter:['class','data-visual-style']});
    const resize=new ResizeObserver(schedule);resize.observe(nav);nav.querySelectorAll('button').forEach(button=>resize.observe(button));
    reduced.addEventListener('change',schedule);document.fonts?.ready.then(schedule);schedule();
    return {destroy(){nav.removeEventListener('pointerdown',down);nav.removeEventListener('pointermove',move);for(const name of ['pointerup','pointercancel','lostpointercapture'])nav.removeEventListener(name,finish);nav.removeEventListener('click',click,true);cancelAnimationFrame(frame);motion.destroy();mutations.disconnect();prefs.disconnect();resize.disconnect();reduced.removeEventListener('change',schedule);pill.remove();}};
}
