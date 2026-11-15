import test from 'node:test';import assert from 'node:assert/strict';
import {LOUNGE_LAYOUT,drawLoungeTable,drawLoungeChair,drawSeatedResident,drawRainUmbrella} from '../lounge-art.js';
test('lounge art is finite and balanced, with seated identity and fixed layout',()=>{
 const before=JSON.stringify(LOUNGE_LAYOUT);let depth=0,rects=0;
 const g={save(){depth++;},restore(){depth--;assert.ok(depth>=0);},translate(...v){assert.ok(v.every(Number.isFinite));},scale(...v){assert.ok(v.every(Number.isFinite));},beginPath(){},clip(){},rect(...v){assert.ok(v.every(Number.isFinite));},fillRect(...v){rects++;assert.ok(v.every(Number.isFinite));assert.ok(v[2]>=0&&v[3]>=0);}};
 drawLoungeTable(g);for(const s of LOUNGE_LAYOUT.seats){drawLoungeChair(g,s);for(const kind of['player','teacher'])for(const reduced of[true,false])drawSeatedResident(g,{...s,kind,t:3200,reduced});}for(const facing of['front','back','left','right'])drawRainUmbrella(g,{x:300,y:200,facing});assert.equal(depth,0);assert.ok(rects>200);assert.equal(JSON.stringify(LOUNGE_LAYOUT),before);assert.ok(Object.isFrozen(LOUNGE_LAYOUT.seats));
});
test('table and chairs leave separate approach points and old main road unobstructed',()=>{
 const {table,seats}=LOUNGE_LAYOUT;assert.equal(table.depth,table.solid.y+table.solid.h);assert.ok(table.depth<300);
 for(const s of seats){const r=table.solid;assert.ok(!(s.approach.x>=r.x&&s.approach.x<=r.x+r.w&&s.approach.y>=r.y&&s.approach.y<=r.y+r.h));assert.ok(s.approach.y<300);}
});
test('reading book belongs to teacher only, not an always-present table prop',()=>{
 const g={save(){},restore(){},translate(){},fillRect(){},set fillStyle(c){this.colors.push(c)},colors:[]};drawLoungeTable(g);
 assert.ok(!g.colors.includes('#f1e3bb'));assert.ok(!g.colors.includes('#48695a'));
});
