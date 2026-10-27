// Move focus before aria-hidden is applied. Native dialog/popover closing will
// subsequently restore its invoker; blur is needed while a modal is still open.
export function releaseSurfaceFocus(surface, fallback, doc = surface.ownerDocument) {
    const focused = doc?.activeElement;
    if (!focused || !(focused === surface || surface.contains?.(focused))) return;
    if (fallback?.isConnected && fallback !== surface && !surface.contains?.(fallback)) {
        fallback.focus?.({preventScroll: true});
    }
    const remaining = doc?.activeElement;
    if (remaining === surface || surface.contains?.(remaining)) remaining?.blur?.();
}
