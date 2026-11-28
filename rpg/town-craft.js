// Hand-placed surface details. No collision, new state or path changes.
export function addCabinAndPondCraft({box,sphere,shape},room){
 const cx=room.x+96,fr=room.depth-2,cy=fr-38,leaf='#748e60',sun='#9aa971',clay='#9c7151';
 // A narrow rain gutter follows either eave. The outer rim hides its channel
 // from a distance; brackets hold it below the roof rather than on the wall.
 for(const side of [-1,1]){
  const x=cx+side*83;
  box(x,81.2,cy,2.1,1.10,102,'#947454');
  box(x+side*1.1,82.0,cy,1.0,1.42,102,'#ad8960');
  for(const z of [cy-35,cy-9,cy+19,cy+43])box(x-side*.47,80.55,z,2.7,1.0,1.6,'#79674d');
  box(x+side*1.4,80.8,cy+49,2.6,1.25,3,'#a17e58');
 }
 for(const [side,n] of [[-1,5],[1,4]]){
  const x=cx+side*45,z=fr+8;
  box(x,26,z,25,6,7,'#86684e');box(x,29,z,27,1.7,8.6,'#b59365');
  box(x,27.5,z+3.8,24,.9,.8,'#c2a275');
  for(const u of [-8,8])box(x+u,23,z-1,2,4,3,'#725c43');
  for(let j=0;j<n;j++){
   const u=(j-(n-1)/2)*4.6,h=30+(j*7+(side>0?2:0))%5;
   sphere(x+u,h,z+1+(j%2)*1.7,2.8,3.7,2.4,j%2?leaf:sun);
   if(j===1||j===n-1)sphere(x+u+.6,h+2.8,z+2.1,1.8,1.45,1.7,side<0?'#e7cba9':'#dfbcac');
  }
 }
 for(const [x,z,s] of [[cx-48,fr+13,1],[cx-56,fr+16,.7]]){
  shape('trunk',x,3.1*s,z,6.2*s,6.1*s,6.2*s,clay);
  sphere(x,6.1*s,z,3.5*s,.7*s,3.5*s,'#b79b75');sphere(x+.7,7.2*s,z,2.4*s,1.9*s,2.3*s,leaf);
 }
 for(const [x,z,h,lean] of [[44,455,13,-.32],[47,459,17,.18],[43,462,11,-.19],[241,505,15,.23],[244,508,19,.34],[246,511,11,.20]]){
  shape('cone',x,h*.46,z,.9,h,1.15,leaf,0,0,lean);
  shape('trunk',x+lean*h*.50,h*.88,z,1.65,3.8,1.65,'#8b7650',0,0,lean);
 }
 for(const [x,z,a,yaw] of [[38,492,4.7,.22],[40,498,3.5,.74],[251,423,4.8,-.3],[246,428,3.0,.41]]){
  sphere(x,2.45,z,a,.36,a*.72,'#82966e',0,yaw);box(x+.2,2.8,z+.3,a*.67,.17,.44,'#abb284',0,yaw);
 }
 sphere(38,3.7,492,2.2,1.15,2,'#edd7b0');sphere(38,4.35,492,1.1,.41,1.0,'#c8a977');
}
export function addBenchGardenCraft({box,sphere,shape},stand){
 // Support pins are above the wood by a fraction; nothing raises the seat itself.
 for(const z of [205,211,217,223]){
  for(const x of [188.5,311.5])sphere(x,31.67,z,.85,.18,.85,'#79674d');
  for(const [x,w,n] of [[204,8,0],[245,14,1],[283,10,2]])box(x+(z%4)*2,31.59,z-.57,w,.12,.35,
   n%2?'#dec085':'#bc975e',0,(z%3-1)*.035);
 }
 for(const y of [38,47,55]){
  for(const x of [188.5,311.5])sphere(x,y+.65,198.10,.70,.82,.17,'#8a6a4c');
  for(const [x,o,w] of [[216,1.08,12],[268,-.29,18],[293,1.0,7]])box(x+((y%7)-3)*1.25,y+o,198.10,w,.38,.12,'#c59663',0,0,(y%4-2)*.025);
 }
 // A pocket notebook, paper edges and a pencil tucked beside the table.
 box(478,30.75,224,9,1.15,6,'#826350',0,-.19);box(478,31.34,224,8.7,.55,5.5,'#e3cda7',0,-.19);
 box(478,31.79,224,9,.58,6,'#8c6853',0,-.19);box(477.5,32.13,223.6,4.8,.09,2.4,'#b29270',0,-.19);
 box(486,30.53,224,6.8,.76,.78,'#c09966',0,.4);box(489.2,30.57,222.8,1,.62,.70,'#685542');
 // Tiny metal corner pins and layers of paper on the music stand.
 for(const s of [-1,1]){
  sphere(stand.x+s*17,41,stand.y+4,.72,.72,.28,'#ba9e74');
  sphere(stand.x+s*17,47,stand.y+4,.72,.72,.28,'#b8996f');
 }
 // A few low wild plants skirt the uneven planting region.
 for(const [x,z,r] of [[735,414,4],[736,502,6],[905,409,5],[908,508,4],[727,501,3],[912,495,6]]){
  sphere(x,2.3,z,r,1.15,r*.69,'#82965f');
  for(let j=0;j<3;j++)shape('cone',x+(j-1)*r*.44,2+j*.53,z+j*.7,.7,3+j*.8,.63,j%2?'#a2b27b':'#708951',.13,0,(j-1)*.32);
 }
}
