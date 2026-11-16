import {MUSIC_ROOM_APPROACH} from '../music-room-art.js';
import test from 'node:test';import assert from 'node:assert/strict';import {createTownArt,drawBackFence,BACK_FENCE_LAYOUT} from '../art-slice.js';
test('whole foliage palettes and clustered layers vary by tree but bake deterministically',()=>{
 const trees=[[45,99,1.5],[115,105,1.3],[325,87,1.4]];
 const build=()=>{const calls=[];const art=createTownArt(()=>{const ops=[];calls.push(ops);const context=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});return{width:0,height:0,getContext:()=>context}},trees);return{calls,art}};
 const a=build(),b=build();assert.deepEqual(a.calls,b.calls);
 const accents=a.calls.slice(1).map(ops=>ops.filter(op=>op[0]==='fillRect'||op[0]==='fill'));
 assert.equal(new Set(accents.map(JSON.stringify)).size,3);
 for(const ops of a.calls.slice(1))assert.equal(ops.filter(op=>op[0]==='clip').length,1,'internal foliage clips to existing crown outline');
 const before=JSON.stringify(a.calls);for(let i=0;i<20;i++)a.art.drawTree({drawImage(){}},45,99,1.5,i*100,1);assert.equal(JSON.stringify(a.calls),before);
});
test('main road rectangles and original small marks remain while the branch follows the door',()=>{
 const contexts=[];createTownArt(()=>{const ops=[];contexts.push(ops);const c=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});return{width:0,height:0,getContext:()=>c}},[]);
 const ops=contexts[0],road=ops.findIndex(a=>a[0]==='fillRect'&&a[1]==='#d0c298');assert.ok(road>=0);
 assert.deepEqual(ops.slice(road,road+3),[['fillRect','#d0c298',170,298,620,72],['fillRect','#d0c298',428,300,72,260],['fillRect','#d0c298',MUSIC_ROOM_APPROACH.soil.x,MUSIC_ROOM_APPROACH.soil.y,MUSIC_ROOM_APPROACH.soil.w,MUSIC_ROOM_APPROACH.soil.h]]);
 assert.equal(ops.slice(road).filter(a=>a[0]==='fillRect'&&a[1]==='#beae83').length,27);
 const {centerX,landing}=MUSIC_ROOM_APPROACH;
 const wood=ops.filter(a=>['#b88958','#bc9060'].includes(a[1]));
 assert.deepEqual(wood.map(([, ,x,y,w,h])=>[x+w/2,y-landing.y,w,h]),[[centerX,0,48,4],[centerX,7,42,4],[centerX,15,38,4]]);
 assert.ok(!ops.some(a=>a[1]==='#bfbaaa'),'no old slate');
});
test('private art caches once and exposes drawing only, with finite bounded surfaces',()=>{let allocations=0;const context=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x));}});const trees=[[325,87,1.4],[139,279,1.2],[585,495,1.3]],before=JSON.stringify(trees);const art=createTownArt(()=>{allocations++;return{width:0,height:0,getContext:()=>context}},trees);assert.equal(allocations,4);assert.ok(art.stats.rgbaBytes<4_000_000);for(let i=0;i<600;i++){art.drawGround(context);art.drawTree(context,325,87,1.4,i,1);art.drawBench(context);art.drawBed(context)}assert.equal(allocations,4);assert.equal(JSON.stringify(trees),before);assert.equal(art.stats.animatedArtLayers,0);assert.deepEqual(Object.keys(art).sort(),['drawBed','drawBench','drawGround','drawTree','stats']);});

test('connected road mouths have continuous soil, with perimeter and texture preserved',()=>{
 const ops=[];const context=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});
 createTownArt(()=>({width:0,height:0,getContext:()=>context}),[]);
 const road=ops.findIndex(a=>a[0]==='fillRect'&&a[1]==='#d0c298');
 const paint=ops.slice(road),pixel=(x,y)=>{let color=null;for(const [kind,c,px,py,w,h]of paint)if(kind==='fillRect'&&x>=px&&x<px+w&&y>=py&&y<py+h)color=c;return color;};
 // Both former three-pixel end caps disappear at each mouth, not at grass edges.
 for(const [x,y,w]of [[428,367,72],[638,295,76]])for(let dy=0;dy<6;dy++)for(let dx=0;dx<w;dx++)assert.equal(pixel(x+dx,y+dy),'#d0c298');
 // Core width agrees with playable soil; irregular margins blend outside it.
 for(const [x,y] of [[170,298],[619,300],[695,298],[789,300],[427,369],[500,367],[428,557],[638,263],[638,238]])assert.equal(pixel(x,y),'#d0c298');
 const rim=new Set(['#cbbe93','#cec095','#b6b58a','#bdba8e']);
 const depth=new Set();
 for(let x=171;x<615;x++){let d=0;while(d<14&&rim.has(pixel(x,297-d)))d++;depth.add(d);}
 assert.ok(depth.size>=5,'meadow fade visibly varies along the road');
 assert.equal(pixel(310,283),null);
 assert.equal(paint.filter(a=>a[1]==='#beae83').length,27);
 const specks=paint.filter(a=>['#e3d5ae','#b4a57c'].includes(a[1]));
 const {x,y,w,h}=MUSIC_ROOM_APPROACH.soil;
 const expected=[];for(const [px,py,pw,ph]of [[170,298,620,72],[428,370,72,190],[x,y,w,h]])for(let i=0;i<Math.floor(pw*ph/750);i++)expected.push(['fillRect',i%2?'#e3d5ae':'#b4a57c',px+8+(i*47)%(pw-16),py+8+(i*31)%(ph-16),2+i%2,1]);
 assert.deepEqual(specks,expected);
});


test('rear fence has symmetric terminated ends and fixed post spacing',()=>{
 const capture=()=>{const ops=[];drawBackFence({fillStyle:'',fillRect(x,y,w,h){ops.push([this.fillStyle,x,y,w,h]);}});return ops;};
 const ops=capture();assert.deepEqual(ops,capture());const f=BACK_FENCE_LAYOUT;assert.equal(f.startX,960-(f.startX+(f.postCount-1)*f.spacing+f.postWidth));assert.equal(f.postCount,34);assert.equal(f.spacing,28);
 const painted=new Set();for(const [color,x,y,w,h]of ops){assert.match(color,/^#[0-9a-f]{6}$/);for(const n of[x,y,w,h])assert.ok(Number.isInteger(n));assert.ok(w>0&&h>0);assert.ok(x>=15&&x+w<=945);for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)painted.add(`${x+dx},${y+dy}`);}
 for(const id of painted){const[x,y]=id.split(',').map(Number);assert.ok(painted.has(`${959-x},${y}`),'fence silhouette mirrors around map center');}
 for(const x of[15,939])for(let y=32;y<61;y++)for(let dx=0;dx<6;dx++)assert.ok(painted.has(`${x+dx},${y}`));
});
