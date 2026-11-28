import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {traceRoomDaylight} from '../room-polish.js';
test('arched window rays respond to real frame geometry; plaster receives only bounded indirect light',()=>{
 const old=globalThis.document, canvases=[];
 globalThis.document={createElement:()=>({getContext:()=>({
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData:result=>canvases.push(result)
 })})};
 try{
  const scene=new T.Scene(),opening=new T.Group();opening.position.set(-1.25,1.1,-2.12);scene.add(opening);
  const bar=new T.Mesh(new T.BoxGeometry(.12,1.59,.07),new T.MeshBasicMaterial());bar.position.set(0,.895,.085);opening.add(bar);
  const config={scene,opening,aperture:{half:.76,spring:.93},receivers:[]};
  const glass=traceRoomDaylight(T,{...config,mullions:[]});
  const blocked=traceRoomDaylight(T,{...config,mullions:[bar]});
  assert.equal(glass.primary,blocked.primary);
  assert.ok(blocked.through>0&&blocked.through<glass.through);
  assert.ok(blocked.bounceSources>0&&blocked.bounced>0);
  assert.equal(canvases.length,6);
  assert.ok(canvases.every(v=>v.data.length===72*72*4&&v.data.some((x,i)=>i%4===0&&x>0)));
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
