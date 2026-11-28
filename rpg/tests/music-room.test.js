import test from 'node:test';import assert from 'node:assert/strict';import {MUSIC_ROOM,roomBlocks,drawMusicRoom} from '../music-room-art.js';import {createNavigation} from '../navigation.js';
test('restored room footprint leaves lounge, main road and practice approach clear',()=>{
 const navigation=createNavigation({blocked:roomBlocks});assert.equal(navigation.isWalkable(665,180),false);
 for(const p of[{x:577,y:250},{x:560,y:232},{x:615,y:432},{x:443,y:250},{x:710,y:460}]){assert.ok(navigation.findPath({x:460,y:425},p));assert.equal(roomBlocks(p.x,p.y),false);}
 assert.equal(MUSIC_ROOM.depth,MUSIC_ROOM.y+MUSIC_ROOM.h);assert.ok(MUSIC_ROOM.depth<269);
});
test('projected room uses finite geometry and balanced canvas state',()=>{
 let depth=0,pixels=0,faces=0;
 const finite=(...a)=>assert.ok(a.every(Number.isFinite));
 drawMusicRoom({
  save(){depth++;},restore(){depth--;},beginPath(){},closePath(){},moveTo:finite,lineTo:finite,
  fill(){faces++;},fillRect(...a){finite(...a);assert.ok(a[2]>0&&a[3]>0);pixels++;}
 });
 assert.equal(depth,0);assert.ok(pixels>30&&faces>100);
});

test('visible music-room paint selects façade and both roof sides without selecting scenery',async()=>{
 const {musicRoomHouseHit}=await import('../music-room-art.js');
 for(const [x,y] of [[620,182],[726,198],[705,97],[642,114],[676,205]])assert.equal(musicRoomHouseHit(x,y),true,`${x},${y}`);
 for(const [x,y] of [[734,265],[775,218],[605,65],[595,173],[NaN,95]])assert.equal(musicRoomHouseHit(x,y),false,`${x},${y}`);
});
