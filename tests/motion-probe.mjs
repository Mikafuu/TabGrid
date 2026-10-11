// Opt-in fixture diagnostics: record actual browser-created effects, not expected frames.
const output=document.createElement('output');output.id='motion-probe';output.hidden=true;document.body.append(output);
const records=[],seen=new WeakSet();
let lastFeedback='',lastOrder='';const sampled=new WeakSet();
function record(value){records.push(value);if(records.length>80)records.shift();output.textContent=JSON.stringify(records);}
function observe(){
    for(const animation of document.getAnimations()){
        if(animation.effect?.target?.id==='size-range'&&!sampled.has(animation)&&animation.currentTime>20&&animation.currentTime<animation.effect.getTiming().duration){
            const range=document.querySelector('#size-range'),knob=range.querySelector('.size-knob'),r=range.getBoundingClientRect(),k=knob.getBoundingClientRect();
            record({type:'knob-sample',progress:getComputedStyle(range).getPropertyValue('--size-progress'),knobX:k.left-r.left,rangeWidth:r.width,knobWidth:k.width});sampled.add(animation);
        }
        if(seen.has(animation))continue;seen.add(animation);
        const target=animation.effect?.target;
        if(!target?.matches('#context-submenu,.header-surface,.window-content,#size-slider,#size-range,.tint-content,.disclosure-chevron,.sortable-fallback .card-surface,#group-grid .card-surface'))continue;
        const frames=animation.effect.getKeyframes();if(frames.length<2)continue;
        record({type:'effect',target:target.id||target.className,frames,duration:animation.effect.getTiming().duration});
    }
    const ghost=document.querySelector('.sortable-fallback');
    const feedback=ghost?.dataset.dropFeedback||'';
    if(feedback!==lastFeedback){record({type:'feedback',value:feedback});lastFeedback=feedback;}
    if(ghost){const order=[...document.querySelectorAll('.grid-container > .card[data-key]')].map(e=>e.dataset.key).join(',');if(order!==lastOrder){record({type:'order',value:order});lastOrder=order;}}
    requestAnimationFrame(observe);
}
requestAnimationFrame(observe);

// Opt-in repeatable fixture gestures. These exercise Sortable via mouse events;
// they are explicitly synthetic and never run on the extension's Chrome tabs.
const controls=document.createElement('div');controls.style.cssText='position:fixed;left:40px;bottom:8px;z-index:100;background:var(--surface);padding:4px;display:flex;gap:4px';document.body.append(controls);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const center=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
function mouse(type,x,y){(document.elementFromPoint(x,y)||document).dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window,clientX:x,clientY:y,button:0,buttons:type==='mouseup'?0:1}));}
function order(){return [...document.querySelectorAll('.grid-container > .card[data-key]:not(.sortable-fallback)')].map(e=>e.dataset.key).join(',');}
for(const kind of ['tab','group','new']){
    const button=document.createElement('button');button.textContent=`Run ${kind==='tab'?'grouping':kind==='group'?'ungrouping':'new group'} fixture`;controls.append(button);
    button.onclick=async()=>{
        const card=document.querySelector(`#window-1-grid > .card[data-kind=${kind==='group'?'group':'tab'}], #grid > .card[data-kind=${kind==='group'?'group':'tab'}]`);
        if(!card){record({type:'scenario',error:'No suitable fixture card'});return;}
        button.disabled=true;let point;
        try{
            card.scrollIntoView({block:'center',behavior:'instant'});await pause(80);point=center(card.querySelector('.card-preview'));
            mouse('mousedown',point.x,point.y);mouse('mousemove',point.x+12,point.y);await pause(100);
            const tray=document.querySelector('#root-drop-targets');let r=tray.getBoundingClientRect();point={x:tray.dataset.edge==='left'?12:innerWidth-12,y:r.top+r.height/2};
            mouse('mousemove',point.x,point.y);await pause(450);
            const before=order();const x=tray.dataset.edge==='left'?tray.offsetLeft+tray.offsetWidth+20:tray.offsetLeft-20;
            mouse('mousemove',x,point.y);await pause(140);const frozen=order()===before;
            const source=document.querySelector('#window-1-grid')||document.querySelector('#grid');const neighbor=[...source.children].filter(e=>e.matches('.card[data-key]')&&e!==card).at(-1);
            let resumed=null;
            if(neighbor){const bounds=neighbor.getBoundingClientRect();mouse('mousemove',bounds.left+bounds.width*.8,bounds.top+bounds.height*.6);await pause(180);resumed=order()!==before;}
            r=tray.getBoundingClientRect();mouse('mousemove',tray.dataset.edge==='left'?12:innerWidth-12,r.top+r.height/2);await pause(350);
            const destination=tray.querySelector(kind==='group'?'.drop-target[data-destination=ungroup]':kind==='new'?'.drop-target[data-destination=new]':'.group-drop-target');point=center(destination);
            mouse('mousemove',point.x,point.y);await pause(450);
            const copy=document.querySelector('.sortable-fallback'),surface=copy?.querySelector('.card-surface');
            record({type:'scenario',kind,frozen,resumed,tiles:[...copy?.querySelectorAll('.group-tile')||[]].map(e=>getComputedStyle(e).transform),feedback:copy?.dataset.dropFeedback||'',surface:surface?{transform:getComputedStyle(surface).transform,background:getComputedStyle(surface).backgroundColor,outline:getComputedStyle(surface).outlineColor,outlineWidth:getComputedStyle(surface).outlineWidth,copyOutline:getComputedStyle(copy).outlineWidth,copyOutlineStyle:getComputedStyle(copy).outlineStyle}:null,ungroupVisible:tray.querySelector('[data-destination=ungroup]').offsetHeight>0,targets:[...tray.querySelectorAll('.drop-target')].filter(e=>e.offsetHeight).map(e=>e.dataset.destination)});
            mouse('mouseup',point.x,point.y);
        }catch(error){record({type:'scenario',error:error.message});if(point)mouse('mouseup',point.x,point.y);}finally{button.disabled=false;}
    };
}

