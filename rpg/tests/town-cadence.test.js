import test from 'node:test';
import assert from 'node:assert/strict';
import {createTownFramePacer}from '../town-webgl.js';
test('compact outdoor paint targets 60 on 60, 90 and 120 Hz without requiring a perfect callback',()=>{
 for(const hz of [60,90,120]) {
  const g=createTownFramePacer();
  const frames=Array.from({length:hz},(_,i)=>i*1000/hz+Math.sin(i*1.3)*.9).filter(t=>g.paint(t));
  assert.equal(frames.length,60,String(hz));
  assert.ok(frames.slice(1).every((t,i)=>t-frames[i]<24),String(hz));
 }
});
test('pause, duplicate timestamps and device callback skips do not cause extra paints',()=>{
 const g=createTownFramePacer();assert.equal(g.paint(0),true);assert.equal(g.paint(0),false);
 assert.equal(g.paint(8),false);assert.equal(g.paint(50),true);assert.equal(g.paint(51),false);
 assert.equal(g.paint(1000),true);assert.equal(g.paint(1008),false);g.reset();assert.equal(g.paint(1008),true);
});
