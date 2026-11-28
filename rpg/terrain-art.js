import {GARDEN_SOIL,GARDEN_ROWS} from './town-bed.js?v=1';
// Original baked pixel terrain. Drawing only; gameplay and water-life coordinates
// remain owned by their existing modules. Two small canvases, never frame noise.
export function createTerrainArt(makeCanvas){
 const make=(w,h)=>{const c=makeCanvas();c.width=w;c.height=h;return c;};
 const pond=make(280,184),bed=make(178,120);
 const paint=(canvas,ox,oy,fn)=>{const g=canvas.getContext('2d');g.translate(-ox,-oy);const r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};const p=(points,c)=>{g.fillStyle=c;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};fn(g,r,p);};
 paint(pond,10,370,(g,r,p)=>{
  // Existing water footprint, softened by stepped turf and a layered cut bank.
  p([[40,375],[245,375],[245,392],[275,392],[275,538],[20,538],[20,392],[40,392]],'#78865e');
  p([[44,380],[241,380],[241,397],[270,397],[270,533],[25,533],[25,397],[44,397]],'#b5b18a');
  p([[48,384],[237,384],[237,401],[266,401],[266,529],[29,529],[29,401],[48,401]],'#698e83');
  // The full fish/ripple clip (48,388,187,135) stays unobstructed water.
  r(48,388,187,135,'#81b1a5');r(29,402,19,125,'#79a69a');r(235,402,31,125,'#79a69a');
  p([[61,399],[192,399],[192,407],[221,407],[221,486],[206,486],[206,506],[68,506],[68,495],[48,495],[48,416],[61,416]],'#79a99f');
  p([[85,420],[190,420],[190,431],[208,431],[208,469],[190,469],[190,488],[78,488],[78,477],[60,477],[60,438],[85,438]],'#719f99');
  // Quiet grouped subsurface patches rather than repetitive horizontal stripes.
  for(const[x,y,w]of[[54,393,35],[177,392,39],[38,409,17],[230,413,27],[52,515,42],[182,514,39]]){r(x,y,w,2,'#b2d0b9');r(x+5,y+3,Math.max(6,w-13),1,'#94bfad');}
  for(const[x,y,w]of[[76,410,17],[157,446,22],[99,489,26],[214,475,12]]){r(x,y,w,1,'#99c0ae');r(x+3,y+2,6,1,'#a9cab4');}
  // Broken turf fingers soften the bank without entering the fish clip.
  for(const[x,y,w,h]of[[18,418,12,22],[18,467,11,17],[18,510,14,14],[266,416,11,15],[266,455,11,21],[265,503,12,17],[65,374,28,10],[150,374,23,9],[208,374,18,10],[77,529,31,11],[192,529,28,11]]){r(x,y,w,h,'#92a777');r(x+2,y+1,Math.max(2,w-5),2,'#b1bd88');}
  // Rooted bank stones are outside the living-water rectangle.
  for(const[x,y,s]of[[29,390,1],[42,380,.8],[239,386,1.1],[260,399,.8],[271,474,.7],[249,533,1],[42,536,.9],[20,493,.8],[163,538,.7]]){
   const X=Math.round(x),Y=Math.round(y),w=Math.round(14*s),h=Math.round(8*s);
   r(X-2,Y+h-1,w+3,3,'#73815c');p([[X+3,Y],[X+w-3,Y],[X+w,Y+3],[X+w-1,Y+h],[X,Y+h],[X-1,Y+3]],'#a5a68b');r(X+3,Y+1,w-6,2,'#cbc5a1');r(X+2,Y+h-2,w-3,2,'#858e76');
  }
  for(const[x,y]of[[25,432],[31,438],[24,444],[259,429],[263,434],[68,540],[74,542],[224,541],[31,512]]){r(x,y-7,2,9,'#64815a');r(x-4,y-3,2,5,'#7b965e');r(x+4,y-10,2,12,'#79935d');r(x+4,y-10,2,3,'#c0bd81');}
 });
 paint(bed,733,400,(g,r,p)=>{
  p(GARDEN_SOIL,'#866c4d');
  g.save();g.beginPath();GARDEN_SOIL.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
  for(const {center:y,start:x,end,spread} of GARDEN_ROWS){
   p([[x,y-3],[x+8,y-spread],[end-8,y-spread],[end,y-3],[end-8,y+spread],[x+9,y+spread]],'#997951');
   for(const [dy,c] of [[-9,'#a98a5f'],[1,'#a4875e'],[10,'#876847']]){
    g.strokeStyle=c;g.lineWidth=1.5;g.beginPath();g.moveTo(x+4,y+dy);g.quadraticCurveTo((x+end)/2,y+dy-1.8,end-3,y+dy);g.stroke();
   }
  }
  for(let i=0;i<93;i++){const x=742+(i*43)%158,y=415+(i*29)%88;r(x,y,1+i%3,1,i%3?'#a0835d':'#6c573e');}
  g.restore();

 });
 return Object.freeze({drawPond:g=>g.drawImage(pond,10,370),drawBed:g=>g.drawImage(bed,733,400),stats:Object.freeze({canvases:2,rgbaBytes:(280*184+178*120)*4})});
}
