// Feedback changes only the fallback copy's visuals, never Sortable's live slots.
export function dropFeedbackMode(kind, destination) {
    if (kind === 'group') return destination === 'ungroup' ? 'ungroup' : '';
    return kind === 'tab' && destination !== 'ungroup' && (destination === 'new' || /^\d+$/.test(destination || '')) ? 'group' : '';
}
export function createDropFeedback({ getGhost, motion, doc = document, style = getComputedStyle }) {
    let kind = null, ghost = null, mode = '';
    // Reuse stable mutation anchors instead of registering each disposable copy.
    const driver=doc.createElement('div');driver.hidden=true;driver.setAttribute('aria-hidden','true');doc.body.append(driver);
    const anchors=[];
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
        set(dropFeedbackMode(kind, target?.dataset.destination));
    }
    doc.addEventListener('mousemove', point);
    doc.addEventListener('pointermove', point);
    return {
        start(value) { kind = value; },
        destination(value) { set(dropFeedbackMode(kind, value)); },
        reset() {
            if (ghost) { for (const target of ghost.querySelectorAll('.card-surface,.card-info,.card-meta,.group-tile')) motion.cancel(target); delete ghost.dataset.dropFeedback; }
            kind = ghost = null; mode = '';
        }
    };
}
