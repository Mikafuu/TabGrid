// Feedback changes card surfaces, never Sortable's stable slots.
export function dropFeedbackMode(kind, destination) {
    if (kind === 'group') return destination === 'ungroup' ? 'ungroup' : '';
    return kind === 'tab' && destination !== 'ungroup' && (destination === 'new' || /^\d+$/.test(destination || '')) ? 'group' : '';
}
export function createDropFeedback({ getGhost, motion, doc = document, style = getComputedStyle }) {
    let kind = null, ghost = null, mode = '', direct = null, overlap = null, chosen = null;
    // Reuse stable mutation anchors instead of registering each disposable copy.
    const driver=doc.createElement('div');driver.hidden=true;driver.setAttribute('aria-hidden','true');doc.body.append(driver);
    const anchors=[],overlapAnchors=[doc.createElement('span'),doc.createElement('span')];overlapAnchors.forEach(a=>driver.append(a));
    const liftAnchor=doc.createElement('span');driver.append(liftAnchor);
    const properties = ['transform', 'opacity', 'backgroundColor', 'borderColor', 'boxShadow', 'outlineColor'];
    const sample = element => Object.fromEntries(properties.map(key => [key, style(element)[key]]));
    function set(next) {
        const copy = getGhost();
        if (!copy || (copy === ghost && next === mode)) return;
        ghost = copy; mode = next;
        const targets = [...copy.querySelectorAll('.card-surface,.card-info,.card-meta,.group-tile')];
        const before = targets.map(sample);
        targets.forEach(target => motion.cancel(target));
        if (next) copy.dataset.dropFeedback = next; else delete copy.dataset.dropFeedback;
        targets.forEach((target, index) => {
            if(!anchors[index]){anchors[index]=doc.createElement('span');driver.append(anchors[index]);}
            motion.play(driver, target, [before[index], sample(target)], {anchor:anchors[index]});
        });
    }
    function point(event) {
        if (!kind) return;
        const target = doc.elementFromPoint(event.clientX, event.clientY)?.closest('.drop-target');
        set(direct!==null?'':dropFeedbackMode(kind,target?.dataset.destination));
    }
    doc.addEventListener('mousemove', point);
    doc.addEventListener('pointermove', point);
    function lift(card, enabled) {
        if(!card)return;
        const surface=card.querySelector('.card-surface');
        const from=style(surface).scale||'1';
        motion.cancel(surface);
        if(enabled)card.dataset.dragLift='';else delete card.dataset.dragLift;
        motion.play(driver,surface,[{scale:from==='none'?'1':from},{scale:enabled ? .94 : 1}],{anchor:liftAnchor});
    }
    return {
        choose(card,shrink) { chosen=card;if(shrink)lift(card,true); },
        unchoose() { if(chosen?.dataset.dragLift!==undefined)lift(chosen,false);chosen=null; },
        direct(value,card=null) {
            direct=value;set('');
            if(card===overlap)return;
            for(const [i,[target,scale]]of [[overlap,'1'],[card,'.9']].entries())if(target){
                const surface=target.querySelector('.card-surface'),from=style(surface).scale||'1';
                motion.cancel(surface);motion.play(driver,surface,[{scale:from==='none'?'1':from},{scale}],{anchor:overlapAnchors[i]});
            }
            overlap=card;
        },
        start(value,shrink=false) {
            kind=value;const copy=getGhost();
            if(copy&&shrink){
                // Continue the held source's current scale on the fallback copy.
                const source=chosen?.querySelector('.card-surface'),from=source?style(source).scale:'1';
                copy.dataset.dragLift='';const surface=copy.querySelector('.card-surface');
                // A fallback cloned mid-transition must not retain liquid-dom's
                // temporary inline scale after its own lift finishes.
                surface.style?.removeProperty('scale');
                motion.play(driver,surface,[{scale:!from||from==='none'?'1':from},{scale:.94}],{anchor:driver});
            }
        },
        destination(value) { set(dropFeedbackMode(kind, value)); },
        reset() {
            if (ghost) { for (const target of ghost.querySelectorAll('.card-surface,.card-info,.card-meta,.group-tile')) motion.cancel(target); delete ghost.dataset.dropFeedback; }
            overlap = null;
            kind = ghost = null; mode = ''; direct = null;
        }
    };
}
