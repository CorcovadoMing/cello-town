import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {decoratePerformanceRoom} from '../room-polish.js';
test('visible golden rays start inside original arch and follow actual sunlight, then dispose',()=>{
 globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
 const scene=new T.Scene(),sun=new T.DirectionalLight();sun.name='window-sunlight';sun.position.set(-2.15,4.38,-5.04);sun.target.position.set(-.65,.38,-.04);scene.add(sun);
 const dispose=decoratePerformanceRoom(T,scene),m=scene.getObjectByName('window-aperture-golden-rays');
 assert.ok(m?.visible);const hits=[];m.raycast(new T.Raycaster(),hits);assert.equal(hits.length,0);assert.notEqual(m.raycast,T.Mesh.prototype.raycast);assert.equal(m.material.opacity,.23);assert.equal(m.material.blending,T.AdditiveBlending);assert.equal(m.material.depthTest,true);
 const p=m.geometry.attributes.position,vec=i=>new T.Vector3().fromBufferAttribute(p,i),ray=sun.target.position.clone().sub(sun.position).normalize();
 for(const i of[0,1]){const v=vec(i);assert.ok(Math.abs(v.z+2.025)<1e-6);assert.ok((v.x+1.25)**2+(v.y-2.03)**2<.76**2);}
 for(const [a,b] of[[0,3],[1,2]]) assert.ok(vec(b).sub(vec(a)).normalize().distanceTo(ray)<1e-6);
 assert.ok(vec(3).x>vec(0).x);assert.ok(vec(3).y<vec(0).y);
 console.log('ray endpoints',Array.from(p.array),'sun direction',ray.toArray());
 dispose();assert.equal(scene.getObjectByName('window-aperture-golden-rays'),undefined);delete globalThis.document;
});
