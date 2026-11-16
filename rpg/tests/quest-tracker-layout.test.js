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
test('compact objective list stays left over the map on mobile without taking taps',()=>{
 const css=read('style.css').split('/* Keep objectives on the map')[1];
 assert.match(css,/position:absolute;top:10px;left:10px;right:auto/);
 assert.match(css,/pointer-events:none/);assert.match(css,/width:124px/);assert.match(css,/linear-gradient\(90deg,#f6ebd3dc/);assert.match(css,/\.quest-hud ol\{display:block/);
 assert.doesNotMatch(css,/position:relative/);
 assert.match(read('index.html'),/style.css\?v=36/);
 assert.match(read('index.html'),/>任務 · 1<\/span>/);
});
