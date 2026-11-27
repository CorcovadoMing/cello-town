// Original music-room identity recovered from pre-8d8b4b4 town art.
// The portal controller uses the same doorway and landing bounds as the art.
export const MUSIC_ROOM=Object.freeze({x:580,y:126,w:196,h:113,depth:239});
export const MUSIC_ROOM_DOOR=Object.freeze({x:MUSIC_ROOM.x+73,y:MUSIC_ROOM.y+43,w:46,h:63});
const doorCenter=MUSIC_ROOM_DOOR.x+MUSIC_ROOM_DOOR.w/2;
// Lay the ground under the front wall and the separated wooden treads.
// The wall draws over that overlap; landing and collision geometry stay put.
const soilStart=MUSIC_ROOM.depth-4;
export const MUSIC_ROOM_APPROACH=Object.freeze({centerX:doorCenter,landing:Object.freeze({x:doorCenter-32,y:MUSIC_ROOM.depth+4,w:64,h:20}),soil:Object.freeze({x:doorCenter-38,y:soilStart,w:76,h:298-soilStart})});

// Studio geometry is projected from one local 3D coordinate system. X goes
// across the façade, Y goes away from the path, Z is world height. Its door
// remains in the original interaction rectangle; none of this routes actors.
const P=(x,y,z)=>[Math.round(676+x+y*.43),Math.round(236-y*.59-z)];
const face=(g,pts,color)=>{
 g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
};
const F=(g,pts,color)=>face(g,pts.map(v=>P(...v)),color);
const wallHalf=70,wallDepth=68,wallHeight=81,roofTop=142,roofEdge=84;
const roofRidge=(x)=>roofTop-Math.abs(x)/(wallHalf+9)*(roofTop-roofEdge);
const roofShape=(a,b,start=-6,end=74,offset=0)=>[[a,start,roofRidge(a)+offset],[b,start,roofRidge(b)+offset],[b,end,roofRidge(b)+offset],[a,end,roofRidge(a)+offset]];
const chimney=[[-19,48,147],[-5,48,147],[-5,63,147],[-19,63,147]];
const roofPolys=[roofShape(-79,0),roofShape(0,79),chimney].map(f=>f.map(v=>P(...v)));

