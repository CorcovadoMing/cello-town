import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addOrchardTree,townSunVector} from '../town-orchard.js';
function capture(i){
 const branches=[],crown=[];
 addOrchardTree({shape:(...a)=>(a[0]==='trunk'?branches:crown).push(a)},100,200,1.25,i);
 return {branches,crown};
}
test('fourteen individual silhouettes have reproducible crown and tapered trunk recipes on unchanged roots',()=>{
 const trees=Array.from({length:14},(_,i)=>capture(i));
 assert.equal(new Set(trees.map(t=>JSON.stringify(t.crown))).size,14);
 assert.ok(new Set(trees.map(t=>Math.max(...t.crown.map(row=>row[2]+row[5])))).size>5);
 for(const [i,t] of trees.entries()){
  assert.deepEqual(t,capture(i));
  assert.equal(t.branches.length,35);
  assert.equal(t.crown.length,135);
  assert.equal(t.branches[0][3],200);
  assert.ok(t.branches[1][4]<t.branches[0][4]);
  assert.ok(t.crown.every(f=>f[0]==='orchard-leaf'&&f.slice(1,7).every(Number.isFinite)&&f[2]>44));
 }
});
test('same 12-minute clock swings and returns continuously, and projected sun shadows reverse',()=>{
 const a=townSunVector(0),b=townSunVector(360000),w=townSunVector(720000);
 const displacement=(light,h)=>[-h*light.x/light.y,-h*light.z/light.y];
 assert.deepEqual(w,a);
 for(const t of [-37,0,37,179999,180000,359999,360000,719999]){
  const p=townSunVector(t),q=townSunVector(t+1);
  assert.ok(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.003);
 }
 const pa=displacement(a,90),pb=displacement(b,90);
 assert.ok(pa[0]<-35&&pb[0]>27&&pa[1]>30&&pb[1]>30);
 const renderer=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.doesNotMatch(renderer,/plane\(x-12\*s|box\(250,6,211/);
 assert.match(renderer,/sun\.position\.set\(lamp\.x,lamp\.y,lamp\.z\)/);
});
