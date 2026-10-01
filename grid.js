import { groupColors as colors, groupLabel, groupColorPicker } from './lib/group-presentation.mjs';
import { dragPolicy } from './lib/drag-policy.mjs';
import { numberedWindow } from './lib/window-order.mjs';
import { applyAppearance } from './lib/appearance.mjs';
import { createMaterialMotion, materialMotionAllowed, materialTiming } from './lib/material-motion.mjs';
import { DEFAULTS, PREFS_KEY, needsConfirmation, siteMatches } from './lib/preferences.mjs';
import { mountGroupDrawer } from './lib/group-drawer.mjs';
import { mountSettings } from './lib/settings-panel.mjs';
import { setupGridPersonalization } from './lib/grid-personalization.mjs';
import { isLastOpened, groupPreviewTiles } from './lib/tab-focus.mjs';
import Sortable, { AutoScroll } from './node_modules/sortablejs/modular/sortable.core.esm.js';
import autoAnimate from './node_modules/@formkit/auto-animate/index.mjs';
import { windowLabel, relativeTabIds, siteOrigins, anchoredMenuLayout } from './lib/tab-menu.mjs';
import { containMenuFocus } from './lib/menu-focus.mjs';
import { gridMotion } from './lib/tab-motion.mjs';
import { mergeVisibleOrder, keyFor, isGridUrl, matches, selectedTabs, openItems, recentItems } from './lib/tab-model.mjs';

import { dropTargetTabIds } from './lib/tab-gestures.mjs';
import { attachCardIntent, cardColumns, idleDays, selectionActive, acceptsGroupDrop, windowSections, UndoNotice } from './lib/tab-ui.mjs';
import { inactiveTabIds, bookmarkFolders } from './lib/tab-library.mjs';

Sortable.mount(new AutoScroll());

const privateMode = Boolean(chrome.extension?.inIncognitoContext);
const $ = id => document.getElementById(id);
const gridUrl = chrome.runtime.getURL('grid.html');
const state = { tabs: [], groups: [], screenshots: {}, recent: [], recentError: '', view: 'open', groupId: null, windowId: null, busy: false, dragging: false, revision: 0, returned: {}, lastOpened: {}, pointerDown: false, windowOrder: [] };
let preferences = structuredClone(DEFAULTS), features, settingsPanel, protectedGroups = [];
const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
const materialMotion = createMaterialMotion({ allowed: () => materialMotionAllowed(preferences.visualStyle, preferences.motion, motionMedia.matches), timing: () => materialTiming(preferences.visualStyle) });
document.querySelectorAll('dialog,[popover]').forEach(surface => materialMotion.native(surface));
motionMedia.addEventListener('change', () => {
    materialMotion.sync();
    if (motionMedia.matches) document.querySelectorAll('.card-surface').forEach(surface => surface.getAnimations().forEach(animation => animation.cancel()));
});
const selections = { root: new Set(), group: new Set() };
const selecting = { root: false, group: false };
const anchors = { root: null, group: null };
const visibleItems = { root: [], group: [] };
const sortables = new Map();
const animations = new Map();
const dropSortables = { root: [], group: [] };
const motionViews = new Map();
function captureGridLayout() {
    if (!materialMotionAllowed(preferences.visualStyle, preferences.motion, motionMedia.matches) || state.dragging) return;
    for (const motion of motionViews.values()) motion.captureLayout();
}
function flushGridLayout() {
    if (!materialMotionAllowed(preferences.visualStyle, preferences.motion, motionMedia.matches) || state.dragging) return;
    for (const container of motionViews.keys()) {
        // A non-card cue only asks the existing plugin to move live surfaces.
        const cue=document.createElement('span');cue.hidden=true;cue.dataset.motionCue='';container.append(cue);cue.remove();
    }
}
const intentCleanup = new Map();
const windowViews = new Map();
let refreshTimer;
let refreshPending = false;
let statusTimer;
let groupOpener;
let recentRevision = 0;
let actionHandler;
let pendingNewTab = null;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function button(text, handler, className = '') {
    const node = el('button', className, text); node.type = 'button';
    node.addEventListener('click', handler); return node;
}
function announce(message, error = false) {
    $('status').textContent = message;
    $('status').setAttribute('role', error ? 'alert' : 'status');
    $('group-feedback').textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { $('status').textContent = ''; }, 10000);
}
async function rpc(action, ...args) {
    const response = await chrome.runtime.sendMessage({ type: 'tabgrid-action', action, args });
    if (response?.error) throw new Error(response.error);
    return response?.result;
}
async function run(work, success = '') {
    if (state.busy) return;
    state.busy = true; syncSelection();
    try {
        const result = await work();
        if (result?.error) announce(result.error, true);
        else if (success) announce(success);
        return result;
    } catch (error) { announce(error.message || 'The action could not be completed.', true); }
    finally { state.busy = false; await refresh(); await refreshRecent(); await updateUndo(); syncSelection(); }
}
function scopeNow() { return $('group-dialog').open ? 'group' : 'root'; }
function tabIds(scope) { return selectedTabs(selections[scope], state.tabs).map(t => t.id); }
function actionTabs(scope) { return features?.hasFilters(scope) ? selectedTabs(new Set(visibleItems[scope].map(item => item.key)), state.tabs) : state.tabs; }
function currentGroup() { return state.groups.find(g => g.id === state.groupId); }
function image(src, className) {
    const img = el('img', className); img.alt = ''; img.draggable = false; img.src = src;
    img.addEventListener('error', () => { if (!img.src.endsWith('/tileIcon.png')) img.src = 'tileIcon.png'; });
    return img;
}
function favicon(tab) {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', tab.url || ''); url.searchParams.set('size', '32');
    return url.href;
}
function domain(url) { try { return new URL(url).hostname || url; } catch { return url || 'New tab'; } }
function focusToken() {
    const active = document.activeElement;
    const card = active?.closest('[data-key]');
    return card ? { key: card.dataset.key, part: active.dataset.part, parent: card.parentElement.id } : null;
}
function restoreFocus(token) {
    if (!token || document.activeElement?.closest('#action-dialog, #context-menu')) return;
    const container = $(token.parent);
    const card = [...(container?.children || [])].find(c => c.dataset.key === token.key);
    const target = card?.querySelector(`[data-part="${token.part || 'open'}"]`) || container?.querySelector('.card-open, [data-part=open]');
    target?.focus({ preventScroll: true });
}

