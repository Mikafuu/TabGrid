// Manual popovers let us consume the dismissing click instead of letting it
// activate a card underneath. A second click on the opener dismisses it too.
export function containMenuFocus(doc, current) {
    const controls = menu => [...menu.querySelectorAll('button, input, select, textarea, [tabindex]')]
        .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
    const focus = menu => controls(menu)[0]?.focus({ preventScroll: true });
    const consume = event => { event.preventDefault(); event.stopImmediatePropagation(); };
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick', 'contextmenu']) {
        doc.addEventListener(type, event => {
            const active = current();
            if (!active || active.menu.contains(event.target)) return;
            consume(event);
            if (type === 'click' || type === 'contextmenu') active.close();
        }, true);
    }
    doc.addEventListener('focusin', event => {
        const active = current();
        if (active && !active.menu.contains(event.target)) { event.stopImmediatePropagation(); focus(active.menu); }
    }, true);
    doc.addEventListener('keydown', event => {
        const active = current(); if (!active) return;
        if (event.key === 'Escape') { consume(event); active.escape(); return; }
        if (event.key === 'Tab') {
            consume(event);
            const items = controls(active.submenu || active.menu), index = items.indexOf(doc.activeElement);
            items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus({ preventScroll: true });
        } else if (!active.menu.contains(event.target)) { consume(event); focus(active.menu); }
    }, true);
}
