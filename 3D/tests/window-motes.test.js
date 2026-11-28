import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createWindowMotes,createWindowLandscape,createWindowRain} from '../window-landscape.js';
test('window motes are one bounded local render object, depth-occluded and deterministic',()=>{
 const a=createWindowMotes(T),b=createWindowMotes(T);
 assert.ok(a.points.isPoints);assert.equal(a.points.children.length,0);
 assert.equal(a.points.geometry.getAttribute('position').count,43);
 assert.deepEqual(a.points.geometry.getAttribute('position').array,b.points.geometry.getAttribute('position').array);
 for(const x of a.points.geometry.getAttribute('position').array)assert.ok(Number.isFinite(x));
 const mat=a.points.material;assert.equal(mat.depthTest,true);assert.equal(mat.depthWrite,false);
 a.tick(12,false,3);assert.equal(mat.uniforms.time.value,12);assert.equal(mat.uniforms.dpi.value,2);
 a.tick(20,true,1);assert.equal(mat.uniforms.time.value,0);assert.equal(mat.uniforms.density.value,.55);
 a.dispose();b.dispose();
});
test('decorative close landscape remains finite and keeps cloud + stem contract',()=>{
 const art=createWindowLandscape(T,new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial()));
 assert.ok(art.plants.length>25&&art.plants.length<70);assert.equal(art.clouds.length,3);
 art.tick(27); const moved=art.clouds.map(x=>x.root.position.x);
 art.tick(555,true);assert.notDeepEqual(art.clouds.map(x=>x.root.position.x),moved);
 art.dispose();
});

test('rain uses exact aperture only, dampens motes and respects reduced motion',()=>{
 const opening=new T.Mesh(new T.CircleGeometry(1,24));
 const r=createWindowRain(T,opening),a=createWindowMotes(T);
 assert.notEqual(r.glassRain.geometry,opening.geometry);
 assert.deepEqual(r.glassRain.geometry.getAttribute('position').array,opening.geometry.getAttribute('position').array);
 assert.equal(r.glassRain.visible,false);r.tick(100);assert.equal(r.glassRain.material.uniforms.time.value,0);
 r.setRain(true);r.tick(12);assert.equal(r.glassRain.material.uniforms.time.value,12);
 r.tick(500,true);assert.equal(r.glassRain.material.uniforms.time.value,0);
 assert.equal(r.glassRain.material.transparent,true);assert.equal(r.glassRain.material.depthWrite,false);
 a.setRain(true);a.tick(20);assert.equal(a.points.material.uniforms.density.value,.19);
 a.setRain(false);a.tick(20);assert.equal(a.points.material.uniforms.density.value,1);
 r.setRain(false);assert.equal(r.glassRain.visible,false);r.dispose();a.dispose();
});
