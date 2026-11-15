import test from 'node:test';import assert from 'node:assert/strict';
import{createWetSoil,drawWetSoil,soilCell,WET_RATES}from'../wet-soil.js';
import{createRainSystem,firstRainHit}from'../rain-system.js';import{umbrellaPose,treeRainCanopies}from'../rain-geometry.js';
const at=(cells,x,y)=>{const p=soilCell(x,y);return cells.find(c=>c.x===p.x&&c.y===p.y)?.level||0};
test('one landing grows a broad continuous patch; soak/dry have linear slopes without whole-level steps',()=>{
 const w=createWetSoil(),hit={contacts:[{id:1,x:350,y:330}]},empty={contacts:[]};w.update(0,'rain',false,empty);
 const a=w.update(40,'rain',false,hit),b=w.update(240,'rain',false,empty),c=w.update(440,'rain',false,empty);
 assert.ok(a.length>12);assert.ok(c.some(p=>p.x<340)&&c.some(p=>p.x>355));
 assert.ok(Math.abs((at(b,350,330)-at(a,350,330))-.2*WET_RATES.soak)<1e-10);
 assert.ok(Math.abs((at(c,350,330)-at(b,350,330))-.2*WET_RATES.soak)<1e-10);
 const d=w.update(480,'sun'),e=w.update(680,'sun'),f=w.update(880,'sun');
 assert.ok(Math.abs(at(d,350,330)-at(e,350,330)-.2*WET_RATES.dry)<1e-10);
 assert.ok(Math.abs(at(e,350,330)-at(f,350,330)-.2*WET_RATES.dry)<1e-10);
 assert.deepEqual(w.update(10000,'sun'),[]);
});
test('contact footprint cannot cross tree, umbrella or furniture shelter into dry soil',()=>{
 const tree={kind:'tree',left:300,columns:new Float32Array(35).fill(200),groundMin:300,groundMax:370};
 const actors=[{x:460,y:330},{x:620,y:330,kind:'teacher'}],r=createRainSystem({canopies:[tree],excludeRects:[{x:700,y:300,w:25,h:70}]});
 const f=r.sample(3000,'rain',actors);r.sample(6000,'rain',actors);
 const w=createWetSoil();w.update(0,'rain',false,{contacts:[]});f.contacts.splice(0,f.contacts.length,...[336,422,660,726].map((x,id)=>({id,x,y:330})));
 const c=w.update(40,'rain',false,f);assert.ok(c.length>10);
 for(const p of c)assert.equal(f.groundHitAt(p.x+p.w/2,p.y+p.h/2).kind,'ground');
 assert.equal(at(c,322,330),0);assert.equal(at(c,470,330),0);assert.equal(at(c,630,330),0);assert.equal(at(c,710,330),0);
});
test('same-frame overlapping drops share exposure checks and 25 Hz snapshots; alpha interpolation is bounded',()=>{
 const wet=createWetSoil();let n=0;const frame={contacts:[],groundHitAt(){n++;return {kind:'ground'}}};wet.update(0,'rain',false,frame);
 frame.contacts=Array.from({length:126},(_,id)=>({id,x:350,y:330}));const a=wet.update(40,'rain',false,frame);assert.ok(n<35);
 frame.contacts=[];const b=wet.update(56,'rain',false,frame);assert.equal(a,b);
 const alphas=[];let alpha=0;drawWetSoil({save(){},restore(){},set globalAlpha(v){alpha=v},fillRect(){alphas.push(alpha)}},[{x:0,y:0,level:.75},{x:8,y:0,level:1.5},{x:16,y:0,level:3}]);
 assert.ok(Math.abs(alphas[0]-.0875)<.004);assert.ok(Math.abs(alphas[1]-.175)<.004);assert.ok(Math.abs(alphas[2]-.35)<.004);
});

test('rain resuming early preserves existing damp soil without new hits',()=>{
 const model=createWetSoil(),empty={contacts:[]};
 model.update(0,'rain',false,empty);
 model.update(80,'rain',false,{contacts:[{id:1,x:300,y:330}]});
 const before=model.update(120,'sun',false,empty);
 assert.ok(before.length>0);
 const resumed=model.update(200,'rain',false,empty);
 assert.deepEqual(resumed,before);
});
