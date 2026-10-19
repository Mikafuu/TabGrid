export const BACKGROUND_KEY = 'tabgridBackground';
export const MAX_BACKGROUND_BYTES = 4 * 1024 * 1024;
export function validateBackground(value) {
    if (!value || typeof value !== 'object' || typeof value.name !== 'string' || value.name.length > 160 ||
        typeof value.dataUrl !== 'string' || value.dataUrl.length > Math.ceil(MAX_BACKGROUND_BYTES / 3) * 4 + 64 ||
        !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.dataUrl)) throw Error('Choose a valid background image.');
    let bytes;try { bytes=atob(value.dataUrl.split(',')[1]); } catch { throw Error('Choose a valid background image.'); }
    if (bytes.length > MAX_BACKGROUND_BYTES || bytes.slice(0,4)!=='RIFF' || bytes.slice(8,12)!=='WEBP') throw Error('Choose a valid background image.');
    return {name:value.name,dataUrl:value.dataUrl};
}
export function backgroundDimensions(width,height) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width<1 || height<1 || width*height>40000000) throw Error('Choose an image with at most 40 million pixels.');
    const scale=Math.min(1,2560/Math.max(width,height));
    return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export async function prepareBackground(file) {
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw Error('Choose a JPG, PNG, or WebP image.');
    if (!file.size || file.size>15*1024*1024) throw Error('Choose an image smaller than 15 MiB.');
    let bitmap;
    try { bitmap=await createImageBitmap(file); } catch { throw Error('This image could not be opened. Try another JPG, PNG, or WebP file.'); }
    try {
        const size=backgroundDimensions(bitmap.width,bitmap.height),canvas=document.createElement('canvas');
        Object.assign(canvas,size);const context=canvas.getContext('2d');
        if (!context) throw Error('Image processing is unavailable.');
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
