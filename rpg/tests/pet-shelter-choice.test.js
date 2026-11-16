import test from'node:test';import assert from'node:assert/strict';import{createRainPets}from'../ambience.js';import{treeRainCanopies,canopyCoversGround}from'../rain-geometry.js';
const trees=[[240,190,1.5],[360,210,1.5],[470,210,1.5],[740,450,1.5],[850,450,1.5]],canopies=treeRainCanopies(trees);
function run(value){let calls=0,rolls=0;const nav={isWalkable:(x,y)=>!(x>450&&x<455),lineClear:()=>true,findPath:(a,b)=>{calls++;return [{...b}]}};const model=createRainPets({navigation:nav,trees,canopies,random:()=>{rolls++;return value}});let f,at30;for(let t=0;t<=50000;t+=40){f=model.update(t,{weather:'rain'});if(t===30000)at30=JSON.stringify(model.positions);}return {f,calls,rolls,positions:model.positions,at30};}
test('controlled rain choices vary across nearby trees, stay covered/separate and do not re-roll every frame',()=>{
 const a=run(0),b=run(.99);assert.notDeepEqual(a.positions,b.positions);
 for(const r of[a,b]){assert.equal(JSON.stringify(r.positions),r.at30);assert.ok(r.rolls<=3);assert.ok(r.calls<=24);
  const ps=[r.positions.dog,r.positions.cat,r.positions.benchCat];for(const p of ps)assert.ok(canopies.some(c=>canopyCoversGround(c,p.y)&&Number.isFinite(c.columns[Math.floor(p.x-c.left)])));for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)assert.ok(Math.hypot(ps[i].x-ps[j].x,ps[i].y-ps[j].y)>=46);
 }
});
