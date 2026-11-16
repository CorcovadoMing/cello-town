import {umbrellaTop,umbrellaCoversGround,canopyCoversGround} from './rain-geometry.js?v=35';
// Pure bounded animation state; seed supplied once by app, no saved-state changes.
export function fishVariants(seed=1){let n=seed>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const colors=['#ed923d','#f5dd91','#535a78','#d66f62','#757449'];for(let k=0;k<5;k++)rand();for(let i=colors.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]];}return Array.from({length:3},(_,i)=>({color:colors[i],size:.8+rand()*.35,length:.78+rand()*.5,girth:.72+rand()*.65,fin:['round','fork','none'][Math.floor(rand()*3)]}));}
const defaultFish=fishVariants(1);
export function pondLife(time,reduced=false){const t=reduced?0:Math.max(0,time);return [0,1,2].map(i=>{const a=t/6400+i*2.1,cycle=(t+i*5700)%19000;return {x:140+Math.sin(a)*64,y:452+Math.cos(a*.83+i)*39,dir:Math.cos(a)>=0?1:-1,tail:reduced?0:Math.sin(t/150+i)*2,surface:!reduced&&cycle>16600?(cycle-16600)/2400:null};});}
// Analytic hysteresis: retain the incoming heading within a small turning zone.
export function flightDirection(phase){const speed=Math.cos(phase);return Math.abs(speed)<.1?(Math.sin(phase)>=0?1:-1):speed>=0?1:-1;}
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function reactVisitor(visitor,cat,attention=1){if(!visitor)return null;const distance=Math.hypot(visitor.x-cat.x,visitor.y-(cat.y-20));const notice=ease((110-distance)/55)*attention;return {...visitor,x:visitor.x+Math.tanh((visitor.x-cat.x)/22)*28*notice,y:visitor.y-(20+cat.paw*1.6+(cat.burst||0)*18)*notice,alert:notice};}
function gardenCore(time,reduced=false){
 const t=reduced?0:Math.max(0,time),cycle=t%30000,phase=t/2300,idleClock=Math.floor(t/30000)*23000+Math.min(cycle,20000)+Math.max(0,cycle-27000);
 const visitor=cycle<22000?{kind:['butterfly','bird','bee'][Math.floor(t/30000)%3],x:819+Math.sin(phase)*47,y:417+Math.cos(t/1900)*11,dir:flightDirection(phase),wing:reduced?0:Math.sin(t/90)}:null;
 const approach=ease((cycle-4000)/4000),retreat=ease((cycle-17000)/2500),engaged=approach*(1-retreat),track=819+Math.sin((t-600-Math.max(0,Math.min(1500,cycle-15500)))/2300)*40,idleX=820+Math.sin(idleClock/3000)*16;
 const aim=!reduced&&cycle>=13000&&cycle<14500?Math.sin((cycle-13000)/1500*Math.PI):0;
 const wiggle=aim*Math.sin((cycle-13000)/1500*Math.PI*4)*4;
 const pounce=!reduced&&cycle>=14500&&cycle<15500,burst=pounce?Math.sin((cycle-14500)/1000*Math.PI):0,jump=burst*18;
 const running=!reduced&&cycle>=4000&&cycle<19500;
 const sit=reduced?0:Math.max(ease((cycle-20000)/700)*(1-ease((cycle-23200)/700)),cycle>=14000&&cycle<15500?Math.sin((cycle-14000)/1500*Math.PI):0),lie=reduced?0:ease((cycle-23200)/700)*(1-ease((cycle-27000)/700));
 const rest=sit+lie;
 const restStroll=reduced?0:-8*ease((cycle-27200)/650)*(1-ease((cycle-28800)/650)),groundY=535-43*engaged+restStroll;
 const cat={groundY,x:idleX+(track-idleX)*engaged+burst*10*flightDirection((t-600)/2300),y:groundY-jump,dir:engaged>.5?flightDirection((t-600)/2300):flightDirection(idleClock/3000),tail:reduced?0:Math.sin(t/550)*3,pounce,running,sit,lie,aim,wiggle,burst,paw:pounce?Math.sin((cycle-14000)/1500*Math.PI)*10:0,stride:reduced?0:Math.sin(t/(running?90:180))*(running?3:1.5)*(1-rest),phase:cycle<4000?'idle':cycle<8000?'approach':cycle<14000?'chase':cycle<15500?'pounce':cycle<19500?'retreat':'idle'};
 const attention=reduced?0:ease((cycle-6000)/1500)*(1-ease((cycle-16000)/2500));
 const reacted=reactVisitor(visitor,cat,attention);
 if(reacted&&attention>.1){const dx=reacted.x-cat.x;if(Math.abs(dx)>4)cat.dir=dx>0?1:-1;}
 cat.searching=!reduced&&cycle>=15500&&cycle<18500;
 if(cat.searching){cat.stride*=cycle<17000?0:.25;cat.tail*=.5;}
 return {visitor:reacted,cat};
}
// Use ground travel, never the vertical pounce arc, to choose a readable body direction.
export function catFacing(vx,vy,fallback='right'){if(Math.hypot(vx,vy)<.008)return fallback;if(Math.abs(vy)>Math.abs(vx)*1.05)return vy<0?'up':'down';return vx<0?'left':'right';}
export function gardenLife(time,reduced=false){const result=gardenCore(time,reduced);const before=gardenCore(Math.max(0,time-16),reduced),after=gardenCore(time+16,reduced);let vx=after.cat.x-before.cat.x,vy=after.cat.groundY-before.cat.groundY;let fallback=result.cat.dir>0?'right':'left';if(!reduced&&Math.hypot(vx,vy)<.008){const earlier=gardenCore(Math.max(0,time-240));fallback=catFacing(result.cat.x-earlier.cat.x,result.cat.groundY-earlier.cat.groundY,fallback);}result.cat.facing=reduced?'right':catFacing(vx,vy,fallback);result.cat.groundVX=vx;result.cat.groundVY=vy;if(result.visitor&&!reduced){const bv=gardenCore(Math.max(0,time-8)).visitor,av=gardenCore(time+8).visitor;if(bv&&av){const speed=av.x-bv.x;if(Math.abs(speed)>.012)result.visitor.dir=speed>0?1:-1;}}return result;}
// Original integer-grid sprites: O fur, L cheek/paws, S tabby, E eye, N nose.
const CAT_SIDE_WALK=[
'....................O....O..',
'....................OO..OO..',
'....................OOOOOO..',
'....................OSOOO...',
'....................OOOEOO..',
'.....................OLLLON.',
'..O.....OOOOOOOOOOOOOOLLLL..',
'.OO...OOOSOOOSOOOSOOOOOO....',
'.O...OOOOOSOOOSOOOSOOOOO....',
'.OO.OOOOOOOOOOOOOOOOOOOO....',
'..OOOOOOOOOOOOOOOOOOOOOO....',
'.....OOOOOOOOOOOOOOOOOO.....',
'......OOOOOOOOOOOOOOOO......',
'......OOO..........OOO......',
'......OO...........OO.......',
'......OO...........OO.......',
'......OO...........OO.......',
'......OO...........OO.......',
'......LLL..........LLL......'];
const CAT_SIDE_REST=[
'....................O....O..',
'....................OO..OO..',
'....................OOOOOO..',
'.......OOOOOOOOOOOOOOSOOO...',
'.....OOOOSOOOSOOOSOOOOEEOO..',
'....OOOOOOSOOOSOOOSOOOLLLON.',
'...OOOOOOOOOOOOOOOOOOOLLLL..',
'...OOOOOOOOOOOOOOOOOOOOO....',
'....OOOOOOOOOOOOOOOOOO......',
'..OOOOOOLLL......LLLLLL.....'];
const CAT_FRONT_WALK=[
'...O......O...',
'...OO....OO...',
'...OOOOOOOO...',
'...OSOSOSOO...',
'...OOEOOEOO...',
'...OLLLLLLO...',
'....LLNLLL....',
'....OLLLLO....',
'.....OOOO.....',
'....OOOOOO....',
'....SOOOOS....',
'....OOOOOO....',
'....SOOOOS....',
'....OOOOOO....',
'....OO..OO....',
'....OO..OO....',
'....OO..OO....',
'....OO..OO....',
'....OO..OO....',
'....LL..LL....'];
const CAT_FRONT_REST=[
'...O......O...',
'...OO....OO...',
'...OOOOOOOO...',
'...OSOSOSOO...',
'...OEEOOEEO...',
'...OLLLLLLO...',
'....LLNLLL....',
'...OOLLLLOO...',
'..OSOOOOOOSO..',
'..OOOOOOOOOO..',
'...LLL..LLL...'];
const CAT_BACK_WALK=[
'...O......O...', '...OOOOOOOO...', '...OOOOOOOO...', '...OOSSSSOO...',
'...OOOOOOOO...', '....OSSSSO....', '....OOOOOO....', '.....OOOO.....',
'....OSSSSO....', '...OOOOOOOO...', '...OSSSSSSO...', '...OOOOOOOO...',
'...OOOSSOOO...', '....OOSSOO....', '....OOSSOO....', '....OO..OO....',
'....OO..OO....', '....OO..OO....', '....OO..OO....', '....LL..LL....'];
const CAT_BACK_REST=[
'...O......O...', '...OOOOOOOO...', '...OOOOOOOO...', '...OOSSSSOO...',
'....OOOOOO....', '...OOSSSSOO...', '..OOOOOOOOOO..', '..OSSSSSSSSO..',
'..OOOOOOOOOO..', '...OOOSSOOO...', '....OOSSOO....'];
// Advance gait by actual ground distance: fast umbrella following cannot skate
// through the same tiny time-based foot wiggle used for a leisurely stroll.
export function petGaitCycle(speed=58){const u=Math.max(0,Math.min(1,(speed-37)/21));return 12+12*u*u*(3-2*u);}
export function advancePetGait(p,distance,speed=58){p.gaitPhase=((p.gaitPhase||0)+distance/petGaitCycle(speed)*Math.PI*2)%(Math.PI*2);return p.gaitPhase;}
export function articulatePaws(pixels,{h,vertical,phase,fur='O',shade='S',anchors=[6,9,19,22]}){
 const top=h-5;
 for(const id of [...pixels.keys()])if(Number(id.split(',')[1])>=top)pixels.delete(id);
 // Diagonal pairs: rear-near + front-far, then rear-far + front-near.
 const legs=vertical?[{x:5,far:true,p:0},{x:8,far:true,p:Math.PI},{x:4,far:false,p:Math.PI},{x:9,far:false,p:0}]:anchors.map((x,i)=>({x,far:i%2===1,p:[0,Math.PI,Math.PI,0][i]}));
 for(const leg of legs.sort((a,b)=>Number(b.far)-Number(a.far))){
  const t=((phase+leg.p)/(Math.PI*2)%1+1)%1;
  // Paw is planted for half a cycle, travels backward relative to the body,
  // then lifts and swings forward. Hip stays attached to the same silhouette.
  const swing=t<.5?1-4*t:-1+4*(t-.5),lift=t<.5?0:Math.sin((t-.5)*Math.PI*2)*2;
  const dx=vertical?0:Math.round(swing*2),end=h-1-(leg.far?1:0)-Math.round(lift)+(vertical?Math.round(swing):0);
  for(let y=top;y<=end;y++){const x=leg.x+Math.round(dx*(y-top)/Math.max(1,end-top));for(let k=0;k<2;k++)pixels.set((x+k)+','+y,y===end?'L':leg.far?shade:fur);}
 }
}
export function drawGardenCat(g,c){
 const facing=c.facing||(c.dir<0?'left':'right'),vertical=facing==='up'||facing==='down',back=facing==='up',rest=Math.max(c.lie||0,c.sit||0),playing=!!c.pounce||(c.paw||0)>.1,tucked=!playing&&rest>.6;
 const rows=vertical?(back?(tucked?CAT_BACK_REST:CAT_BACK_WALK):(tucked?CAT_FRONT_REST:CAT_FRONT_WALK)):(tucked?CAT_SIDE_REST:CAT_SIDE_WALK),pixels=new Map(),w=rows[0].length,h=rows.length,put=(x,y,k)=>pixels.set(x+','+y,k);
 rows.forEach((row,y)=>[...row].forEach((k,x)=>{if(k!=='.'){if(back&&y<8)k=k==='E'||k==='L'||k==='N'?'O':k;put(x,y,k)}}));
 if(back){for(const[x,y]of[[7,h-7],[7,h-6],[8,h-5],[9,h-4],[10,h-3],[11,h-3],[12,h-4],[12,h-5]]){put(x,y,'S');put(x,y+1,'O');}}
 if(c.calico){for(let y=Math.floor(h*.45);y<Math.floor(h*.7);y++)for(let x=Math.floor(w*.48);x<Math.floor(w*.68);x++)if(pixels.get(x+','+y)==='O')put(x,y,'H');}
 if(!vertical&&!tucked){for(const[x,y]of[[23,2],[22,3],[23,3],[24,3],[22,4],[23,4],[24,4],[23,5]])put(x,y,'E');put(22,3,'W');put(23,4,'I');}
 // Replace the stationary leg pixels, rather than drawing a tiny extra paw
 // beside them. Resting / reaching / airborne poses retain their own anatomy.
 if(!tucked&&!playing&&((c.moving??c.running)||Math.abs(c.stride||0)>.01))articulatePaws(pixels,{h,vertical,phase:c.gaitPhase??((c.stride||0)>0?1:4)});
 if(!back){const y=vertical?8:(tucked?4:7);for(let x=vertical?5:10;x<(vertical?9:16);x++)if(pixels.get(x+','+y)==='O')put(x,y,'H');}
 if(!tucked&&(c.aim||0)>.05){const amount=c.aim,compressed=new Map();for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number),ny=Math.round(h-1-(h-1-y)*(1-.28*amount));compressed.set((x+(!vertical&&y>8?Math.round((c.wiggle||0)*.25):0))+','+ny,k);}pixels.clear();for(const[id,k]of compressed)pixels.set(id,k);}
 if(playing){
  // Extended forelegs and trailing hocks make a real reach/pounce silhouette;
  // ground shadow and airborne translation still come from the original timeline.
  if(!vertical){for(const id of [...pixels.keys()]){const[x,y]=id.split(',').map(Number);if(x>=19&&y>=h-6)pixels.delete(id);}
   const lift=Math.round(Math.min(3,(c.paw||0)*.25));for(let i=0;i<11;i++){const yy=c.pondPaw?h-5+Math.floor(i*.3):12-Math.floor(i*.3)-lift;put(20+i,yy,'O');put(20+i,yy+1,'L');}put(30,c.pondPaw?h-1:10-lift,'L');
   for(let i=0;i<4;i++){put(6-i,h-5+i,'S');put(5-i,h-5+i,'O');}}
  else{for(const id of [...pixels.keys()]){const[x,y]=id.split(',').map(Number);if((x<=5||x>=8)&&y>=h-6)pixels.delete(id);}
   for(let i=0;i<5;i++){put(3-i,10-i,'O');put(10+i,10-i,'O');}put(-2,5,'L');put(15,5,'L');}
 }

 if(c.rainAlert&&c.groom>.1){put(4,8-Math.round(c.groom*2),'L');put(4,9,'O');}
 const colors=c.palette||{W:'#fff0cb',I:'#b9854a',H:'#e9aa62',O:'#d58b43',L:'#f4d4a0',S:'#a6572f',E:'#353b32',N:'#824b3a'},size=c.palette?1:1.10,scale=1.35*size;
 g.save();g.translate(Math.round(c.x),Math.round(c.groundY??c.y));g.fillStyle='#3f58372a';g.beginPath();g.ellipse(0,4,(vertical?11:20)*size,2.5,0,0,Math.PI*2);g.fill();g.translate(c.shake||0,Math.round(c.y-(c.groundY??c.y)));if(!vertical&&facing==='left')g.scale(-1,1);g.scale(scale,scale);g.translate(-w/2,-h+2);
 // Four-neighbour one-pixel outline gives crisp stepped edges, not antialiased ellipses.
 g.fillStyle='#74533a';for(const id of pixels.keys()){const[x,y]=id.split(',').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!pixels.has((x+dx)+','+(y+dy)))g.fillRect(x+dx,y+dy,1,1);}
 for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number);g.fillStyle=colors[k];g.fillRect(x,y,1,1);}
 if(vertical&&!back&&!tucked){g.fillStyle='#fff0cb';g.fillRect(5,4,1,1);g.fillRect(8,4,1,1);}
 g.restore();if(c.rainAlert&&Math.abs(c.shake||0)>.5)drawPetShake(g,c.x,c.groundY??c.y,c.shake);
}
export function drawPondLife(g,time,reduced,variants=defaultFish){g.save();g.beginPath();g.rect(48,388,187,135);g.clip();for(const [i,f] of pondLife(time,reduced).entries()){const v=variants[i];g.save();g.translate(f.x,f.y);g.scale(f.dir*v.size*v.length,v.size*v.girth);g.fillStyle=v.color;g.globalAlpha=.92;g.beginPath();g.ellipse(0,0,9,4,0,0,Math.PI*2);g.fill();if(v.fin!=='none'){g.beginPath();g.moveTo(-7,0);if(v.fin==='round'){g.quadraticCurveTo(-20,-9+f.tail,-15,f.tail);g.quadraticCurveTo(-20,9+f.tail,-7,0);}else{g.lineTo(-15,-5+f.tail);g.lineTo(-12,f.tail);g.lineTo(-15,5+f.tail);}g.closePath();g.fill();}g.fillStyle='#fff1c0';g.fillRect(0,-2,4,2);g.fillStyle='#567f79';g.fillRect(6,-1,1.5,1.5);g.restore();if(f.surface!==null){g.globalAlpha=(1-f.surface)*.55;g.strokeStyle='#e2f0d9';g.lineWidth=1.2;g.beginPath();g.ellipse(f.x,f.y,5+f.surface*19,2+f.surface*7,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}}g.restore();}
// Authored tiny visitors: species-specific markings ride the existing wingbeat.
// No spawn, trajectory, timing, direction or attention-state changes here.
export function drawGardenVisitor(g,v){
 if(!v)return;g.save();g.translate(v.x,v.y);g.scale(v.dir,1);
 const dot=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
 const oval=(x,y,rx,ry,angle,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();};
 const beat=Math.abs(v.wing);
 if(v.kind==='butterfly'){
  for(const side of[-1,1]){const x=side*4.2,w=2.4+beat*2;
   oval(x,-2,w+1,5.4,side*.28,'#a97550');oval(x,-2,w,4.6,side*.28,'#f3ce83');
   oval(side*3.4,3,w*.83,3.3,-side*.35,'#b58361');oval(side*3.4,2.7,w*.66,2.6,-side*.35,'#eab888');
   oval(side*4.7,-3.2,Math.max(.7,w*.28),1.5,side*.2,'#fff0c3');
   oval(side*4.6,.2,.85,1.1,0,'#a16c55');dot(side>0?6:-7,-5,1,1,'#fff5d7');
  }
  dot(-1,-3,2,8,'#77634b');dot(-1,-4,2,2,'#514e3e');
  dot(-3,-6,1,1,'#77634b');dot(-2,-5,1,2,'#77634b');dot(2,-6,1,1,'#77634b');dot(1,-5,1,2,'#77634b');
 }else if(v.kind==='bee'){
  oval(-3,-4.5,4.2,2+beat*2,-.4,'#c2d7ce');oval(-2,-4.8,3.1,1.2+beat*1.8,-.4,'#f7f4d8');
  oval(1,-4.2,3.3,1.8+beat*1.4,.4,'#dce7d6');
  oval(-1,0,6.3,3.8,0,'#765b3e');oval(-1,-.3,5.7,3.1,0,'#e9b94e');
  dot(-4,-2.5,1.8,5,'#8b653b');dot(0,-3,1.8,6,'#795a38');dot(-3,-2,2,1,'#ffe299');
  oval(5.2,-.7,2.7,2.8,0,'#8b6a44');dot(6,-2,1.3,1.6,'#343d32');dot(6,-2, .6,.6,'#fff7db');
  dot(7,0,1,1,'#e8b986');dot(4,-5,1,2,'#7c6544');dot(-4,3,1,2,'#7c6544');dot(1,3,1,2,'#7c6544');
 }else{
  // A blue garden songbird, with cream cheek and layered flight feathers.
  g.fillStyle='#597b89';g.beginPath();g.moveTo(-6,0);g.lineTo(-12,-3);g.lineTo(-10,3);g.closePath();g.fill();
  oval(0,0,7.6,4.5,0,'#577a8d');oval(1,1.6,5.5,2.5,0,'#d7d7b7');
  oval(-2,-2.8,6.2,1.8+beat*3.5,-.4,'#86a9b9');oval(-3,-3.3,4.3,1+beat*2,-.4,'#b9d0cd');
  dot(-6,-3,2,1,'#e0e4ce');dot(-4,-2,2,1,'#6b90a0');
  oval(5,-2,3.4,3.5,0,'#789bac');oval(6,-.7,1.8,1.5,0,'#f0e5be');
  dot(5.3,-3,1.5,1.5,'#354b49');dot(5.3,-3,.6,.6,'#fff7df');
  g.fillStyle='#cea55f';g.beginPath();g.moveTo(8,-2);g.lineTo(11,-.8);g.lineTo(8,.3);g.closePath();g.fill();
  dot(3,4,2,1,'#a88a58');dot(5,3,2,1,'#a88a58');
 }
 g.restore();
}
export function drawGardenLife(g,time,reduced,context=null){const {visitor:v,cat:c}=context?.life||gardenLife(time,reduced);g.save();drawGardenVisitor(g,v);

drawGardenCat(g,c);g.restore();}

// Uses the owning app's single gameWeather snapshot; never a second schedule.
export function townWeather(time,key,reduced=false){const t=reduced?0:Math.max(0,time);if(key==='rain')return Array.from({length:42},(_,i)=>({x:(i*137+t*.017)%960,y:(i*89+t*.072)%560,length:7+i%4}));if(key==='breeze')return Array.from({length:7},(_,i)=>({x:(i*157+t*.025)%960,y:85+i*64+Math.sin(t/1600+i)*9,length:22+i%3*7}));return [];}
export function drawTownWeather(g,time,key,reduced,excludeRects=[]){
 g.save();g.beginPath();g.rect(0,0,960,560);g.clip();
 if(key==="sun"){
  // Quiet warm corner glow, not conspicuous sparkling crosses.
  const light=g.createRadialGradient(790,75,10,790,75,240);light.addColorStop(0,"#fff6bb25");light.addColorStop(1,"#fff6bb00");g.fillStyle=light;g.fillRect(550,0,410,310);
  g.fillStyle="#f7efc650";for(let i=0;i<4;i++){const x=672+i*48,y=119+i*18+(reduced?0:Math.sin(time/4200+i)*2);g.fillRect(Math.round(x),Math.round(y),i%2?1:2,1);}
 }else if(key==="rain"){
  for(const d of rainLandings(time,reduced,excludeRects)){
   if(d.phase==="fall") {g.strokeStyle="#dce9e0";g.globalAlpha=d.opacity;g.lineWidth=d.width;g.beginPath();g.moveTo(d.x-d.length*.04,d.y-d.length);g.lineTo(d.x,d.y);g.stroke();g.globalAlpha=1;}
   else if(d.phase==="impact"){
    const p=d.progress;g.globalAlpha=(1-p)*.42;
    if(d.surface==="water") {g.save();g.beginPath();g.rect(48,388,187,135);g.clip();g.strokeStyle="#e2efe4";g.lineWidth=1;g.beginPath();g.ellipse(d.landingX,d.landingY,2+p*8,1+p*3,0,0,Math.PI*2);g.stroke();g.restore();}
    else {g.fillStyle="#dce3cc";const spread=1+p*3,lift=Math.sin(p*Math.PI)*3;g.fillRect(Math.round(d.landingX-spread),Math.round(d.landingY-lift),1,1);g.fillRect(Math.round(d.landingX+spread),Math.round(d.landingY-lift),1,1);if(p<.35)g.fillRect(d.landingX,d.landingY,2,1);}
    g.globalAlpha=1;
   }
  }
 }else if(key==="breeze")drawMeadowMist(g,time,reduced);
 g.restore();
}
// Explicit world contacts: water, open ground and exposed bed soil.
// Each impact is the continuation of its own approaching drop, not another RNG.
export function rainLandings(time,reduced=false,excludeRects=[]){
 const points=[[752,420],[804,425],[846,420],[889,422],[754,459],[795,461],[841,460],[891,461],[750,499],[797,496],[846,499],[890,499],[82,424],[126,465],[183,492],[214,414],[398,263],[529,207],[738,267],[574,395],[389,439],[637,415],[690,379],[511,507],[239,345],[366,329],[479,352],[609,340],[705,347],[466,459]];
 const t=reduced?0:Math.max(0,time),impact=420;
 return points.map(([landingX,landingY],id)=>{
  const depth=landingY<300?0:landingY<400?1:2,fall=[800,720,650][depth],cycle=fall+1000;
  const age=(t+id*197)%cycle,surface=landingX>=48&&landingX<=235&&landingY>=388&&landingY<=523?"water":"ground";
  const phase=age<fall?"fall":(!reduced&&age<fall+impact?"impact":"rest");
  const remain=Math.max(0,1-age/fall);
  return {id,cycle,age,depth,fallDuration:fall,opacity:[.42,.52,.62][depth],width:[1,1.2,1.4][depth],length:[8,11,14][depth],landingX,landingY,surface,phase,x:landingX-remain*3,y:landingY-remain*84,progress:Math.max(0,(age-fall)/impact)};
 }).filter(d=>!excludeRects.some(r=>d.landingX>=r.x&&d.landingX<=r.x+r.w&&d.landingY>=r.y&&d.landingY<=r.y+r.h));
}


export function restTailMotion(time,reduced=false){if(reduced)return{cat:0,dog:0};const t=Math.max(0,time),c=t%17800,d=t%23100;const pulse=(v,start,duration,turns,amplitude)=>{if(v<start||v>start+duration)return 0;const u=(v-start)/duration;return Math.sin(u*Math.PI)*Math.sin(u*Math.PI*turns)*amplitude;};return{cat:pulse(c,14500,900,2.5,2.7),dog:pulse(d,17400,1300,4,3.8)};}
export function drawBenchLife(g,time,reduced,context=null){const flick=restTailMotion(time,reduced);const breath=reduced?0:Math.sin(time/1350)*.7;if(!context?.benchCatActive){g.save();
// Original pixel calico: flat torso, chin on outstretched paws, irregular patches.
const loaf=[
'....C....D..............................',
'....CC..DD.........CCCCCC...............',
'....CCCDDD...CCCCCDDCCCCOOOCCC...........',
'....CCCCCCCCCCCCDDDDCCCOOOOCCCC..........',
'...CCCCCCCCCCCCCDDDDCCCOOOOCCCCC.........',
'..CCEECCCCCCCCCCCCCCCCCCCCCCCCCC........',
'.NCCCCLLLCCCCCCCCCCCCCCCCCCCCCCCC........',
'..LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL........',
'...LLLLLLL.................LLLLLL.......'];
const pixels=new Map();loaf.forEach((r,y)=>[...r].forEach((k,x)=>{if(k!=='.')pixels.set(x+','+y,k)}));
// The tail alone occasionally twitches; the head, chin and paws remain planted.
const tip=Math.round(flick.cat*.55);for(const[x,y]of[[32,5],[33,5],[34,6],[35,6],[36,7],[36,8],[36,9],[35,10+tip],[34,10+tip]])pixels.set(x+','+y,'O');
g.translate(195,197);g.scale(1.45,1.45);g.fillStyle='#6d62482a';g.fillRect(2,9,35,2);g.fillStyle='#87725a';for(const id of pixels.keys()){const[x,y]=id.split(',').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!pixels.has((x+dx)+','+(y+dy)))g.fillRect(x+dx,y+dy,1,1);}
const palette={C:'#ead4ae',L:'#f5e2c1',D:'#665b50',O:'#cd955d',E:'#6b5944',N:'#ad7f71'};for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number);g.fillStyle=palette[k];g.fillRect(x,y,1,1);}g.restore();}
if(context?.dogActive)return;
// Original sleepy dog pixel sprite; the dark ear overlaps the head, never floats.
g.save();g.translate(213,224);g.scale(1.5,1.5);
const dog=[
'................CCCCCCCC.............',
'..............CCCCCCCCCCCC...........',
'............CCCCCCCCCCCCCCC..........',
'.......CCCCCCCCCCCCCCCCCCCCCC.........',
'.....CCCCDDCCCCCCCCCCCCCCCCCCC........',
'....CCCCCDDDCCCCCCCCCCCCCCCCCCC.......',
'...CCCCCCDDDCCCCCCCCCCCCCCCCCCC.......',
'...CEEECCDDDCCCCCCCCCCCCCCCCCCCC......',
'.LLLCCCCCDDDCCCCCCCCCCCCCCCCCCCC......',
'NLLLLCCCCDDDCCCCCCCCCCCCCCCCCCCC......',
'NLLLLLCCCCDDCCCCCCCCCCCCCCCCCCC.......',
'.LLLLLLLLCCCCCCCCCCCCCCCCCCCCC........',
'...LLLLLLLLLL.......LLLLLLLLLL........',
'....LLLLLLLLL......LLLLLLLLLL.........'];
const dogPixels=new Map();dog.forEach((r,y)=>[...r].forEach((k,x)=>{if(k!=='.')dogPixels.set(x+','+y,k)}));
const wag=Math.round(flick.dog*.5);for(const[x,y]of[[29,7],[30,7],[31,7],[32,8],[33,9],[33,10],[33,11],[32,12+wag],[31,13+wag]])dogPixels.set(x+','+y,'C');
g.fillStyle='#4f583329';g.fillRect(3,14,31,2);g.fillStyle='#79634d';for(const id of dogPixels.keys()){const[x,y]=id.split(',').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!dogPixels.has((x+dx)+','+(y+dy)))g.fillRect(x+dx,y+dy,1,1);}
for(let y=3;y<7;y++)for(let x=18;x<24;x++)if(dogPixels.get(x+','+y)==='C')dogPixels.set(x+','+y,'D');for(let y=8;y<11;y++)dogPixels.set('11,'+y,'B');
const dogPalette=DOG_PALETTE;for(const[id,k]of dogPixels){const[x,y]=id.split(',').map(Number);g.fillStyle=dogPalette[k];g.fillRect(x,y,1.08,1.08);}g.fillStyle='#cfb89a';g.fillRect(18,2,5,1);g.restore();}


