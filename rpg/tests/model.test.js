import test from 'node:test';import assert from 'node:assert/strict';import {fresh,normalize,accept,complete,turnIn,again,questView} from '../model.js';
test('must accept before recording practice',()=>assert.deepEqual(complete(fresh(),'listen'),fresh()));
test('three practices require returning to NPC before reward',()=>{let s=accept(fresh());for(const step of ['listen','rhythm','memory'])s=complete(s,step);assert.equal(s.phase,'ready');assert.equal(s.history.length,0);s=turnIn(s,'2026-11-14T00:00:00Z');assert.equal(s.phase,'done');assert.equal(s.history.length,1);assert.equal(turnIn(s).history.length,1);});
test('incomplete turn-in cannot reward',()=>assert.equal(turnIn(complete(accept(fresh()),'listen')).history.length,0));
test('practice deduplication and invalid step',()=>{let s=complete(accept(fresh()),'listen');assert.equal(complete(s,'listen').steps.length,1);assert.deepEqual(complete(s,'invalid'),s);});
test('replay preserves history and note',()=>{let s=accept(fresh());s.note='練 F♯';for(const a of ['listen','rhythm','memory'])s=complete(s,a);s=again(turnIn(s));assert.equal(s.phase,'available');assert.equal(s.steps.length,0);assert.equal(s.history.length,1);assert.equal(s.note,'練 F♯');});
test('normalization clamps controls and removes invalid progress',()=>{const s=normalize({version:1,phase:'ready',steps:['listen','listen','evil'],bpm:900,volume:-1});assert.equal(s.phase,'active');assert.equal(s.bpm,120);assert.equal(s.volume,0);assert.deepEqual(s.steps,['listen']);});
test('saved accepted progress roundtrip',()=>{let s=complete(accept(fresh()),'listen');assert.deepEqual(normalize(JSON.parse(JSON.stringify(s))),s);});
test('old or malformed state starts clean',()=>{assert.deepEqual(normalize({version:99}),fresh());assert.deepEqual(normalize(null),fresh());});

test('quest marker changes from gold available to gray active to gold ready and disappears after turn-in',()=>{
 let s=fresh();assert.equal(questView(s).marker,'!');
 s=accept(s);assert.equal(questView(s).marker,'?');assert.equal(questView(s).markerTone,'gray');
 for(const step of ['listen','rhythm','memory'])s=complete(s,step);
 assert.equal(questView(s).marker,'?');assert.equal(questView(s).markerTone,'gold');assert.equal(s.history.length,0);
 const restored=normalize(JSON.parse(JSON.stringify(s)));assert.equal(questView(restored).marker,'?');assert.equal(restored.history.length,0);
 s=turnIn(restored);assert.equal(questView(s).marker,null);assert.equal(questView(s).visible,false);assert.equal(s.history.length,1);
 assert.equal(turnIn(s).history.length,1);
});
test('tracker highlights only the next unfinished step and then return',()=>{
 let s=accept(fresh());assert.equal(questView(s).next,'listen');
 s=complete(s,'listen');assert.equal(questView(s).next,'rhythm');
 s=complete(s,'rhythm');assert.equal(questView(s).next,'memory');
 s=complete(s,'memory');assert.equal(questView(s).next,null);assert.equal(questView(s).ready,true);assert.equal(questView(s).count,3);
});
test('presentation is pure and cannot award flowers',()=>{let s=accept(fresh());for(const step of ['listen','rhythm','memory'])s=complete(s,step);const before=JSON.stringify(s);for(let i=0;i<100;i++)questView(s);assert.equal(JSON.stringify(s),before);assert.equal(s.history.length,0);});

test('all incomplete counts show gray question without reward',()=>{let s=accept(fresh());for(let n=0;n<3;n++){const q=questView(s);assert.equal(q.count,n);assert.equal(q.marker,'?');assert.equal(q.markerTone,'gray');assert.equal(q.ready,false);assert.equal(s.history.length,0);s=complete(s,['listen','rhythm','memory'][n]);}});

import {resetRound,FLOWERS,collection} from '../model.js';
test('reset current round preserves earned history, note and sound settings',()=>{let s={...fresh(),phase:'ready',steps:['listen','rhythm','memory'],history:[{at:'2026-11-14',bpm:72}],note:'換指',bpm:88,volume:.4};let result=resetRound(s);assert.equal(result.phase,'available');assert.deepEqual(result.steps,[]);assert.deepEqual(result.history,s.history);assert.equal(result.note,s.note);assert.equal(result.bpm,88);assert.equal(result.volume,.4);assert.equal(s.phase,'ready');assert.deepEqual(resetRound(result),result);});
test('collection is derived without awarding or changing stored progress',()=>{let s=fresh();assert.equal(collection(s).filter(f=>f.earned).length,0);s.history=Array.from({length:7},()=>({at:'2026-11-14',bpm:60}));let before=JSON.stringify(s),c=collection(s);assert.equal(c.length,6);assert.equal(c[0].count,2);assert.equal(c[1].count,1);assert.equal(c.filter(f=>f.earned).length,6);assert.equal(JSON.stringify(s),before);assert.equal(FLOWERS.length,6);});

import {bloomCount} from '../model.js';
test('lifetime flowers continue beyond bounded journal and migrate old saves',()=>{let s=normalize({...fresh(),history:Array.from({length:50},()=>({at:'2026-11-14',bpm:60}))});assert.equal(bloomCount(s),50);s=complete(complete(complete(accept(s),'listen'),'rhythm'),'memory');s=turnIn(s);assert.equal(s.history.length,50);assert.equal(bloomCount(s),51);assert.equal(bloomCount(normalize(s)),51);assert.equal(bloomCount(resetRound(s)),51);assert.equal(collection(s).reduce((n,f)=>n+f.count,0),51);});
