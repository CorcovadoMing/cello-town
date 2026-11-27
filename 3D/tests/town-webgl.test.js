import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_WIDTH,ROOM_HEIGHT,makeTownCamera} from '../../rpg/town-webgl.js';
import {PerspectiveCamera,Plane,Raycaster,Vector2,Vector3} from 'three';
const T={PerspectiveCamera};
test('real perspective has world-to-screen-to-ground precision and changes scale with depth',()=>{
 const camera=makeTownCamera(T), ray=new Raycaster(), plane=new Plane(new Vector3(0,1,0));
 const into=(x,z,h=0)=>new Vector3(x-ROOM_WIDTH/2,h,z-ROOM_HEIGHT/2).project(camera);
 function out(v){
  ray.setFromCamera(new Vector2(v.x,v.y),camera);
  const a=ray.ray.intersectPlane(plane,new Vector3());return [a.x+ROOM_WIDTH/2,a.z+ROOM_HEIGHT/2];
 }
 for(const [x,z]of [[30,130],[927,534],[676,251],[615,404],[460,425],[303,290],[710,460]]){
  const [a,b]=out(into(x,z));assert.ok(Math.abs(a-x)<1e-7);assert.ok(Math.abs(b-z)<1e-7);
 }
 const width=(z)=>Math.abs(into(500,z).x-into(400,z).x);
 assert.ok(width(500)>width(90)*1.14);
 assert.ok(into(675,237,120).y>into(675,237,0).y);
});
test('shared package, settings and gameplay are not initialized by the WebGL renderer',()=>{
 const s=readFileSync(new URL('../../rpg/town-webgl.js',import.meta.url),'utf8');
 assert.match(s,/new URL\('\.\/3D\/vendor\/three\.module\.js',location.href\)/);
 assert.doesNotMatch(s,/localStorage|sessionStorage|fetch\(|location\.(replace|assign)|navigator\.media/);
 const app=readFileSync(new URL('../../rpg/app.js',import.meta.url),'utf8');
 assert.match(app,/view\?'webgl':'canvas'/);
 assert.match(app,/if\(new URLSearchParams\(location.search\)\.get\('flat'\)!=='1'\)/);
 assert.match(app,/onLoss:\(\)=>\{pending3DTown=null;setTownView\(null\)/);
 assert.match(app,/if\(pending3DTown&&worldInView&&!target&&!keys.size&&!enteringRoom&&!dlg.open\)/);
});
