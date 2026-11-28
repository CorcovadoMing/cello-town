/** Temporary, reversible performance-only polish. No camera/outdoor changes. */
export function decoratePerformanceRoom(T, scene) {
  const group = new T.Group(); group.name = 'performance-room-polish'; scene.add(group);
  const architecture=new T.Group();architecture.name='performance-wall-completion';group.add(architecture);
  const extensions=[];
  // Complete the two existing cutaway walls without moving their surfaces or
  // altering their original material. Vertical UVs continue at world density.
  for(const name of ['rear-wall-grounded','side-wall-grounded']){
    const source=scene.getObjectByName(name),p=source?.geometry?.parameters;if(!p)continue;
    const rear=source.userData.permanentRearSegment;
    const spans=rear?[{min:source.position.z-p.depth/2,max:rear.maxZ,base:rear.top},{min:rear.maxZ,max:source.position.z+p.depth/2,base:source.position.y+p.height/2}]:[{min:source.position.z-p.depth/2,max:source.position.z+p.depth/2,base:source.position.y+p.height/2}];
    spans.filter(span=>span.max-span.min>1e-6).forEach((span,index)=>{
      const g=new T.BoxGeometry(p.width,1,span.max-span.min),wall=new T.Mesh(g,source.material);
      wall.name=name+'-performance-extension'+(rear?(index?'':'-rear-cap'):'');wall.position.copy(source.position);wall.position.z=(span.min+span.max)/2;
      if(rear){const uv=g.attributes.uv,pos=g.attributes.position;for(let i=0;i<8;i++){const z=pos.getZ(i)+wall.position.z;uv.setX(i,i<4?(source.position.z+p.depth/2-z)/p.depth:(z-source.position.z+p.depth/2)/p.depth);}}
      wall.receiveShadow=source.receiveShadow;wall.castShadow=false;wall.raycast=()=>{};wall.renderOrder=source.renderOrder;architecture.add(wall);
      extensions.push({wall,base:span.base,bottom:source.position.y-p.height/2,originalHeight:source.userData.plasterOriginalHeight||p.height});
    });
  }
  const mountMaterial=new T.MeshStandardMaterial({color:0xb6a17b,metalness:.48,roughness:.42,transparent:true,opacity:0});
  const mounts=new T.Group();mounts.name='curtain-wall-mounts';group.add(mounts);
  function mountMesh(g,name,pos){const m=new T.Mesh(g,mountMaterial);m.name=name;m.position.copy(pos);m.castShadow=false;m.raycast=()=>{};mounts.add(m);return m;}
  const replaced=[];
  scene.traverse(o=>{
    if(!o.isMesh || !o.name?.startsWith('curtain') || !o.material) return;
    const old=o.material;
    const restyle=m=>{const n=m.clone(); if(n.roughness!==undefined)n.roughness=.76; if(n.metalness!==undefined)n.metalness=0;
      if(o.name==='curtain-rod' || /tieback|tassel/.test(o.name)){n.color?.set('#b6a17b'); if(n.metalness!==undefined)n.metalness=.42;if(n.roughness!==undefined)n.roughness=.40;}
      return n;};
    o.material=Array.isArray(old)?old.map(restyle):restyle(old);replaced.push([o,old,o.material]);
  });
  const brass=new T.MeshStandardMaterial({color:0xb6a17b,metalness:.48,roughness:.42});
  const rod=scene.getObjectByName('curtain-rod');
  if(rod){rod.updateWorldMatrix(true,false);const b=new T.Box3().setFromObject(rod),c=b.getCenter(new T.Vector3());
    const rear=scene.getObjectByName('rear-wall-grounded');
    if(rear){rear.updateWorldMatrix(true,false);const rearBounds=new T.Box3().setFromObject(rear),wallZ=rearBounds.max.z;
      for(const [side,x] of [['left',b.min.x+.10],['right',b.max.x-.10]]){
        // Rosette is flush to plaster, a returned arm reaches the existing rod.
        const plate=mountMesh(new T.CylinderGeometry(.054,.054,.016,24),'curtain-mount-'+side+'-rosette',new T.Vector3(x,c.y,wallZ+.008));plate.rotation.x=Math.PI/2;
        const start=new T.Vector3(x,c.y,wallZ+.016),end=new T.Vector3(x,c.y,c.z);
        const arm=mountMesh(new T.CylinderGeometry(.012,.012,start.distanceTo(end),12),'curtain-mount-'+side+'-return',start.clone().add(end).multiplyScalar(.5));
        arm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());
        arm.userData.wallAnchor=start.toArray();arm.userData.rodAnchor=end.toArray();
        const saddle=mountMesh(new T.TorusGeometry(.027,.008,8,20),'curtain-mount-'+side+'-saddle',end);saddle.rotation.y=Math.PI/2;
      }
    }
    for(const x of [b.min.x,b.max.x]) {const m=new T.Mesh(new T.SphereGeometry(.029,16,8),brass);m.scale.set(1.15,1,1);m.position.set(x,c.y,c.z);group.add(m);}
    for(const side of [0,1])for(let k=0;k<6;k++){const x=side?b.max.x-.065-k*.063:b.min.x+.065+k*.063;
      const m=new T.Mesh(new T.TorusGeometry(.023,.0045,6,16),brass);m.rotation.y=Math.PI/2;m.position.set(x,c.y-.012,c.z);group.add(m);}
  }
  // Deliberately low-energy close fill preserves the established sage/ivory palette.
  const warm=new T.PointLight(0xffd6a0,.22,4.4,2);warm.name='window-warm-fill';warm.position.set(-1.25,2.55,-1.79);group.add(warm);
  // The 025 feathered golden texture, now attached to the real aperture,
  // not painted on the unrelated left wall. All four vertices follow sunlight.
  const cv=document.createElement('canvas');cv.width=cv.height=256;const ctx=cv.getContext('2d');
  const img=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const u=x/255,v=y/255,phase=(v+.42*u)*Math.PI*4.2;
    const band=Math.pow(Math.max(0,Math.sin(phase)),.40),edge=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
    const i=(y*256+x)*4;img.data[i]=255;img.data[i+1]=218;img.data[i+2]=161;img.data[i+3]=Math.round(255*band*Math.max(0,edge));
  }ctx.putImageData(img,0,0);
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
  const mat=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.23,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  const light=scene.getObjectByName('window-sunlight');
  const ray=light ? light.target.position.clone().sub(light.position).normalize() : new T.Vector3(.3,-.8,1).normalize();
  // At y=2.42 both ends are safely inside the original arched opening.
  const a=new T.Vector3(-1.87,2.42,-2.025),b=new T.Vector3(-.63,2.42,-2.025);
  const travel=1.50/ray.z,c=b.clone().addScaledVector(ray,travel),d=a.clone().addScaledVector(ray,travel);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([...a.toArray(),...b.toArray(),...c.toArray(),...d.toArray()],3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
  const shaft=new T.Mesh(geometry,mat);shaft.name='window-aperture-golden-rays';shaft.renderOrder=12;shaft.raycast=()=>{}; // Decorative light never intercepts room interaction.
  shaft.userData.apertureAnchors=[a.toArray(),b.toArray()];shaft.userData.sunDirection=ray.toArray();
  shaft.userData.lightDesign='025 feathered texture, real aperture + world sunlight extrusion';group.add(shaft);
  function updatePresentation(amount){
    const t=Math.max(0,Math.min(1,amount));architecture.visible=mounts.visible=t>0;
    mountMaterial.opacity=t;
    for(const {wall,base,bottom,originalHeight} of extensions){
      const h=Math.max(.00001,(7-base)*t);wall.scale.y=h;wall.position.y=base+h/2;
      const uv=wall.geometry.attributes.uv;
      for(const face of [0,1,4,5])for(let j=0;j<4;j++){
        const i=face*4+j,top=j<2;uv.setY(i,(base+(top?h:0)-bottom)/originalHeight);
      }uv.needsUpdate=true;
    }
  }
  updatePresentation(0);
  function dispose(){for(const[o,old,tmp]of replaced){o.material=old;for(const m of(Array.isArray(tmp)?tmp:[tmp]))m.dispose();}
    group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();}});scene.remove(group);brass.dispose();mountMaterial.dispose();mat.dispose();tex.dispose();};
  dispose.updatePresentation=updatePresentation;return dispose;
}

