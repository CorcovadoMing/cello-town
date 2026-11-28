import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../vendor/three.module.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('function previewCameraTarget(){'),app.indexOf('function anchorEditor(){'));
function run(width,mode,source,height=580){
 const area={clientWidth:width};
 const size=Math.max(3.75,(width<600?3.6:3.9)*height/width),lift=width<600?size*.13:0;
 const camera=new T.OrthographicCamera(-size*width/height,size*width/height,size-lift,-size-lift,.1,60);
 camera.position.set(5.8,5.3,8.2); camera.lookAt(0,1,0); camera.updateMatrixWorld(true);
 const roomSnapshot={cameraPosition:camera.position.clone(),cameraQuaternion:camera.quaternion.clone()};
 const ctx={T,camera,area,roomSnapshot,pos:{x:-.04,z:-.66},previewMode:mode};
 vm.createContext(ctx);vm.runInContext(source+';globalThis.target=previewCameraTarget();',ctx);
 camera.position.copy(ctx.target.position);camera.zoom=ctx.target.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 return {position:ctx.target.position.toArray(),zoom:ctx.target.zoom,projection:new T.Vector3(ctx.pos.x,.97,ctx.pos.z).project(camera)};
}
test('wardrobe, mirror and appearance use the same stable fitting angle and framing',()=>{
 for(const w of [300,345,367,768,1100]){
  const primary=run(w,'wardrobe',source);
  for(const mode of ['wardrobe','mirror','vanity']){
   const actual=run(w,mode,source);
   assert.deepEqual(actual.position,primary.position);assert.equal(actual.zoom,primary.zoom);
   assert.ok(Math.abs(actual.projection.x-(w<600?0:-.25))<1e-10);
   assert.ok(Math.abs(actual.projection.y-(w<600?.48:.05))<1e-10);
  }
 }
});
