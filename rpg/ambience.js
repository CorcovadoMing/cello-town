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
export function drawGardenCat(g,c){
 const facing=c.facing||(c.dir<0?'left':'right'),vertical=facing==='up'||facing==='down',back=facing==='up',rest=Math.max(c.lie||0,c.sit||0),playing=!!c.pounce||(c.paw||0)>.1,tucked=!playing&&rest>.6;
 const rows=vertical?(back?(tucked?CAT_BACK_REST:CAT_BACK_WALK):(tucked?CAT_FRONT_REST:CAT_FRONT_WALK)):(tucked?CAT_SIDE_REST:CAT_SIDE_WALK),pixels=new Map(),w=rows[0].length,h=rows.length,put=(x,y,k)=>pixels.set(x+','+y,k);
 rows.forEach((row,y)=>[...row].forEach((k,x)=>{if(k!=='.'){if(back&&y<8)k=k==='E'||k==='L'||k==='N'?'O':k;put(x,y,k)}}));
 if(back){for(const[x,y]of[[7,h-7],[7,h-6],[8,h-5],[9,h-4],[10,h-3],[11,h-3],[12,h-4],[12,h-5]]){put(x,y,'S');put(x,y+1,'O');}}
 if(!vertical&&!tucked){for(const[x,y]of[[23,2],[22,3],[23,3],[24,3],[22,4],[23,4],[24,4],[23,5]])put(x,y,'E');put(22,3,'W');put(23,4,'I');}
 // Separate farther limbs and subtle stride at pixel resolution, never a biped bounce.
 if(!tucked){const shift=Math.round(Math.max(-2,Math.min(2,(c.stride||0)*.5)));if(vertical){for(let y=h-6;y<h-3;y++){put(6,y,'S');put(7,y,'S');}put(5,h-4-shift,'L');put(8,h-4+shift,'L');for(const x of[4,5,8,9])pixels.delete(x+','+(h-1));put(4,h-1+shift,'L');put(5,h-1+shift,'L');put(8,h-1-shift,'L');put(9,h-1-shift,'L');}else{for(let y=h-6;y<h-1;y++){put(9,y,'S');put(22,y,'S');}put(9,h-1-shift,'L');put(22,h-1+shift,'L');}}
 if(!back){const y=vertical?8:(tucked?4:7);for(let x=vertical?5:10;x<(vertical?9:16);x++)if(pixels.get(x+','+y)==='O')put(x,y,'H');}
 if(!tucked&&(c.aim||0)>.05){const amount=c.aim,compressed=new Map();for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number),ny=Math.round(h-1-(h-1-y)*(1-.28*amount));compressed.set((x+(!vertical&&y>8?Math.round((c.wiggle||0)*.25):0))+','+ny,k);}pixels.clear();for(const[id,k]of compressed)pixels.set(id,k);}
 if(playing){
  // Extended forelegs and trailing hocks make a real reach/pounce silhouette;
  // ground shadow and airborne translation still come from the original timeline.
  if(!vertical){for(const id of [...pixels.keys()]){const[x,y]=id.split(',').map(Number);if(x>=19&&y>=h-6)pixels.delete(id);}
   const lift=Math.round(Math.min(3,(c.paw||0)*.25));for(let i=0;i<11;i++){put(20+i,12-Math.floor(i*.3)-lift,'O');put(20+i,13-Math.floor(i*.3)-lift,'L');}put(30,10-lift,'L');
   for(let i=0;i<4;i++){put(6-i,h-5+i,'S');put(5-i,h-5+i,'O');}}
  else{for(const id of [...pixels.keys()]){const[x,y]=id.split(',').map(Number);if((x<=5||x>=8)&&y>=h-6)pixels.delete(id);}
   for(let i=0;i<5;i++){put(3-i,10-i,'O');put(10+i,10-i,'O');}put(-2,5,'L');put(15,5,'L');}
 }

 const colors={W:'#fff0cb',I:'#b9854a',H:'#e9aa62',O:'#d58b43',L:'#f4d4a0',S:'#a6572f',E:'#353b32',N:'#824b3a'},scale=1.35;
 g.save();g.translate(Math.round(c.x),Math.round(c.groundY??c.y));g.fillStyle='#3f58372a';g.beginPath();g.ellipse(0,4,vertical?11:20,2.5,0,0,Math.PI*2);g.fill();g.translate(0,Math.round(c.y-(c.groundY??c.y)));if(!vertical&&facing==='left')g.scale(-1,1);g.scale(scale,scale);g.translate(-w/2,-h+2);
 // Four-neighbour one-pixel outline gives crisp stepped edges, not antialiased ellipses.
 g.fillStyle='#74533a';for(const id of pixels.keys()){const[x,y]=id.split(',').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!pixels.has((x+dx)+','+(y+dy)))g.fillRect(x+dx,y+dy,1,1);}
 for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number);g.fillStyle=colors[k];g.fillRect(x,y,1,1);}
 if(vertical&&!back&&!tucked){g.fillStyle='#fff0cb';g.fillRect(5,4,1,1);g.fillRect(8,4,1,1);}
 g.restore();
}
export function drawPondLife(g,time,reduced,variants=defaultFish){g.save();g.beginPath();g.rect(48,388,187,135);g.clip();for(const [i,f] of pondLife(time,reduced).entries()){const v=variants[i];g.save();g.translate(f.x,f.y);g.scale(f.dir*v.size*v.length,v.size*v.girth);g.fillStyle=v.color;g.globalAlpha=.92;g.beginPath();g.ellipse(0,0,9,4,0,0,Math.PI*2);g.fill();if(v.fin!=='none'){g.beginPath();g.moveTo(-7,0);if(v.fin==='round'){g.quadraticCurveTo(-20,-9+f.tail,-15,f.tail);g.quadraticCurveTo(-20,9+f.tail,-7,0);}else{g.lineTo(-15,-5+f.tail);g.lineTo(-12,f.tail);g.lineTo(-15,5+f.tail);}g.closePath();g.fill();}g.fillStyle='#fff1c0';g.fillRect(0,-2,4,2);g.fillStyle='#567f79';g.fillRect(6,-1,1.5,1.5);g.restore();if(f.surface!==null){g.globalAlpha=(1-f.surface)*.55;g.strokeStyle='#e2f0d9';g.lineWidth=1.2;g.beginPath();g.ellipse(f.x,f.y,5+f.surface*19,2+f.surface*7,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}}g.restore();}
export function drawGardenLife(g,time,reduced){const {visitor:v,cat:c}=gardenLife(time,reduced);g.save();if(v){g.save();g.translate(v.x,v.y);g.scale(v.dir,1);if(v.kind==='butterfly'){g.fillStyle='#f4d28d';for(const side of [-1,1]){g.beginPath();g.ellipse(side*5,0,3+Math.abs(v.wing)*2,6,side*.4,0,Math.PI*2);g.fill();}g.fillStyle='#8e7450';g.fillRect(-1,-4,2,8);g.fillRect(2,-2,3,3);}else if(v.kind==='bee'){g.fillStyle='#fff3d1';g.beginPath();g.ellipse(-3,-4,5,3+Math.abs(v.wing)*2,0,0,Math.PI*2);g.fill();g.fillStyle='#e7b655';g.fillRect(-6,-2,12,6);g.fillStyle='#665743';g.fillRect(-1,-2,3,6);g.fillRect(5,-1,2,2);}else{g.fillStyle='#7596ac';g.beginPath();g.ellipse(0,0,8,5,0,0,Math.PI*2);g.fill();g.fillStyle='#b6cfdb';g.beginPath();g.ellipse(-2,-3,7,2+Math.abs(v.wing)*4,-.4,0,Math.PI*2);g.fill();g.fillStyle='#e7be6f';g.fillRect(7,-2,4,2);}g.restore();}
drawGardenCat(g,c);g.restore();}

// Uses the owning app's single gameWeather snapshot; never a second schedule.
export function townWeather(time,key,reduced=false){const t=reduced?0:Math.max(0,time);if(key==='rain')return Array.from({length:42},(_,i)=>({x:(i*137+t*.017)%960,y:(i*89+t*.072)%560,length:7+i%4}));if(key==='breeze')return Array.from({length:7},(_,i)=>({x:(i*157+t*.025)%960,y:85+i*64+Math.sin(t/1600+i)*9,length:22+i%3*7}));return [];}
export function drawTownWeather(g,time,key,reduced){g.save();g.beginPath();g.rect(0,0,960,560);g.clip();if(key==='sun'){const light=g.createRadialGradient(790,75,10,790,75,270);light.addColorStop(0,'#fff6bb35');light.addColorStop(1,'#fff6bb00');g.fillStyle=light;g.fillRect(0,0,960,560);g.strokeStyle='#fff5c458';g.lineWidth=1.5;for(let i=0;i<4;i++){const x=666+i*54,y=112+i*22,p=reduced?2:2+Math.sin(time/1500+i)*1.5;g.beginPath();g.moveTo(x-p,y);g.lineTo(x+p,y);g.moveTo(x,y-p);g.lineTo(x,y+p);g.stroke();}}else if(key==='rain'){g.strokeStyle='#effaff88';g.lineWidth=1.2;g.lineCap='round';for(const d of townWeather(time,key,reduced)){g.beginPath();g.moveTo(d.x,d.y);g.lineTo(d.x+d.length*(.017/.072),d.y+d.length);g.stroke();}}else if(key==='breeze'){g.strokeStyle='#eef5d878';g.lineWidth=1.2;g.lineCap='round';for(const d of townWeather(time,key,reduced)){g.beginPath();g.moveTo(d.x,d.y);g.quadraticCurveTo(d.x+14,d.y-7,d.x+d.length,d.y);g.stroke();g.fillStyle='#d4d79a99';g.beginPath();g.ellipse(d.x+6,d.y+4,3,1.4,-.3,0,Math.PI*2);g.fill();}}g.restore();}

export function restTailMotion(time,reduced=false){if(reduced)return{cat:0,dog:0};const t=Math.max(0,time),c=t%17800,d=t%23100;const pulse=(v,start,duration,turns,amplitude)=>{if(v<start||v>start+duration)return 0;const u=(v-start)/duration;return Math.sin(u*Math.PI)*Math.sin(u*Math.PI*turns)*amplitude;};return{cat:pulse(c,14500,900,2.5,2.7),dog:pulse(d,17400,1300,4,3.8)};}
export function drawBenchLife(g,time,reduced){const flick=restTailMotion(time,reduced);const breath=reduced?0:Math.sin(time/1350)*.7;g.save();
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
const palette={C:'#ead4ae',L:'#f5e2c1',D:'#665b50',O:'#cd955d',E:'#6b5944',N:'#ad7f71'};for(const[id,k]of pixels){const[x,y]=id.split(',').map(Number);g.fillStyle=palette[k];g.fillRect(x,y,1,1);}g.restore();
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
const dogPalette={C:'#bda285',D:'#927455',L:'#e4cfaf',E:'#655442',N:'#514b40'};for(const[id,k]of dogPixels){const[x,y]=id.split(',').map(Number);g.fillStyle=dogPalette[k];g.fillRect(x,y,1.08,1.08);}g.fillStyle='#cfb89a';g.fillRect(18,2,5,1);g.restore();}


export function foliageWind(time,seed,weather='sun',reduced=false){if(reduced||seed%3!==0)return 0;const strength=weather==='breeze'?1:weather==='rain'?.7:.4;const phase=seed*1.731;return strength*(.55+.24*Math.sin(time/2600+phase)+.16*Math.sin(time/4100+phase*.7));}
