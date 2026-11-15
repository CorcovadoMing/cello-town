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
test('single teacher tap resolves conversation only after a valid nearby arrival',()=>{
 const app=read('app.js');
 assert.match(app,/target=null;\s*if\(kind==='chair'\)sitDown\(\);\s*else if\(kind==='npc'&&teacherWithinReach\(\)\)\{player.walking=false;talk\(\);\}/);
 assert.match(app,/if\(!target.path.length\)arriveAtTarget\(\)/);
 assert.match(app,/if\(teacherWithinReach\(\)\)\{standUp\(\);target=null;talk\(\);\}else walkTo\(/);
 assert.doesNotMatch(app,/再點老師交談/);
});
