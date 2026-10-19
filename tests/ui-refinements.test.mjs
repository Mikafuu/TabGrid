import test from 'node:test';
import assert from 'node:assert/strict';
import {wallpaperTextColor} from '../lib/background-contrast.mjs';
import {panBackground} from '../lib/background-crop.mjs';
import {clippedTextureCopy,wallpaperTexture} from '../lib/glass-backdrop.mjs';
import {inSubmenuCorridor,bindSubmenuHover} from '../lib/tab-menu.mjs';
import {validatePreferences} from '../lib/preferences.mjs';
import {STYLES} from '../lib/appearance.mjs';

test('crop panning clamps to the image and does not move a fitting axis',()=>{
 const start={backgroundX:50,backgroundY:50},box={width:400,height:200,imageWidth:800,imageHeight:400,zoom:200};
 assert.deepEqual(panBackground(start,100,-50,box),{backgroundX:25,backgroundY:75});
 assert.deepEqual(panBackground(start,999,-999,box),{backgroundX:0,backgroundY:100});
 assert.deepEqual(panBackground(start,100,100,{...box,zoom:100}),{backgroundX:50,backgroundY:50});
 for(const patch of [{backgroundZoom:99},{backgroundX:101},{backgroundY:-1}])assert.throws(()=>validatePreferences(patch));
 assert.equal(validatePreferences({backgroundZoom:200,backgroundX:32}).backgroundX,32);
});
test('retired styles migrate without rejecting the remaining preferences',()=>{
 assert.deepEqual(STYLES.map(s=>s.id),['classic','flat','glass']);
 for(const visualStyle of ['neumorphic','clay'])assert.equal(validatePreferences({visualStyle,backgroundBlur:12}).visualStyle,'classic');
});
test('GPU crop copies clip both source and destination at viewport edges',()=>{
 assert.deepEqual(clippedTextureCopy(-10,-20,100,80,200,200),{source:{x:0,y:0},destination:{x:10,y:20},width:90,height:60});
 assert.equal(clippedTextureCopy(190,0,100,80,200,200).width,10);
 assert.equal(clippedTextureCopy(220,0,100,80,200,200).width,0);
});
test('wallpaper blur and external upload are reused across lenses and quality switches',()=>{
 const previousDoc=globalThis.document,previousUsage=globalThis.GPUTextureUsage;let draws=0,uploads=0,destroyed=0;
 globalThis.document={createElement:()=>({getContext:()=>({setTransform(){},fillRect(){},drawImage(){draws++;}})})};
 globalThis.GPUTextureUsage={COPY_SRC:1,COPY_DST:2,TEXTURE_BINDING:4,RENDER_ATTACHMENT:8};
 try{
 const pool={device:{createTexture:({usage})=>{assert.equal(usage&10,10);return {destroy(){destroyed++;}};},queue:{copyExternalImageToTexture(){uploads++;}}}};
 const image={currentSrc:'first'},options={placement:{x:0,y:0,width:800,height:600},dpr:1.5,opacity:.6,blur:10,color:'#fff',width:800,height:600,padding:128};
 const a=wallpaperTexture(pool,image,options);assert.equal(wallpaperTexture(pool,image,options),a);
 wallpaperTexture(pool,image,{...options,dpr:1});assert.equal(wallpaperTexture(pool,image,options),a);
 assert.equal(draws,2);assert.equal(uploads,2);
 wallpaperTexture(pool,image,{...options,blur:11});assert.equal(destroyed,2);assert.equal(uploads,3);
 wallpaperTexture(pool,{currentSrc:'second'},{...options,blur:11});assert.equal(uploads,4);
 }finally{globalThis.document=previousDoc;globalThis.GPUTextureUsage=previousUsage;}
});
test('submenu corridor accepts diagonal travel on either side and rejects movement away',()=>{
 const r={left:300,right:500,top:80,bottom:240},o={x:200,y:100};
 assert.ok(inSubmenuCorridor({x:260,y:170},o,r));assert.ok(!inSubmenuCorridor({x:180,y:100},o,r));assert.ok(!inSubmenuCorridor({x:210,y:220},o,r));
 assert.ok(inSubmenuCorridor({x:140,y:160},{x:200,y:100},{left:0,right:100,top:80,bottom:240}));
});
test('submenu grace keeps diagonal travel clickable but cancels immediately outside the corridor',()=>{
 const events={},docEvents={},jobs=new Map();let serial=0,closed=0;
 const popup={contains:()=>false,getBoundingClientRect:()=>({left:300,right:500,top:80,bottom:240})};
 const trigger={addEventListener:(n,f)=>events[n]=f,contains:()=>false,ownerDocument:{addEventListener:(n,f)=>docEvents[n]=f,removeEventListener:n=>delete docEvents[n]}};
 const hover=bindSubmenuHover(trigger,{active:()=>true,open(){},close:()=>closed++,submenu:()=>popup,schedule:(fn,ms)=>{jobs.set(++serial,{fn,ms});return serial;},cancel:id=>jobs.delete(id)});
 events.pointerover({relatedTarget:null});const opening=[...jobs.values()][0];jobs.clear();opening.fn();
 events.pointermove({clientX:190,clientY:100});events.pointermove({clientX:200,clientY:100});
 events.pointerout({relatedTarget:null,target:trigger,clientX:200,clientY:100});assert.ok(hover.inGrace());assert.equal(closed,0);
 docEvents.pointermove({target:null,clientX:260,clientY:170});assert.equal(closed,0);
 docEvents.pointermove({target:null,clientX:180,clientY:100});assert.equal(closed,1);assert.equal(jobs.size,0);assert.ok(!hover.inGrace());
});

test('100% crop uses only aspect-ratio overflow, without hidden enlargement',()=>{
 const start={backgroundX:50,backgroundY:50};
 const box={width:800,height:600,imageWidth:1600,imageHeight:1200,zoom:100};
 assert.deepEqual(panBackground(start,100,100,box),start);
 // A portrait source fills the viewport width and can pan over its excess height.
 const portrait={...box,imageWidth:800,imageHeight:1200};
 assert.deepEqual(panBackground(start,100,300,portrait),{backgroundX:50,backgroundY:0});
 assert.deepEqual(panBackground(start,100,-300,portrait),{backgroundX:50,backgroundY:100});
 // A wide source can pan horizontally, but its full height is already visible.
 assert.deepEqual(panBackground(start,200,100,{...box,imageWidth:1600,imageHeight:600}),{backgroundX:25,backgroundY:50});
 assert.deepEqual(panBackground(start,32,-48,{...box,zoom:150}),panBackground(start,16,-24,{...box,width:400,height:300,zoom:150}));
});
test('wallpaper captions choose contrasting foregrounds from rendered pixels',()=>{
 assert.equal(wallpaperTextColor([0,0,0,255]),'#ffffff');
 assert.equal(wallpaperTextColor([255,255,255,255]),'#000000');
 assert.equal(wallpaperTextColor([40,50,60,255,80,70,60,255]),'#ffffff');
 assert.equal(wallpaperTextColor([180,190,200,255]),'#000000');
});
