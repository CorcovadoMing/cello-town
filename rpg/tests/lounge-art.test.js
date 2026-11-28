import test from 'node:test';import assert from 'node:assert/strict';
import {loungePageTurn,LOUNGE_LAYOUT,drawLoungeTable,drawLoungeChair,drawSeatedResident,drawRainUmbrella,drawUmbrellaResident} from '../lounge-art.js';
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

test('large table book appears only when reading and never in rain',()=>{
 const calls=[];const g={save(){},restore(){},translate(...a){calls.push(['translate',...a])},rotate(a){calls.push(['rotate',a])},scale(){},fillRect(...r){calls.push([this.fillStyle,...r])}};
 for(const [readingSide,dx,angle] of [['left',-17,Math.PI/2],['right',17,-Math.PI/2]]){calls.length=0;drawLoungeTable(g,{readingSide});assert.ok(calls.some(([c,x,y,w,h])=>c==='#48695a'&&w===32&&h===26));assert.deepEqual(calls.filter(c=>c[0]==='translate').at(-1),['translate',dx,-5]);assert.deepEqual(calls.filter(c=>c[0]==='rotate'),[['rotate',angle]]);}
 calls.length=0;drawLoungeTable(g,{readingSide:'right',rain:true});assert.ok(!calls.some(c=>c[0]==='#48695a'));
});
test('teacher umbrella is white-grey with a distinct round scalloped silhouette',()=>{
 function draw(kind){const r=[];const g={save(){},restore(){},translate(){},scale(){},fillRect(...a){r.push([this.fillStyle,...a])}};drawRainUmbrella(g,{x:0,y:0,kind},1);return r;}
 const p=draw('player'),t=draw('teacher');assert.ok(t.some(r=>r[0]==='#fffdf4'));assert.ok(!t.some(r=>['#c99ba5','#a97889','#efd9c4'].includes(r[0])));assert.notDeepEqual(p.map(r=>r.slice(1)),t.map(r=>r.slice(1)));
});

test('rear grip paints behind the moving body; front and sides stay in front',()=>{
 for(const [facing,order] of [['back',['gear','body']],['front',['body','gear']],['left',['body','gear']],['right',['body','gear']]]){
  const calls=[];drawUmbrellaResident(facing,()=>calls.push('body'),()=>calls.push('gear'));assert.deepEqual(calls,order);
 }
});

test('natural page turn and seated hand reach are visible only while reading; wet and reduced controls',()=>{
 const isBook=c=>c==='fill:#48695a';
 const sample=(paint,p)=>{const out=[];const g=new Proxy({},{
  get:(o,k)=>k in o?o[k]:(...a)=>{if(!['save','restore'].includes(k))out.push([k,...a]);},
  set:(o,k,v)=>{if(k==='fillStyle')out.push(['fill:'+v]);o[k]=v;return true;}
 });paint(g,p);return out;};
 assert.equal(loungePageTurn(4000),0);assert.equal(loungePageTurn(6750),.5);assert.equal(loungePageTurn(7100),0);
 assert.equal(loungePageTurn(6750,true),0);
 for(const side of ['left','right']){
  const page=sample(drawLoungeTable,{readingSide:side,t:4000}),turn=sample(drawLoungeTable,{readingSide:side,t:6750});
  assert.ok(page.some(([c])=>isBook(c)));assert.notDeepEqual(turn,page);
  assert.deepEqual(sample(drawLoungeTable,{readingSide:side,t:6750,reduced:true}),page);
  assert.ok(!sample(drawLoungeTable,{readingSide:side,t:6750,rain:true}).some(([c])=>isBook(c)));
  const who={x:450,y:232,facing:side,kind:'teacher',reading:true};
  const reach=sample(drawSeatedResident,{...who,t:6750});
  assert.ok(reach.some(([k,x,y,w,h])=>k==='fillRect'&&x===18&&y===-22&&w===4&&h===3));
  assert.ok(!sample(drawSeatedResident,{...who,t:6750,reading:false}).some(([k,x,y,w,h])=>k==='fillRect'&&x===18&&y===-22&&w===4&&h===3));
  assert.ok(!sample(drawSeatedResident,{...who,t:6750,holdingUmbrella:true}).some(([k,x,y,w,h])=>k==='fillRect'&&x===18&&y===-22&&w===4&&h===3));
 }
});
