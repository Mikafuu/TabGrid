import chinese from '../locales/zh-CN.mjs';
import japanese from '../locales/ja.mjs';
export const catalogs = {'zh-CN': chinese, ja: japanese};
export const LANGUAGES = ['auto', 'en', 'zh-CN', 'ja'];
let language = 'en';
export function resolveLanguage(preference = 'auto', browserLanguage = globalThis.navigator?.language || 'en') {
    const choice = preference === 'auto' ? browserLanguage : preference;
    if (/^zh(?:-|_|$)/i.test(choice)) return 'zh-CN';
    if (/^ja(?:-|_|$)/i.test(choice)) return 'ja';
    return 'en';
}
export function setLanguage(preference, browserLanguage) {
    language = resolveLanguage(preference, browserLanguage);
    return language;
}
export const currentLanguage = () => language;
export function tr(message, values = []) {
    const text = catalogs[language]?.[message] ?? message;
    return String(text).replace(/\{(\d+)\}/g, (token, index) => index < values.length ? String(values[index]) : token);
}
// Background errors arrive in English. Match known templates only at error boundaries.
export function translateError(message) {
    if (typeof message !== 'string' || language === 'en') return message;
    if (catalogs[language]?.[message]) return tr(message);
    for (const key of Object.keys(catalogs[language])) {
        if (!/\{\d+\}/.test(key)) continue;
        const indices = [];
        const expression = key.split(/(\{\d+\})/).map(part => {
            if (/^\{\d+\}$/.test(part)) { indices.push(Number(part.slice(1,-1))); return '([\\s\\S]*?)'; }
            return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        const match = message.match(new RegExp('^' + expression + '$'));
        if (match) { const values=[];indices.forEach((id,i)=>values[id]=translateError(match[i+1]));return tr(key,values); }
    }
    return message;
}
export function localizeDocument(root = document) {
    root.documentElement.lang = language;
    const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT);
    for (let node; (node = walker.nextNode());) {
        if (node.parentElement?.closest('script,style')) continue;
        const key = node.nodeValue.trim();
        if (key) node.nodeValue = node.nodeValue.replace(key, tr(key));
    }
    for (const element of root.querySelectorAll('[aria-label],[placeholder],[title],[alt],[aria-valuetext]')) {
        for (const name of ['aria-label','placeholder','title','alt','aria-valuetext']) {
            if (element.hasAttribute(name)) element.setAttribute(name, tr(element.getAttribute(name)));
        }
    }
}
export async function initializeLanguage(api = globalThis.chrome) {
    let preference = 'auto';
    try { preference = (await api.storage.local.get('tabgridPreferences')).tabgridPreferences?.language || 'auto'; } catch {}
    setLanguage(preference, api?.i18n?.getUILanguage?.() || globalThis.navigator?.language);
    if (typeof document !== 'undefined') localizeDocument(document);
}
