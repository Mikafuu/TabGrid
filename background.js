// background.js

let isIntentionalOpen = false;

chrome.action.onClicked.addListener((tab) => {
  isIntentionalOpen = true; // Mark as intentionally opened

  const gridUrl = chrome.runtime.getURL("grid.html");
  chrome.tabs.create({ url: gridUrl }, () => {
    // Reset the flag safely after the tab is created
    setTimeout(() => { isIntentionalOpen = false; }, 500);
  });

  chrome.history.deleteUrl({ url: gridUrl });
});

// --- NEW: THE RESTORE INTERCEPTOR ---
chrome.tabs.onCreated.addListener((tab) => {
  const gridUrl = chrome.runtime.getURL("grid.html");
  const tabUrl = tab.pendingUrl || tab.url || "";

  // If Chrome creates the grid, but the user DID NOT click the extension icon...
  if (tabUrl.startsWith(gridUrl) && !isIntentionalOpen) {

    // 1. Instantly kill the mistakenly restored grid tab (SILENT CATCH ADDED)
    chrome.tabs.remove(tab.id).catch(() => { });

    // 2. Dig through the closed tabs list to find the actual website
    if (chrome.sessions) {
      chrome.sessions.getRecentlyClosed({ maxResults: 10 }, (sessions) => {
        // Find the first closed item that is NOT a grid.html page
        const validSession = sessions.find(s => {
          const url = s.tab ? s.tab.url : (s.window && s.window.tabs.length > 0 ? s.window.tabs[0].url : "");
          return url && !url.startsWith(gridUrl);
        });

        // 3. Restore the correct website
        if (validSession) {
          const sessionId = validSession.tab ? validSession.tab.sessionId : validSession.window.sessionId;
          chrome.sessions.restore(sessionId);
        }
      });
    }
  }
});

// Function to capture and save
async function captureTab(tabId) {
  try {
    // SILENT CATCH ADDED: If tab was instantly closed, ignore it
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || !tab.active) return;

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 40 }).catch(() => null);
    if (!dataUrl) return;

    const storageKey = `screenshot_${tabId}`;
    await chrome.storage.local.set({ [storageKey]: dataUrl });
  } catch (e) {
    // Ignore global capture errors
  }
}

// --- WATCHDOG: Handles Snapshots AND Auto-Closing ---
chrome.tabs.onActivated.addListener((activeInfo) => {
  // 1. Snapshot logic
  setTimeout(() => captureTab(activeInfo.tabId), 500);

  // 2. Watchdog: Close Grid if we switch away
  setTimeout(async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const gridUrl = chrome.runtime.getURL("grid.html");

      // Find Grid Tabs
      const gridTabs = tabs.filter(tab => tab.url && tab.url.startsWith(gridUrl));

      for (const tab of gridTabs) {
        if (tab.id !== activeInfo.tabId) {
          // SILENT CATCH ADDED
          chrome.tabs.remove(tab.id).catch(() => { });
        }
      }
    } catch (error) {
      // Ignore
    }
  }, 150);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    captureTab(tabId);
  }
});

// --- CLEANUP: Storage & History ---
chrome.tabs.onRemoved.addListener((tabId) => {
  // 1. Clean Screenshot Storage
  chrome.storage.local.remove(`screenshot_${tabId}`);

  // 2. NEW: Clean History (Fixes Restore Tab issue)
  const gridUrl = chrome.runtime.getURL("grid.html");
  chrome.history.deleteUrl({ url: gridUrl });
});