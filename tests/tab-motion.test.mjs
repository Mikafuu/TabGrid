import test from 'node:test';
import assert from 'node:assert/strict';
import { gridMotion, scrolledBounds } from '../lib/tab-motion.mjs';
import { materialTiming } from '../lib/material-motion.mjs';

class Effect {
    constructor(target, frames, timing) { Object.assign(this, { target, frames, timing }); }
}
function card({ live = true, temporary = false, x = 0, y = 0 } = {}) {
    const surface = { getBoundingClientRect: () => ({ left: 20 + x, top: 60 + y, width:220, height:165 }) };
    return {
        surface,
        itemModel: live ? {} : undefined,
        matches: selector => selector === '.card[data-key]' ? live : temporary,
        querySelector: () => surface,
        getBoundingClientRect: () => ({ left: 20, top: 60 }),
        getClientRects:()=>[{}]
    };
}
const before = { left: 20, top: 60, width: 220, height: 165 };
const after = { left: 260, top: 60, width: 220, height: 165 };

test('grid motion excludes its container and Sortable placeholders/copies', () => {
    const { plugin } = gridMotion({ children: [] }, { Effect });
    for (const element of [card({ live: false }), card({ temporary: true })]) {
        for (const action of ['add', 'remain', 'remove']) {
            const [effect, options] = plugin(element, action, before, after);
            assert.equal(effect.timing.duration, 0);
            assert.deepEqual(effect.frames, []);
            assert.equal(options.styleReset, false);
        }
    }
});
test('card resizing and disclosure reflow animate visible surfaces without moving hit boxes',()=>{
    const element=card({x:10,y:5}),motion=gridMotion({children:[element]},{Effect});motion.captureLayout();
    const effect=motion.plugin(element,'remain',before,{left:40,top:100,width:110,height:82.5});
    assert.equal(effect.target,element.surface);assert.equal(effect.frames[0].transform,'translate(-10px, -35px) scale(2, 2)');assert.equal(effect.timing.duration,180);
});
test('successive renders keep the first visible layout until the effect consumes it',()=>{
    const element=card({x:10,y:5}),motion=gridMotion({children:[element]},{Effect});motion.captureLayout();
    element.surface.getBoundingClientRect=()=>({left:40,top:100,width:110,height:82.5});motion.captureLayout();
    const destination={left:40,top:100,width:110,height:82.5};
    assert.equal(motion.plugin(element,'remain',before,destination).frames[0].transform,'translate(-10px, -35px) scale(2, 2)');
    assert.equal(motion.plugin(element,'remain',destination,destination).timing.duration,0);
});
test('starting a reorder clears stale resize captures and retains the accepted slide curve',()=>{
    const element=card({x:10}),motion=gridMotion({children:[element]},{Effect});motion.captureLayout();motion.capture();
    const effect=motion.plugin(element,'remain',before,after);assert.equal(effect.timing.duration,120);assert.equal(effect.frames[0].transform,'translate(-230px, 0px)');
});
test('Glass reflow uses its settling curve while interrupted reorder retains the accepted timing',()=>{
    const element=card(),motion=gridMotion({children:[element]},{Effect,layoutTiming:()=>({duration:220,easing:'cubic-bezier(.22,1,.36,1)'})});
    motion.captureLayout();assert.equal(motion.plugin(element,'remain',before,after).timing.duration,220);
    motion.capture();assert.equal(motion.plugin(element,'remain',before,after).timing.duration,120);
});
test('Neumorphism reflow keeps its effect on the surface and leaves reorder timing intact',()=>{
    const element=card({x:12}),motion=gridMotion({children:[element]},{Effect,layoutTiming:()=>materialTiming('neumorphic')});
    motion.captureLayout();const resize=motion.plugin(element,'remain',before,after);
    assert.equal(resize.target,element.surface);assert.equal(resize.timing.duration,200);
    motion.capture();const reorder=motion.plugin(element,'remain',before,after);
    assert.equal(reorder.target,element.surface);assert.equal(reorder.timing.duration,120);
    assert.equal(reorder.frames[0].transform,'translate(-228px, 0px)');
});
test('Clay reflow uses cushioned settling without changing interrupted reorder timing',()=>{
    const element=card({x:12}),motion=gridMotion({children:[element]},{Effect,layoutTiming:()=>materialTiming('clay')});
    motion.captureLayout();const resize=motion.plugin(element,'remain',before,after);
    assert.equal(resize.target,element.surface);assert.equal(resize.timing.duration,240);
    motion.capture();const reorder=motion.plugin(element,'remain',before,after);
    assert.equal(reorder.target,element.surface);assert.equal(reorder.timing.duration,120);
    assert.equal(reorder.frames[0].transform,'translate(-228px, 0px)');
});
test('layout capture uses the nearest scroller so root/group scrolling cannot become a false slide',()=>{
    const outer={scrollTop:600,scrollLeft:0},inner={scrollTop:125,scrollLeft:3,parentElement:outer},surface={parentElement:inner,getBoundingClientRect:()=>({left:20,top:10,width:220,height:165})};
    assert.deepEqual(scrolledBounds(surface),{left:23,top:135,width:220,height:165});inner.scrollTop=inner.scrollLeft=0;assert.equal(scrolledBounds(surface).top,610);
});
test('displaced surfaces translate while Sortable slots remain unanimated', () => {
    const { plugin } = gridMotion({ children: [] }, { Effect }), element = card();
    const effect = plugin(element, 'remain', before, after);
    assert.equal(effect.target, element.surface);
    assert.deepEqual(effect.frames, [{ transform: 'translate(-240px, 0px)' }, { transform: 'translate(0, 0)' }]);
    assert.equal(effect.timing.duration, 120);
    assert.equal(plugin(element, 'remain', before, before).timing.duration, 0);
});
test('reduced motion disables effects, including when the preference changes', () => {
    let reduce = false;
    const { plugin } = gridMotion({ children: [] }, { Effect, reducedMotion: () => reduce });
    assert.equal(plugin(card(), 'remain', before, after).timing.duration, 120);
    reduce = true;
    assert.equal(plugin(card(), 'remain', before, after)[0].timing.duration, 0);
});
test('interrupted slides continue from their visible offset without blocking another reorder', () => {
    const element = card({ x: -90, y: 12 });
    const motion = gridMotion({ children: [element] }, { Effect });
    motion.capture();
    const effect = motion.plugin(element, 'remain', before, after);
    assert.equal(effect.frames[0].transform, 'translate(-330px, 12px)');
    // A stationary neighboring slot still finishes its interrupted visual slide.
    motion.capture();
    assert.equal(motion.plugin(element, 'remain', before, before).frames[0].transform, 'translate(-90px, 12px)');
    // Snapshots are consumed once and cannot leak into an unrelated update.
    assert.equal(motion.plugin(element, 'remain', before, before).timing.duration, 0);
});
