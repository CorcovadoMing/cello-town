import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addOrchardTree,orchardFamily,townSunVector} from '../town-orchard.js';
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
  const trunks=t.branches.slice(0,2);
  assert.ok(trunks.every(row=>row[1]===100&&row[3]===200&&row[8]===0&&row[10]===0));
  assert.ok(trunks[1][4]<trunks[0][4]);
  const core=t.crown.filter(row=>row[0]!=='orchard-leaf');
  if(orchardFamily(i)==='fir'){
   assert.equal(core.length,4);
   assert.ok(core.every((row,j)=>row[0]==='orchard-fir'&&row[1]===100&&row[3]===200&&
    (j===0||row[2]>core[j-1][2]&&row[4]<core[j-1][4])));
  }else{
   assert.equal(core.length,1);
   assert.ok(core[0][4]>core[0][5],'upright broadleaf wider than tall');
   assert.equal(t.branches.length,17);
   assert.ok(t.branches.slice(-3).every(row=>row[4]<2),'nearby details are tapered twigs, not extra trunks');
  }
  const leaves=t.crown.filter(row=>row[0]==='orchard-leaf');
  if(orchardFamily(i)==='broadleaf'){assert.ok(leaves.filter(row=>row[3]>205).length>=45,'pondside foliage has distinct small layers');assert.ok(leaves.some(row=>row[2]<core[0][2]-8));}
  assert.ok(t.crown.every(f=>f.slice(1,7).every(Number.isFinite)&&f[2]>36));
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