function buildToolbar(scope) {
    const bar = el('div', 'toolbar'); bar.setAttribute('aria-label', 'Tab selection actions');
    const toggle = button('Select', () => {
        selecting[scope] = !(selecting[scope] || selections[scope].size > 0);
        if (!selecting[scope]) selections[scope].clear();
        syncSelection();
    }); toggle.dataset.role = 'toggle';
    bar.append(toggle);
    const count = el('span', 'selection-count'); count.dataset.role = 'count'; count.setAttribute('aria-live', 'polite'); bar.append(count);
    const actions = [
        ['Select all', () => { selecting[scope] = true; selections[scope] = new Set(visibleItems[scope].map(i => i.key)); syncSelection(); }, false],
        ['Clear', () => { selections[scope].clear(); syncSelection(); }, true],
        ['Edit', e => showSelectionMenu(scope, e), true]
    ];
    actions.forEach(([label, handler, needsSelection]) => {
        const b = button(label, handler); b.dataset.role = 'selection-action'; b.dataset.needsSelection = needsSelection;
        if (label === 'Edit') { b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Edit selected tabs'); }
        bar.append(b);
    });
    return bar;
}
$('root-toolbar').append(buildToolbar('root')); $('group-toolbar').append(buildToolbar('group'));
function syncSelection(layout=true) {
    if(layout)captureGridLayout();
    const finishMotion=materialMotion.capture([$('root-toolbar'),$('group-toolbar')]);
    for (const scope of ['root', 'group']) {
        const keys = selections[scope];
        const hasSelection = keys.size > 0;
        const active = selecting[scope] || hasSelection;
        const bar = $(`${scope}-toolbar`);
        bar.hidden = scope === 'group' && !active;
        bar.querySelector('[data-role=toggle]').textContent = active ? 'Done' : 'Select';
        bar.querySelector('[data-role=toggle]').setAttribute('aria-pressed', String(active));
        bar.querySelector('[data-role=count]').textContent = active ? `${tabIds(scope).length} ${tabIds(scope).length === 1 ? 'tab' : 'tabs'} selected` : '';
        bar.querySelectorAll('[data-role=selection-action]').forEach(b => { b.hidden = !active || (b.dataset.inactive && state.view !== 'inactive'); b.disabled = state.busy || (b.dataset.needsSelection === 'true' && !hasSelection); });
        const containers = scopeGrids(scope);
        containers.forEach(container => { container.classList.toggle('selecting', active); [...container.children].forEach(card => {
            const selected = keys.has(card.dataset.key);
            card.classList.toggle('selected', selected);
            const checkbox = card.querySelector('.card-select');
            if (checkbox) { checkbox.hidden = !active; checkbox.checked = selected; }
            card.querySelectorAll('.card-menu, .card-close').forEach(b => { b.hidden = active; });
            const open = card.querySelector('.card-open');
            if (open) { if (active) open.setAttribute('aria-pressed', String(selected)); else open.removeAttribute('aria-pressed'); }
        }); });
    }
    $('root-toolbar').hidden = !selectionActive(selecting.root, selections.root);
    finishMotion();if(layout)flushGridLayout();
    $('undo-btn').disabled = state.busy;
    for (const [container, sortable] of sortables) { sortable.option('disabled', !canDrag(container)); sortable.option('sort', canReorder(container)); }
    if (!state.dragging) renderDropTargets();
}
function selectItem(item, scope, event) {
    const keys = selections[scope];
    if (event.shiftKey && anchors[scope]) {
        const order = visibleItems[scope].map(i => i.key);
        const a = order.indexOf(anchors[scope]), b = order.indexOf(item.key);
        if (a >= 0 && b >= 0) { keys.clear(); order.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(k => keys.add(k)); }
    } else {
        if (keys.has(item.key)) keys.delete(item.key); else keys.add(item.key);
        anchors[scope] = item.key;
    }
    selecting[scope] = true; syncSelection();
}
async function activate(item, scope, event) {
    if (state.dragging || (event.detail !== 0 && Date.now() < (state.dragEnded || 0) + 250)) return;
    if (selecting[scope] || event.ctrlKey || event.metaKey || event.shiftKey) { selectItem(item, scope, event); return; }
    await features?.consume(scope);
    if (item.kind === 'group') openGroup(item.group.id);
    else await run(async () => { await rpc('rememberOpened', item.key); await chrome.tabs.update(item.tab.id, { active: true }); await chrome.windows.update(item.tab.windowId, { focused: true }); });
}
function createCard(item, scope) {
    const data = item.tab || item.group;
    const title = data.title || (item.kind === 'group' ? 'Untitled group' : data.url || 'New tab');
    const card = el('article', `card ${item.kind === 'group' ? 'group-card' : ''}`);
    card.dataset.key = item.key; card.dataset.kind = item.kind; card.itemModel = item;
    const info = el('div', 'card-info');
    const check = el('input', 'card-select'); check.type = 'checkbox'; check.dataset.part = 'select'; check.setAttribute('aria-label', `Select ${title}`);
    check.addEventListener('click', e => { e.stopPropagation(); selectItem(item, scope, e); }); info.append(check);
    if (item.tab) info.append(image(favicon(item.tab), 'favicon'));
    else { const dot = el('span', 'group-color-dot'); dot.setAttribute('aria-hidden', 'true'); info.append(dot); }
    const name = el('span', 'card-title', title); name.title = title; info.append(name);
    const menu = button('⋮', e => showMenu(item, scope, e), 'card-menu'); menu.setAttribute('aria-label', `Actions for ${title}`); menu.dataset.part = 'menu'; menu.setAttribute('aria-haspopup', 'menu'); menu.setAttribute('aria-expanded', 'false');
    const close = button('×', () => item.kind === 'group' ? confirmClose(item.members.map(t => t.id), `Close “${title}”?`) : closeTabs([item.tab.id]), 'card-close'); close.setAttribute('aria-label', `Close ${title}`); close.dataset.part = 'close'; info.append(menu, close);
    const open = el('button', 'card-open'); open.type = 'button'; open.dataset.part = 'open'; open.setAttribute('aria-label', `${item.kind === 'group' ? 'Open group' : 'Switch to'} ${title}`);
    const preview = el('div', 'card-preview');
    if (item.kind === 'group') {
        card.style.setProperty('--group-color', colors[data.color]);
        preview.classList.add('group-preview');
        preview.setAttribute('aria-hidden', 'true');
        for (const tile of groupPreviewTiles(item.members)) {
            const cell = el('div', 'group-tile');
            if (tile.tab) {
                const screenshot = state.screenshots[`screenshot_${tile.tab.id}`];
                cell.title = tile.tab.title || tile.tab.url || 'New tab';
                if (screenshot) cell.append(image(screenshot, 'preview-image'));
                cell.append(image(favicon(tile.tab), 'tile-favicon'));
            } else if (tile.remaining) {
                cell.classList.add('group-overflow'); cell.textContent = `+${tile.remaining}`;
                cell.title = `${tile.remaining} more tabs`;
            } else cell.classList.add('group-tile-empty');
            preview.append(cell);
        }
    } else {
        const screenshot = state.screenshots[`screenshot_${data.id}`];
        preview.append(image(screenshot || favicon(data), screenshot ? 'preview-image' : 'fallback'));
        if (scope === 'group') preview.append(image(favicon(data), 'preview-favicon'));
    }
    const details = [];
    if (item.tab) {
        if (data.pinned) details.push('Pinned'); if (data.audible) details.push('Playing audio'); if (data.mutedInfo?.muted) details.push('Muted');
        if (preferences.showAddress) details.push(domain(data.url));
        if (preferences.showGroup && scope === 'root' && $('search-input').value.trim() && $('opt-nested').checked && data.groupId !== -1) details.push(state.groups.find(g=>g.id===data.groupId)?.title || 'Untitled group');
        if (preferences.showLastUsed) details.push(Number.isFinite(data.lastAccessed) && data.lastAccessed > 0 ? `Last used ${new Date(data.lastAccessed).toLocaleString()}` : 'Last used unavailable');
    } else details.push(`${item.members.length} ${item.members.length===1?'tab':'tabs'}`);
    if (preferences.showWindow) details.push(numberedWindow(data.windowId, state.windowOrder));
    open.append(preview, el('div', 'card-meta', details.join(' · ')));
    const surface = el('div', 'card-surface'); surface.append(info, open); card.append(surface);
    card.addEventListener('click', e => { if (!e.target.closest('.card-menu, .card-close, input')) activate(card.itemModel, scope, e); });
    card.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (selectionActive(selecting[scope], selections[scope])) {
            selections[scope].add(card.itemModel.key); anchors[scope] = card.itemModel.key; selecting[scope] = true; syncSelection();
            showSelectionMenu(scope, e);
        } else showMenu(card.itemModel, scope, e);
    });
    return card;
}
function paintCards(container, items, scope) {
    // Keyed reconciliation keeps focused cards and animation ownership stable.
    const liveChildren = () => [...container.children].filter(c => c.dataset.key && c.itemModel);
    const old = new Map(liveChildren().map(c => [c.dataset.key, c]));
    const wanted = new Set(items.map(i => i.key));
    for (const child of liveChildren()) if (!wanted.has(child.dataset.key)) {
        delete child.dataset.key; delete child.dataset.kind;
        child.inert = true; child.setAttribute('aria-hidden', 'true'); child.remove();
    }
    items.forEach((item, index) => {
        const signature = JSON.stringify([preferences.showAddress, preferences.showLastUsed, preferences.showWindow, preferences.showGroup, state.windowOrder, Boolean($(scope === 'group' ? 'group-search' : 'search-input').value.trim()), $('opt-nested').checked, Boolean(features?.hasFilters(scope)), item.tab || item.group, item.members?.map(t => [t.id, t.index, t.title, t.url, state.screenshots[`screenshot_${t.id}`]]), state.screenshots[`screenshot_${item.tab?.id}`], $('opt-all-windows').checked]);
        let card = old.get(item.key);
        if (!card) card = createCard(item, scope);
        else if (card.dataset.signature !== signature) {
            Object.assign(card.itemModel, item);
            const next = createCard(card.itemModel, scope);
            // Keep the animated surface alive across native index/title updates.
            card.querySelector('.card-surface').replaceChildren(...next.querySelector('.card-surface').childNodes);
            card.style.cssText = next.style.cssText;
        }
        card.dataset.signature = signature;
        card.classList.toggle('last-opened', isLastOpened(item, state.lastOpened));
        const open = card.querySelector('.card-open');
        if (isLastOpened(item, state.lastOpened)) open.setAttribute('aria-description', 'Last opened');
        else open.removeAttribute('aria-description');
        if (liveChildren()[index] !== card) container.insertBefore(card, liveChildren()[index] || null);
    });
}
function gridPolicy(container) {
    const scope=container.dataset.scope||'root';
    return dragPolicy({query:$(scope==='group'?'group-search':'search-input').value,filters:features?.filters[scope],sort:$('sort-select').value,view:scope==='group'?'open':state.view,selecting:selectionActive(selecting[scope],selections[scope]),busy:state.busy});
}
function canReorder(container) { return gridPolicy(container).reorder; }
function canDrag(container) { return gridPolicy(container).drag; }
function gridWindow(container) { return Number(container.dataset.windowId)||(container=== $('group-grid')?currentGroup()?.windowId:state.windowId); }
function gridPinned(container) { return container.dataset.pinned==='true'||container===$('pinned-grid'); }
const drawers = Object.fromEntries(['root', 'group'].map(scope => [scope, mountGroupDrawer($(`${scope}-drop-targets`), {
    getPrefs: () => preferences, save: savePreferences, dragging: () => state.dragging, announce, motion: materialMotion
})]));
function renderDropTargets() {
    for (const scope of ['root', 'group']) {
        const tray = $(`${scope}-drop-targets`);
        const enabled = preferences.dropGroups && (scope === 'root' ? state.view !== 'recent' : state.groupId !== null);
        tray.hidden = !enabled;
        if (!enabled) { drawers[scope].collapse(); continue; }
        const windowId = scope === 'group' ? currentGroup()?.windowId : state.windowId;
        const groups = state.groups.filter(g => (scope==='root'&&$('opt-all-windows').checked||g.windowId === windowId) && (scope !== 'group' || g.id !== state.groupId));
        const signature = JSON.stringify([windowId, groups.map(g => [g.id, g.title, g.color, g.windowId])]);
        if (tray.dataset.signature !== signature) {
            const focusedDestination = tray.contains(document.activeElement) ? document.activeElement.dataset.destination : null;
            dropSortables[scope].forEach(s => s.destroy()); dropSortables[scope] = [];
            drawers[scope].list.replaceChildren(); tray.dataset.signature = signature;
            const destinations = [['new', 'New group'], ['ungroup', 'Ungroup'], ...groups.map(g => [g.id, g.title || 'Untitled group'])];
            for (const [destination, label] of destinations) {
                const target = el('div', 'drop-target'); target.dataset.destination = destination; const destinationGroup = groups.find(g => g.id === destination); if (destinationGroup) { target.classList.add('group-drop-target'); target.style.setProperty('--group-color', colors[destinationGroup.color] || colors.grey); } const receiver = el('div', 'drop-receiver'); receiver.dataset.destination = destination; receiver.dataset.windowId = destinationGroup?.windowId || windowId; receiver.dataset.scope = scope; receiver.setAttribute('aria-hidden', 'true');
                const action = button(label, async () => {
                    const ids = tabIds(scope);
                    if (!ids.length) { announce('Select tabs, then choose a group target, or drag a tab card here.'); return; }
                    await run(() => rpc('dropIntoGroup', ids, destination, destinationGroup?.windowId || windowId), destination === 'ungroup' ? 'Tabs ungrouped.' : 'Tabs grouped.');
                    drawers[scope].collapse();
                }); if (destinationGroup) action.replaceChildren(groupLabel(destinationGroup)); action.dataset.destination = destination; action.setAttribute('aria-label', `${destination === 'ungroup' ? 'Ungroup selected tabs' : `Move selected tabs to ${label}`}`); target.append(action, receiver); drawers[scope].list.append(target);
                dropSortables[scope].push(Sortable.create(receiver, {
                    group: { name: 'tabgrid', pull: false, put(to, from, card) { return (acceptsGroupDrop(card) || destination === 'ungroup' && card.dataset.kind === 'group' && /^group:\d+$/.test(card.dataset.key)) && state.dragging && preferences.dropGroups && from.el.dataset.scope === scope; } },
                    draggable: '.card[data-key]', sort: false, animation: 0,
                    selectedClass: 'sortable-selected', ghostClass: 'sortable-ghost'
                }));
            }
            if (focusedDestination !== null) [...tray.querySelectorAll('button')].find(b => b.dataset.destination === focusedDestination)?.focus({ preventScroll: true });
        }
        tray.querySelectorAll('button').forEach(b => { b.disabled = state.busy; });
        drawers[scope].sync();
    }
}
function scopeGrids(scope) {
    return [...document.querySelectorAll('.grid-container[data-scope]')].filter(c => c.dataset.scope === scope && sortables.has(c) && !c.closest('[hidden]'));
}
function registerGrid(container, scope) {
    container.dataset.scope = scope;
    intentCleanup.set(container, attachCardIntent(container));
    const motion = gridMotion(container, { reducedMotion: () => preferences.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches, layoutTiming: () => materialTiming(preferences.visualStyle) });
    animations.set(container, autoAnimate(container, motion.plugin));motionViews.set(container,motion);
    sortables.set(container, Sortable.create(container, {
        group: { name: 'tabgrid', pull: true, put(to,from,card){return to.el.dataset.scope===from.el.dataset.scope&&canDrag(to.el)&&gridPinned(to.el)===Boolean(card.itemModel?.tab?.pinned)&&!(to.el===$('group-grid')&&card.dataset.kind==='group');} },
        sort:canReorder(container),
        animation: 0, forceFallback: true, fallbackOnBody: scope !== 'group', supportPointer: false, draggable: '.card[data-key]',
        fallbackTolerance: 6, delay: 250, delayOnTouchOnly: true, touchStartThreshold: 2,
        filter(event) { return Boolean(event.target.closest('.card-menu, .card-close, input')) || !canDrag(container); },
        preventOnFilter: false, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
        onMove(evt) { motionViews.get(evt.from)?.capture(); if(evt.to!==evt.from)motionViews.get(evt.to)?.capture(); },
        onClone(evt) {
            // Sortable's temporary copy is not a live card, even if auto-animate
            // briefly retains it to finish a removal.
            delete evt.clone.dataset.key; delete evt.clone.dataset.kind;
            evt.clone.inert = true; evt.clone.setAttribute('aria-hidden', 'true');
        },
        onStart(evt) {
            closeMenu();
            state.dragging = true; document.body.classList.add('dragging');
            document.body.classList.toggle('dragging-group', evt.item.dataset.kind === 'group');
            Object.values(drawers).forEach(drawer => drawer.sync());
        },
        async onEnd(evt) {
            Object.values(drawers).forEach(drawer => drawer.collapse());
            state.dragging = false; document.body.classList.remove('dragging', 'dragging-group'); state.dragEnded = Date.now();
            if (evt.to.dataset.destination) {
                const raw = evt.to.dataset.destination;
                try {
                    const ids = await dropTargetTabIds([evt.item], raw, id => chrome.tabs.query({groupId:id}));
                    await run(() => rpc('dropIntoGroup', ids, ['new', 'ungroup'].includes(raw) ? raw : Number(raw), Number(evt.to.dataset.windowId)), raw === 'ungroup' ? 'Tabs ungrouped.' : 'Tabs grouped.');
                } catch (error) { announce(error.message, true); await refresh(); }
                finally {
                    evt.to.querySelectorAll('.card').forEach(c => { c.remove(); });
                    animations.get(container).enable();
                    if (refreshPending) scheduleRefresh();
                }
                return;
            }
            const target=evt.to,source=evt.from,targetCanReorder=canReorder(evt.to);
            if(target===source&&evt.oldIndex===evt.newIndex){syncSelection();if(refreshPending)scheduleRefresh();return;}
            await run(async()=>{
                if(target!==source){
                    const cards=[...target.children].filter(c=>c.dataset.key&&c.itemModel),index=cards.indexOf(evt.item),following=cards[index+1],previous=cards[index-1];
                    const anchor=targetCanReorder?following?.dataset.key||previous?.dataset.key||null:null;
                    return rpc('dropAt',{keys:[evt.item.dataset.key],windowId:gridWindow(target),pinned:gridPinned(target),anchor,after:!following&&Boolean(previous)});
                }
                let keys=[...target.children].filter(c=>c.dataset.key&&c.itemModel).map(c=>c.dataset.key);
                const groupFilter=features?.filters[scope].groups;
                const groupId=scope==='group'?state.groupId:groupFilter?.length===1?groupFilter[0]:null;
                if(groupId!==null){
                    const allKeys=state.tabs.filter(t=>t.groupId===groupId).sort((a,b)=>a.index-b.index).map(t=>`tab:${t.id}`);keys=mergeVisibleOrder(allKeys,keys);
                }else{
                    const allKeys=openItems(state.tabs,state.groups,{windowId:gridWindow(target)}).filter(item=>Boolean(item.tab?.pinned)===gridPinned(target)).map(item=>item.key);keys=mergeVisibleOrder(allKeys,keys);
                }
                return rpc('reorder',{keys,windowId:gridWindow(target),groupId,pinned:gridPinned(target)});
            });
            animations.get(container).enable();
            if (refreshPending) scheduleRefresh();
        }
    }));
}

