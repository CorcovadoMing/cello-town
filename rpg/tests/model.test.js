import test from 'node:test';import assert from 'node:assert/strict';import {fresh,normalize,accept,complete,turnIn,again} from '../model.js';
test('must accept before recording practice',()=>assert.deepEqual(complete(fresh(),'listen'),fresh()));
test('three practices require returning to NPC before reward',()=>{let s=accept(fresh());for(const step of ['listen','rhythm','memory'])s=complete(s,step);assert.equal(s.phase,'ready');assert.equal(s.history.length,0);s=turnIn(s,'2026-11-14T00:00:00Z');assert.equal(s.phase,'done');assert.equal(s.history.length,1);assert.equal(turnIn(s).history.length,1);});
test('incomplete turn-in cannot reward',()=>assert.equal(turnIn(complete(accept(fresh()),'listen')).history.length,0));
test('practice deduplication and invalid step',()=>{let s=complete(accept(fresh()),'listen');assert.equal(complete(s,'listen').steps.length,1);assert.deepEqual(complete(s,'invalid'),s);});
test('replay preserves history and note',()=>{let s=accept(fresh());s.note='練 F♯';for(const a of ['listen','rhythm','memory'])s=complete(s,a);s=again(turnIn(s));assert.equal(s.phase,'available');assert.equal(s.steps.length,0);assert.equal(s.history.length,1);assert.equal(s.note,'練 F♯');});
test('normalization clamps controls and removes invalid progress',()=>{const s=normalize({version:1,phase:'ready',steps:['listen','listen','evil'],bpm:900,volume:-1});assert.equal(s.phase,'active');assert.equal(s.bpm,120);assert.equal(s.volume,0);assert.deepEqual(s.steps,['listen']);});
test('saved accepted progress roundtrip',()=>{let s=complete(accept(fresh()),'listen');assert.deepEqual(normalize(JSON.parse(JSON.stringify(s))),s);});
test('old or malformed state starts clean',()=>{assert.deepEqual(normalize({version:99}),fresh());assert.deepEqual(normalize(null),fresh());});
