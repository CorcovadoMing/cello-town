import test from 'node:test';import assert from 'node:assert/strict';
import{createRainSystem,firstRainHit}from'../rain-system.js';
import{umbrellaPose}from'../rain-geometry.js';
import{createWetSoil,moistureCell}from'../wet-soil.js';
test('umbrella footprint has rounded corners, a dry core and irregular soft splash perimeter',()=>{
 const r=createRainSystem();r.sample(0,'rain',[{x:450,y:330}]);const f=r.sample(3000,'rain',[{x:450,y:330}]);
 assert.equal(f.moistureExposureAt(460,330),0);assert.equal(f.groundHitAt(492,351).kind,'ground');
 const mid=Array.from({length:20},(_,i)=>f.moistureExposureAt(477+i,330));assert.ok(mid.some(x=>x>0&&x<.5));assert.ok(mid.some(x=>x>.5&&x<1));
 assert.notEqual(f.moistureExposureAt(484,330),f.moistureExposureAt(436,330));
 const tree={left:490,columns:new Float32Array(20).fill(200),groundMin:300,groundMax:350};
 const t=createRainSystem({canopies:[tree]});assert.equal(t.sample(0,'rain').moistureExposureAt(496,330),0);
 assert.equal(t.sample(40,'rain').moistureExposureAt(496,380),1);
});
test('grass fringe overlaps road margin with a decreasing tint tail and no distant terrain rewrite',()=>{
 const near=moistureCell(400,372),far=moistureCell(400,376),tail=moistureCell(400,380);
 assert.equal(near.kind,'verge');assert.ok(near.opacity>far.opacity&&far.opacity>tail.opacity);assert.equal(moistureCell(400,390),null);
 const w=createWetSoil();w.update(0,'rain');let c;for(let t=40;t<=4000;t+=40)c=w.update(t,'rain',false,{contacts:[{id:1,x:400,y:369}],moistureExposureAt:()=>1});
 assert.ok(c.some(x=>x.kind==='road'&&x.y<370));assert.ok(c.some(x=>x.kind==='verge'&&x.y>=370));
 const before=c.find(x=>x.kind==='road').level;
 const sheltered=w.update(4040,'rain',false,{contacts:[{id:1,x:400,y:369}],moistureExposureAt:()=>0});
 assert.ok(sheltered.find(x=>x.kind==='road').level>=before,'moving umbrella must not erase accumulated wetness');
});