function unregisterGrid(container) {
    sortables.get(container)?.destroy(); sortables.delete(container);
    animations.get(container)?.disable(); animations.delete(container);
    motionViews.delete(container);
    intentCleanup.get(container)?.(); intentCleanup.delete(container);
}
for (const container of [$('grid'), $('pinned-grid'), $('group-grid')]) registerGrid(container, container === $('group-grid') ? 'group' : 'root');

function paintWindowSections(items) {
    const sections = $('opt-all-windows').checked ? state.windowOrder.map(windowId=>({windowId,items:items.filter(i=>i.windowId===windowId)})) : windowSections(items,state.windowId);
    const ids = new Set(sections.map(s => s.windowId));
    for (const [id, view] of windowViews) if (!ids.has(id)) {
        unregisterGrid(view.pinned); unregisterGrid(view.regular); view.section.remove(); windowViews.delete(id);
    }
    const ordered = [];
    for (const { windowId, items: members } of sections) {
        let view = windowViews.get(windowId);
        if (!view) {
            const section = el('section', 'window-section');
            const title = el('h3'); title.id = `window-${windowId}-heading`; section.setAttribute('aria-labelledby', title.id);
            const pinnedArea = el('div', 'window-pinned'); pinnedArea.append(el('h4', '', 'Pinned'));
            const pinned = el('div', 'grid-container'); pinned.id = `window-${windowId}-pinned`;pinned.dataset.windowId=windowId;pinned.dataset.pinned='true';
            const regular = el('div', 'grid-container'); regular.id = `window-${windowId}-grid`;regular.dataset.windowId=windowId;
            pinnedArea.append(pinned); section.append(title, pinnedArea, regular);
            view = { section, title, pinnedArea, pinned, regular }; windowViews.set(windowId, view);
            $('window-sections').append(section); registerGrid(pinned, 'root'); registerGrid(regular, 'root');
        }
        const count = new Set(members.flatMap(i => i.members?.map(t => t.id) || [i.tab.id])).size;
        view.title.textContent = `${numberedWindow(windowId,state.windowOrder)}${windowId===state.windowId?' · This window':''} · ${count} ${count===1?'tab':'tabs'}`;
        const pinned = members.filter(i => i.tab?.pinned), regular = members.filter(i => !i.tab?.pinned);
        paintCards(view.pinned, pinned, 'root'); paintCards(view.regular, regular, 'root'); view.pinnedArea.hidden = !pinned.length && !state.tabs.some(t=>t.pinned);
        $('window-sections').append(view.section); ordered.push(...pinned, ...regular);
    }
    return ordered;
}

