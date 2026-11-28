import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./main-parity-reset.json',import.meta.url),'utf8'));
function normalized(s){
 const previousStool="cylinder(2.15,.38,1.55,.4,.4,.12,'#b78b61');for(const dx of [-.23,.23])for(const dz of [-.2,.2])rod([2.15+dx,.35,1.55+dz],[2.15+dx*1.2,.01,1.55+dz*1.2],.035,'#a27d57');box(2.15,.48,1.55,.48,.08,.3,'#d6a29a');box(2.12,.54,1.55,.43,.05,.3,'#eee4c9');";
 const intact=s.replace(/\n\/\/ BEGIN SIDE TABLE MANUSCRIPT[\s\S]*?\/\/ END SIDE TABLE MANUSCRIPT\n/,previousStool)
  .replace('destination=clearPoint(destination,SCORE_TABLE_FOOTPRINT);const tableRoute=segmentBlocked(pos,destination,SCORE_TABLE_FOOTPRINT)?routeAroundStool(pos,destination,SCORE_TABLE_FOOTPRINT):null;const next=stoolRouteStep(pos,tableRoute?.[0]||destination,dt);','const next=stoolRouteStep(pos,destination,dt);')
  .replace('pos=guardedMove(pos,guardedMove(pos,move(pos,wx,wz,dt),SCORE_TABLE_FOOTPRINT),STOOL_COLLIDER);','pos=guardedMove(pos,move(pos,wx,wz,dt),STOOL_COLLIDER);')
  .replace(/\n\/\* BEGIN SIDE TABLE MANUSCRIPT \*\/[\s\S]*?\/\* END SIDE TABLE MANUSCRIPT \*\/\n$/,'')
  .replace("positionManuscript();if(reading&&reading.phase!=='walking'){if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}return;}", 'positionManuscript();')
  .replace(/  \/\/ BEGIN INTERIOR MATERIAL SWATCHES[\s\S]*?  \/\/ END INTERIOR MATERIAL SWATCHES\n/,'')
  .replace(/\/\/ BEGIN INTERIOR SURFACE FINISH[\s\S]*? \/\/ END INTERIOR SURFACE FINISH\n/,'')
  .replace('tickRoomCamera(t,dt);positionManuscript();roomCat.animateCat','tickRoomCamera(t,dt);roomCat.animateCat');
 return intact.replace(/\.js\?v=[^'"\s]+/g,'.js').replace(/KEY=\/[^;]+;/g,m=>m.includes('3d-avatar')?"KEY='cello-town-3d-avatar-v1';":"KEY='cello-town-rpg-v1';");}
// Preserve the main parity fixture: allow only the exact tested experimental
// outdoor drawing revision and its accompanying module, not future drift.
const outdoorVisualHashes={
 'rpg/app.js':'04f7fcb5e0aba12a052c7bb0cb9042c02ad56c33df7b887aa3654411a1b8131b',
 'rpg/index.html':'0f34dd3c6c31b1fae3610679e7b4fdc40900af93d9905bf1b8951506bf3069b8',
 'rpg/town-depth.js':'3b082ca07119d517e0b747dd8ba8433c3aed0aa14bd18d07b2df6451c8efc7af',
 'rpg/music-room-art.js':'00011725eb971e6e7e7811f0898983c5c798c7808e47f7e9af9e31d25affbb6b',
 'rpg/town-webgl.js':'d7a270007d9b7400d7977bebaa9b2e77b5bbe11ca9d3dee75c7dbf16816cc972',
 'rpg/town-orchard.js':'c457f8eb9f52de1062ae5f58ce8a32e4996a17ca4490a31153234738057fac66'
};
const sha256=text=>crypto.createHash('sha256').update(text).digest('hex');
test('experimental matches exact main snapshot except the scoped storage, manuscript and outdoor art',()=>{
 for(const [path,sha] of Object.entries(fixture.files)){
  if(Object.hasOwn(outdoorVisualHashes,path))continue;
  const text=fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
  assert.equal(sha256(normalized(text)),sha,path+' matches '+fixture.main);
 }
 for(const [path,sha] of Object.entries(outdoorVisualHashes)){
  const text=fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
  assert.equal(sha256(text),sha,path+' matches reviewed experimental outdoor art');
 }
});
