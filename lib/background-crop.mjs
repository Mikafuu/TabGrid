export const clampCrop=(value,min,max)=>Math.max(min,Math.min(max,value));
export function panBackground(start,dx,dy,{width,height,imageWidth,imageHeight,zoom}) {
    const scale=Math.max(width/imageWidth,height/imageHeight)*zoom/100;
    const overflowX=imageWidth*scale-width,overflowY=imageHeight*scale-height;
    return {backgroundX:Math.round(clampCrop(start.backgroundX-(overflowX>1?dx/overflowX*100:0),0,100)),backgroundY:Math.round(clampCrop(start.backgroundY-(overflowY>1?dy/overflowY*100:0),0,100))};
}