/** Permanent rear west-wall joinery. Same objects in room and close-up. */
export function installWestRoomDetail(T,scene){
 const source=scene.getObjectByName('side-wall-grounded');if(!source)return null;
 const p=source.geometry.parameters,minZ=source.position.z-p.depth/2,maxZ=source.position.z+p.depth/2,top=3.115,base=source.position.y+p.height/2;
 source.userData.permanentRearSegment={minZ,maxZ,top};
 const group=new T.Group();group.name='west-wall-clock-nook';scene.add(group);
 // Replace the original low box with one uninterrupted full-height surface.
 // UV density remains that of the old plaster; no coincident seam at mid-wall.
 const bottom=source.position.y-p.height/2,geo=new T.BoxGeometry(p.width,top-bottom,p.depth),uv=geo.attributes.uv;
 for(const face of [0,1,4,5])for(let i=face*4;i<face*4+4;i++)uv.setY(i,uv.getY(i)*(top-bottom)/p.height);
 const previousGeometry=source.geometry;source.geometry=geo;source.position.y=(bottom+top)/2;previousGeometry.dispose();
 source.userData.plasterOriginalHeight=p.height;source.userData.fullPermanentWall=true;
 source.castShadow=false;const wall=source;
 const clock=new T.Group();clock.name='west-cottage-pendulum-clock';clock.position.set(-2.99,2.32,-1.73);clock.rotation.y=Math.PI/2;group.add(clock);
 const wood=new T.MeshStandardMaterial({color:'#a47a50',roughness:.72}),sage=new T.MeshStandardMaterial({color:'#a8b7a0',roughness:.75}),ivory=new T.MeshStandardMaterial({color:'#f5eacb',roughness:.82}),brass=new T.MeshStandardMaterial({color:'#c4a66e',roughness:.44,metalness:.25}),ink=new T.MeshStandardMaterial({color:'#665443',roughness:.8});
 function add(g,m,x,y,z,name,parent=clock){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=false;o.receiveShadow=true;o.raycast=()=>{};parent.add(o);return o;}
 function disk(r,depth,m,x,y,z,name){const o=add(new T.CylinderGeometry(r,r,depth,48),m,x,y,z,name);o.rotation.x=Math.PI/2;return o;}
 // A round natural-wood face and softly rounded little pendulum tail.
 const shape=new T.Shape();shape.moveTo(-.14,.03);shape.lineTo(-.14,-.23);shape.quadraticCurveTo(-.14,-.36,0,-.36);shape.quadraticCurveTo(.14,-.36,.14,-.23);shape.lineTo(.14,.03);shape.closePath();
 add(new T.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3,steps:1}),wood,0,0,.008,'clock-rounded-pendulum-case');
 disk(.247,.105,wood,0,.095,.0525,'clock-round-wood-case');disk(.218,.014,sage,0,.095,.111,'clock-sage-rim');disk(.183,.005,ivory,0,.095,.121,'clock-cream-dial');
 const slot=add(new T.SphereGeometry(1,24,16),sage,0,-.225,.100,'clock-pendulum-inset');slot.scale.set(.092,.101,.006);
 add(new T.BoxGeometry(.012,.115,.012),brass,0,-.19,.116,'clock-pendulum-stem');const bob=add(new T.SphereGeometry(.040,20,12),brass,0,-.258,.121,'clock-pendulum-bob');bob.scale.z=.25;
 for(let n=0;n<12;n++){const a=n*Math.PI/6;const marker=add(new T.SphereGeometry(n%3===0?.010:.006,12,8),ink,Math.sin(a)*.155,.095+Math.cos(a)*.155,.127,'clock-dot-'+n);marker.scale.z=.25;}
 function hand(length,angle,width,name){const h=add(new T.BoxGeometry(width,length,.004),ink,Math.sin(angle)*length/2,.095+Math.cos(angle)*length/2,.133,name);h.rotation.z=-angle;}
 hand(.085,-.8,.013,'clock-hour-hand');hand(.132,.8,.008,'clock-minute-hand');disk(.013,.005,brass,0,.095,.138,'clock-spindle');
 // Separate true wall-mounted half-pot; the existing floor plant is not reused.
 const plant=new T.Group();plant.name='west-wall-trailing-planter';plant.position.set(-2.99,2.35,-.68);plant.rotation.y=Math.PI/2;group.add(plant);
 const clay=new T.MeshStandardMaterial({color:'#c79e83',roughness:.9}),leafMat=new T.MeshStandardMaterial({color:'#839b75',roughness:.9}),leafLight=new T.MeshStandardMaterial({color:'#a6b88a',roughness:.9});
 const plate=add(new T.BoxGeometry(.13,.15,.012),wood,0,.04,.006,'wall-planter-flush-backplate',plant);
 const pot=add(new T.SphereGeometry(1,24,12,0,Math.PI,Math.PI/2,Math.PI/2),clay,0,.04,.012,'wall-planter-ceramic-pocket',plant);pot.scale.set(.145,.14,.14);
 // A visible brass mounting button fixes the ornament to its flush backplate.
 const button=add(new T.SphereGeometry(.018,12,8),brass,0,.14,.025,'wall-planter-mount',plant);button.scale.z=.35;
 for(let strand=0;strand<3;strand++){
   const points=[];for(let k=0;k<6;k++)points.push(new T.Vector3((strand-1)*.077+Math.sin(k*.9+strand)*.025,.055-k*(strand===1?.082:.063),.12+Math.sin(k*.7)*.017));
   add(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.006,6,false),leafMat,0,0,0,'wall-planter-vine-'+strand,plant);
   points.forEach((v,k)=>{if(!k)return;for(const side of[-1,1]){const leaf=add(new T.SphereGeometry(1,12,8),k%2?leafMat:leafLight,v.x+side*.027,v.y+.010,v.z+.008,'wall-planter-leaf',plant);leaf.scale.set(.039,.061,.012);leaf.rotation.z=-side*.65;}});
 }
 group.userData.wallSegment={minZ,maxZ,base:bottom,top};clock.userData.wallBackX=-2.990;clock.userData.permanent=true;plant.userData.wallBackX=-2.990;plant.userData.wallMounted=true;
 return {group,clock,wall,plant};
}


