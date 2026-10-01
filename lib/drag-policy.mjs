// Group restrictions expose member order; other restrictions hide intervening slots.
export function dragPolicy({query='',filters={},sort='default',view='open',selecting=false,busy=false}) {
    const restricted=Boolean(query.trim()||(filters.websites||[]).length||['pinned','audible','muted'].some(k=>filters[k]&&filters[k]!=='any'));
    const enabled=!selecting&&!busy&&!['recent','inactive'].includes(view);
    return {drag:enabled,reorder:enabled&&!restricted&&sort==='default',tip:restricted?'Drag to move tabs. Clear search and website, pinned, audio, or muted filters to reorder.':sort!=='default'?'Drag to move tabs. Choose Tab order to reorder.':''};
}