export function musicRoomRainCanopy(){
 const left=Math.min(...roofPolys.flat().map(p=>p[0])),right=Math.max(...roofPolys.flat().map(p=>p[0]));
 const columns=new Float32Array(right+1-left);columns.fill(Infinity);
 for(const poly of roofPolys)for(let i=0;i<poly.length;i++){
  const [ax,ay]=poly[i],[bx,by]=poly[(i+1)%poly.length];
  for(let x=Math.min(ax,bx);x<=Math.max(ax,bx);x++){
   const y=ax===bx?Math.min(ay,by):ay+(by-ay)*(x-ax)/(bx-ax);
   columns[x-left]=Math.min(columns[x-left],y);
  }
 }
 return {kind:'roof',left,columns,groundMin:126,groundMax:MUSIC_ROOM.depth};
}
export function roomBlocks(x,y){return x>=580&&x<=776&&y>=126&&y<=239;}
const r=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
function wallWindow(g,x,y,light){
 r(g,x-2,y-2,27,35,'#694f37');r(g,x,y,23,30,'#dfba7e');
 r(g,x+3,y+3,17,23,light?'#9bbd9c':'#789991');r(g,x+4,y+4,8,7,'#c9dcc0');
 r(g,x+10,y+3,3,23,'#ebd3a2');r(g,x+3,y+14,17,2,'#ebd3a2');
 r(g,x-4,y+26,31,4,'#ecc089');r(g,x-2,y+30,27,3,'#a48252');
}
function tiles(g,a,b,key,isRight){
 const col=isRight?(key==='sun'?['#9d765c','#ad8967','#c39a71','#775644']:['#797b66','#8e8b6e','#a49976','#606650']):['#715b4a','#826850','#a4825d','#594a38'];
 F(g,roofShape(a,b),col[0]);
 // Tiles are quads on the same roof surface, tapering and staggered by row.
 for(let row=0;row<7;row++){
  const f=(b-a)/7,x0=a+row*f+.45,x1=a+(row+1)*f-.45,yStart=-6+(row%2)*-8;
  for(let y=yStart,idx=0;y<74;y+=13,idx++){
   const near=Math.max(-6,y+.6),far=Math.min(74,y+12);
   if(near>=far)continue;
   const tile=[[x0,near,roofRidge(x0)],[x1,near,roofRidge(x1)],[x1,far,roofRidge(x1)],[x0,far,roofRidge(x0)]];
   F(g,tile,(idx+row*3)%4===1?col[1]:col[0]);
   F(g,[[x0,near,roofRidge(x0)],[x1,near,roofRidge(x1)],[x1,near+1.2,roofRidge(x1)],[x0,near+1.2,roofRidge(x0)]],col[2]);
  }
  F(g,[[x1,-6,roofRidge(x1)],[x1+.9,-6,roofRidge(x1+.9)],[x1+.9,74,roofRidge(x1+.9)],[x1,74,roofRidge(x1)]],col[3]);
 }
}
export function drawMusicRoom(g,key='sun'){
 const sun=key==='sun';
 g.save();
 // Raised masonry foundation, front plaster, projecting side wall and gable.
 F(g,[[-72,0,-3],[72,0,-3],[72,0,12],[-72,0,12]],'#887e61');
 F(g,[[70,0,-3],[70,68,-3],[70,68,12],[70,0,12]],'#5b6251');
 F(g,[[-70,0,12],[70,0,12],[70,0,81],[0,0,135],[-70,0,81]],sun?'#e8cc92':'#c9bb97');
 F(g,[[70,0,12],[70,68,12],[70,68,81],[70,0,81]],sun?'#a3865d':'#8d8165');
 for(let y=0;y<65;y+=13){
  F(g,[[70,y,13],[70,y+.9,13],[70,y+.9,81],[70,y,81]],'#817050');
 }
 for(let z=16;z<=81;z+=8){
  F(g,[[-70,0,z],[70,0,z],[70,0,z+1],[-70,0,z+1]],'#b095665e');
  F(g,[[70,0,z],[70,68,z],[70,68,z+1],[70,0,z+1]],'#695b423f');
 }
 for(let x=608;x<744;x+=11)r(g,x,227+(x%7<3?4:0),7,2,'#b5a779');
 for(const x of [607,737]){r(g,x,153,3,67,'#ae8655');r(g,x+1,154,1,65,'#d0a769');}
 // Side window uses the same projection as the side wall, rather than a
 // flat rectangle glued across the return.
 F(g,[[70,21,27],[70,50,27],[70,50,57],[70,21,57]],'#665840');
 F(g,[[70,24,31],[70,47,31],[70,47,53],[70,24,53]],'#8aa492');
 F(g,[[70,33,31],[70,37,31],[70,37,53],[70,33,53]],'#d0ac72');
 F(g,[[70,24,40],[70,47,40],[70,47,43],[70,24,43]],'#d0ac72');
 F(g,[[72,19,28],[72,52,28],[70,53,31],[70,18,31]],'#c39661');
 wallWindow(g,617,170,sun);wallWindow(g,711,170,sun);
 const d=MUSIC_ROOM_DOOR;
 r(g,d.x,d.y,d.w,d.h,'#70583c');r(g,d.x+3,d.y+3,d.w-6,d.h-3,'#c39b65');
 r(g,d.x+7,d.y+7,d.w-14,d.h-7,'#526d57');
 for (const y of [181,204]){r(g,663,y,26,17,'#395445');r(g,665,y+2,22,12,'#668369');}
 r(g,686,203,4,3,'#e8be67');r(g,d.x-3,d.y+d.h,d.w+6,4,'#c6b38a');r(g,d.x,d.y+d.h,d.w,1,'#f0d6a3');
 // A round, pixel-stepped attic window under the gable peak.
 face(g,[[670,132],[682,132],[686,138],[686,148],[681,153],[670,153],[665,148],[665,138]],'#755e42');
 face(g,[[671,136],[680,136],[682,139],[682,147],[679,150],[672,150],[669,147],[669,139]],'#91ab90');
 r(g,674,137,2,12,'#e4cf9d');r(g,669,142,13,2,'#e4cf9d');
 // Sloped eaves have visible thickness at the front and along the right.
 tiles(g,-79,0,key,false);tiles(g,0,79,key,true);
 F(g,[[0,-6,142],[79,-6,84],[79,-6,78],[0,-6,136],[-79,-6,78],[-79,-6,84]],'#5b533d');
 F(g,[[0,-7,143],[79,-7,85],[79,-7,83],[0,-7,141],[-79,-7,83],[-79,-7,85]],sun?'#e1bd7e':'#bdab7c');
 F(g,roofShape(-1.8,1.8,-7,74,1),'#a89363');
 F(g,[[79,-6,84],[79,74,84],[79,74,78],[79,-6,78]],'#5c5944');
 // Chimney: shaded front face, lit return and cap sit on the same roof.
 F(g,[[-18,49,130],[-6,49,138],[-6,49,146],[-18,49,146]],'#9b654c');
 F(g,[[-6,49,138],[-6,62,138],[-6,62,146],[-6,49,146]],'#b9845c');
 F(g,chimney,'#d1a879');
 g.restore();
}
