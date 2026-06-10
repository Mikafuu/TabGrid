// grid.js

// --- CONFIG & STATE ---
const CSS_COLORS = {
    grey: "rgb(219, 220, 224)", blue: "rgb(147, 179, 243)", red: "rgb(228, 144, 134)", yellow: "rgb(247, 216, 118)",
    green: "rgb(146, 199, 153)", pink: "rgb(240, 145, 201)", purple: "rgb(188, 141, 243)", cyan: "rgb(144, 215, 233)", orange: "rgb(241, 177, 122)"
};

const CONFIG = {
    // Other config...
    // Define native-feeling hover overlay alpha values
    hoverAlphaLight: 0.03, // Subtle dimming for light mode
    hoverAlphaDark: 0.05,  // Subtle brightening for dark mode
};

let currentState = {
    mode: 'root', // 'root' or 'group'
    groupId: null,
    groupColor: null
};

// SEARCH STATE
let searchState = {
    query: '',
    searchNested: true, // Default: Look inside groups
    showGroups: true    // Default: Show folder matches
};

// MULTI-SELECT & UNDO STATE
let selectedTabIds = new Set();
let currentTabOrder = [];
let lastSelectedTabId = null;
let undoStack = [];
let undoTimeout = null;
let focusedCardIndex = -1;
let activeModalGroupId = null; // NEW: Tracks which group is open in the modal

// --- FIX: CHROME AUTO-CLOSE EDGE CASE ---
// Chrome aggressively closes unmodified New Tab pages when you switch away.
// Pushing a history state tricks Chrome into keeping the tab alive,
// so it doesn't pollute the Cmd+Shift+T undo stack.
if (!window.location.hash) {
    history.pushState(null, "", "#managed");
}

// --- FIX: BULLETPROOF AUTO-CLOSE ---
// If the user switches to another tab, this document instantly becomes "hidden".
// We can use this to reliably close the grid without relying on the background script.
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        chrome.tabs.getCurrent((tab) => {
            if (tab) chrome.tabs.remove(tab.id).catch(() => { });
        });
    }
});

// --- HELPERS ---
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeQuery.addEventListener('change', (e) => console.log(e.matches ? "Dark Mode" : "Light Mode"));

function getIconUrl(tab) {
    if (!tab.url) return 'icon.png';
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
        const internalUrl = new URL(chrome.runtime.getURL("/_favicon/"));
        internalUrl.searchParams.set("pageUrl", tab.url);
        internalUrl.searchParams.set("size", "64");
        internalUrl.searchParams.set("scaleFactor", "2x");
        return internalUrl.toString();
    }
    try {
        const domain = new URL(tab.url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) { return 'icon.png'; }
}

const grid = document.getElementById("grid");
const backBtn = document.getElementById("back-btn");
const pageTitle = document.querySelector("h1");
const undoToast = document.getElementById("undo-toast");
const undoMsg = document.getElementById("undo-message");
const undoBtn = document.getElementById("undo-btn");

// SEARCH ELEMENTS
const searchInput = document.getElementById('search-input');
const optNested = document.getElementById('opt-nested');
const optGroups = document.getElementById('opt-groups');
const optAllWindows = document.getElementById('opt-all-windows');

// --- SEARCH LISTENERS ---
function handleSearchUpdate() {
    searchState.query = searchInput.value.toLowerCase().trim();
    searchState.searchNested = optNested.checked;
    searchState.showGroups = optGroups.checked;
    searchState.showAllWindows = optAllWindows.checked;
    renderGrid();
}

searchInput.addEventListener('input', handleSearchUpdate);
optNested.addEventListener('change', handleSearchUpdate);
optGroups.addEventListener('change', handleSearchUpdate);
optAllWindows.addEventListener('change', handleSearchUpdate);

// --- GLOBAL CLICK LISTENER ---
document.addEventListener('mousedown', (e) => {
    // --- FIX: INSTANT NATIVE MENU CLOSING ---
    const ctxMenu = document.getElementById('context-menu');
    if (ctxMenu.classList.contains('visible') && !e.target.closest('#context-menu')) {
        ctxMenu.classList.remove('visible');
    }

    const isCard = e.target.closest('.card');
    // Added context-menu to the ignore list so clicking menu items doesn't clear selections
    const isControl = e.target.closest('header') || e.target.closest('.modal-overlay') || e.target.closest('#undo-toast') || e.target.closest('#context-menu');

    if (!isCard && !isControl) {
        // 1. CLICKED BLANK SPACE: Clear selections and keyboard focus
        selectedTabIds.clear();
        lastSelectedTabId = null;

        if (focusedCardIndex >= 0) {
            const cards = document.querySelectorAll('.card');
            if (cards[focusedCardIndex]) cards[focusedCardIndex].classList.remove('focused');
            focusedCardIndex = -1;
        }

        renderSelectionVisuals();
    }
    else if (isCard) {
        // 2. CLICKED A CARD: Sync keyboard focus to this specific card
        if (focusedCardIndex >= 0) {
            const cards = document.querySelectorAll('.card');
            if (cards[focusedCardIndex]) cards[focusedCardIndex].classList.remove('focused');
        }

        // Find the index of the clicked card and quietly set it as the new start point for the keyboard
        const allCards = Array.from(document.querySelectorAll('.card'));
        focusedCardIndex = allCards.indexOf(isCard);
    }
});


// --- IMMEDIATE DELETION SYSTEM ---
async function requestDelete(ids, type = 'tab', isGroup = false) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const tabsData = [];
    let groupMeta = null;

    try {
        const fetchPromises = idArray.map(id => new Promise(resolve => chrome.tabs.get(id, tab => resolve(tab))));
        const tabs = await Promise.all(fetchPromises);
        const validTabs = tabs.filter(t => t);

        validTabs.forEach(t => tabsData.push({ url: t.url, title: t.title, index: t.index }));

        if (isGroup && validTabs.length > 0) {
            const firstTab = validTabs[0];
            if (firstTab.groupId > -1) {
                await new Promise(resolve => {
                    chrome.tabGroups.get(firstTab.groupId, (g) => {
                        if (g) groupMeta = { title: g.title, color: g.color };
                        resolve();
                    });
                });
            }
        }
    } catch (e) { console.error("Error saving tab data", e); }

    if (tabsData.length === 0) return;

    undoStack.push({ type: isGroup ? 'group' : 'tab', tabs: tabsData, groupMeta: groupMeta });

    // --- FIX: CHROME TAB LOCK WORKAROUND ---
    try {
        await chrome.tabs.remove(idArray);
    } catch (err) {
        console.warn("Chrome locked the tabs. Retrying...", err);
        // If Chrome is busy with a drag, wait 150ms and force the delete
        setTimeout(() => {
            chrome.tabs.remove(idArray).catch(() => { });
        }, 150);
    }

    // Give Chrome a tiny fraction of a second to finish closing the tabs, then re-draw the grid
    setTimeout(() => {
        renderGrid(true);
    }, 50);

    undoMsg.innerText = isGroup ? "Group Closed" : (idArray.length > 1 ? `${idArray.length} Tabs Closed` : "Tab Closed");
    undoToast.classList.add('visible');

    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => { undoToast.classList.remove('visible'); }, 4000);
}

undoBtn.addEventListener('click', async () => {
    const action = undoStack.pop();
    if (!action) return;
    const newTabIds = [];
    action.tabs.sort((a, b) => a.index - b.index);

    for (const tData of action.tabs) {
        const newTab = await chrome.tabs.create({ url: tData.url, active: false, index: tData.index });
        newTabIds.push(newTab.id);
    }

    if (action.type === 'group' && action.groupMeta && newTabIds.length > 0) {
        const newGroupId = await chrome.tabs.group({ tabIds: newTabIds });
        chrome.tabGroups.update(newGroupId, { title: action.groupMeta.title, color: action.groupMeta.color });
    }

    undoToast.classList.remove('visible');
    if (undoTimeout) clearTimeout(undoTimeout);
    setTimeout(() => {
        // PASS 'true' TO PRESERVE SCROLL
        renderGrid(true);
    }, 150);
});

