import test from 'node:test';import assert from 'node:assert/strict';import{createQuietChat,drawQuietChat}from'../quiet-chat.js';import{createTeacher}from'../teacher.js';import{readFileSync}from'node:fs';
const player=()=>({x:430,y:334,facing:'front',walking:false});
test('real teacher patrol arrival turns idle player once and exchanges three finite bubbles',()=>{
 const t=createTeacher(),c=createQuietChat(),p=player();let turns=0,seen=new Set(),result;
 for(let n=0;n<1500;n++){const teacher=t.update(.04,{player:p});result=c.update(.04,{teacher,player:p});if(result.facing){turns++;assert.equal(result.facing,'left');p.facing=result.facing;}for(const b of result.bubbles)seen.add(b.speaker+':'+b.symbol);}
 assert.equal(turns,1);assert.equal(seen.size,3);assert.deepEqual(result.bubbles,[]);
});
test('a nearby static teacher is not an arrival or a heartbeat trigger',()=>{
 const c=createQuietChat();for(let i=0;i<2000;i++)assert.deepEqual(c.update(.05,{teacher:{x:380,y:334,walking:false},player:player()}),{facing:null,bubbles:[]});
});
test('input, navigation, practice and modal own attention and cancel even an active exchange',()=>{
 for(const flag of['input','navigating','practice','modal']){const c=createQuietChat(),p=player(),teacher={x:380,y:334,walking:false};c.update(.04,{teacher,player:p,seatedChat:true});let result;for(let n=0;n<10;n++)result=c.update(.04,{teacher,player:p});assert.ok(result.bubbles.length);assert.deepEqual(c.update(.04,{teacher,player:p,[flag]:true}),{facing:null,bubbles:[]});}
});
test('opposite-chair signal gives one quiet exchange and reduced mode uses static glyphs',()=>{
 const c=createQuietChat(),p={x:440,y:232,facing:'right',walking:false},teacher={x:540,y:232,walking:false};
 assert.equal(c.update(.04,{teacher,player:p,seated:true,seatedChat:true,reduced:true}).facing,'right');
 let result;for(let n=0;n<12;n++)result=c.update(.04,{teacher,player:p,seated:true,reduced:true});assert.ok(result.bubbles.length);assert.equal(result.bubbles[0].alpha,1);
 assert.equal(c.update(.04,{teacher,player:p,seated:true,seatedChat:true}).facing,null);
});
test('pictograms are finite balanced original pixel drawings with no text or hit targets',()=>{
 let depth=0,rects=0;const g={save(){depth++;},restore(){depth--;},translate(...v){assert.ok(v.every(Number.isFinite));},fillRect(...v){rects++;assert.ok(v.every(Number.isFinite));}};
 drawQuietChat(g,['note','curious','smile','spark'].map(symbol=>({speaker:'teacher',alpha:1,symbol})),{teacher:{x:300,y:300},player:player()});assert.equal(depth,0);assert.ok(rects>40);
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');assert.match(app,/if\(!dlg.open\)drawQuietChat/);assert.doesNotMatch(app,/loungePose.chat\)toast/);
});
