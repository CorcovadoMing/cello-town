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
 'rpg/garden.js':'76dd6cd336f756937afc76d96244f7aa7a53c6e55c8827e3397987b96ba56a74',
 'rpg/terrain-art.js':'eb6113cd6a5bebc2b26ee5c8c37fd737c0daf332eafe46c69e8a3be6b96b04ca',
 '3D/state.js':'355fe71a67eff5a244b2e42b0f45484f9173ee307e95c5f26d247941051711e8',
 '3D/room-polish.js':'76dccff47b01fd25ce89a8c700dadff7ce94769c3661fc3d6f9bba9d47d1744f',
 '3D/app.js':'244ebfc3190cbe2096c4ccce020a2ea537d7e62818d2995633e8d596d722440e',
 'rpg/ambience.js':'53b9ced48a8a1867bc76ab7c8758e73e8e106dc985368a170bb134391f9cb0a2',
 'rpg/town-countryside.js':'cfa5e8cf22c653121af4b35bebec2719ecf996fc1dc638e5e85ce9e9217f0530',
 'rpg/town-shore.js':'c931b436edf07085a6322285063411856bc97d4572c488623535947ffde9aa06',
 'rpg/town-breeze.js':'87c0573c346210462a3ffeb2a2e1c2364a91d02d6ff85b2e4756be36e22dd26a',
 'rpg/style.css':'5ead5010e045d1bdc85ec3e0c5c5b3a29fa5063720582676e6e94c7999c101ee',
 'rpg/app.js':'675c7fcba67e9ed828c9203acd487c0cad941773053e6d4274a79cf9c8352ba6',
 'rpg/index.html':'4080010cf361a9d5e316112d71dbf81e9d62491951119eb419106bdda0d4c0cb',
 'rpg/town-depth.js':'3b082ca07119d517e0b747dd8ba8433c3aed0aa14bd18d07b2df6451c8efc7af',
 'rpg/music-room-art.js':'3292e702170bf184ab5f20403991b6e4395131184591b346463e5812f91e5a09',
 'rpg/town-webgl.js':'3512c09806fee65446a11b219b1917521697d0db856bc10cb1d2309954074431',
 'rpg/town-orchard.js':'babad8ab4eaa7869390eae298c01a787c21d9a8f61b6ea1d93804439927fbf21',
 'rpg/town-craft.js':'68d1f1cfc80eb714f275ab2236c4cc990271ea5b1d8e09caf258862b7fb033ab',
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
