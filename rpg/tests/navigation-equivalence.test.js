import test from'node:test';import assert from'node:assert/strict';
import{createNavigation as old,treeBlockedTiles as oldTiles}from'./fixtures/navigation-v24-reference.js';
import{createNavigation as fast,treeBlockedTiles}from'../navigation.js';
import{petTrunkBlocked as oldTrunk}from'./fixtures/pet-trunk-reference.js';
import{createPetTrunkBlocker,petTrunkBlocked}from'../ambience.js';
import{configs,TREE_LAYOUT,blocked}from'./fixtures/navigation-town-config.js';
let seed=714029;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const point=(w=960,h=560)=>({x:random()*w,y:random()*h});
test('static trunk index exactly matches all inclusive edges, subpixel neighbors and random coordinates',()=>{
 const check=createPetTrunkBlocker(TREE_LAYOUT);let n=0;
 for(const[tx,ty,s]of TREE_LAYOUT){const l=tx-9*s-14,r=tx+10*s+14,t=ty+34*s-7,b=ty+46*s+7;for(const x of[l,r,(l+r)/2])for(const y of[t,b,(t+b)/2])for(const ex of[-1e-9,0,1e-9])for(const ey of[-1e-9,0,1e-9]){assert.equal(check(x+ex,y+ey),oldTrunk(TREE_LAYOUT,x+ex,y+ey));n++;}}
 for(let i=0;i<100000;i++){const{x,y}=point(1200,700);assert.equal(check(x-120,y-70),oldTrunk(TREE_LAYOUT,x-120,y-70));n++;}
 for(const x of[NaN,Infinity,-Infinity])assert.equal(check(x,200),oldTrunk(TREE_LAYOUT,x,200));
 assert.equal(petTrunkBlocked.toString(),oldTrunk.toString());console.log('trunk predicate equality samples',n);
});
test('no-tree sample times and sparse hazards are unchanged, including explicit grid-boundary probes',()=>{
 const config={width:100,height:80,tileSize:15},aLog=[],bLog=[];
 const hazard=(x,y)=>(Math.abs(x-45)<1e-10&&y>19.999&&y<20.001)||(x>=51.125&&x<=51.126&&y>=31&&y<=31.001);
 const a=old({...config,blocked:(x,y)=>{aLog.push([x,y]);return hazard(x,y)}}),b=fast({...config,blocked:(x,y)=>{bLog.push([x,y]);return hazard(x,y)}});
 assert.deepEqual(bLog,aLog,'graph construction calls every identical hazard sample in identical order');
 for(const[from,to]of[[{x:1,y:20},{x:91,y:20}],[{x:20.125,y:31},{x:80.125,y:31}],[{x:0,y:0},{x:99.99,y:79.99}],...Array.from({length:300},()=>[point(100,80),point(100,80)])]){aLog.length=bLog.length=0;assert.equal(b.lineClear(from,to),a.lineClear(from,to));assert.deepEqual(bLog,aLog);}
});
test('tree cells and conservative epsilon corners are identical at exact/near boundaries including off-grid trees',()=>{
 for(const config of[{width:120,height:95,tileSize:30,trees:[{x:60,y:60},{x:-30,y:0}]},{width:120,height:95,tileSize:15,trees:[{x:30,y:30},{x:135,y:30}]},{width:.00004,height:.00004,tileSize:.00001,trees:[{x:.00003,y:.00003}]}]){
 assert.deepEqual(treeBlockedTiles(config.trees,config.tileSize),oldTiles(config.trees,config.tileSize));const a=old(config),b=fast(config),eps=config.tileSize<1?.00000000001:.00001;
 const coords=[];for(let x=0;x<=config.width;x+=config.tileSize)for(let y=0;y<=config.height;y+=config.tileSize)for(const e of[-eps*1.001,-eps,-eps*.999,0,eps*.999,eps,eps*1.001])coords.push({x:x+e,y:y+e});
 for(const p of coords){assert.equal(b.isWalkable(p.x,p.y),a.isWalkable(p.x,p.y));for(const q of[{x:config.width*.13,y:config.height*.71},{x:config.width*.91,y:config.height*.23},p])assert.equal(b.lineClear(p,q),a.lineClear(p,q));}
 }
});
test('actual player, pet and rain graphs retain exact collision answers and deterministic routes',()=>{
 for(const[k,c]of Object.entries(configs)){const trunk=createPetTrunkBlocker(TREE_LAYOUT),a=old(c),b=fast(k==='rain'?{...c,blocked:(x,y)=>blocked(x,y,true)||trunk(x,y)}:c);
 for(let i=0;i<2500;i++){const p=point();assert.equal(b.isWalkable(p.x,p.y),a.isWalkable(p.x,p.y));const q=point();assert.equal(b.lineClear(p,q),a.lineClear(p,q));}
 const ends=[{x:460,y:425},{x:303,y:325},{x:615,y:432},{x:710,y:460},{x:676,y:270},{x:423,y:250},{x:557,y:250},{x:820,y:535},{x:240,y:245},{x:238,y:247}];let paths=0;
 for(const from of ends)for(const to of ends){assert.deepEqual(b.findPath(from,to),a.findPath(from,to),`${k}: ${JSON.stringify([from,to])}`);paths++;}
 for(let i=0;i<100;i++){const from=point(),to=point();assert.deepEqual(b.findPath(from,to),a.findPath(from,to),k);paths++;}
 console.log(k,'2500 walkability/line pairs and',paths,'exact routes equal');
 }
});