export function foliageWind(time,seed,weather='sun',reduced=false){if(reduced||seed%3!==0)return 0;const strength=weather==='breeze'?1:weather==='rain'?.7:.4;const phase=seed*1.731;return strength*(.55+.24*Math.sin(time/2600+phase)+.16*Math.sin(time/4100+phase*.7));}

// One tiny cached feathered sprite. Local occasional drift, never a screen veil.
let mistSprite=null;
export function meadowMist(time,reduced=false){
 if(reduced)return null;
 const phase=((Math.max(0,time)%18000)+18000)%18000;
 if(phase>=6500)return null;
 const q=phase/6500;
 return {x:458+q*92,y:182+Math.sin(q*Math.PI)*5,alpha:Math.sin(q*Math.PI)**2*.12,width:122,height:42};
}
function drawMeadowMist(g,time,reduced){
 const m=meadowMist(time,reduced);if(!m||m.alpha<.001)return;
 if(!mistSprite){
  const doc=g.canvas?.ownerDocument||globalThis.document;
  if(!doc)return;
  mistSprite=doc.createElement("canvas");mistSprite.width=96;mistSprite.height=40;
  const c=mistSprite.getContext("2d"),light=c.createRadialGradient(48,20,0,48,20,45);
  light.addColorStop(0,"#f8f7df");light.addColorStop(.45,"#f8f7df8c");light.addColorStop(1,"#f8f7df00");
  c.scale(1,.44);c.fillStyle=light;c.fillRect(0,0,96,92);
 }
 g.save();g.globalAlpha=m.alpha;g.drawImage(mistSprite,m.x,m.y,m.width,m.height);g.restore();
}

