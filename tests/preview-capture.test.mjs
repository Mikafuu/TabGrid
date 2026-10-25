import test from 'node:test';
import assert from 'node:assert/strict';
import { canCaptureUrl, thumbnailDimensions, shrinkPreview } from '../lib/preview-capture.mjs';

test('restricted-page capture is eligible only for a deliberate user invocation',()=>{
    for(const url of ['chrome://newtab/','chrome://settings/','chrome-extension://other/page.html','about:blank','file:///tmp/example.html','data:text/html,hello']){
        assert.equal(canCaptureUrl(url),false,url);assert.equal(canCaptureUrl(url,true),true,url);
    }
    for(const url of ['https://chromewebstore.google.com/','https://example.com/'])assert.equal(canCaptureUrl(url),true);
    for(const url of ['javascript:alert(1)','invalid','ftp://example.com/'])assert.equal(canCaptureUrl(url,true),false,url);
});
test('preview dimensions fit the thumbnail bounds without stretching or upscaling',()=>{
    assert.deepEqual(thumbnailDimensions(2940,1912),{width:923,height:600});
    assert.deepEqual(thumbnailDimensions(3840,1080),{width:960,height:270});
    assert.deepEqual(thumbnailDimensions(800,600),{width:800,height:600});
    assert.deepEqual(thumbnailDimensions(1000,2000),{width:300,height:600});
});
test('thumbnail conversion uses JPEG quality, releases decoded images and preserves smaller originals',async()=>{
    const originalCanvas=globalThis.OffscreenCanvas,originalBitmap=globalThis.createImageBitmap;
    let closed=0,draws=0,options;
    globalThis.createImageBitmap=async()=>({width:1920,height:1200,close:()=>closed++});
    globalThis.OffscreenCanvas=class{constructor(w,h){assert.equal(w,960);assert.equal(h,600);}getContext(){return {drawImage:()=>draws++};}async convertToBlob(o){options=o;return new Blob(['small']);}};
    const data='data:image/jpeg;base64,'+btoa('x'.repeat(100));
    try{
        assert.equal(await shrinkPreview(data,40),'data:image/jpeg;base64,'+btoa('small'));
        assert.equal(closed,1);assert.equal(draws,1);assert.deepEqual(options,{type:'image/jpeg',quality:.4});
        assert.equal(await shrinkPreview('data:image/jpeg;base64,eA==',40),'data:image/jpeg;base64,eA==');
        globalThis.createImageBitmap=async()=>{throw Error('decoder unavailable');};
        assert.equal(await shrinkPreview(data,40),data);
    }finally{if(originalCanvas===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=originalCanvas;if(originalBitmap===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=originalBitmap;}
});