function render() {
    if (state.pointerDown || state.dragging) { refreshPending = true; return; }
    captureGridLayout();
    const finishNavigation=materialMotion.capture([document.querySelector('.sources')]);
    features?.sync();
    const token = focusToken();
    const query = $('search-input').value.trim();
    document.querySelector('[data-view=all]').hidden = !query;
    document.querySelectorAll('[data-view]').forEach(b => { if (b.dataset.view === state.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('open-section').hidden = !['open', 'all', 'inactive'].includes(state.view);
    $('recent-section').hidden = privateMode || !['recent', 'all'].includes(state.view) || (state.view === 'all' && features?.hasFilters('root'));
    $('tab-count').textContent = `(${state.tabs.filter(t => $('opt-all-windows').checked || t.windowId === state.windowId).length})`;
    const inactive = privateMode ? new Set() : inactiveTabIds(state.tabs, preferences.inactiveDays, state.returned, Date.now(), { sites: preferences.idleSites, groups: protectedGroups });
    const shown = state.tabs.filter(t => state.view === 'inactive' ? inactive.has(t.id) : state.view === 'all' || !inactive.has(t.id));
    const items = openItems(shown, state.groups, { windowId: state.windowId, allWindows: $('opt-all-windows').checked, query, nested: $('opt-nested').checked, showGroups: $('opt-groups').checked, sort: $('sort-select').value, preferences, filters: features?.filters.root });
    const allWindows = $('opt-all-windows').checked;
    $('window-sections').hidden = !allWindows; $('grid').hidden = allWindows;
    const pinned = items.filter(i => i.tab?.pinned), regular = items.filter(i => !i.tab?.pinned);
    visibleItems.root = allWindows ? paintWindowSections(items) : [...pinned, ...regular];
    if (allWindows) { paintCards($('pinned-grid'), [], 'root'); paintCards($('grid'), [], 'root'); }
    else { paintWindowSections([]); paintCards($('pinned-grid'), pinned, 'root'); paintCards($('grid'), regular, 'root'); }
    const visibleKeys = new Set(visibleItems.root.map(i => i.key));
    selections.root = new Set([...selections.root].filter(k => visibleKeys.has(k)));
    $('pinned-section').hidden = allWindows || !pinned.length; $('open-empty').hidden = Boolean(items.length);
    $('open-empty').textContent = query ? 'No open tabs match your search.' : 'No tabs in this view. Open a new tab to get started.';
    if (state.groupId !== null) {
        const group = currentGroup();
        if (!group) $('group-dialog').close();
        else {
            $('group-heading').replaceChildren(groupLabel(group),document.createTextNode(` (${state.tabs.filter(t => t.groupId === group.id).length})`));
            const groupItems = openItems(state.tabs, state.groups, { windowId: group.windowId, groupId: group.id, query: $('group-search').value, sort: $('sort-select').value, preferences, filters: features?.filters.group });
            visibleItems.group = groupItems;
            selections.group = new Set([...selections.group].filter(k => groupItems.some(i => i.key === k)));
            paintCards($('group-grid'), groupItems, 'group'); $('group-empty').hidden = Boolean(groupItems.length);
        }
    }
    renderSessions('recent', state.recent, state.recentError, 'No recently closed tabs are available.');
    for(const scope of ['root','group']){const tip=$(`${scope}-drag-tip`),policy=gridPolicy($(scope==='root'?'grid':'group-grid'));tip.textContent=policy.tip;tip.hidden=!policy.tip;}
    syncSelection(false); restoreFocus(token); scrollToCreatedTab(); flushGridLayout();finishNavigation();
}
function renderSessions(source, items, error, empty) {
    const query = $('search-input').value;
    const filtered = items.filter(item => matches(item, query, preferences));
    const list = $(`${source}-list`);
    const signature = JSON.stringify(filtered);
    if (list.dataset.signature !== signature) {
        list.dataset.signature = signature; list.replaceChildren();
        for (const item of filtered) {
            const row = el('div', 'session-row'); row.dataset.key = item.key;
            const details = el('div', 'session-details'); details.append(el('p', 'session-title', item.title));
            const when = item.time ? new Date(item.time * 1000).toLocaleString() : '';
            details.append(el('div', 'session-meta', `${item.isWindow ? 'Closed window' : domain(item.url)}${when ? ` · ${when}` : ''}`));
            const action = button(item.isWindow ? 'Restore window' : 'Restore tab', () => run(async () => {
                await features?.record('root');
                await rpc('restoreSession', item.sessionId);
                await refreshRecent();
            }, 'Session restored.')); action.dataset.part = 'open'; action.setAttribute('aria-label', `${action.textContent}: ${item.title}`);
            row.append(details, action); list.append(row);
        }
    }
    $(`${source}-empty`).hidden = filtered.length > 0 && !error;
    $(`${source}-empty`).textContent = error || (query && items.length ? 'No matches in this section.' : empty);
}
async function refresh() {
    if (state.pointerDown || state.dragging || state.busy) { refreshPending = true; return; }
    const revision = ++state.revision;
    try {
        const [tabs, groups, windowOrder] = await Promise.all([chrome.tabs.query({}), chrome.tabGroups.query({}), rpc('windowOrder')]);
        const safeTabs = tabs.filter(t => Boolean(t.incognito) === privateMode && !isGridUrl(t.url || t.pendingUrl, gridUrl));
        const [screenshots, lastOpened] = await Promise.all([privateMode ? {} : chrome.storage.local.get(safeTabs.map(t => `screenshot_${t.id}`)), rpc('lastOpenedSnapshot')]);
        if (!privateMode) {
            state.returned = await rpc('activitySnapshot');
        }
        if (revision !== state.revision || state.pointerDown || state.dragging || state.busy) { refreshPending = true; return; }
        state.windowOrder = windowOrder || [...new Set(safeTabs.map(t=>t.windowId))]; state.lastOpened = lastOpened || {}; state.tabs = safeTabs; state.groups = groups; state.screenshots = screenshots; refreshPending = false; render();
    } catch (error) { announce(`Could not refresh tabs: ${error.message}`, true); }
}
function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 100); }
async function refreshRecent() {
    if (privateMode) return;
    const revision = ++recentRevision;
    try { const sessions = await chrome.sessions.getRecentlyClosed(); if (revision !== recentRevision) return; state.recent = recentItems(sessions, gridUrl); state.recentError = ''; }
    catch { state.recentError = 'Recently closed tabs could not be loaded. Try Refresh.'; }
    if (!state.dragging && !state.busy) render();
}
function placeUndo() {
    const toast = $('undo-toast');
    const host = $('settings-dialog').open ? $('settings-dialog') : $('action-dialog').open ? $('action-dialog') : $('group-dialog').open ? $('group-dialog') : document.body;
    if (toast.parentElement !== host) host.append(toast);
}
const undoNotice = new UndoNotice({ duration: () => preferences.undoMs, change(entry) {
    const toast = $('undo-toast');
    const focused = toast.contains(document.activeElement);
    toast.hidden = !entry;
    materialMotion.reveal(toast,Boolean(entry));
    if (entry) $('undo-message').textContent = `${entry.tabs.filter(t => t.state === 'closed').length} closed tab(s)`;
    else if (focused) ($('action-dialog').open ? $('action-cancel') : $('group-dialog').open ? $('group-done') : $('search-input')).focus({ preventScroll: true });
    placeUndo();
} });
let undoRevision = 0;
async function updateUndo() {
    if (privateMode) { undoNotice.dismiss(); return; }
    const revision = ++undoRevision;
    const { tabgridUndo = [] } = await chrome.storage.session.get('tabgridUndo');
    if (revision === undoRevision) undoNotice.observe(tabgridUndo);
}
$('undo-toast').addEventListener('pointerenter', () => undoNotice.pause('hover'));
$('undo-toast').addEventListener('pointerleave', () => undoNotice.resume('hover'));
$('undo-toast').addEventListener('focusin', () => undoNotice.pause('focus'));
$('undo-toast').addEventListener('focusout', e => { if (!$('undo-toast').contains(e.relatedTarget)) undoNotice.resume('focus'); });
let modalScroll;
function syncModal() {
    const menuOpen = $('context-menu').matches(':popover-open') || $('page-menu').matches(':popover-open');
    const open = $('group-dialog').open || $('action-dialog').open || $('settings-dialog').open || menuOpen;
    document.documentElement.classList.toggle('menu-open', menuOpen);
    document.querySelectorAll('.card.menu-active').forEach(card => card.classList.remove('menu-active'));
    if ($('context-menu').matches(':popover-open') && menuFocus?.key) {
        const container = menuFocus.scope === 'group' ? $('group-grid') : document.querySelector('main');
        [...container.querySelectorAll('.card')].find(card => card.dataset.key === menuFocus.key)?.classList.add('menu-active');
    }
    if (open && !document.documentElement.classList.contains('modal-open')) modalScroll = { x: scrollX, y: scrollY };
    document.documentElement.classList.toggle('modal-open', open);
    if (!open && modalScroll) { window.scrollTo(modalScroll.x, modalScroll.y); modalScroll = null; }
    placeUndo();
}
async function closeTabs(ids, confirmed = false) {
    ids = [...new Set(ids)].filter(id => state.tabs.some(t => t.id === id));
    if (!ids.length) return;
    if (!confirmed && needsConfirmation(ids.length, preferences)) { showCloseConfirmation(ids, 'Close selected tabs?'); return; }
    const result = await run(() => rpc('close', ids));
    if (result?.count && !result.error) announce(`${result.count} tab(s) closed.${privateMode ? '' : ' Undo is available.'}`);
}
function showAction(title, fields, handler, submit = 'Apply') {
    features?.hideHistory(); closeMenu();
    $('action-title').textContent = title; $('action-fields').replaceChildren(...fields); $('action-submit').textContent = submit; $('action-submit').disabled = false; $('action-error').textContent = '';
    actionHandler = handler; $('action-dialog').showModal(); syncModal();
}
function field(label, input) { const wrapper = el('label', input.type === 'checkbox' ? 'checkbox-label' : ''); wrapper.append(document.createTextNode(label), input); return wrapper; }
function options(entries) { const select = el('select'); entries.forEach(([value, text]) => { const o = el('option', '', text); o.value = value; select.append(o); }); return select; }
function confirmClose(ids, title) {
    ids = [...new Set(ids)].filter(id => state.tabs.some(t => t.id === id));
    if (!ids.length) return;
    if (!needsConfirmation(ids.length, preferences)) { closeTabs(ids, true); return; }
    showCloseConfirmation(ids, title);
}
function showCloseConfirmation(ids, title) {
    showAction(title, [el('p', '', `${ids.length} ${ids.length === 1 ? 'tab' : 'tabs'} will close.${privateMode ? ' Incognito closes cannot be undone here.' : ' You can undo this action.'}`)], () => rpc('close', ids), 'Close tabs');
}
function createGroupDialog(ids = null) {
    const name=el('input');name.type='text';name.placeholder='Group name';
    const color=groupColorPicker();
    showAction('New tab group',[field('Name',name),color.field],async()=>{
        if(ids)return rpc('group',ids,null,name.value,color.value);
        const tab=await chrome.tabs.create({windowId:state.windowId,active:false});
        const groupId=await rpc('group',[tab.id],null,name.value,color.value);
        await finishNewTab({...tab,groupId});
    },'Create group');
}
function openGroup(id) {
    features?.capture('root');
    groupOpener = document.activeElement;
    state.groupId = id; selections.group.clear(); selecting.group = false; $('group-search').value = '';
    render(); if (!$('group-dialog').open) $('group-dialog').showModal(); syncModal(); features?.openGroup(id).catch(error => announce(error.message,true));
}
let menuOpener;
let menuFocus;
function focusMenuOpener() {
    const container = menuFocus?.scope === 'group' ? $('group-grid') : document.querySelector('main');
    const card = [...(container?.querySelectorAll('[data-key]') || [])].find(c => c.dataset.key === menuFocus?.key);
    (menuOpener?.isConnected ? menuOpener : card?.querySelector('.card-menu') || $('search-input')).focus({ preventScroll: true });
}
let submenuOpener;
function closeSubmenu() { const sub = $('context-submenu'); if (sub.matches(':popover-open')) sub.hidePopover(); submenuOpener?.setAttribute('aria-expanded', 'false'); }
window.addEventListener('resize', closeMenu);
$('context-menu').addEventListener('beforetoggle', e => { if (e.newState === 'closed') closeSubmenu(); });
$('context-menu').addEventListener('toggle', syncModal);
function closeMenu() { menuOpener?.setAttribute('aria-expanded', 'false'); closeSubmenu(); const menu = $('context-menu'); if (menu.matches(':popover-open')) menu.hidePopover(); syncModal(); }
function menuDivider(menu) { const d = el('div'); d.setAttribute('role', 'separator'); menu.append(d); }
function menuAction(menu, label, handler, { disabled = false, danger = false } = {}) {
    const b = button(label, () => { closeMenu(); handler(); }, danger ? 'danger' : '');
    b.setAttribute('role', 'menuitem'); b.disabled = state.busy || disabled;
    if (menu === $('context-menu')) b.addEventListener('pointerenter', closeSubmenu);
    menu.append(b); return b;
}
function menuSubmenu(menu, label, entries, disabled = false) {
    const trigger = button(label, () => openSubmenu(trigger, entries), 'has-submenu');
    trigger.setAttribute('role', 'menuitem'); trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-expanded', 'false'); trigger.disabled = state.busy || disabled;
    trigger.addEventListener('pointerenter', () => { if (!trigger.disabled) openSubmenu(trigger, entries, false); });
    trigger.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); openSubmenu(trigger, entries); } });
    menu.append(trigger);
}
async function windowEntries(ids) {
    const sourceWindows = new Set(state.tabs.filter(t => ids.includes(t.id)).map(t => t.windowId));
    const windows = (await chrome.windows.getAll({ windowTypes: ['normal'], populate: true })).filter(w => Boolean(w.incognito) === privateMode && !(sourceWindows.size === 1 && sourceWindows.has(w.id)));
    const entries = [['New Window', () => run(() => rpc('move', ids, null), 'Tabs moved.')]];
    if (windows.length) entries.push(null);
    for (const window of windows) {
        const tabs = window.tabs || await chrome.tabs.query({ windowId: window.id });
        entries.push([windowLabel(tabs), () => run(() => rpc('move', ids, window.id), 'Tabs moved.')]);
    }
    return entries;
}
function populateTabActions(menu, ids, scope, item = null, { insideGroup = false } = {}) {
    const members = state.tabs.filter(t => ids.includes(t.id));
    const oneWindow = new Set(members.map(t => t.windowId)).size === 1;
    const group = item?.kind === 'group';
    const title = item?.tab?.title || item?.group?.title || 'Selected tabs';
    const add = (label, handler, opts = {}) => menuAction(menu, label, handler, { disabled: !members.length, ...opts });
    if (group) add('New Tab in Group', () => newTab(item.group.id));
    else add('New Tab After Selected', () => run(async () => { const tab=await rpc('newAfter', ids, false); await finishNewTab(tab);return tab; }), { disabled: !oneWindow });
    menuSubmenu(menu, members.length > 1 ? 'Add Tabs to Group' : 'Add Tab to Group', () => {
        const groups = state.groups.filter(g => g.windowId === members[0]?.windowId);
        return [
            ['New Group', () => createGroupDialog(ids)],
            ...(groups.length ? [null] : []),
            ...groups.map(g => [g.title || 'Untitled group', () => run(() => rpc('group', ids, g.id), 'Tabs grouped.'),g])
        ];
    }, !oneWindow || members.some(t => t.pinned));
    if (members.some(t => t.groupId !== -1)) add('Ungroup', () => run(() => chrome.tabs.ungroup(ids), 'Tabs ungrouped.'));
    menuSubmenu(menu, members.length > 1 ? 'Move Tabs to Another Window' : 'Move Tab to Another Window', () => windowEntries(ids));
    if (!group) {
        menuDivider(menu);
        add('Reload', () => run(async () => { for (const tab of members) { if (!privateMode && /^https?:/.test(tab.url || '')) await rpc('preview', 'clear', tab.id); await chrome.tabs.reload(tab.id); } }));
        add('Duplicate', () => run(() => rpc('duplicate', ids)));
        const pinned = members.length > 0 && members.every(t => t.pinned);
        add(pinned ? 'Unpin' : 'Pin', () => run(async () => { for (const tab of members) await chrome.tabs.update(tab.id, { pinned: !pinned }); }));
        let muted = false;
        const sound = add('Mute Site', async () => {
            let permission;
            try { permission = await chrome.permissions.request({ permissions: ['contentSettings'] }); }
            catch (error) { announce(error.message, true); return; }
            if (!permission) { announce('Site sound permission was not granted.', true); return; }
            await run(async () => { const current = await rpc('siteSoundSnapshot', ids); return rpc('setSiteSound', ids, !(current?.muted ?? muted)); }, 'Site sound updated.');
        }, { disabled: !siteOrigins(members).length });
        rpc('siteSoundSnapshot', ids).then(value => { if (sound.isConnected && value) { muted = value.muted; sound.textContent = muted ? 'Unmute Site' : 'Mute Site'; } }).catch(() => {});
    }
    if (!privateMode) {
        menuDivider(menu);
        add(members.length > 1 ? 'Add Tabs to Reading List' : 'Add Tab to Reading List', () => addLinks(ids, 'readingList', title));
    }
    if (!privateMode && item?.tab && /^https?:/.test(item.tab.url || '')) {
        menuDivider(menu);
        menu.append(el('div','menu-name','Preview'));
        const excluded = siteMatches(item.tab.url, preferences.previewSites);
        add(excluded ? 'Allow previews for this website' : 'Stop previews for this website', () => run(() => rpc('preview', excluded ? 'allow' : 'exclude', item.tab.id), 'Preview preference updated.'));
        add('Clear this tab’s preview', () => run(() => rpc('preview','clear',item.tab.id), 'Preview cleared.'));
    }
    menuDivider(menu);
    if (insideGroup) add(selectionActive(selecting.group, selections.group) ? 'Done' : 'Select Tabs', () => {
        selecting.group = !selectionActive(selecting.group, selections.group); selections.group.clear(); syncSelection();
    });
    else if (!selectionActive(selecting[scope], selections[scope]) && item) add('Select', () => { selecting[scope] = true; selections[scope].add(item.key); syncSelection(); });
    if (!privateMode) add('Bookmark Tabs…', () => addLinks(ids, 'bookmarks', title));
    add('Copy Links', () => copyLinks(ids));
    if (state.view === 'inactive') add('Return to Tabs', () => run(() => rpc('returnActive', ids), 'Returned to tabs.'));
    menuDivider(menu);
    add(insideGroup && features?.hasFilters('group') ? 'Close Matching Tabs' : 'Close', () => group || ids.length > 1 ? confirmClose(ids, group ? 'Delete this group?' : 'Close selected tabs?') : closeTabs(ids), { danger: true });
    if (insideGroup) return;
    const others = relativeTabIds(actionTabs(scope), ids, 'others'), after = relativeTabIds(actionTabs(scope), ids, 'after');
    add('Close Other Unpinned Tabs…', () => confirmClose(others, 'Close other unpinned tabs?'), { danger: true, disabled: !others.length });
    add('Close Unpinned Tabs After Selected…', () => confirmClose(after, 'Close unpinned tabs after selected?'), { danger: true, disabled: !after.length });
}
function prepareMenu(scope, event, key) {
    features?.hideHistory();
    const opener = event.currentTarget.matches('button') ? event.currentTarget : event.currentTarget.querySelector('.card-menu:not([hidden]), .card-open') || event.currentTarget;
    if ($('context-menu').matches(':popover-open') && menuOpener === opener) { closeMenu(); focusMenuOpener(); return null; }
    closeMenu(); closePageMenu(); menuFocus = { key, scope }; menuOpener = opener;
    const menu = $('context-menu');
    ($('group-dialog').open ? $('group-dialog') : document.body).append(menu);
    document.body.append($('context-submenu')); menu.replaceChildren();
    return menu;
}
containMenuFocus(document, () => {
    if ($('context-menu').matches(':popover-open')) return {
        menu: $('context-menu'), submenu: $('context-submenu').matches(':popover-open') ? $('context-submenu') : null,
        close: () => { closeMenu(); focusMenuOpener(); },
        escape: () => { if ($('context-submenu').matches(':popover-open')) { closeSubmenu(); submenuOpener?.focus(); } else { closeMenu(); focusMenuOpener(); } }
    };
    if ($('page-menu').matches(':popover-open')) return { menu: $('page-menu'), close: () => { closePageMenu(); $('page-menu-btn').focus(); }, escape: () => { closePageMenu(); $('page-menu-btn').focus(); } };
    return null;
});
function showSelectionMenu(scope, event) {
    const menu = prepareMenu(scope, event); if (!menu) return;
    menu.setAttribute('aria-label', 'Edit selected tabs');
    const ids = tabIds(scope); menu.append(el('div', 'menu-name', `${ids.length} selected tabs`));
    populateTabActions(menu, ids, scope); positionMenu(menu, event);
}
function showMenu(item, scope, event, { insideGroup = false } = {}) {
    const menu = prepareMenu(scope, event, item.key); if (!menu) return;
    menu.setAttribute('aria-label', item.kind === 'group' ? 'Group actions' : 'Tab actions');
    const ids = item.kind === 'group' ? (insideGroup ? actionTabs(scope) : state.tabs).filter(t => t.groupId === item.group.id).map(t => t.id) : [item.tab.id];
    if (item.kind === 'group') {
        const header = el('div', 'menu-group-header');
        const input = el('input'); input.type = 'text'; input.value = item.group.title || ''; input.placeholder = 'Name this group'; input.setAttribute('aria-label', 'Group name');
        const rename = () => { if (input.value !== item.group.title) run(() => chrome.tabGroups.update(item.group.id, { title: input.value }), 'Group renamed.'); };
        input.addEventListener('change', rename);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); rename(); } });
        const palette = el('div', 'menu-colors'); palette.setAttribute('role', 'group'); palette.setAttribute('aria-label', 'Group color');
        for (const [color, value] of Object.entries(colors)) {
            const dot = button('', () => run(async () => { await chrome.tabGroups.update(item.group.id, { color }); palette.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b === dot))); }, 'Group color changed.'));
            dot.style.setProperty('--dot', value); dot.setAttribute('aria-label', color); dot.title = color; dot.setAttribute('role', 'menuitemradio'); dot.setAttribute('aria-checked', String(item.group.color === color)); palette.append(dot);
        }
        header.append(input, palette); menu.append(header);
    } else menu.append(el('div', 'menu-name', item.tab.title || item.tab.url || 'Tab'));
    populateTabActions(menu, ids, scope, item, { insideGroup }); positionMenu(menu, event);
}
function positionMenu(menu, event) {
    menu.style.maxHeight = '';
    menu.showPopover(); menuOpener?.setAttribute('aria-expanded', 'true'); syncModal();
    const bounds = menuOpener.getBoundingClientRect();
    const context = event.type === 'contextmenu' && event.clientX;
    const x = context ? event.clientX : bounds.left;
    let y;
    if (context) y = Math.max(8, Math.min(event.clientY, innerHeight - menu.offsetHeight - 8));
    else {
        const layout = anchoredMenuLayout(bounds, menu.offsetWidth, menu.offsetHeight, innerWidth, innerHeight);
        menu.style.maxHeight = `${layout.height}px`;
        y = layout.top;
    }
    menu.style.left = `${Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, y)}px`;
    menu.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}
