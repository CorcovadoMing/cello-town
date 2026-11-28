import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createFootfallTracker} from '../town-webgl.js';
import {addBenchGardenCraft,addCabinAndPondCraft} from '../town-craft.js';
function collect(){
 const out=[];
 const fun=Object.fromEntries(['box','sphere','shape'].map(name=>[name,(...raw)=>{
  const args=name==='shape'?raw.slice(1):raw;out.push({name,x:args[0],y:args[1],z:args[2],w:args[3],h:args[4],d:args[5]});
 }]));
 addCabinAndPondCraft(fun,{x:580,depth:239});
 addBenchGardenCraft(fun,{x:615,y:404});
 return out;
}
test('hand-placed seams, plants and metal fittings preserve paths, entries and garden plant positions',()=>{
 const all=collect();assert.deepEqual(all,collect());
 assert.ok(all.length>=110&&all.length<170);
 for(const d of all)assert.ok([d.x,d.y,d.z,d.w,d.h,d.d].every(Number.isFinite)&&d.w>0&&d.h>0&&d.d>0);
 assert.ok(all.filter(q=>q.x>=184&&q.x<=320&&q.z>=196&&q.z<=224).every(q=>q.y>=31.5));
 assert.ok(!all.some(q=>Math.abs(q.x-676)<21&&q.z>=237&&q.z<=270));
 for(const z of [440,482])for(const x of [767,817,867]){
  assert.ok(!all.some(q=>Math.abs(q.x-x)<14&&Math.abs(q.z-z)<7));
 }
 const renderer=fs.readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.match(renderer,/eaveDrops.visible=weather==='rain'/);
 assert.match(renderer,/updateEaveDrops\(weather,motion\?now:0\);\s*updateWetLayers\(moisture\)/);
 assert.match(renderer,/paintedWater.update\(now,weather,lamp,motion\)/);
 assert.match(renderer,/swayCrowns\(clock,weather,motion\)/);
 assert.match(renderer,/mesh|new T.MeshLambertMaterial/);
});

test('only actual soil strides leave brief notes of contact; rain and dry clear at different rates',()=>{
 const a=createFootfallTracker((x,z)=>x>=100&&z>0);
 const at=(x,t,weather='sun',on=true)=>a.walk([{id:'player',x,z:200,active:true}],t,weather,on);
 assert.deepEqual(at(87,0),[]);
 assert.deepEqual(at(98,90),[]);
 assert.equal(at(125,240).length,2);
 assert.ok(at(125,620).every(mark=>mark.opacity<.19));
 assert.deepEqual(at(125,1500),[]);
 assert.equal(at(141,1600,'rain').length,1);
 assert.equal(at(141,2700,'rain').length,1);
 assert.deepEqual(at(141,2900,'rain',false),[]);
 assert.deepEqual(at(800,3000),[],'teleport is not walking');
});

test('umbrella preparation raises a hand before the canopy starts to open',async()=>{
 const {createRainSystem}=await import('../rain-system.js');
 const {drawRainUmbrella,umbrellaWrist}=await import('../lounge-art.js');
 const rain=createRainSystem();
 const actors=[{x:320,y:320,facing:'front'},{x:640,y:340,facing:'back'}];
 assert.deepEqual(rain.sample(0,'rain',actors).actorGrip,[0,0]);
 assert.equal(rain.sample(150,'rain',actors).actorStage[0],'prepare');
 const mid=rain.sample(300,'rain',actors);
 assert.equal(mid.actorOpen[0],0);assert.equal(mid.actorGrip[0],.5);
 assert.equal(rain.sample(450,'rain',actors).actorGrip[0],1);
 assert.equal(rain.sample(870,'rain',actors).actorOpen[0],1);
 assert.equal(rain.sample(1420,'rain',actors).actorGrip[1],.9);
 assert.ok(umbrellaWrist(0,0)>umbrellaWrist(0,1));
 assert.ok(umbrellaWrist(0,1)>umbrellaWrist(1,1));
 const rects=[],ctx={save(){},restore(){},translate(){},scale(){},fillRect(x,y,w,h){rects.push([x,y,w,h,this.fillStyle]);}};
 drawRainUmbrella(ctx,{x:0,y:0,facing:'front'},0,'opening',1);
 assert.ok(rects.some(d=>d[0]===9&&d[1]===-23&&d[4]==='#f4c998'));
 rects.length=0;
 drawRainUmbrella(ctx,{x:0,y:0,facing:'back',kind:'teacher'},1,'open',1);
 assert.ok(rects.some(d=>d[0]===-8&&d[1]===-35&&d[4]==='#f5cfa7'));
 assert.deepEqual(rain.sample(2100,'sun',actors).actorGrip,[0,0]);
});
