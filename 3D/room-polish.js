/** Temporary, reversible performance-only polish. No camera/outdoor changes. */
export function decoratePerformanceRoom(T, scene) {
  const group = new T.Group(); group.name = 'performance-room-polish'; scene.add(group);
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
    for(const x of [b.min.x,b.max.x]) {const m=new T.Mesh(new T.SphereGeometry(.029,16,8),brass);m.scale.set(1.15,1,1);m.position.set(x,c.y,c.z);group.add(m);}
    for(const side of [0,1])for(let k=0;k<6;k++){const x=side?b.max.x-.065-k*.063:b.min.x+.065+k*.063;
      const m=new T.Mesh(new T.TorusGeometry(.023,.0045,6,16),brass);m.rotation.y=Math.PI/2;m.position.set(x,c.y-.012,c.z);group.add(m);}
  }
  // Deliberately low-energy close fill preserves the established sage/ivory palette.
  const warm=new T.PointLight(0xffd6a0,.22,4.4,2);warm.name='window-warm-fill';warm.position.set(-1.25,2.55,-1.79);group.add(warm);
  return function dispose(){for(const[o,old,tmp]of replaced){o.material=old;for(const m of(Array.isArray(tmp)?tmp:[tmp]))m.dispose();}
    group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();}});scene.remove(group);brass.dispose();};
}
