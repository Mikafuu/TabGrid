import { DEFAULTS, PREFS_KEY, siteMatches } from './preferences.mjs';
import { isGridUrl } from './tab-model.mjs';
const INDEX = 'tabgridPreviewIndex';
export class PreviewCache {
    constructor(api, gridUrl) { this.api=api;this.gridUrl=gridUrl;this.epoch=0;this.queue=Promise.resolve();this.times=new Map(); }
    serial(work) { const result=this.queue.then(work,work);this.queue=result.catch(()=>{});return result; }
    invalidate() { this.epoch++; }
    async preferences() { return {...DEFAULTS,...(await this.api.storage.local.get(PREFS_KEY))[PREFS_KEY]}; }
    async bytes(keys) { if(!keys.length)return 0; if(this.api.storage.local.getBytesInUse)return this.api.storage.local.getBytesInUse(keys);const data=await this.api.storage.local.get(null);return keys.reduce((n,k)=>n+new TextEncoder().encode(JSON.stringify({[k]:data[k]})).length,0); }
    async reconcileNow() {
        const [data,tabs,prefs]=await Promise.all([this.api.storage.local.get(null),this.api.tabs.query({}),this.preferences()]);
        const index=data[INDEX]||{},keys=Object.keys(data).filter(k=>k.startsWith('screenshot_')),remove=[];
        for(const key of keys) {
            const tab=tabs.find(t=>t.id===Number(key.slice(11))), meta=index[key];
            if(!tab || tab.incognito || isGridUrl(tab.url,this.gridUrl) || siteMatches(tab.url,prefs.previewSites) || (meta && meta.url!==tab.url)) {remove.push(key);delete index[key];continue;}
            index[key]={url:tab.url,time:meta?.time||0};
        }
        for(const key of Object.keys(index))if(!keys.includes(key))delete index[key];
        if(remove.length)await this.api.storage.local.remove(remove);
        const kept=keys.filter(k=>!remove.includes(k)).sort((a,b)=>(index[a]?.time||0)-(index[b]?.time||0));
        let usage=await this.bytes(kept), limit=prefs.previewLimit*1024*1024;
        while(usage>limit && kept.length) {const key=kept.shift();await this.api.storage.local.remove(key);delete index[key];usage=await this.bytes(kept);}
        await this.api.storage.local.set({[INDEX]:index});return {bytes:usage,count:kept.length,limit};
    }
    reconcile() { return this.serial(()=>this.reconcileNow()); }
    async clear(tabId=null) {
        this.invalidate();return this.serial(async()=>{const data=await this.api.storage.local.get(null);const keys=Object.keys(data).filter(k=>k.startsWith('screenshot_')&&(tabId===null||k===`screenshot_${tabId}`));if(keys.length)await this.api.storage.local.remove(keys);return this.reconcileNow();});
    }
    async capture(tabId) {
        const token=this.epoch;
        try {
            const [tab,prefs]=await Promise.all([this.api.tabs.get(tabId),this.preferences()]);
            if(!prefs.capture||!tab.active||tab.incognito||isGridUrl(tab.url,this.gridUrl)||!/^https?:/.test(tab.url||'')||siteMatches(tab.url,prefs.previewSites))return;
            const now=Date.now();if(now-(this.times.get(tab.windowId)||0)<600)return;this.times.set(tab.windowId,now);
            const data=await this.api.tabs.captureVisibleTab(tab.windowId,{format:'jpeg',quality:40});
            await this.serial(async()=>{
                const [current,p]=await Promise.all([this.api.tabs.get(tabId).catch(()=>null),this.preferences()]);
                const active=(await this.api.tabs.query({windowId:tab.windowId})).find(t=>t.active);
                if(token!==this.epoch||!current||current.incognito||active?.id!==tabId||current.url!==tab.url||!p.capture||siteMatches(current.url,p.previewSites))return;
                const key=`screenshot_${tabId}`,size=new TextEncoder().encode(JSON.stringify({[key]:data})).length;
                if(size>p.previewLimit*1024*1024)return;
                const index=(await this.api.storage.local.get(INDEX))[INDEX]||{};index[key]={url:current.url,time:Date.now()};
                if(token!==this.epoch)return;
                await this.api.storage.local.set({[key]:data,[INDEX]:index});await this.reconcileNow();
            });
        } catch { /* Restricted or closed pages retain the local fallback. */ }
    }
}
