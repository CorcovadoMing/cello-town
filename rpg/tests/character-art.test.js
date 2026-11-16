import test from 'node:test';import assert from 'node:assert/strict';import {drawTeacher} from '../teacher.js';import {drawPlayer} from '../avatar.js';
function commands(draw,pose){const calls=[],g={fillStyle:'',save(){},restore(){},translate(...a){calls.push(['translate',...a])},scale(...a){calls.push(['scale',...a])},fillRect(...a){assert.ok(a.every(Number.isFinite));calls.push([this.fillStyle,...a]);}};draw(g,{x:0,y:0,t:900,stride:1,...pose});return calls;}
test('both pixel actors retain four distinct oriented drawings and deterministic reduced motion',()=>{for(const draw of[drawTeacher,drawPlayer]){const frames=['front','back','left','right'].map(facing=>commands(draw,{facing,reduced:true}));assert.equal(new Set(frames.map(JSON.stringify)).size,4);for(const facing of['front','back','left','right'])assert.deepEqual(commands(draw,{facing,t:0,reduced:true}),commands(draw,{facing,t:9999,reduced:true}));}});
test('teacher back excludes facial blush and profile preserves one visible eye',()=>{const back=commands(drawTeacher,{facing:'back',reduced:true}),front=commands(drawTeacher,{facing:'front',reduced:true}),side=commands(drawTeacher,{facing:'right',reduced:true});assert.equal(back.filter(c=>c[0]==='#e9a29a').length,0);assert.equal(front.filter(c=>c[0]==='#e9a29a').length,2);assert.equal(side.filter(c=>c[0]==='#e9a29a').length,1);});
test('player has no cap pixels and sleeves stay within the field-jacket palette',()=>{
 for(const facing of ['front','back','left','right']){
 const frame=commands(drawPlayer,{facing,reduced:true});
 for(const c of ['#4a8f83','#87b4a0','#367266','#fff1d7','#fff7e3','#f3e4c6'])assert.ok(!frame.some(r=>r[0]===c));
 assert.ok(frame.some(r=>r[0]==='#80906b'));assert.ok(frame.some(r=>r[0]==='#f4c998'));
 }
});
test('short back hair clears the neck while keeping the warm player identity',()=>{
 const frame=commands(drawPlayer,{facing:'back',reduced:true});
 const hairColors=new Set(['#503c32','#634a37','#403129','#75563b','#926d46','#a78356']);
 assert.ok(frame.some(r=>r[0]==='#503c32'));
 assert.ok(!frame.some(r=>hairColors.has(r[0])&&r[2]>=-28));
 assert.ok(frame.some(r=>r[0]==='#f4c998'&&r[2]===-28));
});

test('teacher nose stays compact in each mirrored profile without changing facial identity',()=>{for(const facing of ['left','right']){const frame=commands(drawTeacher,{facing,reduced:true});const nose=frame.find(c=>c[0]==='#493e43'&&c[1]===8&&c[2]===-34);assert.deepEqual(nose,['#493e43',8,-34,2,3]);assert.equal(frame.filter(c=>c[0]==='#e9a29a').length,1);}});
