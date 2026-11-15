import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ROOM_ENTRY,ROOM_RETURN,roomReturnURL,roomDoorHit,createDoorApproach} from '../room-door.js';
import {roomBlocks,MUSIC_ROOM_APPROACH} from '../music-room-art.js';
import {createNavigation} from '../navigation.js';
test('one fixed door URL accepts only exact single from=room, preserves other query and hash',()=>{
 assert.equal(roomReturnURL('https://example.test/town/?from=town'),null);
 assert.equal(roomReturnURL('https://example.test/town/?from=room&from=room'),null);
 assert.equal(roomReturnURL('https://example.test/town/?from=Room'),null);
 assert.equal(roomReturnURL('https://example.test/town/?from=room&keep=1#garden').href,'https://example.test/town/?keep=1#garden');
 assert.equal(new URL('./3D/?from=town','https://example.test/town/?q=1').href,'https://example.test/town/3D/?from=town');
});
test('door geometry is safe exterior and connected to the unchanged branch, not wall',()=>{
 assert.deepEqual(ROOM_ENTRY,{x:676,y:251});assert.equal(ROOM_RETURN.y,259);
 const nav=createNavigation({blocked:roomBlocks});
 for(const p of [ROOM_ENTRY,ROOM_RETURN])assert.ok(nav.isWalkable(p.x,p.y));
 assert.ok(nav.lineClear({x:MUSIC_ROOM_APPROACH.centerX,y:299},ROOM_ENTRY));
 assert.equal(nav.isWalkable(676,239),false);
 assert.ok(roomDoorHit(676,190));assert.ok(roomDoorHit(676,252));
 assert.equal(roomDoorHit(620,210),false);assert.equal(roomDoorHit(676,285),false);
});
test('keyboard entry requires actual northward threshold crossing, not road passage',()=>{
 const d=createDoorApproach();
 assert.equal(d.step({x:650,y:285},{x:680,y:285},false),false);
 assert.equal(d.step({x:644,y:252},{x:644,y:249},true),false);
 assert.equal(d.step({x:676,y:255},{x:676,y:250},false),false);
 assert.equal(d.step({x:676,y:255},{x:676,y:250},true),true);
 assert.equal(d.step({x:676,y:255},{x:676,y:250},true),false);
});
test('return and browser Back latch survives idle/north until player leaves landing',()=>{
 const d=createDoorApproach(true);
 assert.equal(d.step(ROOM_RETURN,ROOM_RETURN,false),false);
 assert.equal(d.step(ROOM_RETURN,{x:676,y:245},true),false);
 assert.equal(d.step({x:676,y:245},{x:676,y:280},false),false);
 assert.equal(d.step({x:676,y:255},{x:676,y:250},true),true);
 d.disarm();assert.equal(d.step({x:676,y:255},{x:676,y:250},true),false);
});
test('bridge writes no storage and pointer navigation is arrival-only',()=>{
 const bridge=fs.readFileSync(new URL('../room-door.js',import.meta.url),'utf8');
 assert.doesNotMatch(bridge,/localStorage|sessionStorage/);
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/if\(roomDoorHit\(x,y\)\)\{walkTo\(ROOM_ENTRY,'room'\);\}/);
 assert.match(app,/if\(kind==='room'\)\{enterRoom\(\);return;\}/);
 assert.match(app,/if\(enteringRoom\|\|dlg.open\)return;/);
});
