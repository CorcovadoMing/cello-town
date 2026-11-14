import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,normalize,complete,replay,NOTES} from '../model.js';
test('D major has correct eight notes',()=>assert.deepEqual(NOTES,['D3','E3','F♯3','G3','A3','B3','C♯4','D4']));
test('distinct completion, exactly one flower after all three',()=>{let s=fresh();s=complete(s,'listen');s=complete(s,'listen');assert.equal(s.current.length,1);assert.equal(s.history.length,0);s=complete(s,'rhythm');s=complete(s,'memory','2026-11-14T00:00:00Z');assert.equal(s.history.length,1);assert.equal(complete(s,'memory').history.length,1);});
test('replay preserves notes, garden, and history',()=>{let s={...fresh(),note:'Practice shift',bpm:80};for(const m of ['listen','rhythm','memory'])s=complete(s,m);const n=replay(s);assert.deepEqual(n.current,[]);assert.deepEqual(n.history,s.history);assert.equal(n.note,s.note);assert.equal(n.history[0].note,'Practice shift');});
test('storage normalizer handles unknown versions, invalid entries and bounds',()=>{assert.deepEqual(normalize(null),fresh());assert.deepEqual(normalize({version:2}),fresh());const s=normalize({version:1,bpm:999,volume:-1,current:['listen','listen','bad'],history:[null,{}],note:12});assert.equal(s.bpm,160);assert.equal(s.volume,0);assert.deepEqual(s.current,['listen']);assert.deepEqual(s.history,[]);assert.equal(s.note,'');});
test('completion leaves input immutable and rejects unknown mission',()=>{const s=fresh();assert.equal(complete(s,'oops'),s);const n=complete(s,'listen');assert.equal(s.current.length,0);assert.equal(n.current.length,1);});
test('progress survives serialization',()=>{let s=fresh();for(const m of ['listen','rhythm','memory'])s=complete(s,m);assert.deepEqual(normalize(JSON.parse(JSON.stringify(s))),s);});
