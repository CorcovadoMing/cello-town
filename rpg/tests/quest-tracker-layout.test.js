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
 const html=read('index.html'),css=read('style.css').split('/* 038 preview')[1];
 assert.ok(html.indexOf('<details id="quest-hud"')>html.indexOf('class="map-stage"'));
 assert.ok(html.indexOf('<details id="quest-hud"')<html.indexOf('<canvas id="world"'));
 assert.match(css,/position:absolute/);assert.match(css,/background:#f7efd633/);
 assert.match(css,/summary\{pointer-events:auto/);assert.match(html,/style.css\?v=38-preview/);
});