let submenuRevision = 0;
async function openSubmenu(trigger, entries, focus = true) {
    if (submenuOpener === trigger && $('context-submenu').matches(':popover-open')) { if (focus) $('context-submenu').querySelector('button')?.focus(); return; }
    closeSubmenu(); submenuOpener = trigger; const revision = ++submenuRevision;
    const sub = $('context-submenu'); $('context-menu').append(sub); sub.replaceChildren(); sub.setAttribute('aria-label', trigger.textContent);
    sub.append(el('div', 'menu-name', 'Loading…')); sub.showPopover(); trigger.setAttribute('aria-expanded', 'true');
    const place = () => { const r = trigger.getBoundingClientRect(); sub.style.left = `${Math.max(8, r.right + sub.offsetWidth + 8 < innerWidth ? r.right : r.left - sub.offsetWidth)}px`; sub.style.top = `${Math.max(8, Math.min(r.top, innerHeight - sub.offsetHeight - 8))}px`; };
    place();
    try {
        const values = typeof entries === 'function' ? await entries() : entries;
        if (revision !== submenuRevision || !sub.matches(':popover-open')) return;
        sub.replaceChildren();
        for (const entry of values) { if (!entry) { menuDivider(sub); continue; } const [label, handler, group] = entry; const action=menuAction(sub,label,handler);if(group)action.replaceChildren(groupLabel(group)); }
        place(); if (focus) sub.querySelector('button')?.focus();
    } catch (error) { if (revision === submenuRevision && sub.matches(':popover-open')) sub.replaceChildren(el('div', 'menu-name', error.message)); }
}
$('context-submenu').addEventListener('keydown', e => {
    e.stopPropagation();
    if (['ArrowLeft', 'Escape'].includes(e.key)) { e.preventDefault(); closeSubmenu(); submenuOpener?.focus(); return; }
    const buttons = [...$('context-submenu').querySelectorAll('button')]; const i = buttons.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); buttons[e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
    if (e.key === 'Tab') closeMenu();
});
$('context-menu').addEventListener('keydown', e => {
    if (e.target.matches('input') && e.key !== 'Escape') return;
    const buttons = [...$('context-menu').querySelectorAll('button:not(:disabled)')].filter(b => !b.closest('#context-submenu'));
    const i = buttons.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(); focusMenuOpener(); }
    if (e.key === 'Tab') closeMenu();
});
async function addLinks(ids, destination, title = 'Saved tabs') {
    // Request directly from the click handler, before any other asynchronous work.
    try {
        const granted = await chrome.permissions.request({ permissions: [destination] });
        if (!granted) { announce('Permission was not granted. Nothing was saved.'); return; }
        if (destination !== 'bookmarks') { await run(() => rpc('addLinks', ids, destination, title), 'Tabs added to Reading List.'); return; }
        const [tree, preferences] = await Promise.all([chrome.bookmarks.getTree(), chrome.storage.local.get('bookmarkParentId')]);
        const folders = bookmarkFolders(tree);
        if (!folders.length) throw new Error('No writable bookmark folders are available.');
        const target = options(folders.map(f => [f.id, f.path]));
        target.value = folders.find(f => f.id === preferences.bookmarkParentId)?.id || folders.find(f => f.folderType === 'other')?.id || folders[0].id;
        const createFolder = el('input'); createFolder.type = 'checkbox'; createFolder.setAttribute('role', 'switch');
        const name = el('input'); name.type = 'text'; name.value = title; name.required = true; name.disabled = true;
        const nameField = field('New folder name', name); nameField.hidden = true;
        createFolder.onchange = () => { nameField.hidden = name.disabled = !createFolder.checked; };
        showAction('Bookmark tabs', [field('Destination folder', target), field('Create a new subfolder', createFolder), nameField],
            () => rpc('addLinks', ids, destination, title, { parentId: target.value, ...(createFolder.checked ? { newFolderTitle: name.value } : {}) }), 'Bookmark tabs');
    } catch (error) { announce(error.message, true); }
}
async function copyLinks(ids) {
    const text = state.tabs.filter(t => ids.includes(t.id)).map(t => `${t.title || t.url}\n${t.url || t.pendingUrl}`).join('\n\n');
    try { await navigator.clipboard.writeText(text); announce('Links copied.'); }
    catch { const input = el('textarea'); input.value = text; input.readOnly = true; input.rows = 8; showAction('Copy links', [field('Select and copy these links', input)], async () => {}, 'Done'); input.focus(); input.select(); }
}
async function finishNewTab(tab) {
    if(preferences.switchNewTab){await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});}
    else {await rpc('returnActive',[tab.id]);pendingNewTab={id:tab.id,groupId:tab.groupId};}
}
function scrollToCreatedTab() {
    const pending=pendingNewTab;if(!pending)return;pendingNewTab=null;
    requestAnimationFrame(()=>{
        const groupId=state.tabs.find(t=>t.id===pending.id)?.groupId??pending.groupId;
        const grid=$('group-dialog').open&&state.groupId===groupId?$('group-grid'):$('open-section');
        const key=grid===$('group-grid')?`tab:${pending.id}`:groupId!==-1&&groupId!==undefined?`group:${groupId}`:`tab:${pending.id}`;
        const card=[...grid.querySelectorAll('.card[data-key]')].find(c=>c.dataset.key===key&&!c.closest('[hidden]'))||[...grid.querySelectorAll('.card[data-key]')].find(c=>c.dataset.key===`tab:${pending.id}`&&!c.closest('[hidden]'));
        if(card)card.scrollIntoView({block:'nearest',behavior:materialMotionAllowed(preferences.visualStyle,preferences.motion,motionMedia.matches)?'smooth':'instant'});else announce('New tab created. Clear the active search or filters to see it.');
    });
}
async function newTab(groupId = null) {
    await run(async () => {
        const group = groupId === null ? null : await chrome.tabGroups.get(groupId);
        const tab = await chrome.tabs.create({ windowId: group?.windowId || state.windowId, active: false });
        if (group) await chrome.tabs.group({ tabIds: [tab.id], groupId });
        await finishNewTab({...tab,groupId:groupId??-1});
    });
}

