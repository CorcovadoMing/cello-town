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
test('collapsible task overlay lives inside map without shifting canvas',()=>{
 const html=read('index.html'),css=read('style.css').split('/* 039 private preview')[1];
 assert.ok(html.indexOf('<details id="quest-hud"')>html.indexOf('class="map-stage"'));
 assert.ok(html.indexOf('<details id="quest-hud"')<html.indexOf('<canvas id="world"'));
 assert.match(css,/left:1%/);assert.match(css,/width:21%/);assert.match(css,/background:none/);
 assert.match(css,/color:#ffd66d/);assert.match(html,/style.css\?v=42/);
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
 assert.ok(app.includes("$('quest-status').textContent='D大調邀請'"));
});
