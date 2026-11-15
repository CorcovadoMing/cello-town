import test from 'node:test';import assert from 'node:assert/strict';import {createTownArt,drawBackFence} from '../art-slice.js';
test('leaf highlights vary by placement but repeat identically across builds and draws',()=>{
 const trees=[[45,99,1.5],[115,105,1.3],[325,87,1.4]];
 const build=()=>{const calls=[];const art=createTownArt(()=>{const ops=[];calls.push(ops);const context=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});return{width:0,height:0,getContext:()=>context}},trees);return{calls,art}};
 const a=build(),b=build();assert.deepEqual(a.calls,b.calls);
 const accents=a.calls.slice(1).map(ops=>ops.filter(op=>op[0]==='fillRect'&&['#c0c98b','#b0bd7f','#b7c485','#a5b776'].includes(op[1])));
 assert.equal(new Set(accents.map(JSON.stringify)).size,3);
 const before=JSON.stringify(a.calls);for(let i=0;i<20;i++)a.art.drawTree({drawImage(){}},45,99,1.5,i*100,1);assert.equal(JSON.stringify(a.calls),before);
});
test('old road rectangles and original small marks finish ground cache',()=>{
 const contexts=[];createTownArt(()=>{const ops=[];contexts.push(ops);const c=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});return{width:0,height:0,getContext:()=>c}},[]);
 const ops=contexts[0],road=ops.findIndex(a=>a[0]==='fillRect'&&a[1]==='#d0c298');assert.ok(road>=0);
 assert.deepEqual(ops.slice(road,road+3),[['fillRect','#d0c298',170,298,620,72],['fillRect','#d0c298',428,300,72,260],['fillRect','#d0c298',620,220,75,110]]);
 assert.equal(ops.slice(road).filter(a=>a[0]==='fillRect'&&a[1]==='#beae83').length,27);
 assert.ok(ops.slice(road).every(a=>a[0]==='fillRect'));
});
test('private art caches once and exposes drawing only, with finite bounded surfaces',()=>{let allocations=0;const context=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x));}});const trees=[[325,87,1.4],[139,279,1.2],[585,495,1.3]],before=JSON.stringify(trees);const art=createTownArt(()=>{allocations++;return{width:0,height:0,getContext:()=>context}},trees);assert.equal(allocations,4);assert.ok(art.stats.rgbaBytes<4_000_000);for(let i=0;i<600;i++){art.drawGround(context);art.drawTree(context,325,87,1.4,i,1);art.drawBench(context);art.drawBed(context)}assert.equal(allocations,4);assert.equal(JSON.stringify(trees),before);assert.equal(art.stats.animatedArtLayers,0);assert.deepEqual(Object.keys(art).sort(),['drawBed','drawBench','drawGround','drawTree','stats']);});

test('connected road mouths have continuous soil, with perimeter and texture preserved',()=>{
 const ops=[];const context=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});
 createTownArt(()=>({width:0,height:0,getContext:()=>context}),[]);
 const road=ops.findIndex(a=>a[0]==='fillRect'&&a[1]==='#d0c298');
 const paint=ops.slice(road),pixel=(x,y)=>{let color=null;for(const [kind,c,px,py,w,h]of paint)if(kind==='fillRect'&&x>=px&&x<px+w&&y>=py&&y<py+h)color=c;return color;};
 // Both former three-pixel end caps disappear at each mouth, not at grass edges.
 for(const [x,y,w]of [[428,367,72],[620,295,75]])for(let dy=0;dy<6;dy++)for(let dx=0;dx<w;dx++)assert.equal(pixel(x+dx,y+dy),'#d0c298');
 // Core width agrees with playable soil; irregular margins blend outside it.
 for(const [x,y] of [[170,298],[619,300],[695,298],[789,300],[427,369],[500,367],[428,557],[620,220]])assert.equal(pixel(x,y),'#d0c298');
 const rim=new Set(['#cbbe93','#cec095','#b6b58a','#bdba8e']);
 const depth=new Set();
 for(let x=171;x<615;x++){let d=0;while(d<14&&rim.has(pixel(x,297-d)))d++;depth.add(d);}
 assert.ok(depth.size>=5,'meadow fade visibly varies along the road');
 assert.equal(pixel(310,283),null);
 assert.equal(paint.filter(a=>a[1]==='#beae83').length,27);
 const specks=paint.filter(a=>['#e3d5ae','#b4a57c'].includes(a[1]));
 const expected=[];for(const [px,py,pw,ph]of [[170,298,620,72],[428,370,72,190],[620,220,75,78]])for(let i=0;i<Math.floor(pw*ph/750);i++)expected.push(['fillRect',i%2?'#e3d5ae':'#b4a57c',px+8+(i*47)%(pw-16),py+8+(i*31)%(ph-16),2+i%2,1]);
 assert.deepEqual(specks,expected);
});


test('rear fence refinement is deterministic within its original posts and rail footprint',()=>{
 const capture=()=>{const ops=[];drawBackFence({fillStyle:'',fillRect(x,y,w,h){ops.push([this.fillStyle,x,y,w,h]);}});return ops;};
 const ops=capture();assert.deepEqual(ops,capture());
 const oldFootprint=(x,y)=>{for(let post=20;post<960;post+=28)if((x>=post&&x<post+6&&y>=32&&y<61)||(x>=post-2&&x<post+27&&y>=38&&y<43))return true;return false;};
 const painted=new Set();for(const [color,x,y,w,h]of ops){assert.match(color,/^#[0-9a-f]{6}$/);for(const n of [x,y,w,h])assert.ok(Number.isInteger(n));assert.ok(w>0&&h>0);for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){assert.ok(oldFootprint(x+dx,y+dy),`new fence outside old footprint at ${x+dx},${y+dy}`);painted.add(`${x+dx},${y+dy}`);}}
 for(let y=32;y<61;y++)for(let x=18;x<980;x++)if(oldFootprint(x,y))assert.ok(painted.has(`${x},${y}`),`old fence pixel lost at ${x},${y}`);
 const lastRail=ops.findLastIndex(op=>op[2]===40);assert.ok(lastRail>=0);assert.equal(ops[lastRail+1][2],32,'posts should be painted after the continuous rail');
});