$('action-form').addEventListener('submit', async e => {
    e.preventDefault(); if (state.busy) return;
    state.busy = true; $('action-submit').disabled = true; let partial = false;
    try { const result = await actionHandler(); if (result?.error) { partial = result.count > 0; $('action-error').textContent = result.error; } else { $('action-dialog').close(); announce('Done.'); } }
    catch (error) { $('action-error').textContent = error.message; }
    finally { state.busy = false; $('action-submit').disabled = partial; await refresh(); await refreshRecent(); await updateUndo(); }
});
$('action-dialog').addEventListener('close', syncModal);
$('action-cancel').onclick = () => $('action-dialog').close();
$('group-done').onclick = () => $('group-dialog').close();
$('group-dialog').addEventListener('close', () => {
    features?.closeGroup();
    const id = state.groupId; state.groupId = null; selections.group.clear(); selecting.group = false;
    syncModal(); closeMenu();
    const opener = scopeGrids('root').flatMap(grid => [...grid.children]).find(c => c.dataset.key === keyFor('group', id))?.querySelector('.card-open');
    (opener || (groupOpener?.isConnected ? groupOpener : $('search-input'))).focus({ preventScroll: true });
});
let backdropPress = false;
const onBackdrop = e => {
    const rect = $('group-dialog').getBoundingClientRect();
    return e.target === $('group-dialog') && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom);
};
$('group-dialog').addEventListener('pointerdown', e => { backdropPress = e.button === 0 && onBackdrop(e); });
$('group-dialog').addEventListener('pointerup', e => { if (backdropPress && onBackdrop(e)) $('group-dialog').close(); backdropPress = false; });
$('group-dialog').addEventListener('pointercancel', () => { backdropPress = false; });
$('group-new').onclick = () => newTab(state.groupId);
$('group-menu-btn').onclick = event => {
    const group = currentGroup(); if (!group) return;
    showMenu({ kind: 'group', key: keyFor('group', group.id), group }, 'group', event, { insideGroup: true });
};
$('group-search').addEventListener('input', render);
function closePageMenu() {
    if ($('page-menu').matches(':popover-open')) $('page-menu').hidePopover();
    syncModal();
}
$('page-menu-btn').onclick = () => {
    const menu = $('page-menu');
    if (menu.matches(':popover-open')) { closePageMenu(); return; }
    closeMenu(); menu.style.maxHeight = ''; menu.showPopover(); syncModal();
    const layout = anchoredMenuLayout($('page-menu-btn').getBoundingClientRect(), menu.offsetWidth, menu.offsetHeight, innerWidth, innerHeight, 'right');
    menu.style.maxHeight = `${layout.height}px`;
    menu.style.left = `${layout.left}px`; menu.style.top = `${layout.top}px`;
    menu.querySelector('input,button').focus({ preventScroll: true });
};
$('page-menu').addEventListener('toggle', syncModal);
$('page-menu').addEventListener('beforetoggle', e => $('page-menu-btn').setAttribute('aria-expanded', String(e.newState === 'open')));
$('page-menu').addEventListener('click', e => { if (e.target.closest('button')) closePageMenu(); }, true);
$('page-menu').addEventListener('keydown', e => {
    e.stopPropagation();
    const buttons = [...$('page-menu').querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    const i = buttons.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault(); buttons[e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }
    if (e.key === 'Escape') { e.preventDefault(); closePageMenu(); $('page-menu-btn').focus(); }
    if (e.key === 'Tab') closePageMenu();
});
window.addEventListener('resize', closePageMenu);
$('settings-btn').onclick = () => { features?.hideHistory(); settingsPanel.open(); syncModal(); };
$('settings-done').onclick = () => $('settings-dialog').close();
let settingsBackdropPress=false;
function settingsBackdrop(e){const r=$('settings-dialog').getBoundingClientRect();return e.target===$('settings-dialog')&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);}
$('settings-dialog').addEventListener('pointerdown',e=>{settingsBackdropPress=e.button===0&&settingsBackdrop(e);});
$('settings-dialog').addEventListener('pointerup',e=>{if(settingsBackdropPress&&settingsBackdrop(e))$('settings-dialog').close();settingsBackdropPress=false;});
$('settings-dialog').addEventListener('pointercancel',()=>{settingsBackdropPress=false;});
$('settings-dialog').addEventListener('close', () => { syncModal(); $('page-menu-btn').focus(); });
$('select-tabs-btn').onclick = () => {
    state.view = 'open'; selecting.root = true; render();
    $('root-toolbar').querySelector('[data-role=toggle]').focus();
};
$('new-group-btn').onclick = () => createGroupDialog();
$('new-tab-btn').onclick = () => newTab();
$('undo-btn').onclick = () => { const id = undoNotice.entry?.id; if (id) run(() => rpc('undo', id), 'Closed tabs restored.'); };
$('dismiss-undo').onclick = () => undoNotice.dismiss();
$('close-window-btn').onclick = () => confirmClose(actionTabs('root').filter(t => t.windowId === state.windowId && !t.pinned).map(t => t.id), features?.hasFilters('root') ? 'Close matching unpinned tabs in this window?' : 'Close unpinned tabs in this window?');
$('search-input').addEventListener('input', () => {
    if (state.view !== 'inactive') state.view = $('search-input').value.trim() ? 'all' : 'open'; render();
});
for (const [id,key] of [['opt-all-windows','allWindows'],['opt-nested','nested'],['opt-groups','searchGroups']]) $(id).addEventListener('change', () => { if(id==='opt-all-windows'){closePageMenu();$('opt-all-windows').setAttribute('aria-checked',String($('opt-all-windows').checked));}render(); if (!privateMode && (id === 'opt-all-windows' ? preferences.rememberScope : preferences.rememberOptions)) savePreferences({[key]:$(id).checked}).catch(e=>announce(e.message,true)); });
$('sort-select').addEventListener('change', () => { savePreferences({ sortMode: $('sort-select').value }).catch(e=>announce(e.message,true)); render(); });
function applyCardSize(columns) {
    captureGridLayout();
    columns = cardColumns(columns);
    $('size-slider').value = 7 - columns;
    $('size-slider').setAttribute('aria-valuetext', `${columns} ${columns === 1 ? 'tab' : 'tabs'} per row`);
    $('size-value').textContent = `${columns} per row`;
    $('size-slider').style.setProperty('--size-progress', `${(6 - columns) * 20}%`);
    document.documentElement.style.setProperty('--card-columns', columns);
    flushGridLayout();
}
$('size-slider').addEventListener('input', () => applyCardSize(7 - Number($('size-slider').value)));
$('size-slider').addEventListener('change', () => savePreferences({ preferredColumns: 7 - Number($('size-slider').value) }).catch(e=>announce(e.message,true)));
const searchDisclosure = $('search-disclosure');
function syncSearchFocus() {}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; render(); if (state.view === 'recent') refreshRecent(); }));
document.addEventListener('click',event=>{
    const summary=event.target.closest('summary');if(!summary)return;
    captureGridLayout();
},true);
document.addEventListener('toggle',event=>{const details=event.target;if(details.tagName!=='DETAILS')return;flushGridLayout();if(details.open){const content=details.querySelector('.live-filters,.theme-options');if(content)materialMotion.reveal(content,true,details);}},true);
$('refresh-btn').onclick = async () => { $('refresh-btn').disabled = true; try { await Promise.all([refresh(), refreshRecent()]); } finally { $('refresh-btn').disabled = false; } };

