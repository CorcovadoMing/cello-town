import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{FLOWERS}from'../model.js';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('town specimen drawings keep six distinct finite pixel silhouettes without mutating flower data',()=>{
 const source=app.slice(app.indexOf('function gardenBloom('),app.indexOf('const reducedMotion'));
 const snapshots=FLOWERS.map((f,species)=>{const out=[],flower={...f,species};const before=JSON.stringify(flower);const draw=new Function('rect',source+';return gardenBloom;')((...v)=>{assert.ok(v.slice(0,4).every(Number.isFinite));assert.ok(v[2]>0&&v[3]>0);out.push(v);});draw(0,0,flower);assert.equal(JSON.stringify(flower),before);return JSON.stringify(out.map(v=>v.slice(0,4)));});
 assert.equal(new Set(snapshots).size,6);
});
test('detailed practice stand remains inside the existing pointer target',()=>{
 const a=app.indexOf('function drawPracticeStand(){'),b=app.indexOf('\n}',a)+2,out=[];
 new Function('rect','stand',app.slice(a,b)+';drawPracticeStand();')((x,y,w,h,c)=>out.push([x,y,w,h,c]),{x:0,y:0});
 assert.ok(out.length>35);for(const[x,y,w,h]of out){assert.ok(x>=-28&&x+w<=28);assert.ok(y>=-48&&y+h<=8);}
});
