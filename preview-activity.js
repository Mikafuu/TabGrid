// Isolated-world, top-frame activity signal. Never reads keys, form values,
// page text, or images; Chrome takes the screenshot in the service worker.
(() => {
    if (chrome.extension.inIncognitoContext || globalThis.__tabgridPreviewActivity) return;
    globalThis.__tabgridPreviewActivity = true;
    let enabled = false, timer, lastSent = -Infinity, disposed = false, revision = 0, activityRevision = 0;
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
    async function send() {
        timer = null;
        if (!enabled || disposed || !visible()) return;
        lastSent = Date.now();
        try { await chrome.runtime.sendMessage({type: 'tabgrid-preview-activity'}); }
        catch { dispose(); } // Extension reload invalidates the old isolated world.
    }
    function preferences(prefs = {}) {
        const host = location.hostname.toLowerCase();
        enabled = prefs.capture !== false && !(prefs.previewSites || []).some(site => host === site || host.endsWith(`.${site}`));
        if (enabled) activity(); else cancel();
    }
    function changed(changes, area) {
        if (area === 'local' && changes.tabgridPreferences) { revision++; preferences(changes.tabgridPreferences.newValue); }
    }
    function reportState(message, sender, respond) {
        if (message?.type !== 'tabgrid-preview-state' || sender.id !== chrome.runtime.id) return;
        respond(enabled && !disposed && !document.hidden ? {documentId, revision:activityRevision} : null);
    }
    chrome.runtime.onMessage.addListener(reportState);
    const events = ['scroll', 'pointerup', 'keyup', 'input', 'change', 'resize', 'focus', 'pageshow'];
    const visibility = () => { if (document.hidden) cancel(); else activity(); };
    function dispose() {
        disposed = true; cancel();
        for (const name of events) window.removeEventListener(name, activity, true);
        window.removeEventListener('blur', cancel);
        document.removeEventListener('visibilitychange', visibility);
        chrome.storage.onChanged.removeListener(changed);
        chrome.runtime.onMessage.removeListener(reportState);
    }
    for (const name of events) window.addEventListener(name, activity, {capture: true, passive: true});
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    chrome.storage.onChanged.addListener(changed);
    // Do not overwrite a newer preference notification with the initial read.
    chrome.storage.local.get('tabgridPreferences').then(data => {
        if (!revision) preferences(data.tabgridPreferences);
    }).catch(dispose);
})();
