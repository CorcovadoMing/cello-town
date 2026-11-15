import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {accept,complete,fresh,turnIn} from '../model.js';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const art=app.slice(app.indexOf('function drawStandMarker('),app.indexOf('function drawPracticeStand('));
function capture(state,t=0,reduced=false){
 const ops=[];const g=new Proxy({}, {get(o,k){return (...v)=>ops.push([k,...v]);}});
 runInNewContext(art+';drawStandMarker(t)',{state,t,stand:{x:615,y:404},g,label:(...a)=>ops.push(['label',...a]),reducedMotion:{matches:reduced}});
 return ops;
}
test('practice arrow stays aimed at the stand until all practices complete',()=>{
 const before=fresh(),active=accept(before),inProgress=complete(active,'listen'),finished=complete(complete(inProgress,'rhythm'),'memory');
 assert.equal(capture(before).length,0);assert.equal(capture(finished).length,0);assert.equal(capture(turnIn(finished)).length,0);
 for(const state of [active,inProgress]){
  const still=capture(state,500,true);assert.deepEqual(still.find(op=>op[0]==='translate'),['translate',615,404]);
  assert.ok(still.some(op=>op[0]==='lineTo'&&op[1]===0&&op[2]===-48));
  assert.notDeepEqual(capture(state,500),still);
 }
 assert.match(app,/drawQuestMarker\(t\);drawStandMarker\(t\)/);
});
