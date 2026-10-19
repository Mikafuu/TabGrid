import {panBackground} from './background-crop.mjs';
import { prepareBackground, applyBackgroundAdjustments } from './background-image.mjs';
const node=(tag,text='')=>{const el=document.createElement(tag);el.textContent=text;return el;};
export function mountBackgroundPanel(panel,{background,getPrefs,save,rpc,act,privateMode,help}) {
    const box=node('fieldset');box.className='background-settings settings-group';box.append(node('legend','Custom background'));
    const description=node('p','Choose a JPG, PNG, or WebP image (up to 15 MiB). It stays on this computer and is not included in settings backups.');description.id='background-help';help(box.querySelector('legend'),description);
    const preview=node('div');preview.className='background-sample';preview.hidden=true;
    preview.tabIndex=0;preview.setAttribute('role','group');preview.setAttribute('aria-label','Background crop preview. Drag to reposition, or use arrow keys.');
    const image=node('img');image.draggable=false;image.alt='Custom background preview';preview.append(image);box.append(preview);
    const actions=node('div');actions.className='background-actions';
    const upload=node('button','Choose image'),remove=node('button','Remove background'),file=node('input');
    upload.type=remove.type='button';file.type='file';file.accept='image/jpeg,image/png,image/webp';file.hidden=true;file.setAttribute('aria-label','Custom background image');file.setAttribute('aria-describedby','background-help settings-error');
    upload.onclick=()=>file.click();actions.append(upload,remove,file);box.append(actions);
    const status=node('p');status.className='background-status';status.setAttribute('role','status');box.append(status);
    const adjustments=node('div');adjustments.className='background-adjustments';box.append(adjustments);const controls=new Map();let busy=false;
    for(const [key,label,max,unit]of [['backgroundTransparency','Background transparency',100,'%'],['backgroundBlur','Background blur',40,'px'],['backgroundZoom','Crop zoom',300,'%'],['backgroundX','Horizontal position',100,'%'],['backgroundY','Vertical position',100,'%']]){
        const wrap=node('label'),caption=node('span',label),input=node('input'),output=node('output');
        input.type='range';input.id=`pref-${key}`;input.min=key==='backgroundZoom'?'100':'0';input.max=String(max);input.step='1';input.setAttribute('aria-describedby','background-help settings-error');
        output.htmlFor=input.id;wrap.htmlFor=input.id;wrap.append(caption,input,output);adjustments.append(wrap);controls.set(key,{input,output,unit});
        input.oninput=()=>{const value=Number(input.value);output.value=`${value}${unit}`;input.setAttribute('aria-valuetext',output.value);applyBackgroundAdjustments(document.documentElement,{...getPrefs(),...Object.fromEntries([...controls].map(([k,v])=>[k,Number(v.input.value)]))});};
        input.onchange=()=>act(async()=>{try{await save({[key]:Number(input.value)});}catch(error){input.value=getPrefs()[key];throw error;}finally{applyBackgroundAdjustments(document.documentElement,getPrefs());sync();}});
    }
    async function change(work){busy=true;sync();try{await work();}finally{busy=false;file.value='';sync();}}
    file.onchange=()=>{const selected=file.files?.[0];if(selected)act(()=>change(async()=>{const value=await prepareBackground(selected);await rpc('background','set',value);await save({backgroundZoom:100,backgroundX:50,backgroundY:50});}));};
    remove.onclick=()=>act(async()=>{await change(()=>rpc('background','remove'));upload.focus();});
    const cropHelp=node('p','At 100%, the image fits the screen with the least possible cropping. Drag the preview to reposition it, or increase Crop zoom to crop more closely. Arrow keys move it; Shift + arrow moves it farther.');const cropTip=help(controls.get('backgroundZoom').input.previousElementSibling,cropHelp,'Cropping and positioning');
    const reset=node('button','Reset crop');reset.type='button';actions.append(reset);
    reset.onclick=()=>act(()=>save({backgroundZoom:100,backgroundX:50,backgroundY:50}));
    let drag=null;
    const current=()=>({...getPrefs(),...Object.fromEntries([...controls].map(([key,{input}])=>[key,Number(input.value)]))});
    function paint(values){for(const [key,value]of Object.entries(values)){const c=controls.get(key);c.input.value=value;c.output.value=`${value}${c.unit}`;c.input.setAttribute('aria-valuetext',c.output.value);}applyBackgroundAdjustments(document.documentElement,current());}
    function persist(values){act(async()=>{try{await save(values);}finally{applyBackgroundAdjustments(document.documentElement,getPrefs());sync();}});}
    preview.onpointerdown=e=>{if(e.button!==0||privateMode||busy)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,prefs:current(),box:{width:preview.clientWidth,height:preview.clientHeight}};preview.setPointerCapture(e.pointerId);preview.focus({preventScroll:true});e.preventDefault();};
    preview.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;paint(panBackground(drag.prefs,e.clientX-drag.x,e.clientY-drag.y,{...drag.box,imageWidth:image.naturalWidth,imageHeight:image.naturalHeight,zoom:drag.prefs.backgroundZoom}));};
    const finish=e=>{if(!drag||e.pointerId!==drag.id)return;const original=drag.prefs;drag=null;if(preview.hasPointerCapture(e.pointerId))preview.releasePointerCapture(e.pointerId);if(e.type==='pointercancel'){paint({backgroundX:original.backgroundX,backgroundY:original.backgroundY});return;}const prefs=current();persist({backgroundX:prefs.backgroundX,backgroundY:prefs.backgroundY});};
    preview.onpointerup=finish;preview.onpointercancel=finish;preview.onlostpointercapture=e=>{if(drag)finish({...e,pointerId:drag.id});};
    preview.onkeydown=e=>{if(privateMode||busy||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const prefs=current(),step=e.shiftKey?10:1,key=['ArrowLeft','ArrowRight'].includes(e.key)?'backgroundX':'backgroundY';const value=Math.max(0,Math.min(100,prefs[key]+(['ArrowRight','ArrowDown'].includes(e.key)?step:-step)));paint({[key]:value});persist({[key]:value});};
    function previewSize(){preview.style.setProperty('--background-aspect',String(innerWidth/innerHeight));const scale=preview.clientWidth/innerWidth;preview.style.setProperty('--preview-scale',String(scale));}
    new ResizeObserver(previewSize).observe(preview);window.addEventListener('resize',previewSize);
    function sync(){
        const value=background.get(),prefs=getPrefs();preview.hidden=!value;adjustments.hidden=!value;cropTip.hidden=!value;reset.hidden=!value;reset.disabled=privateMode||busy;preview.setAttribute('aria-disabled',String(privateMode||busy));
        if(value){if(image.getAttribute('src')!==value.dataUrl)image.src=value.dataUrl;}else image.removeAttribute('src');
        upload.textContent=value?'Replace image':'Choose image';upload.disabled=privateMode||busy;remove.hidden=!value;remove.disabled=privateMode||busy;
        status.textContent=busy?'Preparing background…':privateMode?'Manage custom backgrounds in a regular window.':value?value.name:'No custom background';
        for(const [key,{input,output,unit}]of controls){if(input!==document.activeElement)input.value=prefs[key];output.value=`${input.value}${unit}`;input.setAttribute('aria-valuetext',output.value);input.disabled=privateMode||busy;}
    }
    panel.append(box);background.subscribe(sync);sync();return {box,sync};
}
