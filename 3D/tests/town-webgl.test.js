import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_WIDTH,ROOM_HEIGHT,makeTownCamera} from '../../rpg/town-webgl.js';
import {OrthographicCamera,Matrix4,Plane,Raycaster,Vector2,Vector3} from 'three';
const T={OrthographicCamera,Matrix4};
test('upright fixed 3D camera maps the full old Canvas ground exactly; elevation supplies depth',()=>{
 const camera=makeTownCamera(T),ray=new Raycaster(),plane=new Plane(new Vector3(0,1,0));
 assert.deepEqual(camera.position.toArray(),[0,950,880]);
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
 // Physical walls, tree trunks and fence posts must not lean in screen
 // space. Preserving only the ground footprint would miss this regression.
 for(const [x,z] of [[676,237],[600,190],[45,168],[220,72],[821,460]]){
  const [groundX,groundY]=screen(into(x,z));
  for(const h of [1,12,48,88,132]){
   const [raisedX,raisedY]=screen(into(x,z,h));
   assert.ok(Math.abs(raisedX-groundX)<1e-8);
   assert.ok(Math.abs(raisedY-(groundY-(880/950)*h))<1e-8);
  }
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
 assert.match(app,/const FLAT_TOWN=new URLSearchParams\(location.search\)\.get\('flat'\)==='1'/);
 assert.match(app,/onLoss:\(\)=>\{\s*pending3DTown=null;setTownView\(null\);pickTownRenderer\('canvas'\)/);
 assert.match(app,/if\(pending3DTown&&worldInView&&!dlg.open\)/);
});
test('outdoor WebGL applies the shared road, verge and bed moisture on every weather state',()=>{
 const app=readFileSync(new URL('../../rpg/app.js',import.meta.url),'utf8');
 const webgl=readFileSync(new URL('../../rpg/town-webgl.js',import.meta.url),'utf8');
 const draw=app.slice(app.indexOf('function drawWebGLTown'),app.indexOf('function draw(t)'));
 assert.match(draw,/v\.render\(key,moisture,Date\.now\(\),!reduced,watchView,t\)/);
 assert.match(draw,/drawPondLife\(g,t,reduced,townFish\)/);
 assert.match(draw,/drawPetPondContact\(g,petFrame\.pondContact\)/);
 assert.match(draw,/if\(key==='rain'\)drawRainFrame\(g,rainFrame\)/);
 assert.match(webgl,/if\(moisture===previousMoisture\)return/);
 assert.match(webgl,/wetLayer\('road'[\s\S]+wetLayer\('bed'/);
 assert.match(webgl,/kind==='road'&&c\.kind==='verge'/);
 assert.match(webgl,/drawWetSoil\(ctx,moisture,kind\)/);
 assert.match(webgl,/down\.drawImage\(raw,0,0,thumb.width,thumb.height\)/);
 assert.match(webgl,/soft\.drawImage\(thumb,0,0,w,d\)/);
 assert.doesNotMatch(webgl,/soft\.filter/);
 assert.match(webgl,/updateWetLayers\(moisture\);\s*renderer\.render/);
 assert.doesNotMatch(webgl,/puddles\.forEach|render\(weather\)\{/);
});
