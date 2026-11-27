import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('optional table score has one stable id and names the discovery only after activation',()=>{
 assert.match(html,/<button id="manuscript-access" hidden type="button" aria-label="查看小木桌上泛黃的樂譜">/);
 assert.match(html,/<dialog id="manuscript-observation" data-discovery-id="found-score-001" aria-labelledby="manuscript-title" aria-describedby="manuscript-line">/);
 assert.match(html,/<h2 id="manuscript-title" lang="en">When the Question Fades<\/h2>/);
 assert.match(html,/<p id="manuscript-line">是誰把這張譜留在這裡的？<\/p>/);
 const prop=app.split('// BEGIN SIDE TABLE MANUSCRIPT')[1].split('// END SIDE TABLE MANUSCRIPT')[0];
 assert.match(prop,/manuscript\.position\.set\(.+\);manuscript\.rotation/);
 assert.match(prop,/scoreTable\.add\(manuscript\)/);
 assert.match(prop,/for\(let line=0;line<5;line\+\+\)/);
 assert.match(prop,/manuscriptAccess\.addEventListener\('click',startManuscript\)/);
 assert.doesNotMatch(prop,/localStorage|AudioContext|setItem|play\(/);
});
test('the new side-table footprint blocks walking through it without intersecting the cat, door or cello seat',async()=>{
 const vm=await import('node:vm');
 const helpers=app.slice(app.indexOf('const ROOM='),app.indexOf('const CELLO_SEAT='));
 const table=app.match(/const SCORE_TABLE_FOOTPRINT=\{[^}]+\};/)?.[0];
 const {blocked,clearPoint,guardedMove,inside,route,tableBox}=vm.runInNewContext(table+helpers+
   ';({blocked:segmentBlocked,clearPoint,guardedMove,inside,route:routeAroundStool,tableBox:SCORE_TABLE_FOOTPRINT})');
 const start={x:1.5,z:1.5},tableCenter={x:2.15,z:1.55};
 assert.equal(blocked(start,tableCenter,tableBox),true);
 assert.equal(inside(guardedMove(start,tableCenter,tableBox),tableBox),false);
 assert.equal(inside(clearPoint(tableCenter,tableBox),tableBox),false);
 const detour=route({x:1.4,z:1.7},{x:2,z:.8},tableBox);
 assert.ok(detour?.length>=2);
 assert.equal(detour.some(p=>inside(p,tableBox)),false);
 assert.equal([{x:0,z:1.9},{x:-1.03,z:-.72},{x:-1.85,z:-.70}].some(p=>inside(p,tableBox)),false);
});
