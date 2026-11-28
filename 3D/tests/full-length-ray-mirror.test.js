import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRoomRayMirror} from '../room-polish.js';

test('support gating returns cleanly when GPU precision/storage are unavailable',()=>{
 assert.equal(createRoomRayMirror(null,[],null,{capabilities:{isWebGL2:false,maxTextureSize:4096}}),null);
 assert.equal(createRoomRayMirror(null,[],null,{capabilities:{isWebGL2:true,maxTextureSize:128}}),null);
});
test('full-length experiment traces real scene hits without re-rendering a second camera',()=>{
 const polish=fs.readFileSync(new URL('../room-polish.js',import.meta.url),'utf8').split('export function createRoomRayMirror')[1];
 assert.match(polish,/reflect\(incoming,n\)/);
 assert.match(polish,/if\(hit<=\.0002\|\|hit>=best\)/);
 assert.doesNotMatch(polish,/WebGLRenderTarget|\.render\(/);
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/get\('raymirror'\)==='1'/);
 assert.doesNotMatch(app,/__roomRayMirror|standForProbe/);
});
