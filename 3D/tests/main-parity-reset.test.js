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
  .replace("roomFinish(rug,'rug-medallion');","roomFinish(rug,'woven',5,5);")
  .replace('tickRoomCamera(t,dt);positionManuscript();roomCat.animateCat','tickRoomCamera(t,dt);roomCat.animateCat');
 return intact.replace(/\.js\?v=[^'"\s]+/g,'.js').replace(/KEY=\/[^;]+;/g,m=>m.includes('3d-avatar')?"KEY='cello-town-3d-avatar-v1';":"KEY='cello-town-rpg-v1';");}
// Preserve the main parity fixture: allow only the exact tested experimental
// outdoor drawing revision and its accompanying module, not future drift.
const reviewedExperimentalHashes={
 '3D/state.js':'355fe71a67eff5a244b2e42b0f45484f9173ee307e95c5f26d247941051711e8',
 '3D/room-polish.js':'67f7847e5a0d2c28d0c07e2b0187dadf77f249902582d610d7588276f827228c',
 '3D/app.js':'da36cba48b97bec8603e89c9f124bf773ea7101a9dad52af5566f1b6b0b2a442',
 'rpg/ambience.js':'53b9ced48a8a1867bc76ab7c8758e73e8e106dc985368a170bb134391f9cb0a2',
 'rpg/town-countryside.js':'7476bd4dec87bee3603bdf9a7f695be5e7b3067336b15d3fa2ba45271b187b55',
 'rpg/town-shore.js':'e8ed0ffde7a3002aec96228774eb5fe9558a60e2eb85b3903e023e9738621a35',
 'rpg/town-breeze.js':'256fe7ab308a457bf347e21c021c0cb0cd3947e7d66bb6cd2451aa870142c0f4',
 'rpg/style.css':'5ead5010e045d1bdc85ec3e0c5c5b3a29fa5063720582676e6e94c7999c101ee',
 'rpg/app.js':'2e98f2e42cf57c4a99698d3475a29a58269ae0dcc5cf6e4ab4fc3a67cc6098eb',
 'rpg/index.html':'bf319dcb233437c19653bbc8e9aa9a19c07cab1286cca03b4517a8342d25dd59',
 'rpg/town-depth.js':'3b082ca07119d517e0b747dd8ba8433c3aed0aa14bd18d07b2df6451c8efc7af',
 'rpg/music-room-art.js':'3292e702170bf184ab5f20403991b6e4395131184591b346463e5812f91e5a09',
 'rpg/town-webgl.js':'568e89737650a951ec685a07164a6ad3f9df16086a7ea6329f692557c1b0feeb',
 'rpg/town-orchard.js':'232c36fd5cd58006aedbfc8c332b25a99b689503d55ddf2655e893f45374dbd7',
 'rpg/town-craft.js':'6c0ce1ff762a438bd93996e9aeb0b60f718fd58c0f23585827704d421aebba02',
 'rpg/rain-system.js':'7c06e4903209151f74401f093f22bd7e830435d1c434e20fd23ed655e49e6e4a',
 'rpg/lounge-art.js':'d0ced0c0032593bccab8f8120397b6041fd96e8aeab711131fc29ffb47d87a20',
 'rpg/avatar.js':'8f831f25d96a68db6d9cd731c49039d6e0caea90f8e9c8e0852bb2054f26da51',
 'rpg/teacher.js':'fe836e8871369fe1795df386125f8fa296e7618de1064e7fb49a8d9e6db1fe37'
};
const sha256=text=>crypto.createHash('sha256').update(text).digest('hex');
test('experimental matches exact main snapshot except the scoped storage, manuscript and scoped visual updates',()=>{
 for(const [path,sha] of Object.entries(fixture.files)){
  if(Object.hasOwn(reviewedExperimentalHashes,path))continue;
  const text=fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
  assert.equal(sha256(normalized(text)),sha,path+' matches '+fixture.main);
 }
 for(const [path,sha] of Object.entries(reviewedExperimentalHashes)){
  const text=fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
  assert.equal(sha256(text),sha,path+' matches reviewed experimental outdoor art');
 }
});
