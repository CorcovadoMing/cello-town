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

/** Experimental: an old practice score, kept in the same room through every view.
 * Original abstract notation only: no quoted music, words, lyrics or audio.
 */
export function installQuietScore(T,scene){
 const group=new T.Group();group.name='quiet-inherited-cello-score';scene.add(group);
 // A low reading rest sits on the existing window ledge, beside the opening.
 group.position.set(-.74,1.188,-1.915);group.rotation.y=-.08;
 const paper=new T.MeshStandardMaterial({color:'#ede1ba',roughness:.96,side:T.DoubleSide});
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;const g=canvas.getContext('2d');
 g.fillStyle='#eadfbc';g.fillRect(0,0,768,512);
 let seed=1937;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Slightly unequal age marks, linen grain, an old fold and pale pencil traces.
 for(let i=0;i<2600;i++){g.fillStyle=i%2?'rgba(112,88,55,.035)':'rgba(255,252,225,.11)';g.fillRect(random()*768,random()*512,1+random()*3,1);}
 g.fillStyle='rgba(141,112,72,.15)';g.fillRect(382,0,4,512);
 for(let page=0;page<2;page++)for(let system=0;system<4;system++){
  const x=page*384+34,y=77+system*101;g.strokeStyle='rgba(99,90,68,.43)';g.lineWidth=1;
  for(let line=0;line<5;line++){g.beginPath();g.moveTo(x,y+line*8);g.lineTo(x+307,y+line*8);g.stroke();}
  for(let n=0;n<6;n++){const nx=x+26+n*48,ny=y+8*(1+((n*3+system+page)%4));g.fillStyle='rgba(72,72,55,.66)';g.beginPath();g.ellipse(nx,ny,5,3,-.24,0,Math.PI*2);g.fill();g.strokeStyle='rgba(72,72,55,.66)';g.beginPath();g.moveTo(nx+4,ny);g.lineTo(nx+4,ny-25);g.stroke();}
  // Two hands over time: faded brown phrasing, lighter graphite rehearsal marks.
  g.strokeStyle=system%2?'rgba(94,103,99,.44)':'rgba(143,101,66,.32)';g.lineWidth=1.8;g.beginPath();g.moveTo(x+23,y-13);g.quadraticCurveTo(x+120,y-36,x+215,y-13);g.stroke();
  if(system===1||system===3){g.beginPath();g.ellipse(x+121,y+19,13,20,-.15,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(x+262,y+56);g.lineTo(x+270,y+61);g.lineTo(x+284,y+48);g.stroke();}
 }
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;paper.map=tex;
 const rest=new T.Mesh(new T.BoxGeometry(.43,.018,.13),new T.MeshStandardMaterial({color:'#b29c76',roughness:.87}));rest.name='score-low-wood-rest';rest.position.set(0,.009,0);group.add(rest);
 const pages=new T.Group();pages.position.set(0,.025,.052);pages.rotation.x=-.55;group.add(pages);
 for(const side of[-1,1]){
  const geom=new T.PlaneGeometry(.215,.285,6,6),uv=geom.attributes.uv,pos=geom.attributes.position;
  for(let i=0;i<uv.count;i++){uv.setX(i,(uv.getX(i)+(side>0?1:0))*.5);const x=pos.getX(i);pos.setZ(i,.005*Math.sin((x/.215+.5)*Math.PI));}geom.computeVertexNormals();
  const page=new T.Mesh(geom,paper);page.name=side<0?'score-faded-phrases':'score-pencil-revisions';page.position.set(side*.108,.1425,0);page.rotation.y=side*.055;pages.add(page);
 }
 const ribbon=new T.Mesh(new T.BoxGeometry(.012,.102,.002),new T.MeshStandardMaterial({color:'#9f8a71',roughness:1}));ribbon.name='score-linen-bookmark';ribbon.position.set(.03,.014,.095);ribbon.rotation.x=Math.PI/2;group.add(ribbon);
 group.traverse(o=>{o.raycast=()=>{};if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 group.userData.originalNotation=true;group.userData.permanent=true;return group;
}