// Native dialogs provide focus trapping and Escape. Card navigation is shared by both grids.
document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.target.matches('input, textarea, select') || $('settings-dialog').open || $('page-menu').matches(':popover-open') || $('action-dialog').open || $('context-menu').matches(':popover-open')) return;
    const scope = scopeNow();
    if (scope === 'root' && !['open', 'all', 'inactive'].includes(state.view)) return;
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') return; // Chrome owns native restore.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); selecting[scope] = true; selections[scope] = new Set(visibleItems[scope].map(i => i.key)); syncSelection(); return; }
    if (e.key === 'Escape' && ! $('group-dialog').open) { selections.root.clear(); selecting.root = false; syncSelection(); return; }
    const card = e.target.closest('.card');
    if (!card) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); const ids = selections[scope].size ? tabIds(scope) : selectedTabs(new Set([card.dataset.key]), state.tabs).map(t => t.id); closeTabs(ids); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const cards = scopeGrids(scope).flatMap(grid => [...grid.querySelectorAll('.card[data-key]')]);
    let index = cards.indexOf(card), offset = 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { const row = [...card.parentElement.children].filter(c => Math.abs(c.offsetTop - card.offsetTop) < 4); offset = Math.max(1, row.length); }
    index = Math.max(0, Math.min(cards.length - 1, index + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -offset : offset)));
    const target = cards[index]; target?.querySelector('.card-open')?.focus();
    if (e.shiftKey && target) { anchors[scope] ||= card.dataset.key; selectItem(visibleItems[scope].find(i => i.key === target.dataset.key), scope, e); }
});