// --- DRAG LOGIC (Preserved) ---
function makeDraggable(card, id, isGroup = false) {
    card.addEventListener('mousedown', (e) => {
        if (e.target.closest('.close-btn') || e.button !== 0) return;

        const rect = card.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        let isDragStarted = false;
        let clone = null;
        let batchClones = [];
        let currentTarget = null;
        let currentDropZone = null; // NEW: Tracks 'left', 'right', or 'center'
        let visualOrderSnapshot = [];

        // --- NEW: MODIFIER TRACKING ---
        let lastX = e.clientX;
        let lastY = e.clientY;
        let isGroupModifier = false; // Tracks if Alt/Option is held

        // --- NEW: KEY LISTENERS FOR INSTANT UI UPDATES ---
        function onKeyDown(e) {
            if (e.key === 'Alt') {
                isGroupModifier = true;
                if (isDragStarted) updateDragVisuals(lastX, lastY);
            }
        }
        function onKeyUp(e) {
            if (e.key === 'Alt') {
                isGroupModifier = false;
                if (isDragStarted) updateDragVisuals(lastX, lastY);
            }
        }

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // --- NEW: THE FLIP ANIMATION ENGINE ---
        function moveGhostsAndAnimate(domMoveLogic) {
            // Get all visible cards (excluding the ones floating on the cursor)
            const allCards = Array.from(document.querySelectorAll('.card:not(.dragging-card):not(.batch-clone)'));

            // 1. FIRST: Cancel any existing animations and reset transforms
            allCards.forEach(c => {
                c.classList.remove('flip-transition');
                c.style.transform = '';
            });

            // 2. Record starting coordinates AFTER resetting
            const firstRects = new Map();
            allCards.forEach(c => firstRects.set(c, c.getBoundingClientRect()));

            // 3. DOM MOVE: Execute the physical layout change
            domMoveLogic();

            visualOrderSnapshot = Array.from(
                document.querySelectorAll('.card')
            ).map(c => ({
                id: parseInt(c.dataset.tid),
                isGroup: c.classList.contains('group-card')
            }));

            // 4. INVERT & PLAY: Animate them to the new coordinates
            allCards.forEach(c => {
                const first = firstRects.get(c);
                const last = c.getBoundingClientRect();
                const dx = first.left - last.left;
                const dy = first.top - last.top;

                if (dx !== 0 || dy !== 0) {
                    c.classList.add('no-transition');
                    c.style.transform = `translate(${dx}px, ${dy}px)`;

                    void c.offsetWidth; // Force Browser Reflow

                    c.classList.remove('no-transition');
                    c.classList.add('flip-transition');
                    c.style.transform = '';

                    setTimeout(() => c.classList.remove('flip-transition'), 250);
                }
            });
        }

        // Helper to snap the grid back to normal when dropping into a folder
        function resetGridReflow() {
            moveGhostsAndAnimate(() => {
                document.querySelectorAll('.ghost-card').forEach(ghost => {
                    const anchor = document.getElementById('anchor-' + ghost.dataset.ghostId);
                    if (anchor) anchor.parentNode.insertBefore(ghost, anchor);
                });
            });
        }

        let scrollSpeed = 0;
        let scrollFrameId = null;

        const addCard = document.querySelector('.add-card');
        const originalAddCardHTML = addCard ? addCard.innerHTML : '';

        function startAutoScroll() {
            function loop() {
                if (scrollSpeed !== 0) {
                    window.scrollBy(0, scrollSpeed);
                    // FIX: Use the latest tracked position from onMouseMove
                    if (isDragStarted) updateDragVisuals(lastX, lastY);
                }
                scrollFrameId = requestAnimationFrame(loop);
            }
            scrollFrameId = requestAnimationFrame(loop);
        }

        function stopAutoScroll() { if (scrollFrameId) cancelAnimationFrame(scrollFrameId); }

        function clearTarget() {
            if (currentTarget) {
                if (currentTarget.classList.contains('add-card')) currentTarget.classList.remove('drag-over-target');
                else {
                    const existingOverlay = currentTarget.querySelector('.drop-target-overlay');
                    if (existingOverlay) existingOverlay.remove();
                }
                delete currentTarget.dataset.dropZone;
                currentTarget = null;
                currentDropZone = null;
            }
        }

        function updateDragVisuals(x, y) {
            if (!clone) return;
            clone.style.left = (x - offsetX) + 'px';
            clone.style.top = (y - offsetY) + 'px';

            let elemBelow = document.elementFromPoint(x, y);

            // --- FLICKER FIX: If we are hovering the physical empty space we just created, lock state! ---
            if (elemBelow && elemBelow.closest('.ghost-card')) return;

            let targetCard = elemBelow ? elemBelow.closest('.card:not(.ghost-card)') : null;
            if (
                currentState.mode === 'group' &&
                targetCard &&
                targetCard.classList.contains('group-card')
            ) {
                targetCard = null;
            }
            let isTargetSelected = targetCard && targetCard.dataset.tid ? selectedTabIds.has(parseInt(targetCard.dataset.tid)) : false;

            // 1. ADD CARD LOGIC
            if (targetCard && targetCard.classList.contains('add-card') && currentState.mode === 'group') {
                if (currentTarget !== targetCard) {
                    clearTarget();
                    resetGridReflow(); // Snap grid closed
                    currentTarget = targetCard;
                    currentTarget.classList.add('drag-over-target');
                }
                return;
            }

            // 2. REAL-TIME REORDER LOGIC
            if (targetCard && !isTargetSelected && !targetCard.classList.contains('add-card') && !isGroup && (
                currentState.mode === 'root' ||
                currentState.mode === 'group'
            )) {

                const rect = targetCard.getBoundingClientRect();
                const ratio = (x - rect.left) / rect.width;
                let newZone;
                if (isGroupModifier) {
                    newZone = 'center';
                } else if (currentDropZone === 'left') {
                    newZone = ratio > 0.58 ? 'right' : 'left';
                } else if (currentDropZone === 'right') {
                    newZone = ratio < 0.42 ? 'left' : 'right';
                } else {
                    newZone = ratio < 0.5 ? 'left' : 'right';
                }

                if (currentTarget !== targetCard || currentDropZone !== newZone) {
                    clearTarget();
                    currentTarget = targetCard;
                    currentDropZone = newZone;
                    currentTarget.dataset.dropZone = newZone;

                    if (newZone === 'center') {
                        resetGridReflow(); // Snap grid closed for grouping

                        let overlay = document.createElement('div');
                        overlay.className = 'drop-target-overlay';
                        overlay.innerHTML = targetCard.classList.contains('group-card')
                            ? `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span>Add to Group</span>`
                            : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg><span>Create New Group</span>`;
                        targetCard.appendChild(overlay);
                    }
                    else {
                        // --- PHYSICALLY MOVE THE GRID ---
                        moveGhostsAndAnimate(() => {
                            let referenceNode = newZone === 'left' ? targetCard : targetCard.nextSibling;
                            document.querySelectorAll('.ghost-card').forEach(ghost => {
                                targetCard.parentNode.insertBefore(ghost, referenceNode);
                            });
                        });
                    }
                }
            } else {
                clearTarget();
                resetGridReflow(); // Snap grid closed if mouse wanders into empty space
            }
        }

        function onMouseMove(e) {
            lastX = e.clientX;
            lastY = e.clientY;
            isGroupModifier = e.altKey;

            const zoneSize = 100; const maxSpeed = 15;
            if (e.clientY < zoneSize) scrollSpeed = -maxSpeed * ((zoneSize - e.clientY) / zoneSize);
            else if (e.clientY > window.innerHeight - zoneSize) scrollSpeed = maxSpeed * ((e.clientY - (window.innerHeight - zoneSize)) / zoneSize);
            else scrollSpeed = 0;

            if (!isDragStarted) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.sqrt(dx * dx + dy * dy) < 5) return;

                isDragStarted = true;
                if (!selectedTabIds.has(id)) {
                    selectedTabIds.clear(); selectedTabIds.add(id); lastSelectedTabId = id; renderSelectionVisuals();
                }

                if (currentState.mode === 'group' && addCard) {
                    addCard.classList.add('remove-mode');
                    addCard.innerHTML = `<div class="card-preview"><div class="add-content"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l-6-6m0 6l6-6"></path><circle cx="12" cy="12" r="10"></circle></svg><span>Remove from Group</span></div></div><div class="card-info" style="justify-content: center;"><span style="color: inherit;">Drop to Ungroup</span></div>`;
                }

                card.classList.add('ghost-card');
                clone = card.cloneNode(true);
                clone.classList.remove('ghost-card', 'selected');
                clone.classList.add('dragging-card');
                if (selectedTabIds.size > 1) {
                    clone.classList.add('is-batch');

                    if (selectedTabIds.size === 2) clone.classList.add('stack-2');
                    else clone.classList.add('stack-3'); // Maxes out at 3 visually

                    const badge = document.createElement('div');
                    badge.className = 'drag-badge';
                    badge.innerText = selectedTabIds.size;
                    clone.appendChild(badge);
                }
                clone.style.left = rect.left + 'px';
                clone.style.top = rect.top + 'px';
                clone.style.setProperty('--drag-width', rect.width + 'px');
                document.body.appendChild(clone);

                // --- HIGH-PERFORMANCE BATCH GATHER ---
                batchClones = [];
                if (selectedTabIds.size > 1) {
                    selectedTabIds.forEach(tid => {
                        if (tid === id) return; // Skip the one we are actively holding

                        const otherCard = document.querySelector(`.card[data-tid="${tid}"]`);
                        if (otherCard) {
                            const oRect = otherCard.getBoundingClientRect();
                            const bClone = otherCard.cloneNode(true);
                            bClone.classList.remove('selected', 'focused');
                            bClone.classList.add('batch-clone');

                            // Lock it exactly where it is
                            bClone.style.left = oRect.left + 'px';
                            bClone.style.top = oRect.top + 'px';
                            bClone.style.width = oRect.width + 'px';
                            bClone.style.height = oRect.height + 'px';
                            document.body.appendChild(bClone);
                            otherCard.classList.add('ghost-card');

                            void bClone.offsetWidth;

                            // Fly it to the ORIGINAL slot of the card we are dragging
                            bClone.classList.add('fly-animate');
                            bClone.style.left = rect.left + 'px';
                            bClone.style.top = rect.top + 'px';
                            bClone.style.transform = 'scale(0.8)';
                            bClone.style.opacity = '0'; // Fade out as it hits the origin

                            batchClones.push({ clone: bClone, original: otherCard, rect: oRect });
                        }
                    });

                    // pop the unified CSS stack onto the cursor's card!
                    setTimeout(() => {
                        if (clone) clone.classList.add('show-stack');
                    }, 52);
                }

                // --- NEW: MEMORIZE ORIGINAL POSITIONS ---
                let ghostCounter = 0;
                document.querySelectorAll('.ghost-card').forEach(ghost => {
                    if (!ghost.dataset.ghostId) {
                        const id = 'ghost-' + ghostCounter++;
                        ghost.dataset.ghostId = id;
                        const anchor = document.createElement('div');
                        anchor.id = 'anchor-' + id;
                        anchor.style.display = 'none';
                        ghost.parentNode.insertBefore(anchor, ghost);
                    }
                });
            }
            updateDragVisuals(lastX, lastY);
        }

        async function onMouseUp(e) {
            stopAutoScroll();
            if (!isDragStarted) { cleanup(); return; }

            card.dataset.wasDragged = "true";

            // 1. Parse what is currently being dragged
            let itemsToProcess = Array.from(selectedTabIds);
            if (itemsToProcess.length === 0) itemsToProcess = [id]; // Fallback if no selection

            const tabsToProcess = [];
            const groupsToProcess = [];
            itemsToProcess.forEach(tid => {
                const el = document.querySelector(`.card[data-tid="${tid}"]`);
                if (el) {
                    if (el.classList.contains('group-card')) groupsToProcess.push(tid);
                    else tabsToProcess.push(tid);
                }
            });

            let actionTaken = false;

            // --- DROP ZONE: UNGROUP CARD (Only Tabs) ---
            if (currentTarget && currentTarget.classList.contains('add-card') && currentState.mode === 'group') {
                if (tabsToProcess.length > 0) {
                    actionTaken = true;

                    // FIX: Instantly destroy clone & reset visuals before 'await' lag
                    if (clone) { clone.remove(); clone = null; }
                    card.classList.remove('ghost-card');
                    clearTarget();

                    try {
                        await chrome.tabs.ungroup(tabsToProcess);
                        selectedTabIds.clear(); lastSelectedTabId = null; renderGrid(true);
                    } catch (err) {
                        setTimeout(() => {
                            chrome.tabs.ungroup(tabsToProcess).then(() => {
                                selectedTabIds.clear(); lastSelectedTabId = null; renderGrid(true);
                            }).catch(() => { });
                        }, 150);
                    }
                }
            }
            // --- DROP ZONE: REORDER OR GROUP ---
            else if (currentTarget) {
                const targetId = parseInt(currentTarget.dataset.tid);
                const isTargetGroup = currentTarget.classList.contains('group-card');
                const dropZone = currentTarget.dataset.dropZone; // 'left', 'right', or 'center'

                if (tabsToProcess.length > 0) {
                    actionTaken = true;

                    // FIX: Instantly destroy clone & reset visuals before 'await' lag
                    if (clone) { clone.remove(); clone = null; }
                    card.classList.remove('ghost-card');
                    clearTarget();

                    if (dropZone === 'center') {
                        // --- GROUPING LOGIC (ALT/OPTION PRESSED) ---
                        try {
                            if (isTargetGroup) {
                                await chrome.tabs.group({ tabIds: tabsToProcess, groupId: targetId });
                                selectedTabIds.clear(); lastSelectedTabId = null; renderGrid(true);
                            } else {
                                const idsToGroup = [...tabsToProcess, targetId];
                                const newGroupId = await chrome.tabs.group({ tabIds: idsToGroup });
                                selectedTabIds.clear(); lastSelectedTabId = null;

                                await renderGrid(true);

                                const newGroupCard = document.querySelector(`.card.group-card[data-tid="${newGroupId}"]`);
                                if (newGroupCard) {
                                    const rect = newGroupCard.getBoundingClientRect();
                                    const ev = new MouseEvent('contextmenu', {
                                        bubbles: true, cancelable: true,
                                        clientX: rect.left + 30, clientY: rect.top + 30
                                    });
                                    newGroupCard.dispatchEvent(ev);
                                }
                            }
                        } catch (err) {
                            setTimeout(() => {
                                const groupArgs = isTargetGroup ? { tabIds: tabsToProcess, groupId: targetId } : { tabIds: [...tabsToProcess, targetId] };
                                chrome.tabs.group(groupArgs).then(async (newGroupId) => {
                                    selectedTabIds.clear(); lastSelectedTabId = null;
                                    await renderGrid(true);

                                    if (!isTargetGroup) {
                                        const newGroupCard = document.querySelector(`.card.group-card[data-tid="${newGroupId}"]`);
                                        if (newGroupCard) {
                                            const rect = newGroupCard.getBoundingClientRect();
                                            const ev = new MouseEvent('contextmenu', {
                                                bubbles: true, cancelable: true,
                                                clientX: rect.left + 30, clientY: rect.top + 30
                                            });
                                            newGroupCard.dispatchEvent(ev);
                                        }
                                    }
                                }).catch(() => { });
                            }, 150);
                        }
                    } else {
                        // --- REORDER LOGIC (NO KEY PRESSED) ---
                        // In group mode, only allow reordering within the current group
                        if (currentState.mode === 'group') {

                            const targetTab = await chrome.tabs.get(targetId);

                            // Ignore drops outside the active group
                            if (targetTab.groupId !== currentState.groupId) {
                                return;
                            }
                        }
                        try {
                            let insertIndex = -1;

                            if (isTargetGroup) {
                                // If dropped next to a group folder, find the group's boundaries
                                const groupTabs = await chrome.tabs.query({ groupId: targetId });
                                if (groupTabs.length > 0) {
                                    groupTabs.sort((a, b) => a.index - b.index);
                                    insertIndex = dropZone === 'left' ? groupTabs[0].index : groupTabs[groupTabs.length - 1].index + 1;
                                }
                            } else {
                                // If dropped next to a normal tab
                                const visualIds = visualOrderSnapshot
                                    .filter(v => !v.isGroup)
                                    .map(v => v.id);

                                const filteredVisualIds = visualIds.filter(
                                    id => !tabsToProcess.includes(id)
                                );

                                const targetVisualIndex = filteredVisualIds.indexOf(targetId);

                                if (targetVisualIndex !== -1) {
                                    insertIndex =
                                        dropZone === 'left'
                                            ? targetVisualIndex
                                            : targetVisualIndex + 1;
                                }

                                if (insertIndex !== -1) {
                                    const liveTabs = await chrome.tabs.query({
                                        windowId: (await chrome.tabs.get(tabsToProcess[0])).windowId
                                    });

                                    liveTabs.sort((a, b) => a.index - b.index);

                                    const remainingTabs = liveTabs.filter(
                                        t => !tabsToProcess.includes(t.id)
                                    );

                                    if (insertIndex >= remainingTabs.length) {
                                        insertIndex = remainingTabs[remainingTabs.length - 1].index + 1;
                                    } else {
                                        insertIndex = remainingTabs[insertIndex].index;
                                    }
                                }
                            }

                            if (insertIndex !== -1) {

                                // Get full tab objects so we know original positions
                                const draggedTabs = await Promise.all(
                                    tabsToProcess.map(id => chrome.tabs.get(id))
                                );

                                // Sort by native Chrome order
                                draggedTabs.sort((a, b) => a.index - b.index);

                                // Count how many dragged tabs are BEFORE the insert point
                                const removedBeforeTarget = draggedTabs.filter(
                                    t => t.index < insertIndex
                                ).length;

                                // Adjust destination because Chrome removes dragged tabs first
                                const correctedIndex = insertIndex - removedBeforeTarget;

                                // Preserve visual order during move
                                const orderedIds = draggedTabs.map(t => t.id);

                                await chrome.tabs.move(orderedIds, {
                                    index: correctedIndex
                                });
                            }

                            selectedTabIds.clear(); lastSelectedTabId = null;

                            // Re-render the grid to show the new layout
                            renderGrid(true);
                        } catch (err) {
                            console.warn("Failed to reorder tabs", err);
                        }
                    }
                }
            }

            // --- FINAL CLEANUP LOGIC ---
            function finishDragCleanup() {
                card.classList.remove('ghost-card');
                if (clone) clone.remove();

                // --- NEW: Clean up the batch clones ---
                batchClones.forEach(bc => {
                    bc.clone.remove();
                    if (bc.original) bc.original.classList.remove('ghost-card');
                });
                batchClones = [];

                document.querySelectorAll('[id^="anchor-ghost-"]').forEach(a => a.remove());
                document.querySelectorAll('.ghost-card').forEach(g => delete g.dataset.ghostId);

                setTimeout(() => { delete card.dataset.wasDragged; }, 50);

                const addCardNode = document.querySelector('.add-card');
                if (addCardNode && currentState.mode === 'group') {
                    addCardNode.classList.remove('remove-mode');
                    addCardNode.innerHTML = originalAddCardHTML;
                }
                clearTarget();
                cleanup();
            }

            // SNAP-BACK ENGINE
            if (!actionTaken && clone) {
                const finalRect = card.getBoundingClientRect();

                // 1. Instantly remove the fake stack illusion
                clone.classList.remove('show-stack');

                // 2. Use Web Animations API for smooth, synchronized snap-back
                const snapAnimation = clone.animate([
                    {
                        left: clone.style.left,
                        top: clone.style.top,
                        transform: 'scale(0.90)',
                        opacity: 0.8
                    },
                    {
                        left: finalRect.left + 'px',
                        top: finalRect.top + 'px',
                        transform: 'scale(1)',
                        opacity: 1
                    }
                ], {
                    duration: 250,
                    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                    fill: 'forwards'
                });

                // 3. Animate batch clones back to their original positions
                const batchAnimations = batchClones.map(bc => {
                    const currentDropRect = clone.getBoundingClientRect();

                    // Reset to current drop position
                    bc.clone.style.left = currentDropRect.left + 'px';
                    bc.clone.style.top = currentDropRect.top + 'px';
                    bc.clone.style.transform = 'scale(0.8)';
                    bc.clone.style.opacity = '1';

                    // Animate back to original position
                    return bc.clone.animate([
                        {
                            left: currentDropRect.left + 'px',
                            top: currentDropRect.top + 'px',
                            transform: 'scale(0.8)',
                            opacity: 1
                        },
                        {
                            left: bc.rect.left + 'px',
                            top: bc.rect.top + 'px',
                            transform: 'scale(1)',
                            opacity: 1
                        }
                    ], {
                        duration: 250,
                        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                        fill: 'forwards'
                    });
                });

                // 4. Clean up after animation completes
                Promise.all([snapAnimation.finished, ...batchAnimations.map(a => a.finished)])
                    .then(() => {
                        finishDragCleanup();
                    });
            } else {
                finishDragCleanup();
            }
        }

        function cleanup() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        }

        startAutoScroll();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function renderSelectionVisuals() {
    document.querySelectorAll('.card').forEach(c => {
        const tid = parseInt(c.dataset.tid);
        if (selectedTabIds.has(tid)) c.classList.add('selected');
        else c.classList.remove('selected');
    });
}

function showGroupNameModal(sourceTabIds, targetTabId) {
    const modal = document.getElementById('group-name-modal');
    const input = document.getElementById('group-title-input');
    const colorsDiv = document.getElementById('modal-colors');
    const saveBtn = document.getElementById('modal-save');
    const cancelBtn = document.getElementById('modal-cancel');

    let selectedColor = 'grey'; // Default color

    // Render Colors
    colorsDiv.innerHTML = '';
    const GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
    GROUP_COLORS.forEach(color => {
        const dot = document.createElement('div');
        dot.className = `color-dot ${color === selectedColor ? 'active' : ''}`;
        dot.style.background = CSS_COLORS[color] || color;
        dot.addEventListener('click', () => {
            colorsDiv.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            selectedColor = color;
        });
        colorsDiv.appendChild(dot);
    });

    input.value = ""; modal.classList.add('visible'); input.focus();

    function handleSave() {
        const title = input.value.trim() || "New Group";
        const sources = Array.isArray(sourceTabIds) ? sourceTabIds : [sourceTabIds];
        // Pass the selected color to the finalize function
        finalizeGroupCreation(sources, targetTabId, title, selectedColor);
        closeModal();
    }
    function handleCancel() { renderGrid(); closeModal(); }
    function closeModal() {
        modal.classList.remove('visible');
        saveBtn.removeEventListener('click', handleSave); cancelBtn.removeEventListener('click', handleCancel);
        input.removeEventListener('keydown', handleKey);
    }
    function handleKey(e) { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }
    saveBtn.addEventListener('click', handleSave, { once: true });
    cancelBtn.addEventListener('click', handleCancel, { once: true });
    input.addEventListener('keydown', handleKey);
}

async function finalizeGroupCreation(sourceIds, targetId, title, color) {
    try {
        // FIX: If targetId is null, we are right-clicking, so just use sourceIds.
        const idsToGroup = targetId ? [...sourceIds, targetId] : [...sourceIds];

        const newGroupId = await chrome.tabs.group({ tabIds: idsToGroup });
        await chrome.tabGroups.update(newGroupId, { title: title, color: color });

        selectedTabIds.clear();
        lastSelectedTabId = null;

        // Note: We deliberately do NOT change currentState.mode here.
        // This ensures the user stays exactly where they are without being forced inside the group.
        renderGrid(true);
    } catch (e) { console.error("Failed to create named group", e); }
}

// --- GROUP DELETION MODAL ENGINE ---
function showConfirmModal(groupId) {
    const modal = document.getElementById('confirm-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('confirm-cancel');

    modal.classList.add('visible');

    function handleConfirm() {
        closeModal();
        executeGroupDeletion(groupId);
    }

    function handleCancel() {
        closeModal();
    }

    function closeModal() {
        modal.classList.remove('visible');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    }

    confirmBtn.addEventListener('click', handleConfirm, { once: true });
    cancelBtn.addEventListener('click', handleCancel, { once: true });
}

async function executeGroupDeletion(groupId) {
    const tabs = await chrome.tabs.query({ groupId: groupId });
    const ids = tabs.map(t => t.id);

    // Explicitly ungroup to destroy the folder entity from Chrome's memory
    try { await chrome.tabs.ungroup(ids); } catch (err) { }

    // Close the tabs and allow them to be undone
    requestDelete(ids, 'tab', false);

    // Clear selection UI if the deleted group was currently selected
    if (selectedTabIds.has(groupId)) {
        selectedTabIds.delete(groupId);
        if (lastSelectedTabId === groupId) lastSelectedTabId = null;
    }
}

// --- CORE RENDERING ENGINE (SEARCH UPDATED) ---
async function renderGrid(preserveScroll = false) {
    const savedScrollY = window.scrollY;
    grid.innerHTML = '';
    currentTabOrder = [];

    focusedCardIndex = -1;

    // --- NEW: FETCH CURRENT WINDOW ---
    const currentWin = await chrome.windows.getCurrent();

    // 1. DETERMINE VIEW MODE
    // If Searching, we override the folder navigation
    const isSearching = searchState.query.length > 0;

    if (currentState.mode === 'group' && !isSearching) {
        backBtn.style.display = 'flex';
        try {
            const group = await chrome.tabGroups.get(currentState.groupId);
            if (!searchState.showAllWindows && group.windowId !== currentWin.id) {
                throw new Error("Group hidden by window filter");
            }
            const rawTitle = group.title || "Untitled Group";
            pageTitle.innerHTML = `${rawTitle} <span id="tabCount" style="color: ${CSS_COLORS[group.color] || '#888'}; font-size: 0.6em;"></span>`;
        } catch (e) {
            currentState.mode = 'root'; saveState(); renderGrid(); return;
        }
    } else {
        backBtn.style.display = 'none';
        pageTitle.innerHTML = isSearching ? `Search Results` : `Your Tabs <span id="tabCount" style="color: #888; font-size: 0.6em;"></span>`;
    }

    const currentGridUrl = chrome.runtime.getURL("grid.html");
    const allTabs = await chrome.tabs.query({});
    const allGroups = await chrome.tabGroups.query({});

    const relevantTabs = allTabs.filter(t =>
        !t.url.startsWith(currentGridUrl) && // <--- FIX: Use startsWith to ignore the #hash
        (searchState.showAllWindows || t.windowId === currentWin.id)
    );
    const relevantGroups = allGroups.filter(g =>
        searchState.showAllWindows || g.windowId === currentWin.id
    );

    let tabsToRender = [];
    let groupsToRender = [];

    // 2. FILTER LOGIC
    if (isSearching) {
        // --- SEARCH MODE ---
        // A. Tabs
        // If "Search Nested" is ON, we look at ALL tabs.
        // If OFF, we only look at tabs in the current view (Root or Group).
        // (Usually Search Nested means "Search Everything", so let's check all relevant tabs)
        let tabPool = relevantTabs;

        if (!searchState.searchNested) {
            // Only search top-level tabs if user unchecked "Nested"
            tabPool = relevantTabs.filter(t => t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
        }

        tabsToRender = tabPool.filter(t => {
            const matchTitle = t.title.toLowerCase().includes(searchState.query);
            const matchUrl = t.url.toLowerCase().includes(searchState.query);
            return matchTitle || matchUrl;
        });

        // B. Groups
        if (searchState.showGroups) {
            groupsToRender = relevantGroups.filter(g => {
                const title = (g.title || "Untitled Group").toLowerCase();
                return title.includes(searchState.query);
            });
        }
    }
    else {
        // --- STANDARD NAVIGATION MODE ---
        if (currentState.mode === 'root') {
            tabsToRender = relevantTabs.filter(t => t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
            groupsToRender = relevantGroups;
        } else {
            tabsToRender = relevantTabs.filter(t => t.groupId === currentState.groupId);
        }
    }

    const countEl = document.getElementById("tabCount");
    if (countEl) countEl.innerText = `(${tabsToRender.length + groupsToRender.length})`;

    // --- COMBINED SORTING ENGINE ---
    const sortMode = document.getElementById('sort-select').value;
    let combinedItems = [];

    // Calculate native start index for groups
    const groupIndices = {};
    allTabs.forEach(t => {
        if (t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            if (groupIndices[t.groupId] === undefined) groupIndices[t.groupId] = t.index;
            else groupIndices[t.groupId] = Math.min(groupIndices[t.groupId], t.index);
        }
    });

    groupsToRender.forEach(g => combinedItems.push({ type: 'group', item: g, nativeIndex: groupIndices[g.id] !== undefined ? groupIndices[g.id] : -1 }));
    tabsToRender.forEach(t => combinedItems.push({ type: 'tab', item: t, nativeIndex: t.index }));

    if (sortMode !== 'default') {
        const getSortValue = (obj) => {
            const item = obj.item;
            if (sortMode === 'title') return (item.title || "").toLowerCase();
            if (sortMode === 'domain') {
                if (obj.type === 'group') return (item.title || "").toLowerCase();
                try { return new URL(item.url).hostname.replace('www.', ''); } catch (e) { return ""; }
            }
            if (sortMode === 'accessed') {
                if (obj.type === 'tab') return item.lastAccessed;
                const groupTabs = relevantTabs.filter(t => t.groupId === item.id);
                if (groupTabs.length === 0) return 0;
                return Math.max(...groupTabs.map(t => t.lastAccessed));
            }
            return 0;
        };

        combinedItems.sort((a, b) => {
            const valA = getSortValue(a);
            const valB = getSortValue(b);
            if (sortMode === 'accessed') return valB - valA; // Descending
            if (valA < valB) return -1; // Ascending
            if (valA > valB) return 1;
            return 0;
        });
    } else {
        // Default: Sort strictly by Chrome's native visual ordering
        combinedItems.sort((a, b) => a.nativeIndex - b.nativeIndex);
    }

    // Always force pinned tabs to the front
    combinedItems.sort((a, b) => {
        const aPinned = a.type === 'tab' && a.item.pinned;
        const bPinned = b.type === 'tab' && b.item.pinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
    });

    // --- UNIFIED RENDERING LOOP ---
    const storageData = await chrome.storage.local.get(null);
    combinedItems.forEach(obj => {
        if (obj.type === 'group') {
            const group = obj.item;
            currentTabOrder.push(group.id);

            const color = CSS_COLORS[group.color] || "#555";
            const card = document.createElement("div");
            card.className = "card group-card";
            if (selectedTabIds.has(group.id)) card.classList.add('selected');
            card.dataset.tid = group.id;
            card.style.borderColor = color;
            const title = group.title || "Untitled Group";

            // --- FIX: REORDER HTML TO MATCH NATIVE STRUCTURE (FRAME ON TOP) ---
            // --- FIX: ADD CLOSE BUTTON TO GROUP CARDS ---
            card.innerHTML = `
                <div class="card-info">
                    <div style="width:12px; height:12px; border-radius:50%; background:${color}; margin-right:8px; flex-shrink:0;"></div>
                    <span style="font-weight:700;">${title}</span>
                    <button class="close-btn group-close-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                </div>
                <div class="card-preview">
                    <div class="group-icon-container" style="background: ${color};">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                </div>
            `;

            card.querySelector(".group-close-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                showConfirmModal(group.id);
            });

            card.addEventListener("click", async (e) => {
                if (card.dataset.wasDragged === "true") return;

                // Keep standard multi-select logic
                if (e.metaKey || e.ctrlKey || e.shiftKey) {
                    // ... [Your existing multi-select logic remains exactly the same]
                    return;
                }

                // --- NEW PARTNER UI: OPEN GROUP IN MODAL ---
                const modal = document.getElementById('inactive-modal');
                const listContainer = document.getElementById('inactive-list');
                const groupTabs = await chrome.tabs.query({ groupId: group.id });
                const storageData = await chrome.storage.local.get(null);

                // 1. Update Modal Header to match the Group
                const titleArea = document.querySelector('.sheet-title-area h2');
                const titleIcon = document.querySelector('.sheet-title-icon');

                titleArea.innerHTML = `${title} <span style="font-size: 15px; color: #888; font-weight: normal; margin-left: 8px;">(${groupTabs.length} tabs)</span>`;
                titleIcon.style.color = color;
                titleIcon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="currentColor"></circle></svg>`;

                // 2. Clear and Populate the Grid
                listContainer.innerHTML = '';
                groupTabs.forEach(tab => {
                    const item = document.createElement('div');
                    item.className = 'mini-card';
                    const img = storageData[`screenshot_${tab.id}`];
                    const iconUrl = getIconUrl(tab);

                    item.innerHTML = `
                        <div class="mini-card-header">
                            <img src="${iconUrl}" onerror="this.src='icon.png'">
                            <span title="${tab.title}">${tab.title}</span>
                            <button class="mini-card-close" data-id="${tab.id}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div class="mini-card-body">
                            ${img
                            ? `<img src="${img}" class="screenshot-img" draggable="false">`
                            : `
                                <div class="fake-page-wrapper">
                                    <div class="fake-page-line"></div>
                                    <div class="fake-page-line"></div>
                                    <div class="fake-page-line short"></div>
                                </div>
                                `
                        }
                        </div>
                    `;

                    // Close Individual Tab
                    item.querySelector('.mini-card-close').addEventListener('click', () => {
                        requestDelete(tab.id, 'tab');
                        item.remove();
                        // Update title count
                        const remaining = listContainer.querySelectorAll('.mini-card').length;
                        titleArea.innerHTML = `${title} <span style="font-size: 15px; color: #888; font-weight: normal; margin-left: 8px;">(${remaining} tabs)</span>`;
                        if (remaining === 0) modal.classList.remove('visible');
                    });

                    listContainer.appendChild(item);
                });

                // 3. Update the Bottom Red Button to act as "Close Group"
                const dangerBtn = document.getElementById('inactive-close-all');
                dangerBtn.style.display = 'block';
                dangerBtn.innerText = `Close All Tabs in ${title}`;

                const handleDangerClick = async () => {
                    const ids = groupTabs.map(t => t.id);
                    // Force Chrome to permanently destroy the folder entity
                    try { await chrome.tabs.ungroup(ids); } catch (err) { }

                    requestDelete(ids, 'tab', false);
                    modal.classList.remove('visible');
                    dangerBtn.removeEventListener('click', handleDangerClick);
                    activeModalGroupId = null;
                };
                dangerBtn.addEventListener('click', handleDangerClick);

                // 4. Show Modal & Setup Back Button
                modal.classList.add('visible');
                // --- NEW PARTNER UI: OPEN GROUP IN MODAL ---
                activeModalGroupId = group.id; // Store the ID for the + button
                const backBtnEl = document.getElementById('inactive-back-btn');
                backBtnEl.addEventListener('click', () => {
                    modal.classList.remove('visible');
                    dangerBtn.removeEventListener('click', handleDangerClick);
                    activeModalGroupId = null;
                }, { once: true });
            });
            makeDraggable(card, group.id, true);
            grid.appendChild(card);

        } else {
            const tab = obj.item;
            currentTabOrder.push(tab.id);
            const storageKey = `screenshot_${tab.id}`;
            const img = storageData[storageKey];
            const iconUrl = getIconUrl(tab);
            const card = document.createElement("div");

            const isAudible = tab.audible;
            const isMuted = tab.mutedInfo && tab.mutedInfo.muted;
            const showAudioBtn = isAudible || isMuted;

            card.className = "card";
            if (selectedTabIds.has(tab.id)) card.classList.add('selected');
            card.dataset.tid = tab.id;

            card.innerHTML = `
                <div class="card-info" id="info-${tab.id}">
                    <img src="${iconUrl}" class="mini-icon" draggable="false">
                    <span>${tab.title}</span>
                    <button class="close-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                </div>
                
                <div class="card-preview" id="prev-${tab.id}">
                    ${!img ? `
                        <div class="fake-page-wrapper">
                            <div class="fake-page-line"></div>
                            <div class="fake-page-line"></div>
                            <div class="fake-page-line short"></div>
                        </div>
                    ` : ''}
                    
                    <div class="top-left-actions">
                        ${tab.pinned ? `
                            <button class="action-btn pinned pin-btn" title="Unpin Tab">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                            </button>
                        ` : ''}
                        ${showAudioBtn ? `
                            <button class="action-btn audio-btn ${isMuted ? 'muted' : ''}" title="${isMuted ? 'Unmute' : 'Mute Tab'}">
                                ${isMuted
                        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
                    }
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            makeDraggable(card, tab.id, false);
            const images = card.querySelectorAll('img');
            images.forEach(image => { image.addEventListener('error', function () { this.src = 'icon.png'; }); });
            if (img) {
                const previewDiv = card.querySelector(`#prev-${tab.id}`);

                // 1. Remove the background image so your CSS frame color is visible
                previewDiv.style.backgroundImage = 'none';

                // 2. Inject the actual <img> tag so it obeys your new .screenshot-img CSS rules
                // Safely injects the image at the end of the div
                previewDiv.insertAdjacentHTML('beforeend', `<img src="${img}" class="screenshot-img" draggable="false">`);

                previewDiv.style.setProperty('--bg-image', 'none');
            }

            if (showAudioBtn) {
                const audioBtn = card.querySelector('.audio-btn');
                audioBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newMutedState = !isMuted;
                    await chrome.tabs.update(tab.id, { muted: newMutedState }).catch(() => { });
                    renderGrid(true);
                });
            }

            if (tab.pinned) {
                const pinBtn = card.querySelector('.pin-btn');
                pinBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await chrome.tabs.update(tab.id, { pinned: false }).catch(() => { });
                    renderGrid(true);
                });
            }

            card.addEventListener("click", (e) => {
                if (card.dataset.wasDragged === "true") return;
                if (e.target.closest('.close-btn') || e.target.closest('.action-btn')) return;

                if (e.metaKey || e.ctrlKey) {
                    if (selectedTabIds.has(tab.id)) { selectedTabIds.delete(tab.id); if (lastSelectedTabId === tab.id) lastSelectedTabId = null; }
                    else { selectedTabIds.add(tab.id); lastSelectedTabId = tab.id; }
                    renderSelectionVisuals(); return;
                }
                if (e.shiftKey) {
                    let anchorId = lastSelectedTabId;
                    if (anchorId === null || !currentTabOrder.includes(anchorId)) { anchorId = tab.id; lastSelectedTabId = tab.id; }
                    const startIdx = currentTabOrder.indexOf(anchorId); const endIdx = currentTabOrder.indexOf(tab.id);
                    if (startIdx !== -1 && endIdx !== -1) {
                        selectedTabIds.clear(); const min = Math.min(startIdx, endIdx); const max = Math.max(startIdx, endIdx);
                        for (let i = min; i <= max; i++) selectedTabIds.add(currentTabOrder[i]);
                    }
                    renderSelectionVisuals(); return;
                }

                chrome.tabs.getCurrent((gridTab) => {
                    chrome.tabs.update(tab.id, { active: true }).catch(() => { });
                    chrome.windows.update(tab.windowId, { focused: true }).catch(() => { });
                    if (gridTab) chrome.tabs.remove(gridTab.id).catch(() => { });
                });
            });

            card.querySelector(".close-btn").addEventListener("click", (e) => {
                e.stopPropagation(); requestDelete(tab.id, 'tab');
                selectedTabIds.delete(tab.id); if (lastSelectedTabId === tab.id) lastSelectedTabId = null;
            });
            grid.appendChild(card);
        }
    });

    // 2. RESTORE SCROLL (If requested)
    if (preserveScroll) {
        window.scrollTo(0, savedScrollY);
    }
}

function saveState() { chrome.storage.local.set({ 'viewMode': currentState.mode, 'groupId': currentState.groupId }); }
function loadStateAndInit() {
    chrome.storage.local.get(['viewMode', 'groupId', 'preferredSize'], (res) => {
        if (res.viewMode === 'group' && res.groupId) { currentState.mode = 'group'; currentState.groupId = res.groupId; }
        else { currentState.mode = 'root'; }
        if (res.preferredSize) {
            document.documentElement.style.setProperty('--card-min-width', res.preferredSize);
            const activeBtn = document.querySelector(`.size-btn[data-size="${res.preferredSize}"]`);
            if (activeBtn) { document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active')); activeBtn.classList.add('active'); }
        }
        renderGrid();
    });
}

backBtn.addEventListener('click', () => { currentState.mode = 'root'; currentState.groupId = null; searchInput.value = ''; handleSearchUpdate(); saveState(); });
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const newSize = btn.getAttribute('data-size');
        document.documentElement.style.setProperty('--card-min-width', newSize);
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chrome.storage.local.set({ preferredSize: newSize });
    });
});

