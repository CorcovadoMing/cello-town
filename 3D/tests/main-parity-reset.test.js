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
 'rpg/town-countryside.js':'55a6fb2d7df4e377a62a65c90e6e442a02bc4edb0059eae50f04d295323f308e',
 'rpg/town-shore.js':'083e2f167cc3ac445334c82dd1a05f5f15693d8f84fe4f39a778fb2dee55c0a5',
 'rpg/town-breeze.js':'8c6e5009f3a12eb2089c23c6e78cb958a5f041af78682837cb4716557490d1d4',
 'rpg/style.css':'5ead5010e045d1bdc85ec3e0c5c5b3a29fa5063720582676e6e94c7999c101ee',
 'rpg/app.js':'13cb53a1b4680c76d062ab3422f4984d1230f41f12f81e80d6135c5c8e3d12fc',
 'rpg/index.html':'c63ebbbe9ce95072e2f73fbba55c7ac0b10b7f2b6f16193fdef2c27c928aa49a',
 'rpg/town-depth.js':'3b082ca07119d517e0b747dd8ba8433c3aed0aa14bd18d07b2df6451c8efc7af',
 'rpg/music-room-art.js':'00011725eb971e6e7e7811f0898983c5c798c7808e47f7e9af9e31d25affbb6b',
 'rpg/town-webgl.js':'cd72f22f057af8a5bdc18f5ca8d62e3b40f4deaf873d08216ae6e35e243662e4',
 'rpg/town-orchard.js':'d3d212ebd047596a8f73b7773969a2a537642330bbdaef8e4fbfeb8ac08b0641',
 'rpg/town-craft.js':'6c0ce1ff762a438bd93996e9aeb0b60f718fd58c0f23585827704d421aebba02',
 'rpg/rain-system.js':'7c06e4903209151f74401f093f22bd7e830435d1c434e20fd23ed655e49e6e4a',
 'rpg/lounge-art.js':'d0ced0c0032593bccab8f8120397b6041fd96e8aeab711131fc29ffb47d87a20',
 'rpg/avatar.js':'8f831f25d96a68db6d9cd731c49039d6e0caea90f8e9c8e0852bb2054f26da51',
 'rpg/teacher.js':'fe836e8871369fe1795df386125f8fa296e7618de1064e7fb49a8d9e6db1fe37'
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
