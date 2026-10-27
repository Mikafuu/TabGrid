import {releaseSurfaceFocus} from './surface-focus.mjs';
// Chrome Android's group dialog expands from its card and reverses on close.
// Keep this choreography in the existing auto-animate effect owner, including
// the staged crossfade (which needs more than liquid-dom's two endpoints).
export const GROUP_MORPH_MS = 260;
export function groupOrigin(card, panel) {
    if (!card?.width || !card.height || !panel?.width || !panel.height) return null;
    return `translate(${card.left + card.width / 2 - panel.left - panel.width / 2}px, ${card.top + card.height / 2 - panel.top - panel.height / 2}px) scale(${card.width / panel.width}, ${card.height / panel.height})`;
}

export function createGroupTransition({dialog, motion, source, allowed, speed=()=>1, dragging=()=>false,
    doc=document, win=window, style=getComputedStyle, later=setTimeout, clear=clearTimeout}) {
    let active=null, timer=0, revision=0, lastDriver=null, closing=false, skipClose=false;
    const anchors=[];
    function cleanup() {
        clear(timer);timer=0;revision++;
        if(!active)return;
        for(const target of [active.target||dialog,...active.children,active.preview,active.backdrop])if(target)motion.cancel(target);
        active.preview?.remove();
        delete (active.target||dialog).dataset.groupMorph;
        active.dispose?.();
        active=null;
    }
    function animate(opening,driver,finish=()=>{},target=dialog,detached=false) {
        // Sample before cancelling so a quick reversal continues where it is.
        const live=active?{transform:style(target).transform,borderRadius:style(target).borderRadius,opacity:style(target).opacity}:null;
        const contentOpacity=active?.children[0]?style(active.children[0]).opacity:null;
        cleanup();
        const duration=GROUP_MORPH_MS*speed();
        target.style.setProperty('--group-exit-duration',`${allowed()&&(!dragging()||detached)?duration+64:0}ms`);
        if(!allowed()||(dragging()&&!detached)){motion.cancel(target);finish();return true;}
        const token=revision;
        const complete=()=>{if(token!==revision)return;cleanup();finish();};
        const fade=()=>{
            active={target,detached,children:[]};
            motion.cancel(target);
            motion.play(driver,target,[{opacity:opening?0:1},{opacity:opening?1:0}],{anchor:driver,effectTiming:{duration:180*speed(),easing:'ease-out',fill:'both'},onFinish:complete});
            timer=later(complete,180*speed()+1000);
            return true;
        };
        const card=source(),rect=card?.getBoundingClientRect();
        // A deleted, filtered, or offscreen source cannot be a useful endpoint.
        if(!card?.isConnected||!rect?.width||!rect.height||rect.bottom<=0||rect.top>=win.innerHeight||rect.right<=0||rect.left>=win.innerWidth){
            return fade();
        }
        motion.cancel(target);
        const panel=target.getBoundingClientRect(),origin=groupOrigin(rect,panel);
        if(!origin){return fade();}
        const surface=card.querySelector('.card-surface'),children=[...target.children].filter(child=>child.matches('.group-header,.group-content'));
        const preview=surface?.cloneNode(true),baseRadius=style(target).borderRadius;
        const radius=parseFloat(surface?style(surface).borderRadius:baseRadius)||0;
        const small={transform:origin,borderRadius:`${radius*panel.width/rect.width}px / ${radius*panel.height/rect.height}px`,opacity:1};
        const full={transform:'translate(0px, 0px) scale(1, 1)',borderRadius:baseRadius,opacity:1};
        active={target,detached,children,preview};
        target.dataset.groupMorph=opening?'opening':'closing';
        const effectTiming={duration,easing:'cubic-bezier(.2,0,0,1)',fill:'both'};
        const play=(target,frames,index)=>{
            if(!anchors[index]){anchors[index]=doc.createElement('span');driver.append(anchors[index]);}
            motion.cancel(target);motion.play(driver,target,frames,{anchor:anchors[index],effectTiming:index===0?effectTiming:{...effectTiming,easing:'linear'},...(index===0?{onFinish:complete}:{})});
        };
        if(preview){
            // Visual-only snapshot; the original card slot stays in the grid.
            preview.removeAttribute('id');preview.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
            preview.inert=true;preview.setAttribute('aria-hidden','true');preview.classList.add('group-morph-preview');
            preview.style.cssText=`position:absolute;inset:0 auto auto 0;width:${rect.width}px;height:${rect.height}px;transform-origin:0 0;transform:scale(${panel.width/rect.width},${panel.height/rect.height});pointer-events:none;z-index:10;visibility:visible;`;
            target.append(preview);
            play(preview,opening?[{opacity:live?0:1},{opacity:0,offset:.5},{opacity:0}]:[{opacity:0},{opacity:0,offset:.5},{opacity:1}],1);
        }
        play(target,opening?[live||small,full]:[live||full,small],0);
        children.forEach((child,index)=>play(child,opening?
            [{opacity:contentOpacity??0},{opacity:contentOpacity??0,offset:.5},{opacity:1}]:
            [{opacity:contentOpacity??1},{opacity:0,offset:.5},{opacity:0}],index+2));
        // Normal closing keeps the native modal in the top layer until the
        // complete reverse morph finishes. The timer is only a hidden-tab or
        // suspended-observer fallback, not the animation's completion signal.
        timer=later(complete,duration+1000);
        return true;
    }
    function finishClose(){closing=false;skipClose=true;dialog.close();}
    return {
        toggle(opening,driver){
            lastDriver=driver;
            if(!opening&&skipClose){skipClose=false;return true;}
            if(opening){closing=false;skipClose=false;delete dialog.dataset.groupHandoff;}
            return animate(opening,driver);
        },
        handoff(){
            if(!dialog.open)return;
            if(!lastDriver||!allowed()){dialog.close();return;}
            cleanup();
            const rect=dialog.getBoundingClientRect(),paint=style(dialog),backdropStyle=style(dialog,'::backdrop');
            // Computed styles are live: preserve the visible shade before the
            // real modal closes and its backdrop becomes transparent.
            const shade={backgroundColor:backdropStyle.backgroundColor,backdropFilter:backdropStyle.backdropFilter};
            const copy=dialog.cloneNode(true),backdrop=doc.createElement('div');
            copy.removeAttribute('id');copy.removeAttribute('open');
            copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
            copy.querySelectorAll('.sortable-ghost,.sortable-fallback,[data-motion-cue],.group-ungroup-bar,.drop-targets').forEach(node=>node.remove());
            copy.inert=true;copy.setAttribute('aria-hidden','true');copy.classList.add('group-exit-copy');
            copy.style.cssText=`display:flex;flex-direction:column;position:fixed;inset:auto;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;max-width:none;max-height:none;box-sizing:border-box;margin:0;padding:0;overflow:hidden;transform-origin:center;z-index:99999;pointer-events:none;background:${paint.backgroundColor};border:${paint.border};border-radius:${paint.borderRadius};box-shadow:${paint.boxShadow};`;
            backdrop.className='group-exit-backdrop';backdrop.inert=true;backdrop.setAttribute('aria-hidden','true');
            backdrop.style.cssText=`position:fixed;inset:0;z-index:99998;pointer-events:none;background:${shade.backgroundColor};backdrop-filter:${shade.backdropFilter};`;
            doc.body.append(backdrop,copy);
            const content=copy.querySelector('.group-content');if(content)content.scrollTop=dialog.querySelector('.group-content').scrollTop;
            // Dismiss the real modal immediately so Sortable can hit-test the
            // root grid. Only inert paint continues above it, below the ghost.
            dialog.dataset.groupHandoff='';skipClose=true;dialog.close();
            animate(false,lastDriver,()=>{},copy,true);
            active.backdrop=backdrop;active.dispose=()=>{copy.remove();backdrop.remove();};
            if(!anchors[8]){anchors[8]=doc.createElement('span');lastDriver.append(anchors[8]);}
            motion.play(lastDriver,backdrop,[{backgroundColor:shade.backgroundColor,backdropFilter:shade.backdropFilter},{backgroundColor:'transparent',backdropFilter:'blur(0px)'}],{anchor:anchors[8],effectTiming:{duration:GROUP_MORPH_MS*speed(),easing:'ease-out',fill:'both'}});
        },
        close(){
            if(!dialog.open||closing)return;
            if(!lastDriver||!allowed()||dragging()){dialog.close();return;}
            releaseSurfaceFocus(dialog,null,doc);
            closing=true;dialog.inert=true;dialog.setAttribute('aria-hidden','true');
            animate(false,lastDriver,finishClose);
        },
        sync(){if(!allowed()||(dragging()&&!active?.detached)){cleanup();if(closing)finishClose();}}
    };
}