// Draw the exact already-sampled frame: no second trajectory/impact calculation.
export function drawRainFrame(g,frame){
 g.save();g.beginPath();g.rect(0,0,960,560);g.clip();
 for(const d of frame.drops){
  if(d.phase==='fall'){g.globalAlpha=d.opacity;g.strokeStyle='#e5eee9';g.lineWidth=d.width;g.beginPath();g.moveTo(d.x,d.y-d.length);g.lineTo(d.x,d.y);g.stroke();}
  else if(d.phase==='impact'){
   const p=d.progress;g.globalAlpha=(1-p)*.5;
   if(d.surface==='water'){g.save();g.beginPath();g.rect(48,388,187,135);g.clip();g.strokeStyle='#e2efe4';g.lineWidth=1;g.beginPath();g.ellipse(d.impactX,d.impactY,2+p*9,1+p*3,0,0,Math.PI*2);g.stroke();g.restore();}
   else {const spread=1+p*4,lift=Math.sin(p*Math.PI)*3;g.fillStyle='#dde9db';g.fillRect(Math.round(d.impactX-spread),Math.round(d.impactY-lift),1.5,1.5);g.fillRect(Math.round(d.impactX+spread),Math.round(d.impactY-lift),1.5,1.5);}
  }
 }
 g.restore();
}
// Ephemeral weather response. Routes use the caller's pet navigation and the
// exact visible canopy columns; nothing writes save data or changes collision.
// Pet-only ground core includes the drawn roots plus small-body clearance.
export function petTrunkBlocked(trees,x,y){return trees.some(([tx,ty,scale])=>x>=tx-9*scale-14&&x<=tx+10*scale+14&&y>=ty+34*scale-7&&y<=ty+46*scale+7);}
export function rainPetGesture(time,offset=0,reduced=false){const phase=(time/1000+offset)%17;return {shake:reduced?0:phase>2&&phase<2.7?Math.sin((phase-2)*45)*1.1:0,groom:reduced?0:phase>8&&phase<10.3?Math.max(0,Math.sin((phase-8)*6)):0};}
export function createRainPets({navigation,rainNavigation=navigation,canopies=[],trees=[],random=Math.random}={}){
 let last=null,clock=0,raining=false,rainAge=0,dryAge=0,homePrevious=null;const homeGait={};
 const benchCat={x:223,y:211,facing:'left',mode:'home',path:[],moving:false},benchHome={x:223,y:211},benchLanding={x:238,y:247};let benchAge=0,benchJump=null,dogDryDone=false,benchDryDone=false;
 function jumpBench(up){benchJump={from:{x:benchCat.x,y:benchCat.y},to:up?benchHome:benchLanding,age:0,up};benchCat.mode=up?'jumpUp':'jumpDown';benchCat.path=[];}
 const dog={x:240,y:245,facing:'left',mode:'home',path:[],wait:.65},cat={x:820,y:535,facing:'right',mode:'home',path:[],wait:1.45};
 let returnCat={x:820,y:535},dogGoal=null,catGoal=null,replan=0,pondDone=false;
 const pondLand={x:293,y:459};let pondAge=0,pondHop=null;
 const homeDog={x:240,y:245};
 const point=p=>({x:p.x,y:p.y});
 const sheltered=(x,y)=>canopies.some((c,i)=>{const k=Math.floor(x-c.left),tree=trees[i];return tree&&k>=8&&k<c.columns.length-8&&Number.isFinite(c.columns[k])&&canopyCoversGround(c,y)&&Math.abs(y-(tree[1]+46*tree[2]))<=66;});
 function chooseShelter(p,avoid=[]){
  const candidates=[];
  for(let i=0;i<trees.length;i++){const[x,y,s]=trees[i],c=canopies[i];if(!c)continue;for(const dx of[-(12*s+18),12*s+18])for(const dy of[8,14,-8]){const q={x:x+dx,y:y+46*s+dy};if(rainNavigation.isWalkable(q.x,q.y)&&sheltered(q.x,q.y)&&avoid.every(a=>!a||Math.hypot(a.x-q.x,a.y-q.y)>=46))candidates.push({q,tree:i,bound:Math.hypot(q.x-p.x,q.y-p.y)});}}
  candidates.sort((a,b)=>a.bound-b.bound);const viable=[],triedTrees=new Set();let checks=0;const checked=new Set();
  // One short list per shelter decision, never re-roll a settled animal.
  // Nearby alternate trees get a chance without querying every candidate path.
  for(const candidate of candidates){if(checks>=8||viable.length>=3)break;if(viable.length&&candidate.bound>viable[0].bound+140)break;if(triedTrees.has(candidate.tree))continue;
   checks++;checked.add(candidate);const path=rainNavigation.findPath(p,candidate.q);if(!path)continue;triedTrees.add(candidate.tree);let from=p,d=0;for(const to of path){d+=Math.hypot(to.x-from.x,to.y-from.y);from=to;}viable.push({...candidate,path,d});
  }
  // Reliable legacy fallback if the nearby shortlist is disconnected.
  if(!viable.length)for(const candidate of candidates){if(checked.has(candidate))continue;const path=rainNavigation.findPath(p,candidate.q);if(path){viable.push({...candidate,path});break;}}
  if(!viable.length)return null;
  const closestTree=q=>{let best=-1,d=Infinity;trees.forEach(([x,y,s],i)=>{const n=Math.hypot(q.x-x,q.y-(y+46*s));if(n<d){d=n;best=i;}});return best;};
  const occupied=new Set(avoid.filter(Boolean).map(closestTree)),distinct=viable.filter(v=>!occupied.has(v.tree)),pool=distinct.length?distinct:viable;
  return pool[Math.min(pool.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*pool.length))];
 }


 function route(p,q){const path=(p.rainRoute?rainNavigation:navigation).findPath(p,q);if(path){p.path=path;p.goal=point(q);}return !!path;}
 function step(p,dt,speed){let budget=dt*speed,moved=0;while(p.path.length&&budget>0){const q=p.path[0],d=Math.hypot(q.x-p.x,q.y-p.y);if(d<.01){p.path.shift();continue;}const n=Math.min(d,budget),next={x:p.x+(q.x-p.x)/d*n,y:p.y+(q.y-p.y)/d*n};if(!(p.rainRoute?rainNavigation:navigation).lineClear(p,next)){p.path=[];break;}p.facing=catFacing(next.x-p.x,next.y-p.y,p.facing);p.x=next.x;p.y=next.y;budget-=n;moved+=n;if(n===d)p.path.shift();}p.moving=moved>.01;if(p.moving)advancePetGait(p,moved,speed);return moved;}
 return {update(time,{weather='sun',player=null,playerUmbrella=null,reduced=false}={}){
  const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));if(last===null)clock=time;last=time;
  const wet=weather==='rain';
  if(wet&&!raining){for(const p of[dog,cat,benchCat])p.rainRoute=true;if(cat.mode==='home'){const base=gardenLife(clock,reduced).cat;Object.assign(cat,{x:base.x,y:base.groundY,facing:base.facing});returnCat=point(cat);}Object.assign(cat,{mode:'notice',path:[],jump:0,pondPaw:0});pondHop=null;dog.mode='notice';dog.path=[];rainAge=0;dogGoal=chooseShelter(dog);catGoal=chooseShelter(cat,[dogGoal?.q]);}
  if(!wet&&raining){for(const p of[dog,cat]){p.mode='return';p.path=[];}route(dog,homeDog);route(cat,returnCat);}
  raining=wet;rainAge+=dt;replan-=dt;dryAge=wet?0:dryAge+dt;benchAge+=dt;
  if(!reduced){
   if(wet){
    if(dog.mode==='notice'&&rainAge>=dog.wait){dog.mode='shelter';if(dogGoal)dog.path=dogGoal.path.slice();}
    const u=playerUmbrella,near=player&&Math.hypot(player.x-cat.x,player.y-cat.y)<(cat.mode==='follow'?125:82),open=u&&u.opening>=.95;
    if(open&&near){
     if(cat.mode!=='follow'||replan<=0){const side=u.x>=player.x?1:-1,q={x:player.x+side*17,y:player.y+9};if(rainNavigation.isWalkable(q.x,q.y)&&umbrellaCoversGround(u,q.y)&&Number.isFinite(umbrellaTop(u,q.x-22))&&Number.isFinite(umbrellaTop(u,q.x+22))&&route(cat,q)){cat.mode='follow';replan=.45;}}
    }else if(cat.mode==='follow'){cat.mode='shelter';catGoal=chooseShelter(cat,[dogGoal?.q]);cat.path=catGoal?catGoal.path.slice():[];}
    if(cat.mode==='notice'&&rainAge>=cat.wait){cat.mode='shelter';if(catGoal)cat.path=catGoal.path.slice();}
   }
   // One rare dry pond visit per session, after the nearby bench visits.
   // The target stays on land; only the drawn paw/ripple reaches the water.
   if(!wet&&dryAge>110&&!pondDone&&cat.mode==='home'){
    const base=gardenLife(clock,reduced).cat;Object.assign(cat,{x:base.x,y:base.groundY,facing:base.facing});returnCat=point(cat);
    if(route(cat,pondLand)){cat.mode='pondTravel';pondDone=true;pondAge=0;}
   }
   if(cat.mode==='pondTravel'&&!cat.path.length){cat.mode='pondWatch';cat.facing='left';pondAge=0;}
   if(cat.mode==='pondWatch'){
    pondAge+=dt;cat.facing='left';const attempt=(pondAge-2)/2.8,phase=attempt-Math.floor(attempt);
    cat.pondPaw=attempt>=0&&attempt<3?Math.sin(Math.min(1,phase*2)*Math.PI)*9:0;
    if(pondAge>=8.35){const to={x:cat.x+18,y:cat.y};if(navigation.lineClear(cat,to)){pondHop={from:point(cat),to,age:0};cat.mode='pondStartle';cat.pondPaw=0;}}
   }
   if(pondHop){cat.moving=false;pondHop.age+=dt;const u=Math.min(1,pondHop.age/.6);cat.x=pondHop.from.x+(pondHop.to.x-pondHop.from.x)*u;cat.y=pondHop.from.y;cat.jump=Math.sin(u*Math.PI)*8;if(u===1){pondHop=null;cat.jump=0;cat.mode='return';route(cat,returnCat);}}
   // Dry visits are infrequent and staggered, not a synchronized looping dance.
   if(!wet&&dryAge>34&&!dogDryDone&&dog.mode==='home'){dog.mode='dryStretch';dogDryDone=true;dog.restAge=0;}
   if(dog.mode==='dryStretch'){dog.restAge+=dt;if(dog.restAge>1.5){dog.mode='dryStroll';route(dog,{x:338,y:260});}}
   if(dog.mode==='dryStroll'&&!dog.path.length){dog.mode='dryRest';dog.facing='right';dog.restAge=0;}
   if(dog.mode==='dryRest'){dog.restAge+=dt;if(wet||dog.restAge>24){dog.mode=wet?'shelter':'return';if(wet){dogGoal=chooseShelter(dog);dog.path=dogGoal?dogGoal.path.slice():[];}else route(dog,homeDog);}}
   if(!wet&&dryAge>18&&!benchDryDone&&benchCat.mode==='home'){benchCat.mode='stretch';benchAge=0;benchDryDone=true;}
   if(benchCat.mode==='stretch'&&benchAge>2){jumpBench(false);benchAge=0;}
   if(wet&&benchCat.mode==='home'){benchCat.mode='stretch';benchAge=0;}
   if(benchJump){benchCat.moving=false;benchJump.age+=dt;const u=Math.min(1,benchJump.age/.8),q=benchJump;benchCat.x=q.from.x+(q.to.x-q.from.x)*u;benchCat.y=q.from.y+(q.to.y-q.from.y)*u;benchCat.jump=Math.sin(u*Math.PI)*14;benchCat.facing=q.up?'up':'down';if(u===1){const up=q.up;benchJump=null;benchCat.jump=0;if(up){benchCat.rainRoute=false;benchCat.mode='home';benchCat.facing='left';}else{benchCat.mode=wet?'shelter':'dryStroll';const place=wet?chooseShelter(benchCat,[dogGoal?.q,catGoal?.q]):null;if(place)benchCat.path=place.path.slice();else route(benchCat,{x:388,y:270});}}}
   else if(benchCat.mode==='dryStroll'&&!benchCat.path.length){benchCat.mode='dryRest';benchCat.facing='left';benchAge=0;}
   if(wet&&['dryStroll','dryRest','return'].includes(benchCat.mode)){benchCat.mode='shelter';const place=chooseShelter(benchCat,[dogGoal?.q,catGoal?.q]);benchCat.path=place?place.path.slice():[];}
   if(!wet&&benchCat.mode==='shelter'){benchCat.mode='return';route(benchCat,benchLanding);}
   if(!wet&&benchCat.mode==='dryRest'&&benchAge>31){benchCat.mode='return';route(benchCat,benchLanding);}
   if(benchCat.mode==='return'&&!benchCat.path.length&&Math.hypot(benchCat.x-benchLanding.x,benchCat.y-benchLanding.y)<1)jumpBench(true);
   if(!benchJump)step(benchCat,dt,wet?52:29);
   step(dog,dt,wet?67:37);if(!pondHop)step(cat,dt,cat.mode==='follow'?160:wet?58:cat.mode==='pondTravel'?47:39);
   if(!wet){if(dog.mode==='return'&&!dog.path.length&&Math.hypot(dog.x-homeDog.x,dog.y-homeDog.y)<1){dog.mode='home';dog.rainRoute=false;}if(cat.mode==='return'&&!cat.path.length&&Math.hypot(cat.x-returnCat.x,cat.y-returnCat.y)<1){cat.mode='home';cat.rainRoute=false;}}
  }else {dog.moving=false;cat.moving=false;benchCat.moving=false;}
  if(!wet&&cat.mode==='home')clock+=dt*1000;
  if(wet)for(const p of[dog,cat,benchCat])if(p.mode==='shelter'&&!p.moving&&!p.path.length)p.facing='down';
  const dg=rainPetGesture(time,0,reduced),cg=rainPetGesture(time,5,reduced),bg=rainPetGesture(time,11,reduced);
  const life=gardenLife(clock,reduced),activeCat=cat.mode!=='home';
  if(activeCat){life.visitor=null;life.cat={...life.cat,x:cat.x,y:cat.y-(cat.jump||0),groundY:cat.y,facing:cat.facing,dir:cat.facing==='left'?-1:1,pounce:false,paw:cat.pondPaw||0,pondPaw:cat.mode==='pondWatch',aim:0,wiggle:0,burst:0,searching:false,running:cat.moving,gaitPhase:cat.gaitPhase||0,moving:cat.moving,stride:cat.moving?Math.sin(cat.gaitPhase||0)*3:0,sit:cat.moving||cat.mode==='follow'||cat.mode==='pondWatch'||cat.mode==='pondStartle'?0:1,lie:0,phase:cat.mode,rainAlert:wet&&cat.mode==='shelter'&&!cat.moving,shake:wet&&!cat.moving?cg.shake:0,groom:wet&&!cat.moving?cg.groom:0};}
  if(!activeCat){const c=life.cat,dist=homePrevious?Math.hypot(c.x-homePrevious.x,c.groundY-homePrevious.y):0;homePrevious={x:c.x,y:c.groundY};c.moving=!reduced&&dt>0&&dist>.01;c.gaitPhase=advancePetGait(homeGait,c.moving?dist:0,dt>0?dist/dt:0);c.stride=c.moving?Math.sin(c.gaitPhase)*3:0;}else homePrevious=null;
  return {life,pondContact:cat.mode==='pondStartle'?{x:269,y:459,progress:Math.min(1,(pondHop?.age||0)/.6)}:null,pondFish:cat.mode==='pondWatch'?pondLife(time,reduced).map(point):null,benchCat:{...point(benchCat),rainAlert:wet&&benchCat.mode==='shelter'&&!benchCat.moving,shake:wet&&!benchCat.moving?bg.shake:0,groom:wet&&!benchCat.moving?bg.groom:0,facing:benchCat.facing,moving:benchCat.moving,mode:benchCat.mode,jump:benchCat.jump||0,gaitPhase:benchCat.gaitPhase||0,stride:benchCat.moving?Math.sin(benchCat.gaitPhase||0)*3:0},benchCatActive:benchCat.mode!=='home',dog:{...point(dog),rainAlert:wet&&dog.mode==='shelter'&&!dog.moving,shake:wet&&!dog.moving?dg.shake:0,groom:wet&&!dog.moving?dg.groom:0,facing:dog.facing,moving:dog.moving,mode:dog.mode,gaitPhase:dog.gaitPhase||0,stride:dog.moving?Math.sin(dog.gaitPhase||0)*3:0},dogActive:dog.mode!=='home',catActive:activeCat,covered:{dog:sheltered(dog.x,dog.y),cat:sheltered(cat.x,cat.y)},clock};
 },get positions(){return{dog:point(dog),cat:point(cat),benchCat:point(benchCat)}}};
}

