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
 for(let x=595;x<766;x+=18){r(g,x,141,2,86,'#cebd96');r(g,x+2,143,1,81,'#e9dbb6');}
 r(g,580,128,6,109,'#9b815e');r(g,772,128,4,109,'#796b50');
 r(g,580,232,196,7,'#9c8967');r(g,586,232,184,2,'#c9b48a');
 // The former green stepped roof, now with a few broken shingle accents.
 for(const band of ROOF_BANDS)r(g,...band);
 for(const[x,y,w]of[[607,81,18],[648,81,22],[710,81,14],[592,96,22],[633,96,14],[688,96,27],[742,96,15],[582,110,15],[620,110,27],[675,110,19],[732,110,24]])r(g,x,y,w,2,'#a0b18a');
 r(g,560,124,236,4,'#465e50');r(g,570,124,215,1,'#8f9e77');
 // Little masonry chimney, intentionally quiet and without perpetual smoke.
 r(g,718,45,23,39,'#a48e70');r(g,718,45,5,39,'#c1a987');r(g,714,40,31,6,'#dec9a2');
 r(g,726,53,15,2,'#8f7c63');r(g,718,65,14,2,'#8f7c63');r(g,732,73,9,2,'#8f7c63');
 // South-facing town door. The outdoor stand remains the sole practice trigger.
 const d=MUSIC_ROOM_DOOR;r(g,d.x,d.y,d.w,d.h,'#8e7858');r(g,d.x+5,d.y+5,d.w-10,d.h-5,'#536d58');
 r(g,660,176,2,53,'#819475');r(g,665,183,24,17,'#607b63');r(g,665,207,24,20,'#4b6553');
 r(g,687,203,3,3,'#e0bb6f');r(g,d.x-2,d.y+d.h,d.w+4,5,'#d3bd90');
 for(const x of[601,720]){
  r(g,x,158,34,42,'#8e7b5d');r(g,x+3,161,28,34,'#92b5a5');r(g,x+4,162,12,15,'#b8cfb9');r(g,x+20,183,9,10,'#7b9e90');
  r(g,x+15,160,3,36,'#ecdfb9');r(g,x+2,177,30,3,'#ecdfb9');r(g,x-3,199,40,5,'#b49a70');r(g,x-3,199,40,1,'#e0c79a');
 }
 // A small hanging music-note plaque, recognizable without tiny text.
 r(g,648,143,56,16,'#b59b73');r(g,650,145,52,12,'#dac8a0');
 r(g,674,147,2,7,'#657c5f');r(g,676,147,5,2,'#657c5f');r(g,671,153,5,2,'#657c5f');
 g.restore();
}
