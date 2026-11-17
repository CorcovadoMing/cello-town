// Original music-room identity recovered from pre-8d8b4b4 town art.
// The portal controller uses the same doorway and landing bounds as the art.
export const MUSIC_ROOM=Object.freeze({x:580,y:126,w:196,h:113,depth:239});
export const MUSIC_ROOM_DOOR=Object.freeze({x:MUSIC_ROOM.x+73,y:MUSIC_ROOM.y+43,w:46,h:63});
const doorCenter=MUSIC_ROOM_DOOR.x+MUSIC_ROOM_DOOR.w/2;
// Lay the ground under the front wall and the separated wooden treads.
// The wall draws over that overlap; landing and collision geometry stay put.
const soilStart=MUSIC_ROOM.depth-4;
export const MUSIC_ROOM_APPROACH=Object.freeze({centerX:doorCenter,landing:Object.freeze({x:doorCenter-32,y:MUSIC_ROOM.depth+4,w:64,h:20}),soil:Object.freeze({x:doorCenter-38,y:soilStart,w:76,h:298-soilStart})});
const ROOF_BANDS=[[560,114,236,12,'#526c5b'],[572,100,211,14,'#62806a'],[587,86,181,14,'#759175'],[603,73,150,13,'#89a17f'],[620,62,116,11,'#9db18c'],[618,60,120,3,'#c0c69b']];
export function musicRoomRainCanopy(){const columns=new Float32Array(236);columns.fill(Infinity);for(const[x,y,w]of ROOF_BANDS)for(let k=x;k<x+w;k++)columns[k-560]=Math.min(columns[k-560],y);for(let x=714;x<745;x++)columns[x-560]=40;return {kind:'roof',left:560,columns,groundMin:126,groundMax:239};}
export function roomBlocks(x,y){return x>=580&&x<=776&&y>=126&&y<=239;}
const r=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
export function drawMusicRoom(g){
 g.save();
 // Subtle foundation, cream timber and shaded side post. Flat pixel clusters.
 r(g,576,238,206,5,'#65744b33');r(g,580,126,196,113,'#8d775b');
 r(g,586,128,184,105,'#e0d0a6');r(g,586,132,184,5,'#c5b48c');
 for(let x=595,i=0;x<766;x+=18,i++){
  r(g,x,141,2,86,'#cebd96');r(g,x+2,143,1,81,'#e9dbb6');
  // Restrained long grain and short knots, never noisy individual pixels.
  r(g,x+7,145+(i%3)*9,1,19+i%2*8,'#d4c39b');
  r(g,x+9,211-(i%2)*7,1,13,'#d4c39b');
  if(i%3===1){r(g,x+5,216,4,1,'#c7b48a');r(g,x+6,215,2,3,'#d2bf95');}
 }
 // Layered carved cornice, quiet dado rail and pegged structural posts.
 r(g,586,137,184,3,'#ebddb6');r(g,586,140,184,2,'#b5a27d');
 r(g,586,218,184,3,'#d1bd92');r(g,586,221,184,1,'#bba57e');
 for(const x of[582,770]){r(g,x,138,3,90,'#b69a73');r(g,x,140,1,86,'#d2ba8e');for(const y of[145,219])r(g,x+1,y,2,2,'#846f51');}
 r(g,580,128,6,109,'#9b815e');r(g,772,128,4,109,'#796b50');
 r(g,580,232,196,7,'#9c8967');r(g,586,232,184,2,'#c9b48a');
 // Hand-laid sage shingles keep every original roof-band silhouette. The
 // staggered joints, broad lit lips and lower bevels read as joined material.
 for(const band of ROOF_BANDS)r(g,...band);
 for(let row=0;row<ROOF_BANDS.length-1;row++){
  const [x,y,w,h]=ROOF_BANDS[row],step=23+(row%2)*3;
  for(let sx=x+5+(row%2)*11,i=0;sx<x+w-5;sx+=step,i++){
   const width=Math.min(step-3,x+w-4-sx);if(width<5)continue;
   r(g,sx,y+2,width,2,['#829777','#91a47f','#a1b18a','#b0bc94','#bdc59e'][row]);
   r(g,sx+width,y+3,1,h-5,['#435f50','#526e59','#647f64','#78926e','#8ba07a'][row]);
   if((i+row)%3!==1)r(g,sx+3,y+h-3,Math.max(3,width-6),1,['#617d60','#718c6a','#839c73','#95ab7f','#a4b78b'][row]);
  }
 }
 r(g,560,124,236,4,'#465e50');r(g,570,124,215,1,'#8f9e77');
 r(g,581,128,194,2,'#738366');
 for(const x of[589,638,709,758]){r(g,x,130,5,5,'#a38c65');r(g,x+1,130,3,2,'#d5c091');}
 // Little masonry chimney, intentionally quiet and without perpetual smoke.
 r(g,718,45,23,39,'#a48e70');r(g,718,45,5,39,'#c1a987');r(g,714,40,31,6,'#dec9a2');
 r(g,738,47,3,37,'#8d7a62');r(g,715,40,29,2,'#ebd9b4');r(g,718,46,23,2,'#89765d');
 for(const y of[55,65,75]){r(g,723,y,15,1,'#c5ad88');r(g,724+(y===65?7:0),y-7,1,7,'#8f7c63');}
 r(g,720,49,2,31,'#cdb58f');
 // South-facing town door. The outdoor stand remains the sole practice trigger.
 const d=MUSIC_ROOM_DOOR;r(g,d.x,d.y,d.w,d.h,'#8e7858');r(g,d.x+5,d.y+5,d.w-10,d.h-5,'#536d58');
 r(g,d.x+1,d.y+1,d.w-2,3,'#d1b98d');r(g,d.x+1,d.y+4,2,d.h-5,'#c5ad80');
 r(g,660,176,2,53,'#99ab85');
 for(const[y,h]of[[181,20],[206,21]]){r(g,664,y,26,h,'#3e5b4a');r(g,665,y+1,24,h-2,'#66836a');r(g,667,y+3,20,h-6,'#526e58');r(g,667,y+h-4,20,1,'#7f9675');}
 r(g,691,176,2,53,'#385441');
 r(g,687,203,3,3,'#e0bb6f');r(g,d.x-2,d.y+d.h,d.w+4,5,'#d3bd90');
 for(const x of[601,720]){
  // Deep timber recess, four quiet glass planes and a projecting sill.
  r(g,x-2,156,38,46,'#b39a72');r(g,x-1,157,36,44,'#ead9af');
  r(g,x,158,34,42,'#796a52');r(g,x+3,161,28,34,'#8eae9d');
  r(g,x+4,162,11,14,'#c4d7bc');r(g,x+18,162,12,14,'#abc5ad');
  r(g,x+4,180,11,14,'#9dbca7');r(g,x+18,180,12,14,'#7f9f90');
  // Small upper glints remain broad stepped pixels, not sharp diagonal streaks.
  r(g,x+5,163,7,2,'#dce5cb');r(g,x+19,163,6,1,'#cbdcc0');
  r(g,x+15,160,3,36,'#ecdfb9');r(g,x+2,177,30,3,'#ecdfb9');
  r(g,x+17,161,1,15,'#b4ad88');r(g,x+3,180,27,1,'#789385');
  r(g,x-3,199,40,5,'#b49a70');r(g,x-3,199,40,2,'#e0c79a');r(g,x-1,204,36,2,'#ab916b');
  for(const side of[-1,1]){const sx=side<0?x-9:x+36;r(g,sx,160,6,37,'#6b8160');r(g,sx,160,5,2,'#a1b087');for(const y of[167,175,183,191])r(g,sx+1,y,4,1,'#8fa17a');}
 }
 // A small hanging music-note plaque, recognizable without tiny text.
 r(g,648,143,56,16,'#9d825e');r(g,649,143,54,2,'#e6d1a3');r(g,650,145,52,12,'#dac8a0');r(g,651,156,50,1,'#bba077');for(const x of[653,699])r(g,x,147,2,2,'#ac9269');
 r(g,674,147,2,7,'#657c5f');r(g,676,147,5,2,'#657c5f');r(g,671,153,5,2,'#657c5f');
 g.restore();
}
