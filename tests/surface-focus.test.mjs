import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseSurfaceFocus} from '../lib/surface-focus.mjs';
function fixture(){
    const doc={activeElement:null},child={blur(){doc.activeElement=null;}},surface={contains:el=>el===child,blur(){doc.activeElement=null;}};
    const invoker={isConnected:true,focus(){doc.activeElement=this;}};
    return {doc,child,surface,invoker};
}
test('closing a menu transfers focused descendants to its invoker before hiding',()=>{
    const f=fixture();f.doc.activeElement=f.child;
    releaseSurfaceFocus(f.surface,f.invoker,f.doc);assert.equal(f.doc.activeElement,f.invoker);
});
test('modal self-focus is released even when the browser refuses outside focus',()=>{
    const f=fixture();f.doc.activeElement=f.surface;f.invoker.focus=()=>{};
    releaseSurfaceFocus(f.surface,f.invoker,f.doc);assert.equal(f.doc.activeElement,null);
});
test('closing does not steal focus from another surface or focus a detached invoker',()=>{
    const f=fixture(),other={};f.doc.activeElement=other;
    releaseSurfaceFocus(f.surface,f.invoker,f.doc);assert.equal(f.doc.activeElement,other);
    f.doc.activeElement=f.child;f.invoker.isConnected=false;
    releaseSurfaceFocus(f.surface,f.invoker,f.doc);assert.equal(f.doc.activeElement,null);
});
