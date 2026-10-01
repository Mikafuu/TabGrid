import { THEMES, FONTS, STYLES } from './appearance.mjs';
export const PREFS_KEY = 'tabgridPreferences';
export const SHORTCUTS = { focusSearch: 'Focus search', sortDefault: 'Sort by tab order', sortTitle: 'Sort by title', sortDomain: 'Sort by website', sortAccessed: 'Sort by last used', undo: 'Undo close', allWindows: 'Toggle all windows', larger: 'Increase card size', smaller: 'Decrease card size', select: 'Select tabs' };
export const DEFAULTS = {
    version: 1, rememberOptions: true, rememberScope: true, rememberRootScroll: true, rememberGroupScroll: true,
    rememberRootQuery: false, rememberGroupQuery: false, autofocus: true, selectQuery: false,
    visualStyle: 'classic', colorMode: 'system', theme: 'calm', font: 'geist', motion: 'system', showAddress: true, showLastUsed: false, showWindow: false, showGroup: true, matchTitle: true, matchUrl: true, matchMode: 'phrase',
    nested: true, searchGroups: true, allWindows: false, filterWebsite: true, filterGroup: true, filterPinned: true, filterAudible: true, filterMuted: true,
    historyEnabled: false, historyCount: 5, historyDays: 0,
    switchNewTab: true, blankClear: true, blankExit: true, closePolicy: 'multiple', closeThreshold: 5, undoMs: 5000,
    inactiveDays: 0, idleSites: [], capture: true, previewSites: [], previewLimit: 100, shortcutHints: false,
    preferredColumns: 4, sortMode: 'default', dropGroups: true, drawerEdge: 'left', drawerOffset: 0, drawerLength: 128,
    shortcuts: Object.fromEntries(Object.keys(SHORTCUTS).map(key => [key, key === 'focusSearch' ? '/' : key === 'undo' ? 'Mod+Z' : '']))
};
export function normalizeHost(value) {
    if (typeof value !== 'string' || !value.trim() || /[\s*]/.test(value.trim())) throw Error('Enter a hostname or an HTTP(S) website URL.');
    let url; try { url = new URL(value.includes('://') ? value.trim() : `https://${value.trim()}`); } catch { throw Error('Enter a valid website.'); }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw Error('Enter an HTTP(S) website without a username or password.');
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host.startsWith('[') && (host.length > 253 || host.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))) throw Error('Enter a valid website hostname.');
    return host;
}
export function siteMatches(url, sites = []) {
    try { const host = new URL(url).hostname.toLowerCase().replace(/\.$/, ''); return sites.some(site => host === site || host.endsWith(`.${site}`)); } catch { return false; }
}
export function validateShortcuts(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid shortcut settings.');
    const used = new Set(), result = {};
    for (const key of Object.keys(SHORTCUTS)) {
        const binding = value[key] ?? DEFAULTS.shortcuts[key];
        if (typeof binding !== 'string' || (binding && !/^(?:(?:Mod|Ctrl|Alt|Shift)\+)*(?:[A-Z0-9]|\/|F(?:[1-9]|1[0-2]))$/.test(binding))) throw Error(`Invalid shortcut for ${SHORTCUTS[key]}.`);
        const parts = binding.split('+'), main = parts.pop();
        if (new Set(parts).size !== parts.length || (parts.includes('Mod') && parts.includes('Ctrl'))) throw Error('Repeated shortcut modifiers are not allowed.');
        const canonical = [...['Mod','Ctrl','Alt','Shift'].filter(p => parts.includes(p)),main].join('+');
        if (binding && canonical !== binding) throw Error('Invalid shortcut modifier order.');
        if (binding && ((parts.some(p => p === 'Mod' || p === 'Ctrl') && ['A','C','V','X','W','T','N','L','R','F','P','S','O','J','H','D','Q','E','U','B','G','Y','I','K','M','0','1','2','3','4','5','6','7','8','9'].includes(main)) || (parts.includes('Alt') && ['D','E','F'].includes(main)) || /^F(?:1|3|4|5|6|7|10|11|12)$/.test(main))) throw Error('That shortcut is reserved for browser navigation or editing.');
        if (binding && used.has(binding)) throw Error('Each shortcut must be unique.');
        if (binding) used.add(binding); result[key] = binding;
    }
    return result;
}
export function keyBinding(event, mac = false) {
    if (event.isComposing || (!mac && event.metaKey) || ['Control','Meta','Alt','Shift'].includes(event.key)) return null;
    let key = event.key === '/' ? '/' : event.key.toUpperCase();
    return [((mac && event.metaKey) || (!mac && event.ctrlKey)) && 'Mod', mac && event.ctrlKey && 'Ctrl', event.altKey && 'Alt', event.shiftKey && 'Shift', key].filter(Boolean).join('+');
}
const ranges = { drawerLength:[64,320], drawerOffset:[0,100], historyDays:[0,3650], closeThreshold:[1,100000], undoMs:[1,300000], inactiveDays:[0,3650], previewLimit:[1,1024], preferredColumns:[1,6] };
const enums = { visualStyle:STYLES.map(s=>s.id), colorMode:['system','light','dark'], theme:THEMES.map(t=>t.id), font:FONTS.map(f=>f.id), drawerEdge:['left','right','top','bottom'], motion:['system','off'], matchMode:['phrase','words'], historyCount:[5,10,20], closePolicy:['always','multiple','above'], sortMode:['default','title','domain','accessed'] };
export function validatePreferences(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Settings must be an object.');
    if (input.version !== undefined && input.version !== 1) throw Error('Unsupported settings version.');
    if (input.undoMs === undefined && input.undoSeconds !== undefined) {
        if (!Number.isInteger(input.undoSeconds) || input.undoSeconds < 1 || input.undoSeconds > 300) throw Error('Invalid legacy undo timeout.');
        input = {...input, undoMs: input.undoSeconds * 1000};
    }
    const result = structuredClone(DEFAULTS);
    for (const [key, fallback] of Object.entries(DEFAULTS)) {
        if (!(key in input)) continue;
        const value = input[key];
        if (typeof fallback === 'boolean' && typeof value !== 'boolean') throw Error(`Invalid value for ${key}.`);
        if (ranges[key] && (!Number.isInteger(value) || value < ranges[key][0] || value > ranges[key][1])) throw Error(`${key} must be a whole number from ${ranges[key][0]} to ${ranges[key][1]}.`);
        if (enums[key] && !enums[key].includes(value)) throw Error(`Invalid choice for ${key}.`);
        if (key === 'idleSites' || key === 'previewSites') {
            if (!Array.isArray(value) || value.length > 1000) throw Error('Use a list of at most 1,000 websites.');
            result[key] = [...new Set(value.map(normalizeHost))];
        } else if (key === 'shortcuts') result[key] = validateShortcuts(value);
        else result[key] = value;
    }
    if (!result.matchTitle && !result.matchUrl) throw Error('Enable title or URL matching.');
    return result;
}
export function migratePreferences(storage, columns = 4) {
    if (storage[PREFS_KEY]) return validatePreferences(storage[PREFS_KEY]);
    const next = { ...DEFAULTS, preferredColumns: columns };
    for (const key of ['preferredColumns','sortMode','inactiveDays','dropGroups']) if (storage[key] !== undefined) next[key] = storage[key];
    return validatePreferences(next);
}
export const needsConfirmation = (count, prefs) => count > 0 && (prefs.closePolicy === 'always' || (prefs.closePolicy === 'multiple' ? count > 1 : count > prefs.closeThreshold));
export function cleanHistory(entries, days, now = Date.now()) {
    const seen = new Set();
    return (Array.isArray(entries) ? entries : []).filter(e => {
        if (!e || typeof e.query !== 'string' || !Number.isFinite(e.time) || !e.query.trim() || (days && now - e.time > days * 86400000)) return false;
        const key = e.query.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true;
    }).slice(0,20).map(e => ({query:e.query.trim().slice(0,500),time:e.time}));
}
export function importSettings(text) {
    if (typeof text !== 'string' || text.length > 1024 * 1024) throw Error('Choose a settings file smaller than 1 MiB.');
    const data = JSON.parse(text);
    if (data?.format !== 'TabGrid settings' || data.version !== 1) throw Error('Unsupported settings backup.');
    return validatePreferences(data.preferences);
}
export const exportSettings = prefs => JSON.stringify({format:'TabGrid settings',version:1,preferences:validatePreferences(prefs)},null,2);
