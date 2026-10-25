// Shared lifecycle for bottom-left feedback and bottom-centered Undo.
export function mountNoticePopover(element,{motion,timing,allowed,doc=document}){
    const driver=doc.createElement('div');driver.hidden=true;doc.body.append(driver);
    element.setAttribute('popover','manual');element.hidden=false;
    let shown=false,revision=0,timer;
    function host(){return [...doc.querySelectorAll('dialog[open]')].at(-1)||doc.body;}
    function place(){const parent=host();if(element.parentElement!==parent){parent.append(element);if(shown)element.showPopover();}}
    function set(open){
        const changed=shown!==open;shown=open;place();if(!changed)return;
        const token=++revision;clearTimeout(timer);motion.cancel(element);
        if(open){element.inert=false;element.showPopover();motion.play(driver,element,[{translate:'0 32px',opacity:0},{translate:'0 0',opacity:1}],{anchor:driver,effectTiming:timing()});}
        else{
            element.inert=true;
            const finish=()=>{if(token===revision&&element.matches(':popover-open'))element.hidePopover();};
            // Hold the last invisible frame until the popover leaves the top
            // layer. Otherwise its resting style can paint between finish and hide.
            motion.play(driver,element,[{translate:'0 0',opacity:1},{translate:'0 32px',opacity:0}],{anchor:driver,effectTiming:{...timing(),fill:'forwards'},onFinish:finish});
            // Also handles reduced motion and a browser discarding an effect.
            timer=setTimeout(finish,allowed()?timing().duration+50:0);
        }
    }
    return {set,place};
}