/** Authored experimental room joinery. Existing room objects keep their picking
 * geometry; all added surfaces are deliberately non-interactive. */
export function installRoomMaterialArt(T,scene,{plants=[],rug=null,table=null}={}){
 const art=new T.Group();art.name='authored-room-material-art';scene.add(art);
 const fixed=(geometry,material,name,parent=art)=>{
  const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.raycast=()=>{};
  mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const finish=(color,roughness=.82,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
 const put=(part,x,y,z)=>{part.position.set(x,y,z);return part;};
 const bake=(name,parts,material,parent=art)=>{
  const positions=[],uvs=[],normals=[];
  const vertex=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3(),matrix=new T.Matrix4();
  for(const [geometry,x,y,z,rot=0] of parts){
   matrix.makeRotationY(rot).setPosition(x,y,z);normalMatrix.getNormalMatrix(matrix);
   const a=geometry.attributes,n=geometry.index,rows=n?n.count:a.position.count;
   for(let j=0;j<rows;j++){
    const i=n?n.getX(j):j;
    vertex.fromBufferAttribute(a.position,i).applyMatrix4(matrix);
    normal.fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize();
    positions.push(...vertex.toArray());normals.push(...normal.toArray());uvs.push(a.uv.getX(i),a.uv.getY(i));
   }
   geometry.dispose();
  }
  const merged=new T.BufferGeometry();
  merged.setAttribute('position',new T.Float32BufferAttribute(positions,3));merged.setAttribute('normal',new T.Float32BufferAttribute(normals,3));merged.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  return fixed(merged,material,name,parent);
 };
 const box=(x,y,z,w,h,d)=>[new T.BoxGeometry(w,h,d),x,y,z];
 // Wall panelling is lower than the sill and sits inside the existing wall
 // envelopes. Long rails and stiles use three batches, not one draw per slat.
 const back=[],face=[],edge=[];
 for(const [x,w] of [[-1.50,2.78],[1.50,2.78]]){
  back.push(box(x,.436,-2.279,w,.456,.010));
  edge.push(box(x,.673,-2.264,w,.067,.026));
  face.push(box(x,.710,-2.251,w,.019,.032));
 }
 for(const x of [-2.89,-2.26,-1.63,-1,-.37,.36,1,1.63,2.26,2.89]){
  edge.push(box(x,.430,-2.265,.031,.460,.015));
 }
 back.push(box(-2.986,.422,.045,.008,.43,4.43));
 edge.push(box(-2.969,.648,.045,.022,.057,4.43));
 face.push(box(-2.955,.683,.045,.027,.016,4.43));
 for(let i=0;i<8;i++)edge.push(box(-2.973,.424,-2.12+i*.61,.017,.43,.025));
 bake('sage-inset-wainscot-fields',back,finish('#aaa98a'));
 bake('olive-timber-wainscot-stiles',edge,finish('#9c9c7b'));
 bake('ivory-wainscot-cap-bead',face,finish('#e2d0aa',.70));

 // A pair of small, painted botanical studies sits flush to the west wall.
 // Existing room / performance cameras and walkable space never move.
 const mount=[],moulding=[],lip=[];
 const studies=[{z:-.02,y:1.42,w:.44,h:.53},{z:.48,y:1.32,w:.31,h:.40}];
 for(const {z,y,w,h} of studies){
  mount.push(box(-2.964,y,z,.018,h,w));
  for(const side of [-1,1]){
   moulding.push(box(-2.949,y+side*(h-.017)*.5,z,.026,.017,w));
   moulding.push(box(-2.949,y,z+side*(w-.017)*.5,.026,h-.034,.017));
   lip.push(box(-2.934,y+side*(h-.044)*.5,z,.007,.005,w-.036));
   lip.push(box(-2.934,y,z+side*(w-.044)*.5,.007,h-.036,.005));
  }
 }
 bake('botanical-wall-mounts',mount,finish('#423c31'));
 bake('botanical-walnut-moulding',moulding,finish('#78543b',.70));
 bake('botanical-faded-gilt-lip',lip,finish('#c19c60',.65));
 if(typeof document!=='undefined')studies.forEach(({z,y,w,h},j)=>{
  const paper=document.createElement('canvas');paper.width=144;paper.height=184;
  const c=paper.getContext('2d');if(!c)return;
  const wash=c.createLinearGradient(0,0,144,184);
  wash.addColorStop(0,'#eee3ca');wash.addColorStop(.55,'#e1d0aa');wash.addColorStop(1,'#c3ab84');
  c.fillStyle=wash;c.fillRect(0,0,144,184);
  c.strokeStyle='#80614166';c.lineWidth=1;c.strokeRect(9,9,126,166);
  for(let i=0;i<80;i++){
   const u=(i*39.73)%144,v=(i*i*11.23)%184;
   c.fillStyle=i%2?'#a78a6430':'#faf2df42';c.fillRect(u,v,2+i%8,1);
  }
  const col=j?'#71866b':'#74845c',hue=j?'#ba8159':'#7e8756';
  c.lineCap='round';c.strokeStyle='#6d7550';c.lineWidth=2;
  c.beginPath();c.moveTo(69,148);c.quadraticCurveTo(60,103,82,42);c.stroke();
  for(let i=0;i<8;i++){
   const t=i/7,x=66+t*t*16,y=140-11.9*i,b=j?13:22;
   for(const side of [-1,1]){
    const dx=b*side*(1-t*.47);
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dx*.29,y-13,x+dx,y-15-side*2);
    c.quadraticCurveTo(x+dx*.64,y-2,x,y);c.fillStyle=(i+side)%3===0?hue:col;c.fill();
    c.strokeStyle='#ded4a864';c.lineWidth=.65;
    c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*.77,y-12);c.stroke();
   }
  }
  for(let i=0;i<3;i++){const x=82+Math.cos(i*2.1)*5,y=41+Math.sin(i*2.1)*5;c.fillStyle=j?'#b67f57':'#998659';c.beginPath();c.ellipse(x,y,2.7,4.1,i*.9,0,Math.PI*2);c.fill();}
  c.strokeStyle='#89664475';c.lineWidth=.9;c.beginPath();c.moveTo(55,161);c.lineTo(89,161);c.moveTo(65,166);c.lineTo(79,166);c.stroke();
  const map=new T.CanvasTexture(paper);map.colorSpace=T.SRGBColorSpace;
  const image=new T.BoxGeometry(.001,h-.046,w-.046);
  put(fixed(image,finish('#fff7e6',.86,{map}),'botanical-study-paper-'+j),-2.931,y,z);
 });
 // A gathered rosette of tapered, arcing leaves has real surface normals and
 // a raised ridge; no billboard, round leaf blobs, external maps or per-frame updates.
 // Small shared ceramic atlas: a brushed slip band and iron-oxide
 // leaf cuts wrap around both vessels at the same physical height.
 // The single image also fits into the real mirror's material atlas.
 let clayBand=null;
 if(typeof document!=='undefined'){
  const paper=document.createElement('canvas');paper.width=256;paper.height=160;
  const g=paper.getContext('2d');
  if(g){
   const wash=g.createLinearGradient(0,0,0,160);
   wash.addColorStop(0,'#eacda7');wash.addColorStop(.18,'#d2a37d');
   wash.addColorStop(.67,'#b17754');wash.addColorStop(1,'#82523c');
   g.fillStyle=wash;g.fillRect(0,0,256,160);
   g.fillStyle='#8c644a';g.fillRect(0,25,256,5);g.fillRect(0,65,256,4);
   g.fillStyle='#dcb992';g.fillRect(0,30,256,35);
   g.fillStyle='#aa7857';g.fillRect(0,34,256,2);g.fillRect(0,60,256,2);
   for(let i=0;i<12;i++){
    const x=i*256/12;
    g.beginPath();g.moveTo(x+3,56);g.quadraticCurveTo(x+4,39,x+16,40);
    g.quadraticCurveTo(x+16,51,x+3,56);g.fillStyle=i%2?'#92724e':'#89755a';g.fill();
    g.strokeStyle='#e2c7a2';g.lineWidth=.85;
    g.beginPath();g.moveTo(x+5,54);g.lineTo(x+13,43);g.stroke();
   }
   for(let i=0;i<62;i++){
    const x=i*37.37%256,y=i*17.31%160;
    g.fillStyle=i%2?'#e7c29340':'#70544540';g.fillRect(x,y,1+(i%6),.55);
   }
   clayBand=new T.CanvasTexture(paper);clayBand.colorSpace=T.SRGBColorSpace;clayBand.wrapS=T.RepeatWrapping;
  }
 }
 const glaze=clayBand?[finish('#ffeddd',.71,{map:clayBand}),finish('#ebd9bc',.76,{map:clayBand})]:[finish('#bc8c70',.64),finish('#a77957',.68)];
 // Paint the lamina in its own UV coordinates: the main rib and soft,
 // upward vein arcs follow each curved leaf, not the camera or room axes.
 let leafTexture=null;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=128;
  const g=canvas.getContext('2d');
  if(g){
   const wax=g.createLinearGradient(0,0,96,0);
   [[0,'#8c9b75'],[.20,'#bbc5a3'],[.45,'#e8e9cb'],[.52,'#ced8b9'],[.82,'#aab897'],[1,'#869775']]
    .forEach(([x,c])=>wax.addColorStop(x,c));
   g.fillStyle=wax;g.fillRect(0,0,96,128);
   g.lineCap='round';
   for(let n=0;n<7;n++)for(const side of [-1,1]){
    const at=27+n*13,reach=33-(n>4?(n-4)*4:0);
    g.strokeStyle='#fbf2cb5e';g.lineWidth=.9;
    g.beginPath();g.moveTo(48,at);g.quadraticCurveTo(48+side*16,at-1,48+side*reach,at-18);g.stroke();
   }
   g.strokeStyle='#f9ecc28a';g.lineWidth=1.3;
   g.beginPath();g.moveTo(48,120);g.quadraticCurveTo(49,42,48,13);g.stroke();
   leafTexture=new T.CanvasTexture(canvas);leafTexture.colorSpace=T.SRGBColorSpace;
  }
 }
 const foliage=['#6f8b60','#839868','#97a475'].map(color=>finish(color,.61,
  {side:T.DoubleSide,...(leafTexture?{map:leafTexture}:{})}));
 const soil=finish('#766343'),vein=finish('#a6ab79',.90);
 plants.forEach((plot,k)=>{
  if(!plot)return;
  const original=plot.children.slice();for(const mesh of original)mesh.visible=false;
  const cover=new T.Group();cover.name=(k?'west':'east')+'-hand-thrown-plant';plot.add(cover);
  // Existing hidden geometry remains the exact pointer occluder.
  const r=k?.205:.235,profile=[[0,.05],[r*.66,.05],[r*.70,.075],[r*.71,.102],[r*.80,.124],[r*.86,.245],[r*.94,.438],[r,.481],[r*1.042,.491],[r*1.042,.516],[r*.95,.524],[r*.86,.513],[r*.84,.485],[r*.77,.443],[0,.444]];
  const ceramic=new T.LatheGeometry(profile.map(([x,y])=>new T.Vector2(x,y)),24);
  const rings=new T.TorusGeometry(r*.96,.008,5,24);rings.rotateX(-Math.PI/2);
  const lowerRing=new T.TorusGeometry(r*.80,.006,5,24);lowerRing.rotateX(-Math.PI/2);
  // The lathe and both wheel-thrown rims get a physical-height UV.
  // Use each source's seam-safe U, rather than atan2 across indexed faces.
  if(clayBand)for(const geometry of [ceramic,rings,lowerRing]){
   const {position,uv}=geometry.attributes,offset=geometry===rings?.499:geometry===lowerRing?.128:0;
   for(let i=0;i<uv.count;i++){
    const y=position.getY(i)+offset;
    uv.setXY(i,geometry===ceramic?uv.getX(i):uv.getY(i),T.MathUtils.clamp((y-.047)/.478,0,1));
   }
  }
  bake('ceramic-vessel-with-turned-foot',[[ceramic,0,0,0],[rings,0,.499,0],[lowerRing,0,.128,0]],glaze[k],cover);
  put(fixed(new T.CylinderGeometry(r*.85,r*.83,.012,22),soil,'soil-inlaid-below-rim',cover),0,.481,0);
  const pos=[[],[],[]],uv=[[],[],[]],index=[[],[],[]],stems=[];
  const count=k?11:13;
  for(let i=0;i<count;i++){
   const angle=i*2.399963+k*.44,radX=Math.cos(angle),radZ=Math.sin(angle),interior=i%4===0;
   const length=(k?.64:.48)+(i%5)*(k?.052:.039),half=(k?.072:.119)+(i%3)*.010;
   const twist=(i%2?1:-1)*(.11+(i%4)*.052);
   const reach=interior?.055:(k?.206:.299)+(i%3)*.025,baseY=.49+(i%4)*.019;
   const color=i%3,a=pos[color],ix=index[color],offset=a.length/3;
   const point=(s,u)=>{
    const swell=Math.pow(Math.sin(Math.PI*s),k?.79:.54)*(k?.88+s*.19:.73+s*.40);
    const asym=1+.11*u*Math.sin(s*4+angle),offset=half*swell*u*asym;
    const crown=(1-u*u)*half*.38*swell;
    const r=reach*(s*.84+s*s*.16)+.022+Math.sin(s*Math.PI)*.025;
    const arch=interior?.040:k?.34:.47;
    const y=baseY+length*(s*(interior?.99:1.03)-s*s*arch)+crown;
    return new T.Vector3(radX*r-radZ*offset,y+offset*twist,radZ*r+radX*offset);
   };
   for(let row=0;row<=8;row++)for(let col=0;col<=4;col++){
    a.push(...point(row/8,col/2-1).toArray());uv[color].push(col/4,row/8);
   }
   for(let row=0;row<8;row++)for(let col=0;col<4;col++){
    const v=offset+row*5+col;ix.push(v,v+5,v+1,v+1,v+5,v+6);
   }
   const path=new T.CatmullRomCurve3([point(.04,0),point(.29,0),point(.58,0),point(.83,0)].map(p=>p.add(new T.Vector3(0,.002,0))));
   stems.push([new T.TubeGeometry(path,6,.0026,3,false),0,0,0]);
  }
  for(let j=0;j<3;j++){
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos[j],3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv[j],2));geometry.setIndex(index[j]);geometry.computeVertexNormals();
   fixed(geometry,foliage[j],'curved-leaf-cluster-'+j,cover);
  }
  bake('fine-leaf-ribs',stems,vein,cover);
 });
 // The existing gameplay table and score do not move. A thin bead, drawer
 // hardware and small stack live under the page, within its original footprint.
 if(table){
  const drawer=[],inlay=[],books=[];
  drawer.push(box(0,.535,.251,.663,.017,.032),box(0,.427,.253,.518,.012,.019));
  inlay.push(box(0,.486,.253,.483,.005,.010),box(0,.442,.253,.483,.005,.010));
  for(const x of [-.216,.216])inlay.push(box(x,.463,.253,.005,.046,.010));
  for(const x of [-.224,.224])drawer.push(box(x,.222,0,.021,.021,.37));
  drawer.push(box(0,.227,0,.464,.019,.371));
  for(let i=0;i<3;i++)books.push(box(-.058+i*.029,.247+i*.022,.028-i*.019,.225-i*.022,.018,.144+i*.012));
  bake('side-table-drawer-lip-and-lower-shelf',drawer,finish('#795d4b',.74),table);
  bake('side-table-warm-inlay',inlay,finish('#d1b18b',.65),table);
  bake('side-table-archival-folio-covers',books,finish('#8b8862',.88),table);
  const papers=books.map((_,i)=>box(-.058+i*.029,.249+i*.022,.031-i*.019,.207-i*.022,.009,.144+i*.012));
  bake('side-table-folio-paper-edges',papers,finish('#e1cba4',.91),table);
 }
 // A single local woven image on the original rug geometry, not a new floor
 // plane; rings and stepped motifs are made at garment-scale, not noisy speckle.
 if(rug){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=384;
  const ctx=canvas.getContext('2d');
  if(ctx){
   const center=192;ctx.translate(center,center);ctx.fillStyle='#b7b087';ctx.fillRect(-192,-192,384,384);
   function disc(r,fill){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
   disc(189,'#697a61');disc(176,'#d9c6a0');disc(170,'#7e8866');disc(153,'#b9ad80');disc(143,'#d0bd94');
   for(let n=0;n<12;n++){
    ctx.save();ctx.rotate(n*Math.PI/6);
    ctx.fillStyle=n%2?'#a06b50':'#7b865e';
    ctx.beginPath();ctx.moveTo(0,-164);ctx.lineTo(11,-156);ctx.lineTo(0,-149);ctx.lineTo(-11,-156);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#e3ccaa';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-183);ctx.lineTo(9,-180);ctx.lineTo(16,-183);ctx.stroke();
    ctx.restore();
   }
   for(let i=0;i<8;i++){
    ctx.save();ctx.rotate(i*Math.PI/4);
    ctx.fillStyle=i%2?'#a58e6c':'#8b9570';
    ctx.beginPath();ctx.moveTo(0,-119);ctx.quadraticCurveTo(30,-80,0,-51);ctx.quadraticCurveTo(-30,-80,0,-119);ctx.fill();
    ctx.strokeStyle='#dfc4a3';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-110);ctx.lineTo(0,-62);ctx.stroke();
    ctx.restore();
   }
   disc(45,'#b19b71');disc(37,'#ddd0ad');disc(24,'#918965');
   for(let y=-191;y<=191;y+=3){
    ctx.strokeStyle=y%2?'#2f38231c':'#fff8df2d';ctx.lineWidth=.60;ctx.beginPath();ctx.moveTo(-192,y);ctx.lineTo(192,y);ctx.stroke();
   }
   const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
   // Existing lighting installation runs after this helper on the same receiver.
   rug.material=new T.MeshStandardMaterial({color:'#f6ecd6',map,roughness:.94});
  }
 }
 return art;
}

