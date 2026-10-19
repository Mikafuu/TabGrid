import test from 'node:test';
import assert from 'node:assert/strict';
import {createGroupTransition,groupOrigin,GROUP_MORPH_MS} from '../lib/group-transition.mjs';
function fixture(){
    const plays=[],cancels=[],reveals=[];let done,enabled=true,drag=false;
    const make=()=>({dataset:{},style:{opacity:'',setProperty(k,v){this[k]=v;}},children:[],classList:{add(){}},append(c){this.children.push(c);},remove(){this.removed=true;},removeAttribute(){},setAttribute(){},querySelectorAll:()=>[],matches:()=>true});
    const surface={...make(),cloneNode:()=>make()},card={isConnected:true,getBoundingClientRect:()=>({left:30,top:40,width:200,height:150,right:230,bottom:190}),querySelector:()=>surface};
    const dialog={...make(),open:true,close(){this.open=false;},children:[make(),make()],getBoundingClientRect:()=>({left:10,top:20,width:800,height:600})};
    dialog.querySelector=()=>({scrollTop:0});
    dialog.cloneNode=()=>({...make(),children:[make(),make()],querySelector:()=>({scrollTop:0}),getBoundingClientRect:dialog.getBoundingClientRect});
    const motion={play:(...a)=>plays.push(a),cancel:t=>cancels.push(t),reveal:(...a)=>reveals.push(a)};
    const controller=createGroupTransition({dialog,motion,source:()=>card,allowed:()=>enabled,dragging:()=>drag,style:()=>({borderRadius:'12px',opacity:'.5',transform:'matrix(.7,0,0,.7,0,0)',get backgroundColor(){return dialog.open?'rgba(0, 0, 0, .35)':'transparent';},get backdropFilter(){return dialog.open?'blur(3px)':'blur(0px)';}}),doc:{createElement:make,body:{append(){}}},win:{innerHeight:900,innerWidth:1200},later:f=>{done=f;return 1;},clear(){}});
    return {controller,dialog,card,surface,plays,cancels,reveals,driver:make(),finish:()=>done(),disable:()=>enabled=false,drag:()=>drag=true};
}
test('group morph maps the dialog bounds exactly onto the source card',()=>{
    assert.equal(groupOrigin({left:30,top:40,width:200,height:150},{left:10,top:20,width:800,height:600}),'translate(-280px, -205px) scale(0.25, 0.25)');
    assert.equal(groupOrigin(null,{}),null);
});
test('opening expands from the source and crossfades preview into content; closing reverses',()=>{
    const f=fixture();f.controller.toggle(true,f.driver);
    const entry=f.plays.find(p=>p[1]===f.dialog);assert.match(entry[2][0].transform,/scale\(0.25, 0.25\)/);assert.equal(entry[3].effectTiming.duration,GROUP_MORPH_MS);
    assert.equal(f.surface.style.opacity,'');assert.equal(f.dialog.dataset.groupMorph,'opening');
    f.finish();assert.equal(f.surface.style.opacity,'');assert.equal(f.dialog.dataset.groupMorph,undefined);
    f.plays.length=0;f.controller.toggle(false,f.driver);const exit=f.plays.find(p=>p[1]===f.dialog);
    assert.match(exit[2][1].transform,/scale\(0.25, 0.25\)/);assert.equal(f.dialog.dataset.groupMorph,'closing');f.finish();assert.equal(f.surface.style.opacity,'');
});
test('rapid reversal continues from the live transform and cleans the old snapshot',()=>{
    const f=fixture();f.controller.toggle(true,f.driver);const preview=f.dialog.children.at(-1);f.plays.length=0;
    f.controller.toggle(false,f.driver);assert.equal(preview.removed,true);assert.equal(f.plays.find(p=>p[1]===f.dialog)[2][0].transform,'matrix(.7,0,0,.7,0,0)');f.finish();
});
test('missing source fades; reduced motion and direct dismissal during drag skip the morph',()=>{
    const f=fixture();f.card.isConnected=false;f.controller.toggle(true,f.driver);assert.equal(f.plays.length,1);assert.deepEqual(f.plays[0][2],[{opacity:0},{opacity:1}]);
    f.card.isConnected=true;f.drag();f.controller.toggle(false,f.driver);assert.equal(f.plays.length,1);
    const g=fixture();g.controller.toggle(true,g.driver);g.disable();g.controller.sync();assert.equal(g.surface.style.opacity,'');assert.equal(g.dialog.dataset.groupMorph,undefined);
    g.plays.length=0;g.controller.toggle(false,g.driver);assert.equal(g.plays.length,0);
});

test('normal close stays in the top layer until the motion owner reports completion',()=>{
    const f=fixture();f.controller.toggle(true,f.driver);f.finish();f.plays.length=0;
    f.controller.close();assert.equal(f.dialog.open,true);assert.equal(f.dialog.inert,true);
    const exit=f.plays.find(p=>p[1]===f.dialog);assert.equal(typeof exit[3].onFinish,'function');
    exit[3].onFinish();assert.equal(f.dialog.open,false);assert.equal(f.dialog.dataset.groupMorph,undefined);
    const count=f.plays.length;f.controller.toggle(false,f.driver);assert.equal(f.plays.length,count);
});
test('reducing motion while closing completes close without leaving an inert open dialog',()=>{
    const f=fixture();f.controller.toggle(true,f.driver);f.finish();f.controller.close();f.disable();f.controller.sync();assert.equal(f.dialog.open,false);
});

test('drag-out closes the real modal but keeps a noninteractive reverse animation below the dragged card',()=>{
    const f=fixture();f.controller.toggle(true,f.driver);f.finish();f.plays.length=0;f.drag();
    f.controller.handoff();assert.equal(f.dialog.open,false);assert.equal(f.dialog.dataset.groupHandoff,'');
    const exit=f.plays.find(p=>p[1].dataset.groupMorph==='closing');assert.ok(exit);assert.notEqual(exit[1],f.dialog);assert.equal(exit[1].inert,true);
    const backdrop=f.plays.find(p=>p[1].className==='group-exit-backdrop');
    assert.deepEqual(backdrop[2][0],{backgroundColor:'rgba(0, 0, 0, .35)',backdropFilter:'blur(3px)'});
    assert.match(exit[1].style.cssText,/z-index:99999/);assert.match(exit[2][1].transform,/scale\(0.25, 0.25\)/);
    f.controller.toggle(false,f.driver);f.controller.sync();assert.equal(exit[1].removed,undefined);
    exit[3].onFinish();assert.equal(exit[1].removed,true);
});
test('all group speed options are shorter than the previous native-reference duration',()=>{
    for(const factor of [.65,1,1.6])assert.ok(GROUP_MORPH_MS*factor<400*factor);
});
