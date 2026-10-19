import {wallpaperTexture,clippedTextureCopy} from './glass-backdrop.mjs';
// Real liquid-dom optics, sampling only the user's wallpaper. No Html nodes,
// DOM capture, HTML-in-Canvas, or continuously running animation loop.
const PADDING = 128; // Room for wallpaper blur and the refracted sample footprint.

// All visible surfaces share one device and shader pipeline. Only their output
// canvases and wallpaper crops are separate; hidden surfaces release textures.
let shared;
let scrollUntil=0,scrollTimer;
const scrollSubscribers=new Set();
function scrolling(){scrollUntil=performance.now()+140;clearTimeout(scrollTimer);for(const notify of scrollSubscribers)notify();scrollTimer=setTimeout(()=>{scrollUntil=0;for(const notify of scrollSubscribers)notify();},145);}
function subscribeScroll(notify){if(!scrollSubscribers.size)window.addEventListener('scroll',scrolling,true);scrollSubscribers.add(notify);return()=>{scrollSubscribers.delete(notify);if(!scrollSubscribers.size){window.removeEventListener('scroll',scrolling,true);clearTimeout(scrollTimer);scrollUntil=0;}};}

async function acquireGpu() {
    if (!shared) {
        const entry = {users:0,promise:null};shared = entry;
        entry.promise = (async () => {
            if (!navigator.gpu) throw Error('WebGPU is unavailable');
            const [library,adapter] = await Promise.all([import('../node_modules/@liquid-dom/core/dist/index.js'),navigator.gpu.requestAdapter({powerPreference:'low-power'})]);
            if (!adapter) throw Error('No WebGPU adapter');
            const device = await adapter.requestDevice(), format = navigator.gpu.getPreferredCanvasFormat();
            device.pushErrorScope('validation');
            let core;
            try {core = new library.WebGpuGlassCore({device,format});const error=await device.popErrorScope();if(error)throw Error(error.message);}
            catch(error){core?.destroy();device.destroy();throw error;}
            Object.assign(entry,{device,format,core,library});return entry;
        })();
    }
    const entry = await shared.promise;entry.users++;return entry;
}
function releaseGpu(entry) {
    if (--entry.users === 0) {for(const item of entry.backdrops?.values()||[])item.texture.destroy();entry.core.destroy();entry.device.destroy();if(shared===entry)shared=null;}
}

let tintContext;
const tintCache = new Map();
function parseTint(value) {
    if(tintCache.has(value))return tintCache.get(value);
    if(!tintContext){const canvas=document.createElement('canvas');canvas.width=canvas.height=1;tintContext=canvas.getContext('2d',{willReadFrequently:true});}
    tintContext.clearRect(0,0,1,1);tintContext.fillStyle=value;tintContext.fillRect(0,0,1,1);
    const rgba=tintContext.getImageData(0,0,1,1).data,result={r:rgba[0]/255,g:rgba[1]/255,b:rgba[2]/255,a:rgba[3]/255};
    if(tintCache.size>64)tintCache.clear();tintCache.set(value,result);return result;
}

export function coverImageRect(imageWidth, imageHeight, box, position = {x:50,y:50}) {
    const scale = Math.max(box.width / imageWidth, box.height / imageHeight);
    const width = imageWidth * scale, height = imageHeight * scale;
    return {x: box.left + (box.width - width) * position.x / 100, y: box.top + (box.height - height) * position.y / 100, width, height};
}

