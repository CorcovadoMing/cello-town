import test from 'node:test';import assert from 'node:assert/strict';import {MUSIC_ROOM,roomBlocks,drawMusicRoom} from '../music-room-art.js';import {createNavigation} from '../navigation.js';
test('restored room footprint leaves lounge, main road and practice approach clear',()=>{
 const navigation=createNavigation({blocked:roomBlocks});assert.equal(navigation.isWalkable(665,180),false);
 for(const p of[{x:577,y:250},{x:560,y:232},{x:615,y:432},{x:443,y:250},{x:710,y:460}]){assert.ok(navigation.findPath({x:460,y:425},p));assert.equal(roomBlocks(p.x,p.y),false);}
 assert.equal(MUSIC_ROOM.depth,MUSIC_ROOM.y+MUSIC_ROOM.h);assert.ok(MUSIC_ROOM.depth<269);
});
test('room is finite flat-pixel art with balanced canvas state',()=>{let d=0,n=0;drawMusicRoom({save(){d++},restore(){d--},fillRect(...a){assert.ok(a.every(Number.isFinite));assert.ok(a[2]>0&&a[3]>0);n++}});assert.equal(d,0);assert.ok(n>60);});
