import {mountFilterGlass} from './filter-glass.mjs';

const panels = '.header-surface,.card-surface,dialog,[popover]:not(.settings-help-tip),.search-history,.drop-targets,#undo-toast,.live-filters,.toolbar,.search-filters';
const controls = 'button:not(.settings-help-button):not(.card-open):not(.sources > button):not(.menu-colors button),.liquid-control-shell,.filter-picker,.liquid-slider-track,.liquid-tab-indicator';
const candidates = `${panels},${controls}`;
const nativeControls = 'input:not([type=hidden]):not([type=file]):not([type=range]):not([type=checkbox]):not([type=radio]),select,textarea';

// Native top-layer popovers start a new optical layer even inside a dialog.
export function hasGlassAncestor(element) {
    if(element.matches('dialog,[popover]'))return false;
    return Boolean(element.parentElement?.closest(candidates));
}
export function mountGlassSurfaces(image, root = document.documentElement) {
    const mounts = new Map();let queued = false;
    function scan() {
        queued = false;
        // Replaced native controls cannot contain a canvas. A shell supplies the
        // background while the original input retains focus, labels and events.
        for(const input of document.querySelectorAll(nativeControls)) {
            if(input.hidden||input.closest(candidates))continue;
            const shell=document.createElement('span');shell.className='liquid-control-shell';
            input.before(shell);shell.append(input);
        }
        for (const [element,mount] of mounts) if (!element.isConnected) {mount.destroy();mounts.delete(element);}
        for (const element of document.querySelectorAll(candidates)) {
            const nested=hasGlassAncestor(element);
            element.toggleAttribute('data-glass-nested',nested);
            element.toggleAttribute('data-glass-owner',!nested);
            if(nested){if(mounts.has(element)){mounts.get(element).destroy();mounts.delete(element);}continue;}
            if (!mounts.has(element)) mounts.set(element,mountFilterGlass(element,image,root,{panel:element.matches(panels),general:true}));
            else mounts.get(element).refresh();
        }
    }
    function schedule() {if(!queued){queued=true;queueMicrotask(scan);}}
    const observer = new MutationObserver(records=>{
        if(records.some(r=>r.type==='attributes'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches('.filter-glass-surface,canvas,[data-motion-cue]'))))schedule();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','data-collapsed']});
    const slider=document.querySelector('.size-range');
    if(slider){const track=document.createElement('span');track.className='liquid-slider-track';track.setAttribute('aria-hidden','true');slider.prepend(track);}
    scan();
    return {destroy(){observer.disconnect();for(const mount of mounts.values())mount.destroy();mounts.clear();}};
}
