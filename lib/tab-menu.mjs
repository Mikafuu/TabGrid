import { tr } from './i18n.mjs';
export function windowLabel(tabs) {
    const ordered = [...tabs].sort((a, b) => a.index - b.index);
    const title = ordered[0]?.title || ordered[0]?.url || tr("Empty Window");
    const others = ordered.length - 1;
    return others > 0 ? tr("{0} and {1} Other {2}", [title, others, others === 1 ? tr('Tabs') : tr("Tabs")]) : title;
}

export function relativeTabIds(tabs, ids, mode) {
    const selected = new Set(ids);
    const ends = new Map();
    for (const tab of tabs) if (selected.has(tab.id)) ends.set(tab.windowId, Math.max(ends.get(tab.windowId) ?? -1, tab.index));
    return tabs.filter(tab => ends.has(tab.windowId) && !selected.has(tab.id) && !tab.pinned &&
        (mode === 'others' || tab.index > ends.get(tab.windowId))).map(tab => tab.id);
}

export function siteOrigins(tabs) {
    return [...new Set(tabs.flatMap(tab => {
        try { const url = new URL(tab.url || tab.pendingUrl); return /^https?:$/.test(url.protocol) ? [url.origin] : []; }
        catch { return []; }
    }))];
}

// Leave the opener exposed: tall menus scroll on the side with more space.
export function anchoredMenuLayout(rect, width, height, viewportWidth, viewportHeight, align = 'left') {
    const below = viewportHeight - rect.bottom - 12, above = rect.top - 12;
    const downward = height <= below || below >= above;
    height = Math.min(height, Math.max(0, downward ? below : above));
    return {
        height,
        left: Math.max(8, Math.min(align === 'right' ? rect.right - width : rect.left, viewportWidth - width - 8)),
        top: downward ? rect.bottom + 4 : rect.top - height - 4
    };
}

// Hover owns visibility; pointer and mouse compatibility events are deduplicated.
export function inSubmenuCorridor(point, origin, rect) {
    const edge=rect.left>=origin.x?rect.left:rect.right, direction=Math.sign(edge-origin.x);
    if(!direction||direction*(point.x-origin.x)<-2||direction*(point.x-edge)>2)return false;
    const progress=Math.max(0,Math.min(1,(point.x-origin.x)/(edge-origin.x)));
    return point.y>=origin.y+(rect.top-8-origin.y)*progress-5 && point.y<=origin.y+(rect.bottom+8-origin.y)*progress+5;
}
export function bindSubmenuHover(trigger, {
    active, open, close, contains = node => trigger.contains(node), delay = 150,
    submenu = () => null, blocked = () => false, doc = trigger.ownerDocument,
    schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id)
}) {
    let inside=false, pending=null, grace=null, graceTimer=null, previous=null;
    const stopGrace=()=>{grace=null;if(graceTimer!==null)cancel(graceTimer);graceTimer=null;doc?.removeEventListener('pointermove',track,true);};
    const reset=()=>{inside=false;previous=null;stopGrace();if(pending!==null)cancel(pending);pending=null;};
    function track(event){
        if(contains(event.target)){stopGrace();return;}
        if(!grace)return;
        const point={x:event.clientX,y:event.clientY};
        if(!active()||!inSubmenuCorridor(point,grace.origin,grace.rect)){reset();close();}
    }
    const enter=event=>{
        if(contains(event.relatedTarget)){stopGrace();return;}
        if(inside||trigger.disabled)return;
        inside=true;
        const show=()=>{
            pending=null;
            if(inside&&active()&&blocked()){pending=schedule(show,delay);return;}
            if(inside&&!trigger.disabled&&active())open();
        };
        if(active())pending=schedule(show,delay);
    };
    const leave=event=>{
        if(contains(event.relatedTarget)){stopGrace();return;}
        if(!inside)return;
        if(grace)return;
        const popup=submenu(),rect=popup?.getBoundingClientRect(),x=event.clientX,y=event.clientY;
        if(rect&&Number.isFinite(x)&&Number.isFinite(y)&&!popup.contains(event.target)){
            const direction=rect.left>=x?1:-1;
            if(!previous||direction*((x-previous.x)||previous.dx)>0){
                grace={origin:{x,y},rect};doc?.addEventListener('pointermove',track,true);
                graceTimer=schedule(()=>{reset();close();},350);return;
            }
        }
        reset();close();
    };
    for(const type of ['pointerover','mouseover'])trigger.addEventListener(type,enter);
    for(const type of ['pointerout','mouseout'])trigger.addEventListener(type,leave);
    trigger.addEventListener('pointermove',event=>{previous={x:event.clientX,y:event.clientY,dx:event.clientX-(previous?.x??event.clientX)};});
    return {leave, reset, inGrace:()=>Boolean(grace)};
}
