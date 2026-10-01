import { WindowOrder } from './lib/window-order.mjs';
import { Personalization } from './lib/personalization.mjs';
import { TabActions } from './lib/tab-actions.mjs';
import { isGridUrl } from './lib/tab-model.mjs';

const gridUrl = chrome.runtime.getURL('grid.html');
const actions = new TabActions(chrome, gridUrl);
const personalization = new Personalization(chrome, gridUrl);
let queue = Promise.resolve();
const windowOrder = new WindowOrder(chrome, actions.private);
const seedWindows = () => windowOrder.snapshot();
queue = queue.then(seedWindows,seedWindows);
chrome.windows.onCreated.addListener(win=>{const task=()=>windowOrder.created(win);queue=queue.then(task,task);queue.catch(()=>{});});
chrome.windows.onRemoved.addListener(id=>{const task=()=>windowOrder.removed(id);queue=queue.then(task,task);queue.catch(()=>{});});
chrome.action.onClicked.addListener(async tab => {
    const remember = () => actions.rememberOpened(`tab:${tab.id}`);
    queue = queue.then(remember, remember);
    await queue.catch(() => {});
    const existing = (await chrome.tabs.query({ windowId: tab.windowId })).find(t => isGridUrl(t.url, gridUrl));
    if (existing) await chrome.tabs.update(existing.id, { active: true });
    else await chrome.tabs.create({ url: gridUrl, windowId: tab.windowId });
});

// A restored grid is an ordinary extension page. Never close unrelated tabs or
// hijack Chrome's restore shortcut. Keep the grid available when switching tabs.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || !isGridUrl(sender.url, gridUrl) || message?.type !== 'tabgrid-action') return;
    const run = async () => {
        const { action, args = [] } = message;
        if (!Array.isArray(args)) throw new Error('Invalid action arguments');
        if (action === 'windowOrder') return windowOrder.snapshot();
        if (action === 'preferences') return personalization.preferences();
        if (action === 'updatePreferences') return personalization.updatePreferences(args[0]);
        if (action === 'searchHistory') return personalization.history(...args);
        if (action === 'preview') return personalization.preview(...args);
        if (action === 'importSettings') return personalization.import(...args);
        if (action === 'protectedGroups') return personalization.protectedGroups(...args);
        const allowed = ['close', 'undo', 'restoreSession', 'group', 'move', 'reorder', 'dropAt', 'rememberOpened', 'lastOpenedSnapshot', 'addLinks', 'returnActive', 'activitySnapshot', 'dropIntoGroup', 'newAfter', 'duplicate', 'siteSoundSnapshot', 'setSiteSound'];
        if (!allowed.includes(action)) throw new Error('Unknown tab action');
        if (action === 'undo') return actions.undo(args[0], sender.tab?.id ?? null);
        return actions[action](...args);
    };
    queue = queue.then(run, run);
    queue.then(result => respond({ result }), error => respond({ error: error.message }));
    return true;
});

function recordActivity(ids) {
    if (actions.private) return;
    const work = () => actions.returnActive(ids);
    queue = queue.then(work, work);
    queue.catch(() => {}); // A storage error must not interrupt ordinary tab use.
}
chrome.tabs.onActivated.addListener(info => {
    recordActivity([info.tabId]);
    const work = () => actions.rememberOpened(`tab:${info.tabId}`);
    queue = queue.then(work, work); queue.catch(() => {});
});
chrome.tabs.onUpdated.addListener((id, change, tab) => { if (change.url && tab.active) recordActivity([id]); });

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.tabgridPreferences) { personalization.previews.invalidate(); if (!actions.private) personalization.ready.then(() => personalization.previews.reconcile()).catch(() => {}); }
});
chrome.tabs.onActivated.addListener(info => { personalization.previews.invalidate(); if (!actions.private) setTimeout(() => personalization.ready.then(() => personalization.previews.capture(info.tabId)).catch(() => {}), 500); });
chrome.tabs.onUpdated.addListener((id, change, tab) => {
    if (!actions.private && !tab.incognito && change.url) personalization.previews.clear(id).catch(() => {});
    if (!actions.private && change.status === 'complete' && tab.active) personalization.ready.then(() => personalization.previews.capture(id)).catch(() => {});
});
chrome.tabs.onRemoved.addListener(id => { if (!actions.private) personalization.previews.clear(id).catch(() => {}); });
chrome.tabGroups.onRemoved.addListener(group => {
    personalization.protectedGroups().catch(() => {});
    chrome.storage.session.remove(`tabgridGroupView:${actions.private ? 'private' : 'regular'}:${group.id}`).catch(() => {});
});
chrome.windows.onRemoved.addListener(id => chrome.storage.session.remove(`tabgridView:${actions.private ? 'private' : 'regular'}:${id}`).catch(() => {}));
