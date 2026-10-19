// A wallpaper is uploaded once per appearance/viewport/quality, not once per lens.
export function clippedTextureCopy(x,y,width,height,sourceWidth,sourceHeight) {
    const sx=Math.max(0,x),sy=Math.max(0,y),dx=Math.max(0,-x),dy=Math.max(0,-y);
    return {source:{x:sx,y:sy},destination:{x:dx,y:dy},width:Math.max(0,Math.min(width-dx,sourceWidth-sx)),height:Math.max(0,Math.min(height-dy,sourceHeight-sy))};
}
export function wallpaperTexture(pool,image,{placement,dpr,opacity,blur,color,width,height,padding}) {
    pool.backdrops??=new Map();
    const key=[placement.x,placement.y,placement.width,placement.height,opacity,blur,color,width,height].join('|');
    if(pool.wallpaperKey!==key||pool.wallpaperSource!==image.currentSrc){for(const item of pool.backdrops.values())item.texture.destroy();pool.backdrops.clear();pool.wallpaperKey=key;pool.wallpaperSource=image.currentSrc;}
    if(pool.backdrops.has(dpr))return pool.backdrops.get(dpr);
    const canvas=document.createElement('canvas');canvas.width=Math.ceil((width+padding*4)*dpr);canvas.height=Math.ceil((height+padding*4)*dpr);
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
    ctx.globalAlpha=opacity;ctx.filter=blur?`blur(${blur*dpr}px)`:'none';ctx.drawImage(image,placement.x+padding*2,placement.y+padding*2,placement.width,placement.height);
    const texture=pool.device.createTexture({size:[canvas.width,canvas.height],format:'rgba8unorm',usage:GPUTextureUsage.COPY_SRC|GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT});
    pool.device.queue.copyExternalImageToTexture({source:canvas},{texture},[canvas.width,canvas.height]);
    const value={texture,width:canvas.width,height:canvas.height};pool.backdrops.set(dpr,value);pool.backdropUploads=(pool.backdropUploads||0)+1;
    return value;
}
