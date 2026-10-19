// Choose foreground contrast from the composited local wallpaper, not its filename
// or the selected theme. Sampling runs only after relevant layout/image changes.
export function wallpaperTextColor(pixels) {
    let luminance=0,count=0;
    const linear=value=>{const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;};
    for(let i=0;i<pixels.length;i+=4){luminance+=.2126*linear(pixels[i])+.7152*linear(pixels[i+1])+.0722*linear(pixels[i+2]);count++;}
    const mean=count?luminance/count:1;
    return (mean+.05)/.05 >= 1.05/(mean+.05) ? '#000000' : '#ffffff';
}
export function mountWallpaperContrast(image,root=document.documentElement) {
    const labels=[...document.querySelectorAll('.wallpaper-label')];
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=12;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    const reduced=matchMedia('(prefers-reduced-transparency: reduce)'),forced=matchMedia('(forced-colors: active)');
    let frame=0;
    function paint(){
        frame=0;
        const active=context&&root.classList.contains('has-custom-background')&&image.complete&&image.naturalWidth&&!reduced.matches&&!forced.matches;
        if(!active){for(const label of labels){label.style.removeProperty('--wallpaper-label-color');label.style.removeProperty('--wallpaper-label-shadow');}return;}
        const style=getComputedStyle(image),box=image.getBoundingClientRect(),rootStyle=getComputedStyle(root);
        const scale=Math.max(box.width/image.naturalWidth,box.height/image.naturalHeight);
        const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
        const x=box.left+(box.width-width)*(parseFloat(rootStyle.getPropertyValue('--background-x'))||0)/100;
        const y=box.top+(box.height-height)*(parseFloat(rootStyle.getPropertyValue('--background-y'))||0)/100;
        for(const label of labels){
            const r=label.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)continue;
            context.setTransform(1,0,0,1,0,0);context.globalAlpha=1;context.filter='none';
            context.fillStyle=rootStyle.backgroundColor;context.fillRect(0,0,64,12);
            context.setTransform(64/r.width,0,0,12/r.height,0,0);context.globalAlpha=Number(style.opacity);
            context.filter=style.filter;
            context.drawImage(image,x-r.left,y-r.top,width,height);
            const color=wallpaperTextColor(context.getImageData(0,0,64,12).data);
            label.style.setProperty('--wallpaper-label-color',color);
            label.style.setProperty('--wallpaper-label-shadow',`0 1px 2px ${color==='#ffffff'?'#0009':'#fff9'}`);
        }
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
    const observer=new MutationObserver(schedule);observer.observe(root,{attributes:true});
    const sizes=new ResizeObserver(schedule);for(const label of labels)sizes.observe(label);
    image.addEventListener('load',schedule);image.addEventListener('error',schedule);
    window.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,{capture:true,passive:true});
    reduced.addEventListener('change',schedule);forced.addEventListener('change',schedule);schedule();
    return ()=>{observer.disconnect();sizes.disconnect();cancelAnimationFrame(frame);image.removeEventListener('load',schedule);image.removeEventListener('error',schedule);window.removeEventListener('resize',schedule);document.removeEventListener('scroll',schedule,true);reduced.removeEventListener('change',schedule);forced.removeEventListener('change',schedule);};
}
