import { tr } from './i18n.mjs';
export const BACKGROUND_KEY = 'tabgridBackground';
export const MAX_BACKGROUND_UPLOAD_BYTES = 1_000_000_000; // 1 GB input; stored images remain bounded.
export const MAX_BACKGROUND_BYTES = 4 * 1024 * 1024;
export function validateBackground(value) {
    if (!value || typeof value !== 'object' || typeof value.name !== 'string' || value.name.length > 160 ||
        typeof value.dataUrl !== 'string' || value.dataUrl.length > Math.ceil(MAX_BACKGROUND_BYTES / 3) * 4 + 64 ||
        !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.dataUrl)) throw Error(tr("Choose a valid background image."));
    let bytes;try { bytes=atob(value.dataUrl.split(',')[1]); } catch { throw Error(tr("Choose a valid background image.")); }
    if (bytes.length > MAX_BACKGROUND_BYTES || bytes.slice(0,4)!=='RIFF' || bytes.slice(8,12)!=='WEBP') throw Error(tr("Choose a valid background image."));
    return {name:value.name,dataUrl:value.dataUrl};
}
export function backgroundDimensions(width,height) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width<1 || height<1) throw Error(tr("Choose an image with valid dimensions."));
    const scale=Math.min(1,2560/Math.max(width,height));
    return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
async function backgroundFileDimensions(file) {
    const url=URL.createObjectURL(file),image=new Image();
    try {
        await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
        return backgroundDimensions(image.naturalWidth,image.naturalHeight);
    } finally { image.onload=image.onerror=null;image.removeAttribute('src');URL.revokeObjectURL(url); }
}
export async function prepareBackground(file) {
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw Error(tr("Choose a JPG, PNG, or WebP image."));
    if (!file.size || file.size>MAX_BACKGROUND_UPLOAD_BYTES) throw Error(tr("Choose an image no larger than 1 GB."));
    let bitmap;
    try {
        // Read oriented dimensions through a local object URL, without creating
        // a base64 copy of a potentially 1 GB source. Decode a bounded bitmap.
        const size=await backgroundFileDimensions(file);
        bitmap=await createImageBitmap(file,{resizeWidth:size.width,resizeHeight:size.height,resizeQuality:'high'});
    } catch { throw Error(tr("This image could not be opened. Try another JPG, PNG, or WebP file.")); }
    try {
        const size=backgroundDimensions(bitmap.width,bitmap.height),canvas=document.createElement('canvas');
        Object.assign(canvas,size);const context=canvas.getContext('2d');
        if (!context) throw Error(tr("Image processing is unavailable."));
        context.drawImage(bitmap,0,0,size.width,size.height);
        // Re-encoding limits storage size and drops original metadata; animated WebP uses its first frame.
        let dataUrl=canvas.toDataURL('image/webp',0.85);
        if (dataUrl.length>MAX_BACKGROUND_BYTES*4/3) dataUrl=canvas.toDataURL('image/webp',0.65);
        return validateBackground({name:file.name.slice(0,160),dataUrl});
    } finally { bitmap.close(); }
}
export function applyBackgroundAdjustments(root,prefs) {
    root.style.setProperty('--background-zoom',String((prefs.backgroundZoom??100)/100));
    root.style.setProperty('--background-x',`${prefs.backgroundX??50}%`);
    root.style.setProperty('--background-y',`${prefs.backgroundY??50}%`);
    root.style.setProperty('--background-opacity',String(1-(prefs.backgroundTransparency??35)/100));
    root.style.setProperty('--background-blur',`${prefs.backgroundBlur??0}px`);
}
export function mountBackground(api,root=document.documentElement) {
    const layer=document.createElement('div');layer.id='custom-background';layer.setAttribute('aria-hidden','true');
    const image=document.createElement('img');image.alt='';layer.append(image);document.body.prepend(layer);
    let current=null,revision=0;const listeners=new Set();
    function set(value) {
        try { current=value?validateBackground(value):null; } catch { current=null; }
        image.onload=()=>root.classList.add('has-custom-background');
        image.onerror=()=>root.classList.remove('has-custom-background');
        if(current)image.src=current.dataUrl;
        else{image.removeAttribute('src');root.classList.remove('has-custom-background');}
        for(const listener of listeners)listener();
    }
    const change=(changes,area)=>{if(area==='local'&&BACKGROUND_KEY in changes){revision++;set(changes[BACKGROUND_KEY].newValue);}};
    api.storage.onChanged.addListener(change);
    const loadingRevision=revision;
    api.storage.local.get(BACKGROUND_KEY).then(data=>{if(revision===loadingRevision)set(data[BACKGROUND_KEY]);}).catch(()=>{});
    return {get:()=>current,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},destroy(){api.storage.onChanged.removeListener?.(change);layer.remove();root.classList.remove('has-custom-background');listeners.clear();}};
}