// --- SORT LOGIC ---
const sortSelect = document.getElementById('sort-select');
// Load saved sort preference
chrome.storage.local.get(['sortMode'], (res) => {
    if (res.sortMode) sortSelect.value = res.sortMode;
});

sortSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ sortMode: e.target.value });
    renderGrid();
});

// --- CONTEXT MENU LOGIC ---
const ctxMenu = document.getElementById('context-menu');
const ctxGroupHeader = document.getElementById('ctx-group-header');
const ctxGroupInput = document.getElementById('ctx-group-input');
const ctxColors = document.getElementById('ctx-colors');

let ctxTargetId = null;
let ctxIsGroup = false;

// 1. COLORS CONFIG
const GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// Helper: Build Color Dots
function renderColorPicker(activeColor) {
    ctxColors.innerHTML = '';
    GROUP_COLORS.forEach(color => {
        const dot = document.createElement('div');
        dot.className = `color-dot`;
        dot.style.background = CSS_COLORS[color] || color;
        if (color === activeColor) dot.classList.add('active');

        dot.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (ctxIsGroup && ctxTargetId) {
                await chrome.tabGroups.update(ctxTargetId, { color: color });
                renderGrid(); // Refresh immediately
                ctxMenu.classList.remove('visible');
            }
        });
        ctxColors.appendChild(dot);
    });
}

