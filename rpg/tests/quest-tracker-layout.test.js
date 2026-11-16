import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,accept,complete,questView,turnIn} from '../model.js';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
test('quest tracker is opt-in by acceptance and keeps explicit turn-in',()=>{
 let s=fresh();assert.equal(questView(s).visible,false);s=accept(s);assert.equal(questView(s).visible,true);
 for(const step of ['listen','rhythm','memory'])s=complete(s,step);
 assert.equal(questView(s).ready,true);assert.equal(questView(turnIn(s)).visible,false);
});
test('static compact task overlay stays inside the map and leaves pointer input to it',()=>{
 const html=read('index.html'),css=read('style.css'),hud=html.slice(html.indexOf('<section id="quest-hud"'),html.indexOf('<canvas id="world"'));
 assert.match(hud,/aria-labelledby="quest-title" hidden/);
 assert.doesNotMatch(hud,/<details|<summary|<button|quest-toggle/);
 assert.match(hud,/<h2 id="quest-title">D 大調邀請<\/h2>/);
 assert.match(css,/left:clamp\(9px,2.8%,14px\);top:11px;width:16%/);
 assert.match(css,/\.quest-sign \.quest-sign-content\{pointer-events:none\}/);
 assert.match(html,/style.css\?v=43-preview/);
});
test('one local font family is shared by town DOM and painted labels',()=>{
 const css=read('style.css'),app=read('app.js');
 assert.ok(css.includes('body,body *{font-family:var(--town-font)!important}'));
 assert.ok(app.includes("getPropertyValue('--town-font')"));
 assert.ok(app.includes('g.font=`bold 13px ${townFont}`'));
 assert.ok(app.includes('g.font=`900 40px ${townFont}`'));
});
test('tracker and footer share a tighter two-level type scale and true bullets',()=>{
 const css=read('style.css'),app=read('app.js');
 assert.match(css,/--town-caption-size:10px;--town-detail-size:9px/);
 assert.match(css,/min-height:17px;padding:0;gap:1px/);
 assert.ok(app.includes("li.querySelector('b').textContent='•'"));
 assert.match(app,/quest-status.*quest.ready/);
});
