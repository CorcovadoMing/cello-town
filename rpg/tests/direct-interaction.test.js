import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
test('map is keyboard-focusable and uses direct pointer interaction without an on-screen dock',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.doesNotMatch(html, /class="touch-controls"|id="interact"|data-dir=/);
 assert.doesNotMatch(app, /\$\('interact'\)/);
 assert.match(html, /<canvas id="world"[^>]*tabindex="0"/);
 assert.match(app, /canvas.onpointerdown=/);assert.match(app, /e.key==='Enter'/);
 assert.match(app, /if\(near==='stand'\)practice\(\)/);assert.match(app, /if\(near==='npc'\)talk\(\)/);
});
