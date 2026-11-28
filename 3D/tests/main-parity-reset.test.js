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
 '3D/index.html':'892dc7f554aee9c4de308968c811c9dccd14a7bc42feaad8298347bd67227046',
 '3D/window-landscape.js':'fa6ac99b13edca08a0ff6f8121e7a12f7b9eda27d3bfb877e345bf4d2bbe1a43',
 'rpg/garden.js':'76dd6cd336f756937afc76d96244f7aa7a53c6e55c8827e3397987b96ba56a74',
 'rpg/terrain-art.js':'eb6113cd6a5bebc2b26ee5c8c37fd737c0daf332eafe46c69e8a3be6b96b04ca',
 '3D/state.js':'244819d909390bc33bf0f0c15b6356e0f8517612319af33210035e7618bcbf0b',
 '3D/room-polish.js':'5a358d70560f969a61078f257a41d1a13c8f17c2b524554cf8de27c227e8c4d6',
 '3D/app.js':'6059b35c245b406b9f97476d22f0faddff05d087f66b813acddafe49fce1fafd',
 'rpg/ambience.js':'407c270dfe651221379230b4bf50c3b15264aaa6c0a3121b82704e9463194cc4',
 'rpg/town-countryside.js':'6b5a173f032ed724067b1d65dd295f7ea02a5f1a59390afac0186af0154a3b88',
 'rpg/town-shore.js':'9aa667fb953e593e430729c2256bf46fc27442b3cdf072835e885124379b0302',
 'rpg/town-breeze.js':'5ee13d0757bf03906ace68a9398b1807cb38f3937b0073b3dc60eae6a5f69fe3',
 'rpg/style.css':'5ead5010e045d1bdc85ec3e0c5c5b3a29fa5063720582676e6e94c7999c101ee',
 'rpg/app.js':'b273688c7671ff0bf576769c907e8794eec27eadde14d4acd1e9ebef6cb651ed',
 'rpg/index.html':'e20f2d6e0e89a652853ebba863280770e269d26fda95ab2e794a414094e7c174',
 'rpg/town-depth.js':'3b082ca07119d517e0b747dd8ba8433c3aed0aa14bd18d07b2df6451c8efc7af',
 'rpg/music-room-art.js':'3292e702170bf184ab5f20403991b6e4395131184591b346463e5812f91e5a09',
 'rpg/town-webgl.js':'a0659b8f24a4adf0af2de7f529778725d4f30ff5a6a1ccc9dfee48738e083951',
 'rpg/town-orchard.js':'babad8ab4eaa7869390eae298c01a787c21d9a8f61b6ea1d93804439927fbf21',
 'rpg/town-craft.js':'68d1f1cfc80eb714f275ab2236c4cc990271ea5b1d8e09caf258862b7fb033ab',
 'rpg/rain-system.js':'7c06e4903209151f74401f093f22bd7e830435d1c434e20fd23ed655e49e6e4a',
 'rpg/lounge-art.js':'b77c3c3a9b48c9913fb4029386a86f58ebbd92bfa801aa79fecb750e8a04b644',
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
