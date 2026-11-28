import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groundContactSeeds} from '../town-shore.js';
test('pondside contact shades stay anchored under objects and preserve a translucent feather',()=>{
 const seeds=groundContactSeeds([[65,250,1.8],[340,476,1.2]],{x:580,depth:239});
 assert.ok(seeds.some(([x,z,...rest])=>x===65&&z===250+46*1.8&&rest[2]>.3));
 const house=seeds.filter(([x])=>x>580);
 assert.deepEqual(house,[[676,240,61,3.5,.19]]);
 assert.ok(seeds.some(([x,z])=>x===250&&z===462)); // partly over submerged bank supports
 assert.ok(seeds.every(([x,z,rx,rz,a])=>x>0&&x<960&&z>0&&z<560&&rx>0&&rz>0&&a>=.15&&a<.5));
 const s=readFileSync(new URL('../town-shore.js',import.meta.url),'utf8');
 assert.match(s,/\[2\.4,1\.72,alpha\*\.42\].*\[0,\.78,alpha\]/);
 assert.match(s,/hills\.visible=close;contact\.material\.opacity=weather==='sun'/);
 assert.match(s,/depthWrite:false/);
});

test('continuous south pond mouth crosses the canvas edge without entering walkable terrain',async()=>{
 const {OPEN_POND_BANK}=await import('../town-shore.js');
 const inside=(x,z)=>{
  let hit=false;
  for(let i=0,j=OPEN_POND_BANK.length-1;i<OPEN_POND_BANK.length;j=i++){
   const [a,b]=OPEN_POND_BANK[i],[u,v]=OPEN_POND_BANK[j];
   if((b>z)!==(v>z)&&x<(u-a)*(z-b)/(v-b)+a)hit=!hit;
  }
  return hit;
 };
 assert.ok(OPEN_POND_BANK.every(([x,z])=>x<275&&z>380));
 for(let z=405;z<=566;z+=1)assert.ok(inside(140,z),'center stays connected at '+z);
 assert.ok(inside(445,534)===false);
 const edge=[];
 for(let x=0;x<275;x++)if(inside(x,560))edge.push(x);
 assert.ok(edge[0]===0&&edge.length>=188 && edge.every((n,i)=>n===edge[0]+i));
 const source=readFileSync(new URL('../town-shore.js',import.meta.url),'utf8');
 assert.ok(inside(0,500));
 assert.match(source,/OPEN_POND_BANK\.slice\(1,-1\)/);
 const renderer=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.match(renderer,/OPEN_POND_BANK\.entries\(\)/);
});
