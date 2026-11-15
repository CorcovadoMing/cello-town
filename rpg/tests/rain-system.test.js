import test from 'node:test';import assert from 'node:assert/strict';
import {RAIN_COUNT,createRainSystem,firstRainHit} from '../rain-system.js';
import {treeRainCanopies,umbrellaPose,umbrellaTop,UMBRELLA_BANDS,umbrellaCoversGround} from '../rain-geometry.js';
import {createWetSoil,WET_CELL_LIMIT} from '../wet-soil.js';
test('first visible crown/umbrella contour terminates the same rain segment before ground',()=>{
 const crowns=treeRainCanopies([[300,200,1]]),u=umbrellaPose({x:290,y:300});
 const c=crowns[0],top=c.columns[300-c.left];assert.ok(top<200);
 assert.deepEqual(firstRainHit(300,-24,350,270,crowns,[u]),{x:300,y:top,kind:'tree'});
 assert.equal(firstRainHit(300,-24,140,400,crowns,[u]),null);
 assert.equal(firstRainHit(300,-24,310,310,[],[u]).y,umbrellaTop(u,300));
 assert.equal(firstRainHit(800,-24,399,400,crowns,[u]),null);
 assert.equal(firstRainHit(800,-24,400,400,crowns,[u]).kind,'ground');
 assert.equal(umbrellaTop(u,300+40),Infinity);assert.equal(UMBRELLA_BANDS.at(-1)[0],72);
});
test('bounded shared buffers, staggered one-shot opening, reset and reduced motion',()=>{
 const r=createRainSystem(),actors=[{x:450,y:350},{x:600,y:330}];const first=r.sample(0,'rain',actors);
 assert.equal(first.drops.length,RAIN_COUNT);const list=first.drops;
 assert.deepEqual(r.sample(600,'rain',actors).actorStage,['opening','closed']);
 assert.deepEqual(r.sample(1500,'rain',actors).actorStage,['open','opening']);
 assert.deepEqual(r.sample(2000,'rain',actors).actorStage,['open','open']);
 assert.equal(r.sample(2100,'rain',actors).drops,list);
 assert.deepEqual(r.sample(2200,'sun',actors).actorStage,['closed','closed']);
 assert.deepEqual(r.sample(2300,'rain',actors).actorStage,['closed','closed']);
 const reduced=r.sample(2400,'rain',actors,true);assert.ok(reduced.drops.every(d=>d.phase==='rest'));assert.equal(reduced.contacts.length,0);assert.deepEqual(reduced.actorOpen,[1,1]);
});
test('moving open umbrella never wets covered ground; uncovered ground/water contacts survive',()=>{
 const r=createRainSystem(),wet=createWetSoil();let ground=0,water=0,cover=0,maxWet=0;
 for(let t=0;t<20000;t+=16){const actors=[{x:410+(t%6000)/60,y:345},{x:850,y:480}];const f=r.sample(t,'rain',actors);
  for(const hit of f.contacts){ground++;assert.ok(!f.umbrellas.some(u=>umbrellaCoversGround(u,hit.y)&&umbrellaTop(u,hit.x)<=hit.y));}
  water+=f.drops.filter(d=>d.phase==='impact'&&d.surface==='water').length;
  cover+=f.drops.filter(d=>d.phase==='impact'&&d.surface==='umbrella').length;
  maxWet=Math.max(maxWet,wet.update(t,'rain',false,f).length);
 }
 assert.ok(ground>100&&water>0&&cover>0);assert.ok(maxWet<=WET_CELL_LIMIT);
 wet.update(20000,'sun',false,r.sample(20000,'sun'));assert.deepEqual(wet.update(60000,'sun',false,r.sample(60000,'sun')),[]);
});
