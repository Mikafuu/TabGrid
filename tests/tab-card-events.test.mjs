import test from 'node:test';
import assert from 'node:assert/strict';
import { attachCardIntent } from '../lib/tab-ui.mjs';

// Minimal event propagation harness: element blur reaches window capture
// listeners but does not bubble. A real window blur reaches window listeners.
class Target {
    listeners = [];
    addEventListener(type, listener, options = {}) { this.listeners.push({type, listener, capture: options.capture === true}); }
    fire(type, event, captureOnly = false) {
        for (const l of this.listeners) if (l.type === type && (!captureOnly || l.capture)) l.listener(event);
    }
}
test('changing focus between cards preserves the first click; actual window blur cancels it', () => {
    const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const document = new Target(), window = new Target(), container = new Target();
    let hit;
    document.elementFromPoint = () => hit;
    Object.defineProperty(globalThis, 'document', {value:document,configurable:true});
    Object.defineProperty(globalThis, 'window', {value:window,configurable:true});
    const cleanup = attachCardIntent(container);
    try {
        const click = (key, leaveWindow = false) => {
            const card = {dataset:{key}};
            const target = {closest: selector => selector === '.card' ? card : null}; hit = target;
            const pointer = {target,pointerId:1,clientX:10,clientY:20,pointerType:'mouse',isPrimary:true,button:0};
            container.fire('pointerdown', pointer);
            window.fire('blur', {target:leaveWindow ? window : target}, !leaveWindow);
            document.fire('pointerup', pointer);
            let prevented = false;
            container.fire('click', {target,detail:1,preventDefault(){prevented=true;},stopImmediatePropagation(){}});
            return prevented;
        };
        assert.equal(click('tab:1'), false);
        assert.equal(click('group:7'), false, 'focus moving from the tab to a group must not consume its click');
        assert.equal(click('tab:2'), false);
        assert.equal(click('tab:2', true), true, 'leaving the browser window still cancels pointer activation');
        assert.equal(click('tab:3'), false, 'a fresh click works after returning to the window');
    } finally {
        cleanup();
        if (previousDocument) Object.defineProperty(globalThis,'document',previousDocument); else delete globalThis.document;
        if (previousWindow) Object.defineProperty(globalThis,'window',previousWindow); else delete globalThis.window;
    }
});
