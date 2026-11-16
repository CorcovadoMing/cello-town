import test from 'node:test';import assert from 'node:assert/strict';import {drawMusicRoom,MUSIC_ROOM,MUSIC_ROOM_DOOR,musicRoomRainCanopy} from '../music-room-art.js';
test('handcrafted facade stays inside existing house roof chimney and foundation silhouette',()=>{
 const ops=[];const g={fillStyle:'',save(){},restore(){},fillRect(x,y,w,h){ops.push([x,y,w,h,this.fillStyle]);}};drawMusicRoom(g);
 const regions=[[580,126,196,113],[576,238,206,5],[560,114,236,14],[572,100,211,14],[587,86,181,14],[603,73,150,13],[620,62,116,11],[618,60,120,3],[718,45,23,39],[714,40,31,6]];
 for(const[x,y,w,h]of ops)for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)assert.ok(regions.some(([rx,ry,rw,rh])=>xx>=rx&&xx<rx+rw&&yy>=ry&&yy<ry+rh),`art expanded footprint at ${xx},${yy}`);
 const first=JSON.stringify(ops);ops.length=0;drawMusicRoom(g);assert.equal(JSON.stringify(ops),first);
 assert.deepEqual(MUSIC_ROOM,{x:580,y:126,w:196,h:113,depth:239});assert.deepEqual(MUSIC_ROOM_DOOR,{x:653,y:169,w:46,h:63});
 const roof=musicRoomRainCanopy();assert.equal(roof.left,560);assert.equal(roof.columns.length,236);assert.equal(roof.columns[714-560],40);
});
