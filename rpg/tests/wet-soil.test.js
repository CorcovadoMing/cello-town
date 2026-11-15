import test from 'node:test';import assert from 'node:assert/strict';
import {createWetSoil,soilCell,drawWetSoil} from '../wet-soil.js';
import {rainLandings} from '../ambience.js';
test('soil contacts only, continuous capped moisture, eventual exact dry, no replay',()=>{
 const w=createWetSoil();assert.deepEqual(w.update(0,'rain'),[]);
 assert.equal(soilCell(464,459).kind,'road');assert.equal(soilCell(126,465),null);
 let cells=[];for(let t=16;t<20000;t+=16)cells=w.update(t,'rain');
 assert.ok(cells.filter(c=>c.kind==='bed').length>12);assert.ok(cells.filter(c=>c.kind==='road').length>6);assert.ok(cells.every(c=>c.level>0&&c.level<=3));
 assert.ok(w.update(20000,'sun').length);assert.ok(w.update(27000,'sun').some(c=>c.level<3));
 assert.deepEqual(w.update(60000,'sun'),[]);
 const paused=createWetSoil();paused.update(0,'rain');assert.deepEqual(paused.update(30000,'rain'),[]);
 const reduced=createWetSoil();reduced.update(0,'rain',true);assert.deepEqual(reduced.update(720,'rain',true),[]);
});
test('rain fast near vertical and overlay drawing bounded',()=>{
 const drops=rainLandings(345);assert.equal(drops.length,30);
 assert.ok(drops.every(d=>d.fallDuration>=650&&d.fallDuration<=800&&Math.abs(d.x-d.landingX)<=3));
 let n=0;const g={save(){},restore(){},fillRect(){n++}};drawWetSoil(g,[{x:744,y:412,level:1}]);assert.equal(n,1);
});
test('optional furniture reservations remove contacts consistently; road edge cells are clipped',()=>{
 const excludeRects=[{x:430,y:175,w:160,h:95}];
 assert.ok(rainLandings(100,false,excludeRects).every(d=>!(d.landingX>=430&&d.landingX<=590&&d.landingY>=175&&d.landingY<=270)));
 const c=soilCell(789,369);assert.equal(c.kind,'road');assert.ok(c.x+c.w<=790&&c.y+c.h<=370);
 assert.equal(soilCell(600,400),null);assert.equal(soilCell(200,450),null);
 const w=createWetSoil({excludeRects:[{x:170,y:298,w:620,h:262}]});let cells=[];
 for(let t=0;t<10000;t+=16)cells=w.update(t,'rain');assert.ok(cells.every(c=>c.kind==='bed'));
});
