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
test('a stand tap queues a single reachable practice interaction and no second-tap prompt',()=>{
 const app=read('app.js'), pointer=app.slice(app.indexOf('canvas.onpointerdown='));
 assert.match(pointer,/if\(standWithinReach\(\)\)\{standUp\(\);target=null;practice\(\);\}else walkTo\(standApproach,'stand'\)/);
 assert.match(app,/else if\(kind==='stand'&&standWithinReach\(\)\)\{player.walking=false;practice\(\);\}/);
 assert.doesNotMatch(app,/走近後，再點譜架/);
});
test('teacher dialogue drops stock fillers but preserves the learning instructions',()=>{
 const app=read('app.js'), talk=app.slice(app.indexOf('function talk()'),app.indexOf('function practice()'));
 assert.doesNotMatch(talk,/[：。！？']來，|，好嗎？|慢慢來/);
 assert.match(talk,/我們從 D 大調的一個八度開始。/);
 assert.match(talk,/先聽一遍，再跟著拍子拉，最後把提示收起來試試。/);
 assert.doesNotMatch(app,/老師：慢慢來/);
});
test('flowerbed queues one arrival action, with fresh distance and no second tap',()=>{
 const app=read('app.js'),pointer=app.slice(app.indexOf('canvas.onpointerdown='));
 assert.match(app,/else if\(kind==='garden'&&gardenWithinReach\(\)\)\{player.walking=false;openGarden\(\);\}/);
 assert.match(pointer,/if\(gardenWithinReach\(\)\)\{standUp\(\);target=null;openGarden\(\);\}else walkTo\(\{x:garden.x,y:garden.y\},'garden'\)/);
 assert.doesNotMatch(app,/再點花園/);
 assert.match(app,/const kind=target.kind;target=null/);
 assert.match(pointer,/else walkTo\(\{x,y\}\)/);
});