// --- NEW HELPER: EXTRACT ALL TABS FROM SELECTION ---
async function getFlattenedSelectedTabIds() {
    let allTabIds = [];
    for (let tid of selectedTabIds) {
        const card = document.querySelector(`.card[data-tid="${tid}"]`);
        if (card && card.classList.contains('group-card')) {
            // Extract tabs from inside the group
            const tabsInGroup = await new Promise(res => chrome.tabs.query({ groupId: tid }, res));
            allTabIds.push(...tabsInGroup.map(t => t.id));
        } else if (card) {
            allTabIds.push(tid); // Just a standard tab
        }
    }
    return allTabIds;
}

// 2. OPEN MENU LISTENER
document.addEventListener('contextmenu', async (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    e.preventDefault();

    ctxTargetId = parseInt(card.dataset.tid);
    ctxIsGroup = card.classList.contains('group-card');
    // FIX 1: If it's the "New Tab" / "Add" card (which has an ID of NaN), completely ignore the right-click.
    if (isNaN(ctxTargetId)) return;
    if (!selectedTabIds.has(ctxTargetId) && selectedTabIds.size > 1) {
        selectedTabIds.clear();
        selectedTabIds.add(ctxTargetId);
        renderSelectionVisuals();
    }
    const isMultiSelect = selectedTabIds.size > 1;

    // Position Menu & Handle Edge Collision for Submenus
    const x = Math.min(e.clientX, window.innerWidth - 260);
    const y = Math.min(e.clientY, window.innerHeight - 380);
    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top = `${y}px`;
    // If menu is near the right edge, make submenus open to the left
    if (e.clientX > window.innerWidth - 460) ctxMenu.classList.add('align-left');
    else ctxMenu.classList.remove('align-left');

    const tabItems = document.querySelectorAll('.tab-only');
    const groupItems = document.querySelectorAll('.group-only');
    const multiItems = document.querySelectorAll('.multi-only');

    if (isMultiSelect) {
        ctxGroupHeader.style.display = 'none';
        tabItems.forEach(el => el.style.display = 'none');
        groupItems.forEach(el => el.style.display = 'none');
        multiItems.forEach(el => el.style.display = 'flex');

        // Check if selection includes ANY group folder
        let hasGroup = Array.from(selectedTabIds).some(id => {
            const el = document.querySelector(`.card[data-tid="${id}"]`);
            return el && el.classList.contains('group-card');
        });

        // Disable Pinning if a folder is selected
        const pinBtn = document.getElementById('ctx-multi-pin');
        if (hasGroup) {
            pinBtn.style.opacity = '0.4';
            pinBtn.style.pointerEvents = 'none';
            pinBtn.innerText = "Cannot Pin Groups";
        } else {
            pinBtn.style.opacity = '1';
            pinBtn.style.pointerEvents = 'auto';
            pinBtn.innerText = "Pin Tabs";
        }

        // --- POPULATE MULTI "ADD TO GROUP" SUBMENU ---
        const groupSubmenu = document.getElementById('ctx-multi-group-submenu');
        groupSubmenu.innerHTML = `<li id="ctx-multi-new-group">New Group</li><li class="divider"></li>`;

        groupSubmenu.querySelector('#ctx-multi-new-group').addEventListener('click', async (ev) => {
            ev.stopPropagation(); ctxMenu.classList.remove('visible');
            try {
                const allTabIds = await getFlattenedSelectedTabIds();
                const newGroupId = await chrome.tabs.group({ tabIds: allTabIds });
                selectedTabIds.clear(); lastSelectedTabId = null;
                await renderGrid(true);
            } catch (err) { console.warn("Failed to mass group", err); }
        });

        const currentWin = await chrome.windows.getCurrent();
        const allGroups = await chrome.tabGroups.query({ windowId: currentWin.id });
        allGroups.forEach(g => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="color-dot" style="background:${CSS_COLORS[g.color]}; width:10px; height:10px;"></div> ${g.title || 'Untitled'}`;
            li.addEventListener('click', async (ev) => {
                ev.stopPropagation(); ctxMenu.classList.remove('visible');
                const allTabIds = await getFlattenedSelectedTabIds();
                await chrome.tabs.group({ tabIds: allTabIds, groupId: g.id });
                selectedTabIds.clear(); lastSelectedTabId = null;
                renderGrid(true);
            });
            groupSubmenu.appendChild(li);
        });
    }

    else if (ctxIsGroup) {
        ctxGroupHeader.style.display = 'block';
        tabItems.forEach(el => el.style.display = 'none');
        groupItems.forEach(el => el.style.display = 'flex');

        // ADD THIS: Hide the multi-items on a normal group right-click
        multiItems.forEach(el => el.style.display = 'none');

        try {
            const group = await chrome.tabGroups.get(ctxTargetId);
            ctxGroupInput.value = group.title || "";
            renderColorPicker(group.color);
        } catch (err) {
            console.warn("Could not load group details", err);
            ctxGroupInput.value = "";
            renderColorPicker("grey");
        }
    }
    else {
        ctxGroupHeader.style.display = 'none';
        // FIX 2: Use 'flex' instead of 'block'
        tabItems.forEach(el => el.style.display = 'flex');
        groupItems.forEach(el => el.style.display = 'none');
        multiItems.forEach(el => el.style.display = 'none');

        try {
            const tab = await chrome.tabs.get(ctxTargetId);
            document.getElementById('ctx-pin-text').innerText = tab.pinned ? "Unpin" : "Pin";
            document.getElementById('ctx-mute-text').innerText = (tab.mutedInfo && tab.mutedInfo.muted) ? "Unmute Site" : "Mute Site";

            // --- POPULATE "ADD TO GROUP" SUBMENU ---
            const groupSubmenu = document.getElementById('ctx-group-submenu');
            groupSubmenu.innerHTML = `<li id="ctx-new-group">New Group</li><li class="divider"></li>`;

            // Wire up "New Group"
            groupSubmenu.querySelector('#ctx-new-group').addEventListener('click', async (ev) => {
                ev.stopPropagation(); ctxMenu.classList.remove('visible');

                try {
                    const newGroupId = await chrome.tabs.group({ tabIds: [ctxTargetId] });
                    await renderGrid(true);

                    const newGroupCard = document.querySelector(`.card.group-card[data-tid="${newGroupId}"]`);
                    if (newGroupCard) {
                        const rect = newGroupCard.getBoundingClientRect();
                        const menuEv = new MouseEvent('contextmenu', {
                            bubbles: true, cancelable: true,
                            clientX: rect.left + 30, clientY: rect.top + 30
                        });
                        newGroupCard.dispatchEvent(menuEv);
                    }
                } catch (err) {
                    console.warn("Failed to create new group from menu", err);
                }
            });

            // Fetch existing groups
            const allGroups = await chrome.tabGroups.query({ windowId: tab.windowId });
            allGroups.forEach(g => {
                const li = document.createElement('li');
                li.innerHTML = `<div class="color-dot" style="background:${CSS_COLORS[g.color]}; width:10px; height:10px;"></div> ${g.title || 'Untitled'}`;
                li.addEventListener('click', async (ev) => {
                    ev.stopPropagation(); ctxMenu.classList.remove('visible');
                    await chrome.tabs.group({ tabIds: [ctxTargetId], groupId: g.id });
                    renderGrid(true);
                });
                groupSubmenu.appendChild(li);
            });

            // --- POPULATE "MOVE TO WINDOW" SUBMENU ---
            const winSubmenu = document.getElementById('ctx-window-submenu');
            winSubmenu.innerHTML = `<li id="ctx-new-win">New Window</li><li class="divider"></li>`;

            winSubmenu.querySelector('#ctx-new-win').addEventListener('click', async (ev) => {
                ev.stopPropagation(); ctxMenu.classList.remove('visible');
                await chrome.windows.create({ tabId: ctxTargetId });
                renderGrid(true);
            });

            const allWindows = await chrome.windows.getAll();
            allWindows.forEach((w, index) => {
                if (w.id === tab.windowId) return; // Skip current
                const li = document.createElement('li');
                li.innerText = `Window ${index + 1}`;
                li.addEventListener('click', async (ev) => {
                    ev.stopPropagation(); ctxMenu.classList.remove('visible');
                    await chrome.tabs.move(ctxTargetId, { windowId: w.id, index: -1 });
                    renderGrid(true);
                });
                winSubmenu.appendChild(li);
            });

        } catch (err) {
            console.warn("Could not load tab details for menu", err);
        }
    }

    ctxMenu.classList.add('visible');

    // Auto-focus group name input if opening a group menu
    if (ctxIsGroup) {
        setTimeout(() => ctxGroupInput.focus(), 50);
    }
});

// 5. ACTION HANDLERS

// --- NEW TAB BUTTON ACTION ---
document.getElementById('new-tab-btn').addEventListener('click', async () => {
    const newTab = await chrome.tabs.create({ active: true });
    // Keep it integrated with the current group state if applicable
    if (currentState.mode === 'group') {
        await chrome.tabs.group({ tabIds: newTab.id, groupId: currentState.groupId });
    }
});

// --- MODAL "+" BUTTON ACTION ---
document.getElementById('modal-add-tab-btn').addEventListener('click', async () => {
    if (activeModalGroupId !== null) {
        // Create the new tab (this will automatically switch your browser to it, closing the extension view)
        const newTab = await chrome.tabs.create({ active: true });
        await chrome.tabs.group({ tabIds: newTab.id, groupId: activeModalGroupId });
    }
});


// --- UNIVERSAL MENU AUTO-CLOSE ---
// Automatically closes the context menu when any actionable item is clicked.
document.getElementById('ctx-main-list').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    // If the clicked item is a list item, AND it is not a submenu parent (like "Add to Group")
    if (li && !li.classList.contains('has-submenu')) {
        ctxMenu.classList.remove('visible');
    }
});

document.getElementById('ctx-reload').addEventListener('click', () => {
    chrome.tabs.reload(ctxTargetId);
    // --- FIX 3: Delete the screenshot so the card reverts to the default site icon ---
    chrome.storage.local.remove(`screenshot_${ctxTargetId}`);
    renderGrid(true);
});

document.getElementById('ctx-duplicate').addEventListener('click', () => {
    chrome.tabs.duplicate(ctxTargetId);
    // Note: renderGrid auto-updates via chrome.tabs events usually, or we can force it
    setTimeout(renderGrid, 200);
});

document.getElementById('ctx-pin').addEventListener('click', async () => {
    const tab = await chrome.tabs.get(ctxTargetId);
    chrome.tabs.update(ctxTargetId, { pinned: !tab.pinned });
    renderGrid();
});

document.getElementById('ctx-mute').addEventListener('click', async () => {
    const tab = await chrome.tabs.get(ctxTargetId);
    const currentMute = tab.mutedInfo && tab.mutedInfo.muted;
    chrome.tabs.update(ctxTargetId, { muted: !currentMute });
    renderGrid();
});

document.getElementById('ctx-ungroup').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ groupId: ctxTargetId });
    const ids = tabs.map(t => t.id);
    // FIX: Catch the promise to prevent console errors
    try {
        await chrome.tabs.ungroup(ids);
    } catch (err) {
        console.warn("Could not ungroup instantly", err);
    }
    renderGrid();
});

document.getElementById('ctx-close-tab').addEventListener('click', () => {
    requestDelete(ctxTargetId, 'tab');
    ctxMenu.classList.remove('visible');
});

document.getElementById('ctx-new-tab-right').addEventListener('click', async () => {
    const tab = await chrome.tabs.get(ctxTargetId);
    chrome.tabs.create({ index: tab.index + 1, windowId: tab.windowId });
});

document.getElementById('ctx-close-other').addEventListener('click', async () => {
    const tab = await chrome.tabs.get(ctxTargetId);
    const allInWindow = await chrome.tabs.query({ windowId: tab.windowId });
    const idsToRemove = allInWindow.filter(t => t.id !== ctxTargetId && !t.pinned).map(t => t.id);
    if (idsToRemove.length > 0) requestDelete(idsToRemove, 'tab');
    ctxMenu.classList.remove('visible');
});

document.getElementById('ctx-close-right').addEventListener('click', async () => {
    const tab = await chrome.tabs.get(ctxTargetId);
    const allInWindow = await chrome.tabs.query({ windowId: tab.windowId });
    const idsToRemove = allInWindow.filter(t => t.index > tab.index && !t.pinned).map(t => t.id);
    if (idsToRemove.length > 0) requestDelete(idsToRemove, 'tab');
    ctxMenu.classList.remove('visible');
});

// --- NEW NATIVE GROUP HANDLERS ---

document.getElementById('ctx-new-tab-group').addEventListener('click', async () => {
    // 1. Create a blank tab
    const newTab = await chrome.tabs.create({ active: true });
    // 2. Add it directly to the targeted group
    await chrome.tabs.group({ tabIds: newTab.id, groupId: ctxTargetId });
    renderGrid(true);
    ctxMenu.classList.remove('visible');
});

document.getElementById('ctx-move-group-window').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ groupId: ctxTargetId });
    if (tabs.length > 0) {
        // 1. Create a new window with the first tab
        const win = await chrome.windows.create({ tabId: tabs[0].id });
        // 2. Move the rest of the tabs
        const otherIds = tabs.slice(1).map(t => t.id);
        if (otherIds.length > 0) await chrome.tabs.move(otherIds, { windowId: win.id, index: -1 });

        // 3. Regroup them in the new window so they don't break apart
        const allIds = tabs.map(t => t.id);
        const newGroupId = await chrome.tabs.group({ tabIds: allIds, createProperties: { windowId: win.id } });

        // 4. Restore the color and title
        const oldGroup = await chrome.tabGroups.get(ctxTargetId).catch(() => null);
        if (oldGroup) chrome.tabGroups.update(newGroupId, { title: oldGroup.title, color: oldGroup.color });
    }
    renderGrid();
    ctxMenu.classList.remove('visible');
});

// --- MULTI-SELECT ACTION HANDLERS ---
document.getElementById('ctx-multi-select-all').addEventListener('click', () => {
    // Select all cards currently visible on the screen
    selectedTabIds = new Set(currentTabOrder);
    renderSelectionVisuals();
    ctxMenu.classList.remove('visible');
});

document.getElementById('ctx-multi-pin').addEventListener('click', async () => {
    const allTabIds = await getFlattenedSelectedTabIds();
    // Toggle pin state based on the first tab
    const firstTab = await chrome.tabs.get(allTabIds[0]);
    const newState = !firstTab.pinned;
    for (let id of allTabIds) {
        await chrome.tabs.update(id, { pinned: newState }).catch(() => { });
    }
    renderGrid(true);
    ctxMenu.classList.remove('visible');
});

document.getElementById('ctx-multi-close').addEventListener('click', async () => {
    const allTabIds = await getFlattenedSelectedTabIds();
    requestDelete(allTabIds, 'tab', false);
    ctxMenu.classList.remove('visible');
    selectedTabIds.clear();
    lastSelectedTabId = null;
});

// --- DELETE GROUP ---
document.getElementById('ctx-delete-group').addEventListener('click', () => {
    ctxMenu.classList.remove('visible');
    // Trigger your shiny new modal instead of instantly deleting!
    showConfirmModal(ctxTargetId);
});

// Group Name Input Handler (Enter key)
ctxGroupInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        await chrome.tabGroups.update(ctxTargetId, { title: ctxGroupInput.value });
        renderGrid();
        ctxMenu.classList.remove('visible');
    }
});






// --- KEYBOARD NAVIGATION LOGIC ---
document.addEventListener('keydown', async (e) => {
    // 1. Ignore if typing in a search box or input field
    if (e.target.tagName === 'INPUT') return;

    // --- NEW: INTERCEPT NATIVE RESTORE SHORTCUT ---
    // If user presses Cmd+Shift+T or Ctrl+Shift+T while on the grid, trigger our custom undo
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        if (undoStack.length > 0) undoBtn.click();
        return;
    }

    const cards = Array.from(document.querySelectorAll('.card'));
    if (cards.length === 0) return;

    // 2. Sync focus with mouse clicks
    // If we haven't used the keyboard yet, start from the last clicked item
    if (focusedCardIndex === -1) {
        focusedCardIndex = lastSelectedTabId !== null ? currentTabOrder.indexOf(lastSelectedTabId) : 0;
        if (focusedCardIndex === -1) focusedCardIndex = 0; // Fallback
    }

    // 3. Calculate columns dynamically
    let cols = 1;
    if (cards.length > 1) {
        const firstTop = cards[0].offsetTop;
        for (let i = 1; i < cards.length; i++) {
            if (cards[i].offsetTop === firstTop) cols++;
            else break;
        }
    }

    let curr = focusedCardIndex;
    let newIndex = curr;

    // Check modifiers (Cmd/Ctrl and Shift)
    const isCmd = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    // Row boundaries for Cmd + Left/Right
    const rowStart = Math.floor(curr / cols) * cols;
    const rowEnd = Math.min(cards.length - 1, rowStart + cols - 1);

    let isArrowMove = true;

    // 4. Handle Arrow Key Navigation (With Cmd Modifiers)
    switch (e.key) {
        case 'ArrowRight':
            newIndex = isCmd ? rowEnd : curr + 1;
            break;
        case 'ArrowLeft':
            newIndex = isCmd ? rowStart : curr - 1;
            break;
        case 'ArrowDown':
            newIndex = isCmd ? cards.length - 1 : curr + cols;
            break;
        case 'ArrowUp':
            newIndex = isCmd ? 0 : curr - cols;
            break;
        default:
            isArrowMove = false;
    }

    // --- EXECUTE ARROW MOVEMENT & SELECTION ---
    if (isArrowMove) {
        e.preventDefault();

        // Clamp index to bounds
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= cards.length) newIndex = cards.length - 1;

        // Move the visual focus outline
        if (focusedCardIndex >= 0 && cards[focusedCardIndex]) {
            cards[focusedCardIndex].classList.remove('focused');
        }
        focusedCardIndex = newIndex;
        cards[focusedCardIndex].classList.add('focused');
        cards[focusedCardIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Apply Finder-style Selection Logic
        const targetCard = cards[newIndex];
        const targetId = parseInt(targetCard.dataset.tid);
        const isGroup = targetCard.classList.contains('group-card');
        const isAddCard = targetCard.classList.contains('add-card');

        // We only apply multi-select logic to standard tabs
        if (!isAddCard) {
            if (isShift) {
                // SHIFT is held: Select range from Anchor to New Position
                let anchorId = lastSelectedTabId;
                if (anchorId === null || !currentTabOrder.includes(anchorId)) {
                    anchorId = targetId;
                    lastSelectedTabId = targetId;
                }

                const startIdx = currentTabOrder.indexOf(anchorId);
                const endIdx = currentTabOrder.indexOf(targetId);

                if (startIdx !== -1 && endIdx !== -1) {
                    selectedTabIds.clear();
                    const min = Math.min(startIdx, endIdx);
                    const max = Math.max(startIdx, endIdx);
                    for (let i = min; i <= max; i++) {
                        selectedTabIds.add(currentTabOrder[i]);
                    }
                }
            } else {
                // STANDARD ARROW: Clear selection and pick the new item
                selectedTabIds.clear();
                selectedTabIds.add(targetId);
                lastSelectedTabId = targetId; // Set new anchor
            }
            renderSelectionVisuals();
        }
        return;
    }

    // --- HANDLE ACTION KEYS ---
    switch (e.key) {
        case 'Enter':
            e.preventDefault();
            if (focusedCardIndex >= 0) {
                cards[focusedCardIndex].click(); // Simulates opening the tab
            }
            break;
        case 'Backspace':
        case 'Delete':
            e.preventDefault();

            // Get the list of selected items, or the focused item if nothing is selected
            let itemsToProcess = Array.from(selectedTabIds);
            if (itemsToProcess.length === 0 && focusedCardIndex >= 0) {
                const card = cards[focusedCardIndex];
                if (!card.classList.contains('add-card')) {
                    itemsToProcess = [parseInt(card.dataset.tid)];
                }
            }

            if (itemsToProcess.length > 0) {
                const tabsToProcess = [];
                const groupsToProcess = [];
                itemsToProcess.forEach(tid => {
                    const el = document.querySelector(`.card[data-tid="${tid}"]`);
                    if (el) {
                        if (el.classList.contains('group-card')) groupsToProcess.push(tid);
                        else tabsToProcess.push(tid);
                    }
                });

                // Extract all underlying tabs from groups to delete everything together
                let allTabIds = [...tabsToProcess];
                for (const gid of groupsToProcess) {
                    const tabsInGroup = await new Promise(res => chrome.tabs.query({ groupId: gid }, res));
                    allTabIds.push(...tabsInGroup.map(t => t.id));
                }

                if (allTabIds.length > 0) {
                    const isPureGroup = tabsToProcess.length === 0 && groupsToProcess.length === 1;
                    requestDelete(allTabIds, isPureGroup ? 'group' : 'tab', isPureGroup);
                }

                selectedTabIds.clear(); lastSelectedTabId = null;

                // Nudge focus back so you don't lose keyboard position
                if (focusedCardIndex > 0) {
                    cards[focusedCardIndex].classList.remove('focused');
                    focusedCardIndex--;
                    if (cards[focusedCardIndex]) cards[focusedCardIndex].classList.add('focused');
                }
            }
            break;
    }
});

loadStateAndInit();