// One beige, floppy-eared dog: same cream muzzle/paws, cocoa flank patch,
// sage collar and curling tail in nap, four directions, and alert sitting.
const DOG_PALETTE={C:'#bda285',D:'#927455',L:'#e4cfaf',E:'#655442',N:'#514b40',B:'#698879',W:'#f7ebd4'};
const DOG_SIDE=[
'.....CCCCCC.......................',
'....CCCCCDDD......................',
'...CCCCCCDDDD.....................',
'...CCEWCCDDDD.....................',
'.LLLCCCCCDDDD....CCCCCCCCCCC.......',
'NLLLLCCCCDDDD..CCCCCDDDDDDCCCC.....',
'LLLLLCCCCDDDDBCCCCCDDDDDDDCCCCC....',
'.LLLLLCCCCCCBBCCCCCDDDDDDCCCCCCC...',
'...CCCCCCCCCBCCCCCCCCCCCCCCCCCCC..',
'.....CCCCCCCCCCCCCCCCCCCCCCCCCCC..',
'......CCCCCCCCCCCCCCCCCCCCCCCCC...',
'.......CCCCCCCCCCCCCCCCCCCCCCC....',
'........CCCC...........CCCC.......',
'........CCCC...........CCCC.......',
'........CCCC...........CCCC.......',
'........LLLL...........LLLL.......'];
const DOG_FRONT=[
'.....CCCCCCCC.....','...CCCCCCCCCCCC...','..DDCCCCCCCCCCDD..',
'..DDDCCCCCCCCDDD..','..DDDCEWCCWECDDD..','..DDDCCCCCCCCDDD..',
'..DDDLLLLLLLLDDD..','...DDLLLNNLLLDD...','.....LLLLLLLL.....',
'.....CBBBBBBC.....','....CCCCCCCCCC....','....CCCCCCCCCC....',
'....CCCCCCCCCC....','....CCCCCCCCCC....','.....CCCCCCCC.....',
'.....CC..CC.......','.....CC..CC.......','.....LL..LL.......'];
const DOG_BACK=[
'.....CCCCCCCC.....','...CCCCCCCCCCCC...','..DDCCCCCCCCCCDD..',
'..DDDCCCCCCCCDDD..','..DDDCCCCCCCCDDD..','..DDDCCCCCCCCDDD..',
'...DDCCCCCCCCDD...','.....CCCCCCCC.....','.....CBBBBBBC.....',
'....CCCCCCCCCC....','....CCDDDDDDCC....','....CCDDDDDDCC....',
'....CCCCCCCCCC....','....CCCCCCCCCC....','.....CCCCCCCC.....',
'.....CC..CC.......','.....CC..CC.......','.....LL..LL.......'];
export function dogPosePixels(facing='left',moving=false,stride=0,alert=false,gaitPhase=null){
 const vertical=facing==='up'||facing==='down',rows=vertical?(facing==='up'?DOG_BACK:DOG_FRONT):DOG_SIDE,w=rows[0].length,h=rows.length,pixels=new Map();
 rows.forEach((row,y)=>[...row].forEach((k,x)=>{if(k!=='.')pixels.set(x+','+y,k)}));
 // Tail attaches at the rump, independent of paw motion.
 const tail=vertical?[[12,13],[13,12],[14,11],[15,10],[15,9]]:[[30,9],[31,9],[32,8],[33,7],[33,6],[32,5]];
 for(const[x,y]of tail)pixels.set(x+','+y,'C');
 if(moving)articulatePaws(pixels,{h,vertical,phase:gaitPhase??(stride>0?1:4),fur:'C',shade:'D',anchors:[8,10,23,25]});
 if(alert&&vertical){for(let y=12;y<h-1;y++){pixels.set('4,'+y,'C');pixels.set('12,'+y,'C');}pixels.set('4,'+(h-1),'L');pixels.set('12,'+(h-1),'L');}
 return {pixels,w,h,vertical};
}
export function drawRainDog(g,d){
 if(!d.moving&&!d.rainAlert){g.save();g.translate(d.x,d.y);if(d.facing==='right')g.scale(-1,1);if(d.mode==='dryStretch')g.scale(1.08,.93);g.translate(-240,-245);drawBenchLife(g,0,true,{benchCatActive:true});g.restore();return;}
 const {pixels,w,h,vertical}=dogPosePixels(d.facing,d.moving,d.stride,d.rainAlert,d.gaitPhase);
 if(d.rainAlert&&d.groom>.3){pixels.set('6,'+(8-Math.round(d.groom*2)),'L');pixels.set('6,9','L');}
 g.save();g.translate(Math.round(d.x)+(d.shake||0),Math.round(d.y));g.fillStyle='#4f583329';g.beginPath();g.ellipse(0,3,vertical?12:22,2.5,0,0,Math.PI*2);g.fill();if(!vertical&&d.facing==='right')g.scale(-1,1);g.scale(1.5,1.5);g.translate(-w/2,-h+1);
 g.fillStyle='#79634d';for(const id of pixels.keys()){const[x,y]=id.split(',').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!pixels.has((x+dx)+','+(y+dy)))g.fillRect(x+dx,y+dy,1,1);}
 for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number);g.fillStyle=DOG_PALETTE[k];g.fillRect(x,y,1,1);}g.restore();if(d.rainAlert&&Math.abs(d.shake||0)>.5)drawPetShake(g,d.x,d.y,d.shake);
}

export function drawRainBenchCat(g,c){drawGardenCat(g,{...c,calico:true,groundY:c.y,y:c.y-(c.jump||0),dir:c.facing==='left'?-1:1,lie:c.mode==='dryRest'?1:0,sit:c.rainAlert?1:0,pounce:c.mode==='stretch',paw:c.mode==='stretch'?4:0,tail:0,palette:{W:'#fff0cb',I:'#b9854a',H:'#cd955d',O:'#ead4ae',L:'#f5e2c1',S:'#665b50',E:'#6b5944',N:'#ad7f71'}});}

// Local pet splash only; does not create or wet a soil cell or alter fish.
export function drawPetPondContact(g,contact){if(!contact)return;const u=contact.progress;g.save();g.globalAlpha=(1-u)*.55;g.strokeStyle='#dce9df';g.lineWidth=1;g.beginPath();g.ellipse(contact.x,contact.y,2+u*8,1+u*3,0,0,Math.PI*2);g.stroke();g.restore();}

function drawPetShake(g,x,y,shake){g.save();g.fillStyle='#b6d7d4';for(let i=0;i<4;i++){const side=i%2?1:-1;g.fillRect(x+side*(12+i*2+Math.abs(shake)*2),y-12-i*3,2,2);}g.restore();}
