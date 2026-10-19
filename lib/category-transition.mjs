// Animate content inside stable layout containers; fixed drawers and Sortable's
// card slots keep their geometry throughout category navigation.
export function categoryFrames(direction) {
    return [{transform:`translateX(${Math.sign(direction)*40}px)`,opacity:0},{transform:'translateX(0px)',opacity:1}];
}
export function createCategoryTransition({content,motion,doc=document}) {
    const driver=doc.createElement('div');driver.hidden=true;doc.body.append(driver);
    const anchors=[];let active=[];
    return direction=>{
        for(const target of active)motion.cancel(target);
        active=[...content.querySelectorAll('.grid-container,.window-section > h3,.window-pinned > h4,#pinned-heading,.session-list,#recent-heading,.section-note,.drag-tip,.empty')].filter(el=>!el.closest('[hidden],[data-collapsed]')&&el.getClientRects().length);
        active.forEach((target,i)=>{
            if(!anchors[i]){anchors[i]=doc.createElement('span');driver.append(anchors[i]);}
            motion.play(driver,target,categoryFrames(direction),{anchor:anchors[i],duration:.2});
        });
    };
}
