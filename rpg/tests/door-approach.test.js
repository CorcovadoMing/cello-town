import test from'node:test';
import assert from'node:assert/strict';
import{MUSIC_ROOM,MUSIC_ROOM_DOOR,MUSIC_ROOM_APPROACH,roomBlocks}from'../music-room-art.js';
import{WET_SURFACES,soilCell}from'../wet-soil.js';
test('door-centered soil passes behind the treads and under the facade, without changing access',()=>{
 const {landing,soil,centerX}=MUSIC_ROOM_APPROACH;
 assert.equal(centerX,MUSIC_ROOM_DOOR.x+MUSIC_ROOM_DOOR.w/2);
 assert.equal(centerX,676);
 assert.equal(landing.x+landing.w/2,centerX);
 assert.equal(soil.x+soil.w/2,centerX);
 assert.equal(landing.y,MUSIC_ROOM.depth+4);
 assert.deepEqual([landing.w,landing.h],[64,20]);
 assert.ok(soil.y<MUSIC_ROOM.depth);
 assert.equal(soil.y+soil.h,298);
 assert.deepEqual(WET_SURFACES.slice(0,2),[{kind:'road',x:170,y:298,w:620,h:72},{kind:'road',x:428,y:370,w:72,h:190}]);
 for(let y=soil.y;y<298;y++)for(let x=soil.x;x<soil.x+soil.w;x++){
  const c=soilCell(x,y);
  assert.equal(c.kind,'road');
  assert.ok(c.y+c.h<=298);
 }
 assert.equal(soilCell(620,250),null);
 assert.equal(roomBlocks(centerX,MUSIC_ROOM.depth),true);
 assert.equal(roomBlocks(centerX,landing.y),false);
});
