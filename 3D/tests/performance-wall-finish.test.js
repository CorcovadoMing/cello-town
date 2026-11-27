import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../vendor/three.module.js';
import {decoratePerformanceRoom,installWestRoomDetail} from '../room-polish.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('performance walls inherit finished plaster at source scale and join at source Y texture coordinate',()=>{
  const finish=app.indexOf("roomFinish(rearWall,'limewash'");
  const side=app.indexOf("roomFinish(sideWall,'limewash'");
  const extensions=app.indexOf('const realRoomPolish=software?null:decoratePerformanceRoom(T,scene)');
  assert.ok(finish>=0&&side>=0&&extensions>finish&&extensions>side,'finish both real room walls before cloning extensions');
  const oldDocument=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
  try{
   const scene=new T.Scene();
   for(const [name,height,depth,repeat] of [['rear',3.1,.13,[3.4,1.9]],['side',1.55,4.7,[2.1,1.4]]]){
    const m=new T.MeshStandardMaterial({map:new T.Texture()});m.map.repeat.set(...repeat);
    const w=new T.Mesh(new T.BoxGeometry(name==='rear'?6.2:.12,height,depth),m);
    w.position.y=.015+height/2;w.name=name+'-wall-grounded';scene.add(w);
   }
   installWestRoomDetail(T,scene);
   const dispose=decoratePerformanceRoom(T,scene);
   try{
    for(const fraction of [.35,1]){
     dispose.updatePresentation(fraction);
     for(const name of ['rear-wall-grounded','side-wall-grounded']){
      const source=scene.getObjectByName(name),extension=scene.getObjectByName(name+'-performance-extension')||scene.getObjectByName(name+'-performance-extension-rear-cap');
      assert.equal(extension.material,source.material);
      assert.equal(extension.material.map,source.material.map);
      const uv=extension.geometry.attributes.uv,base=source.geometry.attributes.uv;
      assert.ok(Math.abs(uv.getY(2)-base.getY(0))<1e-6);
      assert.ok(Math.abs(uv.getX(2)-base.getX(0))<1e-6);
     }
    }
   }finally{dispose();}
  }finally{if(oldDocument)globalThis.document=oldDocument;else delete globalThis.document;}
});
