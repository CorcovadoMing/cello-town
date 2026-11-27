import test from 'node:test';import assert from 'node:assert/strict';import {drawMusicRoom,MUSIC_ROOM,MUSIC_ROOM_DOOR,musicRoomRainCanopy,roomBlocks} from '../music-room-art.js';
test('projected roof and side wall are bounded and deterministic without moving the doorway or collision',()=>{
 const ops=[];const g={fillStyle:'',save(){},restore(){},beginPath(){ops.push([]);},moveTo(x,y){ops.at(-1).push([x,y]);},lineTo(x,y){ops.at(-1).push([x,y]);},closePath(){},fill(){ops.at(-1).push(this.fillStyle);},fillRect(x,y,w,h){ops.push([[x,y],[x+w,y+h],this.fillStyle]);}};
 drawMusicRoom(g);
 for(const entry of ops)for(const [x,y] of entry.filter(Array.isArray)) {assert.ok(x>=580&&x<=793);assert.ok(y>=45&&y<=240);}
 const first=JSON.stringify(ops);ops.length=0;drawMusicRoom(g);assert.equal(JSON.stringify(ops),first);
 const walls=ops.slice(0,4);assert.ok(walls[3][0][0]<walls[3][1][0]);assert.ok(walls[3][0][1]>walls[3][1][1]); // depth projects right/up
 assert.deepEqual(MUSIC_ROOM,{x:580,y:126,w:196,h:113,depth:239});assert.deepEqual(MUSIC_ROOM_DOOR,{x:653,y:169,w:46,h:63});assert.ok(roomBlocks(776,239));assert.ok(!roomBlocks(676,244));
 const roof=musicRoomRainCanopy();assert.equal(roof.left,594);assert.equal(roof.columns.length,194);
 assert.ok(roof.columns.every(Number.isFinite));
 assert.ok(Math.min(...roof.columns)<58);assert.ok(roof.columns[0]>130);
 assert.equal(roof.groundMax,239);
});
