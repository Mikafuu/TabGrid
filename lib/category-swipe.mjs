// Wheel events do not identify the physical device. Pixel-based horizontal
// gestures below the source bar are treated as touchpad navigation.
export const CATEGORY_SWIPE_THRESHOLD = 56;
const QUIET_MS = 250;
export function mountCategorySwipe({nav,available,getView,change,doc=document,now=()=>performance.now()}) {
    let total=0,last=-Infinity,locked=false,sawMomentum=false;
    const reset=()=>{total=0;last=-Infinity;locked=false;sawMomentum=false;};
    function onWheel(e){
        const time=now(),gap=time-last;
        if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||e.deltaMode!==0||!available()||
            e.clientY<=Math.max(0,nav.getBoundingClientRect().bottom)||
            e.target.closest?.('input,textarea,select,[contenteditable],dialog,[popover],.drop-targets,.page-header,.page-controls')){reset();return;}
        if(gap>QUIET_MS||(sawMomentum&&e.momentum===false)){total=0;locked=false;sawMomentum=false;}
        // A vertical gesture remains a normal page scroll. It also cancels any
        // partial horizontal gesture without rearming a committed swipe's tail.
        if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)*1.6){total=0;return;}
        if(!e.deltaX)return;
        e.preventDefault();last=time;
        if(e.momentum===true){sawMomentum=true;total=0;return;}
        if(locked)return;
        total+=e.deltaX;
        if(Math.abs(total)<CATEGORY_SWIPE_THRESHOLD)return;
        locked=true;
        const views=Array.from(nav.querySelectorAll('[data-view]')).filter(b=>!b.hidden&&!b.disabled).map(b=>b.dataset.view);
        const index=views.indexOf(getView()),next=index+Math.sign(total);
        total=0;
        if(index>=0&&next>=0&&next<views.length)change(views[next]);
    }
    doc.addEventListener('wheel',onWheel,{capture:true,passive:false});
    doc.addEventListener('pointerdown',reset,true);
    doc.addEventListener('keydown',reset,true);
    return {reset};
}
