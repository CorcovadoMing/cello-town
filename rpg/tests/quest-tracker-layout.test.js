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
test('task details sit outside the canvas with native keyboard disclosure and no new card',()=>{
 const html=read('index.html'),css=read('style.css').split('/* 037 private')[1];
 assert.match(html,/<details id="quest-hud" class="quest-sign" aria-labelledby="quest-title" hidden><summary>/);
 assert.ok(html.indexOf('<details id="quest-hud"')>html.indexOf('</canvas>'));
 assert.match(css,/background:transparent;border:0/);
 assert.doesNotMatch(css,/box-shadow/);
 assert.match(css,/summary:focus-visible/);
 assert.match(html,/style.css\?v=37-preview/);
 assert.match(read('app.js'),/聽一次 D 大調/);
});
