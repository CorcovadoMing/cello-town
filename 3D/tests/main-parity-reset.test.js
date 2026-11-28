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
 '3D/window-landscape.js':'fa6ac99b13edca08a0ff6f8121e7a12f7b9eda27d3bfb877e345bf4d2bbe1a43',
 'rpg/garden.js':'76dd6cd336f756937afc76d96244f7aa7a53c6e55c8827e3397987b96ba56a74',
 'rpg/terrain-art.js':'eb6113cd6a5bebc2b26ee5c8c37fd737c0daf332eafe46c69e8a3be6b96b04ca',
 '3D/state.js':'355fe71a67eff5a244b2e42b0f45484f9173ee307e95c5f26d247941051711e8',
 '3D/room-polish.js':'c0c5765ee21efd2c417fcc24c1fa3410c11113ffa24f0cc1f9c12a2486dc18fb',
 '3D/app.js':'3dcefae7aff88facdb40f0e9998103a79b90bfe705b6782e4f793187fd8d6f97',
 'rpg/ambience.js':'53b9ced48a8a1867bc76ab7c8758e73e8e106dc985368a170bb134391f9cb0a2',
 'rpg/town-countryside.js':'cfa5e8cf22c653121af4b35bebec2719ecf996fc1dc638e5e85ce9e9217f0530',
 'rpg/town-shore.js':'c931b436edf07085a6322285063411856bc97d4572c488623535947ffde9aa06',
 'rpg/town-breeze.js':'5ee13d0757bf03906ace68a9398b1807cb38f3937b0073b3dc60eae6a5f69fe3',
 'rpg/style.css':'5ead5010e045d1bdc85ec3e0c5c5b3a29fa5063720582676e6e94c7999c101ee',
 'rpg/app.js':'0103da8463257d097188c9ec3cbee79eef359b0e27107361dc1c31350912af59',
 'rpg/index.html':'1e723fc1d6547fc0883ad0321d51ecc7d1f06eafb849a9a7a87d24b05f842c51',
 'rpg/town-depth.js':'3b082ca07119d517e0b747dd8ba8433c3aed0aa14bd18d07b2df6451c8efc7af',
 'rpg/music-room-art.js':'3292e702170bf184ab5f20403991b6e4395131184591b346463e5812f91e5a09',
 'rpg/town-webgl.js':'505795250021664bd0f7291ad471a9f46b98b04f11e16568d1deec3b9e14422f',
 'rpg/town-orchard.js':'babad8ab4eaa7869390eae298c01a787c21d9a8f61b6ea1d93804439927fbf21',
 'rpg/town-craft.js':'68d1f1cfc80eb714f275ab2236c4cc990271ea5b1d8e09caf258862b7fb033ab',
 'rpg/rain-system.js':'7c06e4903209151f74401f093f22bd7e830435d1c434e20fd23ed655e49e6e4a',
 'rpg/lounge-art.js':'45eae6f334d2f407a4877f97cf62cdf6aec94192cfa67a7135679f73c6ffce42',
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
