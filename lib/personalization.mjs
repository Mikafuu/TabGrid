import { DEFAULTS, PREFS_KEY, migratePreferences, validatePreferences, cleanHistory, importSettings, normalizeHost, siteMatches } from './preferences.mjs';
import { cardColumns } from './tab-ui.mjs';
import { PreviewCache } from './preview-cache.mjs';
const HISTORY='tabgridSearchHistory';
export class Personalization {
    constructor(api,gridUrl) { this.api=api;this.private=Boolean(api.extension?.inIncognitoContext);this.previews=new PreviewCache(api,gridUrl);this.ready=this.init(); }
    async init() {const data=await this.api.storage.local.get(null);const prefs=migratePreferences(data,cardColumns(data.preferredColumns,data.preferredSize));if(JSON.stringify(data[PREFS_KEY])!==JSON.stringify(prefs))await this.api.storage.local.set({[PREFS_KEY]:prefs});if(!this.private)await this.previews.reconcile();return prefs;}
    async preferences() {await this.ready;return validatePreferences((await this.api.storage.local.get(PREFS_KEY))[PREFS_KEY]||DEFAULTS);}
    async updatePreferences(patch,replace=false) {
        const current=await this.preferences();if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Invalid settings change.');
        if(this.private && (replace||Object.keys(patch).some(k=>['previewSites','previewLimit','capture','historyEnabled','historyCount','historyDays','idleSites'].includes(k))))throw Error('Manage these settings in a regular window.');
        const next=validatePreferences(replace?patch:{...current,...patch});
        this.previews.invalidate();await this.api.storage.local.set({[PREFS_KEY]:next});
        if(!this.private){await this.previews.reconcile();await this.history('list');}return next;
    }
    async history(action='list',query='') {
        if(this.private)return [];
        const prefs=await this.preferences();let entries=cleanHistory((await this.api.storage.local.get(HISTORY))[HISTORY],prefs.historyDays);
        if(!['list','record','remove','clear'].includes(action))throw Error('Unknown history action.');
        if(typeof query!=='string'||query.length>500)throw Error('Search query is too long.');
        if(action==='clear')entries=[];
        else if(action==='remove')entries=entries.filter(e=>e.query.toLowerCase()!==query.trim().toLowerCase());
        else if(action==='record'&&prefs.historyEnabled&&query.trim())entries=cleanHistory([{query:query.trim(),time:Date.now()},...entries],prefs.historyDays);
        await this.api.storage.local.set({[HISTORY]:entries});return entries;
    }
    async preview(action, id=null) {
        if(this.private)throw Error('Preview management is unavailable in Incognito.');await this.ready;
        if(action==='usage')return this.previews.reconcile();
        if(action==='clearAll')return this.previews.clear();
        const tab=await this.api.tabs.get(id);if(tab.incognito||!/^https?:/.test(tab.url||''))throw Error('Choose a regular web tab.');
        if(action==='clear')return this.previews.clear(tab.id);
        const prefs=await this.preferences(),host=normalizeHost(tab.url);
        if(action==='exclude')return this.updatePreferences({previewSites:[...new Set([...prefs.previewSites,host])]});
        if(action==='allow')return this.updatePreferences({previewSites:prefs.previewSites.filter(h=>!siteMatches(tab.url,[h]))});
        throw Error('Unknown preview action.');
    }
    async import(text,apply=false) {if(typeof apply!=='boolean')throw Error('Invalid import action.');if(this.private)throw Error('Backup is unavailable in Incognito.');const prefs=importSettings(text);return apply?this.updatePreferences(prefs,true):prefs;}
    async protectedGroups(ids) {
        if(this.private)return [];
        const groups=await this.api.tabGroups.query({});const existing=(await this.api.storage.session.get('tabgridProtectedGroups')).tabgridProtectedGroups||[];
        if(ids!==undefined&&(!Array.isArray(ids)||ids.some(id=>!Number.isInteger(id))))throw Error('Invalid group selection.');
        const valid=(ids??existing).filter(id=>groups.some(g=>g.id===id));await this.api.storage.session.set({tabgridProtectedGroups:valid});return valid;
    }
}
