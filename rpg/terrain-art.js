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
  // Exact established bed footprint; rich mulch stays beneath earned plants.
  r(735,404,172,111,'#897657');r(738,407,166,105,'#655a45');r(744,412,154,93,'#84684c');
  r(735,404,172,3,'#c8b48a');r(735,407,3,105,'#b8a079');r(738,512,166,3,'#6e5e46');
  for(const[x,y,w]of[[744,413,151],[744,453,151],[744,495,151]]){r(x,y,w,3,'#957854');r(x+3,y+4,w-6,2,'#745c44');}
  // Tiny deterministic mulch clusters; broad planting pockets remain restful.
  for(let i=0;i<62;i++){const x=748+(i*43)%145,y=418+(i*29)%84;r(x,y,3+i%3,1,i%3?'#a1855b':'#635640');if(i%4===0)r(x+2,y+2,2,1,'#b49a6a');}
  for(const[x,y]of[[767,440],[817,440],[867,440],[767,482],[817,482],[867,482]]){p([[x-18,y-5],[x-10,y-10],[x+14,y-9],[x+20,y-3],[x+16,y+8],[x-14,y+9],[x-21,y+3]],'#7b6148');r(x-12,y+7,24,2,'#93754f');}
  // Irregular board grain and inset joints retain the familiar garden border.
  for(const[x,y,w]of[[746,405,27],[794,405,38],[850,405,34],[744,509,40],[809,509,31],[857,509,37]])r(x,y,w,1,'#a58b64');
  for(const x of[739,790,847,900]){r(x,405,2,5,'#857153');r(x,508,2,5,'#62573f');}
 });
 return Object.freeze({drawPond:g=>g.drawImage(pond,10,370),drawBed:g=>g.drawImage(bed,733,400),stats:Object.freeze({canvases:2,rgbaBytes:(280*184+178*120)*4})});
}
