import test from 'node:test';
import assert from 'node:assert/strict';
import {windLeafAt,windLeafFloatAt,TOWN_WIND,breezeAt} from '../town-breeze.js';
test('wind cohort falls gradually, travels southeast and stays settled at a fixed place',()=>{
 for(let i=0;i<14;i++){
  const early=windLeafAt(0,i),late=windLeafAt(24000,i),later=windLeafAt(90000,i);
  assert.equal(early.appeared,false);assert.equal(early.h,1);
  assert.equal(late.settled,true);assert.equal(late.h,0);assert.deepEqual(late,later);
  assert.ok(late.x>0&&late.z>0);assert.ok(Math.abs(late.z/late.x-TOWN_WIND.z)<1e-9);
 }
 assert.equal(breezeAt(123,4,5,'breeze',false),0);
});

test('water landings drift in the ripple direction, bob and stay bounded',()=>{
 const a=windLeafFloatAt(3330,0),b=windLeafFloatAt(6000,0),c=windLeafFloatAt(12000,0);
 assert.equal(a.x,0);assert.ok(b.x>0&&c.x>b.x&&c.x<24);
 assert.ok(Math.abs(c.z/c.x-TOWN_WIND.z)<1e-9);
 assert.notEqual(b.bob,c.bob);assert.ok(Math.abs(b.bob)<=.16&&Math.abs(c.bob)<=.16);
});
