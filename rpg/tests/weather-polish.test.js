import test from 'node:test';import assert from 'node:assert/strict';
import {rainLandings,meadowMist} from '../ambience.js';
test('rain impacts continue from the same approaching drop at exact world surface',()=>{
 for(const d of rainLandings(0)){
  const hit=d.fallDuration-d.id*197;const period=d.fallDuration+1000;
  const t=hit<1?hit+period*4:hit;
  const before=rainLandings(t-.001)[d.id],after=rainLandings(t)[d.id];
  assert.equal(before.phase,'fall');assert.equal(after.phase,'impact');
  assert.ok(Math.hypot(before.x-after.landingX,before.y-after.landingY)<.001);
  assert.equal(after.x,after.landingX);assert.equal(after.y,after.landingY);
  assert.equal(after.surface,after.landingX>=48&&after.landingX<=235&&after.landingY>=388&&after.landingY<=523?'water':'ground');
 }
});
test('weather is bounded deterministic and has restrained depth tiers',()=>{
 const a=rainLandings(1234);assert.deepEqual(a,rainLandings(1234));assert.equal(a.length,30);assert.deepEqual(rainLandings(0,true),rainLandings(999999,true));assert.ok(rainLandings(0,true).every(d=>d.phase!=='impact'));
 const tiers=[0,1,2].map(n=>a.find(d=>d.depth===n));assert.ok(tiers[0].fallDuration>tiers[1].fallDuration&&tiers[1].fallDuration>tiers[2].fallDuration);assert.ok(tiers[0].opacity<tiers[2].opacity);
 assert.equal(meadowMist(8000),null);assert.equal(meadowMist(3000,true),null);assert.ok(meadowMist(3000).alpha<=.12);assert.notEqual(meadowMist(1000).x,meadowMist(4000).x);
});
