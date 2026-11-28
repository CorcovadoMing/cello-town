import test from 'node:test';import assert from 'node:assert/strict';
import{petGaitCycle,createRainPets,advancePetGait,drawGardenCat,drawRainBenchCat,dogPosePixels,pondLife,gardenLife}from'../ambience.js';
const navigation={findPath:(p,q)=>[{...q}],isWalkable:()=>true,lineClear:()=>true};
const raster=(draw,c)=>{const pixels=[];const g=new Proxy({}, {get:(o,k)=>k in o?o[k]:(...a)=>{if(k==='fillRect')pixels.push([o.fillStyle,...a]);},set:(o,k,v)=>(o[k]=v,true)});draw(g,c);return JSON.stringify(pixels);};
test('actual umbrella-follow path advances phase by travelled distance, not clock; holds and reduced motion freeze',()=>{
 const pets=createRainPets({navigation});let prior=null,moving=0,holds=0;
 for(let t=0;t<=8000;t+=20){const player={x:t<3000?830:830-Math.min(100,(t-3000)*.08),y:520};const r=pets.update(t,{weather:'rain',player,playerUmbrella:{x:player.x+10,y:520,opening:1}}),c=r.life.cat;
 if(prior&&c.phase==='follow'&&prior.phase==='follow'){
  const d=Math.hypot(c.x-prior.x,c.groundY-prior.groundY);
  if(c.moving){moving++;const delta=(c.gaitPhase-prior.gaitPhase+Math.PI*2)%(Math.PI*2);assert.ok(Math.abs(delta-d/24*Math.PI*2)<1e-8);}
  else {holds++;assert.equal(c.gaitPhase,prior.gaitPhase);assert.equal(c.stride,0);assert.equal(c.sit,0);assert.equal(c.lie,0);}
 }prior=c;
 }
 assert.ok(moving>30&&holds>20);const before=pets.positions;
 const r=pets.update(8020,{weather:'rain',reduced:true});assert.deepEqual(pets.positions,before);assert.equal(r.life.cat.stride,0);
});
test('all four views have visibly distinct diagonal gait frames for both cats and dog; resting pixels are stable',()=>{
 for(const facing of['left','right','up','down']){
  for(const draw of[drawGardenCat,drawRainBenchCat]){const c={x:0,y:0,groundY:0,facing,moving:true,running:true,mode:'follow'};
   const frames=[0,1,2,3,4,5].map(gaitPhase=>raster(draw,{...c,gaitPhase,stride:Math.sin(gaitPhase)*3}));assert.ok(new Set(frames).size>=4,facing);
   assert.equal(raster(draw,{...c,moving:false,running:false,stride:0,gaitPhase:0}),raster(draw,{...c,moving:false,running:false,stride:0,gaitPhase:3}));
  }
  assert.ok(new Set([0,1,2,3,4,5].map(p=>JSON.stringify([...dogPosePixels(facing,true,0,false,p).pixels]))).size>=4);
 }
});
test('gait cycle is frame-rate independent; swimming and flying retain species-appropriate motion and reduced freeze',()=>{
 const a={},b={};for(let i=0;i<100;i++)advancePetGait(a,.1);for(let i=0;i<10;i++)advancePetGait(b,1);assert.ok(Math.abs(a.gaitPhase-b.gaitPhase)<1e-10);
 assert.notDeepEqual(pondLife(0),pondLife(1000));assert.deepEqual(pondLife(0,true),pondLife(1000,true));
 for(const t of[0,30000,60000]){const a=gardenLife(t).visitor,b=gardenLife(t+100).visitor;assert.notEqual(a.wing,b.wing);assert.notEqual(a.x,b.x);}
});

test('side-facing dog sweeps its planted paw against ground travel at trot and rain sprint speeds',()=>{
 for (const facing of ['left','right']) for (const speed of [37,67]){
  const sign=facing==='left'?-1:1;
  const track=Array.from({length:19},(_,i)=>{
   const progress=i*.025;
   const {pixels,h}=dogPosePixels(facing,true,0,false,progress*Math.PI*2);
   // Follow only the near planted paw at raw atlas x=8, excluding the other
   // near leg and the far feet. Canvas scales the dog by 1.5 and flips right.
   const paw=[...pixels].filter(([id,color])=>color==='L'&&id.endsWith(','+(h-1)))
    .map(([id])=>Number(id.split(',')[0])).filter(x=>x<15);
   assert.equal(paw.length,2);
   return sign*(progress*petGaitCycle(speed)-Math.min(...paw)*1.5);
  });
  assert.ok(Math.max(...track.map(x=>Math.abs(x-track[0])))<(speed===37?1:6),facing+' '+speed);
 }
});
