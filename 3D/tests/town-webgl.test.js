import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_WIDTH,ROOM_HEIGHT,makeTownCamera} from '../../rpg/town-webgl.js';
import {OrthographicCamera,Matrix4,Plane,Raycaster,Vector2,Vector3} from 'three';
const T={OrthographicCamera,Matrix4};
test('fixed oblique 3D camera maps the full old Canvas ground exactly; elevation supplies depth',()=>{
 const camera=makeTownCamera(T),ray=new Raycaster(),plane=new Plane(new Vector3(0,1,0));
 const into=(x,z,h=0)=>new Vector3(x-ROOM_WIDTH/2,h,z-ROOM_HEIGHT/2).project(camera);
 const screen=(v)=>[(v.x+1)*ROOM_WIDTH/2,(1-v.y)*ROOM_HEIGHT/2];
 function out(v){
  ray.setFromCamera(new Vector2(v.x,v.y),camera);
  const a=ray.ray.intersectPlane(plane,new Vector3());return [a.x+ROOM_WIDTH/2,a.z+ROOM_HEIGHT/2];
 }
 const field=[[0,0],[960,560],[30,130],[927,534],[676,251],[615,404],[460,425],[303,290],[710,460]];
 for(let x=0;x<=960;x+=80)for(let z=0;z<=560;z+=70)field.push([x,z]);
 for(const [x,z]of field){
  const clip=into(x,z),[u,v]=screen(clip),[a,b]=out(clip);
  assert.ok(Math.abs(u-x)<1e-8&&Math.abs(v-z)<1e-8);
  assert.ok(Math.abs(a-x)<1e-7&&Math.abs(b-z)<1e-7);
 }
 const demarcate=(z)=>Math.abs(into(500,z).x-into(400,z).x);
 assert.ok(Math.abs(demarcate(500)-demarcate(90))<1e-10);
 assert.ok(into(675,237,120).y>into(675,237,0).y);
 assert.ok(into(675,237,120).z<into(675,237,0).z);
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
