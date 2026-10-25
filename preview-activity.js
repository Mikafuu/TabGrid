// Isolated-world, top-frame activity signal. Never reads keys, form values,
// page text, or images; Chrome takes the screenshot in the service worker.
(() => {
    const api=globalThis.chrome, runtime=api?.runtime, storage=api?.storage;
    if (!runtime?.id || !storage?.local || api.extension?.inIncognitoContext) return;
    const previous=globalThis.__tabgridPreviewActivity;
    if(previous?.runtime===runtime&&previous.alive())return;
    previous?.dispose?.();
    const storageChanges=storage.onChanged,messageEvents=runtime.onMessage,extensionId=runtime.id;
    const marker={runtime,alive:()=>!disposed,dispose:()=>dispose()};
    globalThis.__tabgridPreviewActivity = marker;
    let enabled = false, timer, periodicTimer, lastSent = -Infinity, disposed = false, revision = 0, activityRevision = 0;
    // getRandomValues also works on ordinary HTTP pages.
    const documentId = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
    const visible = () => !document.hidden && document.hasFocus();
    const cancel = () => { clearTimeout(timer); timer = null; };
    function activity() {
        activityRevision++;
        cancel();
        if (!enabled || disposed || !visible()) return;
        timer = setTimeout(send, Math.max(400, 2000 - (Date.now() - lastSent)));
    }
    function periodic(){clearTimeout(periodicTimer);if(enabled&&!disposed&&visible())periodicTimer=setTimeout(()=>{activityRevision++;send();},15000);}
    async function send() {
        timer = null;
        if (!enabled || disposed || !visible()) return;
        lastSent = Date.now();
        try { await runtime.sendMessage({type: 'tabgrid-preview-activity'}); }
        catch { dispose(); } // Extension reload invalidates the old isolated world.
        periodic();
    }
    function preferences(prefs = {}) {
        const host = location.hostname.toLowerCase();
        enabled = prefs.capture !== false && !(prefs.previewSites || []).some(site => host === site || host.endsWith(`.${site}`));
        if (enabled) {activity();periodic();} else {cancel();clearTimeout(periodicTimer);}
    }
    function changed(changes, area) {
        if (area === 'local' && changes.tabgridPreferences) { revision++; preferences(changes.tabgridPreferences.newValue); }
    }
    function reportState(message, sender, respond) {
        if (message?.type !== 'tabgrid-preview-state' || sender.id !== extensionId) return;
        respond(enabled && !disposed && !document.hidden ? {documentId, revision:activityRevision} : null);
    }
    messageEvents?.addListener(reportState);
    const events = ['scroll', 'pointerup', 'keyup', 'input', 'change', 'resize', 'focus', 'pageshow'];
    const visibility = () => { if (document.hidden) {cancel();clearTimeout(periodicTimer);} else {activity();periodic();} };
    function dispose() {
        if(disposed)return;disposed = true; cancel();clearTimeout(periodicTimer);
        if(globalThis.__tabgridPreviewActivity===marker)delete globalThis.__tabgridPreviewActivity;
        for (const name of events) window.removeEventListener(name, activity, true);
        window.removeEventListener('blur', cancel);
        document.removeEventListener('visibilitychange', visibility);
        // Event objects themselves can throw after extension reload. Cleanup must
        // never replace the original connection failure with an unhandled error.
        try { storageChanges?.removeListener(changed); } catch {}
        try { messageEvents?.removeListener(reportState); } catch {}
    }
    for (const name of events) window.addEventListener(name, activity, {capture: true, passive: true});
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    storageChanges?.addListener(changed);
    // Do not overwrite a newer preference notification with the initial read.
    storage.local.get('tabgridPreferences').then(data => {
        if (!revision) preferences(data.tabgridPreferences);
    }).catch(dispose);
})();
