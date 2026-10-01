// Session-owned creation order survives worker suspension. Existing windows are
// seeded in Chrome's enumeration order on first use; earlier creation times are
// not exposed by the Chrome API.
export class WindowOrder {
    constructor(api,privateMode=false){this.api=api;this.private=privateMode;this.key=`tabgridWindowOrder:${privateMode?'private':'regular'}`;}
    async snapshot(){
        const wins=(await this.api.windows.getAll({windowTypes:['normal']})).filter(w=>Boolean(w.incognito)===this.private);
        const ids=wins.map(w=>w.id),saved=(await this.api.storage.session.get(this.key))[this.key]||[];
        const order=[...new Set([...saved.filter(id=>ids.includes(id)),...ids])];
        await this.api.storage.session.set({[this.key]:order});return order;
    }
    async created(win){if(Boolean(win.incognito)!==this.private||win.type&&win.type!=='normal')return;const saved=(await this.api.storage.session.get(this.key))[this.key]||[];await this.api.storage.session.set({[this.key]:[...new Set([...saved,win.id])]});}
    async removed(id){const saved=(await this.api.storage.session.get(this.key))[this.key]||[];await this.api.storage.session.set({[this.key]:saved.filter(value=>value!==id)});}
}
export const numberedWindow=(id,order)=>order.includes(id)?`Window ${order.indexOf(id)+1}`:'Window';