export function mountFilterGlass(button, image, root = document.documentElement, {panel = false, disclosure = button.closest('.filter-disclosure'), general = false} = {}) {
    if (panel) button.classList.add('filter-glass-panel');
    if (general) button.classList.add('liquid-surface');
    const surface = document.createElement('span');
    surface.className = 'filter-glass-surface';
    surface.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    surface.append(canvas); button.prepend(surface);
    const reduced = matchMedia('(prefers-reduced-transparency: reduce)');
    const forced = matchMedia('(forced-colors: active)');
    let gpu, initializing, frame = 0, destroyed = false, failed = false;
    let renders = 0, motionWarmup = 0;
    const content = panel ? button.closest('.filter-content') : null;
    let visible = true;
    const moving = () => button.getAnimations().some(a=>a.playState==='running') || button.matches('[data-liquid-motion=running]') || Boolean(button.closest('[data-liquid-motion=running]')) || disclosure?.querySelector('[data-liquid-motion=running]') || motionWarmup > 0 || Boolean(disclosure?.getAnimations({subtree: true}).some(animation => animation.playState === 'running'));

    function eligible() {
        return visible && !destroyed && !failed && root.dataset.visualStyle === 'glass' &&
            root.classList.contains('has-custom-background') && image.complete && image.naturalWidth > 0 &&
            !reduced.matches && !forced.matches && !document.hidden && button.isConnected && button.getClientRects().length > 0 && !button.closest('[hidden]') &&
            (!button.closest('dialog') || button.closest('dialog').open || button.closest('dialog').matches('[data-liquid-motion=running]')) &&
            (!button.hasAttribute('popover') || button.matches(':popover-open') || button.matches('[data-liquid-motion=running]')) &&
            (!content?.hasAttribute('data-collapsed') || moving());
    }
    function fallback(reason) {
        if(button.classList.contains('filter-glass-ready'))button.classList.remove('filter-glass-ready');
        button.dataset.glassRenderer = reason;
    }
    function release() {
        if (!gpu) return;
        const old = gpu; gpu = null;
        old.texture?.destroy(); old.context.unconfigure(); releaseGpu(old.pool);
    }
    function fail(error) {
        failed = true; fallback('css-fallback'); release();
        // Diagnostic only: no user wallpaper or pixel data is logged.
        console.warn('Liquid glass unavailable:', error?.message || String(error));
    }
    async function initialize() {
        const pool = await acquireGpu();
        const {device,format,core,library:{Scene,Container,Glass}} = pool;
        if (destroyed || !eligible()) {releaseGpu(pool);return;}
        const context = canvas.getContext('webgpu');
        if (!context) {releaseGpu(pool);throw Error('No WebGPU canvas context');}
        context.configure({device,format,alphaMode:'opaque'});
        const scene = new Scene();
        const container = new Container({
            blur: panel ? 7 : 1.4, thickness: panel ? 18 : 24, bezelWidth: panel ? 10 : 7, ior: 1.5,
            displacementBlur: 1, dispersion: .025,
            specularStrength: panel ? .5 : .8, specularWidth: 1.5, specularOpacity: panel ? .35 : .5,
            reflectionOffset: 5, shadowColor: {r: 0, g: 0, b: 0, a: 0}
        });
        const glass = new Glass({x: PADDING, y: PADDING, cornerSmoothing: 0});
        container.add(glass); scene.add(container);
        gpu = {pool, device, context, core, scene, container, glass, texture: null, size: ''};
        // Validation errors are captured around each submitted frame below.
        device.lost.then(info => { if (gpu?.device === device && !destroyed) fail(Error(info.message || 'GPU device lost')); });
    }
    async function render() {
        frame = 0;
        if (motionWarmup > 0) motionWarmup--;
        if (!eligible()) { fallback('css-fallback'); release(); return; }
        if (!gpu) {
            if (!initializing) initializing = initialize().catch(fail).finally(() => { initializing = null; if (eligible()) schedule(); });
            return;
        }
        const current = gpu;
        let validationOpen=false;
        try {
            const rect = button.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) { fallback('css-fallback'); release(); return; }
            if (surface.parentNode !== button) button.prepend(surface);
            // Absolute decoration must remain pinned to a scrolling menu's viewport.
            surface.style.width = `${button.offsetWidth}px`;
            surface.style.height = `${button.offsetHeight}px`;
            surface.style.transform = `translate(${button.scrollLeft}px,${button.scrollTop}px)`;
            const width = rect.width + PADDING * 2, height = rect.height + PADDING * 2;
            const dpr = Math.min(devicePixelRatio || 1, performance.now()<scrollUntil ? 1 : panel ? 1.5 : 2, current.device.limits.maxTextureDimension2D/Math.max(innerWidth+PADDING*4,innerHeight+PADDING*4));
            const pixelWidth = Math.ceil(width * dpr), pixelHeight = Math.ceil(height * dpr);
            const size = `${pixelWidth}:${pixelHeight}`;
            const imageStyle = getComputedStyle(image), rootStyle=getComputedStyle(root), buttonStyle=getComputedStyle(button);
            const placement = coverImageRect(image.naturalWidth, image.naturalHeight, image.getBoundingClientRect(),{x:parseFloat(rootStyle.getPropertyValue('--background-x'))||0,y:parseFloat(rootStyle.getPropertyValue('--background-y'))||0});
            const blur = (Number.parseFloat(rootStyle.getPropertyValue('--background-blur')) || 0) * (Number.parseFloat(rootStyle.getPropertyValue('--background-zoom')) || 1);
            const tint = buttonStyle.getPropertyValue('--liquid-surface-tint').trim();
            const radius=Math.min(rect.height/2,Number.parseFloat(buttonStyle.borderTopLeftRadius)||0);
            const key=[rect.x,rect.y,rect.width,rect.height,dpr,placement.x,placement.y,placement.width,placement.height,imageStyle.opacity,blur,rootStyle.backgroundColor,tint,radius,button.getAttribute('aria-expanded')].join('|');
            // A sibling's animation should not redraw every visible tab card.
            if(current.frameKey===key&&current.source===image.currentSrc&&button.classList.contains('filter-glass-ready'))return;
            current.device.pushErrorScope('validation');validationOpen=true;
            if (size !== current.size) {
                canvas.width = pixelWidth; canvas.height = pixelHeight;
                canvas.style.width = `${pixelWidth / dpr}px`; canvas.style.height = `${pixelHeight / dpr}px`;
                current.texture?.destroy();
                current.texture = current.device.createTexture({size: [pixelWidth, pixelHeight], format: 'rgba8unorm',
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT});
                current.size = size;current.cropKey=null;
            }
            const source=wallpaperTexture(current.pool,image,{placement,dpr,opacity:Number(imageStyle.opacity),blur,color:rootStyle.backgroundColor,width:innerWidth,height:innerHeight,padding:PADDING});
            const cropKey=[rect.x,rect.y,pixelWidth,pixelHeight,dpr].join('|');
            if(current.cropKey!==cropKey||current.backdrop!==source){
                const copy=clippedTextureCopy(Math.round((rect.left+PADDING)*dpr),Math.round((rect.top+PADDING)*dpr),pixelWidth,pixelHeight,source.width,source.height);
                if(copy.width&&copy.height){const encoder=current.device.createCommandEncoder();encoder.copyTextureToTexture({texture:source.texture,origin:copy.source},{texture:current.texture,origin:copy.destination},[copy.width,copy.height]);current.device.queue.submit([encoder.finish()]);}
                current.cropKey=cropKey;current.backdrop=source;
            }
            button.dataset.glassUploads=String(current.pool.backdropUploads);button.dataset.glassResolution=String(dpr);
            Object.assign(current.glass, {width: rect.width, height: rect.height,
                cornerRadius: radius});
            if (!panel) {current.container.bezelWidth=Math.min(7,rect.height/3);current.container.thickness=Math.min(24,rect.height);}
            const dark = root.dataset.colorMode === 'dark';
            const pressed = button.matches(':active') || button.getAttribute('aria-expanded') === 'true';
            const defaultAlpha = panel ? (dark ? .72 : .40) : (dark ? .55 : .12);
            current.container.tint = parseTint(tint || `rgba(${dark?'10,10,10':'255,255,255'},${defaultAlpha})`);
            if (!panel) current.container.specularOpacity = button.getAttribute('aria-expanded') === 'true' ? .16 : .5;
            current.core.render({scene: current.scene, width: pixelWidth, height: pixelHeight, dpr,
                outputTexture: current.context.getCurrentTexture(), backdropTexture: current.texture});
            const error = await current.device.popErrorScope();validationOpen=false;
            if (error) throw Error(error.message);
            if (gpu !== current || !eligible()) return;
            if(!button.classList.contains('filter-glass-ready'))button.classList.add('filter-glass-ready');
            button.dataset.glassRenderer = 'webgpu';
            button.dataset.glassFrames = String(++renders);current.frameKey=key;current.source=image.currentSrc;
        } catch (error) { if (gpu === current) fail(error); }
        finally { if(validationOpen)await current.device.popErrorScope().catch(()=>{}); if (!destroyed && !failed && moving()) schedule(); }
    }
    function schedule() {
        if (!frame && !destroyed) frame = requestAnimationFrame(render);
    }
    const resize = new ResizeObserver(schedule); resize.observe(button); resize.observe(image);
    const appearance = new MutationObserver(schedule);
    appearance.observe(root, {attributes: true, attributeFilter: ['class', 'style', 'data-visual-style', 'data-color-mode', 'data-theme']});
    const state = new MutationObserver(schedule);
    state.observe(button, {attributes: true, attributeFilter: ['aria-expanded','open','hidden','data-liquid-motion','class','aria-current','aria-pressed']});
    // Follow the existing animation owner's geometry only while it is moving.
    // Three warmup frames cover AutoAnimate's deferred effect construction.
    const motionState = new MutationObserver(records => {
        if (records.some(record => record.type === 'attributes' || [...record.addedNodes].some(node => node.nodeType === 1 && node.hasAttribute('data-motion-cue')))) {
            motionWarmup = 3; schedule();
        }
    });
    if (disclosure) motionState.observe(disclosure, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-collapsed']});
    const intersection = new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();});intersection.observe(button);
    const cardState = button.closest('.card');
    if(cardState) state.observe(cardState,{attributes:true,attributeFilter:['class','style']});
    const removers = [];
    const listen = (target, name, options) => { target.addEventListener(name, schedule, options); removers.push(() => target.removeEventListener(name, schedule, options)); };
    for (const name of ['pointerenter', 'pointerleave', 'pointerdown', 'pointerup', 'focusin', 'focusout', 'toggle', 'pointerover', 'pointerout']) listen(button, name);
    listen(document, 'liquid-glass-frame');
    listen(image, 'load'); listen(image, 'error'); listen(window, 'resize'); removers.push(subscribeScroll(schedule));
    listen(document, 'visibilitychange'); listen(reduced, 'change'); listen(forced, 'change');
    document.fonts?.ready.then(schedule);
    schedule();
    return {refresh(){motionWarmup=3;schedule();}, destroy() {
        destroyed = true; cancelAnimationFrame(frame); release(); fallback('css-fallback');
        resize.disconnect(); appearance.disconnect(); state.disconnect(); motionState.disconnect(); intersection.disconnect(); removers.forEach(remove => remove()); surface.remove();button.classList.remove('liquid-surface','filter-glass-panel');delete button.dataset.glassRenderer;
    }};
}
