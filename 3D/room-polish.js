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
    spans.forEach((span,index)=>{
      const g=new T.BoxGeometry(p.width,1,span.max-span.min),wall=new T.Mesh(g,source.material);
      wall.name=name+'-performance-extension'+(rear?(index?'':'-rear-cap'):'');wall.position.copy(source.position);wall.position.z=(span.min+span.max)/2;
      if(rear){const uv=g.attributes.uv,pos=g.attributes.position;for(let i=0;i<8;i++){const z=pos.getZ(i)+wall.position.z;uv.setX(i,i<4?(source.position.z+p.depth/2-z)/p.depth:(z-source.position.z+p.depth/2)/p.depth);}}
      wall.receiveShadow=source.receiveShadow;wall.castShadow=false;wall.raycast=()=>{};wall.renderOrder=source.renderOrder;architecture.add(wall);
      extensions.push({wall,base:span.base,bottom:source.position.y-p.height/2,originalHeight:p.height});
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
 const p=source.geometry.parameters,minZ=-2.35,maxZ=-1.15,top=3.115,base=source.position.y+p.height/2;
 source.userData.permanentRearSegment={minZ,maxZ,top};
 const group=new T.Group();group.name='west-wall-clock-nook';scene.add(group);
 const geo=new T.BoxGeometry(p.width,top-base,maxZ-minZ),pos=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<pos.count;i++){const face=Math.floor(i/4),z=pos.getZ(i)+(minZ+maxZ)/2;if([0,1,4,5].includes(face))uv.setY(i,(base+pos.getY(i)+(top-base)/2-(source.position.y-p.height/2))/p.height);if(face===0)uv.setX(i,(source.position.z+p.depth/2-z)/p.depth);if(face===1)uv.setX(i,(z-(source.position.z-p.depth/2))/p.depth);}
 const wall=new T.Mesh(geo,source.material);wall.name='west-rear-permanent-high-wall';wall.position.set(source.position.x,(base+top)/2,(minZ+maxZ)/2);wall.castShadow=false;wall.receiveShadow=source.receiveShadow;wall.raycast=()=>{};group.add(wall);
 const clock=new T.Group();clock.name='west-dark-wood-pendulum-clock';clock.position.set(-2.9915,2.32,-1.73);clock.rotation.y=Math.PI/2;group.add(clock);
 const wood=new T.MeshStandardMaterial({color:'#503525',roughness:.7}),edge=new T.MeshStandardMaterial({color:'#755039',roughness:.66}),ivory=new T.MeshStandardMaterial({color:'#efe2bc',roughness:.82}),brass=new T.MeshStandardMaterial({color:'#b7a16c',roughness:.44,metalness:.35}),ink=new T.MeshStandardMaterial({color:'#302b24',roughness:.8});
 function add(g,m,x,y,z,name){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=false;o.receiveShadow=true;o.raycast=()=>{};clock.add(o);return o;}
 function box(w,h,d,x,y,z,m,name){return add(new T.BoxGeometry(w,h,d),m,x,y,z,name);}
 box(.39,.66,.105,0,0,.054,wood,'clock-walnut-case');box(.44,.045,.125,0,.335,.064,edge,'clock-crown');box(.42,.04,.125,0,-.335,.064,edge,'clock-base');
 box(.29,.27,.006,0,-.157,.11,ink,'clock-pendulum-recess');box(.014,.22,.015,0,-.128,.125,brass,'clock-pendulum-stem');add(new T.SphereGeometry(.058,20,12),brass,0,-.229,.126,'clock-pendulum-bob').scale.z=.25;
 add(new T.CircleGeometry(.143,48),brass,0,.145,.112,'clock-dial-rim');add(new T.CircleGeometry(.130,48),ivory,0,.145,.114,'clock-ivory-dial');
 for(let n=0;n<12;n++){const a=n*Math.PI/6,m=box(.008,n%3===0?.023:.014,.002,Math.sin(a)*.111,.145+Math.cos(a)*.111,.117,ink,'clock-hour-marker-'+n);m.rotation.z=-a;}
 const hour=box(.012,.072,.003,-.016,.169,.12,ink,'clock-hour-hand');hour.rotation.z=.65;const minute=box(.007,.099,.003,.030,.184,.122,ink,'clock-minute-hand');minute.rotation.z=-.65;
 add(new T.SphereGeometry(.011,12,8),brass,0,.145,.125,'clock-spindle');
 group.userData.wallSegment={minZ,maxZ,base,top};clock.userData.wallBackX=-2.990;clock.userData.permanent=true;
 return {group,clock,wall};
}
