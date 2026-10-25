// A toolbar/command invocation can grant activeTab for restricted pages.
// An already-authorized tab may be tried again; Chrome still enforces the grant.
export function canCaptureUrl(url, authorized=false) {
    try {
        const protocol=new URL(url).protocol;
        return ['http:','https:'].includes(protocol) || (authorized && ['chrome:','chrome-search:','chrome-extension:','about:','data:','file:'].includes(protocol));
    } catch { return false; }
}
export function thumbnailDimensions(width,height) {
    const scale=Math.min(1,960/width,600/height);
    return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export async function shrinkPreview(data,quality) {
    if(typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined'||!data.startsWith('data:image/'))return data;
    let bitmap;
    try {
        const match=/^data:(image\/[\w.+-]+);base64,(.+)$/.exec(data);if(!match)return data;
        const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
        bitmap=await createImageBitmap(new Blob([bytes],{type:match[1]}));
        const size=thumbnailDimensions(bitmap.width,bitmap.height);
        if(size.width===bitmap.width&&size.height===bitmap.height)return data;
        const canvas=new OffscreenCanvas(size.width,size.height),ctx=canvas.getContext('2d');
        if(!ctx)return data;
        ctx.drawImage(bitmap,0,0,size.width,size.height);
        const blob=await canvas.convertToBlob({type:'image/jpeg',quality:quality/100});
        const compressed=new Uint8Array(await blob.arrayBuffer());let binary='';
        for(let i=0;i<compressed.length;i+=8192)binary+=String.fromCharCode(...compressed.subarray(i,i+8192));
        const resized=`data:image/jpeg;base64,${btoa(binary)}`;
        return resized.length<data.length?resized:data;
    } catch { return data; } finally { bitmap?.close(); }
}