for (const name of ['onCreated', 'onUpdated', 'onRemoved', 'onMoved', 'onAttached', 'onDetached', 'onActivated', 'onReplaced']) chrome.tabs[name].addListener(scheduleRefresh);
for (const name of ['onCreated', 'onUpdated', 'onRemoved', 'onMoved']) chrome.tabGroups[name].addListener(scheduleRefresh);
chrome.windows.onRemoved.addListener(scheduleRefresh);
chrome.sessions.onChanged.addListener(() => { refreshRecent(); });
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[PREFS_KEY]?.newValue) applyPreferences(changes[PREFS_KEY].newValue);
    if (!privateMode && area === 'session' && changes.tabgridProtectedGroups) { protectedGroups = changes.tabgridProtectedGroups.newValue || []; scheduleRefresh(); }
    if (!privateMode && (area === 'local' && Object.keys(changes).some(k => k.startsWith('screenshot_') || k === 'tabActivity') || area === 'session' && changes.returnedTabs)) scheduleRefresh();
    if (area === 'session' && changes.tabgridUndo) updateUndo();
    if (area === 'session' && changes.tabgridLastOpened) scheduleRefresh();
});
let pointerReleaseTimer;
document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.card')) return;
    clearTimeout(pointerReleaseTimer); state.pointerDown = true;
}, true);
function releaseCardPointer() {
    clearTimeout(pointerReleaseTimer);
    pointerReleaseTimer = setTimeout(() => {
        state.pointerDown = false;
        syncSearchFocus();
        if (refreshPending) scheduleRefresh();
    }, 0);
}
document.addEventListener('pointerup', releaseCardPointer, true);
document.addEventListener('pointercancel', releaseCardPointer, true);
window.addEventListener('blur', releaseCardPointer);
window.addEventListener('focus', scheduleRefresh);

const appearanceMedia = matchMedia('(prefers-color-scheme: dark)');
appearanceMedia.addEventListener('change', () => applyAppearance(document.documentElement, preferences, appearanceMedia.matches));
function applyPreferences(next) {
    const previous = preferences; preferences = next;
    applyAppearance(document.documentElement, preferences, appearanceMedia.matches);
    document.documentElement.classList.toggle('motion-off', preferences.motion === 'off');
    materialMotion.sync();
    document.body.classList.toggle('group-drawer-enabled', preferences.dropGroups);
    if (preferences.motion === 'off') document.querySelectorAll('.card-surface').forEach(el => el.getAnimations().forEach(animation => animation.cancel()));
    if (!privateMode && (preferences.rememberOptions || previous.nested !== preferences.nested || previous.searchGroups !== preferences.searchGroups)) { if (!$('opt-nested').disabled) $('opt-nested').checked = preferences.nested; $('opt-groups').checked = preferences.searchGroups; }
    if (preferences.rememberScope && !privateMode && previous.allWindows !== preferences.allWindows) $('opt-all-windows').checked = preferences.allWindows;
    $('sort-select').value = preferences.sortMode;
    applyCardSize(preferences.preferredColumns);
    features?.preferencesChanged(); settingsPanel?.sync(); render(); updateShortcutHints();
}
async function savePreferences(patch) { const next = await rpc('updatePreferences', patch); applyPreferences(next); return next; }
function updateShortcutHints() {
    const mapping = {'undo-btn':'undo','select-tabs-btn':'select','sort-select':`sort${({default:'Default',title:'Title',domain:'Domain',accessed:'Accessed'})[preferences.sortMode]}`,'opt-all-windows':'allWindows','search-input':'focusSearch','group-search':'focusSearch','size-slider':['larger','smaller']};
    document.querySelectorAll('.shortcut-hint').forEach(e=>e.remove());
    for (const [id,action] of Object.entries(mapping)) {
        const control=$(id),actions=[action].flat(),bindings=actions.map(key=>preferences.shortcuts[key]).filter(Boolean),binding=bindings.join(' ');
        if(binding)control.setAttribute('aria-keyshortcuts',binding.replace(/Mod/g,/Mac/.test(navigator.platform)?'Meta':'Control'));else control.removeAttribute('aria-keyshortcuts');
        if(preferences.shortcutHints&&binding){const hint=el('span','shortcut-hint',bindings.join(' / ').replace(/Mod/g,/Mac/.test(navigator.platform)?'⌘':'Ctrl'));hint.setAttribute('aria-hidden','true');control.after(hint);}
    }
}
async function init() {
    const [win, saved] = await Promise.all([chrome.windows.getCurrent(), rpc('preferences')]);
    state.windowId = win.id; preferences = saved;
    $('privacy-note').hidden = !privateMode;
    if (privateMode) {
        document.querySelector('h1').firstChild.textContent = 'Incognito Tabs ';
        for (const view of ['inactive','recent']) document.querySelector(`[data-view=${view}]`).hidden = true;
        $('all-windows-label').textContent = 'Show all windows';
    }
    $('opt-nested').checked = preferences.rememberOptions && !privateMode ? preferences.nested : DEFAULTS.nested;
    $('opt-groups').checked = preferences.rememberOptions && !privateMode ? preferences.searchGroups : DEFAULTS.searchGroups;
    $('opt-all-windows').checked = preferences.rememberScope && !privateMode ? preferences.allWindows : false;
    protectedGroups = privateMode ? [] : await rpc('protectedGroups');
    features = setupGridPersonalization({api:chrome,privateMode,getState:()=>state,getPrefs:()=>preferences,savePrefs:savePreferences,rpc,render,announce,motion:materialMotion,
        selection: (scope,mode) => { if(mode==='clear') {selections[scope].clear();} else if(mode==='exit'){selections[scope].clear();selecting[scope]=false;}else{selecting[scope]=!selectionActive(selecting[scope],selections[scope]);if(!selecting[scope])selections[scope].clear();}syncSelection(); },
        undo: () => $('undo-btn').click(), resize: delta => { const columns = Math.max(1,Math.min(6,preferences.preferredColumns+delta));savePreferences({preferredColumns:columns}).catch(e=>announce(e.message,true)); }
    });
    settingsPanel = mountSettings({dialog:$('settings-dialog'),privateMode,getPrefs:()=>preferences,save:savePreferences,rpc,getGroups:()=>state.groups,getProtected:()=>protectedGroups,isNestedForced:()=>$('opt-nested').disabled,setProtected:async ids=>{protectedGroups=await rpc('protectedGroups',ids);render();},onApplied:applyPreferences,motion:materialMotion});
    applyPreferences(preferences);
    await Promise.all([refresh(), refreshRecent(), updateUndo()]);
    await features.init(); updateShortcutHints();
}
async function openGridWindow(incognito) {
    await run(async()=>{
        if(incognito&&!await chrome.extension.isAllowedIncognitoAccess()){announce('Enable Allow in Incognito in Chrome’s extension details, then try again.');return;}
        await chrome.windows.create({incognito,url:gridUrl});
    });
}
$('regular-window-btn').onclick=()=>openGridWindow(false);
$('private-window-btn').onclick=()=>openGridWindow(true);
setInterval(() => { if (!state.busy && !state.dragging) render(); }, 60000);
init().catch(error => announce(error.message, true));