// Experimental: this object itself resolves a specular ray against world geometry.
// Static triangles are world-space; avatar BVHs stay local to each animated mesh.
export function createRoomRayMirror(T, roots, avatar, renderer, {cat=null,light=null}={}){
 const N=1024,MAX=160,SIDE=6,TILE=96, nodes=[], triangles=[], uvs=[];
 if(!renderer.capabilities.isWebGL2||renderer.capabilities.maxTextureSize<N)return null;
 const excluded=new Set(),dynamic=[], tmp=new T.Vector3(), texCoord=new T.Vector2(), inv=new T.Matrix4();
 const atlasCanvas=document.createElement('canvas');atlasCanvas.width=atlasCanvas.height=SIDE*TILE;
 const brush=atlasCanvas.getContext('2d');
 const tileBySource=new Map();let mappedTriangles=0, avatarMapMeshes=0,avatarMeshes=0;
 function mapFor(mesh){
  const map=mesh.material.map,uv=mesh.geometry.attributes.uv,im=map?.image;
  if(!brush||!uv||!im||im.complete===false||!(im.width>0&&im.height>0)||
     ![T.SRGBColorSpace,'',T.NoColorSpace].includes(map.colorSpace)||map.channel!==0)return null;
  let tile=tileBySource.get(im);
  if(tile===undefined){
   if(tileBySource.size>=SIDE*SIDE)return null;
   tile=tileBySource.size;
   try{brush.drawImage(im,(tile%SIDE)*TILE,Math.floor(tile/SIDE)*TILE,TILE,TILE);}
   catch{return null;}
   tileBySource.set(im,tile);
  }
  if(map.matrixAutoUpdate)map.updateMatrix();
  const wrap=v=>v===T.RepeatWrapping?1:v===T.MirroredRepeatWrapping?2:0;
  return {map,uv,tile,flags:wrap(map.wrapS)+3*wrap(map.wrapT)+(map.flipY?9:0)+(map.colorSpace===T.SRGBColorSpace?18:0)};
 }
 const eligible=m=>m.isMesh&&!m.isInstancedMesh&&!m.isSkinnedMesh&&m.geometry?.attributes?.position&&
  !Array.isArray(m.material)&&m.material?.color&&m.material.colorWrite!==false&&m.material.visible!==false&&
  !m.material.transparent&&!m.material.alphaTest;
 function raw(mesh,matrix,actor=false){
  const g=mesh.geometry,p=g.attributes.position,i=g.index, nt=i?i.count:p.count, m=mesh.material, rgb=m.color.toArray();
  const result=[],meta=mapFor(mesh);if(meta&&actor)avatarMapMeshes++;
  for(let k=0;k+2<nt;k+=3){
   const ids=[0,1,2].map(j=>i?i.getX(k+j):k+j);
   const v=ids.map(j=>{tmp.fromBufferAttribute(p,j);if(matrix)tmp.applyMatrix4(matrix);return tmp.toArray();});
   const uv=meta?ids.flatMap(j=>texCoord.fromBufferAttribute(meta.uv,j).applyMatrix3(meta.map.matrix).toArray()).concat(meta.tile,meta.flags):null;
   if(uv)mappedTriangles++;
   const min=v[0].map((_,j)=>Math.min(v[0][j],v[1][j],v[2][j])), max=v[0].map((_,j)=>Math.max(v[0][j],v[1][j],v[2][j]));
   result.push({v,min,max,rgb,uv});
  }
  return result;
 }
 function tree(items,depth=0){
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(const p of items)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.min[k]);hi[k]=Math.max(hi[k],p.max[k]);}
  const id=nodes.length;nodes.push(null);
  if(items.length<=6||depth>=25){
   const start=triangles.length/12;
   for(const p of items){
    triangles.push(...p.v[0],p.rgb[0],...p.v[1],p.rgb[1],...p.v[2],p.rgb[2]);
    uvs.push(...(p.uv||[0,0,0,0,0,0,-1,0]));
   }
   nodes[id]=[...lo,-start-1,...hi,items.length];
  }else{
   const spread=lo.map((x,j)=>hi[j]-x),axis=spread.indexOf(Math.max(...spread));
   items.sort((a,b)=>a.min[axis]+a.max[axis]-b.min[axis]-b.max[axis]);
   const mid=items.length>>1,left=tree(items.slice(0,mid),depth+1),right=tree(items.slice(mid),depth+1);
   nodes[id]=[...lo,left,...hi,right];
  }
  return id;
 }
 function tex(values,width=N){
  const height=Math.ceil(values.length/(width*4)),data=new Float32Array(width*height*4);data.set(values);
  const t=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);t.needsUpdate=true;return t;
 }
 let nt,tt,uvsTex,atlas,move,root=-1,avatarSignature='',staticCount=0,enabled=true;
 const mesh=new T.Mesh(new T.PlaneGeometry(.64,1.72),new T.MeshBasicMaterial({color:'#b8cbc4'}));
 const actors=[avatar,...(cat?[cat]:[])],bounds=actors.map(()=>new T.Box3());
 const low=[new T.Vector3(),new T.Vector3()],high=[new T.Vector3(),new T.Vector3()];
 const sun=new T.Vector3(-.35,.8,-.44).normalize(),lightTarget=new T.Vector3(),tint=new T.Color(1,1,1);
 const roomLightStrength={value:1};
 const view=new T.Matrix4(),viewport=new T.Vector2(), normal=new T.Vector3(0,0,1);
 function makeMaterial(){
  const material=new T.ShaderMaterial({glslVersion:T.GLSL3,uniforms:{nt:{value:nt},tt:{value:tt},uvsTex:{value:uvsTex},atlas:{value:atlas},mapped:{value:1},move:{value:move},nr:{value:root},count:{value:dynamic.length},al:{value:low},ah:{value:high},ivp:{value:view},size:{value:viewport},sun:{value:sun},roomLightTint:{value:tint},roomLightStrength,paneNormal:{value:normal},mirrorOn:{value:1}},
  vertexShader:`out vec3 pane;void main(){pane=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(pane,1.);}`,
  fragmentShader:`precision highp float;
  uniform sampler2D nt,tt,uvsTex,atlas,move;uniform int nr,count,mirrorOn,mapped;
  uniform mat4 ivp;uniform vec2 size;uniform vec3 sun,paneNormal,al[2],ah[2],roomLightTint;uniform float roomLightStrength;
  in vec3 pane;out vec4 outColor;
  #define gl_FragColor outColor
  float best=100.;vec3 shade=vec3(.40,.49,.47);int iterations=0, winning=-1;vec2 bary;
  vec4 get(sampler2D t,int i){return texelFetch(t,ivec2(i%1024,i/1024),0);}
  float bb(vec3 o,vec3 inv,vec3 l,vec3 h){
   vec3 a=(l-o)*inv,b=(h-o)*inv,n=min(a,b),f=max(a,b);
   float d=max(n.x,max(n.y,n.z)),e=min(f.x,min(f.y,f.z));
   return e>=max(d,.0)&&d<best?max(d,0.):1e9;
  }
  void trace(int start,vec3 o,vec3 d,mat3 normalMap){
   vec3 inv=1./mix(d,vec3(1e-8),lessThan(abs(d),vec3(1e-8)));
   int stack[28];int top=0;stack[0]=start;
   for(int k=0;k<256;k++){
    if(top<0||iterations>=512)break;iterations++;
    int i=stack[top--];vec4 a=get(nt,i*2),b=get(nt,i*2+1);
    if(bb(o,inv,a.xyz-vec3(.00001),b.xyz+vec3(.00001))>best)continue;
    if(a.w<0.){
     int first=int(-a.w)-1;
     for(int j=0;j<6;j++){
      if(j>=int(b.w))break;
      int n=(first+j)*3;vec4 v=get(tt,n),u=get(tt,n+1),w=get(tt,n+2);
      vec3 e=u.xyz-v.xyz,f=w.xyz-v.xyz,p=cross(d,f);float det=dot(e,p);
      if(abs(det)<1e-8)continue;
      vec3 t=o-v.xyz;float a=dot(t,p)/det;if(a<0.||a>1.)continue;
      vec3 q=cross(t,e);float b=dot(d,q)/det;if(b<0.||a+b>1.)continue;
      float hit=dot(f,q)/det;if(hit<=.0002||hit>=best)continue;
      vec3 norm=normalize(normalMap*cross(e,f));if(det<0.)norm=-norm;
      best=hit;winning=first+j;bary=vec2(a,b);shade=vec3(v.w,u.w,w.w)*(mix(.51,.68,roomLightStrength)+.32*roomLightStrength*max(dot(norm,sun),0.));
     }
    }else{
     int l=int(a.w),r=int(b.w);vec4 ll=get(nt,l*2),lu=get(nt,l*2+1),rl=get(nt,r*2),ru=get(nt,r*2+1);
     float dl=bb(o,inv,ll.xyz-vec3(.00001),lu.xyz+vec3(.00001)),dr=bb(o,inv,rl.xyz-vec3(.00001),ru.xyz+vec3(.00001));
     if(top>=24)continue;
     if(dl<dr){if(dr<best)stack[++top]=r;if(dl<best)stack[++top]=l;}
     else{if(dl<best)stack[++top]=l;if(dr<best)stack[++top]=r;}
    }
   }
  }
  float wrapUv(float v,int mode){
   if(mode==1)return fract(v);
   if(mode==2)return 1.-abs(mod(v,2.)-1.);
   return clamp(v,0.,1.);
  }
  vec3 linearSwatch(vec3 c){return mix(c/12.92,pow((max(c,vec3(.04045))+.055)/1.055,vec3(2.4)),greaterThan(c,vec3(.04045)));}
  void main(){
   if(mirrorOn==1){
    vec2 xy=gl_FragCoord.xy/size*2.-1.;
    vec4 a=ivp*vec4(xy,-1.,1.), b=ivp*vec4(xy,1.,1.);
    vec3 n=normalize(paneNormal), incoming=normalize(b.xyz/b.w-a.xyz/a.w);
    vec3 d=reflect(incoming,n),o=pane+d*.0003;
    if(nr>=0)trace(nr,o,d,mat3(1.));
    vec3 invD=1./mix(d,vec3(1e-8),lessThan(abs(d),vec3(1e-8)));
    bool seesA=bb(o,invD,al[0]-vec3(.00001),ah[0]+vec3(.00001))<best;
    bool seesC=bb(o,invD,al[1]-vec3(.00001),ah[1]+vec3(.00001))<best;
    for(int i=0;i<${MAX};i++){
     if(i>=count||iterations>=512)break;int k=i*5;vec4 m=get(move,k+4);if(m.x<0.||(m.y<.5?!seesA:!seesC))continue;
     mat4 im=mat4(get(move,k),get(move,k+1),get(move,k+2),get(move,k+3));
     trace(int(m.x),(im*vec4(o,1.)).xyz,(im*vec4(d,0.)).xyz,transpose(mat3(im)));
    }
   }
   if(winning>=0&&mapped==1){
    vec4 a=get(uvsTex,winning*2),b=get(uvsTex,winning*2+1);
    if(b.z>=0.){
     vec2 uv=a.xy*(1.-bary.x-bary.y)+a.zw*bary.x+b.xy*bary.y;
     int flags=int(b.w),tile=int(b.z),ww=flags%9;
     uv=vec2(wrapUv(uv.x,ww%3),wrapUv(uv.y,ww/3));
     if(flags%18>=9)uv.y=1.-uv.y;
     vec2 grid=vec2(float(tile%6),float(tile/6));
     vec3 swatch=texture(atlas,(grid*96.+.5+uv*95.)/576.).rgb;
     shade*=flags>=18?linearSwatch(swatch):swatch;
    }
   }
   gl_FragColor=vec4(mix(shade*roomLightTint,vec3(.54,.61,.60),.055),1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});return material;
 }
 function prepare(){
  nodes.length=triangles.length=uvs.length=dynamic.length=0;
  mappedTriangles=avatarMapMeshes=0;tileBySource.clear();brush?.clearRect(0,0,atlasCanvas.width,atlasCanvas.height);
  const plain=[];roots.forEach(root=>{if(excluded.has(root))return;root.updateWorldMatrix(true,true);root.traverseVisible(m=>{if(eligible(m))for(const p of raw(m,m.matrixWorld))plain.push(p);});});
  staticCount=plain.length;root=plain.length?tree(plain):-1;
  avatarMeshes=0;
  actors.forEach((actor,group)=>actor.traverse(m=>{if(eligible(m)&&dynamic.length<MAX){
   const v=raw(m,null,group===0);if(v.length){dynamic.push({m,group,index:tree(v)});if(group===0)avatarMeshes++;}
  }}));
  avatarSignature=actors.map(o=>o.children.map(x=>x.id).join(',')).join(';');
  if(nodes.length*2>N*renderer.capabilities.maxTextureSize||triangles.length/4>N*renderer.capabilities.maxTextureSize)return false;
  nt?.dispose();tt?.dispose();move?.dispose();uvsTex?.dispose();atlas?.dispose();
  nt=tex(nodes.flat());tt=tex(triangles);uvsTex=tex(uvs);move=tex(new Float32Array(MAX*5*4));
  atlas=new T.CanvasTexture(atlasCanvas);atlas.flipY=false;atlas.generateMipmaps=false;
  atlas.minFilter=atlas.magFilter=T.LinearFilter;atlas.needsUpdate=true;
  const old=mesh.material;mesh.material=makeMaterial();old.dispose();return true;
 }
 function update(){
  if(!enabled||mesh.material.uniforms?.mirrorOn.value===0)return;
  // Shared geometry textures are built once except when the player changes outfit.
  if(avatarSignature!==actors.map(o=>o.children.map(x=>x.id).join(',')).join(';')&&!prepare()){enabled=false;return;}
  const u=mesh.material.uniforms;if(!u)return;
  if(light?.isDirectionalLight){
   light.getWorldPosition(sun).sub(light.target.getWorldPosition(lightTarget)).normalize();
   roomLightStrength.value=Math.max(.4,Math.min(1,light.intensity/2.88));
   tint.setRGB(.7+.3*light.color.r,.7+.3*light.color.g,.7+.3*light.color.b);
  }
  {
   view.multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);renderer.getDrawingBufferSize(viewport);
   normal.set(0,0,1).transformDirection(mesh.matrixWorld);
  }
  for(let i=0;i<actors.length;i++){
   bounds[i].setFromObject(actors[i]);low[i].copy(bounds[i].min);high[i].copy(bounds[i].max);
  }
  for(let i=0;i<dynamic.length;i++){
   const entry=dynamic[i],index=i*20;let vis=true;
   for(let o=entry.m;o;o=o.parent){if(!o.visible){vis=false;break;}if(o===actors[entry.group])break;}
   inv.copy(entry.m.matrixWorld).invert();move.image.data.set(inv.elements,index);move.image.data[index+16]=vis?entry.index:-1;move.image.data[index+17]=entry.group;
  }
  move.needsUpdate=true;
 }
 let camera;
 mesh.onBeforeRender=(r,s,c)=>{camera=c;update();};mesh.castShadow=false;mesh.receiveShadow=false;mesh.name='physical-full-length-test-mirror';
 if(!prepare())return null;
 return {mesh,stats:()=>({staticCount,total:triangles.length/12,branches:nodes.length,avatarMeshes,catMeshes:dynamic.length-avatarMeshes,atlasTiles:tileBySource.size,mappedTriangles,avatarMapMeshes}),
  swatches(v){mesh.material.uniforms.mapped.value=v?1:0;},enabled(v){mesh.material.uniforms.mirrorOn.value=v?1:0;},includeRoot(o,v){if(v)excluded.delete(o);else excluded.add(o);prepare();},dispose(){nt.dispose();tt.dispose();move.dispose();uvsTex.dispose();atlas.dispose();mesh.material.dispose();mesh.geometry.dispose();}};
}

// Static, bounded light transport from the room's actual arched opening.
// Rays carry only light energy: geometry, visibility and floor navigation are unchanged.
export function traceRoomDaylight(T,{scene,opening,aperture,mullions,receivers}){
 const start=performance.now(),weatherMix={value:0};
 const N=72,origin=opening.getWorldPosition(new T.Vector3());
 const source=[[.42,.65],[.36,.61],[.48,.69],[.39,.69],[.46,.60]];
 const windowZ=origin.z+.109,xy=new T.Vector3(),direction=new T.Vector3(),raycaster=new T.Raycaster(),hits=[];
 const total={primary:0,through:0,bounce:0,bounced:0};
 scene.updateMatrixWorld(true);
 const fits=(x,y)=>y>=.10&&Math.abs(x)<aperture.half&&x*x+Math.max(0,y-aperture.spring)**2<aperture.half**2;
 function transmits(x,y,z,dx,dy){
  const depth=z-windowZ,u=x-depth*dx-origin.x,v=y+depth*dy-origin.y;
  if(!fits(u,v))return 0;
  xy.set(x,y,z);
  raycaster.set(xy,direction.set(-dx,dy,-1).normalize());raycaster.near=.002;raycaster.far=Math.hypot(depth,depth*dx,depth*dy)+.018;
  hits.length=0;raycaster.intersectObjects(mullions,false,hits);
  return hits.length?0:1;
 }
 const floor=new Float32Array(N*N),bounces=[];
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const x=-3+(i+.5)*6/N,z=-2.33+(j+.5)*4.66/N;
  if(z<windowZ)continue;
  let v=0;
  for(const [dx,dy] of source){total.primary++; v+=transmits(x,.020,z,dx,dy);}
  total.through+=v;floor[i+j*N]=v/source.length;
  if(v>=3&&(i%9===4)&&(j%9===4))bounces.push([x,z,v/source.length]);
 }
 // A sparse Lambertian bounce off the directly lit floor. Each of those
 // patches contributes toward the plaster facing the room; mullions block
 // any source ray but no moving-door, player, or cloth shadow is baked in.
 function plaster(x,y,z){
  let q=0;
  for(const [sx,sz,strength] of bounces){
   const a=sx-x,b=y-.020,c=sz-z,r2=a*a+b*b+c*c+.12;
   const facing=z<-2.23?Math.max(0,c):Math.max(0,a);
   total.bounce++;
   if(facing<=0||b<=0)continue;
   q+=strength*b*facing/(r2*r2)*.40;total.bounced++;
  }
  return Math.min(1,q);
 }
 function bake(key){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=N;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(N,N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
   const at=(i+j*N)*4,x=-3+(i+.5)*6/N,y=(j+.5)*3.12/N,z=-2.33+(i+.5)*4.66/N;
   const energy=key==='floor'?floor[i+j*N]:key==='rear'?plaster(x,y,-2.23):plaster(-2.99,y,z);
   pixels.data[at]=pixels.data[at+1]=pixels.data[at+2]=Math.round(255*energy);pixels.data[at+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const tex=new T.CanvasTexture(canvas);tex.flipY=false;tex.generateMipmaps=false;
  tex.minFilter=tex.magFilter=T.LinearFilter;return tex;
 }
 const maps={floor:bake('floor'),rear:bake('rear'),side:bake('side')};
 for(const [mesh,key] of receivers){
  const material=mesh.material;
  const uv=key==='floor'?'vec2((windowWorld.x+3.)/6.,(windowWorld.z+2.33)/4.66)':
   key==='rear'?'vec2((windowWorld.x+3.)/6.,windowWorld.y/3.12)':'vec2((windowWorld.z+2.33)/4.66,windowWorld.y/3.12)';
  const original=material.onBeforeCompile;
  material.onBeforeCompile=function(shader,renderer){
   original.call(this,shader,renderer);shader.uniforms.roomWindowLight={value:maps[key]};shader.uniforms.roomRainMix=weatherMix;
   shader.vertexShader='varying vec3 windowWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',
    '#include <project_vertex>\nwindowWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='uniform sampler2D roomWindowLight; uniform float roomRainMix; varying vec3 windowWorld;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',
    `float daylight=texture2D(roomWindowLight,${uv}).r;\n outgoingLight *= mix(vec3(.85,.86,.88),vec3(.91,.94,1.0),roomRainMix)+daylight*mix(vec3(${key==='floor'?'.47,.36,.17':'.46,.29,.13'}),vec3(.025,.035,.052),roomRainMix);\n#include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>`town-room-transport-v1-${key}`;material.needsUpdate=true;
 }
 return { ...total, bounceSources:bounces.length,ms:performance.now()-start,setRain:rain=>{weatherMix.value=rain?1:0;} };
}
