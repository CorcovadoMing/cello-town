import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('initial map slot is neutral and inert until a real renderer draws a frame',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="world-loading"[^>]*role="status"/);
 assert.match(html,/id="world" data-renderer="pending" inert style="visibility:hidden"/);
 assert.match(app,/if\(townBoot!=='pending'&&!pending3DTown\)/);
 assert.match(app,/markMapPainted\(draw\(t\)\)/);
 assert.match(app,/return 'webgl'/);assert.match(app,/return 'canvas'/);
 assert.match(app,/canvas\.style\.removeProperty\('visibility'\);canvas\.removeAttribute\('inert'\);firstMapNotice\?\.remove/);
});
test('fallback selection is sticky and a late 3D initializer is released',()=>{
 const app=read('app.js');
 assert.match(app,/TOWN_BOOT_DEADLINE_MS=4200/);
 assert.match(app,/townBootTimer=setTimeout\(\(\)=>pickTownRenderer\('canvas'\),TOWN_BOOT_DEADLINE_MS\)/);
 assert.match(app,/if\(townBoot!=='pending'\)return false/);
 assert.match(app,/if\(pickTownRenderer\('webgl'\)\)pending3DTown=view;\s*else view\.discard\(\)/);
 assert.match(app,/let townBoot=FLAT_TOWN\?'canvas':'pending'/);
});
