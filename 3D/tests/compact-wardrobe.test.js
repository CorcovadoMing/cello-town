import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../vendor/three.module.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('function previewCameraTarget(){'),app.indexOf('function anchorEditor(){'));
const baseline=source.replace('phone?(compactWardrobe?.58:.48):.05','phone?.48:.05');
function run(width,mode,source,height=580){
 const area={clientWidth:width};
 const size=Math.max(3.75,(width<600?3.6:3.9)*height/width),lift=width<600?size*.13:0;
 const camera=new T.OrthographicCamera(-size*width/height,size*width/height,size-lift,-size-lift,.1,60);
 camera.position.set(5.8,5.3,8.2); camera.lookAt(0,1,0); camera.updateMatrixWorld(true);
 const roomSnapshot={cameraPosition:camera.position.clone(),cameraQuaternion:camera.quaternion.clone()};
 const ctx={T,camera,area,roomSnapshot,pos:{x:-.04,z:-.66},previewMode:mode};
 vm.createContext(ctx);vm.runInContext(source+';globalThis.target=previewCameraTarget();',ctx);
 return {position:ctx.target.position.toArray(),zoom:ctx.target.zoom};
}
test('very narrow wardrobe lifts framing without changing the model scale',()=>{
 const before=run(300,'wardrobe',baseline),after=run(300,'wardrobe',source);
 assert.notDeepEqual(after.position,before.position);assert.equal(after.zoom,before.zoom);
 assert.ok(after.position[1]<before.position[1]);
});
test('wider wardrobe, normal portrait and compact appearance keep same camera endpoints',()=>{
 for(const [w,mode] of [[300,'vanity'],[345,'wardrobe'],[367,'wardrobe'],[768,'wardrobe'],[1100,'wardrobe']]){
  assert.deepEqual(run(w,mode,source),run(w,mode,baseline));
 }
});