const hoverCheck=document.createElement('button');hoverCheck.textContent='Run submenu hover fixture';controls.append(hoverCheck);
hoverCheck.onclick=async()=>{
    hoverCheck.disabled=true;
    const menu=document.querySelector('#context-menu'),popup=document.querySelector('#context-submenu');
    const enter=el=>el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,relatedTarget:null}));
    const leave=(el,to=null)=>el.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:to}));
    const escape=()=>menu.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    try{
        if(menu.matches(':popover-open'))escape();
        document.querySelector('#window-1-grid .card-menu, #grid .card-menu').click();await pause(350);
        const triggers=[...menu.querySelectorAll(':scope > .has-submenu')];
        enter(triggers[0]);await pause(60);leave(triggers[0]);await pause(180);
        const quickPassCancelled=!popup.matches(':popover-open');
        const delays=[];
        const delayedOpen=async trigger=>{
            const start=performance.now();let openedAt=null;
            const onOpen=e=>{if(e.newState==='open')openedAt=Math.round(performance.now()-start);};
            popup.addEventListener('beforetoggle',onOpen);
            enter(trigger);const immediate=!popup.matches(':popover-open');
            await pause(90);const withheld=!popup.matches(':popover-open');
            await pause(120);const opened=popup.matches(':popover-open');
            popup.removeEventListener('beforetoggle',onOpen);delays.push({immediate,withheld,opened,ms:openedAt});
            await pause(350);
        };
        await delayedOpen(triggers[0]);
        leave(triggers[0],popup);const retained=popup.matches(':popover-open');
        leave(popup,document.body);const closed=!popup.matches(':popover-open');
        const start=performance.now(),samples=[];
        for(const wait of [0,16,34,50,100,150]){
            await pause(wait);const css=getComputedStyle(popup);
            samples.push({ms:Math.round(performance.now()-start),opacity:Number(css.opacity),display:css.display});
        }
        record({type:'submenu-exit',samples});
        await delayedOpen(triggers[1]);
        leave(triggers[1],triggers[0]);await delayedOpen(triggers[0]);
        leave(triggers[0]);await pause(350);triggers[0].click();await pause(180);
        const clickClosed=!popup.matches(':popover-open');
        enter(triggers[1]);await pause(60);escape();await pause(200);
        const menuCloseCancelled=!popup.matches(':popover-open');
        record({type:'hover-scenario',quickPassCancelled,retained,closed,delays,clickClosed,menuCloseCancelled,
            fadesBeforeHide:samples.some(s=>s.display!=='none'&&s.opacity>0&&s.opacity<.9),
            noHold:samples.some(s=>s.ms<110&&s.opacity<.9)});
        // Leave a representative open submenu for visual inspection.
        document.querySelector('#window-1-grid .card-menu, #grid .card-menu').click();await pause(350);
        enter(menu.querySelector('.has-submenu'));
    }finally{hoverCheck.disabled=false;}
};
